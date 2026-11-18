import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FinanceStoreService } from '../../core/services/stores/finance-store.service';
import { TeacherStoreService } from '../../core/services/stores/teacher-store.service';
import { AuthService } from '../../core/services/auth.service';
import { CampusSessionService } from '../../core/services/campus-session.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/components/icon.component';
import { BadgeComponent } from '../../shared/components/badge.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { SalaryStructure, EmployeePayroll, PayrollSummary, PaySlip, Teacher, User } from '../../core/models';

@Component({
  selector: 'app-payroll-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent, BadgeComponent, ModalComponent],
  template: `
    <div class="page-container">
      <!-- 1. OFFICIAL PRINT LETTERHEAD (PRINT ONLY) -->
      <div class="print-letterhead only-print">
        <div class="pl-header-top">
          <div class="pl-logo-box">
            <app-icon name="wallet" [size]="44" class="text-primary"></app-icon>
          </div>
          <div class="pl-school-meta">
            <h1 class="pl-school-name">{{ schoolName }}</h1>
            <p class="pl-school-addr">{{ schoolAddress }} • Campus: {{ activeCampusName }}</p>
            <div class="pl-report-title-pill">
              INSTITUTIONAL FACULTY & STAFF MONTHLY PAYROLL DISBURSEMENT REGISTER
            </div>
          </div>
        </div>
        <div class="pl-meta-grid">
          <div><strong>Academic Session:</strong> 2026 - 2027</div>
          <div><strong>Payroll Month:</strong> {{ getFormattedMonth(selectedMonthYear) }}</div>
          <div><strong>Disbursement Mode:</strong> Bank Transfer / Counter Cash</div>
          <div><strong>Date of Generation:</strong> {{ todayDateFormatted }}</div>
          <div><strong>Prepared By:</strong> {{ currentUser?.fullName || 'Bursar' }} ({{ currentUser?.roleName || 'Accounts Division' }})</div>
          <div><strong>Campus Security:</strong> Campus Tenant Isolated • Verified</div>
        </div>
      </div>

      <!-- 2. SCREEN PAGE HEADER (NO-PRINT) -->
      <div class="page-header no-print">
        <div>
          <div class="header-badge">
            <span class="pulse-dot"></span>
            Faculty & Staff Payroll Engine
            <span class="campus-pill">{{ activeCampusName }}</span>
          </div>
          <h1 class="page-title">
            <app-icon name="wallet" [size]="28" class="text-primary title-icon"></app-icon>
            Teacher & Staff Payroll Engine
          </h1>
          <p class="page-subtitle">
            1-click monthly salary sheet generation, automated attendance leave deductions, confidential pay slips, and bank transfer advisory statements.
          </p>
        </div>
        <div class="page-actions">
          <button type="button" class="btn btn-outline" (click)="exportBankAdvisory()" [disabled]="payrolls.length === 0" title="Export formatted bank disbursement advice">
            <app-icon name="file-text" [size]="16"></app-icon>
            <span>Bank Advisory (CSV)</span>
          </button>
          <button type="button" class="btn btn-outline" (click)="printRegister()" [disabled]="payrolls.length === 0" title="Print official A4 payroll register">
            <app-icon name="printer" [size]="16"></app-icon>
            <span>Print Register</span>
          </button>
          <button type="button" class="btn btn-primary" (click)="openGenerateModal()" title="Generate monthly salary for active campus teachers">
            <app-icon name="zap" [size]="16"></app-icon>
            <span>Generate Monthly Payroll</span>
          </button>
        </div>
      </div>

      <!-- 3. TOP KPI STRIP (NO-PRINT) -->
      <div class="kpi-strip mb-4 no-print">
        <div class="kpi-box">
          <span class="kpi-label">Gross Payroll Commitment</span>
          <h3 class="kpi-val text-primary">৳ {{ (summary?.totalGrossPayroll || 0).toLocaleString() }}</h3>
          <span class="kpi-sub">{{ summary?.totalEmployees || 0 }} Faculty & Staff Members</span>
        </div>
        <div class="kpi-box">
          <span class="kpi-label">Total Net Disbursable</span>
          <h3 class="kpi-val text-emerald">৳ {{ (summary?.totalNetPayable || 0).toLocaleString() }}</h3>
          <span class="kpi-sub">Calculated Net Inflow to Staff</span>
        </div>
        <div class="kpi-box">
          <span class="kpi-label">Leave & PF Deductions</span>
          <h3 class="kpi-val text-warning">৳ {{ (summary?.totalDeductions || 0).toLocaleString() }}</h3>
          <span class="kpi-sub">Unpaid Absence & 5% PF Retained</span>
        </div>
        <div class="kpi-box">
          <span class="kpi-label">Already Disbursed</span>
          <h3 class="kpi-val text-indigo">৳ {{ (summary?.totalDisbursed || 0).toLocaleString() }}</h3>
          <span class="kpi-sub">{{ summary?.fullyPaidCount || 0 }} Accounts Settled</span>
        </div>
        <div class="kpi-box" [class.border-amber]="(summary?.pendingApprovalCount || 0) > 0">
          <span class="kpi-label">Pending Approval / Action</span>
          <h3 class="kpi-val text-danger">{{ summary?.pendingApprovalCount || 0 }}</h3>
          <span class="kpi-sub">{{ summary?.pendingDisbursementCount || 0 }} Ready for Bank Transfer</span>
        </div>
      </div>

      <!-- 4. NAVIGATION TABS (NO-PRINT) -->
      <div class="tabs-nav mb-4 no-print">
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab === 'sheet'"
          (click)="activeTab = 'sheet'"
        >
          <app-icon name="receipt" [size]="16"></app-icon>
          <span>Monthly Payroll Register ({{ payrolls.length }})</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab === 'structures'"
          (click)="activeTab = 'structures'"
        >
          <app-icon name="sliders" [size]="16"></app-icon>
          <span>Salary Structures & Pay Scales ({{ salaryStructures.length }})</span>
        </button>
      </div>

      <!-- ======================================================== -->
      <!-- TAB 1: MONTHLY PAYROLL REGISTER                         -->
      <!-- ======================================================== -->
      <div *ngIf="activeTab === 'sheet'">
        <!-- FILTER CONTROLS BAR -->
        <div class="card mb-4 filter-card no-print">
          <div class="card-body">
            <div class="filter-grid-4">
              <div class="form-group mb-0">
                <label class="form-label font-bold">Payroll Month / Period</label>
                <input
                  type="month"
                  class="form-control"
                  [(ngModel)]="selectedMonthYear"
                  (change)="loadPayrollData()"
                />
              </div>

              <div class="form-group mb-0">
                <label class="form-label font-bold">Disbursement Status</label>
                <select class="form-select" [(ngModel)]="filterStatus" (change)="applyFilters()">
                  <option value="ALL">All Statuses (Draft / Approved / Paid)</option>
                  <option value="Draft">Draft (Pending Approval)</option>
                  <option value="Approved">Approved (Ready for Payment)</option>
                  <option value="Paid">Disbursed & Paid</option>
                </select>
              </div>

              <div class="form-group mb-0">
                <label class="form-label font-bold">Search Faculty</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Filter name, code, dept..."
                  [(ngModel)]="searchQuery"
                />
              </div>

              <div class="form-group mb-0 filter-btn-group">
                <label class="form-label d-none d-md-block">&nbsp;</label>
                <div class="flex gap-2">
                  <button
                    type="button"
                    class="btn btn-outline flex-1"
                    (click)="batchApprove()"
                    [disabled]="(summary?.pendingApprovalCount || 0) === 0 || isProcessing"
                    title="Approve all draft payroll records"
                  >
                    <app-icon name="check-circle" [size]="14"></app-icon>
                    <span>Approve All</span>
                  </button>
                  <button
                    type="button"
                    class="btn btn-primary flex-1"
                    (click)="openBatchDisburseModal()"
                    [disabled]="(summary?.pendingDisbursementCount || 0) === 0 || isProcessing"
                    title="Disburse salaries to all approved teachers"
                  >
                    <app-icon name="credit-card" [size]="14"></app-icon>
                    <span>Disburse</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- PAYROLL TABLE CARD -->
        <div class="card">
          <div class="card-header flex-between flex-wrap gap-2">
            <div class="card-title">
              <app-icon name="wallet" [size]="18" class="text-primary"></app-icon>
              <span>Faculty Payroll Register for {{ getFormattedMonth(selectedMonthYear) }}</span>
              <span class="badge-total-items">{{ filteredPayrolls.length }} Records</span>
            </div>
          </div>

          <div class="app-table-wrapper">
            <table class="app-table">
              <thead>
                <tr>
                  <th>Employee Dossier</th>
                  <th>Designation & Dept</th>
                  <th class="text-right">Basic Pay</th>
                  <th class="text-center" style="width: 100px;">Absence Days</th>
                  <th class="text-right" style="width: 120px;">Gross Salary</th>
                  <th class="text-right" style="width: 120px;">Deductions</th>
                  <th class="text-right" style="width: 130px;">Net Payable</th>
                  <th class="text-center" style="width: 100px;">Status</th>
                  <th class="text-center no-print" style="width: 140px;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of filteredPayrolls">
                  <td>
                    <div class="employee-dossier">
                      <strong>{{ p.employeeName }}</strong>
                      <span class="text-xs text-muted font-mono d-block">{{ p.employeeCode }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="font-bold text-slate-800">{{ p.designation }}</span>
                    <span class="text-xs text-muted d-block">{{ p.department }}</span>
                  </td>
                  <td class="text-right font-mono">
                    ৳ {{ p.basicPay.toLocaleString() }}
                  </td>
                  <td class="text-center font-mono">
                    <span [class.text-danger]="p.unpaidLeaveDays > 0" [class.font-bold]="p.unpaidLeaveDays > 0">
                      {{ p.unpaidLeaveDays }} Day(s)
                    </span>
                    <span class="text-xs text-muted d-block font-sans" *ngIf="p.paidLeaveDays > 0">
                      ({{ p.paidLeaveDays }} Paid)
                    </span>
                  </td>
                  <td class="text-right font-bold text-slate-800">
                    ৳ {{ p.grossSalary.toLocaleString() }}
                  </td>
                  <td class="text-right text-warning font-bold">
                    - ৳ {{ p.totalDeductions.toLocaleString() }}
                    <span class="text-xs text-muted d-block font-sans" *ngIf="p.leaveDeduction > 0">
                      (Leave: ৳{{ p.leaveDeduction }})
                    </span>
                  </td>
                  <td class="text-right">
                    <strong class="text-emerald font-bold" style="font-size: 1.05rem;">
                      ৳ {{ p.netPayable.toLocaleString() }}
                    </strong>
                    <span class="text-xs text-muted d-block font-mono" *ngIf="p.bankAccountNo">
                      {{ p.bankAccountNo }}
                    </span>
                  </td>
                  <td class="text-center">
                    <app-badge
                      [variant]="p.paymentStatus === 'Paid' ? 'success' : (p.paymentStatus === 'Approved' ? 'info' : 'warning')"
                      [label]="p.paymentStatus"
                    ></app-badge>
                  </td>
                  <td class="text-center no-print">
                    <div class="table-actions">
                      <!-- Approve Action (Draft only) -->
                      <button
                        *ngIf="p.paymentStatus === 'Draft'"
                        type="button"
                        class="btn btn-xs btn-outline text-primary"
                        (click)="approveSingle(p.id)"
                        title="Approve this teacher's salary"
                      >
                        <app-icon name="check" [size]="12"></app-icon>
                        <span>Approve</span>
                      </button>

                      <!-- Disburse Action (Approved only) -->
                      <button
                        *ngIf="p.paymentStatus === 'Approved'"
                        type="button"
                        class="btn btn-xs btn-primary"
                        (click)="openSingleDisburseModal(p)"
                        title="Disburse salary via Bank/Cash"
                      >
                        <app-icon name="dollar-sign" [size]="12"></app-icon>
                        <span>Pay</span>
                      </button>

                      <!-- View Pay Slip (All) -->
                      <button
                        type="button"
                        class="btn btn-xs btn-outline"
                        (click)="openPaySlipModal(p.id)"
                        title="View Official Institutional Pay Slip"
                      >
                        <app-icon name="file-text" [size]="12"></app-icon>
                        <span>Slip</span>
                      </button>
                    </div>
                  </td>
                </tr>

                <tr *ngIf="filteredPayrolls.length === 0">
                  <td colspan="9" class="text-center py-5 text-muted">
                    <app-icon name="wallet" [size]="36" class="mb-2 text-slate-400"></app-icon>
                    <div class="empty-title font-bold text-slate-700">No Payroll Records Generated</div>
                    <div class="empty-sub text-sm">No salary sheet has been compiled for {{ getFormattedMonth(selectedMonthYear) }} yet.</div>
                    <div class="mt-3 no-print">
                      <button type="button" class="btn btn-sm btn-primary" (click)="openGenerateModal()">
                        <app-icon name="zap" [size]="14"></app-icon>
                        <span>Generate Monthly Payroll Sheet</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- TAB 2: SALARY STRUCTURES & PAY SCALES                   -->
      <!-- ======================================================== -->
      <div *ngIf="activeTab === 'structures'">
        <div class="card">
          <div class="card-header flex-between flex-wrap gap-2">
            <div class="card-title">
              <app-icon name="sliders" [size]="18" class="text-primary"></app-icon>
              <span>Faculty Base Salary Scales & Allowance Profiles</span>
              <span class="badge-total-items">{{ salaryStructures.length }} Configured Profiles</span>
            </div>
          </div>

          <div class="app-table-wrapper">
            <table class="app-table">
              <thead>
                <tr>
                  <th>Faculty Member</th>
                  <th>Designation & Dept</th>
                  <th class="text-right">Basic Pay</th>
                  <th class="text-right">House Rent</th>
                  <th class="text-right">Medical</th>
                  <th class="text-right">Conveyance</th>
                  <th class="text-right">Special</th>
                  <th class="text-right">Gross Total</th>
                  <th class="text-center">Bank Account</th>
                  <th class="text-center no-print">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of salaryStructures">
                  <td>
                    <strong>{{ s.employeeName }}</strong>
                    <span class="text-xs text-muted font-mono d-block">{{ s.employeeCode }}</span>
                  </td>
                  <td>
                    <span class="font-bold text-slate-800">{{ s.designation }}</span>
                    <span class="text-xs text-muted d-block">{{ s.department }}</span>
                  </td>
                  <td class="text-right font-mono">৳ {{ s.basicPay.toLocaleString() }}</td>
                  <td class="text-right font-mono">৳ {{ s.houseRent.toLocaleString() }}</td>
                  <td class="text-right font-mono">৳ {{ s.medicalAllowance.toLocaleString() }}</td>
                  <td class="text-right font-mono">৳ {{ s.conveyance.toLocaleString() }}</td>
                  <td class="text-right font-mono">৳ {{ s.specialAllowance.toLocaleString() }}</td>
                  <td class="text-right">
                    <strong class="text-primary font-bold">
                      ৳ {{ ((s.grossSalary || (s.basicPay + s.houseRent + s.medicalAllowance + s.conveyance + s.specialAllowance))).toLocaleString() }}
                    </strong>
                  </td>
                  <td class="text-center">
                    <span class="text-xs font-mono font-bold text-slate-700">{{ s.bankAccountNo || 'Cash Payment' }}</span>
                    <span class="text-xs text-muted d-block">{{ s.bankName }}</span>
                  </td>
                  <td class="text-center no-print">
                    <button type="button" class="btn btn-xs btn-outline" (click)="openEditStructureModal(s)">
                      <app-icon name="edit-3" [size]="12"></app-icon>
                      <span>Configure</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 5. PRINT SIGNATURE BLOCKS (PRINT ONLY) -->
      <div class="print-signatures only-print">
        <div class="sig-block">
          <div class="sig-line"></div>
          <span class="sig-title">Prepared By (Bursar / Accounts Officer)</span>
        </div>
        <div class="sig-block">
          <div class="sig-line"></div>
          <span class="sig-title">Verified By (Audit Committee)</span>
        </div>
        <div class="sig-block">
          <div class="sig-line"></div>
          <span class="sig-title">Approved By (Principal / Governing Body)</span>
        </div>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- MODAL 1: 1-CLICK GENERATE MONTHLY PAYROLL                -->
    <!-- ======================================================== -->
    <app-modal
      [(isOpen)]="isGenerateModalOpen"
      title="Generate Campus Monthly Payroll"
      subtitle="Automatically evaluates active faculty members, checks leave records for unpaid absence deductions, and drafts the monthly salary sheet."
      [maxWidth]="500"
    >
      <div class="modal-form-body">
        <div class="form-group mb-3">
          <label class="form-label font-bold">Payroll Month / Year <span class="text-danger">*</span></label>
          <input type="month" class="form-control" [(ngModel)]="generateMonth" />
        </div>

        <div class="form-group mb-3">
          <label class="form-label font-bold">Festival / Special Bonus (Per Teacher)</label>
          <div class="input-prefix-wrap">
            <span class="input-prefix">৳</span>
            <input type="number" class="form-control" [(ngModel)]="generateBonusAmount" placeholder="0" min="0" />
          </div>
        </div>

        <div class="form-group mb-3" *ngIf="generateBonusAmount > 0">
          <label class="form-label">Bonus Particulars</label>
          <input type="text" class="form-control" [(ngModel)]="generateBonusParticulars" placeholder="e.g. Eid-ul-Fitr Bonus 2026" />
        </div>

        <div class="hint-box-info text-xs">
          <app-icon name="info" [size]="14" class="text-primary"></app-icon>
          <span>The payroll engine will automatically deduct unpaid leaves based on approved leave applications from the database.</span>
        </div>
      </div>

      <div class="flex justify-end gap-2" footer>
        <button type="button" class="btn btn-outline" (click)="isGenerateModalOpen = false">Cancel</button>
        <button type="button" class="btn btn-primary" (click)="confirmGeneratePayroll()" [disabled]="isProcessing">
          <app-icon *ngIf="!isProcessing" name="zap" [size]="15"></app-icon>
          <app-icon *ngIf="isProcessing" name="loader" [size]="15" class="spin-icon"></app-icon>
          <span>{{ isProcessing ? 'Compiling Payroll...' : 'Compile & Save to Database' }}</span>
        </button>
      </div>
    </app-modal>

    <!-- ======================================================== -->
    <!-- MODAL 2: DISBURSE SALARY                                -->
    <!-- ======================================================== -->
    <app-modal
      [(isOpen)]="isDisburseModalOpen"
      [title]="isBatchDisbursing ? 'Batch Disburse Campus Salaries' : 'Disburse Teacher Salary'"
      subtitle="Confirm payment channel and finalize institutional cash outflow."
      [maxWidth]="480"
    >
      <div class="modal-form-body">
        <div class="form-group mb-3">
          <label class="form-label font-bold">Payment Method <span class="text-danger">*</span></label>
          <select class="form-select" [(ngModel)]="disburseMethod">
            <option value="Bank Transfer">Bank Transfer (Direct Account Credit)</option>
            <option value="Cash">Cash (Counter Disbursement)</option>
            <option value="bKash">bKash Corporate Payout</option>
          </select>
        </div>

        <div class="form-group mb-3">
          <label class="form-label font-bold">Transaction / Cheque Reference</label>
          <input type="text" class="form-control" [(ngModel)]="disburseTxnRef" placeholder="e.g. DBBL-FT-99412 or Cheque #88192" />
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Internal Disbursement Remarks</label>
          <input type="text" class="form-control" [(ngModel)]="disburseRemarks" placeholder="e.g. Monthly salary cleared via DBBL corporate banking" />
        </div>
      </div>

      <div class="flex justify-end gap-2" footer>
        <button type="button" class="btn btn-outline" (click)="isDisburseModalOpen = false">Cancel</button>
        <button type="button" class="btn btn-primary" (click)="confirmDisburse()" [disabled]="isProcessing">
          <app-icon *ngIf="!isProcessing" name="check" [size]="15"></app-icon>
          <app-icon *ngIf="isProcessing" name="loader" [size]="15" class="spin-icon"></app-icon>
          <span>{{ isProcessing ? 'Processing...' : 'Confirm Disbursement' }}</span>
        </button>
      </div>
    </app-modal>

    <!-- ======================================================== -->
    <!-- MODAL 3: CONFIGURE SALARY STRUCTURE                     -->
    <!-- ======================================================== -->
    <app-modal
      [(isOpen)]="isEditStructureModalOpen"
      title="Configure Faculty Base Salary Scale"
      subtitle="Set up basic salary, house rent, and regular allowances for this faculty member."
      [maxWidth]="560"
    >
      <div class="modal-form-body" *ngIf="editingStructure">
        <div class="employee-meta-banner mb-3">
          <strong>{{ editingStructure.employeeName }}</strong>
          <span class="text-xs text-muted font-mono d-block">{{ editingStructure.employeeCode }} • {{ editingStructure.designation }} ({{ editingStructure.department }})</span>
        </div>

        <div class="grid-2-col gap-3">
          <div class="form-group">
            <label class="form-label font-bold">Basic Pay (৳) <span class="text-danger">*</span></label>
            <input type="number" class="form-control" [(ngModel)]="editingStructure.basicPay" min="0" />
          </div>
          <div class="form-group">
            <label class="form-label font-bold">House Rent Allowance (৳)</label>
            <input type="number" class="form-control" [(ngModel)]="editingStructure.houseRent" min="0" />
          </div>
        </div>

        <div class="grid-3-col gap-3">
          <div class="form-group">
            <label class="form-label">Medical Allowance (৳)</label>
            <input type="number" class="form-control" [(ngModel)]="editingStructure.medicalAllowance" min="0" />
          </div>
          <div class="form-group">
            <label class="form-label">Conveyance (৳)</label>
            <input type="number" class="form-control" [(ngModel)]="editingStructure.conveyance" min="0" />
          </div>
          <div class="form-group">
            <label class="form-label">Special Allowance (৳)</label>
            <input type="number" class="form-control" [(ngModel)]="editingStructure.specialAllowance" min="0" />
          </div>
        </div>

        <div class="grid-2-col gap-3">
          <div class="form-group">
            <label class="form-label font-bold">Provident Fund Deduct (%)</label>
            <input type="number" class="form-control" [(ngModel)]="editingStructure.providentFundPercent" min="0" max="25" step="0.5" />
          </div>
          <div class="form-group">
            <label class="form-label font-bold">Gross Monthly Total (৳)</label>
            <div class="gross-display font-mono font-bold text-primary">
              ৳ {{ (editingStructure.basicPay + editingStructure.houseRent + editingStructure.medicalAllowance + editingStructure.conveyance + editingStructure.specialAllowance).toLocaleString() }}
            </div>
          </div>
        </div>

        <hr class="my-3" />

        <div class="grid-2-col gap-3">
          <div class="form-group">
            <label class="form-label">Bank Name</label>
            <input type="text" class="form-control" [(ngModel)]="editingStructure.bankName" placeholder="e.g. Dutch-Bangla Bank Ltd" />
          </div>
          <div class="form-group">
            <label class="form-label">Branch Name</label>
            <input type="text" class="form-control" [(ngModel)]="editingStructure.branchName" placeholder="e.g. Dhanmondi Branch" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label font-bold">Bank Account Number</label>
          <input type="text" class="form-control font-mono" [(ngModel)]="editingStructure.bankAccountNo" placeholder="e.g. DBBL-110.123456" />
        </div>
      </div>

      <div class="flex justify-end gap-2" footer>
        <button type="button" class="btn btn-outline" (click)="isEditStructureModalOpen = false">Cancel</button>
        <button type="button" class="btn btn-primary" (click)="saveStructure()" [disabled]="isProcessing">
          <app-icon *ngIf="!isProcessing" name="check" [size]="15"></app-icon>
          <app-icon *ngIf="isProcessing" name="loader" [size]="15" class="spin-icon"></app-icon>
          <span>Save Salary Scale</span>
        </button>
      </div>
    </app-modal>

    <!-- ======================================================== -->
    <!-- MODAL 4: OFFICIAL CONFIDENTIAL PAY SLIP MODAL (PRINT)   -->
    <!-- ======================================================== -->
    <app-modal
      [(isOpen)]="isPaySlipModalOpen"
      title="Official Confidential Salary Pay Slip (বেতন বিবরণী)"
      subtitle="Authorized Institutional Remuneration Statement."
      [maxWidth]="680"
    >
      <div class="payslip-modal-content" *ngIf="currentPaySlip">
        <!-- 1. INSTITUTIONAL LETTERHEAD -->
        <div class="ps-header">
          <div class="ps-logo-icon">
            <app-icon name="award" [size]="38" class="text-primary"></app-icon>
          </div>
          <div class="ps-school-meta text-center">
            <h2 class="ps-school-name">{{ currentPaySlip.schoolName }}</h2>
            <p class="ps-school-addr">{{ currentPaySlip.schoolAddress }} • Campus: {{ currentPaySlip.campusName }}</p>
            <div class="ps-slip-title">CONFIDENTIAL EMPLOYEE SALARY PAY SLIP (বেতন বিবরণী)</div>
            <div class="ps-period">For the Month of: <strong>{{ getFormattedMonth(currentPaySlip.payroll.salaryMonthYear) }}</strong></div>
          </div>
        </div>

        <!-- 2. EMPLOYEE PROFILE DOSSIER -->
        <div class="ps-employee-grid">
          <div><span class="ps-label">Employee Name:</span> <strong>{{ currentPaySlip.payroll.employeeName }}</strong></div>
          <div><span class="ps-label">Employee ID:</span> <strong class="font-mono">{{ currentPaySlip.payroll.employeeCode }}</strong></div>
          <div><span class="ps-label">Designation:</span> <strong>{{ currentPaySlip.payroll.designation }}</strong></div>
          <div><span class="ps-label">Department:</span> <strong>{{ currentPaySlip.payroll.department }}</strong></div>
          <div><span class="ps-label">Payment Channel:</span> <strong>{{ currentPaySlip.payroll.paymentMethod }}</strong></div>
          <div><span class="ps-label">Bank A/C No:</span> <strong class="font-mono">{{ currentPaySlip.payroll.bankAccountNo || 'Cash Disbursement' }}</strong></div>
        </div>

        <!-- 3. EARNINGS VS DEDUCTIONS MATRIX -->
        <div class="ps-matrix-grid">
          <!-- EARNINGS -->
          <div class="ps-col">
            <div class="ps-col-header text-emerald">EARNINGS / প্রদেয় ভাতাসমূহ</div>
            <div class="ps-row"><span>Basic Salary (মূল বেতন)</span> <span class="font-mono">৳ {{ currentPaySlip.payroll.basicPay.toLocaleString() }}</span></div>
            <div class="ps-row"><span>House Rent Allowance</span> <span class="font-mono">৳ {{ currentPaySlip.payroll.houseRent.toLocaleString() }}</span></div>
            <div class="ps-row"><span>Medical Allowance</span> <span class="font-mono">৳ {{ currentPaySlip.payroll.medicalAllowance.toLocaleString() }}</span></div>
            <div class="ps-row"><span>Conveyance Allowance</span> <span class="font-mono">৳ {{ currentPaySlip.payroll.conveyance.toLocaleString() }}</span></div>
            <div class="ps-row" *ngIf="currentPaySlip.payroll.specialAllowance > 0"><span>Special Allowance</span> <span class="font-mono">৳ {{ currentPaySlip.payroll.specialAllowance.toLocaleString() }}</span></div>
            <div class="ps-row" *ngIf="currentPaySlip.payroll.bonusAmount > 0"><span>Festival / Bonus</span> <span class="font-mono">৳ {{ currentPaySlip.payroll.bonusAmount.toLocaleString() }}</span></div>
            <div class="ps-row ps-subtotal">
              <strong>Gross Earnings</strong>
              <strong class="font-mono text-emerald">৳ {{ (currentPaySlip.payroll.grossSalary + currentPaySlip.payroll.bonusAmount).toLocaleString() }}</strong>
            </div>
          </div>

          <!-- DEDUCTIONS -->
          <div class="ps-col">
            <div class="ps-col-header text-danger">DEDUCTIONS / কর্তনসমূহ</div>
            <div class="ps-row">
              <span>Leave Without Pay ({{ currentPaySlip.payroll.unpaidLeaveDays }} Days)</span>
              <span class="font-mono text-danger">- ৳ {{ currentPaySlip.payroll.leaveDeduction.toLocaleString() }}</span>
            </div>
            <div class="ps-row">
              <span>Provident Fund (PF)</span>
              <span class="font-mono text-danger">- ৳ {{ currentPaySlip.payroll.providentFundDeduction.toLocaleString() }}</span>
            </div>
            <div class="ps-row" *ngIf="currentPaySlip.payroll.advanceSalaryDeduction > 0">
              <span>Advance Salary Deduct</span>
              <span class="font-mono text-danger">- ৳ {{ currentPaySlip.payroll.advanceSalaryDeduction.toLocaleString() }}</span>
            </div>
            <div class="ps-row" *ngIf="currentPaySlip.payroll.taxDeduction > 0">
              <span>Income Tax Withheld</span>
              <span class="font-mono text-danger">- ৳ {{ currentPaySlip.payroll.taxDeduction.toLocaleString() }}</span>
            </div>
            <div class="ps-row ps-subtotal">
              <strong>Total Deductions</strong>
              <strong class="font-mono text-danger">- ৳ {{ currentPaySlip.payroll.totalDeductions.toLocaleString() }}</strong>
            </div>
          </div>
        </div>

        <!-- 4. NET TAKE-HOME PAY BOX -->
        <div class="ps-net-box">
          <div class="ps-net-left">
            <div class="ps-net-label">NET TAKE-HOME REMUNERATION (প্রদেয় নেট বেতন)</div>
            <div class="ps-net-words">{{ currentPaySlip.netPayableInWords }}</div>
          </div>
          <div class="ps-net-right">
            <div class="ps-net-amount">৳ {{ currentPaySlip.payroll.netPayable.toLocaleString() }} BDT</div>
            <div class="ps-status-stamp" [class.paid]="currentPaySlip.payroll.paymentStatus === 'Paid'">
              {{ currentPaySlip.payroll.paymentStatus === 'Paid' ? '✓ VERIFIED & DISBURSED' : 'AUTHORIZED & APPROVED' }}
            </div>
          </div>
        </div>

        <!-- 5. SIGNATURE BLOCKS -->
        <div class="ps-signatures">
          <div class="ps-sig-box">
            <div class="ps-sig-line"></div>
            <span>Employee / Payee Signature</span>
          </div>
          <div class="ps-sig-box">
            <div class="ps-sig-line"></div>
            <span>Bursar / Accounts Officer</span>
          </div>
          <div class="ps-sig-box">
            <div class="ps-sig-line"></div>
            <span>Principal / Head of Institution</span>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2 no-print" footer>
        <button type="button" class="btn btn-outline" (click)="isPaySlipModalOpen = false">Close</button>
        <button type="button" class="btn btn-primary" (click)="printPaySlip()">
          <app-icon name="printer" [size]="15"></app-icon>
          <span>Print Official Pay Slip</span>
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .mb-0 { margin-bottom: 0 !important; }
    .mb-3 { margin-bottom: 16px; }
    .mb-4 { margin-bottom: 24px; }
    .my-3 { margin: 16px 0; border: none; border-top: 1px solid #e2e8f0; }
    .text-primary { color: #4f46e5; }
    .text-emerald { color: #059669; }
    .text-danger { color: #ef4444; }
    .text-warning { color: #d97706; }
    .text-indigo { color: #4f46e5; }
    .text-muted { color: #64748b; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
    .font-mono { font-family: monospace; }
    .flex-between { display: flex; align-items: center; justify-content: space-between; }
    .flex-1 { flex: 1; }

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

    /* KPI Strip */
    .kpi-strip {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 14px;
    }
    @media (max-width: 1100px) {
      .kpi-strip { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 700px) {
      .kpi-strip { grid-template-columns: 1fr; }
    }
    .kpi-box {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 16px 18px;
      box-shadow: var(--shadow-sm);
    }
    .kpi-box.border-amber { border-left: 4px solid #f59e0b; }
    .kpi-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .kpi-val {
      font-size: 1.55rem;
      font-weight: 800;
      margin: 4px 0;
    }
    .kpi-sub {
      font-size: 0.76rem;
      color: #94a3b8;
    }

    /* Tabs Bar */
    .tabs-nav {
      display: flex;
      gap: 10px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 2px;
      overflow-x: auto;
    }
    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border: none;
      background: transparent;
      color: #64748b;
      font-weight: 600;
      font-size: 0.875rem;
      border-bottom: 3px solid transparent;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .tab-btn:hover {
      color: #1e293b;
      background: #f8fafc;
      border-radius: 8px 8px 0 0;
    }
    .tab-btn.active {
      color: #4f46e5;
      border-bottom-color: #4f46e5;
      background: #f5f3ff;
      border-radius: 8px 8px 0 0;
      font-weight: 700;
    }

    /* Filters Grid */
    .filter-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .filter-grid-4 {
      display: grid;
      grid-template-columns: 180px 220px 1fr 220px;
      gap: 14px;
      align-items: flex-end;
    }
    @media (max-width: 900px) {
      .filter-grid-4 { grid-template-columns: 1fr; }
    }

    .badge-total-items {
      font-size: 0.72rem;
      background: #eef2ff;
      color: #4f46e5;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      margin-left: 8px;
    }

    .table-actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .btn-xs {
      padding: 3px 8px;
      font-size: 0.72rem;
      font-weight: 600;
      border-radius: 5px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    /* Modal Styling */
    .grid-2-col {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
    }
    .grid-3-col {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
    }
    .input-prefix-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-prefix {
      position: absolute;
      left: 12px;
      color: #64748b;
      font-weight: 700;
    }
    .input-prefix-wrap input {
      padding-left: 28px;
    }
    .hint-box-info {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #eff6ff;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid #bfdbfe;
      color: #1e3a8a;
    }
    .employee-meta-banner {
      background: #f8fafc;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .gross-display {
      background: #eef2ff;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 1.1rem;
    }

    /* Official Pay Slip Modal Layout */
    .payslip-modal-content {
      padding: 10px;
    }
    .ps-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .ps-school-name {
      font-size: 1.35rem;
      font-weight: 900;
      margin: 0;
      color: #0f172a;
    }
    .ps-school-addr {
      font-size: 0.8rem;
      color: #475569;
      margin: 2px 0 6px;
    }
    .ps-slip-title {
      display: inline-block;
      background: #0f172a;
      color: #ffffff;
      font-weight: 800;
      font-size: 0.78rem;
      padding: 2px 10px;
      border-radius: 4px;
      letter-spacing: 0.05em;
    }
    .ps-period {
      font-size: 0.8rem;
      color: #334155;
      margin-top: 4px;
    }

    .ps-employee-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 0.82rem;
      margin-bottom: 16px;
    }
    .ps-label {
      color: #64748b;
      margin-right: 6px;
    }

    .ps-matrix-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 16px;
    }
    .ps-col {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }
    .ps-col-header {
      font-size: 0.75rem;
      font-weight: 800;
      background: #f1f5f9;
      padding: 8px 12px;
      border-bottom: 1px solid #e2e8f0;
      letter-spacing: 0.04em;
    }
    .ps-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 12px;
      font-size: 0.82rem;
      border-bottom: 1px dashed #f1f5f9;
    }
    .ps-subtotal {
      background: #f8fafc;
      border-top: 2px solid #cbd5e1;
      padding: 8px 12px;
    }

    .ps-net-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      padding: 14px 20px;
      border-radius: 10px;
      margin-bottom: 24px;
    }
    .ps-net-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #94a3b8;
    }
    .ps-net-words {
      font-size: 0.82rem;
      font-style: italic;
      color: #cbd5e1;
      margin-top: 2px;
    }
    .ps-net-amount {
      font-size: 1.5rem;
      font-weight: 900;
      color: #34d399;
      text-align: right;
    }
    .ps-status-stamp {
      font-size: 0.7rem;
      font-weight: 800;
      background: rgba(255, 255, 255, 0.15);
      padding: 2px 8px;
      border-radius: 4px;
      text-align: right;
      margin-top: 4px;
    }
    .ps-status-stamp.paid {
      background: rgba(16, 185, 129, 0.25);
      color: #34d399;
    }

    .ps-signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 36px;
      padding-top: 10px;
    }
    .ps-sig-box {
      width: 170px;
      text-align: center;
    }
    .ps-sig-line {
      border-top: 1px solid #0f172a;
      margin-bottom: 6px;
    }
    .ps-sig-box span {
      font-size: 0.72rem;
      font-weight: 700;
      color: #334155;
    }

    .spin-icon {
      animation: spin 1s linear infinite;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    /* Print Only Styles */
    .only-print { display: none; }
    @media print {
      .no-print { display: none !important; }
      .only-print { display: block !important; }
      .page-container { padding: 0 !important; }
      .card { border: none !important; box-shadow: none !important; }
      .app-table-wrapper { overflow: visible !important; }

      .print-letterhead {
        border-bottom: 2px solid #0f172a;
        padding-bottom: 14px;
        margin-bottom: 20px;
      }
      .pl-header-top {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 12px;
      }
      .pl-school-name { font-size: 1.5rem; font-weight: 900; margin: 0; color: #0f172a; }
      .pl-school-addr { font-size: 0.85rem; color: #475569; margin: 2px 0 6px; }
      .pl-report-title-pill {
        display: inline-block;
        background: #0f172a;
        color: #ffffff;
        font-weight: 800;
        font-size: 0.85rem;
        padding: 3px 12px;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .pl-meta-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 6px;
        font-size: 0.8rem;
        color: #334155;
        background: #f8fafc;
        padding: 8px 12px;
        border-radius: 6px;
      }

      .print-signatures {
        display: flex;
        justify-content: space-between;
        margin-top: 60px;
        padding-top: 20px;
      }
      .sig-block {
        width: 180px;
        text-align: center;
      }
      .sig-line {
        border-top: 1px solid #0f172a;
        margin-bottom: 6px;
      }
      .sig-title {
        font-size: 0.75rem;
        font-weight: 700;
        color: #334155;
      }
    }
  `]
})
export class PayrollManagementComponent implements OnInit {
  private financeStore = inject(FinanceStoreService);
  private teacherStore = inject(TeacherStoreService);
  private auth = inject(AuthService);
  private campus = inject(CampusSessionService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  schoolName = 'Scholars International Academy';
  schoolAddress = 'Plot 14, Road 2, Block-E, Dhaka 1212, Bangladesh';
  activeCampusName = 'Main Campus';
  currentUser: User | null = null;

  activeTab: 'sheet' | 'structures' = 'sheet';
  selectedMonthYear = '';
  filterStatus = 'ALL';
  searchQuery = '';
  isProcessing = false;

  // Real Database Collections
  payrolls: EmployeePayroll[] = [];
  salaryStructures: SalaryStructure[] = [];
  summary: PayrollSummary | null = null;

  // Modal State: 1-Click Generate
  isGenerateModalOpen = false;
  generateMonth = '';
  generateBonusAmount = 0;
  generateBonusParticulars = '';

  // Modal State: Disburse
  isDisburseModalOpen = false;
  isBatchDisbursing = false;
  disbursingPayrollId = '';
  disburseMethod = 'Bank Transfer';
  disburseTxnRef = '';
  disburseRemarks = '';

  // Modal State: Edit Salary Structure
  isEditStructureModalOpen = false;
  editingStructure: SalaryStructure | null = null;

  // Modal State: Pay Slip View
  isPaySlipModalOpen = false;
  currentPaySlip: PaySlip | null = null;

  get todayDateFormatted(): string {
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date().toLocaleDateString('en-US', opts);
  }

  getFormattedMonth(monthYear: string): string {
    if (!monthYear) return 'Current Month';
    try {
      const parts = monthYear.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return monthYear;
    }
  }

  async ngOnInit() {
    this.currentUser = this.auth.getCurrentUser();
    this.activeCampusName = this.campus.branchId === 'br-02' ? 'Uttara Campus' : 'Dhanmondi Campus';

    // Default to current month e.g. 2026-11
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    this.selectedMonthYear = `${now.getFullYear()}-${mm}`;
    this.generateMonth = this.selectedMonthYear;

    await Promise.all([
      this.loadPayrollData(),
      this.loadStructuresData()
    ]);
  }

  async loadPayrollData() {
    this.isProcessing = true;
    this.cdr.markForCheck();

    try {
      const [list, sum] = await Promise.all([
        this.financeStore.loadPayrolls(this.selectedMonthYear, this.filterStatus),
        this.financeStore.getPayrollSummary(this.selectedMonthYear)
      ]);
      this.payrolls = list || [];
      this.summary = sum;
    } catch (e: any) {
      console.error('Failed to load payrolls:', e);
      this.toast.error('Data Error', 'Could not load payroll register from database.');
    } finally {
      this.isProcessing = false;
      this.cdr.markForCheck();
    }
  }

  async loadStructuresData() {
    try {
      this.salaryStructures = await this.financeStore.loadSalaryStructures();
    } catch (e) {
      console.error('Failed to load salary structures:', e);
    }
  }

  applyFilters() {
    this.loadPayrollData();
  }

  get filteredPayrolls(): EmployeePayroll[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.payrolls;
    return this.payrolls.filter(p =>
      p.employeeName.toLowerCase().includes(q) ||
      p.employeeCode.toLowerCase().includes(q) ||
      p.department.toLowerCase().includes(q) ||
      p.designation.toLowerCase().includes(q)
    );
  }

  // --- ACTIONS: GENERATE PAYROLL ---
  openGenerateModal() {
    this.generateMonth = this.selectedMonthYear;
    this.generateBonusAmount = 0;
    this.generateBonusParticulars = '';
    this.isGenerateModalOpen = true;
  }

  async confirmGeneratePayroll() {
    if (!this.generateMonth) {
      this.toast.warning('Month Required', 'Please select a payroll month.');
      return;
    }

    this.isProcessing = true;
    try {
      const results = await this.financeStore.generateMonthlyPayroll(
        this.generateMonth,
        this.generateBonusAmount,
        this.generateBonusParticulars
      );
      this.toast.success('Payroll Compiled', `Compiled salary register for ${results.length} faculty members.`);
      this.isGenerateModalOpen = false;
      this.selectedMonthYear = this.generateMonth;
      await Promise.all([
        this.loadPayrollData(),
        this.loadStructuresData()
      ]);
    } catch (e: any) {
      this.toast.error('Generation Error', e?.message || 'Could not compile payroll sheet.');
    } finally {
      this.isProcessing = false;
      this.cdr.markForCheck();
    }
  }

  // --- ACTIONS: APPROVE ---
  async approveSingle(id: string) {
    this.isProcessing = true;
    try {
      await this.financeStore.approvePayroll(id);
      this.toast.success('Approved', 'Faculty remuneration approved for disbursement.');
      await this.loadPayrollData();
    } catch (e: any) {
      this.toast.error('Approval Error', e?.message || 'Failed to approve payroll.');
    } finally {
      this.isProcessing = false;
      this.cdr.markForCheck();
    }
  }

  async batchApprove() {
    if (!confirm(`Are you sure you want to approve all draft payroll records for ${this.getFormattedMonth(this.selectedMonthYear)}?`)) {
      return;
    }

    this.isProcessing = true;
    try {
      const count = await this.financeStore.batchApprovePayrolls(this.selectedMonthYear);
      this.toast.success('Batch Approved', `Approved ${count} payroll records.`);
      await this.loadPayrollData();
    } catch (e: any) {
      this.toast.error('Approval Error', e?.message || 'Failed to batch approve.');
    } finally {
      this.isProcessing = false;
      this.cdr.markForCheck();
    }
  }

  // --- ACTIONS: DISBURSE ---
  openSingleDisburseModal(p: EmployeePayroll) {
    this.isBatchDisbursing = false;
    this.disbursingPayrollId = p.id;
    this.disburseMethod = p.paymentMethod || 'Bank Transfer';
    this.disburseTxnRef = '';
    this.disburseRemarks = `Salary disburse for ${p.employeeName} (${this.getFormattedMonth(p.salaryMonthYear)})`;
    this.isDisburseModalOpen = true;
  }

  openBatchDisburseModal() {
    this.isBatchDisbursing = true;
    this.disbursingPayrollId = '';
    this.disburseMethod = 'Bank Transfer';
    this.disburseTxnRef = '';
    this.disburseRemarks = `Corporate salary disbursement for ${this.getFormattedMonth(this.selectedMonthYear)}`;
    this.isDisburseModalOpen = true;
  }

  async confirmDisburse() {
    this.isProcessing = true;
    try {
      if (this.isBatchDisbursing) {
        const count = await this.financeStore.batchDisbursePayrolls(
          this.selectedMonthYear,
          this.disburseMethod,
          this.disburseTxnRef,
          new Date().toISOString()
        );
        this.toast.success('Salaries Disbursed', `Successfully marked ${count} payroll records as Paid.`);
      } else {
        await this.financeStore.disbursePayroll(
          this.disbursingPayrollId,
          this.disburseMethod,
          this.disburseTxnRef,
          new Date().toISOString()
        );
        this.toast.success('Salary Disbursed', 'Disbursement recorded successfully.');
      }
      this.isDisburseModalOpen = false;
      await this.loadPayrollData();
    } catch (e: any) {
      this.toast.error('Disbursement Error', e?.message || 'Failed to record disbursement.');
    } finally {
      this.isProcessing = false;
      this.cdr.markForCheck();
    }
  }

  // --- ACTIONS: SALARY STRUCTURE ---
  openEditStructureModal(s: SalaryStructure) {
    this.editingStructure = { ...s };
    this.isEditStructureModalOpen = true;
  }

  async saveStructure() {
    if (!this.editingStructure) return;

    this.isProcessing = true;
    try {
      await this.financeStore.saveSalaryStructure(this.editingStructure);
      this.toast.success('Scale Updated', `Salary structure saved for ${this.editingStructure.employeeName}.`);
      this.isEditStructureModalOpen = false;
      await this.loadStructuresData();
    } catch (e: any) {
      this.toast.error('Save Error', e?.message || 'Failed to save salary structure.');
    } finally {
      this.isProcessing = false;
      this.cdr.markForCheck();
    }
  }

  // --- ACTIONS: PAY SLIP & PRINT ---
  async openPaySlipModal(payrollId: string) {
    this.isProcessing = true;
    try {
      this.currentPaySlip = await this.financeStore.getPaySlip(payrollId);
      if (this.currentPaySlip) {
        this.isPaySlipModalOpen = true;
      } else {
        this.toast.error('Not Found', 'Could not load pay slip.');
      }
    } catch (e) {
      this.toast.error('Error', 'Failed to retrieve pay slip.');
    } finally {
      this.isProcessing = false;
      this.cdr.markForCheck();
    }
  }

  printPaySlip() {
    window.print();
  }

  printRegister() {
    window.print();
  }

  exportBankAdvisory() {
    if (this.payrolls.length === 0) {
      this.toast.warning('Empty Register', 'No payroll records to export.');
      return;
    }

    const filename = `Bank_Salary_Advisory_${this.selectedMonthYear}.csv`;
    let csv = 'SL,Employee Name,Employee Code,Designation,Department,Bank Name,Branch Name,Bank Account No,Net Salary Payable (BDT),Payment Status\n';

    this.payrolls.forEach((p, idx) => {
      csv += `"${idx + 1}","${p.employeeName}","${p.employeeCode}","${p.designation}","${p.department}","${p.bankName}","Dhanmondi Branch","${p.bankAccountNo}","${p.netPayable}","${p.paymentStatus}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toast.success('Advisory Exported', `${filename} generated and downloaded.`);
  }
}
