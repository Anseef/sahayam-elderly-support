const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const client = new MongoClient(process.env.DB_CONNECT);

let dbConnection;

module.exports = {
  connectToDb: async (cb) => {
    try {
      await client.connect();
      dbConnection = client.db('sahayam'); // Your Database Name
      console.log('✅ Connected to MongoDB (Native Driver)');
      return cb();
    } catch (err) {
      console.log(err);
      return cb(err);
    }
  },
  getDb: () => dbConnection
};