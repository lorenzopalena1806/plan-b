import { prisma } from './prisma';

export async function deductStockAndCalculateCost(items: any[]): Promise<number> {
  let totalCost = 0;
  
  if (!items || items.length === 0) return 0;
  
  try {
    // 1. Get all unique product and modifier IDs from the items array
    const productIds = new Set<number>();
    const modifierIds = new Set<number>();
    
    for (const item of items) {
      if (item.productId) productIds.add(item.productId);
      if (item.modifiers && Array.isArray(item.modifiers)) {
        for (const mod of item.modifiers) {
          if (mod.id) modifierIds.add(mod.id);
        }
      }
    }
    
    // 2. Fetch all necessary data in bulk (parallel queries)
    const [products, productRecipes, comboItems, modifierRecipes] = await Promise.all([
      prisma.product.findMany({ 
        where: { id: { in: Array.from(productIds) } },
        select: { id: true, deductStock: true }
      }),
      prisma.recipeItem.findMany({
        where: { productId: { in: Array.from(productIds) } },
        include: { ingredient: true }
      }),
      prisma.comboItem.findMany({
        where: { comboId: { in: Array.from(productIds) } },
        include: { product: { include: { recipes: { include: { ingredient: true } } } } }
      }),
      modifierIds.size > 0 
        ? prisma.modifierRecipeItem.findMany({
            where: { modifierId: { in: Array.from(modifierIds) } },
            include: { ingredient: true }
          })
        : Promise.resolve([])
    ]);
    
    // Convert arrays to maps for fast lookup
    const productMap = new Map(products.map(p => [p.id, p]));
    const recipesMap = new Map<number, any[]>();
    const combosMap = new Map<number, any[]>();
    const modifiersMap = new Map<number, any[]>();
    
    productRecipes.forEach(r => {
      if (!recipesMap.has(r.productId)) recipesMap.set(r.productId, []);
      recipesMap.get(r.productId)!.push(r);
    });
    
    comboItems.forEach(c => {
      if (!combosMap.has(c.comboId)) combosMap.set(c.comboId, []);
      combosMap.get(c.comboId)!.push(c);
    });
    
    modifierRecipes.forEach(m => {
      if (!modifiersMap.has(m.modifierId)) modifiersMap.set(m.modifierId, []);
      modifiersMap.get(m.modifierId)!.push(m);
    });
    
    // 3. Calculate usage and group by ingredient ID
    // We will do a single update per ingredient at the end
    const ingredientDeductions = new Map<number, number>();
    
    const addDeduction = (ingredientId: number, amount: number, shouldDeduct: boolean, costPerUnit: number) => {
      totalCost += amount * costPerUnit;
      if (shouldDeduct) {
        ingredientDeductions.set(ingredientId, (ingredientDeductions.get(ingredientId) || 0) + amount);
      }
    };
    
    for (const item of items) {
      if (!item.productId) continue;
      
      const product = productMap.get(item.productId);
      const shouldDeduct = product?.deductStock ?? true;
      const quantity = item.quantity || 1;
      
      // Regular product recipes
      const pRecipes = recipesMap.get(item.productId) || [];
      for (const recipe of pRecipes) {
        const totalUsed = recipe.quantityUsed * quantity;
        addDeduction(recipe.ingredientId, totalUsed, shouldDeduct, recipe.ingredient.unitCost || 0);
      }
      
      // Combo items
      const pCombos = combosMap.get(item.productId) || [];
      for (const comboItem of pCombos) {
        if (comboItem.product && comboItem.product.recipes) {
          for (const recipe of comboItem.product.recipes) {
            const totalUsed = recipe.quantityUsed * comboItem.quantity * quantity;
            addDeduction(recipe.ingredientId, totalUsed, shouldDeduct, recipe.ingredient.unitCost || 0);
          }
        }
      }
      
      // Modifiers
      if (item.modifiers && Array.isArray(item.modifiers)) {
        for (const mod of item.modifiers) {
          const mRecipes = modifiersMap.get(mod.id) || [];
          for (const recipe of mRecipes) {
            const totalUsed = recipe.quantityUsed * quantity;
            addDeduction(recipe.ingredientId, totalUsed, shouldDeduct, recipe.ingredient.unitCost || 0);
          }
        }
      }
    }
    
    // 4. Batch update the database (only if there are deductions)
    if (ingredientDeductions.size > 0) {
      // In Prisma we have to loop to update, but we are at least doing only one update per unique ingredient
      // and running them in a transaction to avoid blocking others
      const updates = Array.from(ingredientDeductions.entries()).map(([ingredientId, amount]) => {
        return prisma.ingredient.update({
          where: { id: ingredientId },
          data: { currentStock: { decrement: amount } }
        });
      });
      
      await prisma.$transaction(updates);
    }
    
  } catch (e) {
    console.error('Error deducting stock or updating cost:', e);
    // Don't fail the order if stock deduction fails
  }
  
  return totalCost;
}
