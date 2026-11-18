import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminStoreService, SystemStoreService } from '../../../core/services/stores';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon.component';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <div class="teacher-dashboard animate-fade-in">
      <!-- 1. FACULTY HEADER -->
      <div class="faculty-header card mb-4">
        <div class="header-content">
          <div class="profile-meta flex items-center gap-4">
            <div class="avatar-box">
              <img [src]="currentUser?.avatar || 'assets/default-avatar.png'" class="avatar-img" alt="Teacher" />
              <span class="online-indicator"></span>
            </div>
            <div>
              <div class="role-badge">
                <app-icon name="briefcase" [size]="14"></app-icon>
                <span>FACULTY & TEACHER WORKSPACE (শিক্ষক ড্যাশবোর্ড)</span>
              </div>
              <h1 class="exec-title">{{ currentUser?.fullName || 'Faculty Member' }}</h1>
              <p class="exec-subtitle">
                Department of {{ data?.department || 'Academic Faculty' }} • <strong>{{ getActiveBranchName() }}</strong>. Daily periods, class attendance registers, and exam marks ledger.
              </p>
            </div>
          </div>

          <div class="header-quick-actions">
            <a routerLink="/app/attendance/entry" class="btn btn-primary flex items-center gap-1.5" title="Take daily class attendance">
              <app-icon name="clipboard-check" [size]="16"></app-icon>
              <span>Take Attendance</span>
            </a>
            <a routerLink="/app/exams/marks" class="btn btn-outline flex items-center gap-1.5" title="Input exam marks for assigned subjects">
              <app-icon name="edit" [size]="16" class="text-indigo"></app-icon>
              <span>Enter Marks</span>
            </a>
            <a routerLink="/app/teachers/leave" class="btn btn-outline flex items-center gap-1.5" title="Submit leave application">
              <app-icon name="calendar" [size]="16" class="text-rose"></app-icon>
              <span>Apply Leave</span>
            </a>
          </div>
        </div>
      </div>

      <!-- 2. KPI METRICS CARDS -->
      <div class="kpi-grid-4 mb-4">
        <!-- KPI 1: Today's Scheduled Classes -->
        <div class="kpi-card highlight-indigo">
          <div class="kpi-top">
            <div class="kpi-icon-wrap bg-indigo-subtle">
              <app-icon name="clock" [size]="22" class="text-indigo"></app-icon>
            </div>
            <span class="kpi-status-tag tag-indigo">Today</span>
          </div>
          <div class="kpi-val text-indigo">{{ data?.todayRoutine?.length || 0 }}</div>
          <div class="kpi-label">Classes Scheduled Today</div>
          <div class="kpi-sub">Periods assigned on active timetable</div>
        </div>

        <!-- KPI 2: Class Attendance Status -->
        <div class="kpi-card" [class.highlight-emerald]="data?.classTeacherSection?.isAttendanceSubmittedToday" [class.highlight-rose]="!data?.classTeacherSection?.isAttendanceSubmittedToday">
          <div class="kpi-top">
            <div class="kpi-icon-wrap" [class.bg-emerald-subtle]="data?.classTeacherSection?.isAttendanceSubmittedToday" [class.bg-rose-subtle]="!data?.classTeacherSection?.isAttendanceSubmittedToday">
              <app-icon name="check-square" [size]="22" [class.text-emerald]="data?.classTeacherSection?.isAttendanceSubmittedToday" [class.text-rose]="!data?.classTeacherSection?.isAttendanceSubmittedToday"></app-icon>
            </div>
            <span class="kpi-status-tag" [class.tag-success]="data?.classTeacherSection?.isAttendanceSubmittedToday" [class.tag-danger]="!data?.classTeacherSection?.isAttendanceSubmittedToday">
              {{ data?.classTeacherSection?.isAttendanceSubmittedToday ? 'Completed' : 'Pending' }}
            </span>
          </div>
          <div class="kpi-val" [class.text-emerald]="data?.classTeacherSection?.isAttendanceSubmittedToday" [class.text-rose]="!data?.classTeacherSection?.isAttendanceSubmittedToday">
            {{ data?.classTeacherSection?.isAttendanceSubmittedToday ? 'Recorded' : 'Action Required' }}
          </div>
          <div class="kpi-label">{{ data?.classTeacherSection?.className || 'Assigned Class' }} Register</div>
          <div class="kpi-sub">{{ data?.classTeacherSection?.presentToday || 0 }} Present of {{ data?.classTeacherSection?.totalStudents || 0 }} Enrolled</div>
        </div>

        <!-- KPI 3: Pending Marks Evaluation -->
        <div class="kpi-card highlight-blue">
          <div class="kpi-top">
            <div class="kpi-icon-wrap bg-blue-subtle">
              <app-icon name="award" [size]="22" class="text-blue"></app-icon>
            </div>
            <span class="kpi-status-tag tag-blue">Exam Marks</span>
          </div>
          <div class="kpi-val text-blue">{{ data?.pendingMarksEntries?.length || 0 }}</div>
          <div class="kpi-label">Assigned Subjects for Marks</div>
          <div class="kpi-sub">Continuous assessment evaluation ledger</div>
        </div>

        <!-- KPI 4: At-Risk Students -->
        <div class="kpi-card highlight-rose">
          <div class="kpi-top">
            <div class="kpi-icon-wrap bg-rose-subtle">
              <app-icon name="alert-circle" [size]="22" class="text-rose"></app-icon>
            </div>
            <span class="kpi-status-tag tag-danger">Needs Remedial</span>
          </div>
          <div class="kpi-val text-rose">{{ data?.atRiskStudents?.length || 0 }}</div>
          <div class="kpi-label">At-Risk Students</div>
          <div class="kpi-sub">Shortage (&lt; 75%) or failing grades</div>
        </div>
      </div>

      <!-- 3. TIMETABLE SCHEDULE & CLASS TEACHER SNAPSHOT -->
      <div class="grid-2-col mb-4">
        <!-- Today's Routine Periods Timeline -->
        <div class="card p-4">
          <div class="card-header flex justify-between items-center mb-3">
            <div>
              <h3 class="card-title flex items-center gap-2">
                <app-icon name="calendar" [size]="18" class="text-indigo"></app-icon>
                <span>Today's Teaching Schedule (আজকের ক্লাস রুটিন)</span>
              </h3>
              <p class="card-subtitle">Scheduled academic periods and classroom allocations.</p>
            </div>
            <a routerLink="/app/academic/routine" class="btn btn-sm btn-outline">Full Routine</a>
          </div>

          <div class="routine-timeline" *ngIf="data?.todayRoutine?.length > 0; else noRoutine">
            <div *ngFor="let p of data.todayRoutine" class="timeline-item flex items-center justify-between p-3 mb-2 rounded-lg border bg-slate-50">
              <div class="flex items-center gap-3">
                <div class="period-badge font-bold">Period {{ p.periodNumber }}</div>
                <div>
                  <div class="font-bold text-slate-800">{{ p.subjectName }} • {{ p.className }} ({{ p.sectionName }})</div>
                  <div class="text-xs text-slate-500">
                    Time: <span class="font-semibold">{{ p.startTime }} - {{ p.endTime }}</span> • Room: <span class="font-semibold">{{ p.roomNumber }}</span>
                  </div>
                </div>
              </div>
              <a routerLink="/app/attendance/entry" class="btn btn-sm btn-outline flex items-center gap-1">
                <app-icon name="clipboard" [size]="13"></app-icon>
                <span>Roll Call</span>
              </a>
            </div>
          </div>
          <ng-template #noRoutine>
            <div class="py-5 text-center text-muted">
              <app-icon name="coffee" [size]="32" class="text-indigo mb-2"></app-icon>
              <div class="font-medium text-slate-700">No Teaching Classes Scheduled for Today</div>
              <p class="text-xs text-slate-400">Enjoy your preparation period or review exam evaluation registers.</p>
            </div>
          </ng-template>
        </div>

        <!-- Class Teacher Attendance Register Snapshot -->
        <div class="card p-4" *ngIf="data?.classTeacherSection">
          <div class="card-header flex justify-between items-center mb-3">
            <div>
              <h3 class="card-title flex items-center gap-2">
                <app-icon name="users" [size]="18" class="text-emerald"></app-icon>
                <span>Assigned Section: {{ data.classTeacherSection.className }} ({{ data.classTeacherSection.sectionName }})</span>
              </h3>
              <p class="card-subtitle">Class teacher's daily student attendance ledger.</p>
            </div>
            <span class="badge" [class.badge-success]="data.classTeacherSection.isAttendanceSubmittedToday" [class.badge-danger]="!data.classTeacherSection.isAttendanceSubmittedToday">
              {{ data.classTeacherSection.isAttendanceSubmittedToday ? 'Submitted' : 'Pending Entry' }}
            </span>
          </div>

          <div class="section-stats-strip grid grid-cols-3 gap-2 text-center p-3 bg-slate-50 rounded-lg mb-3">
            <div>
              <div class="text-xs text-slate-500">Total Enrolled</div>
              <div class="text-xl font-bold text-slate-800">{{ data.classTeacherSection.totalStudents }}</div>
            </div>
            <div>
              <div class="text-xs text-slate-500">Present Today</div>
              <div class="text-xl font-bold text-emerald">{{ data.classTeacherSection.presentToday }}</div>
            </div>
            <div>
              <div class="text-xs text-slate-500">Absent Today</div>
              <div class="text-xl font-bold text-rose">{{ data.classTeacherSection.absentToday }}</div>
            </div>
          </div>

          <div class="flex justify-end gap-2">
            <a routerLink="/app/attendance/entry" class="btn btn-primary w-full text-center">
              {{ data.classTeacherSection.isAttendanceSubmittedToday ? 'Update Today Attendance' : 'Record Section Attendance Now' }}
            </a>
          </div>
        </div>
      </div>

      <!-- 4. AT-RISK STUDENTS WARNING TABLE -->
      <div class="card p-4 mb-4" *ngIf="data?.atRiskStudents?.length > 0">
        <div class="card-header flex justify-between items-center mb-3">
          <div>
            <h3 class="card-title flex items-center gap-2">
              <app-icon name="alert-triangle" [size]="18" class="text-rose"></app-icon>
              <span>Students Requiring Remedial Attention (শিক্ষার্থী সতর্কতা তালিকা)</span>
            </h3>
            <p class="card-subtitle">Students flagged for severe attendance shortage (&lt;75%) or failing examination GPA.</p>
          </div>
          <span class="badge badge-danger">{{ data.atRiskStudents.length }} Flagged</span>
        </div>

        <div class="table-responsive">
          <table class="table-compact">
            <thead>
              <tr>
                <th>Student Dossier</th>
                <th>Class & Section</th>
                <th>Attendance Rate</th>
                <th>Exam GPA</th>
                <th>Risk Category</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let st of data.atRiskStudents">
                <td>
                  <strong>{{ st.studentName }}</strong>
                  <div class="text-xs text-slate-500">Roll #{{ st.rollNo }} • {{ st.admissionNo }}</div>
                </td>
                <td>{{ st.className }} ({{ st.sectionName }})</td>
                <td>
                  <span class="font-bold" [class.text-rose]="st.attendanceRate < 75">{{ st.attendanceRate }}%</span>
                </td>
                <td>
                  <span class="font-mono font-bold" [class.text-rose]="st.latestExamGpa < 2">{{ st.latestExamGpa }}</span>
                </td>
                <td>
                  <span class="badge badge-warning" *ngIf="st.riskType === 'Shortage'">Attendance Shortage</span>
                  <span class="badge badge-danger" *ngIf="st.riskType === 'Failing'">Failing Grade</span>
                  <span class="badge badge-danger" *ngIf="st.riskType === 'Both'">Critical (Both)</span>
                </td>
                <td class="text-right">
                  <a routerLink="/app/students/list" class="btn btn-sm btn-outline">Profile</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .teacher-dashboard { animation: fadeIn 0.25s ease-in-out; }
    .faculty-header {
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
    .avatar-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 2px solid #6366f1; }
    .online-indicator {
      position: absolute; bottom: 2px; right: 2px; width: 12px; height: 12px;
      background-color: #10b981; border: 2px solid #fff; border-radius: 50%;
    }
    .role-badge {
      display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px;
      background-color: #ede9fe; color: #6d28d9; font-size: 11px; font-weight: 700;
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
    .bg-indigo-subtle { background-color: #e0e7ff; }
    .bg-blue-subtle { background-color: #dbeafe; }
    .text-emerald { color: #10b981; }
    .text-rose { color: #f43f5e; }
    .text-indigo { color: #6366f1; }
    .text-blue { color: #3b82f6; }
    .kpi-status-tag { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; }
    .tag-success { background-color: #d1fae5; color: #047857; }
    .tag-danger { background-color: #fee2e2; color: #b91c1c; }
    .tag-indigo { background-color: #e0e7ff; color: #4338ca; }
    .tag-blue { background-color: #dbeafe; color: #1d4ed8; }
    .kpi-val { font-size: 24px; font-weight: 800; line-height: 1.1; margin-bottom: 4px; }
    .kpi-label { font-size: 13px; font-weight: 600; color: #475569; }
    .kpi-sub { font-size: 11px; color: #94a3b8; margin-top: 4px; }

    /* Main Grid */
    .grid-2-col { display: grid; grid-template-columns: 3fr 2fr; gap: 16px; }
    @media (max-width: 1024px) { .grid-2-col { grid-template-columns: 1fr; } }
    .card-title { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0; }
    .card-subtitle { font-size: 12px; color: #64748b; margin: 2px 0 0 0; }
    .period-badge {
      background-color: #ede9fe; color: #6d28d9; padding: 4px 8px; border-radius: 6px; font-size: 11px;
    }

    /* Tables */
    .table-compact { width: 100%; border-collapse: collapse; font-size: 13px; }
    .table-compact th { padding: 8px 10px; background-color: #f8fafc; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; }
    .table-compact td { padding: 10px; border-bottom: 1px solid #f1f5f9; }
  `]
})
export class TeacherDashboardComponent implements OnInit {
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
      this.data = await this.systemStore.getTeacherDashboard();
    } catch (e) {
      console.warn('Teacher dashboard load error:', e);
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }
}
