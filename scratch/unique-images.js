const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const customImages = {
  // PROMOS
  'Combo Familiar 1': 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=400&q=80',
  'Promo 2 Pizzas': 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=400&q=80',
  'Menú Hamburguesa Doble': 'https://images.unsplash.com/photo-1610440042657-612c34d95e9f?w=400&q=80',

  // PIZZAS
  'Pizza Muzzarella': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80',
  'Pizza Napolitana': 'https://images.unsplash.com/photo-1604068549290-dea0e4a30536?w=400&q=80',
  'Pizza Fugazzeta': 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=400&q=80',
  'Pizza Calabresa': 'https://images.unsplash.com/photo-1528137871618-79d2761e3fd5?w=400&q=80',
  'Pizza Rúcula y Jamón Crudo': 'https://images.unsplash.com/photo-1534308983496-4fbf1a0d5fc2?w=400&q=80',
  'Pizza Cuatro Quesos': 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400&q=80',

  // EMPANADAS
  'Empanada de Carne Suave (Unidad)': 'https://images.unsplash.com/photo-1628198305001-c85d7747e0aa?w=400&q=80',
  'Empanada de Carne Cuchillo (Unidad)': 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400&q=80',
  'Empanada de Jamón y Queso (Unidad)': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80',
  'Empanada de Pollo (Unidad)': 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?w=400&q=80',
  'Empanada de Verdura (Unidad)': 'https://images.unsplash.com/photo-1536521642388-441263f88a61?w=400&q=80',
  'Empanada de Roquefort (Unidad)': 'https://images.unsplash.com/photo-1603569283847-aa295f0d016a?w=400&q=80',

  // HAMBURGUESAS
  'Hamburguesa Clásica': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
  'Hamburguesa Bacon Cheddar': 'https://images.unsplash.com/photo-1594212202875-86ac519fe188?w=400&q=80',
  'Hamburguesa Veggie': 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=400&q=80',

  // BEBIDAS
  'Coca-Cola 1.5L': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80',
  'Sprite 1.5L': 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&q=80',
  'Fanta 1.5L': 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=400&q=80',
  'Agua Mineral 500ml': 'https://images.unsplash.com/photo-1559839913-11402aa10471?w=400&q=80',
  'Cerveza Quilmes 1L': 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400&q=80',
  'Cerveza Patagonia Amber Lager 730ml': 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&q=80',

  // POSTRES
  'Flan Casero': 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=400&q=80',
  'Porción de Chocotorta': 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=400&q=80',
  'Tiramisú': 'https://images.unsplash.com/photo-1571115177098-24def8116788?w=400&q=80',
  'Helado Artesanal 1/4 KG': 'https://images.unsplash.com/photo-1557142046-c704a3adf364?w=400&q=80',
};

async function main() {
  const products = await prisma.product.findMany();
  
  for (const product of products) {
    const imageUrl = customImages[product.name];
    if (imageUrl) {
      await prisma.product.update({
        where: { id: product.id },
        data: { imageUrl }
      });
      console.log(`Updated image for: ${product.name}`);
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
