"use strict";

const { readFileSync, promises: fs } = require("fs");
const path = require("path");
const vm = require("vm");

process.on("unhandledRejection", e => {
  throw e;
});

function createSandbox(setupScripts) {
  const sandbox = vm.createContext();
  sandbox.self = vm.runInContext("this", sandbox);
  for (const script of setupScripts) {
    script.runInContext(sandbox);
  }
  sandbox.require = p => {
    if (p[0] !== ".") {
      // eslint-disable-next-line global-require
      return require(p);
    }

    const resolved = path.resolve(__dirname, "../output", p);
    const src = readFileSync(resolved, { encoding: "utf8" });
    return sandbox.self.eval(
      `(() => {
        let exports = {};
        const module = { exports };
        (() => {${src}})();
        return module.exports;
      })();`
    );
  };
  return sandbox;
}

async function testInterface(name, setupScripts) {
  const idlToTest = await fs.readFile(
    path.join(__dirname, `../cases/${name}.webidl`),
    {
      encoding: "utf8"
    }
  );

  const sandbox = createSandbox(setupScripts);
  vm.runInContext(
    `
    Object.defineProperty(self, '${name}', {
    value: require("./${name}.js").interface,
    enumerable: false,
    writable:true,
    configurable:true
  })`,
    sandbox
  );

  const prom = new Promise((resolve, reject) => {
    const errors = [];

    sandbox.add_result_callback(test => {
      if (test.status === 1) {
        errors.push(
          `Failed in "${test.name}": \n${test.message}\n\n${test.stack}`
        );
      } else if (test.status === 2) {
        errors.push(
          `Timeout in "${test.name}": \n${test.message}\n\n${test.stack}`
        );
      } else if (test.status === 3) {
        errors.push(
          `Uncompleted test "${test.name}": \n${test.message}\n\n${test.stack}`
        );
      }
    });

    sandbox.add_completion_callback((tests, harnessStatus) => {
      if (harnessStatus.status === 2) {
        errors.push(new Error(`test harness should not timeout`));
      }

      if (errors.length === 1) {
        reject(new Error(errors[0]));
      } else if (errors.length) {
        reject(
          new Error(`${errors.length} errors in test:\n\n${errors.join("\n")}`)
        );
      } else {
        resolve();
      }
    });
  });

  const idlArray = new sandbox.IdlArray();
  idlArray.add_idls(idlToTest);

  idlArray.test();
  await prom;
}

describe("IDL Harness", () => {
  let setupScripts;

  beforeAll(async () => {
    const files = await Promise.all(
      ["testharness.js", "webidl2.js", "idlharness.js"].map(async p => ({
        path: path.join(__dirname, "/vendor/", p),
        contents: await fs.readFile(path.join(__dirname, "/vendor/", p), {
          encoding: "utf8"
        })
      }))
    );
    setupScripts = files.map(
      file => new vm.Script(file.contents, { filename: file.path })
    );
  });

  test("URL.js", async () => {
    await testInterface("URL", setupScripts);
  });
});
