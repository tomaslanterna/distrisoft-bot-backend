const { getClientById } = require("../services/clientService");
const {} = require("../services/distributorService");
const {
  getOrderByObjectId,
  updateOrderStatusByOrderId,
} = require("../services/order.Service");

const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.query;

    if (!orderId) {
      return res.status(403).json({ message: "OrderId not found" });
    }

    const order = await getOrderByObjectId(orderId);

    if (!order) {
      return res.status(404).json({ message: "Error order not found" });
    }

    const clientOrder = await getClientById(order.client.id);

    if (!clientOrder) {
      return res
        .status(500)
        .json({ message: "Internal Server Error on obtain client order" });
    }

    const mapedOrder = { ...order, client: clientOrder };

    return res.status(200).json({
      message: "Orders in distributor",
      data: mapedOrder,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateOrderStatusById = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    if (!orderId || !status) {
      return res.status(403).json({ message: "OrderId or status not found" });
    }

    const updatedOrder = await updateOrderStatusByOrderId(orderId, status);

    if (!updatedOrder) {
      return res.status(404).json({ message: "Error order not updated" });
    }

    return res.status(200).json({
      message: "Orders in distributor",
      data: updatedOrder,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getOrderById,
  updateOrderStatusById,
};
