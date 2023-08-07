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
async function getProductById(productId) {
  const db = getDatabase();
  const product = await db.collection(collectionName).findOne({ _id: productId });
  return product;
}

async function editProduct(productId, updatedItem) {
  const db = getDatabase();
  const result = await db.collection(collectionName).updateOne(
    { _id: productId },
    { $set: updatedItem }
  );
  return result;
}

  
  // Function to delete a product from the database by ID
  async function deleteProduct(productId) {
    const db = getDatabase();
    const result = await db.collection(collectionName).deleteOne({ _id: productId });
    return result;
  }
  
  
  module.exports = { getProducts, createProduct, getProductById, editProduct, deleteProduct };

