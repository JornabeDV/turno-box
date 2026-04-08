// API route para refetch de clases al cambiar de día (usado por ClassList)
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getClassSlotsForDay } from "@/lib/queries/classes";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const gymId = searchParams.get("gymId");
  const dateStr = searchParams.get("date");
  const userId = searchParams.get("userId");

  if (!gymId || !dateStr || !userId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  // Solo puede consultar sus propias clases
  if (userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const slots = await getClassSlotsForDay(gymId, new Date(dateStr), userId);
  return NextResponse.json(slots);
}
