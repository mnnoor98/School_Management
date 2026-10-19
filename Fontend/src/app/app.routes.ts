import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { AuthLayoutComponent } from './layouts/auth-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    component: AuthLayoutComponent
  },
  {
    path: 'app',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [permissionGuard],
        data: { permissionCode: 'DASHBOARD_VIEW' }
      },
      // Administration
      {
        path: 'admin/school-setup',
        loadComponent: () =>
          import('./features/administration/school-setup.component').then(m => m.SchoolSetupComponent),
        canActivate: [permissionGuard],
        data: { permissionCode: 'ADMIN_SCHOOL_VIEW' }
      },
      {
        path: 'admin/users',
        loadComponent: () =>
          import('./features/administration/user-permissions.component').then(m => m.UserPermissionsComponent),
        canActivate: [permissionGuard],
        data: { permissionCode: 'ADMIN_USERS_VIEW' }
      },
      {
        path: 'admin/roles',
        loadComponent: () =>
          import('./features/administration/role-permissions.component').then(m => m.RolePermissionsComponent),
        canActivate: [permissionGuard],
        data: { permissionCode: 'ADMIN_ROLES_VIEW' }
      },
      {
        path: 'admin/menu-management',
        loadComponent: () =>
          import('./features/administration/menu-management.component').then(m => m.MenuManagementComponent),
        canActivate: [permissionGuard],
        data: { permissionCode: 'ADMIN_MENU_VIEW' }
      },
      {
        path: 'admin/role-permissions',
        loadComponent: () =>
          import('./features/administration/role-permissions.component').then(m => m.RolePermissionsComponent),
        canActivate: [permissionGuard],
        data: { permissionCode: 'ADMIN_ROLE_PERM_VIEW' }
      },
      {
        path: 'admin/user-permissions',
        loadComponent: () =>
          import('./features/administration/user-permissions.component').then(m => m.UserPermissionsComponent),
        canActivate: [permissionGuard],
        data: { permissionCode: 'ADMIN_USER_PERM_VIEW' }
      },
      {
        path: 'admin/audit-log',
        loadComponent: () =>
          import('./features/administration/audit-log.component').then(m => m.AuditLogComponent),
        canActivate: [permissionGuard],
        data: { permissionCode: 'ADMIN_AUDIT_VIEW' }
      },
      // Academic
      {
        path: 'academic/classes',
        loadComponent: () =>
          import('./features/academic/routine.component').then(m => m.RoutineComponent),
        canActivate: [permissionGuard],
        data: { permissionCode: 'ACAD_CLASSES_VIEW' }
      },
      {
        path: 'academic/subjects',
        loadComponent: () =>
          import('./features/academic/routine.component').then(m => m.RoutineComponent),
        canActivate: [permissionGuard],
        data: { permissionCode: 'ACAD_SUBJECTS_VIEW' }
      },
      {
        path: 'academic/routine',
        loadComponent: () =>
          import('./features/academic/routine.component').then(m => m.RoutineComponent),
        canActivate: [permissionGuard],
        data: { permissionCode: 'ACAD_ROUTINE_VIEW' }
      },
      // Student Lifecycle
      {
        path: 'students/admission',
        loadComponent: () =>
          import('./features/students/admission.component').then(m => m.AdmissionComponent),
        canActivate: [permissionGuard],
        data: { permissionCode: 'STUD_ADMISSION_VIEW' }
      },
      {
        path: 'students/list',
        loadComponent: () =>
          import('./features/students/student-list.component').then(m => m.StudentListComponent),
        canActivate: [permissionGuard],
        data: { permissionCode: 'STUD_LIST_VIEW' }
      },
      {
        path: 'students/promotion',
        loadComponent: () =>
          import('./features/students/student-list.component').then(m => m.StudentListComponent),
        canActivate: [permissionGuard],
        data: { permissionCode: 'STUD_PROMOTION_VIEW' }
      },
      // Teachers
      {
        path: 'teachers/list',
        loadComponent: () =>
          import('./features/teachers/teachers.component').then(m => m.TeachersComponent),
        canActivate: [permissionGuard],
        data: { permissionCode: 'TEACH_LIST_VIEW' }
      },
      {
        path: 'teachers/leave',
        loadComponent: () =>
          import('./features/teachers/teachers.component').then(m => m.TeachersComponent),
        canActivate: [permissionGuard],
        data: { permissionCode: 'TEACH_LEAVE_VIEW' }
      },
      // Attendance
      {
        path: 'attendance/entry',
        loadComponent: () =>
          import('./features/attendance/attendance-entry.component').then(m => m.AttendanceEntryComponent),
        canActivate: [permissionGuard],
        data: { permissionCode: 'ATT_ENTRY_VIEW' }
      },
      {
        path: 'attendance/correction',
        loadComponent: () =>
          import('./features/attendance/attendance-entry.component').then(m => m.AttendanceEntryComponent),
        canActivate: [permissionGuard],
        data: { permissionCode: 'ATT_CORRECTION_VIEW' }
      },
      {
        path: 'attendance/reports',
        loadComponent: () =>
          import('./features/reports/reports.component').then(m => m.ReportsComponent),
        canActivate: [permissionGuard],
        data: { permissionCode: 'ATT_REPORTS_VIEW' }
      },
      // Examination
      {
        path: 'exams/setup',
        loadComponent: () =>
          import('./features/exams/marksheet.component').then(m => m.MarksheetComponent),
        canActivate: [permissionGuard],
        data: { permissionCode: 'EXAM_SETUP_VIEW' }
      },
      {
        path: 'exams/marks',
        loadComponent: () =>
          import('./features/exams/marksheet.component').then(m => m.MarksheetComponent),
        canActivate: [permissionGuard],
        data: { permissionCode: 'EXAM_MARKS_VIEW' }
      },
      {
        path: 'exams/marksheet',
        loadComponent: () =>
          import('./features/exams/marksheet.component').then(m => m.MarksheetComponent),
        canActivate: [permissionGuard],
        data: { permissionCode: 'EXAM_MARKSHEET_VIEW' }
      },
      // Finance
      {
        path: 'finance/structure',
        loadComponent: () =>
          import('./features/finance/fee-collection.component').then(m => m.FeeCollectionComponent),
        canActivate: [permissionGuard],
        data: { permissionCode: 'FIN_STRUCTURE_VIEW' }
      },
      {
        path: 'finance/invoices',
        loadComponent: () =>
          import('./features/finance/fee-collection.component').then(m => m.FeeCollectionComponent),
        canActivate: [permissionGuard],
        data: { permissionCode: 'FIN_INVOICES_VIEW' }
      },
      {
        path: 'finance/collection',
        loadComponent: () =>
          import('./features/finance/fee-collection.component').then(m => m.FeeCollectionComponent),
        canActivate: [permissionGuard],
        data: { permissionCode: 'FIN_COLLECTION_VIEW' }
      },
      // Communication
      {
        path: 'communication/notices',
        loadComponent: () =>
          import('./features/communication/notices.component').then(m => m.NoticesComponent),
        canActivate: [permissionGuard],
        data: { permissionCode: 'COMM_NOTICE_VIEW' }
      },
      {
        path: 'communication/sms',
        loadComponent: () =>
          import('./features/communication/notices.component').then(m => m.NoticesComponent),
        canActivate: [permissionGuard],
        data: { permissionCode: 'COMM_SMS_VIEW' }
      },
      // Reports
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports.component').then(m => m.ReportsComponent),
        canActivate: [permissionGuard],
        data: { permissionCode: 'REPORTS_VIEW' }
      },
      // Convenience redirects
      { path: 'students', redirectTo: 'students/list', pathMatch: 'full' },
      { path: 'academic', redirectTo: 'academic/routine', pathMatch: 'full' },
      { path: 'attendance', redirectTo: 'attendance/reports', pathMatch: 'full' },
      { path: 'attendance/student', redirectTo: 'attendance/entry', pathMatch: 'full' },
      { path: 'attendance/report', redirectTo: 'attendance/reports', pathMatch: 'full' },
      { path: 'exams', redirectTo: 'exams/marksheet', pathMatch: 'full' },
      { path: 'exams/results', redirectTo: 'exams/marksheet', pathMatch: 'full' },
      { path: 'finance', redirectTo: 'finance/collection', pathMatch: 'full' },
      { path: 'finance/fee-structure', redirectTo: 'finance/structure', pathMatch: 'full' }
    ]
  },
  {
    path: 'students',
    redirectTo: '/app/students/list',
    pathMatch: 'prefix'
  },
  {
    path: 'academic',
    redirectTo: '/app/academic/routine',
    pathMatch: 'prefix'
  },
  {
    path: 'attendance',
    redirectTo: '/app/attendance/reports',
    pathMatch: 'prefix'
  },
  {
    path: 'exams',
    redirectTo: '/app/exams/marksheet',
    pathMatch: 'prefix'
  },
  {
    path: 'finance',
    redirectTo: '/app/finance/collection',
    pathMatch: 'prefix'
  },
  {
    path: '',
    redirectTo: '/app/dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/app/dashboard'
  }
];
