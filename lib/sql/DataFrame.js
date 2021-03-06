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

var Utils = require('../utils.js');

var RDD = require('../rdd/RDD.js');
var Column = require('./Column.js');

function _resolveRows(result, resolve, reject) {
  try {
    var res = JSON.parse(result);

    var RowFactory = require('./RowFactory')(this.kernelP);

    var rows = [];

    if (Array.isArray(res)) {
      res.forEach(function(rowData) {
        console.log("rd",JSON.stringify(rowData))
        rows.push(RowFactory.createLocal(rowData.values, rowData.schema))
      });
    }

    resolve(rows);
  } catch (e) {
    var err = new Error("Parse Error: "+ e.message);
    reject(err);
  }
}
/**
 * @constructor
 * @memberof module:eclairjs/sql
 * @classdesc A distributed collection of data organized into named columns. A DataFrame is equivalent to a relational table in Spark SQL.
 * @example
 * var people = sqlContext.read.parquet("...")
 * @example
 * // Once created, it can be manipulated using the various domain-specific-language (DSL) functions defined in:
 * // DataFrame (this class), Column, and functions.
 * // To select a column from the data frame:
 * var ageCol = people("age")
 */
function DataFrame(kernelP, refIdP) {
  this.kernelP = kernelP;
  this.refIdP = refIdP;
}

/**
 * aggregates on the entire DataFrame without groups.
 * @example
 * // df.agg(...) is a shorthand for df.groupBy().agg(...)
 * var map = {};
 * map["age"] = "max";
 * map["salary"] = "avg";
 * df.agg(map)
 * df.groupBy().agg(map)
 * @param {hashMap} - hashMap<String,String> exprs
 * @returns {module:eclairjs/sql.DataFrame}
 */
DataFrame.prototype.agg = function(hashMap) {
  var args = {
    target: this,
    method: 'agg',
    args: [
      {value: hashMap, type: 'map'}
    ],
    returnType: DataFrame
  };

  return Utils.generate(args);
};

/**
 * Returns a new DataFrame with an alias set.
 * @param {string} alias
 * @returns {module:eclairjs/sql.DataFrame}
 */
DataFrame.prototype.as = function(alias) {
  var args = {
    target: this,
    method: 'as',
    args: [
      {value: alias, type: 'string'}
    ],
    returnType: DataFrame
  };

  return Utils.generate(args);
};

/**
 * Selects column based on the column name and return it as a Column.
 * Note that the column name can also reference to a nested column like a.b.
 * @param {string} colName
 * @returns {module:eclairjs/sql.Column}
 */
DataFrame.prototype.apply = function(colName) {
  var args = {
    target: this,
    method: 'apply',
    args: [
      {value: colName, type: 'string'}
    ],
    returnType: Column
  };

  return Utils.generate(args);
};

/**
 * Persist this DataFrame with the default storage level (`MEMORY_ONLY`).
 * @returns {module:eclairjs/sql.DataFrame}
 */
DataFrame.prototype.cache = function() {
  var args = {
    target: this,
    method: 'cache',
    returnType: DataFrame
  };

  return Utils.generate(args);
};

/**
 * Returns a new DataFrame that has exactly numPartitions partitions.
 * Similar to coalesce defined on an RDD, this operation results in a narrow dependency,
 * e.g. if you go from 1000 partitions to 100 partitions, there will not be a shuffle,
 * instead each of the 100 new partitions will claim 10 of the current partitions.
 * @param {integer} numPartitions
 * @returns {module:eclairjs/sql.DataFrame}
 */
DataFrame.prototype.coalesce = function(numPartitions) {
  var args = {
    target: this,
    method: 'coalesce',
    args: [
      {value: numPartitions, type: 'number'}
    ],
    returnType: DataFrame
  };

  return Utils.generate(args);
};

/**
 * Selects column based on the column name and return it as a Column.
 * @param {string} name
 * @returns {module:eclairjs/sql.Column}
 */
DataFrame.prototype.col = function(name) {
  var args = {
    target: this,
    method: 'col',
    args: [
      {value: name, type: 'string'}
    ],
    returnType: Column
  };

  return Utils.generate(args);
};

