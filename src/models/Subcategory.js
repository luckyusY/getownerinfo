import mongoose from "mongoose";

const { Schema } = mongoose;

const SubcategorySchema = new Schema(
  {
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    slug: { type: String, required: true, index: true },
    name: { type: String, required: true },
    // Item types are short labels; kept inline since they have no own behavior.
    itemTypes: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// slug is unique within a category, not globally.
SubcategorySchema.index({ category: 1, slug: 1 }, { unique: true });

export default mongoose.models.Subcategory ||
  mongoose.model("Subcategory", SubcategorySchema);
