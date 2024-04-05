import express from "express";
import fileUpload from "express-fileupload";
import { getFiles, uploadFile, getFile } from "./s3.js";

const app = express();
const port = 5910;

app.use(fileUpload({ useTempFiles: true, tempFileDir: "./uploads" }));

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

app.post("/images", async (req, res) => {
  const result = await uploadFile(req.files.image);
  res.json({ result });
});

app.listen(port, () => {
  console.log("Server on port " + port);
});
