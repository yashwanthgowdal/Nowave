import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { menuItemUpdateSchema } from "@/lib/validations";
import { menuEvents } from "@/lib/events";

// GET /api/menu-items/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ...item, isAvailable: !item.isStruckOut });
  } catch (error) {
    console.error("Menu item GET error:", error);
    return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 });
  }
}

// PATCH /api/menu-items/[id]
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
    const parsed = menuItemUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.isAvailable !== undefined) {
      updateData.isStruckOut = !parsed.data.isAvailable;
      delete updateData.isAvailable;
    }

    const item = await prisma.menuItem.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    const responseItem = {
      ...item,
      isAvailable: !item.isStruckOut,
    };

    menuEvents.emit({
      type: "item_updated",
      payload: { item: responseItem },
      timestamp: Date.now(),
    });

    return NextResponse.json(responseItem);
  } catch (error) {
    console.error("Menu item PATCH error:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

// DELETE /api/menu-items/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await prisma.menuItem.delete({ where: { id } });

    menuEvents.emit({
      type: "item_deleted",
      payload: { id },
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Menu item DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
