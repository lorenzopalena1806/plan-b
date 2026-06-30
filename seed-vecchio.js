const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Find Vecchio
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: 'vecchio' }
  });

  if (!restaurant) {
    console.error("No se encontró el restaurante 'vecchio'.");
    return;
  }

  const restaurantId = restaurant.id;
  console.log(`Encontrado restaurante Vecchio con ID: ${restaurantId}`);

  // 2. Define categories
  const categoryNames = ['Pizzas', 'Hamburguesas', 'Bebidas', 'Postres', 'Empanadas'];
  
  for (const catName of categoryNames) {
    // Check if category exists
    let category = await prisma.category.findFirst({
      where: { name: catName, restaurantId }
    });

    if (!category) {
      category = await prisma.category.create({
        data: { name: catName, restaurantId }
      });
      console.log(`Creada categoría: ${catName}`);
    }

    // 3. Create 10 products per category
    const productsToCreate = [];
    for (let i = 1; i <= 10; i++) {
      const isAvailable = Math.random() > 0.1; // 90% available
      const price = Math.floor(Math.random() * 5000) + 1000; // between 1000 and 6000
      
      productsToCreate.push({
        name: `${catName} Especial ${i}`,
        description: `Deliciosa opción de ${catName.toLowerCase()} elaborada con los mejores ingredientes.`,
        price,
        categoryId: category.id,
        restaurantId,
        isActive: isAvailable,
        imageUrl: `https://loremflickr.com/320/240/${catName.toLowerCase()}?lock=${Math.floor(Math.random() * 1000)}`
      });
    }

    await prisma.product.createMany({
      data: productsToCreate
    });
    
    console.log(`Creados 10 productos para la categoría: ${catName}`);
  }

  console.log("¡50 productos creados exitosamente para Vecchio!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
