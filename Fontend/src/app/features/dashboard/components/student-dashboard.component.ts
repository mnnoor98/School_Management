import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SystemStoreService } from '../../../core/services/stores';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon.component';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <div class="student-dashboard animate-fade-in">
      <!-- 1. STUDENT PROFILE HEADER -->
      <div class="student-header card mb-4">
        <div class="header-content">
          <div class="profile-meta flex items-center gap-4">
            <div class="avatar-box">
              <img [src]="currentUser?.avatar || 'assets/default-avatar.png'" class="avatar-img" alt="Student" />
              <span class="online-indicator"></span>
            </div>
            <div>
              <div class="role-badge">
                <app-icon name="book-open" [size]="14"></app-icon>
                <span>STUDENT ACADEMIC PORTAL (শিক্ষার্থী পোর্টাল)</span>
              </div>
              <h1 class="exec-title">{{ data?.fullName || currentUser?.fullName || 'Student Dossier' }}</h1>
              <p class="exec-subtitle">
                {{ data?.className || 'Class 10' }} • Section {{ data?.sectionName || 'A' }} • Roll #{{ data?.rollNo || '01' }} • Admission: <span class="font-mono">{{ data?.admissionNo || 'ADM-2026-001' }}</span>
              </p>
            </div>
          </div>

          <div class="header-quick-actions">
            <a routerLink="/app/exams/marksheet" class="btn btn-primary flex items-center gap-1.5" title="View examination marksheet">
              <app-icon name="award" [size]="16"></app-icon>
              <span>My Marksheet</span>
            </a>
            <a routerLink="/app/finance/collection" class="btn btn-outline flex items-center gap-1.5" title="View fee invoices and receipts">
              <app-icon name="credit-card" [size]="16" class="text-pink"></app-icon>
              <span>Fee Invoices</span>
            </a>
            <a routerLink="/app/academic/routine" class="btn btn-outline flex items-center gap-1.5" title="View class schedule">
              <app-icon name="calendar" [size]="16" class="text-indigo"></app-icon>
              <span>Class Timetable</span>
            </a>
          </div>
        </div>
      </div>

      <!-- 2. ATTENDANCE SHORTAGE WARNING (If < 75%) -->
      <div class="alert-banner alert-danger mb-4" *ngIf="data?.isAttendanceShortage">
        <div class="alert-icon-box">
          <app-icon name="alert-triangle" [size]="22"></app-icon>
        </div>
        <div class="alert-text-group">
          <h4 class="alert-title">Attendance Shortage Alert (উপস্থিতি ঘাটতি সতর্কতা)</h4>
          <p class="alert-msg">
            Your cumulative attendance is <strong>{{ data.attendanceRate }}%</strong>, which is below the mandatory 75% institutional requirement for board exam eligibility. Please attend remaining classes diligently.
          </p>
        </div>
      </div>

      <!-- 3. KPI CARDS -->
      <div class="kpi-grid-4 mb-4">
        <!-- KPI 1: Attendance Ratio -->
        <div class="kpi-card" [class.highlight-emerald]="!data?.isAttendanceShortage" [class.highlight-rose]="data?.isAttendanceShortage">
          <div class="kpi-top">
            <div class="kpi-icon-wrap" [class.bg-emerald-subtle]="!data?.isAttendanceShortage" [class.bg-rose-subtle]="data?.isAttendanceShortage">
              <app-icon name="clipboard-check" [size]="22" [class.text-emerald]="!data?.isAttendanceShortage" [class.text-rose]="data?.isAttendanceShortage"></app-icon>
            </div>
            <span class="kpi-status-tag" [class.tag-success]="!data?.isAttendanceShortage" [class.tag-danger]="data?.isAttendanceShortage">
              {{ data?.isAttendanceShortage ? 'Shortage' : 'Eligible' }}
            </span>
          </div>
          <div class="kpi-val" [class.text-emerald]="!data?.isAttendanceShortage" [class.text-rose]="data?.isAttendanceShortage">
            {{ data?.attendanceRate || 0 }}%
          </div>
          <div class="kpi-label">Cumulative Attendance</div>
          <div class="kpi-sub">{{ data?.totalPresentDays || 0 }} Present of {{ data?.totalDaysHeld || 0 }} Working Days</div>
        </div>

        <!-- KPI 2: Latest Term GPA -->
        <div class="kpi-card highlight-blue">
          <div class="kpi-top">
            <div class="kpi-icon-wrap bg-blue-subtle">
              <app-icon name="award" [size]="22" class="text-blue"></app-icon>
            </div>
            <span class="kpi-status-tag tag-blue">{{ data?.latestResult?.letterGrade || 'A' }}</span>
          </div>
          <div class="kpi-val text-blue">GPA {{ data?.latestResult?.gpa || '4.00' }}</div>
          <div class="kpi-label">Latest Exam Result</div>
          <div class="kpi-sub">{{ data?.latestResult?.examName || 'First Term Exam' }}</div>
        </div>

        <!-- KPI 3: Outstanding Fee Due -->
        <div class="kpi-card" [class.highlight-emerald]="(data?.totalDueFee || 0) === 0" [class.highlight-rose]="(data?.totalDueFee || 0) > 0">
          <div class="kpi-top">
            <div class="kpi-icon-wrap" [class.bg-emerald-subtle]="(data?.totalDueFee || 0) === 0" [class.bg-rose-subtle]="(data?.totalDueFee || 0) > 0">
              <app-icon name="circle-dollar-sign" [size]="22" [class.text-emerald]="(data?.totalDueFee || 0) === 0" [class.text-rose]="(data?.totalDueFee || 0) > 0"></app-icon>
            </div>
            <span class="kpi-status-tag" [class.tag-success]="(data?.totalDueFee || 0) === 0" [class.tag-danger]="(data?.totalDueFee || 0) > 0">
              {{ (data?.totalDueFee || 0) === 0 ? 'Clear' : 'Due' }}
            </span>
          </div>
          <div class="kpi-val" [class.text-emerald]="(data?.totalDueFee || 0) === 0" [class.text-rose]="(data?.totalDueFee || 0) > 0">
            ৳ {{ (data?.totalDueFee || 0).toLocaleString() }}
          </div>
          <div class="kpi-label">Outstanding Institutional Fee</div>
          <div class="kpi-sub">Tuition & term exam vouchers</div>
        </div>

        <!-- KPI 4: Class Position -->
        <div class="kpi-card highlight-indigo">
          <div class="kpi-top">
            <div class="kpi-icon-wrap bg-indigo-subtle">
              <app-icon name="star" [size]="22" class="text-indigo"></app-icon>
            </div>
            <span class="kpi-status-tag tag-indigo">Class Rank</span>
          </div>
          <div class="kpi-val text-indigo">#{{ data?.latestResult?.positionInClass || 1 }}</div>
          <div class="kpi-label">Merit Position</div>
          <div class="kpi-sub">Based on cumulative evaluation marks</div>
        </div>
      </div>

      <!-- 4. TODAY'S CLASS SCHEDULE & UPCOMING EXAMS -->
      <div class="grid-2-col mb-4">
        <!-- Today's Routine Periods -->
        <div class="card p-4">
          <div class="card-header flex justify-between items-center mb-3">
            <div>
              <h3 class="card-title flex items-center gap-2">
                <app-icon name="clock" [size]="18" class="text-indigo"></app-icon>
                <span>Today's Class Schedule (আজকের ক্লাস রুটিন)</span>
              </h3>
              <p class="card-subtitle">Daily subject periods and allocated classroom rooms.</p>
            </div>
            <a routerLink="/app/academic/routine" class="btn btn-sm btn-outline">Full Timetable</a>
          </div>

          <div class="routine-list" *ngIf="data?.todayRoutine?.length > 0; else noRoutine">
            <div *ngFor="let p of data.todayRoutine" class="p-3 mb-2 rounded-lg border bg-slate-50 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="font-bold text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">Period {{ p.periodNumber }}</span>
                <div>
                  <strong class="text-slate-800 text-sm">{{ p.subjectName }}</strong>
                  <div class="text-xs text-slate-500">{{ p.startTime }} - {{ p.endTime }} • Room: <strong>{{ p.roomNumber }}</strong></div>
                </div>
              </div>
            </div>
          </div>
          <ng-template #noRoutine>
            <div class="py-5 text-center text-muted">
              <app-icon name="coffee" [size]="32" class="text-indigo mb-2"></app-icon>
              <div class="font-medium text-slate-700">No Routine Periods Scheduled Today</div>
            </div>
          </ng-template>
        </div>

        <!-- Upcoming Exam Timetable -->
        <div class="card p-4">
          <div class="card-header flex justify-between items-center mb-3">
            <div>
              <h3 class="card-title flex items-center gap-2">
                <app-icon name="calendar" [size]="18" class="text-blue"></app-icon>
                <span>Upcoming Examination Timetable</span>
              </h3>
              <p class="card-subtitle">Official date sheet and examination room allocations.</p>
            </div>
            <a routerLink="/app/exams/schedules" class="btn btn-sm btn-outline">Date Sheet</a>
          </div>

          <div class="exam-list" *ngIf="data?.upcomingExams?.length > 0; else noExams">
            <div *ngFor="let ex of data.upcomingExams" class="p-3 mb-2 rounded-lg border bg-slate-50 flex items-center justify-between">
              <div>
                <strong class="text-slate-800 text-sm">{{ ex.subjectName }}</strong>
                <div class="text-xs text-slate-500">Date: {{ ex.examDate | date:'fullDate' }} • Time: {{ ex.startTime }} - {{ ex.endTime }}</div>
              </div>
              <div class="text-right">
                <span class="badge badge-info font-mono">Room {{ ex.roomNumber }}</span>
              </div>
            </div>
          </div>
          <ng-template #noExams>
            <div class="py-5 text-center text-muted">
              <app-icon name="check-circle" [size]="32" class="text-emerald mb-2"></app-icon>
              <div class="font-medium text-slate-700">No Upcoming Exams in Current Week</div>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .student-dashboard { animation: fadeIn 0.25s ease-in-out; }
    .student-header {
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
    .avatar-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 2px solid #2563eb; }
    .online-indicator {
      position: absolute; bottom: 2px; right: 2px; width: 12px; height: 12px;
      background-color: #10b981; border: 2px solid #fff; border-radius: 50%;
    }
    .role-badge {
      display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px;
      background-color: #dbeafe; color: #1d4ed8; font-size: 11px; font-weight: 700;
      border-radius: 9999px; margin-bottom: 4px; letter-spacing: 0.5px;
    }
    .exec-title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; }
    .exec-subtitle { font-size: 13px; color: #64748b; margin: 4px 0 0 0; }
    .header-quick-actions { display: flex; gap: 10px; flex-wrap: wrap; }

    /* Alerts */
    .alert-banner { display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-radius: 10px; }
    .alert-danger { background-color: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
    .alert-icon-box { flex-shrink: 0; }
    .alert-text-group { flex-grow: 1; }
    .alert-title { font-size: 14px; font-weight: 700; margin: 0; }
    .alert-msg { font-size: 12px; margin: 2px 0 0 0; }

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

    /* Main Grid */
    .grid-2-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 1024px) { .grid-2-col { grid-template-columns: 1fr; } }
    .card-title { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0; }
    .card-subtitle { font-size: 12px; color: #64748b; margin: 2px 0 0 0; }
  `]
})
export class StudentDashboardComponent implements OnInit {
  private systemStore = inject(SystemStoreService);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  currentUser: any;
  data: any = null;
  isLoading = true;

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
      this.data = await this.systemStore.getStudentDashboard();
    } catch (e) {
      console.warn('Student dashboard load error:', e);
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }
}
