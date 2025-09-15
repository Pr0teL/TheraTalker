// файл: например app/api/purchase-tokens/route.ts или pages/api/purchase-tokens.ts
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";
import clientPromise from "@/lib/utils/db";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
  }

  // Парсинг тела
  const body = await req.json();
  const { amount } = body;

  if (typeof amount !== "number" || amount <= 0) {
    return new Response(JSON.stringify({ error: "Invalid amount" }), { status: 400 });
  }

  // Получаем пользователя из БД
  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME);
  const usersColl = db.collection("users");

  const user = await usersColl.findOne({ email: session.user.email });

  if (!user) {
    return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
  }

  // Обновляем поле tokens — увеличиваем на amount
  const updateResult = await usersColl.updateOne(
    { _id: user._id },
    { $inc: { tokens: amount } }
  );

  if (updateResult.modifiedCount !== 1) {
    return new Response(JSON.stringify({ error: "Could not update tokens" }), { status: 500 });
  }

  // Можно вернуть новое значение токенов, если нужно
  const updatedUser = await usersColl.findOne({ _id: user._id }, { projection: { tokens: 1 } });

  return new Response(
    JSON.stringify({
      success: true,
      tokens: updatedUser?.tokens ?? null,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
