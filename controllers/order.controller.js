const { default: mongoose } = require("mongoose");
const { buildOrder } = require("../builders/order.builder");
const { getClientById } = require("../services/clientService");
const { getDistributorByChannelId } = require("../services/distributorService");
const {
  getOrderByObjectId,
  updateOrderStatusByOrderId,
  createOrder,
} = require("../services/order.Service");
const { v4: uuidv4 } = require("uuid");

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

const createOrderByDistributor = async (req, res) => {
  try {
    const { order, distributorChannelId, clientName, spaceBusiness } = req.body;
    const date = new Date().toISOString();
    const orderDate = new Date(date);

    if (!order) {
      return res.status(403).json({ message: "Order not found" });
    }

    const distributor = await getDistributorByChannelId(distributorChannelId);

    if (!distributor) {
      return res.status(400).json({
        success: false,
        message: "Error in getDistributorByChannelId",
      });
    }

    const parsedOrder = buildOrder(order, order.items);
    const clientId = new mongoose.Types.ObjectId();
    const orderId = uuidv4();

    const createdOrder = await createOrder({
      message: parsedOrder.message,
      date: orderDate,
      client: { id: clientId, name: clientName },
      orderWppId: orderId,
      products: parsedOrder.products,
      total: parsedOrder.total,
      distributor: distributor._id,
      spaceBusiness,
    });

    if (!createdOrder) {
      return res.status(500).json({
        success: false,
        message: "Error creating order in createOrder",
      });
    }

    return res.status(200).json({
      message: "Order created successfully",
      data: { createdOrder },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error on create order" });
  }
};

module.exports = {
  getOrderById,
  updateOrderStatusById,
  createOrderByDistributor,
};
