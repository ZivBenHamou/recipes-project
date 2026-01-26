import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Recipe from "./models/Recipe.js";
import admin from "firebase-admin";

dotenv.config();

/* =========================
   Firebase Admin init
========================= */
const sa = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

let firebaseReady = false;
if (!sa) {
  console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT_JSON is missing (auth will fail)");
} else {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(sa)),
  });
  firebaseReady = true;
}

/* =========================
   App + middleware
========================= */
const app = express();
app.use(express.json());

// ✅ CORS
const allowed = [process.env.CLIENT_URL, "http://localhost:5173"].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowed.includes(origin)) return cb(null, true);
      if (origin.endsWith(".vercel.app")) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
  })
);

/* =========================
   MongoDB
========================= */
async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is missing");
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}

/* =========================
   Auth middleware
========================= */
async function requireAuth(req, res, next) {
  try {
    if (!firebaseReady) {
      return res.status(500).json({ message: "Auth is not configured on server" });
    }

    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Missing auth token" });
    }

    const decoded = await admin.auth().verifyIdToken(token);

    // decoded can have: uid, email, name, firebase.sign_in_provider etc.
    req.user = {
      uid: decoded.uid,
      email: decoded.email || "",
      name: decoded.name || decoded.email || "",
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid auth token" });
  }
}

/* =========================
   Routes
========================= */

// root
app.get("/", (req, res) => {
  res.send("Server is running ✅");
});

// health
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

/* -------- Public -------- */

// GET all recipes (public)
app.get("/recipes", async (req, res) => {
  const search = (req.query.search || "").toString().trim();
  const category = (req.query.category || "").toString().trim();

  const filter = {};
  if (category) filter.category = category;

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
    ];
  }

  const recipes = await Recipe.find(filter).sort({ createdAt: -1 });
  res.json(recipes.map((r) => ({ ...r.toObject(), id: r._id.toString() })));
});

// GET single recipe (public)
app.get("/recipes/:id", async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) return res.status(404).json({ message: "Recipe not found" });
  res.json({ ...recipe.toObject(), id: recipe._id.toString() });
});

/* -------- Protected -------- */

// GET my recipes (only logged in user)
app.get("/me/recipes", requireAuth, async (req, res) => {
  const recipes = await Recipe.find({ ownerId: req.user.uid }).sort({ createdAt: -1 });
  res.json(recipes.map((r) => ({ ...r.toObject(), id: r._id.toString() })));
});

// CREATE recipe (logged in)
app.post("/recipes", requireAuth, async (req, res) => {
  const { title, category, prepMinutes, imageUrl, ingredients, instructions } =
    req.body;

  if (!title || !category) {
    return res.status(400).json({ message: "title and category are required" });
  }

  const doc = await Recipe.create({
    title,
    category,
    prepMinutes: Number(prepMinutes) || 0,
    imageUrl: imageUrl || "",
    ingredients: Array.isArray(ingredients) ? ingredients : [],
    instructions: Array.isArray(instructions) ? instructions : [],

    ownerId: req.user.uid,
    ownerName: req.user.name || "",
    ownerEmail: req.user.email || "",
  });

  res.status(201).json({ ...doc.toObject(), id: doc._id.toString() });
});

// UPDATE recipe (only owner)
app.put("/recipes/:id", requireAuth, async (req, res) => {
  const { title, category, prepMinutes, imageUrl, ingredients, instructions } =
    req.body;

  if (!title || !category) {
    return res.status(400).json({ message: "title and category are required" });
  }

  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) {
    return res.status(404).json({ message: "Recipe not found" });
  }

  // recipes created before auth feature might have no ownerId
  if (!recipe.ownerId) {
    return res.status(403).json({ message: "This recipe has no owner (legacy)" });
  }

  if (recipe.ownerId !== req.user.uid) {
    return res.status(403).json({ message: "Forbidden" });
  }

  recipe.title = title;
  recipe.category = category;
  recipe.prepMinutes = Number(prepMinutes) || 0;
  recipe.imageUrl = imageUrl || "";
  recipe.ingredients = Array.isArray(ingredients) ? ingredients : [];
  recipe.instructions = Array.isArray(instructions) ? instructions : [];

  const updated = await recipe.save();
  res.json({ ...updated.toObject(), id: updated._id.toString() });
});

// DELETE recipe (only owner)
app.delete("/recipes/:id", requireAuth, async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) {
    return res.status(404).json({ message: "Recipe not found" });
  }

  if (!recipe.ownerId) {
    return res.status(403).json({ message: "This recipe has no owner (legacy)" });
  }

  if (recipe.ownerId !== req.user.uid) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await Recipe.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

/* =========================
   Start server
========================= */
const PORT = process.env.PORT || 4000;
connectDB().then(() => {
  app.listen(PORT, () => console.log("Server running on", PORT));
});
