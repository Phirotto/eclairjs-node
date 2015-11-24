/*
 * Copyright 2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var protocol = require('../kernel.js');
var Utils = require('../utils.js');

var StructType = require('./types/StructType.js');

/**
 * @constructor
 * @classdesc Represents one row of output from a relational operator. Allows both generic access by ordinal, which will incur boxing overhead for primitives, as well as native primitive access.
 * It is invalid to use the native primitive interface to retrieve a value that is null, instead a user must check isNullAt before attempting to retrieve a value that might be null.
 * To create a new Row, use RowFactory.create()
 *
 */
function Row(kernelP, refIdP) {
  this.kernelP = kernelP;
  this.refIdP = refIdP;
}

/**
 * Returns true if there are any NULL values in this row.
 * @returns {boolean}
 */
Row.prototype.anyNull = function() {
  var self = this;

  return new Promise(function(resolve, reject) {

    function _resolve(any) {
      // parse stringified result here
      resolve(JSON.parse(any));
    }

    Promise.all([self.refIdP, self.kernelP]).then(function(values) {
      var refId = values[0];
      var kernel = values[1];

      var templateStr = '{{inRefId}}.anyNull();';
      var code = Utils.processTemplate(templateStr, {inRefId: refId});
      protocol.verifyResult(kernel.execute({code: code}), _resolve, reject);
    }).catch(reject);
  })
};

/**
 * Returns the value at position index.
 * @param index
 * @returns {object}
 * @throws {NotImplementedException} - This method is currently not implemented
 */
Row.prototype.apply = function(index) {

  throw {name:'NotImplementedException', message:'The method is currently not implemented'};

  var self = this;

  return new Promise(function(resolve, reject) {

    function _resolve(val) {
      // parse stringified value here
      resolve(JSON.parse(val));
    }

    Promise.all([self.refIdP, self.kernelP]).then(function(values) {
      var refId = values[0];
      var kernel = values[1];

      var templateStr = '{{inRefId}}.apply({{index}});';
      var code = Utils.processTemplate(templateStr, {inRefId: refId, index: index});
      protocol.verifyResult(kernel.execute({code: code}), _resolve, reject);
    }).catch(reject);
  })
};

/**
 * Make a copy of the current Row object
 * @returns {Row}
 * @throws {NotImplementedException} - This method is currently not implemented
 */
Row.prototype.copy = function() {

  throw {name:'NotImplementedException', message:'The method is currently not implemented'};

  var refId = protocol.genVariable('row');
  var self = this;

  return new Promise(function(resolve, reject) {
    Promise.all([self.refIdP, self.kernelP]).then(function(values) {
      var inRefId = values[0];
      var kernel = values[1];

      var templateStr = 'var {{refId}} = {{inRefId}}.copy();';
      var code = Utils.processTemplate(templateStr, {refId: refId, inRefId: inRefId});
      protocol.verifyAssign(kernel.execute({code: code, silent: false}), resolve, reject);
    }).catch(reject);
  });
};

/**
 * compares object o to this Row object
 * @param {object}o
 * @returns {boolean}
 * @throws {NotImplementedException} - This method is currently not implemented
 */
Row.prototype.equals = function(o) {

  throw {name:'NotImplementedException', message:'The method is currently not implemented'};

  var self = this;

  return new Promise(function(resolve, reject) {

    function _resolve(eql) {
      // parse stringified result here
      resolve(JSON.parse(eql));
    }

    Promise.all([self.refIdP, self.kernelP]).then(function(values) {
      var refId = values[0];
      var kernel = values[1];

      var templateStr = '{{inRefId}}.equals({{obj}});';
      var code = Utils.processTemplate(templateStr, {inRefId: refId, obj:JSON.stringify(o)});
      protocol.verifyResult(kernel.execute({code: code}), _resolve, reject);
    }).catch(reject);
  })
};

