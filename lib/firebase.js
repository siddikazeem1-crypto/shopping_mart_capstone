// Shared Firebase Admin + helpers for Azeem Mart Vercel functions.
// Reads Admin SDK credentials from env (never commit the JSON file):
//   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
// firebase-admin loads lazily so hello/health don't depend on Admin init.
import crypto from "node:crypto";

let initialized = false;
let admin = null;

export async function initAdmin() {
  if (initialized && admin?.apps?.length) return admin.apps[0];
  admin = admin || (await import("firebase-admin")).default;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin env vars: FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY"
    );
  }
  // Vercel env stores \n as literal backslash-n; convert to real newlines
  privateKey = privateKey.replace(/\\n/g, "\n");
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
  initialized = true;
  return admin.apps[0];
}

export async function db() {
  await initAdmin();
  return admin.firestore();
}

// Password hash matches C++ AuthService::hashPassword (XOR 0x5A, demo only)
export function hashPassword(password) {
  return String(password)
    .split("")
    .map((c) => String.fromCharCode(c.charCodeAt(0) ^ 0x5a))
    .join("");
}

export function generateToken() {
  return crypto.randomBytes(16).toString("hex"); // 32 hex chars, like C++
}

export function nowIso() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

export function omitPassword(user) {
  if (!user) return user;
  const { password, ...rest } = user;
  return rest;
}

export function getBearer(req) {
  const h = req.headers?.authorization || req.headers?.Authorization || "";
  if (!h || !h.startsWith("Bearer ")) return "";
  return h.slice(7);
}

export function setCors(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return true;
  }
  return false;
}

export function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(obj));
}

// Seeds admin/admin123 (admin) + customer/customer123 (customer) once
export async function ensureSeedUsers(firestore) {
  const users = firestore.collection("users");
  const snap = await users.limit(1).get();
  if (!snap.empty) return;
  const ts = nowIso();
    await users.doc("seed-admin").set({
    id: "seed-admin",
    username: "admin",
    email: "admin@azeemmart.com",
    password: hashPassword("admin123"),
    role: "admin",
    created_at: ts,
    updated_at: ts,
  });
  await users.doc("seed-customer").set({
    id: "seed-customer",
    username: "customer",
    email: "customer@azeemmart.com",
    password: hashPassword("customer123"),
    role: "customer",
    created_at: ts,
    updated_at: ts,
  });
}

export async function getUserIdFromToken(firestore, token) {
  if (!token) return "";
  const doc = await firestore.collection("tokens").doc(token).get();
  if (!doc.exists) return "";
  return doc.data()?.userId || "";
}

export async function getUserById(firestore, id) {
  const doc = await firestore.collection("users").doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}