/**
 * Returns an array that contains all of Rows in this DataFrame.
 * @returns {Promise.<Row[]>} A Promise that resolves to an array containing all Rows.
 */
DataFrame.prototype.collect = function() {
  var args = {
    target: this,
    method: 'collect',
    returnType: String,
    stringify: true,
    resolver: _resolveRows.bind(this)
  };

  return Utils.generate(args);
};

/**
 * Returns all column names as an array.
 * @returns {Promise.<string[]>} A Promise that resolves to an array containing all column names.
 */
DataFrame.prototype.columns = function() {
  var args = {
    target: this,
    method: 'columns',
    returnType: [String],
    stringify: true
  };

  return Utils.generate(args);
};

/**
 * Returns the number of rows in the DataFrame.
 * @returns {Promise.<integer>} A Promise that resolves to the number of rows in the DataFrame.
 */
DataFrame.prototype.count = function() {
  var args = {
    target: this,
    method: 'count',
    returnType: Number
  };

  return Utils.generate(args);
};

/**
 * Create a multi-dimensional cube for the current DataFrame using the specified columns, so we can run aggregation on them.
 * @param {string | Column} cols...
 * @example
 * var df = dataFrame.cube("age", "expense");
 * @returns {module:eclairjs/sql.GroupedData}
 */
DataFrame.prototype.cube = function() {
  var GroupedData = require('./GroupedData.js');

  var params = Array.prototype.slice.call(arguments);

  var args = {
    target: this,
    method: 'cube',
    args: Utils.wrapArray(params, Column),
    returnType: GroupedData
  };

  return Utils.generate(args);
};

/**
 * Computes statistics for numeric columns, including count, mean, stddev, min, and max.
 * If no columns are given, this function computes statistics for all numerical columns.
 * This function is meant for exploratory data analysis, as we make no guarantee about the backward
 * compatibility of the schema of the resulting DataFrame. If you want to programmatically compute
 * summary statistics, use the agg function instead.
 * @param {string} cols....
 * @example
 * var df = peopleDataFrame.describe("age", "expense");
 * @returns {module:eclairjs/sql.DataFrame}
 */
DataFrame.prototype.describe = function() {
  var params = Array.prototype.slice.call(arguments);

  var args = {
    target: this,
    method: 'describe',
    args: Utils.wrapArguments(arguments),
    returnType: DataFrame
  };

  return Utils.generate(args);
};

/**
 * Returns a new DataFrame that contains only the unique rows from this DataFrame. This is an alias for dropDuplicates.
 * @returns {module:eclairjs/sql.DataFrame}
 */
DataFrame.prototype.distinct = function() {
  var args = {
    target: this,
    method: 'distinct',
    returnType: DataFrame
  };

  return Utils.generate(args);
};

/**
 * Returns a new DataFrame with a column dropped.
 * @param {string | Column} column
 * @returns {module:eclairjs/sql.DataFrame}
 */
DataFrame.prototype.drop = function(column) {
  var args = {
    target: this,
    method: 'drop',
    args: [
      (column instanceof Column) ? {value: column} : {value: column, type: 'string'}
    ],
    returnType: DataFrame
  };

  return Utils.generate(args);
};

/**
 * Returns a new DataFrame that contains only the unique rows from this DataFrame, if colNames then considering only the subset of columns.
 * @param {string[]} colNames
 * @returns {module:eclairjs/sql.DataFrame}
 */
DataFrame.prototype.dropDuplicates = function(colNames) {
  var args = {
    target: this,
    method: 'dropDuplicates',
    args: [{value: Utils.wrapArray(colNames)}],
    returnType: DataFrame
  };

  return Utils.generate(args);
};

/**
 * Returns all column names and their data types as an array of arrays. ex. [["name","StringType"],["age","IntegerType"],["expense","IntegerType"]]
 * @returns {Promise.<Array>} A Promise that resolves to an Array of Array[2].
 */
DataFrame.prototype.dtypes = function() {
  function _resolve(result, resolve, reject) {
    try {
      // take returns a stringified json result so parse it here
      resolve(JSON.parse(result));
    } catch (e) {
      var err = new Error("Parse Error: "+ e.message);
      reject(err);
    }
  }

  var args = {
    target: this,
    method: 'dtypes',
    stringify: true,
    returnType: String,
    resolver: _resolve
  };

  return Utils.generate(args);
};

