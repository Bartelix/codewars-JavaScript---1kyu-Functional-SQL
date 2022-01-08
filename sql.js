function query() {
  let selectFn = null;
  let fromDone = false;
  let selectDone = false;
  let result = [];

  /**
   * This function do equivalent of cross join from SQL
   * examples:
   * input: [ [ { 1 }, { 2 }], [ { 3 }, { 4 } ] ]
   * output: [ [ { 1 }, { 3 } ], [ { 1 }, { 4 } ], [ { 2 }, { 3 } ], [ { 2 }, { 4 } ] ]
   * -----
   * input: [ [ { 1 }, { 2} ] ]
   * output: [ { 1 }, { 2 }]
   * @param {Array<Array>} tables
   * @returns array
   */
  function crossJoin(tables) {
    if (tables.length === 1) return tables[0];
    return tables.reduce(
      (prev, curr) => {
        const res = [];
        for (let i = 0; i < prev.length; i++) {
          for (let j = 0; j < curr.length; j++) {
            res.push([...prev[i], curr[j]]);
          }
        }
        return res;
      },
      [[]]
    );
  }

  return {
    /**
     * This function checks if this is duplicated select invoke, then throw Error.
     * Set fn to variable for further application
     * @param {function} fn - function for further application in execute()
     * @returns this
     */
    select(fn) {
      if (selectDone) throw new Error('Duplicate SELECT');
      selectFn = fn;
      selectDone = true;
      return this;
    },
    /**
     * This method checks if this is duplicated from invoke, then throw Error.
     * @param  {Array<Array>} tables - array of arrays of objects or primitives
     * @returns this
     */
    from(...tables) {
      if (fromDone) throw new Error('Duplicate FROM');
      result = crossJoin(tables);
      fromDone = true;
      return this;
    },
    /**
     * This method use fns to filter result.
     * If there is many input functions is equivalent to OR filter
     * Filter AND is obtained by chaining many where() in query
     * @param  {Array<function>} fns
     * @returns this
     */
    where(...fns) {
      result = result.filter(record => fns.map(fn => fn(record)).some(el => el));
      return this;
    },
    /**
     * This method sorting query result
     * @param {function} fn - function to be use as callback for array sort method
     * @returns this
     */
    orderBy(fn) {
      result.sort(fn);
      return this;
    },
    /**
     *
     * @returns this
     */
    groupBy() {
      return this;
    },
    /**
     *
     * @returns this
     */
    having() {
      return this;
    },
    /**
     * This method applies function passed in select method if it exist and return result
     * @returns query result
     */
    execute() {
      if (selectFn) {
        return result.map(record => selectFn(record));
      }
      return result;
    }
  };
}

module.exports = query;
