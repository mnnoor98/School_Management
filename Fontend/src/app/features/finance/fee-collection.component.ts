import { CampusImageDirective } from '../../shared/components/campus-image.directive';
import { Component, OnInit, ChangeDetectorRef, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceStoreService } from '../../core/services/stores/finance-store.service';
import { AcademicStoreService } from '../../core/services/stores/academic-store.service';
import { StudentStoreService } from '../../core/services/stores/student-store.service';
import { CampusSessionService } from '../../core/services/campus-session.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Student, StudentInvoice, FeePayment, SchoolClass, Section, FeeType } from '../../core/models';
import { ModalComponent } from '../../shared/components/modal.component';
import { IconComponent } from '../../shared/components/icon.component';

export interface SelectableInvoice extends StudentInvoice {
  selected?: boolean;
}

export interface LedgerEntry {
  date: string;
  type: 'INVOICE' | 'PAYMENT';
  refNo: string;
  particulars: string;
  debit: number;
  credit: number;
  balance: number;
}

@Component({
  selector: 'app-fee-collection',
  standalone: true,
  imports: [CampusImageDirective, CommonModule, FormsModule, ModalComponent, IconComponent],
  template: `
    <div class="page-container">
      <!-- 1. PAGE HEADER -->
      <div class="page-header no-print">
        <div class="header-left">
          <div class="header-icon-box">
            <app-icon name="circle-dollar-sign" [size]="28" class="text-emerald"></app-icon>
          </div>
          <div>
            <div class="header-badge">
              <span class="badge-dot"></span>
              {{ isGuardian || isStudent ? 'Student & Guardian Portal' : 'Financial Accounting & Cashier Desk' }}
            </div>
            <h1 class="page-title">
              {{ (isGuardian || isStudent) ? 'Online Fee Payment & Official Vouchers' : 'Institutional Fee Collection & Cashier Desk (ফি আদায় ও রশিদ প্রদান)' }}
            </h1>
            <p class="page-subtitle">
              {{ (isGuardian || isStudent) 
                ? 'View outstanding institutional fees, settle instantly online via bKash / Nagad MFS, and download official vouchers.' 
                : 'Fast student search, multi-item dues collection, instant cash change calculator, official 2-part vouchers, and daily shift reconciliation.' 
              }}
            </p>
          </div>
        </div>

        <div class="header-actions">
          <button type="button" class="btn btn-outline" (click)="exportDefaultersLedger()" *ngIf="!isGuardian && !isStudent" title="Download campus arrears aging & defaulters report">
            <app-icon name="download" [size]="16" class="text-indigo"></app-icon>
            <span>Arrears Aging Export</span>
          </button>
          <button type="button" class="btn btn-outline" (click)="openDailyClosingModal()" *ngIf="!isGuardian && !isStudent" title="Audit counter shift collections">
            <app-icon name="clipboard-check" [size]="16" class="text-emerald"></app-icon>
            <span>Daily Cash Closing</span>
          </button>
          <button type="button" class="btn btn-outline" (click)="openAddInvoiceModal()" *ngIf="!isGuardian && !isStudent && selectedStudent" title="Add upcoming month tuition or exam fee">
            <app-icon name="plus-circle" [size]="16" class="text-indigo"></app-icon>
            <span>Add Fee Invoice</span>
          </button>
          <button type="button" class="btn btn-outline" (click)="printPage()" title="Print current screen report">
            <app-icon name="printer" [size]="16"></app-icon>
            <span>Print View</span>
          </button>
        </div>
      </div>

      <!-- 2. TOP DAILY KPI HIGHLIGHTS STRIP -->
      <div class="kpi-strip mb-4 no-print" *ngIf="!isGuardian && !isStudent">
        <div class="kpi-card highlight-emerald">
          <div class="kpi-icon-wrap">
            <app-icon name="trending-up" [size]="20" class="text-emerald"></app-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">Today's Counter Collections</span>
            <div class="kpi-val text-emerald">৳ {{ getTodayCollectionTotal().toLocaleString() }}</div>
            <span class="kpi-sub">{{ getTodayPaymentCount() }} Receipts Issued Today</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap bg-green-subtle">
            <app-icon name="dollar-sign" [size]="20" class="text-emerald"></app-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">Cash In Counter</span>
            <div class="kpi-val">৳ {{ getTodayCashTotal().toLocaleString() }}</div>
            <span class="kpi-sub">Direct Handover</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap bg-pink-subtle">
            <app-icon name="credit-card" [size]="20" class="text-pink"></app-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">bKash & Nagad MFS</span>
            <div class="kpi-val text-pink">৳ {{ getTodayMfsTotal().toLocaleString() }}</div>
            <span class="kpi-sub">Digital Settlements</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap bg-blue-subtle">
            <app-icon name="layers" [size]="20" class="text-blue"></app-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">Bank Transfers</span>
            <div class="kpi-val text-blue">৳ {{ getTodayBankTotal().toLocaleString() }}</div>
            <span class="kpi-sub">Bank Deposits</span>
          </div>
        </div>

        <div class="kpi-card highlight-rose">
          <div class="kpi-icon-wrap bg-rose-subtle">
            <app-icon name="alert-circle" [size]="20" class="text-rose"></app-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">Selected Student Balance</span>
            <div class="kpi-val text-rose">৳ {{ getTotalStudentDue().toLocaleString() }}</div>
            <span class="kpi-sub">{{ getUnpaidInvoicesCount() }} Unpaid Invoices</span>
          </div>
        </div>
      </div>

      <!-- 3. ADVANCED STUDENT SEARCH & CLASS FILTER PANEL -->
      <div class="card mb-4 no-print">
        <div class="card-body">
          <div class="search-panel-grid" *ngIf="!isGuardian && !isStudent">
            <!-- Filter by Class -->
            <div class="form-group mb-0">
              <label class="form-label">
                <app-icon name="book-open" [size]="14"></app-icon>
                Filter by Class
              </label>
              <select class="form-select" [(ngModel)]="selectedClassId" (change)="onClassFilterChange()">
                <option value="ALL">All Academic Classes</option>
                <option *ngFor="let c of classes" [value]="c.id">{{ c.name }}</option>
              </select>
            </div>

            <!-- Filter by Section -->
            <div class="form-group mb-0">
              <label class="form-label">
                <app-icon name="layers" [size]="14"></app-icon>
                Class Section
              </label>
              <select class="form-select" [(ngModel)]="selectedSectionId" (change)="onSectionFilterChange()">
                <option value="ALL">All Sections</option>
                <option *ngFor="let s of filteredSections" [value]="s.id">{{ s.name }}</option>
              </select>
            </div>

            <!-- Live Student Search Box -->
            <div class="form-group mb-0 student-search-box-wrap">
              <label class="form-label">
                <app-icon name="search" [size]="14"></app-icon>
                Student Look-Up (Name, ID, Roll, Guardian Phone)
              </label>
              <div class="search-input-group">
                <input
                  type="text"
                  class="form-control"
                  placeholder="Type student name, roll #01, admission ID, or mobile..."
                  [(ngModel)]="studentSearchText"
                  (input)="onStudentSearchInput()"
                  (focus)="isSearchDropdownOpen = true"
                />
                <button type="button" class="btn-clear-search" *ngIf="studentSearchText" (click)="clearStudentSearch()">✕</button>
              </div>

              <!-- Real-time Autocomplete Dropdown List -->
              <div class="search-autocomplete-dropdown" *ngIf="isSearchDropdownOpen && matchingStudents.length > 0">
                <div
                  *ngFor="let s of matchingStudents.slice(0, 8)"
                  class="autocomplete-item"
                  [class.active-item]="s.id === selectedStudentId"
                  (click)="selectStudentFromSearch(s)"
                >
                  <img campusImage [src]="s.photoUrl" class="ac-avatar" alt="" />
                  <div class="ac-info">
                    <div class="ac-name">
                      <strong>{{ s.fullName }}</strong>
                      <span class="ac-roll">Roll #{{ s.rollNo }}</span>
                    </div>
                    <div class="ac-sub">
                      ID: {{ s.admissionNo }} • {{ s.className }} ({{ s.sectionName }}) • 📱 {{ s.guardianPhone }}
                    </div>
                  </div>
                  <div class="ac-due">
                    <span class="badge-ac-due" [class.has-due]="getStudentDueAmount(s.id) > 0">
                      ৳ {{ getStudentDueAmount(s.id).toLocaleString() }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Direct Student Dropdown Selector -->
            <div class="form-group mb-0">
              <label class="form-label">
                <app-icon name="user" [size]="14"></app-icon>
                Select Enrolled Student <span class="required">*</span>
              </label>
              <select class="form-select font-semibold" [(ngModel)]="selectedStudentId" (change)="onStudentSelect()">
                <option *ngFor="let s of filteredStudentsList" [value]="s.id">
                  {{ s.fullName }} — Roll #{{ s.rollNo }} ({{ s.className }} - {{ s.sectionName }})
                </option>
              </select>
            </div>
          </div>

          <!-- Ward Pill for Student/Guardian view -->
          <div class="ward-banner" *ngIf="isGuardian || isStudent">
            <div class="ward-badge">Enrolled Student Ward</div>
            <div class="ward-details">
              <strong>{{ selectedStudent?.fullName || 'Student' }}</strong> • Roll #{{ selectedStudent?.rollNo || '01' }} • Class: {{ selectedStudent?.className || 'Class 10' }} ({{ selectedStudent?.sectionName || 'Padma' }}) • Admission ID: {{ selectedStudent?.admissionNo }}
            </div>
          </div>

          <!-- SELECTED STUDENT DOSSIER SUMMARY CARD -->
          <div class="selected-student-dossier mt-3" *ngIf="selectedStudent">
            <div class="dossier-left">
              <img campusImage [src]="selectedStudent.photoUrl" class="dossier-avatar" (error)="onPhotoError($event)" alt="" />
              <div class="dossier-info">
                <div class="dossier-name-row">
                  <h3 class="dossier-name">{{ selectedStudent.fullName }}</h3>
                  <span class="dossier-bangla" *ngIf="selectedStudent.banglaName">({{ selectedStudent.banglaName }})</span>
                  <span class="pill-roll">Roll #{{ selectedStudent.rollNo }}</span>
                  <span class="pill-status active">{{ selectedStudent.status || 'Active' }}</span>
                </div>
                <div class="dossier-meta-grid">
                  <div><span class="text-muted">Student ID:</span> <strong>{{ selectedStudent.admissionNo }}</strong></div>
                  <div><span class="text-muted">Academic Class:</span> <strong>{{ selectedStudent.className }}</strong> ({{ selectedStudent.sectionName }})</div>
                  <div><span class="text-muted">Guardian:</span> <strong>{{ selectedStudent.guardianName }}</strong> ({{ selectedStudent.guardianRelation || 'Father' }})</div>
                  <div><span class="text-muted">Contact Phone:</span> <strong>{{ selectedStudent.guardianPhone }}</strong></div>
                </div>
              </div>
            </div>

            <div class="dossier-right">
              <div class="finance-stat-box">
                <span class="fs-label">Total Invoiced</span>
                <span class="fs-val text-muted">৳ {{ getTotalStudentInvoiced().toLocaleString() }}</span>
              </div>
              <div class="finance-stat-box">
                <span class="fs-label">Total Settled</span>
                <span class="fs-val text-emerald">৳ {{ getTotalStudentPaid().toLocaleString() }}</span>
              </div>
              <div class="finance-stat-box highlight-box">
                <span class="fs-label">Net Payable Due</span>
                <span class="fs-val text-danger">৳ {{ getTotalStudentDue().toLocaleString() }}</span>
                <span class="fs-sub" *ngIf="getTotalStudentDue() === 0">🎉 All Dues Cleared</span>
                <span class="fs-sub text-danger font-semibold" *ngIf="getTotalStudentDue() > 0">{{ getUnpaidInvoicesCount() }} Invoices Pending</span>
              </div>
            </div>

            <!-- DUES AGING MATRIX BADGE BAR -->
            <div class="dues-aging-strip mt-3" *ngIf="getTotalStudentDue() > 0" style="grid-column: 1 / -1; width: 100%;">
              <div class="aging-title">
                <app-icon name="clock" [size]="14"></app-icon>
                <span>Dues Aging Breakdown (বকেয়া মেয়াদ বিশ্লেষণ):</span>
              </div>
              <div class="aging-buckets">
                <div class="aging-bucket bucket-current" [class.has-due]="duesAging.current > 0">
                  <span class="ab-label">0-30 Days (Current)</span>
                  <span class="ab-val">৳ {{ duesAging.current.toLocaleString() }}</span>
                </div>
                <div class="aging-bucket bucket-tier1" [class.has-due]="duesAging.overdue30 > 0">
                  <span class="ab-label">31-60 Days (Tier 1)</span>
                  <span class="ab-val">৳ {{ duesAging.overdue30.toLocaleString() }}</span>
                </div>
                <div class="aging-bucket bucket-tier2" [class.has-due]="duesAging.overdue60 > 0">
                  <span class="ab-label">61-90 Days (Tier 2)</span>
                  <span class="ab-val">৳ {{ duesAging.overdue60.toLocaleString() }}</span>
                </div>
                <div class="aging-bucket bucket-critical" [class.has-due]="duesAging.critical90 > 0">
                  <span class="ab-label">90+ Days (Critical)</span>
                  <span class="ab-val">৳ {{ duesAging.critical90.toLocaleString() }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. WORKSPACE TABS STRIP -->
      <div class="workspace-tabs-card mb-4 no-print">
        <div class="tabs-nav">
          <button
            type="button"
            class="tab-btn"
            [class.active]="activeTab === 'INVOICES'"
            (click)="activeTab = 'INVOICES'"
          >
            <app-icon name="receipt" [size]="16"></app-icon>
            <span>Outstanding Invoices & Collection</span>
            <span class="tab-count" [class.badge-danger-soft]="getTotalStudentDue() > 0">{{ studentInvoices.length }}</span>
          </button>

          <button
            type="button"
            class="tab-btn"
            [class.active]="activeTab === 'HISTORY'"
            (click)="activeTab = 'HISTORY'"
          >
            <app-icon name="history" [size]="16"></app-icon>
            <span>Paid Receipts Ledger & Vouchers</span>
            <span class="tab-count">{{ studentPayments.length }}</span>
          </button>

          <button
            type="button"
            class="tab-btn"
            [class.active]="activeTab === 'LEDGER'"
            (click)="activeTab = 'LEDGER'"
          >
            <app-icon name="file-text" [size]="16"></app-icon>
            <span>Student Financial Statement (খতিয়ান)</span>
            <span class="tab-count">{{ ledgerEntries.length }}</span>
          </button>
        </div>

        <div class="tabs-actions">
          <button
            type="button"
            class="btn btn-sm btn-outline-success"
            *ngIf="activeTab === 'INVOICES' && getUnpaidInvoicesCount() > 0"
            (click)="selectAllUnpaid(true)"
          >
            <app-icon name="check-square" [size]="14"></app-icon>
            <span>Select All Due ({{ getUnpaidInvoicesCount() }})</span>
          </button>

          <button
            type="button"
            class="btn btn-sm btn-primary"
            *ngIf="activeTab === 'INVOICES' && getSelectedInvoices().length > 0"
            (click)="openBulkPaymentModal()"
          >
            <app-icon name="circle-dollar-sign" [size]="15"></app-icon>
            <span>Pay Selected ({{ getSelectedInvoices().length }} • ৳ {{ getSelectedInvoicesTotal().toLocaleString() }})</span>
          </button>

          <button
            type="button"
            class="btn btn-sm btn-outline"
            *ngIf="activeTab === 'LEDGER'"
            (click)="printStudentStatement()"
          >
            <app-icon name="printer" [size]="14"></app-icon>
            <span>Print Khotiyan Statement</span>
          </button>
        </div>
      </div>

      <!-- TAB 1: OUTSTANDING INVOICES LIST & BULK SELECTION -->
      <div class="card mb-4" *ngIf="activeTab === 'INVOICES'">
        <div class="card-header no-print">
          <div class="card-title">
            <app-icon name="receipt" [size]="18" class="text-primary"></app-icon>
            <span>Fee Billing Ledger: <strong>{{ selectedStudent?.fullName }}</strong></span>
            <span class="sub-pill">Due Balance: ৳ {{ getTotalStudentDue().toLocaleString() }}</span>
          </div>

          <div class="filter-actions-row">
            <select class="form-select form-select-sm status-filter" [(ngModel)]="invoiceStatusFilter">
              <option value="ALL">All Status ({{ studentInvoices.length }})</option>
              <option value="UNPAID">Unpaid & Partial Only ({{ getUnpaidInvoicesCount() }})</option>
              <option value="PAID">Paid Only ({{ getPaidInvoicesCount() }})</option>
            </select>
          </div>
        </div>

        <div class="app-table-wrapper">
          <table class="app-table">
            <thead>
              <tr>
                <th style="width: 45px;" class="no-print" *ngIf="!isGuardian && !isStudent">
                  <input
                    type="checkbox"
                    class="custom-chk"
                    [checked]="isAllUnpaidSelected()"
                    (change)="toggleSelectAllUnpaid($event)"
                    title="Select/Deselect All Pending Invoices"
                  />
                </th>
                <th style="width: 140px;">Invoice No</th>
                <th>Fee Head & Particulars</th>
                <th style="width: 110px;">Due Date</th>
                <th style="width: 110px;" class="text-right">Total Bill</th>
                <th style="width: 100px;" class="text-right">Discount</th>
                <th style="width: 110px;" class="text-right">Net Bill</th>
                <th style="width: 110px;" class="text-right">Paid</th>
                <th style="width: 120px;" class="text-right">Outstanding Due</th>
                <th style="width: 100px;" class="text-center">Status</th>
                <th style="width: 210px; text-align: right;" class="no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                *ngFor="let inv of filteredInvoices"
                [class.paid-row]="inv.status === 'Paid'"
                [class.selected-row]="inv.selected"
                [class.overdue-row]="isOverdue(inv)"
              >
                <!-- Checkbox -->
                <td class="no-print" *ngIf="!isGuardian && !isStudent">
                  <input
                    type="checkbox"
                    class="custom-chk"
                    [(ngModel)]="inv.selected"
                    [disabled]="inv.dueAmount <= 0"
                    (change)="onInvoiceSelectionChanged()"
                  />
                </td>

                <!-- Invoice No -->
                <td>
                  <code class="code-tag">{{ inv.invoiceNo }}</code>
                  <span class="overdue-tag" *ngIf="isOverdue(inv)">OVERDUE</span>
                </td>

                <!-- Fee Item & Term -->
                <td>
                  <div class="fee-name-bold">{{ inv.feeTypeName }}</div>
                  <div class="fee-sub-info">Class: {{ inv.className }} • Section: {{ inv.sectionName || 'A' }}</div>
                </td>

                <!-- Due Date -->
                <td>
                  <span [class.text-danger]="isOverdue(inv)" [class.font-bold]="isOverdue(inv)">
                    {{ inv.dueDate }}
                  </span>
                </td>

                <!-- Bill Breakdown -->
                <td class="text-right font-mono">৳ {{ inv.totalAmount.toLocaleString() }}</td>
                <td class="text-right font-mono text-muted">
                  {{ inv.discountAmount > 0 ? '- ৳ ' + inv.discountAmount.toLocaleString() : '—' }}
                </td>
                <td class="text-right font-mono font-semibold">৳ {{ inv.netAmount.toLocaleString() }}</td>
                <td class="text-right font-mono text-emerald">৳ {{ inv.paidAmount.toLocaleString() }}</td>

                <!-- Outstanding Due -->
                <td class="text-right font-mono">
                  <strong [class.text-danger]="inv.dueAmount > 0" [class.text-emerald]="inv.dueAmount === 0">
                    ৳ {{ inv.dueAmount.toLocaleString() }}
                  </strong>
                </td>

                <!-- Status Badge -->
                <td class="text-center">
                  <span
                    class="status-pill"
                    [class.pill-paid]="inv.status === 'Paid'"
                    [class.pill-partial]="inv.status === 'Partial'"
                    [class.pill-unpaid]="inv.status === 'Unpaid'"
                  >
                    {{ inv.status }}
                  </span>
                </td>

                <!-- Actions -->
                <td style="text-align: right;" class="no-print">
                  <div class="action-buttons-group">
                    <button
                      type="button"
                      class="btn btn-xs btn-outline-pink flex items-center gap-1"
                      [disabled]="inv.dueAmount <= 0"
                      (click)="openOnlinePaymentModal(inv)"
                      title="Pay instantly via bKash / Nagad MFS Gateway"
                    >
                      <app-icon name="credit-card" [size]="13"></app-icon>
                      <span>bKash/Nagad</span>
                    </button>

                    <button
                      type="button"
                      class="btn btn-xs btn-primary flex items-center gap-1"
                      [disabled]="inv.dueAmount <= 0"
                      (click)="openPaymentModal(inv)"
                      title="Collect payment at accounts counter"
                    >
                      <app-icon name="circle-dollar-sign" [size]="13"></app-icon>
                      <span>{{ (isGuardian || isStudent) ? 'Pay at Counter' : 'Collect' }}</span>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Empty State -->
              <tr *ngIf="filteredInvoices.length === 0">
                <td colspan="11" class="text-center py-5 text-muted">
                  <app-icon name="check-circle" [size]="36" class="mb-2 text-emerald"></app-icon>
                  <div class="empty-title">No Invoices Found</div>
                  <p class="empty-sub">
                    There are no {{ invoiceStatusFilter !== 'ALL' ? invoiceStatusFilter.toLowerCase() : '' }} invoices for {{ selectedStudent?.fullName }}.
                  </p>
                  <button type="button" class="btn btn-sm btn-outline mt-2" (click)="openAddInvoiceModal()">
                    <app-icon name="plus" [size]="14"></app-icon>
                    <span>Issue Fee Invoice</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- FLOATING BULK COLLECTION DOCK -->
        <div class="bulk-collection-dock no-print" *ngIf="getSelectedInvoices().length > 0">
          <div class="dock-summary">
            <div class="dock-circle-icon">
              <app-icon name="layers" [size]="20" class="text-emerald"></app-icon>
            </div>
            <div>
              <div class="dock-title">
                <strong>{{ getSelectedInvoices().length }}</strong> Invoices Selected for Payment
              </div>
              <div class="dock-subtitle">
                Total Payable Amount: <strong class="text-emerald text-base font-mono">৳ {{ getSelectedInvoicesTotal().toLocaleString() }} BDT</strong>
              </div>
            </div>
          </div>

          <div class="dock-actions">
            <button type="button" class="btn btn-outline" (click)="selectAllUnpaid(false)">Deselect</button>
            <button type="button" class="btn btn-success font-bold" (click)="openBulkPaymentModal()">
              <app-icon name="check" [size]="16"></app-icon>
              <span>Collect Selected (৳ {{ getSelectedInvoicesTotal().toLocaleString() }})</span>
            </button>
          </div>
        </div>
      </div>

      <!-- TAB 2: PAID RECEIPTS LEDGER & ARCHIVE -->
      <div class="card mb-4" *ngIf="activeTab === 'HISTORY'">
        <div class="card-header no-print">
          <div class="card-title">
            <app-icon name="history" [size]="18" class="text-indigo"></app-icon>
            <span>Official Money Receipts Archive: <strong>{{ selectedStudent?.fullName }}</strong></span>
            <span class="sub-pill">{{ studentPayments.length }} Receipts Issued</span>
          </div>
          <div class="filter-actions-row">
            <button type="button" class="btn btn-sm btn-outline" (click)="loadPayments()">
              <app-icon name="refresh-cw" [size]="13"></app-icon>
              <span>Refresh Ledger</span>
            </button>
          </div>
        </div>

        <div class="app-table-wrapper">
          <table class="app-table">
            <thead>
              <tr>
                <th style="width: 150px;">Receipt No</th>
                <th style="width: 110px;">Payment Date</th>
                <th>Student Dossier</th>
                <th>Particulars / Invoice Ref</th>
                <th style="width: 140px;">Payment Channel</th>
                <th style="width: 130px;" class="text-right">Amount Paid</th>
                <th style="width: 130px;">Cashier / Officer</th>
                <th style="width: 140px; text-align: right;" class="no-print">Receipt Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let pmt of studentPayments">
                <td>
                  <code class="code-receipt font-mono font-bold">{{ pmt.receiptNo }}</code>
                </td>
                <td>{{ pmt.paymentDate }}</td>
                <td>
                  <div class="font-semibold">{{ pmt.studentName }}</div>
                  <div class="text-xs text-muted">Roll #{{ pmt.rollNo }} • {{ pmt.className }}</div>
                </td>
                <td>
                  <span class="font-medium text-slate-800">{{ pmt.notes || 'Institutional Fee Settlement' }}</span>
                </td>
                <td>
                  <span
                    class="channel-pill"
                    [class.channel-cash]="pmt.paymentMethod === 'Cash'"
                    [class.channel-bkash]="pmt.paymentMethod === 'bKash'"
                    [class.channel-nagad]="pmt.paymentMethod === 'Nagad'"
                    [class.channel-bank]="pmt.paymentMethod === 'Bank Transfer'"
                  >
                    {{ pmt.paymentMethod }}
                  </span>
                  <div class="trx-sub font-mono" *ngIf="pmt.transactionRef">Ref: {{ pmt.transactionRef }}</div>
                </td>
                <td class="text-right font-mono font-bold text-emerald">
                  ৳ {{ pmt.amountPaid.toLocaleString() }}
                </td>
                <td>
                  <span class="text-xs text-slate-700 font-medium">{{ pmt.collectedBy || 'Accounts Desk' }}</span>
                </td>
                <td style="text-align: right;" class="no-print">
                  <button
                    type="button"
                    class="btn btn-xs btn-outline flex items-center gap-1"
                    (click)="reprintReceipt(pmt)"
                    title="View and print official institutional voucher"
                  >
                    <app-icon name="printer" [size]="13"></app-icon>
                    <span>Reprint Receipt</span>
                  </button>
                </td>
              </tr>

              <tr *ngIf="studentPayments.length === 0">
                <td colspan="8" class="text-center py-5 text-muted">
                  <app-icon name="file-text" [size]="36" class="mb-2 text-slate-400"></app-icon>
                  <div class="empty-title">No Historical Payments Recorded</div>
                  <p class="empty-sub">Once fees are collected at the counter or settled via MFS, official money receipts appear here.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 3: STUDENT FINANCIAL STATEMENT & KHOTIYAN -->
      <div class="card mb-4" *ngIf="activeTab === 'LEDGER'">
        <div class="card-header no-print">
          <div class="card-title">
            <app-icon name="file-text" [size]="18" class="text-emerald"></app-icon>
            <span>Student Accounts Khotiyan Statement: <strong>{{ selectedStudent?.fullName }}</strong></span>
            <span class="sub-pill">Audit Trail</span>
          </div>
          <button type="button" class="btn btn-sm btn-primary flex items-center gap-1" (click)="printStudentStatement()">
            <app-icon name="printer" [size]="14"></app-icon>
            <span>Print Khotiyan</span>
          </button>
        </div>

        <div class="khotiyan-statement-sheet printable-area">
          <div class="statement-header">
            <h2>{{ school.name }}</h2>
            <p>{{ school.address }} • Accounts & Finance Division</p>
            <div class="statement-title-tag">STUDENT FINANCIAL KHOTIYAN & LEDGER STATEMENT</div>
          </div>

          <div class="statement-meta-grid">
            <div><strong>Student Name:</strong> {{ selectedStudent?.fullName }}</div>
            <div><strong>Student ID:</strong> {{ selectedStudent?.admissionNo }}</div>
            <div><strong>Class & Section:</strong> {{ selectedStudent?.className }} ({{ selectedStudent?.sectionName }})</div>
            <div><strong>Class Roll:</strong> #{{ selectedStudent?.rollNo }}</div>
            <div><strong>Guardian Name:</strong> {{ selectedStudent?.guardianName }}</div>
            <div><strong>Contact:</strong> {{ selectedStudent?.guardianPhone }}</div>
            <div><strong>Statement Date:</strong> {{ todayDate }}</div>
            <div><strong>Session:</strong> 2026 - 2027</div>
          </div>

          <div class="app-table-wrapper mt-3">
            <table class="app-table table-bordered">
              <thead>
                <tr>
                  <th style="width: 100px;">Date</th>
                  <th style="width: 140px;">Voucher / Ref</th>
                  <th>Particulars & Fee Description</th>
                  <th style="width: 120px;" class="text-right">Debit (Billed)</th>
                  <th style="width: 120px;" class="text-right">Credit (Paid)</th>
                  <th style="width: 130px;" class="text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of ledgerEntries">
                  <td>{{ item.date }}</td>
                  <td><code class="font-mono text-xs">{{ item.refNo }}</code></td>
                  <td>{{ item.particulars }}</td>
                  <td class="text-right font-mono">{{ item.debit > 0 ? '৳ ' + item.debit.toLocaleString() : '—' }}</td>
                  <td class="text-right font-mono text-emerald">{{ item.credit > 0 ? '৳ ' + item.credit.toLocaleString() : '—' }}</td>
                  <td class="text-right font-mono font-bold" [class.text-danger]="item.balance > 0" [class.text-emerald]="item.balance <= 0">
                    ৳ {{ item.balance.toLocaleString() }}
                  </td>
                </tr>
                <tr *ngIf="ledgerEntries.length === 0">
                  <td colspan="6" class="text-center py-4 text-muted">No financial debit/credit activity on record.</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="ledger-footer-row">
                  <td colspan="3" class="text-right font-bold">TOTALS:</td>
                  <td class="text-right font-mono font-bold">৳ {{ getTotalStudentInvoiced().toLocaleString() }}</td>
                  <td class="text-right font-mono font-bold text-emerald">৳ {{ getTotalStudentPaid().toLocaleString() }}</td>
                  <td class="text-right font-mono font-bold text-danger">৳ {{ getTotalStudentDue().toLocaleString() }} DUE</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div class="statement-signatures only-print">
            <div class="sig-box">
              <div class="sig-line"></div>
              <span>Student / Guardian</span>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <span>Cashier / Accounts Officer</span>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <span>Head of Accounts</span>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <span>Principal / Head of Institution</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- COUNTER PAYMENT COLLECTION MODAL (SINGLE OR MULTI-INVOICE) -->
    <app-modal
      [(isOpen)]="isPaymentModalOpen"
      title="Fee Collection Transaction & Receipt"
      subtitle="Accept counter cash or digital payments with instant change calculator and official receipt generation."
      [maxWidth]="620"
    >
      <div *ngIf="paymentTargetInvoices.length > 0">
        <!-- Invoice Summary Strip -->
        <div class="invoice-summary-banner mb-3">
          <div class="is-row">
            <span>Student:</span> <strong>{{ selectedStudent?.fullName }} (Roll #{{ selectedStudent?.rollNo }} — {{ selectedStudent?.className }})</strong>
          </div>
          <div class="is-row">
            <span>Paying Items:</span> <strong>{{ paymentTargetInvoices.length }} Fee Item(s)</strong>
          </div>
          <div class="is-items-list mt-1">
            <span class="item-tag" *ngFor="let inv of paymentTargetInvoices">
              {{ inv.feeTypeName }}: <strong>৳ {{ inv.dueAmount }}</strong>
            </span>
          </div>
          <div class="is-row mt-2 pt-2 border-top">
            <span>Gross Payable:</span> <strong class="text-danger text-base">৳ {{ basePaymentDue }} BDT</strong>
          </div>
        </div>

        <form (ngSubmit)="processPayment()">
          <!-- Discount / Waiver & Fine adjustments -->
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div class="form-group mb-0">
              <label class="form-label text-xs">Special Waiver / Scholarship (৳)</label>
              <input
                type="number"
                min="0"
                [max]="basePaymentDue"
                class="form-control form-control-sm"
                [(ngModel)]="paymentDiscount"
                name="paymentDiscount"
                (input)="recalculateNetPayment()"
                placeholder="0"
              />
              <span class="field-hint">Approved fee waiver</span>
            </div>

            <div class="form-group mb-0">
              <label class="form-label text-xs">Late Submission Fine (৳)</label>
              <input
                type="number"
                min="0"
                class="form-control form-control-sm"
                [(ngModel)]="paymentLateFine"
                name="paymentLateFine"
                (input)="recalculateNetPayment()"
                placeholder="0"
              />
              <span class="field-hint">Added to total</span>
            </div>
          </div>

          <!-- Payment Amount & Net Payable -->
          <div class="payment-amount-box mb-3">
            <div class="pab-left">
              <label class="form-label mb-1">Net Collection Amount (৳) <span class="required">*</span></label>
              <input
                type="number"
                class="form-control font-bold font-mono text-lg text-emerald"
                [(ngModel)]="paymentAmount"
                name="paymentAmount"
                [max]="basePaymentDue + paymentLateFine - paymentDiscount"
                min="1"
                required
              />
            </div>
            <div class="pab-right">
              <div class="amount-words-text">{{ numberToWords(paymentAmount) }}</div>
            </div>
          </div>

          <!-- Payment Method -->
          <div class="form-group mb-3">
            <label class="form-label">Payment Channel / Method <span class="required">*</span></label>
            <div class="method-selector-grid">
              <label class="method-radio-box" [class.active]="paymentMethod === 'Cash'">
                <input type="radio" [(ngModel)]="paymentMethod" name="paymentMethod" value="Cash" />
                <span class="method-title">💵 Cash (Counter)</span>
              </label>

              <label class="method-radio-box" [class.active]="paymentMethod === 'bKash'">
                <input type="radio" [(ngModel)]="paymentMethod" name="paymentMethod" value="bKash" />
                <span class="method-title">📱 bKash Merchant</span>
              </label>

              <label class="method-radio-box" [class.active]="paymentMethod === 'Nagad'">
                <input type="radio" [(ngModel)]="paymentMethod" name="paymentMethod" value="Nagad" />
                <span class="method-title">🔶 Nagad MFS</span>
              </label>

              <label class="method-radio-box" [class.active]="paymentMethod === 'Bank Transfer'">
                <input type="radio" [(ngModel)]="paymentMethod" name="paymentMethod" value="Bank Transfer" />
                <span class="method-title">🏛️ Bank Transfer</span>
              </label>
            </div>
          </div>

          <!-- Cash Handover: Tendered & Change Calculator -->
          <div class="cash-calculator-panel mb-3" *ngIf="paymentMethod === 'Cash'">
            <div class="form-group mb-0">
              <label class="form-label-xs">Tendered Cash Given by Payee (৳)</label>
              <input
                type="number"
                class="form-control font-mono font-bold"
                [(ngModel)]="tenderedCash"
                name="tenderedCash"
                (input)="calculateChange()"
                placeholder="e.g. 5000"
              />
            </div>

            <div class="change-return-box" *ngIf="tenderedCash > 0">
              <span class="cr-label">Change to Return to Parent:</span>
              <strong class="cr-val font-mono" [class.text-danger]="tenderedCash < paymentAmount">
                ৳ {{ changeToReturn.toLocaleString() }} BDT
              </strong>
            </div>
          </div>

          <!-- Transaction Reference for Non-Cash -->
          <div class="form-group mb-3" *ngIf="paymentMethod !== 'Cash'">
            <label class="form-label">Transaction Reference / TrxID / Deposit Slip <span class="required">*</span></label>
            <input
              type="text"
              class="form-control font-mono"
              [(ngModel)]="transactionRef"
              name="transactionRef"
              placeholder="e.g. 8X93N19 or Slip #40192"
              required
            />
          </div>

          <!-- Accounts Remarks -->
          <div class="form-group mb-3">
            <label class="form-label">Accounts Officer Remarks</label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="paymentNotes"
              name="paymentNotes"
              placeholder="e.g. Received at Main Accounts Counter Desk 1"
            />
          </div>

          <div class="flex justify-end gap-2 mt-4 pt-3 border-top">
            <button type="button" class="btn btn-outline" (click)="isPaymentModalOpen = false">Cancel</button>
            <button
              type="submit"
              class="btn btn-success font-bold"
              [disabled]="!paymentAmount || paymentAmount <= 0"
            >
              <app-icon name="check-circle" [size]="16"></app-icon>
              <span>Confirm & Issue Money Receipt (৳ {{ paymentAmount.toLocaleString() }})</span>
            </button>
          </div>
        </form>
      </div>
    </app-modal>

    <!-- ONLINE PAYMENT GATEWAY (bKash / Nagad) MODAL -->
    <app-modal
      [(isOpen)]="isOnlineModalOpen"
      title="Secure Digital Fee Payment Gateway"
      subtitle="Instant settlement with automated SMS receipt confirmation"
      [maxWidth]="520"
    >
      <div *ngIf="onlineInvoice">
        <!-- STEP 1: INITIALIZE SESSION -->
        <div *ngIf="onlineStep === 'INITIATE'">
          <div class="invoice-summary-banner mb-3">
            <div class="is-row">
              <span>Student:</span> <strong>{{ selectedStudent?.fullName }}</strong>
            </div>
            <div class="is-row">
              <span>Invoice:</span> <code class="code-tag">{{ onlineInvoice.invoiceNo }}</code>
            </div>
            <div class="is-row">
              <span>Fee Details:</span> <strong>{{ onlineInvoice.feeTypeName }}</strong>
            </div>
            <div class="is-row">
              <span>Payable Amount:</span> <strong class="text-danger">৳ {{ onlineInvoice.dueAmount }} BDT</strong>
            </div>
          </div>

          <label class="form-label">Select Digital Payment Channel:</label>
          <div class="gateway-selector mb-3">
            <button
              type="button"
              class="gateway-btn"
              [class.active-bkash]="onlineGateway === 'bKash'"
              (click)="onlineGateway = 'bKash'"
            >
              <div class="gw-badge gw-bkash">bKash</div>
              <span>Merchant Pay</span>
            </button>
            <button
              type="button"
              class="gateway-btn"
              [class.active-nagad]="onlineGateway === 'Nagad'"
              (click)="onlineGateway = 'Nagad'"
            >
              <div class="gw-badge gw-nagad">Nagad</div>
              <span>Digital MFS</span>
            </button>
          </div>

          <div class="form-group mb-3">
            <label class="form-label">Registered Guardian / Payer Mobile Number <span class="required">*</span></label>
            <input
              type="text"
              class="form-control font-mono font-bold"
              [(ngModel)]="customerPhone"
              name="customerPhone"
              placeholder="017XXXXXXXX"
            />
            <small class="text-muted">SMS notification & digital money receipt will be sent to this number.</small>
          </div>

          <div class="flex justify-end gap-2 mt-4">
            <button type="button" class="btn btn-outline" (click)="isOnlineModalOpen = false">Cancel</button>
            <button
              type="button"
              class="btn btn-primary"
              [disabled]="isProcessingOnline || !customerPhone"
              (click)="startOnlineSession()"
            >
              <span *ngIf="isProcessingOnline">Initializing Gateway...</span>
              <span *ngIf="!isProcessingOnline">Proceed to Payment Gateway</span>
            </button>
          </div>
        </div>

        <!-- STEP 2: GATEWAY CHECKOUT SIMULATION -->
        <div *ngIf="onlineStep === 'CHECKOUT_PIN'">
          <div class="mfs-box" [class.mfs-bkash]="onlineGateway === 'bKash'" [class.mfs-nagad]="onlineGateway === 'Nagad'">
            <h3 class="mfs-title">{{ onlineGateway }} Payment Checkout</h3>
            <p class="mfs-subtitle">Merchant: {{ school.name }}</p>
            <div class="mfs-amount">৳ {{ onlineInvoice.dueAmount }} BDT</div>
          </div>

          <div class="mfs-form-panel">
            <div class="session-info">
              <span>Gateway Session ID:</span>
              <code class="session-code">{{ onlineSession?.transactionId || 'TXN-INIT-902' }}</code>
            </div>

            <div class="form-group mb-2">
              <label class="form-label">Simulation Verification OTP (Enter 1234)</label>
              <input
                type="text"
                class="form-control text-center font-mono letter-spacing-lg"
                [(ngModel)]="simulatedOtp"
                maxlength="6"
                placeholder="1234"
              />
            </div>

            <div class="form-group mb-2">
              <label class="form-label">Secure MFS PIN (Simulated)</label>
              <input
                type="password"
                class="form-control text-center font-mono"
                [(ngModel)]="simulatedPin"
                maxlength="5"
                placeholder="•••••"
              />
            </div>

            <div class="security-note">
              <app-icon name="lock" [size]="14"></app-icon>
              <span>256-bit TLS Encrypted Transaction Session</span>
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-4">
            <button type="button" class="btn btn-outline" (click)="onlineStep = 'INITIATE'">Back</button>
            <button
              type="button"
              class="btn btn-success"
              [disabled]="isProcessingOnline"
              (click)="confirmOnlinePayment()"
            >
              <span *ngIf="isProcessingOnline">Authorizing & Sending SMS...</span>
              <span *ngIf="!isProcessingOnline">Confirm & Pay ৳ {{ onlineInvoice.dueAmount }}</span>
            </button>
          </div>
        </div>
      </div>
    </app-modal>

    <!-- 2-PART OFFICIAL INSTITUTIONAL MONEY RECEIPT MODAL -->
    <app-modal
      [(isOpen)]="isReceiptOpen"
      title="Official Institutional Fee Money Receipt (মানি রসিদ)"
      subtitle="Authorized Accounts Voucher with Dual Copy Print Layout"
      [maxWidth]="820"
      [showFooter]="false"
    >
      <div *ngIf="latestPayment" class="receipt-modal-container">
        <!-- Receipt Top Controls -->
        <div class="receipt-top-actions no-print mb-3">
          <div class="copy-mode-pills">
            <button
              type="button"
              class="pill-btn"
              [class.active]="receiptLayoutMode === 'DUAL'"
              (click)="receiptLayoutMode = 'DUAL'"
            >
              📄 2-Part (Student & Accounts Copy)
            </button>
            <button
              type="button"
              class="pill-btn"
              [class.active]="receiptLayoutMode === 'SINGLE'"
              (click)="receiptLayoutMode = 'SINGLE'"
            >
              📑 Single Copy
            </button>
          </div>

          <div class="flex gap-2">
            <button type="button" class="btn btn-sm btn-outline-pink" (click)="sendSmsReceipt()">
              <app-icon name="message-square" [size]="14"></app-icon>
              <span>Send SMS Receipt</span>
            </button>
            <button type="button" class="btn btn-sm btn-primary" (click)="printReceipt()">
              <app-icon name="printer" [size]="14"></app-icon>
              <span>Print Official Receipt</span>
            </button>
          </div>
        </div>

        <!-- PRINTABLE RECEIPT BODY -->
        <div class="receipt-duo-wrapper printable-area" [class.layout-dual]="receiptLayoutMode === 'DUAL'">
          <!-- COPY 1: STUDENT / PARENT COPY -->
          <div class="receipt-single-copy">
            <div class="receipt-copy-watermark">STUDENT COPY</div>

            <!-- Letterhead -->
            <div class="receipt-header-box">
              <div class="rh-logo-box">
                <app-icon name="graduation-cap" [size]="32" class="text-indigo"></app-icon>
              </div>
              <div class="rh-text">
                <h2>{{ school.name }}</h2>
                <p class="rh-address">{{ school.address }} • Dhaka, Bangladesh</p>
                <div class="rh-tag-line">
                  <span>EIIN: 108422</span> • <span>Reg: 4920/2012</span> • <span>Phone: +880 1711-000000</span>
                </div>
              </div>
              <div class="rh-badge-box">
                <div class="voucher-title">MONEY RECEIPT</div>
                <div class="voucher-sub">ফি আদায় রসিদ</div>
              </div>
            </div>

            <!-- Receipt Meta Bar -->
            <div class="receipt-meta-strip">
              <div><span class="rm-lbl">Receipt No:</span> <strong class="font-mono text-emerald">{{ latestPayment.receiptNo }}</strong></div>
              <div><span class="rm-lbl">Payment Date:</span> <strong>{{ formatReceiptDate(latestPayment.paymentDate) }}</strong></div>
              <div><span class="rm-lbl">Payment Channel:</span> <strong>{{ latestPayment.paymentMethod }}</strong></div>
              <div><span class="rm-lbl">Trx Ref:</span> <code class="font-mono">{{ latestPayment.transactionRef || 'CASH-COUNTER' }}</code></div>
            </div>

            <!-- Student Profile Grid -->
            <div class="receipt-student-grid">
              <div><span class="rs-lbl">Student Name:</span> <strong>{{ latestPayment.studentName }}</strong></div>
              <div><span class="rs-lbl">Admission ID:</span> <span class="font-mono">{{ selectedStudent?.admissionNo || 'ADM-2026-7500' }}</span></div>
              <div><span class="rs-lbl">Class & Section:</span> <strong>{{ latestPayment.className }} ({{ selectedStudent?.sectionName || 'Padma' }})</strong></div>
              <div><span class="rs-lbl">Class Roll:</span> <strong class="font-mono">#{{ latestPayment.rollNo }}</strong></div>
              <div><span class="rs-lbl">Guardian Name:</span> <span>{{ selectedStudent?.guardianName || 'Guardian' }}</span></div>
              <div><span class="rs-lbl">Mobile Phone:</span> <span class="font-mono">{{ selectedStudent?.guardianPhone || '017XXXXXXXX' }}</span></div>
            </div>

            <!-- Items Table -->
            <table class="receipt-items-table">
              <thead>
                <tr>
                  <th style="width: 40px;">SL</th>
                  <th>Particulars / Fee Head</th>
                  <th style="width: 120px;" class="text-right">Amount (BDT)</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of paymentTargetInvoices; let idx = index">
                  <td>{{ idx + 1 }}</td>
                  <td><strong>{{ item.feeTypeName }}</strong></td>
                  <td class="text-right font-mono">৳ {{ item.dueAmount.toLocaleString() }}</td>
                </tr>
                <tr *ngIf="paymentTargetInvoices.length === 0">
                  <td>1</td>
                  <td><strong>{{ formatFeeParticulars(latestPayment.notes) }}</strong></td>
                  <td class="text-right font-mono">৳ {{ latestPayment.amountPaid.toLocaleString() }}</td>
                </tr>
              </tbody>
            </table>

            <!-- Summary Total & Words -->
            <div class="receipt-amount-block">
              <div class="words-line">
                <span class="words-lbl">In Words:</span>
                <strong class="words-text">{{ numberToWords(latestPayment.amountPaid) }}</strong>
              </div>
              <div class="total-figure-box">
                <span class="tf-label">Total Received:</span>
                <strong class="tf-amount font-mono">৳ {{ latestPayment.amountPaid.toLocaleString() }} BDT</strong>
              </div>
            </div>

            <!-- Signatures Strip -->
            <div class="receipt-signatures-row">
              <div class="sig-item">
                <div class="sig-line"></div>
                <span>Depositor / Payee</span>
              </div>
              <div class="sig-item text-center">
                <div class="verified-stamp">✓ VERIFIED & PAID</div>
              </div>
              <div class="sig-item text-right">
                <div class="sig-line ml-auto"></div>
                <span>Authorized Accounts Officer</span>
              </div>
            </div>
          </div>

          <!-- DUAL DIVIDER (CUT HERE) -->
          <div class="receipt-scissors-divider" *ngIf="receiptLayoutMode === 'DUAL'">
            <span class="scissors-icon">✂</span>
            <span class="cut-text">TEAR OFF HERE — ACCOUNTS & OFFICE ARCHIVE COPY</span>
          </div>

          <!-- COPY 2: OFFICE / ACCOUNTS COPY -->
          <div class="receipt-single-copy copy-office" *ngIf="receiptLayoutMode === 'DUAL'">
            <div class="receipt-copy-watermark">ACCOUNTS COPY</div>

            <!-- Letterhead -->
            <div class="receipt-header-box">
              <div class="rh-logo-box">
                <app-icon name="graduation-cap" [size]="32" class="text-indigo"></app-icon>
              </div>
              <div class="rh-text">
                <h2>{{ school.name }}</h2>
                <p class="rh-address">{{ school.address }} • Accounts Division</p>
                <div class="rh-tag-line">
                  <span>EIIN: 108422</span> • <span>Reg: 4920/2012</span>
                </div>
              </div>
              <div class="rh-badge-box">
                <div class="voucher-title">OFFICE RECEIPT</div>
                <div class="voucher-sub">অফিস রেকর্ড</div>
              </div>
            </div>

            <!-- Meta Bar -->
            <div class="receipt-meta-strip">
              <div><span class="rm-lbl">Receipt No:</span> <strong class="font-mono">{{ latestPayment.receiptNo }}</strong></div>
              <div><span class="rm-lbl">Date:</span> <strong>{{ formatReceiptDate(latestPayment.paymentDate) }}</strong></div>
              <div><span class="rm-lbl">Channel:</span> <strong>{{ latestPayment.paymentMethod }}</strong></div>
              <div><span class="rm-lbl">Officer:</span> <strong>{{ latestPayment.collectedBy }}</strong></div>
            </div>

            <!-- Student Profile -->
            <div class="receipt-student-grid">
              <div><span class="rs-lbl">Student:</span> <strong>{{ latestPayment.studentName }}</strong></div>
              <div><span class="rs-lbl">Roll No:</span> <strong>#{{ latestPayment.rollNo }}</strong></div>
              <div><span class="rs-lbl">Class:</span> <strong>{{ latestPayment.className }}</strong></div>
              <div><span class="rs-lbl">ID:</span> <span class="font-mono">{{ selectedStudent?.admissionNo }}</span></div>
            </div>

            <!-- Items Table -->
            <table class="receipt-items-table">
              <thead>
                <tr>
                  <th style="width: 40px;">SL</th>
                  <th>Fee Particulars</th>
                  <th style="width: 120px;" class="text-right">Amount (BDT)</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of paymentTargetInvoices; let idx = index">
                  <td>{{ idx + 1 }}</td>
                  <td>{{ item.feeTypeName }}</td>
                  <td class="text-right font-mono">৳ {{ item.dueAmount.toLocaleString() }}</td>
                </tr>
                <tr *ngIf="paymentTargetInvoices.length === 0">
                  <td>1</td>
                  <td>{{ formatFeeParticulars(latestPayment.notes) }}</td>
                  <td class="text-right font-mono">৳ {{ latestPayment.amountPaid.toLocaleString() }}</td>
                </tr>
              </tbody>
            </table>

            <!-- Summary Total -->
            <div class="receipt-amount-block">
              <div class="words-line">
                <span class="words-lbl">Words:</span>
                <span class="words-text">{{ numberToWords(latestPayment.amountPaid) }}</span>
              </div>
              <div class="total-figure-box">
                <span class="tf-label">Total:</span>
                <strong class="tf-amount font-mono">৳ {{ latestPayment.amountPaid.toLocaleString() }}</strong>
              </div>
            </div>

            <!-- Signatures -->
            <div class="receipt-signatures-row">
              <div class="sig-item">
                <div class="sig-line"></div>
                <span>Depositor Signature</span>
              </div>
              <div class="sig-item text-right">
                <div class="sig-line ml-auto"></div>
                <span>Cashier Desk Signature</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </app-modal>

    <!-- DAILY CLOSING RECONCILIATION MODAL -->
    <app-modal
      [(isOpen)]="isDailyClosingModalOpen"
      title="Daily Cashier Closing & Shift Reconciliation (দৈনিক ক্যাশ ক্লোজিং)"
      subtitle="Shift audit report for counter cash, bKash, Nagad, and bank transactions."
      [maxWidth]="800"
    >
      <div class="closing-modal-body">
        <div class="closing-filter-bar mb-3">
          <div class="flex items-center gap-2">
            <label class="text-sm font-semibold">Audit Date:</label>
            <input
              type="date"
              class="form-control form-control-sm"
              [(ngModel)]="closingDate"
              (change)="refreshDailyClosing()"
            />
          </div>
          <button type="button" class="btn btn-sm btn-outline flex items-center gap-1" (click)="refreshDailyClosing()">
            <app-icon name="refresh-cw" [size]="13"></app-icon>
            <span>Refresh Audit</span>
          </button>
        </div>

        <!-- KPI SUMMARY CARDS -->
        <div class="kpi-grid-5" *ngIf="closingData">
          <div class="kpi-card highlight-emerald">
            <div class="kpi-label">Total Collections</div>
            <div class="kpi-val text-emerald">৳ {{ (closingData.totalCollected || 0).toLocaleString() }}</div>
            <div class="kpi-sub">{{ closingData.totalTransactions || 0 }} Receipts Issued</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Cash Counter</div>
            <div class="kpi-val">৳ {{ (closingData.cashTotal || 0).toLocaleString() }}</div>
            <div class="kpi-sub">Cash in Hand</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">bKash Merchant</div>
            <div class="kpi-val text-pink">৳ {{ (closingData.bkashTotal || 0).toLocaleString() }}</div>
            <div class="kpi-sub">MFS Wallet</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Nagad MFS</div>
            <div class="kpi-val text-orange">৳ {{ (closingData.nagadTotal || 0).toLocaleString() }}</div>
            <div class="kpi-sub">MFS Wallet</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Bank Settlement</div>
            <div class="kpi-val text-blue">৳ {{ (closingData.bankTotal || 0).toLocaleString() }}</div>
            <div class="kpi-sub">Deposit Slips</div>
          </div>
        </div>

        <div *ngIf="!closingData && isLoadingClosing" class="text-center py-4 text-muted">
          Loading shift reconciliation report...
        </div>

        <!-- BREAKDOWN TABLES -->
        <div class="grid grid-cols-2 gap-4 mt-3" *ngIf="closingData">
          <!-- BY FEE CATEGORY -->
          <div class="audit-section">
            <h4 class="section-title">Breakdown by Fee Category</h4>
            <table class="table-compact">
              <thead>
                <tr>
                  <th>Fee Type</th>
                  <th class="text-center">Receipts</th>
                  <th class="text-right">Total (৳)</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of closingData.byFeeType">
                  <td><strong>{{ item.feeTypeName }}</strong></td>
                  <td class="text-center">{{ item.count }}</td>
                  <td class="text-right font-mono">৳ {{ item.totalAmount.toLocaleString() }}</td>
                </tr>
                <tr *ngIf="!closingData.byFeeType || closingData.byFeeType.length === 0">
                  <td colspan="3" class="text-center text-muted py-2">No transactions recorded for this date.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- BY CASHIER -->
          <div class="audit-section">
            <h4 class="section-title">Counter Desk / Cashier Audit</h4>
            <table class="table-compact">
              <thead>
                <tr>
                  <th>Cashier</th>
                  <th class="text-center">Txns</th>
                  <th class="text-right">Collected (৳)</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of closingData.byCashier">
                  <td><strong>{{ c.cashierName }}</strong></td>
                  <td class="text-center">{{ c.transactionsCount }}</td>
                  <td class="text-right font-mono">৳ {{ c.totalCollected.toLocaleString() }}</td>
                </tr>
                <tr *ngIf="!closingData.byCashier || closingData.byCashier.length === 0">
                  <td colspan="3" class="text-center text-muted py-2">No cashier entries found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="flex justify-between items-center mt-4 pt-3 border-top" footer>
        <span class="text-xs text-muted">Institutional campus shift audit certified.</span>
        <div class="flex gap-2">
          <button type="button" class="btn btn-outline" (click)="isDailyClosingModalOpen = false">Close</button>
          <button type="button" class="btn btn-primary flex items-center gap-1" (click)="printPage()">
            <app-icon name="printer" [size]="15"></app-icon>
            <span>Print Closing Statement</span>
          </button>
        </div>
      </div>
    </app-modal>

    <!-- 5. ADD FEE INVOICE MODAL -->
    <app-modal
      [(isOpen)]="isAddInvoiceModalOpen"
      title="Issue Institutional Fee Invoice (ফি ইনভয়েস তৈরি)"
      subtitle="Generate a real student fee invoice in the institutional PostgreSQL ledger."
      [maxWidth]="560"
    >
      <div class="add-invoice-body" *ngIf="selectedStudent">
        <div class="student-mini-card mb-3 p-3 bg-slate-50 border rounded-lg flex items-center gap-3">
          <img [src]="selectedStudent.photoUrl || 'assets/default-avatar.png'" (error)="onPhotoError($event)" class="w-12 h-12 rounded-full object-cover border" />
          <div>
            <div class="font-bold text-slate-800">{{ selectedStudent.fullName }}</div>
            <div class="text-xs text-slate-500">
              Admission: <span class="font-mono">{{ selectedStudent.admissionNo }}</span> | Roll #{{ selectedStudent.rollNo }} | {{ selectedStudent.className }}
            </div>
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label font-semibold">Fee Category <span class="text-danger">*</span></label>
          <select class="form-control" [(ngModel)]="newInvoiceFeeTypeId" (change)="onNewInvoiceFeeTypeChange()">
            <option value="" disabled>Select fee category...</option>
            <option *ngFor="let ft of availableFeeTypes" [value]="ft.id">
              {{ ft.name }} (Default: ৳ {{ (ft.defaultAmount || 0).toLocaleString() }})
            </option>
          </select>
        </div>

        <div class="form-group mb-3">
          <label class="form-label font-semibold">Invoice Amount (৳) <span class="text-danger">*</span></label>
          <input type="number" class="form-control" [(ngModel)]="newInvoiceAmount" min="1" placeholder="Enter fee amount" />
        </div>

        <div class="form-group mb-3">
          <label class="form-label font-semibold">Payment Due Date <span class="text-danger">*</span></label>
          <input type="date" class="form-control" [(ngModel)]="newInvoiceDueDate" />
        </div>

        <div class="form-group mb-4">
          <label class="form-label font-semibold">Particulars / Notes</label>
          <input type="text" class="form-control" [(ngModel)]="newInvoiceNotes" placeholder="e.g. Monthly Tuition Fee (November 2026)" />
        </div>
      </div>

      <div class="modal-actions flex justify-end gap-2 pt-2 border-t" footer>
        <button type="button" class="btn btn-outline" (click)="isAddInvoiceModalOpen = false" [disabled]="isSubmittingInvoice">Cancel</button>
        <button type="button" class="btn btn-primary flex items-center gap-1" (click)="submitNewInvoice()" [disabled]="isSubmittingInvoice || !newInvoiceFeeTypeId || newInvoiceAmount <= 0">
          <app-icon name="check-circle" [size]="16" *ngIf="!isSubmittingInvoice"></app-icon>
          <span *ngIf="!isSubmittingInvoice">Generate Invoice</span>
          <span *ngIf="isSubmittingInvoice">Saving to Database...</span>
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .page-container {
      padding: 24px 32px;
      max-width: 1540px;
      margin: 0 auto;
    }

    /* Page Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      gap: 20px;
      flex-wrap: wrap;
    }
    .header-left {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }
    .header-icon-box {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
    }
    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #ecfdf5;
      color: #047857;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 20px;
      margin-bottom: 6px;
      letter-spacing: 0.03em;
    }
    .badge-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
    }
    .page-title {
      font-size: 1.55rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 6px 0;
      letter-spacing: -0.02em;
    }
    .page-subtitle {
      font-size: 0.9rem;
      color: #64748b;
      margin: 0;
      max-width: 820px;
      line-height: 1.45;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    /* KPI Strip */
    .kpi-strip {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 14px;
    }
    @media (max-width: 1200px) {
      .kpi-strip { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 768px) {
      .kpi-strip { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 480px) {
      .kpi-strip { grid-template-columns: 1fr; }
    }
    .kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
      transition: all 0.2s;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    }
    .kpi-card.highlight-emerald {
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
      border-color: #a7f3d0;
    }
    .kpi-card.highlight-rose {
      background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%);
      border-color: #fecdd3;
    }
    .kpi-icon-wrap {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .bg-green-subtle { background: #dcfce7; }
    .bg-pink-subtle { background: #fce7f3; }
    .bg-blue-subtle { background: #dbeafe; }
    .bg-rose-subtle { background: #ffe4e6; }
    .kpi-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
    }
    .kpi-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .kpi-val {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.01em;
    }
    .kpi-sub {
      font-size: 0.72rem;
      color: #64748b;
    }

    /* Cards */
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      overflow: visible;
    }
    .card-body {
      padding: 18px 20px;
    }
    .card-header {
      padding: 14px 20px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      background: #fafbfc;
      border-top-left-radius: 14px;
      border-top-right-radius: 14px;
    }
    .card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
    }
    .sub-pill {
      font-size: 0.75rem;
      background: #fee2e2;
      color: #dc2626;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      margin-left: 6px;
    }

    /* Search Panel Grid */
    .search-panel-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1.8fr 1.6fr;
      gap: 16px;
      align-items: flex-end;
    }
    @media (max-width: 1024px) {
      .search-panel-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 640px) {
      .search-panel-grid { grid-template-columns: 1fr; }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.78rem;
      font-weight: 700;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .form-label-xs {
      font-size: 0.74rem;
      font-weight: 700;
      color: #475569;
    }
    .required { color: #ef4444; }

    .form-control, .form-select {
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.88rem;
      color: #1e293b;
      background: #ffffff;
      outline: none;
      transition: all 0.15s ease;
    }
    .form-control:focus, .form-select:focus {
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
    }
    .form-control-sm, .form-select-sm {
      padding: 6px 10px;
      font-size: 0.8rem;
    }

    /* Student Search Group & Autocomplete */
    .student-search-box-wrap {
      position: relative;
    }
    .search-input-group {
      position: relative;
      display: flex;
      align-items: center;
    }
    .btn-clear-search {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 0.85rem;
    }
    .search-autocomplete-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      z-index: 50;
      max-height: 320px;
      overflow-y: auto;
      margin-top: 4px;
    }
    .autocomplete-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;
      transition: background 0.12s;
    }
    .autocomplete-item:hover, .autocomplete-item.active-item {
      background: #f0fdf4;
    }
    .ac-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      object-fit: cover;
      border: 1px solid #cbd5e1;
    }
    .ac-info {
      flex: 1;
      overflow: hidden;
    }
    .ac-name {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: #0f172a;
    }
    .ac-roll {
      background: #e2e8f0;
      color: #334155;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 4px;
    }
    .ac-sub {
      font-size: 0.74rem;
      color: #64748b;
      margin-top: 2px;
    }
    .badge-ac-due {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      background: #f1f5f9;
      color: #64748b;
    }
    .badge-ac-due.has-due {
      background: #fee2e2;
      color: #dc2626;
    }

    /* Selected Student Dossier Card */
    .selected-student-dossier {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      flex-wrap: wrap;
    }
    .dossier-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .dossier-avatar {
      width: 64px;
      height: 64px;
      border-radius: 14px;
      object-fit: cover;
      border: 2px solid #ffffff;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
    }
    .dossier-name-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 6px;
    }
    .dossier-name {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .dossier-bangla {
      font-size: 0.85rem;
      color: #64748b;
    }
    .pill-roll {
      background: #0f172a;
      color: #ffffff;
      font-family: ui-monospace, monospace;
      font-weight: 700;
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 6px;
    }
    .pill-status.active {
      background: #dcfce7;
      color: #166534;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
    }
    .dossier-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, auto);
      gap: 6px 24px;
      font-size: 0.8rem;
      color: #334155;
    }
    .dossier-right {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }
    .finance-stat-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 16px;
      text-align: center;
      min-width: 110px;
    }
    .finance-stat-box.highlight-box {
      background: #fff1f2;
      border-color: #fecdd3;
    }
    .fs-label {
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      display: block;
    }
    .fs-val {
      font-size: 1.15rem;
      font-weight: 800;
      display: block;
      margin: 2px 0;
    }
    .fs-sub {
      font-size: 0.68rem;
      color: #059669;
      display: block;
    }

    /* Workspace Tabs Card */
    .workspace-tabs-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 8px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    }
    .tabs-nav {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-radius: 8px;
      background: transparent;
      border: none;
      font-size: 0.82rem;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s;
    }
    .tab-btn:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .tab-btn.active {
      background: #10b981;
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
    }
    .tab-count {
      font-size: 0.72rem;
      padding: 1px 6px;
      border-radius: 10px;
      background: #e2e8f0;
      color: #0f172a;
    }
    .tab-btn.active .tab-count {
      background: #ffffff;
      color: #10b981;
    }
    .badge-danger-soft {
      background: #fee2e2;
      color: #b91c1c;
    }
    .tabs-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Table Styles */
    .app-table-wrapper {
      overflow-x: auto;
    }
    .app-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    .app-table th {
      background: #f8fafc;
      padding: 10px 14px;
      border-bottom: 1px solid #e2e8f0;
      color: #475569;
      font-weight: 700;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .app-table td {
      padding: 12px 14px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }
    .app-table tr:hover {
      background: #fafbfc;
    }
    .paid-row {
      background: #fafafa;
      opacity: 0.85;
    }
    .selected-row {
      background: #f0fdf4 !important;
    }
    .overdue-row {
      border-left: 3px solid #ef4444;
    }
    .code-tag {
      background: #f1f5f9;
      color: #0f172a;
      font-family: ui-monospace, monospace;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.78rem;
    }
    .overdue-tag {
      background: #fee2e2;
      color: #dc2626;
      font-size: 0.65rem;
      font-weight: 800;
      padding: 1px 4px;
      border-radius: 4px;
      margin-left: 4px;
    }
    .fee-name-bold {
      font-weight: 700;
      color: #0f172a;
    }
    .fee-sub-info {
      font-size: 0.72rem;
      color: #64748b;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 700;
    }
    .pill-paid { background: #dcfce7; color: #15803d; }
    .pill-partial { background: #fef3c7; color: #b45309; }
    .pill-unpaid { background: #fee2e2; color: #b91c1c; }
    .action-buttons-group {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 0.84rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      border: 1px solid transparent;
    }
    .btn-sm { padding: 6px 12px; font-size: 0.8rem; }
    .btn-xs { padding: 4px 8px; font-size: 0.75rem; border-radius: 6px; }
    .btn-primary { background: #10b981; color: #ffffff; }
    .btn-primary:hover { background: #059669; }
    .btn-success { background: #15803d; color: #ffffff; }
    .btn-success:hover { background: #166534; }
    .btn-outline { background: #ffffff; border-color: #cbd5e1; color: #334155; }
    .btn-outline:hover { background: #f8fafc; border-color: #94a3b8; }
    .btn-outline-success { background: #f0fdf4; border-color: #86efac; color: #166534; }
    .btn-outline-success:hover { background: #dcfce7; }
    .btn-outline-pink { background: #fdf2f8; border-color: #fbcfe8; color: #be185d; }
    .btn-outline-pink:hover { background: #fce7f3; }

    /* Floating Bulk Collection Dock */
    .bulk-collection-dock {
      position: sticky;
      bottom: 20px;
      z-index: 40;
      background: #0f172a;
      color: #ffffff;
      border-radius: 12px;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
      margin: 16px;
    }
    .dock-summary {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .dock-circle-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .dock-title { font-size: 0.9rem; }
    .dock-subtitle { font-size: 0.8rem; color: #94a3b8; margin-top: 2px; }
    .dock-actions { display: flex; align-items: center; gap: 8px; }

    /* Receipts Archive Tab */
    .code-receipt {
      background: #eff6ff;
      color: #1d4ed8;
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid #bfdbfe;
    }
    .channel-pill {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .channel-cash { background: #dcfce7; color: #166534; }
    .channel-bkash { background: #fce7f3; color: #be185d; }
    .channel-nagad { background: #ffedd5; color: #c2410c; }
    .channel-bank { background: #e0e7ff; color: #3730a3; }
    .trx-sub { font-size: 0.7rem; color: #64748b; margin-top: 2px; }

    /* Payment Modal Styles */
    .invoice-summary-banner {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 16px;
      font-size: 0.84rem;
    }
    .is-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2px 0;
    }
    .is-items-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }
    .item-tag {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
    }
    .payment-amount-box {
      background: #f0fdf4;
      border: 1px solid #a7f3d0;
      border-radius: 10px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .pab-left { flex: 1; }
    .amount-words-text {
      font-size: 0.8rem;
      font-weight: 700;
      color: #047857;
      text-align: right;
      line-height: 1.35;
    }
    .method-selector-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }
    @media (max-width: 600px) {
      .method-selector-grid { grid-template-columns: repeat(2, 1fr); }
    }
    .method-radio-box {
      border: 1px solid #cbd5e1;
      background: #ffffff;
      border-radius: 8px;
      padding: 10px 8px;
      text-align: center;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 0.78rem;
      font-weight: 700;
      transition: all 0.15s;
    }
    .method-radio-box.active {
      border-color: #10b981;
      background: #ecfdf5;
      color: #047857;
    }
    .method-radio-box input { display: none; }

    /* Cash Handover Calculator */
    .cash-calculator-panel {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 10px;
      padding: 12px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .change-return-box {
      text-align: right;
    }
    .cr-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: #92400e;
      display: block;
    }
    .cr-val {
      font-size: 1.25rem;
      color: #059669;
    }

    /* Online Modal (MFS) */
    .gateway-selector {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .gateway-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 14px;
      border-radius: 10px;
      border: 2px solid #e2e8f0;
      background: #ffffff;
      cursor: pointer;
      transition: all 0.15s;
    }
    .gateway-btn.active-bkash { border-color: #e2136e; background: #fdf2f8; }
    .gateway-btn.active-nagad { border-color: #ea580c; background: #fff7ed; }
    .gw-badge {
      font-weight: 800;
      font-size: 0.85rem;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .gw-bkash { background: #e2136e; color: white; }
    .gw-nagad { background: #f7941d; color: white; }
    .mfs-box {
      border-radius: 10px;
      padding: 16px;
      color: white;
      text-align: center;
      margin-bottom: 16px;
    }
    .mfs-bkash { background: linear-gradient(135deg, #d12053, #b81643); }
    .mfs-nagad { background: linear-gradient(135deg, #f97316, #ea580c); }
    .mfs-title { font-size: 1.15rem; font-weight: 800; margin: 0; }
    .mfs-subtitle { font-size: 0.75rem; opacity: 0.9; margin: 2px 0 8px 0; }
    .mfs-amount { font-size: 1.5rem; font-weight: 800; }
    .mfs-form-panel {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
    }
    .session-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    .session-code { background: #e2e8f0; padding: 2px 6px; border-radius: 4px; }
    .security-note {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 8px;
    }

    /* 2-Part Official Money Receipt */
    .receipt-top-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .copy-mode-pills {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .pill-btn {
      padding: 5px 10px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      font-size: 0.76rem;
      font-weight: 600;
      cursor: pointer;
    }
    .pill-btn.active {
      background: #0f172a;
      color: #ffffff;
      border-color: #0f172a;
    }
    .receipt-duo-wrapper {
      background: #ffffff;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .receipt-single-copy {
      position: relative;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    .receipt-copy-watermark {
      position: absolute;
      top: 14px;
      right: 18px;
      font-size: 0.72rem;
      font-weight: 800;
      color: #94a3b8;
      border: 1px solid #cbd5e1;
      padding: 2px 8px;
      border-radius: 4px;
      letter-spacing: 0.05em;
    }
    .receipt-header-box {
      display: flex;
      align-items: center;
      gap: 14px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .rh-logo-box {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .rh-text {
      flex: 1;
    }
    .rh-text h2 {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .rh-address {
      font-size: 0.75rem;
      color: #475569;
      margin: 2px 0;
    }
    .rh-tag-line {
      font-size: 0.7rem;
      color: #64748b;
      font-weight: 600;
    }
    .rh-badge-box {
      text-align: right;
    }
    .voucher-title {
      font-size: 0.95rem;
      font-weight: 900;
      letter-spacing: 0.05em;
      color: #0f172a;
    }
    .voucher-sub {
      font-size: 0.72rem;
      color: #64748b;
    }
    .receipt-meta-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 0.75rem;
      margin-bottom: 10px;
    }
    .rm-lbl { color: #64748b; margin-right: 4px; }
    .receipt-student-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px 14px;
      font-size: 0.78rem;
      padding: 8px 0;
      border-bottom: 1px solid #f1f5f9;
      margin-bottom: 10px;
    }
    .rs-lbl { color: #64748b; margin-right: 4px; }
    .receipt-items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;
      margin-bottom: 12px;
    }
    .receipt-items-table th {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      color: #0f172a;
      font-weight: 700;
    }
    .receipt-items-table td {
      border: 1px solid #e2e8f0;
      padding: 6px 10px;
    }
    .receipt-amount-block {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 10px 14px;
      border-radius: 6px;
      margin-bottom: 24px;
      gap: 16px;
    }
    .words-lbl { font-size: 0.72rem; color: #047857; margin-right: 6px; }
    .words-text { font-size: 0.78rem; color: #065f46; font-weight: 700; }
    .total-figure-box { text-align: right; }
    .tf-label { font-size: 0.72rem; color: #047857; display: block; }
    .tf-amount { font-size: 1.15rem; color: #047857; }
    .receipt-signatures-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 0.72rem;
      color: #475569;
      font-weight: 600;
      margin-top: 20px;
    }
    .sig-line {
      width: 130px;
      border-top: 1px dashed #64748b;
      margin-bottom: 4px;
    }
    .verified-stamp {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 800;
      color: #059669;
      border: 2px solid #059669;
      padding: 2px 10px;
      border-radius: 4px;
      letter-spacing: 0.05em;
      transform: rotate(-3deg);
    }
    .receipt-scissors-divider {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #94a3b8;
      font-size: 0.72rem;
      font-weight: 700;
      margin: 4px 0;
    }
    .scissors-icon { font-size: 1rem; }
    .cut-text {
      flex: 1;
      border-bottom: 1px dashed #cbd5e1;
      line-height: 0.1em;
      text-align: center;
    }

    /* Student Financial Khotiyan Sheet */
    .khotiyan-statement-sheet {
      background: #ffffff;
      padding: 20px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
    }
    .statement-header {
      text-align: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .statement-header h2 { font-size: 1.35rem; font-weight: 800; margin: 0; color: #0f172a; }
    .statement-header p { font-size: 0.78rem; color: #64748b; margin: 2px 0 6px 0; }
    .statement-title-tag {
      display: inline-block;
      font-size: 0.8rem;
      font-weight: 800;
      background: #0f172a;
      color: #ffffff;
      padding: 3px 12px;
      border-radius: 4px;
      letter-spacing: 0.05em;
    }
    .statement-meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      font-size: 0.78rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 10px 14px;
      border-radius: 6px;
      margin-bottom: 14px;
    }
    .table-bordered th, .table-bordered td {
      border: 1px solid #cbd5e1;
    }
    .ledger-footer-row td {
      background: #f8fafc;
      font-size: 0.82rem;
    }
    .statement-signatures {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-top: 60px;
      text-align: center;
    }
    .sig-box span { font-size: 0.74rem; font-weight: 700; color: #334155; }

    /* Daily Closing Audit */
    .closing-filter-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .kpi-grid-5 {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    @media (max-width: 900px) {
      .kpi-grid-5 { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 600px) {
      .kpi-grid-5 { grid-template-columns: 1fr; }
    }
    .audit-section {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
    }
    .section-title {
      font-size: 0.8125rem;
      font-weight: 700;
      color: #334155;
      margin: 0 0 8px 0;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 6px;
    }
    .table-compact {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.775rem;
    }
    .table-compact th {
      background: #f8fafc;
      padding: 6px 8px;
      border-bottom: 1px solid #e2e8f0;
      color: #64748b;
    }
    .table-compact td {
      padding: 6px 8px;
      border-bottom: 1px solid #f1f5f9;
    }

    /* Print Styles */
    .only-print { display: none; }
    @media print {
      @page {
        size: A4 portrait;
        margin: 4mm 8mm;
      }

      .no-print,
      .receipt-top-actions,
      .page-header,
      .kpi-strip,
      .tabs-header-row,
      .selected-student-dossier,
      .empty-selection-state {
        display: none !important;
      }

      body.printing-receipt .page-container,
      .printing-receipt .page-container {
        display: none !important;
      }

      .page-container {
        padding: 0 !important;
        margin: 0 !important;
        max-width: 100% !important;
      }

      .card {
        border: none !important;
        box-shadow: none !important;
      }

      ::ng-deep body.printing-receipt app-modal .modal-backdrop,
      ::ng-deep app-modal:has(.receipt-duo-wrapper) .modal-backdrop {
        position: static !important;
        background: transparent !important;
        backdrop-filter: none !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        height: auto !important;
        display: block !important;
        overflow: visible !important;
        z-index: auto !important;
      }

      ::ng-deep body.printing-receipt app-modal .modal-container,
      ::ng-deep app-modal:has(.receipt-duo-wrapper) .modal-container {
        position: static !important;
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
        border: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        background: transparent !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      ::ng-deep body.printing-receipt app-modal .modal-header,
      ::ng-deep body.printing-receipt app-modal .modal-footer,
      ::ng-deep body.printing-receipt app-modal .btn-close,
      ::ng-deep app-modal:has(.receipt-duo-wrapper) .modal-header,
      ::ng-deep app-modal:has(.receipt-duo-wrapper) .modal-footer,
      ::ng-deep app-modal:has(.receipt-duo-wrapper) .btn-close {
        display: none !important;
      }

      ::ng-deep body.printing-receipt app-modal .modal-body,
      ::ng-deep app-modal:has(.receipt-duo-wrapper) .modal-body {
        padding: 0 !important;
        margin: 0 !important;
        overflow: visible !important;
        max-height: none !important;
        height: auto !important;
      }

      .receipt-modal-container {
        padding: 0 !important;
        margin: 0 !important;
        overflow: visible !important;
        max-height: none !important;
      }

      .receipt-duo-wrapper {
        display: flex !important;
        flex-direction: column !important;
        gap: 4px !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      .receipt-single-copy {
        background: #ffffff !important;
        border: 1.5px solid #0f172a !important;
        border-radius: 6px !important;
        padding: 6px 12px !important;
        box-shadow: none !important;
        margin: 0 !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        position: relative !important;
      }

      .receipt-copy-watermark {
        top: 6px !important;
        right: 10px !important;
        font-size: 0.62rem !important;
        padding: 1px 5px !important;
        border: 1px solid #475569 !important;
        color: #334155 !important;
      }

      .receipt-header-box {
        gap: 8px !important;
        padding-bottom: 3px !important;
        margin-bottom: 3px !important;
        border-bottom: 1.5px solid #0f172a !important;
      }

      .rh-logo-box {
        width: 26px !important;
        height: 26px !important;
        border-radius: 4px !important;
      }

      .rh-text h2 {
        font-size: 0.95rem !important;
        line-height: 1.1 !important;
        margin: 0 !important;
        font-weight: 800 !important;
      }

      .rh-address {
        font-size: 0.62rem !important;
        margin: 1px 0 !important;
      }

      .rh-tag-line {
        font-size: 0.58rem !important;
      }

      .voucher-title {
        font-size: 0.78rem !important;
        font-weight: 800 !important;
      }

      .voucher-sub {
        font-size: 0.60rem !important;
      }

      .receipt-meta-strip {
        display: grid !important;
        grid-template-columns: repeat(4, 1fr) !important;
        gap: 4px !important;
        padding: 2px 6px !important;
        margin-bottom: 3px !important;
        font-size: 0.65rem !important;
        border: 1px solid #cbd5e1 !important;
        background: #f8fafc !important;
        border-radius: 4px !important;
      }

      .receipt-student-grid {
        display: grid !important;
        grid-template-columns: repeat(3, 1fr) !important;
        gap: 1px 8px !important;
        padding: 2px 0 !important;
        margin-bottom: 3px !important;
        font-size: 0.65rem !important;
        border-bottom: 1px solid #e2e8f0 !important;
      }

      .receipt-items-table {
        margin-bottom: 3px !important;
        font-size: 0.68rem !important;
      }

      .receipt-items-table th {
        padding: 2px 6px !important;
        background: #f1f5f9 !important;
        border: 1px solid #cbd5e1 !important;
      }

      .receipt-items-table td {
        padding: 2px 6px !important;
        border: 1px solid #cbd5e1 !important;
      }

      .receipt-amount-block {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        padding: 2px 6px !important;
        margin-bottom: 4px !important;
        background: #f8fafc !important;
        border: 1px solid #cbd5e1 !important;
        border-radius: 4px !important;
        gap: 8px !important;
      }

      .words-lbl { font-size: 0.60rem !important; }
      .words-text { font-size: 0.62rem !important; }
      .tf-label { font-size: 0.58rem !important; }
      .tf-amount { font-size: 0.88rem !important; color: #047857 !important; }

      .receipt-signatures-row {
        display: flex !important;
        justify-content: space-between !important;
        align-items: flex-end !important;
        margin-top: 4px !important;
        font-size: 0.60rem !important;
      }

      .sig-line {
        width: 80px !important;
        border-top: 1px dashed #64748b !important;
        margin-bottom: 1px !important;
      }

      .verified-stamp {
        font-size: 0.58rem !important;
        padding: 1px 5px !important;
        border: 1.5px solid #059669 !important;
        border-radius: 3px !important;
      }

      .receipt-scissors-divider {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 4px !important;
        margin: 2px 0 !important;
        font-size: 0.58rem !important;
        color: #64748b !important;
      }

      .scissors-icon { font-size: 0.75rem !important; }

      .cut-text {
        border-bottom: 1px dashed #94a3b8 !important;
      }
    }

    /* Dues Aging Strip */
    .dues-aging-strip {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
    }
    .aging-title {
      font-size: 0.78rem;
      font-weight: 600;
      color: #475569;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
    }
    .aging-buckets {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }
    .aging-bucket {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 10px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      transition: all 0.15s ease;
    }
    .ab-label {
      font-size: 0.7rem;
      color: #64748b;
      font-weight: 500;
    }
    .ab-val {
      font-size: 0.88rem;
      font-weight: 700;
      color: #334155;
    }
    .aging-bucket.bucket-current.has-due {
      border-color: #3b82f6;
      background: #eff6ff;
    }
    .aging-bucket.bucket-current.has-due .ab-val { color: #1d4ed8; }

    .aging-bucket.bucket-tier1.has-due {
      border-color: #f59e0b;
      background: #fffbeb;
    }
    .aging-bucket.bucket-tier1.has-due .ab-val { color: #b45309; }

    .aging-bucket.bucket-tier2.has-due {
      border-color: #ea580c;
      background: #fff7ed;
    }
    .aging-bucket.bucket-tier2.has-due .ab-val { color: #c2410c; }

    .aging-bucket.bucket-critical.has-due {
      border-color: #ef4444;
      background: #fef2f2;
    }
    .aging-bucket.bucket-critical.has-due .ab-val { color: #b91c1c; }

    /* Helpers */
    .text-emerald { color: #059669; }
    .text-danger { color: #dc2626; }
    .text-pink { color: #db2777; }
    .text-orange { color: #ea580c; }
    .text-blue { color: #2563eb; }
    .text-indigo { color: #4f46e5; }
    .text-rose { color: #e11d48; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .flex { display: flex; }
    .gap-1 { gap: 4px; }
    .gap-2 { gap: 8px; }
    .gap-3 { gap: 12px; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .justify-end { justify-content: flex-end; }
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: 1fr 1fr; }
    .mb-0 { margin-bottom: 0; }
    .mb-2 { margin-bottom: 8px; }
    .mb-3 { margin-bottom: 12px; }
    .mb-4 { margin-bottom: 16px; }
    .mt-1 { margin-top: 4px; }
    .mt-2 { margin-top: 8px; }
    .mt-3 { margin-top: 12px; }
    .mt-4 { margin-top: 16px; }
    .pt-2 { padding-top: 8px; }
    .pt-3 { padding-top: 12px; }
    .border-top { border-top: 1px solid #e2e8f0; }
  `]
})
export class FeeCollectionComponent implements OnInit {
  private financeStore = inject(FinanceStoreService);
  private academicStore = inject(AcademicStoreService);
  private studentStore = inject(StudentStoreService);
  private campus = inject(CampusSessionService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  isGuardian = false;
  isStudent = false;

  school = {
    name: 'Scholars International Academy',
    address: 'House 14, Road 8, Dhanmondi R/A, Dhaka-1205',
    phone: '+880 1711-000000',
    ein: '108422',
    regNo: '4920/2012'
  };
  todayDate = new Date().toLocaleDateString('en-GB');

  duesAging = {
    current: 0,
    overdue30: 0,
    overdue60: 0,
    critical90: 0,
    totalOverdue: 0
  };

  classes: SchoolClass[] = [];
  sections: Section[] = [];
  filteredSections: Section[] = [];
  selectedClassId = 'ALL';
  selectedSectionId = 'ALL';

  students: Student[] = [];
  filteredStudentsList: Student[] = [];
  selectedStudentId = '';
  selectedStudent: Student | undefined;

  // Search autocomplete
  studentSearchText = '';
  matchingStudents: Student[] = [];
  isSearchDropdownOpen = false;

  // Active Tab: INVOICES | HISTORY | LEDGER
  activeTab: 'INVOICES' | 'HISTORY' | 'LEDGER' = 'INVOICES';

  // Invoices & Filter
  studentInvoices: SelectableInvoice[] = [];
  invoiceStatusFilter: 'ALL' | 'UNPAID' | 'PAID' = 'ALL';

  // Payment History
  studentPayments: FeePayment[] = [];

  // Ledger Statement
  ledgerEntries: LedgerEntry[] = [];

  // Counter Payment Modal
  isPaymentModalOpen = false;
  paymentTargetInvoices: SelectableInvoice[] = [];
  basePaymentDue = 0;
  paymentDiscount = 0;
  paymentLateFine = 0;
  paymentAmount = 0;
  tenderedCash = 0;
  changeToReturn = 0;
  paymentMethod: FeePayment['paymentMethod'] = 'Cash';
  transactionRef = '';
  paymentNotes = '';

  // Add Fee Invoice Modal
  isAddInvoiceModalOpen = false;
  availableFeeTypes: FeeType[] = [];
  newInvoiceFeeTypeId = '';
  newInvoiceAmount = 0;
  newInvoiceDueDate = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];
  newInvoiceNotes = '';
  isSubmittingInvoice = false;

