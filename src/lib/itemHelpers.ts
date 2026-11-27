import { MenuItem, KitchenStation } from "./types";

export function getDishStation(item: MenuItem): KitchenStation {
  if (item.station) return item.station;
  const name = item.name.toLowerCase();
  const cat = (item.categoryId || "").toLowerCase();

  if (cat.includes("beverage") || cat.includes("drink") || name.includes("lassi") || name.includes("chai") || name.includes("brew") || name.includes("soda")) {
    return "drinks";
  }
  if (cat.includes("dessert") || name.includes("jamun") || name.includes("halwa") || name.includes("cake") || name.includes("kulfi")) {
    return "desserts";
  }
  if (cat.includes("bread") || name.includes("naan") || name.includes("roti") || name.includes("tikka") || name.includes("skewer") || name.includes("kebab")) {
    return "tandoor";
  }
  return "curry";
}

export function getDishAllergens(item: MenuItem): string[] {
  if (item.allergens && item.allergens.length > 0) return item.allergens;
  const name = item.name.toLowerCase();
  const desc = item.description.toLowerCase();
  const allergens: string[] = [];

  if (item.dietaryType === "veg" || name.includes("paneer") || desc.includes("cheese") || desc.includes("butter") || desc.includes("cream") || desc.includes("ghee") || desc.includes("curd") || desc.includes("lassi")) {
    allergens.push("Dairy");
  }
  if (name.includes("naan") || name.includes("roti") || desc.includes("pastry") || desc.includes("galette") || desc.includes("flour")) {
    allergens.push("Gluten");
  }
  if (desc.includes("cashew") || desc.includes("almond") || desc.includes("pista") || desc.includes("nut") || desc.includes("podi")) {
    allergens.push("Nuts");
  }
  if (item.dietaryType === "egg") {
    allergens.push("Egg");
  }

  return allergens.length > 0 ? allergens : ["Fresh Ingredients"];
}

export function getDishHalfPrice(item: MenuItem): number {
  if (item.halfPrice) return item.halfPrice;
  return Math.round((item.price * 0.65) / 10) * 10;
}

export function getDishDeal(item: MenuItem): { name: string; price: number } {
  if (item.dealAddon) return item.dealAddon;
  const cat = (item.categoryId || "").toLowerCase();
  if (cat.includes("beverage")) {
    return { name: "+ Extra Ice Cream Scoop", price: 50 };
  }
  if (cat.includes("dessert")) {
    return { name: "+ Masala Chai", price: 40 };
  }
  if (cat.includes("bread")) {
    return { name: "+ Garlic Butter Dip", price: 35 };
  }
  return { name: "+ Mango Lassi", price: 99 };
}
