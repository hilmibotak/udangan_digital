import mongoose from "mongoose";
import * as dns from "node:dns";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cache =
  globalForMongoose.mongooseCache ??= {
    conn: null,
    promise: null,
  };

// Paksa DNS biasa dan DNS Promise menggunakan Google DNS.
dns.setServers(["8.8.8.8", "8.8.4.4"]);
dns.promises.setServers(["8.8.8.8", "8.8.4.4"]);

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn && mongoose.connection.readyState === 1) {
    return cache.conn;
  }

  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    throw new Error(
      "MONGODB_URI belum diatur. Tambahkan URI MongoDB Atlas ke .env.local."
    );
  }

  console.log("MongoDB URI tersedia:", Boolean(uri));
  console.log("MongoDB DNS:", "8.8.8.8 / 8.8.4.4");

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(uri, {
        dbName: "wedding_invitation",
        bufferCommands: false,
        serverSelectionTimeoutMS: 15000,
      })
      .then((connection) => {
        console.log(
          "MongoDB connected:",
          connection.connection.name
        );

        return connection;
      })
      .catch((error: unknown) => {
        cache.promise = null;
        throw error;
      });
  }

  cache.conn = await cache.promise;

  return cache.conn;
}

export function safeDatabaseError(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : "Unknown MongoDB error";

  return message.replace(
    /mongodb(?:\+srv)?:\/\/[^\s"']+/gi,
    "[MongoDB URI redacted]"
  );
}