import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
  console.log("🌱 Seeding No Wave Company Restaurant database...\n");

  // ─── Create Admin User ───
  const passwordHash = await bcrypt.hash("NoWave2024!", 12);
  const admin = await prisma.adminUser.upsert({
    where: { email: "manager@nowave.cafe" },
    update: { passwordHash },
    create: {
      email: "manager@nowave.cafe",
      passwordHash,
      name: "Restaurant General Manager",
    },
  });
  console.log(`✅ Admin manager user: ${admin.email}`);

  // Delete existing menu items and categories for a clean slate
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();

  // ─── Create Categories (Strictly Matching Specification) ───
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: "Starters & Snacks", slug: "starters-snacks", sortOrder: 0 },
    }),
    prisma.category.create({
      data: { name: "Main Course", slug: "main-course", sortOrder: 1 },
    }),
    prisma.category.create({
      data: { name: "Breads & Rice", slug: "breads-rice", sortOrder: 2 },
    }),
    prisma.category.create({
      data: { name: "Desserts", slug: "desserts", sortOrder: 3 },
    }),
    prisma.category.create({
      data: { name: "Cold Drinks & Beverages", slug: "beverages", sortOrder: 4 },
    }),
  ]);

  const [starters, mains, breadsRice, desserts, beverages] = categories;
  console.log(`✅ ${categories.length} Categories created`);

  // ─── Create 21 Authentic, Premium Restaurant Items ───
  const items = await Promise.all([
    // ── 1. Starters & Snacks ──
    prisma.menuItem.create({
      data: {
        name: "Truffle Malai Paneer Tikka",
        description: "Charred cottage cheese steeped in black truffle oil, green cardamom cream, and roasted coriander emulsion.",
        price: 390,
        imageUrl: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=700&q=80",
        dietaryType: "veg",
        spiceLevel: 1,
        isChefSpecial: true,
        isBestseller: true,
        isStruckOut: false,
        categoryId: starters.id,
        sortOrder: 0,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Gunpowder Crispy Corn Ribs",
        description: "Char-grilled fresh sweet corn ribs tossed in southern Podi masala, kaffir lime zest, and smoked spiced butter.",
        price: 280,
        imageUrl: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=700&q=80",
        dietaryType: "veg",
        spiceLevel: 2,
        isChefSpecial: false,
        isBestseller: true,
        isStruckOut: false,
        categoryId: starters.id,
        sortOrder: 1,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Ghee Roast Chicken Skewers",
        description: "Kundapur-style slow-roasted chicken supreme in rich artisanal clarified butter, Byadgi chillies, and curry leaf ash.",
        price: 440,
        imageUrl: "https://images.unsplash.com/photo-1527477378776-6469cf361548?w=700&q=80",
        dietaryType: "nonveg",
        spiceLevel: 4,
        isChefSpecial: true,
        isBestseller: false,
        isStruckOut: false,
        categoryId: starters.id,
        sortOrder: 2,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Wild Mushroom & Goat Cheese Galette",
        description: "Crisp flaky handmade pastry topped with pan-seared forest mushrooms, caramelized shallots, and aged goat chèvre.",
        price: 360,
        imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=700&q=80",
        dietaryType: "veg",
        spiceLevel: 1,
        isChefSpecial: false,
        isBestseller: false,
        isStruckOut: false,
        categoryId: starters.id,
        sortOrder: 3,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Prawns Koliwada Popcorn",
        description: "Mumbai fisherman wharf-style crisp rock prawns spiced with carom seeds, served with crushed chili-tamarind dip.",
        price: 480,
        imageUrl: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=700&q=80",
        dietaryType: "nonveg",
        spiceLevel: 3,
        isChefSpecial: true,
        isBestseller: false,
        isStruckOut: true, // Pre-out-of-stock for live demo toggle!
        categoryId: starters.id,
        sortOrder: 4,
      },
    }),

    // ── 2. Main Course ──
    prisma.menuItem.create({
      data: {
        name: "Smoked Dal Makhani No Wave",
        description: "24-hour slow charcoal-simmered Urad lentils finished with churned white butter, kasuri methi lace, and a whisper of smoke.",
        price: 380,
        imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=700&q=80",
        dietaryType: "veg",
        spiceLevel: 1,
        isChefSpecial: false,
        isBestseller: true,
        isStruckOut: false,
        categoryId: mains.id,
        sortOrder: 0,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Old Delhi Butter Chicken (Boneless)",
        description: "Tandoor-charred chicken thigh morsels steeped in velvety vine-ripened San Marzano tomato & cashew nut gravy.",
        price: 490,
        imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=700&q=80",
        dietaryType: "nonveg",
        spiceLevel: 2,
        isChefSpecial: true,
        isBestseller: true,
        isStruckOut: false,
        categoryId: mains.id,
        sortOrder: 1,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Paneer Lababdar Pot",
        description: "Diced cottage cheese simmered with cracked coriander seeds, charred bell peppers, and royal saffron reduction.",
        price: 420,
        imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=700&q=80",
        dietaryType: "veg",
        spiceLevel: 2,
        isChefSpecial: false,
        isBestseller: false,
        isStruckOut: false,
        categoryId: mains.id,
        sortOrder: 2,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Heritage Railway Mutton Curry",
        description: "Slow-braised British-Indian colonial spiced bone-in mutton with baby potatoes, whole spices, and rich marrow reduction.",
        price: 580,
        imageUrl: "https://images.unsplash.com/photo-1545247181-516773cae754?w=700&q=80",
        dietaryType: "nonveg",
        spiceLevel: 4,
        isChefSpecial: true,
        isBestseller: false,
        isStruckOut: false,
        categoryId: mains.id,
        sortOrder: 3,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Nilgiri Vegetable Korma",
        description: "Seasonal garden baby carrots, French beans, and baby corn in a silky mountain herb sauce of fresh mint, cilantro, and coconut milk.",
        price: 360,
        imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=700&q=80",
        dietaryType: "vegan",
        spiceLevel: 2,
        isChefSpecial: false,
        isBestseller: false,
        isStruckOut: false,
        categoryId: mains.id,
        sortOrder: 4,
      },
    }),

    // ── 3. Breads & Rice ──
    prisma.menuItem.create({
      data: {
        name: "Awadhi Dum Biryani (Chicken)",
        description: "Long-grain 2-year aged basmati rice cooked on sealed steam with tender saffron chicken, served with smoked burani garlic raita.",
        price: 520,
        imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=700&q=80",
        dietaryType: "nonveg",
        spiceLevel: 3,
        isChefSpecial: true,
        isBestseller: true,
        isStruckOut: false,
        categoryId: breadsRice.id,
        sortOrder: 0,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Subz Dum Handi Biryani",
        description: "Fragrant rice layered with kewra essence, caramelized fried onions, green peas, and marinated paneer cubes.",
        price: 420,
        imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=700&q=80",
        dietaryType: "veg",
        spiceLevel: 2,
        isChefSpecial: false,
        isBestseller: false,
        isStruckOut: false,
        categoryId: breadsRice.id,
        sortOrder: 1,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Smoked Garlic & Rosemary Naan",
        description: "Hand-stretched tandoori naan brushed with cultured butter, charred garlic slivers, and mountain rosemary needles.",
        price: 110,
        imageUrl: "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=700&q=80",
        dietaryType: "veg",
        spiceLevel: 1,
        isChefSpecial: false,
        isBestseller: true,
        isStruckOut: false,
        categoryId: breadsRice.id,
        sortOrder: 2,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Layered Chur Chur Laccha Paratha",
        description: "Flaky multi-layered whole wheat flatbread crushed by hand and finished with pure desi ghee and roasted ajwain.",
        price: 95,
        imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=700&q=80",
        dietaryType: "veg",
        spiceLevel: 1,
        isChefSpecial: false,
        isBestseller: false,
        isStruckOut: false,
        categoryId: breadsRice.id,
        sortOrder: 3,
      },
    }),

    // ── 4. Desserts ──
    prisma.menuItem.create({
      data: {
        name: "Saffron & Pistachio Tres Leches",
        description: "Delicate sponge drenched in Kashmiri saffron-infused triple milk, crowned with slivered Iranian pistachios and silver foil.",
        price: 320,
        imageUrl: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=700&q=80",
        dietaryType: "veg",
        spiceLevel: 1,
        isChefSpecial: true,
        isBestseller: true,
        isStruckOut: false,
        categoryId: desserts.id,
        sortOrder: 0,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Charred Fig & Jaggery Basque Cheesecake",
        description: "Burnt Basque style cheesecake infused with organic palm jaggery and topped with port-poached Turkish black figs.",
        price: 340,
        imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=700&q=80",
        dietaryType: "egg",
        spiceLevel: 1,
        isChefSpecial: false,
        isBestseller: true,
        isStruckOut: false,
        categoryId: desserts.id,
        sortOrder: 1,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Single-Estate Filter Coffee Mousse",
        description: "Chikmagalur dark roast decoction folded into Belgian Valrhona chocolate mousse with cacao nib tuile.",
        price: 260,
        imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=700&q=80",
        dietaryType: "veg",
        spiceLevel: 1,
        isChefSpecial: false,
        isBestseller: false,
        isStruckOut: true, // Pre-out-of-stock for live demo toggle!
        categoryId: desserts.id,
        sortOrder: 2,
      },
    }),

    // ── 5. Cold Drinks & Beverages ──
    prisma.menuItem.create({
      data: {
        name: "Smoked Kokum & Cumin Fizz",
        description: "Chilled wild Goan kokum extract spiked with roasted cumin, rock salt, mint sprigs, and artisanal bubbling soda.",
        price: 190,
        imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=700&q=80",
        dietaryType: "vegan",
        spiceLevel: 1,
        isChefSpecial: false,
        isBestseller: true,
        isStruckOut: false,
        categoryId: beverages.id,
        sortOrder: 0,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Kaffir Lime & Lemongrass Craft Tonic",
        description: "Hand-bruised lemongrass stalk and fragrant kaffir citrus leaves topped with botanical tonic and Himalayan pink salt.",
        price: 210,
        imageUrl: "https://images.unsplash.com/photo-1556881286-fc6915169721?w=700&q=80",
        dietaryType: "vegan",
        spiceLevel: 1,
        isChefSpecial: false,
        isBestseller: false,
        isStruckOut: false,
        categoryId: beverages.id,
        sortOrder: 1,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Iced Passionfruit & Cold Brew Elixir",
        description: "18-hour steep single-origin Arabica cold brew shaken with tart passionfruit pulp and crushed crystal ice.",
        price: 240,
        imageUrl: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=700&q=80",
        dietaryType: "vegan",
        spiceLevel: 1,
        isChefSpecial: true,
        isBestseller: false,
        isStruckOut: false,
        categoryId: beverages.id,
        sortOrder: 2,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: "Alphonso Mango & Cardamom Shake",
        description: "Sun-ripened Ratnagiri Alphonso mango nectar blended with farm-fresh whole milk and crushed green cardamom pod.",
        price: 230,
        imageUrl: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=700&q=80",
        dietaryType: "veg",
        spiceLevel: 1,
        isChefSpecial: false,
        isBestseller: true,
        isStruckOut: false,
        categoryId: beverages.id,
        sortOrder: 3,
      },
    }),
  ]);

  console.log(`✅ ${items.length} Menu items seeded across 5 categories!`);
  console.log(`\n🎉 Seed completed! Manager login: manager@nowave.cafe / NoWave2024!`);
}

seed()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
