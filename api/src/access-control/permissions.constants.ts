export const PERMISSIONS = {
  INSTITUTION_VIEW: "institution.view",
  INSTITUTION_UPDATE: "institution.update",
  INSTITUTION_VERIFY: "institution.verify",

  MEMBERSHIP_VIEW: "membership.view",
  MEMBERSHIP_INVITE: "membership.invite",
  MEMBERSHIP_ASSIGN: "membership.assign",
  MEMBERSHIP_SUSPEND: "membership.suspend",

  DEPARTMENT_VIEW: "department.view",
  DEPARTMENT_CREATE: "department.create",
  DEPARTMENT_UPDATE: "department.update",
  DEPARTMENT_ASSIGN: "department.assign",

  ROLE_VIEW: "role.view",
  ROLE_CREATE: "role.create",
  ROLE_UPDATE: "role.update",
  ROLE_ASSIGN: "role.assign",

  STAFF_VIEW: "staff.view",
  STAFF_CREATE: "staff.create",
  STAFF_UPDATE: "staff.update",

  STUDENT_VIEW: "student.view",
  STUDENT_CREATE: "student.create",
  STUDENT_UPDATE: "student.update",

  STUDENT_POSITION_VIEW: "student.position.view",
  STUDENT_POSITION_CREATE: "student.position.create",
  STUDENT_POSITION_ASSIGN: "student.position.assign",
  STUDENT_POSITION_UPDATE: "student.position.update",

  GUARDIAN_VIEW: "guardian.view",
  GUARDIAN_CREATE: "guardian.create",
  GUARDIAN_UPDATE: "guardian.update",
  GUARDIAN_APPROVE: "guardian.approve",

  PROGRAM_VIEW: "program.view",
  PROGRAM_CREATE: "program.create",
  PROGRAM_UPDATE: "program.update",

  PROGRAM_GRADE_VIEW: "program.grade.view",
  PROGRAM_GRADE_CREATE: "program.grade.create",
  PROGRAM_GRADE_UPDATE: "program.grade.update",
  
  PROGRAM_SUBJECT_VIEW: "program.subject.view",
  PROGRAM_SUBJECT_CREATE: "program.subject.create",
  PROGRAM_SUBJECT_UPDATE: "program.subject.update",

  GRADE_VIEW: "grade.view",
  GRADE_CREATE: "grade.create",
  GRADE_UPDATE: "grade.update",

  SUBJECT_VIEW: "subject.view",
  SUBJECT_CREATE: "subject.create",
  SUBJECT_UPDATE: "subject.update",
  SUBJECT_ASSIGN: "subject.assign",

  CLASS_VIEW: "class.view",
  CLASS_CREATE: "class.create",
  CLASS_UPDATE: "class.update",

  BILLING_VIEW: "billing.view",
  BILLING_MANAGE: "billing.manage",

  HOPE_CENTER_VIEW: "hope.view",
  HOPE_CENTER_MANAGE: "hope.manage",

  SOCIAL_MANAGE: "social.manage",
  COMMUNICATIONS_MANAGE: "communications.manage",
  MARKETING_MANAGE: "marketing.manage",

  ENROLLMENT_VIEW: "enrollment.view",
  ENROLLMENT_CREATE: "enrollment.create",
  ENROLLMENT_UPDATE: "enrollment.update",
  ENROLLMENT_PROMOTE: "enrollment.promote",
  ENROLLMENT_TRANSFER: "enrollment.transfer",
  ENROLLMENT_GRADUATE: "enrollment.graduate",
  ENROLLMENT_WITHDRAW: "enrollment.withdraw",

  ACADEMIC_PERIOD_VIEW: "academic.period.view",
  ACADEMIC_PERIOD_CREATE: "academic.period.create",
  ACADEMIC_PERIOD_UPDATE: "academic.period.update",
  ACADEMIC_PERIOD_ACTIVATE: "academic.period.activate",
  ACADEMIC_PERIOD_CLOSE: "academic.period.close",

} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];