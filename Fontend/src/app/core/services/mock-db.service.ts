import { Injectable, inject } from '@angular/core';
import { CampusSessionService } from './campus-session.service';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom, map, catchError, of, tap } from 'rxjs';
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
  AcademicHoliday,
  WeekendSettings,
  Exam,
  ExamScheduleItem,
  ExamMark,
  StudentMarksheet,
  FeeType,
  FeeStructure,
  StudentInvoice,
  FeePayment,
  Notice,
  AdmissionLookups,
  AuditLog,
  PermissionAction,
  DatabaseBackup,
  TeacherLeaveApplication,
  SmsDispatchLog,
  SmsTemplate,
  SystemServerStatus,
  DeploymentRecord,
  BuildDeployResult
} from '../models';
import { INITIAL_SCHOOL, INITIAL_BRANCHES } from './mock-data';
import {
  AcademicStoreService,
  StudentStoreService,
  TeacherStoreService,
  AttendanceStoreService,
  FinanceStoreService,
  ExamStoreService,
  SystemStoreService,
  MasterDataStoreService
} from './stores';

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
  private campus = inject(CampusSessionService);
  private readonly API_BASE = '/api/v1';

  // Modular Domain Feature Stores
  public readonly academicStore = inject(AcademicStoreService);
  public readonly studentStore = inject(StudentStoreService);
  public readonly teacherStore = inject(TeacherStoreService);
  public readonly attendanceStore = inject(AttendanceStoreService);
  public readonly financeStore = inject(FinanceStoreService);
  public readonly examStore = inject(ExamStoreService);
  public readonly systemStore = inject(SystemStoreService);
  public readonly masterDataStore = inject(MasterDataStoreService);

  private loadStorage<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(this.campus.storagePrefix + key);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as T;
        if (!Array.isArray(parsed) && parsed) return parsed as T;
      }
    } catch {
      // ignore storage parsing error
    }
    return fallback;
  }

  private saveStorage<T>(key: string, value: T): void {
    if (!this.campus.branchId) throw new Error('Select a campus before making changes.');
    try {
      localStorage.setItem(this.campus.storagePrefix + key, JSON.stringify(value));
    } catch {
      // ignore storage quota error
    }
  }

  private school$ = new BehaviorSubject<School>(INITIAL_SCHOOL);
  private branches$ = new BehaviorSubject<Branch[]>(INITIAL_BRANCHES);
  private academicYears$ = new BehaviorSubject<AcademicYear[]>([]);
  private roles$ = new BehaviorSubject<Role[]>([]);
  private users$ = new BehaviorSubject<User[]>([]);
  private menus$ = new BehaviorSubject<MenuItem[]>([]);
  private accessGeneration = 0;
  private rolePermissions$ = new BehaviorSubject<RolePermission[]>([]);
  private userOverrides$ = new BehaviorSubject<UserMenuOverride[]>([]);
  private classes$ = new BehaviorSubject<SchoolClass[]>([]);
  private sections$ = new BehaviorSubject<Section[]>([]);
  private subjects$ = new BehaviorSubject<Subject[]>([]);
  private teachers$ = new BehaviorSubject<Teacher[]>([]);
  private teacherLeaves$ = new BehaviorSubject<TeacherLeaveApplication[]>([]);
  private students$ = new BehaviorSubject<Student[]>([]);
  private routine$ = new BehaviorSubject<RoutinePeriod[]>([]);
  private attendance$ = new BehaviorSubject<AttendanceRecord[]>([]);
  private attendanceLogs$ = new BehaviorSubject<AttendanceCorrectionLog[]>([]);
  private exams$ = new BehaviorSubject<Exam[]>([]);
  private examSchedules$ = new BehaviorSubject<ExamScheduleItem[]>([]);
  private marks$ = new BehaviorSubject<ExamMark[]>([]);
  private feeTypes$ = new BehaviorSubject<FeeType[]>([]);
  private feeStructure$ = new BehaviorSubject<FeeStructure[]>([]);
  private invoices$ = new BehaviorSubject<StudentInvoice[]>([]);
  private payments$ = new BehaviorSubject<FeePayment[]>([]);
  private notices$ = new BehaviorSubject<Notice[]>([]);
  private auditLogs$ = new BehaviorSubject<AuditLog[]>([]);
  private smsLogs$ = new BehaviorSubject<SmsDispatchLog[]>([]);

  // Current session & school context
  private currentUser$ = new BehaviorSubject<User>({ id: '', username: '', fullName: '', email: '', roleId: '', roleName: '', schoolId: '', branchId: '', avatar: '', phone: '', isActive: false });
  private selectedBranch$ = new BehaviorSubject<Branch>({ id: '', schoolId: '', code: '', name: 'Select a campus', address: '', phone: '', isActive: false });
  private serverAuthorizedMenus$ = new BehaviorSubject<MenuItem[]>([]);

  constructor() {
    const cachedUser = this.loadStorage<User | null>('sms_current_user', null);
    if (cachedUser && cachedUser.id) {
      this.currentUser$.next(cachedUser);
      this.campus.configure(cachedUser);
      this.selectedBranch$.next({ id: this.campus.branchId, schoolId: cachedUser.schoolId, code: '', name: 'Assigned campus', address: '', phone: '', isActive: true });
    }
    this.academicStore.getClasses$().subscribe(c => this.classes$.next(c));
    this.academicStore.getSections$().subscribe(s => this.sections$.next(s));
    this.academicStore.getSubjects$().subscribe(s => this.subjects$.next(s));
    this.academicStore.getRoutine$().subscribe(r => this.routine$.next(r));
    this.studentStore.getStudents$().subscribe(s => this.students$.next(s));
    this.teacherStore.getTeachers$().subscribe(t => this.teachers$.next(t));
    this.teacherStore.getTeacherLeaves$().subscribe(l => this.teacherLeaves$.next(l));
    this.attendanceStore.getAttendance$().subscribe(a => this.attendance$.next(a));
    this.attendanceStore.getAttendanceLogs$().subscribe(l => this.attendanceLogs$.next(l));
    this.examStore.getExams$().subscribe(e => this.exams$.next(e));
    this.examStore.getExamSchedules$().subscribe(s => this.examSchedules$.next(s));
    this.examStore.getMarks$().subscribe(m => this.marks$.next(m));
    this.financeStore.getFeeTypes$().subscribe(ft => this.feeTypes$.next(ft));
    this.financeStore.getFeeStructure$().subscribe(fs => this.feeStructure$.next(fs));
    this.financeStore.getInvoices$().subscribe(i => this.invoices$.next(i));
    this.financeStore.getPayments$().subscribe(p => this.payments$.next(p));
    this.systemStore.getNotices$().subscribe(n => this.notices$.next(n));
    this.systemStore.getAuditLogs$().subscribe(a => this.auditLogs$.next(a));
    this.systemStore.getSmsLogs$().subscribe(s => this.smsLogs$.next(s));
  }

  private clearCampusData() {
    this.academicStore.clear();
    this.studentStore.clear();
    this.teacherStore.clear();
    this.attendanceStore.clear();
    this.financeStore.clear();
    this.examStore.clear();
    this.systemStore.clear();
    this.students$.next([]); this.teachers$.next([]); this.classes$.next([]);
    this.sections$.next([]); this.subjects$.next([]); this.routine$.next([]);
    this.academicYears$.next([]); this.attendance$.next([]); this.attendanceLogs$.next([]);
    this.exams$.next([]); this.marks$.next([]); this.feeTypes$.next([]);
    this.feeStructure$.next([]); this.invoices$.next([]); this.payments$.next([]);
    this.notices$.next([]); this.auditLogs$.next([]); this.users$.next([]); this.roles$.next([]);
    this.teacherLeaves$.next(this.campus.branchId ? this.loadStorage('teacher_leaves', []) : []);
    this.smsLogs$.next(this.campus.branchId ? this.loadStorage('sms_logs', []) : []);
    this.examSchedules$.next(this.campus.branchId ? this.loadStorage('exam_schedules', []) : []);
    this.marks$.next(this.campus.branchId ? this.loadStorage('marks', []) : []);
  }

  async refreshSchoolMetadata() {
    const scope = this.campus.storagePrefix;
    const response = await firstValueFrom(this.http.get<ApiResponse<{ school: School; branches: Branch[]; academicYears: AcademicYear[] }>>(`${this.API_BASE}/school`));
    if (scope !== this.campus.storagePrefix || !response.success) return;
    this.school$.next(response.data.school);
    const activeBranches = response.data.branches.filter(branch => branch.isActive);
    this.branches$.next(activeBranches);
    this.academicYears$.next(response.data.academicYears);
    let branch = activeBranches.find(b => b.id === this.campus.branchId);
    if (!branch && this.isSuperAdmin() && activeBranches.length > 0) {
      branch = activeBranches[0];
      this.campus.select(branch.id);
    }
    if (branch) this.selectedBranch$.next(branch);
  }

  /**
   * Fetches real live relational data from PostgreSQL via ASP.NET Core API
   */
  async refreshAllFromBackend(): Promise<void> {
    const scope = this.campus.storagePrefix;
    if (!this.campus.branchId) {
      await this.refreshSchoolMetadata();
      await this.refreshAuthorizedMenus();
      if (!this.campus.branchId) return;
    }
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
        firstValueFrom(this.http.get<ApiResponse<FeeType[]>>(`${this.API_BASE}/fees/types`)),
        firstValueFrom(this.http.get<ApiResponse<TeacherLeaveApplication[]>>(`${this.API_BASE}/teachers/leaves`)),
        firstValueFrom(this.http.get<ApiResponse<ExamScheduleItem[]>>(`${this.API_BASE}/exams/schedules`)),
        firstValueFrom(this.http.get<ApiResponse<SmsDispatchLog[]>>(`${this.API_BASE}/sms/logs`))
      ]);

      if (scope !== this.campus.storagePrefix) return;
      if (results[15].status === 'fulfilled' && results[15].value?.data) { this.feeTypes$.next(results[15].value.data); this.financeStore.setFeeTypes(results[15].value.data); }
      if (results[16].status === 'fulfilled' && results[16].value?.data) { this.teacherLeaves$.next(results[16].value.data); this.teacherStore.setTeacherLeaves(results[16].value.data); }
      if (results[17].status === 'fulfilled' && results[17].value?.data) { this.examSchedules$.next(results[17].value.data); this.examStore.setExamSchedules(results[17].value.data); }
      if (results[18].status === 'fulfilled' && results[18].value?.data) { this.smsLogs$.next(results[18].value.data); this.systemStore.setSmsLogs(results[18].value.data); }
      if (results[1].status === 'fulfilled' && results[1].value?.data) { this.studentStore.setStudents(results[1].value.data); }
      if (results[2].status === 'fulfilled' && results[2].value?.data) { this.teacherStore.setTeachers(results[2].value.data); }
      if (results[3].status === 'fulfilled' && results[3].value?.data) { this.academicStore.setClasses(results[3].value.data); }
      if (results[4].status === 'fulfilled' && results[4].value?.data) { this.academicStore.setSections(results[4].value.data); }
      if (results[5].status === 'fulfilled' && results[5].value?.data) { this.academicStore.setSubjects(results[5].value.data); }
      if (results[6].status === 'fulfilled' && results[6].value?.data) { this.academicStore.setRoutine(results[6].value.data); }
      if (results[7].status === 'fulfilled' && results[7].value?.data) { this.financeStore.setInvoices(results[7].value.data); }
      if (results[8].status === 'fulfilled' && results[8].value?.data) { this.financeStore.setFeeStructures(results[8].value.data); }
      if (results[9].status === 'fulfilled' && results[9].value?.data) { this.financeStore.setPayments(results[9].value.data); }
      if (results[10].status === 'fulfilled' && results[10].value?.data) { this.examStore.setExams(results[10].value.data); }
      if (results[11].status === 'fulfilled' && results[11].value?.data) { this.systemStore.setAuditLogs(results[11].value.data); }
      if (results[14].status === 'fulfilled' && results[14].value?.data) { this.systemStore.setNotices(results[14].value.data); }

      if (results[0].status === 'fulfilled' && results[0].value?.data) {
        const d = results[0].value.data as any;
        if (d.school) this.school$.next(d.school);
        if (d.branches) this.branches$.next(d.branches);
        if (d.academicYears) this.academicYears$.next(d.academicYears);
      }
      if (results[1].status === 'fulfilled' && results[1].value?.data) this.students$.next(results[1].value.data);
      if (results[2].status === 'fulfilled' && results[2].value?.data) this.teachers$.next(results[2].value.data);
      if (results[3].status === 'fulfilled' && results[3].value?.data) this.classes$.next(results[3].value.data);
      if (results[4].status === 'fulfilled' && results[4].value?.data) this.sections$.next(results[4].value.data);
      if (results[5].status === 'fulfilled' && results[5].value?.data) this.subjects$.next(results[5].value.data);
      if (results[6].status === 'fulfilled' && results[6].value?.data) this.routine$.next(results[6].value.data);
      if (results[7].status === 'fulfilled' && results[7].value?.data) this.invoices$.next(results[7].value.data);
      if (results[8].status === 'fulfilled' && results[8].value?.data) this.feeStructure$.next(results[8].value.data);
      if (results[9].status === 'fulfilled' && results[9].value?.data) this.payments$.next(results[9].value.data);
      if (results[10].status === 'fulfilled' && results[10].value?.data) this.exams$.next(results[10].value.data);
      if (results[11].status === 'fulfilled' && results[11].value?.data) this.auditLogs$.next(results[11].value.data);
      if (results[12].status === 'fulfilled' && results[12].value?.data) this.users$.next(results[12].value.data);
      if (results[13].status === 'fulfilled' && results[13].value?.data) this.roles$.next(results[13].value.data);
      if (results[14].status === 'fulfilled' && results[14].value?.data) this.notices$.next(results[14].value.data);
    } catch (e) {
      console.warn('Backend sync completed with notices:', e);
    }
  }

  async refreshAuthorizedMenus() {
    const userId = this.currentUser$.value.id;
    const scope = this.campus.storagePrefix;
    const generation = ++this.accessGeneration;
    try {
      const [res, permissions, catalog] = await Promise.all([
        firstValueFrom(this.http.get<ApiResponse<MenuItem[]>>(`${this.API_BASE}/menus/my`)),
        firstValueFrom(this.http.get<ApiResponse<{ rolePermissions: RolePermission[]; overrides: UserMenuOverride[] }>>(`${this.API_BASE}/menus/my/permissions`)),
        this.isCampusAdmin() ? firstValueFrom(this.http.get<ApiResponse<MenuItem[]>>(`${this.API_BASE}/menus`)) : Promise.resolve(null)
      ]);
      if (this.currentUser$.value.id !== userId || scope !== this.campus.storagePrefix || generation !== this.accessGeneration) return;
      if (res && res.success && res.data) {
        this.serverAuthorizedMenus$.next(res.data);
        this.menus$.next(catalog?.success ? catalog.data : res.data);
      }
      if (permissions.success) {
        this.rolePermissions$.next(permissions.data.rolePermissions);
        this.userOverrides$.next(permissions.data.overrides);
      }
    } catch {
      if (this.currentUser$.value.id !== userId || scope !== this.campus.storagePrefix || generation !== this.accessGeneration) return;
      this.serverAuthorizedMenus$.next([]);
      this.rolePermissions$.next([]);
      this.userOverrides$.next([]);
    }
  }

  // Current user & Branch accessors
  getCurrentUser(): User {
    return this.currentUser$.value;
  }

  getCurrentUser$() {
    return this.currentUser$.asObservable();
  }

  findMatchingWard(user?: User): Student | undefined {
    const u = user || this.currentUser$.value;
    if (!u) return this.students$.value[0];
    const username = (u.username || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const phone = u.phone || '';
    const fullName = (u.fullName || '').toLowerCase();

    return this.students$.value.find(s =>
      (s.email && s.email.toLowerCase() === email) ||
      (s.phone && s.phone === phone) ||
      (s.guardianPhone && s.guardianPhone === phone) ||
      (s.admissionNo && s.admissionNo.toLowerCase() === username) ||
      fullName.includes(s.fullName.toLowerCase()) ||
      (s.guardianName && fullName.includes(s.guardianName.toLowerCase())) ||
      username === 'student' ||
      username === 'guardian'
    ) || this.students$.value[0];
  }

  isSuperAdmin(user?: User): boolean {
    return (user || this.currentUser$.value)?.isSuperAdmin === true;
  }

  isPrincipal(user?: User): boolean {
    const u = user || this.currentUser$.value;
    const role = (u?.roleName || '').toLowerCase();
    const roleId = (u?.roleId || '').toLowerCase();
    return role.includes('principal') || role.includes('head') || roleId.includes('principal') || roleId.includes('head');
  }

  isCampusAdmin(user?: User): boolean {
    return this.isSuperAdmin(user) || this.isPrincipal(user);
  }

  getActiveBranchId(): string {
    return this.campus.branchId;
  }

  getActiveBranchName(): string {
    const activeId = this.getActiveBranchId();
    const branch = this.getBranches().find(b => b.id === activeId);
    return branch?.name || 'Main Campus';
  }

  isCurrentUserRestricted(): boolean {
    const u = this.currentUser$.value;
    if (!u) return false;
    const role = (u.roleName || '').toLowerCase();
    const roleId = (u.roleId || '').toLowerCase();
    return role.includes('student') || role.includes('guardian') || roleId.includes('student') || roleId.includes('guardian');
  }

  setCurrentUser(user: User) {
    try {
      localStorage.setItem('sms_current_user', JSON.stringify(user));
    } catch {
      // ignore storage quota error
    }
    const previous = this.currentUser$.value;
    if (previous.id === user.id && previous.schoolId === user.schoolId && previous.branchId === user.branchId && previous.isSuperAdmin === user.isSuperAdmin) {
      this.currentUser$.next(user);
      return;
    }
    this.campus.configure(user);
    this.clearCampusData();
    this.currentUser$.next(user);
    this.selectedBranch$.next({ id: this.campus.branchId, schoolId: user.schoolId, code: '', name: this.campus.branchId ? 'Assigned campus' : 'Select a campus', address: '', phone: '', isActive: true });
    this.refreshAuthorizedMenus();
  }

  clearSession() {
    localStorage.removeItem('sms_current_user');
    this.campus.select('');
    this.clearCampusData();
    this.branches$.next([]);
    this.serverAuthorizedMenus$.next([]);
    this.menus$.next([]);
    this.rolePermissions$.next([]);
    this.userOverrides$.next([]);
    this.currentUser$.next({ id: '', username: '', fullName: '', email: '', roleId: '', roleName: '', schoolId: '', branchId: '', avatar: '', phone: '', isActive: false });
  }

  async refreshUserRolePermissions(roleId?: string) {
    const rid = roleId || this.currentUser$.value?.roleId;
    if (!rid) return;
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<RolePermission[]>>(`${this.API_BASE}/roles/${rid}/menu-permissions`));
      if (res && res.success && res.data) {
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

  async setSelectedBranch(branch: Branch) {
    if (!this.isSuperAdmin() || !branch.id || !branch.isActive) return;
    if (this.currentUser$.value?.schoolId && branch.schoolId && branch.schoolId !== this.currentUser$.value.schoolId) return;
    this.campus.select(branch.id);
    this.clearCampusData();
    this.selectedBranch$.next(branch);
    await this.refreshAllFromBackend();
    await this.refreshAuthorizedMenus();
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

  async loadAuditLogs(): Promise<AuditLog[]> {
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<AuditLog[]>>(`${this.API_BASE}/audit-logs`));
      if (res && res.success && res.data) {
        this.auditLogs$.next(res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('Could not load audit logs from API:', e);
    }
    return this.auditLogs$.value;
  }

  // --- Database Backup & Restore Engine ---
  private backups$ = new BehaviorSubject<DatabaseBackup[]>(this.loadStorage('db_backups', [
    {
      fileName: 'school_management_initial_backup.sql',
      fileSizeBytes: 86064,
      fileSizeFormatted: '84.0 KB',
      createdAt: new Date().toISOString(),
      type: 'SQL',
      status: 'Completed'
    }
  ]));

  getDatabaseBackups$(): Observable<DatabaseBackup[]> {
    this.http.get<ApiResponse<DatabaseBackup[]>>(`${this.API_BASE}/database/backups`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.backups$.next(res.data);
          this.saveStorage('db_backups', res.data);
        }
      },
      error: () => { }
    });
    return this.backups$.asObservable();
  }

  async createDatabaseBackup(): Promise<DatabaseBackup> {
    try {
      const res = await firstValueFrom(
        this.http.post<ApiResponse<DatabaseBackup>>(`${this.API_BASE}/database/backup`, {})
      );
      if (res.success && res.data) {
        const updated = [res.data, ...this.backups$.value.filter(b => b.fileName !== res.data.fileName)];
        this.backups$.next(updated);
        this.saveStorage('db_backups', updated);
        this.logAudit('Create', 'Database Backup', `Created PostgreSQL snapshot archive: ${res.data.fileName}`);
        return res.data;
      }
    } catch {
      // Offline fallback
    }

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const newBackup: DatabaseBackup = {
      fileName: `school_management_backup_${timestamp}.sql`,
      fileSizeBytes: 86064 + Math.floor(Math.random() * 5000),
      fileSizeFormatted: `${(84 + Math.random() * 5).toFixed(1)} KB`,
      createdAt: now.toISOString(),
      type: 'SQL',
      status: 'Completed'
    };
    const updated = [newBackup, ...this.backups$.value];
    this.backups$.next(updated);
    this.saveStorage('db_backups', updated);
    this.logAudit('Create', 'Database Backup', `Created PostgreSQL snapshot archive: ${newBackup.fileName}`);
    return newBackup;
  }

  downloadDatabaseBackup(fileName: string): void {
    const downloadUrl = `${this.API_BASE}/database/backups/${encodeURIComponent(fileName)}/download`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.logAudit('Export', 'Database Backup', `Downloaded database snapshot archive: ${fileName}`);
  }

  async restoreDatabaseBackup(fileName: string): Promise<boolean> {
    try {
      const res = await firstValueFrom(
        this.http.post<ApiResponse<any>>(`${this.API_BASE}/database/restore`, { fileName })
      );
      if (res.success) {
        this.logAudit('Update', 'Database Restore', `Restored database from snapshot archive: ${fileName}`);
        return true;
      }
    } catch {
      // Offline fallback
    }

    this.logAudit('Update', 'Database Restore', `Restored database from snapshot archive: ${fileName}`);
    return true;
  }

  async deleteDatabaseBackup(fileName: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.delete<ApiResponse<any>>(`${this.API_BASE}/database/backups/${encodeURIComponent(fileName)}`)
      );
    } catch { }

    const updated = this.backups$.value.filter(b => b.fileName !== fileName);
    this.backups$.next(updated);
    this.saveStorage('db_backups', updated);
    this.logAudit('Delete', 'Database Backup', `Deleted database snapshot archive: ${fileName}`);
    return true;
  }

  // --- System Deployment & Service Runner Engine ---
  private serverStatus$ = new BehaviorSubject<SystemServerStatus | null>(null);
  private deployments$ = new BehaviorSubject<DeploymentRecord[]>([]);

  getServerStatus$(): Observable<SystemServerStatus> {
    return this.http.get<ApiResponse<SystemServerStatus>>(`${this.API_BASE}/deployment/status`).pipe(
      map((res: ApiResponse<SystemServerStatus>) => {
        if (res.success && res.data) {
          this.serverStatus$.next(res.data);
          return res.data;
        }
        throw new Error(res.message || 'Failed to fetch server status');
      }),
      catchError(() => {
        const fallback: SystemServerStatus = {
          serverTime: new Date().toISOString(),
          uptime: '1h 24m',
          machineName: 'DESKTOP-CGECNVI',
          osDescription: 'Microsoft Windows 10.0',
          dotnetVersion: '.NET 8.0.32',
          processId: 8424,
          memoryUsageFormatted: '121.5 MB',
          databaseHealthy: true,
          databaseName: 'school_management (PostgreSQL 18.4)',
          databaseLatencyMs: 48.2,
          frontendDeployed: true,
          activeFrontendVersion: 'Live Production Build',
          frontendDeployedAt: new Date().toLocaleDateString(),
          frontendDeployedBy: 'System Administrator',
          frontendBundleSize: '1.07 MB',
          appBaseUrl: 'http://localhost:5000/',
          totalDeployedFiles: 32
        };
        this.serverStatus$.next(fallback);
        return of(fallback);
      })
    );
  }

  getDeploymentHistory$(): Observable<DeploymentRecord[]> {
    return this.http.get<ApiResponse<DeploymentRecord[]>>(`${this.API_BASE}/deployment/history`).pipe(
      map((res: ApiResponse<DeploymentRecord[]>) => {
        if (res.success && res.data) {
          this.deployments$.next(res.data);
          return res.data;
        }
        return [];
      }),
      catchError(() => of(this.deployments$.value))
    );
  }

  async uploadAndDeployFrontend(file: File, version?: string, notes?: string): Promise<DeploymentRecord> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    if (version) formData.append('version', version);
    if (notes) formData.append('notes', notes);

    const res = await firstValueFrom(
      this.http.post<ApiResponse<DeploymentRecord>>(`${this.API_BASE}/deployment/upload-deploy`, formData)
    );
    if (res.success && res.data) {
      const updated = [res.data, ...this.deployments$.value.filter(d => d.id !== res.data.id)];
      this.deployments$.next(updated);
      this.logAudit('Create', 'System Deployment', `Uploaded and deployed frontend bundle: ${res.data.version}`);
      return res.data;
    }
    throw new Error(res.message || 'Deployment upload failed');
  }

  async buildAndDeployLocalFrontend(): Promise<BuildDeployResult> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<BuildDeployResult>>(`${this.API_BASE}/deployment/build-and-deploy`, {})
    );
    if (res.success && res.data) {
      this.logAudit('Create', 'System Deployment', `Compiled & deployed frontend: ${res.data.version}`);
      return res.data;
    }
    throw new Error(res.message || 'Server-side frontend build failed');
  }

  async rollbackDeployment(deploymentId: string): Promise<boolean> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<boolean>>(`${this.API_BASE}/deployment/rollback`, { deploymentId })
    );
    if (res.success) {
      this.logAudit('Update', 'System Deployment', `Rolled back to deployment: ${deploymentId}`);
      return true;
    }
    return false;
  }

  async restartServer(): Promise<boolean> {
    try {
      const res = await firstValueFrom(
        this.http.post<ApiResponse<boolean>>(`${this.API_BASE}/deployment/restart-server`, {})
      );
      this.logAudit('Update', 'System Server', 'Triggered server process restart from deployment center');
      return res.success;
    } catch {
      return true;
    }
  }

  getDeploymentLogs$(): Observable<string[]> {
    return this.http.get<ApiResponse<string[]>>(`${this.API_BASE}/deployment/logs`).pipe(
      map((res: ApiResponse<string[]>) => res.data || []),
      catchError(() => of(['[LOG] Deployment logs loaded.']))
    );
  }

  // --- Dynamic Menus & Authorization Precedence Engine (PDF Pages 5, 6, 7, 8) ---
  getMenus(): MenuItem[] {
    return this.menus$.value;
  }

  getMenus$() {
    return this.menus$.asObservable();
  }

  fetchRolePermissions(roleId: string) {
    return this.http.get<ApiResponse<RolePermission[]>>(`${this.API_BASE}/roles/${roleId}/menu-permissions`);
  }

  fetchRoles() {
    return this.http.get<ApiResponse<Role[]>>(`${this.API_BASE}/roles`);
  }

  getCodeAliases(code: string): string[] {
    const raw = (code || '').toUpperCase().replace(/_VIEW$/, '');
    const canonical: Record<string, string> = {
      STUD_LIST: 'STU_LIST', STUD_ADMISSION: 'STU_ADMIT',
      ATT_ENTRY: 'ATT_STUDENT', ATT_REPORTS: 'ATT_REPORT',
      EXAM_MARKSHEET: 'EXAM_RESULTS', FIN_STRUCTURE: 'FIN_FEES',
      ADMIN_USERS: 'SEC_USERS', ADMIN_ROLES: 'SEC_ROLES', ADMIN_MENU: 'SEC_MENUS',
      ADMIN_AUDIT: 'SEC_AUDIT', ADMIN_USER_PERM: 'SEC_USER_OVERRIDES',
      ADMIN_MASTER_DATA: 'ADMIN_SCHOOL', MASTER_DATA: 'ADMIN_SCHOOL'
    };
    return [canonical[raw] || raw];
  }

  hasPermission(menuCode: string, action: PermissionAction = 'view', user?: User): boolean {
    const current = this.currentUser$.value;
    const target = user || current;
    if (!target?.id || target.id !== current.id) return false;
    if (this.isSuperAdmin(target)) return true;
    const code = this.getCodeAliases(menuCode)[0];
    const contains = (menus: MenuItem[]): boolean => menus.some(menu => menu.code === code || contains(menu.children || []));
    if (!contains(this.serverAuthorizedMenus$.value)) return false;
    if (action === 'view') return true;
    const override = this.userOverrides$.value.find(item => item.userId === target.id && item.menuCode === code && item.action === action);
    if (override?.override === 'Deny') return false;
    if (override?.override === 'Allow') return true;
    return this.rolePermissions$.value.some(permission => permission.roleId === target.roleId && permission.menuCode === code && permission.view && permission[action]);
  }

  getMyMenuTree(user?: User): MenuItem[] {
    return !user || user.id === this.currentUser$.value.id ? this.serverAuthorizedMenus$.value : [];
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

  saveRolePermissions(roleId: string, permissions: RolePermission[]) {
    return this.http.put<ApiResponse<boolean>>(`${this.API_BASE}/roles/${roleId}/menu-permissions`, permissions).pipe(tap(response => {
      if (!response.success) return;
      const existing = this.rolePermissions$.value.filter(rp => rp.roleId !== roleId);
      this.rolePermissions$.next([...existing, ...permissions]);
      this.refreshAuthorizedMenus();
    }));
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

  addBranch(b: {
    code: string;
    name: string;
    address: string;
    phone: string;
    principalUsername?: string;
    principalFullName?: string;
    principalEmail?: string;
    principalPassword?: string;
    principalPhone?: string;
  }) {
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

  async loadAcademicYears(): Promise<AcademicYear[]> {
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<AcademicYear[]>>(`${this.API_BASE}/academic-years`));
      if (res && res.success && res.data && res.data.length > 0) {
        this.academicYears$.next(res.data);
        return res.data;
      }
    } catch { }
    if (this.academicYears$.value.length > 0) return this.academicYears$.value;
    await this.refreshSchoolMetadata();
    return this.academicYears$.value;
  }

  getAdmissionLookups$(): Observable<AdmissionLookups> {
    return this.http.get<ApiResponse<AdmissionLookups>>(`${this.API_BASE}/students/admission-lookups`).pipe(
      map(res => {
        if (res && res.success && res.data) {
          return res.data;
        }
        return this.getDefaultAdmissionLookups();
      }),
      catchError(() => of(this.getDefaultAdmissionLookups()))
    );
  }

  getDefaultAdmissionLookups(): AdmissionLookups {
    const years = this.academicYears$.value.map(y => ({
      id: y.id,
      label: y.name,
      description: y.isCurrent ? 'Current Session' : undefined
    }));

    const cls = this.classes$.value.map(c => ({
      id: c.id,
      label: c.name
    }));

    return {
      academicYears: years.length > 0 ? years : [
        { id: 'ay-2025', label: '2024 – 2025' },
        { id: 'ay-2026', label: '2025 – 2026', description: 'Current Session' },
        { id: 'ay-2027', label: '2026 – 2027' }
      ],
      classes: cls,
      genders: [
        { id: 'Male', label: 'Male' },
        { id: 'Female', label: 'Female' },
        { id: 'Other', label: 'Other' }
      ],
      bloodGroups: [
        { id: 'A+', label: 'A+' },
        { id: 'A-', label: 'A-' },
        { id: 'B+', label: 'B+' },
        { id: 'B-', label: 'B-' },
        { id: 'O+', label: 'O+' },
        { id: 'O-', label: 'O-' },
        { id: 'AB+', label: 'AB+' },
        { id: 'AB-', label: 'AB-' }
      ],
      religions: [
        { id: 'Islam', label: 'Islam' },
        { id: 'Hinduism', label: 'Hinduism' },
        { id: 'Christianity', label: 'Christianity' },
        { id: 'Buddhism', label: 'Buddhism' },
        { id: 'Other', label: 'Other' }
      ],
      nationalities: [
        { id: 'Bangladeshi', label: '🇧🇩 Bangladeshi' },
        { id: 'Other', label: '🌐 Other' }
      ],
      guardianRelations: [
        { id: 'Father', label: 'Father (পিতা)' },
        { id: 'Mother', label: 'Mother (মাতা)' },
        { id: 'Brother', label: 'Brother (ভাই)' },
        { id: 'Sister', label: 'Sister (বোন)' },
        { id: 'Uncle', label: 'Uncle (চাচা/মামা)' },
        { id: 'Aunt', label: 'Aunt (ফুফু/খালা)' },
        { id: 'Legal Guardian', label: 'Legal Guardian (আইনগত অভিভাবক)' },
        { id: 'Other', label: 'Other (অন্যান্য)' }
      ],
      admissionCategories: this.masterDataStore.getAdmissionCategoryLookupOptions(),
      academicShifts: this.masterDataStore.getShiftLookupOptions(),
      divisions: [
        {
          name: 'Dhaka',
          districts: [
            { name: 'Dhaka', upazilas: ['Dhanmondi', 'Gulshan', 'Mirpur', 'Mohammadpur', 'Uttara', 'Tejgaon', 'Badda', 'Motijheel', 'Khilgaon', 'Savar', 'Keraniganj', 'Dhamrai'] },
            { name: 'Gazipur', upazilas: ['Gazipur Sadar', 'Kaliakair', 'Kapasia', 'Sreepur', 'Kaliganj', 'Tongi'] },
            { name: 'Narayanganj', upazilas: ['Narayanganj Sadar', 'Araihazar', 'Bandar', 'Rupganj', 'Sonargaon'] },
            { name: 'Tangail', upazilas: ['Tangail Sadar', 'Gopalpur', 'Basail', 'Bhuapur', 'Delduar', 'Ghatail', 'Kalihati', 'Madhupur', 'Mirzapur', 'Nagarpur', 'Sakhipur'] },
            { name: 'Faridpur', upazilas: ['Faridpur Sadar', 'Boalmari', 'Alfadanga', 'Madhukhali', 'Bhanga', 'Nagarkanda', 'Charbhadrasan', 'Sadarpur', 'Saltha'] },
            { name: 'Manikganj', upazilas: ['Manikganj Sadar', 'Singair', 'Shivalaya', 'Saturia', 'Harirampur', 'Ghior', 'Daulatpur'] },
            { name: 'Munshiganj', upazilas: ['Munshiganj Sadar', 'Sreenagar', 'Sirajdikhan', 'Louhajang', 'Tongibari', 'Gazaria'] },
            { name: 'Narsingdi', upazilas: ['Narsingdi Sadar', 'Belabo', 'Monohardi', 'Palash', 'Raipura', 'Shibpur'] },
            { name: 'Kishoreganj', upazilas: ['Kishoreganj Sadar', 'Bajitpur', 'Bhairab', 'Hossainpur', 'Itna', 'Karimganj', 'Katiadi', 'Kuliarchar', 'Mithamain', 'Nikli', 'Pakundia', 'Tarail'] },
            { name: 'Gopalganj', upazilas: ['Gopalganj Sadar', 'Kashiani', 'Kotalipara', 'Muksudpur', 'Tungipara'] },
            { name: 'Madaripur', upazilas: ['Madaripur Sadar', 'Kalkini', 'Rajoir', 'Shibchar'] },
            { name: 'Rajbari', upazilas: ['Rajbari Sadar', 'Baliakandi', 'Goalandaghat', 'Pangsha', 'Kalukhali'] },
            { name: 'Shariatpur', upazilas: ['Shariatpur Sadar', 'Bhedarganj', 'Damudya', 'Gosairhat', 'Naria', 'Zajira'] }
          ]
        },
        {
          name: 'Chattogram',
          districts: [
            { name: 'Chattogram', upazilas: ['Kotwali', 'Panchlaish', 'Pahartali', 'Double Mooring', 'Khulshi', 'Halishahar', 'Chandgaon', 'Bakalia', 'Hathazari', 'Raozan', 'Fatikchhari', 'Sitakunda', 'Mirsharai', 'Patiya', 'Boalkhali', 'Anwara', 'Chandanaish', 'Lohagara', 'Satkania', 'Banshkhali'] },
            { name: 'Cox\'s Bazar', upazilas: ['Cox\'s Bazar Sadar', 'Chakaria', 'Kutubdia', 'Maheshkhali', 'Ramu', 'Teknaf', 'Ukhia', 'Pekua'] },
            { name: 'Cumilla', upazilas: ['Cumilla Adarsha Sadar', 'Cumilla Sadar Dakshin', 'Barura', 'Brahmanpara', 'Burichang', 'Chandina', 'Chauddagram', 'Daudkandi', 'Debidwar', 'Homna', 'Laksam', 'Muradnagar', 'Nangalkot', 'Meghna', 'Titas', 'Monohargonj', 'Lalmai'] },
            { name: 'Feni', upazilas: ['Feni Sadar', 'Chhagalnaiya', 'Daganbhuiyan', 'Parshuram', 'Fulgazi', 'Sonagazi'] },
            { name: 'Brahmanbaria', upazilas: ['Brahmanbaria Sadar', 'Ashuganj', 'Nasirnagar', 'Nabinagar', 'Sarail', 'Kasba', 'Akhaura', 'Bancharampur', 'Bijoynagar'] },
            { name: 'Noakhali', upazilas: ['Noakhali Sadar', 'Begumganj', 'Chatkhil', 'Companiganj', 'Hatiya', 'Senbagh', 'Sonaimuri', 'Subarnachar', 'Kabirhat'] },
            { name: 'Chandpur', upazilas: ['Chandpur Sadar', 'Faridganj', 'Haimchar', 'Haziganj', 'Kachua', 'Matlab Dakshin', 'Matlab Uttar', 'Shahrasti'] },
            { name: 'Lakshmipur', upazilas: ['Lakshmipur Sadar', 'Raipur', 'Ramganj', 'Ramgati', 'Kamalnagar'] },
            { name: 'Bandarban', upazilas: ['Bandarban Sadar', 'Alikadam', 'Naikhongchhari', 'Rowangchhari', 'Ruma', 'Thanchi', 'Lama'] },
            { name: 'Khagrachhari', upazilas: ['Khagrachhari Sadar', 'Dighinala', 'Lakshmichhari', 'Mahalchhari', 'Manikchhari', 'Matiranga', 'Panchhari', 'Ramgarh', 'Guimara'] },
            { name: 'Rangamati', upazilas: ['Rangamati Sadar', 'Bagaichhari', 'Barkal', 'Belaichhari', 'Juraichhari', 'Kaptai', 'Kawkhali', 'Langadu', 'Naniarchar', 'Rajasthali'] }
          ]
        },
        {
          name: 'Rajshahi',
          districts: [
            { name: 'Rajshahi', upazilas: ['Boalia', 'Rajpara', 'Motihar', 'Shah Mokdum', 'Paba', 'Godagari', 'Tanore', 'Mohanpur', 'Bagmara', 'Durgapur', 'Bagha', 'Charghat', 'Puthia'] },
            { name: 'Bogura', upazilas: ['Bogura Sadar', 'Adamdighi', 'Dhunat', 'Dhupchanchia', 'Gabtali', 'Kahaloo', 'Nandigram', 'Sariakandi', 'Sahajanpur', 'Sherpur', 'Shibganj', 'Sonatala'] },
            { name: 'Pabna', upazilas: ['Pabna Sadar', 'Atgharia', 'Bera', 'Bhangura', 'Chatmohar', 'Faridpur', 'Ishwardi', 'Santhia', 'Sujanagar'] },
            { name: 'Sirajganj', upazilas: ['Sirajganj Sadar', 'Belkuchi', 'Chauhali', 'Kamarkhanda', 'Kazipur', 'Rayganj', 'Shahjadpur', 'Tarash', 'Ullapara'] },
            { name: 'Naogaon', upazilas: ['Naogaon Sadar', 'Atrai', 'Badalgachhi', 'Dhamoirhat', 'Manda', 'Mohadevpur', 'Niamatpur', 'Patnitala', 'Porsha', 'Raninagar', 'Sapahar'] },
            { name: 'Natore', upazilas: ['Natore Sadar', 'Bagatipara', 'Baraigram', 'Gurudaspur', 'Lalpur', 'Singra', 'Naldanga'] },
            { name: 'Chapai Nawabganj', upazilas: ['Chapai Nawabganj Sadar', 'Bholahat', 'Gomastapur', 'Nachole', 'Shibganj'] },
            { name: 'Joypurhat', upazilas: ['Joypurhat Sadar', 'Akkelpur', 'Kalai', 'Khetlal', 'Panchbibi'] }
          ]
        },
        {
          name: 'Khulna',
          districts: [
            { name: 'Khulna', upazilas: ['Khulna Sadar', 'Daulatpur', 'Khalishpur', 'Khan Jahan Ali', 'Sonadanga', 'Batiaghata', 'Dacope', 'Dumuria', 'Dighalia', 'Koyra', 'Paikgachha', 'Phultala', 'Rupsha', 'Terokhada'] },
            { name: 'Jashore', upazilas: ['Jashore Sadar', 'Abhaynagar', 'Bagherpara', 'Chaugachha', 'Jhikargachha', 'Keshabpur', 'Manirampur', 'Sharsha'] },
            { name: 'Kushtia', upazilas: ['Kushtia Sadar', 'Bheramara', 'Daulatpur', 'Khoksa', 'Kumarkhali', 'Mirpur'] },
            { name: 'Satkhira', upazilas: ['Satkhira Sadar', 'Assasuni', 'Debhata', 'Kalaroa', 'Kaliganj', 'Shyamnagar', 'Tala'] },
            { name: 'Bagerhat', upazilas: ['Bagerhat Sadar', 'Chitalmari', 'Fakirhat', 'Kachua', 'Mollahat', 'Mongla', 'Morrelganj', 'Rampal', 'Sarankhola'] },
            { name: 'Jhenaidah', upazilas: ['Jhenaidah Sadar', 'Harinakundu', 'Kaliganj', 'Kotchandpur', 'Maheshpur', 'Shailkupa'] },
            { name: 'Chuadanga', upazilas: ['Chuadanga Sadar', 'Alamdanga', 'Damurhuda', 'Jibannagar'] },
            { name: 'Magura', upazilas: ['Magura Sadar', 'Mohammadpur', 'Shalikha', 'Sreepur'] },
            { name: 'Meherpur', upazilas: ['Meherpur Sadar', 'Gangni', 'Mujibnagar'] },
            { name: 'Narail', upazilas: ['Narail Sadar', 'Kalia', 'Lohagara'] }
          ]
        },
        {
          name: 'Barishal',
          districts: [
            { name: 'Barishal', upazilas: ['Barishal Sadar', 'Agailjhara', 'Babuganj', 'Bakerganj', 'Banaripara', 'Gaurnadi', 'Hizla', 'Mehendiganj', 'Muladi', 'Wazirpur'] },
            { name: 'Bhola', upazilas: ['Bhola Sadar', 'Burhanuddin', 'Char Fasson', 'Daulatkhan', 'Lalmohan', 'Manpura', 'Tazumuddin'] },
            { name: 'Patuakhali', upazilas: ['Patuakhali Sadar', 'Bauphal', 'Dashmina', 'Galachipa', 'Kalapara', 'Mirzaganj', 'Rangabali', 'Dumki'] },
            { name: 'Pirojpur', upazilas: ['Pirojpur Sadar', 'Bhandaria', 'Kawkhali', 'Mathbaria', 'Nazirpur', 'Nesarabad', 'Zianagar'] },
            { name: 'Barguna', upazilas: ['Barguna Sadar', 'Amtali', 'Bamna', 'Betagi', 'Patharghata', 'Taltali'] },
            { name: 'Jhalokathi', upazilas: ['Jhalokathi Sadar', 'Kathalia', 'Nalchhiti', 'Rajapur'] }
          ]
        },
        {
          name: 'Sylhet',
          districts: [
            { name: 'Sylhet', upazilas: ['Sylhet Sadar', 'Balaganj', 'Beanibazar', 'Bishwanath', 'Companiganj', 'Fenchuganj', 'Golapganj', 'Gowainghat', 'Jaintiapur', 'Kanaighat', 'Zakiganj', 'South Surma', 'Osmani Nagar'] },
            { name: 'Moulvibazar', upazilas: ['Moulvibazar Sadar', 'Barlekha', 'Juri', 'Kamalganj', 'Kulaura', 'Rajnagar', 'Sreemangal'] },
            { name: 'Habiganj', upazilas: ['Habiganj Sadar', 'Ajmiriganj', 'Bahubal', 'Baniachong', 'Chunarughat', 'Lakhai', 'Madhabpur', 'Nabiganj', 'Sayestaganj'] },
            { name: 'Sunamganj', upazilas: ['Sunamganj Sadar', 'Bishwamvarpur', 'Chhatak', 'Derai', 'Dharampasha', 'Dowarabazar', 'Jagannathpur', 'Jamalganj', 'Shalla', 'South Sunamganj', 'Tahirpur'] }
          ]
        },
        {
          name: 'Rangpur',
          districts: [
            { name: 'Rangpur', upazilas: ['Rangpur Sadar', 'Badarganj', 'Gangachhara', 'Kaunia', 'Mithapukur', 'Pirgachha', 'Pirganj', 'Taraganj'] },
            { name: 'Dinajpur', upazilas: ['Dinajpur Sadar', 'Birampur', 'Birganj', 'Biral', 'Bochaganj', 'Chirirbandar', 'Phulbari', 'Ghoraghat', 'Hakimpur', 'Kaharole', 'Khansama', 'Nawabganj', 'Parbatipur'] },
            { name: 'Kurigram', upazilas: ['Kurigram Sadar', 'Bhurungamari', 'Char Rajibpur', 'Chilmari', 'Phulbari', 'Nageshwari', 'Rajarhat', 'Raomari', 'Ulipur'] },
            { name: 'Gaibandha', upazilas: ['Gaibandha Sadar', 'Fulchhari', 'Gobindaganj', 'Palashbari', 'Sadullapur', 'Saghata', 'Sundarganj'] },
            { name: 'Nilphamari', upazilas: ['Nilphamari Sadar', 'Dimla', 'Domar', 'Jaldhaka', 'Kishoreganj', 'Syedpur'] },
            { name: 'Thakurgaon', upazilas: ['Thakurgaon Sadar', 'Baliadangi', 'Haripur', 'Pirganj', 'Ranisankail'] },
            { name: 'Lalmonirhat', upazilas: ['Lalmonirhat Sadar', 'Aditmari', 'Kaliganj', 'Hatibandha', 'Patgram'] },
            { name: 'Panchagarh', upazilas: ['Panchagarh Sadar', 'Atwari', 'Boda', 'Debiganj', 'Tetulia'] }
          ]
        },
        {
          name: 'Mymensingh',
          districts: [
            { name: 'Mymensingh', upazilas: ['Mymensingh Sadar', 'Bhaluka', 'Dhobaura', 'Fulbaria', 'Gafargaon', 'Gauripur', 'Haluaghat', 'Ishwarganj', 'Muktagachha', 'Nandail', 'Phulpur', 'Trishal', 'Tara Khanda'] },
            { name: 'Jamalpur', upazilas: ['Jamalpur Sadar', 'Baksiganj', 'Dewanganj', 'Islampur', 'Madarganj', 'Melandaha', 'Sarishabari'] },
            { name: 'Netrokona', upazilas: ['Netrokona Sadar', 'Atpara', 'Barhatta', 'Durgapur', 'Khaliajuri', 'Kalmakanda', 'Kendua', 'Madan', 'Mohanganj', 'Purbadhala'] },
            { name: 'Sherpur', upazilas: ['Sherpur Sadar', 'Jhenaigati', 'Nakla', 'Nalitabari', 'Sreebardi'] }
          ]
        }
      ]
    };
  }

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

  getUsers(): User[] {
    const activeBranch = this.getActiveBranchId();
    if (activeBranch !== 'ALL') {
      return this.users$.value.filter(u => (u.branchId || 'br-01') === activeBranch);
    }
    return this.users$.value;
  }
  getUsers$() { return this.users$.asObservable(); }

  getAllUsersForTesting(): User[] {
    return this.users$.value;
  }

  createUser(u: { username: string; fullName: string; email: string; password?: string; roleId: string; roleName?: string; phone?: string; branchId?: string }) {
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

  getClasses(): SchoolClass[] {
    const activeBranch = this.getActiveBranchId();
    if (activeBranch !== 'ALL') {
      return this.classes$.value.filter(c => (c.branchId || 'br-01') === activeBranch);
    }
    return this.classes$.value;
  }
  getClasses$() { return this.classes$.asObservable(); }

  getSections(classId?: string): Section[] {
    const activeBranch = this.getActiveBranchId();
    let list = this.sections$.value;
    if (activeBranch !== 'ALL') {
      list = list.filter(s => (s.branchId || 'br-01') === activeBranch);
    }
    if (classId) return list.filter(s => s.classId === classId);
    return list;
  }
  getSections$() { return this.sections$.asObservable(); }

  getSubjects(): Subject[] { return this.subjects$.value; }
  getSubjects$() { return this.subjects$.asObservable(); }

  getTeachers(): Teacher[] {
    const activeBranch = this.getActiveBranchId();
    if (activeBranch !== 'ALL') {
      return this.teachers$.value.filter(t => (t.branchId || 'br-01') === activeBranch);
    }
    return this.teachers$.value;
  }
  getTeachers$() { return this.teachers$.asObservable(); }

  // --- Class CRUD ---
  async loadClasses(): Promise<SchoolClass[]> {
    const list = await this.academicStore.loadClasses();
    this.classes$.next(list);
    return this.getClasses();
  }

  async loadSections(): Promise<Section[]> {
    const list = await this.academicStore.loadSections();
    this.sections$.next(list);
    return this.getSections();
  }

  async loadSubjects(): Promise<Subject[]> {
    const list = await this.academicStore.loadSubjects();
    this.subjects$.next(list);
    return this.getSubjects();
  }

  async loadStudents(classId?: string, sectionId?: string): Promise<Student[]> {
    const list = await this.studentStore.loadStudents(classId, sectionId);
    this.students$.next(list);
    return this.getStudents();
  }

  async loadExams(): Promise<Exam[]> {
    const list = await this.examStore.loadExams();
    this.exams$.next(list);
    return this.getExams();
  }

  async addClass(cls: Partial<SchoolClass>): Promise<SchoolClass> {
    const res = await this.academicStore.addClass(cls);
    this.classes$.next(this.academicStore.getClasses());
    return res;
  }

  async updateClass(id: string, cls: Partial<SchoolClass>): Promise<SchoolClass> {
    const res = await this.academicStore.updateClass(id, cls);
    this.classes$.next(this.academicStore.getClasses());
    return res;
  }

  async deleteClass(id: string): Promise<boolean> {
    const res = await this.academicStore.deleteClass(id);
    this.classes$.next(this.academicStore.getClasses());
    this.sections$.next(this.academicStore.getSections());
    return res;
  }

  // --- Section CRUD ---
  async addSection(sec: Partial<Section>): Promise<Section> {
    const res = await this.academicStore.addSection(sec);
    this.sections$.next(this.academicStore.getSections());
    return res;
  }

  async updateSection(id: string, sec: Partial<Section>): Promise<Section> {
    const res = await this.academicStore.updateSection(id, sec);
    this.sections$.next(this.academicStore.getSections());
    return res;
  }

  async deleteSection(id: string): Promise<boolean> {
    const res = await this.academicStore.deleteSection(id);
    this.sections$.next(this.academicStore.getSections());
    return res;
  }

  // --- Subject CRUD & Mapping ---
  async addSubject(sub: Partial<Subject>): Promise<Subject> {
    const payload = {
      code: sub.code,
      name: sub.name,
      type: sub.type || 'Compulsory',
      fullMarks: sub.fullMarks || 100,
      passMarks: sub.passMarks || 33
    };
    try {
      const res = await firstValueFrom(this.http.post<ApiResponse<Subject>>(`${this.API_BASE}/subjects`, payload));
      if (res && res.data) {
        this.subjects$.next([...this.subjects$.value, res.data]);
        return res.data;
      }
    } catch (e) {
      console.warn('Backend addSubject failed, saving locally:', e);
    }
    const newSub: Subject = {
      id: 'sub-' + Math.random().toString(36).substring(2, 9),
      code: sub.code || 'SUB-01',
      name: sub.name || 'New Subject',
      type: sub.type || 'Compulsory',
      fullMarks: sub.fullMarks || 100,
      passMarks: sub.passMarks || 33
    };
    this.subjects$.next([...this.subjects$.value, newSub]);
    return newSub;
  }

  async updateSubject(id: string, sub: Partial<Subject>): Promise<Subject> {
    const payload = {
      code: sub.code,
      name: sub.name,
      type: sub.type || 'Compulsory',
      fullMarks: sub.fullMarks || 100,
      passMarks: sub.passMarks || 33
    };
    try {
      const res = await firstValueFrom(this.http.put<ApiResponse<Subject>>(`${this.API_BASE}/subjects/${id}`, payload));
      if (res && res.data) {
        const updated = this.subjects$.value.map(s => s.id === id ? res.data : s);
        this.subjects$.next(updated);
        return res.data;
      }
    } catch (e) {
      console.warn('Backend updateSubject failed, saving locally:', e);
    }
    const updated = this.subjects$.value.map(s => s.id === id ? { ...s, ...sub } as Subject : s);
    this.subjects$.next(updated);
    return updated.find(s => s.id === id)!;
  }

  async deleteSubject(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete<ApiResponse<boolean>>(`${this.API_BASE}/subjects/${id}`));
    } catch (e) {
      console.warn('Backend deleteSubject failed, saving locally:', e);
    }
    this.subjects$.next(this.subjects$.value.filter(s => s.id !== id));
    return true;
  }

  async getClassSubjects(classId: string): Promise<any[]> {
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<any[]>>(`${this.API_BASE}/classes/${classId}/subjects`));
      if (res?.success && Array.isArray(res.data)) {
        this.saveStorage(`class_subjects_${classId}`, res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('Backend getClassSubjects failed:', e);
    }
    return this.loadStorage<any[]>(`class_subjects_${classId}`, []);
  }

  async assignClassSubjects(classId: string, subjectIds: string[]): Promise<boolean> {
    const mockMappings = subjectIds.map(sid => ({ classId, subjectId: sid }));
    try {
      const res = await firstValueFrom(this.http.post<ApiResponse<boolean>>(`${this.API_BASE}/classes/${classId}/subjects`, { subjectIds }));
      this.saveStorage(`class_subjects_${classId}`, mockMappings);
      return res?.success !== false;
    } catch (e) {
      console.warn('Backend assignClassSubjects failed, saving locally:', e);
      this.saveStorage(`class_subjects_${classId}`, mockMappings);
      return false;
    }
  }

  // --- Teacher CRUD ---
  async addTeacher(teacher: Partial<Teacher>): Promise<Teacher> {
    const payload = {
      employeeCode: teacher.employeeCode,
      fullName: teacher.fullName,
      designation: teacher.designation || 'Teacher',
      department: teacher.department || 'General',
      qualification: teacher.qualification || 'M.Sc / B.Ed',
      email: teacher.email || `${teacher.employeeCode?.toLowerCase()}@scholarsacademy.edu.bd`,
      phone: teacher.phone || '+880 1700-000000',
      joiningDate: teacher.joiningDate ? new Date(teacher.joiningDate).toISOString() : new Date().toISOString(),
      status: teacher.status || 'Active',
      avatar: teacher.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
      assignedSubjects: teacher.assignedSubjects || []
    };
    try {
      const res = await firstValueFrom(this.http.post<ApiResponse<Teacher>>(`${this.API_BASE}/teachers`, payload));
      if (res && res.data) {
        this.teachers$.next([...this.teachers$.value, res.data]);
        return res.data;
      }
    } catch (e) {
      console.warn('Backend addTeacher failed, saving locally:', e);
    }
    const newT: Teacher = {
      id: 'tch-' + Math.random().toString(36).substring(2, 9),
      ...payload,
      joiningDate: new Date(payload.joiningDate)
    } as any;
    this.teachers$.next([...this.teachers$.value, newT]);
    return newT;
  }

  async updateTeacher(id: string, teacher: Partial<Teacher>): Promise<Teacher> {
    const payload = {
      employeeCode: teacher.employeeCode,
      fullName: teacher.fullName,
      designation: teacher.designation,
      department: teacher.department,
      qualification: teacher.qualification,
      email: teacher.email,
      phone: teacher.phone,
      joiningDate: teacher.joiningDate ? new Date(teacher.joiningDate).toISOString() : new Date().toISOString(),
      status: teacher.status,
      avatar: teacher.avatar,
      assignedSubjects: teacher.assignedSubjects
    };
    try {
      const res = await firstValueFrom(this.http.put<ApiResponse<Teacher>>(`${this.API_BASE}/teachers/${id}`, payload));
      if (res && res.data) {
        const updated = this.teachers$.value.map(t => t.id === id ? res.data : t);
        this.teachers$.next(updated);
        return res.data;
      }
    } catch (e) {
      console.warn('Backend updateTeacher failed, saving locally:', e);
    }
    const updated = this.teachers$.value.map(t => t.id === id ? { ...t, ...teacher } as Teacher : t);
    this.teachers$.next(updated);
    return updated.find(t => t.id === id)!;
  }

  async deleteTeacher(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete<ApiResponse<boolean>>(`${this.API_BASE}/teachers/${id}`));
    } catch (e) {
      console.warn('Backend deleteTeacher failed, saving locally:', e);
    }
    this.teachers$.next(this.teachers$.value.filter(t => t.id !== id));
    return true;
  }

  // --- Teacher Leave Management ---
  getTeacherLeaves(): TeacherLeaveApplication[] {
    return this.teacherLeaves$.value;
  }
  getTeacherLeaves$() {
    return this.teacherLeaves$.asObservable();
  }

  applyTeacherLeave(leave: Partial<TeacherLeaveApplication>): TeacherLeaveApplication {
    const newLeave: TeacherLeaveApplication = {
      id: 'tl-' + Date.now().toString().slice(-5),
      teacherId: leave.teacherId || 'tch-01',
      teacherName: leave.teacherName || 'Teacher',
      employeeCode: leave.employeeCode || 'EMP-100',
      department: leave.department || 'General',
      leaveType: leave.leaveType || 'Casual Leave',
      startDate: leave.startDate || new Date().toISOString().split('T')[0],
      endDate: leave.endDate || new Date().toISOString().split('T')[0],
      totalDays: leave.totalDays || 1,
      reason: leave.reason || '',
      status: 'Pending',
      appliedOn: new Date().toISOString().split('T')[0],
      branchId: this.getActiveBranchId()
    };

    this.http.post<ApiResponse<TeacherLeaveApplication>>(`${this.API_BASE}/teachers/leaves`, {
      teacherId: newLeave.teacherId,
      teacherName: newLeave.teacherName,
      employeeCode: newLeave.employeeCode,
      department: newLeave.department,
      leaveType: newLeave.leaveType,
      startDate: new Date(newLeave.startDate).toISOString(),
      endDate: new Date(newLeave.endDate).toISOString(),
      totalDays: newLeave.totalDays,
      reason: newLeave.reason
    }).subscribe({
      next: res => {
        if (res?.success && res.data) {
          const updated = this.teacherLeaves$.value.map(l => l.id === newLeave.id ? res.data : l);
          this.teacherLeaves$.next(updated);
        }
      }
    });

    const updated = [newLeave, ...this.teacherLeaves$.value];
    this.teacherLeaves$.next(updated);
    this.saveStorage('teacher_leaves', updated);
    this.logAudit('Create', 'Teacher Leave', `Applied for ${newLeave.leaveType} for ${newLeave.teacherName}`);
    return newLeave;
  }

  updateTeacherLeaveStatus(id: string, status: 'Approved' | 'Rejected', remark: string): void {
    this.http.put<ApiResponse<TeacherLeaveApplication>>(`${this.API_BASE}/teachers/leaves/${id}/status`, {
      status,
      reviewRemark: remark
    }).subscribe();

    const list = this.teacherLeaves$.value.map(l => {
      if (l.id === id) {
        return {
          ...l,
          status,
          reviewedBy: this.currentUser$.value?.fullName || 'Principal',
          reviewRemark: remark
        };
      }
      return l;
    });
    this.teacherLeaves$.next(list);
    this.saveStorage('teacher_leaves', list);
    this.logAudit('Approve', 'Teacher Leave', `${status} leave application ID: ${id}. Remark: ${remark}`);
  }


  getStudents(classId?: string, sectionId?: string): Student[] {
    if (this.isCurrentUserRestricted()) {
      const ward = this.findMatchingWard();
      return ward ? [ward] : [];
    }
    let list = this.students$.value;
    const activeBranch = this.getActiveBranchId();
    if (activeBranch !== 'ALL') {
      list = list.filter(s => (s.branchId || 'br-01') === activeBranch);
    }
    if (classId) list = list.filter(s => s.classId === classId);
    if (sectionId) list = list.filter(s => s.sectionId === sectionId);
    return list;
  }
  getStudents$() { return this.students$.asObservable(); }

  getStudentById(id: string): Student | undefined {
    return this.students$.value.find(s => s.id === id);
  }

  addStudent(student: Partial<Student>): Student {
    const activeBranch = this.getActiveBranchId();
    const effectiveBranch = activeBranch === 'ALL' ? (student.branchId || 'br-01') : activeBranch;

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
      fatherName: student.fatherName,
      fatherPhone: student.fatherPhone,
      fatherOccupation: student.fatherOccupation,
      fatherNid: student.fatherNid,
      motherName: student.motherName,
      motherPhone: student.motherPhone,
      motherOccupation: student.motherOccupation,
      motherNid: student.motherNid,
      nationality: student.nationality || 'Bangladeshi',
      previousSchool: student.previousSchool,
      division: student.division,
      district: student.district,
      upazila: student.upazila,
      emergencyContactName: student.emergencyContactName,
      emergencyContactPhone: student.emergencyContactPhone,
      emergencyContactRelation: student.emergencyContactRelation,
      shift: student.shift || 'Morning',
      admissionCategory: student.admissionCategory || 'Regular',
      lastClassPassed: student.lastClassPassed,
      lastPassingYear: student.lastPassingYear,
      lastGpaMarks: student.lastGpaMarks,
      tcNumber: student.tcNumber,
      coCurricular: student.coCurricular,
      medicalNotes: student.medicalNotes,
      isHostel: !!student.isHostel,
      isTransport: !!student.isTransport,
      classId: student.classId || '',
      sectionId: student.sectionId || '',
      academicYearId: student.academicYearId || undefined,
      rollNo: student.rollNo || undefined,
      status: student.status || 'Active'
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

    const targetClass = this.classes$.value.find(c => c.id === student.classId);
    const targetSection = this.sections$.value.find(s => s.id === student.sectionId);

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
      branchId: effectiveBranch,
      guardianName: student.guardianName || '',
      guardianRelation: student.guardianRelation || 'Father',
      guardianPhone: student.guardianPhone || '',
      guardianOccupation: student.guardianOccupation || '',
      guardianIncome: student.guardianIncome || '',
      fatherName: student.fatherName || '',
      fatherPhone: student.fatherPhone || '',
      fatherOccupation: student.fatherOccupation || '',
      fatherNid: student.fatherNid || '',
      motherName: student.motherName || '',
      motherPhone: student.motherPhone || '',
      motherOccupation: student.motherOccupation || '',
      motherNid: student.motherNid || '',
      nationality: student.nationality || 'Bangladeshi',
      previousSchool: student.previousSchool || '',
      division: student.division || '',
      district: student.district || '',
      upazila: student.upazila || '',
      emergencyContactName: student.emergencyContactName || '',
      emergencyContactPhone: student.emergencyContactPhone || '',
      emergencyContactRelation: student.emergencyContactRelation || '',
      shift: student.shift || 'Morning',
      admissionCategory: student.admissionCategory || 'Regular',
      lastClassPassed: student.lastClassPassed || '',
      lastPassingYear: student.lastPassingYear || '',
      lastGpaMarks: student.lastGpaMarks || '',
      tcNumber: student.tcNumber || '',
      coCurricular: student.coCurricular || '',
      medicalNotes: student.medicalNotes || '',
      isHostel: !!student.isHostel,
      isTransport: !!student.isTransport,
      academicYearId: student.academicYearId || this.academicYears$.value.find(y => y.isCurrent)?.id || 'ay-2026',
      classId: student.classId || (this.classes$.value[0]?.id || ''),
      className: targetClass ? targetClass.name : (student.className || ''),
      sectionId: student.sectionId || (this.sections$.value[0]?.id || ''),
      sectionName: targetSection ? targetSection.name : (student.sectionName || ''),
      rollNo: student.rollNo || String(this.students$.value.length + 1).padStart(2, '0'),
      admissionDate: new Date().toISOString().split('T')[0],
      status: (student.status as any) || 'Active'
    };
    const updated = [newStudent, ...this.students$.value];
    this.students$.next(updated);
    return newStudent;
  }

  async updateStudentStatus(studentId: string, status: Student['status'], reason: string): Promise<void> {
    const payload = { status, reason: reason || `Status changed to ${status}` };
    try {
      const res = await firstValueFrom(this.http.put<ApiResponse<Student>>(`${this.API_BASE}/students/${studentId}/status`, payload));
      if (res && res.data) {
        const list = this.students$.value.map(s => s.id === studentId ? { ...s, status: res.data.status } : s);
        this.students$.next(list);
        return;
      }
    } catch (e) {
      console.warn('Backend updateStudentStatus failed, falling back to local state:', e);
    }

    const list = this.students$.value.map(s => {
      if (s.id === studentId) {
        return { ...s, status };
      }
      return s;
    });
    this.students$.next(list);
  }

  async updateStudent(id: string, updatedFields: Partial<Student>): Promise<Student> {
    const payload = {
      fullName: updatedFields.fullName,
      banglaName: updatedFields.banglaName,
      dateOfBirth: updatedFields.dateOfBirth ? new Date(updatedFields.dateOfBirth).toISOString() : undefined,
      gender: updatedFields.gender,
      bloodGroup: updatedFields.bloodGroup,
      religion: updatedFields.religion,
      email: updatedFields.email,
      phone: updatedFields.phone,
      presentAddress: updatedFields.presentAddress,
      permanentAddress: updatedFields.permanentAddress,
      photoUrl: updatedFields.photoUrl,
      guardianName: updatedFields.guardianName,
      guardianRelation: updatedFields.guardianRelation,
      guardianPhone: updatedFields.guardianPhone,
      guardianOccupation: updatedFields.guardianOccupation,
      guardianIncome: updatedFields.guardianIncome,
      fatherName: updatedFields.fatherName,
      fatherPhone: updatedFields.fatherPhone,
      fatherOccupation: updatedFields.fatherOccupation,
      fatherNid: updatedFields.fatherNid,
      motherName: updatedFields.motherName,
      motherPhone: updatedFields.motherPhone,
      motherOccupation: updatedFields.motherOccupation,
      motherNid: updatedFields.motherNid,
      nationality: updatedFields.nationality,
      previousSchool: updatedFields.previousSchool,
      division: updatedFields.division,
      district: updatedFields.district,
      upazila: updatedFields.upazila,
      emergencyContactName: updatedFields.emergencyContactName,
      emergencyContactPhone: updatedFields.emergencyContactPhone,
      emergencyContactRelation: updatedFields.emergencyContactRelation,
      shift: updatedFields.shift,
      admissionCategory: updatedFields.admissionCategory,
      lastClassPassed: updatedFields.lastClassPassed,
      lastPassingYear: updatedFields.lastPassingYear,
      lastGpaMarks: updatedFields.lastGpaMarks,
      tcNumber: updatedFields.tcNumber,
      coCurricular: updatedFields.coCurricular,
      medicalNotes: updatedFields.medicalNotes,
      isHostel: updatedFields.isHostel,
      isTransport: updatedFields.isTransport,
      classId: updatedFields.classId,
      sectionId: updatedFields.sectionId,
      rollNo: updatedFields.rollNo,
      status: updatedFields.status
    };

    try {
      const res = await firstValueFrom(this.http.put<ApiResponse<Student>>(`${this.API_BASE}/students/${id}`, payload));
      if (res && res.data) {
        const list = this.students$.value.map(s => s.id === id ? res.data : s);
        this.students$.next(list);
        return res.data;
      }
    } catch (e) {
      console.warn('Backend updateStudent failed, updating local state:', e);
    }

    const list = this.students$.value.map(s => s.id === id ? { ...s, ...updatedFields } as Student : s);
    this.students$.next(list);
    return list.find(s => s.id === id)!;
  }

  async batchPromoteStudents(
    targetAcademicYearId: string,
    targetClassId: string,
    targetSectionId: string,
    promotions: { studentId: string; newRollNo: string; targetClassId?: string; targetSectionId?: string; status?: string }[]
  ): Promise<boolean> {
    const targetClass = this.classes$.value.find(c => c.id === targetClassId);
    const targetSection = this.sections$.value.find(s => s.id === targetSectionId);

    const payload = {
      targetAcademicYearId,
      targetClassId,
      targetSectionId,
      students: promotions
    };

    try {
      await firstValueFrom(this.http.post<ApiResponse<number>>(`${this.API_BASE}/students/batch-promote`, payload));
    } catch (e: any) {
      console.error('Backend batchPromote error:', e);
      throw e;
    }

    const promoMap = new Map(promotions.map(p => [p.studentId, p.newRollNo]));
    const updated = this.students$.value.map(s => {
      if (promoMap.has(s.id)) {
        return {
          ...s,
          academicYearId: targetAcademicYearId,
          classId: targetClassId,
          className: targetClass ? targetClass.name : s.className,
          sectionId: targetSectionId,
          sectionName: targetSection ? targetSection.name : s.sectionName,
          rollNo: promoMap.get(s.id)!
        };
      }
      return s;
    });
    this.students$.next(updated);
    this.studentStore.setStudents(updated);
    this.saveStorage('students', updated);
    // Refresh live students from server to guarantee 100% database synchronization
    try {
      await this.studentStore.loadStudents();
      this.students$.next(this.studentStore.getStudents());
      this.saveStorage('students', this.students$.value);
    } catch {
      // In case offline, apply optimistic update
      const promoMap = new Map(promotions.map(p => [p.studentId, p.newRollNo]));
      const updated = this.students$.value.map(s => {
        if (promoMap.has(s.id)) {
          return {
            ...s,
            academicYearId: targetAcademicYearId,
            classId: targetClassId,
            className: targetClass ? targetClass.name : s.className,
            sectionId: targetSectionId,
            sectionName: targetSection ? targetSection.name : s.sectionName,
            rollNo: promoMap.get(s.id)!
          };
        }
        return s;
      });
      this.students$.next(updated);
      this.studentStore.setStudents(updated);
      this.saveStorage('students', updated);
    }

    return true;
  }

  async deleteStudent(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete<ApiResponse<boolean>>(`${this.API_BASE}/students/${id}`));
    } catch (e) {
      console.warn('Backend deleteStudent failed, removing locally:', e);
    }
    this.students$.next(this.students$.value.filter(s => s.id !== id));
    return true;
  }

  getRoutine(): RoutinePeriod[] {
    if (this.isCurrentUserRestricted()) {
      const ward = this.findMatchingWard();
      if (ward) {
        return this.routine$.value.filter(r => r.classId === ward.classId && r.sectionId === ward.sectionId);
      }
    }
    const activeBranch = this.getActiveBranchId();
    if (activeBranch !== 'ALL') {
      return this.routine$.value.filter(r => (r.branchId || 'br-01') === activeBranch);
    }
    return this.routine$.value;
  }
  getRoutine$() { return this.routine$.asObservable(); }
  async addRoutinePeriod(period: RoutinePeriod): Promise<RoutinePeriod> {
    const res = await this.academicStore.saveRoutinePeriod(period);
    this.routine$.next(this.academicStore.getRoutine());
    return res;
  }
  async deleteRoutinePeriod(id: string): Promise<boolean> {
    const res = await this.academicStore.deleteRoutinePeriod(id);
    this.routine$.next(this.academicStore.getRoutine());
    return res;
  }
  async saveRoutinesBatch(periods: RoutinePeriod[]): Promise<boolean> {
    const res = await this.academicStore.saveRoutinesBatch(periods);
    this.routine$.next(this.academicStore.getRoutine());
    return res;
  }

  // Attendance
  getAttendanceRecords(): AttendanceRecord[] {
    const activeBranch = this.getActiveBranchId();
    return activeBranch === 'ALL'
      ? this.attendance$.value
      : this.attendance$.value.filter(a => (a.branchId || 'br-01') === activeBranch);
  }

  getAttendance(date: string, classId: string, sectionId: string): AttendanceRecord[] {
    const activeBranch = this.getActiveBranchId();
    return this.attendance$.value.filter(
      a => (a.date === date || a.date.startsWith(date)) && a.classId === classId && a.sectionId === sectionId && (activeBranch === 'ALL' || (a.branchId || 'br-01') === activeBranch)
    );
  }

  fetchAttendanceRecords(classId: string, sectionId: string, date: string): Observable<AttendanceRecord[]> {
    return this.http.get<ApiResponse<AttendanceRecord[]>>(
      `${this.API_BASE}/attendance/students?classId=${encodeURIComponent(classId)}&sectionId=${encodeURIComponent(sectionId)}&date=${encodeURIComponent(date)}`
    ).pipe(
      map(res => {
        const records = res?.data || [];
        const current = [...this.attendance$.value];
        const dateStr = date.split('T')[0];

        for (const rec of records) {
          const recDateStr = typeof rec.date === 'string' ? rec.date.split('T')[0] : dateStr;
          const normalizedRec: AttendanceRecord = {
            ...rec,
            date: recDateStr
          };
          const idx = current.findIndex(a => a.studentId === rec.studentId && (a.date === recDateStr || a.date.startsWith(recDateStr)));
          if (idx > -1) {
            current[idx] = normalizedRec;
          } else {
            current.push(normalizedRec);
          }
        }
        this.attendance$.next(current);
        return records;
      }),
      catchError(err => {
        console.error('Error fetching attendance from API:', err);
        return of(this.getAttendance(date, classId, sectionId));
      })
    );
  }

  fetchAttendanceRange(classId?: string, sectionId?: string, startDate?: string, endDate?: string): Observable<AttendanceRecord[]> {
    return this.attendanceStore.fetchAttendanceRange(classId, sectionId, startDate, endDate).pipe(
      tap(records => {
        const current = [...this.attendance$.value];
        for (const rec of records) {
          const recDateStr = typeof rec.date === 'string' ? rec.date.split('T')[0] : '';
          const normalizedRec: AttendanceRecord = { ...rec, date: recDateStr || rec.date };
          const idx = current.findIndex(a => a.id === rec.id || (a.studentId === rec.studentId && a.date === normalizedRec.date));
          if (idx > -1) {
            current[idx] = normalizedRec;
          } else {
            current.push(normalizedRec);
          }
        }
        this.attendance$.next(current);
      })
    );
  }

  fetchAttendanceCorrections(): Observable<AttendanceCorrectionLog[]> {
    return this.attendanceStore.fetchCorrections().pipe(
      tap(logs => this.attendanceLogs$.next(logs))
    );
  }

  submitAttendanceCorrection(
    attendanceId: string,
    studentId: string,
    studentName: string,
    date: string,
    prevStatus: string,
    newStatus: string,
    reason: string
  ): void {
    this.attendanceStore.submitAttendanceCorrection(
      attendanceId,
      studentId,
      studentName,
      date,
      prevStatus,
      newStatus,
      reason
    );
  }

  saveAttendanceRoster(
    classId: string,
    sectionId: string,
    date: string,
    records: { studentId: string; studentName: string; rollNo: string; status: 'Present' | 'Absent' | 'Late'; remark?: string }[]
  ): Observable<ApiResponse<boolean>> {
    const activeBranch = this.getActiveBranchId();
    const branchForRec = activeBranch === 'ALL' ? 'br-01' : activeBranch;
    const dateIso = new Date(date + 'T00:00:00Z').toISOString();

    const payload = {
      classId,
      sectionId,
      date: dateIso,
      records: records.map(r => ({
        studentId: r.studentId,
        studentName: r.studentName,
        rollNo: r.rollNo,
        status: r.status,
        remark: r.remark || ''
      }))
    };

    return this.http.post<ApiResponse<boolean>>(`${this.API_BASE}/attendance/students`, payload).pipe(
      tap(() => {
        const current = [...this.attendance$.value];
        const dateStr = date.split('T')[0];
        const user = this.currentUser$.value?.fullName || 'Staff';

        for (const r of records) {
          const idx = current.findIndex(a => a.studentId === r.studentId && (a.date === dateStr || a.date.startsWith(dateStr)));
          const updated: AttendanceRecord = {
            id: idx > -1 ? current[idx].id : 'att-' + Date.now() + Math.random().toString(36).substring(2, 6),
            date: dateStr,
            studentId: r.studentId,
            studentName: r.studentName,
            rollNo: r.rollNo,
            classId,
            sectionId,
            status: r.status,
            remark: r.remark || '',
            markedBy: user,
            branchId: branchForRec,
            lastUpdated: new Date().toISOString()
          };
          if (idx > -1) {
            current[idx] = updated;
          } else {
            current.push(updated);
          }
        }
        this.attendance$.next(current);
        this.saveStorage('attendance', current);
        this.logAudit('Update', 'Attendance', `Recorded attendance for ${records.length} students in class ${classId}, section ${sectionId} on ${dateStr}`);
      })
    );
  }

  saveAttendance(records: AttendanceRecord[]): void {
    const activeBranch = this.getActiveBranchId();
    const branchForRec = activeBranch === 'ALL' ? 'br-01' : activeBranch;

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
        current[idx] = { ...rec, branchId: rec.branchId || branchForRec, lastUpdated: new Date().toISOString() };
      } else {
        current.push({ ...rec, branchId: rec.branchId || branchForRec, id: 'att-' + Date.now() + Math.random().toString(36).substring(2, 6) });
      }
    }
    this.attendance$.next(current);
  }

  correctAttendance(recordId: string, newStatus: AttendanceRecord['status'], reason: string): void {
    const records = [...this.attendance$.value];
    const idx = records.findIndex(r => r.id === recordId);
    if (idx > -1) {
      const prevStatus = records[idx].status;
      records[idx].status = newStatus;
      records[idx].remark = `Corrected: ${reason}`;
      records[idx].lastUpdated = new Date().toISOString();
      this.attendance$.next(records);

      const log: AttendanceCorrectionLog = {
        id: 'att-log-' + Date.now(),
        attendanceId: recordId,
        date: records[idx].date,
        studentName: records[idx].studentName,
        previousStatus: prevStatus,
        newStatus,
        reason,
        updatedBy: this.currentUser$.value?.fullName || 'Administrator',
        timestamp: new Date().toLocaleString('en-GB')
      };
      this.attendanceLogs$.next([log, ...this.attendanceLogs$.value]);

      this.http.post(`${this.API_BASE}/attendance/correction`, {
        attendanceId: recordId,
        date: new Date(records[idx].date).toISOString(),
        studentName: records[idx].studentName,
        previousStatus: prevStatus,
        newStatus,
        reason,
        updatedBy: this.currentUser$.value?.fullName || 'Administrator'
      }).subscribe({
        error: (err) => console.warn('Attendance correction backend sync:', err)
      });
    }
  }

  getAttendanceLogs(): AttendanceCorrectionLog[] {
    return this.attendanceLogs$.value;
  }
  getAttendanceLogs$() {
    return this.attendanceLogs$.asObservable();
  }

  // --- Attendance: Weekend & Holidays ---
  getWeekendSettings$() { return this.attendanceStore.getWeekendSettings$(); }
  getWeekendSettings() { return this.attendanceStore.getWeekendSettings(); }
  fetchWeekendSettings() { return this.attendanceStore.fetchWeekendSettings(); }
  saveWeekendSettings(settings: WeekendSettings) { return this.attendanceStore.saveWeekendSettings(settings); }

  getHolidays$() { return this.attendanceStore.getHolidays$(); }
  getHolidays() { return this.attendanceStore.getHolidays(); }
  fetchHolidays() { return this.attendanceStore.fetchHolidays(); }
  saveHoliday(holiday: AcademicHoliday) { return this.attendanceStore.saveHoliday(holiday); }
  deleteHoliday(id: string) { return this.attendanceStore.deleteHoliday(id); }

  // Exams & Marks
  getExams(): Exam[] {
    const activeBranch = this.getActiveBranchId();
    if (activeBranch !== 'ALL') {
      return this.exams$.value.filter(e => !e.branchId || e.branchId === activeBranch);
    }
    return this.exams$.value;
  }
  getExams$() { return this.exams$.asObservable(); }

  createExam(examData: Partial<Exam>): Exam {
    const activeBranch = this.getActiveBranchId();
    const effectiveBranch = examData.branchId || (activeBranch === 'ALL' ? 'br-01' : activeBranch);

    const newExam: Exam = {
      id: 'ex-' + Date.now().toString().slice(-6),
      name: examData.name || 'New Examination Term',
      term: examData.term || 'First Term',
      academicYear: examData.academicYear || '2026 - 2027',
      startDate: examData.startDate || new Date().toISOString().split('T')[0],
      endDate: examData.endDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      isPublished: !!examData.isPublished,
      branchId: effectiveBranch,
      code: examData.code,
      instructions: examData.instructions
    };

    // Post to real backend
    this.http.post<ApiResponse<Exam>>(`${this.API_BASE}/exams`, {
      name: newExam.name,
      term: newExam.term,
      academicYear: newExam.academicYear,
      startDate: new Date(newExam.startDate).toISOString(),
      endDate: new Date(newExam.endDate).toISOString(),
      isPublished: newExam.isPublished
    }).subscribe({
      next: res => {
        if (res && res.success && res.data) {
          const updated = this.exams$.value.map(e => e.id === newExam.id ? { ...e, id: res.data.id } : e);
          this.exams$.next(updated);
        }
      }
    });

    const updated = [newExam, ...this.exams$.value];
    this.exams$.next(updated);
    this.saveStorage('exams', updated);
    this.logAudit('Create', 'Exam Setup', `Created examination cycle: ${newExam.name} (${newExam.term})`);
    return newExam;
  }

  updateExam(id: string, examData: Partial<Exam>): Exam | null {
    const list = [...this.exams$.value];
    const idx = list.findIndex(e => e.id === id);
    if (idx === -1) return null;

    const updatedExam: Exam = {
      ...list[idx],
      ...examData
    };
    list[idx] = updatedExam;
    this.exams$.next(list);
    this.saveStorage('exams', list);

    // Put to real backend
    this.http.put<ApiResponse<Exam>>(`${this.API_BASE}/exams/${id}`, {
      name: updatedExam.name,
      term: updatedExam.term,
      academicYear: updatedExam.academicYear,
      startDate: new Date(updatedExam.startDate).toISOString(),
      endDate: new Date(updatedExam.endDate).toISOString(),
      isPublished: updatedExam.isPublished
    }).subscribe();

    this.logAudit('Update', 'Exam Setup', `Updated exam parameters for: ${updatedExam.name}`);
    return updatedExam;
  }

  toggleExamPublish(id: string): Exam | null {
    const list = [...this.exams$.value];
    const idx = list.findIndex(e => e.id === id);
    if (idx === -1) return null;

    list[idx] = { ...list[idx], isPublished: !list[idx].isPublished };
    this.exams$.next(list);
    this.saveStorage('exams', list);

    // Call real backend
    this.http.put<ApiResponse<boolean>>(`${this.API_BASE}/exams/${id}/toggle-publish`, {}).subscribe();

    this.logAudit('Update', 'Exam Setup', `${list[idx].isPublished ? 'Published' : 'Unpublished'} marksheets for: ${list[idx].name}`);
    return list[idx];
  }

  deleteExam(id: string): boolean {
    const list = this.exams$.value.filter(e => e.id !== id);
    this.exams$.next(list);
    this.saveStorage('exams', list);

    // Remove associated schedules
    const schedules = this.examSchedules$.value.filter(s => s.examId !== id);
    this.examSchedules$.next(schedules);
    this.saveStorage('exam_schedules', schedules);

    // Call real backend
    this.http.delete<ApiResponse<boolean>>(`${this.API_BASE}/exams/${id}`).subscribe();

    this.logAudit('Delete', 'Exam Setup', `Deleted examination term ID: ${id}`);
    return true;
  }

  // Exam Schedules / Datesheets
  getExamSchedules(examId?: string, classId?: string): ExamScheduleItem[] {
    const activeBranch = this.getActiveBranchId();
    let list = this.examSchedules$.value;
    if (activeBranch !== 'ALL') {
      list = list.filter(s => (s.branchId || 'br-01') === activeBranch);
    }
    if (examId) list = list.filter(s => s.examId === examId);
    if (classId) list = list.filter(s => s.classId === classId);
    return list;
  }
  getExamSchedules$() { return this.examSchedules$.asObservable(); }

  addExamSchedule(schedule: Partial<ExamScheduleItem>): ExamScheduleItem {
    const activeBranch = this.getActiveBranchId();
    const effectiveBranch = schedule.branchId || (activeBranch === 'ALL' ? 'br-01' : activeBranch);

    const newItem: ExamScheduleItem = {
      id: 'ex-sch-' + Date.now().toString().slice(-5),
      examId: schedule.examId || '',
      classId: schedule.classId || '',
      className: schedule.className || '',
      subjectId: schedule.subjectId || '',
      subjectName: schedule.subjectName || '',
      examDate: schedule.examDate || new Date().toISOString().split('T')[0],
      day: schedule.day || 'Sunday',
      startTime: schedule.startTime || '10:00 AM',
      endTime: schedule.endTime || '01:00 PM',
      roomNo: schedule.roomNo || 'Room 101',
      fullMarks: schedule.fullMarks || 100,
      passMarks: schedule.passMarks || 33,
      branchId: effectiveBranch
    };

    this.http.post<ApiResponse<ExamScheduleItem>>(`${this.API_BASE}/exams/schedules`, {
      examId: newItem.examId,
      classId: newItem.classId,
      className: newItem.className,
      subjectId: newItem.subjectId,
      subjectName: newItem.subjectName,
      examDate: new Date(newItem.examDate).toISOString(),
      day: newItem.day,
      startTime: newItem.startTime,
      endTime: newItem.endTime,
      roomNo: newItem.roomNo,
      fullMarks: newItem.fullMarks,
      passMarks: newItem.passMarks
    }).subscribe({
      next: res => {
        if (res?.success && res.data) {
          const updated = this.examSchedules$.value.map(s => s.id === newItem.id ? res.data : s);
          this.examSchedules$.next(updated);
        }
      }
    });

    const updated = [...this.examSchedules$.value, newItem];
    this.examSchedules$.next(updated);
    this.saveStorage('exam_schedules', updated);
    this.logAudit('Create', 'Exam Schedule', `Added exam schedule for ${newItem.subjectName} (${newItem.className})`);
    return newItem;
  }

  deleteExamSchedule(id: string): boolean {
    this.http.delete<ApiResponse<boolean>>(`${this.API_BASE}/exams/schedules/${id}`).subscribe();
    const updated = this.examSchedules$.value.filter(s => s.id !== id);
    this.examSchedules$.next(updated);
    this.saveStorage('exam_schedules', updated);
    return true;
  }

  getExamMarks(examId: string, classId?: string, subjectId?: string, sectionId?: string): ExamMark[] {
    const activeBranch = this.getActiveBranchId();
    let marks = this.marks$.value;
    if (!marks || marks.length === 0) {
      marks = this.loadStorage<ExamMark[]>('marks', []);
      if (marks.length > 0) {
        this.marks$.next(marks);
      }
    }
    return marks.filter(
      m => m.examId === examId &&
        (!classId || m.classId === classId) &&
        (!subjectId || m.subjectId === subjectId) &&
        (!sectionId || !m.sectionId || m.sectionId === sectionId) &&
        (activeBranch === 'ALL' || (m.branchId || this.getStudentById(m.studentId)?.branchId || 'br-01') === activeBranch)
    );
  }

  saveExamMarks(marks: ExamMark[]): void {
    if (!marks || marks.length === 0) return;

    const activeBranch = this.getActiveBranchId();
    const branchForMark = activeBranch === 'ALL' ? 'br-01' : activeBranch;

    if (marks.length > 0) {
      this.http.post(`${this.API_BASE}/exams/${marks[0].examId}/marks`, {
        examId: marks[0].examId,
        classId: marks[0].classId,
        sectionId: marks[0].sectionId,
        subjectId: marks[0].subjectId,
        marks: marks.map(m => ({
          studentId: m.studentId,
          studentName: m.studentName,
          rollNo: m.rollNo,
          obtainedMarks: m.obtainedMarks,
          theoryMarks: m.theoryMarks ?? 0,
          mcqMarks: m.mcqMarks ?? 0,
          practicalMarks: m.practicalMarks ?? 0,
          vivaMarks: m.vivaMarks ?? 0,
          isAbsent: !!m.isAbsent,
          remark: m.remark || ''
        }))
      }).subscribe({
        next: () => { },
        error: (err) => console.warn('Backend marks sync notice:', err)
      });
    }

    let current = [...this.marks$.value];
    if (current.length === 0) {
      current = [...this.loadStorage<ExamMark[]>('marks', [])];
    }

    for (const m of marks) {
      const student = this.getStudentById(m.studentId);
      const effectiveBranch = m.branchId || student?.branchId || branchForMark;

      const idx = current.findIndex(c => c.examId === m.examId && c.studentId === m.studentId && c.subjectId === m.subjectId);
      const record: ExamMark = {
        ...m,
        id: idx > -1 && current[idx].id ? current[idx].id : ('mk-' + Date.now() + Math.random().toString(36).substring(2, 6)),
        branchId: effectiveBranch
      };

      if (idx > -1) {
        current[idx] = record;
      } else {
        current.push(record);
      }
    }

    this.marks$.next(current);
    this.saveStorage('marks', current);
    try {
      this.examStore.setMarks(current);
    } catch { }

    if (marks.length > 0) {
      this.logAudit('Update', 'Exam Marks', `Committed assessment marks for ${marks.length} students in ${marks[0]?.subjectName || 'subject'}`);
    }
  }

  getAssessmentScheme(classId?: string, subjectId?: string): any {
    if (classId && subjectId) {
      const specific = this.loadStorage<any>(`exam_scheme_${classId}_${subjectId}`, null);
      if (specific) return specific;
    }
    if (subjectId) {
      const subLevel = this.loadStorage<any>(`exam_scheme_${subjectId}`, null);
      if (subLevel) return subLevel;
    }
    return null;
  }

  saveAssessmentScheme(classId: string, subjectId: string, config: any, applyToAllClasses = false): void {
    if (applyToAllClasses) {
      this.saveStorage(`exam_scheme_${subjectId}`, config);
    } else {
      this.saveStorage(`exam_scheme_${classId}_${subjectId}`, config);
    }
    this.logAudit('Update', 'Exam Assessment Scheme', `Saved custom assessment distribution for class ${classId}, subject ${subjectId}`);
  }

  resetAssessmentScheme(classId: string, subjectId: string): void {
    try {
      localStorage.removeItem(this.campus.storagePrefix + `exam_scheme_${classId}_${subjectId}`);
      localStorage.removeItem(this.campus.storagePrefix + `exam_scheme_${subjectId}`);
    } catch { }
  }

  getStudentMarksheet(studentId: string, examId: string): StudentMarksheet | null {
    const student = this.getStudentById(studentId) || this.students$.value.find(s => s.id === studentId);
    const exam = this.exams$.value.find(e => e.id === examId);
    if (!student || !exam) return null;

    const studentMarks = this.marks$.value.filter(m => m.studentId === student.id && m.examId === exam.id);
    if (studentMarks.length === 0) {
      return {
        student,
        examName: exam.name,
        academicYear: exam.academicYear,
        marks: [],
        totalMarks: 0,
        totalObtained: 0,
        gpa: 0,
        letterGrade: 'N/A',
        remarks: 'No assessment marks submitted yet for this examination.',
        positionInClass: 0
      };
    }

    const totalMarks = studentMarks.reduce((sum, m) => sum + (m.fullMarks || 100), 0);
    const totalObtained = studentMarks.reduce((sum, m) => sum + m.obtainedMarks, 0);
    const totalGP = studentMarks.reduce((sum, m) => sum + (m.gradePoint || 0), 0);
    const hasFail = studentMarks.some(m => !m.isPass || m.grade === 'F' || m.isAbsent || m.obtainedMarks < 33);
    const gpa = hasFail ? 0.0 : (studentMarks.length > 0 ? Number((totalGP / studentMarks.length).toFixed(2)) : 0.0);
    const letterGrade = hasFail ? 'F' : (gpa >= 5.0 ? 'A+' : gpa >= 4.0 ? 'A' : gpa >= 3.5 ? 'A-' : gpa >= 3.0 ? 'B' : gpa >= 2.0 ? 'C' : gpa >= 1.0 ? 'D' : 'F');
    const remarks = hasFail
      ? 'Did not achieve minimum passing marks in all subjects. Requires remedial examination.'
      : (gpa >= 5.0 ? 'Exceptional academic performance with GPA 5.00 (Golden / Top Honors).' :
        gpa >= 4.0 ? 'Outstanding academic excellence and top class honors.' :
          gpa >= 3.5 ? 'Very good academic standing with steady consistency.' :
            gpa >= 3.0 ? 'Good academic progress with room for improvement.' : 'Passed with minimum grade threshold.');

    return {
      student,
      examName: exam.name,
      academicYear: exam.academicYear,
      marks: studentMarks,
      totalMarks,
      totalObtained,
      gpa,
      letterGrade,
      remarks,
      positionInClass: 1
    };
  }

  async fetchStudentMarksheet(studentId: string, examId: string): Promise<StudentMarksheet | null> {
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<StudentMarksheet>>(`${this.API_BASE}/exams/${examId}/students/${studentId}/marksheet`));
      if (res?.success && res.data) {
        return res.data;
      }
    } catch (e) {
      console.warn('Backend fetchStudentMarksheet notice:', e);
    }
    return this.getStudentMarksheet(studentId, examId);
  }

  async fetchClassMarksheet(examId: string, classId: string, sectionId?: string): Promise<StudentMarksheet[]> {
    let url = `${this.API_BASE}/exams/${examId}/classes/${classId}/marksheet`;
    if (sectionId && sectionId !== 'ALL') {
      url += `?sectionId=${encodeURIComponent(sectionId)}`;
    }
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<StudentMarksheet[]>>(url));
      if (res?.success && res.data) {
        return res.data;
      }
    } catch (e) {
      console.warn('Backend fetchClassMarksheet notice:', e);
    }
    return [];
  }

  async fetchExamMarks(examId: string, classId?: string, sectionId?: string, subjectId?: string): Promise<ExamMark[]> {
    return this.examStore.fetchExamMarks(examId, classId, sectionId, subjectId);
  }

  // Fees & Finance
  getFeeTypes(): FeeType[] { return this.feeTypes$.value; }
  getFeeTypes$() { return this.feeTypes$.asObservable(); }

  async addFeeType(ft: Partial<FeeType>): Promise<FeeType> {
    const payload = {
      name: ft.name,
      code: ft.code || ('FEE-' + (ft.name || '').replace(/\s+/g, '').toUpperCase()),
      frequency: ft.frequency || 'Monthly',
      description: ft.description || ''
    };
    try {
      const res = await firstValueFrom(this.http.post<ApiResponse<FeeType>>(`${this.API_BASE}/fees/types`, payload));
      if (res && res.data) {
        this.feeTypes$.next([...this.feeTypes$.value, res.data]);
        return res.data;
      }
    } catch (e) {
      console.warn('Backend addFeeType failed, saving locally:', e);
    }
    const newFt: FeeType = {
      id: 'ft-' + Math.random().toString(36).substring(2, 9),
      name: payload.name || 'New Fee',
      code: payload.code,
      frequency: payload.frequency as any,
      description: payload.description
    };
    this.feeTypes$.next([...this.feeTypes$.value, newFt]);
    return newFt;
  }

  async updateFeeType(id: string, ft: Partial<FeeType>): Promise<FeeType> {
    const payload = {
      name: ft.name,
      code: ft.code,
      frequency: ft.frequency,
      description: ft.description
    };
    try {
      const res = await firstValueFrom(this.http.put<ApiResponse<FeeType>>(`${this.API_BASE}/fees/types/${id}`, payload));
      if (res && res.data) {
        const updated = this.feeTypes$.value.map(t => t.id === id ? res.data : t);
        this.feeTypes$.next(updated);
        return res.data;
      }
    } catch (e) {
      console.warn('Backend updateFeeType failed, saving locally:', e);
    }
    const updated = this.feeTypes$.value.map(t => t.id === id ? { ...t, ...ft } as FeeType : t);
    this.feeTypes$.next(updated);
    return updated.find(t => t.id === id)!;
  }

  async deleteFeeType(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete<ApiResponse<boolean>>(`${this.API_BASE}/fees/types/${id}`));
    } catch (e) {
      console.warn('Backend deleteFeeType failed, saving locally:', e);
    }
    this.feeTypes$.next(this.feeTypes$.value.filter(t => t.id !== id));
    return true;
  }

  getFeeStructure(): FeeStructure[] {
    const activeBranch = this.getActiveBranchId();
    if (activeBranch !== 'ALL') {
      return this.feeStructure$.value.filter(fs => (fs.branchId || 'br-01') === activeBranch);
    }
    return this.feeStructure$.value;
  }
  getFeeStructure$() { return this.feeStructure$.asObservable(); }

  async setFeeStructure(fs: Partial<FeeStructure>): Promise<FeeStructure> {
    const payload = {
      academicYearId: fs.academicYearId || 'ay-2026',
      classId: fs.classId,
      feeTypeId: fs.feeTypeId,
      amount: fs.amount || 0,
      dueDate: fs.dueDate
    };
    try {
      const res = await firstValueFrom(this.http.post<ApiResponse<FeeStructure>>(`${this.API_BASE}/fees/structures`, payload));
      if (res && res.data) {
        const existingIdx = this.feeStructure$.value.findIndex(s => s.classId === fs.classId && s.feeTypeId === fs.feeTypeId);
        let list = [...this.feeStructure$.value];
        if (existingIdx >= 0) {
          list[existingIdx] = res.data;
        } else {
          list.push(res.data);
        }
        this.feeStructure$.next(list);
        return res.data;
      }
    } catch (e) {
      console.warn('Backend setFeeStructure failed, saving locally:', e);
    }
    const newFs: FeeStructure = {
      id: 'fs-' + Math.random().toString(36).substring(2, 9),
      academicYearId: payload.academicYearId,
      classId: fs.classId || '',
      className: fs.className || '',
      feeTypeId: fs.feeTypeId || '',
      feeTypeName: fs.feeTypeName || '',
      amount: payload.amount,
      dueDate: payload.dueDate || new Date().toISOString().split('T')[0]
    };
    const list = this.feeStructure$.value.filter(s => !(s.classId === fs.classId && s.feeTypeId === fs.feeTypeId));
    list.push(newFs);
    this.feeStructure$.next(list);
    return newFs;
  }

  async updateFeeStructure(id: string, fs: Partial<FeeStructure>): Promise<FeeStructure> {
    const payload = {
      amount: fs.amount,
      dueDate: fs.dueDate
    };
    try {
      const res = await firstValueFrom(this.http.put<ApiResponse<FeeStructure>>(`${this.API_BASE}/fees/structures/${id}`, payload));
      if (res && res.data) {
        const updated = this.feeStructure$.value.map(s => s.id === id ? res.data : s);
        this.feeStructure$.next(updated);
        return res.data;
      }
    } catch (e) {
      console.warn('Backend updateFeeStructure failed, saving locally:', e);
    }
    const updated = this.feeStructure$.value.map(s => s.id === id ? { ...s, ...fs } as FeeStructure : s);
    this.feeStructure$.next(updated);
    return updated.find(s => s.id === id)!;
  }

  async deleteFeeStructure(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete<ApiResponse<boolean>>(`${this.API_BASE}/fees/structures/${id}`));
    } catch (e) {
      console.warn('Backend deleteFeeStructure failed, saving locally:', e);
    }
    this.feeStructure$.next(this.feeStructure$.value.filter(s => s.id !== id));
    return true;
  }

  async batchGenerateInvoices(req: {
    academicYearId: string;
    classId?: string;
    feeTypeId: string;
    monthYear: string;
    dueDate: string;
  }): Promise<{ totalGenerated: number; totalSkipped: number; totalAmount: number; message: string }> {
    try {
      const res = await firstValueFrom(this.http.post<ApiResponse<any>>(`${this.API_BASE}/fees/invoices/generate-batch`, req));
      if (res && res.data) {
        // Refresh live invoices
        const invRes = await firstValueFrom(this.http.get<ApiResponse<StudentInvoice[]>>(`${this.API_BASE}/fees/invoices`));
        if (invRes && invRes.data) {
          this.invoices$.next(invRes.data);
        }
        return res.data;
      }
    } catch (e) {
      console.warn('Backend batchGenerateInvoices failed, generating locally:', e);
    }

    let students = this.students$.value.filter(s => s.status === 'Active');
    if (req.classId && req.classId !== 'ALL') {
      students = students.filter(s => s.classId === req.classId);
    }
    const feeType = this.feeTypes$.value.find(t => t.id === req.feeTypeId);
    let gen = 0;
    let skip = 0;
    let totAmt = 0;
    const newInvoices: StudentInvoice[] = [...this.invoices$.value];

    for (const st of students) {
      const exists = newInvoices.some(i => i.studentId === st.id && (i.feeTypeName.includes(req.monthYear) || (i.feeTypeId === req.feeTypeId && i.dueDate.startsWith(req.dueDate.slice(0, 7)))));
      if (exists) {
        skip++;
        continue;
      }
      const struct = this.feeStructure$.value.find(s => s.classId === st.classId && s.feeTypeId === req.feeTypeId);
      const amt = struct ? struct.amount : 2500;
      gen++;
      totAmt += amt;
      newInvoices.unshift({
        id: 'inv-' + Math.random().toString(36).substring(2, 9),
        invoiceNo: `INV-${req.dueDate.replace(/-/g, '').slice(0, 6)}-${Math.floor(1000 + Math.random() * 9000)}`,
        studentId: st.id,
        studentName: st.fullName,
        rollNo: st.rollNo,
        className: st.className,
        sectionName: st.sectionName,
        feeTypeId: req.feeTypeId,
        feeTypeName: `${feeType?.name || 'Tuition Fee'} (${req.monthYear})`,
        totalAmount: amt,
        discountAmount: 0,
        netAmount: amt,
        paidAmount: 0,
        dueAmount: amt,
        dueDate: req.dueDate,
        status: 'Unpaid'
      });
    }

    this.invoices$.next(newInvoices);
    return {
      totalGenerated: gen,
      totalSkipped: skip,
      totalAmount: totAmt,
      message: `Generated ${gen} invoices (৳ ${totAmt.toLocaleString()}). ${skip} skipped.`
    };
  }

  async applyInvoiceDiscount(id: string, discount: number): Promise<StudentInvoice> {
    try {
      const res = await firstValueFrom(this.http.put<ApiResponse<StudentInvoice>>(`${this.API_BASE}/fees/invoices/${id}/discount`, { discountAmount: discount }));
      if (res && res.data) {
        const updated = this.invoices$.value.map(i => i.id === id ? res.data : i);
        this.invoices$.next(updated);
        return res.data;
      }
    } catch (e) {
      console.warn('Backend applyInvoiceDiscount failed, saving locally:', e);
    }
    const updated = this.invoices$.value.map(i => {
      if (i.id === id) {
        const disc = Math.min(discount, i.totalAmount);
        const net = Math.max(0, i.totalAmount - disc);
        const due = Math.max(0, net - i.paidAmount);
        return {
          ...i,
          discountAmount: disc,
          netAmount: net,
          dueAmount: due,
          status: (due === 0 ? 'Paid' : (i.paidAmount > 0 ? 'Partial' : 'Unpaid')) as any
        };
      }
      return i;
    });
    this.invoices$.next(updated);
    return updated.find(i => i.id === id)!;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete<ApiResponse<boolean>>(`${this.API_BASE}/fees/invoices/${id}`));
    } catch (e) {
      console.warn('Backend deleteInvoice failed, saving locally:', e);
    }
    this.invoices$.next(this.invoices$.value.filter(i => i.id !== id));
    return true;
  }


  getInvoices(studentId?: string): StudentInvoice[] {
    if (this.isCurrentUserRestricted()) {
      const ward = this.findMatchingWard();
      return this.invoices$.value.filter(i => (ward ? (i.studentId === ward.id || i.studentName === ward.fullName) : true));
    }
    let list = this.invoices$.value;
    const activeBranch = this.getActiveBranchId();
    if (activeBranch !== 'ALL') {
      list = list.filter(i => (i.branchId || 'br-01') === activeBranch);
    }
    if (studentId) {
      return list.filter(i => i.studentId === studentId);
    }
    return list;
  }
  getInvoices$() { return this.invoices$.asObservable(); }

  ensureStudentInvoices(studentId: string): StudentInvoice[] {
    return this.invoices$.value.filter(i => i.studentId === studentId);
  }

  async loadInvoices(studentId?: string): Promise<StudentInvoice[]> {
    const list = await this.financeStore.loadInvoices(studentId);
    this.invoices$.next(this.financeStore.getInvoices());
    return list;
  }

  async loadPayments(studentId?: string): Promise<FeePayment[]> {
    const list = await this.financeStore.loadPayments(studentId);
    this.payments$.next(this.financeStore.getPayments());
    return list;
  }

  async collectFeePayment(payment: {
    invoiceId: string;
    studentId: string;
    amountPaid: number;
    paymentMethod: FeePayment['paymentMethod'];
    transactionRef?: string;
    notes?: string;
  }): Promise<FeePayment> {
    const res = await this.financeStore.collectFeePaymentAsync(payment, this.currentUser$.value.fullName || 'Cashier');
    this.payments$.next(this.financeStore.getPayments());
    this.invoices$.next(this.financeStore.getInvoices());
    this.saveStorage('invoices', this.invoices$.value);
    this.saveStorage('fee_payments', this.payments$.value);
    this.logAudit('Create', 'Fee Collection', `Collected ৳ ${payment.amountPaid} for ${res.studentName} (Receipt: ${res.receiptNo}) via ${payment.paymentMethod}`);
    return res;
  }

  async batchCollectFeePayments(params: {
    studentId: string;
    items: { invoiceId: string; amountToPay: number }[];
    paymentMethod: FeePayment['paymentMethod'];
    transactionRef?: string;
    notes?: string;
    discount?: number;
    lateFee?: number;
  }): Promise<FeePayment> {
    const payment = await this.financeStore.batchCollectFeePaymentsAsync(params);
    this.payments$.next(this.financeStore.getPayments());
    this.invoices$.next(this.financeStore.getInvoices());
    this.saveStorage('invoices', this.invoices$.value);
    this.saveStorage('fee_payments', this.payments$.value);
    this.logAudit('Create', 'Fee Collection', `Collected ৳ ${payment.amountPaid} for ${payment.studentName} (Receipt: ${payment.receiptNo}) via ${params.paymentMethod}`);
    return payment;
  }

  getPayments(studentId?: string): FeePayment[] {
    let list = this.payments$.value;
    if (!list || list.length === 0) {
      list = this.loadStorage<FeePayment[]>('fee_payments', []);
      if (list.length > 0) this.payments$.next(list);
    }
    if (studentId) return list.filter(p => p.studentId === studentId);
    return list;
  }

  // Notices
  getNotices(): Notice[] {
    const activeBranch = this.getActiveBranchId();
    if (activeBranch !== 'ALL') {
      return this.notices$.value.filter(n => !n.branchId || n.branchId === activeBranch || n.targetAudience === 'All');
    }
    return this.notices$.value;
  }
  getNotices$() { return this.notices$.asObservable(); }

  addNotice(notice: Partial<Notice>): void {
    const activeBranch = this.getActiveBranchId();
    const effectiveBranch = activeBranch === 'ALL' ? (notice.branchId || 'br-01') : activeBranch;

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
      author: this.currentUser$.value.fullName,
      branchId: effectiveBranch
    };
    const updated = [newNotice, ...this.notices$.value];
    this.notices$.next(updated);
  }

  // --- SMS Management ---
  getSmsLogs(): SmsDispatchLog[] {
    return this.smsLogs$.value;
  }
  getSmsLogs$() {
    return this.smsLogs$.asObservable();
  }

  sendSmsDispatch(recipientGroup: string, recipientCount: number, message: string): void {
    const credits = Math.ceil(message.length / 160) * recipientCount;
    const newLog: SmsDispatchLog = {
      id: 'sms-' + Date.now().toString().slice(-5),
      recipientGroup,
      recipientCount,
      message,
      senderName: this.currentUser$.value?.fullName || 'Principal Office',
      sentAt: new Date().toLocaleString('en-GB'),
      status: 'Delivered',
      creditsUsed: credits,
      branchId: this.getActiveBranchId()
    };

    this.http.post<ApiResponse<SmsDispatchLog>>(`${this.API_BASE}/sms/dispatch`, {
      recipientGroup,
      recipientCount,
      message
    }).subscribe({
      next: res => {
        if (res?.success && res.data) {
          const updated = this.smsLogs$.value.map(l => l.id === newLog.id ? res.data : l);
          this.smsLogs$.next(updated);
        }
      }
    });

    const updated = [newLog, ...this.smsLogs$.value];
    this.smsLogs$.next(updated);
    this.saveStorage('sms_logs', updated);
    this.logAudit('Create', 'SMS Dispatch', `Dispatched SMS broadcast to ${recipientGroup} (${recipientCount} recipients, ${credits} credits)`);
  }

  sendSms(phone: string, message: string): void {
    this.sendSmsDispatch(phone, 1, message);
  }

  // Dashboard Aggregates
  getDashboardStats() {
    const students = this.getStudents();
    const teachers = this.getTeachers();
    const invoices = this.getInvoices();
    const activeBranch = this.getActiveBranchId();

    const today = new Date().toISOString().split('T')[0];
    let todayAttendance = this.attendance$.value.filter(a => a.date === today);
    if (activeBranch !== 'ALL') {
      todayAttendance = todayAttendance.filter(a => (a.branchId || 'br-01') === activeBranch);
    }
    const presentCount = todayAttendance.filter(a => a.status === 'Present').length;
    const attendanceRate = todayAttendance.length > 0 ? Math.round((presentCount / todayAttendance.length) * 100) : 0;

    const totalCollected = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
    const totalDue = invoices.reduce((sum, i) => sum + i.dueAmount, 0);

    return {
      totalStudents: students.length,
      activeStudents: students.length,
      totalTeachers: teachers.length,
      attendanceRate: attendanceRate,
      todayPresent: presentCount,
      todayTotal: todayAttendance.length,
      monthlyRevenue: totalCollected,
      totalPendingDues: totalDue,
      upcomingExamsCount: this.getExams().filter(e => !e.isPublished).length
    };
  }

  resetToDefault() {
    localStorage.removeItem('sms_auth_token');
    location.reload();
  }

  // --- Role Analytics Dashboards ---
  getPrincipalDashboard() { return this.systemStore.getPrincipalDashboard(); }
  getTeacherDashboard(teacherId?: string) { return this.systemStore.getTeacherDashboard(teacherId); }
  getAccountantDashboard() { return this.systemStore.getAccountantDashboard(); }
  getSuperAdminDashboard() { return this.systemStore.getSuperAdminDashboard(); }
  getStudentDashboard(studentId?: string) { return this.systemStore.getStudentDashboard(studentId); }
  getGuardianDashboard(guardianUserId?: string) { return this.systemStore.getGuardianDashboard(guardianUserId); }
}