/**
 * Returns a new DataFrame containing rows in this frame but not in another frame. This is equivalent to EXCEPT in SQL.
 * @param {module:eclairjs/sql.DataFrame} otherDataFrame to compare to this DataFrame
 * @returns {module:eclairjs/sql.DataFrame}
 */
DataFrame.prototype.except = function(otherDataFrame) {
  var args = {
    target: this,
    method: 'except',
    args: [{value: otherDataFrame}],
    returnType: DataFrame
  };

  return Utils.generate(args);
};

/**
 * Prints the plans (logical and physical) to the console for debugging purposes.
 * @parma {boolean} if false prints the physical plans only.
 * @returns {Promise.<Void>} A Promise that resolves to nothing.
 */
DataFrame.prototype.explain = function(extended) {
  var args = {
    target: this,
    method: 'explain',
    args: [{value: extended, type: 'boolean', optional: true}],
    returnType: null
  };

  return Utils.generate(args);
};

/**
 * Filters rows using the given SQL expression string or Filters rows using the given Column..
 * @param {string | Column}
 * @returns {module:eclairjs/sql.DataFrame}
 */
DataFrame.prototype.filter = function(column) {
  var args = {
    target: this,
    method: 'filter',
    args: [{value: column, type: column instanceof Column ? Column : 'string'}],
    returnType: DataFrame
  };

  return Utils.generate(args);
};

/**
 * Returns the first row.
 * @returns {module:eclairjs/sql.Row}
 */
DataFrame.prototype.first = function() {
  var Row = require('./Row.js')(this.kernelP);

  var args = {
    target: this,
    method: 'first',
    returnType: Row
  };

  return Utils.generate(args);
};

/**
 * Returns a new RDD by first applying a function to all rows of this DataFrame, and then flattening the results.
 * @param {function} func
 * @param {Object[]} [bindArgs] array whose values will be added to func's argument list.
 * @returns {module:eclairjs/rdd.RDD}
 */
DataFrame.prototype.flatMap = function(func, bindArgs) {
  var args = {
    target: this,
    method: 'flatMap',
    args: [
      {value: func, type: 'lambda'},
      {value: Utils.wrapBindArgs(bindArgs), optional: true}
    ],
    returnType: RDD
  };

  return Utils.generate(args);
};

/**
 * Applies a function func to all rows.
 * @param {function} func
 * @param {Object[]} [bindArgs] array whose values will be added to func's argument list.
 * @returns {Promise.<Void>} A Promise that resolves to nothing.
 */
DataFrame.prototype.foreach = function(func, bindArgs) {
  var args = {
    target: this,
    method: 'foreach',
    args: [
      {value: func, type: 'lambda'},
      {value: Utils.wrapBindArgs(bindArgs), optional: true}
    ],
    returnType: null
  };

  return Utils.generate(args);
};

/**
 * Applies a function to each partition of this DataFrame.
 * @param {function} func
 * @param {Object[]} [bindArgs] array whose values will be added to func's argument list.
 * @returns {Promise.<Void>} A Promise that resolves to nothing.
 */
DataFrame.prototype.foreachPartition = function(func, bindArgs) {
  var args = {
    target: this,
    method: 'foreachPartition',
    args: [
      {value: func, type: 'lambda'},
      {value: Utils.wrapBindArgs(bindArgs), optional: true}
    ],
    returnType: null
  };

  return Utils.generate(args);
};

/**
 * Groups the DataFrame using the specified columns, so we can run aggregation on them
 * @param {string[] | Column[]} - Array of Column objects of column name strings
 * @returns {module:eclairjs/sql.GroupedData}
 */
DataFrame.prototype.groupBy = function() {
  var GroupedData = require('./GroupedData.js');

  var params = Array.prototype.slice.call(arguments);

  var args = {
    target: this,
    method: 'groupBy',
    args: Utils.wrapArray(params, Column),
    returnType: GroupedData
  };

  return Utils.generate(args);
};

/**
 * Returns the first row.
 * @returns {module:eclairjs/sql.Row}
 */
