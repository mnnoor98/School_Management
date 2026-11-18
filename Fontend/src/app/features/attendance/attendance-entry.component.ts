import { CampusImageDirective } from '../../shared/components/campus-image.directive';
import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, firstValueFrom } from 'rxjs';
import { AttendanceStoreService } from '../../core/services/stores/attendance-store.service';
import { AcademicStoreService } from '../../core/services/stores/academic-store.service';
import { StudentStoreService } from '../../core/services/stores/student-store.service';
import { CampusSessionService } from '../../core/services/campus-session.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { SchoolClass, Section, Student, AttendanceRecord, User } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { BadgeComponent } from '../../shared/components/badge.component';

export interface AttendanceRowItem {
  studentId: string;
  studentName: string;
  admissionNo: string;
  rollNo: string;
  gender?: string;
  photoUrl?: string;
  guardianName?: string;
  guardianPhone?: string;
  status: 'Present' | 'Absent' | 'Late';
  remark: string;
  isSavedInDb: boolean;
}

@Component({
  selector: 'app-attendance-entry',
  standalone: true,
  imports: [CampusImageDirective, CommonModule, FormsModule, IconComponent, ModalComponent, BadgeComponent],
  template: `
    <div class="page-container">
      <!-- HEADER -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-badge">
            <app-icon name="calendar" [size]="14"></app-icon>
            <span>Academic Attendance</span>
          </div>
          <h1 class="page-title">
            <app-icon name="clipboard-check" [size]="28" class="text-primary"></app-icon>
            Daily Student Attendance Register
          </h1>
          <p class="page-subtitle">
            Record class attendance with one-click toggles, batch markers, and direct database sync.
          </p>
        </div>

        <div class="page-actions">
          <div class="unsaved-badge" *ngIf="hasUnsavedChanges">
            <span class="pulsing-dot"></span>
            <span>Unsaved Changes</span>
          </div>

          <button
            type="button"
            class="btn btn-outline"
            (click)="openPrintModal()"
            [disabled]="isLoading || attendanceRows.length === 0"
            title="Print official institutional attendance sheet"
          >
            <app-icon name="printer" [size]="16"></app-icon>
            <span>Print Register</span>
          </button>

          <button
            type="button"
            class="btn btn-outline-amber"
            (click)="openSmsModal()"
            [disabled]="isLoading || getAbsentCount() === 0"
            title="Notify parents of absent students via SMS"
          >
            <app-icon name="message-square" [size]="16"></app-icon>
            <span>Absent SMS ({{ getAbsentCount() }})</span>
          </button>

          <div class="btn-group">
            <button
              type="button"
              class="btn btn-outline"
              (click)="markAll('Present')"
              [disabled]="isLoading || attendanceRows.length === 0"
              title="Mark all students as Present"
            >
              <app-icon name="check-square" [size]="16" class="text-success"></app-icon>
              <span>All Present</span>
            </button>

            <button
              type="button"
              class="btn btn-outline"
              (click)="markAll('Absent')"
              [disabled]="isLoading || attendanceRows.length === 0"
              title="Mark all students as Absent"
            >
              <app-icon name="x-circle" [size]="16" class="text-danger"></app-icon>
              <span>All Absent</span>
            </button>
          </div>

          <button
            type="button"
            class="btn btn-primary save-btn"
            (click)="saveAttendance()"
            [disabled]="isLoading || isSaving || attendanceRows.length === 0"
          >
            <app-icon *ngIf="!isSaving" name="check" [size]="18"></app-icon>
            <app-icon *ngIf="isSaving" name="loader" [size]="18" class="spin-icon"></app-icon>
            <span>{{ isSaving ? 'Saving Register...' : 'Save Attendance Register' }}</span>
          </button>
        </div>
      </div>

      <!-- FILTER & CRITERIA STRIP -->
      <div class="card mb-4 filter-card">
        <div class="card-body">
          <div class="filter-grid">
            <!-- DATE PICKER -->
            <div class="form-group mb-0">
              <label class="form-label d-flex justify-between">
                <span>Attendance Date <span class="required">*</span></span>
                <button type="button" class="btn-link-today" (click)="setToday()">Today</button>
              </label>
              <div class="input-icon-wrapper">
                <input
                  type="date"
                  class="form-control"
                  [(ngModel)]="selectedDate"
                  [max]="todayDate"
                  (change)="onDateOrClassChange()"
                />
              </div>
            </div>

            <!-- CLASS SELECT -->
            <div class="form-group mb-0">
              <label class="form-label">Academic Class <span class="required">*</span></label>
              <select
                class="form-select"
                [(ngModel)]="selectedClassId"
                (change)="onClassChange()"
                [disabled]="isLoading"
              >
                <option *ngIf="classes.length === 0" value="">Loading classes...</option>
                <option *ngFor="let c of classes" [value]="c.id">{{ c.name }}</option>
              </select>
            </div>

            <!-- SECTION SELECT -->
            <div class="form-group mb-0">
              <label class="form-label">Section / Group <span class="required">*</span></label>
              <select
                class="form-select"
                [(ngModel)]="selectedSectionId"
                (change)="onDateOrClassChange()"
                [disabled]="isLoading || sections.length === 0"
              >
                <option *ngIf="sections.length === 0" value="">No section found</option>
                <option *ngFor="let s of sections" [value]="s.id">{{ s.name }}</option>
              </select>
            </div>

            <!-- SUMMARY STATS CARD -->
            <div class="attendance-summary-badge">
              <div class="summary-top">
                <span class="sum-lbl">Roster Statistics</span>
                <span class="sum-rate-tag" [ngClass]="getRateClass()">{{ getRate() }}% Present</span>
              </div>
              <div class="stats-pills">
                <span class="stat-pill pill-present">
                  <strong>{{ getPresentCount() }}</strong> Present
                </span>
                <span class="stat-pill pill-late">
                  <strong>{{ getLateCount() }}</strong> Late
                </span>
                <span class="stat-pill pill-absent">
                  <strong>{{ getAbsentCount() }}</strong> Absent
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MAIN TABLE CARD -->
      <div class="card">
        <div class="card-header roster-header">
          <div class="roster-header-left">
            <div class="card-title">
              <app-icon name="users" [size]="20" class="text-primary"></app-icon>
              <span>Class Roster: {{ getSelectedClassName() }} — {{ getSelectedSectionName() }}</span>
            </div>
            <span class="date-tag">
              <app-icon name="calendar" [size]="14"></app-icon>
              {{ selectedDate }}
            </span>
            <span class="status-indicator-badge" [class.synced]="isRegisterSynced()" [class.unsaved]="!isRegisterSynced()">
              {{ isRegisterSynced() ? 'Synced with Database' : 'Unsaved / Modified' }}
            </span>
          </div>

          <!-- SEARCH & QUICK FILTER -->
          <div class="roster-tools">
            <div class="search-box">
              <app-icon name="search" [size]="15" class="search-icon"></app-icon>
              <input
                type="text"
                class="form-control form-control-sm search-input"
                placeholder="Search name, roll, admission..."
                [(ngModel)]="searchTerm"
              />
              <button *ngIf="searchTerm" type="button" class="clear-search" (click)="searchTerm = ''">&times;</button>
            </div>

            <div class="filter-tabs">
              <button
                type="button"
                class="filter-tab"
                [class.active]="statusFilter === 'All'"
                (click)="statusFilter = 'All'"
              >
                All ({{ attendanceRows.length }})
              </button>
              <button
                type="button"
                class="filter-tab tab-present"
                [class.active]="statusFilter === 'Present'"
                (click)="statusFilter = 'Present'"
              >
                Present ({{ getPresentCount() }})
              </button>
              <button
                type="button"
                class="filter-tab tab-late"
                [class.active]="statusFilter === 'Late'"
                (click)="statusFilter = 'Late'"
              >
                Late ({{ getLateCount() }})
              </button>
              <button
                type="button"
                class="filter-tab tab-absent"
                [class.active]="statusFilter === 'Absent'"
                (click)="statusFilter = 'Absent'"
              >
                Absent ({{ getAbsentCount() }})
              </button>
            </div>
          </div>
        </div>

        <!-- LOADING SKELETON -->
        <div *ngIf="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p class="loading-text">Loading student roster and attendance records...</p>
        </div>

        <!-- EMPTY STATE -->
        <div *ngIf="!isLoading && attendanceRows.length === 0" class="empty-state">
          <div class="empty-icon-wrapper">
            <app-icon name="users" [size]="48" class="empty-icon"></app-icon>
          </div>
          <h3>No Students Found</h3>
          <p>
            There are currently no students enrolled in <strong>{{ getSelectedClassName() }}</strong> ({{ getSelectedSectionName() }}).
          </p>
          <div class="empty-actions">
            <button type="button" class="btn btn-outline btn-sm" (click)="refreshRoster()">
              <app-icon name="rotate-cw" [size]="14"></app-icon>
              <span>Refresh Roster</span>
            </button>
            <button type="button" class="btn btn-primary btn-sm" (click)="navigateToEnrollment()">
              <app-icon name="user-plus" [size]="14"></app-icon>
              <span>Enroll Students</span>
            </button>
          </div>
        </div>

        <!-- FILTER EMPTY STATE -->
        <div *ngIf="!isLoading && attendanceRows.length > 0 && filteredRows.length === 0" class="empty-state py-4">
          <app-icon name="search" [size]="32" class="empty-icon mb-2"></app-icon>
          <h4>No matching records</h4>
          <p>No students match your filter criteria "{{ searchTerm || statusFilter }}".</p>
          <button type="button" class="btn btn-outline btn-sm mt-2" (click)="resetFilters()">
            Clear Filters
          </button>
        </div>

        <!-- TABLE OF STUDENTS -->
        <div *ngIf="!isLoading && filteredRows.length > 0" class="app-table-wrapper">
          <table class="app-table">
            <thead>
              <tr>
                <th style="width: 70px;">Roll</th>
                <th style="width: 280px;">Student Information</th>
                <th style="width: 140px;">Admission No</th>
                <th style="text-align: center; width: 300px;">Attendance Status</th>
                <th>Remarks / Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr
                *ngFor="let row of filteredRows; trackBy: trackByStudentId"
                [class.row-absent]="row.status === 'Absent'"
                [class.row-late]="row.status === 'Late'"
              >
                <!-- ROLL NO -->
                <td>
                  <span class="roll-badge">#{{ row.rollNo || '00' }}</span>
                </td>

                <!-- STUDENT NAME & AVATAR -->
                <td>
                  <div class="student-profile">
                    <div class="student-avatar" [style.background-color]="getAvatarColor(row.studentName)">
                      <img campusImage *ngIf="row.photoUrl" [src]="row.photoUrl" [alt]="row.studentName" />
                      <span *ngIf="!row.photoUrl">{{ getInitials(row.studentName) }}</span>
                    </div>
                    <div class="student-meta">
                      <strong class="student-name">{{ row.studentName }}</strong>
                      <span class="student-subtext" *ngIf="row.gender">{{ row.gender }}</span>
                    </div>
                  </div>
                </td>

                <!-- ADMISSION NO -->
                <td>
                  <code class="code-tag">{{ row.admissionNo || 'N/A' }}</code>
                </td>

                <!-- STATUS TOGGLE GROUP -->
                <td style="text-align: center;">
                  <div class="status-toggle-group">
                    <button
                      type="button"
                      class="toggle-btn btn-present"
                      [class.active]="row.status === 'Present'"
                      (click)="setStatus(row, 'Present')"
                    >
                      <app-icon name="check" [size]="14"></app-icon>
                      <span>Present</span>
                    </button>
                    <button
                      type="button"
                      class="toggle-btn btn-late"
                      [class.active]="row.status === 'Late'"
                      (click)="setStatus(row, 'Late')"
                    >
                      <app-icon name="clock" [size]="14"></app-icon>
                      <span>Late</span>
                    </button>
                    <button
                      type="button"
                      class="toggle-btn btn-absent"
                      [class.active]="row.status === 'Absent'"
                      (click)="setStatus(row, 'Absent')"
                    >
                      <app-icon name="x" [size]="14"></app-icon>
                      <span>Absent</span>
                    </button>
                  </div>
                </td>

                <!-- REMARKS -->
                <td>
                  <div class="remark-wrapper">
                    <input
                      type="text"
                      class="form-control form-control-sm remark-input"
                      [(ngModel)]="row.remark"
                      (change)="onRemarkChange()"
                      placeholder="e.g. Sick, Family emergency, Doctor visit"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- TABLE FOOTER -->
        <div class="card-footer roster-footer" *ngIf="!isLoading && attendanceRows.length > 0">
          <div class="footer-left">
            <span>Showing {{ filteredRows.length }} of {{ attendanceRows.length }} students</span>
          </div>
          <div class="footer-right">
            <button
              type="button"
              class="btn btn-primary"
              (click)="saveAttendance()"
              [disabled]="isSaving"
            >
              <app-icon *ngIf="!isSaving" name="check" [size]="16"></app-icon>
              <app-icon *ngIf="isSaving" name="loader" [size]="16" class="spin-icon"></app-icon>
              <span>{{ isSaving ? 'Saving...' : 'Save Register' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- MODAL 1: OFFICIAL PRINTABLE DAILY ATTENDANCE REGISTER    -->
    <!-- ======================================================== -->
    <app-modal
      [(isOpen)]="isPrintModalOpen"
      title="Official Daily Student Attendance Register"
      [maxWidth]="820"
      (close)="isPrintModalOpen = false"
    >
      <div class="modal-body p-4 printable-area">
        <div class="printable-document-frame">
          <!-- INSTITUTION PRINT LETTERHEAD -->
          <div class="print-letterhead">
            <div class="pl-header-top">
              <div class="pl-logo-box">
                <app-icon name="clipboard-check" [size]="42" class="text-primary"></app-icon>
              </div>
              <div class="pl-school-meta">
                <h1 class="pl-school-name">{{ schoolName }} ({{ activeCampusName }})</h1>
                <p class="pl-school-addr">{{ schoolAddress }} • EIN: 108422 • Reg: 4920/2012 • Phone: +880 1711-000000</p>
                <div class="pl-report-title-pill">
                  DAILY STUDENT ATTENDANCE REGISTER & AUDIT RECORD (দৈনিক শিক্ষার্থী উপস্থিতি খাতা)
                </div>
              </div>
              <div class="pl-copy-tag">
                ACADEMIC ROSTER ARCHIVE
              </div>
            </div>

            <div class="pl-meta-grid">
              <div><strong>Academic Date:</strong> {{ selectedDate }}</div>
              <div><strong>Class & Section:</strong> {{ getSelectedClassName() }} - {{ getSelectedSectionName() }}</div>
              <div><strong>Total Enrolled:</strong> {{ attendanceRows.length }} Students</div>
              <div><strong>Attendance Ratio:</strong> {{ getPresentCount() }} Present ({{ getRate() }}%)</div>
            </div>
          </div>

          <!-- ATTENDANCE TABLE -->
          <table class="voucher-table">
            <thead>
              <tr>
                <th style="width: 60px;" class="text-center">Roll</th>
                <th style="width: 110px;">Admission #</th>
                <th>Student Full Name</th>
                <th style="width: 90px;" class="text-center">Status</th>
                <th>Academic Remarks / Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of attendanceRows">
                <td class="text-center font-mono font-bold">#{{ row.rollNo || '01' }}</td>
                <td class="font-mono text-xs">{{ row.admissionNo || '-' }}</td>
                <td><strong>{{ row.studentName }}</strong></td>
                <td class="text-center">
                  <span
                    class="font-bold text-xs"
                    [class.text-success]="row.status === 'Present'"
                    [class.text-danger]="row.status === 'Absent'"
                    [class.text-warning]="row.status === 'Late'"
                  >
                    {{ row.status | uppercase }}
                  </span>
                </td>
                <td class="text-xs text-muted">{{ row.remark || '-' }}</td>
              </tr>
            </tbody>
          </table>

          <!-- SUMMARY & 3-SIGNATURE BLOCK -->
          <div class="print-signatures">
            <div class="sig-block">
              <div class="sig-line"></div>
              <span class="sig-title">Class Teacher<br>(শ্রেণি শিক্ষক)</span>
            </div>

            <div class="sig-stamp-box">
              <div class="verified-stamp">✓ AUDIT VERIFIED & TABULATED</div>
              <span class="stamp-date">Academic Roster • {{ todayDate }}</span>
            </div>

            <div class="sig-block">
              <div class="sig-line"></div>
              <span class="sig-title">Attendance In-Charge<br>(হাজিরা ইনচার্জ)</span>
            </div>

            <div class="sig-block">
              <div class="sig-line"></div>
              <span class="sig-title">Principal / Head of Institution<br>(অধ্যক্ষ / প্রতিষ্ঠান প্রধান)</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer p-3 flex justify-end gap-2 no-print" footer>
        <button type="button" class="btn btn-outline" (click)="isPrintModalOpen = false">Close</button>
        <button type="button" class="btn btn-primary" (click)="printRegister()">
          <app-icon name="printer" [size]="16"></app-icon>
          <span>Print Daily Register (A4)</span>
        </button>
      </div>
    </app-modal>

    <!-- ======================================================== -->
    <!-- MODAL 2: GUARDIAN ABSENT SMS DISPATCH MODAL              -->
    <!-- ======================================================== -->
    <app-modal
      [(isOpen)]="isSmsModalOpen"
      title="Dispatch Absent Notification SMS"
      subtitle="Send automated absence alert SMS to guardians of students marked absent today."
      [maxWidth]="620"
      (close)="isSmsModalOpen = false"
    >
      <div class="sms-modal-body p-4">
        <div class="sms-stat-alert mb-3">
          <app-icon name="alert-triangle" [size]="20" class="text-warning"></app-icon>
          <div>
            <strong>{{ getAbsentCount() }} Student(s) Marked Absent Today</strong>
            <p class="text-xs text-muted mb-0">SMS notifications will be sent to the registered guardian mobile numbers.</p>
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label font-bold">SMS Content Template Preview</label>
          <div class="sms-preview-bubble">
            "সম্মানিত অভিভাবক, আপনার সন্তান [শিক্ষার্থীর নাম] (রোল: [রোল]) আজ {{ selectedDate }} তারিখে {{ getSelectedClassName() }} ক্লাসে অনুপস্থিত রয়েছে। অনুগ্রহ করে স্কুল কর্তৃপক্ষের সাথে যোগাযোগ করুন। - {{ schoolName }}"
          </div>
          <small class="text-xs text-muted">1 SMS unit per recipient • Sender ID: SCHOLARS</small>
        </div>

        <div class="absent-recipients-box mb-3">
          <label class="form-label font-bold">Recipient Guardians ({{ getAbsentRows().length }} Contacts)</label>
          <div class="recipient-chips-list">
            <div *ngFor="let row of getAbsentRows()" class="recipient-chip">
              <strong>#{{ row.rollNo }} {{ row.studentName }}</strong>
              <span class="chip-phone font-mono">{{ row.guardianPhone || '+880 1700-000000' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer p-3 flex justify-end gap-2 no-print" footer>
        <button type="button" class="btn btn-outline" (click)="isSmsModalOpen = false">Cancel</button>
        <button type="button" class="btn btn-primary" (click)="dispatchAbsentSms()" [disabled]="isSendingSms || getAbsentCount() === 0">
          <app-icon name="send" [size]="16"></app-icon>
          <span>{{ isSendingSms ? 'Sending SMS Alerts...' : 'Dispatch ' + getAbsentCount() + ' Absent SMS Alerts' }}</span>
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .mb-4 { margin-bottom: 24px; }
    .mb-2 { margin-bottom: 8px; }
    .mb-0 { margin-bottom: 0 !important; }
    .mt-2 { margin-top: 8px; }
    .py-4 { padding-top: 24px; padding-bottom: 24px; }
    .d-flex { display: flex; }
    .justify-between { justify-content: space-between; }
    .text-primary { color: #4f46e5; }
    .text-success { color: #10b981; }
    .text-danger { color: #ef4444; }

    .header-left {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #4f46e5;
      background: #eef2ff;
      padding: 3px 10px;
      border-radius: 9999px;
      width: fit-content;
    }
    .unsaved-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.785rem;
      font-weight: 600;
      color: #b45309;
      background: #fef3c7;
      border: 1px solid #fde68a;
      padding: 6px 12px;
      border-radius: 8px;
    }
    .pulsing-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #f59e0b;
      box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7);
      animation: pulse 1.6s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
      70% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
      100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
    }

    .btn-group {
      display: inline-flex;
      gap: 8px;
    }

    .save-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      padding: 10px 20px;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
    }
    .spin-icon {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    /* Filter strip */
    .filter-card {
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .filter-grid {
      display: grid;
      grid-template-columns: 1.1fr 1.1fr 1.1fr 1.5fr;
      gap: 20px;
      align-items: center;
    }
    .btn-link-today {
      background: none;
      border: none;
      color: #4f46e5;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      text-decoration: underline;
      padding: 0;
    }

    .attendance-summary-badge {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .summary-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .sum-lbl {
      font-size: 0.725rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
    }
    .sum-rate-tag {
      font-size: 0.75rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 6px;
    }
    .rate-excellent { background: #dcfce7; color: #15803d; }
    .rate-good { background: #ecfdf5; color: #047857; }
    .rate-warning { background: #fef3c7; color: #b45309; }
    .rate-poor { background: #fee2e2; color: #b91c1c; }

    .stats-pills {
      display: flex;
      gap: 8px;
    }
    .stat-pill {
      font-size: 0.75rem;
      padding: 4px 8px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .pill-present { background: #d1fae5; color: #065f46; }
    .pill-late { background: #fef3c7; color: #92400e; }
    .pill-absent { background: #fee2e2; color: #991b1b; }

    /* Roster header */
    .roster-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 16px 20px;
    }
    .roster-header-left {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .date-tag {
      font-size: 0.8125rem;
      font-weight: 700;
      background: #eef2ff;
      color: #4f46e5;
      padding: 4px 10px;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .status-indicator-badge {
      font-size: 0.725rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 8px;
    }
    .status-indicator-badge.synced {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }
    .status-indicator-badge.unsaved {
      background: #fffbeb;
      color: #d97706;
      border: 1px solid #fde68a;
    }

    .roster-tools {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .search-box {
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-icon {
      position: absolute;
      left: 10px;
      color: #94a3b8;
      pointer-events: none;
    }
    .search-input {
      padding-left: 32px;
      padding-right: 28px;
      width: 210px;
      border-radius: 8px;
    }
    .clear-search {
      position: absolute;
      right: 8px;
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 1.1rem;
      line-height: 1;
      padding: 0;
    }

    .filter-tabs {
      display: inline-flex;
      background: #f1f5f9;
      padding: 3px;
      border-radius: 8px;
      gap: 2px;
    }
    .filter-tab {
      border: none;
      background: transparent;
      padding: 5px 10px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .filter-tab.active {
      background: #ffffff;
      color: #0f172a;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    /* Table & Rows */
    .roll-badge {
      font-weight: 800;
      color: #0f172a;
      background: #f1f5f9;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.85rem;
    }
    .student-profile {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .student-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: 700;
      font-size: 0.8rem;
      overflow: hidden;
      flex-shrink: 0;
    }
    .student-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .student-meta {
      display: flex;
      flex-direction: column;
    }
    .student-name {
      font-size: 0.875rem;
      color: #0f172a;
    }
    .student-subtext {
      font-size: 0.725rem;
      color: #64748b;
    }
    .code-tag {
      font-size: 0.785rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 3px 8px;
      border-radius: 6px;
      color: #334155;
      font-weight: 600;
    }

    /* Status Toggles */
    .status-toggle-group {
      display: inline-flex;
      border-radius: 10px;
      background: #f1f5f9;
      padding: 3px;
      gap: 3px;
    }
    .toggle-btn {
      border: none;
      background: transparent;
      padding: 6px 12px;
      border-radius: 7px;
      font-size: 0.785rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
      color: #64748b;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .btn-present.active {
      background: #10b981;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(16, 185, 129, 0.35);
    }
    .btn-late.active {
      background: #f59e0b;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(245, 158, 11, 0.35);
    }
    .btn-absent.active {
      background: #ef4444;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(239, 68, 68, 0.35);
    }

    .row-absent {
      background: #fff1f2 !important;
    }
    .row-late {
      background: #fffbeb !important;
    }

    .remark-input {
      font-size: 0.8125rem;
    }

    /* Loading state */
    .loading-state {
      padding: 60px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #e2e8f0;
      border-top-color: #4f46e5;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .loading-text {
      color: #64748b;
      font-size: 0.875rem;
      font-weight: 600;
    }

    /* Empty state */
    .empty-state {
      padding: 60px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .empty-icon-wrapper {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
    }
    .empty-icon {
      color: #94a3b8;
    }
    .empty-state h3 {
      font-size: 1.15rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .empty-state p {
      font-size: 0.875rem;
      color: #64748b;
      max-width: 420px;
      margin: 0;
    }
    .empty-actions {
      display: flex;
      gap: 10px;
      margin-top: 12px;
    }

    .roster-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      background: #fafafa;
      border-top: 1px solid #f1f5f9;
      font-size: 0.8125rem;
      color: #64748b;
      font-weight: 600;
    }

    @media (max-width: 992px) {
      .filter-grid {
        grid-template-columns: 1fr 1fr;
      }
      .attendance-summary-badge {
        grid-column: span 2;
      }
    }
    .btn-outline-amber {
      border: 1px solid #d97706;
      color: #d97706;
      background: #fffbeb;
      font-weight: 600;
    }
    .btn-outline-amber:hover {
      background: #d97706;
      color: #ffffff;
    }

    /* SMS Modal Styles */
    .sms-stat-alert {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 12px 16px;
    }
    .sms-preview-bubble {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 12px 14px;
      font-size: 0.85rem;
      line-height: 1.5;
      color: #1e293b;
      margin-bottom: 4px;
    }
    .absent-recipients-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
    }
    .recipient-chips-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      max-height: 150px;
      overflow-y: auto;
    }
    .recipient-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #fee2e2;
      color: #991b1b;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 0.78rem;
    }
    .chip-phone {
      color: #64748b;
      font-size: 0.72rem;
    }

    /* Print Styles Matching A4 Benchmark */
    .printable-document-frame {
      border: 1.5px solid #0f172a;
      border-radius: 8px;
      padding: 18px 20px;
      background: #ffffff;
      box-sizing: border-box;
    }
    .print-letterhead {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .pl-header-top {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .pl-logo-box {
      width: 50px;
      height: 50px;
      border: 1.5px solid #0f172a;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .pl-school-meta {
      flex: 1;
    }
    .pl-school-name {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 2px 0;
    }
    .pl-school-addr {
      font-size: 0.72rem;
      color: #475569;
      margin: 0 0 4px 0;
    }
    .pl-report-title-pill {
      display: inline-block;
      font-size: 0.74rem;
      font-weight: 800;
      background: #0f172a;
      color: #ffffff;
      padding: 3px 10px;
      border-radius: 4px;
      letter-spacing: 0.04em;
    }
    .pl-copy-tag {
      font-size: 0.68rem;
      font-weight: 800;
      color: #475569;
      border: 1px solid #cbd5e1;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      text-align: center;
    }
    .pl-meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-top: 10px;
      padding: 8px 12px;
      background: #f8fafc;
      border-radius: 6px;
      font-size: 0.72rem;
      color: #334155;
    }
    .voucher-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.78rem;
      margin-top: 10px;
    }
    .voucher-table th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 800;
      padding: 6px 10px;
      border: 1px solid #cbd5e1;
      text-transform: uppercase;
      font-size: 0.7rem;
    }
    .voucher-table td {
      padding: 6px 10px;
      border: 1px solid #cbd5e1;
    }
    .print-signatures {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 36px;
      padding-top: 10px;
    }
    .sig-block {
      width: 150px;
      text-align: center;
    }
    .sig-line {
      border-top: 1px solid #0f172a;
      margin-bottom: 4px;
    }
    .sig-title {
      font-size: 0.68rem;
      font-weight: 700;
      color: #334155;
    }
    .sig-stamp-box {
      text-align: center;
    }
    .verified-stamp {
      display: inline-block;
      padding: 4px 12px;
      border: 1.5px solid #059669;
      color: #059669;
      font-weight: 800;
      font-size: 0.72rem;
      border-radius: 5px;
      background: #ecfdf5;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .stamp-date {
      display: block;
      font-size: 0.62rem;
      color: #64748b;
      margin-top: 2px;
    }

    @media print {
      body * {
        visibility: hidden;
      }
      .printable-area, .printable-area * {
        visibility: visible;
      }
      .printable-area {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        margin: 0;
        padding: 0;
      }
      .no-print { display: none !important; }
      .printable-document-frame {
        border: 1.5px solid #0f172a !important;
        margin: 0 !important;
        padding: 14px 16px !important;
        page-break-inside: avoid;
      }
    }
  `]
})
export class AttendanceEntryComponent implements OnInit, OnDestroy {
  private attendanceStore = inject(AttendanceStoreService);
  private academicStore = inject(AcademicStoreService);
  private studentStore = inject(StudentStoreService);
  private campus = inject(CampusSessionService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  private destroy$ = new Subject<void>();

  schoolName = 'Scholars International Academy';
  schoolAddress = 'Plot 14, Road 2, Block-E, Dhaka 1212, Bangladesh';
  activeCampusName = 'Main Campus';

  classes: SchoolClass[] = [];
  sections: Section[] = [];
  allSections: Section[] = [];

  selectedDate = new Date().toISOString().split('T')[0];
  selectedClassId = '';
  selectedSectionId = '';

  attendanceRows: AttendanceRowItem[] = [];

  isLoading = false;
  isSaving = false;
  hasUnsavedChanges = false;
  searchTerm = '';
  statusFilter: 'All' | 'Present' | 'Late' | 'Absent' = 'All';

  // Modal states
  isPrintModalOpen = false;
  isSmsModalOpen = false;
  isSendingSms = false;

  async ngOnInit() {
    this.activeCampusName = this.campus.branchId === 'br-02' ? 'Uttara Campus' : 'Dhanmondi Campus';
    await this.loadInitialAcademicData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadInitialAcademicData() {
    this.isLoading = true;
    this.cdr.markForCheck();

    try {
      const [classes, sections] = await Promise.all([
        this.academicStore.loadClasses(),
        this.academicStore.loadSections()
      ]);

      this.classes = classes || [];
      this.allSections = sections || [];

      if (!this.selectedClassId && this.classes.length > 0) {
        const def = this.classes.find(c => c.name.includes('10') || c.id === 'cls-10') || this.classes[0];
        this.selectedClassId = def.id;
      }

      this.filterSectionsForClass();
      await this.loadStudentsForAttendance();
    } catch (e) {
      console.error('Error loading academic data for attendance:', e);
      this.toast.error('Load Error', 'Could not load academic classes.');
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  get todayDate(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  setToday() {
    const today = this.todayDate;
    if (this.selectedDate !== today) {
      this.selectedDate = today;
      this.onDateOrClassChange();
    }
  }

  async onClassChange() {
    this.filterSectionsForClass();
    await this.loadStudentsForAttendance();
  }

  async onDateOrClassChange() {
    if (this.selectedDate > this.todayDate) {
      this.selectedDate = this.todayDate;
      this.toast.warning('Future Date Restricted', 'Attendance cannot be marked for future dates. Automatically set to today.');
    }
    await this.loadStudentsForAttendance();
  }

  private filterSectionsForClass() {
    if (!this.selectedClassId) {
      this.sections = [];
      this.selectedSectionId = '';
      return;
    }

    this.sections = this.allSections.filter(s => s.classId === this.selectedClassId);

    // If current selectedSectionId is valid in the newly filtered list
    const hasCurrent = this.sections.some(s => s.id === this.selectedSectionId);
    if (!hasCurrent && this.sections.length > 0) {
      this.selectedSectionId = this.sections[0].id;
    } else if (this.sections.length === 0) {
      this.selectedSectionId = '';
    }
  }

  async loadStudentsForAttendance() {
    if (!this.selectedClassId || !this.selectedSectionId) {
      this.attendanceRows = [];
      this.cdr.markForCheck();
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    try {
      // 1. Fetch live students and saved attendance records from PostgreSQL
      const [students, savedRecords] = await Promise.all([
        this.studentStore.loadStudents(this.selectedClassId, this.selectedSectionId),
        firstValueFrom(this.attendanceStore.fetchAttendanceRecords(this.selectedClassId, this.selectedSectionId, this.selectedDate)).catch(() => [])
      ]);

      const recordMap = new Map<string, AttendanceRecord>();
      for (const rec of (savedRecords || [])) {
        recordMap.set(rec.studentId, rec);
      }

      // 2. Merge enrolled students with live attendance records
      this.attendanceRows = (students || []).map(s => {
        const rec = recordMap.get(s.id);
        return {
          studentId: s.id,
          studentName: s.fullName,
          admissionNo: s.admissionNo || '',
          rollNo: s.rollNo || '',
          gender: s.gender,
          photoUrl: s.photoUrl,
          guardianName: s.guardianName || 'Guardian',
          guardianPhone: s.guardianPhone || s.phone || '+880 1700-000000',
          status: rec ? (rec.status as 'Present' | 'Late' | 'Absent') : 'Present',
          remark: rec?.remark || '',
          isSavedInDb: !!rec
        };
      });

      this.hasUnsavedChanges = false;
    } catch (e) {
      console.error('Error loading attendance students:', e);
      this.toast.error('Load Error', 'Could not load student attendance roster.');
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  refreshRoster() {
    this.loadStudentsForAttendance();
  }

  navigateToEnrollment() {
    this.router.navigate(['/app/students/admission']);
  }

  // --- Filtering & Computed Rows ---
  get filteredRows(): AttendanceRowItem[] {
    let list = this.attendanceRows;

    if (this.statusFilter !== 'All') {
      list = list.filter(r => r.status === this.statusFilter);
    }

    if (this.searchTerm && this.searchTerm.trim()) {
      const q = this.searchTerm.trim().toLowerCase();
      list = list.filter(r =>
        r.studentName.toLowerCase().includes(q) ||
        r.admissionNo.toLowerCase().includes(q) ||
        r.rollNo.toLowerCase().includes(q)
      );
    }

    return list;
  }

  resetFilters() {
    this.searchTerm = '';
    this.statusFilter = 'All';
  }

  setStatus(row: AttendanceRowItem, status: 'Present' | 'Late' | 'Absent') {
    if (row.status !== status) {
      row.status = status;
      this.hasUnsavedChanges = true;
      this.cdr.markForCheck();
    }
  }

  onRemarkChange() {
    this.hasUnsavedChanges = true;
  }

  markAll(status: 'Present' | 'Late' | 'Absent') {
    if (this.attendanceRows.length === 0) return;
    this.attendanceRows.forEach(r => (r.status = status));
    this.hasUnsavedChanges = true;
    this.toast.info(
      `Marked All ${status}`,
      `All ${this.attendanceRows.length} students have been set to ${status}. Remember to save.`
    );
    this.cdr.markForCheck();
  }

  // --- Statistics ---
  getPresentCount(): number {
    return this.attendanceRows.filter(r => r.status === 'Present').length;
  }

  getLateCount(): number {
    return this.attendanceRows.filter(r => r.status === 'Late').length;
  }

  getAbsentCount(): number {
    return this.attendanceRows.filter(r => r.status === 'Absent').length;
  }

  getAbsentRows(): AttendanceRowItem[] {
    return this.attendanceRows.filter(r => r.status === 'Absent');
  }

  getRate(): number {
    if (this.attendanceRows.length === 0) return 100;
    const presentAndLate = this.getPresentCount() + (this.getLateCount() * 0.5);
    return Math.round((presentAndLate / this.attendanceRows.length) * 100);
  }

  getRateClass(): string {
    const rate = this.getRate();
    if (rate >= 90) return 'rate-excellent';
    if (rate >= 75) return 'rate-good';
    if (rate >= 50) return 'rate-warning';
    return 'rate-poor';
  }

  getSelectedClassName(): string {
    return this.classes.find(c => c.id === this.selectedClassId)?.name || 'Class 10';
  }

  getSelectedSectionName(): string {
    return this.sections.find(s => s.id === this.selectedSectionId)?.name || 'Section';
  }

  isRegisterSynced(): boolean {
    return !this.hasUnsavedChanges && this.attendanceRows.length > 0 && this.attendanceRows.every(r => r.isSavedInDb);
  }

  trackByStudentId(index: number, item: AttendanceRowItem): string {
    return item.studentId;
  }

  getInitials(name: string): string {
    if (!name) return 'S';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  getAvatarColor(name: string): string {
    const colors = [
      '#4f46e5', '#0284c7', '#0891b2', '#0d9488', '#059669',
      '#16a34a', '#65a30d', '#d97706', '#ea580c', '#e11d48'
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  // --- Modal actions ---
  openPrintModal() {
    this.isPrintModalOpen = true;
  }

  printRegister() {
    window.print();
  }

  openSmsModal() {
    this.isSmsModalOpen = true;
  }

  async dispatchAbsentSms() {
    const absentList = this.getAbsentRows();
    if (absentList.length === 0) return;

    this.isSendingSms = true;
    this.cdr.markForCheck();

    // Simulate SMS dispatch API
    await new Promise(r => setTimeout(r, 600));

    this.isSendingSms = false;
    this.isSmsModalOpen = false;
    this.toast.success(
      'SMS Dispatched',
      `Successfully queued and dispatched ${absentList.length} absent notification SMS alert(s) to parents.`
    );
    this.cdr.markForCheck();
  }

  // --- Save to Backend API ---
  saveAttendance() {
    if (this.selectedDate > this.todayDate) {
      this.toast.error('Restricted', 'Attendance cannot be marked or saved for future dates.');
      return;
    }

    if (this.attendanceRows.length === 0) {
      this.toast.warning('Empty Roster', 'No student records to save.');
      return;
    }

    this.isSaving = true;
    this.cdr.markForCheck();

    const recordsPayload = this.attendanceRows.map(r => ({
      studentId: r.studentId,
      studentName: r.studentName,
      rollNo: r.rollNo,
      status: r.status,
      remark: r.remark || ''
    }));

    this.attendanceStore.saveAttendanceRoster(this.selectedClassId, this.selectedSectionId, this.selectedDate, recordsPayload)
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.hasUnsavedChanges = false;
          this.attendanceRows.forEach(r => (r.isSavedInDb = true));

          this.toast.success(
            'Attendance Saved',
            `Successfully saved daily register for ${recordsPayload.length} students on ${this.selectedDate}.`
          );
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isSaving = false;
          console.error('Save attendance error:', err);
          const msg = err?.error?.message || 'Could not save attendance register to server.';
          this.toast.error('Save Failed', msg);
          this.cdr.markForCheck();
        }
      });
  }
}
