import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

async function main() {
  const phone = '0454545454';
  const rawPassword = 'pass012';

  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { phone },
        { email: 'admin2@delicesdeva.com' },
      ],
    },
  });

  if (existingUser) {
    const updated = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        phone,
        password: hashedPassword,
        role: 'admin',
        emailVerified: existingUser.emailVerified || new Date(),
        name: existingUser.name || 'Admin',
      },
    });
    console.log('Successfully updated existing admin user:', {
      id: updated.id,
      name: updated.name,
      phone: updated.phone,
      email: updated.email,
      role: updated.role,
    });
  } else {
    const created = await prisma.user.create({
      data: {
        name: 'Admin 2',
        phone,
        email: 'admin2@delicesdeva.com',
        password: hashedPassword,
        role: 'admin',
        emailVerified: new Date(),
      },
    });
    console.log('Successfully created new admin user:', {
      id: created.id,
      name: created.name,
      phone: created.phone,
      email: created.email,
      role: created.role,
    });
  }
}

main()
  .catch((e) => {
    console.error('Failed to create admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
