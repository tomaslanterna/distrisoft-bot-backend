require("dotenv").config({ path: ".env.development" });
const { uploadToS3, generateViewUrl } = require("../services/s3.service");
const fs = require("fs");
const path = require("path");

async function testS3() {
  console.log("--- Iniciando Test de S3 ---");

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_BUCKET_NAME) {
    console.error("ERROR: Faltan variables de entorno AWS en .env.development");
    return;
  }

  const testBuffer = Buffer.from("Hola S3, este es un test de integración.");

  try {
    console.log(`1. Subiendo archivo a: ${testKey}...`);
    await uploadToS3(testBuffer, testKey, "text/plain");
    console.log("✅ Subida exitosa.");

    console.log("2. Generando URL firmada...");
    const url = await generateViewUrl(testKey, 60); // 60 segundos
    console.log("✅ URL generada con éxito:");
    console.log(url);
    console.log(
      "\nCopia y pega esa URL en tu navegador para verificar el contenido.",
    );
  } catch (error) {
    console.error("❌ Fallo en el test:", error);
  }
}

testS3();
