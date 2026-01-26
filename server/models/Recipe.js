import mongoose from "mongoose";

const RecipeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    prepMinutes: { type: Number, default: 0 },
    imageUrl: { type: String, default: "" },
    ingredients: { type: [String], default: [] },
    instructions: { type: [String], default: [] },

    // ✅ NEW: ownership
    ownerId: { type: String, required: true, index: true },
    ownerName: { type: String, default: "" }, // אופציונלי (להצגה)
  },
  { timestamps: true }
);

export default mongoose.model("Recipe", RecipeSchema);
