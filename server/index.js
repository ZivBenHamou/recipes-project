import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Recipe from "./models/Recipe.js";

dotenv.config();

const app = express();
app.use(express.json());

// ✅ CORS (supports localhost + your production URL + any *.vercel.app)
const allowed = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // allow requests with no origin (health checks, curl, etc.)
      if (!origin) return cb(null, true);

      // allow exact matches (CLIENT_URL / localhost)
      if (allowed.includes(origin)) return cb(null, true);

      // allow Vercel preview & production domains
      if (origin.endsWith(".vercel.app")) return cb(null, true);

      return cb(new Error("Not allowed by CORS"));
    },
  })
);

// --- Mongo connect ---
async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is missing in server/.env");
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}

// root
app.get("/", (req, res) => {
  res.send("Server is running ✅ Try /health or /recipes");
});

// health check
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// GET all recipes (optional search & category)
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

// GET single recipe
app.get("/recipes/:id", async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) return res.status(404).json({ message: "Recipe not found" });
  res.json({ ...recipe.toObject(), id: recipe._id.toString() });
});

// CREATE recipe
app.post("/recipes", async (req, res) => {
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
  });

  res.status(201).json({ ...doc.toObject(), id: doc._id.toString() });
});

// UPDATE recipe
app.put("/recipes/:id", async (req, res) => {
  const { title, category, prepMinutes, imageUrl, ingredients, instructions } =
    req.body;

  if (!title || !category) {
    return res.status(400).json({ message: "title and category are required" });
  }

  const updated = await Recipe.findByIdAndUpdate(
    req.params.id,
    {
      title,
      category,
      prepMinutes: Number(prepMinutes) || 0,
      imageUrl: imageUrl || "",
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      instructions: Array.isArray(instructions) ? instructions : [],
    },
    { new: true }
  );

  if (!updated) return res.status(404).json({ message: "Recipe not found" });
  res.json({ ...updated.toObject(), id: updated._id.toString() });
});

// DELETE recipe
app.delete("/recipes/:id", async (req, res) => {
  const deleted = await Recipe.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Recipe not found" });
  res.json({ ok: true });
});

// start after DB
const PORT = process.env.PORT || 4000;
connectDB().then(() => {
  app.listen(PORT, () => console.log("Server running on", PORT));
});
