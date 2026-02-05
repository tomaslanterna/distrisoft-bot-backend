const {
  updateDistributorByPhone,
  getDistributorByChannelId,
} = require("../services/distributorService");
const { getOrdersByDistributorId } = require("../services/order.Service");
const {
  createProductDb,
  getProductById,
  getProductsByDistributorId,
} = require("../services/product.service");
const {
  createCollectionDb,
  getCollectionsDb,
  updateCollectionDb,
  deleteCollectionDb,
} = require("../services/collection.service");
const {
  createWhapiProduct,
  getWhapiProducts,
  getWhapiCollections,
  createWhapiCollection,
  updateWhapiCollection,
  deleteWhapiCollection,
} = require("../services/whatsappApiService");
const { registerUser } = require("../services/auth.service");
const fs = require("fs");
const User = require("../models/User");
const { Inspection } = require("../models/Inspection");
const { Reinspection } = require("../models/Reinspection");

const getDistributorUsersStats = async (req, res) => {
  try {
    const { distributorId } = req.user;

    if (!distributorId) {
      return res
        .status(403)
        .json({ message: "Distributor ID not found in token" });
    }

    const users = await User.find({ distributor: distributorId });

    const usersStats = await Promise.all(
      users.map(async (user) => {
        const inspectionsCount = await Inspection.countDocuments({
          inspectorId: user._id,
        });

        const reinspectionsCount = await Reinspection.countDocuments({
          inspectorId: user._id,
        });

        // "Autos ingresaron" approximation: Unique vehicles inspected by this user
        // Using aggregation to count distinct vehicleIds for this inspector
        const uniqueVehicles = await Inspection.distinct("vehicleId", {
          inspectorId: user._id,
        });

        return {
          id: user._id,
          username: user.username,
          role: user.role,
          stats: {
            inspectionsCreated: inspectionsCount,
            reinspectionsPerformed: reinspectionsCount,
            vehiclesEntered: uniqueVehicles.length,
          },
        };
      }),
    );

    return res.status(200).json({
      success: true,
      data: usersStats,
    });
  } catch (error) {
    console.error("Error in getDistributorUsersStats:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error fetching user stats",
    });
  }
};

