const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const restaurantId = 6; // Vecchio

  // 1. Delete existing products for Vecchio
  await prisma.product.deleteMany({
    where: { restaurantId }
  });
  console.log('Productos anteriores eliminados.');

  const realisticData = {
    'Pizzas': [
      'Muzzarella', 'Napolitana', 'Fugazzeta', 'Calabresa', 'Cuatro Quesos', 
      'Rúcula y Jamón Crudo', 'Margarita', 'Especial de Jamón y Morrones', 'Pepperoni', 'Provolone'
    ],
    'Hamburguesas': [
      'Clásica con Queso', 'Doble Bacon Cheeseburger', 'Veggie de Lentejas', 'Crispy Chicken', 
      'Americana con BBQ', 'Cheddar y Cebolla Caramelizada', 'Cuarto de Libra', 'Royale con Queso', 
      'Especial de la Casa', 'Blue Cheese Burger'
    ],
    'Bebidas': [
      'Coca-Cola 1.5L', 'Sprite 1.5L', 'Agua Mineral sin gas', 'Cerveza Artesanal IPA', 
      'Cerveza Stella Artois', 'Jugo de Naranja Natural', 'Limonada con Menta y Jengibre', 
      'Fanta 1.5L', 'Agua con gas', 'Vino Tinto Malbec'
    ],
    'Postres': [
      'Flan Mixto con Dulce de Leche y Crema', 'Volcán de Chocolate', 'Helado Artesanal 1/4 Kg', 
      'Tiramisú Clásico', 'Cheesecake de Frutos Rojos', 'Brownie Tibio con Helado', 
      'Copa Oreo', 'Ensalada de Frutas Frescas', 'Mousse de Chocolate', 'Porción de Chocotorta'
    ],
    'Empanadas': [
      'Carne Cortada a Cuchillo', 'Carne Picante', 'Jamón y Queso', 'Pollo', 'Humita', 
      'Verdura', 'Roquefort y Apio', 'Cebolla y Queso', 'Caprese', 'Matambre a la Pizza'
    ]
  };

  for (const [catName, products] of Object.entries(realisticData)) {
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

    // 3. Create products
    const productsToCreate = products.map((prodName, i) => {
      const isAvailable = Math.random() > 0.1; // 90% available
      const price = Math.floor(Math.random() * 5000) + 2000;
      
      return {
        name: prodName,
        description: `Exquisita opción de ${prodName.toLowerCase()} elaborada con la mejor calidad.`,
        price,
        categoryId: category.id,
        restaurantId,
        isActive: isAvailable,
        imageUrl: `https://loremflickr.com/320/240/${catName.toLowerCase()}?lock=${Math.floor(Math.random() * 1000)}`
      };
    });

    await prisma.product.createMany({
      data: productsToCreate
    });
    
    console.log(`Creados 10 productos con nombres reales para la categoría: ${catName}`);
  }

  console.log("¡Nombres reales actualizados exitosamente!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
