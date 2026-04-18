import { db } from "../db";
import { products, users } from "../db/schema";
import { count } from "drizzle-orm";

async function check() {
  try {
    const productsCount = await db.select({ value: count() }).from(products);
    const usersCount = await db.select({ value: count() }).from(users);
    
    console.log("Database Stats:");
    console.log("- Users:", usersCount[0].value);
    console.log("- Products:", productsCount[0].value);
    
    if (productsCount[0].value > 0) {
      const sample = await db.select().from(products).limit(5);
      console.log("Sample products:", JSON.stringify(sample, null, 2));
    } else {
      console.log("NO PRODUCTS FOUND IN TUMIN_products TABLE.");
    }
    
    process.exit(0);
  } catch (e: any) {
    console.error("Error checking database:", e.message);
    process.exit(1);
  }
}

check();
