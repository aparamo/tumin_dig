import { db } from "../db";
import { products } from "../db/schema";

async function clear() {
  try {
    await db.delete(products);
    console.log("Products table cleared.");
    process.exit(0);
  } catch (e: any) {
    console.error("Error clearing table:", e.message);
    process.exit(1);
  }
}

clear();
