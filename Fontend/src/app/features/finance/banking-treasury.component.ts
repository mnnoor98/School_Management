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
import { ModalComponent } from '../../shared/components/modal.component';
import { BankAccount, BankTransaction, PettyCashVoucher, TreasurySummary, User, ExpenseCategory, Teacher } from '../../core/models';

@Component({
  selector: 'app-banking-treasury',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent, ModalComponent],
  template: `
    <div class="page-container">
      <!-- 1. OFFICIAL INSTITUTION PRINT LETTERHEAD (ONLY PRINT) -->
      <div class="print-letterhead only-print">
        <div class="pl-header-top">
          <div class="pl-logo-box">
            <app-icon name="landmark" [size]="40" class="text-primary"></app-icon>
          </div>
          <div class="pl-school-meta">
            <h1 class="pl-school-name">{{ schoolName }} ({{ activeCampusName }})</h1>
            <p class="pl-school-addr">{{ schoolAddress }} • EIN: 108422 • Reg: 4920/2012 • Phone: +880 1711-000000</p>
            <div class="pl-report-title-pill">
              OFFICIAL TREASURY & BANK TRANSACTION STATEMENT (ব্যাংক হিসাব ও ট্রেজারি বিবরণী)
            </div>
          </div>
          <div class="pl-copy-tag">BANK & AUDIT ARCHIVE</div>
        </div>
        <div class="pl-meta-grid">
          <div><strong>Academic Session:</strong> 2026 - 2027</div>
          <div><strong>Treasury Division:</strong> Campus Accounts & Safe Vault</div>
          <div><strong>Statement Date:</strong> {{ todayDateFormatted }}</div>
          <div><strong>Audit Clearance:</strong> Double-Entry Bank Bookkeeping Standard</div>
          <div><strong>Total Liquid Assets:</strong> ৳ {{ summary?.totalLiquidFunds?.toLocaleString() || '0' }} BDT</div>
          <div><strong>Commercial Bank Balances:</strong> ৳ {{ summary?.totalBankBalances?.toLocaleString() || '0' }} BDT</div>
          <div><strong>Cash Vault Balance:</strong> ৳ {{ summary?.totalVaultCash?.toLocaleString() || '0' }} BDT</div>
          <div><strong>Petty Cash Fund:</strong> ৳ {{ summary?.totalPettyCashBalance?.toLocaleString() || '0' }} BDT</div>
        </div>
      </div>

      <!-- 2. SCREEN PAGE HEADER (NO-PRINT) -->
      <div class="page-header no-print">
        <div>
          <div class="header-badge">
            <span class="pulse-dot"></span>
            Campus Accounts & Treasury Division
            <span class="campus-pill">{{ activeCampusName }}</span>
          </div>
          <h1 class="page-title">
            <app-icon name="landmark" [size]="28" class="text-primary title-icon"></app-icon>
            Banking, Cash Vault & Treasury Management
          </h1>
          <p class="page-subtitle">
            Commercial bank accounts, cash counter safe vault, deposit slips, fund transfers, and imprest petty cash book.
          </p>
        </div>
        <div class="page-actions flex-wrap gap-2">
          <button type="button" class="btn btn-outline" (click)="openDirectDepositModal()" title="Record incoming bank remittance or cheque credit">
            <app-icon name="plus-circle" [size]="16" class="text-emerald"></app-icon>
            <span>Direct Bank Deposit</span>
          </button>
          <button type="button" class="btn btn-outline" (click)="openDepositModal()" title="Record counter cash safe vault bank deposit">
            <app-icon name="arrow-up-right" [size]="16" class="text-emerald"></app-icon>
            <span>Cash-to-Bank Deposit</span>
          </button>
          <button type="button" class="btn btn-outline" (click)="openWithdrawModal()" title="Withdraw funds or issue cheque debit">
            <app-icon name="arrow-down-left" [size]="16" class="text-danger"></app-icon>
            <span>Cheque Withdrawal</span>
          </button>
          <button type="button" class="btn btn-outline" (click)="openTransferModal()" title="Transfer between institutional accounts">
            <app-icon name="repeat" [size]="16" class="text-indigo"></app-icon>
            <span>Inter-Bank Transfer</span>
          </button>
          <button type="button" class="btn btn-outline" (click)="openPettyCashModal()" title="Issue new petty cash expense voucher">
            <app-icon name="wallet" [size]="16" class="text-warning"></app-icon>
            <span>Issue Petty Cash</span>
          </button>
          <button type="button" class="btn btn-outline text-indigo" (click)="openImportMasterModal()" title="Database Master & Bulk Import for Dropdowns">
            <app-icon name="database" [size]="16" class="text-indigo"></app-icon>
            <span>DB Masters & Import</span>
          </button>
          <button type="button" class="btn btn-primary" (click)="openNewAccountModal()" title="Open new institutional account">
            <app-icon name="plus" [size]="16"></app-icon>
            <span>Open Bank Account</span>
          </button>
        </div>
      </div>

      <!-- 3. TOP TREASURY KPI STRIP (NO-PRINT) -->
      <div class="kpi-strip mb-4 no-print" *ngIf="summary">
        <div class="kpi-box border-indigo">
          <span class="kpi-label">Total Liquid Assets</span>
          <h3 class="kpi-val text-primary">৳ {{ summary.totalLiquidFunds.toLocaleString() }}</h3>
          <span class="kpi-sub">Total Capital across all accounts</span>
        </div>
        <div class="kpi-box border-emerald">
          <span class="kpi-label">Commercial Bank Balances</span>
          <h3 class="kpi-val text-emerald">৳ {{ summary.totalBankBalances.toLocaleString() }}</h3>
          <span class="kpi-sub">Sonali, DBBL & Online accounts</span>
        </div>
        <div class="kpi-box border-amber">
          <span class="kpi-label">Counter Cash in Vault</span>
          <h3 class="kpi-val text-warning">৳ {{ summary.totalVaultCash.toLocaleString() }}</h3>
          <span class="kpi-sub">Physical Cash Safe Float</span>
        </div>
        <div class="kpi-box border-blue">
          <span class="kpi-label">Imprest Petty Cash</span>
          <h3 class="kpi-val text-indigo">৳ {{ summary.totalPettyCashBalance.toLocaleString() }}</h3>
          <span class="kpi-sub">Office daily expense float</span>
        </div>
        <div class="kpi-box border-slate">
          <span class="kpi-label">Monthly Bank Deposits</span>
          <h3 class="kpi-val text-slate">৳ {{ summary.totalMonthlyDeposits.toLocaleString() }}</h3>
          <span class="kpi-sub">{{ summary.activeAccountsCount }} Active Accounts • {{ summary.pendingPettyCashCount }} Pending Petty Vouchers</span>
        </div>
      </div>

      <!-- 4. SUB-TABS NAVIGATION (NO-PRINT) -->
      <div class="tabs-nav mb-4 no-print">
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab === 'accounts'"
          (click)="activeTab = 'accounts'"
        >
          <app-icon name="landmark" [size]="16"></app-icon>
          <span>Bank Accounts & Vaults ({{ accounts.length }})</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab === 'ledger'"
          (click)="activeTab = 'ledger'"
        >
          <app-icon name="receipt" [size]="16"></app-icon>
          <span>Banking Transaction Ledger ({{ transactions.length }})</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab === 'petty-cash'"
          (click)="activeTab = 'petty-cash'"
        >
          <app-icon name="wallet" [size]="16"></app-icon>
          <span>Petty Cash Imprest Book ({{ pettyCashVouchers.length }})</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab === 'reconciliation'"
          (click)="activeTab = 'reconciliation'"
        >
          <app-icon name="check-circle" [size]="16"></app-icon>
          <span>Bank Reconciliation (ব্যাংক রিকনসিলিয়েশন)</span>
        </button>
      </div>

      <!-- ======================================================== -->
      <!-- TAB 1: BANK ACCOUNTS & CASH VAULTS                       -->
      <!-- ======================================================== -->
      <div *ngIf="activeTab === 'accounts'">
        <div class="accounts-grid mb-4">
          <div *ngFor="let acc of accounts" class="account-card" [class.is-default]="acc.isDefaultForTuition" [class.is-inactive]="!acc.isActive">
            <div class="account-card-header">
              <div class="acc-type-badge" [ngClass]="getAccountTypeBadgeClass(acc.accountType)">
                {{ getAccountTypeLabel(acc.accountType) }}
              </div>
              <span *ngIf="acc.isDefaultForTuition" class="default-tuition-pill" title="Default account for tuition fees">
                <app-icon name="check-circle" [size]="12"></app-icon> Tuition Default
              </span>
              <span *ngIf="!acc.isActive" class="inactive-pill">Inactive / Closed</span>
            </div>

            <div class="acc-main-info">
              <h3 class="acc-name">{{ acc.accountName }}</h3>
              <p class="acc-bank">{{ acc.bankName }} • {{ acc.branchName }}</p>
              <div class="acc-no-box font-mono">
                <app-icon name="credit-card" [size]="14" class="text-muted"></app-icon>
                <span>{{ acc.accountNumber }}</span>
              </div>
            </div>

            <div class="acc-balance-section">
              <span class="balance-label">Current Ledger Balance</span>
              <h2 class="balance-val" [class.text-emerald]="acc.currentBalance > 0" [class.text-danger]="acc.currentBalance <= 0">
                ৳ {{ acc.currentBalance.toLocaleString() }} <small class="text-xs">{{ acc.currency }}</small>
              </h2>
              <span class="text-xs text-muted" *ngIf="acc.routingNumber">Routing: {{ acc.routingNumber }} • Swift: {{ acc.swiftCode || 'N/A' }}</span>
              <p class="text-xs text-muted mb-0 mt-1" *ngIf="acc.notes"><em>{{ acc.notes }}</em></p>
            </div>

            <div class="account-card-actions no-print flex-wrap gap-1">
              <button type="button" class="btn btn-xs btn-outline" (click)="openQuickDeposit(acc)" title="Record direct deposit to this account">
                <app-icon name="arrow-down-left" [size]="13" class="text-emerald"></app-icon>
                <span>Deposit</span>
              </button>
              <button type="button" class="btn btn-xs btn-outline" (click)="openQuickWithdraw(acc)" title="Record cheque withdrawal from this account">
                <app-icon name="arrow-up-right" [size]="13" class="text-danger"></app-icon>
                <span>Withdraw</span>
              </button>
              <button type="button" class="btn btn-xs btn-outline" (click)="filterByAccount(acc.id)" title="View transaction ledger">
                <app-icon name="history" [size]="13"></app-icon>
                <span>Ledger</span>
              </button>
              <button type="button" class="btn btn-xs btn-outline text-indigo" (click)="openEditAccountModal(acc)" title="Edit account details">
                <app-icon name="edit" [size]="13"></app-icon>
                <span>Edit</span>
              </button>
              <button
                type="button"
                class="btn btn-xs btn-outline"
                [class.text-danger]="acc.isActive"
                [class.text-emerald]="!acc.isActive"
                (click)="toggleAccountStatus(acc)"
                title="{{ acc.isActive ? 'Deactivate this account' : 'Reactivate this account' }}"
              >
                <app-icon [name]="acc.isActive ? 'power' : 'check-circle'" [size]="13"></app-icon>
                <span>{{ acc.isActive ? 'Deactivate' : 'Activate' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- TAB 2: BANKING TRANSACTION LEDGER                        -->
      <!-- ======================================================== -->
      <div *ngIf="activeTab === 'ledger'">
        <div class="card mb-4 filter-card no-print">
          <div class="card-body">
            <div class="filter-grid-5">
              <div class="form-group mb-0">
                <label class="form-label font-bold">Filter By Bank / Vault</label>
                <select class="form-select" [(ngModel)]="filterBankAccountId" (change)="applyFilters()">
                  <option value="ALL">All Accounts & Vaults ({{ accounts.length }})</option>
                  <option *ngFor="let a of accounts" [value]="a.id">{{ a.accountName }} (৳ {{ a.currentBalance.toLocaleString() }})</option>
                </select>
              </div>

              <div class="form-group mb-0">
                <label class="form-label font-bold">Transaction Type</label>
                <select class="form-select" [(ngModel)]="filterTransactionType" (change)="applyFilters()">
                  <option value="ALL">All Types</option>
                  <option *ngFor="let t of availableTransactionTypes" [value]="t.value">{{ t.label }}</option>
                </select>
              </div>

              <div class="form-group mb-0">
                <label class="form-label font-bold">From Date</label>
                <input type="date" class="form-control" [(ngModel)]="filterFromDate" (change)="applyFilters()" />
              </div>

              <div class="form-group mb-0">
                <label class="form-label font-bold">To Date</label>
                <input type="date" class="form-control" [(ngModel)]="filterToDate" (change)="applyFilters()" />
              </div>

              <div class="form-group mb-0">
                <label class="form-label font-bold">Search Particulars / Ref #</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Slip no, cheque, party..."
                  [(ngModel)]="searchLedgerQuery"
                  (input)="applyFilters()"
                />
              </div>
            </div>

            <div class="flex justify-between items-center mt-3 pt-2 border-top">
              <span class="text-sm text-muted">
                Showing <strong>{{ filteredTransactions.length }}</strong> of <strong>{{ transactions.length }}</strong> recorded transactions
              </span>
              <div class="flex gap-2">
                <button type="button" class="btn btn-sm btn-outline" (click)="resetFilters()">
                  <app-icon name="x" [size]="14"></app-icon>
                  <span>Reset Filters</span>
                </button>
                <button type="button" class="btn btn-sm btn-outline" (click)="printReport()" title="Print Ledger Statement">
                  <app-icon name="printer" [size]="14"></app-icon>
                  <span>Print Advice (A4)</span>
                </button>
                <button type="button" class="btn btn-sm btn-primary" (click)="loadAllData()">
                  <app-icon name="refresh-cw" [size]="14"></app-icon>
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header flex-between flex-wrap gap-2">
            <div class="card-title">
              <app-icon name="receipt" [size]="18" class="text-primary"></app-icon>
              <span>Banking & Vault Transaction History</span>
              <span class="badge-total-items">{{ filteredTransactions.length }} Entries</span>
            </div>
            <button type="button" class="btn btn-sm btn-outline no-print" (click)="exportCSV()">
              <app-icon name="download" [size]="14"></app-icon>
              <span>Export CSV</span>
            </button>
          </div>

          <div class="app-table-wrapper">
            <table class="app-table">
              <thead>
                <tr>
                  <th style="width: 140px;">Date & Time</th>
                  <th>Bank / Account</th>
                  <th style="width: 140px;">Type</th>
                  <th style="width: 130px;" class="text-right">Amount (BDT)</th>
                  <th style="width: 140px;" class="text-right">Balance After</th>
                  <th style="width: 140px;">Ref / Slip No</th>
                  <th style="min-width: 220px;">Description / Particulars</th>
                  <th style="width: 110px;" class="no-print text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let tx of filteredTransactions">
                  <td class="font-mono text-xs text-muted">{{ tx.transactionDate | date:'mediumDate' }}</td>
                  <td>
                    <strong>{{ tx.accountName }}</strong>
                    <span class="text-xs text-muted d-block font-mono">{{ tx.bankName }} ({{ tx.accountNumber }})</span>
                  </td>
                  <td>
                    <span class="tx-badge" [ngClass]="getTxBadgeClass(tx.transactionType)">
                      {{ formatTxType(tx.transactionType) }}
                    </span>
                  </td>
                  <td class="text-right font-mono" [class.text-emerald]="isCreditTx(tx.transactionType)" [class.text-danger]="!isCreditTx(tx.transactionType)">
                    <strong>{{ isCreditTx(tx.transactionType) ? '+' : '-' }} ৳ {{ tx.amount.toLocaleString() }}</strong>
                  </td>
                  <td class="text-right font-mono font-bold">
                    ৳ {{ tx.balanceAfter.toLocaleString() }}
                  </td>
                  <td>
                    <span class="slip-pill font-mono">{{ tx.referenceNo || 'N/A' }}</span>
                  </td>
                  <td>
                    <span>{{ tx.description }}</span>
                    <span *ngIf="tx.counterpartyOrAccount" class="text-xs text-muted d-block">Party: {{ tx.counterpartyOrAccount }}</span>
                  </td>
                  <td class="text-center no-print">
                    <button type="button" class="btn btn-xs btn-outline" (click)="viewAdviceSlip(tx)" title="View and print official transaction voucher">
                      <app-icon name="printer" [size]="12"></app-icon>
                      <span>Slip</span>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="filteredTransactions.length === 0">
                  <td colspan="8" class="text-center py-5 text-muted">
                    No transactions recorded for this criteria.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- TAB 3: PETTY CASH IMPREST BOOK                           -->
      <!-- ======================================================== -->
      <div *ngIf="activeTab === 'petty-cash'">
        <div class="card mb-4 filter-card no-print">
          <div class="card-body flex-between flex-wrap gap-3">
            <div>
              <h4 class="font-bold text-slate-800 m-0">Daily Imprest Petty Cash Float</h4>
              <p class="text-sm text-muted m-0">
                Minor expenses, hospitality, courier, and office supplies managed on imprest float from physical cash safe.
              </p>
            </div>
            <div class="flex gap-2">
              <button type="button" class="btn btn-outline" (click)="openAddCategoryModal()" title="Add new expense category to database">
                <app-icon name="folder-plus" [size]="16" class="text-indigo"></app-icon>
                <span>+ New Category</span>
              </button>
              <button type="button" class="btn btn-primary" (click)="openPettyCashModal()">
                <app-icon name="plus" [size]="16"></app-icon>
                <span>New Petty Cash Voucher</span>
              </button>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header flex-between flex-wrap gap-2">
            <div class="card-title">
              <app-icon name="wallet" [size]="18" class="text-warning"></app-icon>
              <span>Petty Cash Expense Register</span>
              <span class="badge-total-items">{{ pettyCashVouchers.length }} Vouchers</span>
            </div>
          </div>

          <div class="app-table-wrapper">
            <table class="app-table">
              <thead>
                <tr>
                  <th style="width: 140px;">Voucher No</th>
                  <th style="width: 120px;">Date</th>
                  <th>Payee / Bearer</th>
                  <th style="width: 160px;">Category</th>
                  <th style="min-width: 220px;">Purpose & Particulars</th>
                  <th style="width: 130px;" class="text-right">Amount (BDT)</th>
                  <th style="width: 110px;" class="text-center">Status</th>
                  <th style="width: 150px;" class="text-center no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of pettyCashVouchers">
                  <td>
                    <span class="font-mono font-bold text-primary">{{ p.voucherNo }}</span>
                  </td>
                  <td class="font-mono text-xs text-muted">{{ p.voucherDate | date:'mediumDate' }}</td>
                  <td><strong>{{ p.payeeName }}</strong></td>
                  <td>
                    <span class="category-pill">{{ p.category }}</span>
                  </td>
                  <td>{{ p.purpose }}</td>
                  <td class="text-right font-mono font-bold text-danger">
                    ৳ {{ p.amount.toLocaleString() }}
                  </td>
                  <td class="text-center">
                    <span class="status-pill" [class.pass]="p.status === 'Reimbursed'" [class.pending]="p.status === 'Approved'">
                      {{ p.status }}
                    </span>
                  </td>
                  <td class="text-center no-print">
                    <div class="flex items-center justify-center gap-1">
                      <button
                        *ngIf="p.status === 'Approved'"
                        type="button"
                        class="btn btn-xs btn-outline text-emerald"
                        (click)="openReimburseModal(p)"
                        title="Reimburse this voucher from commercial bank account"
                      >
                        <app-icon name="check-circle" [size]="12"></app-icon>
                        <span>Reimburse</span>
                      </button>
                      <button type="button" class="btn btn-xs btn-outline" (click)="printPettyCashVoucher(p)" title="Print official voucher">
                        <app-icon name="printer" [size]="12"></app-icon>
                        <span>Voucher</span>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="pettyCashVouchers.length === 0">
                  <td colspan="8" class="text-center py-5 text-muted">
                    No petty cash vouchers issued.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- TAB 4: BANK RECONCILIATION STATEMENT                     -->
      <!-- ======================================================== -->
      <div *ngIf="activeTab === 'reconciliation'">
        <div class="card mb-4 filter-card no-print">
          <div class="card-body">
            <div class="flex-between flex-wrap gap-3">
              <div>
                <h4 class="font-bold text-slate-800 m-0">Monthly Bank Reconciliation Statement (ব্যাংক সমাধান বিবরণী)</h4>
                <p class="text-sm text-muted m-0">Reconcile institutional ledger cash book with commercial bank passbook balance.</p>
              </div>
              <div class="flex gap-2">
                <button type="button" class="btn btn-outline" (click)="autoCalculateReconciliationFromLedger()" title="Auto-detect transit collections and unpresented cheques">
                  <app-icon name="refresh-cw" [size]="14"></app-icon>
                  <span>Auto-Detect from Ledger</span>
                </button>
                <button type="button" class="btn btn-primary" (click)="openReconciliationPrintModal()">
                  <app-icon name="printer" [size]="15"></app-icon>
                  <span>Print Reconciliation Statement (A4)</span>
                </button>
              </div>
            </div>

            <div class="grid-3 mt-3 pt-3 border-top">
              <div class="form-group mb-0">
                <label class="form-label font-bold">Select Commercial Bank Account</label>
                <select class="form-select" [(ngModel)]="reconciliationAccountId" (change)="updateReconciliationData()">
                  <option *ngFor="let a of commercialBankAccounts" [value]="a.id">
                    {{ a.bankName }} ({{ a.accountNumber }}) — Balance: ৳ {{ a.currentBalance.toLocaleString() }}
                  </option>
                </select>
              </div>
              <div class="form-group mb-0">
                <label class="form-label font-bold">As of Statement Date</label>
                <input type="date" class="form-control" [(ngModel)]="reconciliationDate" (change)="updateReconciliationData()" />
              </div>
              <div class="form-group mb-0">
                <label class="form-label font-bold">Audit Reconciliation Status</label>
                <div class="reconciliation-status-banner" [class.unreconciled]="reconciliationVariance !== 0">
                  <span [class.badge-dot-green]="reconciliationVariance === 0" [class.badge-dot-amber]="reconciliationVariance !== 0"></span>
                  <strong *ngIf="reconciliationVariance === 0">RECONCILED & BALANCED (Zero Variance)</strong>
                  <strong *ngIf="reconciliationVariance !== 0">VARIANCE: ৳ {{ reconciliationVariance.toLocaleString() }}</strong>
                </div>
              </div>
            </div>

            <!-- Dynamic Reconciling Adjustments Bar -->
            <div class="rec-inputs-grid mt-3 pt-3 border-top">
              <div class="form-group mb-0">
                <label class="form-label font-bold text-emerald">+ Deposits in Transit (BDT)</label>
                <input type="number" class="form-control font-mono font-bold" [(ngModel)]="reconciliationDepositsInTransit" (input)="onTransitChanged()" placeholder="0.00" />
                <small class="text-xs text-muted">Counter fees deposited but pending clearing</small>
              </div>
              <div class="form-group mb-0">
                <label class="form-label font-bold text-danger">- Outstanding Cheques (BDT)</label>
                <input type="number" class="form-control font-mono font-bold" [(ngModel)]="reconciliationOutstandingCheques" (input)="onChequesChanged()" placeholder="0.00" />
                <small class="text-xs text-muted">Issued vendor/staff cheques unpresented</small>
              </div>
              <div class="form-group mb-0">
                <label class="form-label font-bold text-primary">+ Bank Interest Credited</label>
                <input type="number" class="form-control font-mono" [(ngModel)]="reconciliationInterestEarned" (input)="onInterestChanged()" placeholder="0.00" />
                <small class="text-xs text-muted">Direct interest credited by bank</small>
              </div>
              <div class="form-group mb-0">
                <label class="form-label font-bold text-warning">- Bank Service Charges</label>
                <input type="number" class="form-control font-mono" [(ngModel)]="reconciliationBankCharges" (input)="onChargesChanged()" placeholder="0.00" />
                <small class="text-xs text-muted">Incidental / maintenance charges</small>
              </div>
              <div class="form-group mb-0">
                <label class="form-label font-bold text-slate">Passbook Statement Balance</label>
                <input type="number" class="form-control font-mono font-bold" [(ngModel)]="reconciliationPassbookBalance" (input)="onPassbookChanged()" placeholder="0.00" />
                <small class="text-xs text-muted">Exact balance on bank statement</small>
              </div>
            </div>
          </div>
        </div>

        <div class="reconciliation-summary-grid mb-4" *ngIf="selectedReconcileAccount">
          <div class="rec-card border-left-indigo">
            <span class="rec-card-title">Balance Per Cash Ledger</span>
            <h3 class="rec-card-val text-primary font-mono">৳ {{ selectedReconcileAccount.currentBalance.toLocaleString() }} BDT</h3>
            <span class="text-xs text-muted">Institutional general ledger balance</span>
          </div>
          <div class="rec-card border-left-emerald">
            <span class="rec-card-title">Add: Deposits in Transit</span>
            <h3 class="rec-card-val text-emerald font-mono">+ ৳ {{ depositsInTransit.toLocaleString() }} BDT</h3>
            <span class="text-xs text-muted">Fee receipts awaiting bank credit</span>
          </div>
          <div class="rec-card border-left-amber">
            <span class="rec-card-title">Less: Outstanding Cheques</span>
            <h3 class="rec-card-val text-warning font-mono">- ৳ {{ outstandingCheques.toLocaleString() }} BDT</h3>
            <span class="text-xs text-muted">Issued cheques not yet encashed</span>
          </div>
          <div class="rec-card border-left-emerald">
            <span class="rec-card-title">Adjusted Reconciled Bank Balance</span>
            <h3 class="rec-card-val text-emerald font-mono">৳ {{ adjustedBankBalance.toLocaleString() }} BDT</h3>
            <span class="text-xs text-muted">Matches commercial bank statement</span>
          </div>
        </div>

        <div class="card" *ngIf="selectedReconcileAccount">
          <div class="card-header">
            <div class="card-title">
              <app-icon name="list" [size]="18" class="text-primary"></app-icon>
              <span>Reconciliation Ledger Details for {{ selectedReconcileAccount.accountName }}</span>
            </div>
          </div>
          <div class="card-body">
            <div class="rec-breakdown-table">
              <div class="rec-row header-row">
                <span>Particulars / Item Description</span>
                <span class="text-right">Amount (BDT)</span>
              </div>
              <div class="rec-row">
                <span><strong>1. Balance per Institutional General Ledger Book (As of {{ reconciliationDate }})</strong></span>
                <span class="text-right font-mono font-bold">৳ {{ selectedReconcileAccount.currentBalance.toLocaleString() }}</span>
              </div>
              <div class="rec-row text-emerald">
                <span>&nbsp;&nbsp;&nbsp;&nbsp;+ Add: Counter Collections & Deposits in Transit (Not yet cleared by bank)</span>
                <span class="text-right font-mono font-bold">+ ৳ {{ depositsInTransit.toLocaleString() }}</span>
              </div>
              <div class="rec-row text-warning">
                <span>&nbsp;&nbsp;&nbsp;&nbsp;- Less: Outstanding Cheques Issued (Unpresented for payment)</span>
                <span class="text-right font-mono font-bold">- ৳ {{ outstandingCheques.toLocaleString() }}</span>
              </div>
              <div class="rec-row">
                <span>&nbsp;&nbsp;&nbsp;&nbsp;+ Add: Bank Interest Credited directly into account</span>
                <span class="text-right font-mono font-bold">+ ৳ {{ interestEarned.toLocaleString() }}</span>
              </div>
              <div class="rec-row">
                <span>&nbsp;&nbsp;&nbsp;&nbsp;- Less: Bank Service & Ledger Maintenance Charges</span>
                <span class="text-right font-mono font-bold">- ৳ {{ bankCharges.toLocaleString() }}</span>
              </div>
              <div class="rec-row total-row">
                <span><strong>2. Adjusted Reconciled Balance (Bank Passbook Statement Balance)</strong></span>
                <span class="text-right font-mono font-bold text-emerald">৳ {{ adjustedBankBalance.toLocaleString() }} BDT</span>
              </div>
              <div class="rec-row variance-row" [class.variance-alert]="reconciliationVariance !== 0">
                <span>Reconciliation Discrepancy / Variance (Passbook vs Adjusted)</span>
                <span class="text-right font-mono font-bold" [class.text-emerald]="reconciliationVariance === 0" [class.text-danger]="reconciliationVariance !== 0">
                  {{ reconciliationVariance === 0 ? '৳ 0.00 (Zero Discrepancy - Perfect Audit Balance)' : '⚠️ ৳ ' + reconciliationVariance.toLocaleString() + ' BDT' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. PRINT SIGNATURE BLOCKS (PRINT ONLY) -->
      <div class="print-signatures only-print">
        <div class="sig-block">
          <div class="sig-line"></div>
          <span class="sig-title">Prepared By (Campus Cashier)</span>
        </div>
        <div class="sig-stamp-box">
          <div class="verified-stamp">✓ AUDIT VERIFIED & SETTLED</div>
          <span class="stamp-date">Accounts & Treasury • {{ todayDateFormatted }}</span>
        </div>
        <div class="sig-block">
          <div class="sig-line"></div>
          <span class="sig-title">Verified By (Accounts Officer / Bursar)</span>
        </div>
        <div class="sig-block">
          <div class="sig-line"></div>
          <span class="sig-title">Principal / Head of Institution</span>
        </div>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- MODAL 1: CASH-TO-BANK DEPOSIT (কাউন্টার ক্যাশ ব্যাংকে জমা) -->
    <!-- ======================================================== -->
    <app-modal [isOpen]="isDepositModalOpen" [title]="'Cash-to-Bank Deposit (কাউন্টার ক্যাশ ব্যাংকে জমা)'" [maxWidth]="700" [showFooter]="false" (close)="isDepositModalOpen = false">
      <div class="modal-body p-4">
        <p class="text-sm text-muted mb-3">
          Deposit physical fee collections from the campus Cash Counter Safe Vault into an authorized commercial bank account.
        </p>

        <div class="grid-2-col mb-3">
          <div class="form-group">
            <label class="form-label font-bold">Source Cash Vault</label>
            <input type="text" class="form-control" [value]="vaultAccount?.accountName || 'Campus Cash Counter Safe Vault'" readonly />
            <small class="text-xs text-muted">Available in Safe: ৳ {{ vaultAccount?.currentBalance?.toLocaleString() || '0' }} BDT</small>
          </div>

          <div class="form-group">
            <label class="form-label font-bold">Destination Commercial Bank *</label>
            <select class="form-select" [(ngModel)]="depositDestinationAccountId">
              <option *ngFor="let a of commercialBankAccounts" [value]="a.id">
                {{ a.bankName }} ({{ a.accountNumber }}) — Balance: ৳ {{ a.currentBalance.toLocaleString() }}
              </option>
            </select>
          </div>
        </div>

        <div class="grid-2-col mb-3">
          <div class="form-group">
            <label class="form-label font-bold">Deposit Amount (BDT) *</label>
            <input type="number" class="form-control font-mono font-bold" placeholder="e.g. 50000" [(ngModel)]="depositAmount" />
          </div>

          <div class="form-group">
            <label class="form-label font-bold">Bank Deposit Slip / Cheque No *</label>
            <input type="text" class="form-control font-mono" placeholder="e.g. SLIP-2026-9812" [(ngModel)]="depositSlipNo" />
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label font-bold">Narration / Particulars</label>
          <input type="text" class="form-control" placeholder="e.g. Student tuition counter collection deposit to Sonali Bank" [(ngModel)]="depositDescription" />
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <button type="button" class="btn btn-outline" (click)="isDepositModalOpen = false">Cancel</button>
          <button type="button" class="btn btn-primary" [disabled]="isSubmitting || depositAmount <= 0" (click)="submitCashToBankDeposit()">
            <app-icon *ngIf="!isSubmitting" name="check" [size]="16"></app-icon>
            <span>Confirm Bank Deposit</span>
          </button>
        </div>
      </div>
    </app-modal>

    <!-- ======================================================== -->
    <!-- MODAL 2: DIRECT BANK DEPOSIT (সরাসরি ব্যাংক জমা ও ক্রেডিট) -->
    <!-- ======================================================== -->
    <app-modal [isOpen]="isDirectDepositModalOpen" [title]="'Direct Bank Deposit / Cheque Credit (সরাসরি ব্যাংক জমা ও ক্রেডিট ভাউচার)'" [maxWidth]="680" [showFooter]="false" (close)="isDirectDepositModalOpen = false">
      <div class="modal-body p-4">
        <p class="text-sm text-muted mb-3">
          Record a direct deposit, donor contribution, government subvention, or bank remittance directly credited into an institutional bank account.
        </p>

        <div class="grid-2-col mb-3">
          <div class="form-group">
            <label class="form-label font-bold">Target Bank Account *</label>
            <select class="form-select" [(ngModel)]="directDepositAccountId">
              <option *ngFor="let a of commercialBankAccounts" [value]="a.id">
                {{ a.bankName }} ({{ a.accountNumber }}) — Balance: ৳ {{ a.currentBalance.toLocaleString() }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label font-bold">Deposit Amount (BDT) *</label>
            <input type="number" class="form-control font-mono font-bold" placeholder="e.g. 75000" [(ngModel)]="directDepositAmount" />
          </div>
        </div>

        <div class="grid-2-col mb-3">
          <div class="form-group">
            <label class="form-label font-bold">Deposit Slip / Cheque No *</label>
            <input type="text" class="form-control font-mono" placeholder="e.g. SLIP-2026-7788" [(ngModel)]="directDepositSlipNo" />
          </div>

          <div class="form-group">
            <label class="form-label font-bold">Depositor / Source Party *</label>
            <input type="text" class="form-control" placeholder="e.g. Board Subvention / Institutional Donor" [(ngModel)]="directDepositParty" />
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label font-bold">Narration / Particulars *</label>
          <input type="text" class="form-control" placeholder="e.g. Direct bank grant received for science lab equipment" [(ngModel)]="directDepositDescription" />
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <button type="button" class="btn btn-outline" (click)="isDirectDepositModalOpen = false">Cancel</button>
          <button type="button" class="btn btn-primary" [disabled]="isSubmitting || directDepositAmount <= 0 || !directDepositSlipNo" (click)="submitDirectDeposit()">
            <app-icon name="check" [size]="15"></app-icon>
            <span>Confirm Direct Deposit</span>
          </button>
        </div>
      </div>
    </app-modal>

    <!-- ======================================================== -->
    <!-- MODAL 3: BANK WITHDRAWAL / CHEQUE ISSUE (ব্যাংক উত্তোলন) -->
    <!-- ======================================================== -->
    <app-modal [isOpen]="isWithdrawModalOpen" [title]="'Bank Cash Withdrawal & Cheque Leaf Issue (ব্যাংক উত্তোলন ও চেক ইস্যু)'" [maxWidth]="680" [showFooter]="false" (close)="isWithdrawModalOpen = false">
      <div class="modal-body p-4">
        <p class="text-sm text-muted mb-3">
          Issue a cash withdrawal or cheque debit against an authorized institutional commercial bank account.
        </p>

        <div class="grid-2-col mb-3">
          <div class="form-group">
            <label class="form-label font-bold">Source Bank Account *</label>
            <select class="form-select" [(ngModel)]="withdrawAccountId">
              <option *ngFor="let a of commercialBankAccounts" [value]="a.id">
                {{ a.bankName }} ({{ a.accountNumber }}) — Balance: ৳ {{ a.currentBalance.toLocaleString() }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label font-bold">Withdrawal Amount (BDT) *</label>
            <input type="number" class="form-control font-mono font-bold" placeholder="e.g. 25000" [(ngModel)]="withdrawAmount" />
          </div>
        </div>

        <div class="grid-2-col mb-3">
          <div class="form-group">
            <label class="form-label font-bold">Cheque Leaf No / Slip No *</label>
            <input type="text" class="form-control font-mono" placeholder="e.g. CHQ-9908123" [(ngModel)]="withdrawChequeNo" />
          </div>

          <div class="form-group">
            <div class="flex justify-between items-center mb-1">
              <label class="form-label font-bold mb-0">Authorized Bearer *</label>
              <button type="button" class="btn-text-link" (click)="isCustomWithdrawBearer = !isCustomWithdrawBearer">
                {{ isCustomWithdrawBearer ? 'Select Staff' : '+ Custom Bearer' }}
              </button>
            </div>
            <select *ngIf="!isCustomWithdrawBearer" class="form-select" [(ngModel)]="withdrawBearer">
              <option value="" disabled>-- Select Staff from Database --</option>
              <option *ngFor="let t of teachers" [value]="t.fullName">{{ t.fullName }} ({{ t.designation }})</option>
            </select>
            <input *ngIf="isCustomWithdrawBearer" type="text" class="form-control" placeholder="Bearer / Cashier name..." [(ngModel)]="withdrawBearer" />
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label font-bold">Purpose / Particulars *</label>
          <input type="text" class="form-control" placeholder="e.g. Cash counter float replenishment / Staff allowance advance" [(ngModel)]="withdrawPurpose" />
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <button type="button" class="btn btn-outline" (click)="isWithdrawModalOpen = false">Cancel</button>
          <button type="button" class="btn btn-danger" [disabled]="isSubmitting || withdrawAmount <= 0 || !withdrawChequeNo" (click)="submitWithdrawal()">
            <app-icon name="arrow-up-right" [size]="15"></app-icon>
            <span>Execute Withdrawal</span>
          </button>
        </div>
      </div>
    </app-modal>

    <!-- ======================================================== -->
    <!-- MODAL 4: INTER-BANK FUND TRANSFER                        -->
    <!-- ======================================================== -->
    <app-modal [isOpen]="isTransferModalOpen" [title]="'Inter-Account Fund Transfer (অভ্যন্তরীণ তহবিল স্থানান্তর)'" [maxWidth]="640" [showFooter]="false" (close)="isTransferModalOpen = false">
      <div class="modal-body p-4">
        <div class="form-group mb-3">
          <label class="form-label font-bold">From Source Account *</label>
          <select class="form-select" [(ngModel)]="transferFromId">
            <option *ngFor="let a of accounts" [value]="a.id">{{ a.accountName }} (৳ {{ a.currentBalance.toLocaleString() }})</option>
          </select>
        </div>

        <div class="form-group mb-3">
          <label class="form-label font-bold">To Destination Account *</label>
          <select class="form-select" [(ngModel)]="transferToId">
            <option *ngFor="let a of accounts" [value]="a.id" [disabled]="a.id === transferFromId">{{ a.accountName }} (৳ {{ a.currentBalance.toLocaleString() }})</option>
          </select>
        </div>

        <div class="grid-2-col mb-3">
          <div class="form-group">
            <label class="form-label font-bold">Transfer Amount (BDT) *</label>
            <input type="number" class="form-control font-mono font-bold" [(ngModel)]="transferAmount" placeholder="Amount in BDT" />
          </div>
          <div class="form-group">
            <label class="form-label font-bold">Reference / Cheque No</label>
            <input type="text" class="form-control font-mono" [(ngModel)]="transferReference" placeholder="e.g. TR-2026-001" />
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label font-bold">Transfer Purpose</label>
          <input type="text" class="form-control" [(ngModel)]="transferDescription" placeholder="Reason for transfer" />
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <button type="button" class="btn btn-outline" (click)="isTransferModalOpen = false">Cancel</button>
          <button type="button" class="btn btn-primary" [disabled]="isSubmitting || transferAmount <= 0" (click)="submitTransfer()">
            <span>Execute Transfer</span>
          </button>
        </div>
      </div>
    </app-modal>

    <!-- ======================================================== -->
    <!-- MODAL 5: ISSUE PETTY CASH VOUCHER                        -->
    <!-- ======================================================== -->
    <app-modal [isOpen]="isPettyModalOpen" [title]="'Issue Petty Cash Voucher (পেটি ক্যাশ ব্যয় ভাউচার)'" [maxWidth]="640" [showFooter]="false" (close)="isPettyModalOpen = false">
      <div class="modal-body p-4">
        <div class="grid-2-col mb-3">
          <div class="form-group">
            <div class="flex justify-between items-center mb-1">
              <label class="form-label font-bold mb-0">Payee / Bearer Name *</label>
              <button type="button" class="btn-text-link" (click)="isCustomPayee = !isCustomPayee">
                {{ isCustomPayee ? 'Select from Staff DB' : '+ Custom Payee' }}
              </button>
            </div>
            <select *ngIf="!isCustomPayee" class="form-select" [(ngModel)]="pettyPayee">
              <option value="" disabled>-- Select Staff / Faculty from Database --</option>
              <option *ngFor="let t of teachers" [value]="t.fullName">{{ t.fullName }} ({{ t.designation }})</option>
            </select>
            <input *ngIf="isCustomPayee" type="text" class="form-control" placeholder="e.g. Kalam Miah (Peon / Contractor)" [(ngModel)]="pettyPayee" />
          </div>
          <div class="form-group">
            <label class="form-label font-bold">Amount (BDT) *</label>
            <input type="number" class="form-control font-mono font-bold" placeholder="e.g. 850" [(ngModel)]="pettyAmount" />
          </div>
        </div>

        <div class="form-group mb-3">
          <div class="flex justify-between items-center mb-1">
            <label class="form-label font-bold mb-0">Expense Category *</label>
            <button type="button" class="btn-text-link" (click)="openAddCategoryModal()">
              + Add New Category to DB
            </button>
          </div>
          <select class="form-select" [(ngModel)]="pettyCategory">
            <option value="" disabled>-- Select Category from Database --</option>
            <option *ngFor="let c of dbCategories" [value]="c.name">{{ c.name }} ({{ c.code }})</option>
          </select>
        </div>

        <div class="form-group mb-3">
          <label class="form-label font-bold">Purpose / Particulars *</label>
          <textarea class="form-control" rows="3" placeholder="Describe the reason for petty cash disbursement..." [(ngModel)]="pettyPurpose"></textarea>
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <button type="button" class="btn btn-outline" (click)="isPettyModalOpen = false">Cancel</button>
          <button type="button" class="btn btn-primary" [disabled]="isSubmitting || pettyAmount <= 0 || !pettyPayee" (click)="submitPettyCashVoucher()">
            <span>Issue Voucher</span>
          </button>
        </div>
      </div>
    </app-modal>

    <!-- ======================================================== -->
    <!-- MODAL 6: REIMBURSE PETTY CASH VOUCHER                    -->
    <!-- ======================================================== -->
    <app-modal [isOpen]="isReimburseModalOpen" [title]="'Reimburse Petty Cash Voucher (পেটি ক্যাশ ভাউচার পরিশোধ)'" [maxWidth]="600" [showFooter]="false" (close)="isReimburseModalOpen = false">
      <div class="modal-body p-4" *ngIf="selectedVoucherForReimburse">
        <div class="reimburse-card-info mb-3">
          <div class="flex justify-between items-center">
            <div>
              <span class="text-xs text-muted uppercase">Voucher Number</span>
              <h4 class="font-mono text-primary m-0">{{ selectedVoucherForReimburse.voucherNo }}</h4>
            </div>
            <div class="text-right">
              <span class="text-xs text-muted uppercase">Disbursement Amount</span>
              <h3 class="font-mono text-danger m-0">৳ {{ selectedVoucherForReimburse.amount.toLocaleString() }} BDT</h3>
            </div>
          </div>
          <div class="mt-2 text-sm text-slate-700">
            <div><strong>Payee / Bearer:</strong> {{ selectedVoucherForReimburse.payeeName }}</div>
            <div><strong>Expense Category:</strong> {{ selectedVoucherForReimburse.category }}</div>
            <div><strong>Purpose:</strong> {{ selectedVoucherForReimburse.purpose }}</div>
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label font-bold">Reimburse From Commercial Bank Account *</label>
          <select class="form-select" [(ngModel)]="reimburseBankAccountId">
            <option *ngFor="let a of commercialBankAccounts" [value]="a.id">
              {{ a.bankName }} ({{ a.accountNumber }}) — Available: ৳ {{ a.currentBalance.toLocaleString() }}
            </option>
          </select>
          <small class="text-xs text-muted">
            Replenishes the Imprest Petty Cash safe while debiting the selected commercial bank account.
          </small>
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <button type="button" class="btn btn-outline" (click)="isReimburseModalOpen = false">Cancel</button>
          <button type="button" class="btn btn-success" [disabled]="isSubmitting || !reimburseBankAccountId" (click)="confirmReimbursement()">
            <app-icon name="check-circle" [size]="15"></app-icon>
            <span>Execute Bank Reimbursement</span>
          </button>
        </div>
      </div>
    </app-modal>

    <!-- ======================================================== -->
    <!-- MODAL 7: OPEN & EDIT BANK ACCOUNT                        -->
    <!-- ======================================================== -->
    <app-modal [isOpen]="isAccountModalOpen" [title]="isEditAccountMode ? 'Edit Institutional Account (হিসাব বিবরণী সম্পাদনা)' : 'Open Institutional Account (নতুন ব্যাংক / ভল্ট হিসাব)'" [maxWidth]="680" [showFooter]="false" (close)="isAccountModalOpen = false">
      <div class="modal-body p-4">
        <div class="grid-2-col mb-3">
          <div class="form-group">
            <label class="form-label font-bold">Account Name *</label>
            <input type="text" class="form-control" placeholder="e.g. Sonali Bank - Exam Fee Clearing" [(ngModel)]="accountForm.accountName" />
          </div>
          <div class="form-group">
            <div class="flex justify-between items-center mb-1">
              <label class="form-label font-bold mb-0">Bank / Institution Name *</label>
              <button type="button" class="btn-text-link" (click)="isCustomBank = !isCustomBank">
                {{ isCustomBank ? 'Select from Bank Directory' : '+ Custom Name' }}
              </button>
            </div>
            <select *ngIf="!isCustomBank" class="form-select" [(ngModel)]="accountForm.bankName">
              <option value="" disabled>-- Select Scheduled Bank from Directory --</option>
              <option *ngFor="let b of scheduledBanks" [value]="b">{{ b }}</option>
            </select>
            <input *ngIf="isCustomBank" type="text" class="form-control" placeholder="e.g. Southeast Bank PLC" [(ngModel)]="accountForm.bankName" />
          </div>
        </div>

        <div class="grid-2-col mb-3">
          <div class="form-group">
            <label class="form-label font-bold">Account Number *</label>
            <input type="text" class="form-control font-mono" placeholder="e.g. 0102-33009988" [(ngModel)]="accountForm.accountNumber" [readonly]="isEditAccountMode" />
            <small class="text-xs text-muted" *ngIf="isEditAccountMode">Account number cannot be altered once opened.</small>
          </div>
          <div class="form-group">
            <label class="form-label font-bold">Branch Name</label>
            <input type="text" class="form-control" placeholder="e.g. Dhanmondi Principal Branch" [(ngModel)]="accountForm.branchName" />
          </div>
        </div>

        <div class="grid-3 mb-3">
          <div class="form-group">
            <label class="form-label font-bold">Account Classification *</label>
            <select class="form-select" [(ngModel)]="accountForm.accountType">
              <option *ngFor="let t of accountClassifications" [value]="t.value">{{ t.label }} ({{ t.bengali }})</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label font-bold">Routing Number</label>
            <input type="text" class="form-control font-mono" placeholder="9-digit routing" [(ngModel)]="accountForm.routingNumber" />
          </div>
          <div class="form-group">
            <label class="form-label font-bold">Swift Code</label>
            <input type="text" class="form-control font-mono" placeholder="e.g. BSONBDDH" [(ngModel)]="accountForm.swiftCode" />
          </div>
        </div>

        <div class="form-group mb-3" *ngIf="!isEditAccountMode">
          <label class="form-label font-bold">Initial Opening Ledger Balance (BDT)</label>
          <input type="number" class="form-control font-mono font-bold" placeholder="0.00" [(ngModel)]="accountForm.openingBalance" />
          <small class="text-xs text-muted">Initial balance credited to the ledger upon creation.</small>
        </div>

        <div class="form-group mb-3">
          <label class="form-check flex items-center gap-2">
            <input type="checkbox" [(ngModel)]="accountForm.isDefaultForTuition" />
            <span class="font-bold">Set as default account for student tuition fee collections</span>
          </label>
        </div>

        <div class="form-group mb-3">
          <label class="form-label font-bold">Account Remarks / Notes</label>
          <input type="text" class="form-control" placeholder="e.g. Primary tuition collection & staff salary clearing" [(ngModel)]="accountForm.notes" />
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <button type="button" class="btn btn-outline" (click)="isAccountModalOpen = false">Cancel</button>
          <button type="button" class="btn btn-primary" [disabled]="isSubmitting || !accountForm.accountName || !accountForm.accountNumber || !accountForm.bankName" (click)="submitAccountForm()">
            <span>{{ isEditAccountMode ? 'Save Changes' : 'Open Account' }}</span>
          </button>
        </div>
      </div>
    </app-modal>

    <!-- ======================================================== -->
    <!-- MODAL 8: ADD EXPENSE CATEGORY TO DATABASE                -->
    <!-- ======================================================== -->
    <app-modal [isOpen]="isCategoryModalOpen" [title]="'Add Expense Category to Database (নতুন খরচ খাত)'" [maxWidth]="520" [showFooter]="false" (close)="isCategoryModalOpen = false">
      <div class="modal-body p-4">
        <p class="text-sm text-muted mb-3">
          Create a new expense category code saved directly into the institution's PostgreSQL database ledger.
        </p>

        <div class="form-group mb-3">
          <label class="form-label font-bold">Category Code *</label>
          <input type="text" class="form-control font-mono uppercase" placeholder="e.g. HOSP, COURIER, LAB-SUP" [(ngModel)]="newCatCode" />
          <small class="text-xs text-muted">A unique short identifier (2 to 8 characters)</small>
        </div>

        <div class="form-group mb-3">
          <label class="form-label font-bold">Category Name *</label>
          <input type="text" class="form-control" placeholder="e.g. Hospitality & Guest Refreshments" [(ngModel)]="newCatName" />
        </div>

        <div class="form-group mb-3">
          <label class="form-label font-bold">Description / Purpose</label>
          <input type="text" class="form-control" placeholder="e.g. Official refreshments for meetings and events" [(ngModel)]="newCatDesc" />
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <button type="button" class="btn btn-outline" (click)="isCategoryModalOpen = false">Cancel</button>
          <button type="button" class="btn btn-primary" [disabled]="!newCatCode || !newCatName || isSubmitting" (click)="submitNewCategory()">
            <app-icon name="plus" [size]="15"></app-icon>
            <span>Save to Database</span>
          </button>
        </div>
      </div>
    </app-modal>

    <!-- ======================================================== -->
    <!-- MODAL 9: OFFICIAL PRINTABLE TRANSACTION VOUCHER          -->
    <!-- ======================================================== -->
    <app-modal [isOpen]="isPrintModalOpen" [title]="'Official Banking Voucher Preview'" [maxWidth]="780" [showFooter]="false" (close)="isPrintModalOpen = false">
      <div class="modal-body p-4 printable-area">
        <div class="printable-document-frame">
          <div class="print-voucher-header">
            <div class="pvh-left">
              <h2>{{ schoolName }} ({{ activeCampusName }})</h2>
              <p>{{ schoolAddress }} • Accounts & Treasury Division</p>
              <div class="pvh-title-pill">
                {{ getVoucherPrintHeading(selectedTx?.transactionType) }}
              </div>
            </div>
            <div class="pvh-right">
              <span class="pvh-copy-pill">ACCOUNTS ARCHIVE COPY</span>
              <span class="pvh-date font-mono">Date: {{ selectedTx?.transactionDate | date:'mediumDate' }}</span>
              <span class="text-xs text-muted d-block">EIIN: 108422 • Reg: 4920/2012</span>
            </div>
          </div>

          <div class="pvh-meta-grid mb-3">
            <div><strong>Transaction Reference:</strong> <span class="font-mono text-primary font-bold">{{ selectedTx?.referenceNo || 'TRX-MANUAL' }}</span></div>
            <div><strong>Transaction Type:</strong> {{ formatTxType(selectedTx?.transactionType || 'Deposit') }}</div>
            <div><strong>Bank / Vault Account:</strong> {{ selectedTx?.accountName }} ({{ selectedTx?.accountNumber }})</div>
            <div><strong>Institution & Branch:</strong> {{ selectedTx?.bankName }}</div>
            <div><strong>Party / Particulars:</strong> {{ selectedTx?.description }}</div>
            <div><strong>Transacted By:</strong> {{ selectedTx?.transactedBy }} (Accounts Desk)</div>
          </div>

          <div class="voucher-amount-box mb-3">
            <div class="vab-left">
              <span class="text-xs text-muted uppercase">Total Settled Amount</span>
              <h2 class="text-primary font-mono m-0">৳ {{ selectedTx?.amount?.toLocaleString() }} BDT</h2>
              <span class="text-xs text-muted d-block mt-1">
                <strong>In Words:</strong> {{ numberToWords(selectedTx?.amount) }}
              </span>
            </div>
            <div class="vab-right text-right">
              <span class="text-xs text-muted uppercase">Account Balance After</span>
              <h3 class="text-emerald font-mono m-0">৳ {{ selectedTx?.balanceAfter?.toLocaleString() }} BDT</h3>
              <span class="text-xs text-muted">Verified against general ledger</span>
            </div>
          </div>

          <div class="print-signatures-box">
            <div class="sig-block">
              <div class="sig-line"></div>
              <span class="sig-title">Prepared By (Cashier)</span>
            </div>
            <div class="sig-stamp-box">
              <div class="verified-stamp">✓ AUDIT VERIFIED & SETTLED</div>
              <span class="stamp-date">Accounts Division • {{ todayDateFormatted }}</span>
            </div>
            <div class="sig-block">
              <div class="sig-line"></div>
              <span class="sig-title">Verified By (Accounts Officer / Bursar)</span>
            </div>
            <div class="sig-block">
              <div class="sig-line"></div>
              <span class="sig-title">Principal / Head of Institution</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer p-3 flex justify-end gap-2 no-print">
        <button type="button" class="btn btn-outline" (click)="isPrintModalOpen = false">Close</button>
        <button type="button" class="btn btn-primary" (click)="triggerPrint()">
          <app-icon name="printer" [size]="15"></app-icon>
          <span>Print Official Voucher (A4)</span>
        </button>
      </div>
    </app-modal>

    <!-- ======================================================== -->
    <!-- MODAL 10: BANK RECONCILIATION STATEMENT PRINT PREVIEW    -->
    <!-- ======================================================== -->
    <app-modal [isOpen]="isReconciliationPrintModalOpen" [title]="'Bank Reconciliation Statement Print'" [maxWidth]="820" [showFooter]="false" (close)="isReconciliationPrintModalOpen = false">
      <div class="modal-body p-4 printable-area" *ngIf="selectedReconcileAccount">
        <div class="printable-document-frame">
          <div class="print-voucher-header">
            <div class="pvh-left">
              <h2>{{ schoolName }} ({{ activeCampusName }})</h2>
              <p>{{ schoolAddress }} • Accounts & Treasury Division</p>
              <div class="pvh-title-pill">OFFICIAL BANK RECONCILIATION STATEMENT (মাসিক ব্যাংক সমাধান বিবরণী)</div>
            </div>
            <div class="pvh-right">
              <span class="pvh-copy-pill">BOARD AUDIT RECORD</span>
              <span class="pvh-date font-mono">As of: {{ reconciliationDate }}</span>
              <span class="text-xs text-muted d-block">EIIN: 108422 • Reg: 4920/2012</span>
            </div>
          </div>

          <div class="pvh-meta-grid mb-3">
            <div><strong>Commercial Bank:</strong> {{ selectedReconcileAccount.bankName }}</div>
            <div><strong>Account Name:</strong> {{ selectedReconcileAccount.accountName }}</div>
            <div><strong>Account Number:</strong> <span class="font-mono">{{ selectedReconcileAccount.accountNumber }}</span></div>
            <div><strong>Branch:</strong> {{ selectedReconcileAccount.branchName || 'Principal Branch' }}</div>
            <div><strong>Routing Number:</strong> <span class="font-mono">{{ selectedReconcileAccount.routingNumber || 'N/A' }}</span></div>
            <div><strong>Swift Code:</strong> <span class="font-mono">{{ selectedReconcileAccount.swiftCode || 'N/A' }}</span></div>
          </div>

          <div class="rec-breakdown-table mb-4">
            <div class="rec-row header-row">
              <span>Reconciliation Particulars</span>
              <span class="text-right">Amount (BDT)</span>
            </div>
            <div class="rec-row">
              <span><strong>1. Balance as per General Ledger Cash Book</strong></span>
              <span class="text-right font-mono font-bold">৳ {{ selectedReconcileAccount.currentBalance.toLocaleString() }}</span>
            </div>
            <div class="rec-row text-emerald">
              <span>&nbsp;&nbsp;&nbsp;&nbsp;+ Add: Deposits in Transit (Counter collections not yet credited by bank)</span>
              <span class="text-right font-mono font-bold">+ ৳ {{ depositsInTransit.toLocaleString() }}</span>
            </div>
            <div class="rec-row text-warning">
              <span>&nbsp;&nbsp;&nbsp;&nbsp;- Less: Outstanding Cheques Issued (Not yet presented for encashment)</span>
              <span class="text-right font-mono font-bold">- ৳ {{ outstandingCheques.toLocaleString() }}</span>
            </div>
            <div class="rec-row">
              <span>&nbsp;&nbsp;&nbsp;&nbsp;+ Add: Bank Interest Credited directly into account</span>
              <span class="text-right font-mono font-bold">+ ৳ {{ interestEarned.toLocaleString() }}</span>
            </div>
            <div class="rec-row">
              <span>&nbsp;&nbsp;&nbsp;&nbsp;- Less: Bank Incidental & Ledger Maintenance Charges</span>
              <span class="text-right font-mono font-bold">- ৳ {{ bankCharges.toLocaleString() }}</span>
            </div>
            <div class="rec-row total-row">
              <span><strong>2. Adjusted Reconciled Balance (Balance as per Bank Statement)</strong></span>
              <span class="text-right font-mono font-bold text-emerald">৳ {{ adjustedBankBalance.toLocaleString() }} BDT</span>
            </div>
            <div class="rec-row variance-row">
              <span>Audit Discrepancy / Variance</span>
              <span class="text-right font-mono font-bold" [class.text-emerald]="reconciliationVariance === 0" [class.text-danger]="reconciliationVariance !== 0">
                {{ reconciliationVariance === 0 ? '৳ 0.00 (Zero Variance - Perfect Audit Match)' : '⚠️ ৳ ' + reconciliationVariance.toLocaleString() + ' BDT' }}
              </span>
            </div>
          </div>

          <div class="print-signatures-box">
            <div class="sig-block">
              <div class="sig-line"></div>
              <span class="sig-title">Prepared By (Cashier)</span>
            </div>
            <div class="sig-stamp-box">
              <div class="verified-stamp">✓ AUDIT VERIFIED & RECONCILED</div>
              <span class="stamp-date">Accounts & Treasury • {{ todayDateFormatted }}</span>
            </div>
            <div class="sig-block">
              <div class="sig-line"></div>
              <span class="sig-title">Verified By (Accounts Officer / Bursar)</span>
            </div>
            <div class="sig-block">
              <div class="sig-line"></div>
              <span class="sig-title">Principal / Head of Institution</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer p-3 flex justify-end gap-2 no-print">
        <button type="button" class="btn btn-outline" (click)="isReconciliationPrintModalOpen = false">Close</button>
        <button type="button" class="btn btn-primary" (click)="triggerPrint()">
          <app-icon name="printer" [size]="15"></app-icon>
          <span>Print Reconciliation (A4)</span>
        </button>
      </div>
    </app-modal>

    <!-- ======================================================== -->
    <!-- MODAL 11: DATABASE MASTERS & BULK IMPORT                 -->
    <!-- ======================================================== -->
    <app-modal [isOpen]="isImportMasterModalOpen" [title]="'Treasury Database Master & Bulk Import (ডাটাবেজ সিলেক্ট মাস্টার ও ইমপোর্ট)'" [maxWidth]="880" [showFooter]="false" (close)="isImportMasterModalOpen = false">
      <div class="modal-body p-4">
        <p class="text-sm text-muted mb-3">
          Manage dropdown master records directly in the live PostgreSQL database. Import standard academic heads or bulk upload via CSV.
        </p>

        <!-- Sub Tabs in Modal -->
        <div class="modal-subtabs mb-3">
          <button type="button" class="mst-tab-btn" [class.active]="masterTab === 'categories'" (click)="masterTab = 'categories'">
            <app-icon name="folder-plus" [size]="14"></app-icon>
            <span>Expense Categories DB Master ({{ dbCategories.length }})</span>
          </button>
          <button type="button" class="mst-tab-btn" [class.active]="masterTab === 'accounts'" (click)="masterTab = 'accounts'">
            <app-icon name="landmark" [size]="14"></app-icon>
            <span>Bank & Vault Accounts Master ({{ accounts.length }})</span>
          </button>
        </div>

        <!-- Master Tab 1: Expense Categories -->
        <div *ngIf="masterTab === 'categories'">
          <div class="flex-between flex-wrap gap-2 mb-3 p-3 bg-slate-50 border rounded">
            <div>
              <strong class="text-sm text-slate-800">Quick Seed Standard Institutional Heads</strong>
              <p class="text-xs text-muted mb-0">Instantly populate common school expense categories (Library, Lab, Refreshment, Sports, etc.)</p>
            </div>
            <button type="button" class="btn btn-sm btn-outline text-indigo" [disabled]="isSubmitting" (click)="seedStandardExpenseCategories()">
              <app-icon name="plus-circle" [size]="14"></app-icon>
              <span>Seed Standard Academic Categories</span>
            </button>
          </div>

          <div class="card mb-3 p-3 border">
            <h5 class="text-sm font-bold mb-2">Bulk CSV Import into Database</h5>
            <p class="text-xs text-muted mb-2">Paste one category per line: <code>CODE,Category Name,Optional Description</code></p>
            <textarea class="form-control font-mono text-xs mb-2" rows="3" [(ngModel)]="bulkCategoryCsv" placeholder="REFRESH, Refreshment & Hospitality, Meeting tea & biscuits&#10;SPORTS, Sports & Athletics, Tournament equipment"></textarea>
            <div class="flex justify-end">
              <button type="button" class="btn btn-sm btn-primary" [disabled]="!bulkCategoryCsv.trim() || isSubmitting" (click)="importBulkCategoriesCsv()">
                <app-icon name="upload" [size]="13"></app-icon>
                <span>Import CSV to Database</span>
              </button>
            </div>
          </div>

          <div class="card p-3 border">
            <div class="flex-between mb-2">
              <h5 class="text-sm font-bold m-0">Active PostgreSQL Expense Categories ({{ dbCategories.length }})</h5>
              <button type="button" class="btn btn-xs btn-outline" (click)="openAddCategoryModal()">+ Add Single</button>
            </div>
            <div class="app-table-wrapper" style="max-height: 220px; overflow-y: auto;">
              <table class="app-table">
                <thead>
                  <tr>
                    <th style="width: 100px;">Code</th>
                    <th>Category Name</th>
                    <th>Description</th>
                    <th style="width: 70px;" class="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let c of dbCategories">
                    <td class="font-mono font-bold text-primary">{{ c.code }}</td>
                    <td><strong>{{ c.name }}</strong></td>
                    <td class="text-xs text-muted">{{ c.description || 'N/A' }}</td>
                    <td class="text-center">
                      <button type="button" class="btn btn-xs btn-outline text-danger" (click)="deleteCategory(c)" title="Delete category from DB">
                        <app-icon name="trash-2" [size]="12"></app-icon>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Master Tab 2: Bank Accounts Master -->
        <div *ngIf="masterTab === 'accounts'">
          <div class="flex-between flex-wrap gap-2 mb-3 p-3 bg-slate-50 border rounded">
            <div>
              <strong class="text-sm text-slate-800">Seed Essential Treasury Vaults</strong>
              <p class="text-xs text-muted mb-0">Ensure physical Campus Safe Vault and Imprest Petty Cash fund accounts exist in PostgreSQL.</p>
            </div>
            <button type="button" class="btn btn-sm btn-outline text-emerald" [disabled]="isSubmitting" (click)="seedStandardAccounts()">
              <app-icon name="plus-circle" [size]="14"></app-icon>
              <span>Seed Safe Vault & Petty Cash</span>
            </button>
          </div>

          <div class="card mb-3 p-3 border">
            <h5 class="text-sm font-bold mb-2">Bulk CSV Import Bank Accounts</h5>
            <p class="text-xs text-muted mb-2">Paste one account per line: <code>AccountName,BankName,AccountNumber,BranchName,Type,OpeningBalance</code></p>
            <textarea class="form-control font-mono text-xs mb-2" rows="3" [(ngModel)]="bulkAccountCsv" placeholder="Sonali Bank - Tuition Account, Sonali Bank PLC, 0102-998822, Principal Branch, Current, 150000"></textarea>
            <div class="flex justify-end">
              <button type="button" class="btn btn-sm btn-primary" [disabled]="!bulkAccountCsv.trim() || isSubmitting" (click)="importBulkAccountsCsv()">
                <app-icon name="upload" [size]="13"></app-icon>
                <span>Import Accounts to Database</span>
              </button>
            </div>
          </div>

          <div class="card p-3 border">
            <h5 class="text-sm font-bold mb-2">Configured Institutional Accounts in PostgreSQL ({{ accounts.length }})</h5>
            <div class="app-table-wrapper" style="max-height: 220px; overflow-y: auto;">
              <table class="app-table">
                <thead>
                  <tr>
                    <th>Account Name</th>
                    <th>Bank / Institution</th>
                    <th>Number</th>
                    <th>Type</th>
                    <th class="text-right">Balance (BDT)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let a of accounts">
                    <td><strong>{{ a.accountName }}</strong></td>
                    <td class="text-xs text-muted">{{ a.bankName }}</td>
                    <td class="font-mono text-xs">{{ a.accountNumber }}</td>
                    <td><span class="acc-type-badge" [ngClass]="getAccountTypeBadgeClass(a.accountType)">{{ a.accountType }}</span></td>
                    <td class="text-right font-mono font-bold">৳ {{ a.currentBalance.toLocaleString() }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-4 pt-3 border-top">
          <button type="button" class="btn btn-primary" (click)="isImportMasterModalOpen = false">Done & Close</button>
        </div>
      </div>
    </app-modal>
  `,
  styles: [`
    .mb-0 { margin-bottom: 0 !important; }
    .mb-1 { margin-bottom: 4px; }
    .mb-3 { margin-bottom: 16px; }
    .mb-4 { margin-bottom: 24px; }
    .mt-1 { margin-top: 4px; }
    .mt-2 { margin-top: 8px; }
    .mt-3 { margin-top: 12px; }
    .mt-4 { margin-top: 16px; }
    .pt-2 { padding-top: 8px; }
    .pt-3 { padding-top: 12px; }
    .border-top { border-top: 1px solid #e2e8f0; }
    .text-primary { color: #4f46e5; }
    .text-emerald { color: #059669; }
    .text-danger { color: #ef4444; }
    .text-warning { color: #d97706; }
    .text-indigo { color: #4f46e5; }
    .text-slate { color: #334155; }
    .text-muted { color: #64748b; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .flex-between { display: flex; align-items: center; justify-content: space-between; }
    .flex { display: flex; }
    .items-center { align-items: center; }
    .justify-center { justify-content: center; }
    .justify-end { justify-content: flex-end; }
    .gap-1 { gap: 4px; }
    .gap-2 { gap: 8px; }
    .gap-3 { gap: 12px; }
    .w-100 { width: 100%; }
    .uppercase { text-transform: uppercase; }

    /* Button text links */
    .btn-text-link {
      background: none;
      border: none;
      color: #4f46e5;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
      text-decoration: underline;
    }
    .btn-text-link:hover {
      color: #3730a3;
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
    @media (max-width: 1200px) {
      .kpi-strip { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 700px) {
      .kpi-strip { grid-template-columns: 1fr; }
    }
    .kpi-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px 18px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .border-indigo { border-left: 4px solid #4f46e5; }
    .border-emerald { border-left: 4px solid #10b981; }
    .border-amber { border-left: 4px solid #f59e0b; }
    .border-blue { border-left: 4px solid #0ea5e9; }
    .border-slate { border-left: 4px solid #64748b; }

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
      font-weight: 700;
      border-bottom-color: #4f46e5;
      background: #eef2ff;
      border-radius: 8px 8px 0 0;
    }

    /* Accounts Grid */
    .accounts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }
    .account-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.2s ease;
    }
    .account-card:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
    }
    .account-card.is-default {
      border-color: #4f46e5;
      background: linear-gradient(to bottom, #ffffff, #fafbff);
    }
    .account-card.is-inactive {
      opacity: 0.65;
      background: #f8fafc;
    }

    .account-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 6px;
    }
    .acc-type-badge {
      font-size: 0.72rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .type-current { background: #e0e7ff; color: #3730a3; }
    .type-savings { background: #dcfce7; color: #166534; }
    .type-vault { background: #fef3c7; color: #92400e; }
    .type-petty { background: #f1f5f9; color: #334155; }
    .type-mobile { background: #fae8ff; color: #86198f; }

    .default-tuition-pill {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
      font-size: 0.68rem;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .inactive-pill {
      background: #fee2e2;
      color: #dc2626;
      font-size: 0.68rem;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 999px;
    }

    .acc-name {
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 2px 0;
    }
    .acc-bank {
      font-size: 0.8rem;
      color: #64748b;
      margin: 0 0 8px 0;
    }
    .acc-no-box {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 14px;
    }

    .acc-balance-section {
      border-top: 1px dashed #e2e8f0;
      padding-top: 12px;
      margin-bottom: 14px;
    }
    .balance-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .balance-val {
      font-size: 1.45rem;
      font-weight: 800;
      margin: 2px 0 4px 0;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    .account-card-actions {
      display: flex;
      gap: 6px;
      border-top: 1px solid #f1f5f9;
      padding-top: 12px;
    }

    /* Filter Grid */
    .filter-grid-5 {
      display: grid;
      grid-template-columns: 1.3fr 1fr 1fr 1fr 1.2fr;
      gap: 12px;
    }
    @media (max-width: 1100px) {
      .filter-grid-5 { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 600px) {
      .filter-grid-5 { grid-template-columns: 1fr; }
    }

    .grid-2-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    @media (max-width: 600px) {
      .grid-2-col { grid-template-columns: 1fr; }
    }
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
    }
    @media (max-width: 768px) {
      .grid-3 { grid-template-columns: 1fr; }
    }

    /* Badges & Pills */
    .tx-badge {
      font-size: 0.72rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 5px;
      display: inline-block;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .tx-deposit { background: #dcfce7; color: #166534; }
    .tx-withdraw { background: #fee2e2; color: #991b1b; }
    .tx-transfer-in { background: #eff6ff; color: #1e40af; }
    .tx-transfer-out { background: #fff7ed; color: #c2410c; }
    .tx-expense { background: #fef3c7; color: #b45309; }

    .slip-pill {
      background: #f1f5f9;
      color: #334155;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .category-pill {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #475569;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .status-pill {
      font-size: 0.7rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .status-pill.pass { background: #dcfce7; color: #166534; }
    .status-pill.pending { background: #fef3c7; color: #92400e; }

    .reimburse-card-info {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
    }

    /* Bank Reconciliation UI */
    .reconciliation-status-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 0.8rem;
    }
    .badge-dot-green {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
    }
    .reconciliation-summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    @media (max-width: 900px) {
      .reconciliation-summary-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 600px) {
      .reconciliation-summary-grid { grid-template-columns: 1fr; }
    }
    .rec-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .border-left-indigo { border-left: 4px solid #4f46e5; }
    .border-left-emerald { border-left: 4px solid #10b981; }
    .border-left-amber { border-left: 4px solid #f59e0b; }

    .rec-card-title {
      font-size: 0.72rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .rec-card-val {
      font-size: 1.35rem;
      font-weight: 800;
      margin: 4px 0 2px 0;
    }

    .rec-breakdown-table {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }
    .rec-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 14px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.84rem;
    }
    .rec-row.header-row {
      background: #f8fafc;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.04em;
    }
    .rec-row.total-row {
      background: #ecfdf5;
      font-size: 0.95rem;
      font-weight: 800;
      border-top: 2px solid #059669;
      border-bottom: 2px solid #059669;
    }
    .rec-row.variance-row {
      background: #fafafa;
      font-weight: 700;
      color: #64748b;
    }
    .rec-row.variance-alert {
      background: #fef2f2 !important;
      border: 1.5px solid #ef4444;
      color: #dc2626 !important;
    }

    .badge-dot-amber {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #f59e0b;
    }
    .reconciliation-status-banner.unreconciled {
      background: #fffbeb;
      border-color: #fde68a;
      color: #b45309;
    }

    .rec-inputs-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 12px;
    }
    @media (max-width: 1200px) {
      .rec-inputs-grid { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 768px) {
      .rec-inputs-grid { grid-template-columns: 1fr; }
    }

    /* Modal Subtabs */
    .modal-subtabs {
      display: flex;
      gap: 8px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 2px;
    }
    .mst-tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border: none;
      background: transparent;
      color: #64748b;
      font-weight: 600;
      font-size: 0.82rem;
      border-bottom: 3px solid transparent;
      cursor: pointer;
      border-radius: 6px 6px 0 0;
      transition: all 0.2s ease;
    }
    .mst-tab-btn:hover {
      background: #f8fafc;
      color: #1e293b;
    }
    .mst-tab-btn.active {
      color: #4f46e5;
      font-weight: 700;
      border-bottom-color: #4f46e5;
      background: #eef2ff;
    }

    .bg-slate-50 { background-color: #f8fafc; }
    .rounded { border-radius: 8px; }
    .border { border: 1px solid #e2e8f0; }

    /* Printable Voucher Modal Layout */
    .printable-document-frame {
      border: 1.5px solid #0f172a;
      border-radius: 8px;
      padding: 18px 20px;
      background: #ffffff;
      box-sizing: border-box;
    }
    .print-voucher-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .pvh-left h2 { font-size: 1.25rem; font-weight: 900; margin: 0; color: #0f172a; }
    .pvh-left p { font-size: 0.8rem; color: #475569; margin: 2px 0 6px; }
    .pvh-title-pill {
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
    .pvh-right { text-align: right; }
    .pvh-copy-pill {
      display: inline-block;
      font-size: 0.65rem;
      font-weight: 800;
      border: 1px solid #64748b;
      color: #334155;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .pvh-date { display: block; font-size: 0.75rem; color: #475569; }

    .pvh-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px 14px;
      font-size: 0.75rem;
      color: #1e293b;
      background: #f8fafc;
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    .voucher-amount-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #eef2ff;
      border: 1.5px dashed #6366f1;
      padding: 12px 18px;
      border-radius: 8px;
    }

    .print-signatures-box {
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

    /* Print Only Styles */
    .only-print { display: none; }
    @media print {
      .no-print { display: none !important; }
      .only-print { display: block !important; }
      .page-container { padding: 0 !important; }
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
      .pl-school-addr { font-size: 0.75rem; color: #475569; margin: 2px 0 4px; }
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
    }
  `]
})
export class BankingTreasuryComponent implements OnInit {
  private financeStore = inject(FinanceStoreService);
  private teacherStore = inject(TeacherStoreService);
  private auth = inject(AuthService);
  private campus = inject(CampusSessionService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  schoolName = 'Scholars International Academy';
  schoolAddress = 'Plot 14, Road 2, Block-E, Dhaka 1212, Bangladesh';
  activeCampusName = 'Dhanmondi Campus';
  currentUser: User | null = null;

  activeTab: 'accounts' | 'ledger' | 'petty-cash' | 'reconciliation' = 'accounts';
  isLoading = false;
  isSubmitting = false;

  // Real Database Collections
  summary: TreasurySummary | null = null;
  accounts: BankAccount[] = [];
  transactions: BankTransaction[] = [];
  filteredTransactions: BankTransaction[] = [];
  pettyCashVouchers: PettyCashVoucher[] = [];
  dbCategories: ExpenseCategory[] = [];
  teachers: Teacher[] = [];

  // Filter state
  filterBankAccountId = 'ALL';
  filterTransactionType = 'ALL';
  filterFromDate = '';
  filterToDate = '';
  searchLedgerQuery = '';

  // Modals state
  isDepositModalOpen = false;
  isDirectDepositModalOpen = false;
  isWithdrawModalOpen = false;
  isTransferModalOpen = false;
  isPettyModalOpen = false;
  isReimburseModalOpen = false;
  isAccountModalOpen = false;
  isCategoryModalOpen = false;
  isPrintModalOpen = false;
  isReconciliationPrintModalOpen = false;
  isImportMasterModalOpen = false;

  // Master modal state
  masterTab: 'categories' | 'accounts' = 'categories';
  bulkCategoryCsv = '';
  bulkAccountCsv = '';

  // Mode flags
  isEditAccountMode = false;
  editingAccountId = '';
  isCustomBank = false;
  isCustomPayee = false;
  isCustomWithdrawBearer = false;

  // Cash-to-bank deposit form
  depositDestinationAccountId = '';
  depositAmount = 0;
  depositSlipNo = '';
  depositDescription = '';

  // Direct deposit form
  directDepositAccountId = '';
  directDepositAmount = 0;
  directDepositSlipNo = '';
  directDepositParty = '';
  directDepositDescription = '';

  // Cheque Withdrawal form
  withdrawAccountId = '';
  withdrawAmount = 0;
  withdrawChequeNo = '';
  withdrawBearer = '';
  withdrawPurpose = '';

  // Transfer form
  transferFromId = '';
  transferToId = '';
  transferAmount = 0;
  transferReference = '';
  transferDescription = '';

  // Petty cash form
  pettyPayee = '';
  pettyAmount = 0;
  pettyCategory = '';
  pettyPurpose = '';

  // Reimburse form
  selectedVoucherForReimburse: PettyCashVoucher | null = null;
  reimburseBankAccountId = '';

  // Category addition form
  newCatCode = '';
  newCatName = '';
  newCatDesc = '';

  // Account form
  accountForm = {
    accountName: '',
    bankName: '',
    accountNumber: '',
    branchName: '',
    accountType: 'Current' as 'Current' | 'Savings' | 'CashVault' | 'PettyCash' | 'MobileWallet',
    openingBalance: 0,
    routingNumber: '',
    swiftCode: '',
    isDefaultForTuition: false,
    notes: ''
  };

  // Bank Reconciliation dynamic adjustments (Strictly Zero Mock / Zero Hardcoded)
  reconciliationAccountId = '';
  reconciliationDate = new Date().toISOString().slice(0, 10);
  reconciliationDepositsInTransit = 0;
  reconciliationOutstandingCheques = 0;
  reconciliationInterestEarned = 0;
  reconciliationBankCharges = 0;
  reconciliationPassbookBalance = 0;
  isCustomPassbookBalance = false;

  // Selected voucher for print
  selectedTx: BankTransaction | null = null;

  // Scheduled Banks Directory in Bangladesh
  readonly scheduledBanks = [
    'Sonali Bank PLC',
    'Janata Bank PLC',
    'Agrani Bank PLC',
    'Rupali Bank PLC',
    'Dutch-Bangla Bank PLC',
    'BRAC Bank PLC',
    'Eastern Bank PLC',
    'Prime Bank PLC',
    'The City Bank PLC',
    'Islami Bank Bangladesh PLC',
    'Mutual Trust Bank PLC',
    'United Commercial Bank PLC',
    'Pubali Bank PLC',
    'Bank Asia PLC',
    'Standard Chartered Bangladesh',
    'HSBC Bangladesh',
    'Campus Treasury Safe Vault',
    'Imprest Cash Safe'
  ];

  // Standard Account Classifications
  readonly accountClassifications = [
    { value: 'Current', label: 'Commercial Current Account', bengali: 'চলতি হিসাব' },
    { value: 'Savings', label: 'Commercial Savings Account', bengali: 'সঞ্চয়ী হিসাব' },
    { value: 'CashVault', label: 'Cash Counter Safe Vault', bengali: 'কাউন্টার ভল্ট' },
    { value: 'PettyCash', label: 'Office Imprest Petty Cash Fund', bengali: 'পেটি ক্যাশ ইমপ্রেসট' },
    { value: 'MobileWallet', label: 'Mobile Merchant Gateway (bKash/Nagad)', bengali: 'মোবাইল মার্চেন্ট' }
  ];

  // Transaction Types Filter Mapping
  readonly availableTransactionTypes = [
    { value: 'Deposit', label: 'Bank Deposit / Inflow' },
    { value: 'Withdrawal', label: 'Cash Withdrawal / Outflow' },
    { value: 'TransferIn', label: 'Fund Transfer In' },
    { value: 'TransferOut', label: 'Fund Transfer Out' },
    { value: 'CounterCashDeposit', label: 'Counter Cash Vault Deposit' },
    { value: 'ExpenseDebit', label: 'Expense Disbursement' },
    { value: 'PayrollDisbursement', label: 'Faculty Payroll Clearance' }
  ];

  get todayDateFormatted(): string {
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date().toLocaleDateString('en-US', opts);
  }

  get vaultAccount(): BankAccount | undefined {
    return this.accounts.find(a => a.accountType === 'CashVault');
  }

  get commercialBankAccounts(): BankAccount[] {
    return this.accounts.filter(a => a.accountType === 'Current' || a.accountType === 'Savings' || a.accountType === 'MobileWallet');
  }

  get selectedReconcileAccount(): BankAccount | undefined {
    return this.accounts.find(a => a.id === this.reconciliationAccountId) || this.commercialBankAccounts[0];
  }

  get depositsInTransit(): number {
    return this.reconciliationDepositsInTransit;
  }

  get outstandingCheques(): number {
    return this.reconciliationOutstandingCheques;
  }

  get interestEarned(): number {
    return this.reconciliationInterestEarned;
  }

  get bankCharges(): number {
    return this.reconciliationBankCharges;
  }

  get adjustedBankBalance(): number {
    const base = this.selectedReconcileAccount?.currentBalance || 0;
    return base + this.depositsInTransit - this.outstandingCheques + this.interestEarned - this.bankCharges;
  }

  get effectivePassbookBalance(): number {
    return this.isCustomPassbookBalance ? this.reconciliationPassbookBalance : this.adjustedBankBalance;
  }

  get reconciliationVariance(): number {
    return this.adjustedBankBalance - this.effectivePassbookBalance;
  }

  async ngOnInit() {
    this.currentUser = this.auth.getCurrentUser();
    this.resolveCampusName();
    await this.loadAllData();
  }

  private resolveCampusName() {
    const bId = this.campus.branchId;
    if (bId === 'br-02c70f') this.activeCampusName = 'Dhanmondi Campus';
    else if (bId === 'br-8996de' || bId === 'br-02') this.activeCampusName = 'Uttara Campus';
    else if (bId === 'br-6fd98e') this.activeCampusName = 'Rayerbag Campus';
    else this.activeCampusName = 'Dhanmondi Campus (Central)';
  }

  async loadAllData() {
    this.isLoading = true;
    this.cdr.markForCheck();

    try {
      const [sum, accs, txs, petty, categories, faculty] = await Promise.all([
        this.financeStore.getTreasurySummary(),
        this.financeStore.loadBankAccounts(),
        this.financeStore.loadBankTransactions(),
        this.financeStore.loadPettyCashVouchers(),
        this.financeStore.loadExpenseCategories(),
        this.teacherStore.loadTeachers()
      ]);

      this.summary = sum;
      this.accounts = accs || [];
      this.transactions = txs || [];
      this.pettyCashVouchers = petty || [];
      this.dbCategories = categories || [];
      this.teachers = faculty || [];

      // Auto-assign default selects from live database data
      if (this.commercialBankAccounts.length > 0) {
        if (!this.depositDestinationAccountId) this.depositDestinationAccountId = this.commercialBankAccounts[0].id;
        if (!this.directDepositAccountId) this.directDepositAccountId = this.commercialBankAccounts[0].id;
        if (!this.withdrawAccountId) this.withdrawAccountId = this.commercialBankAccounts[0].id;
        if (!this.reconciliationAccountId) this.reconciliationAccountId = this.commercialBankAccounts[0].id;
      }

      if (this.dbCategories.length > 0 && !this.pettyCategory) {
        this.pettyCategory = this.dbCategories[0].name;
      }

      if (this.teachers.length > 0) {
        if (!this.pettyPayee) this.pettyPayee = this.teachers[0].fullName;
        if (!this.withdrawBearer) this.withdrawBearer = this.teachers[0].fullName;
      }

      this.applyFilters();
    } catch (e: any) {
      console.error('Error loading treasury data:', e);
      this.toast.error('Treasury Error', 'Could not load banking and vault data from database.');
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  applyFilters() {
    let list = [...this.transactions];

    if (this.filterBankAccountId !== 'ALL') {
      list = list.filter(t => t.bankAccountId === this.filterBankAccountId);
    }

    if (this.filterTransactionType !== 'ALL') {
      list = list.filter(t => t.transactionType === this.filterTransactionType);
    }

    if (this.filterFromDate) {
      const from = new Date(this.filterFromDate).getTime();
      list = list.filter(t => new Date(t.transactionDate).getTime() >= from);
    }

    if (this.filterToDate) {
      const to = new Date(this.filterToDate).getTime() + 86400000;
      list = list.filter(t => new Date(t.transactionDate).getTime() <= to);
    }

    const q = this.searchLedgerQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(t =>
        (t.referenceNo || '').toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.accountName.toLowerCase().includes(q) ||
        (t.counterpartyOrAccount || '').toLowerCase().includes(q)
      );
    }

    this.filteredTransactions = list;
  }

  resetFilters() {
    this.filterBankAccountId = 'ALL';
    this.filterTransactionType = 'ALL';
    this.filterFromDate = '';
    this.filterToDate = '';
    this.searchLedgerQuery = '';
    this.applyFilters();
  }

  updateReconciliationData() {
    this.isCustomPassbookBalance = false;
    this.reconciliationPassbookBalance = this.adjustedBankBalance;
    this.cdr.markForCheck();
  }

  onTransitChanged() {
    if (!this.isCustomPassbookBalance) this.reconciliationPassbookBalance = this.adjustedBankBalance;
    this.cdr.markForCheck();
  }

  onChequesChanged() {
    if (!this.isCustomPassbookBalance) this.reconciliationPassbookBalance = this.adjustedBankBalance;
    this.cdr.markForCheck();
  }

  onInterestChanged() {
    if (!this.isCustomPassbookBalance) this.reconciliationPassbookBalance = this.adjustedBankBalance;
    this.cdr.markForCheck();
  }

  onChargesChanged() {
    if (!this.isCustomPassbookBalance) this.reconciliationPassbookBalance = this.adjustedBankBalance;
    this.cdr.markForCheck();
  }

  onPassbookChanged() {
    this.isCustomPassbookBalance = true;
    this.cdr.markForCheck();
  }

  autoCalculateReconciliationFromLedger() {
    if (!this.selectedReconcileAccount) return;
    const accId = this.selectedReconcileAccount.id;

    // Detect uncredited deposits / in transit (recent credits in current month)
    const recentDeposits = this.transactions
      .filter(t => t.bankAccountId === accId && this.isCreditTx(t.transactionType))
      .slice(0, 2)
      .reduce((sum, t) => sum + t.amount, 0);

    // Detect unpresented cheques (recent withdrawals)
    const recentCheques = this.transactions
      .filter(t => t.bankAccountId === accId && t.transactionType === 'Withdrawal')
      .slice(0, 1)
      .reduce((sum, t) => sum + t.amount, 0);

    this.reconciliationDepositsInTransit = recentDeposits > 0 ? recentDeposits : 0;
    this.reconciliationOutstandingCheques = recentCheques > 0 ? recentCheques : 0;
    this.reconciliationInterestEarned = 0;
    this.reconciliationBankCharges = 0;
    this.isCustomPassbookBalance = false;
    this.reconciliationPassbookBalance = this.adjustedBankBalance;
    this.toast.info('Auto-Calculated', 'Reconciliation adjustments synchronized with recent transaction ledger.');
    this.cdr.markForCheck();
  }

  // --- Database Master & Bulk Import Methods ---

  openImportMasterModal() {
    this.masterTab = 'categories';
    this.bulkCategoryCsv = '';
    this.bulkAccountCsv = '';
    this.isImportMasterModalOpen = true;
  }

  async seedStandardExpenseCategories() {
    const standardCategories = [
      { code: 'REFRESH', name: 'Hospitality & Guest Refreshments', description: 'Academic committee meeting tea & light refreshments' },
      { code: 'COURIER', name: 'Postal, Courier & Dispatch', description: 'Institutional correspondence, courier and official postal charges' },
      { code: 'LAB-SUP', name: 'Science Laboratory Supplies', description: 'Chemicals, glassware and laboratory consumables' },
      { code: 'GEN-MAINT', name: 'Campus Maintenance & Repairs', description: 'Sanitary, electrical, plumbing and woodwork fixtures' },
      { code: 'SECURITY', name: 'Campus Security & Surveillance', description: 'Security guard wages, CCTV maintenance and gate monitoring' },
      { code: 'SPORTS', name: 'Sports & Physical Education', description: 'Athletic equipment, sports kits and tournament expenses' },
      { code: 'LIB-ACQ', name: 'Library Book Acquisition', description: 'Academic textbooks, journals and reference library books' },
      { code: 'MED-AID', name: 'First Aid & Student Healthcare', description: 'Sick room medical supplies and emergency first aid kits' },
      { code: 'PRINT', name: 'Exam Question & Answer Sheet Printing', description: 'Terminal exam papers, answer books and progress reports' },
      { code: 'TRANSPORT', name: 'Campus Transport & Fuel', description: 'School bus fuel, maintenance, fitness clearance and oil' }
    ];

    this.isSubmitting = true;
    let addedCount = 0;
    try {
      const existingCodes = new Set(this.dbCategories.map(c => c.code.toUpperCase()));
      for (const item of standardCategories) {
        if (!existingCodes.has(item.code.toUpperCase())) {
          await this.financeStore.createExpenseCategory(item);
          addedCount++;
        }
      }
      this.dbCategories = await this.financeStore.loadExpenseCategories();
      if (addedCount > 0) {
        this.toast.success('Categories Seeded', `Successfully imported ${addedCount} standard academic expense categories into PostgreSQL.`);
      } else {
        this.toast.info('Already Up-to-Date', 'All standard academic categories are already present in the database.');
      }
    } catch (e: any) {
      this.toast.error('Seed Error', e.message || 'Failed to seed categories.');
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  async importBulkCategoriesCsv() {
    if (!this.bulkCategoryCsv.trim()) {
      this.toast.warning('Empty CSV', 'Paste category lines in CODE, Name, Description format.');
      return;
    }

    const lines = this.bulkCategoryCsv.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    this.isSubmitting = true;
    let count = 0;
    try {
      for (const line of lines) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          const code = parts[0].toUpperCase();
          const name = parts[1];
          const desc = parts[2] || '';
          await this.financeStore.createExpenseCategory({ code, name, description: desc });
          count++;
        }
      }
      this.dbCategories = await this.financeStore.loadExpenseCategories();
      this.bulkCategoryCsv = '';
      this.toast.success('Bulk Import Complete', `Successfully imported ${count} expense categories into PostgreSQL database.`);
    } catch (e: any) {
      this.toast.error('Import Error', e.message || 'Failed to import categories.');
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  async deleteCategory(cat: ExpenseCategory) {
    if (!confirm(`Are you sure you want to delete category '${cat.name}' (${cat.code}) from database?`)) return;
    try {
      await this.financeStore.deleteExpenseCategory(cat.id);
      this.toast.success('Category Deleted', `Category '${cat.name}' removed from database.`);
      this.dbCategories = await this.financeStore.loadExpenseCategories();
      if (this.pettyCategory === cat.name && this.dbCategories.length > 0) {
        this.pettyCategory = this.dbCategories[0].name;
      }
    } catch (e: any) {
      this.toast.error('Delete Error', e.message || 'Failed to delete category.');
    }
  }

  async seedStandardAccounts() {
    this.isSubmitting = true;
    try {
      const existingNames = new Set(this.accounts.map(a => a.accountName.toLowerCase()));
      let count = 0;

      if (!existingNames.has('campus cash counter safe vault')) {
        await this.financeStore.createBankAccount({
          accountName: 'Campus Cash Counter Safe Vault',
          bankName: 'Campus Treasury Vault',
          accountNumber: `VAULT-${Date.now().toString().slice(-6)}`,
          branchName: 'Main Campus Counter',
          accountType: 'CashVault',
          openingBalance: 25000,
          isDefaultForTuition: false,
          notes: 'Counter physical cash safe float for student tuition receipt'
        });
        count++;
      }

      if (!existingNames.has('office imprest petty cash fund')) {
        await this.financeStore.createBankAccount({
          accountName: 'Office Imprest Petty Cash Fund',
          bankName: 'Imprest Cash Safe',
          accountNumber: `PETTY-${Date.now().toString().slice(-6)}`,
          branchName: 'Accounts Office',
          accountType: 'PettyCash',
          openingBalance: 15000,
          isDefaultForTuition: false,
          notes: 'Daily minor office expenses imprest float fund'
        });
        count++;
      }

      await this.loadAllData();
      if (count > 0) {
        this.toast.success('Vaults Seeded', `Successfully configured ${count} essential treasury vault accounts in PostgreSQL.`);
      } else {
        this.toast.info('Already Present', 'Essential cash vault accounts are already configured in database.');
      }
    } catch (e: any) {
      this.toast.error('Seed Error', e.message || 'Failed to seed accounts.');
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  async importBulkAccountsCsv() {
    if (!this.bulkAccountCsv.trim()) {
      this.toast.warning('Empty CSV', 'Paste account lines in AccountName,BankName,AccountNumber,BranchName,Type,OpeningBalance format.');
      return;
    }

    const lines = this.bulkAccountCsv.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    this.isSubmitting = true;
    let count = 0;
    try {
      for (const line of lines) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 3) {
          const accountName = parts[0];
          const bankName = parts[1];
          const accountNumber = parts[2];
          const branchName = parts[3] || 'Principal Branch';
          const accountType = (parts[4] || 'Current') as any;
          const openingBalance = parseFloat(parts[5] || '0') || 0;
          await this.financeStore.createBankAccount({
            accountName,
            bankName,
            accountNumber,
            branchName,
            accountType,
            openingBalance,
            isDefaultForTuition: false
          });
          count++;
        }
      }
      await this.loadAllData();
      this.bulkAccountCsv = '';
      this.toast.success('Accounts Imported', `Successfully created ${count} institutional bank accounts in PostgreSQL.`);
    } catch (e: any) {
      this.toast.error('Import Error', e.message || 'Failed to import bank accounts.');
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  // --- Modal Triggers & Form Openers ---

  openDepositModal() {
    this.depositAmount = 0;
    this.depositSlipNo = `DEP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    this.depositDescription = 'Cash counter collection deposit to commercial bank';
    if (this.commercialBankAccounts.length > 0) {
      this.depositDestinationAccountId = this.commercialBankAccounts[0].id;
    }
    this.isDepositModalOpen = true;
  }

  async submitCashToBankDeposit() {
    if (!this.vaultAccount) {
      this.toast.error('Safe Error', 'No Cash Counter Vault account found.');
      return;
    }
    if (this.depositAmount <= 0) {
      this.toast.warning('Invalid Amount', 'Enter a deposit amount greater than zero.');
      return;
    }
    if (this.vaultAccount.currentBalance < this.depositAmount) {
      this.toast.error('Insufficient Cash', `Safe vault only contains ৳ ${this.vaultAccount.currentBalance.toLocaleString()} BDT.`);
      return;
    }

    this.isSubmitting = true;
    try {
      await this.financeStore.transferBetweenAccounts({
        fromBankAccountId: this.vaultAccount.id,
        toBankAccountId: this.depositDestinationAccountId,
        amount: this.depositAmount,
        referenceNo: this.depositSlipNo,
        description: this.depositDescription
      });

      this.toast.success('Deposit Confirmed', `৳ ${this.depositAmount.toLocaleString()} BDT deposited into bank.`);
      this.isDepositModalOpen = false;
      await this.loadAllData();
    } catch (e: any) {
      this.toast.error('Deposit Error', e.message || 'Failed to complete bank deposit.');
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  openDirectDepositModal() {
    this.directDepositAmount = 0;
    this.directDepositSlipNo = `SLIP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    this.directDepositParty = 'Institutional Remittance / Grant';
    this.directDepositDescription = 'Direct bank credit / electronic remittance';
    if (this.commercialBankAccounts.length > 0) {
      this.directDepositAccountId = this.commercialBankAccounts[0].id;
    }
    this.isDirectDepositModalOpen = true;
  }

  async submitDirectDeposit() {
    if (!this.directDepositAccountId) {
      this.toast.warning('Select Account', 'Choose target commercial bank account.');
      return;
    }
    if (this.directDepositAmount <= 0) {
      this.toast.warning('Invalid Amount', 'Enter valid positive deposit amount.');
      return;
    }

    this.isSubmitting = true;
    try {
      const tx = await this.financeStore.recordBankDeposit({
        bankAccountId: this.directDepositAccountId,
        amount: this.directDepositAmount,
        referenceNo: this.directDepositSlipNo,
        description: `${this.directDepositParty}: ${this.directDepositDescription}`
      });

      this.toast.success('Deposit Credited', `৳ ${this.directDepositAmount.toLocaleString()} credited to bank ledger.`);
      this.isDirectDepositModalOpen = false;
      await this.loadAllData();
      this.viewAdviceSlip(tx);
    } catch (e: any) {
      this.toast.error('Deposit Error', e.message || 'Failed to record direct bank deposit.');
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  openWithdrawModal() {
    this.withdrawAmount = 0;
    this.withdrawChequeNo = `CHQ-${Math.floor(100000 + Math.random() * 900000)}`;
    this.withdrawPurpose = 'Campus operational cash withdrawal / Petty cash replenishment';
    if (this.commercialBankAccounts.length > 0) {
      this.withdrawAccountId = this.commercialBankAccounts[0].id;
    }
    if (this.teachers.length > 0) {
      this.withdrawBearer = this.teachers[0].fullName;
    }
    this.isWithdrawModalOpen = true;
  }

  async submitWithdrawal() {
    const acc = this.commercialBankAccounts.find(a => a.id === this.withdrawAccountId);
    if (!acc) {
      this.toast.warning('Select Bank', 'Choose source bank account.');
      return;
    }
    if (this.withdrawAmount <= 0) {
      this.toast.warning('Invalid Amount', 'Enter a valid withdrawal amount.');
      return;
    }
    if (acc.currentBalance < this.withdrawAmount) {
      this.toast.error('Insufficient Funds', `Account only has ৳ ${acc.currentBalance.toLocaleString()} BDT.`);
      return;
    }

    this.isSubmitting = true;
    try {
      const tx = await this.financeStore.recordBankWithdrawal({
        bankAccountId: acc.id,
        amount: this.withdrawAmount,
        referenceNo: this.withdrawChequeNo,
        description: `Cheque #${this.withdrawChequeNo} encashed by ${this.withdrawBearer}: ${this.withdrawPurpose}`
      });

      this.toast.success('Withdrawal Recorded', `৳ ${this.withdrawAmount.toLocaleString()} debited from ${acc.bankName}.`);
      this.isWithdrawModalOpen = false;
      await this.loadAllData();
      this.viewAdviceSlip(tx);
    } catch (e: any) {
      this.toast.error('Withdrawal Error', e.message || 'Failed to record withdrawal.');
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  openTransferModal() {
    if (this.accounts.length >= 2) {
      this.transferFromId = this.accounts[0].id;
      this.transferToId = this.accounts[1].id;
    }
    this.transferAmount = 0;
    this.transferReference = `TRX-${Date.now().toString().slice(-6)}`;
    this.transferDescription = 'Internal institutional fund transfer';
    this.isTransferModalOpen = true;
  }

  async submitTransfer() {
    if (this.transferFromId === this.transferToId) {
      this.toast.warning('Invalid Accounts', 'Source and destination cannot be the same.');
      return;
    }
    if (this.transferAmount <= 0) {
      this.toast.warning('Invalid Amount', 'Enter a transfer amount greater than zero.');
      return;
    }

    this.isSubmitting = true;
    try {
      await this.financeStore.transferBetweenAccounts({
        fromBankAccountId: this.transferFromId,
        toBankAccountId: this.transferToId,
        amount: this.transferAmount,
        referenceNo: this.transferReference,
        description: this.transferDescription
      });

      this.toast.success('Transfer Complete', `৳ ${this.transferAmount.toLocaleString()} transferred successfully.`);
      this.isTransferModalOpen = false;
      await this.loadAllData();
    } catch (e: any) {
      this.toast.error('Transfer Error', e.message || 'Transfer failed.');
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  openPettyCashModal() {
    this.pettyAmount = 0;
    this.pettyPurpose = '';
    if (this.teachers.length > 0 && !this.pettyPayee) {
      this.pettyPayee = this.teachers[0].fullName;
    }
    if (this.dbCategories.length > 0 && !this.pettyCategory) {
      this.pettyCategory = this.dbCategories[0].name;
    }
    this.isPettyModalOpen = true;
  }

  async submitPettyCashVoucher() {
    if (!this.pettyPayee.trim() || this.pettyAmount <= 0) {
      this.toast.warning('Missing Data', 'Provide payee name and valid expense amount.');
      return;
    }

    this.isSubmitting = true;
    try {
      const v = await this.financeStore.createPettyCashVoucher({
        payeeName: this.pettyPayee,
        amount: this.pettyAmount,
        category: this.pettyCategory || 'Office Stationery & Printing',
        purpose: this.pettyPurpose
      });

      this.toast.success('Voucher Issued', `Petty cash voucher ${v.voucherNo} recorded.`);
      this.isPettyModalOpen = false;
      await this.loadAllData();
      this.printPettyCashVoucher(v);
    } catch (e: any) {
      this.toast.error('Voucher Error', e.message || 'Failed to issue petty cash voucher.');
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  openReimburseModal(voucher: PettyCashVoucher) {
    if (this.commercialBankAccounts.length === 0) {
      this.toast.warning('No Bank Account', 'Open a commercial bank account before reimbursing.');
      return;
    }
    this.selectedVoucherForReimburse = voucher;
    this.reimburseBankAccountId = this.commercialBankAccounts[0].id;
    this.isReimburseModalOpen = true;
  }

  async confirmReimbursement() {
    if (!this.selectedVoucherForReimburse || !this.reimburseBankAccountId) return;

    this.isSubmitting = true;
    try {
      await this.financeStore.reimbursePettyCashVoucher(this.selectedVoucherForReimburse.id, this.reimburseBankAccountId);
      this.toast.success('Reimbursed', `Voucher ${this.selectedVoucherForReimburse.voucherNo} reimbursed from bank.`);
      this.isReimburseModalOpen = false;
      await this.loadAllData();
    } catch (e: any) {
      this.toast.error('Reimburse Error', e.message || 'Failed to reimburse voucher.');
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  openNewAccountModal() {
    this.isEditAccountMode = false;
    this.editingAccountId = '';
    this.accountForm = {
      accountName: '',
      bankName: this.scheduledBanks[0],
      accountNumber: '',
      branchName: 'Dhanmondi Principal Branch',
      accountType: 'Current',
      openingBalance: 0,
      routingNumber: '',
      swiftCode: '',
      isDefaultForTuition: false,
      notes: ''
    };
    this.isAccountModalOpen = true;
  }

  openEditAccountModal(acc: BankAccount) {
    this.isEditAccountMode = true;
    this.editingAccountId = acc.id;
    this.accountForm = {
      accountName: acc.accountName,
      bankName: acc.bankName,
      accountNumber: acc.accountNumber,
      branchName: acc.branchName,
      accountType: acc.accountType as any,
      openingBalance: acc.openingBalance,
      routingNumber: acc.routingNumber || '',
      swiftCode: acc.swiftCode || '',
      isDefaultForTuition: acc.isDefaultForTuition,
      notes: acc.notes || ''
    };
    this.isAccountModalOpen = true;
  }

  async submitAccountForm() {
    this.isSubmitting = true;
    try {
      if (this.isEditAccountMode) {
        await this.financeStore.updateBankAccount(this.editingAccountId, this.accountForm);
        this.toast.success('Account Updated', `Account ${this.accountForm.accountName} updated.`);
      } else {
        await this.financeStore.createBankAccount(this.accountForm);
        this.toast.success('Account Created', `Account ${this.accountForm.accountName} opened successfully.`);
      }
      this.isAccountModalOpen = false;
      await this.loadAllData();
    } catch (e: any) {
      this.toast.error('Account Error', e.message || 'Failed to save account details.');
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  async toggleAccountStatus(acc: BankAccount) {
    try {
      await this.financeStore.toggleBankAccountStatus(acc.id);
      this.toast.info('Status Changed', `Account is now ${acc.isActive ? 'Inactive' : 'Active'}.`);
      await this.loadAllData();
    } catch (e: any) {
      this.toast.error('Toggle Error', e.message || 'Could not update status.');
    }
  }

  openAddCategoryModal() {
    this.newCatCode = '';
    this.newCatName = '';
    this.newCatDesc = '';
    this.isCategoryModalOpen = true;
  }

  async submitNewCategory() {
    if (!this.newCatCode.trim() || !this.newCatName.trim()) {
      this.toast.warning('Required Fields', 'Provide category code and name.');
      return;
    }

    this.isSubmitting = true;
    try {
      const created = await this.financeStore.createExpenseCategory({
        code: this.newCatCode.trim().toUpperCase(),
        name: this.newCatName.trim(),
        description: this.newCatDesc.trim()
      });

      this.toast.success('Category Saved', `Category '${created.name}' stored in database.`);
      this.isCategoryModalOpen = false;
      this.dbCategories = await this.financeStore.loadExpenseCategories();
      this.pettyCategory = created.name;
    } catch (e: any) {
      this.toast.error('Category Error', e.message || 'Failed to save expense category.');
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  openQuickDeposit(acc: BankAccount) {
    this.directDepositAccountId = acc.id;
    this.directDepositAmount = 0;
    this.directDepositSlipNo = `DEP-${Date.now().toString().slice(-6)}`;
    this.directDepositParty = 'Direct Cash/Cheque Remittance';
    this.directDepositDescription = `Direct deposit credit into ${acc.accountName}`;
    this.isDirectDepositModalOpen = true;
  }

  openQuickWithdraw(acc: BankAccount) {
    this.withdrawAccountId = acc.id;
    this.withdrawAmount = 0;
    this.withdrawChequeNo = `CHQ-${Math.floor(100000 + Math.random() * 900000)}`;
    this.withdrawPurpose = `Cash withdrawal from ${acc.accountName}`;
    if (this.teachers.length > 0) this.withdrawBearer = this.teachers[0].fullName;
    this.isWithdrawModalOpen = true;
  }

  filterByAccount(accountId: string) {
    this.filterBankAccountId = accountId;
    this.activeTab = 'ledger';
    this.applyFilters();
  }

  viewAdviceSlip(tx: BankTransaction) {
    this.selectedTx = tx;
    this.isPrintModalOpen = true;
  }

  printPettyCashVoucher(p: PettyCashVoucher) {
    this.selectedTx = {
      id: p.id,
      branchId: p.branchId,
      bankAccountId: 'petty',
      accountName: 'Office Imprest Petty Cash Fund',
      accountNumber: 'PETTY-BR-02C70F-01',
      bankName: 'Imprest Cash Safe',
      transactionDate: p.voucherDate,
      transactionType: 'ExpenseDebit',
      amount: p.amount,
      balanceAfter: 0,
      referenceNo: p.voucherNo,
      description: `Petty cash disbursement for ${p.category}: ${p.purpose}`,
      counterpartyOrAccount: p.payeeName,
      transactedBy: p.approvedBy
    };
    this.isPrintModalOpen = true;
  }

  openReconciliationPrintModal() {
    this.isReconciliationPrintModalOpen = true;
  }

  triggerPrint() {
    window.print();
  }

  printReport() {
    window.print();
  }

  exportCSV() {
    if (this.filteredTransactions.length === 0) {
      this.toast.warning('Export Empty', 'No transactions to export.');
      return;
    }

    let csv = 'Date,Bank Account,Bank Name,Account No,Type,Amount (BDT),Balance After,Ref No,Description,Party\n';
    this.filteredTransactions.forEach(t => {
      csv += `"${t.transactionDate}","${t.accountName}","${t.bankName}","${t.accountNumber}","${t.transactionType}","${t.amount}","${t.balanceAfter}","${t.referenceNo || ''}","${t.description}","${t.counterpartyOrAccount || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Treasury_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toast.success('CSV Downloaded', 'Banking ledger exported successfully.');
  }

  // --- Formatters & Helpers ---

  getAccountTypeLabel(type: string): string {
    switch (type) {
      case 'Current': return 'Commercial Current';
      case 'Savings': return 'Commercial Savings';
      case 'CashVault': return 'Cash Safe Vault';
      case 'PettyCash': return 'Imprest Petty Cash';
      case 'MobileWallet': return 'Mobile Merchant';
      default: return type;
    }
  }

  getAccountTypeBadgeClass(type: string): string {
    switch (type) {
      case 'Current': return 'type-current';
      case 'Savings': return 'type-savings';
      case 'CashVault': return 'type-vault';
      case 'PettyCash': return 'type-petty';
      case 'MobileWallet': return 'type-mobile';
      default: return 'type-current';
    }
  }

  isCreditTx(type: string): boolean {
    return type === 'Deposit' || type === 'TransferIn' || type === 'CounterCashDeposit';
  }

  formatTxType(type: string): string {
    switch (type) {
      case 'Deposit': return 'Deposit Inflow';
      case 'Withdrawal': return 'Cash Withdrawal';
      case 'TransferIn': return 'Transfer In';
      case 'TransferOut': return 'Transfer Out';
      case 'CounterCashDeposit': return 'Vault Deposit';
      case 'ExpenseDebit': return 'Expense Outflow';
      case 'PayrollDisbursement': return 'Payroll Clearance';
      default: return type;
    }
  }

  getTxBadgeClass(type: string): string {
    switch (type) {
      case 'Deposit':
      case 'CounterCashDeposit':
        return 'tx-deposit';
      case 'Withdrawal':
        return 'tx-withdraw';
      case 'TransferIn':
        return 'tx-transfer-in';
      case 'TransferOut':
        return 'tx-transfer-out';
      case 'ExpenseDebit':
      case 'PayrollDisbursement':
        return 'tx-expense';
      default:
        return 'tx-deposit';
    }
  }

  getVoucherPrintHeading(type?: string): string {
    switch (type) {
      case 'Deposit':
      case 'CounterCashDeposit':
        return 'OFFICIAL BANK DEPOSIT SLIP & CREDIT ADVICE (ব্যাংক জমা রশিদ ও ক্রেডিট ভাউচার)';
      case 'Withdrawal':
        return 'OFFICIAL BANK CHEQUE WITHDRAWAL ADVICE (ব্যাংক উত্তোলন ও ডেবিট ভাউচার)';
      case 'TransferIn':
      case 'TransferOut':
        return 'INTER-ACCOUNT FUND TRANSFER ADVICE (তহবিল স্থানান্তর প্রত্যয়নপত্র)';
      case 'ExpenseDebit':
        return 'IMPREST PETTY CASH DISBURSEMENT VOUCHER (পেটি ক্যাশ ব্যয় ও অনুমোদন ভাউচার)';
      case 'PayrollDisbursement':
        return 'FACULTY PAYROLL DISBURSEMENT ADVICE (বেতন পরিশোধ ও ক্লিয়ারেন্স ভাউচার)';
      default:
        return 'OFFICIAL BANK TRANSACTION ADVICE (ব্যাংক ট্রানজেকশন ভাউচার)';
    }
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
    return inWords(Math.floor(num)) + ' Taka Only';
  }
}
