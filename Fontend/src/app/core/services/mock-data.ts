import {
  MenuItem,
  Role,
  User,
  School,
  Branch,
  AcademicYear,
  SchoolClass,
  Section,
  Subject,
  ClassSubjectMapping,
  RoutinePeriod,
  Student,
  Teacher,
  AttendanceRecord,
  Exam,
  ExamScheduleItem,
  ExamMark,
  FeeType,
  FeeStructure,
  StudentInvoice,
  Notice,
  AuditLog,
  RolePermission,
  UserMenuOverride
} from '../models';

export const INITIAL_SCHOOL: School = {
  id: 'sch-01',
  name: 'Dhaka Model School & College',
  code: 'DMSC-101',
  address: 'Road 12, Dhanmondi, Dhaka-1209, Bangladesh',
  contact: '+880 1711-000000',
  email: 'info@dhakamodel.edu.bd',
  logo: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=120&auto=format&fit=crop&q=80',
  website: 'https://dhakamodel.edu.bd',
  status: 'Active'
};

export const INITIAL_BRANCHES: Branch[] = [
  { id: 'br-01', schoolId: 'sch-01', code: 'BR-MAIN', name: 'Main Campus (Dhanmondi)', address: 'Road 12, Dhanmondi, Dhaka', phone: '+880 1711-000001', isActive: true },
  { id: 'br-02', schoolId: 'sch-01', code: 'BR-UTT', name: 'Uttara Branch', address: 'Sector 4, Uttara, Dhaka', phone: '+880 1711-000002', isActive: true }
];

export const INITIAL_ACADEMIC_YEARS: AcademicYear[] = [
  { id: 'ay-2026', name: '2026 - 2027 Academic Session', startDate: '2026-01-01', endDate: '2026-12-31', isCurrent: true, isLocked: false },
  { id: 'ay-2025', name: '2025 - 2026 Academic Session', startDate: '2025-01-01', endDate: '2025-12-31', isCurrent: false, isLocked: true }
];

export const INITIAL_ROLES: Role[] = [
  { id: 'role-admin', code: 'SUPER_ADMIN', name: 'Super Administrator', description: 'Full system and menu control', isSystem: true, userCount: 1 },
  { id: 'role-principal', code: 'PRINCIPAL', name: 'Head Teacher / Principal', description: 'Academic administration & report approvals', isSystem: false, userCount: 1 },
  { id: 'role-teacher', code: 'TEACHER', name: 'Subject Teacher', description: 'Class routine, student attendance, marks entry', isSystem: false, userCount: 6 },
  { id: 'role-accountant', code: 'ACCOUNTANT', name: 'Chief Accountant', description: 'Fee structure, invoices, fee collection & vouchers', isSystem: false, userCount: 2 },
  { id: 'role-student', code: 'STUDENT', name: 'Student / Guardian', description: 'Self profile, result marksheet, routine, invoices', isSystem: false, userCount: 120 }
];

