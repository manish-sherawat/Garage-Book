const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
async function main() {
  const pass = await bcrypt.hash('admin', 10);
  await prisma.user.create({
    data: {
      email: 'admin@garagebook.local',
      password: pass,
      name: 'System Admin',
      role: 'ADMIN'
    }
  });
  console.log('Admin created');
}
main().catch(console.error).finally(() => prisma.$disconnect());
