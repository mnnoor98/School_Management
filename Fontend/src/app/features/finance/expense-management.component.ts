import { Component, OnInit, ChangeDetectorRef, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceStoreService } from '../../core/services/stores/finance-store.service';
import { SystemStoreService } from '../../core/services/stores/system-store.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ExpenseCategory, ExpenseVoucher, ExpenseVoucherItem, ExpenseSummary } from '../../core/models';
import { ModalComponent } from '../../shared/components/modal.component';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-expense-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, IconComponent],
  template: `
    <div class="page-container">
      <!-- 1. PAGE HEADER -->
      <div class="page-header no-print">
        <div class="header-left">
          <div class="header-icon-box">
            <app-icon name="credit-card" [size]="28" class="text-rose"></app-icon>
          </div>
          <div>
            <div class="header-badge">
              <span class="badge-dot bg-rose"></span>
              Institutional Financial ERP • Expenditure Ledger
            </div>
            <h1 class="page-title">Campus Expense & Debit Voucher Management (ক্যাম্পাস ব্যয় ও ভাউচার)</h1>
            <p class="page-subtitle">
              Audit-ready voucher tracking, institutional bills (utilities, rent, exam printing), vendor settlements, multi-level approvals, and official 3-signature printable vouchers.
            </p>
          </div>
        </div>

        <div class="header-actions">
          <button type="button" class="btn btn-outline" (click)="activeTab = 'CATEGORIES'">
            <app-icon name="settings" [size]="16" class="text-indigo"></app-icon>
            <span>Expense Categories</span>
          </button>
          <button type="button" class="btn btn-primary" (click)="openNewVoucherModal()">
            <app-icon name="plus-circle" [size]="16"></app-icon>
            <span>+ New Debit Voucher</span>
          </button>
        </div>
      </div>

      <!-- 2. TOP KPI CARDS STRIP -->
      <div class="kpi-strip mb-4 no-print">
        <div class="kpi-card highlight-rose">
          <div class="kpi-icon-wrap bg-rose-subtle">
            <app-icon name="trending-down" [size]="20" class="text-rose"></app-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">Today's Campus Expenses</span>
            <div class="kpi-val text-rose">৳ {{ (summary?.todayTotal || 0).toLocaleString() }}</div>
            <span class="kpi-sub">Disbursed on Counter & Digital</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap bg-indigo-subtle">
            <app-icon name="calendar" [size]="20" class="text-indigo"></app-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">This Month Total Expenses</span>
            <div class="kpi-val text-indigo">৳ {{ (summary?.thisMonthTotal || 0).toLocaleString() }}</div>
            <span class="kpi-sub">Total Settled Outflow</span>
          </div>
        </div>

        <div class="kpi-card highlight-amber">
          <div class="kpi-icon-wrap bg-amber-subtle">
            <app-icon name="clock" [size]="20" class="text-amber"></app-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">Pending Voucher Approvals</span>
            <div class="kpi-val text-amber">{{ summary?.pendingApprovalCount || 0 }} Vouchers</div>
            <span class="kpi-sub">৳ {{ (summary?.pendingApprovalAmount || 0).toLocaleString() }} Pending</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap bg-emerald-subtle">
            <app-icon name="layers" [size]="20" class="text-emerald"></app-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">Active Expense Heads</span>
            <div class="kpi-val">{{ categories.length }} Heads</div>
            <span class="kpi-sub">Utilities, Rent, Printing & Labs</span>
          </div>
        </div>
      </div>

      <!-- 3. WORKSPACE TABS STRIP -->
      <div class="tabs-header-row mb-3 no-print">
        <div class="tabs-nav">
          <button
            type="button"
            class="tab-btn"
            [class.active]="activeTab === 'VOUCHERS'"
            (click)="activeTab = 'VOUCHERS'"
          >
            <app-icon name="file-text" [size]="16"></app-icon>
            <span>All Expense Vouchers (ভাউচার তালিকা)</span>
            <span class="tab-count">{{ vouchers.length }}</span>
          </button>

          <button
            type="button"
            class="tab-btn"
            [class.active]="activeTab === 'BUDGET_VARIANCE'"
            (click)="activeTab = 'BUDGET_VARIANCE'"
          >
            <app-icon name="bar-chart-2" [size]="16"></app-icon>
            <span>Budget vs Actual Variance (বাজেট বনাম ব্যয়)</span>
          </button>

          <button
            type="button"
            class="tab-btn"
            [class.active]="activeTab === 'CATEGORIES'"
            (click)="activeTab = 'CATEGORIES'"
          >
            <app-icon name="settings" [size]="16"></app-icon>
            <span>Expense Heads Configuration (ব্যয় খাত)</span>
            <span class="tab-count">{{ categories.length }}</span>
          </button>
        </div>

        <div class="tabs-actions">
          <button type="button" class="btn btn-sm btn-outline" (click)="printPage()">
            <app-icon name="printer" [size]="14"></app-icon>
            <span>Print Report</span>
          </button>
        </div>
      </div>

      <!-- TAB 1: ALL EXPENSE VOUCHERS -->
      <div *ngIf="activeTab === 'VOUCHERS'" class="no-print">
        <!-- FILTER BAR -->
        <div class="card mb-4">
          <div class="card-body filter-bar-grid">
            <div class="form-group mb-0">
              <label class="form-label text-xs">Category / Head</label>
              <select class="form-select form-select-sm" [(ngModel)]="selectedCategoryId" (change)="applyFilters()">
                <option value="ALL">All Expense Heads ({{ categories.length }})</option>
                <option *ngFor="let c of categories" [value]="c.id">{{ c.name }}</option>
              </select>
            </div>

            <div class="form-group mb-0">
              <label class="form-label text-xs">Payment Method</label>
              <select class="form-select form-select-sm" [(ngModel)]="selectedPaymentMethod" (change)="applyFilters()">
                <option value="ALL">All Payment Channels</option>
                <option value="Cash">Cash at Counter</option>
                <option value="Bank Cheque">Bank Cheque</option>
                <option value="bKash">bKash MFS</option>
                <option value="Nagad">Nagad MFS</option>
              </select>
            </div>

            <div class="form-group mb-0">
              <label class="form-label text-xs">Status</label>
              <select class="form-select form-select-sm" [(ngModel)]="selectedStatus" (change)="applyFilters()">
                <option value="ALL">All Statuses</option>
                <option value="Paid">Paid (পরিশোধিত)</option>
                <option value="Approved">Approved (অনুমোদিত)</option>
                <option value="PendingApproval">Pending Approval (অপেক্ষমাণ)</option>
                <option value="Draft">Draft (খসড়া)</option>
                <option value="Rejected">Rejected (বাতিল)</option>
              </select>
            </div>

            <div class="form-group mb-0">
              <label class="form-label text-xs">Search Payee / Voucher</label>
              <div class="search-input-wrap">
                <app-icon name="search" [size]="14" class="search-icon"></app-icon>
                <input
                  type="text"
                  class="form-control form-control-sm"
                  [(ngModel)]="searchTerm"
                  (input)="applyFilters()"
                  placeholder="Voucher #, vendor name, or notes..."
                />
              </div>
            </div>
          </div>
        </div>

        <!-- VOUCHER TABLE CARD -->
        <div class="card">
          <div class="card-header flex justify-between items-center">
            <div class="card-title">
              <app-icon name="list" [size]="18" class="text-primary"></app-icon>
              <span>Vouchers Ledger ({{ filteredVouchers.length }} items)</span>
            </div>
            <div class="text-sm font-semibold text-muted">
              Total Filtered Outflow: <strong class="text-rose font-mono">৳ {{ getFilteredTotal().toLocaleString() }}</strong>
            </div>
          </div>

          <div class="app-table-wrapper">
            <table class="app-table">
              <thead>
                <tr>
                  <th style="width: 140px;">Voucher No</th>
                  <th style="width: 120px;">Date</th>
                  <th>Expense Category / Head</th>
                  <th>Paid To (Vendor / Person)</th>
                  <th style="width: 130px;">Method</th>
                  <th style="width: 140px;" class="text-right">Amount (BDT)</th>
                  <th style="width: 120px;" class="text-center">Status</th>
                  <th style="width: 160px;" class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let v of filteredVouchers" [class.row-pending]="v.status === 'PendingApproval'">
                  <td>
                    <strong class="font-mono text-indigo font-bold cursor-pointer" (click)="openPrintVoucherModal(v)">
                      {{ v.voucherNo }}
                    </strong>
                  </td>
                  <td>{{ formatDate(v.expenseDate) }}</td>
                  <td>
                    <div class="font-semibold text-slate-800">{{ v.categoryName }}</div>
                    <span class="text-xs text-muted" *ngIf="v.notes">{{ v.notes }}</span>
                  </td>
                  <td>
                    <div class="font-medium">{{ v.paidTo }}</div>
                    <span class="text-xs font-mono text-muted" *ngIf="v.contactPhone">📱 {{ v.contactPhone }}</span>
                  </td>
                  <td>
                    <span class="channel-pill" [class.is-cash]="v.paymentMethod === 'Cash'" [class.is-mfs]="v.paymentMethod === 'bKash' || v.paymentMethod === 'Nagad'">
                      {{ v.paymentMethod }}
                    </span>
                    <div class="text-xs font-mono text-muted" *ngIf="v.bankAccountOrChequeNo">Ref: {{ v.bankAccountOrChequeNo }}</div>
                  </td>
                  <td class="text-right font-mono font-bold text-rose">
                    ৳ {{ v.amount.toLocaleString() }}
                  </td>
                  <td class="text-center">
                    <span class="status-pill" [ngClass]="'status-' + (v.status || 'paid').toLowerCase()">
                      {{ v.status }}
                    </span>
                  </td>
                  <td class="text-right">
                    <div class="flex items-center justify-end gap-1">
                      <!-- Attachment Preview Button -->
                      <button
                        *ngIf="v.attachmentUrl"
                        type="button"
                        class="btn-icon"
                        title="View Vendor Receipt Memo"
                        (click)="viewAttachment(v)"
                      >
                        <app-icon name="paperclip" [size]="15" class="text-indigo"></app-icon>
                      </button>

                      <!-- Quick Approve Button for Principal / SuperAdmin -->
                      <button
                        *ngIf="(v.status === 'PendingApproval' || v.status === 'Draft') && isApprover"
                        type="button"
                        class="btn-icon btn-icon-success"
                        title="Approve Voucher"
                        (click)="quickApprove(v)"
                      >
                        <app-icon name="check-circle" [size]="15"></app-icon>
                      </button>

                      <!-- Print Official Voucher -->
                      <button
                        type="button"
                        class="btn-icon btn-icon-primary"
                        title="Print Official Debit Voucher"
                        (click)="openPrintVoucherModal(v)"
                      >
                        <app-icon name="printer" [size]="15"></app-icon>
                      </button>

                      <!-- Delete Voucher -->
                      <button
                        *ngIf="isSuperAdmin"
                        type="button"
                        class="btn-icon btn-icon-danger"
                        title="Delete Voucher"
                        (click)="confirmDeleteVoucher(v)"
                      >
                        <app-icon name="trash-2" [size]="15"></app-icon>
                      </button>
                    </div>
                  </td>
                </tr>

                <tr *ngIf="filteredVouchers.length === 0">
                  <td colspan="8" class="text-center py-5">
                    <div class="empty-state-box">
                      <app-icon name="file-text" [size]="36" class="text-slate-300"></app-icon>
                      <h4>No Expense Vouchers Found</h4>
                      <p class="text-muted text-sm">There are no expense records matching your active filters.</p>
                      <button type="button" class="btn btn-sm btn-primary mt-2" (click)="openNewVoucherModal()">
                        Create First Debit Voucher
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 2: BUDGET VS ACTUAL VARIANCE -->
      <div *ngIf="activeTab === 'BUDGET_VARIANCE'" class="no-print">
        <div class="card mb-4">
          <div class="card-header">
            <div class="card-title">
              <app-icon name="pie-chart" [size]="18" class="text-primary"></app-icon>
              <span>Monthly Budget Allocation vs Actual Spent (চলতি মাসের বাজেট ও খরচ)</span>
            </div>
            <span class="text-xs text-muted">Budget limits configured per institutional head</span>
          </div>

          <div class="card-body">
            <div class="variance-grid">
              <div *ngFor="let cat of categories" class="variance-card">
                <div class="vc-header">
                  <div class="vc-title-wrap">
                    <span class="vc-code font-mono">{{ cat.code }}</span>
                    <h4 class="vc-name">{{ cat.name }}</h4>
                  </div>
                  <div class="vc-amounts">
                    <span class="text-xs text-muted">Spent: <strong class="text-rose font-mono">৳ {{ getCategorySpent(cat.id).toLocaleString() }}</strong></span>
                    <span class="text-xs text-muted">Budget: <strong class="font-mono">৳ {{ cat.monthlyBudgetLimit.toLocaleString() }}</strong></span>
                  </div>
                </div>

                <div class="progress-bar-wrap">
                  <div
                    class="progress-bar-fill"
                    [class.bar-ok]="getCategoryUsagePercent(cat) < 75"
                    [class.bar-warn]="getCategoryUsagePercent(cat) >= 75 && getCategoryUsagePercent(cat) <= 100"
                    [class.bar-danger]="getCategoryUsagePercent(cat) > 100"
                    [style.width.%]="Math.min(100, getCategoryUsagePercent(cat))"
                  ></div>
                </div>

                <div class="vc-footer">
                  <span class="text-xs font-semibold" [class.text-danger]="getCategoryUsagePercent(cat) > 100">
                    {{ getCategoryUsagePercent(cat) }}% Utilized
                  </span>
                  <span class="text-xs font-mono" *ngIf="cat.monthlyBudgetLimit > getCategorySpent(cat.id)">
                    ৳ {{ (cat.monthlyBudgetLimit - getCategorySpent(cat.id)).toLocaleString() }} Remaining
                  </span>
                  <span class="text-xs font-mono text-danger font-bold" *ngIf="getCategorySpent(cat.id) > cat.monthlyBudgetLimit">
                    ⚠️ ৳ {{ (getCategorySpent(cat.id) - cat.monthlyBudgetLimit).toLocaleString() }} Deficit
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: CATEGORIES MANAGEMENT -->
      <div *ngIf="activeTab === 'CATEGORIES'" class="no-print">
        <div class="card">
          <div class="card-header flex justify-between items-center">
            <div class="card-title">
              <app-icon name="settings" [size]="18" class="text-primary"></app-icon>
              <span>Configured Institutional Expense Heads (ব্যয়ের খাতসমূহ)</span>
            </div>
            <button type="button" class="btn btn-sm btn-primary" (click)="openAddCategoryModal()">
              + Add New Expense Head
            </button>
          </div>

          <div class="app-table-wrapper">
            <table class="app-table">
              <thead>
                <tr>
                  <th style="width: 120px;">Code</th>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th style="width: 180px;" class="text-right">Monthly Budget (BDT)</th>
                  <th style="width: 100px;" class="text-center">Status</th>
                  <th style="width: 100px;" class="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of categories">
                  <td><code class="font-mono font-bold">{{ c.code }}</code></td>
                  <td><strong>{{ c.name }}</strong></td>
                  <td class="text-sm text-muted">{{ c.description || 'Institutional regular operational expense head' }}</td>
                  <td class="text-right font-mono font-bold">৳ {{ c.monthlyBudgetLimit.toLocaleString() }}</td>
                  <td class="text-center">
                    <span class="status-pill status-paid" *ngIf="c.isActive">Active</span>
                    <span class="status-pill status-rejected" *ngIf="!c.isActive">Disabled</span>
                  </td>
                  <td class="text-right">
                    <button type="button" class="btn-icon" title="Edit Budget" (click)="editCategory(c)">
                      <app-icon name="edit" [size]="14"></app-icon>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- MODAL 1: NEW DEBIT VOUCHER MODAL -->
      <app-modal
        [(isOpen)]="isNewVoucherModalOpen"
        title="Issue Official Institutional Debit Voucher (নতুন ডেবিট ভাউচার)"
        subtitle="Record campus expenses, assign category, itemize particulars, and upload vendor bill."
        [maxWidth]="760"
      >
        <div class="new-voucher-modal-body">
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div class="form-group mb-0">
              <label class="form-label">Expense Date <span class="required">*</span></label>
              <input type="date" class="form-control" [(ngModel)]="voucherForm.expenseDate" />
            </div>

            <div class="form-group mb-0">
              <label class="form-label">Expense Category / Head <span class="required">*</span></label>
              <select class="form-select font-semibold" [(ngModel)]="voucherForm.expenseCategoryId">
                <option value="" disabled>Select Expense Head</option>
                <option *ngFor="let c of categories" [value]="c.id">
                  {{ c.name }} (Budget: ৳ {{ c.monthlyBudgetLimit.toLocaleString() }})
                </option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 mb-3">
            <div class="form-group mb-0">
              <label class="form-label">Paid To (Vendor / Company / Person) <span class="required">*</span></label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="voucherForm.paidTo"
                placeholder="e.g. DESCO, WASA, Nilkhet Press, Universal Stationary"
              />
            </div>

            <div class="form-group mb-0">
              <label class="form-label">Vendor Contact Phone / Ref</label>
              <input
                type="text"
                class="form-control font-mono"
                [(ngModel)]="voucherForm.contactPhone"
                placeholder="+880 17... or Invoice Ref #"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 mb-3">
            <div class="form-group mb-0">
              <label class="form-label">Payment Channel <span class="required">*</span></label>
              <select class="form-select font-semibold" [(ngModel)]="voucherForm.paymentMethod">
                <option value="Cash">Cash at Counter (নগদ)</option>
                <option value="Bank Cheque">Bank Cheque / Corporate Account (ব্যাংক চেক)</option>
                <option value="bKash">bKash Merchant MFS (বিকাশ)</option>
                <option value="Nagad">Nagad Merchant MFS (নগদ)</option>
              </select>
            </div>

            <div class="form-group mb-0">
              <label class="form-label">Cheque No / Bank Account / Trx ID</label>
              <input
                type="text"
                class="form-control font-mono"
                [(ngModel)]="voucherForm.bankAccountOrChequeNo"
                placeholder="Cheque # or Trx Reference"
              />
            </div>
          </div>

          <!-- DYNAMIC LINE ITEMS TABLE -->
          <div class="line-items-block mb-3">
            <div class="flex justify-between items-center mb-2">
              <span class="text-xs font-bold uppercase text-slate-600">Itemized Breakdown & Particulars</span>
              <button type="button" class="btn btn-xs btn-outline-primary" (click)="addLineItem()">
                + Add Particular Row
              </button>
            </div>

            <table class="line-items-table">
              <thead>
                <tr>
                  <th>Particulars / Description</th>
                  <th style="width: 80px;">Qty</th>
                  <th style="width: 120px;">Unit Price (৳)</th>
                  <th style="width: 130px;" class="text-right">Total (৳)</th>
                  <th style="width: 40px;"></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of voucherForm.items; let idx = index">
                  <td>
                    <input
                      type="text"
                      class="form-control form-control-sm"
                      [(ngModel)]="item.particulars"
                      placeholder="Item detail..."
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      class="form-control form-control-sm text-center"
                      [(ngModel)]="item.quantity"
                      (input)="calculateItemTotal(item)"
                      min="1"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      class="form-control form-control-sm font-mono text-right"
                      [(ngModel)]="item.unitPrice"
                      (input)="calculateItemTotal(item)"
                      min="0"
                    />
                  </td>
                  <td class="text-right font-mono font-bold text-rose">
                    ৳ {{ (item.quantity * item.unitPrice).toLocaleString() }}
                  </td>
                  <td class="text-center">
                    <button
                      *ngIf="voucherForm.items.length > 1"
                      type="button"
                      class="btn-trash-row"
                      (click)="removeLineItem(idx)"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="items-total-strip">
              <span>Grand Total Outflow:</span>
              <strong class="font-mono text-rose text-base">৳ {{ getFormGrandTotal().toLocaleString() }} BDT</strong>
            </div>
          </div>

          <!-- NOTES & ATTACHMENT -->
          <div class="form-group mb-3">
            <label class="form-label">Purpose & Operational Notes</label>
            <textarea
              class="form-control"
              rows="2"
              [(ngModel)]="voucherForm.notes"
              placeholder="Official purpose or administrative remarks..."
            ></textarea>
          </div>

          <div class="form-group mb-0">
            <label class="form-label">Attach Cash Memo / Vendor Receipt (Optional)</label>
            <div class="upload-box">
              <input type="file" (change)="onFileSelected($event)" accept="image/*,.pdf" class="file-input" />
              <div class="upload-placeholder" *ngIf="!voucherForm.attachmentUrl && !isUploading">
                <app-icon name="upload" [size]="20" class="text-muted"></app-icon>
                <span>Click to upload scanned bill or photo (JPEG, PNG, PDF)</span>
              </div>
              <div class="upload-preview" *ngIf="voucherForm.attachmentUrl">
                <app-icon name="check-circle" [size]="18" class="text-emerald"></app-icon>
                <span class="text-emerald font-semibold text-xs">Memo Attached: {{ voucherForm.attachmentUrl }}</span>
              </div>
              <div *ngIf="isUploading" class="text-xs text-indigo">Uploading file...</div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2" footer>
          <button type="button" class="btn btn-outline" (click)="isNewVoucherModalOpen = false">Cancel</button>
          <button
            type="button"
            class="btn btn-primary"
            [disabled]="isSubmitting || !voucherForm.expenseCategoryId || !voucherForm.paidTo || getFormGrandTotal() <= 0"
            (click)="submitVoucher()"
          >
            <span *ngIf="isSubmitting">Posting Voucher...</span>
            <span *ngIf="!isSubmitting">Post & Issue Voucher (৳ {{ getFormGrandTotal().toLocaleString() }})</span>
          </button>
        </div>
      </app-modal>

      <!-- MODAL 2: PRINTABLE OFFICIAL INSTITUTIONAL DEBIT VOUCHER -->
      <app-modal
        [(isOpen)]="isPrintModalOpen"
        title="Official Campus Debit Voucher (প্রাতিষ্ঠানিক ডেবিট ভাউচার)"
        subtitle="Authorized 3-Signature Institutional Expense Document"
        [maxWidth]="820"
      >
        <div *ngIf="selectedVoucher" class="voucher-print-container">
          <!-- Top Print Actions -->
          <div class="receipt-top-actions no-print mb-3">
            <div class="flex items-center gap-2">
              <span class="status-pill" [ngClass]="'status-' + (selectedVoucher.status || 'paid').toLowerCase()">
                Status: {{ selectedVoucher.status }}
              </span>
              <span class="text-xs text-muted" *ngIf="selectedVoucher.approvedBy">
                Approved by: <strong>{{ selectedVoucher.approvedBy }}</strong>
              </span>
            </div>

            <div class="flex gap-2">
              <button
                *ngIf="selectedVoucher.status === 'PendingApproval' && isApprover"
                type="button"
                class="btn btn-sm btn-success"
                (click)="quickApprove(selectedVoucher)"
              >
                <app-icon name="check" [size]="14"></app-icon>
                <span>Approve Voucher</span>
              </button>
              <button type="button" class="btn btn-sm btn-primary" (click)="printVoucher()">
                <app-icon name="printer" [size]="14"></app-icon>
                <span>Print Official Voucher</span>
              </button>
            </div>
          </div>

          <!-- PRINTABLE OFFICIAL VOUCHER BODY -->
          <div class="printable-voucher-sheet printable-area">
            <!-- Header / Letterhead -->
            <div class="voucher-header-box">
              <div class="vh-logo">
                <app-icon name="graduation-cap" [size]="36" class="text-indigo"></app-icon>
              </div>
              <div class="vh-info">
                <h2>{{ school.name }}</h2>
                <p class="vh-sub">{{ school.address }} • Accounts & Finance Division</p>
                <div class="vh-meta">
                  <span>EIIN: 108422</span> • <span>Reg: 4920/2012</span> • <span>Institutional Expenditure</span>
                </div>
              </div>
              <div class="vh-title-badge">
                <div class="title-main">DEBIT VOUCHER</div>
                <div class="title-bengali">ডেবিট / খরচ ভাউচার</div>
              </div>
            </div>

            <!-- Meta Strip -->
            <div class="voucher-meta-strip">
              <div><span class="vm-lbl">Voucher No:</span> <strong class="font-mono text-indigo font-bold">{{ selectedVoucher.voucherNo }}</strong></div>
              <div><span class="vm-lbl">Voucher Date:</span> <strong>{{ formatVoucherDate(selectedVoucher.expenseDate) }}</strong></div>
              <div><span class="vm-lbl">Payment Channel:</span> <strong>{{ selectedVoucher.paymentMethod }}</strong></div>
              <div><span class="vm-lbl">Ref / Cheque:</span> <span class="font-mono">{{ selectedVoucher.bankAccountOrChequeNo || 'N/A' }}</span></div>
            </div>

            <!-- Payee Profile Grid -->
            <div class="voucher-payee-grid">
              <div><span class="vp-lbl">Paid To (গ্রহীতা):</span> <strong>{{ selectedVoucher.paidTo }}</strong></div>
              <div><span class="vp-lbl">Expense Category:</span> <strong class="text-slate-800">{{ selectedVoucher.categoryName }}</strong></div>
              <div><span class="vp-lbl">Contact Phone:</span> <span class="font-mono">{{ selectedVoucher.contactPhone || 'N/A' }}</span></div>
              <div><span class="vp-lbl">Authorized Officer:</span> <strong>{{ selectedVoucher.createdBy }}</strong></div>
            </div>

            <!-- Itemized Table -->
            <table class="voucher-items-table">
              <thead>
                <tr>
                  <th style="width: 40px;">SL</th>
                  <th>Particulars / Description of Expense</th>
                  <th style="width: 80px;" class="text-center">Qty</th>
                  <th style="width: 120px;" class="text-right">Rate (BDT)</th>
                  <th style="width: 140px;" class="text-right">Amount (BDT)</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of selectedVoucher.items; let idx = index">
                  <td>{{ idx + 1 }}</td>
                  <td><strong>{{ item.particulars }}</strong></td>
                  <td class="text-center">{{ item.quantity }}</td>
                  <td class="text-right font-mono">৳ {{ item.unitPrice.toLocaleString() }}</td>
                  <td class="text-right font-mono font-bold">৳ {{ item.amount.toLocaleString() }}</td>
                </tr>
                <tr *ngIf="selectedVoucher.items.length === 0">
                  <td>1</td>
                  <td><strong>{{ selectedVoucher.notes || selectedVoucher.categoryName }}</strong></td>
                  <td class="text-center">1</td>
                  <td class="text-right font-mono">৳ {{ selectedVoucher.amount.toLocaleString() }}</td>
                  <td class="text-right font-mono font-bold">৳ {{ selectedVoucher.amount.toLocaleString() }}</td>
                </tr>
              </tbody>
            </table>

            <!-- Total Block & In Words -->
            <div class="voucher-total-block">
              <div class="words-part">
                <span class="words-lbl">In Words (কথায়):</span>
                <strong class="words-text">{{ numberToWords(selectedVoucher.amount) }}</strong>
                <div class="notes-line" *ngIf="selectedVoucher.notes">
                  <span class="notes-lbl">Remarks:</span> {{ selectedVoucher.notes }}
                </div>
              </div>
              <div class="figure-part">
                <span class="fig-lbl">Total Disbursed:</span>
                <strong class="fig-amount font-mono">৳ {{ selectedVoucher.amount.toLocaleString() }} BDT</strong>
              </div>
            </div>

            <!-- 3-SIGNATURES AUDIT MATRIX -->
            <div class="voucher-signatures-grid">
              <div class="sig-col">
                <div class="sig-line"></div>
                <span class="sig-name">Prepared By</span>
                <span class="sig-sub">হিসাব সহকারী / ভাউচার প্রস্তুতকারী</span>
              </div>

              <div class="sig-col text-center">
                <div class="sig-line mx-auto"></div>
                <span class="sig-name">Verified By</span>
                <span class="sig-sub">প্রধান হিসাবরক্ষক / Accountant</span>
              </div>

              <div class="sig-col text-right">
                <div class="sig-line ml-auto"></div>
                <span class="sig-name">Approved By</span>
                <span class="sig-sub">অধ্যক্ষ / সভাপতি / Principal</span>
              </div>
            </div>
          </div>
        </div>
      </app-modal>

      <!-- MODAL 3: VIEW VENDOR RECEIPT ATTACHMENT -->
      <app-modal
        [(isOpen)]="isAttachmentModalOpen"
        title="Scanned Vendor Cash Memo & Receipt (ক্যাশমেমো সংযুক্তি)"
        [maxWidth]="680"
      >
        <div *ngIf="activeAttachmentUrl" class="text-center py-2">
          <img [src]="activeAttachmentUrl" alt="Vendor Cash Memo" class="max-w-full rounded shadow border" />
        </div>
        <div class="flex justify-end" footer>
          <button type="button" class="btn btn-outline" (click)="isAttachmentModalOpen = false">Close</button>
        </div>
      </app-modal>

      <!-- MODAL 4: ADD/EDIT CATEGORY MODAL -->
      <app-modal
        [(isOpen)]="isCategoryModalOpen"
        title="Configure Expense Category Head (ব্যয় খাত কনফিগারেশন)"
        [maxWidth]="540"
      >
        <div class="py-2">
          <div class="form-group mb-3">
            <label class="form-label">Category Name <span class="required">*</span></label>
            <input type="text" class="form-control" [(ngModel)]="categoryForm.name" placeholder="e.g. Science Lab Supplies" />
          </div>
          <div class="form-group mb-3">
            <label class="form-label">Category Code (Short)</label>
            <input type="text" class="form-control font-mono uppercase" [(ngModel)]="categoryForm.code" placeholder="e.g. LAB-SCI" />
          </div>
          <div class="form-group mb-3">
            <label class="form-label">Monthly Budget Limit (BDT)</label>
            <input type="number" class="form-control font-mono" [(ngModel)]="categoryForm.monthlyBudgetLimit" placeholder="50000" />
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Description / Scope</label>
            <textarea class="form-control" rows="2" [(ngModel)]="categoryForm.description" placeholder="Description of allowable expenses..."></textarea>
          </div>
        </div>

        <div class="flex justify-end gap-2" footer>
          <button type="button" class="btn btn-outline" (click)="isCategoryModalOpen = false">Cancel</button>
          <button type="button" class="btn btn-primary" (click)="saveCategory()">Save Head</button>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px 32px;
      max-width: 1540px;
      margin: 0 auto;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .header-icon-box {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      background: #fff1f2;
      border: 1px solid #fecdd3;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      color: #9f1239;
      background: #ffe4e6;
      padding: 2px 8px;
      border-radius: 4px;
      margin-bottom: 4px;
    }
    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    .page-title {
      font-size: 1.45rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 4px 0;
    }
    .page-subtitle {
      font-size: 0.8125rem;
      color: #64748b;
      margin: 0;
      max-width: 800px;
    }
    .header-actions {
      display: flex;
      gap: 10px;
    }

    /* KPI Strip */
    .kpi-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
    }
    @media (max-width: 1100px) {
      .kpi-strip { grid-template-columns: repeat(2, 1fr); }
    }
    .kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .kpi-card.highlight-rose { border-left: 4px solid #e11d48; }
    .kpi-card.highlight-amber { border-left: 4px solid #d97706; }
    .kpi-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .bg-rose-subtle { background: #ffe4e6; }
    .bg-indigo-subtle { background: #e0e7ff; }
    .bg-amber-subtle { background: #fef3c7; }
    .bg-emerald-subtle { background: #dcfce7; }
    .kpi-body { flex: 1; }
    .kpi-label { font-size: 0.75rem; color: #64748b; font-weight: 600; display: block; }
    .kpi-val { font-size: 1.35rem; font-weight: 800; color: #0f172a; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .kpi-sub { font-size: 0.7rem; color: #94a3b8; }

    /* Tabs */
    .tabs-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 6px 12px;
    }
    .tabs-nav {
      display: flex;
      gap: 8px;
    }
    .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border: none;
      background: transparent;
      border-radius: 6px;
      font-size: 0.8125rem;
      font-weight: 700;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tab-btn:hover { background: #f8fafc; color: #0f172a; }
    .tab-btn.active { background: #0f172a; color: #ffffff; }
    .tab-count {
      font-size: 0.7rem;
      padding: 1px 6px;
      border-radius: 10px;
      background: rgba(148, 163, 184, 0.2);
    }
    .tab-btn.active .tab-count { background: rgba(255, 255, 255, 0.2); color: #ffffff; }

    /* Filter Bar */
    .filter-bar-grid {
      display: grid;
      grid-template-columns: 2fr 1.5fr 1.5fr 2.5fr;
      gap: 12px;
    }
    .search-input-wrap {
      position: relative;
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

    /* Cards & Tables */
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      margin-bottom: 20px;
    }
    .card-header {
      padding: 14px 20px;
      border-bottom: 1px solid #f1f5f9;
      background: #fafafa;
    }
    .card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.95rem;
      font-weight: 800;
      color: #0f172a;
    }
    .card-body { padding: 18px 20px; }
    .app-table-wrapper { overflow-x: auto; }
    .app-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }
    .app-table th {
      background: #f8fafc;
      padding: 10px 14px;
      text-align: left;
      font-weight: 700;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
      white-space: nowrap;
    }
    .app-table td {
      padding: 10px 14px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .app-table tr:hover td { background: #f8fafc; }
    .row-pending td { background: #fffbeb !important; }

    /* Pills & Badges */
    .channel-pill {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      background: #f1f5f9;
      color: #475569;
    }
    .channel-pill.is-cash { background: #dcfce7; color: #15803d; }
    .channel-pill.is-mfs { background: #fce7f3; color: #be185d; }
    .status-pill {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .status-paid { background: #dcfce7; color: #166534; }
    .status-approved { background: #e0e7ff; color: #3730a3; }
    .status-pendingapproval { background: #fef3c7; color: #92400e; }
    .status-draft { background: #f1f5f9; color: #475569; }
    .status-rejected { background: #ffe4e6; color: #9f1239; }

    /* Action Buttons */
    .btn-icon {
      width: 30px;
      height: 30px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #475569;
      transition: all 0.15s;
    }
    .btn-icon:hover { background: #f1f5f9; color: #0f172a; }
    .btn-icon-success:hover { background: #dcfce7; color: #15803d; border-color: #86efac; }
    .btn-icon-primary:hover { background: #e0e7ff; color: #3730a3; border-color: #a5b4fc; }
    .btn-icon-danger:hover { background: #ffe4e6; color: #e11d48; border-color: #fecdd3; }

    /* Line items table inside modal */
    .line-items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.78rem;
    }
    .line-items-table th {
      background: #f8fafc;
      padding: 6px 8px;
      border-bottom: 1px solid #e2e8f0;
      color: #64748b;
      font-weight: 700;
    }
    .line-items-table td {
      padding: 6px 8px;
      border-bottom: 1px solid #f1f5f9;
    }
    .btn-trash-row {
      border: none;
      background: #fee2e2;
      color: #dc2626;
      width: 24px;
      height: 24px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    }
    .items-total-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fff1f2;
      border: 1px solid #fecdd3;
      padding: 8px 12px;
      border-radius: 6px;
      margin-top: 8px;
      font-size: 0.82rem;
    }
    .upload-box {
      position: relative;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 12px;
      text-align: center;
      background: #f8fafc;
      cursor: pointer;
    }
    .file-input {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      opacity: 0; cursor: pointer;
    }
    .upload-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Variance Grid */
    .variance-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
    }
    @media (max-width: 990px) {
      .variance-grid { grid-template-columns: 1fr; }
    }
    .variance-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
      background: #ffffff;
    }
    .vc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    .vc-code {
      font-size: 0.65rem;
      font-weight: 800;
      background: #f1f5f9;
      color: #475569;
      padding: 1px 6px;
      border-radius: 4px;
    }
    .vc-name {
      font-size: 0.85rem;
      font-weight: 700;
      margin: 4px 0 0 0;
      color: #0f172a;
    }
    .vc-amounts {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .progress-bar-wrap {
      width: 100%;
      height: 8px;
      background: #f1f5f9;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 6px;
    }
    .progress-bar-fill {
      height: 100%;
      transition: width 0.3s;
    }
    .bar-ok { background: #10b981; }
    .bar-warn { background: #f59e0b; }
    .bar-danger { background: #ef4444; }
    .vc-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* PRINTABLE OFFICIAL DEBIT VOUCHER */
    .printable-voucher-sheet {
      background: #ffffff;
      border: 1.5px solid #0f172a;
      border-radius: 6px;
      padding: 16px 20px;
    }
    .voucher-header-box {
      display: flex;
      align-items: center;
      gap: 14px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .vh-logo {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .vh-info { flex: 1; }
    .vh-info h2 { font-size: 1.15rem; font-weight: 800; margin: 0; color: #0f172a; }
    .vh-sub { font-size: 0.72rem; color: #64748b; margin: 2px 0; }
    .vh-meta { font-size: 0.68rem; color: #475569; font-weight: 600; }
    .vh-title-badge { text-align: right; }
    .title-main { font-size: 0.95rem; font-weight: 900; letter-spacing: 0.05em; color: #0f172a; }
    .title-bengali { font-size: 0.7rem; color: #64748b; }
    
    .voucher-meta-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 0.75rem;
      margin-bottom: 10px;
    }
    .vm-lbl { color: #64748b; margin-right: 4px; }

    .voucher-payee-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px 14px;
      font-size: 0.78rem;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 10px;
    }
    .vp-lbl { color: #64748b; margin-right: 6px; }

    .voucher-items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.78rem;
      margin-bottom: 12px;
    }
    .voucher-items-table th {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      color: #0f172a;
      font-weight: 700;
    }
    .voucher-items-table td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
    }

    .voucher-total-block {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 30px;
      gap: 16px;
    }
    .words-part { flex: 1; }
    .words-lbl { font-size: 0.72rem; color: #475569; margin-right: 6px; }
    .words-text { font-size: 0.78rem; font-weight: 700; color: #0f172a; }
    .notes-line { font-size: 0.7rem; color: #64748b; margin-top: 4px; }
    .notes-lbl { font-weight: 700; }
    .figure-part { text-align: right; }
    .fig-lbl { font-size: 0.7rem; color: #64748b; display: block; }
    .fig-amount { font-size: 1.15rem; color: #e11d48; }

    .voucher-signatures-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 40px;
    }
    .sig-col { font-size: 0.72rem; }
    .sig-line { width: 130px; border-top: 1px dashed #64748b; margin-bottom: 4px; }
    .sig-name { font-weight: 800; display: block; color: #0f172a; }
    .sig-sub { font-size: 0.65rem; color: #64748b; }

    /* @media print */
    @media print {
      @page {
        size: A4 portrait;
        margin: 8mm 10mm;
      }
      .no-print, .receipt-top-actions {
        display: none !important;
      }
      body.printing-voucher .page-container > *:not(app-modal) {
        display: none !important;
      }
      ::ng-deep body.printing-voucher app-modal .modal-backdrop {
        position: static !important;
        background: transparent !important;
        backdrop-filter: none !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        height: auto !important;
        display: block !important;
        overflow: visible !important;
      }
      ::ng-deep body.printing-voucher app-modal .modal-container {
        position: static !important;
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
        border: none !important;
        box-shadow: none !important;
        background: transparent !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      ::ng-deep body.printing-voucher app-modal .modal-header,
      ::ng-deep body.printing-voucher app-modal .btn-close {
        display: none !important;
      }
      ::ng-deep body.printing-voucher app-modal .modal-body {
        padding: 0 !important;
        margin: 0 !important;
        overflow: visible !important;
        max-height: none !important;
        height: auto !important;
      }
      .printable-voucher-sheet {
        border: 1.5px solid #000000 !important;
        padding: 10px 14px !important;
      }
    }

    /* General Helpers */
    .text-rose { color: #e11d48; }
    .text-indigo { color: #4f46e5; }
    .text-amber { color: #d97706; }
    .text-emerald { color: #059669; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .font-bold { font-weight: 700; }
    .cursor-pointer { cursor: pointer; }
    .flex { display: flex; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .justify-end { justify-content: flex-end; }
    .gap-1 { gap: 4px; }
    .gap-2 { gap: 8px; }
    .gap-3 { gap: 12px; }
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: 1fr 1fr; }
    .mb-0 { margin-bottom: 0; }
    .mb-2 { margin-bottom: 8px; }
    .mb-3 { margin-bottom: 12px; }
    .mb-4 { margin-bottom: 16px; }
    .mt-1 { margin-top: 4px; }
    .mt-2 { margin-top: 8px; }
    .mt-3 { margin-top: 12px; }
    .mx-auto { margin-left: auto; margin-right: auto; }
    .ml-auto { margin-left: auto; }
    .py-2 { padding-top: 8px; padding-bottom: 8px; }
    .py-5 { padding-top: 24px; padding-bottom: 24px; }
  `]
})
export class ExpenseManagementComponent implements OnInit {
  private financeStore = inject(FinanceStoreService);
  private systemStore = inject(SystemStoreService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  school = this.systemStore.getSchool();
  Math = Math;

  categories: ExpenseCategory[] = [];
  vouchers: ExpenseVoucher[] = [];
  filteredVouchers: ExpenseVoucher[] = [];
  summary: ExpenseSummary | null = null;

  activeTab: 'VOUCHERS' | 'BUDGET_VARIANCE' | 'CATEGORIES' = 'VOUCHERS';

  // Filters
  selectedCategoryId = 'ALL';
  selectedPaymentMethod = 'ALL';
  selectedStatus = 'ALL';
  searchTerm = '';

  // Modals state
  isNewVoucherModalOpen = false;
  isPrintModalOpen = false;
  isAttachmentModalOpen = false;
  isCategoryModalOpen = false;

  selectedVoucher: ExpenseVoucher | null = null;
  activeAttachmentUrl: string | null = null;

  isSubmitting = false;
  isUploading = false;

  // New Voucher Form
  voucherForm = {
    expenseDate: new Date().toISOString().split('T')[0],
    expenseCategoryId: '',
    paidTo: '',
    contactPhone: '',
    paymentMethod: 'Cash',
    bankAccountOrChequeNo: '',
    status: 'Paid',
    notes: '',
    attachmentUrl: '',
    items: [
      { particulars: '', quantity: 1, unitPrice: 0, amount: 0 }
    ]
  };

  // Category Form
  categoryForm = {
    id: '',
    name: '',
    code: '',
    description: '',
    monthlyBudgetLimit: 25000
  };

  get isSuperAdmin(): boolean {
    const role = this.auth.getCurrentUser()?.roleName || '';
    return role === 'Super Admin' || role === 'SUPER_ADMIN';
  }

  get isApprover(): boolean {
    const role = this.auth.getCurrentUser()?.roleName || '';
    return role === 'Super Admin' || role === 'Principal' || role === 'Headmaster';
  }

  async ngOnInit() {
    await this.loadAll();
  }

  async loadAll() {
    try {
      this.categories = await this.financeStore.loadExpenseCategories();
      this.vouchers = await this.financeStore.loadExpenseVouchers();
      this.summary = await this.financeStore.getExpenseSummary();
      this.applyFilters();
      this.cdr.markForCheck();
    } catch (e: any) {
      console.warn('Expense load error:', e);
    }
  }

  applyFilters() {
    let result = [...this.vouchers];

    if (this.selectedCategoryId !== 'ALL') {
      result = result.filter(v => v.expenseCategoryId === this.selectedCategoryId);
    }

    if (this.selectedPaymentMethod !== 'ALL') {
      result = result.filter(v => v.paymentMethod === this.selectedPaymentMethod);
    }

    if (this.selectedStatus !== 'ALL') {
      result = result.filter(v => v.status === this.selectedStatus);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(v =>
        v.voucherNo.toLowerCase().includes(term) ||
        v.paidTo.toLowerCase().includes(term) ||
        v.categoryName.toLowerCase().includes(term) ||
        (v.notes && v.notes.toLowerCase().includes(term))
      );
    }

    this.filteredVouchers = result;
    this.cdr.markForCheck();
  }

  getFilteredTotal(): number {
    return this.filteredVouchers
      .filter(v => v.status !== 'Rejected')
      .reduce((sum, v) => sum + v.amount, 0);
  }

  getCategorySpent(categoryId: string): number {
    return this.vouchers
      .filter(v => v.expenseCategoryId === categoryId && v.status !== 'Rejected')
      .reduce((sum, v) => sum + v.amount, 0);
  }

  getCategoryUsagePercent(cat: ExpenseCategory): number {
    if (!cat.monthlyBudgetLimit || cat.monthlyBudgetLimit <= 0) return 0;
    const spent = this.getCategorySpent(cat.id);
    return Math.round((spent / cat.monthlyBudgetLimit) * 100);
  }

  // --- Modal Triggers ---
  openNewVoucherModal() {
    this.voucherForm = {
      expenseDate: new Date().toISOString().split('T')[0],
      expenseCategoryId: this.categories.length > 0 ? this.categories[0].id : '',
      paidTo: '',
      contactPhone: '',
      paymentMethod: 'Cash',
      bankAccountOrChequeNo: '',
      status: 'Paid',
      notes: '',
      attachmentUrl: '',
      items: [
        { particulars: '', quantity: 1, unitPrice: 0, amount: 0 }
      ]
    };
    this.isNewVoucherModalOpen = true;
    this.cdr.markForCheck();
  }

  addLineItem() {
    this.voucherForm.items.push({ particulars: '', quantity: 1, unitPrice: 0, amount: 0 });
    this.cdr.markForCheck();
  }

  removeLineItem(index: number) {
    if (this.voucherForm.items.length > 1) {
      this.voucherForm.items.splice(index, 1);
      this.cdr.markForCheck();
    }
  }

  calculateItemTotal(item: any) {
    item.amount = (item.quantity || 0) * (item.unitPrice || 0);
  }

  getFormGrandTotal(): number {
    return this.voucherForm.items.reduce((sum, i) => sum + ((i.quantity || 1) * (i.unitPrice || 0)), 0);
  }

  async submitVoucher() {
    if (!this.voucherForm.expenseCategoryId || !this.voucherForm.paidTo || this.getFormGrandTotal() <= 0) return;

    this.isSubmitting = true;
    try {
      const payload = {
        expenseDate: this.voucherForm.expenseDate,
        expenseCategoryId: this.voucherForm.expenseCategoryId,
        totalAmount: this.getFormGrandTotal(),
        paidTo: this.voucherForm.paidTo,
        contactPhone: this.voucherForm.contactPhone,
        paymentMethod: this.voucherForm.paymentMethod,
        bankAccountOrChequeNo: this.voucherForm.bankAccountOrChequeNo,
        status: this.voucherForm.status,
        notes: this.voucherForm.notes,
        attachmentUrl: this.voucherForm.attachmentUrl,
        items: this.voucherForm.items.map(i => ({
          particulars: i.particulars || 'Item description',
          quantity: i.quantity || 1,
          unitPrice: i.unitPrice || 0,
          amount: (i.quantity || 1) * (i.unitPrice || 0)
        }))
      };

      const res = await this.financeStore.createExpenseVoucher(payload);
      this.toast.success('Debit Voucher Posted', `Voucher ${res.voucherNo} (৳ ${res.amount.toLocaleString()}) issued successfully.`);
      this.isNewVoucherModalOpen = false;
      await this.loadAll();
    } catch (e: any) {
      this.toast.error('Voucher Error', e?.message || 'Could not post expense voucher.');
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  async onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      this.isUploading = true;
      try {
        const url = await this.financeStore.uploadExpenseAttachment(file);
        this.voucherForm.attachmentUrl = url;
        this.toast.success('Receipt Attached', 'Scanned memo image uploaded successfully.');
      } catch (e: any) {
        this.toast.error('Upload Failed', e?.message || 'Could not upload attachment.');
      } finally {
        this.isUploading = false;
        this.cdr.markForCheck();
      }
    }
  }

  openPrintVoucherModal(voucher: ExpenseVoucher) {
    this.selectedVoucher = voucher;
    this.isPrintModalOpen = true;
    this.cdr.markForCheck();
  }

  viewAttachment(voucher: ExpenseVoucher) {
    if (voucher.attachmentUrl) {
      this.activeAttachmentUrl = voucher.attachmentUrl;
      this.isAttachmentModalOpen = true;
      this.cdr.markForCheck();
    }
  }

  async quickApprove(voucher: ExpenseVoucher) {
    try {
      await this.financeStore.approveExpenseVoucher(voucher.id, 'Approve');
      this.toast.success('Voucher Approved', `Voucher ${voucher.voucherNo} marked as verified and approved.`);
      await this.loadAll();
      if (this.selectedVoucher && this.selectedVoucher.id === voucher.id) {
        this.selectedVoucher.status = 'Approved';
      }
    } catch (e: any) {
      this.toast.error('Approval Error', e?.message || 'Could not approve voucher.');
    }
  }

  async confirmDeleteVoucher(voucher: ExpenseVoucher) {
    if (confirm(`Are you sure you want to delete Debit Voucher ${voucher.voucherNo} (৳ ${voucher.amount.toLocaleString()})?`)) {
      try {
        await this.financeStore.deleteExpenseVoucher(voucher.id);
        this.toast.info('Voucher Deleted', `Debit voucher ${voucher.voucherNo} deleted.`);
        await this.loadAll();
      } catch (e: any) {
        this.toast.error('Delete Error', e?.message || 'Could not delete voucher.');
      }
    }
  }

  // --- Category Modal Handlers ---
  openAddCategoryModal() {
    this.categoryForm = { id: '', name: '', code: '', description: '', monthlyBudgetLimit: 25000 };
    this.isCategoryModalOpen = true;
    this.cdr.markForCheck();
  }

  editCategory(cat: ExpenseCategory) {
    this.categoryForm = {
      id: cat.id,
      name: cat.name,
      code: cat.code,
      description: cat.description || '',
      monthlyBudgetLimit: cat.monthlyBudgetLimit
    };
    this.isCategoryModalOpen = true;
    this.cdr.markForCheck();
  }

  async saveCategory() {
    if (!this.categoryForm.name) return;
    try {
      await this.financeStore.createExpenseCategory(this.categoryForm);
      this.toast.success('Category Saved', `Expense head '${this.categoryForm.name}' configured.`);
      this.isCategoryModalOpen = false;
      await this.loadAll();
    } catch (e: any) {
      this.toast.error('Save Error', e?.message || 'Could not save category.');
    }
  }

  // --- Printing Handlers ---
  @HostListener('window:beforeprint')
  onBeforePrint() {
    if (this.isPrintModalOpen) {
      document.body.classList.add('printing-voucher');
    }
  }

  @HostListener('window:afterprint')
  onAfterPrint() {
    document.body.classList.remove('printing-voucher');
  }

  printVoucher() {
    document.body.classList.add('printing-voucher');
    this.cdr.detectChanges();
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing-voucher');
      }, 1000);
    }, 100);
  }

  printPage() {
    window.print();
  }

  formatDate(d: string | undefined): string {
    if (!d) return '';
    try {
      const dt = new Date(d);
      return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return d;
    }
  }

  formatVoucherDate(d: string | undefined): string {
    if (!d) return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    try {
      const dt = new Date(d);
      return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return d;
    }
  }

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
