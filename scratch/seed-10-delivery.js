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
  const products = await prisma.product.findMany({ where: { restaurantId } });

  if (products.length === 0) {
    console.error('No products found for this restaurant.');
    return;
  }

  // Helpers to get specific types of products
  const getRandomProduct = () => products[Math.floor(Math.random() * products.length)];

  const names = ['Juan Pérez', 'María Gómez', 'Carlos López', 'Ana Martínez', 'Martín Rodríguez', 'Lucía Fernández', 'Diego Sánchez', 'Sofía Romero', 'Lucas Suárez', 'Valeria Torres'];
  const addresses = ['Calle Falsa 123', 'Av. Libertador 4567, Piso 4', 'Belgrano 890, Casa 4', 'San Martín 1500', 'Mitre 200, Dpto 2A', 'Rivadavia 350', 'Sarmiento 1111', 'Laprida 450', '9 de Julio 900', 'Corrientes 2222'];

  for (let i = 0; i < 10; i++) {
    const numItems = Math.floor(Math.random() * 3) + 1; // 1 to 3 items
    const items = [];
    for (let j = 0; j < numItems; j++) {
      const p = getRandomProduct();
      items.push({
        productId: p.id,
        productName: p.name,
        quantity: Math.floor(Math.random() * 2) + 1,
        priceAtPurchase: p.price,
        notes: Math.random() > 0.7 ? 'Sin condimentos' : ''
      });
    }

    const total = items.reduce((sum, item) => sum + (item.priceAtPurchase * item.quantity), 0);

    const orderData = {
      customerName: names[i],
      customerPhone: `11${Math.floor(Math.random() * 100000000)}`,
      deliveryMethod: 'DELIVERY',
      address: addresses[i],
      status: 'PENDING',
      paymentMethod: Math.random() > 0.5 ? 'CASH' : 'TRANSFER',
      paymentDetails: '',
      customerNotes: 'Timbre roto, avisar al llegar',
      restaurantId,
      total
    };

    const createdOrder = await prisma.order.create({
      data: {
        ...orderData,
        items: {
          create: items
        }
      }
    });
    console.log(`Created delivery order #${createdOrder.id} for ${createdOrder.customerName}`);
  }

  console.log('Successfully seeded 10 delivery orders!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
