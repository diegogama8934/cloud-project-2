import {
  S3Client,
  PutObjectCommand,
  ListObjectsCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import {
  AWS_BUCKET_NAME,
  AWS_BUCKET_REGION,
  AWS_BUCKET_PUBLIC_KEY,
  AWS_BUCKET_PRIVATE_KEY,
} from "./config.js";
import fs from "fs";

const bucket = new S3Client({
  region: AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: AWS_BUCKET_PUBLIC_KEY,
    secretAccessKey: AWS_BUCKET_PRIVATE_KEY,
  },
});

export async function uploadFile({ tempFilePath, name }) {
  const stream = fs.createReadStream(tempFilePath);
  const uploadParams = {
    Bucket: AWS_BUCKET_NAME,
    Key: name,
    Body: stream,
  };
  const command = new PutObjectCommand(uploadParams);
  return await bucket.send(command);
}

export async function getFiles() {
  const command = new ListObjectsCommand({
    Bucket: AWS_BUCKET_NAME,
  });
  return await bucket.send(command);
}

export async function getFile(filename) {
  const command = new GetObjectCommand({
    Bucket: AWS_BUCKET_NAME,
    Key: filename,
  });
  const result = await bucket.send(command);
  console.log(result);
}