DataFrame.prototype.head = function() {
  var Row = require('./Row.js')(this.kernelP);

  var args = {
    target: this,
    method: 'head',
    returnType: Row
  };

  return Utils.generate(args);
};

/**
 * Returns a best-effort snapshot of the files that compose this DataFrame. This method simply asks each constituent
 * BaseRelation for its respective files and takes the union of all results. Depending on the source relations,
 * this may not find all input files. Duplicates are removed.
 * @returns {Promise.<string[]>} Promise which resolves to a list of files.
 */
DataFrame.prototype.inputFiles = function() {
  function _resolve(result, resolve, reject) {
    try {
      resolve(JSON.parse(result));
    } catch (e) {
      var err = new Error("Parse Error: "+ e.message);
      reject(err);
    }
  }

  var args = {
    target: this,
    method: 'inputFiles',
    returnType: String,
    stringify: true,
    resolver: _resolve
  };

  return Utils.generate(args);
};

/**
 * Returns a new DataFrame containing rows only in both this frame and another frame. This is equivalent to INTERSECT in SQL
 * @param {module:eclairjs/sql.DataFrame} other
 * @returns {module:eclairjs/sql.DataFrame}
 */
DataFrame.prototype.intersect = function(other) {
  var args = {
    target: this,
    method: 'intersect',
    args: [{value: other}],
    returnType: DataFrame
  };

  return Utils.generate(args);
};

/**
 * Returns true if the collect and take methods can be run locally (without any Spark executors).
 * @returns {Promise.<boolean>}
 */
DataFrame.prototype.isLocal = function() {
  var args = {
    target: this,
    method: 'isLocal',
    returnType: Boolean
  };

  return Utils.generate(args);
};

/**
 * Cartesian join with another DataFrame. Note that cartesian joins are very expensive without an extra filter that can be pushed down.
 * @param {module:eclairjs/sql.DataFrame} Right side of the join operation.
 * @param {string | string[] | Column} [columnNamesOrJoinExpr] If string or array of strings column names, inner equi-join with another DataFrame using the given columns.
 * Different from other join functions, the join columns will only appear once in the output, i.e. similar to SQL's JOIN USING syntax.
 * If Column object, joinExprs inner join with another DataFrame, using the given join expression.
 * @param {string} [joinType] only valid if using Column joinExprs.
 * @returns {module:eclairjs/sql.DataFrame}
 * @example
 * var joinedDf = df1.join(df2);
 * // or
 * var joinedDf = df1.join(df2,"age");
 * // or
 * var joinedDf = df1.join(df2, ["age", "DOB"]);
 * // or Column joinExpr
 * var joinedDf = df1.join(df2, df1.col("name").equalTo(df2.col("name")));
 * // or Column joinExpr
 * var joinedDf = df1.join(df2, df1.col("name").equalTo(df2.col("name")), "outer");
 */
DataFrame.prototype.join = function(right, usingColumns, joinType) {
  var arr = [];

  arr.push({value: right});

  if (usingColumns) {
    if (usingColumns instanceof Column) {
      arr.push({value: usingColumns});

      if (joinType) {
        arr.push({value: joinType, type: 'string'});
      }
    } else if (Array.isArray(usingColumns)) {
      var colArr = Utils.wrapArray(usingColumns, Column);

      arr.push({value: colArr});
    } else {
      arr.push({value: usingColumns, type: 'string'});
    }
  }

  var args = {
    target: this,
    method: 'join',
    args: arr,
    returnType: DataFrame
  };

  return Utils.generate(args);
};

/**
 * Returns a new DataFrame by taking the first n rows. The difference between this function and head is that head
 * returns an array while limit returns a new DataFrame.
 * @param {integer} number
 * @returns {module:eclairjs/sql.DataFrame}
 */
DataFrame.prototype.limit = function(number) {
  var args = {
    target: this,
    method: 'limit',
    args: [{value: number, type: Number}],
    returnType: DataFrame
  };

  return Utils.generate(args);
};

/**
 * Returns a new RDD by applying a function to all rows of this DataFrame.
 * @param {function} func
 * @param {Object[]} [bindArgs] array whose values will be added to func's argument list.
 * @returns {module:eclairjs/rdd.RDD}
 */
