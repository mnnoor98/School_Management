import { CampusImageDirective } from '../../shared/components/campus-image.directive';
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TeacherStoreService } from '../../core/services/stores/teacher-store.service';
import { CampusSessionService } from '../../core/services/campus-session.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Teacher, TeacherLeaveApplication, User } from '../../core/models';
import { ModalComponent } from '../../shared/components/modal.component';
import { BadgeComponent } from '../../shared/components/badge.component';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-teacher-leave',
  standalone: true,
  imports: [CampusImageDirective, CommonModule, FormsModule, RouterModule, ModalComponent, BadgeComponent, IconComponent],
  template: `
    <div class="page-container">
      <!-- 1. SCREEN HEADER (NO-PRINT) -->
      <div class="page-header no-print">
        <div>
          <div class="header-badge">
            <span class="pulse-dot"></span>
            Faculty HR & Leave Governance
            <span class="campus-pill">{{ activeCampusName }}</span>
          </div>
          <h1 class="page-title">
            <app-icon name="calendar-off" [size]="26" class="text-primary title-icon"></app-icon>
            Teacher Leave & Absence Governance
          </h1>
          <p class="page-subtitle">
            Manage institutional faculty leave requisitions, approve absence requests, and maintain teacher leave quotas.
          </p>
        </div>
        <div class="page-actions">
          <a routerLink="/app/teachers/list" class="btn btn-outline" title="View Teacher Directory">
            <app-icon name="users" [size]="16"></app-icon>
            <span>Teacher Directory</span>
          </a>
          <button type="button" class="btn btn-primary" (click)="openApplyModal()">
            <app-icon name="plus" [size]="16"></app-icon>
            <span>New Leave Request</span>
          </button>
        </div>
      </div>

      <!-- 2. KPI METRICS SUMMARY (NO-PRINT) -->
      <div class="grid-4 mb-4 no-print">
        <div class="kpi-card">
          <div class="kpi-icon-wrap bg-blue-subtle text-primary">
            <app-icon name="file-text" [size]="22"></app-icon>
          </div>
          <div>
            <div class="kpi-label">Total Applications</div>
            <div class="kpi-value">{{ applications.length }}</div>
            <div class="kpi-sub">Across Academic Year</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap bg-amber-subtle text-warning">
            <app-icon name="clock" [size]="22"></app-icon>
          </div>
          <div>
            <div class="kpi-label">Pending Approval</div>
            <div class="kpi-value text-warning">{{ pendingCount }}</div>
            <div class="kpi-sub">Awaiting Principal Review</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap bg-green-subtle text-success">
            <app-icon name="check-circle" [size]="22"></app-icon>
          </div>
          <div>
            <div class="kpi-label">Approved Leaves</div>
            <div class="kpi-value text-success">{{ approvedCount }}</div>
            <div class="kpi-sub">Sanction Orders Dispatched</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap bg-purple-subtle text-purple">
            <app-icon name="user-x" [size]="22"></app-icon>
          </div>
          <div>
            <div class="kpi-label">Currently On Leave</div>
            <div class="kpi-value text-purple">{{ onLeaveTodayCount }}</div>
            <div class="kpi-sub">Substitutes Deployed</div>
          </div>
        </div>
      </div>

      <!-- 3. FILTER CONTROLS BAR (NO-PRINT) -->
      <div class="card mb-4 no-print">
        <div class="card-body p-3">
          <div class="filter-strip">
            <div class="search-input-wrap">
              <app-icon name="search" [size]="16" class="search-icon"></app-icon>
              <input
                type="text"
                [(ngModel)]="searchTerm"
                class="form-control form-control-sm"
                placeholder="Search teacher name, code, or department..."
              />
            </div>

            <div class="filter-item">
              <label class="filter-lbl">Status:</label>
              <select class="form-select form-select-sm" [(ngModel)]="statusFilter">
                <option value="ALL">All Statuses</option>
                <option value="Pending">Pending Approval</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div class="filter-item">
              <label class="filter-lbl">Leave Type:</label>
              <select class="form-select form-select-sm" [(ngModel)]="typeFilter">
                <option value="ALL">All Types</option>
                <option value="Casual Leave">Casual Leave (CL)</option>
                <option value="Medical Leave">Medical Leave (ML)</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Earned Leave">Earned Leave (EL)</option>
                <option value="Maternity Leave">Maternity Leave</option>
                <option value="Unpaid Leave">Unpaid Leave</option>
              </select>
            </div>

            <button type="button" class="btn btn-outline btn-sm ml-auto" (click)="loadData()" [disabled]="isLoading">
              <app-icon name="refresh-cw" [size]="14" [class.spin-icon]="isLoading"></app-icon>
              <span>{{ isLoading ? 'Refreshing...' : 'Refresh' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 4. APPLICATIONS TABLE -->
      <div class="card no-print">
        <div class="card-header flex-between">
          <div class="card-title">
            <app-icon name="list" [size]="18" class="text-primary"></app-icon>
            <span>Faculty Leave Applications Ledger</span>
          </div>
          <span class="count-pill">{{ filteredApplications.length }} Records (PostgreSQL Live)</span>
        </div>

        <div class="app-table-wrapper">
          <table class="app-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Department</th>
                <th>Leave Type</th>
                <th>Duration & Dates</th>
                <th>Reason / Justification</th>
                <th>Status</th>
                <th style="text-align: right; width: 170px;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of filteredApplications">
                <td>
                  <div class="applicant-cell">
                    <img campusImage [src]="getTeacherAvatar(item.teacherId)" class="teacher-avatar" alt="" />
                    <div>
                      <div class="font-bold text-slate-900">{{ item.teacherName }}</div>
                      <div class="text-xs text-muted font-mono">{{ item.employeeCode }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="dept-pill">{{ item.department }}</span>
                </td>
                <td>
                  <span class="leave-type-pill">{{ item.leaveType }}</span>
                </td>
                <td>
                  <div class="font-bold text-slate-800">{{ item.startDate | date:'mediumDate' }} → {{ item.endDate | date:'mediumDate' }}</div>
                  <div class="text-xs text-muted font-mono">{{ item.totalDays }} day(s) • Applied on {{ item.appliedOn | date:'mediumDate' }}</div>
                </td>
                <td>
                  <div class="text-sm text-slate-700 max-w-sm">{{ item.reason }}</div>
                  <div class="text-xs text-emerald mt-1" *ngIf="item.reviewRemark">
                    <em>Remarks: {{ item.reviewRemark }}</em>
                  </div>
                </td>
                <td>
                  <app-badge [variant]="getStatusVariant(item.status)" [label]="item.status"></app-badge>
                </td>
                <td style="text-align: right;">
                  <div class="flex justify-end gap-1">
                    <button
                      *ngIf="item.status === 'Pending'"
                      type="button"
                      class="btn btn-sm btn-primary"
                      (click)="openReviewModal(item)"
                      title="Review application"
                    >
                      <app-icon name="check-circle" [size]="14"></app-icon>
                      <span>Review</span>
                    </button>

                    <button
                      *ngIf="item.status === 'Approved'"
                      type="button"
                      class="btn btn-sm btn-outline-success"
                      (click)="openPrintModal(item)"
                      title="Print Official Sanction Order"
                    >
                      <app-icon name="printer" [size]="14"></app-icon>
                      <span>Sanction Order</span>
                    </button>

                    <button
                      *ngIf="item.status !== 'Pending'"
                      type="button"
                      class="btn btn-sm btn-outline"
                      (click)="openReviewModal(item)"
                      title="View details"
                    >
                      <app-icon name="eye" [size]="14"></app-icon>
                      <span>Details</span>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredApplications.length === 0">
                <td colspan="7" class="text-center py-5 text-muted">
                  <app-icon name="info" [size]="28" class="text-muted mb-2"></app-icon>
                  <div>No teacher leave applications match the selected criteria.</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- MODAL 1: SUBMIT NEW LEAVE REQUISITION                    -->
    <!-- ======================================================== -->
    <app-modal
      [(isOpen)]="isApplyModalOpen"
      title="Submit Faculty Leave Application"
      subtitle="Requisition leave for institutional faculty with absence justification."
      [maxWidth]="580"
    >
      <div class="apply-form">
        <div class="form-group mb-3">
          <label class="form-label font-bold">Teacher / Faculty Member <span class="required">*</span></label>
          <select class="form-select" [(ngModel)]="newLeave.teacherId" (change)="onTeacherSelect()">
            <option *ngFor="let t of teachers" [value]="t.id">
              {{ t.fullName }} ({{ t.employeeCode }} — {{ t.department }})
            </option>
          </select>
        </div>

        <div class="grid-2 gap-3 mb-3">
          <div class="form-group mb-0">
            <label class="form-label font-bold">Leave Category <span class="required">*</span></label>
            <select class="form-select" [(ngModel)]="newLeave.leaveType">
              <option value="Casual Leave">Casual Leave (CL - 14 Days Quota)</option>
              <option value="Medical Leave">Medical Leave (ML - 10 Days Quota)</option>
              <option value="Earned Leave">Earned Leave (EL)</option>
              <option value="Maternity Leave">Maternity Leave</option>
              <option value="Unpaid Leave">Unpaid Leave (Salary Deduction)</option>
            </select>
          </div>
          <div class="form-group mb-0">
            <label class="form-label font-bold">Department</label>
            <input type="text" class="form-control" [value]="newLeave.department || ''" readonly />
          </div>
        </div>

        <div class="grid-2 gap-3 mb-3">
          <div class="form-group mb-0">
            <label class="form-label font-bold">Start Date <span class="required">*</span></label>
            <input type="date" class="form-control" [(ngModel)]="newLeave.startDate" (change)="calcDays()" />
          </div>
          <div class="form-group mb-0">
            <label class="form-label font-bold">End Date <span class="required">*</span></label>
            <input type="date" class="form-control" [(ngModel)]="newLeave.endDate" (change)="calcDays()" />
          </div>
        </div>

        <div class="days-summary-pill mb-3">
          <span>Total Requested Absence: <strong>{{ calculatedDays }} calendar day(s)</strong></span>
        </div>

        <div class="form-group mb-3">
          <label class="form-label font-bold">Purpose / Justification <span class="required">*</span></label>
          <textarea
            rows="3"
            class="form-control"
            [(ngModel)]="newLeave.reason"
            placeholder="State the reason for leave, emergency arrangements, or syllabus handover plan..."
          ></textarea>
        </div>
      </div>

      <div class="flex justify-end gap-2" footer>
        <button type="button" class="btn btn-outline" (click)="isApplyModalOpen = false">Cancel</button>
        <button type="button" class="btn btn-primary" (click)="submitLeaveApplication()" [disabled]="isSubmitting">
          <app-icon name="send" [size]="16"></app-icon>
          <span>{{ isSubmitting ? 'Submitting...' : 'Submit Leave Application' }}</span>
        </button>
      </div>
    </app-modal>

    <!-- ======================================================== -->
    <!-- MODAL 2: REVIEW / ADMINISTRATIVE DECISION MODAL          -->
    <!-- ======================================================== -->
    <app-modal
      [(isOpen)]="isReviewModalOpen"
      [title]="selectedApp?.status === 'Pending' ? 'Review Faculty Leave Application' : 'Leave Requisition Dossier'"
      subtitle="Administrative authorization and archival remark recording."
      [maxWidth]="560"
    >
      <div *ngIf="selectedApp" class="review-body">
        <div class="summary-box mb-3">
          <div class="font-bold text-slate-900 text-base">{{ selectedApp.teacherName }}</div>
          <div class="text-xs text-muted mb-2 font-mono">{{ selectedApp.employeeCode }} • {{ selectedApp.department }}</div>
          <div class="flex gap-2 mb-2">
            <span class="leave-type-pill">{{ selectedApp.leaveType }}</span>
            <app-badge [variant]="getStatusVariant(selectedApp.status)" [label]="selectedApp.status"></app-badge>
          </div>
          <div class="text-sm">
            <strong>Duration:</strong> {{ selectedApp.startDate | date:'mediumDate' }} to {{ selectedApp.endDate | date:'mediumDate' }} ({{ selectedApp.totalDays }} days)
          </div>
          <div class="text-sm mt-1">
            <strong>Applied Purpose:</strong> {{ selectedApp.reason }}
          </div>
        </div>

        <div class="form-group" *ngIf="selectedApp.status === 'Pending'">
          <label class="form-label font-bold">Administrative Remark / Handover Endorsement</label>
          <input
            type="text"
            class="form-control"
            [(ngModel)]="reviewRemark"
            placeholder="e.g. Approved. Syllabus handover arranged with Department Colleague."
          />
        </div>

        <div *ngIf="selectedApp.status !== 'Pending'" class="reviewed-info">
          <div class="text-xs text-muted">Authorized by: <strong>{{ selectedApp.reviewedBy || 'Principal' }}</strong></div>
          <div class="text-sm mt-1" *ngIf="selectedApp.reviewRemark">Remarks: {{ selectedApp.reviewRemark }}</div>
        </div>
      </div>

      <div class="flex justify-end gap-2" footer>
        <button type="button" class="btn btn-outline" (click)="isReviewModalOpen = false">Close</button>
        <ng-container *ngIf="selectedApp?.status === 'Pending'">
          <button type="button" class="btn btn-danger" (click)="decideLeave('Rejected')" [disabled]="isSubmitting">
            <app-icon name="x" [size]="16"></app-icon>
            <span>Reject</span>
          </button>
          <button type="button" class="btn btn-primary" (click)="decideLeave('Approved')" [disabled]="isSubmitting">
            <app-icon name="check" [size]="16"></app-icon>
            <span>Approve Leave</span>
          </button>
        </ng-container>
      </div>
    </app-modal>

    <!-- ======================================================== -->
    <!-- MODAL 3: OFFICIAL PRINTABLE LEAVE SANCTION ORDER         -->
    <!-- (A4 Benchmark Standard Matching Fee Receipt Quality)     -->
    <!-- ======================================================== -->
    <app-modal
      [(isOpen)]="isPrintModalOpen"
      title="Official Faculty Leave Sanction Order Preview"
      [maxWidth]="760"
      (close)="isPrintModalOpen = false"
    >
      <div class="modal-body p-4 printable-area">
        <div class="printable-document-frame" *ngIf="selectedPrintApp">
          <!-- OFFICIAL INSTITUTIONAL PRINT LETTERHEAD -->
          <div class="print-letterhead">
            <div class="pl-header-top">
              <div class="pl-logo-box">
                <app-icon name="graduation-cap" [size]="42" class="text-primary"></app-icon>
              </div>
              <div class="pl-school-meta">
                <h1 class="pl-school-name">{{ schoolName }} ({{ activeCampusName }})</h1>
                <p class="pl-school-addr">{{ schoolAddress }} • EIN: 108422 • Reg: 4920/2012 • Phone: +880 1711-000000</p>
                <div class="pl-report-title-pill">
                  OFFICIAL FACULTY LEAVE SANCTION & CLEARANCE ORDER (শিক্ষক ছুটির মঞ্জুরিপত্র)
                </div>
              </div>
              <div class="pl-copy-tag">
                ACADEMIC & HR ARCHIVE COPY
              </div>
            </div>

            <div class="pl-meta-grid">
              <div><strong>Sanction Reference:</strong> <span class="font-mono text-primary font-bold">SO-2026-{{ selectedPrintApp.id.slice(0, 8).toUpperCase() }}</span></div>
              <div><strong>Order Date:</strong> {{ todayDateFormatted }}</div>
              <div><strong>Academic Session:</strong> 2026 - 2027</div>
              <div><strong>Campus Branch:</strong> {{ activeCampusName }}</div>
            </div>
          </div>

          <!-- FACULTY & LEAVE PARTICULARS TABLE -->
          <div class="voucher-details-section">
            <h4 class="vds-title">1. Faculty Member Particulars (শিক্ষকের তথ্যাবলী)</h4>
            <div class="vds-grid">
              <div><strong>Faculty Name:</strong> {{ selectedPrintApp.teacherName }}</div>
              <div><strong>Employee ID:</strong> <span class="font-mono font-bold">{{ selectedPrintApp.employeeCode }}</span></div>
              <div><strong>Department:</strong> {{ selectedPrintApp.department }}</div>
              <div><strong>Designation:</strong> {{ getTeacherDesignation(selectedPrintApp.teacherId) }}</div>
            </div>

            <h4 class="vds-title mt-3">2. Sanctioned Leave Specifications (মঞ্জুরিকৃত ছুটির বিবরণ)</h4>
            <table class="voucher-table">
              <thead>
                <tr>
                  <th>Leave Classification</th>
                  <th class="text-center">Effective Start Date</th>
                  <th class="text-center">Effective End Date</th>
                  <th class="text-center">Total Absence</th>
                  <th>Salary Impact</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>{{ selectedPrintApp.leaveType }}</strong></td>
                  <td class="text-center font-mono">{{ selectedPrintApp.startDate | date:'mediumDate' }}</td>
                  <td class="text-center font-mono">{{ selectedPrintApp.endDate | date:'mediumDate' }}</td>
                  <td class="text-center font-bold font-mono">{{ selectedPrintApp.totalDays }} Day(s)</td>
                  <td class="font-bold" [class.text-emerald]="selectedPrintApp.leaveType !== 'Unpaid Leave'" [class.text-danger]="selectedPrintApp.leaveType === 'Unpaid Leave'">
                    {{ selectedPrintApp.leaveType === 'Unpaid Leave' ? 'Unpaid (Salary Deducted)' : 'Paid Leave Allowance' }}
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="leave-narration-box mt-3">
              <div class="ln-item">
                <strong>Stated Purpose of Absence:</strong> {{ selectedPrintApp.reason }}
              </div>
              <div class="ln-item mt-2" *ngIf="selectedPrintApp.reviewRemark">
                <strong>Administrative Authorization Remark:</strong> {{ selectedPrintApp.reviewRemark }}
              </div>
            </div>
          </div>

          <!-- OFFICIAL 3-SIGNATURE BLOCK & VERIFICATION STAMP -->
          <div class="print-signatures">
            <div class="sig-block">
              <div class="sig-line"></div>
              <span class="sig-title">Applicant Faculty<br>(আবেদনকারী শিক্ষক)</span>
            </div>

            <div class="sig-stamp-box">
              <div class="verified-stamp">✓ SANCTIONED & APPROVED</div>
              <span class="stamp-date">Accounts & HR Division • {{ todayDateFormatted }}</span>
            </div>

            <div class="sig-block">
              <div class="sig-line"></div>
              <span class="sig-title">Head of Department<br>(বিভাগীয় প্রধান)</span>
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
        <button type="button" class="btn btn-primary" (click)="printSanctionOrder()">
          <app-icon name="printer" [size]="16"></app-icon>
          <span>Print Sanction Order (A4)</span>
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .mb-0 { margin-bottom: 0 !important; }
    .mb-2 { margin-bottom: 8px; }
    .mb-3 { margin-bottom: 14px; }
    .mb-4 { margin-bottom: 24px; }
    .mt-1 { margin-top: 4px; }
    .mt-2 { margin-top: 8px; }
    .mt-3 { margin-top: 14px; }
    .p-3 { padding: 16px; }
    .p-4 { padding: 20px; }
    .text-primary { color: #4f46e5; }
    .text-success { color: #059669; }
    .text-warning { color: #d97706; }
    .text-purple { color: #7c3aed; }
    .text-emerald { color: #059669; }
    .text-danger { color: #dc2626; }
    .text-xs { font-size: 0.75rem; }
    .text-sm { font-size: 0.8125rem; }
    .text-base { font-size: 1rem; }
    .text-muted { color: #64748b; }
    .text-slate-700 { color: #334155; }
    .text-slate-800 { color: #1e293b; }
    .text-slate-900 { color: #0f172a; }
    .font-mono { font-family: monospace; }
    .font-bold { font-weight: 700; }
    .max-w-sm { max-width: 320px; }
    .ml-auto { margin-left: auto; }
    .gap-1 { gap: 4px; }
    .gap-2 { gap: 8px; }
    .gap-3 { gap: 12px; }

    /* Header Badge */
    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.75rem;
      font-weight: 700;
      color: #4f46e5;
      background: #eef2ff;
      padding: 4px 10px;
      border-radius: 999px;
      margin-bottom: 6px;
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
    }
    .campus-pill {
      background: #4f46e5;
      color: #ffffff;
      padding: 1px 7px;
      border-radius: 999px;
      font-size: 0.7rem;
    }

    .flex-between {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    @media (max-width: 992px) {
      .grid-4 { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 576px) {
      .grid-4 { grid-template-columns: 1fr; }
      .grid-2 { grid-template-columns: 1fr; }
    }

    .kpi-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .kpi-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .bg-blue-subtle { background: #eff6ff; }
    .bg-green-subtle { background: #ecfdf5; }
    .bg-amber-subtle { background: #fffbeb; }
    .bg-purple-subtle { background: #f5f3ff; }
    .kpi-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .kpi-value {
      font-size: 1.45rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
    }
    .kpi-sub {
      font-size: 0.72rem;
      color: #94a3b8;
    }

    .filter-strip {
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
    .filter-lbl {
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748b;
      white-space: nowrap;
    }
    .search-input-wrap {
      position: relative;
      flex: 1;
      min-width: 220px;
    }
    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }
    .search-input-wrap input {
      padding-left: 32px;
    }
    .count-pill {
      background: #eef2ff;
      color: #4f46e5;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 999px;
    }
    .applicant-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .teacher-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
    }
    .dept-pill {
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .leave-type-pill {
      display: inline-block;
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
    }
    .days-summary-pill {
      background: #eef2ff;
      color: #4f46e5;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 0.85rem;
    }
    .summary-box {
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 16px;
    }
    .reviewed-info {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 12px;
    }
    .btn-danger {
      background: #dc2626;
      color: #ffffff;
      border: none;
    }
    .btn-danger:hover {
      background: #b91c1c;
    }
    .btn-outline-success {
      border: 1px solid #059669;
      color: #059669;
      background: #ecfdf5;
    }
    .btn-outline-success:hover {
      background: #059669;
      color: #ffffff;
    }
    .required {
      color: #ef4444;
    }
    .spin-icon {
      animation: spin 1s linear infinite;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    /* ========================================================= */
    /* BENCHMARK PRINTABLE SANCTION ORDER STYLES (A4 FIT)        */
    /* ========================================================= */
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

    .vds-title {
      font-size: 0.8rem;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }
    .vds-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px 16px;
      font-size: 0.78rem;
      margin-bottom: 12px;
    }
    .voucher-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.78rem;
      margin-top: 6px;
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
      padding: 7px 10px;
      border: 1px solid #cbd5e1;
    }
    .leave-narration-box {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
      padding: 10px 12px;
      font-size: 0.76rem;
      color: #334155;
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

    /* Print media overrides */
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
export class TeacherLeaveComponent implements OnInit {
  private teacherStore = inject(TeacherStoreService);
  private campus = inject(CampusSessionService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  schoolName = 'Scholars International Academy';
  schoolAddress = 'Plot 14, Road 2, Block-E, Dhaka 1212, Bangladesh';
  activeCampusName = 'Main Campus';
  currentUser: User | null = null;

  isLoading = false;
  isSubmitting = false;

  teachers: Teacher[] = [];
  applications: TeacherLeaveApplication[] = [];

  searchTerm = '';
  statusFilter = 'ALL';
  typeFilter = 'ALL';

  // Apply Modal
  isApplyModalOpen = false;
  newLeave: Partial<TeacherLeaveApplication> = {
    leaveType: 'Casual Leave',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  };
  calculatedDays = 1;

  // Review Modal
  isReviewModalOpen = false;
  selectedApp: TeacherLeaveApplication | null = null;
  reviewRemark = '';

  // Print Sanction Modal
  isPrintModalOpen = false;
  selectedPrintApp: TeacherLeaveApplication | null = null;

  get todayDateFormatted(): string {
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date().toLocaleDateString('en-US', opts);
  }

  async ngOnInit() {
    this.currentUser = this.auth.getCurrentUser();
    this.activeCampusName = this.campus.branchId === 'br-02' ? 'Uttara Campus' : 'Dhanmondi Campus';
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    this.cdr.markForCheck();

    try {
      const [teachers, leaves] = await Promise.all([
        this.teacherStore.loadTeachers(),
        this.teacherStore.loadTeacherLeaves()
      ]);

      this.teachers = teachers || [];
      this.applications = leaves || [];

      if (this.teachers.length > 0 && !this.newLeave.teacherId) {
        this.newLeave.teacherId = this.teachers[0].id;
        this.onTeacherSelect();
      }
    } catch (e) {
      console.error('Failed to load teachers or leaves:', e);
      this.toast.error('Load Error', 'Could not load teacher leave applications.');
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  get filteredApplications(): TeacherLeaveApplication[] {
    let list = this.applications;
    if (this.statusFilter !== 'ALL') {
      list = list.filter(a => a.status === this.statusFilter);
    }
    if (this.typeFilter !== 'ALL') {
      list = list.filter(a => a.leaveType === this.typeFilter);
    }
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(a =>
        (a.teacherName || '').toLowerCase().includes(q) ||
        (a.employeeCode || '').toLowerCase().includes(q) ||
        (a.department || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  get pendingCount(): number {
    return this.applications.filter(a => a.status === 'Pending').length;
  }

  get approvedCount(): number {
    return this.applications.filter(a => a.status === 'Approved').length;
  }

  get onLeaveTodayCount(): number {
    const today = new Date().toISOString().split('T')[0];
    return this.applications.filter(a => a.status === 'Approved' && (a.startDate || '') <= today && (a.endDate || '') >= today).length;
  }

  getTeacherAvatar(teacherId: string): string {
    const t = this.teachers.find(tch => tch.id === teacherId);
    return t?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80';
  }

  getTeacherDesignation(teacherId: string): string {
    const t = this.teachers.find(tch => tch.id === teacherId);
    return t?.designation || 'Faculty Member';
  }

  getStatusVariant(status: string) {
    switch (status) {
      case 'Approved': return 'success';
      case 'Pending': return 'warning';
      case 'Rejected': return 'danger';
      default: return 'neutral';
    }
  }

  openApplyModal() {
    this.newLeave = {
      teacherId: this.teachers[0]?.id || '',
      leaveType: 'Casual Leave',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      reason: ''
    };
    this.onTeacherSelect();
    this.calcDays();
    this.isApplyModalOpen = true;
  }

  onTeacherSelect() {
    const t = this.teachers.find(tch => tch.id === this.newLeave.teacherId);
    if (t) {
      this.newLeave.teacherName = t.fullName;
      this.newLeave.employeeCode = t.employeeCode;
      this.newLeave.department = t.department;
    }
  }

  calcDays() {
    if (this.newLeave.startDate && this.newLeave.endDate) {
      const start = new Date(this.newLeave.startDate).getTime();
      const end = new Date(this.newLeave.endDate).getTime();
      const diff = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
      this.calculatedDays = diff;
    } else {
      this.calculatedDays = 1;
    }
  }

  async submitLeaveApplication() {
    if (!this.newLeave.teacherId || !this.newLeave.reason?.trim()) {
      this.toast.error('Validation Error', 'Teacher and Reason for leave are required.');
      return;
    }

    this.isSubmitting = true;
    this.newLeave.totalDays = this.calculatedDays;

    try {
      await this.teacherStore.applyTeacherLeave(this.newLeave);
      this.toast.success('Application Submitted', `Leave request recorded for ${this.newLeave.teacherName}.`);
      this.isApplyModalOpen = false;
      await this.loadData();
    } catch (e) {
      this.toast.error('Submission Failed', 'Could not record leave application.');
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  openReviewModal(app: TeacherLeaveApplication) {
    this.selectedApp = app;
    this.reviewRemark = app.reviewRemark || '';
    this.isReviewModalOpen = true;
  }

  openPrintModal(app: TeacherLeaveApplication) {
    this.selectedPrintApp = app;
    this.isPrintModalOpen = true;
  }

  printSanctionOrder() {
    window.print();
  }

  async decideLeave(status: 'Approved' | 'Rejected') {
    if (!this.selectedApp) return;

    this.isSubmitting = true;
    const teacherName = this.selectedApp.teacherName;

    try {
      await this.teacherStore.updateTeacherLeaveStatus(this.selectedApp.id, status, this.reviewRemark);
      this.toast.success(
        `Leave ${status}`,
        `Application for ${teacherName} marked as ${status}.`
      );
      this.isReviewModalOpen = false;
      this.selectedApp = null;
      await this.loadData();
    } catch (e) {
      this.toast.error('Review Error', 'Could not update leave application status.');
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }
}
