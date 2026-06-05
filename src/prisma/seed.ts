import * as dotenv from 'dotenv';
dotenv.config({ override: true });
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

  // --- ACADEMIC CORE SEED DATA ---
  console.log('Seeding Academic Core data...');

  // 1. Terms
  const term1 = await prisma.term.upsert({
    where: { academicYear_semester: { academicYear: '2026', semester: 'Semester 1' } },
    update: {},
    create: { academicYear: '2026', semester: 'Semester 1', startDate: new Date('2026-09-01'), endDate: new Date('2027-01-31') }
  });

  // 2. Classes
  const class1 = await prisma.class.upsert({
    where: { name_batchYear: { name: 'SNA 2026', batchYear: 2026 } },
    update: {},
    create: { name: 'SNA 2026', batchYear: 2026 }
  });
  const class2 = await prisma.class.upsert({
    where: { name_batchYear: { name: 'WEB 2026', batchYear: 2026 } },
    update: {},
    create: { name: 'WEB 2026', batchYear: 2026 }
  });

  // 3. Subjects
  const subject1 = await prisma.subject.upsert({
    where: { code: 'SUB-WEB101' },
    update: {},
    create: { code: 'SUB-WEB101', name: 'Frontend Web Development', credit: 3 }
  });
  const subject2 = await prisma.subject.upsert({
    where: { code: 'SUB-SNA101' },
    update: {},
    create: { code: 'SUB-SNA101', name: 'System and Network Administration', credit: 4 }
  });

  // 4. Teachers (Link to AuthUsers)
  const teacherTutor = await prisma.teacher.upsert({
    where: { teacherCode: 'TCH-001' },
    update: { userId: tutorUser.id },
    create: { teacherCode: 'TCH-001', firstName: 'Default', lastName: 'Tutor', userId: tutorUser.id }
  });

  // 5. Students
  const studentsData = [
    { studentCode: 'STU-001', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', gender: 'female', classId: class1.id },
    { studentCode: 'STU-002', firstName: 'Bob', lastName: 'Jones', email: 'bob@example.com', gender: 'male', classId: class2.id },
    { studentCode: 'STU-003', firstName: 'Charlie', lastName: 'Brown', email: 'charlie@example.com', gender: 'male', classId: class2.id }
  ];

  for (const stu of studentsData) {
    await prisma.student.upsert({
      where: { studentCode: stu.studentCode },
      update: { classId: stu.classId },
      // @ts-ignore
      create: stu
    });
  }

  console.log('Academic core data created.');

  // FollowUpStatus is an enum (OPEN, IN_PROGRESS, RESOLVED, CLOSED) — no seeding required.

  // Seed follow‑up case types
  const caseTypeAcademic = await prisma.followUpCaseType.upsert({
    where: { name: 'Academic' },
    update: {},
    create: { name: 'Academic', description: 'Academic related issue' },
  });
  const caseTypeBehaviour = await prisma.followUpCaseType.upsert({
    where: { name: 'Behaviour' },
    update: {},
    create: { name: 'Behaviour', description: 'Behavioural issue' },
  });

  // Retrieve existing entities for linking
  const studentAlice = await prisma.student.findUnique({ where: { studentCode: 'STU-001' } });
  const teacherJohn = await prisma.teacher.findUnique({ where: { teacherCode: 'TCH-001' } });
  const term2023 = await prisma.term.findFirst({ where: { academicYear: '2026' } });

  // Seed a follow‑up case linked to Alice and John
  const followUpCase = await prisma.followUpCase.create({
    data: {
      student: { connect: { id: studentAlice.id } },
      openedByTeacher: { connect: { id: teacherJohn.id } },
      term: { connect: { id: term2023.id } },
      title: 'Math performance decline',
      description: 'Student is struggling with algebra concepts.',
      priority: 'high',
      status: 'OPEN',
      caseTypeMap: { create: [{ followUpType: { connect: { id: caseTypeAcademic.id } } }] },
    },
  });

  // Seed a report for the case
  const report = await prisma.followUpReport.create({
    data: {
      followUpCase: { connect: { id: followUpCase.id } },
      teacher: { connect: { id: teacherJohn.id } },
      progressStatus: 'Initial assessment',
      observation: 'Needs extra tutoring sessions.',
      nextAction: 'Schedule bi‑weekly review.',
    },
  });

  // Seed an attachment for the report (dummy file path)
  await prisma.followUpAttachment.create({
    data: {
      report: { connect: { id: report.id } },
      fileName: 'assessment.pdf',
      filePath: '/uploads/assessment.pdf',
      fileType: 'application/pdf',
      fileSize: 102400,
    },
  });

  console.log({
    roles: roleEntries.map((role) => role.name),
    users: [superAdminUser.email, adminUser.email, tutorUser.email],
    academic: { terms: 1, classes: 2, subjects: 2, teachers: 1, students: 3 }
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
