const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const slug = 'lo-del-pela';
  const restaurant = await prisma.restaurant.findUnique({ where: { slug } });

  if (!restaurant) {
    console.error(`Restaurant with slug ${slug} not found`);
    return;
  }

  const restaurantId = restaurant.id;
  console.log(`Found restaurant: ${restaurant.name} (ID: ${restaurantId})`);

  // Clear existing menu data for this restaurant
  await prisma.product.deleteMany({ where: { restaurantId } });
  await prisma.category.deleteMany({ where: { restaurantId } });
  await prisma.modifierOption.deleteMany({ where: { restaurantId } });
  console.log('Cleared existing menu data.');

  // Create Categories
  const categoriesData = [
    { name: '🔥 Promos', restaurantId },
    { name: '🍕 Pizzas', restaurantId },
    { name: '🥟 Empanadas', restaurantId },
    { name: '🍔 Hamburguesas', restaurantId },
    { name: '🍰 Postres', restaurantId },
    { name: '🥤 Bebidas', restaurantId },
  ];

  const createdCategories = [];
  for (const c of categoriesData) {
    createdCategories.push(await prisma.category.create({ data: c }));
  }
  const getCatId = (name) => createdCategories.find(c => c.name === name).id;
  console.log('Categories created.');

  // Create Modifiers
  const modifiersData = [
    { name: 'Sin Cebolla', type: 'FREE', price: 0, restaurantId },
    { name: 'Sin Tomate', type: 'FREE', price: 0, restaurantId },
    { name: 'Sin Orégano', type: 'FREE', price: 0, restaurantId },
    { name: 'Extra Muzzarella', type: 'PAID', price: 1500, restaurantId },
    { name: 'Extra Cheddar', type: 'PAID', price: 1200, restaurantId },
    { name: 'Extra Panceta', type: 'PAID', price: 1800, restaurantId },
    { name: 'Borde Relleno Queso', type: 'PAID', price: 2500, restaurantId },
    { name: 'Papas Fritas Medianas', type: 'PAID', price: 3000, restaurantId },
  ];

  const createdModifiers = [];
  for (const m of modifiersData) {
    createdModifiers.push(await prisma.modifierOption.create({ data: m }));
  }
  console.log('Modifiers created.');

  // Helper to connect modifiers
  const connectModifiers = (names) => ({
    connect: names.map(n => ({ id: createdModifiers.find(m => m.name === n).id }))
  });

  // Products
  const products = [
    // PROMOS
    {
      name: 'Combo Familiar 1',
      description: '1 Pizza Muzzarella Grande + 12 Empanadas (sabores surtidos) + Coca-Cola 1.5L',
      price: 24000,
      imageUrl: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=400&q=80',
      categoryId: getCatId('🔥 Promos'),
      isPromo: true,
      restaurantId,
    },
    {
      name: 'Promo 2 Pizzas',
      description: '2 Pizzas Muzzarella Grandes a un súper precio',
      price: 15000,
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80',
      categoryId: getCatId('🔥 Promos'),
      isPromo: true,
      restaurantId,
      modifiers: connectModifiers(['Extra Muzzarella']),
    },
    {
      name: 'Menú Hamburguesa Doble',
      description: 'Doble carne, doble cheddar, panceta y papas fritas',
      price: 9500,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
      categoryId: getCatId('🔥 Promos'),
      isPromo: true,
      restaurantId,
      modifiers: connectModifiers(['Sin Tomate', 'Sin Cebolla', 'Extra Cheddar']),
    },

    // PIZZAS
    {
      name: 'Pizza Muzzarella',
      description: 'Salsa de tomate, abundante muzzarella, aceitunas y orégano',
      price: 8500,
      imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80',
      categoryId: getCatId('🍕 Pizzas'),
      restaurantId,
      modifiers: connectModifiers(['Sin Orégano', 'Extra Muzzarella', 'Borde Relleno Queso']),
    },
    {
      name: 'Pizza Napolitana',
      description: 'Muzzarella, rodajas de tomate fresco, ajo y albahaca',
      price: 9500,
      imageUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a30536?w=400&q=80',
      categoryId: getCatId('🍕 Pizzas'),
      restaurantId,
      modifiers: connectModifiers(['Sin Tomate', 'Extra Muzzarella', 'Borde Relleno Queso']),
    },
    {
      name: 'Pizza Fugazzeta',
      description: 'Muzzarella y muchísima cebolla gratinada',
      price: 9800,
      imageUrl: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=400&q=80',
      categoryId: getCatId('🍕 Pizzas'),
      restaurantId,
      modifiers: connectModifiers(['Sin Cebolla', 'Extra Muzzarella']),
    },
    {
      name: 'Pizza Calabresa',
      description: 'Muzzarella, longaniza calabresa picante y morrones',
      price: 10500,
      imageUrl: 'https://images.unsplash.com/photo-1528137871618-79d2761e3fd5?w=400&q=80',
      categoryId: getCatId('🍕 Pizzas'),
      restaurantId,
      modifiers: connectModifiers(['Extra Muzzarella', 'Borde Relleno Queso']),
    },
    {
      name: 'Pizza Rúcula y Jamón Crudo',
      description: 'Muzzarella, jamón crudo seleccionado, rúcula fresca y parmesano',
      price: 11500,
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80',
      categoryId: getCatId('🍕 Pizzas'),
      restaurantId,
    },
    {
      name: 'Pizza Cuatro Quesos',
      description: 'Muzzarella, provolone, roquefort y sardo',
      price: 11000,
      imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80',
      categoryId: getCatId('🍕 Pizzas'),
      restaurantId,
    },

    // EMPANADAS
    {
      name: 'Empanada de Carne Suave (Unidad)',
      description: 'Clásica de carne picada, cebolla, huevo y aceitunas. (Frita o al horno)',
      price: 1200,
      imageUrl: 'https://images.unsplash.com/photo-1628198305001-c85d7747e0aa?w=400&q=80',
      categoryId: getCatId('🥟 Empanadas'),
      restaurantId,
    },
    {
      name: 'Empanada de Carne Cuchillo (Unidad)',
      description: 'Carne cortada a cuchillo con morrón y especias.',
      price: 1300,
      imageUrl: 'https://images.unsplash.com/photo-1628198305001-c85d7747e0aa?w=400&q=80',
      categoryId: getCatId('🥟 Empanadas'),
      restaurantId,
    },
    {
      name: 'Empanada de Jamón y Queso (Unidad)',
      description: 'Abundante muzzarella y jamón cocido',
      price: 1100,
      imageUrl: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&q=80',
      categoryId: getCatId('🥟 Empanadas'),
      restaurantId,
    },
    {
      name: 'Empanada de Pollo (Unidad)',
      description: 'Pollo desmenuzado con morrón, cebolla y huevo',
      price: 1100,
      imageUrl: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&q=80',
      categoryId: getCatId('🥟 Empanadas'),
      restaurantId,
    },
    {
      name: 'Empanada de Verdura (Unidad)',
      description: 'Acelga, espinaca y salsa blanca',
      price: 1100,
      imageUrl: 'https://images.unsplash.com/photo-1628198305001-c85d7747e0aa?w=400&q=80',
      categoryId: getCatId('🥟 Empanadas'),
      restaurantId,
    },
    {
      name: 'Empanada de Roquefort (Unidad)',
      description: 'Muzzarella, roquefort y nuez',
      price: 1300,
      imageUrl: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&q=80',
      categoryId: getCatId('🥟 Empanadas'),
      restaurantId,
    },

    // HAMBURGUESAS
    {
      name: 'Hamburguesa Clásica',
      description: 'Medallón de carne 180g, lechuga, tomate y queso',
      price: 7500,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
      categoryId: getCatId('🍔 Hamburguesas'),
      restaurantId,
      modifiers: connectModifiers(['Sin Tomate', 'Sin Cebolla', 'Extra Cheddar', 'Extra Panceta', 'Papas Fritas Medianas']),
    },
    {
      name: 'Hamburguesa Bacon Cheddar',
      description: 'Doble carne, cuádruple cheddar, bacon crujiente y cebolla crispy',
      price: 10500,
      imageUrl: 'https://images.unsplash.com/photo-1594212202875-86ac519fe188?w=400&q=80',
      categoryId: getCatId('🍔 Hamburguesas'),
      restaurantId,
      modifiers: connectModifiers(['Sin Cebolla', 'Extra Cheddar', 'Extra Panceta', 'Papas Fritas Medianas']),
    },
    {
      name: 'Hamburguesa Veggie',
      description: 'Medallón NotBeef, queso cheddar vegano, rúcula y tomate',
      price: 8500,
      imageUrl: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=400&q=80',
      categoryId: getCatId('🍔 Hamburguesas'),
      restaurantId,
      modifiers: connectModifiers(['Sin Tomate', 'Papas Fritas Medianas']),
    },

    // BEBIDAS
    {
      name: 'Coca-Cola 1.5L',
      description: 'Gaseosa sabor cola',
      price: 3500,
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80',
      categoryId: getCatId('🥤 Bebidas'),
      restaurantId,
    },
    {
      name: 'Sprite 1.5L',
      description: 'Gaseosa sabor lima limón',
      price: 3500,
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80',
      categoryId: getCatId('🥤 Bebidas'),
      restaurantId,
    },
    {
      name: 'Fanta 1.5L',
      description: 'Gaseosa sabor naranja',
      price: 3500,
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80',
      categoryId: getCatId('🥤 Bebidas'),
      restaurantId,
    },
    {
      name: 'Agua Mineral 500ml',
      description: 'Agua sin gas',
      price: 1500,
      imageUrl: 'https://images.unsplash.com/photo-1559839913-11402aa10471?w=400&q=80',
      categoryId: getCatId('🥤 Bebidas'),
      restaurantId,
    },
    {
      name: 'Cerveza Quilmes 1L',
      description: 'Cerveza rubia clásica retornable',
      price: 4500,
      imageUrl: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400&q=80',
      categoryId: getCatId('🥤 Bebidas'),
      restaurantId,
    },
    {
      name: 'Cerveza Patagonia Amber Lager 730ml',
      description: 'Cerveza roja premium',
      price: 6000,
      imageUrl: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400&q=80',
      categoryId: getCatId('🥤 Bebidas'),
      restaurantId,
    },

    // POSTRES
    {
      name: 'Flan Casero',
      description: 'Flan mixto con abundante crema y dulce de leche',
      price: 3500,
      imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=400&q=80',
      categoryId: getCatId('🍰 Postres'),
      restaurantId,
    },
    {
      name: 'Porción de Chocotorta',
      description: 'Clásica chocotorta argentina con galletitas Chocolinas',
      price: 4500,
      imageUrl: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=400&q=80',
      categoryId: getCatId('🍰 Postres'),
      restaurantId,
    },
    {
      name: 'Tiramisú',
      description: 'Postre italiano con café, vainillas y mascarpone',
      price: 4500,
      imageUrl: 'https://images.unsplash.com/photo-1571115177098-24def8116788?w=400&q=80',
      categoryId: getCatId('🍰 Postres'),
      restaurantId,
    },
    {
      name: 'Helado Artesanal 1/4 KG',
      description: 'Elección de hasta 3 gustos',
      price: 5000,
      imageUrl: 'https://images.unsplash.com/photo-1557142046-c704a3adf364?w=400&q=80',
      categoryId: getCatId('🍰 Postres'),
      restaurantId,
    },
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  console.log(`Menu seeded successfully with ${products.length} products!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
