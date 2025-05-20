import { closeOutDayForAllUsers } from "@/lib/cron/closeOutDay";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Optional: secure with secret
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    await closeOutDayForAllUsers();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Midnight cron failed:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}