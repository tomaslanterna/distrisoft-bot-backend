const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const pRetry = require("p-retry").default || require("p-retry");

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

/**
 * Sube un buffer a S3 con reintentos.
 * @param {Buffer} buffer - Contenido del archivo
 * @param {string} key - Ruta/Nombre en el bucket
 * @param {string} contentType - Tipo de contenido (ej: image/webp)
 * @returns {Promise<string>} - La key del objeto subido
 */
const uploadToS3 = async (buffer, key, contentType) => {
  return await pRetry(
    async () => {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });
      await s3Client.send(command);
      return key;
    },
    {
      retries: 2,
      onFailedAttempt: (error) => {
        console.warn(
          `Fallo al subir a S3 (${key}). Intento ${error.attemptNumber}. Error: ${error.message}`,
        );
      },
    },
  );
};

/**
 * Genera una URL firmada para visualizar un objeto de forma privada.
 * @param {string} key - La key del objeto en S3
 * @param {number} expiresIn - Tiempo de expiración en segundos (default 1 hora)
 * @returns {Promise<string>} - URL firmada
 */
const generateViewUrl = async (key, expiresIn = 3600) => {
  if (!key) return null;
  // Si ya es una URL completa (legacy), devolverla tal cual?
  if (key.startsWith("http")) return key;

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error(`Error generando URL firmada para ${key}:`, error);
    return null;
  }
};

/**
 * Obtiene el stream de un objeto desde S3.
 * @param {string} key - La key del objeto en S3
 * @returns {Promise<ReadableStream>} - Stream del objeto
 */
const getObjectStream = async (key) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  const response = await s3Client.send(command);
  return response.Body;
};

module.exports = {
  uploadToS3,
  generateViewUrl,
  getObjectStream,
};
