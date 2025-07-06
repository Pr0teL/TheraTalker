import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";

const ALLOWED_COLLECTIONS = process.env.ALLOWED_COLLECTIONS?.split(",").map(s => s.trim()) ?? [];

if (ALLOWED_COLLECTIONS.length === 0) {
    console.warn("⚠️ ALLOWED_COLLECTIONS is empty or not set in .env");
}


export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
        return new Response(JSON.stringify({ error: "Access denied" }), { status: 403 });
    }

    if (ALLOWED_COLLECTIONS.length === 0) {
        return new Response(JSON.stringify({ error: "No allowed collections configured" }), { status: 500 });
    }

    return new Response(JSON.stringify({ tables: ALLOWED_COLLECTIONS }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}
