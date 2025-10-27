const { default: mongoose } = require("mongoose");
const Product = require("../models/Product");

const createProductDb = async (productData) => {
  const product = new Product(productData);
  return await product.save();
};

const getProductById = async (productId) => {
  return await Product.findOne({ product_retailer_id: productId }).lean();
};

const getProductsByDistributorId = async (distributorId) => {
  const distributorObjectId = new mongoose.Types.ObjectId(distributorId);
  return await Product.find({ distributor: distributorObjectId });
};

module.exports = {
  createProductDb,
  getProductById,
  getProductsByDistributorId,
};