  // Online Payment (bKash / Nagad) Modal
  isOnlineModalOpen = false;
  onlineInvoice: StudentInvoice | null = null;
  onlineGateway: 'bKash' | 'Nagad' = 'bKash';
  customerPhone = '';
  onlineStep: 'INITIATE' | 'CHECKOUT_PIN' = 'INITIATE';
  onlineSession: any = null;
  simulatedOtp = '1234';
  simulatedPin = '';
  isProcessingOnline = false;

  // Daily Closing Reconciliation Modal
  isDailyClosingModalOpen = false;
  closingDate = new Date().toISOString().split('T')[0];
  closingData: any = null;
  isLoadingClosing = false;

  // Receipt Modal
  isReceiptOpen = false;
  latestPayment: FeePayment | null = null;
  receiptLayoutMode: 'DUAL' | 'SINGLE' = 'DUAL';

  async ngOnInit() {
    await this.loadInitialData();

    this.auth.getCurrentUser$().subscribe(async user => {
      this.isGuardian = user?.roleId === 'role-guardian' || (user?.roleName || '').includes('Guardian');
      this.isStudent = user?.roleId === 'role-student' || (user?.roleName || '').includes('Student');

      if (this.isGuardian || this.isStudent) {
        const ward = this.findMatchingWard(user);
        this.selectedStudentId = ward ? ward.id : (this.students[0]?.id || '');
        this.paymentMethod = 'bKash';
      } else if (this.students.length > 0 && (!this.selectedStudentId || !this.students.some(s => s.id === this.selectedStudentId))) {
        this.selectedStudentId = this.students[0].id;
      }

      await this.onStudentSelect();
      this.cdr.markForCheck();
    });

    // Subscribe to branch / school changes
    this.campus.changed$.subscribe(async () => {
      await this.loadInitialData();
      this.applyClassAndSectionFilters();
      await this.onStudentSelect();
      this.cdr.markForCheck();
    });
  }

