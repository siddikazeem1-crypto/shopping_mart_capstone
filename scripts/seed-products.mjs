// Idempotent seed script for Azeem Mart sample catalog (grocery + electronics).
// Uses the Admin SDK service-account JSON kept OUTSIDE the repo.
// Run: node scripts/seed-products.mjs
// Never commit the Admin JSON or any secrets.

const KEY_PATH =
  process.env.FIREBASE_ADMIN_KEY_PATH ||
  "D:\\azeem-mart-firebase-adminsdk-fbsvc-24633d81c0.json";

const PRODUCTS = [
  // Grocery
  { id: "prod-001", name: "Azeem Mart Basmati Rice 5kg", description: "Premium long-grain basmati rice", price: 899, stock: 50, category: "grocery" },
  { id: "prod-002", name: "Azeem Mart Whole Wheat Atta 10kg", description: "Stone-ground whole wheat flour", price: 449, stock: 80, category: "grocery" },
  { id: "prod-003", name: "Azeem Mart Toor Dal 1kg", description: "Split pigeon peas", price: 129, stock: 100, category: "grocery" },
  { id: "prod-004", name: "Azeem Mart Refined Sunflower Oil 1L", description: "Cooking oil pouch", price: 149, stock: 60, category: "grocery" },
  { id: "prod-005", name: "Azeem Mart Iodized Salt 1kg", description: "Table salt", price: 29, stock: 200, category: "grocery" },
  { id: "prod-006", name: "Azeem Mart Black Tea 250g", description: "Assam tea leaves", price: 179, stock: 70, category: "grocery" },
  { id: "prod-007", name: "Azeem Mart Sugar 1kg", description: "Refined white sugar", price: 49, stock: 150, category: "grocery" },
  // Electronics
  { id: "prod-011", name: "Azeem Mart Wireless Mouse", description: "2.4GHz wireless optical mouse", price: 399, stock: 40, category: "electronics" },
  { id: "prod-012", name: "Azeem Mart USB-C Charging Cable 1m", description: "Fast-charge USB-C to USB-A cable", price: 199, stock: 90, category: "electronics" },
  { id: "prod-013", name: "Azeem Mart Bluetooth Earbuds", description: "True wireless stereo earbuds with case", price: 1299, stock: 30, category: "electronics" },
  { id: "prod-014", name: "Azeem Mart 10000mAh Power Bank", description: "Portable lithium-polymer power bank", price: 899, stock: 35, category: "electronics" },
  { id: "prod-015", name: "Azeem Mart 4K HDMI Cable 2m", description: "High-speed HDMI cable", price: 299, stock: 55, category: "electronics" },
  { id: "prod-016", name: "Azeem Mart Wireless Keyboard", description: "Compact wireless keyboard with mouse combo", price: 799, stock: 25, category: "electronics" },
];

import fs from "node:fs";

async function main() {
  const admin = (await import("firebase-admin")).default;
  const adminFirestore = await import("firebase-admin/firestore");
  const { getFirestore } = adminFirestore;

  if (!admin.apps?.length) {
    const serviceAccount = JSON.parse(fs.readFileSync(KEY_PATH, "utf8"));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }

  const firestore = getFirestore();
  const productsCol = firestore.collection("products");

  let created = 0;
  let updated = 0;
  for (const p of PRODUCTS) {
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    const doc = {
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      stock: Number(p.stock),
      category: p.category,
      created_at: now,
      updated_at: now,
    };
    const existing = await productsCol.doc(p.id).get();
    if (existing.exists) {
      await productsCol.doc(p.id).set(doc, { merge: true });
      updated++;
    } else {
      await productsCol.doc(p.id).set(doc);
      created++;
    }
    console.log(`${existing.exists ? "updated" : "created"}: ${p.id} - ${p.name}`);
  }

  console.log(`\nSeed complete. Created: ${created}, Updated: ${updated}, Total: ${PRODUCTS.length}`);
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
