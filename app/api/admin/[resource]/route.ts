import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";
import clientPromise from "@/lib/utils/db";
import { ObjectId } from "mongodb";

const ALLOWED_COLLECTIONS = process.env.ALLOWED_COLLECTIONS?.split(",").map(s => s.trim()) ?? [];

if (ALLOWED_COLLECTIONS.length === 0) {
    console.warn("⚠️ ALLOWED_COLLECTIONS is empty or not set in .env");
}

function getSafeCollection(name: string) {
  return ALLOWED_COLLECTIONS.includes(name) ? name : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { resource: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    return new Response(JSON.stringify({ error: "Access denied" }), { status: 403 });
  }

  const collectionName = getSafeCollection(params.resource);
  if (!collectionName) {
    return new Response(JSON.stringify({ error: "Invalid resource" }), { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const sortField = searchParams.get("sort");
  const sortOrder = searchParams.get("order") === "desc" ? -1 : 1;

  // Фильтр
  const filter: Record<string, any> = {};

  // Обрабатываем специальные параметры field и q для универсального поиска
  const field = searchParams.get("field");
  const q = searchParams.get("q");

  if (field && q) {
    const orFilter = [];

    // Поиск по строке (регэксп)
    orFilter.push({ [field]: { $regex: q, $options: "i" } });

    // Число
    const qNumber = Number(q);
    if (!isNaN(qNumber)) {
      orFilter.push({ [field]: qNumber });
    }

    // Булево
    if (q.toLowerCase() === "true") {
      orFilter.push({ [field]: true });
    } else if (q.toLowerCase() === "false") {
      orFilter.push({ [field]: false });
    }

    // Дата
    const qDate = new Date(q);
    if (!isNaN(qDate.getTime())) {
      orFilter.push({ [field]: qDate });
    }

    // ObjectId
    if (/^[0-9a-fA-F]{24}$/.test(q)) {
      try {
        orFilter.push({ [field]: new ObjectId(q) });
      } catch {
        // ignore
      }
    }

    filter["$or"] = orFilter;
  } else {
    // Если нет field и q, то собираем фильтр из всех остальных параметров (например для точного совпадения)
    searchParams.forEach((value, key) => {
      if (!["page", "limit", "sort", "order", "field", "q"].includes(key)) {
        filter[key] = value;
      }
    });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection(collectionName);

    const cursor = collection
      .find(filter)
      .sort(sortField ? { [sortField]: sortOrder } : {})
      .skip(skip)
      .limit(limit);

    const items = await cursor.toArray();
    const total = await collection.countDocuments(filter);

    return new Response(
      JSON.stringify({
        data: items,
        page,
        limit,
        total,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