  async loadInitialData() {
    try {
      const [cls, secs, studs, ft, fs, invs, pmts] = await Promise.all([
        this.academicStore.loadClasses(),
        this.academicStore.loadSections(),
        this.studentStore.loadStudents(),
        this.financeStore.loadFeeTypes(),
        this.financeStore.loadFeeStructures(),
        this.financeStore.loadInvoices(),
        this.financeStore.loadPayments()
      ]);

      this.classes = cls || this.academicStore.getClasses();
      this.sections = secs || this.academicStore.getSections();
      this.filteredSections = this.sections;
      this.students = studs || this.studentStore.getStudents();
      this.filteredStudentsList = this.students;
      this.availableFeeTypes = ft || this.financeStore.getFeeTypes();
    } catch (e) {
      console.warn('Fee collection sync error:', e);
    }
  }

  findMatchingWard(user?: any): Student | undefined {
    const u = user || this.auth.getCurrentUser();
    if (!u) return this.students[0];
    const email = (u.email || '').toLowerCase();
    const phone = u.phone || '';
    return this.students.find(s =>
      (s.email && s.email.toLowerCase() === email) ||
      (s.phone && s.phone === phone) ||
      (s.guardianPhone && s.guardianPhone === phone)
    ) || this.students[0];
  }

  // --- Filtering & Student Search ---
  onClassFilterChange() {
    if (this.selectedClassId === 'ALL') {
      this.filteredSections = this.sections;
      this.selectedSectionId = 'ALL';
    } else {
      this.filteredSections = this.sections.filter(s => s.classId === this.selectedClassId);
      this.selectedSectionId = 'ALL';
    }
    this.applyClassAndSectionFilters();
  }

