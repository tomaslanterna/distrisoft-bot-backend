const pRetry = require("p-retry").default || require("p-retry");

const callGeminiWithRetry = async (model, contents) => {
  try {
    const result = await pRetry(
      async () => {
        return await model.generateContent(contents);
      },
      {
        retries: 3,
        minTimeout: 1000,
        maxTimeout: 5000,
        factor: 2,
        onFailedAttempt: (error) => {
          console.warn(
            `Fallo en comunicación con Gemini. Intento ${error.attemptNumber} falló. Error: ${error.message || error.status}. Quedan ${error.retriesLeft} reintentos.`,
          );
        },
      },
    );
    return result;
  } catch (error) {
    console.error("Error final tras agotar reintentos con Gemini:", error);
    throw new Error(
      "No pudimos analizar el vehículo tras varios intentos. Por favor, intenta subir las fotos de nuevo.",
    );
  }
};

module.exports = {
  callGeminiWithRetry,
};
