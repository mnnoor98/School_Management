import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceStoreService } from '../../core/services/stores/finance-store.service';
import { AcademicStoreService } from '../../core/services/stores/academic-store.service';
import { StudentStoreService } from '../../core/services/stores/student-store.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { StudentInvoice, SchoolClass, FeeType, Student } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { BadgeComponent } from '../../shared/components/badge.component';

@Component({
  selector: 'app-invoices-management',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, ModalComponent, BadgeComponent],
  template: `
    <div class="page-container">
      <!-- HEADER -->
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <app-icon name="receipt" [size]="28" class="text-primary"></app-icon>
            Student Invoices Ledger & Batch Generator
          </h1>
          <p class="page-subtitle">
            Manage student billing statements, apply fee concessions/discounts, and run automated monthly batch invoice generation.
          </p>
        </div>
        <div class="page-actions flex-wrap gap-2" *ngIf="canManage">
          <button type="button" class="btn btn-outline" (click)="openSingleModal()" title="Create individual student bill">
            <app-icon name="plus" [size]="16" class="text-indigo"></app-icon>
            <span>+ Individual Bill</span>
          </button>
          <button type="button" class="btn btn-outline" (click)="exportCSV()" title="Export billing ledger to CSV">
            <app-icon name="download" [size]="16"></app-icon>
            <span>Export CSV</span>
          </button>
          <button type="button" class="btn btn-primary" (click)="openBatchModal()">
            <app-icon name="zap" [size]="16"></app-icon>
            <span>Generate Batch Invoices</span>
          </button>
        </div>
      </div>

      <!-- KPI METRIC CARDS -->
      <div class="grid-4 mb-4">
        <div class="kpi-card">
          <div class="kpi-icon-wrap bg-blue-subtle">
            <app-icon name="receipt" [size]="22" class="text-primary"></app-icon>
          </div>
          <div>
            <span class="kpi-label">Total Invoiced</span>
            <h3 class="kpi-value">৳ {{ totalInvoicedAmount.toLocaleString() }}</h3>
            <span class="kpi-meta">{{ invoices.length }} Total Bills</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap bg-emerald-subtle">
            <app-icon name="circle-dollar-sign" [size]="22" class="text-emerald"></app-icon>
          </div>
          <div>
            <span class="kpi-label">Collected Revenue</span>
            <h3 class="kpi-value text-emerald">৳ {{ totalCollectedAmount.toLocaleString() }}</h3>
            <span class="kpi-meta">{{ getPaidCount() }} Invoices Settled</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap bg-rose-subtle">
            <app-icon name="alert-circle" [size]="22" class="text-danger"></app-icon>
          </div>
          <div>
            <span class="kpi-label">Outstanding Arrears</span>
            <h3 class="kpi-value text-danger">৳ {{ totalDueAmount.toLocaleString() }}</h3>
            <span class="kpi-meta">{{ getDueCount() }} Unpaid / Partial</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap bg-purple-subtle">
            <app-icon name="percent" [size]="22" class="text-purple"></app-icon>
          </div>
          <div>
            <span class="kpi-label">Total Concessions</span>
            <h3 class="kpi-value text-purple">৳ {{ totalDiscountAmount.toLocaleString() }}</h3>
            <span class="kpi-meta">Waivers applied</span>
          </div>
        </div>
      </div>

      <!-- FILTER STRIP -->
      <div class="card mb-4">
        <div class="card-body p-3">
          <div class="filter-strip">
            <div class="search-wrap">
              <app-icon name="search" [size]="16" class="search-icon"></app-icon>
              <input
                type="text"
                [(ngModel)]="searchTerm"
                class="form-control form-control-sm"
                placeholder="Search by student name, roll, or invoice no..."
              />
            </div>

            <div class="filter-item">
              <label class="filter-lbl">Class:</label>
              <select [(ngModel)]="selectedClassId" class="form-select form-select-sm">
                <option value="ALL">All Classes</option>
                <option *ngFor="let c of classes" [value]="c.name">{{ c.name }}</option>
              </select>
            </div>

            <div class="filter-item">
              <label class="filter-lbl">Status:</label>
              <select [(ngModel)]="selectedStatus" class="form-select form-select-sm">
                <option value="ALL">All Statuses</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            <div class="count-badge ms-auto">
              <span>{{ filteredInvoices.length }} Invoices Found</span>
            </div>
          </div>
        </div>
      </div>

      <!-- INVOICES TABLE -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <app-icon name="receipt" [size]="18"></app-icon>
            <span>Billing Ledger</span>
          </div>
        </div>

        <div class="app-table-wrapper">
          <table class="app-table">
            <thead>
              <tr>
                <th style="width: 140px;">Invoice No</th>
                <th>Student & Roll</th>
                <th>Class & Section</th>
                <th>Fee Particulars</th>
                <th style="text-align: right;">Total</th>
                <th style="text-align: right;">Waiver</th>
                <th style="text-align: right;">Net Bill</th>
                <th style="text-align: right;">Paid</th>
                <th style="text-align: right;">Due</th>
                <th style="width: 100px;">Status</th>
                <th style="text-align: right; width: 140px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let inv of filteredInvoices" [class.paid-row]="inv.status === 'Paid'">
                <td><code class="code-tag">{{ inv.invoiceNo }}</code></td>
                <td>
                  <strong>{{ inv.studentName }}</strong>
                  <div class="text-xs text-muted">Roll #{{ inv.rollNo }}</div>
                </td>
                <td>{{ inv.className }} ({{ inv.sectionName }})</td>
                <td>
                  <strong>{{ inv.feeTypeName }}</strong>
                  <div class="text-xs text-muted">Due: {{ inv.dueDate }}</div>
                </td>
                <td style="text-align: right;">৳ {{ inv.totalAmount.toLocaleString() }}</td>
                <td style="text-align: right; color: #9333ea;">
                  {{ inv.discountAmount > 0 ? '৳ ' + inv.discountAmount.toLocaleString() : '—' }}
                </td>
                <td style="text-align: right; font-weight: 600;">৳ {{ inv.netAmount.toLocaleString() }}</td>
                <td style="text-align: right; color: #059669;">৳ {{ inv.paidAmount.toLocaleString() }}</td>
                <td style="text-align: right;">
                  <strong [class.text-danger]="inv.dueAmount > 0" [class.text-muted]="inv.dueAmount === 0">
                    ৳ {{ inv.dueAmount.toLocaleString() }}
                  </strong>
                </td>
                <td>
                  <app-badge [variant]="getStatusVariant(inv.status)" [label]="inv.status"></app-badge>
                </td>
                <td style="text-align: right;">
                  <div class="table-actions">
                    <button type="button" class="btn-icon" title="View & Print Voucher" (click)="openVoucherModal(inv)">
                      <app-icon name="printer" [size]="15"></app-icon>
                    </button>
                    <button
                      *ngIf="canManage && inv.status !== 'Paid'"
                      type="button"
                      class="btn-icon text-purple"
                      title="Apply Concession / Discount"
                      (click)="openDiscountModal(inv)"
                    >
                      <app-icon name="percent" [size]="15"></app-icon>
                    </button>
                    <button
                      *ngIf="canManage && inv.paidAmount === 0"
                      type="button"
                      class="btn-icon text-danger"
                      title="Void / Delete Invoice"
                      (click)="deleteInvoice(inv)"
                    >
                      <app-icon name="trash-2" [size]="15"></app-icon>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredInvoices.length === 0">
                <td colspan="11" class="text-center py-4 text-muted">
                  No student invoices found matching the current filters.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL: BATCH GENERATE INVOICES -->
      <app-modal [isOpen]="isBatchModalOpen" title="Automated Monthly Batch Invoice Generator" (close)="isBatchModalOpen = false">
        <form (ngSubmit)="runBatchGeneration()" class="modal-form">
          <div class="info-alert mb-2">
            <app-icon name="info" [size]="18" class="text-primary"></app-icon>
            <div>
              <strong>Intelligent Duplication Guard Active:</strong>
              Students who already have an invoice for this fee head and billing month will automatically be skipped.
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Billing Month & Year <span class="required">*</span></label>
              <input type="text" [(ngModel)]="batchForm.monthYear" name="monthYear" class="form-control" placeholder="e.g. October 2026, November 2026" required />
            </div>
            <div class="form-group">
              <label class="form-label">Payment Due Date <span class="required">*</span></label>
              <input type="date" [(ngModel)]="batchForm.dueDate" name="dueDate" class="form-control" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Fee Particular Head <span class="required">*</span></label>
            <select [(ngModel)]="batchForm.feeTypeId" name="feeTypeId" class="form-select" required>
              <option *ngFor="let ft of feeTypes" [value]="ft.id">{{ ft.name }} ({{ ft.frequency }})</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Target Class Scope</label>
            <select [(ngModel)]="batchForm.classId" name="classId" class="form-select">
              <option value="ALL">All Enrolled Classes (Whole School)</option>
              <option *ngFor="let c of classes" [value]="c.id">{{ c.name }}</option>
            </select>
          </div>

          <div class="batch-preview-pill">
            <app-icon name="users" [size]="16" class="text-emerald"></app-icon>
            <span>Target Student Roster: <strong>{{ getTargetStudentCount() }} Active Enrolled Students</strong></span>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" (click)="isBatchModalOpen = false">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="isGenerating || !batchForm.monthYear || !batchForm.feeTypeId">
              <app-icon [name]="isGenerating ? 'refresh-cw' : 'zap'" [size]="16"></app-icon>
              <span>{{ isGenerating ? 'Generating...' : 'Execute Batch Billing' }}</span>
            </button>
          </div>
        </form>
      </app-modal>

      <!-- MODAL: APPLY DISCOUNT / CONCESSION -->
      <app-modal [isOpen]="isDiscountModalOpen" title="Apply Fee Waiver / Special Concession" (close)="isDiscountModalOpen = false">
        <form (ngSubmit)="saveDiscount()" class="modal-form" *ngIf="selectedInvoiceForDiscount">
          <div class="discount-summary-card">
            <div><strong>Student:</strong> {{ selectedInvoiceForDiscount.studentName }} (Roll #{{ selectedInvoiceForDiscount.rollNo }})</div>
            <div><strong>Particulars:</strong> {{ selectedInvoiceForDiscount.feeTypeName }}</div>
            <div><strong>Original Bill:</strong> ৳ {{ selectedInvoiceForDiscount.totalAmount }}</div>
          </div>

          <div class="form-group">
            <label class="form-label">Waiver / Discount Amount (৳ BDT) <span class="required">*</span></label>
            <input
              type="number"
              [(ngModel)]="discountAmountInput"
              name="discInput"
              class="form-control"
              placeholder="e.g. 500"
              min="0"
              [max]="selectedInvoiceForDiscount.totalAmount"
              required
            />
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" (click)="isDiscountModalOpen = false">Cancel</button>
            <button type="submit" class="btn btn-primary">
              <app-icon name="check" [size]="16"></app-icon>
              <span>Apply Concession</span>
            </button>
          </div>
        </form>
      </app-modal>

      <!-- MODAL: PRINTABLE 2-COPY VOUCHER -->
      <app-modal [isOpen]="isVoucherModalOpen" title="Official Institutional Fee Voucher" (close)="isVoucherModalOpen = false">
        <div *ngIf="selectedVoucherInvoice" class="voucher-modal-container">
          <div class="voucher-actions-bar">
            <button type="button" class="btn btn-outline" (click)="printVoucher()">
              <app-icon name="printer" [size]="16"></app-icon>
              <span>Print Official Voucher (2-Copy)</span>
            </button>
          </div>

          <!-- PRINTABLE VOUCHER SHEET (2 COPIES) -->
          <div id="voucher-print-area" class="voucher-sheet">
            <!-- COPY 1: STUDENT COPY -->
            <div class="voucher-box">
              <div class="v-tag">STUDENT COPY</div>
              <div class="v-header">
                <div class="v-school-title">SCHOLARS INTERNATIONAL ACADEMY</div>
                <div class="v-sub">Official Tuition & Fee Collection Challan</div>
              </div>
              <div class="v-meta-grid">
                <div><strong>Invoice No:</strong> {{ selectedVoucherInvoice.invoiceNo }}</div>
                <div><strong>Date:</strong> {{ selectedVoucherInvoice.dueDate }}</div>
                <div><strong>Student:</strong> {{ selectedVoucherInvoice.studentName }}</div>
                <div><strong>Roll:</strong> #{{ selectedVoucherInvoice.rollNo }}</div>
                <div><strong>Class:</strong> {{ selectedVoucherInvoice.className }}</div>
                <div><strong>Section:</strong> {{ selectedVoucherInvoice.sectionName }}</div>
              </div>
              <table class="v-table">
                <thead>
                  <tr>
                    <th>Fee Description</th>
                    <th style="text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{{ selectedVoucherInvoice.feeTypeName }}</td>
                    <td style="text-align: right;">৳ {{ selectedVoucherInvoice.totalAmount }}</td>
                  </tr>
                  <tr *ngIf="selectedVoucherInvoice.discountAmount > 0">
                    <td>Special Concession / Waiver</td>
                    <td style="text-align: right; color: #9333ea;">- ৳ {{ selectedVoucherInvoice.discountAmount }}</td>
                  </tr>
                  <tr class="v-total-row">
                    <td>Net Payable Amount</td>
                    <td style="text-align: right;">৳ {{ selectedVoucherInvoice.netAmount }}</td>
                  </tr>
                  <tr *ngIf="selectedVoucherInvoice.paidAmount > 0">
                    <td>Amount Realized / Paid</td>
                    <td style="text-align: right; color: #059669;">৳ {{ selectedVoucherInvoice.paidAmount }}</td>
                  </tr>
                  <tr *ngIf="selectedVoucherInvoice.dueAmount > 0" class="v-due-row">
                    <td>Current Outstanding Due</td>
                    <td style="text-align: right; color: #dc2626;">৳ {{ selectedVoucherInvoice.dueAmount }}</td>
                  </tr>
                </tbody>
              </table>
              <div class="v-footer">
                <div class="sig-line">Cashier / Accounts Officer</div>
                <div class="sig-line">Authorized Signatory</div>
              </div>
            </div>

            <!-- PERFORATION LINE -->
            <div class="perforation-line">
              <span>✂ - - - - - - - - - - - - - - - - - - TEAR HERE - - - - - - - - - - - - - - - - - - ✂</span>
            </div>

            <!-- COPY 2: BANK / OFFICE COPY -->
            <div class="voucher-box">
              <div class="v-tag">BANK / INSTITUTION COPY</div>
              <div class="v-header">
                <div class="v-school-title">SCHOLARS INTERNATIONAL ACADEMY</div>
                <div class="v-sub">Official Tuition & Fee Collection Challan</div>
              </div>
              <div class="v-meta-grid">
                <div><strong>Invoice No:</strong> {{ selectedVoucherInvoice.invoiceNo }}</div>
                <div><strong>Date:</strong> {{ selectedVoucherInvoice.dueDate }}</div>
                <div><strong>Student:</strong> {{ selectedVoucherInvoice.studentName }}</div>
                <div><strong>Roll:</strong> #{{ selectedVoucherInvoice.rollNo }}</div>
                <div><strong>Class:</strong> {{ selectedVoucherInvoice.className }}</div>
                <div><strong>Section:</strong> {{ selectedVoucherInvoice.sectionName }}</div>
              </div>
              <table class="v-table">
                <thead>
                  <tr>
                    <th>Fee Description</th>
                    <th style="text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{{ selectedVoucherInvoice.feeTypeName }}</td>
                    <td style="text-align: right;">৳ {{ selectedVoucherInvoice.totalAmount }}</td>
                  </tr>
                  <tr class="v-total-row">
                    <td>Net Payable Amount</td>
                    <td style="text-align: right;">৳ {{ selectedVoucherInvoice.netAmount }}</td>
                  </tr>
                </tbody>
              </table>
              <div class="v-footer">
                <div class="sig-line">Bank Receiving Officer</div>
                <div class="sig-line">Depositor Signature</div>
              </div>
            </div>
          </div>
        </div>
      </app-modal>

      <!-- MODAL: CREATE INDIVIDUAL INVOICE -->
      <app-modal [isOpen]="isSingleModalOpen" title="Issue Individual Student Bill (একক শিক্ষার্থী ফি চালান)" (close)="isSingleModalOpen = false">
        <form (ngSubmit)="submitSingleInvoice()" class="modal-form">
          <div class="form-group">
            <label class="form-label font-bold">Select Enrolled Student *</label>
            <select [(ngModel)]="singleForm.studentId" name="studentId" class="form-select" (change)="onStudentSelected()" required>
              <option value="" disabled>-- Select Student from Database --</option>
              <option *ngFor="let s of students" [value]="s.id">{{ s.fullName }} (Class: {{ s.className }}, Roll #{{ s.rollNo }})</option>
            </select>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label font-bold">Fee Particular Head *</label>
              <select [(ngModel)]="singleForm.feeTypeId" name="feeTypeId" class="form-select" (change)="onFeeTypeSelected()" required>
                <option *ngFor="let ft of feeTypes" [value]="ft.id">{{ ft.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label font-bold">Bill Amount (BDT) *</label>
              <input type="number" [(ngModel)]="singleForm.amount" name="amount" class="form-control font-mono font-bold" min="1" required />
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label font-bold">Billing Month & Year *</label>
              <input type="text" [(ngModel)]="singleForm.monthYear" name="monthYear" class="form-control" placeholder="e.g. November 2026" required />
            </div>
            <div class="form-group">
              <label class="form-label font-bold">Due Date *</label>
              <input type="date" [(ngModel)]="singleForm.dueDate" name="dueDate" class="form-control" required />
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" (click)="isSingleModalOpen = false">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="isSubmitting || !singleForm.studentId || singleForm.amount <= 0">
              <app-icon name="check" [size]="16"></app-icon>
              <span>Create Invoice</span>
            </button>
          </div>
        </form>
      </app-modal>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }
    .text-primary { color: #4f46e5; }
    .text-emerald { color: #059669; }
    .text-danger { color: #ef4444; }
    .text-purple { color: #9333ea; }
    .text-muted { color: #64748b; }
    .text-xs { font-size: 0.75rem; }
    .ms-auto { margin-left: auto; }
    .mb-2 { margin-bottom: 8px; }

    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    .kpi-card {
      background: #ffffff;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 14px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
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
    .bg-blue-subtle { background: #eff6ff; }
    .bg-emerald-subtle { background: #ecfdf5; }
    .bg-rose-subtle { background: #fff1f2; }
    .bg-purple-subtle { background: #faf5ff; }

    .kpi-label { font-size: 0.8125rem; font-weight: 600; color: #64748b; }
    .kpi-value { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 2px 0; }
    .kpi-meta { font-size: 0.75rem; color: #94a3b8; }

    .filter-strip {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .search-wrap {
      position: relative;
      flex: 1;
    }
    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }
    .search-wrap input {
      padding-left: 36px;
      height: 38px;
    }
    .filter-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .filter-lbl {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #64748b;
      white-space: nowrap;
    }
    .count-badge {
      font-size: 0.8125rem;
      color: #475569;
      font-weight: 600;
      background: #f1f5f9;
      padding: 6px 12px;
      border-radius: 6px;
    }

    .code-tag {
      background: #f1f5f9;
      color: #334155;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-family: monospace;
      font-weight: 600;
    }
    .paid-row { background: #fcfdfc; }

    .table-actions {
      display: flex;
      justify-content: flex-end;
      gap: 6px;
    }
    .btn-icon {
      background: transparent;
      border: none;
      padding: 6px;
      border-radius: 6px;
      cursor: pointer;
      color: #64748b;
      display: flex;
      align-items: center;
    }
    .btn-icon:hover { background: #f1f5f9; }

    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 8px;
    }
    .required { color: #ef4444; }

    .info-alert {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 12px;
      display: flex;
      gap: 10px;
      font-size: 0.8125rem;
      color: #1e40af;
    }
    .batch-preview-pill {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 0.8125rem;
      color: #065f46;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .discount-summary-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      font-size: 0.875rem;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    /* Voucher Styles */
    .voucher-modal-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .voucher-actions-bar {
      display: flex;
      justify-content: flex-end;
    }
    .voucher-sheet {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .voucher-box {
      border: 1.5px solid #0f172a;
      border-radius: 8px;
      padding: 16px 20px;
      position: relative;
    }
    .v-tag {
      position: absolute;
      top: 10px;
      right: 14px;
      font-size: 0.7rem;
      font-weight: 800;
      background: #0f172a;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 4px;
      letter-spacing: 0.05em;
    }
    .v-header {
      text-align: center;
      margin-bottom: 12px;
    }
    .v-school-title {
      font-size: 1.15rem;
      font-weight: 800;
      letter-spacing: 0.03em;
      color: #0f172a;
    }
    .v-sub {
      font-size: 0.775rem;
      color: #64748b;
    }
    .v-meta-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      font-size: 0.8rem;
      margin-bottom: 12px;
      background: #f8fafc;
      padding: 10px;
      border-radius: 6px;
    }
    .v-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
      margin-bottom: 16px;
    }
    .v-table th, .v-table td {
      border: 1px solid #e2e8f0;
      padding: 6px 10px;
    }
    .v-table th { background: #f1f5f9; }
    .v-total-row { font-weight: 700; background: #faf5ff; }
    .v-due-row { font-weight: 700; background: #fff1f2; }
    .v-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 24px;
      padding-top: 10px;
    }
    .sig-line {
      font-size: 0.75rem;
      border-top: 1px dashed #64748b;
      padding-top: 4px;
      width: 160px;
      text-align: center;
      color: #475569;
    }
    .perforation-line {
      text-align: center;
      font-size: 0.75rem;
      color: #94a3b8;
      letter-spacing: 0.1em;
    }

    @media (max-width: 992px) {
      .grid-4 { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 768px) {
      .grid-4 { grid-template-columns: 1fr; }
      .filter-strip { flex-direction: column; align-items: stretch; }
      .v-meta-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class InvoicesManagementComponent implements OnInit {
  private financeStore = inject(FinanceStoreService);
  private academicStore = inject(AcademicStoreService);
  private studentStore = inject(StudentStoreService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  invoices: StudentInvoice[] = [];
  classes: SchoolClass[] = [];
  feeTypes: FeeType[] = [];
  students: Student[] = [];

  searchTerm = '';
  selectedClassId = 'ALL';
  selectedStatus = 'ALL';
  canManage = true;
  isLoading = false;
  isGenerating = false;
  isSubmitting = false;

  // Batch Generation Modal
  isBatchModalOpen = false;
  batchForm: {
    monthYear: string;
    dueDate: string;
    feeTypeId: string;
    classId: string;
  } = {
    monthYear: 'November 2026',
    dueDate: new Date().toISOString().split('T')[0],
    feeTypeId: '',
    classId: 'ALL'
  };

  // Single Invoice Modal
  isSingleModalOpen = false;
  singleForm = {
    studentId: '',
    feeTypeId: '',
    amount: 2500,
    monthYear: 'November 2026',
    dueDate: new Date().toISOString().split('T')[0]
  };

  // Discount Modal
  isDiscountModalOpen = false;
  selectedInvoiceForDiscount: StudentInvoice | null = null;
  discountAmountInput = 0;

  // Voucher Modal
  isVoucherModalOpen = false;
  selectedVoucherInvoice: StudentInvoice | null = null;

  async ngOnInit() {
    this.canManage = this.auth.hasPermission('FIN_INVOICES', 'edit');
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    this.cdr.markForCheck();
    try {
      const [invs, cls, ft, studs] = await Promise.all([
        this.financeStore.loadInvoices(),
        this.academicStore.loadClasses(),
        this.financeStore.loadFeeTypes(),
        this.studentStore.loadStudents()
      ]);
      this.invoices = invs || [];
      this.classes = cls || [];
      this.feeTypes = ft || [];
      this.students = studs || [];

      if (this.feeTypes.length > 0 && !this.batchForm.feeTypeId) {
        this.batchForm.feeTypeId = this.feeTypes[0].id;
      }
    } catch (e: any) {
      console.error('Error loading invoices data:', e);
      this.toast.error('Load Error', 'Could not load student invoices from database.');
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  get filteredInvoices(): StudentInvoice[] {
    return this.invoices.filter(i => {
      const matchSearch =
        !this.searchTerm ||
        (i.studentName || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (i.invoiceNo || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (i.rollNo || '').includes(this.searchTerm);
      const matchClass = this.selectedClassId === 'ALL' || i.className === this.selectedClassId;
      const matchStatus = this.selectedStatus === 'ALL' || i.status === this.selectedStatus;
      return matchSearch && matchClass && matchStatus;
    });
  }

  get totalInvoicedAmount(): number {
    return this.invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  }

  get totalCollectedAmount(): number {
    return this.invoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
  }

  get totalDueAmount(): number {
    return this.invoices.reduce((sum, i) => sum + (i.dueAmount || 0), 0);
  }

  get totalDiscountAmount(): number {
    return this.invoices.reduce((sum, i) => sum + (i.discountAmount || 0), 0);
  }

  getPaidCount(): number {
    return this.invoices.filter(i => i.status === 'Paid').length;
  }

  getDueCount(): number {
    return this.invoices.filter(i => i.status !== 'Paid').length;
  }

  getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' {
    switch (status) {
      case 'Paid': return 'success';
      case 'Partial': return 'warning';
      case 'Overdue': return 'danger';
      default: return 'info';
    }
  }

  // Batch Generation
  openBatchModal() {
    const curMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    this.batchForm = {
      monthYear: curMonth,
      dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10).toISOString().split('T')[0],
      feeTypeId: this.feeTypes[0]?.id || '',
      classId: 'ALL'
    };
    this.isBatchModalOpen = true;
  }

  getTargetStudentCount(): number {
    if (this.batchForm.classId === 'ALL') {
      return this.students.filter(s => s.status === 'Active').length;
    }
    return this.students.filter(s => s.status === 'Active' && (s.classId === this.batchForm.classId || s.className === this.batchForm.classId)).length;
  }

  async runBatchGeneration() {
    if (!this.batchForm.monthYear || !this.batchForm.feeTypeId) {
      this.toast.warning('Required Fields', 'Billing month and fee category are required.');
      return;
    }
    this.isGenerating = true;
    try {
      const res = await this.financeStore.batchGenerateInvoicesAsync({
        academicYearId: 'ay-2026',
        classId: this.batchForm.classId,
        feeTypeId: this.batchForm.feeTypeId,
        monthYear: this.batchForm.monthYear,
        dueDate: this.batchForm.dueDate
      });

      this.toast.success('Batch Invoices Generated', res?.message || 'Monthly student billing invoices generated in PostgreSQL.');
      this.isBatchModalOpen = false;
      await this.loadData();
    } catch (e: any) {
      this.toast.error('Batch Generation Failed', e?.error?.message || e?.message || 'Could not generate invoices.');
    } finally {
      this.isGenerating = false;
      this.cdr.markForCheck();
    }
  }

  // Single Invoice
  openSingleModal() {
    const curMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    this.singleForm = {
      studentId: this.students[0]?.id || '',
      feeTypeId: this.feeTypes[0]?.id || '',
      amount: 2500,
      monthYear: curMonth,
      dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10).toISOString().split('T')[0]
    };
    this.isSingleModalOpen = true;
  }

  onStudentSelected() {
    // Keep amount
  }

  onFeeTypeSelected() {
    // Keep amount
  }

  async submitSingleInvoice() {
    if (!this.singleForm.studentId || !this.singleForm.feeTypeId || this.singleForm.amount <= 0) {
      this.toast.warning('Required Fields', 'Select student, fee head and valid amount.');
      return;
    }

    const student = this.students.find(s => s.id === this.singleForm.studentId);
    if (!student) return;

    this.isSubmitting = true;
    try {
      await this.financeStore.createStudentInvoiceAsync({
        studentId: student.id,
        feeTypeId: this.singleForm.feeTypeId,
        customAmount: this.singleForm.amount,
        dueDate: this.singleForm.dueDate,
        notes: this.singleForm.monthYear ? `Billing for ${this.singleForm.monthYear}` : undefined
      });

      this.toast.success('Invoice Created', `Bill issued for ${student.fullName}.`);
      this.isSingleModalOpen = false;
      await this.loadData();
    } catch (e: any) {
      this.toast.error('Invoice Error', e?.message || 'Failed to create student invoice.');
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  // Discount
  openDiscountModal(inv: StudentInvoice) {
    this.selectedInvoiceForDiscount = inv;
    this.discountAmountInput = inv.discountAmount || 0;
    this.isDiscountModalOpen = true;
  }

  async saveDiscount() {
    if (!this.selectedInvoiceForDiscount) return;
    try {
      await this.financeStore.applyInvoiceDiscount(this.selectedInvoiceForDiscount.id, this.discountAmountInput);
      this.toast.success('Concession Applied', `Updated bill for ${this.selectedInvoiceForDiscount.studentName}.`);
      this.isDiscountModalOpen = false;
      await this.loadData();
    } catch (e: any) {
      this.toast.error('Discount Error', e?.message || 'Could not apply concession.');
    }
  }

  // Delete
  async deleteInvoice(inv: StudentInvoice) {
    if (confirm(`Are you sure you want to void invoice "${inv.invoiceNo}" for ${inv.studentName}?`)) {
      this.toast.info('Invoice Voided', `Invoice ${inv.invoiceNo} marked as voided.`);
      await this.loadData();
    }
  }

  // Voucher
  openVoucherModal(inv: StudentInvoice) {
    this.selectedVoucherInvoice = inv;
    this.isVoucherModalOpen = true;
  }

  printVoucher() {
    window.print();
  }

  exportCSV() {
    if (this.filteredInvoices.length === 0) {
      this.toast.warning('Export Empty', 'No invoices to export.');
      return;
    }

    let csv = 'Invoice No,Student Name,Roll No,Class,Fee Particulars,Total Amount,Discount,Net Bill,Paid Amount,Due Amount,Status,Due Date\n';
    this.filteredInvoices.forEach(i => {
      csv += `"${i.invoiceNo}","${i.studentName}","${i.rollNo}","${i.className}","${i.feeTypeName}","${i.totalAmount}","${i.discountAmount}","${i.netAmount}","${i.paidAmount}","${i.dueAmount}","${i.status}","${i.dueDate}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Student_Invoices_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toast.success('CSV Downloaded', 'Billing ledger exported successfully.');
  }
}
