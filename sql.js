function query() {
  let selectFn;
  let fromDone = false;
  let selectDone = false;
  let isMultipleCollections = false;
  let result = [];

  function crossJoin(tables) {
    const result = tables.reduce((prev, curr) => {
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
    return result;
  }

  return {
    select(fieldFn) {
      if (selectDone) throw new Error('Duplicate SELECT');
      selectFn = fieldFn;
      selectDone = true;
      return this;
    },
    from(...tables) {
      if (fromDone) throw new Error('Duplicate FROM');
      if (tables.length > 1) {
        result = crossJoin(tables);
        isMultipleCollections = true;
      } else result = tables[0];
      fromDone = true;
      return this;
    },
    where(...filterFns) {
      result = result.filter(elem => filterFns.map(fn => fn(elem)).some(el => el));
      return this;
    },
    orderBy(sortFn) {
      result.sort(sortFn);
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
        return result.map(el => selectFn(el));
      }
      return result;
    }
  };
}

module.exports = query;
