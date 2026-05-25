import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // Create roles
  const roleAdmin = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrator role',
    },
  });

  const roleTeacher = await prisma.role.upsert({
    where: { name: 'TEACHER' },
    update: {},
    create: {
      name: 'TEACHER',
      description: 'Teacher role',
    },
  });

  const roleStudent = await prisma.role.upsert({
    where: { name: 'STUDENT' },
    update: {},
    create: {
      name: 'STUDENT',
      description: 'Student role',
    },
  });

  console.log('Roles created.');

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: {
        connect: { id: roleAdmin.id },
      },
    },
  });

  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@example.com' },
    update: {},
    create: {
      username: 'teacher',
      email: 'teacher@example.com',
      password: hashedPassword,
      role: {
        connect: { id: roleTeacher.id },
      },
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      username: 'student',
      email: 'student@example.com',
      password: hashedPassword,
      role: {
        connect: { id: roleStudent.id },
      },
    },
  });

  console.log('Users created.');
  console.log({ adminUser, teacherUser, studentUser });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
