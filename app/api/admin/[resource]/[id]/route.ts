import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";
import clientPromise from "@/lib/utils/db";
import {
    ObjectId,
    Decimal128,
    Long,
    Double,
    Int32,
    Binary,
    Timestamp,
    BSONRegExp,
    UUID,
    Code,
    DBRef,
    MinKey,
    MaxKey
} from "mongodb";

// Разрешённые коллекции
const ALLOWED_COLLECTIONS = process.env.ALLOWED_COLLECTIONS?.split(",").map(s => s.trim()) ?? [];

if (ALLOWED_COLLECTIONS.length === 0) {
    console.warn("⚠️ ALLOWED_COLLECTIONS is empty or not set in .env");
}

function getSafeCollection(name: string) {
    return ALLOWED_COLLECTIONS.includes(name) ? name : null;
}

function isValidObjectId(id: any): boolean {
    try {
        return ObjectId.isValid(id) && (new ObjectId(id)).toString() === id.toString();
    } catch {
        return false;
    }
}

// Конвертация типов для PATCH с поддержкой ObjectId
function convertToSameType(originalValue: any, newValue: any): any {
    if (originalValue === null || originalValue === undefined) return newValue;

    if (originalValue instanceof ObjectId) {
        if (typeof newValue === "string" && ObjectId.isValid(newValue)) return new ObjectId(newValue);
        throw new Error("Invalid ObjectId");
    }

    if (originalValue instanceof Date) {
        const d = new Date(newValue);
        if (isNaN(d.getTime())) throw new Error("Invalid Date");
        return d;
    }

    if (originalValue instanceof Decimal128) {
        return Decimal128.fromString(newValue.toString());
    }

    if (originalValue instanceof Long) {
        return Long.fromValue(newValue);
    }

    if (originalValue instanceof Double) {
        return new Double(Number(newValue));
    }

    if (originalValue instanceof Int32) {
        return new Int32(parseInt(newValue));
    }

    if (originalValue instanceof UUID) {
        if (typeof newValue === "string") return new UUID(newValue);
        throw new Error("Invalid UUID");
    }

    if (originalValue instanceof Binary) {
        if (typeof newValue === "string") {
            return new Binary(Uint8Array.from(Buffer.from(newValue, "base64")));
        }
        throw new Error("Invalid Binary (must be base64 string)");
    }

    if (originalValue instanceof Timestamp) {
        if (
            typeof newValue === "object" &&
            typeof newValue.i === "number" &&
            typeof newValue.t === "number"
        ) {
            return Timestamp.fromBits(newValue.i, newValue.t); // i = lowBits, t = highBits
        }
        throw new Error("Invalid Timestamp (must have numeric 't' and 'i')");
    }

    if (originalValue instanceof BSONRegExp || originalValue instanceof RegExp) {
        if (typeof newValue === "string") return new BSONRegExp(newValue);
        throw new Error("Invalid RegExp");
    }

    if (originalValue instanceof Code) {
        if (typeof newValue === "string") return new Code(newValue);
        throw new Error("Invalid Code (must be string)");
    }

    if (originalValue instanceof DBRef) {
        if (typeof newValue === "object" && newValue.$ref && newValue.$id) {
            return new DBRef(newValue.$ref, newValue.$id, newValue.$db);
        }
        throw new Error("Invalid DBRef (must have $ref, $id)");
    }

    if (originalValue instanceof MinKey) {
        return new MinKey();
    }

    if (originalValue instanceof MaxKey) {
        return new MaxKey();
    }

    const type = typeof originalValue;
    switch (type) {
        case "string":
            return String(newValue);
        case "number":
            const n = Number(newValue);
            if (isNaN(n)) throw new Error("Invalid number");
            return n;
        case "boolean":
            if (newValue === "true" || newValue === true) return true;
            if (newValue === "false" || newValue === false) return false;
            throw new Error("Invalid boolean");
        case "object":
            return newValue;
        default:
            return newValue;
    }
}

// GET — Получить документ (без изменений)
export async function GET(
    req: NextRequest,
    { params }: { params: { resource: string; id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
        return new Response(JSON.stringify({ error: "Access denied" }), { status: 403 });
    }

    const collectionName = getSafeCollection(params.resource);
    if (!collectionName) {
        return new Response(JSON.stringify({ error: "Invalid resource" }), { status: 400 });
    }

    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME);
        const item = await db.collection(collectionName).findOne({ _id: new ObjectId(params.id) });

        if (!item) {
            return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
        }

        return new Response(JSON.stringify(item), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
    }
}

// PATCH — Обновить документ
export async function PATCH(
    req: NextRequest,
    { params }: { params: { resource: string; id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
        return new Response(JSON.stringify({ error: "Access denied" }), { status: 403 });
    }

    const collectionName = getSafeCollection(params.resource);
    if (!collectionName) {
        return new Response(JSON.stringify({ error: "Invalid resource" }), { status: 400 });
    }

    try {
        const updates = await req.json();
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME);
        const collection = db.collection(collectionName);

        const currentDoc = await collection.findOne({ _id: new ObjectId(params.id) });
        if (!currentDoc) {
            return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
        }

        const validatedUpdates: Record<string, any> = {};
        for (const key in updates) {
            if (updates.hasOwnProperty(key)) {
                if (key === "_id") {
                    // Не обновляем _id
                    continue;
                }
                try {
                    validatedUpdates[key] = convertToSameType(currentDoc[key], updates[key]);
                } catch (e: any) {
                    return new Response(
                        JSON.stringify({ error: `Invalid value for field '${key}': ${e.message}` }),
                        { status: 400 }
                    );
                }
            }
        }

        const result = await collection.updateOne(
            { _id: new ObjectId(params.id) },
            { $set: validatedUpdates }
        );

        if (result.matchedCount === 0) {
            return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Update failed" }), { status: 500 });
    }
}

// DELETE — Удалить документ (без изменений)
export async function DELETE(
    req: NextRequest,
    { params }: { params: { resource: string; id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
        return new Response(JSON.stringify({ error: "Access denied" }), { status: 403 });
    }

    const collectionName = getSafeCollection(params.resource);
    if (!collectionName) {
        return new Response(JSON.stringify({ error: "Invalid resource" }), { status: 400 });
    }

    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME);
        const result = await db.collection(collectionName).deleteOne({ _id: new ObjectId(params.id) });

        if (result.deletedCount === 0) {
            return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Delete failed" }), { status: 500 });
    }
}
