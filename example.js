function createStore({ state, actions, mutations, getters }) {
  const gettersSubscribers = Object.keys(getters).reduce((all, getter) => {
    return {
      ...all,
      [getter]: []
    };
  }, {});

  const clientGetters = Object.keys(getters).reduce((all, getter) => {
    return {
      ...all,
      [getter]: subscriber => {
        gettersSubscribers[getter].push(subscriber);
      }
    };
  }, {});

  const actionOpts = {
    commit(mutationName, payload) {
      mutations[mutationName](state, payload);

      Object.keys(gettersSubscribers).forEach(getter => {
        gettersSubscribers[getter].forEach(subscriber => {
          const getterResult = getters[getter](state);
          subscriber(getterResult);
        });
      });
    }
  };

  return {
    state,
    dispatch(actionName, payload) {
      actions[actionName](actionOpts, payload);
    },
    getters: clientGetters
  };
}
