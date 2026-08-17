import { MongoClient } from "mongodb";

let client;
let database;

export async function connectDB() {
  if (database) return database;
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing");

  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  database = client.db(process.env.DB_NAME || "ideavault");

  await Promise.all([
    database.collection("users").createIndex({ email: 1 }, { unique: true }),
    database.collection("ideas").createIndex({ creatorEmail: 1, createdAt: -1 }),
    database.collection("comments").createIndex({ ideaId: 1, createdAt: -1 }),
    database.collection("comments").createIndex({ userEmail: 1, createdAt: -1 }),
  ]);

  return database;
}
