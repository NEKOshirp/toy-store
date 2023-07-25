const { MongoClient, ObjectID } = require('mongodb');

const mongoURI = 'mongodb://127.0.0.1:27017';
const dbName = 'IT0502';

let db;

async function connectToDatabase() {
  try {
    const client = await MongoClient.connect(mongoURI, {
      useUnifiedTopology: true,
    });
    db = client.db(dbName);
    console.log('Connected to MongoDB successfully!');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}

function getDatabase() {
  return db;
}

// Function to update a document in the database
async function updateData(collectionName, filter, update) {
  try {
    const collection = db.collection(collectionName);
    const result = await collection.updateOne(filter, { $set: update });
    return result.modifiedCount;
  } catch (err) {
    console.error('Error updating document:', err);
  }
}

// Function to delete a document from the database
async function deleteData(collectionName, filter) {
  try {
    const collection = db.collection(collectionName);
    const result = await collection.deleteOne(filter);
    return result.deletedCount;
  } catch (err) {
    console.error('Error deleting document:', err);
  }
}

module.exports = { connectToDatabase, getDatabase, updateData, deleteData };
