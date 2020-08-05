exports.reduce_array_to_obj = array =>
  array.reduce((accumulator, currentValue) => {
    accumulator[currentValue] = null;
    return accumulator;
  }, {});
