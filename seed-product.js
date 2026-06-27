const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const rest = await prisma.restaurant.findUnique({ where: { slug: 'pepe-burger' } });
  if (!rest) { console.log('No rest'); return; }
  
  // Clean first to avoid duplicates
  await prisma.product.deleteMany({ where: { restaurantId: rest.id }});
  await prisma.category.deleteMany({ where: { restaurantId: rest.id }});

  const cat = await prisma.category.create({ data: { name: 'Hamburguesas', restaurantId: rest.id } });
  await prisma.product.create({ data: { name: 'Doble Queso', price: 5000, categoryId: cat.id, restaurantId: rest.id, description: 'Muy rica', isActive: true } });
  
  const config = await prisma.config.findFirst({ where: { restaurantId: rest.id } });
  if (config) {
    await prisma.config.update({ where: { id: config.id }, data: { isOpenOverride: true } });
  }

  // Force business hours to 24/7
  await prisma.businessHour.updateMany({
    where: { restaurantId: rest.id },
    data: { shift1Open: '00:00', shift1Close: '23:59', shift2Open: null, shift2Close: null, isOpen: true }
  });
  
  console.log('Producto inyectado correctamente y local abierto 24/7 para pepe-burger');
}
main();
