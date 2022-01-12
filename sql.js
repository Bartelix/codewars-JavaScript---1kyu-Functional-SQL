function query() {
  let selectFn = null;
  const whereFns = [];
  let orderByFn = null;
  let groupByFns = [];
  const havingFns = [];
  let fromDone = false;
  let selectDone = false;
  let groupByDone = false;
  let orderByDone = false;
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
  function _crossJoin(tables) {
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

  function _where(rows, whereFns) {
    return rows.filter(row => whereFns.map(whereFn => whereFn(row)).some(res => res === true));
  }

  function _groupBy(rows, groupByFn) {
    const groups = rows.reduce((groups, row) => {
      let group = groupByFn(row);
      if (groups.hasOwnProperty(group)) {
        groups[group].push(row);
      } else {
        groups[group] = [row];
      }
      return groups;
    }, {});

    const result = [];
    for (const [key, value] of Object.entries(groups)) {
      result.push([key, value]);
    }
    return result;
  }

  function _having(rows, havingFn) {}

  function _orderBy(rows, orderByFn) {
    return rows.slice().sort(orderByFn);
  }

  function _select(rows, selectFn) {
    return rows.map(row => selectFn(row));
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
      result = _crossJoin(tables);
      fromDone = true;
      return this;
    },
    /**
     * This method push fns to array for further filter result.
     * If there is many input functions is equivalent to OR filter
     * Filter AND is obtained by chaining many where() in query
     * @param  {Array<function>} fns
     * @returns this
     */
    where(...fns) {
      whereFns.push(fns);
      return this;
    },
    /**
     * This function checks if this is duplicated order by invoke, then throw Error.
     * This method set fn to variable for further sort result.
     * @param {function} fn - function to be use as callback for array sort method
     * @returns this
     */
    orderBy(fn) {
      if (orderByDone) throw new Error('Duplicate ORDERBY');
      orderByFn = fn;
      orderByDone = true;
      return this;
    },
    /**
     *
     * @returns this
     */
    groupBy(...fns) {
      if (groupByDone) throw new Error('Duplicate GROUPBY');
      groupByFns = fns;
      groupByDone = true;
      return this;
    },
    /**
     *
     * @returns this
     */
    having(fn) {
      havingFns.push(fn);
      return this;
    },
    /**
     * This method applies all functions passed in previouse functions and return result
     * @returns query result
     */
    execute() {
      if (whereFns.length > 0) {
        for (let i = 0; i < whereFns.length; i++) {
          result = _where(result, whereFns[i]);
          // result = result.filter(row => whereFns[i].map(whereFn => whereFn(row)).some(res => res === true));
        }
      }
      // group by
      if (groupByFns.length > 0) {
        for (let i = 0; i < groupByFns.length; i++) {
          result = _groupBy(result, groupByFns[i]);
        }
      }
      // having
      if (orderByFn != null) {
        result = _orderBy(result, orderByFn);
      }
      if (selectFn != null) {
        result = _select(result, selectFn);
      }
      return result;
    }
  };
}

module.exports = query;