DataFrame.prototype.map = function(func, bindArgs) {
  var args = {
    target: this,
    method: 'map',
    args: [
      {value: func, type: 'lambda'},
      {value: Utils.wrapBindArgs(bindArgs), optional: true}
    ],
    returnType: RDD
  };

  return Utils.generate(args);
};

/**
 * Return a new RDD by applying a function to each partition of this DataFrame.
 * Similar to map, but runs separately on each partition (block) of the DataFrame, so func must accept an Array.
 * func should return a array rather than a single item.
 * @param {function} func
 * @param {Object[]} [bindArgs] array whose values will be added to func's argument list.
 * @returns {module:eclairjs/rdd.RDD}
 */
DataFrame.prototype.mapPartitions = function(func, bindArgs) {
  var args = {
    target: this,
    method: 'mapPartitions',
    args: [
      {value: func, type: 'lambda'},
      {value: Utils.wrapBindArgs(bindArgs), optional: true}
    ],
    returnType: RDD
  };

  return Utils.generate(args);
};

/**
 * Returns a DataFrameNaFunctions for working with missing data.
 * @returns {module:eclairjs/sql.DataFrameNaFunctions}
 */
DataFrame.prototype.na = function() {
  var DataFrameNaFunctions = require('./DataFrameNaFunctions.js');

  var args = {
    target: this,
    method: 'na',
    returnType: DataFrameNaFunctions
  };

  return Utils.generate(args);
};

/**
 * Returns a new DataFrame sorted by the specified columns, if columnName is used sorted in ascending order.
 * This is an alias of the sort function.
 * @param {string | Column} columnName,...columnName or sortExprs,... sortExprs
 * @returns {module:eclairjs/sql.DataFrame}
 */
DataFrame.prototype.orderBy = function() {
  var params = Array.prototype.slice.call(arguments);

  var args = {
    target: this,
    method: 'orderBy',
    args: Utils.wrapArray(params, Column),
    returnType: DataFrame
  };

  return Utils.generate(args);
};

/**
 * @param {module:eclairjs/storage.StorageLevel} newLevel
 * @returns {module:eclairjs/sql.DataFrame}
 */
DataFrame.prototype.persist = function(newLevel) {
  var args = {
    target: this,
    method: 'persist',
    args: [
      {value: newLevel, optional: true}
    ],
    returnType: DataFrame
  };

  return Utils.generate(args);
};

/**
 * Prints the schema to the console in a nice tree format.
 * @returns {Promise.<Void>} A Promise that resolves to nothing.
 */
DataFrame.prototype.printSchema = function() {
  var args = {
    target: this,
    method: 'printSchema',
    returnType: null
  };

  return Utils.generate(args);
};

/**
 * @returns {module:eclairjs/sql.SQLContextQueryExecution}
 */
DataFrame.prototype.queryExecution = function() {
  var SQLContextQueryExecution = require('./SQLContextQueryExecution.js');

  var args = {
    target: this,
    method: 'queryExecution',
    returnType: SQLContextQueryExecution
  };

  return Utils.generate(args);
};

/**
 * Randomly splits this DataFrame with the provided weights.
 * @param {float[]} weights - weights for splits, will be normalized if they don't sum to 1.
 * @param {int} seed - Seed for sampling.
 * @returns {DataFrame[]}
 */
DataFrame.prototype.randomSplit = function(weights, seed) {
  var args = {
    target: this,
    method: 'randomSplit',
    args: [
      {value: Utils.wrapArray(weights)},
      {value: seed, type: 'number', optional: true}
    ],
    returnType: [DataFrame]
  };

  return Utils.generate(args);
};

/**
 * Represents the content of the DataFrame as an RDD of Rows.
 * @returns {module:eclairjs/rdd.RDD}
 */
DataFrame.prototype.rdd = function() {
  var args = {
    target: this,
    method: 'rdd',
    returnType: RDD
  };

  return Utils.generate(args);
};

/**
 * Registers this DataFrame as a temporary table using the given name.
 * @param {string} tableName
 * @returns {Promise.<Void>} A Promise that resolves when the temp table has been created.
 */
