const { v4: uuidv4 } = require("uuid");

/**
 * Parsea un mensaje de pedido de WhatsApp Business
 * @param {string} body - Texto recibido en el Body del mensaje
 * @returns {object|null} - Objeto order o null si no es un mensaje de pedido
 */
const buildOrderMessage = (body) => {
  if (!body || !body.toLowerCase().includes("pedido")) {
    return null;
  }

  const lines = body.split("\n").map((line) => line.trim());
  const productLines = lines.filter((line) =>
    /^\d+x\s.+\s[—-]\s?\$\d+/.test(line)
  );
  const totalLine = lines.find((line) =>
    line.toLowerCase().startsWith("total")
  );

  const products = productLines
    .map((line) => {
      const match = line.match(/^(\d+)x\s(.+?)\s[—-]\s?\$(\d+)/);
      if (!match) return null;

      const [, qty, name, price] = match;
      const quantity = parseInt(qty, 10);
      const unitPrice = parseFloat(price);
      return {
        name,
        quantity,
        unitPrice,
        subtotal: quantity * unitPrice,
      };
    })
    .filter(Boolean);

  const total =
    totalLine?.match(/\$([\d.]+)/)?.[1] ??
    products.reduce((acc, p) => acc + p.subtotal, 0);

  const order = {
    orderId: uuidv4(),
    products,
    total: parseFloat(total),
  };

  return order;
};

const buildOrder = (orderFromMessage) => {
  if (!orderFromMessage) return {};
  
  const order = {
    orderId: uuidv4(),
    products: [],
    total: parseFloat(orderFromMessage.total_price),
  };
  return order;
};

module.exports = { buildOrderMessage, buildOrder };
