const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addDeliveryOrders() {
  const restaurant = await prisma.restaurant.findFirst();
  if (!restaurant) {
    console.log("No restaurant found");
    return;
  }
  const product = await prisma.product.findFirst({ where: { restaurantId: restaurant.id } });
  
  const names = ["Carlos", "Maria", "Juan", "Ana", "Pedro", "Lucia", "Jose", "Marta", "Luis", "Elena"];
  
  for(let i=0; i<10; i++) {
    await prisma.order.create({
      data: {
        customerName: names[i],
        customerPhone: "351" + Math.floor(Math.random() * 10000000),
        deliveryMethod: "DELIVERY",
        address: "Calle Falsa " + (123 + i),
        total: product ? product.price * 2 : 1000,
        status: "PENDING",
        restaurantId: restaurant.id,
        items: product ? {
          create: [{
            productId: product.id,
            productName: product.name,
            quantity: 2,
            priceAtPurchase: product.price
          }]
        } : undefined
      }
    });
  }
  
  console.log("10 delivery orders created!");
}

addDeliveryOrders().catch(console.error).finally(() => prisma.$disconnect());