DataFrame.prototype.registerTempTable = function(tableName) {
  var args = {
    target: this,
    method: 'registerTempTable',
    args: [
      {value: tableName, type: 'string'}
    ],
    returnType: null
  };

  return Utils.generate(args);
};

/**
 * Returns a new DataFrame that has exactly numPartitions partitions.
 * @param {integer} numPartitions
 * @returns {module:eclairjs/sql.DataFrame}
 */
DataFrame.prototype.repartition = function(numPartitions) {
  var args = {
    target: this,
    method: 'repartition',
    args: [
      {value: numPartitions, type: 'number'}
    ],
    returnType: DataFrame
  };

  return Utils.generate(args);
};

/**
 * Create a multi-dimensional rollup for the current DataFrame using the specified columns,
 * so we can run aggregation on them. See GroupedData for all the available aggregate functions.
 * @param {string | Column} columnName, .....columnName or sortExprs,... sortExprs
 * @returns {module:eclairjs/sql.GroupedData}
 * @example
 *  var result = peopleDataFrame.rollup("age", "networth").count();
 *  // or
 *  var col = peopleDataFrame.col("age");
 *	var result = peopleDataFrame.rollup(col).count();
 */
DataFrame.prototype.rollup = function() {
  var args = Array.prototype.slice.call(arguments);

  var GroupedData = require('./GroupedData.js');

  var args = {
    target: this,
    method: 'rollup',
    args: Utils.wrapArray(args, Column),
    returnType: GroupedData
  };

  return Utils.generate(args);
};

/**
 * Returns a new DataFrame by sampling a fraction of rows, using a random seed.
 * @param {boolean} withReplacement
 * @param {float} fraction
 * @param {integer} [seed]
 * @returns {module:eclairjs/sql.DataFrame}
 */
DataFrame.prototype.sample = function(withReplacement, fraction, seed) {
  var args = {
    target: this,
    method: 'sample',
    args: [
      {value: withReplacement, type: 'boolean'},
      {value: fraction, type: 'number'},
      {value: seed, type: 'number', optional: true}
    ],
    returnType: DataFrame
  };

  return Utils.generate(args);
};

/**
 * Returns the schema of this DataFrame.
 * @returns {module:eclairjs/sql/types.StructType}
 */
DataFrame.prototype.schema = function() {
  var StructType = require('./types/StructType.js')(this.kernelP);

  var args = {
    target: this,
    method: 'schema',
    returnType: StructType
  };

  return Utils.generate(args);
};

/**
 * Selects a set of column based expressions.
 * @param {module:eclairjs/sql.Column[] | string[]}
 * @returns  {module:eclairjs/sql.DataFrame}
 */
DataFrame.prototype.select = function() {
  var params = Array.prototype.slice.call(arguments);

  var args = {
    target: this,
    method: 'select',
    args: Utils.wrapArray(params, Column),
    returnType: DataFrame
  };

  return Utils.generate(args);
};

/**
 * Selects a set of SQL expressions. This is a variant of select that accepts SQL expressions.
 * @param {string} exprs,...exprs
 * @returns {module:eclairjs/sql.DataFrame}
 * @example
 * var result = peopleDataFrame.selectExpr("name", "age > 19");
 */
DataFrame.prototype.selectExpr = function() {
  var params = Array.prototype.slice.call(arguments);

  var args = {
    target: this,
    method: 'selectExpr',
    args: Utils.wrapArray(params),
    returnType: DataFrame
  };

  return Utils.generate(args);
};

/**
 * Displays the top 20 rows of DataFrame in a tabular form.
 *
 * @returns {Promise.<Void>} A Promise that resolves to nothing.
 */
DataFrame.prototype.show = function() {
  var args = {
    target: this,
    method: 'show',
    returnType: null
  };

  return Utils.generate(args);
};

/**
 * Returns a new DataFrame sorted by the specified columns, if columnName is used sorted in ascending order.
 * @param {string | Column} columnName,...columnName or sortExprs,... sortExprs
 * @returns {module:eclairjs/sql.DataFrame}
 * @example
 *  var result = peopleDataFrame.sort("age", "name");
 *  // or
 *  var col = peopleDataFrame.col("age");
 *	var colExpr = col.desc();
 *	var result = peopleDataFrame.sort(colExpr);
 */