export const INITIAL_MENUS: MenuItem[] = [
  // 1. Dashboard
  {
    id: 'm-dash',
    name: 'Dashboard',
    code: 'DASHBOARD',
    parentCode: null,
    route: '/app/dashboard',
    icon: 'layout-dashboard',
    type: 'Page',
    displayOrder: 1,
    isActive: true,
    isVisible: true,
    permissionCode: 'DASHBOARD_VIEW'
  },

  // 2. Administration
  {
    id: 'm-admin',
    name: 'Administration',
    code: 'ADMINISTRATION',
    parentCode: null,
    icon: 'shield-check',
    type: 'Group',
    displayOrder: 2,
    isActive: true,
    isVisible: true,
    children: [
      { id: 'm-admin-school', name: 'School Setup', code: 'ADMIN_SCHOOL', parentCode: 'ADMINISTRATION', route: '/app/admin/school-setup', icon: 'building', type: 'Page', displayOrder: 1, isActive: true, isVisible: true, permissionCode: 'ADMIN_SCHOOL_VIEW' },
      { id: 'm-admin-users', name: 'User Management', code: 'ADMIN_USERS', parentCode: 'ADMINISTRATION', route: '/app/admin/users', icon: 'users', type: 'Page', displayOrder: 2, isActive: true, isVisible: true, permissionCode: 'ADMIN_USERS_VIEW' },
      { id: 'm-admin-roles', name: 'Role Management', code: 'ADMIN_ROLES', parentCode: 'ADMINISTRATION', route: '/app/admin/roles', icon: 'user-cog', type: 'Page', displayOrder: 3, isActive: true, isVisible: true, permissionCode: 'ADMIN_ROLES_VIEW' },
      { id: 'm-admin-menu', name: 'Menu Management', code: 'ADMIN_MENU', parentCode: 'ADMINISTRATION', route: '/app/admin/menu-management', icon: 'menu', type: 'Page', displayOrder: 4, isActive: true, isVisible: true, permissionCode: 'ADMIN_MENU_VIEW' },
      { id: 'm-admin-role-perm', name: 'Role Menu Assignment', code: 'ADMIN_ROLE_PERM', parentCode: 'ADMINISTRATION', route: '/app/admin/role-permissions', icon: 'lock', type: 'Page', displayOrder: 5, isActive: true, isVisible: true, permissionCode: 'ADMIN_ROLE_PERM_VIEW' },
      { id: 'm-admin-user-perm', name: 'User Menu Assignment', code: 'ADMIN_USER_PERM', parentCode: 'ADMINISTRATION', route: '/app/admin/user-permissions', icon: 'user-check', type: 'Page', displayOrder: 6, isActive: true, isVisible: true, permissionCode: 'ADMIN_USER_PERM_VIEW' },
      { id: 'm-admin-audit', name: 'Audit Log', code: 'ADMIN_AUDIT', parentCode: 'ADMINISTRATION', route: '/app/admin/audit-log', icon: 'history', type: 'Page', displayOrder: 7, isActive: true, isVisible: true, permissionCode: 'ADMIN_AUDIT_VIEW' },
      { id: 'm-admin-backup', name: 'Database Backup', code: 'ADMIN_BACKUP', parentCode: 'ADMINISTRATION', route: '/app/admin/database-backup', icon: 'database', type: 'Page', displayOrder: 8, isActive: true, isVisible: true, permissionCode: 'ADMIN_BACKUP_VIEW' },
      { id: 'm-admin-deploy', name: 'Deployment & Runner', code: 'ADMIN_DEPLOY', parentCode: 'ADMINISTRATION', route: '/app/admin/deployment', icon: 'server', type: 'Page', displayOrder: 9, isActive: true, isVisible: true, permissionCode: 'ADMIN_BACKUP_VIEW' }
    ]
  },

  // 3. Academic
  {
    id: 'm-acad',
    name: 'Academic',
    code: 'ACADEMIC',
    parentCode: null,
    icon: 'graduation-cap',
    type: 'Group',
    displayOrder: 3,
    isActive: true,
    isVisible: true,
    children: [
      { id: 'm-acad-classes', name: 'Classes & Sections', code: 'ACAD_CLASSES', parentCode: 'ACADEMIC', route: '/app/academic/classes', icon: 'layers', type: 'Page', displayOrder: 1, isActive: true, isVisible: true, permissionCode: 'ACAD_CLASSES_VIEW' },
      { id: 'm-acad-subjects', name: 'Subject Setup', code: 'ACAD_SUBJECTS', parentCode: 'ACADEMIC', route: '/app/academic/subjects', icon: 'book-open', type: 'Page', displayOrder: 2, isActive: true, isVisible: true, permissionCode: 'ACAD_SUBJECTS_VIEW' },
      { id: 'm-acad-routine', name: 'Class Routine', code: 'ACAD_ROUTINE', parentCode: 'ACADEMIC', route: '/app/academic/routine', icon: 'calendar-clock', type: 'Page', displayOrder: 3, isActive: true, isVisible: true, permissionCode: 'ACAD_ROUTINE_VIEW' }
    ]
  },

  // 4. Student Lifecycle
  {
    id: 'm-student',
    name: 'Student',
    code: 'STUDENT',
    parentCode: null,
    icon: 'user',
    type: 'Group',
    displayOrder: 4,
    isActive: true,
    isVisible: true,
    children: [
      { id: 'm-stud-admission', name: 'Admission Form', code: 'STUD_ADMISSION', parentCode: 'STUDENT', route: '/app/students/admission', icon: 'user-plus', type: 'Page', displayOrder: 1, isActive: true, isVisible: true, permissionCode: 'STUD_ADMISSION_VIEW' },
      { id: 'm-stud-list', name: 'Student Directory', code: 'STUD_LIST', parentCode: 'STUDENT', route: '/app/students/list', icon: 'users', type: 'Page', displayOrder: 2, isActive: true, isVisible: true, permissionCode: 'STUD_LIST_VIEW' },
      { id: 'm-stud-promotion', name: 'Promotion & Transfer', code: 'STUD_PROMOTION', parentCode: 'STUDENT', route: '/app/students/promotion', icon: 'arrow-up-right', type: 'Page', displayOrder: 3, isActive: true, isVisible: true, permissionCode: 'STUD_PROMOTION_VIEW' }
    ]
  },

  // 5. Teacher & Staff
  {
    id: 'm-teacher',
    name: 'Teacher & Staff',
    code: 'TEACHER_STAFF',
    parentCode: null,
    icon: 'briefcase',
    type: 'Group',
    displayOrder: 5,
    isActive: true,
    isVisible: true,
    children: [
      { id: 'm-teach-list', name: 'Teacher Directory', code: 'TEACH_LIST', parentCode: 'TEACHER_STAFF', route: '/app/teachers/list', icon: 'contact', type: 'Page', displayOrder: 1, isActive: true, isVisible: true, permissionCode: 'TEACH_LIST_VIEW' },
      { id: 'm-teach-leave', name: 'Leave Applications', code: 'TEACH_LEAVE', parentCode: 'TEACHER_STAFF', route: '/app/teachers/leave', icon: 'calendar-off', type: 'Page', displayOrder: 2, isActive: true, isVisible: true, permissionCode: 'TEACH_LEAVE_VIEW' }
    ]
  },

  // 6. Attendance
  {
    id: 'm-att',
    name: 'Attendance',
    code: 'ATTENDANCE',
    parentCode: null,
    icon: 'clipboard-check',
    type: 'Group',
    displayOrder: 6,
    isActive: true,
    isVisible: true,
    children: [
      { id: 'm-att-entry', name: 'Student Attendance Entry', code: 'ATT_ENTRY', parentCode: 'ATTENDANCE', route: '/app/attendance/entry', icon: 'check-square', type: 'Page', displayOrder: 1, isActive: true, isVisible: true, permissionCode: 'ATT_ENTRY_VIEW' },
      { id: 'm-att-corr', name: 'Attendance Correction', code: 'ATT_CORRECTION', parentCode: 'ATTENDANCE', route: '/app/attendance/correction', icon: 'file-edit', type: 'Page', displayOrder: 2, isActive: true, isVisible: true, permissionCode: 'ATT_CORRECTION_VIEW' },
      { id: 'm-att-rep', name: 'Attendance Reports', code: 'ATT_REPORTS', parentCode: 'ATTENDANCE', route: '/app/attendance/reports', icon: 'bar-chart-2', type: 'Page', displayOrder: 3, isActive: true, isVisible: true, permissionCode: 'ATT_REPORTS_VIEW' }
    ]
  },

  // 7. Examination
  {
    id: 'm-exam',
    name: 'Examination',
    code: 'EXAMINATION',
    parentCode: null,
    icon: 'award',
    type: 'Group',
    displayOrder: 7,
    isActive: true,
    isVisible: true,
    children: [
      { id: 'm-exam-setup', name: 'Exam Setup', code: 'EXAM_SETUP', parentCode: 'EXAMINATION', route: '/app/exams/setup', icon: 'sliders', type: 'Page', displayOrder: 1, isActive: true, isVisible: true, permissionCode: 'EXAM_SETUP_VIEW' },
      { id: 'm-exam-marks', name: 'Marks Entry', code: 'EXAM_MARKS', parentCode: 'EXAMINATION', route: '/app/exams/marks', icon: 'edit-3', type: 'Page', displayOrder: 2, isActive: true, isVisible: true, permissionCode: 'EXAM_MARKS_VIEW' },
      { id: 'm-exam-sheet', name: 'Marksheet & Result Card', code: 'EXAM_MARKSHEET', parentCode: 'EXAMINATION', route: '/app/exams/marksheet', icon: 'file-text', type: 'Page', displayOrder: 3, isActive: true, isVisible: true, permissionCode: 'EXAM_MARKSHEET_VIEW' }
    ]
  },

  // 8. Finance
  {
    id: 'm-fin',
    name: 'Finance & Fees',
    code: 'FINANCE',
    parentCode: null,
    icon: 'credit-card',
    type: 'Group',
    displayOrder: 8,
    isActive: true,
    isVisible: true,
    children: [
      { id: 'm-fin-struct', name: 'Fee Structure', code: 'FIN_STRUCTURE', parentCode: 'FINANCE', route: '/app/finance/structure', icon: 'tag', type: 'Page', displayOrder: 1, isActive: true, isVisible: true, permissionCode: 'FIN_STRUCTURE_VIEW' },
      { id: 'm-fin-invoice', name: 'Student Invoices', code: 'FIN_INVOICES', parentCode: 'FINANCE', route: '/app/finance/invoices', icon: 'receipt', type: 'Page', displayOrder: 2, isActive: true, isVisible: true, permissionCode: 'FIN_INVOICES_VIEW' },
      { id: 'm-fin-collect', name: 'Fee Collection', code: 'FIN_COLLECTION', parentCode: 'FINANCE', route: '/app/finance/collection', icon: 'circle-dollar-sign', type: 'Page', displayOrder: 3, isActive: true, isVisible: true, permissionCode: 'FIN_COLLECTION_VIEW' },
      { id: 'm-fin-expense', name: 'Campus Expenses & Vouchers', code: 'FIN_EXPENSES', parentCode: 'FINANCE', route: '/app/finance/expenses', icon: 'credit-card', type: 'Page', displayOrder: 4, isActive: true, isVisible: true, permissionCode: 'FIN_EXPENSES_VIEW' },
      { id: 'm-fin-payroll', name: 'Staff & Teacher Payroll', code: 'FIN_PAYROLL', parentCode: 'FINANCE', route: '/app/finance/payroll', icon: 'wallet', type: 'Page', displayOrder: 5, isActive: true, isVisible: true, permissionCode: 'FIN_PAYROLL_VIEW' },
      { id: 'm-fin-banking', name: 'Banking & Cash Vault', code: 'FIN_BANKING', parentCode: 'FINANCE', route: '/app/finance/banking', icon: 'landmark', type: 'Page', displayOrder: 6, isActive: true, isVisible: true, permissionCode: 'FIN_BANKING_VIEW' }
    ]
  },

  // 9. Communication
  {
    id: 'm-comm',
    name: 'Communication',
    code: 'COMMUNICATION',
    parentCode: null,
    icon: 'bell',
    type: 'Group',
    displayOrder: 9,
    isActive: true,
    isVisible: true,
    children: [
      { id: 'm-comm-notice', name: 'Notice Board', code: 'COMM_NOTICE', parentCode: 'COMMUNICATION', route: '/app/communication/notices', icon: 'megaphone', type: 'Page', displayOrder: 1, isActive: true, isVisible: true, permissionCode: 'COMM_NOTICE_VIEW' },
      { id: 'm-comm-sms', name: 'SMS Integration', code: 'COMM_SMS', parentCode: 'COMMUNICATION', route: '/app/communication/sms', icon: 'message-square', type: 'Page', displayOrder: 2, isActive: true, isVisible: true, permissionCode: 'COMM_SMS_VIEW' }
    ]
  },

  // 10. Reports
  {
    id: 'm-rep',
    name: 'Reports & Analytics',
    code: 'REPORTS',
    parentCode: null,
    icon: 'pie-chart',
    type: 'Group',
    displayOrder: 10,
    isActive: true,
    isVisible: true,
    permissionCode: 'REPORTS_VIEW',
    children: [
      {
        id: 'm-rep-acad',
        name: 'Academic Performance',
        code: 'REP_ACADEMIC',
        parentCode: 'REPORTS',
        route: '/app/reports/academic',
        icon: 'bar-chart',
        type: 'Page',
        displayOrder: 1,
        isActive: true,
        isVisible: true,
        permissionCode: 'REPORTS_VIEW'
      },
      {
        id: 'm-rep-fin',
        name: 'Financial Ledger',
        code: 'REP_FINANCE',
        parentCode: 'REPORTS',
        route: '/app/reports/financial',
        icon: 'receipt',
        type: 'Page',
        displayOrder: 2,
        isActive: true,
        isVisible: true,
        permissionCode: 'REPORTS_VIEW'
      }
    ]
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin',
    username: 'admin',
    fullName: 'System Administrator',
    email: 'admin@school.com',
    roleId: 'role-admin',
    roleName: 'Super Administrator',
    schoolId: 'sch-01',
    branchId: 'br-01',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    phone: '+880 1819-111111',
    isActive: true
  },
  {
    id: 'usr-principal',
    username: 'principal',
    fullName: 'Dr. Mahmudur Rahman',
    email: 'principal@school.com',
    roleId: 'role-principal',
    roleName: 'Head Teacher / Principal',
    schoolId: 'sch-01',
    branchId: 'br-01',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    phone: '+880 1819-222222',
    isActive: true
  },
  {
    id: 'usr-teacher',
    username: 'teacher',
    fullName: 'Nusrat Jahan (Senior Teacher)',
    email: 'nusrat@school.com',
    roleId: 'role-teacher',
    roleName: 'Subject Teacher',
    schoolId: 'sch-01',
    branchId: 'br-01',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    phone: '+880 1819-333333',
    isActive: true
  },
  {
    id: 'usr-accountant',
    username: 'accountant',
    fullName: 'Kamal Hossain (Accounts Officer)',
    email: 'accounts@school.com',
    roleId: 'role-accountant',
    roleName: 'Chief Accountant',
    schoolId: 'sch-01',
    branchId: 'br-01',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    phone: '+880 1819-444444',
    isActive: true
  },
  {
    id: 'usr-student',
    username: 'student',
    fullName: 'Tanvir Ahmed (Class 10-A, Roll 01)',
    email: 'tanvir@student.school.com',
    roleId: 'role-student',
    roleName: 'Student / Guardian',
    schoolId: 'sch-01',
    branchId: 'br-01',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
    phone: '+880 1819-555555',
    isActive: true
  },
  {
    id: 'usr-guardian',
    username: 'guardian',
    fullName: 'Rafiqul Ahmed (Guardian - Main Campus)',
    email: 'rafiqul.ahmed@gmail.com',
    roleId: 'role-guardian',
    roleName: 'Student / Guardian',
    schoolId: 'sch-01',
    branchId: 'br-01',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    phone: '+880 1712-345678',
    isActive: true
  },
  // Uttara Branch Campus Users
  {
    id: 'usr-teacher-utt',
    username: 'teacher_utt',
    fullName: 'Sadia Sultana (Faculty - Uttara Campus)',
    email: 'sadia.utt@school.com',
    roleId: 'role-teacher',
    roleName: 'Subject Teacher',
    schoolId: 'sch-01',
    branchId: 'br-02',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    phone: '+880 1711-667788',
    isActive: true
  },
  {
    id: 'usr-student-utt',
    username: 'student_utt',
    fullName: 'Mehnaz Parveen (Class 9-A, Uttara Campus)',
    email: 'mehnaz.p@student.school.com',
    roleId: 'role-student',
    roleName: 'Student / Guardian',
    schoolId: 'sch-01',
    branchId: 'br-02',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    phone: '+880 1819-555560',
    isActive: true
  }
];

