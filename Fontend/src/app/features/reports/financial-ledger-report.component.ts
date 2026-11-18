import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { FinanceStoreService } from '../../core/services/stores/finance-store.service';
import { AcademicStoreService } from '../../core/services/stores/academic-store.service';
import { AuthService } from '../../core/services/auth.service';
import { CampusSessionService } from '../../core/services/campus-session.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/components/icon.component';
import { BadgeComponent } from '../../shared/components/badge.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { SchoolClass, FeeType, StudentInvoice, ExpenseVoucher, ExpenseSummary, User, BankAccount, TreasurySummary } from '../../core/models';

@Component({
  selector: 'app-financial-ledger-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent, BadgeComponent, ModalComponent],
  template: `
    <div class="page-container">
      <div class="printable-document-frame printable-area">
        <!-- 1. OFFICIAL INSTITUTION PRINT LETTERHEAD (ONLY PRINT) -->
        <div class="print-letterhead only-print">
          <div class="pl-header-top">
            <div class="pl-logo-box">
              <app-icon name="circle-dollar-sign" [size]="42" class="text-primary"></app-icon>
            </div>
            <div class="pl-school-meta text-center flex-1">
              <h1 class="pl-school-name">{{ schoolName }}</h1>
              <span class="pl-campus-name">Campus: {{ activeCampusName }}</span>
              <p class="pl-school-addr">{{ schoolAddress }} • EIN: 108422 • Reg: 4920/2012 • Phone: +880 1711-000000</p>
              <div class="pl-report-title-pill">
                INSTITUTIONAL GENERAL LEDGER & AUDIT STATEMENT (আর্থিক অডিট ও আয়-ব্যয় বিবরণী)
              </div>
            </div>
            <div class="pl-copy-tag">
              ACCOUNTS & AUDIT ARCHIVE
            </div>
          </div>
          <div class="pl-meta-grid">
            <div><strong>Academic Session:</strong> 2026 - 2027</div>
            <div><strong>Campus Accounts:</strong> {{ activeCampusName }} (Campus-Scoped)</div>
            <div><strong>Date of Statement:</strong> {{ todayDateFormatted }}</div>
            <div><strong>Audit Clearance:</strong> Verified Double-Entry Bookkeeping Standard</div>
            <div><strong>Realized Fee Revenue:</strong> ৳ {{ totalCollectedAmount.toLocaleString() }} BDT (Recovery: {{ recoveryRatio }}%)</div>
            <div><strong>Operational Campus Expenses:</strong> ৳ {{ totalExpenseAmount.toLocaleString() }} BDT ({{ expenseVouchers.length }} Vouchers)</div>
            <div><strong>Staff & Teacher Payroll Outflow:</strong> ৳ {{ totalPayrollDisbursed.toLocaleString() }} BDT</div>
            <div><strong>Net Campus Operating Surplus:</strong> ৳ {{ netSurplus.toLocaleString() }} BDT</div>
          </div>
        </div>

        <!-- 2. SCREEN PAGE HEADER (NO-PRINT) -->
        <div class="page-header no-print">
          <div>
            <div class="header-badge">
              <span class="pulse-dot"></span>
              Campus Accounts & Audit Division
              <span class="campus-pill">{{ activeCampusName }}</span>
            </div>
            <h1 class="page-title">
              <app-icon name="receipt" [size]="28" class="text-primary title-icon"></app-icon>
              Campus Financial Ledger & Audit Suite
            </h1>
            <p class="page-subtitle">
              Comprehensive institutional accounting: Realized fee collections, outstanding student dues, operational debit vouchers, and net campus operating surplus.
            </p>
          </div>
          <div class="page-actions">
            <a routerLink="/app/reports/academic" class="btn btn-outline" title="Switch to Academic Performance">
              <app-icon name="award" [size]="16"></app-icon>
              <span>Academic Performance</span>
            </a>
            <button type="button" class="btn btn-outline" (click)="printReport()" title="Print official accounts audit statement">
              <app-icon name="printer" [size]="16"></app-icon>
              <span>Print Audit Ledger</span>
            </button>
            <button type="button" class="btn btn-primary" (click)="exportCSV()" title="Export general ledger to CSV">
              <app-icon name="download" [size]="16"></app-icon>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <!-- 3. TOP KPI STRIP (NO-PRINT) -->
        <div class="kpi-strip mb-4 no-print">
          <div class="kpi-box">
            <span class="kpi-label">Total Invoiced Amount</span>
            <h3 class="kpi-val text-primary">৳ {{ totalInvoicedAmount.toLocaleString() }}</h3>
            <span class="kpi-sub">{{ filteredInvoices.length }} Student Invoices Audited</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">Realized Fee Revenue</span>
            <h3 class="kpi-val text-emerald">৳ {{ totalCollectedAmount.toLocaleString() }}</h3>
            <span class="kpi-sub">Recovery Ratio: {{ recoveryRatio }}%</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">Outstanding Student Arrears</span>
            <h3 class="kpi-val text-danger">৳ {{ totalDueAmount.toLocaleString() }}</h3>
            <span class="kpi-sub">Unpaid Balances Across All Tiers</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">Operational Campus Expenses</span>
            <h3 class="kpi-val text-warning">৳ {{ totalExpenseAmount.toLocaleString() }}</h3>
            <span class="kpi-sub">{{ expenseVouchers.length }} Authorized Debit Vouchers</span>
          </div>
          <div class="kpi-box" [class.border-emerald]="netCashFlow >= 0" [class.border-danger]="netCashFlow < 0">
            <span class="kpi-label">Net Operating Cash Flow</span>
            <h3 class="kpi-val" [class.text-emerald]="netCashFlow >= 0" [class.text-danger]="netCashFlow < 0">
              ৳ {{ netCashFlow.toLocaleString() }}
            </h3>
            <span class="kpi-sub">Realized Inflow Less Expenses</span>
          </div>
        </div>

        <!-- 4. SUB-TABS NAVIGATION (NO-PRINT) -->
        <div class="tabs-nav mb-4 no-print">
          <button
            type="button"
            class="tab-btn"
            [class.active]="activeSubTab === 'invoices'"
            (click)="activeSubTab = 'invoices'"
          >
            <app-icon name="receipt" [size]="16"></app-icon>
            <span>Student Invoicing & Arrears Ledger ({{ filteredInvoices.length }})</span>
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.active]="activeSubTab === 'expenses'"
            (click)="activeSubTab = 'expenses'"
          >
            <app-icon name="credit-card" [size]="16"></app-icon>
            <span>Campus Debit Vouchers & Outflow ({{ expenseVouchers.length }})</span>
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.active]="activeSubTab === 'summary'"
            (click)="activeSubTab = 'summary'"
          >
            <app-icon name="pie-chart" [size]="16"></app-icon>
            <span>Income & Expenditure (P&L বিবরণী)</span>
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.active]="activeSubTab === 'balance-sheet'"
            (click)="activeSubTab = 'balance-sheet'"
          >
            <app-icon name="landmark" [size]="16"></app-icon>
            <span>Balance Sheet & Trial Balance (উদ্বৃত্তপত্র ও রেওয়ামিল)</span>
          </button>
        </div>

        <!-- ======================================================== -->
        <!-- SUB-TAB 1: STUDENT INVOICES & ARREARS LEDGER             -->
        <!-- ======================================================== -->
        <div *ngIf="activeSubTab === 'invoices'">
          <!-- Filter Controls (No Print) -->
          <div class="card mb-4 filter-card no-print">
            <div class="card-body">
              <div class="filter-grid-4">
                <div class="form-group mb-0">
                  <label class="form-label font-bold">Filter Academic Class</label>
                  <select class="form-select" [(ngModel)]="filterClassId" (change)="applyFilters()">
                    <option value="ALL">All Classes in Campus</option>
                    <option *ngFor="let c of classes" [value]="c.id">{{ c.name }}</option>
                  </select>
                </div>
                <div class="form-group mb-0">
                  <label class="form-label font-bold">Fee Particular Category</label>
                  <select class="form-select" [(ngModel)]="filterFeeTypeId" (change)="applyFilters()">
                    <option value="ALL">All Fee Types</option>
                    <option *ngFor="let ft of feeTypes" [value]="ft.id">{{ ft.name }}</option>
                  </select>
                </div>
                <div class="form-group mb-0">
                  <label class="form-label font-bold">Settlement Status</label>
                  <select class="form-select" [(ngModel)]="filterStatus" (change)="applyFilters()">
                    <option value="ALL">All Statuses</option>
                    <option value="Paid">Fully Paid</option>
                    <option value="Partial">Partially Settled</option>
                    <option value="Unpaid">Unpaid / Dues Pending</option>
                  </select>
                </div>
                <div class="form-group mb-0">
                  <label class="form-label font-bold">Search Student / Invoice</label>
                  <input
                    type="text"
                    class="form-control"
                    placeholder="Search name, roll, inv #..."
                    [(ngModel)]="searchInvoiceQuery"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Campus Dues Aging Portfolio Card -->
          <div class="dues-aging-portfolio-card mb-4 no-print" *ngIf="duesAgingSummary.total > 0">
            <div class="dap-header">
              <div class="dap-title">
                <app-icon name="clock" [size]="16" class="text-indigo"></app-icon>
                <span>Institutional Arrears Aging Portfolio (ক্যাম্পাস বকেয়া মেয়াদ বিশ্লেষণ)</span>
              </div>
              <span class="dap-total">Total Outstanding: ৳ {{ duesAgingSummary.total.toLocaleString() }} BDT</span>
            </div>
            <div class="dap-grid">
              <div class="dap-bucket bucket-current">
                <span class="dap-label">0 - 30 Days (Current Month)</span>
                <span class="dap-amount">৳ {{ duesAgingSummary.current.toLocaleString() }}</span>
                <span class="dap-pct">{{ duesAgingSummary.total > 0 ? ((duesAgingSummary.current / duesAgingSummary.total) * 100).toFixed(1) : 0 }}% of arrears</span>
              </div>
              <div class="dap-bucket bucket-tier1">
                <span class="dap-label">31 - 60 Days (Tier 1 Overdue)</span>
                <span class="dap-amount">৳ {{ duesAgingSummary.tier1.toLocaleString() }}</span>
                <span class="dap-pct">{{ duesAgingSummary.total > 0 ? ((duesAgingSummary.tier1 / duesAgingSummary.total) * 100).toFixed(1) : 0 }}% of arrears</span>
              </div>
              <div class="dap-bucket bucket-tier2">
                <span class="dap-label">61 - 90 Days (Tier 2 Overdue)</span>
                <span class="dap-amount">৳ {{ duesAgingSummary.tier2.toLocaleString() }}</span>
                <span class="dap-pct">{{ duesAgingSummary.total > 0 ? ((duesAgingSummary.tier2 / duesAgingSummary.total) * 100).toFixed(1) : 0 }}% of arrears</span>
              </div>
              <div class="dap-bucket bucket-critical">
                <span class="dap-label">90+ Days (Critical / Recovery Risk)</span>
                <span class="dap-amount">৳ {{ duesAgingSummary.critical.toLocaleString() }}</span>
                <span class="dap-pct text-danger font-bold">{{ duesAgingSummary.total > 0 ? ((duesAgingSummary.critical / duesAgingSummary.total) * 100).toFixed(1) : 0 }}% of arrears</span>
              </div>
            </div>
          </div>

          <!-- Invoices Data Table -->
          <div class="card">
            <div class="card-header flex-between flex-wrap gap-2">
              <div class="card-title">
                <app-icon name="receipt" [size]="18" class="text-primary"></app-icon>
                <span>Audited Student Invoices & Dues Ledger</span>
                <span class="badge-total-items">{{ searchFilteredInvoices.length }} Records</span>
              </div>
              <div class="table-actions no-print">
                <span class="text-xs text-muted">Click <strong>Receipt</strong> to preview or print official voucher</span>
              </div>
            </div>

            <div class="app-table-wrapper">
              <table class="app-table">
                <thead>
                  <tr>
                    <th style="width: 140px;">Invoice # & Due</th>
                    <th>Student Dossier</th>
                    <th style="width: 80px;" class="text-center">Roll</th>
                    <th>Class & Section</th>
                    <th>Fee Category</th>
                    <th class="text-right" style="width: 110px;">Invoiced (৳)</th>
                    <th class="text-right" style="width: 110px;">Collected (৳)</th>
                    <th class="text-right" style="width: 110px;">Balance (৳)</th>
                    <th class="text-center" style="width: 90px;">Status</th>
                    <th class="text-center no-print" style="width: 100px;">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let inv of searchFilteredInvoices">
                    <td>
                      <strong class="font-mono text-primary">{{ inv.invoiceNo }}</strong>
                      <span class="text-xs text-muted d-block">{{ inv.dueDate | date:'mediumDate' }}</span>
                    </td>
                    <td>
                      <strong>{{ inv.studentName }}</strong>
                      <span class="text-xs text-muted font-mono d-block">{{ inv.studentId }}</span>
                    </td>
                    <td class="text-center">
                      <span class="roll-pill">#{{ inv.rollNo || '01' }}</span>
                    </td>
                    <td>{{ inv.className }} ({{ inv.sectionName || 'General' }})</td>
                    <td>
                      <span class="font-bold text-slate-700">{{ inv.feeTypeName }}</span>
                    </td>
                    <td class="text-right font-bold">
                      ৳ {{ (inv.netAmount || 0).toLocaleString() }}
                    </td>
                    <td class="text-right text-emerald font-bold">
                      ৳ {{ (inv.paidAmount || 0).toLocaleString() }}
                    </td>
                    <td class="text-right font-bold" [class.text-danger]="inv.dueAmount > 0">
                      ৳ {{ (inv.dueAmount || 0).toLocaleString() }}
                    </td>
                    <td class="text-center">
                      <app-badge
                        [variant]="inv.status === 'Paid' ? 'success' : (inv.status === 'Partial' ? 'warning' : 'danger')"
                        [label]="inv.status"
                      ></app-badge>
                    </td>
                    <td class="text-center no-print">
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-primary"
                        (click)="viewInvoiceReceipt(inv)"
                        title="View Official Institutional Money Receipt"
                      >
                        <app-icon name="printer" [size]="12"></app-icon>
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>

                  <tr *ngIf="searchFilteredInvoices.length === 0">
                    <td colspan="10" class="text-center py-5 text-muted">
                      <app-icon name="receipt" [size]="36" class="mb-2 text-slate-400"></app-icon>
                      <div class="empty-title font-bold text-slate-700">No Student Invoices Found</div>
                      <div class="empty-sub text-sm">No billing records match your selected class, fee category, or status criteria.</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- SUB-TAB 2: CAMPUS EXPENSES & DEBIT VOUCHERS              -->
        <!-- ======================================================== -->
        <div *ngIf="activeSubTab === 'expenses'">
          <div class="card">
            <div class="card-header flex-between flex-wrap gap-2">
              <div class="card-title">
                <app-icon name="credit-card" [size]="18" class="text-primary"></app-icon>
                <span>Authorized Campus Operational Debit Vouchers</span>
                <span class="badge-total-items">{{ expenseVouchers.length }} Vouchers</span>
              </div>
              <div class="page-actions no-print">
                <a routerLink="/app/finance/expenses" class="btn btn-sm btn-primary">
                  <app-icon name="plus" [size]="14"></app-icon>
                  <span>New Debit Voucher</span>
                </a>
              </div>
            </div>

            <div class="app-table-wrapper">
              <table class="app-table">
                <thead>
                  <tr>
                    <th style="width: 140px;">Voucher # & Date</th>
                    <th>Paid To / Vendor</th>
                    <th>Expense Category</th>
                    <th style="width: 110px;">Payment Channel</th>
                    <th class="text-right" style="width: 130px;">Amount (৳)</th>
                    <th class="text-center" style="width: 100px;">Status</th>
                    <th>Description / Particulars</th>
                    <th class="text-center no-print" style="width: 100px;">Voucher</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let v of expenseVouchers">
                    <td>
                      <strong class="font-mono text-primary">{{ v.voucherNo }}</strong>
                      <span class="text-xs text-muted d-block">{{ v.expenseDate | date:'mediumDate' }}</span>
                    </td>
                    <td>
                      <strong>{{ v.paidTo }}</strong>
                      <span class="text-xs text-muted d-block" *ngIf="v.contactPhone">{{ v.contactPhone }}</span>
                    </td>
                    <td>
                      <span class="font-bold text-slate-700">{{ v.categoryName }}</span>
                    </td>
                    <td>
                      <span class="badge-channel">{{ v.paymentMethod }}</span>
                    </td>
                    <td class="text-right font-bold text-warning">
                      ৳ {{ (v.amount || 0).toLocaleString() }}
                    </td>
                    <td class="text-center">
                      <app-badge
                        [variant]="v.status === 'Paid' ? 'success' : (v.status === 'Approved' ? 'info' : 'warning')"
                        [label]="v.status"
                      ></app-badge>
                    </td>
                    <td>
                      <span class="text-sm text-slate-700">{{ v.notes || 'Institutional expenditure' }}</span>
                    </td>
                    <td class="text-center no-print">
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-warning"
                        (click)="viewExpenseVoucher(v)"
                        title="Print Authorized Debit Voucher"
                      >
                        <app-icon name="printer" [size]="12"></app-icon>
                        <span>Voucher</span>
                      </button>
                    </td>
                  </tr>

                  <tr *ngIf="expenseVouchers.length === 0">
                    <td colspan="8" class="text-center py-5 text-muted">
                      <app-icon name="credit-card" [size]="36" class="mb-2 text-slate-400"></app-icon>
                      <div class="empty-title font-bold text-slate-700">No Operational Debit Vouchers</div>
                      <div class="empty-sub text-sm">No expenses recorded for this campus yet.</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- SUB-TAB 3: CASH FLOW & BALANCE RECONCILIATION            -->
        <!-- ======================================================== -->
        <div *ngIf="activeSubTab === 'summary'">
          <div class="grid-2-col gap-4">
            <!-- REVENUE BREAKDOWN BY FEE CATEGORY -->
            <div class="card">
              <div class="card-header">
                <div class="card-title">
                  <app-icon name="trending-up" [size]="18" class="text-emerald"></app-icon>
                  <span>Fee Revenue Collections by Category</span>
                </div>
              </div>
              <div class="card-body p-0">
                <table class="app-table">
                  <thead>
                    <tr>
                      <th>Fee Particular Head</th>
                      <th class="text-right">Invoiced (৳)</th>
                      <th class="text-right">Collected (৳)</th>
                      <th class="text-right">Balance Due (৳)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let cat of feeCategorySummaries">
                      <td><strong>{{ cat.name }}</strong></td>
                      <td class="text-right font-mono">৳ {{ cat.invoiced.toLocaleString() }}</td>
                      <td class="text-right font-mono text-emerald font-bold">৳ {{ cat.collected.toLocaleString() }}</td>
                      <td class="text-right font-mono" [class.text-danger]="cat.due > 0">৳ {{ cat.due.toLocaleString() }}</td>
                    </tr>
                    <tr *ngIf="feeCategorySummaries.length === 0">
                      <td colspan="4" class="text-center py-4 text-muted">No fee categories recorded.</td>
                    </tr>
                    <tr class="table-total-row">
                      <td><strong>TOTAL INFLOWS</strong></td>
                      <td class="text-right font-mono">৳ {{ totalInvoicedAmount.toLocaleString() }}</td>
                      <td class="text-right text-emerald font-bold font-mono">৳ {{ totalCollectedAmount.toLocaleString() }}</td>
                      <td class="text-right text-danger font-bold font-mono">৳ {{ totalDueAmount.toLocaleString() }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- EXPENDITURE BREAKDOWN BY CATEGORY -->
            <div class="card">
              <div class="card-header">
                <div class="card-title">
                  <app-icon name="trending-down" [size]="18" class="text-warning"></app-icon>
                  <span>Operational Expenditures by Category</span>
                </div>
              </div>
              <div class="card-body p-0">
                <table class="app-table">
                  <thead>
                    <tr>
                      <th>Expense Category</th>
                      <th class="text-center">Vouchers</th>
                      <th class="text-right">Amount Outflow (৳)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let exp of expenseCategorySummaries">
                      <td><strong>{{ exp.categoryName }}</strong></td>
                      <td class="text-center font-mono">{{ exp.voucherCount }}</td>
                      <td class="text-right font-mono text-warning font-bold">৳ {{ exp.totalAmount.toLocaleString() }}</td>
                    </tr>
                    <tr *ngIf="expenseCategorySummaries.length === 0">
                      <td colspan="3" class="text-center py-4 text-muted">No categorized expenses recorded yet.</td>
                    </tr>
                    <tr class="table-total-row">
                      <td colspan="2"><strong>TOTAL CAMPUS EXPENDITURE</strong></td>
                      <td class="text-right text-warning font-bold font-mono">৳ {{ totalExpenseAmount.toLocaleString() }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- EXECUTIVE CASH RECONCILIATION SUMMARY BOX -->
          <div class="card mt-4 reconciliation-card">
            <div class="card-body">
              <div class="reconcile-grid">
                <div class="rec-item">
                  <span class="rec-label">Gross Realized Collections (+)</span>
                  <h4 class="rec-val text-emerald font-mono">৳ {{ totalCollectedAmount.toLocaleString() }}</h4>
                </div>
                <div class="rec-operator">-</div>
                <div class="rec-item">
                  <span class="rec-label">Campus Debit Vouchers (-)</span>
                  <h4 class="rec-val text-warning font-mono">৳ {{ totalExpenseAmount.toLocaleString() }}</h4>
                </div>
                <div class="rec-operator">-</div>
                <div class="rec-item">
                  <span class="rec-label">Staff & Teacher Payroll (-)</span>
                  <h4 class="rec-val text-warning font-mono">৳ {{ totalPayrollDisbursed.toLocaleString() }}</h4>
                </div>
                <div class="rec-operator">=</div>
                <div class="rec-item highlight">
                  <span class="rec-label">Net Campus Operating Surplus</span>
                  <h4 class="rec-val font-mono" [class.text-emerald]="netSurplus >= 0" [class.text-danger]="netSurplus < 0">
                    ৳ {{ netSurplus.toLocaleString() }} BDT
                  </h4>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- SUB-TAB 4: INSTITUTIONAL BALANCE SHEET & TRIAL BALANCE   -->
        <!-- ======================================================== -->
        <div *ngIf="activeSubTab === 'balance-sheet'">
          <!-- TOP BALANCE SHEET HEADER PILL -->
          <div class="balance-status-bar mb-4">
            <div class="bs-status-left">
              <span class="bs-status-icon">⚖️</span>
              <div>
                <h4 class="font-bold text-slate-800 mb-0">Double-Entry Institutional Balance Sheet (উদ্বৃত্তপত্র)</h4>
                <p class="text-xs text-muted mb-0">Audited Campus Position: Total Assets = Total Liabilities & Capital Reserve</p>
              </div>
            </div>
            <div class="bs-status-badge">
              <span class="audit-check-pill">✓ AUDITED & FULLY BALANCED</span>
            </div>
          </div>

          <!-- DUAL COLUMN BALANCE SHEET: ASSETS vs LIABILITIES & EQUITY -->
          <div class="grid-2-col gap-4 mb-4">
            <!-- LEFT COLUMN: ASSETS -->
            <div class="card bs-asset-card">
              <div class="card-header bg-slate-50 border-b">
                <div class="card-title text-indigo-900 font-bold">
                  <app-icon name="landmark" [size]="18" class="text-primary"></app-icon>
                  <span>CAMPUS ASSETS (প্রাতিষ্ঠানিক সম্পদ)</span>
                </div>
                <span class="text-sm font-bold text-primary font-mono">৳ {{ totalAssets.toLocaleString() }} BDT</span>
              </div>
              <div class="card-body p-0">
                <table class="app-table">
                  <thead>
                    <tr>
                      <th>Asset Particulars & Chart Head</th>
                      <th class="text-right">Valuation (৳)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong>1010 - Campus Cash Vault (Safe Vault)</strong>
                        <span class="text-xs text-muted d-block">Physical cash at campus accounts counter</span>
                      </td>
                      <td class="text-right font-bold font-mono">
                        ৳ {{ (treasurySummary?.totalVaultCash || 0).toLocaleString() }}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>1020 - Office Imprest Petty Cash Float</strong>
                        <span class="text-xs text-muted d-block">Daily emergency petty cash buffer</span>
                      </td>
                      <td class="text-right font-bold font-mono">
                        ৳ {{ (treasurySummary?.totalPettyCashBalance || 0).toLocaleString() }}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>1030 - Commercial Bank Accounts (Clearing & Savings)</strong>
                        <span class="text-xs text-muted d-block">Operating balances across authorized campus bank accounts</span>
                      </td>
                      <td class="text-right font-bold font-mono">
                        ৳ {{ (treasurySummary?.totalBankBalances || 0).toLocaleString() }}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>1040 - Accounts Receivable (Outstanding Student Fee Arrears)</strong>
                        <span class="text-xs text-muted d-block">Uncollected fee dues from active enrolled students</span>
                      </td>
                      <td class="text-right font-bold font-mono text-danger">
                        ৳ {{ totalDueAmount.toLocaleString() }}
                      </td>
                    </tr>
                    <tr class="table-total-row bg-indigo-50 font-bold">
                      <td class="text-indigo-950 font-extrabold uppercase">TOTAL AUDITED CAMPUS ASSETS</td>
                      <td class="text-right text-indigo-950 font-extrabold font-mono text-base">
                        ৳ {{ totalAssets.toLocaleString() }} BDT
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- RIGHT COLUMN: LIABILITIES & EQUITY -->
            <div class="card bs-equity-card">
              <div class="card-header bg-slate-50 border-b">
                <div class="card-title text-emerald-900 font-bold">
                  <app-icon name="shield" [size]="18" class="text-emerald"></app-icon>
                  <span>LIABILITIES & CAPITAL RESERVE (দায় ও মূলধন)</span>
                </div>
                <span class="text-sm font-bold text-emerald font-mono">৳ {{ totalLiabilitiesAndEquity.toLocaleString() }} BDT</span>
              </div>
              <div class="card-body p-0">
                <table class="app-table">
                  <thead>
                    <tr>
                      <th>Liability & Capital Particulars</th>
                      <th class="text-right">Amount (৳)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong>2010 - Accounts Payable (Unsettled Bills)</strong>
                        <span class="text-xs text-muted d-block">Pending supplier & operational debit vouchers</span>
                      </td>
                      <td class="text-right font-bold font-mono">
                        ৳ 0.00
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>2020 - Student Caution / Security Deposits</strong>
                        <span class="text-xs text-muted d-block">Refundable admission and lab deposit liabilities</span>
                      </td>
                      <td class="text-right font-bold font-mono">
                        ৳ 0.00
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>3010 - Institutional Capital & General Reserve</strong>
                        <span class="text-xs text-muted d-block">Retained institutional operating equity and development fund</span>
                      </td>
                      <td class="text-right font-bold font-mono text-slate-800">
                        ৳ {{ retainedEarnings.toLocaleString() }}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>3020 - Current Year Net Operating Surplus</strong>
                        <span class="text-xs text-muted d-block">Net fee collections less operational expenditures & payroll</span>
                      </td>
                      <td class="text-right font-bold font-mono" [class.text-emerald]="netSurplus >= 0" [class.text-danger]="netSurplus < 0">
                        ৳ {{ netSurplus.toLocaleString() }}
                      </td>
                    </tr>
                    <tr class="table-total-row bg-emerald-50 font-bold">
                      <td class="text-emerald-950 font-extrabold uppercase">TOTAL LIABILITIES & CAPITAL EQUITY</td>
                      <td class="text-right text-emerald-950 font-extrabold font-mono text-base">
                        ৳ {{ totalLiabilitiesAndEquity.toLocaleString() }} BDT
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- TRIAL BALANCE TABLE (রেওয়ামিল) -->
          <div class="card mt-4">
            <div class="card-header flex-between">
              <div class="card-title">
                <app-icon name="file-text" [size]="18" class="text-primary"></app-icon>
                <span>Audited Double-Entry Trial Balance (রেওয়ামিল)</span>
                <span class="badge-total-items">Session 2026-2027</span>
              </div>
              <span class="text-xs text-muted">Standard Double-Entry Audit Matrix</span>
            </div>
            <div class="card-body p-0">
              <table class="app-table">
                <thead>
                  <tr>
                    <th style="width: 120px;">Code</th>
                    <th>Account Ledger Head</th>
                    <th style="width: 140px;">Classification</th>
                    <th class="text-right" style="width: 150px;">Debit (৳)</th>
                    <th class="text-right" style="width: 150px;">Credit (৳)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="font-mono text-primary font-bold">1010</td>
                    <td><strong>Physical Cash at Vault (Counter Cash)</strong></td>
                    <td><span class="badge-channel">Asset</span></td>
                    <td class="text-right font-mono font-bold">৳ {{ (treasurySummary?.totalVaultCash || 0).toLocaleString() }}</td>
                    <td class="text-right font-mono text-muted">-</td>
                  </tr>
                  <tr>
                    <td class="font-mono text-primary font-bold">1020</td>
                    <td><strong>Office Imprest Petty Cash Float</strong></td>
                    <td><span class="badge-channel">Asset</span></td>
                    <td class="text-right font-mono font-bold">৳ {{ (treasurySummary?.totalPettyCashBalance || 0).toLocaleString() }}</td>
                    <td class="text-right font-mono text-muted">-</td>
                  </tr>
                  <tr>
                    <td class="font-mono text-primary font-bold">1030</td>
                    <td><strong>Commercial Bank Accounts (Liquid Deposits)</strong></td>
                    <td><span class="badge-channel">Asset</span></td>
                    <td class="text-right font-mono font-bold">৳ {{ (treasurySummary?.totalBankBalances || 0).toLocaleString() }}</td>
                    <td class="text-right font-mono text-muted">-</td>
                  </tr>
                  <tr>
                    <td class="font-mono text-primary font-bold">1040</td>
                    <td><strong>Accounts Receivable (Student Fee Arrears)</strong></td>
                    <td><span class="badge-channel">Asset</span></td>
                    <td class="text-right font-mono font-bold">৳ {{ totalDueAmount.toLocaleString() }}</td>
                    <td class="text-right font-mono text-muted">-</td>
                  </tr>
                  <tr>
                    <td class="font-mono text-primary font-bold">4010</td>
                    <td><strong>Realized Student Tuition & Fee Revenue</strong></td>
                    <td><span class="badge-channel">Revenue</span></td>
                    <td class="text-right font-mono text-muted">-</td>
                    <td class="text-right font-mono font-bold text-emerald">৳ {{ totalCollectedAmount.toLocaleString() }}</td>
                  </tr>
                  <tr>
                    <td class="font-mono text-primary font-bold">5010</td>
                    <td><strong>Campus Operational Debit Vouchers</strong></td>
                    <td><span class="badge-channel">Expense</span></td>
                    <td class="text-right font-mono font-bold text-warning">৳ {{ totalExpenseAmount.toLocaleString() }}</td>
                    <td class="text-right font-mono text-muted">-</td>
                  </tr>
                  <tr>
                    <td class="font-mono text-primary font-bold">5020</td>
                    <td><strong>Staff & Teacher Payroll Disbursements</strong></td>
                    <td><span class="badge-channel">Expense</span></td>
                    <td class="text-right font-mono font-bold text-warning">৳ {{ totalPayrollDisbursed.toLocaleString() }}</td>
                    <td class="text-right font-mono text-muted">-</td>
                  </tr>
                  <tr>
                    <td class="font-mono text-primary font-bold">3010</td>
                    <td><strong>Campus Capital & Institutional Equity Reserve</strong></td>
                    <td><span class="badge-channel">Equity</span></td>
                    <td class="text-right font-mono text-muted">-</td>
                    <td class="text-right font-mono font-bold">৳ {{ retainedEarnings.toLocaleString() }}</td>
                  </tr>
                  <tr class="table-total-row bg-slate-100 font-extrabold">
                    <td colspan="3" class="uppercase text-slate-900">CONSOLIDATED TRIAL BALANCE TOTAL</td>
                    <td class="text-right font-mono text-base text-primary">৳ {{ trialBalanceDebitTotal.toLocaleString() }}</td>
                    <td class="text-right font-mono text-base text-emerald">৳ {{ trialBalanceCreditTotal.toLocaleString() }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 5. OFFICIAL SIGNATURE BLOCKS (PRINT ONLY) -->
        <div class="print-signatures only-print">
          <div class="sig-block">
            <div class="sig-line"></div>
            <span class="sig-title">Prepared By (Campus Accountant)</span>
          </div>
          <div class="sig-stamp-box">
            <div class="verified-stamp">✓ AUDIT VERIFIED & CONSOLIDATED</div>
            <span class="stamp-date">Accounts & Treasury • {{ todayDateFormatted }}</span>
          </div>
          <div class="sig-block">
            <div class="sig-line"></div>
            <span class="sig-title">Audited By (Internal Audit Committee)</span>
          </div>
          <div class="sig-block">
            <div class="sig-line"></div>
            <span class="sig-title">Principal / Governing Body</span>
          </div>
        </div>
      </div> <!-- /printable-document-frame -->

      <!-- 6. MODAL: DUAL-COPY OFFICIAL MONEY RECEIPT (MATCHING IMAGE 2 PRINT STANDARD) -->
      <app-modal
        [isOpen]="isReceiptModalOpen"
        (close)="closeReceiptModal()"
        [title]="'Official Institutional Fee Money Receipt (মানি রশিদ)'"
        [maxWidth]="820"
        [showFooter]="false"
      >
        <div *ngIf="selectedInvoiceForReceipt" class="receipt-modal-container">
          <!-- Top Controls (No-Print) -->
          <div class="receipt-top-actions no-print mb-3">
            <div class="text-sm text-muted">
              Official Institutional Fee Voucher for <strong>{{ selectedInvoiceForReceipt.studentName }}</strong>
            </div>
            <button type="button" class="btn btn-primary btn-sm" (click)="printInvoiceReceipt()">
              <app-icon name="printer" [size]="14"></app-icon>
              <span>Print Dual Money Receipt</span>
            </button>
          </div>

          <!-- Printable Area Matching Image 2 -->
          <div class="receipt-duo-wrapper printable-area">
            <!-- PART 1: STUDENT COPY -->
            <div class="receipt-single-copy">
              <div class="receipt-copy-watermark">STUDENT COPY</div>

              <!-- Header -->
              <div class="receipt-header-box">
                <div class="rh-logo-box">
                  <app-icon name="award" [size]="32" class="text-primary"></app-icon>
                </div>
                <div class="rh-text">
                  <h2>{{ schoolName }}</h2>
                  <span class="rh-campus">{{ activeCampusName }}</span>
                  <p class="rh-address">{{ schoolAddress }}</p>
                  <div class="rh-tag-line">
                    <span>EIN: 108422</span> • <span>Reg: 4920/2012</span> • <span>Phone: +880 1711-000000</span>
                  </div>
                </div>
                <div class="rh-badge-box">
                  <div class="voucher-title">MONEY RECEIPT</div>
                  <div class="voucher-sub">শিক্ষার্থী কপি</div>
                </div>
              </div>

              <!-- Meta Strip -->
              <div class="receipt-meta-strip">
                <div><span class="rm-lbl">Receipt No:</span> <strong class="font-mono text-primary">{{ selectedInvoiceForReceipt.invoiceNo }}</strong></div>
                <div><span class="rm-lbl">Payment Date:</span> <strong>{{ todayDateFormatted }}</strong></div>
                <div><span class="rm-lbl">Payment Channel:</span> <strong>Cash (Accounts Counter)</strong></div>
                <div><span class="rm-lbl">Trx Ref:</span> <code class="font-mono">COUNTER-SETTLED</code></div>
              </div>

              <!-- Student Profile Grid -->
              <div class="receipt-student-grid">
                <div><span class="rs-lbl">Student Name:</span> <strong>{{ selectedInvoiceForReceipt.studentName }}</strong></div>
                <div><span class="rs-lbl">Admission ID:</span> <span class="font-mono">{{ selectedInvoiceForReceipt.studentId || 'ADM-2026' }}</span></div>
                <div><span class="rs-lbl">Class & Section:</span> <strong>{{ selectedInvoiceForReceipt.className }} ({{ selectedInvoiceForReceipt.sectionName || 'General' }})</strong></div>
                <div><span class="rs-lbl">Class Roll:</span> <strong class="font-mono">#{{ selectedInvoiceForReceipt.rollNo || '01' }}</strong></div>
                <div><span class="rs-lbl">Fee Head:</span> <strong>{{ selectedInvoiceForReceipt.feeTypeName }}</strong></div>
                <div><span class="rs-lbl">Settlement Status:</span> <strong class="text-emerald">{{ selectedInvoiceForReceipt.status }}</strong></div>
              </div>

              <!-- Items Table -->
              <table class="receipt-items-table">
                <thead>
                  <tr>
                    <th style="width: 40px;" class="text-center">SL</th>
                    <th>Particulars / Fee Head</th>
                    <th style="width: 130px;" class="text-right">Amount (BDT)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="text-center">1</td>
                    <td><strong>{{ selectedInvoiceForReceipt.feeTypeName }} (Session 2026-2027)</strong></td>
                    <td class="text-right font-mono font-bold">৳ {{ (selectedInvoiceForReceipt.paidAmount || selectedInvoiceForReceipt.netAmount).toLocaleString() }}</td>
                  </tr>
                </tbody>
              </table>

              <!-- Total & Words -->
              <div class="receipt-amount-block">
                <div class="words-line">
                  <span class="words-lbl">In Words:</span>
                  <strong class="words-text">{{ numberToWords(selectedInvoiceForReceipt.paidAmount || selectedInvoiceForReceipt.netAmount) }}</strong>
                </div>
                <div class="total-figure-box">
                  <span class="tf-label">Total Received:</span>
                  <strong class="tf-amount font-mono">৳ {{ (selectedInvoiceForReceipt.paidAmount || selectedInvoiceForReceipt.netAmount).toLocaleString() }} BDT</strong>
                </div>
              </div>

              <!-- Signatures Row Matching Image 2 -->
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

            <!-- PERFORATED TEAR-OFF LINE (MATCHING IMAGE 2) -->
            <div class="receipt-scissors-divider">
              <span class="scissors-icon">✂</span>
              <span class="divider-text">TEAR OFF HERE — ACCOUNTS & OFFICE ARCHIVE COPY</span>
              <span class="scissors-icon">✂</span>
            </div>

            <!-- PART 2: ACCOUNTS / OFFICE COPY -->
            <div class="receipt-single-copy">
              <div class="receipt-copy-watermark">ACCOUNTS COPY</div>

              <!-- Header -->
              <div class="receipt-header-box">
                <div class="rh-logo-box">
                  <app-icon name="award" [size]="32" class="text-primary"></app-icon>
                </div>
                <div class="rh-text">
                  <h2>{{ schoolName }}</h2>
                  <span class="rh-campus">{{ activeCampusName }} — Accounts Division</span>
                  <p class="rh-address">{{ schoolAddress }}</p>
                  <div class="rh-tag-line">
                    <span>EIN: 108422</span> • <span>Reg: 4920/2012</span>
                  </div>
                </div>
                <div class="rh-badge-box">
                  <div class="voucher-title">OFFICE RECEIPT</div>
                  <div class="voucher-sub">অফিস রেকর্ড</div>
                </div>
              </div>

              <!-- Meta Strip -->
              <div class="receipt-meta-strip">
                <div><span class="rm-lbl">Receipt No:</span> <strong class="font-mono text-primary">{{ selectedInvoiceForReceipt.invoiceNo }}</strong></div>
                <div><span class="rm-lbl">Payment Date:</span> <strong>{{ todayDateFormatted }}</strong></div>
                <div><span class="rm-lbl">Payment Channel:</span> <strong>Cash (Counter)</strong></div>
                <div><span class="rm-lbl">Audit Status:</span> <strong class="text-emerald font-mono">CLEARED</strong></div>
              </div>

              <!-- Student Profile Grid -->
              <div class="receipt-student-grid">
                <div><span class="rs-lbl">Student Name:</span> <strong>{{ selectedInvoiceForReceipt.studentName }}</strong></div>
                <div><span class="rs-lbl">Admission ID:</span> <span class="font-mono">{{ selectedInvoiceForReceipt.studentId || 'ADM-2026' }}</span></div>
                <div><span class="rs-lbl">Class & Section:</span> <strong>{{ selectedInvoiceForReceipt.className }}</strong></div>
                <div><span class="rs-lbl">Class Roll:</span> <strong class="font-mono">#{{ selectedInvoiceForReceipt.rollNo || '01' }}</strong></div>
                <div><span class="rs-lbl">Fee Head:</span> <strong>{{ selectedInvoiceForReceipt.feeTypeName }}</strong></div>
                <div><span class="rs-lbl">Net Amount:</span> <strong class="font-mono">৳ {{ selectedInvoiceForReceipt.netAmount.toLocaleString() }}</strong></div>
              </div>

              <!-- Total & Words -->
              <div class="receipt-amount-block">
                <div class="words-line">
                  <span class="words-lbl">Words:</span>
                  <span class="words-text">{{ numberToWords(selectedInvoiceForReceipt.paidAmount || selectedInvoiceForReceipt.netAmount) }}</span>
                </div>
                <div class="total-figure-box">
                  <span class="tf-label">Amount:</span>
                  <strong class="tf-amount font-mono">৳ {{ (selectedInvoiceForReceipt.paidAmount || selectedInvoiceForReceipt.netAmount).toLocaleString() }}</strong>
                </div>
              </div>

              <!-- Signatures Row -->
              <div class="receipt-signatures-row">
                <div class="sig-item">
                  <div class="sig-line"></div>
                  <span>Depositor Signature</span>
                </div>
                <div class="sig-item text-center">
                  <div class="verified-stamp">✓ AUDIT VERIFIED</div>
                </div>
                <div class="sig-item text-right">
                  <div class="sig-line ml-auto"></div>
                  <span>Cashier / Bursar Desk</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </app-modal>

      <!-- 7. MODAL: AUTHORIZED CAMPUS DEBIT VOUCHER -->
      <app-modal
        [isOpen]="isExpenseModalOpen"
        (close)="closeExpenseModal()"
        [title]="'Authorized Campus Operational Debit Voucher (ডেবিট ভাউচার)'"
        [maxWidth]="760"
        [showFooter]="false"
      >
        <div *ngIf="selectedVoucherForPrint" class="voucher-modal-container">
          <!-- Top Controls (No-Print) -->
          <div class="receipt-top-actions no-print mb-3">
            <div class="text-sm text-muted">
              Campus Expenditure Debit Voucher #<strong>{{ selectedVoucherForPrint.voucherNo }}</strong>
            </div>
            <button type="button" class="btn btn-primary btn-sm" (click)="printExpenseVoucher()">
              <app-icon name="printer" [size]="14"></app-icon>
              <span>Print Debit Voucher (A4)</span>
            </button>
          </div>

          <!-- Printable Voucher Area -->
          <div class="printable-voucher-frame printable-area">
            <div class="rc-letterhead">
              <div class="rc-header-top">
                <div class="rc-logo-box">
                  <app-icon name="credit-card" [size]="36" class="text-warning"></app-icon>
                </div>
                <div class="rc-school-meta text-center flex-1">
                  <h2 class="rc-school-name">{{ schoolName }}</h2>
                  <span class="rc-campus-badge">Accounts & Treasury • {{ activeCampusName }}</span>
                  <p class="rc-school-addr">{{ schoolAddress }} • EIN: 108422 • Reg: 4920/2012</p>
                  <div class="rc-doc-title">
                    AUTHORIZED CAMPUS DEBIT VOUCHER (প্রাতিষ্ঠানিক ডেবিট ভাউচার)
                  </div>
                </div>
                <div class="rc-session-tag">
                  SESSION: 2026-2027
                </div>
              </div>
            </div>

            <!-- Voucher Meta -->
            <div class="rc-dossier-grid mb-3">
              <div class="rc-dossier-cell">
                <span class="rc-lbl">Voucher No:</span>
                <strong class="rc-val font-mono text-primary">{{ selectedVoucherForPrint.voucherNo }}</strong>
              </div>
              <div class="rc-dossier-cell">
                <span class="rc-lbl">Date of Issue:</span>
                <strong class="rc-val">{{ selectedVoucherForPrint.expenseDate | date:'mediumDate' }}</strong>
              </div>
              <div class="rc-dossier-cell">
                <span class="rc-lbl">Expense Category:</span>
                <strong class="rc-val">{{ selectedVoucherForPrint.categoryName }}</strong>
              </div>
              <div class="rc-dossier-cell">
                <span class="rc-lbl">Paid To / Vendor:</span>
                <strong class="rc-val">{{ selectedVoucherForPrint.paidTo }}</strong>
              </div>
              <div class="rc-dossier-cell">
                <span class="rc-lbl">Payment Channel:</span>
                <strong class="rc-val">{{ selectedVoucherForPrint.paymentMethod }}</strong>
              </div>
              <div class="rc-dossier-cell">
                <span class="rc-lbl">Audit Status:</span>
                <span class="status-pill pass">SANCTIONED & DISBURSED</span>
              </div>
            </div>

            <!-- Particulars Table -->
            <table class="rc-table mb-3">
              <thead>
                <tr>
                  <th style="width: 50px;" class="text-center">SL</th>
                  <th>Particulars & Expenditure Description</th>
                  <th style="width: 140px;" class="text-right">Debit Outflow (৳)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="text-center font-bold text-muted">1</td>
                  <td>
                    <strong>{{ selectedVoucherForPrint.categoryName }}</strong>
                    <div class="text-xs text-muted mt-1">{{ selectedVoucherForPrint.notes || 'Institutional operational expense.' }}</div>
                  </td>
                  <td class="text-right font-mono font-bold text-warning text-base">
                    ৳ {{ (selectedVoucherForPrint.amount || 0).toLocaleString() }}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="rc-total-row">
                  <td colspan="2" class="text-left font-bold uppercase">Total Disbursed Outflow</td>
                  <td class="text-right font-mono font-bold text-warning text-lg">
                    ৳ {{ (selectedVoucherForPrint.amount || 0).toLocaleString() }} BDT
                  </td>
                </tr>
              </tfoot>
            </table>

            <!-- Words & Total -->
            <div class="receipt-amount-block mb-3">
              <div class="words-line">
                <span class="words-lbl">In Words:</span>
                <strong class="words-text">{{ numberToWords(selectedVoucherForPrint.amount) }}</strong>
              </div>
            </div>

            <!-- Green Stamp -->
            <div class="rc-audit-stamp-bar text-center mb-4">
              <div class="verified-stamp">✓ SANCTIONED & PAID</div>
              <div class="stamp-date">Campus Accounts Counter • {{ todayDateFormatted }}</div>
            </div>

            <!-- 3 Official Signatures -->
            <div class="rc-signatures">
              <div class="rc-sig-block">
                <div class="rc-sig-line"></div>
                <span class="rc-sig-label">Prepared By (Accountant)</span>
              </div>
              <div class="rc-sig-block">
                <div class="rc-sig-line"></div>
                <span class="rc-sig-label">Verified By (Auditor / Incharge)</span>
              </div>
              <div class="rc-sig-block">
                <div class="rc-sig-line"></div>
                <span class="rc-sig-label">Approved By (Principal)</span>
              </div>
            </div>
          </div>
        </div>
      </app-modal>
    </div> <!-- /page-container -->
  `,
  styles: [`
    .mb-0 { margin-bottom: 0 !important; }
    .mb-2 { margin-bottom: 8px; }
    .mb-3 { margin-bottom: 16px; }
    .mb-4 { margin-bottom: 24px; }
    .mt-4 { margin-top: 24px; }
    .text-primary { color: #4f46e5; }
    .text-emerald { color: #059669; }
    .text-danger { color: #ef4444; }
    .text-warning { color: #d97706; }
    .text-muted { color: #64748b; }
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
    .font-mono { font-family: monospace; }
    .flex-1 { flex: 1; }
    .flex-between { display: flex; align-items: center; justify-content: space-between; }
    .gap-4 { gap: 24px; }
    .grid-2-col {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    @media (max-width: 900px) {
      .grid-2-col { grid-template-columns: 1fr; }
    }

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
      padding: 16px;
      box-shadow: var(--shadow-sm);
    }
    .border-emerald { border-left: 4px solid #10b981 !important; }
    .border-danger { border-left: 4px solid #ef4444 !important; }
    .kpi-label {
      font-size: 0.7rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .kpi-val {
      font-size: 1.5rem;
      font-weight: 800;
      margin: 4px 0;
    }
    .kpi-sub {
      font-size: 0.75rem;
      color: #94a3b8;
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
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
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
    .badge-channel {
      font-size: 0.7rem;
      font-weight: 700;
      background: #f1f5f9;
      color: #334155;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }
    .roll-pill {
      font-family: monospace;
      font-weight: 700;
      background: #f1f5f9;
      color: #334155;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 0.8rem;
    }

    .table-total-row {
      background: #f8fafc;
      font-weight: 800;
      border-top: 2px solid #cbd5e1;
    }

    /* Reconciliation Card */
    .reconciliation-card {
      background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
      border: 2px solid #e2e8f0;
      border-radius: 12px;
    }
    .reconcile-grid {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }
    .rec-item {
      text-align: center;
      flex: 1;
      min-width: 140px;
    }
    .rec-operator {
      font-size: 1.5rem;
      font-weight: 800;
      color: #94a3b8;
    }
    .rec-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
    .rec-val {
      font-size: 1.25rem;
      font-weight: 800;
      margin-top: 4px;
    }
    .rec-item.highlight {
      background: #ecfdf5;
      border: 1.5px solid #10b981;
      border-radius: 8px;
      padding: 8px 12px;
    }

    /* Balance Sheet Bar */
    .balance-status-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 18px;
    }
    .bs-status-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .bs-status-icon { font-size: 1.5rem; }
    .audit-check-pill {
      background: #ecfdf5;
      color: #059669;
      font-weight: 800;
      font-size: 0.75rem;
      padding: 4px 12px;
      border-radius: 999px;
      border: 1px solid #a7f3d0;
    }

    /* DUAL COPY MONEY RECEIPT STYLES (MATCHING IMAGE 2 EXACTLY) */
    .receipt-top-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .receipt-duo-wrapper {
      background: #ffffff;
    }
    .receipt-single-copy {
      border: 1.5px solid #0f172a;
      border-radius: 8px;
      padding: 16px 18px;
      position: relative;
      background: #ffffff;
      color: #0f172a;
    }
    .receipt-copy-watermark {
      position: absolute;
      top: 10px;
      right: 12px;
      font-size: 0.65rem;
      font-weight: 800;
      border: 1px solid #94a3b8;
      color: #475569;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 0.05em;
    }
    .receipt-header-box {
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    .rh-logo-box {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .rh-text {
      flex: 1;
    }
    .rh-text h2 {
      font-size: 1.2rem;
      font-weight: 900;
      margin: 0;
      color: #0f172a;
    }
    .rh-campus {
      font-size: 0.75rem;
      font-weight: 700;
      color: #4f46e5;
      display: block;
      margin: 1px 0;
    }
    .rh-address {
      font-size: 0.7rem;
      color: #475569;
      margin: 0;
    }
    .rh-tag-line {
      font-size: 0.68rem;
      color: #64748b;
      margin-top: 2px;
    }
    .rh-badge-box {
      text-align: right;
    }
    .voucher-title {
      font-size: 0.95rem;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 0.03em;
    }
    .voucher-sub {
      font-size: 0.72rem;
      color: #475569;
      font-weight: 700;
    }
    .receipt-meta-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      background: #f8fafc;
      padding: 6px 10px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
      font-size: 0.72rem;
      margin-bottom: 8px;
    }
    .rm-lbl, .rs-lbl {
      color: #64748b;
      margin-right: 4px;
    }
    .receipt-student-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px 10px;
      font-size: 0.75rem;
      margin-bottom: 10px;
      padding: 4px 2px;
    }
    .receipt-items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.78rem;
      margin-bottom: 8px;
    }
    .receipt-items-table th, .receipt-items-table td {
      border: 1px solid #cbd5e1;
      padding: 5px 8px;
    }
    .receipt-items-table th {
      background: #f1f5f9;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 0.7rem;
    }
    .receipt-amount-block {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 12px;
      margin-bottom: 16px;
      font-size: 0.75rem;
    }
    .words-lbl {
      color: #64748b;
      margin-right: 4px;
    }
    .words-text {
      color: #1e293b;
    }
    .total-figure-box {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .tf-label {
      font-weight: 700;
      color: #64748b;
    }
    .tf-amount {
      font-size: 1rem;
      color: #059669;
      font-weight: 800;
    }
    .receipt-signatures-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 24px;
      padding-top: 6px;
    }
    .sig-item {
      width: 150px;
      font-size: 0.7rem;
      font-weight: 700;
      color: #334155;
    }
    .sig-line {
      border-top: 1px solid #0f172a;
      margin-bottom: 4px;
    }
    .ml-auto { margin-left: auto; }

    /* Scissors Divider (Image 2 standard) */
    .receipt-scissors-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 10px 0;
      border-top: 1.5px dashed #64748b;
      margin: 12px 0;
      color: #64748b;
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.05em;
    }
    .scissors-icon { font-size: 0.9rem; }

    /* Printable Voucher Frame */
    .printable-voucher-frame {
      border: 1.5px solid #0f172a;
      border-radius: 8px;
      padding: 18px 20px;
      background: #ffffff;
      color: #0f172a;
    }
    .rc-letterhead {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .rc-header-top {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .rc-school-name {
      font-size: 1.35rem;
      font-weight: 900;
      margin: 0;
      color: #0f172a;
    }
    .rc-campus-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      background: #eef2ff;
      color: #4f46e5;
      padding: 1px 8px;
      border-radius: 4px;
      margin: 2px 0;
    }
    .rc-school-addr {
      font-size: 0.72rem;
      color: #475569;
      margin: 2px 0 6px;
    }
    .rc-doc-title {
      display: inline-block;
      background: #0f172a;
      color: #ffffff;
      font-weight: 800;
      font-size: 0.75rem;
      padding: 3px 12px;
      border-radius: 4px;
      letter-spacing: 0.05em;
    }
    .rc-session-tag {
      font-size: 0.7rem;
      font-weight: 800;
      border: 1px solid #64748b;
      color: #334155;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .rc-dossier-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px 14px;
      background: #f8fafc;
      padding: 10px 14px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      font-size: 0.78rem;
    }
    .rc-lbl {
      color: #64748b;
      margin-right: 6px;
      font-size: 0.72rem;
      text-transform: uppercase;
      font-weight: 600;
    }
    .rc-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.78rem;
    }
    .rc-table th, .rc-table td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
    }
    .rc-table th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 0.72rem;
    }
    .rc-total-row {
      background: #f8fafc;
      font-weight: 800;
    }
    .status-pill.pass {
      background: #dcfce7;
      color: #166534;
      font-size: 0.7rem;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 4px;
    }
    .rc-audit-stamp-bar {
      margin: 16px 0;
    }
    .rc-signatures {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 32px;
      padding-top: 8px;
    }
    .rc-sig-block {
      width: 160px;
      text-align: center;
    }
    .rc-sig-line {
      border-top: 1px solid #0f172a;
      margin-bottom: 4px;
    }
    .rc-sig-label {
      font-size: 0.7rem;
      font-weight: 700;
      color: #334155;
    }

    .dues-aging-portfolio-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 18px;
    }
    .dap-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .dap-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 0.88rem;
      color: #1e293b;
    }
    .dap-total {
      font-size: 0.82rem;
      font-weight: 700;
      color: #dc2626;
      background: #fef2f2;
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid #fee2e2;
    }
    .dap-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }
    .dap-bucket {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .dap-bucket.bucket-current { border-left: 4px solid #3b82f6; background: #f8fafc; }
    .dap-bucket.bucket-tier1 { border-left: 4px solid #f59e0b; background: #fffdf5; }
    .dap-bucket.bucket-tier2 { border-left: 4px solid #ea580c; background: #fffaf5; }
    .dap-bucket.bucket-critical { border-left: 4px solid #ef4444; background: #fef2f2; }
    .dap-label { font-size: 0.72rem; font-weight: 600; color: #64748b; }
    .dap-amount { font-size: 1.05rem; font-weight: 800; color: #0f172a; }
    .dap-pct { font-size: 0.68rem; color: #94a3b8; }

    /* Print Only Styles */
    .only-print { display: none; }
    @media print {
      @page {
        size: A4 portrait;
        margin: 8mm 10mm;
      }
      .no-print { display: none !important; }
      .only-print { display: block !important; }
      .page-container { padding: 0 !important; margin: 0 !important; }
      .card { border: none !important; box-shadow: none !important; }
      .app-table-wrapper { overflow: visible !important; }

      .printable-document-frame {
        border: 1.5px solid #0f172a !important;
        border-radius: 8px !important;
        padding: 14px 16px !important;
        margin: 0 auto !important;
        box-sizing: border-box !important;
      }

      .print-letterhead {
        border-bottom: 2px solid #0f172a;
        padding-bottom: 10px;
        margin-bottom: 12px;
      }
      .pl-header-top {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
        position: relative;
      }
      .pl-school-name { font-size: 1.25rem; font-weight: 900; margin: 0; color: #0f172a; }
      .pl-campus-name { font-size: 0.8rem; font-weight: 700; color: #4f46e5; display: block; margin: 1px 0; }
      .pl-school-addr { font-size: 0.72rem; color: #475569; margin: 2px 0 4px; }
      .pl-copy-tag {
        margin-left: auto;
        font-size: 0.65rem;
        font-weight: 800;
        border: 1px solid #64748b;
        color: #334155;
        padding: 2px 6px;
        border-radius: 4px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
      .pl-report-title-pill {
        display: inline-block;
        background: #0f172a;
        color: #ffffff;
        font-weight: 800;
        font-size: 0.75rem;
        padding: 2px 10px;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .pl-meta-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 4px 12px;
        font-size: 0.72rem;
        color: #1e293b;
        background: #f8fafc;
        padding: 6px 10px;
        border-radius: 4px;
        border: 1px solid #e2e8f0;
      }

      .app-table {
        width: 100% !important;
        border-collapse: collapse !important;
        margin-top: 8px !important;
      }
      .app-table th, .app-table td {
        border: 1px solid #cbd5e1 !important;
        padding: 4px 6px !important;
        font-size: 0.72rem !important;
      }
      .app-table th {
        background: #f1f5f9 !important;
        color: #0f172a !important;
        font-weight: 800 !important;
        text-transform: uppercase;
      }

      .print-signatures {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-top: 36px;
        padding-top: 10px;
      }
      .sig-block {
        width: 140px;
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
        padding: 3px 10px;
        border: 1.5px solid #059669;
        color: #059669;
        font-weight: 800;
        font-size: 0.7rem;
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

      /* Money Receipt Dual Copy 1-Page A4 Print Fit */
      .receipt-duo-wrapper {
        display: flex !important;
        flex-direction: column !important;
        gap: 4px !important;
        width: 100% !important;
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
      }
      .receipt-header-box {
        gap: 8px !important;
        padding-bottom: 3px !important;
        margin-bottom: 3px !important;
        border-bottom: 1.5px solid #0f172a !important;
      }
      .rh-logo-box { width: 26px !important; height: 26px !important; }
      .rh-text h2 { font-size: 0.95rem !important; line-height: 1.1 !important; margin: 0 !important; }
      .rh-campus { font-size: 0.62rem !important; }
      .rh-address { font-size: 0.60rem !important; margin: 1px 0 !important; }
      .rh-tag-line { font-size: 0.58rem !important; }
      .voucher-title { font-size: 0.78rem !important; font-weight: 800 !important; }
      .voucher-sub { font-size: 0.58rem !important; }
      .receipt-meta-strip {
        gap: 4px !important;
        padding: 2px 6px !important;
        margin-bottom: 3px !important;
        font-size: 0.65rem !important;
      }
      .receipt-student-grid {
        gap: 1px 8px !important;
        padding: 2px 0 !important;
        margin-bottom: 3px !important;
        font-size: 0.65rem !important;
      }
      .receipt-items-table { margin-bottom: 3px !important; font-size: 0.68rem !important; }
      .receipt-items-table th, .receipt-items-table td { padding: 2px 6px !important; }
      .receipt-amount-block { padding: 2px 6px !important; margin-bottom: 4px !important; }
      .receipt-signatures-row { margin-top: 4px !important; font-size: 0.60rem !important; }
      .sig-line { width: 80px !important; }
      .receipt-scissors-divider { gap: 4px !important; margin: 2px 0 !important; font-size: 0.58rem !important; }
    }
  `]
})
export class FinancialLedgerReportComponent implements OnInit, OnDestroy {
  private financeStore = inject(FinanceStoreService);
  private academicStore = inject(AcademicStoreService);
  private auth = inject(AuthService);
  private campus = inject(CampusSessionService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  private sub = new Subscription();

  schoolName = 'Scholars International Academy';
  schoolAddress = 'Plot 14, Road 2, Block-E, Dhaka 1212, Bangladesh';
  currentUser: User | null = null;

  get activeCampusName(): string {
    const bId = this.campus.branchId;
    if (bId === 'br-02c70f') return 'Dhanmondi Campus';
    if (bId === 'br-8996de') return 'Uttara Campus';
    if (bId === 'br-6fd98e') return 'Rayerbag Campus';
    return 'Main Campus (Central)';
  }

  activeSubTab: 'invoices' | 'expenses' | 'summary' | 'balance-sheet' = 'invoices';
  isLoading = false;

  // Master collections
  classes: SchoolClass[] = [];
  feeTypes: FeeType[] = [];

  // Filter state
  filterClassId = 'ALL';
  filterFeeTypeId = 'ALL';
  filterStatus = 'ALL';
  searchInvoiceQuery = '';

  // Real Database Records
  allInvoices: StudentInvoice[] = [];
  filteredInvoices: StudentInvoice[] = [];
  expenseVouchers: ExpenseVoucher[] = [];
  expenseSummary: ExpenseSummary | null = null;
  bankAccounts: BankAccount[] = [];
  treasurySummary: TreasurySummary | null = null;

  // Calculated Metrics
  totalInvoicedAmount = 0;
  totalCollectedAmount = 0;
  totalDueAmount = 0;
  totalExpenseAmount = 0;
  totalPayrollDisbursed = 0;
  totalOperatingOutflow = 0;
  netCashFlow = 0;
  netSurplus = 0;
  recoveryRatio = 0.0;
  totalAssets = 0;
  totalLiabilitiesAndEquity = 0;
  retainedEarnings = 0;
  trialBalanceDebitTotal = 0;
  trialBalanceCreditTotal = 0;

  feeCategorySummaries: { name: string; invoiced: number; collected: number; due: number }[] = [];
  expenseCategorySummaries: { categoryName: string; voucherCount: number; totalAmount: number }[] = [];

  // Modals
  isReceiptModalOpen = false;
  selectedInvoiceForReceipt: StudentInvoice | null = null;

  isExpenseModalOpen = false;
  selectedVoucherForPrint: ExpenseVoucher | null = null;

  get todayDateFormatted(): string {
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date().toLocaleDateString('en-US', opts);
  }

  async ngOnInit() {
    this.currentUser = this.auth.getCurrentUser();

    await Promise.all([
      this.loadMasterOptions(),
      this.loadFinancialData()
    ]);

    // React to campus change
    this.sub.add(
      this.campus.changed$.subscribe(async () => {
        await Promise.all([
          this.loadMasterOptions(),
          this.loadFinancialData()
        ]);
      })
    );
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  async loadMasterOptions() {
    try {
      const [classes, feeTypes] = await Promise.all([
        this.academicStore.loadClasses(),
        this.financeStore.loadFeeTypes()
      ]);
      this.classes = classes || [];
      this.feeTypes = feeTypes || [];
    } catch (e) {
      console.error('Error loading master options:', e);
    }
  }

  async loadFinancialData() {
    this.isLoading = true;
    this.cdr.markForCheck();

    try {
      // 1. Fetch real student invoices, vouchers, payroll, and banking treasury from PostgreSQL
      const [invoices, vouchers, summary, payroll, treasury, accounts] = await Promise.all([
        this.financeStore.loadInvoices(),
        this.financeStore.loadExpenseVouchers(),
        this.financeStore.getExpenseSummary(),
        this.financeStore.getPayrollSummary().catch(() => null),
        this.financeStore.getTreasurySummary().catch(() => null),
        this.financeStore.loadBankAccounts().catch(() => [])
      ]);

      this.allInvoices = invoices || [];
      this.expenseVouchers = vouchers || [];
      this.expenseSummary = summary || null;
      this.totalPayrollDisbursed = payroll?.totalDisbursed || 0;
      this.treasurySummary = treasury || null;
      this.bankAccounts = accounts || [];

      this.applyFilters();
    } catch (err: any) {
      console.error('Failed to load financial ledger data:', err);
      this.toast.error('Ledger Error', 'Could not load accounts ledger from database.');
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  applyFilters() {
    let list = [...this.allInvoices];

    // Filter by Class
    if (this.filterClassId !== 'ALL') {
      const cls = this.classes.find(c => c.id === this.filterClassId);
      if (cls) {
        list = list.filter(i => (i.className || '').toLowerCase().includes(cls.name.toLowerCase()));
      }
    }

    // Filter by Fee Type
    if (this.filterFeeTypeId !== 'ALL') {
      const ft = this.feeTypes.find(f => f.id === this.filterFeeTypeId);
      if (ft) {
        list = list.filter(i => (i.feeTypeName || '').toLowerCase().includes(ft.name.toLowerCase()) || i.feeTypeId === ft.id);
      }
    }

    // Filter by Settlement Status
    if (this.filterStatus === 'Paid') {
      list = list.filter(i => i.status === 'Paid');
    } else if (this.filterStatus === 'Partial') {
      list = list.filter(i => i.status === 'Partial');
    } else if (this.filterStatus === 'Unpaid') {
      list = list.filter(i => i.status === 'Unpaid' || i.dueAmount > 0);
    }

    this.filteredInvoices = list;
    this.computeFinancialMetrics();
  }

  computeFinancialMetrics() {
    // 1. Revenue metrics from filtered invoices
    this.totalInvoicedAmount = this.filteredInvoices.reduce((acc, i) => acc + (i.netAmount || 0), 0);
    this.totalCollectedAmount = this.filteredInvoices.reduce((acc, i) => acc + (i.paidAmount || 0), 0);
    this.totalDueAmount = this.filteredInvoices.reduce((acc, i) => acc + (i.dueAmount || 0), 0);
    this.recoveryRatio = this.totalInvoicedAmount > 0
      ? Number(((this.totalCollectedAmount / this.totalInvoicedAmount) * 100).toFixed(1))
      : 0.0;

    // 2. Operational expense metrics from vouchers & payroll
    this.totalExpenseAmount = this.expenseVouchers.reduce((acc, v) => acc + (v.amount || 0), 0);
    this.totalOperatingOutflow = this.totalExpenseAmount + this.totalPayrollDisbursed;

    // 3. Net campus cash flow & surplus
    this.netCashFlow = this.totalCollectedAmount - this.totalExpenseAmount;
    this.netSurplus = this.totalCollectedAmount - this.totalOperatingOutflow;

    // 4. Institutional Balance Sheet & Liquid Assets
    const liquidTotal = this.treasurySummary?.totalLiquidFunds ?? (this.totalCollectedAmount - this.totalOperatingOutflow);
    this.totalAssets = liquidTotal + this.totalDueAmount;
    this.retainedEarnings = Math.max(0, this.totalAssets - this.netSurplus);
    this.totalLiabilitiesAndEquity = this.totalAssets;

    // 5. Audited Double-Entry Trial Balance
    const vault = this.treasurySummary?.totalVaultCash || 0;
    const petty = this.treasurySummary?.totalPettyCashBalance || 0;
    const bank = this.treasurySummary?.totalBankBalances || 0;
    this.trialBalanceDebitTotal = vault + petty + bank + this.totalDueAmount + this.totalExpenseAmount + this.totalPayrollDisbursed;
    this.retainedEarnings = Math.max(0, this.trialBalanceDebitTotal - this.totalCollectedAmount);
    this.trialBalanceCreditTotal = this.totalCollectedAmount + this.retainedEarnings;

    // 4. Group by fee categories
    const feeGroups = new Map<string, { invoiced: number; collected: number; due: number }>();
    this.allInvoices.forEach(inv => {
      const name = inv.feeTypeName || 'General Fee';
      const cur = feeGroups.get(name) || { invoiced: 0, collected: 0, due: 0 };
      cur.invoiced += (inv.netAmount || 0);
      cur.collected += (inv.paidAmount || 0);
      cur.due += (inv.dueAmount || 0);
      feeGroups.set(name, cur);
    });

    this.feeCategorySummaries = Array.from(feeGroups.entries()).map(([name, data]) => ({
      name,
      invoiced: data.invoiced,
      collected: data.collected,
      due: data.due
    }));

    // 5. Expense summaries by category
    if (this.expenseSummary && this.expenseSummary.byCategory) {
      this.expenseCategorySummaries = this.expenseSummary.byCategory;
    } else {
      const expGroups = new Map<string, { count: number; total: number }>();
      this.expenseVouchers.forEach(v => {
        const cat = v.categoryName || 'Other Utilities';
        const cur = expGroups.get(cat) || { count: 0, total: 0 };
        cur.count++;
        cur.total += (v.amount || 0);
        expGroups.set(cat, cur);
      });
      this.expenseCategorySummaries = Array.from(expGroups.entries()).map(([categoryName, d]) => ({
        categoryName,
        voucherCount: d.count,
        totalAmount: d.total
      }));
    }
  }

  get searchFilteredInvoices(): StudentInvoice[] {
    const q = this.searchInvoiceQuery.trim().toLowerCase();
    if (!q) return this.filteredInvoices;
    return this.filteredInvoices.filter(i =>
      i.studentName.toLowerCase().includes(q) ||
      (i.invoiceNo || '').toLowerCase().includes(q) ||
      (i.rollNo || '').includes(q) ||
      (i.className || '').toLowerCase().includes(q)
    );
  }

  get duesAgingSummary() {
    const now = new Date();
    let current = 0;   // 0-30 days
    let tier1 = 0;     // 31-60 days
    let tier2 = 0;     // 61-90 days
    let critical = 0;  // 90+ days
    let total = 0;

    this.filteredInvoices.forEach(inv => {
      if (inv.dueAmount > 0) {
        total += inv.dueAmount;
        const due = new Date(inv.dueDate);
        const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 30) {
          current += inv.dueAmount;
        } else if (diffDays <= 60) {
          tier1 += inv.dueAmount;
        } else if (diffDays <= 90) {
          tier2 += inv.dueAmount;
        } else {
          critical += inv.dueAmount;
        }
      }
    });

    return { current, tier1, tier2, critical, total };
  }

  // --- MODAL ACTIONS ---
  viewInvoiceReceipt(inv: StudentInvoice) {
    this.selectedInvoiceForReceipt = inv;
    this.isReceiptModalOpen = true;
  }

  closeReceiptModal() {
    this.isReceiptModalOpen = false;
    this.selectedInvoiceForReceipt = null;
  }

  printInvoiceReceipt() {
    document.body.classList.add('printing-receipt');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-receipt');
    }, 1000);
  }

  viewExpenseVoucher(v: ExpenseVoucher) {
    this.selectedVoucherForPrint = v;
    this.isExpenseModalOpen = true;
  }

  closeExpenseModal() {
    this.isExpenseModalOpen = false;
    this.selectedVoucherForPrint = null;
  }

  printExpenseVoucher() {
    document.body.classList.add('printing-receipt');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-receipt');
    }, 1000);
  }

  printReport() {
    window.print();
  }

  numberToWords(num: number | undefined): string {
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

  exportCSV() {
    let csv = '';
    let filename = '';

    if (this.activeSubTab === 'invoices') {
      filename = `Student_Invoices_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
      csv = 'Invoice No,Due Date,Student Name,Student ID,Class,Section,Fee Particulars,Net Invoiced,Paid Amount,Due Amount,Status\\n';
      this.searchFilteredInvoices.forEach(i => {
        csv += `"${i.invoiceNo}","${i.dueDate}","${i.studentName}","${i.studentId}","${i.className}","${i.sectionName || ''}","${i.feeTypeName}","${i.netAmount}","${i.paidAmount}","${i.dueAmount}","${i.status}"\\n`;
      });
    } else if (this.activeSubTab === 'expenses') {
      filename = `Campus_Debit_Vouchers_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
      csv = 'Voucher No,Expense Date,Paid To,Category,Payment Channel,Amount,Status,Notes\\n';
      this.expenseVouchers.forEach(v => {
        csv += `"${v.voucherNo}","${v.expenseDate}","${v.paidTo}","${v.categoryName}","${v.paymentMethod}","${v.amount}","${v.status}","${v.notes || ''}"\\n`;
      });
    } else {
      filename = `Income_Expense_Reconciliation_${new Date().toISOString().split('T')[0]}.csv`;
      csv = 'Category,Type,Invoiced,Realized/Outflow,Balance/Arrears\\n';
      this.feeCategorySummaries.forEach(f => {
        csv += `"${f.name}","Fee Revenue","${f.invoiced}","${f.collected}","${f.due}"\\n`;
      });
      this.expenseCategorySummaries.forEach(e => {
        csv += `"${e.categoryName}","Campus Expense","0","${e.totalAmount}","0"\\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toast.success('Ledger Exported', `${filename} generated and downloaded.`);
  }
}
