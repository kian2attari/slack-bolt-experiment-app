// Since using await in a loop is bad practice, this combination of map + promise.all is a better way to avoid doing it sequentially
// REVIEW  Maybe just using reduce as done in cronJobs.js or returning Promise.all(...) would be better
async function async_array_map(arr, async_callback_fn) {
  await Promise.all(arr.map(async_callback_fn));
}

exports.async_array_map = async_array_map;
