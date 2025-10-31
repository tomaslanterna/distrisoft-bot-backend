const {
  updateDistributorByPhone,
  getDistributorById,
} = require("../services/distributorService");
const { getOrdersByDistributorId } = require("../services/order.Service");

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

const getDistributorInfoById = async (req, res) => {
  try {
    const { distributorId } = req.query;

    if (!distributorId) {
      return res.status(403).json({ message: "DistributorId not found" });
    }

    const distributorInfo = await getDistributorById(distributorId);

    if (!distributorInfo) {
      return res.status(404).json({ message: "Error not found distributor" });
    }

    return res.status(200).json({
      message: "Orders in distributor",
      data: distributorInfo,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  updateDistributor,
  getDistributorOrders,
  getDistributorInfoById,
};
