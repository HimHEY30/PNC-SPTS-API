export const ROLE_HIERARCHY = [
  'SUPER_ADMIN',
  'ADMIN',
  'ACADEMIC_MANAGER',
  'FOLLOWUP_OFFICER',
  'TUTOR',
  'STUDENT',
] as const;

export type SupportedRole = (typeof ROLE_HIERARCHY)[number];

export const ROLE_PERMISSIONS: Record<SupportedRole, string[]> = {
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

export const ROLE_MANAGEMENT_SCOPE: Record<SupportedRole, SupportedRole[]> = {
  SUPER_ADMIN: ['ADMIN', 'ACADEMIC_MANAGER', 'FOLLOWUP_OFFICER', 'TUTOR', 'STUDENT'],
  ADMIN: ['ACADEMIC_MANAGER', 'FOLLOWUP_OFFICER', 'TUTOR', 'STUDENT'],
  ACADEMIC_MANAGER: ['FOLLOWUP_OFFICER', 'TUTOR', 'STUDENT'],
  FOLLOWUP_OFFICER: ['STUDENT'],
  TUTOR: [],
  STUDENT: [],
};