/**
 * Returns the index of a given field name.
 * @param {string} name
 * @returns {integer}
 */
Row.prototype.fieldIndex = function(name) {
  var self = this;

  return new Promise(function(resolve, reject) {

    function _resolve(index) {
      // parse stringified result here
      resolve(parseInt(index));
    }

    Promise.all([self.refIdP, self.kernelP]).then(function(values) {
      var refId = values[0];
      var kernel = values[1];

      var templateStr = '{{inRefId}}.fieldIndex("{{name}}");';
      var code = Utils.processTemplate(templateStr, {inRefId: refId, name: name});
      protocol.verifyResult(kernel.execute({code: code}), _resolve, reject);
    }).catch(reject);
  })
};

/**
 * Returns the value at position index.
 * @param {integer} index
 * @returns {object}
 */
Row.prototype.get = function(index) {
  var self = this;

  return new Promise(function(resolve, reject) {
    function _resolve(val) {
      // have to parse if number 
      resolve(isFinite(val) ? new Number(val).valueOf() : val);
    }

    Promise.all([self.refIdP, self.kernelP]).then(function(values) {
      var refId = values[0];
      var kernel = values[1];

      var templateStr = '{{inRefId}}.get({{index}});';
      var code = Utils.processTemplate(templateStr, {inRefId: refId, index: index});
      protocol.verifyResult(kernel.execute({code: code}), _resolve, reject);
    }).catch(reject);
  })
};

/**
 * Returns the value at position index as a primitive boolean.
 * @param {integer} index
 * @returns {boolean}
 */
Row.prototype.getBoolean = function(index) {
  var self = this;

  return new Promise(function(resolve, reject) {

    function _resolve(val) {
      // parse stringified value here so boolean is returned
      resolve(JSON.parse(val));
    }

    Promise.all([self.refIdP, self.kernelP]).then(function(values) {
      var refId = values[0];
      var kernel = values[1];

      var templateStr = '{{inRefId}}.getBoolean({{index}});';
      var code = Utils.processTemplate(templateStr, {inRefId: refId, index: index});
      protocol.verifyResult(kernel.execute({code: code}), _resolve, reject);
    }).catch(reject);
  })
};

/**
 * Returns the value at position idex as a primitive byte.
 * @param {integer} index
 * @returns {byte}
 */
Row.prototype.getByte = function(index) {
  var self = this;

  return new Promise(function(resolve, reject) {
    function _resolve(val) {
      resolve(val.charCodeAt(0));
    }

    Promise.all([self.refIdP, self.kernelP]).then(function(values) {
      var refId = values[0];
      var kernel = values[1];

      var templateStr = '{{inRefId}}.getByte({{index}});';
      var code = Utils.processTemplate(templateStr, {inRefId: refId, index: index});
      protocol.verifyResult(kernel.execute({code: code}), _resolve, reject);
    }).catch(reject);
  });
};

/**
 * Returns the value at position index of type as Date.
 * @param {integer} index
 * @returns {Date}
 * @throws {NotImplementedException} - This method is currently not implemented
 */
Row.prototype.getDate = function(index) {

  throw {name:'NotImplementedException', message:'The method is currently not implemented'};

  var self = this;

  return new Promise(function(resolve, reject) {

    function _resolve(val) {
      // parse stringified date here and return as date
      //console.log('date: ',new Date(val));
      //console.log('typeof date: ',typeof val);
      resolve(JSON.parse(val));
    }

    Promise.all([self.refIdP, self.kernelP]).then(function(values) {
      var refId = values[0];
      var kernel = values[1];

      var templateStr = '{{inRefId}}.getDate({{index}});';
      var code = Utils.processTemplate(templateStr, {inRefId: refId, index: index});
      protocol.verifyResult(kernel.execute({code: code}), _resolve, reject);
    }).catch(reject);
  })
};

/**
 * Returns the value at position index of type as decimal.
 * @param {integer} index
 * @returns {decimal}
 * @throws {NotImplementedException} - This method is currently not implemented
 */
