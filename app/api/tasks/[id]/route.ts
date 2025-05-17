import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { updateActiveTaskById } from "@/lib/queries/updateActiveTask";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  if (url.searchParams.get("type") !== "active") {
    return NextResponse.json({ error: "Invalid type parameter." }, { status: 400 });
  }

  const body = await req.json();
  const allowedFields = ["status", "completedAt", "missedAt"];
  const updateData = Object.fromEntries(
    Object.entries(body).filter(([key]) => allowedFields.includes(key))
  );

  if (updateData.completedAt) updateData.completedAt = new Date(updateData.completedAt as string);
  if (updateData.missedAt) updateData.missedAt = new Date(updateData.missedAt as string);

  const updated = await updateActiveTaskById(clerkUserId, params.id, updateData);

  if (!updated) return NextResponse.json({ error: "Task not found." }, { status: 404 });

  return NextResponse.json(updated);
}