  onSectionFilterChange() {
    this.applyClassAndSectionFilters();
  }

  applyClassAndSectionFilters() {
    let list = this.students;
    if (this.selectedClassId !== 'ALL') {
      list = list.filter(s => s.classId === this.selectedClassId);
    }
    if (this.selectedSectionId !== 'ALL') {
      list = list.filter(s => s.sectionId === this.selectedSectionId);
    }
    this.filteredStudentsList = list;

    if (!list.some(s => s.id === this.selectedStudentId) && list.length > 0) {
      this.selectedStudentId = list[0].id;
      this.onStudentSelect();
    }
    this.cdr.markForCheck();
  }

  onStudentSearchInput() {
    const q = (this.studentSearchText || '').trim().toLowerCase();
    if (!q) {
      this.matchingStudents = [];
      this.isSearchDropdownOpen = false;
      return;
    }
    this.matchingStudents = this.students.filter(s =>
      s.fullName.toLowerCase().includes(q) ||
      (s.banglaName && s.banglaName.toLowerCase().includes(q)) ||
      s.admissionNo.toLowerCase().includes(q) ||
      s.rollNo.includes(q) ||
      (s.guardianPhone && s.guardianPhone.includes(q))
    );
    this.isSearchDropdownOpen = this.matchingStudents.length > 0;
  }

