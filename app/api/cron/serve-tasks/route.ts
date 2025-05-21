import { serveTasksForAllUsers } from "@/lib/cron/serveTasks";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    await serveTasksForAllUsers();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Cron serve-tasks failed:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}