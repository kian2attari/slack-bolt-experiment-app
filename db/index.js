const {test_connect} = require('./testConnectToDB');
const {update_one_in_DB} = require('./updateDB');
const {add_one_to_DB} = require('./addToDB');

exports.test_connect = test_connect;
exports.update_one_in_DB = update_one_in_DB;
exports.add_one_to_DB = add_one_to_DB;
