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

const getCollectionByDistributorIdDb = async (distributorId, name) => {
  const distributorObjectId = new mongoose.Types.ObjectId(distributorId);
  return await Collection.findOne({
    distributor: distributorObjectId,
    name: { $regex: new RegExp(`^${name}$`, "i") },
  }).lean();
};

const updateCollectionDb = async (collection, distributorId, productsIds) => {
  const distributorObjectId = new mongoose.Types.ObjectId(distributorId);
  return await Collection.findOneAndUpdate(
    {
      distributor: distributorObjectId,
      name: { $regex: new RegExp(`^${collection.name}$`, "i") },
    },
    { $push: { productsIds: productsIds } },
    { new: true } // devuelve el documento actualizado
  );
};

const deleteCollectionDb = async (collectionName, distributorId) => {
  const distributorObjectId = new mongoose.Types.ObjectId(distributorId);
  return await Collection.findOneAndDelete({
    distributor: distributorObjectId,
    name: { $regex: new RegExp(`^${collectionName}$`, "i") },
  });
};

module.exports = {
  createCollectionDb,
  getCollectionsDb,
  updateCollectionDb,
  deleteCollectionDb,
};