Row.prototype.getDecimal = function(index) {

  throw {name:'NotImplementedException', message:'The method is currently not implemented'};

  var self = this;

  return new Promise(function(resolve, reject) {
    function _resolve(val) {
      // have to parse as float
      resolve(parseFloat(val));
    }

    Promise.all([self.refIdP, self.kernelP]).then(function(values) {
      var refId = values[0];
      var kernel = values[1];

      var templateStr = '{{inRefId}}.getDecimal({{index}});';
      var code = Utils.processTemplate(templateStr, {inRefId: refId, index: index});
      protocol.verifyResult(kernel.execute({code: code}), _resolve, reject);
    }).catch(reject);
  })
};

/**
 * Returns the value at position index of type as double.
 * @param {integer} index
 * @returns {double}
 */
Row.prototype.getDouble = function(index) {
  var self = this;

  return new Promise(function(resolve, reject) {
    function _resolve(val) {
      // have to parse as float
      resolve(parseFloat(val));
    }

    Promise.all([self.refIdP, self.kernelP]).then(function(values) {
      var refId = values[0];
      var kernel = values[1];

      var templateStr = '{{inRefId}}.getDouble({{index}});';
      var code = Utils.processTemplate(templateStr, {inRefId: refId, index: index});
      protocol.verifyResult(kernel.execute({code: code}), _resolve, reject);
    }).catch(reject);
  })
};

/**
 * Returns the value at position index of type as float.
 * @param {integer} index
 * @returns {float}
 * @throws {NotImplementedException} - This method is currently not implemented
 */
Row.prototype.getFloat = function(index) {

  throw {name:'NotImplementedException', message:'The method is currently not implemented'};

  var self = this;

  return new Promise(function(resolve, reject) {

    function _resolve(val) {
      // have to parse as float
      resolve(parseFloat(val));
    } 

    Promise.all([self.refIdP, self.kernelP]).then(function(values) {
      var refId = values[0];
      var kernel = values[1];
 
      var templateStr = '{{inRefId}}.getFloat({{index}});';
      var code = Utils.processTemplate(templateStr, {inRefId: refId, index: index});
      protocol.verifyResult(kernel.execute({code: code}), _resolve, reject);
    }).catch(reject);
  })
};

/**
 * Returns the value at position index of type as integer.
 * @param {integer} index
 * @returns {integer}
 */
Row.prototype.getInt = function(index) {
  var self = this;

  return new Promise(function(resolve, reject) {
    function _resolve(val) {
      // have to parse as int 
      resolve(parseInt(val));
    } 

    Promise.all([self.refIdP, self.kernelP]).then(function(values) {
      var refId = values[0];
      var kernel = values[1];
 
      var templateStr = '{{inRefId}}.getInt({{index}});';
      var code = Utils.processTemplate(templateStr, {inRefId: refId, index: index});
      protocol.verifyResult(kernel.execute({code: code}), _resolve, reject);
    }).catch(reject);
  })
};

/**
 * Returns the value at position index of type as long.
 * @param {integer} index
 * @returns {long}
 * @throws {NotImplementedException} - This method is currently not implemented
 */
Row.prototype.getLong = function(index) {

  throw {name:'NotImplementedException', message:'The method is currently not implemented'};

  var self = this;

  return new Promise(function(resolve, reject) {
    function _resolve(val) {
      // have to parse as int
      resolve(parseInt(val));
    }

    Promise.all([self.refIdP, self.kernelP]).then(function(values) {
      var refId = values[0];
      var kernel = values[1];
 
      var templateStr = '{{inRefId}}.getLong({{index}});';
      var code = Utils.processTemplate(templateStr, {inRefId: refId, index: index});
      protocol.verifyResult(kernel.execute({code: code}), _resolve, reject);
    }).catch(reject);
  })
};

