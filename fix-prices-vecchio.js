const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const restaurantId = 6; // Vecchio

  const categoryPrices = {
    'Pizzas': 7500,
    'Hamburguesas': 6000,
    'Bebidas': 1500,
    'Postres': 3500,
    'Empanadas': 1200
  };

  for (const [catName, price] of Object.entries(categoryPrices)) {
    const category = await prisma.category.findFirst({
      where: { name: catName, restaurantId }
    });

    if (category) {
      const result = await prisma.product.updateMany({
        where: { categoryId: category.id },
        data: { price }
      });
      console.log(`Actualizados ${result.count} productos de ${catName} al precio $${price}`);
    } else {
      console.log(`No se encontró la categoría ${catName}`);
    }
  }

  console.log("¡Precios redondeados y unificados por categoría exitosamente!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