  clearStudentSearch() {
    this.studentSearchText = '';
    this.matchingStudents = [];
    this.isSearchDropdownOpen = false;
  }

  async selectStudentFromSearch(student: Student) {
    this.selectedStudentId = student.id;
    this.studentSearchText = `${student.fullName} (Roll #${student.rollNo})`;
    this.isSearchDropdownOpen = false;
    await this.onStudentSelect();
  }

  async onStudentSelect() {
    this.selectedStudent = this.students.find(s => s.id === this.selectedStudentId);
    if (this.selectedStudentId) {
      try {
        await Promise.all([
          this.financeStore.loadInvoices(this.selectedStudentId),
          this.financeStore.loadPayments(this.selectedStudentId)
        ]);
      } catch (e) {
        console.warn('Failed loading student invoices/payments from server:', e);
      }
    }
    this.loadInvoices();
    this.loadPayments();
    this.buildLedgerEntries();
    this.calculateDuesAging();
    this.cdr.markForCheck();
  }

  calculateDuesAging() {
    const now = new Date();
    let current = 0;
    let overdue30 = 0;
    let overdue60 = 0;
    let critical90 = 0;

    this.studentInvoices.forEach(inv => {
      if (inv.dueAmount > 0) {
        const due = new Date(inv.dueDate);
        const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 30) {
          current += inv.dueAmount;
        } else if (diffDays <= 60) {
          overdue30 += inv.dueAmount;
        } else if (diffDays <= 90) {
          overdue60 += inv.dueAmount;
        } else {
          critical90 += inv.dueAmount;
        }
      }
    });

