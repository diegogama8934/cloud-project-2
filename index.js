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
  console.log(req.file);
  const result = await uploadFile(req.file);

  try {
    // Lee los datos de la imagen de forma síncrona
    const imageData = fs.readFileSync(req.file.path);

    // Guarda la imagen original
    fs.writeFileSync('imagen_original.jpg', imageData);

    // Lee la clave desde el archivo
    const keyFilePath = "clave.txt";
    const key = fs.readFileSync(keyFilePath, "utf8").trim(); // Lee el contenido del archivo y elimina cualquier espacio en blanco

    // Convertir la clave hexadecimal en un búfer
    const keyBuffer = Buffer.from(key, "hex");

    // Función para encriptar una imagen utilizando AES
    function encryptImage(imageData, key) {
      // Crea un objeto de cifrado con la clave proporcionada
      const cipher = crypto.createCipheriv("aes-256-cbc", key, Buffer.alloc(16, 0));
      
      // Actualiza el cifrado con los datos de la imagen y finaliza
      const encryptedImage = Buffer.concat([cipher.update(imageData), cipher.final()]);
      
      // Devuelve la imagen encriptada
      return encryptedImage;
    }

    // Encriptar la imagen
    const encryptedImage = encryptImage(imageData, keyBuffer);

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

    // Subir la imagen encriptada al bucket de AWS S3
    const uploadResult = await uploadFile({
      path: "imagen_encriptada.jpg",
      originalname: "imagen_encriptada.jpg"
    });

    console.log("Imagen encriptada subida a S3:", uploadResult);

    // // Función para desencriptar una imagen utilizando AES
    // function decryptImage(encryptedImage, key) {
    //   try {
    //       // Crea un objeto de descifrado con la clave proporcionada
    //       const decipher = crypto.createDecipheriv("aes-256-cbc", key, Buffer.alloc(16, 0));
          
    //       // Actualiza el descifrado con los datos de la imagen encriptada y finaliza
    //       const decryptedImage = Buffer.concat([decipher.update(encryptedImage), decipher.final()]);
          
    //       // Devuelve la imagen desencriptada
    //       return decryptedImage;
    //   } catch (error) {
    //       console.error("Error al desencriptar la imagen:", error);
    //       return null;
    //   }
    // }

    // // Desencriptar la imagen
    // const decryptedImage = decryptImage(encryptedImage, keyBuffer);

    // // Guardar la imagen desencriptada
    // saveImageToFile(decryptedImage, "imagen_desencriptada.jpg");

    // Enviar respuesta al cliente
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al procesar la imagen');
  }
});



app.listen(port, () => {
  console.log("Server on port " + port);
});
