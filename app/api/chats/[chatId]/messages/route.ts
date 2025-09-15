import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/utils/auth';
import clientPromise from "@/lib/utils/db";
import { ObjectId } from 'mongodb';

export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { chatId } = params;
  if (!ObjectId.isValid(chatId)) {
    return new Response('Invalid chatId', { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME);

  const messages = await db
    .collection('messages')
    .find({ chatId: new ObjectId(chatId) })
    .sort({ createdAt: 1 })
    .toArray();

  return new Response(JSON.stringify(messages), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { chatId } = params;
  if (!ObjectId.isValid(chatId)) {
    return new Response('Invalid chatId', { status: 400 });
  }

  let body: { authorType?: string; content?: string; isPaid?: boolean, type?: string };
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { authorType, content, isPaid, type } = body;
  if (!['user', 'specialist'].includes(authorType!) || typeof content !== 'string') {
    return new Response('Invalid payload', { status: 400 });
  }

  // Логика списания токенов для пользователя с ролью user
  let shouldCheckTokens = false;
  let price = 0;
  if (authorType === 'user') {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);

    // Получаем пользователя по email из сессии
    const user = await db.collection('users').findOne({ email: session.user?.email });
    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    // Проверяем роль пользователя
    if (user.role === 'user') {
      shouldCheckTokens = true;
      if (type === 'initial-between') price = 590;
      else if (type === 'initial-vent') price = 490;
      else if (type === 'additional') price = 249;
      else return new Response('Invalid message type', { status: 400 });

      // Проверяем, хватает ли токенов
      if ((user.tokens ?? 0) < price) {
        return new Response('Not enough tokens', { status: 402 });
      }

      // Списываем токены
      await db.collection('users').updateOne(
        { email: session.user?.email },
        { $inc: { tokens: -price } }
      );
    }
  }

  const newMessage = {
    chatId: new ObjectId(chatId),
    authorType,
    content,
    isPaid: Boolean(isPaid),
    type,
    createdAt: new Date(),
  };

  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME);
  const result = await db.collection('messages').insertOne(newMessage);

  const inserted = { _id: result.insertedId, ...newMessage };

  return new Response(JSON.stringify(inserted), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}