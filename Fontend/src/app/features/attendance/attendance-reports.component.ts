import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceStoreService } from '../../core/services/stores/attendance-store.service';
import { AcademicStoreService } from '../../core/services/stores/academic-store.service';
import { StudentStoreService } from '../../core/services/stores/student-store.service';
import { SystemStoreService } from '../../core/services/stores/system-store.service';
import { AuthService } from '../../core/services/auth.service';
import { CampusSessionService } from '../../core/services/campus-session.service';
import { ToastService } from '../../core/services/toast.service';
import { AttendanceRecord, AttendanceCorrectionLog, SchoolClass, Section, Student, AcademicHoliday, WeekendSettings } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';
import { ModalComponent } from '../../shared/components/modal.component';

export interface DailyReportRecord extends Omit<AttendanceRecord, 'status'> {
  status: 'Present' | 'Absent' | 'Late' | 'Holiday' | 'Weekend' | 'Unmarked';
  student?: Student;
}

interface StudentMonthlyStat {
  student: Student;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalWorkingDays: number;
  percentage: number;
  eligibility: 'Regular' | 'Collegiate' | 'Non-Collegiate';
  dayStatuses: { [day: number]: string };
}

@Component({
  selector: 'app-attendance-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, ModalComponent],
  template: `
    <div class="page-container">
      <!-- HEADER -->
      <div class="page-header no-print">
        <div>
          <div class="header-badge-row">
            <span class="badge-accent">
              <app-icon name="check-circle" [size]="14"></app-icon>
              <span>AUDIT VERIFIED ATTENDANCE ENGINE</span>
            </span>
            <span class="header-session-tag">Academic Session 2026–2027</span>
          </div>
          <h1 class="page-title">
            <app-icon name="clipboard" [size]="28" class="text-primary"></app-icon>
            Attendance Reports & Comprehensive Records
          </h1>
          <p class="page-subtitle">
            Daily institutional registers, monthly attendance analytics, calendar matrix sheets, and chronic absentee tracking.
          </p>
        </div>

        <div class="page-actions">
          <!-- PRINCIPAL WEEKEND & HOLIDAY CONTROLS -->
          <button type="button" class="btn btn-outline" (click)="openWeekendModal()" title="Principal: Configure weekly institutional weekend days">
            <app-icon name="calendar" [size]="16" class="text-indigo"></app-icon>
            <span>Weekend: {{ getWeekendDaysShortLabel() }}</span>
          </button>
          <button type="button" class="btn btn-outline" (click)="openHolidayModal()" title="Principal: Declare & manage official school holidays">
            <app-icon name="star" [size]="16" class="text-amber"></app-icon>
            <span>Holidays ({{ holidays.length }})</span>
          </button>
          <button type="button" class="btn btn-outline" (click)="printRegister()">
            <app-icon name="printer" [size]="16"></app-icon>
            <span>Print Register</span>
          </button>
          <button type="button" class="btn btn-outline" (click)="exportCSV()">
            <app-icon name="download" [size]="16"></app-icon>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <!-- KPI METRIC CARDS -->
      <div class="kpi-grid mb-4 no-print">
        <div class="kpi-card">
          <div class="kpi-icon-wrap" [class.bg-slate]="isFutureDate(selectedDate)" [class.bg-emerald]="!isFutureDate(selectedDate) && !isDateHolidayOrWeekend(selectedDate) && hasSubmittedAttendance" [class.bg-amber]="!isFutureDate(selectedDate) && !isDateHolidayOrWeekend(selectedDate) && !hasSubmittedAttendance" [class.bg-rose]="getDateHoliday(selectedDate)" [class.bg-indigo]="!getDateHoliday(selectedDate) && isDateWeekend(selectedDate)">
            <app-icon [name]="isFutureDate(selectedDate) ? 'clock' : (getDateHoliday(selectedDate) ? 'star' : (isDateWeekend(selectedDate) ? 'calendar' : (hasSubmittedAttendance ? 'check' : 'alert-circle')))" [size]="22" [class.text-emerald]="!isFutureDate(selectedDate) && !isDateHolidayOrWeekend(selectedDate) && hasSubmittedAttendance" [class.text-amber]="!isFutureDate(selectedDate) && !isDateHolidayOrWeekend(selectedDate) && !hasSubmittedAttendance" [class.text-rose]="getDateHoliday(selectedDate)" [class.text-indigo]="!getDateHoliday(selectedDate) && isDateWeekend(selectedDate)"></app-icon>
          </div>
          <div class="kpi-details">
            <span class="kpi-label">{{ activeViewMode === 'daily' ? 'Selected Day Status' : 'Today\'s Present Rate' }}</span>
            <div class="kpi-val-row">
              <span class="kpi-number text-slate-400" *ngIf="isFutureDate(selectedDate)">Future Date</span>
              <span class="kpi-number text-amber" *ngIf="!isFutureDate(selectedDate) && !isDateHolidayOrWeekend(selectedDate) && !hasSubmittedAttendance" style="font-size: 1.25rem;">Not Recorded</span>
              <span class="kpi-number" *ngIf="!isFutureDate(selectedDate) && !isDateHolidayOrWeekend(selectedDate) && hasSubmittedAttendance">{{ todayPresentPercentage }}%</span>
              <span class="kpi-number text-rose" *ngIf="getDateHoliday(selectedDate)" style="font-size: 1.25rem;">Holiday</span>
              <span class="kpi-number text-indigo" *ngIf="!getDateHoliday(selectedDate) && isDateWeekend(selectedDate)" style="font-size: 1.25rem;">Weekend</span>
              <span class="kpi-trend text-emerald" *ngIf="!isFutureDate(selectedDate) && !isDateHolidayOrWeekend(selectedDate) && hasSubmittedAttendance">Active Roster</span>
            </div>
            <span class="kpi-subtext" *ngIf="isFutureDate(selectedDate)">Date beyond current system date</span>
            <span class="kpi-subtext text-amber-800" *ngIf="!isFutureDate(selectedDate) && !isDateHolidayOrWeekend(selectedDate) && !hasSubmittedAttendance">Roll-call not submitted yet</span>
            <span class="kpi-subtext" *ngIf="getDateHoliday(selectedDate)">{{ getDateHoliday(selectedDate)?.title }}</span>
            <span class="kpi-subtext" *ngIf="!getDateHoliday(selectedDate) && isDateWeekend(selectedDate)">Weekly Weekend Recess</span>
            <span class="kpi-subtext" *ngIf="!isFutureDate(selectedDate) && !isDateHolidayOrWeekend(selectedDate) && hasSubmittedAttendance">{{ todayPresentCount }} students verified present</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap bg-rose">
            <app-icon name="user-x" [size]="22" class="text-rose"></app-icon>
          </div>
          <div class="kpi-details">
            <span class="kpi-label">Absentees Count</span>
            <div class="kpi-val-row">
              <span class="kpi-number text-muted" *ngIf="isFutureDate(selectedDate) || (!isDateHolidayOrWeekend(selectedDate) && !hasSubmittedAttendance)">—</span>
              <span class="kpi-number text-rose" *ngIf="!isFutureDate(selectedDate) && !isDateHolidayOrWeekend(selectedDate) && hasSubmittedAttendance">{{ todayAbsentCount }}</span>
              <span class="kpi-badge-pill pill-rose" *ngIf="hasSubmittedAttendance && todayAbsentCount > 0">Action Req.</span>
              <span class="kpi-badge-pill pill-emerald" *ngIf="todayAbsentCount === 0 && isDateHolidayOrWeekend(selectedDate)">Holiday Exemption</span>
              <span class="kpi-badge-pill pill-neutral" *ngIf="!hasSubmittedAttendance && !isDateHolidayOrWeekend(selectedDate)">Unmarked</span>
            </div>
            <span class="kpi-subtext" *ngIf="isFutureDate(selectedDate)">Future date</span>
            <span class="kpi-subtext" *ngIf="isDateHolidayOrWeekend(selectedDate)">No absence penalized on non-work days</span>
            <span class="kpi-subtext" *ngIf="!isFutureDate(selectedDate) && !isDateHolidayOrWeekend(selectedDate) && !hasSubmittedAttendance">No attendance session submitted</span>
            <span class="kpi-subtext" *ngIf="!isFutureDate(selectedDate) && !isDateHolidayOrWeekend(selectedDate) && hasSubmittedAttendance">{{ todayAbsentCount }} students missing</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap bg-amber">
            <app-icon name="clock" [size]="22" class="text-amber"></app-icon>
          </div>
          <div class="kpi-details">
            <span class="kpi-label">Late Arrivals</span>
            <div class="kpi-val-row">
              <span class="kpi-number text-muted" *ngIf="isFutureDate(selectedDate) || (!isDateHolidayOrWeekend(selectedDate) && !hasSubmittedAttendance)">—</span>
              <span class="kpi-number text-amber" *ngIf="!isFutureDate(selectedDate) && !isDateHolidayOrWeekend(selectedDate) && hasSubmittedAttendance">{{ todayLateCount }}</span>
              <span class="kpi-badge-pill pill-amber" *ngIf="hasSubmittedAttendance && !isDateHolidayOrWeekend(selectedDate) && todayLateCount > 0">Grace Period</span>
            </div>
            <span class="kpi-subtext" *ngIf="isFutureDate(selectedDate)">Future date</span>
            <span class="kpi-subtext" *ngIf="isDateHolidayOrWeekend(selectedDate)">Assembly suspended</span>
            <span class="kpi-subtext" *ngIf="!isFutureDate(selectedDate) && !isDateHolidayOrWeekend(selectedDate) && !hasSubmittedAttendance">No attendance session submitted</span>
            <span class="kpi-subtext" *ngIf="!isFutureDate(selectedDate) && !isDateHolidayOrWeekend(selectedDate) && hasSubmittedAttendance">Marked after assembly</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap bg-indigo">
            <app-icon name="activity" [size]="22" class="text-indigo"></app-icon>
          </div>
          <div class="kpi-details">
            <span class="kpi-label">Monthly Compliance</span>
            <div class="kpi-val-row">
              <span class="kpi-number text-indigo">{{ monthlyAveragePercentage }}%</span>
              <span class="kpi-trend text-indigo">{{ getSelectedMonthName() }}</span>
            </div>
            <span class="kpi-subtext">{{ totalWorkingDaysInSelectedMonth }} elapsed working days evaluated</span>
          </div>
        </div>
      </div>

      <!-- FILTER CONTROLS BAR -->
      <div class="card filter-card mb-4 no-print">
        <div class="card-body p-3">
          <div class="filter-flex-row">
            <!-- View Mode Switcher -->
            <div class="view-mode-pill-group">
              <button 
                type="button" 
                class="view-pill" 
                [class.active]="activeViewMode === 'daily'" 
                (click)="setViewMode('daily')"
              >
                <app-icon name="calendar" [size]="14"></app-icon>
                <span>Daily Register</span>
              </button>

              <button 
                type="button" 
                class="view-pill" 
                [class.active]="activeViewMode === 'monthly'" 
                (click)="setViewMode('monthly')"
              >
                <app-icon name="bar-chart-2" [size]="14"></app-icon>
                <span>Monthly Summary</span>
              </button>

              <button 
                type="button" 
                class="view-pill" 
                [class.active]="activeViewMode === 'matrix'" 
                (click)="setViewMode('matrix')"
              >
                <app-icon name="grid" [size]="14"></app-icon>
                <span>Calendar Matrix Grid</span>
              </button>

              <button 
                type="button" 
                class="view-pill" 
                [class.active]="activeViewMode === 'chronic'" 
                (click)="setViewMode('chronic')"
              >
                <app-icon name="alert-triangle" [size]="14"></app-icon>
                <span>Absentees Watch ({{ chronicAbsenteesList.length }})</span>
              </button>

              <button 
                type="button" 
                class="view-pill" 
                [class.active]="activeViewMode === 'corrections'" 
                (click)="setViewMode('corrections')"
              >
                <app-icon name="rotate-ccw" [size]="14"></app-icon>
                <span>Audit Logs</span>
              </button>
            </div>

            <!-- Class & Section Selector -->
            <div class="selectors-cluster">
              <div class="filter-item">
                <label class="filter-label">Class</label>
                <select [(ngModel)]="selectedClassId" (change)="onClassChange()" class="form-select form-select-sm">
                  <option *ngFor="let c of classes" [value]="c.id">{{ c.name }} ({{ c.code }})</option>
                </select>
              </div>

              <div class="filter-item">
                <label class="filter-label">Section</label>
                <select [(ngModel)]="selectedSectionId" (change)="loadAttendanceData()" class="form-select form-select-sm">
                  <option value="ALL">All Sections</option>
                  <option *ngFor="let s of availableSections" [value]="s.id">{{ s.name }}</option>
                </select>
              </div>

              <!-- Daily Date Picker (Restricted to max systemDate) -->
              <div class="filter-item" *ngIf="activeViewMode === 'daily'">
                <label class="filter-label">Register Date</label>
                <input 
                  type="date" 
                  [(ngModel)]="selectedDate" 
                  [max]="systemDate"
                  (change)="onDateChange()" 
                  class="form-control form-control-sm date-input" 
                />
              </div>

              <!-- Month/Year Picker for Monthly Views (Restricted to max currentMonthYear) -->
              <div class="filter-item" *ngIf="activeViewMode === 'monthly' || activeViewMode === 'matrix' || activeViewMode === 'chronic'">
                <label class="filter-label">Month & Year</label>
                <input 
                  type="month" 
                  [(ngModel)]="selectedMonthYear" 
                  [max]="currentMonthYear"
                  (change)="onMonthChange()" 
                  class="form-control form-control-sm month-input" 
                />
              </div>

              <!-- Search Filter -->
              <div class="search-item">
                <label class="filter-label">Search Student</label>
                <div class="search-input-wrap">
                  <app-icon name="search" [size]="14" class="search-ico"></app-icon>
                  <input 
                    type="text" 
                    [(ngModel)]="searchQuery" 
                    placeholder="Filter by name, roll, code..." 
                    class="form-control form-control-sm" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PRINT HEADER (ONLY VISIBLE ON PRINT) -->
      <div class="print-header-banner print-only">
        <h2 class="print-institution">Scholars International Academy (Central Campus)</h2>
        <h3 class="print-doc-title">
          Academic Attendance Register — Class {{ getSelectedClassName() }} ({{ getSelectedSectionName() }})
        </h3>
        <p class="print-meta-line">
          <span>Date / Period: <strong>{{ activeViewMode === 'daily' ? selectedDate : selectedMonthYear }}</strong></span>
          <span>Printed on: {{ todayString }}</span>
          <span>Total Enrolled: {{ classStudents.length }}</span>
        </p>
      </div>

      <!-- ========================================== -->
      <!-- VIEW 1: DAILY ATTENDANCE REGISTER           -->
      <!-- ========================================== -->
      <div *ngIf="activeViewMode === 'daily'" class="card register-card">
        <div class="card-header no-print">
          <div class="card-title">
            <app-icon name="book-open" [size]="18" class="text-primary"></app-icon>
            <span>Daily Attendance Register for {{ selectedDate }}</span>
          </div>
          <div class="header-tags-row">
            <span *ngIf="isFutureDate(selectedDate)" class="status-summary-tag tag-future">
              Future Date (Restricted)
            </span>
            <span *ngIf="getDateHoliday(selectedDate)" class="status-summary-tag tag-holiday">
              Holiday: <strong>{{ getDateHoliday(selectedDate)?.title }}</strong>
            </span>
            <span *ngIf="!getDateHoliday(selectedDate) && isDateWeekend(selectedDate)" class="status-summary-tag tag-weekend">
              Weekly Weekend: <strong>Recess</strong>
            </span>
            <span *ngIf="!isFutureDate(selectedDate) && !isDateHolidayOrWeekend(selectedDate) && !hasSubmittedAttendance" class="status-summary-tag tag-unmarked">
              Status: <strong>Session Not Recorded</strong>
            </span>
            <span *ngIf="!isFutureDate(selectedDate) && !isDateHolidayOrWeekend(selectedDate) && hasSubmittedAttendance" class="status-summary-tag tag-present">
              Present: <strong>{{ dailyFilteredStats.present }}</strong>
            </span>
            <span *ngIf="!isFutureDate(selectedDate) && !isDateHolidayOrWeekend(selectedDate) && hasSubmittedAttendance" class="status-summary-tag tag-absent">
              Absent: <strong>{{ dailyFilteredStats.absent }}</strong>
            </span>
            <span *ngIf="!isFutureDate(selectedDate) && !isDateHolidayOrWeekend(selectedDate) && hasSubmittedAttendance" class="status-summary-tag tag-late">
              Late: <strong>{{ dailyFilteredStats.late }}</strong>
            </span>
            <span class="status-summary-tag tag-total">
              Total Students: <strong>{{ filteredDailyRecords.length }}</strong>
            </span>
          </div>
        </div>

        <!-- FUTURE DATE NOTICE BANNER -->
        <div *ngIf="isFutureDate(selectedDate)" class="alert-notice-box notice-future mb-3">
          <div class="alert-notice-icon">
            <app-icon name="clock" [size]="20" class="text-slate-600"></app-icon>
          </div>
          <div class="alert-notice-content">
            <div class="alert-notice-title font-bold text-slate-800">
              Future Academic Date Selected ({{ selectedDate }})
            </div>
            <div class="alert-notice-desc text-xs text-slate-600">
              Attendance records cannot be captured or processed for dates beyond the current system date ({{ systemDate }}). Auto-data generation is strictly disabled.
            </div>
          </div>
          <button type="button" class="btn btn-xs btn-outline" (click)="selectedDate = systemDate; loadAttendanceData()">
            Reset to Today ({{ systemDate }})
          </button>
        </div>

        <!-- UNMARKED SESSION NOTICE BANNER (ZERO AUTO-DATA) -->
        <div *ngIf="!isFutureDate(selectedDate) && !isDateHolidayOrWeekend(selectedDate) && !hasSubmittedAttendance" class="alert-notice-box notice-unmarked mb-3">
          <div class="alert-notice-icon">
            <app-icon name="alert-circle" [size]="20" class="text-amber-600"></app-icon>
          </div>
          <div class="alert-notice-content">
            <div class="alert-notice-title font-bold text-amber-900">
              No Attendance Session Recorded for {{ selectedDate }}
            </div>
            <div class="alert-notice-desc text-xs text-amber-800">
              Daily roll-call has not been submitted yet for {{ getSelectedClassName() }} ({{ getSelectedSectionName() }}). Automatic / dummy data is disabled.
            </div>
          </div>
          <a routerLink="/app/attendance/daily" class="btn btn-xs btn-primary">
            <app-icon name="check-square" [size]="14"></app-icon>
            <span>Take Attendance Now</span>
          </a>
        </div>

        <!-- HOLIDAY OR WEEKEND NOTICE BANNER -->
        <div *ngIf="getDateHoliday(selectedDate)" class="alert-notice-box notice-holiday mb-3">
          <div class="alert-notice-icon">
            <app-icon name="star" [size]="20" class="text-rose"></app-icon>
          </div>
          <div class="alert-notice-content">
            <div class="alert-notice-title font-bold text-rose">
              Institutional Academic Holiday — {{ getDateHoliday(selectedDate)?.title }}
            </div>
            <div class="alert-notice-desc text-xs text-muted">
              {{ selectedDate }} is officially declared as an academic holiday ({{ getDateHoliday(selectedDate)?.type }}). Regular classes are suspended and students are exempt from attendance compliance.
            </div>
          </div>
          <span class="badge-holiday-chip">{{ getDateHoliday(selectedDate)?.type }}</span>
        </div>

        <div *ngIf="!getDateHoliday(selectedDate) && isDateWeekend(selectedDate)" class="alert-notice-box notice-weekend mb-3">
          <div class="alert-notice-icon">
            <app-icon name="calendar" [size]="20" class="text-indigo"></app-icon>
          </div>
          <div class="alert-notice-content">
            <div class="alert-notice-title font-bold text-indigo">
              Institutional Weekly Weekend ({{ getDayOfWeekFromDate(selectedDate) }})
            </div>
            <div class="alert-notice-desc text-xs text-muted">
              {{ selectedDate }} is configured as a weekly weekend non-instructional day. No classroom sessions are scheduled today.
            </div>
          </div>
          <span class="badge-weekend-chip">Weekend</span>
        </div>

        <div class="app-table-wrapper">
          <table class="app-table attendance-table">
            <thead>
              <tr>
                <th style="width: 70px;">Roll</th>
                <th>Student Profile</th>
                <th style="width: 140px;">Class & Section</th>
                <th style="width: 140px; text-align: center;">Status</th>
                <th style="width: 140px;">Recorded Time</th>
                <th>Remarks / Reason</th>
                <th style="width: 130px; text-align: right;" class="no-print">Quick Action</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                *ngFor="let row of filteredDailyRecords" 
                [class.row-absent]="row.status === 'Absent'" 
                [class.row-late]="row.status === 'Late'"
                [class.row-holiday]="row.status === 'Holiday'"
                [class.row-weekend]="row.status === 'Weekend'"
                [class.row-unmarked]="row.status === 'Unmarked'"
              >
                <td>
                  <span class="roll-pill">{{ row.rollNo || '—' }}</span>
                </td>

                <td>
                  <div class="student-profile-cell">
                    <img 
                      [src]="row.student?.photoUrl || defaultAvatar" 
                      alt="Student" 
                      class="student-avatar" 
                    />
                    <div>
                      <div class="student-name font-bold">{{ row.studentName }}</div>
                      <div class="student-code text-muted text-xs">ID: {{ row.student?.admissionNo || row.studentId }}</div>
                    </div>
                  </div>
                </td>

                <td>
                  <span class="class-section-pill">
                    {{ getClassName(row.classId) }} • {{ getSectionName(row.sectionId) }}
                  </span>
                </td>

                <td style="text-align: center;">
                  <span 
                    class="attendance-status-badge" 
                    [class.badge-p]="row.status === 'Present'"
                    [class.badge-a]="row.status === 'Absent'"
                    [class.badge-l]="row.status === 'Late'"
                    [class.badge-h]="row.status === 'Holiday'"
                    [class.badge-w]="row.status === 'Weekend'"
                    [class.badge-unmarked]="row.status === 'Unmarked'"
                  >
                    <app-icon 
                      [name]="row.status === 'Present' ? 'check' : (row.status === 'Absent' ? 'x' : (row.status === 'Holiday' ? 'star' : (row.status === 'Weekend' ? 'calendar' : (row.status === 'Late' ? 'clock' : 'minus'))))" 
                      [size]="13"
                    ></app-icon>
                    <span>{{ row.status === 'Unmarked' ? 'Not Recorded' : row.status }}</span>
                  </span>
                </td>

                <td>
                  <span class="timestamp-text" [class.text-muted]="row.status === 'Unmarked'">
                    {{ row.status === 'Unmarked' ? '—' : (row.lastUpdated ? (row.lastUpdated | date:'shortTime') : '08:45 AM') }}
                  </span>
                </td>

                <td>
                  <span class="remarks-text" [class.text-muted]="!row.remark || row.status === 'Unmarked'">
                    {{ row.remark || (row.status === 'Unmarked' ? 'Pending roll-call' : 'Regular Roster Entry') }}
                  </span>
                </td>

                <td style="text-align: right;" class="no-print">
                  <a 
                    *ngIf="row.status === 'Unmarked' && !isFutureDate(selectedDate)"
                    routerLink="/app/attendance/daily" 
                    class="btn-quick-correct text-indigo"
                    title="Take class attendance"
                  >
                    <app-icon name="plus" [size]="13"></app-icon>
                    <span>Record</span>
                  </a>
                  <button 
                    *ngIf="row.status !== 'Holiday' && row.status !== 'Weekend' && row.status !== 'Unmarked' && !isFutureDate(selectedDate)"
                    type="button" 
                    class="btn-quick-correct" 
                    (click)="openCorrectionModal(row)"
                    title="Correct this attendance record"
                  >
                    <app-icon name="edit-2" [size]="13"></app-icon>
                    <span>Correct</span>
                  </button>
                  <span *ngIf="row.status === 'Holiday' || row.status === 'Weekend' || isFutureDate(selectedDate)" class="text-xs text-muted font-semibold">
                    {{ isFutureDate(selectedDate) ? 'Future' : 'Exempt' }}
                  </span>
                </td>
              </tr>

              <tr *ngIf="filteredDailyRecords.length === 0">
                <td colspan="7" class="text-center py-5 text-muted">
                  <app-icon name="inbox" [size]="32" class="mb-2 text-muted opacity-50"></app-icon>
                  <div>No attendance records match your filter criteria for this date.</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- VIEW 2: MONTHLY SUMMARY & COMPLIANCE       -->
      <!-- ========================================== -->
      <div *ngIf="activeViewMode === 'monthly'" class="card summary-card">
        <div class="card-header no-print">
          <div class="card-title">
            <app-icon name="bar-chart" [size]="18" class="text-primary"></app-icon>
            <span>Monthly Attendance Summary — {{ getSelectedMonthName() }}</span>
          </div>
          <div class="legend-pills-row">
            <span class="legend-pill pill-neutral" title="Total instructional days in this month excluding weekends & holidays">
              Net Working Days: <strong>{{ totalWorkingDaysInSelectedMonth }}</strong>
            </span>
            <span class="legend-pill pill-rose" *ngIf="totalHolidaysInSelectedMonth > 0" title="Declared academic holidays in this month">
              Holidays: <strong>{{ totalHolidaysInSelectedMonth }}</strong>
            </span>
            <span class="legend-pill pill-reg">Regular: ≥ 75%</span>
            <span class="legend-pill pill-col">Collegiate: 60% – 74%</span>
            <span class="legend-pill pill-non">Non-Collegiate: &lt; 60%</span>
          </div>
        </div>

        <div class="app-table-wrapper">
          <table class="app-table summary-table">
            <thead>
              <tr>
                <th style="width: 70px;">Roll</th>
                <th>Student Name</th>
                <th style="text-align: center; width: 110px;">Working Days</th>
                <th style="text-align: center; width: 90px;">Present</th>
                <th style="text-align: center; width: 90px;">Absent</th>
                <th style="text-align: center; width: 90px;">Late</th>
                <th style="width: 170px;">Compliance (%)</th>
                <th style="text-align: center; width: 140px;">Exam Eligibility</th>
                <th style="text-align: right; width: 110px;" class="no-print">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of filteredMonthlyStats">
                <td>
                  <span class="roll-pill">{{ item.student.rollNo || '—' }}</span>
                </td>

                <td>
                  <div class="student-profile-cell">
                    <img [src]="item.student.photoUrl || defaultAvatar" alt="Avatar" class="student-avatar" />
                    <div>
                      <div class="student-name font-bold">{{ item.student.fullName }}</div>
                      <div class="student-code text-muted text-xs">Guardian: {{ item.student.guardianName || 'N/A' }}</div>
                    </div>
                  </div>
                </td>

                <td style="text-align: center;">
                  <span class="badge-neutral font-semibold">{{ item.totalWorkingDays }}</span>
                </td>

                <td style="text-align: center;">
                  <span class="font-bold text-emerald">{{ item.presentDays }}</span>
                </td>

                <td style="text-align: center;">
                  <span class="font-bold text-rose">{{ item.absentDays }}</span>
                </td>

                <td style="text-align: center;">
                  <span class="font-bold text-amber">{{ item.lateDays }}</span>
                </td>

                <td>
                  <div class="progress-cell">
                    <div class="progress-bar-wrap">
                      <div 
                        class="progress-fill" 
                        [style.width.%]="item.percentage"
                        [class.fill-emerald]="item.percentage >= 75"
                        [class.fill-amber]="item.percentage >= 60 && item.percentage < 75"
                        [class.fill-rose]="item.percentage < 60"
                      ></div>
                    </div>
                    <span class="percentage-label font-bold" [class.text-emerald]="item.percentage >= 75" [class.text-rose]="item.percentage < 60">
                      {{ item.percentage }}%
                    </span>
                  </div>
                </td>

                <td style="text-align: center;">
                  <span 
                    class="eligibility-tag"
                    [class.el-reg]="item.eligibility === 'Regular'"
                    [class.el-col]="item.eligibility === 'Collegiate'"
                    [class.el-non]="item.eligibility === 'Non-Collegiate'"
                  >
                    {{ item.eligibility }}
                  </span>
                </td>

                <td style="text-align: right;" class="no-print">
                  <button 
                    type="button" 
                    class="btn btn-outline btn-xs" 
                    (click)="openDirectSMS(item.student)"
                    title="Send Guardian SMS Alert"
                  >
                    <app-icon name="message-square" [size]="12"></app-icon>
                    <span>SMS</span>
                  </button>
                </td>
              </tr>

              <tr *ngIf="filteredMonthlyStats.length === 0">
                <td colspan="9" class="text-center py-5 text-muted">
                  No student records found for the selected class and section.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- VIEW 3: MONTHLY MATRIX GRID SHEET          -->
      <!-- ========================================== -->
      <div *ngIf="activeViewMode === 'matrix'" class="card matrix-card">
        <div class="card-header no-print">
          <div class="card-title">
            <app-icon name="grid" [size]="18" class="text-primary"></app-icon>
            <span>Complete Attendance Calendar Matrix — {{ getSelectedMonthName() }}</span>
          </div>
          <div class="matrix-key-legend">
            <span class="key-box key-p">P = Present</span>
            <span class="key-box key-a">A = Absent</span>
            <span class="key-box key-l">L = Late</span>
            <span class="key-box key-w">W = Weekend</span>
            <span class="key-box key-holiday">H = Holiday</span>
            <span class="key-box key-unmarked">— = Unmarked</span>
            <span class="key-box key-future">— = Future Date</span>
          </div>
        </div>

        <div class="matrix-table-scroll-wrapper">
          <table class="matrix-grid-table">
            <thead>
              <tr>
                <th class="sticky-col col-roll" style="width: 50px;">Roll</th>
                <th class="sticky-col col-name" style="width: 170px;">Student Name</th>
                <th 
                  *ngFor="let day of monthDays" 
                  class="day-col-header" 
                  [class.is-weekend]="!isHoliday(day) && isWeekend(day)"
                  [class.is-holiday]="isHoliday(day)"
                  [class.is-future]="isFutureDay(day)"
                  [title]="isFutureDay(day) ? ('Day ' + day + ' (' + getDayOfWeek(day) + ') - Future Date (Restricted)') : (isHoliday(day) ? ('Holiday: ' + getHolidayName(day)) : (isWeekend(day) ? 'Weekly Weekend' : ('Day ' + day + ' (' + getDayOfWeek(day) + ')')))"
                >
                  <div class="day-num">{{ day }}</div>
                  <div class="day-name">{{ getDayOfWeek(day) }}</div>
                  <div *ngIf="isHoliday(day)" class="day-holiday-dot" [title]="getHolidayName(day)"></div>
                </th>
                <th class="col-summary">P</th>
                <th class="col-summary">A</th>
                <th class="col-summary">L</th>
                <th class="col-summary-pct">%</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of filteredMonthlyStats">
                <td class="sticky-col col-roll">
                  <span class="roll-pill">{{ row.student.rollNo || '—' }}</span>
                </td>
                <td class="sticky-col col-name">
                  <span class="student-name-short" [title]="row.student.fullName">
                    {{ row.student.fullName }}
                  </span>
                </td>

                <td 
                  *ngFor="let day of monthDays" 
                  class="day-cell" 
                  [class.is-weekend]="!isHoliday(day) && isWeekend(day)"
                  [class.is-holiday]="isHoliday(day)"
                  [class.is-future]="isFutureDay(day)"
                  [class.is-unmarked]="!isHoliday(day) && !isWeekend(day) && !isFutureDay(day) && !row.dayStatuses[day]"
                  (click)="onMatrixCellClick(row, day)"
                  [title]="isFutureDay(day) ? ('Day ' + day + ': Future Date (Cannot mark attendance)') : (isHoliday(day) ? ('Holiday: ' + getHolidayName(day)) : (isWeekend(day) ? 'Weekly Weekend' : (row.dayStatuses[day] ? ('Day ' + day + ': ' + row.dayStatuses[day] + ' - Click to edit') : ('Day ' + day + ': Unmarked / Not Recorded - Click to edit'))))"
                >
                  <span *ngIf="isHoliday(day)" class="cell-holiday" [title]="getHolidayName(day)">H</span>
                  <span *ngIf="!isHoliday(day) && isWeekend(day)" class="cell-weekend">W</span>
                  <span *ngIf="!isHoliday(day) && !isWeekend(day) && isFutureDay(day)" class="cell-future" title="Future date">—</span>
                  <span *ngIf="!isHoliday(day) && !isWeekend(day) && !isFutureDay(day) && row.dayStatuses[day]" class="cell-badge" [class.badge-p]="row.dayStatuses[day] === 'Present'" [class.badge-a]="row.dayStatuses[day] === 'Absent'" [class.badge-l]="row.dayStatuses[day] === 'Late'">
                    {{ row.dayStatuses[day][0] }}
                  </span>
                  <span *ngIf="!isHoliday(day) && !isWeekend(day) && !isFutureDay(day) && !row.dayStatuses[day]" class="cell-unmarked" title="Unmarked / Not Recorded">—</span>
                </td>

                <td class="col-summary text-emerald font-bold">{{ row.presentDays }}</td>
                <td class="col-summary text-rose font-bold">{{ row.absentDays }}</td>
                <td class="col-summary text-amber font-bold">{{ row.lateDays }}</td>
                <td class="col-summary-pct font-bold" [class.text-emerald]="row.percentage >= 75" [class.text-rose]="row.percentage < 60">
                  {{ row.percentage }}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- VIEW 4: CHRONIC ABSENTEES WATCH            -->
      <!-- ========================================== -->
      <div *ngIf="activeViewMode === 'chronic'" class="card chronic-card">
        <div class="card-header no-print">
          <div class="card-title">
            <app-icon name="alert-triangle" [size]="18" class="text-rose"></app-icon>
            <span>Chronic Absenteeism & Defaulters Radar (&lt; 75% Attendance or Absent Today)</span>
          </div>
          <span class="count-pill pill-rose">{{ chronicAbsenteesList.length }} Students at Risk</span>
        </div>

        <div class="app-table-wrapper">
          <table class="app-table">
            <thead>
              <tr>
                <th style="width: 70px;">Roll</th>
                <th>Student Profile</th>
                <th style="width: 130px;">Today's Status</th>
                <th style="width: 120px; text-align: center;">Monthly Rate</th>
                <th>Guardian Contact Info</th>
                <th style="width: 150px; text-align: center;">Urgency Level</th>
                <th style="text-align: right; width: 160px;" class="no-print">Alert Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of chronicAbsenteesList">
                <td>
                  <span class="roll-pill">{{ s.student.rollNo || '—' }}</span>
                </td>

                <td>
                  <div class="student-profile-cell">
                    <img [src]="s.student.photoUrl || defaultAvatar" alt="Avatar" class="student-avatar" />
                    <div>
                      <div class="student-name font-bold">{{ s.student.fullName }}</div>
                      <div class="student-code text-muted text-xs">Section: {{ getSectionName(s.student.sectionId) }}</div>
                    </div>
                  </div>
                </td>

                <td>
                  <span 
                    class="attendance-status-badge" 
                    [class.badge-a]="s.isAbsentToday" 
                    [class.badge-p]="!s.isAbsentToday"
                  >
                    <app-icon [name]="s.isAbsentToday ? 'x' : 'check'" [size]="13"></app-icon>
                    <span>{{ s.isAbsentToday ? 'Absent Today' : 'Present Today' }}</span>
                  </span>
                </td>

                <td style="text-align: center;">
                  <span class="percentage-badge-danger font-bold">
                    {{ s.percentage }}%
                  </span>
                </td>

                <td>
                  <div>
                    <div class="guardian-name font-semibold">{{ s.student.fatherName || s.student.guardianName || 'Guardian' }}</div>
                    <div class="guardian-phone text-xs">
                      <app-icon name="phone" [size]="11" class="text-muted"></app-icon>
                      <a [href]="'tel:' + (s.student.fatherPhone || s.student.guardianPhone)" class="phone-link">
                        {{ s.student.fatherPhone || s.student.guardianPhone || 'No Phone' }}
                      </a>
                    </div>
                  </div>
                </td>

                <td style="text-align: center;">
                  <span class="urgency-pill" [class.urgency-high]="s.percentage < 50" [class.urgency-med]="s.percentage >= 50">
                    {{ s.percentage < 50 ? 'Critical Bar' : 'Warning' }}
                  </span>
                </td>

                <td style="text-align: right;" class="no-print">
                  <div class="btn-group-sm">
                    <button 
                      type="button" 
                      class="btn btn-primary-purple btn-xs" 
                      (click)="openDirectSMS(s.student)"
                    >
                      <app-icon name="message-circle" [size]="12"></app-icon>
                      <span>Send SMS</span>
                    </button>
                    <a 
                      *ngIf="s.student.fatherPhone || s.student.guardianPhone" 
                      [href]="'tel:' + (s.student.fatherPhone || s.student.guardianPhone)" 
                      class="btn btn-outline btn-xs"
                    >
                      <app-icon name="phone-call" [size]="12"></app-icon>
                      <span>Call</span>
                    </a>
                  </div>
                </td>
              </tr>

              <tr *ngIf="chronicAbsenteesList.length === 0">
                <td colspan="7" class="text-center py-5 text-muted">
                  <app-icon name="award" [size]="32" class="text-emerald mb-2"></app-icon>
                  <div>Outstanding! No students fall below the 75% attendance threshold in this cohort.</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- VIEW 5: AUDIT LOGS & CORRECTION HISTORY   -->
      <!-- ========================================== -->
      <div *ngIf="activeViewMode === 'corrections'" class="card logs-card">
        <div class="card-header no-print">
          <div class="card-title">
            <app-icon name="rotate-ccw" [size]="18" class="text-primary"></app-icon>
            <span>Attendance Corrections Audit Trail</span>
          </div>
          <span class="count-pill">{{ correctionLogs.length }} Corrections Logged</span>
        </div>

        <div class="app-table-wrapper">
          <table class="app-table">
            <thead>
              <tr>
                <th style="width: 140px;">Timestamp</th>
                <th style="width: 110px;">Register Date</th>
                <th>Student Name</th>
                <th style="width: 180px;">Status Change</th>
                <th>Reason / Justification</th>
                <th style="width: 140px;">Corrected By</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let log of correctionLogs">
                <td>
                  <span class="timestamp-text">{{ log.timestamp }}</span>
                </td>
                <td>
                  <span class="font-semibold">{{ log.date }}</span>
                </td>
                <td>
                  <strong>{{ log.studentName }}</strong>
                </td>
                <td>
                  <span class="change-tag-group">
                    <span class="old-tag">{{ log.previousStatus }}</span>
                    <app-icon name="arrow-right" [size]="12" class="mx-1"></app-icon>
                    <span class="new-tag">{{ log.newStatus }}</span>
                  </span>
                </td>
                <td>
                  <span class="reason-text">{{ log.reason }}</span>
                </td>
                <td>
                  <span class="badge-neutral">{{ log.updatedBy || 'Administrator' }}</span>
                </td>
              </tr>

              <tr *ngIf="correctionLogs.length === 0">
                <td colspan="6" class="text-center py-5 text-muted">
                  No attendance correction logs recorded yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- MODAL: QUICK CORRECTION                    -->
      <!-- ========================================== -->
      <app-modal 
        [isOpen]="isCorrectionModalOpen" 
        title="Correct Student Attendance Record" 
        (close)="isCorrectionModalOpen = false"
      >
        <form (ngSubmit)="saveCorrection()" class="modal-form">
          <div class="correction-target-banner" *ngIf="selectedRecordForCorrection">
            <div class="target-name font-bold">{{ selectedRecordForCorrection.studentName }}</div>
            <div class="target-meta text-muted text-xs">
              Roll: {{ selectedRecordForCorrection.rollNo }} • Date: {{ selectedRecordForCorrection.date }}
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Current Marked Status</label>
              <input 
                type="text" 
                [value]="selectedRecordForCorrection?.status" 
                class="form-control" 
                disabled 
              />
            </div>

            <div class="form-group">
              <label class="form-label">New Corrected Status <span class="required">*</span></label>
              <select [(ngModel)]="correctionForm.newStatus" name="newStatus" class="form-select" required>
                <option value="Present">Present (উপস্থিত)</option>
                <option value="Absent">Absent (অনুপস্থিত)</option>
                <option value="Late">Late (বিলম্বিত)</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Reason / Justification <span class="required">*</span></label>
            <select [(ngModel)]="correctionForm.quickReason" (change)="onQuickReasonChange()" name="quickReason" class="form-select mb-2">
              <option value="">-- Choose standard reason --</option>
              <option value="Medical Sick Leave approved by Headmaster">Medical Sick Leave approved by Headmaster</option>
              <option value="Biometric scanner miss-read / card malfunction">Biometric scanner miss-read / card malfunction</option>
              <option value="Authorized school event / sports participation">Authorized school event / sports participation</option>
              <option value="Severe transport / road disruption delay">Severe transport / road disruption delay</option>
              <option value="Parent written leave petition acknowledged">Parent written leave petition acknowledged</option>
            </select>
            <textarea 
              [(ngModel)]="correctionForm.reason" 
              name="reason" 
              rows="3" 
              class="form-control" 
              placeholder="Provide exact reason for institutional audit compliance..."
              required
            ></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" (click)="isCorrectionModalOpen = false">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!correctionForm.reason.trim()">
              <app-icon name="check" [size]="16"></app-icon>
              <span>Save & Log Correction</span>
            </button>
          </div>
        </form>
      </app-modal>

      <!-- ========================================== -->
      <!-- MODAL: GUARDIAN SMS DISPATCH              -->
      <!-- ========================================== -->
      <app-modal 
        [isOpen]="isSmsModalOpen" 
        title="Send Guardian Attendance SMS Notification" 
        (close)="isSmsModalOpen = false"
      >
        <form (ngSubmit)="sendGuardianSms()" class="modal-form">
          <div class="target-guardian-banner" *ngIf="selectedStudentForSms">
            <div class="font-bold">{{ selectedStudentForSms.fullName }}</div>
            <div class="text-xs text-muted">
              Guardian: {{ selectedStudentForSms.fatherName || selectedStudentForSms.guardianName }} 
              ({{ selectedStudentForSms.fatherPhone || selectedStudentForSms.guardianPhone }})
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">SMS Template</label>
            <select [(ngModel)]="smsForm.template" (change)="applySmsTemplate()" name="smsTemplate" class="form-select">
              <option value="absent_today">Today's Absence Alert (আজকের অনুপস্থিতি নোটিশ)</option>
              <option value="chronic_warning">Low Attendance Warning (< 75% সতর্কতা নোটিশ)</option>
              <option value="late_notice">Late Arrival Notification (দেরিতে আসার নোটিশ)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Message Body <span class="required">*</span></label>
            <textarea 
              [(ngModel)]="smsForm.message" 
              name="smsMessage" 
              rows="4" 
              class="form-control font-mono" 
              required
            ></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" (click)="isSmsModalOpen = false">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!smsForm.message.trim()">
              <app-icon name="send" [size]="16"></app-icon>
              <span>Dispatch SMS Now</span>
            </button>
          </div>
        </form>
      </app-modal>

      <!-- ========================================== -->
      <!-- MODAL: INSTITUTIONAL WEEKEND CONFIGURATION -->
      <!-- ========================================== -->
      <app-modal [isOpen]="isWeekendModalOpen" title="Institutional Weekend Configuration (সাপ্তাহিক ছুটি নির্ধারণ)" (close)="isWeekendModalOpen = false">
        <div class="modal-form">
          <div class="notice-info-box mb-3">
            <app-icon name="info" [size]="18" class="text-primary"></app-icon>
            <div>
              <strong>Principal Academic Authority:</strong>
              <p class="text-xs mb-0">Select the weekly non-instructional weekend days. Total working days and matrix grids will automatically recalculate without penalizing students.</p>
            </div>
          </div>

          <div class="form-group mb-3">
            <label class="form-label font-bold">Quick Presets</label>
            <div class="presets-row">
              <button type="button" class="btn-preset-chip" (click)="applyWeekendPreset('fri_sat')">
                Friday & Saturday (BD Standard 5-Day)
              </button>
              <button type="button" class="btn-preset-chip" (click)="applyWeekendPreset('fri_only')">
                Friday Only (BD 6-Day School)
              </button>
              <button type="button" class="btn-preset-chip" (click)="applyWeekendPreset('sat_sun')">
                Saturday & Sunday (English Medium)
              </button>
            </div>
          </div>

          <div class="form-group mb-3">
            <label class="form-label font-bold">Configure Weekend Days</label>
            <div class="days-checkbox-grid">
              <label *ngFor="let d of allDaysList" class="day-checkbox-card" [class.is-checked]="isWeekendDaySelected(d.day)">
                <input type="checkbox" [checked]="isWeekendDaySelected(d.day)" (change)="toggleWeekendDay(d.day)" />
                <span class="day-en">{{ d.name }}</span>
                <span class="day-bn">{{ d.bn }}</span>
              </label>
            </div>
          </div>

          <div class="form-group mb-3">
            <label class="form-label">Weekend Policy Note</label>
            <input type="text" [(ngModel)]="weekendCustomNote" class="form-control" placeholder="e.g. Standard Institutional Weekly Recess" />
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" (click)="isWeekendModalOpen = false">Cancel</button>
            <button type="button" class="btn btn-primary" (click)="saveWeekendSettings()" [disabled]="isSavingWeekend">
              <app-icon name="check" [size]="16"></app-icon>
              <span>{{ isSavingWeekend ? 'Saving...' : 'Save Weekend Configuration' }}</span>
            </button>
          </div>
        </div>
      </app-modal>

      <!-- ========================================== -->
      <!-- MODAL: INSTITUTIONAL HOLIDAYS DIRECTORY    -->
      <!-- ========================================== -->
      <app-modal [isOpen]="isHolidayModalOpen" title="Institutional Academic Holidays Calendar (ছুটির তালিকা)" (close)="isHolidayModalOpen = false">
        <div class="holiday-manager-wrapper">
          <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div class="search-wrap flex-grow-1">
              <app-icon name="search" [size]="15" class="search-icon"></app-icon>
              <input type="text" [(ngModel)]="holidaySearchQuery" class="form-control form-control-sm" placeholder="Search holidays by name or type..." />
            </div>
            <div class="d-flex gap-2">
              <button type="button" class="btn btn-outline btn-sm" (click)="loadStandardHolidayPresets()" title="Load BD National Academic Holiday presets">
                <app-icon name="refresh-cw" [size]="14"></app-icon>
                <span>Reset Defaults</span>
              </button>
              <button type="button" class="btn btn-primary btn-sm" (click)="openAddHolidayModal()">
                <app-icon name="plus" [size]="14"></app-icon>
                <span>Declare New Holiday</span>
              </button>
            </div>
          </div>

          <div class="holiday-table-wrapper">
            <table class="holiday-table">
              <thead>
                <tr>
                  <th>Holiday Title</th>
                  <th>Dates</th>
                  <th>Duration</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let h of filteredHolidays">
                  <td>
                    <div class="holiday-title font-semibold">{{ h.title }}</div>
                    <div class="holiday-desc text-muted text-xs" *ngIf="h.description">{{ h.description }}</div>
                  </td>
                  <td>
                    <span class="holiday-date-badge">{{ h.startDate }}<span *ngIf="h.endDate && h.endDate !== h.startDate"> to {{ h.endDate }}</span></span>
                  </td>
                  <td>
                    <span class="days-count-pill">{{ getHolidayDaysCount(h) }} Days</span>
                  </td>
                  <td>
                    <span class="holiday-type-pill" [ngClass]="'type-' + (h.type || 'public').toLowerCase()">{{ h.type }}</span>
                  </td>
                  <td>
                    <button type="button" class="btn-toggle-active" [class.is-active]="h.isActive" (click)="toggleHolidayActive(h)">
                      {{ h.isActive ? 'Active' : 'Inactive' }}
                    </button>
                  </td>
                  <td style="text-align: right;">
                    <button type="button" class="btn-icon-subtle" (click)="openEditHolidayModal(h)" title="Edit Holiday">
                      <app-icon name="edit-2" [size]="14"></app-icon>
                    </button>
                    <button type="button" class="btn-icon-subtle text-danger" (click)="deleteHoliday(h.id)" title="Delete Holiday">
                      <app-icon name="trash-2" [size]="14"></app-icon>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="filteredHolidays.length === 0">
                  <td colspan="6" class="text-center py-4 text-muted">
                    No academic holidays match your search.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="modal-actions mt-3">
            <button type="button" class="btn btn-outline" (click)="isHolidayModalOpen = false">Close</button>
          </div>
        </div>
      </app-modal>

      <!-- ========================================== -->
      <!-- MODAL: ADD / EDIT ACADEMIC HOLIDAY         -->
      <!-- ========================================== -->
      <app-modal [isOpen]="isAddHolidayModalOpen" [title]="isEditingHoliday ? 'Edit Declared Holiday' : 'Declare New Academic Holiday'" (close)="isAddHolidayModalOpen = false">
        <form (ngSubmit)="saveHoliday()" class="modal-form">
          <div class="form-group mb-3">
            <label class="form-label font-bold">Holiday Title / Occasion <span class="required">*</span></label>
            <input type="text" [(ngModel)]="holidayForm.title" name="holidayTitle" class="form-control" placeholder="e.g. Eid-ul-Fitr Vacation, Pohela Boishakh" required />
          </div>

          <div class="form-grid-2 mb-3">
            <div class="form-group">
              <label class="form-label font-bold">Start Date <span class="required">*</span></label>
              <input type="date" [(ngModel)]="holidayForm.startDate" (ngModelChange)="onHolidayStartDateChange()" name="holidayStartDate" class="form-control" required />
            </div>
            <div class="form-group">
              <label class="form-label font-bold">End Date (inclusive)</label>
              <input type="date" [(ngModel)]="holidayForm.endDate" name="holidayEndDate" class="form-control" />
            </div>
          </div>

          <div class="form-grid-2 mb-3">
            <div class="form-group">
              <label class="form-label font-bold">Category / Type</label>
              <select [(ngModel)]="holidayForm.type" name="holidayType" class="form-select">
                <option value="Public">Public / National (জাতীয় দিবস)</option>
                <option value="Religious">Religious (ধর্মীয় ছুটি)</option>
                <option value="Vacation">Institutional Vacation (গ্রীষ্ম/শীতকালীন অবকাশ)</option>
                <option value="Institutional">Institutional / Local (স্থানীয় ছুটি)</option>
                <option value="Emergency">Emergency / Weather (দুর্যোগকালীন ছুটি)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label font-bold">Status</label>
              <div class="pt-2">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="holidayForm.isActive" name="holidayIsActive" />
                  <span>Mark as Active Instructional Holiday</span>
                </label>
              </div>
            </div>
          </div>

          <div class="form-group mb-3">
            <label class="form-label">Description / Notification Details</label>
            <textarea [(ngModel)]="holidayForm.description" name="holidayDesc" rows="3" class="form-control" placeholder="Official announcement memo details..."></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" (click)="isAddHolidayModalOpen = false">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="isSavingHoliday || !holidayForm.title.trim() || !holidayForm.startDate">
              <app-icon name="check" [size]="16"></app-icon>
              <span>{{ isSavingHoliday ? 'Saving...' : 'Save Holiday' }}</span>
            </button>
          </div>
        </form>
      </app-modal>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
      max-width: 1600px;
      margin: 0 auto;
    }
    .header-badge-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 6px;
    }
    .badge-accent {
      background: #eff6ff;
      color: #2563eb;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 1px solid #bfdbfe;
    }
    .header-session-tag {
      font-size: 0.8125rem;
      color: #64748b;
      font-weight: 600;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }
    .page-title {
      font-size: 1.625rem;
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
    }
    .page-subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin-top: 4px;
      margin-bottom: 0;
    }
    .page-actions {
      display: flex;
      gap: 10px;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    .kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px 18px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .kpi-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .bg-emerald { background: #ecfdf5; }
    .text-emerald { color: #059669; }
    .bg-rose { background: #fff1f2; }
    .text-rose { color: #e11d48; }
    .bg-amber { background: #fffbeb; }
    .text-amber { color: #d97706; }
    .bg-indigo { background: #eef2ff; }
    .text-indigo { color: #4f46e5; }
    .kpi-details { flex: 1; }
    .kpi-label {
      font-size: 0.775rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .kpi-val-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-top: 2px;
    }
    .kpi-number {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
    }
    .kpi-trend {
      font-size: 0.75rem;
      font-weight: 700;
    }
    .kpi-badge-pill {
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .pill-rose { background: #ffe4e6; color: #be123c; }
    .pill-amber { background: #fef3c7; color: #b45309; }
    .kpi-subtext {
      font-size: 0.75rem;
      color: #94a3b8;
      display: block;
      margin-top: 2px;
    }

    /* Filter Card */
    .filter-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
    }
    .filter-flex-row {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .view-mode-pill-group {
      display: flex;
      gap: 6px;
      background: #f1f5f9;
      padding: 4px;
      border-radius: 10px;
      width: fit-content;
      flex-wrap: wrap;
    }
    .view-pill {
      background: transparent;
      border: none;
      padding: 8px 14px;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #475569;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .view-pill:hover { color: #0f172a; }
    .view-pill.active {
      background: #ffffff;
      color: #4f46e5;
      font-weight: 700;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    .selectors-cluster {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }
    .filter-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .filter-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #64748b;
      white-space: nowrap;
    }
    .search-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
    }
    .search-input-wrap {
      position: relative;
    }
    .search-ico {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }
    .search-input-wrap input {
      padding-left: 30px;
      width: 220px;
    }

    /* Tables */
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      overflow: hidden;
    }
    .card-header {
      padding: 14px 18px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
    }
    .card-title {
      font-size: 0.9375rem;
      font-weight: 700;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .header-tags-row {
      display: flex;
      gap: 8px;
    }
    .status-summary-tag {
      font-size: 0.775rem;
      padding: 3px 10px;
      border-radius: 6px;
      font-weight: 600;
    }
    .tag-present { background: #d1fae5; color: #065f46; }
    .tag-absent { background: #ffe4e6; color: #9f1239; }
    .tag-late { background: #fef3c7; color: #92400e; }
    .tag-holiday { background: #fee2e2; color: #b91c1c; font-weight: 700; border: 1px solid #fca5a5; }
    .tag-weekend { background: #e0e7ff; color: #4338ca; font-weight: 700; border: 1px solid #c7d2fe; }
    .tag-total { background: #f1f5f9; color: #475569; }

    /* Alert Notice Banners */
    .alert-notice-box {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 10px;
      border: 1px solid transparent;
      margin: 14px 18px 0;
    }
    .notice-holiday {
      background: #fff1f2;
      border-color: #fecdd3;
    }
    .notice-weekend {
      background: #eef2ff;
      border-color: #c7d2fe;
    }
    .alert-notice-icon {
      flex-shrink: 0;
    }
    .alert-notice-content {
      flex: 1;
    }
    .alert-notice-title {
      font-size: 0.875rem;
      margin-bottom: 2px;
    }
    .badge-holiday-chip {
      background: #fee2e2;
      color: #b91c1c;
      font-weight: 700;
      font-size: 0.725rem;
      padding: 4px 10px;
      border-radius: 12px;
      text-transform: uppercase;
      border: 1px solid #fca5a5;
    }
    .badge-weekend-chip {
      background: #e0e7ff;
      color: #4338ca;
      font-weight: 700;
      font-size: 0.725rem;
      padding: 4px 10px;
      border-radius: 12px;
      text-transform: uppercase;
      border: 1px solid #c7d2fe;
    }

    .app-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .app-table th {
      background: #f8fafc;
      padding: 10px 14px;
      font-weight: 700;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
    }
    .app-table td {
      padding: 12px 14px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .app-table tr:hover { background: #f8fafc; }
    .row-absent { background: #fffdfd; }
    .row-late { background: #fffdf9; }
    .row-holiday { background: #fff5f5 !important; }
    .row-weekend { background: #f8faff !important; }

    .roll-pill {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      font-size: 0.75rem;
      padding: 3px 8px;
      border-radius: 6px;
      font-family: monospace;
    }
    .student-profile-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .student-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      object-fit: cover;
      border: 1px solid #e2e8f0;
    }
    .student-name {
      font-size: 0.875rem;
      color: #0f172a;
    }
    .class-section-pill {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
    }

    .attendance-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .badge-p { background: #d1fae5; color: #047857; }
    .badge-a { background: #ffe4e6; color: #be123c; }
    .badge-l { background: #fef3c7; color: #b45309; }
    .badge-h { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
    .badge-w { background: #e0e7ff; color: #4338ca; border: 1px solid #c7d2fe; }

    .btn-quick-correct {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.15s;
    }
    .btn-quick-correct:hover {
      background: #f1f5f9;
      border-color: #94a3b8;
      color: #0f172a;
    }

    /* Monthly Summary & Progress */
    .progress-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .progress-bar-wrap {
      flex: 1;
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s;
    }
    .fill-emerald { background: #10b981; }
    .fill-amber { background: #f59e0b; }
    .fill-rose { background: #f43f5e; }
    .percentage-label {
      font-size: 0.8125rem;
      width: 44px;
      text-align: right;
    }

    .eligibility-tag {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 6px;
      display: inline-block;
    }
    .el-reg { background: #d1fae5; color: #065f46; }
    .el-col { background: #fef3c7; color: #92400e; }
    .el-non { background: #ffe4e6; color: #9f1239; }

    .legend-pills-row {
      display: flex;
      gap: 8px;
    }
    .legend-pill {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .pill-reg { background: #d1fae5; color: #047857; }
    .pill-col { background: #fef3c7; color: #b45309; }
    .pill-non { background: #ffe4e6; color: #be123c; }
    .pill-neutral { background: #f1f5f9; color: #334155; }
    .pill-rose { background: #fee2e2; color: #b91c1c; }

    /* Calendar Matrix Grid */
    .matrix-key-legend {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }
    .key-box {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
    }
    .key-box.key-p { background: #d1fae5; color: #047857; }
    .key-box.key-a { background: #ffe4e6; color: #be123c; }
    .key-box.key-l { background: #fef3c7; color: #b45309; }
    .key-box.key-w { background: #e0e7ff; color: #4338ca; }
    .key-box.key-holiday { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
    .matrix-table-scroll-wrapper {
      overflow-x: auto;
      max-width: 100%;
    }
    .matrix-grid-table {
      border-collapse: separate;
      border-spacing: 0;
      width: 100%;
      font-size: 0.8125rem;
    }
    .matrix-grid-table th, .matrix-grid-table td {
      border-bottom: 1px solid #f1f5f9;
      border-right: 1px solid #f8fafc;
      padding: 8px 6px;
      text-align: center;
    }
    .sticky-col {
      position: sticky;
      background: #ffffff;
      z-index: 2;
    }
    .matrix-grid-table thead .sticky-col {
      background: #f8fafc;
      z-index: 3;
    }
    .col-roll { left: 0; z-index: 2; border-right: 1px solid #e2e8f0; }
    .col-name { left: 50px; z-index: 2; border-right: 2px solid #cbd5e1; text-align: left; }
    .student-name-short {
      font-weight: 700;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 160px;
      display: inline-block;
    }
    .day-col-header {
      background: #f8fafc;
      min-width: 32px;
      font-size: 0.6875rem;
      padding: 6px 2px;
    }
    .day-num { font-weight: 800; color: #0f172a; }
    .day-name { font-size: 0.625rem; color: #64748b; }
    .is-weekend { background: #f8fafc !important; }
    .day-cell {
      cursor: pointer;
      min-width: 30px;
    }
    .day-cell:hover { background: #eef2ff !important; }
    .cell-weekend {
      color: #94a3b8;
      font-size: 0.6875rem;
      font-weight: 600;
    }
    .cell-badge {
      display: inline-block;
      width: 22px;
      height: 22px;
      line-height: 22px;
      border-radius: 4px;
      font-weight: 800;
      font-size: 0.6875rem;
    }
    .col-summary {
      font-weight: 700;
      min-width: 32px;
      background: #f8fafc;
    }
    .col-summary-pct {
      font-weight: 800;
      min-width: 44px;
      background: #f8fafc;
    }

    /* Chronic Absentees */
    .percentage-badge-danger {
      background: #ffe4e6;
      color: #be123c;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.8125rem;
    }
    .phone-link {
      color: #4f46e5;
      text-decoration: none;
      font-weight: 600;
    }
    .phone-link:hover { text-decoration: underline; }
    .urgency-pill {
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .urgency-high { background: #fee2e2; color: #991b1b; }
    .urgency-med { background: #fef3c7; color: #92400e; }
    .btn-group-sm {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
    }
    .btn-primary-purple {
      background: #4f46e5;
      color: #ffffff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-weight: 600;
    }
    .btn-primary-purple:hover { background: #4338ca; }

    /* Corrections Audit */
    .change-tag-group {
      display: inline-flex;
      align-items: center;
    }
    .old-tag {
      background: #fee2e2;
      color: #991b1b;
      font-weight: 700;
      font-size: 0.725rem;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .new-tag {
      background: #d1fae5;
      color: #065f46;
      font-weight: 700;
      font-size: 0.725rem;
      padding: 2px 6px;
      border-radius: 4px;
    }

    /* Modals */
    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .correction-target-banner, .target-guardian-banner {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 10px 14px;
      border-radius: 8px;
    }
    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 8px;
    }
    .required { color: #ef4444; }

    /* Print styling */
    .print-only { display: none; }
    @media print {
      .no-print { display: none !important; }
      .print-only { display: block !important; }
      .page-container { padding: 0; }
      .card { border: none; box-shadow: none; }
      .print-header-banner {
        text-align: center;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 2px solid #000;
      }
      .print-institution { font-size: 1.4rem; margin: 0; font-weight: bold; }
      .print-doc-title { font-size: 1.1rem; margin: 4px 0; }
      .print-meta-line {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
        margin: 6px 0 0;
      }
      .app-table th, .app-table td {
        padding: 6px 8px;
        font-size: 0.8rem;
        border-bottom: 1px solid #ccc;
      }
    }

    @media (max-width: 1024px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .kpi-grid { grid-template-columns: 1fr; }
      .filter-flex-row { flex-direction: column; }
    }

    /* Weekend & Holiday Controls & Modal Styles */
    .btn-preset-chip {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-preset-chip:hover {
      background: #e2e8f0;
      color: #0f172a;
      border-color: #94a3b8;
    }
    .presets-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 6px;
    }
    .days-checkbox-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 8px;
      margin-top: 6px;
    }
    .day-checkbox-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 10px 8px;
      border-radius: 8px;
      border: 1.5px solid #e2e8f0;
      background: #ffffff;
      cursor: pointer;
      position: relative;
      transition: all 0.2s;
    }
    .day-checkbox-card.is-checked {
      background: #eef2ff;
      border-color: #6366f1;
    }
    .day-checkbox-card input[type="checkbox"] {
      position: absolute;
      top: 8px;
      right: 8px;
    }
    .day-checkbox-card .day-en {
      font-weight: 700;
      font-size: 0.8125rem;
      color: #1e293b;
    }
    .day-checkbox-card .day-bn {
      font-size: 0.75rem;
      color: #64748b;
    }
    .holiday-manager-wrapper {
      padding: 4px;
    }
    .holiday-table-wrapper {
      max-height: 420px;
      overflow-y: auto;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    .holiday-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }
    .holiday-table th {
      background: #f8fafc;
      padding: 10px 12px;
      font-weight: 600;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
    }
    .holiday-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .holiday-date-badge {
      background: #f1f5f9;
      padding: 3px 8px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 0.75rem;
      font-weight: 600;
      color: #334155;
    }
    .days-count-pill {
      background: #e0e7ff;
      color: #4338ca;
      font-weight: 700;
      font-size: 0.7rem;
      padding: 2px 7px;
      border-radius: 12px;
    }
    .holiday-type-pill {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
    }
    .type-public { background: #fee2e2; color: #b91c1c; }
    .type-religious { background: #fef3c7; color: #b45309; }
    .type-vacation { background: #e0f2fe; color: #0369a1; }
    .type-institutional { background: #f3e8ff; color: #7e22ce; }
    .type-emergency { background: #ffe4e6; color: #e11d48; }

    .btn-toggle-active {
      border: none;
      background: #dcfce7;
      color: #15803d;
      font-weight: 700;
      font-size: 0.7rem;
      padding: 3px 10px;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-toggle-active:not(.is-active) {
      background: #f1f5f9;
      color: #94a3b8;
    }

    /* Matrix holiday & weekend markers */
    .key-box.key-holiday {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fca5a5;
    }
    .day-col-header.is-holiday {
      background: #fee2e2 !important;
      color: #991b1b !important;
    }
    .day-cell.is-holiday {
      background: #fff1f2;
    }
    .cell-holiday {
      background: #fee2e2;
      color: #b91c1c;
      font-weight: 800;
      font-size: 0.75rem;
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
    }
    .day-holiday-dot {
      width: 5px;
      height: 5px;
      background: #ef4444;
      border-radius: 50%;
      margin: 2px auto 0;
    }

    /* Matrix Unmarked & Future Date markers */
    .key-box.key-unmarked {
      background: #f8fafc;
      color: #64748b;
      border: 1px solid #cbd5e1;
    }
    .key-box.key-future {
      background: #f1f5f9;
      color: #94a3b8;
      border: 1px dashed #cbd5e1;
    }
    .day-col-header.is-future {
      background: #f8fafc !important;
      color: #94a3b8 !important;
      opacity: 0.7;
    }
    .day-cell.is-future {
      background: #fafafa;
      cursor: not-allowed;
    }
    .cell-future {
      color: #cbd5e1;
      font-weight: 700;
      font-size: 0.8rem;
    }
    .day-cell.is-unmarked {
      background: #fcfcfc;
    }
    .cell-unmarked {
      color: #94a3b8;
      font-weight: 700;
      font-size: 0.85rem;
    }
    .tag-future {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
    }
    .tag-unmarked {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }
    .notice-future {
      background: #f8fafc;
      border-left: 4px solid #64748b;
    }
    .notice-unmarked {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
    }
    .badge-unmarked {
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid #e2e8f0;
    }
    .row-unmarked {
      background-color: #fafafa;
    }
  `]
})
export class AttendanceReportsComponent implements OnInit {
  private attendanceStore = inject(AttendanceStoreService);
  private academicStore = inject(AcademicStoreService);
  private studentStore = inject(StudentStoreService);
  private systemStore = inject(SystemStoreService);
  private campusSession = inject(CampusSessionService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80';

  classes: SchoolClass[] = [];
  sections: Section[] = [];
  allStudents: Student[] = [];

  activeViewMode: 'daily' | 'monthly' | 'matrix' | 'chronic' | 'corrections' = 'daily';

  selectedClassId = '';
  selectedSectionId = 'ALL';
  selectedDate = new Date().toISOString().split('T')[0];
  selectedMonthYear = new Date().toISOString().substring(0, 7); // e.g. "2026-11"
  searchQuery = '';

  dailyRecords: DailyReportRecord[] = [];
  monthlyStats: StudentMonthlyStat[] = [];
  correctionLogs: AttendanceCorrectionLog[] = [];
  hasSubmittedAttendance = false;

  get systemDate(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  get currentMonthYear(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  isFutureDate(dateStr: string): boolean {
    if (!dateStr) return false;
    return dateStr.split('T')[0] > this.systemDate;
  }

  isFutureDay(day: number): boolean {
    const dayStr = `${this.selectedMonthYear}-${String(day).padStart(2, '0')}`;
    return dayStr > this.systemDate;
  }

  onDateChange() {
    if (this.selectedDate > this.systemDate) {
      this.selectedDate = this.systemDate;
      this.toast.warning('Future Date Restricted', `Future dates are not permitted. Automatically reset to system date (${this.systemDate}).`);
    }
    this.loadAttendanceData();
  }

  onMonthChange() {
    if (this.selectedMonthYear > this.currentMonthYear) {
      this.selectedMonthYear = this.currentMonthYear;
      this.toast.warning('Future Month Restricted', 'Future months cannot be selected.');
    }
    this.loadMonthlyRangeData();
  }

  // Principal Weekend & Holiday Controls
  isWeekendModalOpen = false;
  isHolidayModalOpen = false;
  isAddHolidayModalOpen = false;
  isEditingHoliday = false;
  isSavingWeekend = false;
  isSavingHoliday = false;

  weekendSettings: WeekendSettings = { weekendDays: [5, 6], customNote: 'Friday & Saturday Weekly Weekend' };
  editWeekendDays: number[] = [5, 6];
  weekendCustomNote: string = '';

  holidays: AcademicHoliday[] = [];
  holidaySearchQuery: string = '';
  holidayForm: AcademicHoliday = {
    id: '',
    title: '',
    startDate: '',
    endDate: '',
    type: 'Public',
    description: '',
    isActive: true
  };

  allDaysList = [
    { day: 0, name: 'Sunday', bn: 'রবিবার' },
    { day: 1, name: 'Monday', bn: 'সোমবার' },
    { day: 2, name: 'Tuesday', bn: 'মঙ্গলবার' },
    { day: 3, name: 'Wednesday', bn: 'বুধবার' },
    { day: 4, name: 'Thursday', bn: 'বৃহস্পতিবার' },
    { day: 5, name: 'Friday', bn: 'শুক্রবার' },
    { day: 6, name: 'Saturday', bn: 'শনিবার' }
  ];

  // Correction Modal
  isCorrectionModalOpen = false;
  selectedRecordForCorrection: DailyReportRecord | null = null;
  correctionForm = {
    newStatus: 'Present',
    quickReason: '',
    reason: ''
  };

  // SMS Modal
  isSmsModalOpen = false;
  selectedStudentForSms: Student | null = null;
  smsForm = {
    template: 'absent_today',
    message: ''
  };

  async ngOnInit() {
    this.classes = this.academicStore.getClasses();
    this.sections = this.academicStore.getSections();
    this.allStudents = this.studentStore.getStudents();

    if (this.classes.length > 0) {
      this.selectedClassId = this.classes[0].id;
    }

    // Subscribe to weekend settings and holidays
    this.attendanceStore.getWeekendSettings$().subscribe(settings => {
      if (settings) {
        this.weekendSettings = settings;
        this.editWeekendDays = [...settings.weekendDays];
        this.weekendCustomNote = settings.customNote || '';
        this.loadMonthlyRangeData();
        this.loadAttendanceData();
        this.cdr.markForCheck();
      }
    });

    this.attendanceStore.getHolidays$().subscribe(hList => {
      if (hList) {
        this.holidays = hList;
        this.loadMonthlyRangeData();
        this.loadAttendanceData();
        this.cdr.markForCheck();
      }
    });

    this.attendanceStore.fetchWeekendSettings().subscribe();
    this.attendanceStore.fetchHolidays().subscribe(hList => {
      if (hList && hList.length > 0) {
        this.holidays = hList;
        this.loadMonthlyRangeData();
        this.loadAttendanceData();
        this.cdr.markForCheck();
      }
    });

    // Load initial data
    this.loadAttendanceData();
    this.loadCorrections();

    // Re-sync with backend
    try {
      const [c, s, st] = await Promise.all([
        this.academicStore.loadClasses(),
        this.academicStore.loadSections(),
        this.studentStore.loadStudents()
      ]);
      this.classes = c || [];
      this.sections = s || [];
      this.allStudents = st || [];
      if (!this.selectedClassId && this.classes.length > 0) {
        this.selectedClassId = this.classes[0].id;
      }
      this.loadAttendanceData();
      this.cdr.markForCheck();
    } catch (e) {
      console.warn('Attendance reports init sync error:', e);
    }
  }

  get availableSections(): Section[] {
    return this.sections.filter(s => s.classId === this.selectedClassId);
  }

  get classStudents(): Student[] {
    return this.allStudents.filter(s => {
      const matchClass = s.classId === this.selectedClassId;
      const matchSection = this.selectedSectionId === 'ALL' || s.sectionId === this.selectedSectionId;
      return matchClass && matchSection;
    });
  }

  onClassChange() {
    this.selectedSectionId = 'ALL';
    this.loadAttendanceData();
  }

  setViewMode(mode: 'daily' | 'monthly' | 'matrix' | 'chronic' | 'corrections') {
    this.activeViewMode = mode;
    if (mode === 'daily') {
      this.loadAttendanceData();
    } else if (mode === 'monthly' || mode === 'matrix' || mode === 'chronic') {
      this.loadMonthlyRangeData();
    } else if (mode === 'corrections') {
      this.loadCorrections();
    }
  }

  loadAttendanceData() {
    if (!this.selectedClassId) return;

    if (this.selectedDate > this.systemDate) {
      this.selectedDate = this.systemDate;
    }

    const holiday = this.getDateHoliday(this.selectedDate);
    const isWeekendDay = this.isDateWeekend(this.selectedDate);
    const isFuture = this.isFutureDate(this.selectedDate);

    this.attendanceStore.fetchAttendanceRecords(this.selectedClassId, this.selectedSectionId, this.selectedDate).subscribe(records => {
      this.hasSubmittedAttendance = !!(records && records.length > 0);
      const mapped: DailyReportRecord[] = this.classStudents.map(st => {
        const existing = records.find(r => r.studentId === st.id);
        if (existing) {
          return { ...existing, student: st };
        }
        return {
          id: 'temp-' + st.id,
          date: this.selectedDate,
          studentId: st.id,
          studentName: st.fullName,
          rollNo: st.rollNo || '01',
          classId: st.classId,
          sectionId: st.sectionId,
          status: (holiday ? 'Holiday' : (isWeekendDay ? 'Weekend' : 'Unmarked')) as any,
          markedBy: holiday ? 'Academic Calendar' : (isWeekendDay ? 'Institutional Weekend' : (isFuture ? 'Future Date' : 'Not Recorded')),
          remark: holiday ? `Holiday: ${holiday.title}` : (isWeekendDay ? 'Weekly Weekend' : (isFuture ? 'Future session' : 'Pending roll-call')),
          student: st
        };
      });

      this.dailyRecords = mapped;
      this.cdr.markForCheck();
    });
  }

  loadMonthlyRangeData() {
    if (!this.selectedClassId) return;

    const [year, month] = this.selectedMonthYear.split('-').map(Number);
    const startDate = `${this.selectedMonthYear}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${this.selectedMonthYear}-${String(lastDay).padStart(2, '0')}`;

    this.attendanceStore.fetchAttendanceRange(this.selectedClassId, this.selectedSectionId === 'ALL' ? undefined : this.selectedSectionId, startDate, endDate)
      .subscribe(records => {
        this.computeMonthlyStats(records, lastDay);
        this.cdr.markForCheck();
      });
  }

  private computeMonthlyStats(records: AttendanceRecord[], totalDaysInMonth: number) {
    const students = this.classStudents;
    const [year, month] = this.selectedMonthYear.split('-').map(Number);
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && (today.getMonth() + 1) === month;
    const isPastMonth = (today.getFullYear() > year) || (today.getFullYear() === year && (today.getMonth() + 1) > month);

    // Only elapsed instructional days up to min(today, totalDays) should count for working days
    const maxElapsedDay = isCurrentMonth ? Math.min(totalDaysInMonth, today.getDate()) : (isPastMonth ? totalDaysInMonth : 0);

    let workingDaysCount = 0;
    for (let d = 1; d <= maxElapsedDay; d++) {
      if (!this.isNonInstructionalDay(d)) {
        workingDaysCount++;
      }
    }

    this.monthlyStats = students.map((st) => {
      const studentRecords = records.filter(r => r.studentId === st.id);
      const dayStatuses: { [day: number]: string } = {};

      for (const r of studentRecords) {
        const d = parseInt(r.date.split('-')[2], 10);
        if (!isNaN(d)) {
          dayStatuses[d] = r.status;
        }
      }

      let presentDays = 0;
      let absentDays = 0;
      let lateDays = 0;
      let recordedSessions = 0;

      for (let day = 1; day <= totalDaysInMonth; day++) {
        if (this.isHoliday(day)) {
          dayStatuses[day] = 'Holiday';
          continue;
        }
        if (this.isWeekend(day)) {
          dayStatuses[day] = 'Weekend';
          continue;
        }
        if (this.isFutureDay(day)) {
          delete dayStatuses[day];
          continue;
        }

        const stat = dayStatuses[day];
        if (stat === 'Present') {
          presentDays++;
          recordedSessions++;
        } else if (stat === 'Absent') {
          absentDays++;
          recordedSessions++;
        } else if (stat === 'Late') {
          lateDays++;
          recordedSessions++;
        } else {
          // No record exists in DB for this past/today working day -> Unmarked! NO FAKE DATA!
          delete dayStatuses[day];
        }
      }

      // Calculate percentage strictly from real recorded instructional sessions
      const percentage = recordedSessions > 0
        ? Math.round(((presentDays + (lateDays * 0.5)) / recordedSessions) * 100)
        : (workingDaysCount === 0 ? 100 : 0);

      let eligibility: 'Regular' | 'Collegiate' | 'Non-Collegiate' = 'Regular';
      if (percentage < 60) eligibility = 'Non-Collegiate';
      else if (percentage < 75) eligibility = 'Collegiate';

      return {
        student: st,
        presentDays,
        absentDays,
        lateDays,
        totalWorkingDays: workingDaysCount,
        percentage,
        eligibility,
        dayStatuses
      };
    });
  }

  loadCorrections() {
    this.attendanceStore.fetchAttendanceCorrections().subscribe(logs => {
      this.correctionLogs = logs;
      this.cdr.markForCheck();
    });
  }

  // Filtered lists
  get filteredDailyRecords() {
    if (!this.searchQuery.trim()) return this.dailyRecords;
    const q = this.searchQuery.toLowerCase().trim();
    return this.dailyRecords.filter(r =>
      r.studentName.toLowerCase().includes(q) ||
      (r.rollNo && r.rollNo.includes(q))
    );
  }

  get filteredMonthlyStats() {
    if (!this.searchQuery.trim()) return this.monthlyStats;
    const q = this.searchQuery.toLowerCase().trim();
    return this.monthlyStats.filter(s =>
      s.student.fullName.toLowerCase().includes(q) ||
      (s.student.rollNo && s.student.rollNo.includes(q))
    );
  }

  get chronicAbsenteesList() {
    return this.monthlyStats
      .filter(s => s.percentage < 75 || this.isAbsentToday(s.student.id))
      .map(s => ({
        ...s,
        isAbsentToday: this.isAbsentToday(s.student.id)
      }));
  }

  private isAbsentToday(studentId: string): boolean {
    const rec = this.dailyRecords.find(r => r.studentId === studentId);
    return rec ? rec.status === 'Absent' : false;
  }

  // KPI Computations
  get isSelectedDateNonInstructional(): boolean {
    return !!this.getDateHoliday(this.selectedDate) || this.isDateWeekend(this.selectedDate);
  }

  get isSelectedDateHoliday(): boolean {
    return !!this.getDateHoliday(this.selectedDate);
  }

  get isSelectedDateWeekend(): boolean {
    return this.isDateWeekend(this.selectedDate);
  }

  get selectedDateHolidayName(): string {
    const h = this.getDateHoliday(this.selectedDate);
    return h ? h.title : '';
  }

  get todayPresentCount(): number {
    if (this.isSelectedDateNonInstructional || !this.hasSubmittedAttendance || this.isFutureDate(this.selectedDate)) return 0;
    return this.dailyRecords.filter(r => r.status === 'Present').length;
  }
  get todayAbsentCount(): number {
    if (this.isSelectedDateNonInstructional || !this.hasSubmittedAttendance || this.isFutureDate(this.selectedDate)) return 0;
    return this.dailyRecords.filter(r => r.status === 'Absent').length;
  }
  get todayLateCount(): number {
    if (this.isSelectedDateNonInstructional || !this.hasSubmittedAttendance || this.isFutureDate(this.selectedDate)) return 0;
    return this.dailyRecords.filter(r => r.status === 'Late').length;
  }
  get todayPresentPercentage(): number {
    if (this.isSelectedDateNonInstructional) return 100;
    if (this.isFutureDate(this.selectedDate) || !this.hasSubmittedAttendance) return 0;
    const recordedCount = this.dailyRecords.filter(r => r.status === 'Present' || r.status === 'Absent' || r.status === 'Late').length;
    if (recordedCount === 0) return 0;
    return Math.round((this.todayPresentCount / recordedCount) * 100);
  }
  get monthlyAveragePercentage(): number {
    if (this.monthlyStats.length === 0) return 0;
    const activeStats = this.monthlyStats.filter(s => (s.presentDays + s.absentDays + s.lateDays) > 0);
    if (activeStats.length === 0) return 0;
    const sum = activeStats.reduce((acc, s) => acc + s.percentage, 0);
    return Math.round(sum / activeStats.length);
  }

  get dailyFilteredStats() {
    return {
      present: this.filteredDailyRecords.filter(r => r.status === 'Present').length,
      absent: this.filteredDailyRecords.filter(r => r.status === 'Absent').length,
      late: this.filteredDailyRecords.filter(r => r.status === 'Late').length
    };
  }

  // Calendar matrix helpers
  get monthDays(): number[] {
    const [year, month] = this.selectedMonthYear.split('-').map(Number);
    const total = new Date(year, month, 0).getDate();
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  getWeekendDaysShortLabel(): string {
    if (!this.weekendSettings || !this.weekendSettings.weekendDays || this.weekendSettings.weekendDays.length === 0) {
      return 'None';
    }
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return this.weekendSettings.weekendDays.map(d => names[d]).join(', ');
  }

  openWeekendModal() {
    this.editWeekendDays = [...(this.weekendSettings.weekendDays || [5, 6])];
    this.weekendCustomNote = this.weekendSettings.customNote || '';
    this.isWeekendModalOpen = true;
  }

  isWeekendDaySelected(day: number): boolean {
    return this.editWeekendDays.includes(day);
  }

  toggleWeekendDay(day: number) {
    if (this.editWeekendDays.includes(day)) {
      this.editWeekendDays = this.editWeekendDays.filter(d => d !== day);
    } else {
      this.editWeekendDays = [...this.editWeekendDays, day].sort();
    }
  }

  applyWeekendPreset(preset: string) {
    if (preset === 'fri_sat') {
      this.editWeekendDays = [5, 6];
      this.weekendCustomNote = 'Standard BD 5-day week (Friday & Saturday)';
    } else if (preset === 'fri_only') {
      this.editWeekendDays = [5];
      this.weekendCustomNote = 'Standard BD 6-day school (Friday only)';
    } else if (preset === 'sat_sun') {
      this.editWeekendDays = [0, 6];
      this.weekendCustomNote = 'Saturday & Sunday weekend';
    }
  }

  async saveWeekendSettings() {
    this.isSavingWeekend = true;
    try {
      await this.attendanceStore.saveWeekendSettings({
        weekendDays: this.editWeekendDays,
        customNote: this.weekendCustomNote
      });
      this.toast.success('Weekend Configured', 'Weekly institutional weekend days saved.');
      this.isWeekendModalOpen = false;
      this.loadMonthlyRangeData();
      this.loadAttendanceData();
    } catch (err: any) {
      this.toast.error('Error', 'Could not save weekend configuration.');
    } finally {
      this.isSavingWeekend = false;
      this.cdr.markForCheck();
    }
  }

  openHolidayModal() {
    this.holidaySearchQuery = '';
    this.isHolidayModalOpen = true;
  }

  openAddHolidayModal() {
    this.isEditingHoliday = false;
    this.holidayForm = {
      id: '',
      title: '',
      startDate: this.selectedDate,
      endDate: this.selectedDate,
      type: 'Public',
      description: '',
      isActive: true
    };
    this.isAddHolidayModalOpen = true;
  }

  openEditHolidayModal(h: AcademicHoliday) {
    this.isEditingHoliday = true;
    this.holidayForm = { ...h };
    this.isAddHolidayModalOpen = true;
  }

  onHolidayStartDateChange() {
    if (!this.holidayForm.endDate || this.holidayForm.endDate < this.holidayForm.startDate) {
      this.holidayForm.endDate = this.holidayForm.startDate;
    }
  }

  async saveHoliday() {
    if (!this.holidayForm.title.trim() || !this.holidayForm.startDate) return;
    this.isSavingHoliday = true;
    try {
      const payload: AcademicHoliday = {
        ...this.holidayForm,
        endDate: this.holidayForm.endDate || this.holidayForm.startDate
      };
      await this.attendanceStore.saveHoliday(payload);
      this.toast.success('Holiday Saved', `"${payload.title}" saved successfully.`);
      this.isAddHolidayModalOpen = false;
      this.loadMonthlyRangeData();
      this.loadAttendanceData();
    } catch (err: any) {
      this.toast.error('Error', 'Could not save holiday.');
    } finally {
      this.isSavingHoliday = false;
      this.cdr.markForCheck();
    }
  }

  async deleteHoliday(id: string) {
    if (!confirm('Are you sure you want to remove this academic holiday?')) return;
    try {
      await this.attendanceStore.deleteHoliday(id);
      this.toast.info('Holiday Removed', 'Academic holiday deleted.');
      this.loadMonthlyRangeData();
      this.loadAttendanceData();
    } catch (err: any) {
      this.toast.error('Error', 'Could not remove holiday.');
    }
  }

  async toggleHolidayActive(h: AcademicHoliday) {
    try {
      await this.attendanceStore.saveHoliday({ ...h, isActive: !h.isActive });
      this.toast.info('Status Updated', `Holiday ${h.title} is now ${!h.isActive ? 'Active' : 'Inactive'}.`);
      this.loadMonthlyRangeData();
      this.loadAttendanceData();
    } catch (err: any) {
      this.toast.error('Error', 'Could not toggle holiday status.');
    }
  }

  async loadStandardHolidayPresets() {
    const defaultHolidays: AcademicHoliday[] = [
      { id: 'h-1', title: 'Shaheed Day & International Mother Language Day', startDate: '2026-02-21', endDate: '2026-02-21', type: 'Public', description: 'National mourning & language movement homage', isActive: true },
      { id: 'h-2', title: 'Independence & National Day', startDate: '2026-03-26', endDate: '2026-03-26', type: 'Public', description: 'National Independence Day celebration', isActive: true },
      { id: 'h-3', title: 'Pohela Boishakh (Bangla New Year)', startDate: '2026-04-14', endDate: '2026-04-14', type: 'Public', description: 'Traditional Bengali New Year celebration', isActive: true },
      { id: 'h-4', title: 'Eid-ul-Fitr Vacation', startDate: '2026-03-18', endDate: '2026-03-24', type: 'Religious', description: 'Holy Eid-ul-Fitr and Shab-e-Qadr break', isActive: true },
      { id: 'h-5', title: 'Eid-ul-Adha Vacation', startDate: '2026-05-26', endDate: '2026-05-31', type: 'Religious', description: 'Holy Eid-ul-Adha recess', isActive: true },
      { id: 'h-6', title: 'Durga Puja & Bijoya Dashami', startDate: '2026-10-18', endDate: '2026-10-21', type: 'Religious', description: 'Sharadiya Durga Puja celebration', isActive: true },
      { id: 'h-7', title: 'Victory Day (Bijoy Dibosh)', startDate: '2026-12-16', endDate: '2026-12-16', type: 'Public', description: 'National Victory Day tribute', isActive: true },
      { id: 'h-8', title: 'Winter Vacation', startDate: '2026-12-24', endDate: '2026-12-31', type: 'Vacation', description: 'Annual institutional winter break', isActive: true }
    ];
    for (const h of defaultHolidays) {
      await this.attendanceStore.saveHoliday(h);
    }
    this.toast.success('Holidays Reset', 'Standard Bangladesh academic holiday calendar loaded.');
    this.loadMonthlyRangeData();
    this.loadAttendanceData();
    this.cdr.markForCheck();
  }

  get filteredHolidays(): AcademicHoliday[] {
    if (!this.holidaySearchQuery.trim()) return this.holidays;
    const q = this.holidaySearchQuery.toLowerCase();
    return this.holidays.filter(h =>
      h.title.toLowerCase().includes(q) ||
      (h.type && h.type.toLowerCase().includes(q)) ||
      (h.description && h.description.toLowerCase().includes(q))
    );
  }

  getHolidayDaysCount(h: AcademicHoliday): number {
    if (!h.startDate) return 1;
    if (!h.endDate || h.endDate === h.startDate) return 1;
    const s = new Date(h.startDate);
    const e = new Date(h.endDate);
    const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1;
    return diff > 0 ? diff : 1;
  }

  isWeekend(day: number): boolean {
    const [year, month] = this.selectedMonthYear.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const d = date.getDay();
    const days = this.weekendSettings?.weekendDays || [5, 6];
    return days.includes(d);
  }

  isDateWeekend(dateStr: string): boolean {
    if (!dateStr) return false;
    const d = new Date(dateStr).getDay();
    const days = this.weekendSettings?.weekendDays || [5, 6];
    return days.includes(d);
  }

  isDateHolidayOrWeekend(dateStr: string): boolean {
    return !!this.getDateHoliday(dateStr) || this.isDateWeekend(dateStr);
  }

  getDayOfWeekFromDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr).getDay();
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d];
  }

  isHoliday(day: number): boolean {
    const dayStr = `${this.selectedMonthYear}-${String(day).padStart(2, '0')}`;
    return this.holidays.some(h => {
      if (!h.isActive) return false;
      const s = (h.startDate || '').split('T')[0];
      const e = (h.endDate || h.startDate || '').split('T')[0];
      return dayStr >= s && dayStr <= e;
    });
  }

  getDateHoliday(dateStr: string): AcademicHoliday | null {
    if (!dateStr) return null;
    const target = dateStr.split('T')[0];
    return this.holidays.find(h => {
      if (!h.isActive) return false;
      const s = (h.startDate || '').split('T')[0];
      const e = (h.endDate || h.startDate || '').split('T')[0];
      return target >= s && target <= e;
    }) || null;
  }

  getHolidayName(day: number): string {
    const dayStr = `${this.selectedMonthYear}-${String(day).padStart(2, '0')}`;
    const h = this.holidays.find(x => {
      if (!x.isActive) return false;
      const s = (x.startDate || '').split('T')[0];
      const e = (x.endDate || x.startDate || '').split('T')[0];
      return dayStr >= s && dayStr <= e;
    });
    return h ? h.title : '';
  }

  get totalHolidaysInSelectedMonth(): number {
    const [year, month] = this.selectedMonthYear.split('-').map(Number);
    const totalDays = new Date(year, month, 0).getDate();
    let count = 0;
    for (let d = 1; d <= totalDays; d++) {
      if (this.isHoliday(d) && !this.isWeekend(d)) {
        count++;
      }
    }
    return count;
  }

  get totalWeekendsInSelectedMonth(): number {
    const [year, month] = this.selectedMonthYear.split('-').map(Number);
    const totalDays = new Date(year, month, 0).getDate();
    let count = 0;
    for (let d = 1; d <= totalDays; d++) {
      if (this.isWeekend(d)) {
        count++;
      }
    }
    return count;
  }

  get totalWorkingDaysInSelectedMonth(): number {
    const [year, month] = this.selectedMonthYear.split('-').map(Number);
    const totalDays = new Date(year, month, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && (today.getMonth() + 1) === month;
    const isPastMonth = (today.getFullYear() > year) || (today.getFullYear() === year && (today.getMonth() + 1) > month);
    const maxElapsedDay = isCurrentMonth ? Math.min(totalDays, today.getDate()) : (isPastMonth ? totalDays : 0);

    let count = 0;
    for (let d = 1; d <= maxElapsedDay; d++) {
      if (!this.isNonInstructionalDay(d)) {
        count++;
      }
    }
    return count;
  }

  isNonInstructionalDay(day: number): boolean {
    return this.isWeekend(day) || this.isHoliday(day);
  }

  getDayOfWeek(day: number): string {
    const [year, month] = this.selectedMonthYear.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  }

  onMatrixCellClick(stat: StudentMonthlyStat, day: number) {
    if (this.isFutureDay(day)) {
      this.toast.warning('Future Date Restricted', `Day ${day} is in the future. Attendance cannot be recorded or edited for future dates.`);
      return;
    }
    if (this.isHoliday(day)) {
      this.toast.info('Academic Holiday', `Day ${day} is marked as "${this.getHolidayName(day)}". Attendance cannot be marked on holidays.`);
      return;
    }
    if (this.isWeekend(day)) {
      this.toast.info('Weekly Weekend', `Day ${day} is scheduled as an institutional weekend.`);
      return;
    }

    const currentStatus = stat.dayStatuses[day] || 'Present';
    const nextStatus = currentStatus === 'Present' ? 'Absent' : (currentStatus === 'Absent' ? 'Late' : 'Present');

    const dayDate = `${this.selectedMonthYear}-${String(day).padStart(2, '0')}`;
    this.selectedRecordForCorrection = {
      id: 'att-' + stat.student.id + '-' + dayDate,
      date: dayDate,
      studentId: stat.student.id,
      studentName: stat.student.fullName,
      rollNo: stat.student.rollNo || '01',
      classId: stat.student.classId,
      sectionId: stat.student.sectionId,
      status: currentStatus as any,
      markedBy: 'Matrix Inspector',
      student: stat.student
    };

    this.correctionForm = {
      newStatus: nextStatus,
      quickReason: '',
      reason: `Quick matrix edit on day ${day}: Changed from ${currentStatus} to ${nextStatus}`
    };

    this.isCorrectionModalOpen = true;
  }

  // Correction actions
  openCorrectionModal(record: DailyReportRecord) {
    this.selectedRecordForCorrection = record;
    this.correctionForm = {
      newStatus: record.status === 'Present' ? 'Absent' : 'Present',
      quickReason: '',
      reason: ''
    };
    this.isCorrectionModalOpen = true;
  }

  onQuickReasonChange() {
    if (this.correctionForm.quickReason) {
      this.correctionForm.reason = this.correctionForm.quickReason;
    }
  }

  saveCorrection() {
    if (!this.selectedRecordForCorrection || !this.correctionForm.reason.trim()) return;

    const rec = this.selectedRecordForCorrection;
    const oldStatus = rec.status;
    const newStatus = this.correctionForm.newStatus;
    const reason = this.correctionForm.reason.trim();

    this.attendanceStore.submitAttendanceCorrection(
      rec.id,
      rec.studentId,
      rec.studentName,
      rec.date,
      oldStatus,
      newStatus,
      reason
    );

    // Update locally
    rec.status = newStatus as any;
    rec.remark = reason;

    // Also update monthly stats day if matching
    const day = parseInt(rec.date.split('-')[2], 10);
    const statItem = this.monthlyStats.find(s => s.student.id === rec.studentId);
    if (statItem && !isNaN(day)) {
      statItem.dayStatuses[day] = newStatus;
    }

    this.toast.success('Attendance Corrected', `Marked ${rec.studentName} as ${newStatus}.`);
    this.isCorrectionModalOpen = false;
    this.loadCorrections();
    this.cdr.markForCheck();
  }

  // SMS Dispatch
  openDirectSMS(student: Student) {
    this.selectedStudentForSms = student;
    this.smsForm = {
      template: 'absent_today',
      message: `Dear Guardian, your ward ${student.fullName} was absent from Scholars International Academy on ${this.selectedDate}. Please contact school administration.`
    };
    this.isSmsModalOpen = true;
  }

  applySmsTemplate() {
    if (!this.selectedStudentForSms) return;
    const s = this.selectedStudentForSms;
    if (this.smsForm.template === 'absent_today') {
      this.smsForm.message = `Dear Guardian, your ward ${s.fullName} was absent from Scholars International Academy on ${this.selectedDate}. Please contact school authority.`;
    } else if (this.smsForm.template === 'chronic_warning') {
      this.smsForm.message = `URGENT NOTICE: Attendance of ${s.fullName} has fallen below 75% for ${this.getSelectedMonthName()}. Contact Principal office immediately to avoid exam bar.`;
    } else if (this.smsForm.template === 'late_notice') {
      this.smsForm.message = `Notice: Student ${s.fullName} arrived late at school today (${this.selectedDate}) after morning assembly. Ensure punctuality.`;
    }
  }

  sendGuardianSms() {
    if (!this.selectedStudentForSms || !this.smsForm.message.trim()) return;
    const phone = this.selectedStudentForSms.fatherPhone || this.selectedStudentForSms.guardianPhone || '8801711000000';
    this.systemStore.sendSmsDispatch(phone, 1, this.smsForm.message, 'Principal Office');
    this.toast.success('SMS Dispatched', `Attendance notification sent to guardian of ${this.selectedStudentForSms.fullName}.`);
    this.isSmsModalOpen = false;
  }

  // Print & Export
  printRegister() {
    window.print();
  }

  exportCSV() {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (this.activeViewMode === 'daily') {
      csvContent += 'Roll,Student Name,Admission ID,Class,Section,Date,Status,Remark\n';
      this.filteredDailyRecords.forEach(r => {
        csvContent += `"${r.rollNo}","${r.studentName}","${r.student?.admissionNo || r.studentId}","${this.getClassName(r.classId)}","${this.getSectionName(r.sectionId)}","${r.date}","${r.status}","${r.remark || ''}"\n`;
      });
    } else {
      csvContent += 'Roll,Student Name,Class,Working Days,Present,Absent,Late,Percentage,Eligibility\n';
      this.filteredMonthlyStats.forEach(s => {
        csvContent += `"${s.student.rollNo || ''}","${s.student.fullName}","${this.getSelectedClassName()}","${s.totalWorkingDays}","${s.presentDays}","${s.absentDays}","${s.lateDays}","${s.percentage}%","${s.eligibility}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Report_${this.selectedClassId}_${this.selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toast.info('Export Complete', 'Attendance data exported to CSV.');
  }

  // Lookups
  getClassName(id: string): string {
    return this.classes.find(c => c.id === id)?.name || id;
  }
  getSectionName(id: string): string {
    return this.sections.find(s => s.id === id)?.name || id;
  }
  getSelectedClassName(): string {
    return this.classes.find(c => c.id === this.selectedClassId)?.name || 'Class';
  }
  getSelectedSectionName(): string {
    if (this.selectedSectionId === 'ALL') return 'All Sections';
    return this.sections.find(s => s.id === this.selectedSectionId)?.name || 'Section';
  }
  getSelectedMonthName(): string {
    const [year, month] = this.selectedMonthYear.split('-');
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[parseInt(month, 10) - 1]} ${year}`;
  }
  get todayString(): string {
    return new Date().toLocaleDateString('en-GB');
  }
}
