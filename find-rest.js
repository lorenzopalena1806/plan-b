const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const rest = await prisma.restaurant.findFirst();
  console.log(rest ? rest.slug : 'NONE');
}
main();
