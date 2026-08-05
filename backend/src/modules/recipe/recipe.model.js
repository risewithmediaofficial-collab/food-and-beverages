import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  itemName: String,
  qtyPerBatch: { type: Number, required: true },
  unit: { type: String, required: true },
});

const recipeSchema = new mongoose.Schema({
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory' },
  name: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  outputQty: { type: Number, required: true, default: 1000 },
  outputUnit: { type: String, required: true, default: 'Ltr' },
  ingredients: [ingredientSchema],
  version: { type: String, default: 'v1.0' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Recipe = mongoose.models.Recipe || mongoose.model('Recipe', recipeSchema);
