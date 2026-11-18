import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminStoreService, SystemStoreService } from '../../../core/services/stores';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/components/icon.component';

@Component({
  selector: 'app-principal-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <div class="principal-dashboard animate-fade-in">
      <!-- 1. HEADER & EXECUTIVE PROFILE STRIP -->
      <div class="executive-header card mb-4">
        <div class="header-content">
          <div class="profile-meta flex items-center gap-4">
            <div class="avatar-box">
              <img [src]="currentUser?.avatar || 'assets/default-avatar.png'" class="avatar-img" alt="Principal" />
              <span class="online-indicator"></span>
            </div>
            <div>
              <div class="role-badge">
                <app-icon name="award" [size]="14"></app-icon>
                <span>ACADEMIC EXECUTIVE & PRINCIPAL OVERSIGHT (প্রধান শিক্ষক ড্যাশবোর্ড)</span>
              </div>
              <h1 class="exec-title">{{ currentUser?.fullName || 'Headmaster & Principal' }}</h1>
              <p class="exec-subtitle">
                Institutional oversight for <strong>{{ getActiveBranchName() }}</strong>. Real-time class attendance registers, faculty leave approvals, exam pass rates, and syllabus discipline.
              </p>
            </div>
          </div>

          <div class="header-quick-actions">
            <a routerLink="/app/attendance/entry" class="btn btn-outline flex items-center gap-1.5" title="Record or inspect today's student attendance">
              <app-icon name="clipboard-check" [size]="16" class="text-emerald"></app-icon>
              <span>Take Attendance</span>
            </a>
            <a routerLink="/app/teachers/leave" class="btn btn-outline flex items-center gap-1.5 relative" title="Approve teacher leave requests">
              <app-icon name="calendar" [size]="16" class="text-indigo"></app-icon>
              <span>Review Leaves</span>
              <span *ngIf="data?.kpis?.pendingTeacherLeavesCount > 0" class="badge-counter">{{ data.kpis.pendingTeacherLeavesCount }}</span>
            </a>
            <a routerLink="/app/exams/marksheet" class="btn btn-primary flex items-center gap-1.5" title="Review final marks and publish report cards">
              <app-icon name="file-text" [size]="16"></app-icon>
              <span>Exam Marksheets</span>
            </a>
          </div>
        </div>
      </div>

      <!-- 2. CRITICAL ACTION ALERTS -->
      <div class="critical-alerts-container mb-4" *ngIf="data?.criticalAlerts?.length > 0">
        <div *ngFor="let alert of data.criticalAlerts" class="alert-banner" [class.alert-danger]="alert.severity === 'Danger'" [class.alert-warning]="alert.severity === 'Warning'">
          <div class="alert-icon-box">
            <app-icon [name]="alert.severity === 'Danger' ? 'alert-triangle' : 'info'" [size]="20"></app-icon>
          </div>
          <div class="alert-text-group">
            <h4 class="alert-title">{{ alert.title }}</h4>
            <p class="alert-msg">{{ alert.message }}</p>
          </div>
          <a [routerLink]="alert.actionRoute" class="alert-action-btn">
            <span>{{ alert.actionText }}</span>
            <app-icon name="arrow-right" [size]="14"></app-icon>
          </a>
        </div>
      </div>

      <!-- 3. TOP STRATEGIC KPI CARDS -->
      <div class="kpi-grid-4 mb-4">
        <!-- KPI 1: Campus Attendance -->
        <div class="kpi-card highlight-emerald">
          <div class="kpi-top">
            <div class="kpi-icon-wrap bg-emerald-subtle">
              <app-icon name="users" [size]="22" class="text-emerald"></app-icon>
            </div>
            <span class="kpi-status-tag" [class.tag-warning]="(data?.kpis?.todayAttendanceRate || 0) < 80">
              {{ (data?.kpis?.todayAttendanceRate || 0) >= 80 ? 'Optimal' : 'Shortage' }}
            </span>
          </div>
          <div class="kpi-val text-emerald">{{ data?.kpis?.todayAttendanceRate || 0 }}%</div>
          <div class="kpi-label">Today's Campus Attendance</div>
          <div class="kpi-sub">
            {{ data?.kpis?.todayPresentCount || 0 }} Present of {{ data?.kpis?.totalStudents || 0 }} Active Students
          </div>
        </div>

        <!-- KPI 2: Unsubmitted Attendance -->
        <div class="kpi-card" [class.highlight-rose]="(data?.kpis?.unsubmittedAttendanceSections || 0) > 0">
          <div class="kpi-top">
            <div class="kpi-icon-wrap bg-rose-subtle">
              <app-icon name="clipboard" [size]="22" class="text-rose"></app-icon>
            </div>
            <span class="kpi-status-tag" [class.tag-danger]="(data?.kpis?.unsubmittedAttendanceSections || 0) > 0">
              {{ (data?.kpis?.unsubmittedAttendanceSections || 0) > 0 ? 'Pending' : 'All Clear' }}
            </span>
          </div>
          <div class="kpi-val" [class.text-rose]="(data?.kpis?.unsubmittedAttendanceSections || 0) > 0">
            {{ data?.kpis?.unsubmittedAttendanceSections || 0 }}
          </div>
          <div class="kpi-label">Unsubmitted Class Registers</div>
          <div class="kpi-sub">Classes lacking today's attendance entry</div>
        </div>

        <!-- KPI 3: Teacher Leaves Pending -->
        <div class="kpi-card highlight-indigo">
          <div class="kpi-top">
            <div class="kpi-icon-wrap bg-indigo-subtle">
              <app-icon name="user-check" [size]="22" class="text-indigo"></app-icon>
            </div>
            <span class="kpi-status-tag tag-indigo">Faculty</span>
          </div>
          <div class="kpi-val text-indigo">{{ data?.kpis?.pendingTeacherLeavesCount || 0 }}</div>
          <div class="kpi-label">Pending Faculty Leaves</div>
          <div class="kpi-sub">Awaiting Headmaster sanction & substitute</div>
        </div>

        <!-- KPI 4: Latest Exam Pass Rate & GPA -->
        <div class="kpi-card highlight-blue">
          <div class="kpi-top">
            <div class="kpi-icon-wrap bg-blue-subtle">
              <app-icon name="award" [size]="22" class="text-blue"></app-icon>
            </div>
            <span class="kpi-status-tag tag-blue">GPA {{ data?.kpis?.latestExamAverageGpa || 0 }}</span>
          </div>
          <div class="kpi-val text-blue">{{ data?.latestExamAnalytics?.passRate || 0 }}%</div>
          <div class="kpi-label">Term Exam Pass Rate</div>
          <div class="kpi-sub">
            {{ data?.latestExamAnalytics?.passCount || 0 }} Passed / {{ data?.latestExamAnalytics?.failCount || 0 }} Failed
          </div>
        </div>
      </div>

      <!-- 4. MAIN ANALYTICS GRID: CLASS ATTENDANCE & PENDING LEAVES -->
      <div class="grid-2-col mb-4">
        <!-- Class-wise Attendance Snapshot -->
        <div class="card p-4">
          <div class="card-header flex justify-between items-center mb-3">
            <div>
              <h3 class="card-title flex items-center gap-2">
                <app-icon name="bar-chart-2" [size]="18" class="text-emerald"></app-icon>
                <span>Class-wise Attendance Live Audit</span>
              </h3>
              <p class="card-subtitle">Real-time attendance register status across all institutional classes.</p>
            </div>
            <a routerLink="/app/attendance/reports" class="btn btn-sm btn-outline">Full Attendance Matrix</a>
          </div>

          <div class="table-responsive">
            <table class="table-compact">
              <thead>
                <tr>
                  <th>Class</th>
                  <th class="text-center">Enrolled</th>
                  <th class="text-center">Present</th>
                  <th>Attendance Ratio</th>
                  <th class="text-right">Register Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let cls of data?.classAttendanceBreakdown">
                  <td><strong>{{ cls.className }}</strong></td>
                  <td class="text-center">{{ cls.totalStudents }}</td>
                  <td class="text-center font-bold text-emerald">{{ cls.presentToday }}</td>
                  <td>
                    <div class="progress-bar-wrap">
                      <div class="progress-bar-fill" [style.width.%]="cls.attendanceRate" [class.bg-danger]="cls.attendanceRate < 75"></div>
                    </div>
                    <span class="text-xs font-semibold">{{ cls.attendanceRate }}%</span>
                  </td>
                  <td class="text-right">
                    <span class="badge" [class.badge-success]="cls.hasSubmitted" [class.badge-danger]="!cls.hasSubmitted">
                      {{ cls.hasSubmitted ? '✓ Recorded' : '✕ Missing' }}
                    </span>
                  </td>
                </tr>
                <tr *ngIf="!data?.classAttendanceBreakdown || data.classAttendanceBreakdown.length === 0">
                  <td colspan="5" class="text-center text-muted py-3">No classes registered in this campus.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pending Teacher Leaves & Approvals -->
        <div class="card p-4">
          <div class="card-header flex justify-between items-center mb-3">
            <div>
              <h3 class="card-title flex items-center gap-2">
                <app-icon name="calendar" [size]="18" class="text-indigo"></app-icon>
                <span>Faculty Leave Applications (শিক্ষক ছুটি আবেদন)</span>
              </h3>
              <p class="card-subtitle">Pending teacher leave applications awaiting administrative sanction.</p>
            </div>
            <a routerLink="/app/teachers/leave" class="btn btn-sm btn-outline">Leave Desk</a>
          </div>

          <div class="leave-list" *ngIf="data?.pendingTeacherLeaves?.length > 0; else noLeaves">
            <div *ngFor="let leave of data.pendingTeacherLeaves" class="leave-item border rounded-lg p-3 mb-2 flex items-center justify-between">
              <div>
                <div class="font-bold text-slate-800">{{ leave.teacherName }}</div>
                <div class="text-xs text-slate-500">
                  {{ leave.department }} • <strong>{{ leave.leaveType }}</strong> ({{ leave.totalDays }} day{{ leave.totalDays > 1 ? 's' : '' }})
                </div>
                <div class="text-xs text-slate-400 mt-0.5">
                  Duration: {{ leave.startDate | date:'dd MMM' }} - {{ leave.endDate | date:'dd MMM yyyy' }}
                  <span *ngIf="leave.reason">• "{{ leave.reason }}"</span>
                </div>
              </div>
              <div class="leave-actions flex gap-1.5">
                <a routerLink="/app/teachers/leave" class="btn btn-sm btn-outline text-emerald" title="Approve Leave">Approve</a>
              </div>
            </div>
          </div>
          <ng-template #noLeaves>
            <div class="empty-box py-5 text-center text-muted">
              <app-icon name="check-circle" [size]="32" class="text-emerald mb-2"></app-icon>
              <div class="font-medium text-slate-700">All Faculty Leave Requests Processed</div>
              <p class="text-xs text-slate-400">There are no pending teacher leave applications at this time.</p>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- 5. EXAM PERFORMANCE & GRADE DISTRIBUTION -->
      <div class="card p-4 mb-4" *ngIf="data?.latestExamAnalytics">
        <div class="card-header flex justify-between items-center mb-3">
          <div>
            <h3 class="card-title flex items-center gap-2">
              <app-icon name="award" [size]="18" class="text-blue"></app-icon>
              <span>{{ data.latestExamAnalytics.examName || 'Latest Term Examination' }} Performance Analytics</span>
            </h3>
            <p class="card-subtitle">Pass/Fail ratio and institutional letter grade distribution across evaluated marks.</p>
          </div>
          <a routerLink="/app/exams/marksheet" class="btn btn-sm btn-outline">View Marksheets</a>
        </div>

        <div class="grade-distribution-grid">
          <div *ngFor="let grade of ['A+', 'A', 'A-', 'B', 'C', 'D', 'F']" class="grade-pill-card" [class.card-failing]="grade === 'F'">
            <div class="grade-pill-label">{{ grade }}</div>
            <div class="grade-pill-count">{{ data.latestExamAnalytics.gradeDistribution?.[grade] || 0 }}</div>
            <div class="grade-pill-sub">Students</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .principal-dashboard {
      animation: fadeIn 0.25s ease-in-out;
    }
    .executive-header {
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
    .avatar-box {
      position: relative;
      width: 60px;
      height: 60px;
    }
    .avatar-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #6366f1;
    }
    .online-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      background-color: #10b981;
      border: 2px solid #fff;
      border-radius: 50%;
    }
    .role-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      background-color: #e0e7ff;
      color: #4338ca;
      font-size: 11px;
      font-weight: 700;
      border-radius: 9999px;
      margin-bottom: 4px;
      letter-spacing: 0.5px;
    }
    .exec-title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .exec-subtitle {
      font-size: 13px;
      color: #64748b;
      margin: 4px 0 0 0;
    }
    .header-quick-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .badge-counter {
      position: absolute;
      top: -6px;
      right: -6px;
      background-color: #ef4444;
      color: white;
      font-size: 10px;
      font-weight: bold;
      padding: 1px 6px;
      border-radius: 9999px;
    }

    /* Alerts */
    .alert-banner {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 18px;
      border-radius: 10px;
      margin-bottom: 10px;
    }
    .alert-danger {
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }
    .alert-warning {
      background-color: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
    }
    .alert-icon-box { flex-shrink: 0; }
    .alert-text-group { flex-grow: 1; }
    .alert-title { font-size: 14px; font-weight: 700; margin: 0; }
    .alert-msg { font-size: 12px; margin: 2px 0 0 0; }
    .alert-action-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      background-color: white;
      border: 1px solid currentColor;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
      color: inherit;
    }

    /* KPI Grid */
    .kpi-grid-4 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 16px;
    }
    .kpi-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px;
    }
    .kpi-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .kpi-icon-wrap {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .bg-emerald-subtle { background-color: #d1fae5; }
    .bg-rose-subtle { background-color: #ffe4e6; }
    .bg-indigo-subtle { background-color: #e0e7ff; }
    .bg-blue-subtle { background-color: #dbeafe; }
    .text-emerald { color: #10b981; }
    .text-rose { color: #f43f5e; }
    .text-indigo { color: #6366f1; }
    .text-blue { color: #3b82f6; }
    .kpi-status-tag {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 9999px;
      background-color: #f1f5f9;
      color: #475569;
    }
    .tag-danger { background-color: #fee2e2; color: #b91c1c; }
    .tag-warning { background-color: #fef3c7; color: #d97706; }
    .tag-indigo { background-color: #e0e7ff; color: #4338ca; }
    .tag-blue { background-color: #dbeafe; color: #1d4ed8; }
    .kpi-val { font-size: 28px; font-weight: 800; line-height: 1.1; margin-bottom: 4px; }
    .kpi-label { font-size: 13px; font-weight: 600; color: #475569; }
    .kpi-sub { font-size: 11px; color: #94a3b8; margin-top: 4px; }

    /* Main Grid */
    .grid-2-col {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: 16px;
    }
    @media (max-width: 1024px) {
      .grid-2-col { grid-template-columns: 1fr; }
    }
    .card-title { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0; }
    .card-subtitle { font-size: 12px; color: #64748b; margin: 2px 0 0 0; }

    /* Tables & Progress */
    .table-compact {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .table-compact th {
      padding: 8px 10px;
      background-color: #f8fafc;
      font-weight: 600;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
    }
    .table-compact td {
      padding: 10px;
      border-bottom: 1px solid #f1f5f9;
    }
    .progress-bar-wrap {
      width: 80px;
      height: 6px;
      background-color: #e2e8f0;
      border-radius: 9999px;
      overflow: hidden;
      display: inline-block;
      margin-right: 6px;
      vertical-align: middle;
    }
    .progress-bar-fill {
      height: 100%;
      background-color: #10b981;
      border-radius: 9999px;
    }
    .bg-danger { background-color: #ef4444 !important; }

    /* Grade distribution */
    .grade-distribution-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 12px;
    }
    @media (max-width: 768px) {
      .grade-distribution-grid { grid-template-columns: repeat(4, 1fr); }
    }
    .grade-pill-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 8px;
      text-align: center;
    }
    .card-failing {
      background-color: #fef2f2;
      border-color: #fecaca;
    }
    .grade-pill-label {
      font-size: 16px;
      font-weight: 800;
      color: #334155;
    }
    .card-failing .grade-pill-label { color: #dc2626; }
    .grade-pill-count {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      margin: 4px 0;
    }
    .grade-pill-sub {
      font-size: 10px;
      color: #94a3b8;
      text-transform: uppercase;
    }
  `]
})
export class PrincipalDashboardComponent implements OnInit {
  private adminStore = inject(AdminStoreService);
  private systemStore = inject(SystemStoreService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
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
      this.data = await this.systemStore.getPrincipalDashboard();
    } catch (e) {
      console.warn('Principal dashboard load error:', e);
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }
}
