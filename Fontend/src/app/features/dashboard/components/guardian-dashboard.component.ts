import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminStoreService, SystemStoreService } from '../../../core/services/stores';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon.component';

@Component({
  selector: 'app-guardian-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <div class="guardian-dashboard animate-fade-in">
      <!-- 1. GUARDIAN HEADER -->
      <div class="guardian-header card mb-4">
        <div class="header-content">
          <div class="profile-meta flex items-center gap-4">
            <div class="avatar-box">
              <img [src]="currentUser?.avatar || 'assets/default-avatar.png'" class="avatar-img" alt="Guardian" />
              <span class="online-indicator"></span>
            </div>
            <div>
              <div class="role-badge">
                <app-icon name="heart" [size]="14"></app-icon>
                <span>PARENT & GUARDIAN ACADEMIC PORTAL (অভিভাবক পোর্টাল)</span>
              </div>
              <h1 class="exec-title">{{ currentUser?.fullName || 'Parent / Guardian' }}</h1>
              <p class="exec-subtitle">
                Monitoring ward: <strong>{{ data?.ward?.fullName || 'Student' }}</strong> ({{ data?.ward?.className || 'Class' }} - Roll #{{ data?.ward?.rollNo || '01' }}) at <strong>{{ getActiveBranchName() }}</strong>.
              </p>
            </div>
          </div>

          <div class="header-quick-actions">
            <a routerLink="/app/finance/collection" class="btn btn-primary flex items-center gap-1.5" title="Settle student fee via bKash or Nagad">
              <app-icon name="credit-card" [size]="16"></app-icon>
              <span>Pay Fees (bKash/Nagad)</span>
            </a>
            <a routerLink="/app/exams/marksheet" class="btn btn-outline flex items-center gap-1.5" title="View terminal report card">
              <app-icon name="award" [size]="16" class="text-blue"></app-icon>
              <span>Report Card</span>
            </a>
            <a routerLink="/app/attendance/reports" class="btn btn-outline flex items-center gap-1.5" title="Inspect daily check-in history">
              <app-icon name="calendar" [size]="16" class="text-emerald"></app-icon>
              <span>Attendance History</span>
            </a>
          </div>
        </div>
      </div>

      <!-- 2. WARD'S TODAY IN/OUT SAFETY STATUS STRIP -->
      <div class="card p-3 mb-4 flex items-center justify-between border" [class.bg-emerald-50]="data?.todayAttendanceStatus === 'Present'" [class.bg-rose-50]="data?.todayAttendanceStatus === 'Absent'">
        <div class="flex items-center gap-3">
          <div class="status-icon-circle w-10 h-10 rounded-full flex items-center justify-center" [class.bg-emerald-100]="data?.todayAttendanceStatus === 'Present'" [class.bg-rose-100]="data?.todayAttendanceStatus === 'Absent'">
            <app-icon [name]="data?.todayAttendanceStatus === 'Present' ? 'check-circle' : 'alert-circle'" [size]="22" [class.text-emerald]="data?.todayAttendanceStatus === 'Present'" [class.text-rose]="data?.todayAttendanceStatus === 'Absent'"></app-icon>
          </div>
          <div>
            <div class="font-bold text-slate-800 text-sm">
              Today's Attendance Status: 
              <span [class.text-emerald]="data?.todayAttendanceStatus === 'Present'" [class.text-rose]="data?.todayAttendanceStatus === 'Absent'">
                {{ data?.todayAttendanceStatus }}
              </span>
            </div>
            <div class="text-xs text-slate-500">
              Registration Time: <strong>{{ data?.todayAttendanceTime }}</strong> • Campus Gate Check-in
            </div>
          </div>
        </div>
        <div>
          <span class="badge" [class.badge-success]="data?.todayAttendanceStatus === 'Present'" [class.badge-danger]="data?.todayAttendanceStatus === 'Absent'">
            {{ data?.todayAttendanceStatus === 'Present' ? 'In Campus' : 'Not Detected' }}
          </span>
        </div>
      </div>

      <!-- 3. TOP KPI CARDS -->
      <div class="kpi-grid-4 mb-4">
        <!-- KPI 1: Attendance Rate -->
        <div class="kpi-card highlight-emerald">
          <div class="kpi-top">
            <div class="kpi-icon-wrap bg-emerald-subtle">
              <app-icon name="users" [size]="22" class="text-emerald"></app-icon>
            </div>
            <span class="kpi-status-tag tag-success">Term Ratio</span>
          </div>
          <div class="kpi-val text-emerald">{{ data?.ward?.attendanceRate || 0 }}%</div>
          <div class="kpi-label">Ward's Attendance Rate</div>
          <div class="kpi-sub">{{ data?.ward?.totalPresentDays || 0 }} Days Present</div>
        </div>

        <!-- KPI 2: Outstanding Fee Due -->
        <div class="kpi-card" [class.highlight-emerald]="(data?.ward?.totalDueFee || 0) === 0" [class.highlight-rose]="(data?.ward?.totalDueFee || 0) > 0">
          <div class="kpi-top">
            <div class="kpi-icon-wrap" [class.bg-emerald-subtle]="(data?.ward?.totalDueFee || 0) === 0" [class.bg-rose-subtle]="(data?.ward?.totalDueFee || 0) > 0">
              <app-icon name="circle-dollar-sign" [size]="22" [class.text-emerald]="(data?.ward?.totalDueFee || 0) === 0" [class.text-rose]="(data?.ward?.totalDueFee || 0) > 0"></app-icon>
            </div>
            <span class="kpi-status-tag" [class.tag-success]="(data?.ward?.totalDueFee || 0) === 0" [class.tag-danger]="(data?.ward?.totalDueFee || 0) > 0">
              {{ (data?.ward?.totalDueFee || 0) === 0 ? 'Settled' : 'Action Required' }}
            </span>
          </div>
          <div class="kpi-val" [class.text-emerald]="(data?.ward?.totalDueFee || 0) === 0" [class.text-rose]="(data?.ward?.totalDueFee || 0) > 0">
            ৳ {{ (data?.ward?.totalDueFee || 0).toLocaleString() }}
          </div>
          <div class="kpi-label">Outstanding Tuition Due</div>
          <div class="kpi-sub">Payable via bKash / Nagad wallet</div>
        </div>

        <!-- KPI 3: Terminal Exam GPA -->
        <div class="kpi-card highlight-blue">
          <div class="kpi-top">
            <div class="kpi-icon-wrap bg-blue-subtle">
              <app-icon name="award" [size]="22" class="text-blue"></app-icon>
            </div>
            <span class="kpi-status-tag tag-blue">{{ data?.ward?.latestResult?.letterGrade || 'A' }}</span>
          </div>
          <div class="kpi-val text-blue">GPA {{ data?.ward?.latestResult?.gpa || '4.00' }}</div>
          <div class="kpi-label">Academic Terminal GPA</div>
          <div class="kpi-sub">Position: #{{ data?.ward?.latestResult?.positionInClass || 1 }} in class</div>
        </div>

        <!-- KPI 4: Today's Routine Periods -->
        <div class="kpi-card highlight-indigo">
          <div class="kpi-top">
            <div class="kpi-icon-wrap bg-indigo-subtle">
              <app-icon name="book-open" [size]="22" class="text-indigo"></app-icon>
            </div>
            <span class="kpi-status-tag tag-indigo">Today</span>
          </div>
          <div class="kpi-val text-indigo">{{ data?.ward?.todayRoutine?.length || 0 }} Periods</div>
          <div class="kpi-label">Today's Class Schedule</div>
          <div class="kpi-sub">Subject periods scheduled today</div>
        </div>
      </div>

      <!-- 4. NOTICES & ANNOUNCEMENTS FEED -->
      <div class="card p-4 mb-4" *ngIf="data?.urgentNotices?.length > 0">
        <div class="card-header flex justify-between items-center mb-3">
          <div>
            <h3 class="card-title flex items-center gap-2">
              <app-icon name="bell" [size]="18" class="text-amber-500"></app-icon>
              <span>School Notices & Circulars (প্রাতিষ্ঠানিক নোটিশ বোর্ড)</span>
            </h3>
            <p class="card-subtitle">Official announcements regarding academic terms, holidays, and fee schedules.</p>
          </div>
          <a routerLink="/app/communication/notice" class="btn btn-sm btn-outline">Notice Archive</a>
        </div>

        <div class="notice-list">
          <div *ngFor="let n of data.urgentNotices" class="p-3 mb-2 rounded-lg border bg-slate-50 flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="badge badge-warning" *ngIf="n.isImportant">Important</span>
                <strong class="text-slate-800 text-sm">{{ n.title }}</strong>
              </div>
              <p class="text-xs text-slate-600 mt-1 mb-1">{{ n.content }}</p>
              <div class="text-xs text-slate-400">Published: {{ n.publishedDate | date:'mediumDate' }} by {{ n.author }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .guardian-dashboard { animation: fadeIn 0.25s ease-in-out; }
    .guardian-header {
      padding: 24px;
      background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%);
      border: 1px solid #e2e8f0;
      border-radius: 14px;
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }
    .avatar-box { position: relative; width: 60px; height: 60px; }
    .avatar-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 2px solid #db2777; }
    .online-indicator {
      position: absolute; bottom: 2px; right: 2px; width: 12px; height: 12px;
      background-color: #10b981; border: 2px solid #fff; border-radius: 50%;
    }
    .role-badge {
      display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px;
      background-color: #fce7f3; color: #be185d; font-size: 11px; font-weight: 700;
      border-radius: 9999px; margin-bottom: 4px; letter-spacing: 0.5px;
    }
    .exec-title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; }
    .exec-subtitle { font-size: 13px; color: #64748b; margin: 4px 0 0 0; }
    .header-quick-actions { display: flex; gap: 10px; flex-wrap: wrap; }

    /* KPI Grid */
    .kpi-grid-4 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 16px;
    }
    .kpi-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; }
    .kpi-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .kpi-icon-wrap { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .bg-emerald-subtle { background-color: #d1fae5; }
    .bg-rose-subtle { background-color: #ffe4e6; }
    .bg-blue-subtle { background-color: #dbeafe; }
    .bg-indigo-subtle { background-color: #e0e7ff; }
    .text-emerald { color: #10b981; }
    .text-rose { color: #f43f5e; }
    .text-blue { color: #3b82f6; }
    .text-indigo { color: #6366f1; }
    .kpi-status-tag { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; }
    .tag-success { background-color: #d1fae5; color: #047857; }
    .tag-danger { background-color: #fee2e2; color: #b91c1c; }
    .tag-blue { background-color: #dbeafe; color: #1d4ed8; }
    .tag-indigo { background-color: #e0e7ff; color: #4338ca; }
    .kpi-val { font-size: 24px; font-weight: 800; line-height: 1.1; margin-bottom: 4px; }
    .kpi-label { font-size: 13px; font-weight: 600; color: #475569; }
    .kpi-sub { font-size: 11px; color: #94a3b8; margin-top: 4px; }
    .bg-emerald-50 { background-color: #ecfdf5; }
    .bg-rose-50 { background-color: #fff1f2; }
    .bg-emerald-100 { background-color: #d1fae5; }
    .bg-rose-100 { background-color: #ffe4e6; }
  `]
})
export class GuardianDashboardComponent implements OnInit {
  private adminStore = inject(AdminStoreService);
  private systemStore = inject(SystemStoreService);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  currentUser: any;
  data: any = null;
  isLoading = true;

  getActiveBranchName(): string {
    return this.adminStore.getActiveBranchName();
  }

  async ngOnInit() {
    this.auth.getCurrentUser$().subscribe(u => {
      this.currentUser = u;
      this.cdr.markForCheck();
    });

    await this.loadDashboardData();
  }

  async loadDashboardData() {
    this.isLoading = true;
    try {
      this.data = await this.systemStore.getGuardianDashboard();
    } catch (e) {
      console.warn('Guardian dashboard load error:', e);
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }
}
