// scripts/update.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URL;

async function main() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(); // если база указана в URI, то db() её подхватит
    const users = db.collection("users");

    const allUsers = await users.find({}).toArray();

    console.log(`👥 Found ${allUsers.length} users:`);
    console.log(allUsers);
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await client.close();
  }
}

main();
