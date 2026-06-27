const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultImages = {
  '🍕 Pizzas': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80',
  '🥟 Empanadas': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80', // Better empanada-like food
  '🍔 Hamburguesas': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
  '🥤 Bebidas': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
  '🍰 Postres': 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=400&q=80',
  '🔥 Promos': 'https://images.unsplash.com/photo-1594212202875-86ac519fe188?auto=format&fit=crop&w=400&q=80',
};

async function main() {
  const categories = await prisma.category.findMany();
  
  for (const cat of categories) {
    const imageUrl = defaultImages[cat.name];
    if (imageUrl) {
      await prisma.product.updateMany({
        where: { categoryId: cat.id },
        data: { imageUrl }
      });
      console.log(`Updated images for category: ${cat.name}`);
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
