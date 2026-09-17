const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.deleteMany({ where: { email: 'admin@garagebook.local' } })
  .then(res => console.log('Deleted admin', res))
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
