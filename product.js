const { getDatabase } = require('./db');

const collectionName = 'products';

async function getProducts() {
  const db = getDatabase();
  return db.collection(collectionName).find().toArray();
}

async function createProduct(item) {
    const db = getDatabase();
    const result = await db.collection(collectionName).insertOne(item);
    return result;
  }
  async function updateProduct(productId, updatedFields) {
    const db = getDatabase();
    const result = await db.collection(collectionName).updateOne(
      { _id: ObjectID(productId) },
      { $set: updatedFields }
    );
    return result.modifiedCount;
  }
  
  async function deleteProduct(productId) {
    const db = getDatabase();
    const result = await db.collection(collectionName).deleteOne({ _id: ObjectID(productId) });
    return result.deletedCount;
  }
  
  module.exports = { getProducts, createProduct, updateProduct, deleteProduct };

