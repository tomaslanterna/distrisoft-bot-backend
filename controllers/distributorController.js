const {
  updateDistributorByPhone,
  getDistributorByChannelId,
} = require("../services/distributorService");
const { getOrdersByDistributorId } = require("../services/order.Service");
const {
  createWhapiProduct,
  getWhapiProducts,
  getWhapiCollections,
  createWhapiCollection,
  updateWhapiCollection,
} = require("../services/whatsappApiService");

const updateDistributor = async (req, res) => {
  try {
    const { distributor } = req.body;

    if (!distributor) {
      return res.status(404).json({ message: "Distributor not found" });
    }

    const validClients = distributor.clients.filter(
      (client) =>
        client.phone != null && client.address != "" && client.ubication != ""
    );

    distributor.clients = validClients.map((client) => ({
      name: client.name,
      phone: client.phone,
      distributionDayOfWeek: client.distributionDayOfWeek,
    }));

    // Llamamos al service para actualizar
    const updatedDistributor = await updateDistributorByPhone(distributor);

    if (!updatedDistributor) {
      return res.status(404).json({ message: "Distributor not found" });
    }

    return res.status(200).json({
      message: "Distributor updated successfully",
      data: updatedDistributor,
    });
  } catch (error) {
    console.error("Error updating distributor:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getDistributorOrders = async (req, res) => {
  try {
    const { distributorId } = req.query;

    if (!distributorId) {
      return res.status(403).json({ message: "DistributorId not found" });
    }

    const distributorOrders = await getOrdersByDistributorId(distributorId);

    if (!distributorOrders) {
      return res
        .status(404)
        .json({ message: "Error orders not find for distributor" });
    }

    return res.status(200).json({
      message: "Orders in distributor",
      data: distributorOrders,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const createDistributorProduct = async (req, res) => {
  try {
    const { product, distributorChannelId } = req.body;
    const productAux = {
      ...product,
      images: [
        "https://tumayorferretero.net/22457-large_default/producto-generico.jpg?stp=dst-jpg_p100x100_tt6&ccb=1-7&_nc_sid=657aed&_nc_ohc=TWA13PsPgLEQ7kNvwEYeZ0x&_nc_oc=AdnuA3UpNa59pzV9v_IsjuyW4w1-UHfEbVJO9RVYo7PjlRu1Po5HQ3-lKOGTfWymMq1ATyCcBet1Fs-KT0LhpYPh&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=media-sea1-1.cdn.whatsapp.net&_nc_gid=yt7wRqGJtYL75gHwqaEylQ&oh=01_Q5Aa2wHIU5Ndfv-w1uOGggMYfw5PGjrqPgsnDwMXk4Zgr9wwqg&oe=68F590E6",
      ],
    };

    const distributor = await getDistributorByChannelId(distributorChannelId);

    if (!distributor) {
      return res.status(400).json({
        success: false,
        message: "Error in getDistributorByChannelId",
      });
    }

    const createdProduct = await createWhapiProduct(productAux, distributor);

    if (!createdProduct) {
      return res.status(500).json({
        success: false,
        message: "Error creating product in distributor",
      });
    }

    return res.status(200).json({
      message: "Product created successfully",
      data: createdProduct,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error on createDistributorProduct" });
  }
};

const getDistributorProducts = async (req, res) => {
  try {
    const { distributorChannelId } = req.query;

    const distributor = await getDistributorByChannelId(distributorChannelId);

    if (!distributor) {
      return res.status(400).json({
        success: false,
        message: "Error in getDistributorByChannelId",
      });
    }

    const distributorProducts = await getWhapiProducts(distributor);

    if (!distributorProducts) {
      return res.status(500).json({
        success: false,
        message: "Error in getWhapiProducts",
      });
    }

    return res.status(200).json({
      message: "Product created successfully",
      data: distributorProducts,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error getDistributorProducts" });
  }
};

const getDistributorCollections = async (req, res) => {
  try {
    const { distributorChannelId } = req.query;

    const distributor = await getDistributorByChannelId(distributorChannelId);

    if (!distributor) {
      return res.status(400).json({
        success: false,
        message: "Error in getDistributorByChannelId",
      });
    }

    const distributorCollections = await getWhapiCollections(distributor);

    if (!distributorCollections) {
      return res.status(500).json({
        success: false,
        message: "Error in getWhapiProducts",
      });
    }

    return res.status(200).json({
      message: "Product created successfully",
      data: distributorCollections,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error getDistributorCollections",
    });
  }
};

const updateDistributorCollection = async (req, res) => {
  try {
    const { collection, distributorChannelId, productsId } = req.body;

    const distributor = await getDistributorByChannelId(distributorChannelId);

    if (!distributor) {
      return res.status(400).json({
        success: false,
        message: "Error in getDistributorByChannelId",
      });
    }

    const updatedCollection = await updateWhapiCollection(
      collection,
      distributor,
      productsId
    );

    if (!updatedCollection) {
      return res.status(500).json({
        success: false,
        message: "Error updating collection in distributor",
      });
    }

    return res.status(200).json({
      message: "Collection updated successfully",
      data: updatedCollection,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error on updateDistributorCollection",
    });
  }
};

const createDistributorCollection = async (req, res) => {
  try {
    const { collectionName, distributorChannelId, productsId } = req.body;

    const distributor = await getDistributorByChannelId(distributorChannelId);

    if (!distributor) {
      return res.status(400).json({
        success: false,
        message: "Error in getDistributorByChannelId",
      });
    }

    const createdCollection = await createWhapiCollection(
      collectionName,
      distributor,
      productsId
    );

    if (!createdCollection) {
      return res.status(500).json({
        success: false,
        message: "Error updating collection in distributor",
      });
    }

    return res.status(200).json({
      message: "Collection updated successfully",
      data: createdCollection,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error on updateDistributorCollection",
    });
  }
};

module.exports = {
  updateDistributor,
  getDistributorOrders,
  createDistributorProduct,
  getDistributorProducts,
  getDistributorCollections,
  updateDistributorCollection,
  createDistributorCollection,
};
