exports.reduceArrayToObj = array =>
  array.reduce((accumulator, currentValue) => {
    accumulator[currentValue] = null;
    return accumulator;
  }, {});
