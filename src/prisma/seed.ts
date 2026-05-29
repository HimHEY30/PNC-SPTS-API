import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: [
    'user.create',
    'user.read',
    'user.update',
    'user.delete',
    'user.assign_role',
    'role.create',
    'role.read',
    'role.update',
    'role.delete',
    'permission.read',
    'permission.assign',
    'system.manage',
    'audit.read',
  ],
  ADMIN: [
    'user.create',
    'user.read',
    'user.update',
    'user.assign_role',
    'student.*',
    'followup.*',
    'evaluation.*',
    'report.read',
  ],
  ACADEMIC_MANAGER: [
    'student.read',
    'student.update',
    'followup.read',
    'followup.approve',
    'evaluation.read',
    'evaluation.approve',
    'report.read',
  ],
  FOLLOWUP_OFFICER: [
    'student.read',
    'student.update',
    'followup.create',
    'followup.update',
    'followup.close',
  ],
  TUTOR: [
    'student.read_assigned',
    'evaluation.create',
    'evaluation.update',
    'evaluation.submit',
    'score.create',
    'score.update',
  ],
  STUDENT: [
    'profile.read',
    'followup.read_own',
    'evaluation.read_own',
    'score.read_own',
  ],
};

async function findOrCreateSeedUser(data: {
  email: string;
  password_hash: string;
  entity_type: string;
  first_name: string;
  last_name: string;
  status: 'ACTIVE';
}) {
  const existingUser = await prisma.authUser.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    return prisma.authUser.update({
      where: { email: data.email },
      data,
    });
  }

  try {
    return await prisma.authUser.create({ data });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return prisma.authUser.update({
        where: { email: data.email },
        data,
      });
    }
    throw error;
  }
}

async function assignRole(userId: string, roleId: string) {
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId,
      },
    },
    update: {},
    create: {
      userId,
      roleId,
    },
  });
}

async function main() {
  console.log('Start seeding ...');

  const allPermissionNames = [...new Set(Object.values(ROLE_PERMISSIONS).flat())];
  await Promise.all(
    allPermissionNames.map((name) =>
      prisma.permission.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  const roleEntries = await Promise.all(
    Object.entries(ROLE_PERMISSIONS).map(([name, permissions]) =>
      prisma.role.upsert({
        where: { name },
        update: {
          description: `${name.replace(/_/g, ' ')} role`,
          permissions: {
            set: permissions.map((permissionName) => ({
              name: permissionName,
            })),
          },
        },
        create: {
          name,
          description: `${name.replace(/_/g, ' ')} role`,
          permissions: {
            connect: permissions.map((permissionName) => ({
              name: permissionName,
            })),
          },
        },
      }),
    ),
  );

  const rolesByName = new Map(roleEntries.map((role) => [role.name, role]));

  console.log('Roles and permissions created.');

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const superAdminUser = await findOrCreateSeedUser({
    email: 'superadmin@example.com',
    password_hash: hashedPassword,
    entity_type: 'super_admin',
    first_name: 'Super',
    last_name: 'Admin',
    status: 'ACTIVE',
  });
  await assignRole(superAdminUser.id, rolesByName.get('SUPER_ADMIN')!.id);

  const adminUser = await findOrCreateSeedUser({
    email: 'admin@example.com',
    password_hash: hashedPassword,
    entity_type: 'admin',
    first_name: 'System',
    last_name: 'Admin',
    status: 'ACTIVE',
  });
  await assignRole(adminUser.id, rolesByName.get('ADMIN')!.id);

  const tutorUser = await findOrCreateSeedUser({
    email: 'tutor@example.com',
    password_hash: hashedPassword,
    entity_type: 'teacher',
    first_name: 'Default',
    last_name: 'Tutor',
    status: 'ACTIVE',
  });
  await assignRole(tutorUser.id, rolesByName.get('TUTOR')!.id);

  console.log('Users created.');
  console.log({
    roles: roleEntries.map((role) => role.name),
    users: [superAdminUser.email, adminUser.email, tutorUser.email],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
