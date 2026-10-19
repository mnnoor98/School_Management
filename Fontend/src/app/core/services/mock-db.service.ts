import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import {
  User,
  Role,
  MenuItem,
  RolePermission,
  UserMenuOverride,
  School,
  Branch,
  AcademicYear,
  SchoolClass,
  Section,
  Subject,
  Teacher,
  Student,
  RoutinePeriod,
  AttendanceRecord,
  AttendanceCorrectionLog,
  Exam,
  ExamMark,
  StudentMarksheet,
  FeeType,
  FeeStructure,
  StudentInvoice,
  FeePayment,
  Notice,
  AuditLog,
  PermissionAction
} from '../models';
import {
  INITIAL_SCHOOL,
  INITIAL_BRANCHES,
  INITIAL_ACADEMIC_YEARS,
  INITIAL_ROLES,
  INITIAL_USERS,
  INITIAL_MENUS,
  INITIAL_ROLE_PERMISSIONS,
  INITIAL_USER_OVERRIDES,
  INITIAL_CLASSES,
  INITIAL_SECTIONS,
  INITIAL_SUBJECTS,
  INITIAL_TEACHERS,
  INITIAL_STUDENTS,
  INITIAL_ROUTINE,
  INITIAL_EXAMS,
  INITIAL_MARKS,
  INITIAL_FEE_TYPES,
  INITIAL_FEE_STRUCTURE,
  INITIAL_INVOICES,
  INITIAL_NOTICES,
  INITIAL_AUDIT_LOGS
} from './mock-data';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class MockDbService {
  private http = inject(HttpClient);
  private readonly API_BASE = 'http://localhost:5000/api/v1';

  private school$ = new BehaviorSubject<School>(INITIAL_SCHOOL);
  private branches$ = new BehaviorSubject<Branch[]>(INITIAL_BRANCHES);
  private academicYears$ = new BehaviorSubject<AcademicYear[]>(INITIAL_ACADEMIC_YEARS);
  private roles$ = new BehaviorSubject<Role[]>(INITIAL_ROLES);
  private users$ = new BehaviorSubject<User[]>(INITIAL_USERS);
  private menus$ = new BehaviorSubject<MenuItem[]>(INITIAL_MENUS);
  private rolePermissions$ = new BehaviorSubject<RolePermission[]>(INITIAL_ROLE_PERMISSIONS);
  private userOverrides$ = new BehaviorSubject<UserMenuOverride[]>(INITIAL_USER_OVERRIDES);
  private classes$ = new BehaviorSubject<SchoolClass[]>(INITIAL_CLASSES);
  private sections$ = new BehaviorSubject<Section[]>(INITIAL_SECTIONS);
  private subjects$ = new BehaviorSubject<Subject[]>(INITIAL_SUBJECTS);
  private teachers$ = new BehaviorSubject<Teacher[]>(INITIAL_TEACHERS);
  private students$ = new BehaviorSubject<Student[]>(INITIAL_STUDENTS);
  private routine$ = new BehaviorSubject<RoutinePeriod[]>(INITIAL_ROUTINE);
  private attendance$ = new BehaviorSubject<AttendanceRecord[]>([]);
  private attendanceLogs$ = new BehaviorSubject<AttendanceCorrectionLog[]>([]);
  private exams$ = new BehaviorSubject<Exam[]>(INITIAL_EXAMS);
  private marks$ = new BehaviorSubject<ExamMark[]>(INITIAL_MARKS);
  private feeTypes$ = new BehaviorSubject<FeeType[]>(INITIAL_FEE_TYPES);
  private feeStructure$ = new BehaviorSubject<FeeStructure[]>(INITIAL_FEE_STRUCTURE);
  private invoices$ = new BehaviorSubject<StudentInvoice[]>(INITIAL_INVOICES);
  private payments$ = new BehaviorSubject<FeePayment[]>([]);
  private notices$ = new BehaviorSubject<Notice[]>(INITIAL_NOTICES);
  private auditLogs$ = new BehaviorSubject<AuditLog[]>(INITIAL_AUDIT_LOGS);

  // Current session & school context
  private currentUser$ = new BehaviorSubject<User>(INITIAL_USERS[0]);
  private selectedBranch$ = new BehaviorSubject<Branch>(INITIAL_BRANCHES[0]);
  private serverAuthorizedMenus$ = new BehaviorSubject<MenuItem[]>([]);

  constructor() {
    const token = localStorage.getItem('sms_auth_token');
    if (token) {
      this.refreshAllFromBackend();
    }
  }

  /**
   * Fetches real live relational data from PostgreSQL via ASP.NET Core API
   */
  async refreshAllFromBackend(): Promise<void> {
    try {
      const results = await Promise.allSettled([
        firstValueFrom(this.http.get<ApiResponse<{ school: School; branches: Branch[] }>>(`${this.API_BASE}/School`)),
        firstValueFrom(this.http.get<ApiResponse<Student[]>>(`${this.API_BASE}/students`)),
        firstValueFrom(this.http.get<ApiResponse<Teacher[]>>(`${this.API_BASE}/teachers`)),
        firstValueFrom(this.http.get<ApiResponse<SchoolClass[]>>(`${this.API_BASE}/classes`)),
        firstValueFrom(this.http.get<ApiResponse<Section[]>>(`${this.API_BASE}/sections`)),
        firstValueFrom(this.http.get<ApiResponse<Subject[]>>(`${this.API_BASE}/subjects`)),
        firstValueFrom(this.http.get<ApiResponse<RoutinePeriod[]>>(`${this.API_BASE}/routines`)),
        firstValueFrom(this.http.get<ApiResponse<StudentInvoice[]>>(`${this.API_BASE}/fees/invoices`)),
        firstValueFrom(this.http.get<ApiResponse<FeeStructure[]>>(`${this.API_BASE}/fees/structures`)),
        firstValueFrom(this.http.get<ApiResponse<FeePayment[]>>(`${this.API_BASE}/fees/payments`)),
        firstValueFrom(this.http.get<ApiResponse<Exam[]>>(`${this.API_BASE}/exams`)),
        firstValueFrom(this.http.get<ApiResponse<AuditLog[]>>(`${this.API_BASE}/audit-logs`)),
        firstValueFrom(this.http.get<ApiResponse<User[]>>(`${this.API_BASE}/users`)),
        firstValueFrom(this.http.get<ApiResponse<Role[]>>(`${this.API_BASE}/roles`)),
        firstValueFrom(this.http.get<ApiResponse<Notice[]>>(`${this.API_BASE}/Notices`)),
        firstValueFrom(this.http.get<ApiResponse<MenuItem[]>>(`${this.API_BASE}/menus/my`))
      ]);

      if (results[0].status === 'fulfilled' && results[0].value?.data) {
        const d = results[0].value.data as any;
        if (d.school) this.school$.next(d.school);
        if (d.branches && d.branches.length > 0) this.branches$.next(d.branches);
        if (d.academicYears && d.academicYears.length > 0) this.academicYears$.next(d.academicYears);
      }
      if (results[1].status === 'fulfilled' && results[1].value?.data?.length) this.students$.next(results[1].value.data);
      if (results[2].status === 'fulfilled' && results[2].value?.data?.length) this.teachers$.next(results[2].value.data);
      if (results[3].status === 'fulfilled' && results[3].value?.data?.length) this.classes$.next(results[3].value.data);
      if (results[4].status === 'fulfilled' && results[4].value?.data?.length) this.sections$.next(results[4].value.data);
      if (results[5].status === 'fulfilled' && results[5].value?.data?.length) this.subjects$.next(results[5].value.data);
      if (results[6].status === 'fulfilled' && results[6].value?.data?.length) this.routine$.next(results[6].value.data);
      if (results[7].status === 'fulfilled' && results[7].value?.data?.length) this.invoices$.next(results[7].value.data);
      if (results[8].status === 'fulfilled' && results[8].value?.data?.length) this.feeStructure$.next(results[8].value.data);
      if (results[9].status === 'fulfilled' && results[9].value?.data?.length) this.payments$.next(results[9].value.data);
      if (results[10].status === 'fulfilled' && results[10].value?.data?.length) this.exams$.next(results[10].value.data);
      if (results[11].status === 'fulfilled' && results[11].value?.data?.length) this.auditLogs$.next(results[11].value.data);
      if (results[12].status === 'fulfilled' && results[12].value?.data?.length) this.users$.next(results[12].value.data);
      if (results[13].status === 'fulfilled' && results[13].value?.data?.length) this.roles$.next(results[13].value.data);
      if (results[14].status === 'fulfilled' && results[14].value?.data?.length) this.notices$.next(results[14].value.data);
      if (results[15].status === 'fulfilled' && results[15].value?.data?.length) this.serverAuthorizedMenus$.next(results[15].value.data);
    } catch (e) {
      console.warn('Backend sync completed with notices:', e);
    }
  }

  async refreshAuthorizedMenus() {
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<MenuItem[]>>(`${this.API_BASE}/menus/my`));
      if (res && res.success && res.data && res.data.length > 0) {
        this.serverAuthorizedMenus$.next(res.data);
      }
    } catch {
      // Keep local tree if unauthenticated or network latency
    }
  }

  // Current user & Branch accessors
  getCurrentUser(): User {
    return this.currentUser$.value;
  }

  getCurrentUser$() {
    return this.currentUser$.asObservable();
  }

  setCurrentUser(user: User) {
    this.currentUser$.next(user);
    this.refreshAuthorizedMenus();
    this.refreshUserRolePermissions(user.roleId);
  }

  async refreshUserRolePermissions(roleId?: string) {
    const rid = roleId || this.currentUser$.value?.roleId;
    if (!rid) return;
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<RolePermission[]>>(`${this.API_BASE}/roles/${rid}/menu-permissions`));
      if (res && res.success && res.data && res.data.length > 0) {
        const others = this.rolePermissions$.value.filter(rp => rp.roleId !== rid);
        this.rolePermissions$.next([...others, ...res.data]);
      }
    } catch {
      // Fallback in INITIAL_ROLE_PERMISSIONS
    }
  }

  getSelectedBranch(): Branch {
    return this.selectedBranch$.value;
  }

  getSelectedBranch$() {
    return this.selectedBranch$.asObservable();
  }

  setSelectedBranch(branch: Branch) {
    this.selectedBranch$.next(branch);
  }

  // Audit Logger
  logAudit(action: AuditLog['action'], module: string, details: string, targetRecord: string = '-') {
    const user = this.currentUser$.value;
    const log: AuditLog = {
      id: 'aud-' + Date.now() + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toLocaleString('en-GB'),
      userName: user ? user.username : 'system',
      userRole: user ? user.roleName : 'SYSTEM',
      action,
      module,
      targetRecord,
      details,
      schoolScope: this.school$.value.code
    };
    const updated = [log, ...this.auditLogs$.value];
    this.auditLogs$.next(updated);
  }

  getAuditLogs(): AuditLog[] {
    return this.auditLogs$.value;
  }

  getAuditLogs$() {
    return this.auditLogs$.asObservable();
  }

  // --- Dynamic Menus & Authorization Precedence Engine (PDF Pages 5, 6, 7, 8) ---
  getMenus(): MenuItem[] {
    return this.menus$.value;
  }

  getMenus$() {
    return this.menus$.asObservable();
  }

  getCodeAliases(code: string): string[] {
    const raw = (code || '').replace(/_VIEW$/, '').toUpperCase();
    const map: Record<string, string[]> = {
      'STUD_LIST': ['STU_LIST', 'STUDENTS', 'STUDENT'],
      'STU_LIST': ['STUD_LIST', 'STUDENTS', 'STUDENT'],
      'STUD_ADMISSION': ['STU_ADMIT', 'STUDENTS', 'STUDENT'],
      'STU_ADMIT': ['STUD_ADMISSION', 'STUDENTS', 'STUDENT'],
      'STUDENTS': ['STUD_LIST', 'STU_LIST', 'STUDENT'],
      'STUDENT': ['STUD_LIST', 'STU_LIST', 'STUDENTS'],
      'ACAD_ROUTINE': ['ACAD_ROUTINE', 'ACADEMICS', 'ACADEMIC'],
      'ACAD_CLASSES': ['ACAD_CLASSES', 'ACADEMICS', 'ACADEMIC'],
      'ACAD_SUBJECTS': ['ACAD_CLASSES', 'ACADEMICS', 'ACADEMIC'],
      'ACADEMICS': ['ACAD_ROUTINE', 'ACAD_CLASSES', 'ACADEMIC'],
      'ACADEMIC': ['ACAD_ROUTINE', 'ACAD_CLASSES', 'ACADEMICS'],
      'ATT_ENTRY': ['ATT_STUDENT', 'ATTENDANCE'],
      'ATT_STUDENT': ['ATT_ENTRY', 'ATTENDANCE'],
      'ATT_REPORTS': ['ATT_REPORT', 'ATTENDANCE'],
      'ATT_REPORT': ['ATT_REPORTS', 'ATTENDANCE'],
      'ATT_CORRECTION': ['ATT_STUDENT', 'ATT_REPORT', 'ATTENDANCE'],
      'ATTENDANCE': ['ATT_STUDENT', 'ATT_ENTRY', 'ATT_REPORT', 'ATT_REPORTS'],
      'EXAM_MARKSHEET': ['EXAM_RESULTS', 'EXAMS', 'EXAMINATION'],
      'EXAM_RESULTS': ['EXAM_MARKSHEET', 'EXAMS', 'EXAMINATION'],
      'EXAM_MARKS': ['EXAM_MARKS', 'EXAMS', 'EXAMINATION'],
      'EXAM_SETUP': ['EXAM_SETUP', 'EXAMS', 'EXAMINATION'],
      'EXAMS': ['EXAM_RESULTS', 'EXAM_MARKSHEET', 'EXAM_MARKS', 'EXAMINATION'],
      'EXAMINATION': ['EXAM_RESULTS', 'EXAM_MARKSHEET', 'EXAM_MARKS', 'EXAMS'],
      'FIN_STRUCTURE': ['FIN_FEES', 'FINANCE'],
      'FIN_FEES': ['FIN_STRUCTURE', 'FIN_INVOICES', 'FINANCE'],
      'FIN_INVOICES': ['FIN_FEES', 'FIN_COLLECTION', 'FINANCE'],
      'FIN_COLLECTION': ['FIN_COLLECTION', 'FIN_FEES', 'FINANCE'],
      'FINANCE': ['FIN_COLLECTION', 'FIN_FEES', 'FIN_STRUCTURE', 'FIN_INVOICES'],
      'ADMIN_SCHOOL': ['SEC_MENUS', 'SECURITY', 'ADMINISTRATION'],
      'ADMIN_USERS': ['SEC_USERS', 'SECURITY', 'ADMINISTRATION'],
      'ADMIN_ROLES': ['SEC_ROLES', 'SECURITY', 'ADMINISTRATION'],
      'ADMIN_MENU': ['SEC_MENUS', 'SECURITY', 'ADMINISTRATION'],
      'ADMIN_AUDIT': ['SEC_AUDIT', 'SECURITY', 'ADMINISTRATION'],
      'SEC_USERS': ['ADMIN_USERS', 'SECURITY', 'ADMINISTRATION'],
      'SEC_ROLES': ['ADMIN_ROLES', 'SECURITY', 'ADMINISTRATION'],
      'SEC_MENUS': ['ADMIN_MENU', 'ADMIN_SCHOOL', 'SECURITY', 'ADMINISTRATION'],
      'SEC_AUDIT': ['ADMIN_AUDIT', 'SECURITY', 'ADMINISTRATION'],
      'SECURITY': ['ADMIN_USERS', 'ADMIN_ROLES', 'ADMIN_MENU', 'ADMIN_AUDIT', 'ADMINISTRATION'],
      'ADMINISTRATION': ['SEC_USERS', 'SEC_ROLES', 'SEC_MENUS', 'SEC_AUDIT', 'SECURITY'],
      'REPORTS': ['REP_ACADEMIC', 'REP_FINANCE', 'REPORTS']
    };
    const aliases = map[raw] || [];
    return Array.from(new Set([raw, code.toUpperCase(), ...aliases]));
  }

  hasPermission(menuCode: string, action: PermissionAction = 'view', user?: User): boolean {
    const u = user || this.currentUser$.value;
    if (!u) return false;

    // Super Admin has full unrestricted access
    if (u.roleId === 'role-superadmin' || u.roleId === 'role-admin' || u.roleName === 'Super Admin' || u.username === 'admin') {
      return true;
    }

    const aliases = this.getCodeAliases(menuCode);
    if (aliases.includes('DASHBOARD')) {
      return true;
    }

    // 1. Check Explicit User Overrides
    const override = this.userOverrides$.value.find(
      o => o.userId === u.id && aliases.includes(o.menuCode.toUpperCase()) && o.action === action
    );
    if (override) {
      if (override.override === 'Deny') return false;
      if (override.override === 'Allow') return true;
    }

    // 2. Check Role Grants
    const rolePerm = this.rolePermissions$.value.find(
      rp => rp.roleId === u.roleId && aliases.includes(rp.menuCode.toUpperCase())
    );
    if (rolePerm && rolePerm[action]) {
      return true;
    }

    // 3. Default Deny
    return false;
  }

  getMyMenuTree(user?: User): MenuItem[] {
    // If backend authorized tree is loaded, use it directly
    const serverTree = this.serverAuthorizedMenus$.value;
    if (serverTree && serverTree.length > 0 && (!user || user.id === this.currentUser$.value.id)) {
      return serverTree;
    }

    const u = user || this.currentUser$.value;
    const allMenus = this.menus$.value;

    return allMenus
      .filter(m => m.isActive && m.isVisible)
      .map(parent => {
        if (parent.children && parent.children.length > 0) {
          const visibleChildren = parent.children.filter(child =>
            child.isActive && child.isVisible && this.hasPermission(child.code, 'view', u)
          );
          const parentHasDirectAccess = this.hasPermission(parent.code, 'view', u);
          if (parentHasDirectAccess || visibleChildren.length > 0) {
            return {
              ...parent,
              children: visibleChildren.sort((a, b) => a.displayOrder - b.displayOrder)
            };
          }
          return null;
        } else {
          return this.hasPermission(parent.code, 'view', u) ? parent : null;
        }
      })
      .filter((m): m is MenuItem => m !== null)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  saveMenu(menu: MenuItem): { success: boolean; message: string } {
    if (menu.id) {
      this.http.put(`${this.API_BASE}/menus/${menu.id}`, {
        name: menu.name,
        route: menu.route,
        icon: menu.icon,
        displayOrder: menu.displayOrder,
        isActive: menu.isActive,
        isVisible: menu.isVisible
      }).subscribe();
    }

    const currentMenus = [...this.menus$.value];
    const index = currentMenus.findIndex(m => m.id === menu.id);
    if (index > -1) {
      currentMenus[index] = { ...menu };
    } else {
      currentMenus.push(menu);
    }
    this.menus$.next(currentMenus);
    return { success: true, message: 'Menu saved successfully.' };
  }

  toggleMenuStatus(menuId: string): void {
    const menus = [...this.menus$.value];
    for (const m of menus) {
      if (m.id === menuId) {
        m.isActive = !m.isActive;
        this.saveMenu(m);
        break;
      }
      if (m.children) {
        for (const c of m.children) {
          if (c.id === menuId) {
            c.isActive = !c.isActive;
            this.saveMenu(c);
            break;
          }
        }
      }
    }
  }

  // Role Permissions
  getRolePermissions(roleId: string): RolePermission[] {
    return this.rolePermissions$.value.filter(rp => rp.roleId === roleId);
  }

  getRolePermissions$() {
    return this.rolePermissions$.asObservable();
  }

  saveRolePermissions(roleId: string, permissions: RolePermission[]): void {
    this.http.put(`${this.API_BASE}/roles/${roleId}/menu-permissions`, permissions).subscribe();

    const existing = this.rolePermissions$.value.filter(rp => rp.roleId !== roleId);
    const updated = [...existing, ...permissions];
    this.rolePermissions$.next(updated);
    this.refreshAuthorizedMenus();
  }

  // User Overrides
  getUserOverrides(userId: string): UserMenuOverride[] {
    return this.userOverrides$.value.filter(uo => uo.userId === userId);
  }

  getUserOverrides$() {
    return this.userOverrides$.asObservable();
  }

  saveUserOverride(override: UserMenuOverride): void {
    this.http.put(`${this.API_BASE}/users/${override.userId}/menu-permissions`, [override]).subscribe();

    const existing = this.userOverrides$.value.filter(
      uo => !(uo.userId === override.userId && uo.menuCode === override.menuCode && uo.action === override.action)
    );
    if (override.override !== 'Inherit') {
      existing.push(override);
    }
    this.userOverrides$.next(existing);
    this.refreshAuthorizedMenus();
  }

  // Entities & Operations
  getSchool(): School { return this.school$.value; }
  getSchool$() { return this.school$.asObservable(); }
  updateSchool(s: School) {
    this.school$.next(s);
    return this.http.put<ApiResponse<School>>(`${this.API_BASE}/School`, {
      name: s.name,
      code: s.code,
      address: s.address,
      contact: s.contact,
      email: s.email,
      website: s.website,
      status: s.status
    });
  }

  getBranches(): Branch[] { return this.branches$.value; }
  getBranches$() { return this.branches$.asObservable(); }

  addBranch(b: { code: string; name: string; address: string; phone: string }) {
    return this.http.post<ApiResponse<Branch>>(`${this.API_BASE}/School/branches`, b);
  }

  updateBranch(id: string, b: { code: string; name: string; address: string; phone: string }) {
    return this.http.put<ApiResponse<Branch>>(`${this.API_BASE}/School/branches/${id}`, b);
  }

  toggleBranch(id: string) {
    return this.http.put<ApiResponse<Branch>>(`${this.API_BASE}/School/branches/${id}/toggle`, {});
  }

  getAcademicYears(): AcademicYear[] { return this.academicYears$.value; }
  getAcademicYears$() { return this.academicYears$.asObservable(); }

  addAcademicYear(ay: { name: string; startDate: string; endDate: string; isCurrent: boolean }) {
    return this.http.post<ApiResponse<AcademicYear>>(`${this.API_BASE}/School/academic-years`, ay);
  }

  toggleAcademicYearLock(id: string) {
    return this.http.put<ApiResponse<AcademicYear>>(`${this.API_BASE}/School/academic-years/${id}/toggle-lock`, {});
  }

  setCurrentAcademicYear(id: string) {
    return this.http.put<ApiResponse<AcademicYear>>(`${this.API_BASE}/School/academic-years/${id}/set-current`, {});
  }

  getRoles(): Role[] { return this.roles$.value; }
  getRoles$() { return this.roles$.asObservable(); }

  getUsers(): User[] { return this.users$.value; }
  getUsers$() { return this.users$.asObservable(); }

  createUser(u: { username: string; fullName: string; email: string; password?: string; roleId: string; roleName?: string; phone?: string }) {
    return this.http.post<ApiResponse<User>>(`${this.API_BASE}/Users`, u);
  }

  updateUser(id: string, u: { fullName: string; email: string; phone?: string; roleId?: string; isActive: boolean }) {
    return this.http.put<ApiResponse<User>>(`${this.API_BASE}/Users/${id}`, u);
  }

  toggleUserStatus(id: string) {
    return this.http.put<ApiResponse<boolean>>(`${this.API_BASE}/Users/${id}/toggle-status`, {});
  }

  resetUserPassword(id: string, newPassword?: string) {
    return this.http.put<ApiResponse<boolean>>(`${this.API_BASE}/Users/${id}/reset-password`, { newPassword: newPassword || 'password123' });
  }

  getClasses(): SchoolClass[] { return this.classes$.value; }
  getClasses$() { return this.classes$.asObservable(); }

  getSections(classId?: string): Section[] {
    if (classId) return this.sections$.value.filter(s => s.classId === classId);
    return this.sections$.value;
  }
  getSections$() { return this.sections$.asObservable(); }

  getSubjects(): Subject[] { return this.subjects$.value; }
  getSubjects$() { return this.subjects$.asObservable(); }

  getTeachers(): Teacher[] { return this.teachers$.value; }
  getTeachers$() { return this.teachers$.asObservable(); }

  getStudents(classId?: string, sectionId?: string): Student[] {
    let list = this.students$.value;
    if (classId) list = list.filter(s => s.classId === classId);
    if (sectionId) list = list.filter(s => s.sectionId === sectionId);
    return list;
  }
  getStudents$() { return this.students$.asObservable(); }

  getStudentById(id: string): Student | undefined {
    return this.students$.value.find(s => s.id === id);
  }

  addStudent(student: Partial<Student>): Student {
    const admissionPayload = {
      fullName: student.fullName,
      banglaName: student.banglaName,
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString() : new Date('2010-01-01').toISOString(),
      gender: student.gender || 'Male',
      bloodGroup: student.bloodGroup || 'A+',
      religion: student.religion || 'Islam',
      email: student.email || `${student.fullName?.toLowerCase().replace(/\s+/g, '')}@student.school.com`,
      phone: student.phone || '+880 1700-000000',
      presentAddress: student.presentAddress || 'Dhaka',
      permanentAddress: student.permanentAddress || 'Bangladesh',
      photoUrl: student.photoUrl,
      guardianName: student.guardianName,
      guardianRelation: student.guardianRelation || 'Father',
      guardianPhone: student.guardianPhone,
      guardianOccupation: student.guardianOccupation,
      guardianIncome: student.guardianIncome,
      classId: student.classId || 'cls-10',
      sectionId: student.sectionId || 'sec-10a'
    };

    // Post to real backend
    this.http.post<ApiResponse<Student>>(`${this.API_BASE}/students/admissions`, admissionPayload).subscribe({
      next: res => {
        if (res && res.success && res.data) {
          const updated = [res.data, ...this.students$.value.filter(s => s.id !== res.data.id)];
          this.students$.next(updated);
        }
      }
    });

    const newStudent: Student = {
      id: 'std-' + (1000 + this.students$.value.length + 1),
      admissionNo: `ADM-2026-${String(this.students$.value.length + 1).padStart(3, '0')}`,
      fullName: student.fullName || '',
      banglaName: student.banglaName || '',
      dateOfBirth: student.dateOfBirth || '2010-01-01',
      gender: student.gender || 'Male',
      bloodGroup: student.bloodGroup || 'A+',
      religion: student.religion || 'Islam',
      email: student.email || '',
      phone: student.phone || '',
      presentAddress: student.presentAddress || '',
      permanentAddress: student.permanentAddress || '',
      photoUrl: student.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      guardianName: student.guardianName || '',
      guardianRelation: student.guardianRelation || 'Father',
      guardianPhone: student.guardianPhone || '',
      guardianOccupation: student.guardianOccupation || '',
      guardianIncome: student.guardianIncome || '',
      academicYearId: 'ay-2026',
      classId: student.classId || 'cls-10',
      className: student.className || 'Class 10',
      sectionId: student.sectionId || 'sec-10a',
      sectionName: student.sectionName || 'Padma (Section A)',
      rollNo: student.rollNo || String(this.students$.value.length + 1).padStart(2, '0'),
      admissionDate: new Date().toISOString().split('T')[0],
      status: 'Active'
    };
    const updated = [newStudent, ...this.students$.value];
    this.students$.next(updated);
    return newStudent;
  }

  updateStudentStatus(studentId: string, status: Student['status'], reason: string): void {
    const list = this.students$.value.map(s => {
      if (s.id === studentId) {
        return { ...s, status };
      }
      return s;
    });
    this.students$.next(list);
  }

  getRoutine(): RoutinePeriod[] { return this.routine$.value; }
  getRoutine$() { return this.routine$.asObservable(); }

  // Attendance
  getAttendance(date: string, classId: string, sectionId: string): AttendanceRecord[] {
    return this.attendance$.value.filter(
      a => a.date === date && a.classId === classId && a.sectionId === sectionId
    );
  }

  saveAttendance(records: AttendanceRecord[]): void {
    if (records.length > 0) {
      const payload = {
        classId: records[0].classId,
        sectionId: records[0].sectionId,
        date: new Date(records[0].date).toISOString(),
        records: records.map(r => ({
          studentId: r.studentId,
          studentName: r.studentName,
          rollNo: r.rollNo,
          status: r.status,
          remark: r.remark
        }))
      };

      this.http.post(`${this.API_BASE}/attendance/students`, payload).subscribe();
    }

    const current = [...this.attendance$.value];
    for (const rec of records) {
      const idx = current.findIndex(a => a.studentId === rec.studentId && a.date === rec.date);
      if (idx > -1) {
        current[idx] = { ...rec, lastUpdated: new Date().toISOString() };
      } else {
        current.push({ ...rec, id: 'att-' + Date.now() + Math.random().toString(36).substring(2, 6) });
      }
    }
    this.attendance$.next(current);
  }

  correctAttendance(recordId: string, newStatus: AttendanceRecord['status'], reason: string): void {
    const records = [...this.attendance$.value];
    const idx = records.findIndex(r => r.id === recordId);
    if (idx > -1) {
      records[idx].status = newStatus;
      records[idx].remark = `Corrected: ${reason}`;
      this.attendance$.next(records);

      this.http.post(`${this.API_BASE}/attendance/correction`, {
        attendanceId: recordId,
        date: new Date(records[idx].date).toISOString(),
        studentName: records[idx].studentName,
        previousStatus: records[idx].status,
        newStatus,
        reason,
        updatedBy: this.currentUser$.value.fullName
      }).subscribe();
    }
  }

  getAttendanceLogs(): AttendanceCorrectionLog[] {
    return this.attendanceLogs$.value;
  }

  // Exams & Marks
  getExams(): Exam[] { return this.exams$.value; }
  getExams$() { return this.exams$.asObservable(); }

  getExamMarks(examId: string, classId: string, subjectId: string): ExamMark[] {
    return this.marks$.value.filter(
      m => m.examId === examId && m.classId === classId && m.subjectId === subjectId
    );
  }

  saveExamMarks(marks: ExamMark[]): void {
    if (marks.length > 0) {
      this.http.post(`${this.API_BASE}/exams/${marks[0].examId}/marks`, {
        examId: marks[0].examId,
        classId: marks[0].classId,
        sectionId: marks[0].sectionId,
        subjectId: marks[0].subjectId,
        marks: marks.map(m => ({ studentId: m.studentId, obtainedMarks: m.obtainedMarks }))
      }).subscribe();
    }

    const current = [...this.marks$.value];
    for (const m of marks) {
      const idx = current.findIndex(c => c.examId === m.examId && c.studentId === m.studentId && c.subjectId === m.subjectId);
      if (idx > -1) {
        current[idx] = m;
      } else {
        current.push({ ...m, id: 'mk-' + Date.now() + Math.random().toString(36).substring(2, 6) });
      }
    }
    this.marks$.next(current);
  }

  getStudentMarksheet(studentId: string, examId: string): StudentMarksheet | null {
    const student = this.getStudentById(studentId) || this.students$.value[0];
    const exam = this.exams$.value.find(e => e.id === examId) || this.exams$.value[0];
    if (!student || !exam) return null;

    let studentMarks = this.marks$.value.filter(m => m.studentId === studentId && m.examId === examId);
    if (studentMarks.length === 0) {
      studentMarks = this.marks$.value.filter(m => m.studentId === 'stu-001');
    }

    const totalMarks = studentMarks.reduce((sum, m) => sum + m.fullMarks, 0);
    const totalObtained = studentMarks.reduce((sum, m) => sum + m.obtainedMarks, 0);
    const totalGP = studentMarks.reduce((sum, m) => sum + m.gradePoint, 0);
    const gpa = studentMarks.length > 0 ? Number((totalGP / studentMarks.length).toFixed(2)) : 5.0;

    return {
      student,
      examName: exam.name,
      academicYear: exam.academicYear,
      marks: studentMarks,
      totalMarks,
      totalObtained,
      gpa,
      letterGrade: gpa >= 5.0 ? 'A+' : gpa >= 4.0 ? 'A' : 'B',
      remarks: 'Outstanding academic excellence and top class honors.',
      positionInClass: 1
    };
  }

  // Fees & Finance
  getFeeTypes(): FeeType[] { return this.feeTypes$.value; }
  getFeeTypes$() { return this.feeTypes$.asObservable(); }

  getFeeStructure(): FeeStructure[] { return this.feeStructure$.value; }
  getFeeStructure$() { return this.feeStructure$.asObservable(); }

  getInvoices(studentId?: string): StudentInvoice[] {
    if (studentId) return this.invoices$.value.filter(i => i.studentId === studentId);
    return this.invoices$.value;
  }
  getInvoices$() { return this.invoices$.asObservable(); }

  collectFeePayment(payment: {
    invoiceId: string;
    studentId: string;
    amountPaid: number;
    paymentMethod: FeePayment['paymentMethod'];
    transactionRef?: string;
    notes?: string;
  }): FeePayment {
    const invoices = [...this.invoices$.value];
    const invoice = invoices.find(i => i.id === payment.invoiceId) || invoices[0];

    const receiptNo = 'RCPT-2026-' + Date.now().toString().slice(-4);
    const newPayment: FeePayment = {
      id: 'pay-' + Date.now(),
      receiptNo,
      invoiceId: payment.invoiceId,
      studentId: payment.studentId,
      studentName: invoice.studentName,
      rollNo: invoice.rollNo,
      className: invoice.className,
      amountPaid: payment.amountPaid,
      paymentMethod: payment.paymentMethod,
      transactionRef: payment.transactionRef,
      paymentDate: new Date().toISOString().split('T')[0],
      collectedBy: this.currentUser$.value.fullName,
      notes: payment.notes
    };

    // Post to real backend
    this.http.post<ApiResponse<FeePayment>>(`${this.API_BASE}/fees/payments`, {
      invoiceId: payment.invoiceId,
      amountPaid: payment.amountPaid,
      paymentMethod: payment.paymentMethod,
      transactionRef: payment.transactionRef,
      notes: payment.notes
    }).subscribe({
      next: res => {
        if (res && res.success && res.data) {
          const payments = [res.data, ...this.payments$.value];
          this.payments$.next(payments);
        }
      }
    });

    invoice.paidAmount += payment.amountPaid;
    invoice.dueAmount = Math.max(0, invoice.netAmount - invoice.paidAmount);
    invoice.status = invoice.dueAmount === 0 ? 'Paid' : 'Partial';

    this.invoices$.next(invoices);
    const payments = [newPayment, ...this.payments$.value];
    this.payments$.next(payments);

    return newPayment;
  }

  getPayments(): FeePayment[] {
    return this.payments$.value;
  }

  // Notices
  getNotices(): Notice[] { return this.notices$.value; }
  getNotices$() { return this.notices$.asObservable(); }

  addNotice(notice: Partial<Notice>): void {
    const payload = {
      title: notice.title || 'Untitled Notice',
      category: notice.category || 'General',
      targetAudience: notice.targetAudience || 'All',
      content: notice.content || '',
      isImportant: !!notice.isImportant,
      author: this.currentUser$.value.fullName
    };

    this.http.post<ApiResponse<Notice>>(`${this.API_BASE}/Notices`, payload).subscribe({
      next: res => {
        if (res?.success && res.data) {
          const updated = [res.data, ...this.notices$.value.filter(n => n.id !== res.data.id)];
          this.notices$.next(updated);
        }
      }
    });

    const newNotice: Notice = {
      id: 'not-' + Date.now(),
      title: notice.title || 'Untitled Notice',
      category: notice.category || 'General',
      targetAudience: notice.targetAudience || 'All',
      publishedDate: new Date().toISOString().split('T')[0],
      content: notice.content || '',
      isImportant: !!notice.isImportant,
      author: this.currentUser$.value.fullName
    };
    const updated = [newNotice, ...this.notices$.value];
    this.notices$.next(updated);
  }

  // Dashboard Aggregates
  getDashboardStats() {
    const students = this.students$.value;
    const teachers = this.teachers$.value;
    const invoices = this.invoices$.value;
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = this.attendance$.value.filter(a => a.date === today);
    const presentCount = todayAttendance.filter(a => a.status === 'Present').length;
    const attendanceRate = todayAttendance.length > 0 ? Math.round((presentCount / todayAttendance.length) * 100) : 96;

    const totalCollected = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
    const totalDue = invoices.reduce((sum, i) => sum + i.dueAmount, 0);

    return {
      totalStudents: students.length,
      activeStudents: students.length,
      totalTeachers: teachers.length,
      attendanceRate: attendanceRate,
      todayPresent: presentCount || students.length,
      todayTotal: todayAttendance.length || students.length,
      monthlyRevenue: totalCollected,
      totalPendingDues: totalDue,
      upcomingExamsCount: this.exams$.value.filter(e => !e.isPublished).length
    };
  }

  resetToDefault() {
    localStorage.removeItem('sms_auth_token');
    location.reload();
  }
}
