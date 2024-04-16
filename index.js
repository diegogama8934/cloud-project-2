import express from "express";
import multer from "multer";
import { getFiles, uploadFile, getFile } from "./s3.js";
import cors from "cors";
import fs from "fs";
import crypto from "crypto";

const app = express();
const port = 5910;
const upload = multer({ dest: "./uploads" });

app.use(cors());

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the S3 server" });
});

app.get("/images", async (req, res) => {
  const result = await getFiles();
  res.json(result.Contents);
});

app.get("/images/:filename", async (req, res) => {
  const result = getFile(req.params.filename);
  res.send(result);
});

app.post("/images", upload.single("image"), async (req, res) => {
  try {
    console.log(req.file);
    const result = await uploadFile(req.file);

    // Lee los datos de la imagen de forma síncrona
    const imageData = fs.readFileSync(req.file.path);

    // Guarda la imagen original
    fs.writeFileSync("imagen_original.jpg", imageData);

    // Define la clave de encriptación
    const key = "0123456789abcdef0123456789abcdef";

    // Función para encriptar una imagen utilizando AES
    function encryptImage(imageData, key) {
      // Crea un objeto de cifrado con la clave proporcionada
      const cipher = crypto.createCipheriv(
        "aes-256-cbc",
        key,
        Buffer.alloc(16, 0)
      );

      // Actualiza el cifrado con los datos de la imagen y finaliza
      const encryptedImage = Buffer.concat([
        cipher.update(imageData),
        cipher.final(),
      ]);

      // Devuelve la imagen encriptada
      return encryptedImage;
    }

    // Encriptar la imagen
    const encryptedImage = encryptImage(imageData, key);

    // Función para guardar la imagen encriptada en un archivo
    function saveImageToFile(imageData, fileName) {
      try {
        fs.writeFileSync(fileName, imageData);
        console.log("Imagen encriptada guardada como:", fileName);
      } catch (error) {
        console.error("Error al guardar la imagen encriptada:", error);
      }
    }

    // Guardar la imagen encriptada
    saveImageToFile(encryptedImage, "imagen_encriptada.jpg");

    // Convertir la imagen encriptada a una cadena de texto base64
    const encryptedImageString = encryptedImage.toString("base64");

    // Enviar la imagen encriptada como cadena de texto al cliente
    res.send(encryptedImageString);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al procesar la imagen");
  }
});

app.post("/example", (req, res) => {
  try {
    res.send("Hola");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error en la peticion");
  }
});

app.listen(port, () => {
  console.log("Server on port " + port);
});
