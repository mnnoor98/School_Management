import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Notice, AuditLog, SmsDispatchLog, School, SmsTemplate } from '../../models';
import { CampusSessionService } from '../campus-session.service';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SystemStoreService {
  private http = inject(HttpClient);
  private campus = inject(CampusSessionService);
  private readonly API_BASE = '/api/v1';

  private notices$ = new BehaviorSubject<Notice[]>([]);
  private auditLogs$ = new BehaviorSubject<AuditLog[]>([]);
  private smsLogs$ = new BehaviorSubject<SmsDispatchLog[]>([]);

  private school$ = new BehaviorSubject<School>({
    id: '',
    name: 'Scholars International Academy',
    code: 'DMSC-101',
    address: 'Plot 14, Road 2, Block-E, Dhaka',
    contact: '+880 1711-000000',
    email: 'info@scholarsacademy.edu.bd',
    logo: 'assets/images/logo.png',
    website: 'https://scholarsacademy.edu.bd',
    status: 'Active'
  });

  getNotices$() { return this.notices$.asObservable(); }
  getAuditLogs$() { return this.auditLogs$.asObservable(); }
  getSmsLogs$() { return this.smsLogs$.asObservable(); }
  getSchool$() { return this.school$.asObservable(); }

  getNotices(): Notice[] { return this.notices$.value; }
  getAuditLogs(): AuditLog[] { return this.auditLogs$.value; }
  getSmsLogs(): SmsDispatchLog[] { return this.smsLogs$.value; }
  getSchool(): School { return this.school$.value; }

  setNotices(notices: Notice[]) { this.notices$.next(notices); }
  setAuditLogs(logs: AuditLog[]) { this.auditLogs$.next(logs); }
  setSmsLogs(logs: SmsDispatchLog[]) { this.smsLogs$.next(logs); }
  setSchool(school: School) { this.school$.next(school); }

  async loadSchool(): Promise<School> {
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<any>>(`${this.API_BASE}/School`));
      if (res?.success && res.data) {
        const schoolObj = res.data.school || res.data;
        this.school$.next(schoolObj);
        return schoolObj;
      }
    } catch (e) {
      console.warn('SystemStore loadSchool error:', e);
    }
    return this.school$.value;
  }

  clear() {
    this.notices$.next([]);
    this.auditLogs$.next([]);
    this.smsLogs$.next([]);
  }

  // --- Notices ---
  async loadNotices(): Promise<Notice[]> {
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<Notice[]>>(`${this.API_BASE}/Notices`));
      if (res?.success && res.data) {
        this.notices$.next(res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('SystemStore loadNotices error:', e);
    }
    return this.notices$.value;
  }

  addNotice(notice: Partial<Notice>, authorName: string = 'Staff'): void {
    const payload = {
      title: notice.title || 'Untitled Notice',
      category: notice.category || 'General',
      targetAudience: notice.targetAudience || 'All',
      content: notice.content || '',
      isImportant: !!notice.isImportant,
      author: authorName
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
      author: authorName,
      branchId: this.campus.branchId || 'br-01'
    };
    const updated = [newNotice, ...this.notices$.value];
    this.notices$.next(updated);
  }

  // --- Audit Logs ---
  async loadAuditLogs(): Promise<AuditLog[]> {
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<AuditLog[]>>(`${this.API_BASE}/audit-logs`));
      if (res?.success && res.data) {
        this.auditLogs$.next(res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('SystemStore loadAuditLogs error:', e);
    }
    return this.auditLogs$.value;
  }

  logAudit(action: AuditLog['action'], module: string, details: string, userName: string = 'Staff', userRole: string = 'User'): void {
    const log: AuditLog = {
      id: 'aud-' + Date.now().toString().slice(-6),
      timestamp: new Date().toISOString(),
      userName,
      userRole,
      action,
      module,
      targetRecord: module,
      details,
      schoolScope: this.campus.branchId || 'Main Campus',
      branchId: this.campus.branchId || 'br-01'
    };
    this.auditLogs$.next([log, ...this.auditLogs$.value]);
  }

  // --- SMS Logs ---
  async loadSmsLogs(): Promise<SmsDispatchLog[]> {
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<SmsDispatchLog[]>>(`${this.API_BASE}/sms/logs`));
      if (res?.success && res.data) {
        this.smsLogs$.next(res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('SystemStore loadSmsLogs error:', e);
    }
    return this.smsLogs$.value;
  }

  sendSmsDispatch(recipientGroup: string, recipientCount: number, message: string, senderName: string = 'Principal Office'): void {
    const credits = Math.ceil(message.length / 160) * recipientCount;
    const newLog: SmsDispatchLog = {
      id: 'sms-' + Date.now().toString().slice(-5),
      recipientGroup,
      recipientCount,
      message,
      senderName,
      sentAt: new Date().toLocaleString('en-GB'),
      status: 'Delivered',
      creditsUsed: credits,
      branchId: this.campus.branchId
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
  }

  private smsTemplates$ = new BehaviorSubject<SmsTemplate[]>([]);

  getSmsTemplates$() { return this.smsTemplates$.asObservable(); }
  getSmsTemplates(): SmsTemplate[] { return this.smsTemplates$.value; }

  async loadSmsTemplates(): Promise<SmsTemplate[]> {
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<SmsTemplate[]>>(`${this.API_BASE}/sms/templates`));
      if (res?.success && Array.isArray(res.data)) {
        this.smsTemplates$.next(res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('SystemStore loadSmsTemplates error:', e);
    }
    return this.smsTemplates$.value;
  }

  // --- Role Analytics Dashboards ---
  async getPrincipalDashboard(): Promise<any> {
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<any>>(`${this.API_BASE}/dashboard/principal`));
      return res?.data;
    } catch (e) {
      console.warn('getPrincipalDashboard error:', e);
      return null;
    }
  }

  async getTeacherDashboard(teacherId?: string): Promise<any> {
    try {
      const url = teacherId ? `${this.API_BASE}/dashboard/teacher?teacherId=${teacherId}` : `${this.API_BASE}/dashboard/teacher`;
      const res = await firstValueFrom(this.http.get<ApiResponse<any>>(url));
      return res?.data;
    } catch (e) {
      console.warn('getTeacherDashboard error:', e);
      return null;
    }
  }

  async getAccountantDashboard(): Promise<any> {
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<any>>(`${this.API_BASE}/dashboard/accountant`));
      return res?.data;
    } catch (e) {
      console.warn('getAccountantDashboard error:', e);
      return null;
    }
  }

  async getSuperAdminDashboard(): Promise<any> {
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<any>>(`${this.API_BASE}/dashboard/super-admin`));
      return res?.data;
    } catch (e) {
      console.warn('getSuperAdminDashboard error:', e);
      return null;
    }
  }

  async getStudentDashboard(studentId?: string): Promise<any> {
    try {
      const url = studentId ? `${this.API_BASE}/dashboard/student?studentId=${studentId}` : `${this.API_BASE}/dashboard/student`;
      const res = await firstValueFrom(this.http.get<ApiResponse<any>>(url));
      return res?.data;
    } catch (e) {
      console.warn('getStudentDashboard error:', e);
      return null;
    }
  }

  async getGuardianDashboard(guardianUserId?: string): Promise<any> {
    try {
      const url = guardianUserId ? `${this.API_BASE}/dashboard/guardian?guardianUserId=${guardianUserId}` : `${this.API_BASE}/dashboard/guardian`;
      const res = await firstValueFrom(this.http.get<ApiResponse<any>>(url));
      return res?.data;
    } catch (e) {
      console.warn('getGuardianDashboard error:', e);
      return null;
    }
  }
}
