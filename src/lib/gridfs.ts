import "server-only";

import { GridFSBucket, ObjectId, type Db } from "mongodb";
import { connectDB } from "@/lib/mongodb";

const BUCKET_NAME = "media";

async function getDatabase(): Promise<Db> {
  const mongoose = await connectDB();
  const client = mongoose.connection.getClient();
  return client.db("wedding_invitation") as unknown as Db;
}

export async function getGridFSBucket() {
  return new GridFSBucket(await getDatabase(), { bucketName: BUCKET_NAME });
}

export function parseGridFSFileId(value: string) {
  return ObjectId.isValid(value) ? new ObjectId(value) : null;
}

export async function uploadFileToGridFS(
  buffer: Buffer,
  options: {
    filename: string;
    contentType: string;
    metadata: Record<string, string>;
  }
) {
  const bucket = await getGridFSBucket();
  return new Promise<ObjectId>((resolve, reject) => {
    const upload = bucket.openUploadStream(options.filename, { metadata: options.metadata });
    upload.once("error", reject);
    upload.once("finish", () => resolve(upload.id as ObjectId));
    upload.end(buffer);
  });
}

export async function getFileFromGridFS(fileId: ObjectId) {
  const bucket = await getGridFSBucket();
  const files = await bucket.find({ _id: fileId }).toArray();
  return files[0] ?? null;
}

export async function deleteFileFromGridFS(fileId: ObjectId) {
  const bucket = await getGridFSBucket();
  await bucket.delete(fileId);
}
