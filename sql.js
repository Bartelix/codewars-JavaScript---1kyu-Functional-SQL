function query() {
  let selectFn = null;
  let fromDone = false;
  let selectDone = false;
  let result = [];

  function crossJoin(tables) {
    if (tables.length === 1) return tables[0];
    return tables.reduce((prev, curr) => {
      const res = [];
      if (prev.length === 0) {
        for (let j = 0; j < curr.length; j++) {
          res.push([curr[j]]);
        }
        return res;
      } else {
        for (let i = 0; i < prev.length; i++) {
          for (let j = 0; j < curr.length; j++) {
            res.push([...prev[i], curr[j]]);
          }
        }
        return res;
      }
    }, []);
  }

  return {
    select(fn) {
      if (selectDone) throw new Error('Duplicate SELECT');
      selectFn = fn;
      selectDone = true;
      return this;
    },
    from(...tables) {
      if (fromDone) throw new Error('Duplicate FROM');
      result = crossJoin(tables);
      fromDone = true;
      return this;
    },
    where(...fns) {
      result = result.filter(record => fns.map(fn => fn(record)).some(el => el));
      return this;
    },
    orderBy(fn) {
      result.sort(fn);
      return this;
    },
    groupBy() {
      return this;
    },
    having() {
      return this;
    },
    execute() {
      if (selectFn) {
        return result.map(record => selectFn(record));
      }
      return result;
    }
  };
}

module.exports = query;
