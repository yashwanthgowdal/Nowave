import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { toggleSchema } from "@/lib/validations";
import { menuEvents } from "@/lib/events";

// PATCH /api/menu-items/[id]/toggle — admin only
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = toggleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const item = await prisma.menuItem.update({
      where: { id },
      data: { isStruckOut: parsed.data.isStruckOut },
      include: { category: true },
    });

    const enriched = {
      ...item,
      isAvailable: !item.isStruckOut,
    };

    menuEvents.emit({
      type: "item_updated",
      payload: { item: enriched },
      timestamp: Date.now(),
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Toggle error:", error);
    return NextResponse.json({ error: "Failed to toggle item" }, { status: 500 });
  }
}
