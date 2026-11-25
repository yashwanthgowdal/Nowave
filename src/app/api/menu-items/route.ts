import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { menuItemSchema } from "@/lib/validations";
import { menuEvents } from "@/lib/events";

// GET /api/menu-items — public
export async function GET() {
  try {
    const items = await prisma.menuItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { category: true },
    });
    const enriched = items.map((item) => ({
      ...item,
      isAvailable: !item.isStruckOut,
    }));
    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Menu items GET error:", error);
    return NextResponse.json({ error: "Failed to fetch menu items" }, { status: 500 });
  }
}

// POST /api/menu-items — admin only
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = menuItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const item = await prisma.menuItem.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        price: parsed.data.price,
        imageUrl: parsed.data.imageUrl || null,
        dietaryType: parsed.data.dietaryType,
        spiceLevel: parsed.data.spiceLevel,
        isChefSpecial: parsed.data.isChefSpecial,
        isBestseller: parsed.data.isBestseller,
        isStruckOut: parsed.data.isStruckOut,
        availabilitySlot: parsed.data.availabilitySlot,
        categoryId: parsed.data.categoryId,
        sortOrder: parsed.data.sortOrder,
      },
      include: { category: true },
    });

    const responseItem = {
      ...item,
      isAvailable: !item.isStruckOut,
    };

    menuEvents.emit({
      type: "item_created",
      payload: { item: responseItem },
      timestamp: Date.now(),
    });

    return NextResponse.json(responseItem, { status: 201 });
  } catch (error) {
    console.error("Menu item POST error:", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
