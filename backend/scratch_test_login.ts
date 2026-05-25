import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function testLogin() {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { email: 'admin@security.com' } });
    if (!user) {
      console.log('User not found');
      return;
    }
    console.log('User found:', user.email);
    const isPasswordValid = await bcrypt.compare('admin123', user.password);
    console.log('Password valid:', isPasswordValid);
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