const updateDistributor = async (req, res) => {
  try {
    const { distributor } = req.body;

    if (!distributor) {
      return res.status(404).json({ message: "Distributor not found" });
    }

    const validClients = distributor.clients.filter(
      (client) =>
        client.phone != null && client.address != "" && client.ubication != "",
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
    let createdWhapiProduct;
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

    if (distributor.type === "distributor") {
      createdWhapiProduct = await createWhapiProduct(productAux, distributor);
    }

    const createdProduct = await createProductDb({
      ...productAux,
      distributor: distributor._id,
      id: product.product_retailer_id,
    });

    if (!createdProduct) {
      return res.status(500).json({
        success: false,
        message: "Error creating product in distributor",
      });
    }

    return res.status(200).json({
      message: "Product created successfully",
      data: { createdProduct, createdWhapiProduct },
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
    let distributorProducts;
    let dbProducts;

    if (!distributor) {
      return res.status(400).json({
        success: false,
        message: "Error in getDistributorByChannelId",
      });
    }

    if (distributor.type == "distributor") {
      distributorProducts = await getWhapiProducts(distributor);
    } else {
      dbProducts = await getProductsByDistributorId(distributor._id);
      distributorProducts = {
        products: dbProducts,
        count: dbProducts.length,
        total: 0,
        offset: 0,
      };
    }

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

const decorateCollections = async (collections) => {
  const decoratedCollections = await Promise.all(
    collections.map(async (collection) => {
      const products = await Promise.all(
        collection.productsIds.map(async (productId) => {
          try {
            const productData = await getProductById(productId);
            return productData;
          } catch (err) {
            console.error(`Error al obtener producto ${productId}:`, err);
            return null; // o podrías filtrar los nulls más adelante
          }
        }),
      );

      return {
        id: collection.id,
        name: collection.name,
        products,
        status: "",
      };
    }),
  );

  return {
    collections: decoratedCollections,
    count: decoratedCollections.length,
    total: 0,
    offset: 0,
  };
};

const getDistributorCollections = async (req, res) => {
  try {
    const { distributorChannelId } = req.query;
    let distributorCollections;
    let distributorCollectionsBase;
    const distributor = await getDistributorByChannelId(distributorChannelId);

    if (!distributor) {
      return res.status(400).json({
        success: false,
        message: "Error in getDistributorByChannelId",
      });
    }

    if (distributor.type === "distributor") {
      distributorCollections = await getWhapiCollections(distributor);
    } else {
      distributorCollectionsBase = await getCollectionsDb(distributor._id);
      distributorCollections = await decorateCollections(
        distributorCollectionsBase,
      );
    }

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
    let updatedCollection;

    if (!distributor) {
      return res.status(400).json({
        success: false,
        message: "Error in getDistributorByChannelId",
      });
    }

    if (distributor.type === "distributor") {
      updatedCollection = await updateWhapiCollection(
        collection,
        distributor,
        productsId,
      );
    } else {
      updatedCollection = await updateCollectionDb(
        collection,
        distributor._id,
        productsId,
      );
    }

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
    const {
      collectionName,
      distributorChannelId,
      productsId,
      productsRetailersIds,
    } = req.body;
    let createdCollection;

    const distributor = await getDistributorByChannelId(distributorChannelId);

    if (!distributor) {
      return res.status(400).json({
        success: false,
        message: "Error in getDistributorByChannelId",
      });
    }

    if (distributor.type == "distributor") {
      createdCollection = await createWhapiCollection(
        collectionName,
        distributor,
        productsId,
      );
    } else {
      createdCollection = await createCollectionDb({
        name: collectionName,
        distributor: distributor._id,
        productsIds: productsId,
      });
    }

    if (!createdCollection) {
      return res.status(500).json({
        success: false,
        message: "Error updating collection in distributor",
      });
    }

    return res.status(200).json({
      message: "Collection updated successfully",
      data: { createdCollection },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error on updateDistributorCollection",
    });
  }
};

const deleteDistributorCollection = async (req, res) => {
  try {
    const { collectionName, distributorChannelId, collectionId } = req.body;

    let deletedCollection = null;

    const distributor = await getDistributorByChannelId(distributorChannelId);

    if (!distributor) {
      return res.status(400).json({
        success: false,
        message: "Error in getDistributorByChannelId",
      });
    }

    if (distributor.type === "distributor") {
      deletedCollection = await deleteWhapiCollection(
        collectionId,
        distributor,
      );
    } else {
      deletedCollection = await deleteCollectionDb(
        collectionName,
        distributor._id,
      );
    }

    if (!deletedCollection) {
      return { success: false, message: "Collection not found" };
    }

    return res.status(200).json({
      message: "Collection deleted successfully",
      data: deletedCollection,
    });
  } catch (error) {
    console.error("Error deleting collection:", error);
    throw error;
  }
};

const uploadDistributorImages = async (req, res) => {
  try {
    const { cloudinary, body } = req;
    const { files } = body;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No images provided" });
    }

    // Subir cada imagen a Cloudinary
    const uploadPromises = files.map((file) =>
      cloudinary.uploader.upload(file.path, {
        folder: "servizio", // opcional: nombre de carpeta en Cloudinary
      }),
    );

    const results = await Promise.all(uploadPromises);

    // Borrar archivos temporales locales
    files.forEach((file) => fs.unlinkSync(file.path));

    // Enviar URLs resultantes
    res.json({
      message: "Images uploaded successfully",
      images: results.map((r) => r.secure_url),
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Error uploading images" });
  }
};

const createDistributorUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const {
      role: requesterRole,
      distributorId,
      distributorChannelId,
    } = req.user;

    // Check if requester is admin
    if (requesterRole !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Acceso denegado. Solo los administradores pueden crear usuarios.",
      });
    }

    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos obligatorios: username, password, role.",
      });
    }

    const newUser = await registerUser({
      username,
      password,
      role,
      distributorChannelId,
      distributor: distributorId,
    });

    return res.status(201).json({
      success: true,
      message: "Usuario creado exitosamente.",
      data: {
        id: newUser._id,
        username: newUser.username,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Error in createDistributorUser:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error interno al crear usuario.",
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
  deleteDistributorCollection,
  uploadDistributorImages,
  getDistributorUsersStats,
  createDistributorUser,
};
