require('dotenv').config();
const { MongoClient, ObjectId } = require("mongodb");

if (!process.env.MONGODB_URL) throw new Error('Missing MONGODB_URL');
if (!process.env.DB_NAME) throw new Error('Missing DB_NAME');

const uri = process.env.MONGODB_URL;
const options = {};

let clientPromise;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  const client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

async function main() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);

    const chats = db.collection("chats");
    const messages = db.collection("messages");

    const now = new Date();

    // --- Условие 1: 2+ сообщения пользователя, последнее сообщение специалиста >1 час ---
    const chatIds1 = await messages.aggregate([
      { $match: { authorType: { $in: ["user", "specialist"] } } },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: "$chatId",
          userCount: { $sum: { $cond: [{ $eq: ["$authorType", "user"] }, 1, 0] } },
          lastSpecialist: { $last: { $cond: [{ $eq: ["$authorType", "specialist"] }, "$createdAt", null] } }
        }
      },
      {
        $match: {
          userCount: { $gte: 2 },
          lastSpecialist: { $lt: new Date(now.getTime() - 60 * 60 * 1000) } // 1 час
        }
      }
    ]).toArray();

    const ids1 = chatIds1.map(c => c._id);

    if (ids1.length > 0) {
      const res1 = await chats.updateMany(
        { _id: { $in: ids1 }, status: "open" },
        { $set: { status: "closed" } }
      );
      console.log(`✅ Closed ${res1.modifiedCount} chats (2+ user msgs, last specialist >1h)`);
    }

    // --- Условие 2: 1 сообщение пользователя, последний специалист >24 часа ---
    const chatIds2 = await messages.aggregate([
      { $match: { authorType: { $in: ["user", "specialist"] } } },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: "$chatId",
          userCount: { $sum: { $cond: [{ $eq: ["$authorType", "user"] }, 1, 0] } },
          lastSpecialist: { $last: { $cond: [{ $eq: ["$authorType", "specialist"] }, "$createdAt", null] } }
        }
      },
      {
        $match: {
          userCount: 1,
          lastSpecialist: { $lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } // 24 часа
        }
      }
    ]).toArray();

    const ids2 = chatIds2.map(c => c._id);

    if (ids2.length > 0) {
      const res2 = await chats.updateMany(
        { _id: { $in: ids2 }, status: "open" },
        { $set: { status: "closed" } }
      );
      console.log(`✅ Closed ${res2.modifiedCount} chats (1 user msg, last specialist >24h)`);
    }

    console.log(`✅ All done!`);
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    process.exit(0);
  }
}

main();
