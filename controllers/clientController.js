const { bulkCreate } = require("../services/clientService");

const bulkClientsController = async (req, res) => {
  try {
    const { clients } = req.body;

    if (!Array.isArray(clients) || clients.length === 0) {
      return res
        .status(400)
        .json({ message: "Se requiere un array de clientes válido." });
    }

    const clientsToCreate = clients.filter(
      (client) =>
        client.phone != null && client.address != "" && client.ubication != ""
    );

    const result = await bulkCreate(clientsToCreate);

    return res.status(200).json({
      message: "Clientes procesados correctamente.",
      result,
    });
  } catch (error) {
    console.error("Error en bulkClientsController:", error);
    return res.status(500).json({
      message: "Ocurrió un error al procesar los clientes.",
      error: error.message,
    });
  }
};

module.exports = {
  bulkClientsController,
};