// Role menu permissions
export const INITIAL_ROLE_PERMISSIONS: RolePermission[] = [
  // Super Admin has all
  ...INITIAL_MENUS.flatMap(m => {
    const items = [m, ...(m.children || [])];
    return items.map(item => ({
      roleId: 'role-admin',
      menuCode: item.code,
      view: true,
      create: true,
      edit: true,
      delete: true,
      approve: true,
      export: true
    }));
  }),

  // Principal has everything except raw Menu/Role Assignment DB configs
  ...INITIAL_MENUS.flatMap(m => {
    const items = [m, ...(m.children || [])];
    return items.map(item => ({
      roleId: 'role-principal',
      menuCode: item.code,
      view: true,
      create: item.code.startsWith('ADMIN') ? false : true,
      edit: item.code.startsWith('ADMIN') ? false : true,
      delete: false,
      approve: true,
      export: true
    }));
  }),

  // Teacher has Academic, Student, Attendance, Exam
  { roleId: 'role-teacher', menuCode: 'DASHBOARD', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-teacher', menuCode: 'ACADEMIC', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-teacher', menuCode: 'ACAD_CLASSES', view: true, create: false, edit: false, delete: false, approve: false, export: true },
  { roleId: 'role-teacher', menuCode: 'ACAD_SUBJECTS', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-teacher', menuCode: 'ACAD_ROUTINE', view: true, create: true, edit: true, delete: false, approve: false, export: true },
  { roleId: 'role-teacher', menuCode: 'STUDENT', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-teacher', menuCode: 'STUD_LIST', view: true, create: false, edit: true, delete: false, approve: false, export: true },
  { roleId: 'role-teacher', menuCode: 'ATTENDANCE', view: true, create: true, edit: true, delete: false, approve: false, export: true },
  { roleId: 'role-teacher', menuCode: 'ATT_ENTRY', view: true, create: true, edit: true, delete: false, approve: false, export: true },
  { roleId: 'role-teacher', menuCode: 'ATT_CORRECTION', view: true, create: true, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-teacher', menuCode: 'ATT_REPORTS', view: true, create: false, edit: false, delete: false, approve: false, export: true },
  { roleId: 'role-teacher', menuCode: 'EXAMINATION', view: true, create: true, edit: true, delete: false, approve: false, export: true },
  { roleId: 'role-teacher', menuCode: 'EXAM_SETUP', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-teacher', menuCode: 'EXAM_MARKS', view: true, create: true, edit: true, delete: false, approve: false, export: true },
  { roleId: 'role-teacher', menuCode: 'EXAM_MARKSHEET', view: true, create: false, edit: false, delete: false, approve: false, export: true },
  { roleId: 'role-teacher', menuCode: 'COMMUNICATION', view: true, create: true, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-teacher', menuCode: 'COMM_NOTICE', view: true, create: true, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-teacher', menuCode: 'REPORTS', view: true, create: false, edit: false, delete: false, approve: false, export: true },
  { roleId: 'role-teacher', menuCode: 'REP_ACADEMIC', view: true, create: false, edit: false, delete: false, approve: false, export: true },

  // Accountant has Finance, Reports, Dashboard
  { roleId: 'role-accountant', menuCode: 'DASHBOARD', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-accountant', menuCode: 'FINANCE', view: true, create: true, edit: true, delete: false, approve: true, export: true },
  { roleId: 'role-accountant', menuCode: 'FIN_STRUCTURE', view: true, create: true, edit: true, delete: false, approve: true, export: true },
  { roleId: 'role-accountant', menuCode: 'FIN_INVOICES', view: true, create: true, edit: true, delete: false, approve: false, export: true },
  { roleId: 'role-accountant', menuCode: 'FIN_COLLECTION', view: true, create: true, edit: false, delete: false, approve: true, export: true },
  { roleId: 'role-accountant', menuCode: 'FIN_EXPENSES', view: true, create: true, edit: true, delete: false, approve: true, export: true },
  { roleId: 'role-accountant', menuCode: 'FIN_PAYROLL', view: true, create: true, edit: true, delete: false, approve: true, export: true },
  { roleId: 'role-accountant', menuCode: 'FIN_BANKING', view: true, create: true, edit: true, delete: false, approve: true, export: true },
  { roleId: 'role-accountant', menuCode: 'STUDENT', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-accountant', menuCode: 'STUD_LIST', view: true, create: false, edit: false, delete: false, approve: false, export: true },
  { roleId: 'role-accountant', menuCode: 'REPORTS', view: true, create: false, edit: false, delete: false, approve: false, export: true },
  { roleId: 'role-accountant', menuCode: 'REP_FINANCE', view: true, create: false, edit: false, delete: false, approve: false, export: true },

  // Student has view rights to personal items
  { roleId: 'role-student', menuCode: 'DASHBOARD', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-student', menuCode: 'STUDENTS', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-student', menuCode: 'STUDENT', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-student', menuCode: 'STU_LIST', view: true, create: false, edit: false, delete: false, approve: false, export: true },
  { roleId: 'role-student', menuCode: 'STUD_LIST', view: true, create: false, edit: false, delete: false, approve: false, export: true },
  { roleId: 'role-student', menuCode: 'ACADEMICS', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-student', menuCode: 'ACADEMIC', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-student', menuCode: 'ACAD_ROUTINE', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-student', menuCode: 'ACAD_CLASSES', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-student', menuCode: 'ATTENDANCE', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-student', menuCode: 'ATT_STUDENT', view: false, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-student', menuCode: 'ATT_ENTRY', view: false, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-student', menuCode: 'ATT_CORRECTION', view: false, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-student', menuCode: 'ATT_REPORT', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-student', menuCode: 'ATT_REPORTS', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-student', menuCode: 'EXAMS', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-student', menuCode: 'EXAMINATION', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-student', menuCode: 'EXAM_RESULTS', view: true, create: false, edit: false, delete: false, approve: false, export: true },
  { roleId: 'role-student', menuCode: 'EXAM_MARKSHEET', view: true, create: false, edit: false, delete: false, approve: false, export: true },
  { roleId: 'role-student', menuCode: 'FINANCE', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-student', menuCode: 'FIN_FEES', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-student', menuCode: 'FIN_STRUCTURE', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-student', menuCode: 'FIN_INVOICES', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-student', menuCode: 'FIN_COLLECTION', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-student', menuCode: 'COMMUNICATION', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-student', menuCode: 'COMM_NOTICE', view: true, create: false, edit: false, delete: false, approve: false, export: false },

  // Guardian has view and payment rights for ward
  { roleId: 'role-guardian', menuCode: 'DASHBOARD', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-guardian', menuCode: 'STUDENTS', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-guardian', menuCode: 'STUDENT', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-guardian', menuCode: 'STU_LIST', view: true, create: false, edit: false, delete: false, approve: false, export: true },
  { roleId: 'role-guardian', menuCode: 'STUD_LIST', view: true, create: false, edit: false, delete: false, approve: false, export: true },
  { roleId: 'role-guardian', menuCode: 'ACADEMICS', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-guardian', menuCode: 'ACADEMIC', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-guardian', menuCode: 'ACAD_ROUTINE', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-guardian', menuCode: 'ACAD_CLASSES', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-guardian', menuCode: 'ATTENDANCE', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-guardian', menuCode: 'ATT_STUDENT', view: false, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-guardian', menuCode: 'ATT_ENTRY', view: false, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-guardian', menuCode: 'ATT_CORRECTION', view: false, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-guardian', menuCode: 'ATT_REPORT', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-guardian', menuCode: 'ATT_REPORTS', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-guardian', menuCode: 'EXAMS', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-guardian', menuCode: 'EXAMINATION', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-guardian', menuCode: 'EXAM_RESULTS', view: true, create: false, edit: false, delete: false, approve: false, export: true },
  { roleId: 'role-guardian', menuCode: 'EXAM_MARKSHEET', view: true, create: false, edit: false, delete: false, approve: false, export: true },
  { roleId: 'role-guardian', menuCode: 'FINANCE', view: true, create: true, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-guardian', menuCode: 'FIN_FEES', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-guardian', menuCode: 'FIN_STRUCTURE', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-guardian', menuCode: 'FIN_INVOICES', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-guardian', menuCode: 'FIN_COLLECTION', view: true, create: true, edit: false, delete: false, approve: false, export: true },
  { roleId: 'role-guardian', menuCode: 'COMMUNICATION', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { roleId: 'role-guardian', menuCode: 'COMM_NOTICE', view: true, create: false, edit: false, delete: false, approve: false, export: false }
];

// User-specific overrides (Demonstrates PDF Section 06 page 8:
// "একজন Teacher-কে Fee Collection access দেওয়া যাবে, অন্য Teacher-এর Role না বদলিয়েই")
export const INITIAL_USER_OVERRIDES: UserMenuOverride[] = [
  {
    userId: 'usr-teacher',
    menuCode: 'FIN_COLLECTION',
    action: 'view',
    override: 'Allow'
  },
  {
    userId: 'usr-teacher',
    menuCode: 'FIN_COLLECTION',
    action: 'create',
    override: 'Allow'
  }
];

export const INITIAL_CLASSES: SchoolClass[] = [
  { id: 'cls-10', name: 'Class Ten (10)', code: 'CLS-10', branchId: 'br-01', sortOrder: 1, sectionCount: 2, studentCount: 72 },
  { id: 'cls-11', name: 'Class Eleven (11 - College)', code: 'CLS-11', branchId: 'br-01', sortOrder: 2, sectionCount: 2, studentCount: 58 },
  { id: 'cls-09', name: 'Class Nine (9)', code: 'CLS-9', branchId: 'br-02', sortOrder: 3, sectionCount: 2, studentCount: 65 }
];

export const INITIAL_SECTIONS: Section[] = [
  { id: 'sec-10a', classId: 'cls-10', className: 'Class Ten (10)', name: 'Section A (Padma)', branchId: 'br-01', capacity: 40, currentStudentCount: 38, classTeacherName: 'Nusrat Jahan' },
  { id: 'sec-10b', classId: 'cls-10', className: 'Class Ten (10)', name: 'Section B (Meghna)', branchId: 'br-01', capacity: 40, currentStudentCount: 34, classTeacherName: 'Kazi Farhana' },
  { id: 'sec-11s', classId: 'cls-11', className: 'Class Eleven (11 - College)', name: 'Science Group', branchId: 'br-01', capacity: 35, currentStudentCount: 30, classTeacherName: 'Dr. Tariqul Islam' },
  { id: 'sec-11b', classId: 'cls-11', className: 'Class Eleven (11 - College)', name: 'Business Studies Group', branchId: 'br-01', capacity: 35, currentStudentCount: 28, classTeacherName: 'Kamal Hossain' },
  { id: 'sec-9a', classId: 'cls-09', className: 'Class Nine (9)', name: 'Section A (Lotus)', branchId: 'br-02', capacity: 40, currentStudentCount: 33, classTeacherName: 'Md. Shafiqul Islam' },
  { id: 'sec-9b', classId: 'cls-09', className: 'Class Nine (9)', name: 'Section B (Tulip)', branchId: 'br-02', capacity: 40, currentStudentCount: 32, classTeacherName: 'Sadia Sultana' }
];

export const INITIAL_SUBJECTS: Subject[] = [
  { id: 'sub-mat', code: 'MATH-101', name: 'General Mathematics', type: 'Compulsory', fullMarks: 100, passMarks: 33 },
  { id: 'sub-phy', code: 'PHY-101', name: 'Physics', type: 'Compulsory', fullMarks: 100, passMarks: 33 },
  { id: 'sub-che', code: 'CHE-101', name: 'Chemistry', type: 'Compulsory', fullMarks: 100, passMarks: 33 },
  { id: 'sub-eng', code: 'ENG-101', name: 'English First Paper', type: 'Compulsory', fullMarks: 100, passMarks: 33 },
  { id: 'sub-ban', code: 'BAN-101', name: 'Bangla First Paper', type: 'Compulsory', fullMarks: 100, passMarks: 33 },
  { id: 'sub-ict', code: 'ICT-101', name: 'Information & Comm. Tech', type: 'Compulsory', fullMarks: 50, passMarks: 17 },
  { id: 'sub-bio', code: 'BIO-101', name: 'Biology (Higher Option)', type: 'Optional', fullMarks: 100, passMarks: 33 }
];

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'tch-01',
    employeeCode: 'EMP-101',
    fullName: 'Nusrat Jahan',
    designation: 'Senior Teacher (Mathematics)',
    department: 'Science',
    qualification: 'M.Sc in Applied Mathematics, DU',
    email: 'nusrat.j@school.com',
    phone: '+880 1711-223344',
    joiningDate: '2020-03-15',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    assignedSubjects: ['General Mathematics', 'Higher Mathematics'],
    branchId: 'br-01'
  },
  {
    id: 'tch-02',
    employeeCode: 'EMP-102',
    fullName: 'Dr. Tariqul Islam',
    designation: 'Assistant Professor (Physics)',
    department: 'Science',
    qualification: 'Ph.D in Solid State Physics, BUET',
    email: 'tariqul.i@school.com',
    phone: '+880 1711-334455',
    joiningDate: '2019-01-10',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    assignedSubjects: ['Physics'],
    branchId: 'br-01'
  },
  {
    id: 'tch-03',
    employeeCode: 'EMP-103',
    fullName: 'Kazi Farhana',
    designation: 'Lecturer (English)',
    department: 'Humanities & Languages',
    qualification: 'M.A in English Literature, JU',
    email: 'farhana.k@school.com',
    phone: '+880 1711-445566',
    joiningDate: '2021-08-01',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    assignedSubjects: ['English First Paper', 'English Second Paper'],
    branchId: 'br-01'
  },
  {
    id: 'tch-04',
    employeeCode: 'EMP-104',
    fullName: 'Md. Shafiqul Islam',
    designation: 'Senior Teacher (Bangla)',
    department: 'Humanities & Languages',
    qualification: 'M.A in Bengali Language & Literature',
    email: 'shafiqul.i@school.com',
    phone: '+880 1711-556677',
    joiningDate: '2018-05-20',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    assignedSubjects: ['Bangla First Paper'],
    branchId: 'br-02'
  },
  {
    id: 'tch-05',
    employeeCode: 'EMP-105',
    fullName: 'Sadia Sultana',
    designation: 'Lecturer (ICT & Computing)',
    department: 'Computer Science',
    qualification: 'B.Sc in CSE, IUT',
    email: 'sadia.s@school.com',
    phone: '+880 1711-667788',
    joiningDate: '2022-02-14',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    assignedSubjects: ['Information & Comm. Tech'],
    branchId: 'br-02'
  }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std-1001',
    admissionNo: 'ADM-2026-001',
    fullName: 'Tanvir Ahmed',
    banglaName: 'তানভীর আহমেদ',
    dateOfBirth: '2010-04-12',
    gender: 'Male',
    bloodGroup: 'A+',
    religion: 'Islam',
    email: 'tanvir@student.school.com',
    phone: '+880 1819-555555',
    presentAddress: 'House 42, Road 7, Dhanmondi, Dhaka',
    permanentAddress: 'Vill: Char Fasson, Bhola',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
    branchId: 'br-01',
    guardianName: 'Rafiqul Ahmed',
    guardianRelation: 'Father',
    guardianPhone: '+880 1712-345678',
    guardianOccupation: 'Civil Engineer',
    guardianIncome: '৳ 95,000 / month',
    academicYearId: 'ay-2026',
    classId: 'cls-10',
    className: 'Class Ten (10)',
    sectionId: 'sec-10a',
    sectionName: 'Section A (Padma)',
    rollNo: '01',
    admissionDate: '2024-01-05',
    status: 'Active'
  },
  {
    id: 'std-1002',
    admissionNo: 'ADM-2026-002',
    fullName: 'Ayesha Siddiqua',
    banglaName: 'আয়েশা সিদ্দিকা',
    dateOfBirth: '2010-09-21',
    gender: 'Female',
    bloodGroup: 'B+',
    religion: 'Islam',
    email: 'ayesha.s@student.school.com',
    phone: '+880 1819-555556',
    presentAddress: 'Apartment 3B, Lake View Road, Dhanmondi',
    permanentAddress: 'Kotwali, Sylhet',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    branchId: 'br-01',
    guardianName: 'Dr. Enamul Hoque',
    guardianRelation: 'Father',
    guardianPhone: '+880 1712-987654',
    guardianOccupation: 'Physician',
    guardianIncome: '৳ 1,40,000 / month',
    academicYearId: 'ay-2026',
    classId: 'cls-10',
    className: 'Class Ten (10)',
    sectionId: 'sec-10a',
    sectionName: 'Section A (Padma)',
    rollNo: '02',
    admissionDate: '2024-01-05',
    status: 'Active'
  },
  {
    id: 'std-1003',
    admissionNo: 'ADM-2026-003',
    fullName: 'Rahimul Islam',
    banglaName: 'রহিমুল ইসলাম',
    dateOfBirth: '2010-01-15',
    gender: 'Male',
    bloodGroup: 'O+',
    religion: 'Islam',
    email: 'rahimul.i@student.school.com',
    phone: '+880 1819-555557',
    presentAddress: 'Plot 18, Block D, Lalmatia, Dhaka',
    permanentAddress: 'Monohardi, Narsingdi',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80',
    branchId: 'br-01',
    guardianName: 'Alhaj Mokhlesur Rahman',
    guardianRelation: 'Father',
    guardianPhone: '+880 1713-112233',
    guardianOccupation: 'Businessman',
    guardianIncome: '৳ 1,20,000 / month',
    academicYearId: 'ay-2026',
    classId: 'cls-10',
    className: 'Class Ten (10)',
    sectionId: 'sec-10a',
    sectionName: 'Section A (Padma)',
    rollNo: '03',
    admissionDate: '2024-01-06',
    status: 'Active'
  },
  {
    id: 'std-1004',
    admissionNo: 'ADM-2026-004',
    fullName: 'Sumaiya Binte Nasir',
    banglaName: 'সুমাইয়া বিনতে নাসির',
    dateOfBirth: '2010-11-30',
    gender: 'Female',
    bloodGroup: 'AB+',
    religion: 'Islam',
    email: 'sumaiya.n@student.school.com',
    phone: '+880 1819-555558',
    presentAddress: 'Green Road, Staff Quarter, Dhaka',
    permanentAddress: 'Kumarkhali, Kushtia',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    branchId: 'br-01',
    guardianName: 'Nasir Uddin Patwary',
    guardianRelation: 'Father',
    guardianPhone: '+880 1714-445566',
    guardianOccupation: 'Government Officer',
    guardianIncome: '৳ 70,000 / month',
    academicYearId: 'ay-2026',
    classId: 'cls-10',
    className: 'Class Ten (10)',
    sectionId: 'sec-10a',
    sectionName: 'Section A (Padma)',
    rollNo: '04',
    admissionDate: '2024-01-08',
    status: 'Active'
  },
  {
    id: 'std-0901',
    admissionNo: 'ADM-2026-005',
    fullName: 'Zubayer Hossain',
    banglaName: 'জুবায়ের হোসেন',
    dateOfBirth: '2011-06-19',
    gender: 'Male',
    bloodGroup: 'B+',
    religion: 'Islam',
    email: 'zubayer.h@student.school.com',
    phone: '+880 1819-555559',
    presentAddress: 'Sector 7, Uttara Model Town, Dhaka',
    permanentAddress: 'Tangail Sadar, Tangail',
    photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80',
    branchId: 'br-02',
    guardianName: 'Delwar Hossain',
    guardianRelation: 'Father',
    guardianPhone: '+880 1715-889900',
    guardianOccupation: 'Banker',
    guardianIncome: '৳ 85,000 / month',
    academicYearId: 'ay-2026',
    classId: 'cls-09',
    className: 'Class Nine (9)',
    sectionId: 'sec-9a',
    sectionName: 'Section A (Lotus)',
    rollNo: '01',
    admissionDate: '2025-01-10',
    status: 'Active'
  },
  {
    id: 'std-0902',
    admissionNo: 'ADM-2026-006',
    fullName: 'Mehnaz Parveen',
    banglaName: 'মেহনাজ পারভীন',
    dateOfBirth: '2011-08-04',
    gender: 'Female',
    bloodGroup: 'O+',
    religion: 'Islam',
    email: 'mehnaz.p@student.school.com',
    phone: '+880 1819-555560',
    presentAddress: 'Sector 11, Uttara, Dhaka',
    permanentAddress: 'Madaripur Sadar, Madaripur',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    branchId: 'br-02',
    guardianName: 'Shahana Begum',
    guardianRelation: 'Mother',
    guardianPhone: '+880 1716-123456',
    guardianOccupation: 'College Teacher',
    guardianIncome: '৳ 65,000 / month',
    academicYearId: 'ay-2026',
    classId: 'cls-09',
    className: 'Class Nine (9)',
    sectionId: 'sec-9a',
    sectionName: 'Section A (Lotus)',
    rollNo: '02',
    admissionDate: '2025-01-10',
    status: 'Active'
  }
];

export const INITIAL_ROUTINE: RoutinePeriod[] = [
  // --- MAIN CAMPUS (br-01): CLASS 10 - SECTION A (Padma) ---
  // Sunday
  { id: 'rt-10a-su-1', day: 'Sunday', periodNumber: 1, startTime: '08:30 AM', endTime: '09:15 AM', classId: 'cls-10', className: 'Class Ten (10)', sectionId: 'sec-10a', sectionName: 'Section A (Padma)', subjectId: 'sub-mat', subjectName: 'General Mathematics', teacherId: 'tch-01', teacherName: 'Nusrat Jahan', roomNo: 'Room 301', branchId: 'br-01' },
  { id: 'rt-10a-su-2', day: 'Sunday', periodNumber: 2, startTime: '09:15 AM', endTime: '10:00 AM', classId: 'cls-10', className: 'Class Ten (10)', sectionId: 'sec-10a', sectionName: 'Section A (Padma)', subjectId: 'sub-phy', subjectName: 'Physics', teacherId: 'tch-02', teacherName: 'Dr. Tariqul Islam', roomNo: 'Physics Lab 1', branchId: 'br-01' },
  { id: 'rt-10a-su-3', day: 'Sunday', periodNumber: 3, startTime: '10:15 AM', endTime: '11:00 AM', classId: 'cls-10', className: 'Class Ten (10)', sectionId: 'sec-10a', sectionName: 'Section A (Padma)', subjectId: 'sub-eng', subjectName: 'English First Paper', teacherId: 'tch-03', teacherName: 'Kazi Farhana', roomNo: 'Room 301', branchId: 'br-01' },
  { id: 'rt-10a-su-4', day: 'Sunday', periodNumber: 4, startTime: '11:00 AM', endTime: '11:45 AM', classId: 'cls-10', className: 'Class Ten (10)', sectionId: 'sec-10a', sectionName: 'Section A (Padma)', subjectId: 'sub-ict', subjectName: 'Information & Comm. Tech', teacherId: 'tch-05', teacherName: 'Sadia Sultana', roomNo: 'Computer Lab', branchId: 'br-01' },

  // Monday
  { id: 'rt-10a-mo-1', day: 'Monday', periodNumber: 1, startTime: '08:30 AM', endTime: '09:15 AM', classId: 'cls-10', className: 'Class Ten (10)', sectionId: 'sec-10a', sectionName: 'Section A (Padma)', subjectId: 'sub-ban', subjectName: 'Bangla First Paper', teacherId: 'tch-04', teacherName: 'Md. Shafiqul Islam', roomNo: 'Room 301', branchId: 'br-01' },
  { id: 'rt-10a-mo-2', day: 'Monday', periodNumber: 2, startTime: '09:15 AM', endTime: '10:00 AM', classId: 'cls-10', className: 'Class Ten (10)', sectionId: 'sec-10a', sectionName: 'Section A (Padma)', subjectId: 'sub-mat', subjectName: 'General Mathematics', teacherId: 'tch-01', teacherName: 'Nusrat Jahan', roomNo: 'Room 301', branchId: 'br-01' },
  { id: 'rt-10a-mo-3', day: 'Monday', periodNumber: 3, startTime: '10:15 AM', endTime: '11:00 AM', classId: 'cls-10', className: 'Class Ten (10)', sectionId: 'sec-10a', sectionName: 'Section A (Padma)', subjectId: 'sub-che', subjectName: 'Chemistry', teacherId: 'tch-02', teacherName: 'Dr. Tariqul Islam', roomNo: 'Chemistry Lab', branchId: 'br-01' },
  { id: 'rt-10a-mo-4', day: 'Monday', periodNumber: 4, startTime: '11:00 AM', endTime: '11:45 AM', classId: 'cls-10', className: 'Class Ten (10)', sectionId: 'sec-10a', sectionName: 'Section A (Padma)', subjectId: 'sub-bio', subjectName: 'Biology (Higher Option)', teacherId: 'tch-02', teacherName: 'Dr. Tariqul Islam', roomNo: 'Biology Lab', branchId: 'br-01' },

  // Tuesday
  { id: 'rt-10a-tu-1', day: 'Tuesday', periodNumber: 1, startTime: '08:30 AM', endTime: '09:15 AM', classId: 'cls-10', className: 'Class Ten (10)', sectionId: 'sec-10a', sectionName: 'Section A (Padma)', subjectId: 'sub-phy', subjectName: 'Physics', teacherId: 'tch-02', teacherName: 'Dr. Tariqul Islam', roomNo: 'Room 301', branchId: 'br-01' },
  { id: 'rt-10a-tu-2', day: 'Tuesday', periodNumber: 2, startTime: '09:15 AM', endTime: '10:00 AM', classId: 'cls-10', className: 'Class Ten (10)', sectionId: 'sec-10a', sectionName: 'Section A (Padma)', subjectId: 'sub-eng', subjectName: 'English First Paper', teacherId: 'tch-03', teacherName: 'Kazi Farhana', roomNo: 'Room 301', branchId: 'br-01' },
  { id: 'rt-10a-tu-3', day: 'Tuesday', periodNumber: 3, startTime: '10:15 AM', endTime: '11:00 AM', classId: 'cls-10', className: 'Class Ten (10)', sectionId: 'sec-10a', sectionName: 'Section A (Padma)', subjectId: 'sub-mat', subjectName: 'General Mathematics', teacherId: 'tch-01', teacherName: 'Nusrat Jahan', roomNo: 'Room 301', branchId: 'br-01' },
  { id: 'rt-10a-tu-4', day: 'Tuesday', periodNumber: 4, startTime: '11:00 AM', endTime: '11:45 AM', classId: 'cls-10', className: 'Class Ten (10)', sectionId: 'sec-10a', sectionName: 'Section A (Padma)', subjectId: 'sub-ict', subjectName: 'Information & Comm. Tech', teacherId: 'tch-05', teacherName: 'Sadia Sultana', roomNo: 'Computer Lab', branchId: 'br-01' },

  // Wednesday
  { id: 'rt-10a-we-1', day: 'Wednesday', periodNumber: 1, startTime: '08:30 AM', endTime: '09:15 AM', classId: 'cls-10', className: 'Class Ten (10)', sectionId: 'sec-10a', sectionName: 'Section A (Padma)', subjectId: 'sub-che', subjectName: 'Chemistry', teacherId: 'tch-02', teacherName: 'Dr. Tariqul Islam', roomNo: 'Chemistry Lab', branchId: 'br-01' },
  { id: 'rt-10a-we-2', day: 'Wednesday', periodNumber: 2, startTime: '09:15 AM', endTime: '10:00 AM', classId: 'cls-10', className: 'Class Ten (10)', sectionId: 'sec-10a', sectionName: 'Section A (Padma)', subjectId: 'sub-ban', subjectName: 'Bangla First Paper', teacherId: 'tch-04', teacherName: 'Md. Shafiqul Islam', roomNo: 'Room 301', branchId: 'br-01' },
  { id: 'rt-10a-we-3', day: 'Wednesday', periodNumber: 3, startTime: '10:15 AM', endTime: '11:00 AM', classId: 'cls-10', className: 'Class Ten (10)', sectionId: 'sec-10a', sectionName: 'Section A (Padma)', subjectId: 'sub-mat', subjectName: 'General Mathematics', teacherId: 'tch-01', teacherName: 'Nusrat Jahan', roomNo: 'Room 301', branchId: 'br-01' },
  { id: 'rt-10a-we-4', day: 'Wednesday', periodNumber: 4, startTime: '11:00 AM', endTime: '11:45 AM', classId: 'cls-10', className: 'Class Ten (10)', sectionId: 'sec-10a', sectionName: 'Section A (Padma)', subjectId: 'sub-eng', subjectName: 'English First Paper', teacherId: 'tch-03', teacherName: 'Kazi Farhana', roomNo: 'Room 301', branchId: 'br-01' },

  // Thursday
  { id: 'rt-10a-th-1', day: 'Thursday', periodNumber: 1, startTime: '08:30 AM', endTime: '09:15 AM', classId: 'cls-10', className: 'Class Ten (10)', sectionId: 'sec-10a', sectionName: 'Section A (Padma)', subjectId: 'sub-mat', subjectName: 'General Mathematics', teacherId: 'tch-01', teacherName: 'Nusrat Jahan', roomNo: 'Room 301', branchId: 'br-01' },
  { id: 'rt-10a-th-2', day: 'Thursday', periodNumber: 2, startTime: '09:15 AM', endTime: '10:00 AM', classId: 'cls-10', className: 'Class Ten (10)', sectionId: 'sec-10a', sectionName: 'Section A (Padma)', subjectId: 'sub-phy', subjectName: 'Physics', teacherId: 'tch-02', teacherName: 'Dr. Tariqul Islam', roomNo: 'Room 301', branchId: 'br-01' },
  { id: 'rt-10a-th-3', day: 'Thursday', periodNumber: 3, startTime: '10:15 AM', endTime: '11:00 AM', classId: 'cls-10', className: 'Class Ten (10)', sectionId: 'sec-10a', sectionName: 'Section A (Padma)', subjectId: 'sub-bio', subjectName: 'Biology (Higher Option)', teacherId: 'tch-02', teacherName: 'Dr. Tariqul Islam', roomNo: 'Biology Lab', branchId: 'br-01' },
  { id: 'rt-10a-th-4', day: 'Thursday', periodNumber: 4, startTime: '11:00 AM', endTime: '11:45 AM', classId: 'cls-10', className: 'Class Ten (10)', sectionId: 'sec-10a', sectionName: 'Section A (Padma)', subjectId: 'sub-ban', subjectName: 'Bangla First Paper', teacherId: 'tch-04', teacherName: 'Md. Shafiqul Islam', roomNo: 'Room 301', branchId: 'br-01' },

  // --- MAIN CAMPUS (br-01): CLASS 11 - SCIENCE GROUP ---
  // Sunday
  { id: 'rt-11s-su-1', day: 'Sunday', periodNumber: 1, startTime: '08:30 AM', endTime: '09:15 AM', classId: 'cls-11', className: 'Class Eleven (11 - College)', sectionId: 'sec-11s', sectionName: 'Science Group', subjectId: 'sub-phy', subjectName: 'Physics', teacherId: 'tch-02', teacherName: 'Dr. Tariqul Islam', roomNo: 'Lecture Hall A', branchId: 'br-01' },
  { id: 'rt-11s-su-2', day: 'Sunday', periodNumber: 2, startTime: '09:15 AM', endTime: '10:00 AM', classId: 'cls-11', className: 'Class Eleven (11 - College)', sectionId: 'sec-11s', sectionName: 'Science Group', subjectId: 'sub-che', subjectName: 'Chemistry', teacherId: 'tch-02', teacherName: 'Dr. Tariqul Islam', roomNo: 'Lecture Hall A', branchId: 'br-01' },
  { id: 'rt-11s-su-3', day: 'Sunday', periodNumber: 3, startTime: '10:15 AM', endTime: '11:00 AM', classId: 'cls-11', className: 'Class Eleven (11 - College)', sectionId: 'sec-11s', sectionName: 'Science Group', subjectId: 'sub-mat', subjectName: 'General Mathematics', teacherId: 'tch-01', teacherName: 'Nusrat Jahan', roomNo: 'Lecture Hall A', branchId: 'br-01' },
  { id: 'rt-11s-su-4', day: 'Sunday', periodNumber: 4, startTime: '11:00 AM', endTime: '11:45 AM', classId: 'cls-11', className: 'Class Eleven (11 - College)', sectionId: 'sec-11s', sectionName: 'Science Group', subjectId: 'sub-ict', subjectName: 'Information & Comm. Tech', teacherId: 'tch-05', teacherName: 'Sadia Sultana', roomNo: 'Computer Lab 2', branchId: 'br-01' },

  // Monday
  { id: 'rt-11s-mo-1', day: 'Monday', periodNumber: 1, startTime: '08:30 AM', endTime: '09:15 AM', classId: 'cls-11', className: 'Class Eleven (11 - College)', sectionId: 'sec-11s', sectionName: 'Science Group', subjectId: 'sub-mat', subjectName: 'General Mathematics', teacherId: 'tch-01', teacherName: 'Nusrat Jahan', roomNo: 'Lecture Hall A', branchId: 'br-01' },
  { id: 'rt-11s-mo-2', day: 'Monday', periodNumber: 2, startTime: '09:15 AM', endTime: '10:00 AM', classId: 'cls-11', className: 'Class Eleven (11 - College)', sectionId: 'sec-11s', sectionName: 'Science Group', subjectId: 'sub-bio', subjectName: 'Biology (Higher Option)', teacherId: 'tch-02', teacherName: 'Dr. Tariqul Islam', roomNo: 'Bio-Science Lab', branchId: 'br-01' },
  { id: 'rt-11s-mo-3', day: 'Monday', periodNumber: 3, startTime: '10:15 AM', endTime: '11:00 AM', classId: 'cls-11', className: 'Class Eleven (11 - College)', sectionId: 'sec-11s', sectionName: 'Science Group', subjectId: 'sub-eng', subjectName: 'English First Paper', teacherId: 'tch-03', teacherName: 'Kazi Farhana', roomNo: 'Lecture Hall A', branchId: 'br-01' },
  { id: 'rt-11s-mo-4', day: 'Monday', periodNumber: 4, startTime: '11:00 AM', endTime: '11:45 AM', classId: 'cls-11', className: 'Class Eleven (11 - College)', sectionId: 'sec-11s', sectionName: 'Science Group', subjectId: 'sub-ban', subjectName: 'Bangla First Paper', teacherId: 'tch-04', teacherName: 'Md. Shafiqul Islam', roomNo: 'Lecture Hall A', branchId: 'br-01' },

  // Tuesday
  { id: 'rt-11s-tu-1', day: 'Tuesday', periodNumber: 1, startTime: '08:30 AM', endTime: '09:15 AM', classId: 'cls-11', className: 'Class Eleven (11 - College)', sectionId: 'sec-11s', sectionName: 'Science Group', subjectId: 'sub-che', subjectName: 'Chemistry', teacherId: 'tch-02', teacherName: 'Dr. Tariqul Islam', roomNo: 'Chemistry Lab', branchId: 'br-01' },
  { id: 'rt-11s-tu-2', day: 'Tuesday', periodNumber: 2, startTime: '09:15 AM', endTime: '10:00 AM', classId: 'cls-11', className: 'Class Eleven (11 - College)', sectionId: 'sec-11s', sectionName: 'Science Group', subjectId: 'sub-phy', subjectName: 'Physics', teacherId: 'tch-02', teacherName: 'Dr. Tariqul Islam', roomNo: 'Physics Lab 2', branchId: 'br-01' },
  { id: 'rt-11s-tu-3', day: 'Tuesday', periodNumber: 3, startTime: '10:15 AM', endTime: '11:00 AM', classId: 'cls-11', className: 'Class Eleven (11 - College)', sectionId: 'sec-11s', sectionName: 'Science Group', subjectId: 'sub-mat', subjectName: 'General Mathematics', teacherId: 'tch-01', teacherName: 'Nusrat Jahan', roomNo: 'Lecture Hall A', branchId: 'br-01' },
  { id: 'rt-11s-tu-4', day: 'Tuesday', periodNumber: 4, startTime: '11:00 AM', endTime: '11:45 AM', classId: 'cls-11', className: 'Class Eleven (11 - College)', sectionId: 'sec-11s', sectionName: 'Science Group', subjectId: 'sub-eng', subjectName: 'English First Paper', teacherId: 'tch-03', teacherName: 'Kazi Farhana', roomNo: 'Lecture Hall A', branchId: 'br-01' },

  // Wednesday
  { id: 'rt-11s-we-1', day: 'Wednesday', periodNumber: 1, startTime: '08:30 AM', endTime: '09:15 AM', classId: 'cls-11', className: 'Class Eleven (11 - College)', sectionId: 'sec-11s', sectionName: 'Science Group', subjectId: 'sub-mat', subjectName: 'General Mathematics', teacherId: 'tch-01', teacherName: 'Nusrat Jahan', roomNo: 'Lecture Hall A', branchId: 'br-01' },
  { id: 'rt-11s-we-2', day: 'Wednesday', periodNumber: 2, startTime: '09:15 AM', endTime: '10:00 AM', classId: 'cls-11', className: 'Class Eleven (11 - College)', sectionId: 'sec-11s', sectionName: 'Science Group', subjectId: 'sub-phy', subjectName: 'Physics', teacherId: 'tch-02', teacherName: 'Dr. Tariqul Islam', roomNo: 'Lecture Hall A', branchId: 'br-01' },
  { id: 'rt-11s-we-3', day: 'Wednesday', periodNumber: 3, startTime: '10:15 AM', endTime: '11:00 AM', classId: 'cls-11', className: 'Class Eleven (11 - College)', sectionId: 'sec-11s', sectionName: 'Science Group', subjectId: 'sub-bio', subjectName: 'Biology (Higher Option)', teacherId: 'tch-02', teacherName: 'Dr. Tariqul Islam', roomNo: 'Bio-Science Lab', branchId: 'br-01' },
  { id: 'rt-11s-we-4', day: 'Wednesday', periodNumber: 4, startTime: '11:00 AM', endTime: '11:45 AM', classId: 'cls-11', className: 'Class Eleven (11 - College)', sectionId: 'sec-11s', sectionName: 'Science Group', subjectId: 'sub-ict', subjectName: 'Information & Comm. Tech', teacherId: 'tch-05', teacherName: 'Sadia Sultana', roomNo: 'Computer Lab 2', branchId: 'br-01' },

  // Thursday
  { id: 'rt-11s-th-1', day: 'Thursday', periodNumber: 1, startTime: '08:30 AM', endTime: '09:15 AM', classId: 'cls-11', className: 'Class Eleven (11 - College)', sectionId: 'sec-11s', sectionName: 'Science Group', subjectId: 'sub-che', subjectName: 'Chemistry', teacherId: 'tch-02', teacherName: 'Dr. Tariqul Islam', roomNo: 'Chemistry Lab', branchId: 'br-01' },
  { id: 'rt-11s-th-2', day: 'Thursday', periodNumber: 2, startTime: '09:15 AM', endTime: '10:00 AM', classId: 'cls-11', className: 'Class Eleven (11 - College)', sectionId: 'sec-11s', sectionName: 'Science Group', subjectId: 'sub-eng', subjectName: 'English First Paper', teacherId: 'tch-03', teacherName: 'Kazi Farhana', roomNo: 'Lecture Hall A', branchId: 'br-01' },
  { id: 'rt-11s-th-3', day: 'Thursday', periodNumber: 3, startTime: '10:15 AM', endTime: '11:00 AM', classId: 'cls-11', className: 'Class Eleven (11 - College)', sectionId: 'sec-11s', sectionName: 'Science Group', subjectId: 'sub-mat', subjectName: 'General Mathematics', teacherId: 'tch-01', teacherName: 'Nusrat Jahan', roomNo: 'Lecture Hall A', branchId: 'br-01' },
  { id: 'rt-11s-th-4', day: 'Thursday', periodNumber: 4, startTime: '11:00 AM', endTime: '11:45 AM', classId: 'cls-11', className: 'Class Eleven (11 - College)', sectionId: 'sec-11s', sectionName: 'Science Group', subjectId: 'sub-ban', subjectName: 'Bangla First Paper', teacherId: 'tch-04', teacherName: 'Md. Shafiqul Islam', roomNo: 'Lecture Hall A', branchId: 'br-01' },

  // --- UTTARA CAMPUS (br-02): CLASS 9 - SECTION A (Lotus) ---
  // Sunday
  { id: 'rt-9a-su-1', day: 'Sunday', periodNumber: 1, startTime: '08:30 AM', endTime: '09:15 AM', classId: 'cls-09', className: 'Class Nine (9)', sectionId: 'sec-9a', sectionName: 'Section A (Lotus)', subjectId: 'sub-eng', subjectName: 'English First Paper', teacherId: 'tch-03', teacherName: 'Kazi Farhana', roomNo: 'Room 201', branchId: 'br-02' },
  { id: 'rt-9a-su-2', day: 'Sunday', periodNumber: 2, startTime: '09:15 AM', endTime: '10:00 AM', classId: 'cls-09', className: 'Class Nine (9)', sectionId: 'sec-9a', sectionName: 'Section A (Lotus)', subjectId: 'sub-mat', subjectName: 'General Mathematics', teacherId: 'tch-01', teacherName: 'Nusrat Jahan', roomNo: 'Room 201', branchId: 'br-02' },
  { id: 'rt-9a-su-3', day: 'Sunday', periodNumber: 3, startTime: '10:15 AM', endTime: '11:00 AM', classId: 'cls-09', className: 'Class Nine (9)', sectionId: 'sec-9a', sectionName: 'Section A (Lotus)', subjectId: 'sub-ban', subjectName: 'Bangla First Paper', teacherId: 'tch-04', teacherName: 'Md. Shafiqul Islam', roomNo: 'Room 201', branchId: 'br-02' },
  { id: 'rt-9a-su-4', day: 'Sunday', periodNumber: 4, startTime: '11:00 AM', endTime: '11:45 AM', classId: 'cls-09', className: 'Class Nine (9)', sectionId: 'sec-9a', sectionName: 'Section A (Lotus)', subjectId: 'sub-ict', subjectName: 'Information & Comm. Tech', teacherId: 'tch-05', teacherName: 'Sadia Sultana', roomNo: 'Computer Lab', branchId: 'br-02' }
];

export const INITIAL_EXAMS: Exam[] = [
  { id: 'ex-mid-26', name: 'Mid Term Examination 2026', term: 'First Term', academicYear: '2026 - 2027', startDate: '2026-04-10', endDate: '2026-04-24', isPublished: true, branchId: 'br-01', instructions: 'Admit card required. Calculators allowed for Mathematics and Physics only.' },
  { id: 'ex-fin-26', name: 'Annual Final Examination 2026', term: 'Final Term', academicYear: '2026 - 2027', startDate: '2026-11-15', endDate: '2026-12-02', isPublished: false, branchId: 'br-01', instructions: 'Comprehensive syllabus for Class 10 & 11.' },
  { id: 'ex-mid-utt-26', name: 'Uttara Mid Term Examination 2026', term: 'First Term', academicYear: '2026 - 2027', startDate: '2026-04-12', endDate: '2026-04-26', isPublished: true, branchId: 'br-02', instructions: 'Reporting time 9:30 AM sharp at Exam Hall Room 201.' }
];

export const INITIAL_EXAM_SCHEDULES: ExamScheduleItem[] = [
  // Class 10 Mid Term Schedule (Main Campus)
  {
    id: 'ex-sch-1',
    examId: 'ex-mid-26',
    classId: 'cls-10',
    className: 'Class Ten (10)',
    subjectId: 'sub-mat',
    subjectName: 'General Mathematics',
    examDate: '2026-04-10',
    day: 'Friday',
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    roomNo: 'Room 301, 302',
    fullMarks: 100,
    passMarks: 33,
    branchId: 'br-01'
  },
  {
    id: 'ex-sch-2',
    examId: 'ex-mid-26',
    classId: 'cls-10',
    className: 'Class Ten (10)',
    subjectId: 'sub-eng',
    subjectName: 'English First Paper',
    examDate: '2026-04-13',
    day: 'Monday',
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    roomNo: 'Room 301, 302',
    fullMarks: 100,
    passMarks: 33,
    branchId: 'br-01'
  },
  {
    id: 'ex-sch-3',
    examId: 'ex-mid-26',
    classId: 'cls-10',
    className: 'Class Ten (10)',
    subjectId: 'sub-ban',
    subjectName: 'Bangla First Paper',
    examDate: '2026-04-16',
    day: 'Thursday',
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    roomNo: 'Room 301, 302',
    fullMarks: 100,
    passMarks: 33,
    branchId: 'br-01'
  },
  {
    id: 'ex-sch-4',
    examId: 'ex-mid-26',
    classId: 'cls-10',
    className: 'Class Ten (10)',
    subjectId: 'sub-phy',
    subjectName: 'Physics',
    examDate: '2026-04-19',
    day: 'Sunday',
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    roomNo: 'Physics Lab / Room 301',
    fullMarks: 100,
    passMarks: 33,
    branchId: 'br-01'
  },
  {
    id: 'ex-sch-5',
    examId: 'ex-mid-26',
    classId: 'cls-10',
    className: 'Class Ten (10)',
    subjectId: 'sub-ict',
    subjectName: 'Information & Comm. Tech',
    examDate: '2026-04-22',
    day: 'Wednesday',
    startTime: '10:00 AM',
    endTime: '12:00 PM',
    roomNo: 'Computer Lab 1',
    fullMarks: 50,
    passMarks: 17,
    branchId: 'br-01'
  },

  // Class 9 Mid Term Schedule (Uttara Campus)
  {
    id: 'ex-sch-utt-1',
    examId: 'ex-mid-utt-26',
    classId: 'cls-09',
    className: 'Class Nine (9)',
    subjectId: 'sub-mat',
    subjectName: 'General Mathematics',
    examDate: '2026-04-12',
    day: 'Sunday',
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    roomNo: 'Room 201',
    fullMarks: 100,
    passMarks: 33,
    branchId: 'br-02'
  },
  {
    id: 'ex-sch-utt-2',
    examId: 'ex-mid-utt-26',
    classId: 'cls-09',
    className: 'Class Nine (9)',
    subjectId: 'sub-eng',
    subjectName: 'English First Paper',
    examDate: '2026-04-15',
    day: 'Wednesday',
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    roomNo: 'Room 201',
    fullMarks: 100,
    passMarks: 33,
    branchId: 'br-02'
  }
];

export const INITIAL_MARKS: ExamMark[] = [
  // Main Campus (cls-10, sec-10a)
  { id: 'm-1', examId: 'ex-mid-26', studentId: 'std-1001', studentName: 'Tanvir Ahmed', rollNo: '01', classId: 'cls-10', sectionId: 'sec-10a', subjectId: 'sub-mat', subjectName: 'General Mathematics', fullMarks: 100, theoryMarks: 66, mcqMarks: 28, practicalMarks: 0, obtainedMarks: 94, grade: 'A+', gradePoint: 5.0, isPass: true, isAbsent: false, remark: 'Outstanding analytical skills', branchId: 'br-01' },
  { id: 'm-2', examId: 'ex-mid-26', studentId: 'std-1001', studentName: 'Tanvir Ahmed', rollNo: '01', classId: 'cls-10', sectionId: 'sec-10a', subjectId: 'sub-phy', subjectName: 'Physics', fullMarks: 100, theoryMarks: 45, mcqMarks: 23, practicalMarks: 20, obtainedMarks: 88, grade: 'A+', gradePoint: 5.0, isPass: true, isAbsent: false, remark: 'Excellent lab demonstration', branchId: 'br-01' },
  { id: 'm-3', examId: 'ex-mid-26', studentId: 'std-1001', studentName: 'Tanvir Ahmed', rollNo: '01', classId: 'cls-10', sectionId: 'sec-10a', subjectId: 'sub-eng', subjectName: 'English First Paper', fullMarks: 100, theoryMarks: 54, mcqMarks: 28, practicalMarks: 0, obtainedMarks: 82, grade: 'A+', gradePoint: 5.0, isPass: true, isAbsent: false, remark: 'Strong grammar and vocabulary', branchId: 'br-01' },
  { id: 'm-4', examId: 'ex-mid-26', studentId: 'std-1001', studentName: 'Tanvir Ahmed', rollNo: '01', classId: 'cls-10', sectionId: 'sec-10a', subjectId: 'sub-ban', subjectName: 'Bangla First Paper', fullMarks: 100, theoryMarks: 52, mcqMarks: 26, practicalMarks: 0, obtainedMarks: 78, grade: 'A', gradePoint: 4.0, isPass: true, isAbsent: false, remark: 'Good creative writing', branchId: 'br-01' },
  { id: 'm-5', examId: 'ex-mid-26', studentId: 'std-1001', studentName: 'Tanvir Ahmed', rollNo: '01', classId: 'cls-10', sectionId: 'sec-10a', subjectId: 'sub-ict', subjectName: 'Information & Comm. Tech', fullMarks: 50, theoryMarks: 23, mcqMarks: 0, practicalMarks: 23, obtainedMarks: 46, grade: 'A+', gradePoint: 5.0, isPass: true, isAbsent: false, remark: 'Proficient in Python basics', branchId: 'br-01' },

  { id: 'm-6', examId: 'ex-mid-26', studentId: 'std-1002', studentName: 'Ayesha Siddiqua', rollNo: '02', classId: 'cls-10', sectionId: 'sec-10a', subjectId: 'sub-mat', subjectName: 'General Mathematics', fullMarks: 100, theoryMarks: 70, mcqMarks: 28, practicalMarks: 0, obtainedMarks: 98, grade: 'A+', gradePoint: 5.0, isPass: true, isAbsent: false, remark: 'Top in class with near perfect score', branchId: 'br-01' },
  { id: 'm-7', examId: 'ex-mid-26', studentId: 'std-1002', studentName: 'Ayesha Siddiqua', rollNo: '02', classId: 'cls-10', sectionId: 'sec-10a', subjectId: 'sub-phy', subjectName: 'Physics', fullMarks: 100, theoryMarks: 47, mcqMarks: 23, practicalMarks: 22, obtainedMarks: 92, grade: 'A+', gradePoint: 5.0, isPass: true, isAbsent: false, remark: 'Exceptional in optics and circuit theory', branchId: 'br-01' },
  { id: 'm-8', examId: 'ex-mid-26', studentId: 'std-1002', studentName: 'Ayesha Siddiqua', rollNo: '02', classId: 'cls-10', sectionId: 'sec-10a', subjectId: 'sub-eng', subjectName: 'English First Paper', fullMarks: 100, theoryMarks: 60, mcqMarks: 29, practicalMarks: 0, obtainedMarks: 89, grade: 'A+', gradePoint: 5.0, isPass: true, isAbsent: false, remark: 'Flawless comprehension', branchId: 'br-01' },
  { id: 'm-9', examId: 'ex-mid-26', studentId: 'std-1002', studentName: 'Ayesha Siddiqua', rollNo: '02', classId: 'cls-10', sectionId: 'sec-10a', subjectId: 'sub-ban', subjectName: 'Bangla First Paper', fullMarks: 100, theoryMarks: 57, mcqMarks: 28, practicalMarks: 0, obtainedMarks: 85, grade: 'A+', gradePoint: 5.0, isPass: true, isAbsent: false, remark: 'Well articulated answers', branchId: 'br-01' },
  { id: 'm-10', examId: 'ex-mid-26', studentId: 'std-1002', studentName: 'Ayesha Siddiqua', rollNo: '02', classId: 'cls-10', sectionId: 'sec-10a', subjectId: 'sub-ict', subjectName: 'Information & Comm. Tech', fullMarks: 50, theoryMarks: 24, mcqMarks: 0, practicalMarks: 24, obtainedMarks: 48, grade: 'A+', gradePoint: 5.0, isPass: true, isAbsent: false, remark: 'Outstanding lab project', branchId: 'br-01' },

  // Uttara Campus (cls-09, sec-9a)
  { id: 'm-utt-1', examId: 'ex-mid-utt-26', studentId: 'std-0901', studentName: 'Zubayer Hossain', rollNo: '01', classId: 'cls-09', sectionId: 'sec-9a', subjectId: 'sub-mat', subjectName: 'General Mathematics', fullMarks: 100, theoryMarks: 63, mcqMarks: 28, practicalMarks: 0, obtainedMarks: 91, grade: 'A+', gradePoint: 5.0, isPass: true, isAbsent: false, remark: 'Great algebraic solutions', branchId: 'br-02' },
  { id: 'm-utt-2', examId: 'ex-mid-utt-26', studentId: 'std-0901', studentName: 'Zubayer Hossain', rollNo: '01', classId: 'cls-09', sectionId: 'sec-9a', subjectId: 'sub-eng', subjectName: 'English First Paper', fullMarks: 100, theoryMarks: 58, mcqMarks: 28, practicalMarks: 0, obtainedMarks: 86, grade: 'A+', gradePoint: 5.0, isPass: true, isAbsent: false, remark: 'Very good writing expression', branchId: 'br-02' },
  { id: 'm-utt-3', examId: 'ex-mid-utt-26', studentId: 'std-0902', studentName: 'Mehnaz Parveen', rollNo: '02', classId: 'cls-09', sectionId: 'sec-9a', subjectId: 'sub-mat', subjectName: 'General Mathematics', fullMarks: 100, theoryMarks: 67, mcqMarks: 28, practicalMarks: 0, obtainedMarks: 95, grade: 'A+', gradePoint: 5.0, isPass: true, isAbsent: false, remark: 'Consistently top marks', branchId: 'br-02' },
  { id: 'm-utt-4', examId: 'ex-mid-utt-26', studentId: 'std-0902', studentName: 'Mehnaz Parveen', rollNo: '02', classId: 'cls-09', sectionId: 'sec-9a', subjectId: 'sub-eng', subjectName: 'English First Paper', fullMarks: 100, theoryMarks: 62, mcqMarks: 28, practicalMarks: 0, obtainedMarks: 90, grade: 'A+', gradePoint: 5.0, isPass: true, isAbsent: false, remark: 'Eloquent writing', branchId: 'br-02' }
];

export const INITIAL_FEE_TYPES: FeeType[] = [
  { id: 'ft-adm', name: 'Admission & Session Fee', code: 'FEE_ADM', frequency: 'Annual', description: 'Annual registration and academic session kit' },
  { id: 'ft-tui', name: 'Monthly Tuition Fee', code: 'FEE_TUI', frequency: 'Monthly', description: 'Standard monthly instruction & maintenance fee' },
  { id: 'ft-exm', name: 'Examination Fee', code: 'FEE_EXM', frequency: 'Term-Wise', description: 'Term exam question papers, answer scripts and evaluation' },
  { id: 'ft-lab', name: 'Science & ICT Lab Fee', code: 'FEE_LAB', frequency: 'Term-Wise', description: 'Practical equipment and high-speed broadband usage' }
];

export const INITIAL_FEE_STRUCTURE: FeeStructure[] = [
  { id: 'fs-1', academicYearId: 'ay-2026', classId: 'cls-10', className: 'Class Ten (10)', feeTypeId: 'ft-tui', feeTypeName: 'Monthly Tuition Fee', amount: 3500, dueDate: '2026-10-15', branchId: 'br-01' },
  { id: 'fs-2', academicYearId: 'ay-2026', classId: 'cls-10', className: 'Class Ten (10)', feeTypeId: 'ft-exm', feeTypeName: 'Examination Fee', amount: 1500, dueDate: '2026-10-25', branchId: 'br-01' },
  { id: 'fs-3', academicYearId: 'ay-2026', classId: 'cls-10', className: 'Class Ten (10)', feeTypeId: 'ft-lab', feeTypeName: 'Science & ICT Lab Fee', amount: 800, dueDate: '2026-10-25', branchId: 'br-01' },
  { id: 'fs-4', academicYearId: 'ay-2026', classId: 'cls-09', className: 'Class Nine (9)', feeTypeId: 'ft-tui', feeTypeName: 'Monthly Tuition Fee', amount: 3200, dueDate: '2026-10-15', branchId: 'br-02' }
];

export const INITIAL_INVOICES: StudentInvoice[] = [
  // Main Campus (br-01) Invoices
  {
    id: 'inv-101',
    invoiceNo: 'INV-2026-10-001',
    studentId: 'std-1001',
    studentName: 'Tanvir Ahmed',
    rollNo: '01',
    className: 'Class Ten (10)',
    sectionName: 'Section A (Padma)',
    feeTypeId: 'ft-tui',
    feeTypeName: 'Monthly Tuition Fee (October 2026)',
    totalAmount: 3500,
    discountAmount: 0,
    netAmount: 3500,
    paidAmount: 3500,
    dueAmount: 0,
    dueDate: '2026-10-15',
    status: 'Paid',
    branchId: 'br-01'
  },
  {
    id: 'inv-102',
    invoiceNo: 'INV-2026-10-002',
    studentId: 'std-1001',
    studentName: 'Tanvir Ahmed',
    rollNo: '01',
    className: 'Class Ten (10)',
    sectionName: 'Section A (Padma)',
    feeTypeId: 'ft-exm',
    feeTypeName: 'Examination Fee (Mid Term 2026)',
    totalAmount: 1500,
    discountAmount: 0,
    netAmount: 1500,
    paidAmount: 0,
    dueAmount: 1500,
    dueDate: '2026-10-25',
    status: 'Unpaid',
    branchId: 'br-01'
  },
  {
    id: 'inv-103',
    invoiceNo: 'INV-2026-10-003',
    studentId: 'std-1002',
    studentName: 'Ayesha Siddiqua',
    rollNo: '02',
    className: 'Class Ten (10)',
    sectionName: 'Section A (Padma)',
    feeTypeId: 'ft-tui',
    feeTypeName: 'Monthly Tuition Fee (October 2026)',
    totalAmount: 3500,
    discountAmount: 500, // Merit scholarship
    netAmount: 3000,
    paidAmount: 3000,
    dueAmount: 0,
    dueDate: '2026-10-15',
    status: 'Paid',
    branchId: 'br-01'
  },
  {
    id: 'inv-104',
    invoiceNo: 'INV-2026-10-004',
    studentId: 'std-1003',
    studentName: 'Rahimul Islam',
    rollNo: '03',
    className: 'Class Ten (10)',
    sectionName: 'Section A (Padma)',
    feeTypeId: 'ft-tui',
    feeTypeName: 'Monthly Tuition Fee (October 2026)',
    totalAmount: 3500,
    discountAmount: 0,
    netAmount: 3500,
    paidAmount: 1500,
    dueAmount: 2000,
    dueDate: '2026-10-15',
    status: 'Partial',
    branchId: 'br-01'
  },
  {
    id: 'inv-105',
    invoiceNo: 'INV-2026-09-088',
    studentId: 'std-1004',
    studentName: 'Sumaiya Binte Nasir',
    rollNo: '04',
    className: 'Class Ten (10)',
    sectionName: 'Section A (Padma)',
    feeTypeId: 'ft-tui',
    feeTypeName: 'Monthly Tuition Fee (September 2026)',
    totalAmount: 3500,
    discountAmount: 0,
    netAmount: 3500,
    paidAmount: 0,
    dueAmount: 3500,
    dueDate: '2026-09-20',
    status: 'Overdue',
    branchId: 'br-01'
  },
  // Uttara Campus (br-02) Invoices
  {
    id: 'inv-201',
    invoiceNo: 'INV-2026-10-091',
    studentId: 'std-0901',
    studentName: 'Zubayer Hossain',
    rollNo: '01',
    className: 'Class Nine (9)',
    sectionName: 'Section A (Lotus)',
    feeTypeId: 'ft-tui',
    feeTypeName: 'Monthly Tuition Fee (October 2026)',
    totalAmount: 3200,
    discountAmount: 0,
    netAmount: 3200,
    paidAmount: 3200,
    dueAmount: 0,
    dueDate: '2026-10-15',
    status: 'Paid',
    branchId: 'br-02'
  },
  {
    id: 'inv-202',
    invoiceNo: 'INV-2026-10-092',
    studentId: 'std-0902',
    studentName: 'Mehnaz Parveen',
    rollNo: '02',
    className: 'Class Nine (9)',
    sectionName: 'Section A (Lotus)',
    feeTypeId: 'ft-tui',
    feeTypeName: 'Monthly Tuition Fee (October 2026)',
    totalAmount: 3200,
    discountAmount: 0,
    netAmount: 3200,
    paidAmount: 1600,
    dueAmount: 1600,
    dueDate: '2026-10-15',
    status: 'Partial',
    branchId: 'br-02'
  }
];

export const INITIAL_NOTICES: Notice[] = [
  {
    id: 'not-01',
    title: 'Mid-Term Examination 2026 Schedule & Guidelines',
    category: 'Exam',
    targetAudience: 'All',
    publishedDate: '2026-10-18',
    content: 'All students and respected parents are hereby notified that Mid Term Exams will commence on November 15, 2026. Admit cards will be available from accounts desk upon clearance of dues.',
    isImportant: true,
    author: 'Principal Dr. Mahmudur Rahman',
    branchId: 'br-01'
  },
  {
    id: 'not-02',
    title: 'Upcoming Science & Robotics Fair 2026 Registration Open',
    category: 'Academic',
    targetAudience: 'Students',
    publishedDate: '2026-10-15',
    content: 'Interested teams from Class 9, 10, and 11 are requested to submit project abstracts to Dr. Tariqul Islam before October 31.',
    isImportant: false,
    author: 'Science Club Moderator',
    branchId: 'br-01'
  },
  {
    id: 'not-03',
    title: 'Staff Meeting on Digital Attendance & Evaluation System',
    category: 'General',
    targetAudience: 'Teachers',
    publishedDate: '2026-10-12',
    content: 'All academic faculty members must attend the briefing at Teachers Lounge this Thursday at 2:30 PM.',
    isImportant: true,
    author: 'Academic Coordinator',
    branchId: 'br-02'
  },
  {
    id: 'not-04',
    title: 'Uttara Campus Annual Inter-Section Sports Meet',
    category: 'General',
    targetAudience: 'All',
    publishedDate: '2026-10-20',
    content: 'All students of Uttara Branch are invited to register for athletic track events by next Monday at the Sports Desk.',
    isImportant: true,
    author: 'Campus Coordinator Uttara',
    branchId: 'br-02'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-01',
    timestamp: '2026-10-19 14:30:22',
    userName: 'admin',
    userRole: 'SUPER_ADMIN',
    action: 'Create',
    module: 'Dynamic Menu Management',
    targetRecord: 'ADMIN_USER_PERM',
    details: 'Configured new dynamic menu node User-Specific Menu Assignment',
    schoolScope: 'DMSC-101',
    branchId: 'br-01'
  },
  {
    id: 'aud-02',
    timestamp: '2026-10-19 11:15:04',
    userName: 'admin',
    userRole: 'SUPER_ADMIN',
    action: 'Override',
    module: 'User Menu Assignment',
    targetRecord: 'usr-teacher (Nusrat Jahan)',
    details: 'Explicit User ALLOW override applied for FIN_COLLECTION (View & Create)',
    schoolScope: 'DMSC-101',
    branchId: 'br-01'
  },
  {
    id: 'aud-03',
    timestamp: '2026-10-19 09:05:18',
    userName: 'accountant',
    userRole: 'ACCOUNTANT',
    action: 'Create',
    module: 'Fee Collection',
    targetRecord: 'INV-2026-10-001',
    details: 'Received ৳ 3,500 via bKash TrxID #8X93N19 from Tanvir Ahmed (Roll 01)',
    schoolScope: 'DMSC-101',
    branchId: 'br-01'
  },
  {
    id: 'aud-04',
    timestamp: '2026-10-20 08:30:11',
    userName: 'teacher_utt',
    userRole: 'TEACHER',
    action: 'Create',
    module: 'Attendance Entry',
    targetRecord: 'Class Nine (Lotus)',
    details: 'Marked daily attendance for Uttara Campus Class 9-A',
    schoolScope: 'DMSC-101',
    branchId: 'br-02'
  }
];
