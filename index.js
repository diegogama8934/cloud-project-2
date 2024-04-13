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

  const imageData = await fs.readFile(req.file.path, (err, data) => {
    if (err) {
      console.error(err);
      return;
    }

    fs.writeFile('imagen_original.jpg', req.file.buffer, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error al guardar la imagen');
        return;
      }
    
      // Lee la clave desde el archivo
      const keyFilePath = "clave.txt";
      const key = fs.readFileSync(keyFilePath, "utf8").trim(); // Lee el contenido del archivo y elimina cualquier espacio en blanco

      // Convertir la clave hexadecimal en un búfer
      const keyBuffer = Buffer.from(key, "hex");

      // Función para leer una imagen desde el sistema de archivos
      function readImageFromFile(filePath) {
          try {
              // Lee los datos de la imagen desde el archivo
              const imageData = fs.readFileSync(filePath);
              return imageData;
          } catch (error) {
              console.error("Error al leer la imagen:", error);
              return null;
          }
      }

      // Función para encriptar una imagen utilizando AES
      function encryptImage(imageData, key) {
          // Crea un objeto de cifrado con la clave proporcionada
          const cipher = crypto.createCipheriv("aes-256-cbc", key, Buffer.alloc(16, 0));
          
          // Actualiza el cifrado con los datos de la imagen y finaliza
          const encryptedImage = Buffer.concat([cipher.update(imageData), cipher.final()]);
          
          // Devuelve la imagen encriptada
          return encryptedImage;
      }

      // Función para guardar una imagen en el sistema de archivos
      function saveImageToFile(imageData, fileName) {
          try {
              fs.writeFileSync(fileName, imageData);
              console.log("Imagen encriptada guardada como:", fileName);
          } catch (error) {
              console.error("Error al guardar la imagen encriptada:", error);
          }
      }

      // Ejemplo de uso
      const imagePath = "imagen_original.jpg"; // Ruta de la imagen en tu sistema de archivos
      const image = readImageFromFile(imagePath);

      if (image) {
          console.log("Imagen leída con éxito.");
          
          // Guarda la imagen encriptada en el sistema de archivos
          const encryptedImagePath = "imagen_encriptada.jpg";
          const encryptedImage = encryptImage(image, keyBuffer);
          saveImageToFile(encryptedImage, encryptedImagePath);
      } else {
          console.log("No se pudo leer la imagen.");
      }

      //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      // Función para desencriptar una imagen utilizando AES
      function decryptImage(encryptedImage, key) {
          try {
              // Crea un objeto de descifrado con la clave proporcionada
              const decipher = crypto.createDecipheriv("aes-256-cbc", key, Buffer.alloc(16, 0));
              
              // Actualiza el descifrado con los datos de la imagen encriptada y finaliza
              const decryptedImage = Buffer.concat([decipher.update(encryptedImage), decipher.final()]);
              
              // Devuelve la imagen desencriptada
              return decryptedImage;
          } catch (error) {
              console.error("Error al desencriptar la imagen:", error);
              return null;
          }
      }

      // Ejemplo de uso
      const encryptedImagePath = "imagen_encriptada.jpg"; // Ruta de la imagen encriptada en tu sistema de archivos

      // Lee los datos de la imagen encriptada desde el archivo
      const encryptedImage = fs.readFileSync(encryptedImagePath);

      // Desencripta la imagen utilizando la clave
      const decryptedImage = decryptImage(encryptedImage, keyBuffer);

      if (decryptedImage) {
          // Guarda la imagen desencriptada en el sistema de archivos
          const decryptedImagePath = "imagen_desencriptada.jpg";
          saveImageToFile(decryptedImage, decryptedImagePath);
      } else {
          console.log("No se pudo desencriptar la imagen.");
      }


  // Encriptar la imagen
  // Ya encriptada ejecutas uploadFile();
    // console.log("si llega")
    // console.log(data);
    // console.log(typeof data);
    // console.log(btoa(data.toString()));
  });
  res.send(result);
});


// app.post("/images", upload.single("image"), async (req, res) => {
//   console.log(req.file);
//   const result = await uploadFile(req.file);

//   try {
//     const imageData = await new Promise((resolve, reject) => {
//       fs.readFile(req.file.path, (err, data) => {
//         if (err) {
//           console.error(err);
//           reject(err);
//         } else {
//           resolve(data);
//         }
//       });
//     });

//     // Encriptar la imagen  
//     const cipher = crypto.createCipher("aes-256-cbc", "clave-secreta");
//     let encryptedData = Buffer.concat([
//       cipher.update(imageData),
//       cipher.final(),
//     ]);

//     const originalFilename = req.file.originalname;
//     const encryptedFilename = "encriptado_" + originalFilename;

//     // Guardar el archivo encriptado en la carpeta local
//     fs.writeFileSync(`./uploads/${encryptedFilename}`, encryptedData);

//     // Subir el archivo encriptado al bucket de S3
//     const encryptedFileResult = await uploadFile({
//       ...req.file,
//       originalname: encryptedFilename,
//       path: `./uploads/${encryptedFilename}`,
//     });

//     res.send({
//       originalFileUploadResult: result,
//       encryptedFileUploadResult: encryptedFileResult,
//     });
//   } catch (error) {
//     res.status(500).json({ error: "Error al procesar el archivo" });
//   }
// });


app.listen(port, () => {
  console.log("Server on port " + port);
});
