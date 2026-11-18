import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminStoreService, SystemStoreService } from '../../../core/services/stores';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon.component';

@Component({
  selector: 'app-accountant-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <div class="accountant-dashboard animate-fade-in">
      <!-- 1. CASHIER & FINANCIAL DESK HEADER -->
      <div class="accountant-header card mb-4">
        <div class="header-content">
          <div class="profile-meta flex items-center gap-4">
            <div class="avatar-box">
              <img [src]="currentUser?.avatar || 'assets/default-avatar.png'" class="avatar-img" alt="Accountant" />
              <span class="online-indicator"></span>
            </div>
            <div>
              <div class="role-badge">
                <app-icon name="circle-dollar-sign" [size]="14"></app-icon>
                <span>CHIEF ACCOUNTS OFFICER & CASHIER DESK (হিসাব ও ক্যাশিয়ার ড্যাশবোর্ড)</span>
              </div>
              <h1 class="exec-title">{{ currentUser?.fullName || 'Chief Accountant' }}</h1>
              <p class="exec-subtitle">
                Fiscal accounting & shift collection desk for <strong>{{ getActiveBranchName() }}</strong>. Real-time cash in counter drawer, bKash/Nagad digital settlements, and overdue fee aging.
              </p>
            </div>
          </div>

          <div class="header-quick-actions">
            <a routerLink="/app/finance/collection" class="btn btn-primary flex items-center gap-1.5" title="Collect student fee at cashier counter">
              <app-icon name="credit-card" [size]="16"></app-icon>
              <span>Fee Collection Counter</span>
            </a>
            <a routerLink="/app/finance/collection" class="btn btn-outline flex items-center gap-1.5" title="Audit counter shift collections">
              <app-icon name="clipboard-check" [size]="16" class="text-emerald"></app-icon>
              <span>Daily Cash Closing</span>
            </a>
            <a routerLink="/app/finance/invoices" class="btn btn-outline flex items-center gap-1.5" title="View all student fee invoices">
              <app-icon name="file-text" [size]="16" class="text-indigo"></app-icon>
              <span>All Invoices</span>
            </a>
          </div>
        </div>
      </div>

      <!-- 2. FINANCIAL KPI CARDS -->
      <div class="kpi-grid-4 mb-4">
        <!-- KPI 1: Cash in Drawer -->
        <div class="kpi-card highlight-emerald">
          <div class="kpi-top">
            <div class="kpi-icon-wrap bg-emerald-subtle">
              <app-icon name="dollar-sign" [size]="22" class="text-emerald"></app-icon>
            </div>
            <span class="kpi-status-tag tag-success">Handover Cash</span>
          </div>
          <div class="kpi-val text-emerald">৳ {{ (data?.todayCashInDrawer || 0).toLocaleString() }}</div>
          <div class="kpi-label">Cash In Counter Drawer</div>
          <div class="kpi-sub">Direct physical cash collected today</div>
        </div>

        <!-- KPI 2: bKash & Nagad MFS -->
        <div class="kpi-card highlight-pink">
          <div class="kpi-top">
            <div class="kpi-icon-wrap bg-pink-subtle">
              <app-icon name="smartphone" [size]="22" class="text-pink"></app-icon>
            </div>
            <span class="kpi-status-tag tag-pink">MFS Settlement</span>
          </div>
          <div class="kpi-val text-pink">৳ {{ (data?.todayMfsTotal || 0).toLocaleString() }}</div>
          <div class="kpi-label">bKash & Nagad Today</div>
          <div class="kpi-sub">Instant digital merchant settlements</div>
        </div>

        <!-- KPI 3: Today's Total Counter Collection -->
        <div class="kpi-card highlight-blue">
          <div class="kpi-top">
            <div class="kpi-icon-wrap bg-blue-subtle">
              <app-icon name="trending-up" [size]="22" class="text-blue"></app-icon>
            </div>
            <span class="kpi-status-tag tag-blue">{{ data?.todayReceiptCount || 0 }} Receipts</span>
          </div>
          <div class="kpi-val text-blue">৳ {{ (data?.todayTotalCollected || 0).toLocaleString() }}</div>
          <div class="kpi-label">Today's Total Collections</div>
          <div class="kpi-sub">Cumulative cashier counter shift volume</div>
        </div>

        <!-- KPI 4: Monthly Collection Efficiency -->
        <div class="kpi-card highlight-indigo">
          <div class="kpi-top">
            <div class="kpi-icon-wrap bg-indigo-subtle">
              <app-icon name="pie-chart" [size]="22" class="text-indigo"></app-icon>
            </div>
            <span class="kpi-status-tag tag-indigo">{{ data?.monthlyCollectionRate || 0 }}%</span>
          </div>
          <div class="kpi-val text-indigo">৳ {{ (data?.monthlyCollectedRevenue || 0).toLocaleString() }}</div>
          <div class="kpi-label">Monthly Realized Revenue</div>
          <div class="kpi-sub">Out of ৳ {{ (data?.monthlyTargetRevenue || 0).toLocaleString() }} target</div>
        </div>
      </div>

      <!-- 3. OVERDUE AGING ANALYSIS STRIP -->
      <div class="card p-4 mb-4" *ngIf="data?.overdueAging">
        <div class="card-header flex justify-between items-center mb-3">
          <div>
            <h3 class="card-title flex items-center gap-2">
              <app-icon name="clock" [size]="18" class="text-amber-500"></app-icon>
              <span>Overdue Fee Aging Breakdown (বকেয়া ফি বার্ধক্য বিশ্লেষণ)</span>
            </h3>
            <p class="card-subtitle">Default risk analysis categorizing outstanding student receivables by days overdue.</p>
          </div>
          <a routerLink="/app/finance/invoices" class="btn btn-sm btn-outline">Defaulter Ledger</a>
        </div>

        <div class="aging-grid">
          <div class="aging-card bg-slate-50 border rounded-lg p-3">
            <div class="aging-label text-slate-500 font-semibold text-xs">0 - 30 Days Due</div>
            <div class="aging-val text-xl font-bold text-slate-800">৳ {{ (data.overdueAging.currentDue0To30 || 0).toLocaleString() }}</div>
            <div class="aging-sub text-xs text-slate-400">Regular Grace Period</div>
          </div>
          <div class="aging-card bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div class="aging-label text-amber-700 font-semibold text-xs">31 - 60 Days Overdue</div>
            <div class="aging-val text-xl font-bold text-amber-600">৳ {{ (data.overdueAging.overdue31To60 || 0).toLocaleString() }}</div>
            <div class="aging-sub text-xs text-amber-600">First SMS Reminder Due</div>
          </div>
          <div class="aging-card bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div class="aging-label text-orange-700 font-semibold text-xs">61 - 90 Days Overdue</div>
            <div class="aging-val text-xl font-bold text-orange-600">৳ {{ (data.overdueAging.overdue61To90 || 0).toLocaleString() }}</div>
            <div class="aging-sub text-xs text-orange-600">Second Notice Stage</div>
          </div>
          <div class="aging-card bg-rose-50 border border-rose-200 rounded-lg p-3">
            <div class="aging-label text-rose-700 font-semibold text-xs">> 90 Days Critical Default</div>
            <div class="aging-val text-xl font-bold text-rose-600">৳ {{ (data.overdueAging.overdueAbove90 || 0).toLocaleString() }}</div>
            <div class="aging-sub text-xs text-rose-600">Admit Card Block Risk</div>
          </div>
        </div>
      </div>

      <!-- 4. MAIN DATA GRID: CLASS COLLECTION MATRIX & RECENT RECEIPTS -->
      <div class="grid-2-col mb-4">
        <!-- Class-wise Fee Performance -->
        <div class="card p-4">
          <div class="card-header flex justify-between items-center mb-3">
            <div>
              <h3 class="card-title flex items-center gap-2">
                <app-icon name="layers" [size]="18" class="text-indigo"></app-icon>
                <span>Class-wise Fee Collection Summary</span>
              </h3>
              <p class="card-subtitle">Invoiced volume vs collected revenue by institutional grade.</p>
            </div>
            <a routerLink="/app/finance/collection" class="btn btn-sm btn-outline">Counter View</a>
          </div>

          <div class="table-responsive">
            <table class="table-compact">
              <thead>
                <tr>
                  <th>Class</th>
                  <th class="text-right">Invoiced (৳)</th>
                  <th class="text-right">Collected (৳)</th>
                  <th class="text-right">Outstanding (৳)</th>
                  <th class="text-center">Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of data?.classCollectionBreakdown">
                  <td><strong>{{ c.className }}</strong></td>
                  <td class="text-right font-mono">৳ {{ c.totalInvoiced.toLocaleString() }}</td>
                  <td class="text-right font-mono text-emerald font-bold">৳ {{ c.totalCollected.toLocaleString() }}</td>
                  <td class="text-right font-mono text-rose font-bold">৳ {{ c.totalDue.toLocaleString() }}</td>
                  <td class="text-center">
                    <span class="badge" [class.badge-success]="c.collectionRate >= 80" [class.badge-warning]="c.collectionRate < 80">
                      {{ c.collectionRate }}%
                    </span>
                  </td>
                </tr>
                <tr *ngIf="!data?.classCollectionBreakdown || data.classCollectionBreakdown.length === 0">
                  <td colspan="5" class="text-center text-muted py-3">No invoice records found in active academic term.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Money Receipts Stream -->
        <div class="card p-4">
          <div class="card-header flex justify-between items-center mb-3">
            <div>
              <h3 class="card-title flex items-center gap-2">
                <app-icon name="receipt" [size]="18" class="text-emerald"></app-icon>
                <span>Recent Money Receipts (সাম্প্রতিক মানি রসিদ)</span>
              </h3>
              <p class="card-subtitle">Latest cashier counter and online payment postings.</p>
            </div>
            <a routerLink="/app/finance/collection" class="btn btn-sm btn-outline">View All</a>
          </div>

          <div class="receipts-list" *ngIf="data?.recentReceipts?.length > 0; else noReceipts">
            <div *ngFor="let p of data.recentReceipts" class="receipt-item flex items-center justify-between p-3 mb-2 rounded-lg border bg-slate-50">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-mono font-bold text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">{{ p.receiptNo }}</span>
                  <strong class="text-slate-800 text-sm">{{ p.studentName }}</strong>
                </div>
                <div class="text-xs text-slate-500 mt-0.5">
                  {{ p.className }} (Roll #{{ p.rollNo }}) • via <strong>{{ p.paymentMethod }}</strong>
                </div>
              </div>
              <div class="text-right">
                <div class="font-mono font-bold text-emerald text-sm">৳ {{ p.amountPaid.toLocaleString() }}</div>
                <div class="text-xs text-slate-400">{{ p.paymentDate | date:'shortTime' }}</div>
              </div>
            </div>
          </div>
          <ng-template #noReceipts>
            <div class="py-5 text-center text-muted">
              <app-icon name="inbox" [size]="32" class="text-slate-400 mb-2"></app-icon>
              <div class="font-medium text-slate-700">No Payment Receipts Issued Today</div>
              <p class="text-xs text-slate-400">Launch the counter desk to begin collecting student tuition fees.</p>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .accountant-dashboard { animation: fadeIn 0.25s ease-in-out; }
    .accountant-header {
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
    .avatar-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 2px solid #059669; }
    .online-indicator {
      position: absolute; bottom: 2px; right: 2px; width: 12px; height: 12px;
      background-color: #10b981; border: 2px solid #fff; border-radius: 50%;
    }
    .role-badge {
      display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px;
      background-color: #d1fae5; color: #047857; font-size: 11px; font-weight: 700;
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
    .bg-pink-subtle { background-color: #fce7f3; }
    .bg-blue-subtle { background-color: #dbeafe; }
    .bg-indigo-subtle { background-color: #e0e7ff; }
    .text-emerald { color: #10b981; }
    .text-pink { color: #ec4899; }
    .text-blue { color: #3b82f6; }
    .text-indigo { color: #6366f1; }
    .kpi-status-tag { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; }
    .tag-success { background-color: #d1fae5; color: #047857; }
    .tag-pink { background-color: #fce7f3; color: #be185d; }
    .tag-blue { background-color: #dbeafe; color: #1d4ed8; }
    .tag-indigo { background-color: #e0e7ff; color: #4338ca; }
    .kpi-val { font-size: 24px; font-weight: 800; line-height: 1.1; margin-bottom: 4px; }
    .kpi-label { font-size: 13px; font-weight: 600; color: #475569; }
    .kpi-sub { font-size: 11px; color: #94a3b8; margin-top: 4px; }

    /* Aging Grid */
    .aging-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
    }
    @media (max-width: 900px) {
      .aging-grid { grid-template-columns: repeat(2, 1fr); }
    }

    /* Main Grid */
    .grid-2-col { display: grid; grid-template-columns: 3fr 2fr; gap: 16px; }
    @media (max-width: 1024px) { .grid-2-col { grid-template-columns: 1fr; } }
    .card-title { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0; }
    .card-subtitle { font-size: 12px; color: #64748b; margin: 2px 0 0 0; }

    /* Tables */
    .table-compact { width: 100%; border-collapse: collapse; font-size: 13px; }
    .table-compact th { padding: 8px 10px; background-color: #f8fafc; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; }
    .table-compact td { padding: 10px; border-bottom: 1px solid #f1f5f9; }
  `]
})
export class AccountantDashboardComponent implements OnInit {
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
      this.data = await this.systemStore.getAccountantDashboard();
    } catch (e) {
      console.warn('Accountant dashboard load error:', e);
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }
}
