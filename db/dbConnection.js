const {MongoClient} = require('mongodb');

class Connection {
  static async connectToMongoCollection() {
    if (this.collection) return this.collection;
    try {
      this.db_client = await MongoClient.connect(this.url, this.options);
      console.log('DB Client ready! Successfully connected successfully to MongoDB!');
    } catch (error) {
      console.error(error);
    }
    this.collection = this.db_client.db().collection('gitwave_team_data');
    return this.collection;
  }
}

Connection.db_client = null;
Connection.collection = null;
Connection.url = process.env.MONGODB_URI;
Connection.options = {
  useUnifiedTopology: true,
};

exports.Connection = Connection;
