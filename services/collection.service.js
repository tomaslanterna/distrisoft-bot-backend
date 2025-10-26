const { default: mongoose } = require("mongoose");
const Collection = require("../models/Collection");

const createCollectionDb = async (collectionData) => {
  const collection = new Collection(collectionData);
  return await collection.save();
};

const getCollectionsDb = async (distributorId) => {
  const distributorObjectId = new mongoose.Types.ObjectId(distributorId);
  return await Collection.find({ distributor: distributorObjectId });
};

module.exports = {
  createCollectionDb,
  getCollectionsDb,
};