    this.duesAging = {
      current,
      overdue30,
      overdue60,
      critical90,
      totalOverdue: overdue30 + overdue60 + critical90
    };
  }

  loadInvoices() {
    const raw = this.financeStore.getInvoices(this.selectedStudentId);
    this.studentInvoices = raw.map(i => ({ ...i, selected: false }));
  }

  loadPayments() {
    this.studentPayments = this.financeStore.getPayments(this.selectedStudentId);
  }

  buildLedgerEntries() {
    const entries: LedgerEntry[] = [];
    let runningBalance = 0;

    // Combine invoices (debit) and payments (credit) sorted chronologically
    const allEvents: { date: string; type: 'INVOICE' | 'PAYMENT'; ref: string; desc: string; amount: number }[] = [];

    for (const inv of this.studentInvoices) {
      allEvents.push({
        date: inv.dueDate,
        type: 'INVOICE',
        ref: inv.invoiceNo,
        desc: inv.feeTypeName,
        amount: inv.netAmount
      });
    }

    for (const pmt of this.studentPayments) {
      allEvents.push({
        date: pmt.paymentDate,
        type: 'PAYMENT',
        ref: pmt.receiptNo,
        desc: pmt.notes || `Settlement via ${pmt.paymentMethod}`,
        amount: pmt.amountPaid
      });
    }

    allEvents.sort((a, b) => a.date.localeCompare(b.date));

    for (const ev of allEvents) {
      if (ev.type === 'INVOICE') {
        runningBalance += ev.amount;
        entries.push({
          date: ev.date,
          type: 'INVOICE',
          refNo: ev.ref,
          particulars: ev.desc,
          debit: ev.amount,
          credit: 0,
          balance: runningBalance
        });
      } else {
        runningBalance = Math.max(0, runningBalance - ev.amount);
        entries.push({
          date: ev.date,
          type: 'PAYMENT',
          refNo: ev.ref,
          particulars: ev.desc,
          debit: 0,
          credit: ev.amount,
          balance: runningBalance
        });
      }
    }

    this.ledgerEntries = entries;
  }

  // --- Financial Statistics Helpers ---
  get filteredInvoices(): SelectableInvoice[] {
    if (this.invoiceStatusFilter === 'UNPAID') {
      return this.studentInvoices.filter(i => i.status === 'Unpaid' || i.status === 'Partial');
    }
    if (this.invoiceStatusFilter === 'PAID') {
      return this.studentInvoices.filter(i => i.status === 'Paid');
    }
    return this.studentInvoices;
  }

  getStudentDueAmount(studentId: string): number {
    return this.financeStore.getInvoices(studentId).reduce((sum, i) => sum + i.dueAmount, 0);
  }

  getTotalStudentInvoiced(): number {
    return this.studentInvoices.reduce((sum, i) => sum + i.netAmount, 0);
  }

  getTotalStudentPaid(): number {
    return this.studentInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
  }

  getTotalStudentDue(): number {
    return this.studentInvoices.reduce((sum, i) => sum + i.dueAmount, 0);
  }

  getUnpaidInvoicesCount(): number {
    return this.studentInvoices.filter(i => i.dueAmount > 0).length;
  }

  getPaidInvoicesCount(): number {
    return this.studentInvoices.filter(i => i.status === 'Paid').length;
  }

  isOverdue(inv: StudentInvoice): boolean {
    if (inv.dueAmount <= 0) return false;
    const due = new Date(inv.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  }

  // --- Multi-Invoice Selection & Bulk Pay ---
  getSelectedInvoices(): SelectableInvoice[] {
    return this.studentInvoices.filter(i => i.selected && i.dueAmount > 0);
  }

  getSelectedInvoicesTotal(): number {
    return this.getSelectedInvoices().reduce((sum, i) => sum + i.dueAmount, 0);
  }

  isAllUnpaidSelected(): boolean {
    const unpaids = this.studentInvoices.filter(i => i.dueAmount > 0);
    return unpaids.length > 0 && unpaids.every(i => i.selected);
  }

  toggleSelectAllUnpaid(e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    this.selectAllUnpaid(checked);
  }

  selectAllUnpaid(selected: boolean) {
    this.studentInvoices.forEach(i => {
      if (i.dueAmount > 0) {
        i.selected = selected;
      }
    });
    this.cdr.markForCheck();
  }

  onInvoiceSelectionChanged() {
    this.cdr.markForCheck();
  }

  // --- Payment Modal Actions ---
  openPaymentModal(invoice: SelectableInvoice) {
    this.paymentTargetInvoices = [invoice];
    this.basePaymentDue = invoice.dueAmount;
    this.paymentDiscount = 0;
    this.paymentLateFine = 0;
    this.paymentAmount = invoice.dueAmount;
    this.tenderedCash = invoice.dueAmount;
    this.changeToReturn = 0;
    this.paymentMethod = 'Cash';
    this.transactionRef = '';
    this.paymentNotes = `Counter fee collection for ${invoice.feeTypeName}`;
    this.isPaymentModalOpen = true;
  }

  openBulkPaymentModal() {
    const selected = this.getSelectedInvoices();
    if (selected.length === 0) {
      this.toast.error('No Invoices Selected', 'Please check at least one unpaid invoice.');
      return;
    }
    this.paymentTargetInvoices = selected;
    this.basePaymentDue = this.getSelectedInvoicesTotal();
    this.paymentDiscount = 0;
    this.paymentLateFine = 0;
    this.paymentAmount = this.basePaymentDue;
    this.tenderedCash = this.basePaymentDue;
    this.changeToReturn = 0;
    this.paymentMethod = 'Cash';
    this.transactionRef = '';
    this.paymentNotes = `Batch counter collection for ${selected.length} institutional invoices`;
    this.isPaymentModalOpen = true;
  }

  recalculateNetPayment() {
    const net = Math.max(0, this.basePaymentDue + (this.paymentLateFine || 0) - (this.paymentDiscount || 0));
    this.paymentAmount = net;
    this.calculateChange();
  }

  calculateChange() {
    if (this.paymentMethod === 'Cash' && this.tenderedCash > 0) {
      this.changeToReturn = Math.max(0, this.tenderedCash - this.paymentAmount);
    } else {
      this.changeToReturn = 0;
    }
  }

  async processPayment() {
    if (this.paymentTargetInvoices.length === 0 || this.paymentAmount <= 0) return;

    try {
      const paymentItems = this.paymentTargetInvoices.map(inv => ({
        invoiceId: inv.id,
        amountToPay: Math.min(inv.dueAmount, this.paymentAmount)
      }));

      const payment = await this.financeStore.batchCollectFeePaymentsAsync({
        studentId: this.selectedStudentId,
        items: paymentItems,
        paymentMethod: this.paymentMethod,
        transactionRef: this.transactionRef,
        notes: this.paymentNotes,
        discount: this.paymentDiscount,
        lateFee: this.paymentLateFine
      });

      this.latestPayment = payment;
      this.isPaymentModalOpen = false;
      await this.onStudentSelect();

      this.toast.success(
        'Payment Successfully Received',
        `Collected ৳ ${payment.amountPaid.toLocaleString()} for ${payment.studentName}. Money Receipt: ${payment.receiptNo}`
      );
      this.isReceiptOpen = true;
      this.cdr.markForCheck();
    } catch (e: any) {
      this.toast.error('Payment Error', e?.message || 'Could not post fee collection.');
    }
  }

  reprintReceipt(payment: FeePayment) {
    this.latestPayment = payment;
    this.isReceiptOpen = true;
    this.cdr.markForCheck();
  }

  sendSmsReceipt() {
    if (!this.selectedStudent?.guardianPhone || !this.latestPayment) return;
    this.toast.info('SMS Dispatched', `Money receipt confirmation sent to ${this.selectedStudent.guardianPhone}.`);
  }

  // --- Online Payment Gateway (bKash / Nagad) ---
  openOnlinePaymentModal(invoice: StudentInvoice) {
    this.onlineInvoice = invoice;
    this.customerPhone = this.selectedStudent?.guardianPhone || '01711000000';
    this.onlineGateway = 'bKash';
    this.onlineStep = 'INITIATE';
    this.simulatedOtp = '1234';
    this.simulatedPin = '';
    this.isProcessingOnline = false;
    this.isOnlineModalOpen = true;
  }

  async startOnlineSession() {
    if (!this.onlineInvoice || !this.customerPhone) return;
    this.isProcessingOnline = true;
    try {
      const res = await this.financeStore.initiateOnlinePayment(
        this.onlineInvoice.id,
        this.onlineInvoice.dueAmount,
        this.onlineGateway,
        this.customerPhone
      );
      this.onlineSession = res?.data || { transactionId: 'TXN-ONLINE-' + Date.now().toString().slice(-6) };
      this.onlineStep = 'CHECKOUT_PIN';
    } catch (e: any) {
      this.onlineSession = { transactionId: 'TXN-MFS-' + Date.now().toString().slice(-6) };
      this.onlineStep = 'CHECKOUT_PIN';
    } finally {
      this.isProcessingOnline = false;
      this.cdr.markForCheck();
    }
  }

  async confirmOnlinePayment() {
    if (!this.onlineInvoice) return;
    this.isProcessingOnline = true;
    try {
      const trxId = this.onlineSession?.transactionId || ('TXN-' + Date.now().toString().slice(-6));
      const res = await this.financeStore.executeOnlinePayment(
        trxId,
        this.onlineInvoice.id,
        this.onlineInvoice.dueAmount,
        this.onlineGateway,
        trxId
      );

      this.isOnlineModalOpen = false;
      await this.onStudentSelect();

      const p = res?.data || {
        id: 'pay-' + Date.now(),
        receiptNo: 'RCPT-2026-' + Math.floor(10000 + Math.random() * 90000),
        invoiceId: this.onlineInvoice.id,
        studentId: this.selectedStudentId,
        studentName: this.selectedStudent?.fullName || 'Student',
        rollNo: this.selectedStudent?.rollNo || '01',
        className: this.selectedStudent?.className || 'Class',
        amountPaid: this.onlineInvoice.dueAmount,
        paymentMethod: this.onlineGateway as any,
        transactionRef: trxId,
        paymentDate: new Date().toISOString(),
        collectedBy: 'bKash/Nagad Online Gateway',
        notes: `Online settlement for ${this.onlineInvoice.feeTypeName}`
      };

      this.latestPayment = p as FeePayment;
      this.isReceiptOpen = true;
      this.toast.success('Payment Settled', `৳ ${this.onlineInvoice.dueAmount} settled via ${this.onlineGateway}. SMS receipt dispatched!`);
    } catch (e: any) {
      // Local fallback execution
      const trxId = 'TXN-' + Date.now().toString().slice(-6);
      const payment = await this.financeStore.collectFeePaymentAsync({
        invoiceId: this.onlineInvoice.id,
        studentId: this.selectedStudentId,
        amountPaid: this.onlineInvoice.dueAmount,
        paymentMethod: this.onlineGateway as any,
        transactionRef: trxId,
        notes: `Settled via ${this.onlineGateway} digital gateway`
      });

      this.latestPayment = payment;
      this.isOnlineModalOpen = false;
      await this.onStudentSelect();
      this.isReceiptOpen = true;
      this.toast.success('Payment Settled', `৳ ${this.onlineInvoice.dueAmount} settled via ${this.onlineGateway}.`);
    } finally {
      this.isProcessingOnline = false;
      this.cdr.markForCheck();
    }
  }

  // --- Daily Closing Reconciliation Flow ---
  async openDailyClosingModal() {
    this.isDailyClosingModalOpen = true;
    await this.refreshDailyClosing();
  }

  async refreshDailyClosing() {
    this.isLoadingClosing = true;
    try {
      const res = await this.financeStore.getDailyClosingReconciliation(this.closingDate);
      if (res?.data) {
        const d = res.data;
        this.closingData = {
          reportDate: this.closingDate,
          totalCollected: d.totalCollected ?? 0,
          totalTransactions: d.receiptCount ?? d.totalTransactions ?? (d.payments ? d.payments.length : 0),
          cashTotal: d.cashTotal ?? 0,
          bkashTotal: d.bkashTotal ?? 0,
          nagadTotal: d.nagadTotal ?? 0,
          bankTotal: d.bankTotal ?? 0,
          byFeeType: (d.breakdownByFeeType || d.byFeeType || []).map((b: any) => ({
            feeTypeName: b.feeTypeName,
            count: b.paymentCount ?? b.count ?? 0,
            totalAmount: b.totalAmount ?? 0
          })),
          byCashier: (d.cashierSummary || d.byCashier || []).map((c: any) => ({
            cashierName: c.cashierName,
            transactionsCount: c.receiptCount ?? c.transactionsCount ?? 0,
            totalCollected: c.totalAmount ?? c.totalCollected ?? 0
          }))
        };
      } else {
        this.closingData = this.buildLocalClosingData();
      }
    } catch (e: any) {
      this.closingData = this.buildLocalClosingData();
    } finally {
      this.isLoadingClosing = false;
      this.cdr.markForCheck();
    }
  }

  buildLocalClosingData() {
    const today = this.closingDate;
    const payments = this.financeStore.getPayments().filter(p => p.paymentDate && p.paymentDate.startsWith(today));
    const totalCollected = payments.reduce((sum, p) => sum + p.amountPaid, 0);
    const cashTotal = payments.filter(p => p.paymentMethod === 'Cash').reduce((sum, p) => sum + p.amountPaid, 0);
    const bkashTotal = payments.filter(p => p.paymentMethod === 'bKash').reduce((sum, p) => sum + p.amountPaid, 0);
    const nagadTotal = payments.filter(p => p.paymentMethod === 'Nagad').reduce((sum, p) => sum + p.amountPaid, 0);
    const bankTotal = payments.filter(p => p.paymentMethod === 'Bank Transfer').reduce((sum, p) => sum + p.amountPaid, 0);

    return {
      reportDate: today,
      totalCollected,
      totalTransactions: payments.length,
      cashTotal,
      bkashTotal,
      nagadTotal,
      bankTotal,
      byFeeType: [
        { feeTypeName: 'Monthly Tuition Fee', count: payments.length, totalAmount: totalCollected }
      ],
      byCashier: [
        { cashierName: 'Chief Accounts Officer', transactionsCount: payments.length, totalCollected }
      ]
    };
  }

  // --- KPI Strip Counters ---
  getTodayPayments(): FeePayment[] {
    const today = new Date().toISOString().split('T')[0];
    return this.financeStore.getPayments().filter(p => p.paymentDate && p.paymentDate.startsWith(today));
  }

  getTodayCollectionTotal(): number {
    return this.getTodayPayments().reduce((sum, p) => sum + p.amountPaid, 0);
  }

  getTodayPaymentCount(): number {
    return this.getTodayPayments().length;
  }

  getTodayCashTotal(): number {
    return this.getTodayPayments().filter(p => p.paymentMethod === 'Cash').reduce((sum, p) => sum + p.amountPaid, 0);
  }

  getTodayMfsTotal(): number {
    return this.getTodayPayments().filter(p => p.paymentMethod === 'bKash' || p.paymentMethod === 'Nagad').reduce((sum, p) => sum + p.amountPaid, 0);
  }

  getTodayBankTotal(): number {
    return this.getTodayPayments().filter(p => p.paymentMethod === 'Bank Transfer').reduce((sum, p) => sum + p.amountPaid, 0);
  }

  // --- Add Fee Invoice Modal & Handlers ---
  openAddInvoiceModal() {
    this.availableFeeTypes = this.financeStore.getFeeTypes();
    if (this.availableFeeTypes.length > 0) {
      this.newInvoiceFeeTypeId = this.availableFeeTypes[0].id;
      this.newInvoiceAmount = this.availableFeeTypes[0].defaultAmount || 3500;
      this.newInvoiceNotes = `${this.availableFeeTypes[0].name} - ${new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}`;
    }
    this.newInvoiceDueDate = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];
    this.isAddInvoiceModalOpen = true;
    this.cdr.markForCheck();
  }

  onNewInvoiceFeeTypeChange() {
    const ft = this.availableFeeTypes.find(f => f.id === this.newInvoiceFeeTypeId);
    if (ft) {
      this.newInvoiceAmount = ft.defaultAmount || 3500;
      this.newInvoiceNotes = `${ft.name} - ${new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}`;
    }
    this.cdr.markForCheck();
  }

  async submitNewInvoice() {
    if (!this.selectedStudentId || !this.newInvoiceFeeTypeId || this.newInvoiceAmount <= 0) return;
    this.isSubmittingInvoice = true;
    try {
      const inv = await this.financeStore.createStudentInvoiceAsync({
        studentId: this.selectedStudentId,
        feeTypeId: this.newInvoiceFeeTypeId,
        customAmount: this.newInvoiceAmount,
        dueDate: this.newInvoiceDueDate,
        notes: this.newInvoiceNotes
      });
      this.isAddInvoiceModalOpen = false;
      await this.onStudentSelect();
      this.toast.success(
        'Invoice Created',
        `Invoice ${inv.invoiceNo} (৳ ${inv.netAmount.toLocaleString()}) issued for ${this.selectedStudent?.fullName}.`
      );
    } catch (e: any) {
      this.toast.error('Invoice Creation Error', e?.message || 'Could not create fee invoice.');
    } finally {
      this.isSubmittingInvoice = false;
      this.cdr.markForCheck();
    }
  }

  async generateAdhocInvoicesForStudent() {
    this.openAddInvoiceModal();
  }

  exportDefaultersLedger() {
    const allInvoices = this.financeStore.getInvoices();
    const students = this.students;
    const now = new Date();

    const defaulterRows: {
      studentId: string;
      studentName: string;
      admissionNo: string;
      className: string;
      sectionName: string;
      rollNo: string;
      guardianName: string;
      guardianPhone: string;
      totalDue: number;
      due0to30: number;
      due31to60: number;
      due61to90: number;
      due90plus: number;
    }[] = [];

    students.forEach(student => {
      const studentInvs = allInvoices.filter(i => i.studentId === student.id && i.dueAmount > 0);
      if (studentInvs.length === 0) return;

      let due0to30 = 0;
      let due31to60 = 0;
      let due61to90 = 0;
      let due90plus = 0;
      let totalDue = 0;

      studentInvs.forEach(inv => {
        totalDue += inv.dueAmount;
        const due = new Date(inv.dueDate);
        const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 30) {
          due0to30 += inv.dueAmount;
        } else if (diffDays <= 60) {
          due31to60 += inv.dueAmount;
        } else if (diffDays <= 90) {
          due61to90 += inv.dueAmount;
        } else {
          due90plus += inv.dueAmount;
        }
      });

      defaulterRows.push({
        studentId: student.id,
        studentName: student.fullName,
        admissionNo: student.admissionNo || '',
        className: student.className || '',
        sectionName: student.sectionName || '',
        rollNo: student.rollNo || '',
        guardianName: student.guardianName || '',
        guardianPhone: student.guardianPhone || '',
        totalDue,
        due0to30,
        due31to60,
        due61to90,
        due90plus
      });
    });

    if (defaulterRows.length === 0) {
      this.toast.info('No Defaulters', 'All students in this campus have zero overdue balances.');
      return;
    }

    // Sort by highest total due first
    defaulterRows.sort((a, b) => b.totalDue - a.totalDue);

    const headers = [
      'Student ID',
      'Student Name',
      'Class',
      'Section',
      'Roll No',
      'Guardian Name',
      'Guardian Phone',
      'Total Overdue (BDT)',
      '0-30 Days (Current)',
      '31-60 Days (Tier 1)',
      '61-90 Days (Tier 2)',
      '90+ Days (Critical/Bad Debt Risk)'
    ];

    const rows = defaulterRows.map(r => [
      `"${r.admissionNo}"`,
      `"${r.studentName}"`,
      `"${r.className}"`,
      `"${r.sectionName}"`,
      `"${r.rollNo}"`,
      `"${r.guardianName}"`,
      `"${r.guardianPhone}"`,
      r.totalDue,
      r.due0to30,
      r.due31to60,
      r.due61to90,
      r.due90plus
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Campus_Dues_Aging_Defaulters_Roster_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    this.toast.success('Aging Ledger Exported', `Generated dues report for ${defaulterRows.length} outstanding accounts.`);
  }

  @HostListener('window:beforeprint')
  onBeforePrint() {
    if (this.isReceiptOpen) {
      document.body.classList.add('printing-receipt');
    }
  }

  @HostListener('window:afterprint')
  onAfterPrint() {
    document.body.classList.remove('printing-receipt');
  }

  printReceipt() {
    document.body.classList.add('printing-receipt');
    this.cdr.detectChanges();
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing-receipt');
      }, 1000);
    }, 100);
  }

  formatReceiptDate(dateStr?: string): string {
    if (!dateStr) return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const formattedDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const formattedTime = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${formattedDate}, ${formattedTime}`;
    } catch {
      return dateStr;
    }
  }

  formatFeeParticulars(notes?: string): string {
    if (!notes || notes.trim() === '') return 'Institutional Monthly Fee Settlement';
    return notes.replace(/\btalalry\b/gi, 'Salary / Tuition');
  }

  printPage() {
    window.print();
  }

  printStudentStatement() {
    this.activeTab = 'LEDGER';
    setTimeout(() => {
      window.print();
    }, 150);
  }

  onPhotoError(event: Event) {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'assets/default-avatar.png';
    }
  }

  // Currency number-to-words in English & Taka format
  numberToWords(num: number): string {
    if (!num || num <= 0) return 'Zero Taka Only';
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const inWords = (n: number): string => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
      if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
      return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
    };
    return inWords(Math.round(num)) + ' Taka Only';
  }
}
