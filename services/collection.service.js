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
  return await Collection.findOne({ distributor: distributorObjectId }).lean();
};

const updateCollectionDb = async (collection, distributorId, productsIds) => {
  const distributorObjectId = new mongoose.Types.ObjectId(distributorId);
  const collectionDb = await getCollectionByDistributorIdDb(
    distributorId,
    collection.name
  );
  const newCollection = {
    ...collectionDb,
    productsIds: [...collectionDb.productsIds, ...productsIds],
  };
  return await Collection.updateOne(
    { distributor: distributorObjectId },
    { $set: newCollection }
  );
};

module.exports = {
  createCollectionDb,
  getCollectionsDb,
  updateCollectionDb,
};
