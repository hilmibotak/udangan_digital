require("dotenv").config({ path: ".env.local" });

const dns = require("dns");
const mongoose = require("mongoose");

dns.setServers(["8.8.8.8", "8.8.4.4"]);
dns.promises.setServers(["8.8.8.8", "8.8.4.4"]);

async function test() {
  try {
    console.log("MONGODB_URI tersedia:", Boolean(process.env.MONGODB_URI));

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI tidak ditemukan");
    }

    console.log("Testing MongoDB connection...");

    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "wedding_invitation",
      serverSelectionTimeoutMS: 15000,
    });

    console.log("================================");
    console.log("MONGODB CONNECTED SUCCESSFULLY");
    console.log("Database:", mongoose.connection.name);
    console.log("Host:", mongoose.connection.host);
    console.log("================================");

    await mongoose.connection.db.admin().ping();

    console.log("MongoDB ping: OK");

    await mongoose.disconnect();
  } catch (error) {
    console.log("================================");
    console.log("MONGODB CONNECTION FAILED");
    console.log("================================");
    console.error(error);
  }
}

test();