DataFrame.prototype.sort = function() {
  var params = Array.prototype.slice.call(arguments);

  var args = {
    target: this,
    method: 'sort',
    args: Utils.wrapArray(params, Column),
    returnType: DataFrame
  };

  return Utils.generate(args);
};

/**
 * Returns SQLContext
 * @returns {module:eclairjs/sql.SQLContext}
 */
DataFrame.prototype.sqlContext = function() {
  var SQLContext = require('./SQLContext.js');

  // TODO: need a cleaner way
  return new SQLContext({context: this.kernelP});
};

/**
 * Returns a DataFrameStatFunctions for working statistic functions support.
 * @example
 * var stat = peopleDataFrame.stat().cov("income", "networth");
 *
 * @returns {module:eclairjs/sql.DataFrameStatFunctions}
 */
DataFrame.prototype.stat = function() {
  var DataFrameStatFunctions = require('./DataFrameStatFunctions.js');

  var args = {
    target: this,
    method: 'stat',
    returnType: DataFrameStatFunctions
  };

  return Utils.generate(args);
};

/**
 * Returns the first n rows in the DataFrame.
 * @param {integer} num
 * @returns {Promise.<Array>} A Promise that resolves to an array containing the first num elements in this DataFrame.
 */
DataFrame.prototype.take = function() {
  var params = Array.prototype.slice.call(arguments);

  var args = {
    target: this,
    method: 'take',
    args: Utils.wrapArray(params),
    returnType: String,
    stringify: true,
    resolver: _resolveRows.bind(this)
  };

  return Utils.generate(args);
};

/**
 * Returns a new DataFrame with columns renamed. This can be quite convenient in conversion from a
 * RDD of tuples into a DataFrame with meaningful names. For example:
 * @param {string} colNames,...colNames
 * @return {module:eclairjs/sql.DataFrame}
 * @example
 * var result = nameAgeDF.toDF("newName", "newAge");
 */
DataFrame.prototype.toDF = function() {
  var params = Array.prototype.slice.call(arguments);

  var args = {
    target: this,
    method: 'toDF',
    args: Utils.wrapArray(params),
    returnType: DataFrame
  };

  return Utils.generate(args);
};

/**
 * Returns the content of the DataFrame as a RDD of JSON strings.
 * @returns {Promise.<object[]>}
 */
DataFrame.prototype.toJSON = function() {
  function _resolve(result, resolve, reject) {
    try {
      // take returns a stringified json result so parse it here
      resolve(JSON.parse(result));
    } catch (e) {
      var err = new Error("Parse Error: "+ e.message);
      reject(err);
    }
  }

  var args = {
    target: this,
    method: 'toJSON',
    returnType: [Object],
    //stringify: true,
    resolver: _resolve
  };

  return Utils.generate(args);
};

/**
 * Returns a RDD object.
 * @returns {module:eclairjs/rdd.RDD}
 */
DataFrame.prototype.toRDD = function() {
  var args = {
    target: this,
    method: 'toRDD',
    returnType: RDD
  };

  return Utils.generate(args);
};

DataFrame.prototype.toString = function() {
  var args = {
    target: this,
    method: 'toString',
    returnType: String
  };

  return Utils.generate(args);
};

/**
 * Returns a new DataFrame containing union of rows in this frame and another frame. This is equivalent to UNION ALL in SQL.
 * @param {module:eclairjs/sql.DataFrame} other
 * @returns {module:eclairjs/sql.DataFrame}
 */
DataFrame.prototype.unionAll = function(other) {
  var args = {
    target: this,
    method: 'unionAll',
    args: [{value: other}],
    returnType: DataFrame
  };

  return Utils.generate(args);
};

/**
 * @param {boolean} blocking
 * @returns {Promise.<Void>} A Promise that resolves to nothing.
 */
DataFrame.prototype.unpersist = function(blocking) {
  var args = {
    target: this,
    method: 'unpersist',
    args: [{value: blocking, type: 'boolean'}],
    returnType: null
  };

  return Utils.generate(args);
};