/**
 * Returns the value at position index of type as short.
 * @param {integer} index
 * @returns {short}
 * @throws {NotImplementedException} - This method is currently not implemented
 */
Row.prototype.getShort = function(index) {

  throw {name:'NotImplementedException', message:'The method is currently not implemented'};

  var self = this;

  return new Promise(function(resolve, reject) {

    function _resolve(val) {
      // have to parse as int
      resolve(parseInt(val));
    }

    Promise.all([self.refIdP, self.kernelP]).then(function(values) {
      var refId = values[0];
      var kernel = values[1];
 
      var templateStr = '{{inRefId}}.getShort({{index}});';
      var code = Utils.processTemplate(templateStr, {inRefId: refId, index: index});
      protocol.verifyResult(kernel.execute({code: code}), _resolve, reject);
    }).catch(reject);
  })
};



/**
 * Returns the value at position index of type as String.
 * @param {integer} index
 * @returns {String}
 */
Row.prototype.getString = function(index) {
  var self = this;

  return new Promise(function(resolve, reject) {
    Promise.all([self.refIdP, self.kernelP]).then(function(values) {
      var refId = values[0];
      var kernel = values[1];

      var templateStr = '{{inRefId}}.getString({{index}});';
      var code = Utils.processTemplate(templateStr, {inRefId: refId, index: index});
      protocol.verifyResult(kernel.execute({code: code}), resolve, reject);
    }).catch(reject);
  });
};

/**
 * Returns the value at position index of  struct type as an Row object.
 * @param {integer} index
 * @returns {String}
 * @throws {NotImplementedException} - This method is currently not implemented
 */
Row.prototype.getStruct = function(index) {

  throw {name:'NotImplementedException', message:'The method is currently not implemented'};

  var self = this;

  return new Promise(function(resolve, reject) {
    Promise.all([self.refIdP, self.kernelP]).then(function(values) {
      var refId = values[0];
      var kernel = values[1];

      var templateStr = '{{inRefId}}.getStruct({{index}});';
      var code = Utils.processTemplate(templateStr, {inRefId: refId, index: index});
      protocol.verifyResult(kernel.execute({code: code}), resolve, reject);
    }).catch(reject);
  });
};

/**
 * Returns the value at position index of date type as Date.
 * @param {integer} index
 * @returns {Date}
 * @throws {NotImplementedException} - This method is currently not implemented
 */
Row.prototype.getTimestamp = function(index) {

  throw {name:'NotImplementedException', message:'The method is currently not implemented'};

  var self = this;

  return new Promise(function(resolve, reject) {

    function _resolve(val) {
      // parse stringified date here and return as date
      resolve(new Date(JSON.parse(val)));
    }

    Promise.all([self.refIdP, self.kernelP]).then(function(values) {
      var refId = values[0];
      var kernel = values[1];

      var templateStr = '{{inRefId}}.getTimestamp({{index}});';
      var code = Utils.processTemplate(templateStr, {inRefId: refId, index: index});
      protocol.verifyResult(kernel.execute({code: code}), _resolve, reject);
    }).catch(reject);
  })
};

/**
 * Returns hash code
 * @returns {int}
 * @throws {NotImplementedException} - This method is currently not implemented
 */
Row.prototype.hashCode = function() {

  throw {name:'NotImplementedException', message:'The method is currently not implemented'};

  var self = this;

  return new Promise(function(resolve, reject) {

    function _resolve(val) {
      // have to parse as int
      resolve(parseInt(val));
    }

    Promise.all([self.refIdP, self.kernelP]).then(function(values) {
      var refId = values[0];
      var kernel = values[1];

      var templateStr = '{{inRefId}}.hashCode();';
      var code = Utils.processTemplate(templateStr, {inRefId: refId, index: index});
      protocol.verifyResult(kernel.execute({code: code}), _resolve, reject);
    }).catch(reject);
  })
}

