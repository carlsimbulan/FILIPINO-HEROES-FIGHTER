// api/_db.js — shared MongoDB connection (reused across serverless invocations)
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME   = 'GameDev';

let client = null;
let db     = null;

async function connectDB() {
  if (db) return db;
  client = await MongoClient.connect(MONGO_URI);
  db = client.db(DB_NAME);
  return db;
}

module.exports = { connectDB };