/**
 * Filters rows using the given Column or SQL expression.
 * @param {module:eclairjs/sql.Column | string} condition - .
 * @returns {module:eclairjs/sql.DataFrame}
 */
DataFrame.prototype.where = function(condition) {
  var args = {
    target: this,
    method: 'where',
    args: [{value: condition, type: condition instanceof Column ? Column : 'string'}],
    returnType: DataFrame
  };

  return Utils.generate(args);
};

/**
 * Returns a new DataFrame by adding a column or replacing the existing column that has the same name.
 * @param {string} name
 * @param {module:eclairjs/sql.Column} col
 * @returns {module:eclairjs/sql.DataFrame}
 * @example
 *  var col = peopleDataFrame.col("age");
 *  var df1 = peopleDataFrame.withColumn("newCol", col);
 */
DataFrame.prototype.withColumn = function (name, col) {
  var args = {
    target: this,
    method: 'withColumn',
    args: Utils.wrapArguments(arguments),
    returnType: DataFrame
  };

  return Utils.generate(args);
};

/**
 * Interface for saving the content of the DataFrame out into external storage.
 * @returns {module:eclairjs/sql.DataFrameWriter}
 */
DataFrame.prototype.write = function() {
  var DataFrameWriter = require('./DataFrameWriter.js');

  var args = {
    target: this,
    method: 'write',
    returnType: DataFrameWriter
  };

  return Utils.generate(args);
};


//
//  Static functions
//
//

// var data = [
//     {
//         "values":[[0,0,18],1],
//         "schema":{
//             "fields":[
//                 {"name":"features","dataType":"vector","nullable":true},
//                 {"name":"label","dataType":"double","nullable":false}
//                 ]}
//     },
//     {"values":[[0,1,12],0],"schema":{"fields":[{"name":"features","dataType":"vector","nullable":true},{"name":"label","dataType":"double","nullable":false}]}},{"values":[[1,0,15],0],"schema":{"fields":[{"name":"features","dataType":"vector","nullable":true},{"name":"label","dataType":"double","nullable":false}]}}];



/**
 * Displays the DataFrame rows in a tabular form.
 * The array of rows are the result of take(), etc
 *
 * @param {module:spark/sql.Row[]} rows
 * @param {boolean} [truncate] defaults to false, Whether truncate long strings. If true, strings more than 20 characters will be
 * truncated and all cells will be aligned right
 *
 */
DataFrame.show = function(rows,truncate) {
    if (!rows || !rows.length)
    {
      console.log("No data to show");
    }
    var numCols = rows[0].schema.fields.length;

    var colWidths=[];
    for (var i=0;i<numCols;i++)
    {
      colWidths.push(rows[0].schema.fields[i].name.length);
    }
    var dataStr=[];
    for (var rown=0;rown<rows.length;rown++)
    {
      var colsStr=[];
      for (var coln=0;coln<numCols;coln++)
      {
        var str=JSON.stringify(rows[rown].values[coln]);
        if (truncate && str.length>20)
        {
          str = str.substring(0, 17) + "...";
        }
        colsStr.push(str);
        if (str.length>colWidths[coln])
          colWidths[coln]=str.length;
      }
      dataStr.push(colsStr);
    }

   var seps="----------------------------------------------------------------------------------------------------------";
   var blanks="                                                                                                          ";
   var sepLine="+";

   function justify(str,len) {
    return str+blanks.substring(0,len-str.length);
   }
   for (var i=0;i<numCols;i++)
   {
      sepLine+=seps.substring(0,colWidths[i]+1)+"+";
   }
    console.log(sepLine);
    var colNames="|";
   for (var i=0;i<numCols;i++)
   {
      colNames+=justify(rows[0].schema.fields[i].name,colWidths[i]+1)+"|";
   }
    console.log(colNames);
    console.log(sepLine);

    for (var rown=0;rown<rows.length;rown++)
    {
      var line="|";
      var str=dataStr[rown]
      for (var coln=0;coln<numCols;coln++)
      {
          line+=justify(str[coln],colWidths[coln]+1)+"|"
      }
      console.log(line)
    }
    console.log(sepLine);


};

DataFrame.moduleLocation = '/sql/DataFrame';

module.exports = DataFrame;
