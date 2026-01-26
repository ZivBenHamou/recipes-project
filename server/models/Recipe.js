import mongoose from "mongoose";

const RecipeSchema = new mongoose.Schema(
  {
    title: { type: String, default: "", trim: true },
    category: { type: String, required: true, trim: true },
    prepMinutes: { type: Number, default: 0 },
    imageUrl: { type: String, default: "" },
    ingredients: { type: [String], default: [] },
    instructions: { type: [String], default: [] },

    // ✅ ownership (לא required כדי לא לשבור מתכונים ישנים)
    ownerId: { type: String, default: "", index: true },
    ownerName: { type: String, default: "" },
    ownerEmail: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Recipe", RecipeSchema);
