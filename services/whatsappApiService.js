const axios = require("axios");

const WHAPI_URL = "https://gate.whapi.cloud";

async function sendWhapiMessage(to, message, distributor) {
  try {
    const distributorKey = distributor.key;
    const response = await axios.post(
      `${WHAPI_URL}/messages/text`,
      {
        to,
        body: message,
      },
      {
        headers: {
          Authorization: `Bearer ${distributorKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ Error enviando mensaje:",
      error.response?.data || error.message
    );
  }
}

async function getWhapiOrderDetail(order, distributor) {
  try {
    const distributorKey = distributor.key;

    const { data } = await axios.get(
      `${WHAPI_URL}/business/orders/${order.order_id}?order_token=${order.token}&token=${distributorKey}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return data.items;
  } catch (error) {
    console.error(
      "❌ Error enviando mensaje:",
      error.response?.data || error.message
    );
  }
}

async function createWhapiProduct(product, distributor) {
  try {
    const distributorKey = distributor.key;

    const response = await axios.post(
      `${WHAPI_URL}/business/products`,
      product,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          Authorization: `Bearer ${distributorKey}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ Error enviando mensaje:",
      error.response?.data || error.message
    );
  }
}

async function getWhapiProducts(distributor) {
  try {
    const distributorKey = distributor.key;

    const { data } = await axios.get(
      `${WHAPI_URL}/business/products?count=50`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${distributorKey}`,
        },
      }
    );

    return data;
  } catch (error) {
    console.error(
      "❌ Error enviando mensaje:",
      error.response?.data || error.message
    );
  }
}

async function getWhapiCollections(distributor) {
  try {
    const distributorKey = distributor.key;

    const { data } = await axios.get(
      `${WHAPI_URL}/business/collections?count=50`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${distributorKey}`,
        },
      }
    );

    return data;
  } catch (error) {
    console.error(
      "❌ Error enviando mensaje:",
      error.response?.data || error.message
    );
  }
}

async function updateWhapiCollection(collection, distributor, productId) {
  try {
    const distributorKey = distributor.key;
    const response = await axios.patch(
      `${WHAPI_URL}/business/collections/${collection.id}`,
      {
        body: {
          name: collection.name,
          add_products: [...productId],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${distributorKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ Error updating collection:",
      error.response?.data || error.message
    );
  }
}

async function createWhapiCollection(collectionName, distributor, productsId) {
  try {
    const distributorKey = distributor.key;
    const response = await axios.post(
      `${WHAPI_URL}/business/collections`,
      {
        body: {
          name: collectionName,
          products: productsId,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${distributorKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ Error creating collection:",
      error.response?.data || error.message
    );
  }
}

module.exports = {
  sendWhapiMessage,
  getWhapiOrderDetail,
  createWhapiProduct,
  getWhapiProducts,
  getWhapiCollections,
  updateWhapiCollection,
  createWhapiCollection,
};
