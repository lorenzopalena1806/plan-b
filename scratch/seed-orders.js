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
  const getProduct = (name) => products.find(p => p.name.includes(name)) || products[0];

  const pizza = getProduct('Muzzarella');
  const burger = getProduct('Hamburguesa Clásica');
  const empanada = getProduct('Empanada');
  const soda = getProduct('Coca-Cola');
  const dessert = getProduct('Flan');

  const ordersData = [
    {
      customerName: 'Juan Pérez',
      deliveryMethod: 'DELIVERY',
      address: 'Calle Falsa 123',
      status: 'AWAITING_CONFIRMATION',
      paymentMethod: 'CASH',
      paymentDetails: 'Paga con $20.000. Vuelto: $6.000',
      customerNotes: 'Timbre 2B. Sin orégano en la pizza.',
      restaurantId,
      items: [
        { productId: pizza.id, productName: pizza.name, quantity: 1, priceAtPurchase: pizza.price, notes: 'Sin orégano' },
        { productId: soda.id, productName: soda.name, quantity: 1, priceAtPurchase: soda.price },
        { productId: dessert.id, productName: dessert.name, quantity: 2, priceAtPurchase: dessert.price }
      ]
    },
    {
      customerName: 'María Gómez',
      deliveryMethod: 'TAKEAWAY',
      address: null,
      status: 'AWAITING_CONFIRMATION',
      paymentMethod: 'TRANSFER',
      paymentDetails: 'Alias: lo.del.pela.mp',
      customerNotes: 'Paso a buscar en 20 min.',
      restaurantId,
      items: [
        { productId: burger.id, productName: burger.name, quantity: 2, priceAtPurchase: burger.price, notes: 'Sin cebolla una de ellas' },
        { productId: soda.id, productName: soda.name, quantity: 1, priceAtPurchase: soda.price }
      ]
    },
    {
      customerName: 'Carlos López',
      deliveryMethod: 'DELIVERY',
      address: 'Av. Libertador 4567, Piso 4',
      status: 'IN_PREPARATION',
      paymentMethod: 'CASH',
      paymentDetails: 'Monto exacto',
      customerNotes: 'Llamar al llegar',
      restaurantId,
      items: [
        { productId: empanada.id, productName: empanada.name, quantity: 12, priceAtPurchase: empanada.price },
        { productId: soda.id, productName: soda.name, quantity: 2, priceAtPurchase: soda.price },
        { productId: dessert.id, productName: dessert.name, quantity: 1, priceAtPurchase: dessert.price }
      ]
    },
    {
      customerName: 'Ana Martínez',
      deliveryMethod: 'DELIVERY',
      address: 'Belgrano 890, Casa 4',
      status: 'READY',
      paymentMethod: 'TRANSFER',
      paymentDetails: 'Alias: lo.del.pela.mp',
      customerNotes: '',
      restaurantId,
      items: [
        { productId: pizza.id, productName: pizza.name, quantity: 2, priceAtPurchase: pizza.price },
        { productId: empanada.id, productName: 'Empanada de Jamón y Queso (Unidad)', quantity: 6, priceAtPurchase: empanada.price }
      ]
    },
    {
      customerName: 'Martín Rodríguez',
      deliveryMethod: 'TAKEAWAY',
      address: null,
      status: 'DELIVERED',
      paymentMethod: 'CASH',
      paymentDetails: 'Monto exacto',
      customerNotes: '',
      restaurantId,
      items: [
        { productId: burger.id, productName: burger.name, quantity: 1, priceAtPurchase: burger.price },
        { productId: dessert.id, productName: dessert.name, quantity: 1, priceAtPurchase: dessert.price }
      ]
    }
  ];

  for (const orderData of ordersData) {
    const items = orderData.items;
    delete orderData.items;
    
    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.priceAtPurchase * item.quantity), 0);
    orderData.total = total;

    const createdOrder = await prisma.order.create({
      data: {
        ...orderData,
        items: {
          create: items
        }
      }
    });
    console.log(`Created order #${createdOrder.id} for ${createdOrder.customerName}`);
  }

  console.log('Successfully seeded 5 diverse test orders!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
