const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const restaurants = await prisma.restaurant.findMany({
    include: {
      managers: { select: { username: true } },
      users: { select: { username: true } }
    }
  });
  console.log("=== RESTAURANTS ===");
  console.dir(restaurants, { depth: null });

  const users = await prisma.user.findMany({
    include: {
      restaurant: { select: { name: true, slug: true } },
      managedRestaurants: { select: { name: true, slug: true } }
    }
  });
  console.log("\n=== USERS ===");
  console.dir(users, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());