/**
 * Checks whether the value at position index is null.
 * @param {integer} index
 * @returns {boolean}
 */
Row.prototype.isNullAt = function(index) {
  var self = this;

  return new Promise(function(resolve, reject) {

    function _resolve(any) {
      // parse stringified result here
      resolve(JSON.parse(any));
    }

    Promise.all([self.refIdP, self.kernelP]).then(function(values) {
      var refId = values[0];
      var kernel = values[1];

      var templateStr = '{{inRefId}}.isNullAt({{index}});';
      var code = Utils.processTemplate(templateStr, {inRefId: refId, index: index});
      protocol.verifyResult(kernel.execute({code: code}), _resolve, reject);
    }).catch(reject);
  })
}

/**
 * Number of elements in the Row.
 * @returns {integer}
 */
Row.prototype.length = function() {
var self = this;

  return new Promise(function(resolve, reject) {

    function _resolve(length) {
      resolve(parseInt(length));
    }

    Promise.all([self.refIdP, self.kernelP]).then(function(values) {
      var refId = values[0];
      var kernel = values[1];

      var templateStr = '{{inRefId}}.length();';
      var code = Utils.processTemplate(templateStr, {inRefId: refId});
      protocol.verifyResult(kernel.execute({code: code}), _resolve, reject);
    }).catch(reject);
  })
};

/**
 * Displays all elements of this traversable or iterator in a string using start, end, and separator strings.
 * @param {string} Optional separator
 * @param {string} Optional start
 * @param {string} Required end, if start specified
 * @returns {string}
 */
Row.prototype.mkString = function() {
  var args = Array.prototype.slice.call(arguments);
  var self = this;

  return new Promise(function(resolve, reject) {
    Promise.all([self.refIdP, self.kernelP]).then(function(values) {
      var refId = values[0];
      var kernel = values[1];

      var templateStr = "";
      if (args.length == 3) {
        templateStr = '{{inRefId}}.mkString("{{arg1}}", "{{arg2}}", "{{arg3}}");';
      } else if (args.length == 1) {
        templateStr = '{{inRefId}}.mkString("{{arg1}}");';
      } else {
        templateStr = '{{inRefId}}.mkString();';
      }

      var code = Utils.processTemplate(templateStr, {inRefId: refId, arg1: args[0], arg2: args[1], arg3: args[2]});
      protocol.verifyResult(kernel.execute({code: code}), resolve, reject);
    }).catch(reject);
  })
};

/**
 * Schema for the row.
 * @returns {StructType}
 * @throws {NotImplementedException} - This method is currently not implemented
 */
Row.prototype.schema = function() {

  throw {name:'NotImplementedException', message:'The method is currently not implemented'};

  var refId = protocol.genVariable('structType');
  var self = this;

  return new StructType(this.kernelP, new Promise(function(resolve, reject) {
    Promise.all([self.kernelP, self.refIdP]).then(function(values) {
      var kernel = values[0];
      var inRefId = values[1];

      var templateStr = 'var {{refId}} = {{inRefId}}.schema();';
      var code = Utils.processTemplate(templateStr, {refId: refId, inRefId: inRefId});

      protocol.verifyAssign(kernel.execute({code: code, silent: false}),
        resolve,
        reject,
        refId);
    }).catch(reject);
  }));
};

/**
 * Number of elements in the Row.
 * @returns {integer}
 */
Row.prototype.size = function() {
  var self = this;

  return new Promise(function(resolve, reject) {

    function _resolve(length) {
      resolve(parseInt(length));
    }

    Promise.all([self.refIdP, self.kernelP]).then(function(values) {
      var refId = values[0];
      var kernel = values[1];

      var templateStr = '{{inRefId}}.size();';
      var code = Utils.processTemplate(templateStr, {inRefId: refId});
      protocol.verifyResult(kernel.execute({code: code}), _resolve, reject);
    }).catch(reject);
  })
};

module.exports = Row;