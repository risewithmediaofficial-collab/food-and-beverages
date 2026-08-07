import { Recipe } from './recipe.model.js';

export const recipeService = {
  async calculateRequirement(recipeId, targetQty) {
    if (!recipeId) {
      return {
        recipeId: null,
        recipeName: 'Standard Process Recipe',
        targetQty: targetQty || 1000,
        outputUnit: 'Bottles',
        scaleFactor: 1,
        requirements: [],
      };
    }
    const recipe = await Recipe.findById(recipeId).populate('ingredients.itemId');
    if (!recipe) {
      return {
        recipeId: null,
        recipeName: 'Standard Process Recipe',
        targetQty: targetQty || 1000,
        outputUnit: 'Bottles',
        scaleFactor: 1,
        requirements: [],
      };
    }

    const scaleFactor = targetQty / recipe.outputQty;

    const requirements = recipe.ingredients.map((ing) => {
      const requiredQty = ing.qtyPerBatch * scaleFactor;
      return {
        itemId: ing.itemId._id || ing.itemId,
        itemName: ing.itemName || (ing.itemId ? ing.itemId.name : 'Ingredient'),
        qtyPerBatch: ing.qtyPerBatch,
        requiredQty: Math.round(requiredQty * 100) / 100,
        unit: ing.unit,
      };
    });

    return {
      recipeId: recipe._id,
      recipeName: recipe.name,
      targetQty,
      outputUnit: recipe.outputUnit,
      scaleFactor,
      requirements,
    };
  }
};
