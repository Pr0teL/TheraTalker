import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/utils/auth';
import clientPromise from "@/lib/utils/db";
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return new Response('Unauthorized', { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);

    // Получаем параметр status
    const statusParam = req.nextUrl.searchParams.get("status");

    // Базовый фильтр — всегда фильтруем по email
    const filter: any = { userEmail: session.user.email };

    // Если передан статус — добавляем в фильтр
    if (statusParam) {
        filter.status = statusParam;
    }

    const chats = await db
        .collection('chats')
        .find(filter)
        .sort({ createdAt: -1 })
        .toArray();

    const chatIds = chats.map(chat => new ObjectId(chat._id));

    const lastMessages = await db
        .collection('messages')
        .aggregate([
            { $match: { chatId: { $in: chatIds } } },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: '$chatId',
                    lastMessage: { $first: '$content' },
                    lastAuthorType: { $first: '$authorType' },
                    lastCreatedAt: { $first: '$createdAt' },
                },
            },
        ])
        .toArray();

    const lastMessageMap = new Map(
        lastMessages.map(msg => [msg._id.toString(), msg])
    );

    const enrichedChats = chats.map(chat => {
        const last = lastMessageMap.get(chat._id.toString());
        return {
            ...chat,
            lastMessage: last?.lastMessage ?? null,
            lastCreatedAt: last?.lastCreatedAt ?? chat.createdAt,
            lastAuthorType: last?.lastAuthorType ?? null,
        };
    });

    return new Response(JSON.stringify(enrichedChats), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}



export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body: { mode?: string };
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { mode } = body;
  if (!['between', 'vent'].includes(mode!)) {
    return new Response('Invalid mode', { status: 400 });
  }

  const userEmail = session.user?.email;

  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME);

  // Получаем пользователя по email
  const user = await db.collection('users').findOne({ email: userEmail });
  if (!user) {
    return new Response('User not found', { status: 404 });
  }

  // Проверяем токены только если роль "user"
  if (user.role === 'user') {
    let minTokens = 0;
    if (mode === 'between') minTokens = 590;
    else if (mode === 'vent') minTokens = 490;

    if ((user.tokens ?? 0) < minTokens) {
      return new Response('Not enough tokens', { status: 402 });
    }
  }

  const newChat = {
    userEmail,
    mode,
    status: 'open' as const,
    createdAt: new Date(),
  };

  const result = await db.collection('chats').insertOne(newChat);

  const inserted = { _id: result.insertedId, ...newChat };

  return new Response(JSON.stringify(inserted), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}