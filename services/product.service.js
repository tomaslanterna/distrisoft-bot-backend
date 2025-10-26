const Product = require("../models/Product");

const createProductDb = async (productData) => {
  const product = new Product(productData);
  return await product.save();
};

const getProductById = async (productId) => {
  return await Product.findOne({ product_retailer_id: productId }).lean();
};

module.exports = {
  createProductDb,
  getProductById,
};
