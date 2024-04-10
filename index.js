import express from "express";
import multer from "multer";
import { getFiles, uploadFile, getFile } from "./s3.js";
import cors from "cors";
import fs from "fs";

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
    
  // Encriptar la imagen
  // Ya encriptada ejecutas uploadFile();

    // console.log(data);
    // console.log(typeof data);
    // console.log(btoa(data.toString()));
  });
  res.send(result);
});

app.listen(port, () => {
  console.log("Server on port " + port);
});
