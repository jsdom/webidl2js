"use strict";

const conversions = require("webidl-conversions");
const querystring = require("querystring");

class URLSearchParamsImpl {
  constructor(init) {
    if (init instanceof URLSearchParamsImpl) {
      this._list = init._list.slice();
    } else {
      init = conversions.USVString(init);
      if (init[0] === "?") { init = init.slice(1); }

      this._list = [];
      const parsed = querystring.parse(init);
      for (let name in parsed) {
        if (Array.isArray(parsed[name])) {
          for (let value of parsed[name]) {
            this._list.push([name, value]);
          }
        } else {
          this._list.push([name, parsed[name]]);
        }
      }
    }
  }

  append(name, value) {
    this._list.push([name, value]);
  }

  delete(name) {
    let i = 0;
    while (i < this._list.length) {
      if (this._list[i][0] === name) {
        this._list.splice(i, 1);
      } else {
        i++;
      }
    }
  }

  get(name) {
    for (let pair of this._list) {
      if (pair[0] === name) {
        return pair[1];
      }
    }

    return null;
  }

  getAll(name) {
    const output = [];
    for (let pair of this._list) {
      if (pair[0] === name) {
        output.push(pair[1]);
      }
    }
    return output;
  }

  has(name) {
    return this._list.some(pair => pair[0] === name);
  }

  set(name, value) {
    this.delete(name);
    this.append(name, value);
  }
}

module.exports = {
  implementation: URLSearchParamsImpl
};
