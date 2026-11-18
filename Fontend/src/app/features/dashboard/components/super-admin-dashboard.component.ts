import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminStoreService, SystemStoreService } from '../../../core/services/stores';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon.component';

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <div class="super-admin-dashboard animate-fade-in">
      <!-- 1. GROUP EXECUTIVE HEADER -->
      <div class="super-admin-header card mb-4">
        <div class="header-content">
          <div class="profile-meta flex items-center gap-4">
            <div class="avatar-box">
              <img [src]="currentUser?.avatar || 'assets/default-avatar.png'" class="avatar-img" alt="Super Admin" />
              <span class="online-indicator"></span>
            </div>
            <div>
              <div class="role-badge">
                <app-icon name="shield-check" [size]="14"></app-icon>
                <span>INSTITUTIONAL GROUP EXECUTIVE & SUPER ADMIN (সুপার অ্যাডমিন ড্যাশবোর্ড)</span>
              </div>
              <h1 class="exec-title">{{ currentUser?.fullName || 'System Administrator' }}</h1>
              <p class="exec-subtitle">
                Consolidated governance for <strong>{{ data?.totalCampuses || 1 }} Operational Campuses</strong>. Cross-campus financial health, faculty distribution, and system security audits.
              </p>
            </div>
          </div>

          <div class="header-quick-actions">
            <a routerLink="/app/admin/school-setup" class="btn btn-primary flex items-center gap-1.5" title="Manage campuses and school profiles">
              <app-icon name="building" [size]="16"></app-icon>
              <span>Campus Management</span>
            </a>
            <a routerLink="/app/admin/role-permissions" class="btn btn-outline flex items-center gap-1.5" title="Configure role permissions and access security">
              <app-icon name="lock" [size]="16" class="text-indigo"></app-icon>
              <span>Security & Roles</span>
            </a>
            <a routerLink="/app/admin/audit-log" class="btn btn-outline flex items-center gap-1.5" title="Inspect system audit trail">
              <app-icon name="history" [size]="16" class="text-amber-600"></app-icon>
              <span>Audit Logs</span>
            </a>
          </div>
        </div>
      </div>

      <!-- 2. CONSOLIDATED KPI METRICS -->
      <div class="kpi-grid-4 mb-4">
        <!-- KPI 1: Total Campuses -->
        <div class="kpi-card highlight-indigo">
          <div class="kpi-top">
            <div class="kpi-icon-wrap bg-indigo-subtle">
              <app-icon name="building" [size]="22" class="text-indigo"></app-icon>
            </div>
            <span class="kpi-status-tag tag-indigo">Group Network</span>
          </div>
          <div class="kpi-val text-indigo">{{ data?.totalCampuses || 0 }}</div>
          <div class="kpi-label">Active Campuses</div>
          <div class="kpi-sub">Independent isolated database scopes</div>
        </div>

        <!-- KPI 2: Global Student Enrollment -->
        <div class="kpi-card highlight-emerald">
          <div class="kpi-top">
            <div class="kpi-icon-wrap bg-emerald-subtle">
              <app-icon name="users" [size]="22" class="text-emerald"></app-icon>
            </div>
            <span class="kpi-status-tag tag-success">Total Enrolled</span>
          </div>
          <div class="kpi-val text-emerald">{{ data?.totalGlobalStudents || 0 }}</div>
          <div class="kpi-label">Consolidated Student Body</div>
          <div class="kpi-sub">Active students across all campuses</div>
        </div>

        <!-- KPI 3: Global Faculty Count -->
        <div class="kpi-card highlight-blue">
          <div class="kpi-top">
            <div class="kpi-icon-wrap bg-blue-subtle">
              <app-icon name="award" [size]="22" class="text-blue"></app-icon>
            </div>
            <span class="kpi-status-tag tag-blue">Faculty</span>
          </div>
          <div class="kpi-val text-blue">{{ data?.totalGlobalTeachers || 0 }}</div>
          <div class="kpi-label">Total Teaching Faculty</div>
          <div class="kpi-sub">Staff members on payroll</div>
        </div>

        <!-- KPI 4: Group Collection Rate -->
        <div class="kpi-card highlight-emerald">
          <div class="kpi-top">
            <div class="kpi-icon-wrap bg-emerald-subtle">
              <app-icon name="trending-up" [size]="22" class="text-emerald"></app-icon>
            </div>
            <span class="kpi-status-tag tag-success">{{ data?.globalCollectionRate || 0 }}%</span>
          </div>
          <div class="kpi-val text-emerald">৳ {{ (data?.globalMonthlyCollected || 0).toLocaleString() }}</div>
          <div class="kpi-label">Global Realized Collections</div>
          <div class="kpi-sub">Out of ৳ {{ (data?.globalMonthlyRevenue || 0).toLocaleString() }} gross</div>
        </div>
      </div>

      <!-- 3. CAMPUS COMPARATIVE PERFORMANCE AUDIT TABLE -->
      <div class="card p-4 mb-4">
        <div class="card-header flex justify-between items-center mb-3">
          <div>
            <h3 class="card-title flex items-center gap-2">
              <app-icon name="bar-chart-2" [size]="18" class="text-indigo"></app-icon>
              <span>Cross-Campus Performance Matrix (ক্যাম্পাসভিত্তিক কর্মদক্ষতা ম্যাট্রিক্স)</span>
            </h3>
            <p class="card-subtitle">Comparative enrollment, student attendance, fee realization, and operational status.</p>
          </div>
          <a routerLink="/app/admin/school-setup" class="btn btn-sm btn-outline">+ Add Branch</a>
        </div>

        <div class="table-responsive">
          <table class="table-compact">
            <thead>
              <tr>
                <th>Campus Name</th>
                <th>Branch Code</th>
                <th class="text-center">Students</th>
                <th class="text-center">Faculty</th>
                <th>Today Attendance</th>
                <th>Fee Collection</th>
                <th class="text-right">Realized Collections</th>
                <th class="text-center">Status</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let camp of data?.campusSummaries">
                <td>
                  <strong>{{ camp.branchName }}</strong>
                </td>
                <td>
                  <span class="badge badge-info font-mono">{{ camp.branchCode }}</span>
                </td>
                <td class="text-center font-bold text-slate-800">{{ camp.studentCount }}</td>
                <td class="text-center">{{ camp.teacherCount }}</td>
                <td>
                  <div class="flex items-center gap-2">
                    <span class="font-semibold">{{ camp.todayAttendanceRate }}%</span>
                  </div>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <span class="font-semibold" [class.text-emerald]="camp.feeCollectionRate >= 80" [class.text-amber-600]="camp.feeCollectionRate < 80">
                      {{ camp.feeCollectionRate }}%
                    </span>
                  </div>
                </td>
                <td class="text-right font-mono font-bold text-emerald">৳ {{ camp.totalCollected.toLocaleString() }}</td>
                <td class="text-center">
                  <span class="badge" [class.badge-success]="camp.isActive" [class.badge-danger]="!camp.isActive">
                    {{ camp.isActive ? 'Active' : 'Maintenance' }}
                  </span>
                </td>
                <td class="text-right">
                  <button type="button" class="btn btn-sm btn-outline" (click)="switchCampus(camp.branchId)" [disabled]="!camp.isActive">
                    Enter Campus
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 4. RECENT SYSTEM AUDIT TRAIL STREAM -->
      <div class="card p-4 mb-4" *ngIf="data?.recentAuditLogs?.length > 0">
        <div class="card-header flex justify-between items-center mb-3">
          <div>
            <h3 class="card-title flex items-center gap-2">
              <app-icon name="shield" [size]="18" class="text-amber-600"></app-icon>
              <span>Security & Audit Activity Stream</span>
            </h3>
            <p class="card-subtitle">Real-time system actions, role adjustments, and security events.</p>
          </div>
          <a routerLink="/app/admin/audit-log" class="btn btn-sm btn-outline">Full Audit Trail</a>
        </div>

        <div class="audit-list">
          <div *ngFor="let log of data.recentAuditLogs" class="audit-item flex items-center justify-between p-3 mb-2 rounded-lg border bg-slate-50">
            <div class="flex items-center gap-3">
              <span class="badge" [class.badge-success]="log.action === 'Create'" [class.badge-info]="log.action === 'Update'" [class.badge-danger]="log.action === 'Delete'">
                {{ log.action }}
              </span>
              <div>
                <strong class="text-slate-800 text-sm">{{ log.module }}</strong> • <span class="text-slate-600 text-xs">{{ log.details }}</span>
                <div class="text-xs text-slate-400 mt-0.5">By <strong>{{ log.userName }}</strong> ({{ log.userRole }})</div>
              </div>
            </div>
            <div class="text-xs text-slate-400 font-mono">{{ log.timestamp | date:'mediumTime' }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .super-admin-dashboard { animation: fadeIn 0.25s ease-in-out; }
    .super-admin-header {
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
    .avatar-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 2px solid #4338ca; }
    .online-indicator {
      position: absolute; bottom: 2px; right: 2px; width: 12px; height: 12px;
      background-color: #10b981; border: 2px solid #fff; border-radius: 50%;
    }
    .role-badge {
      display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px;
      background-color: #e0e7ff; color: #3730a3; font-size: 11px; font-weight: 700;
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
    .bg-indigo-subtle { background-color: #e0e7ff; }
    .bg-emerald-subtle { background-color: #d1fae5; }
    .bg-blue-subtle { background-color: #dbeafe; }
    .text-indigo { color: #6366f1; }
    .text-emerald { color: #10b981; }
    .text-blue { color: #3b82f6; }
    .kpi-status-tag { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; }
    .tag-indigo { background-color: #e0e7ff; color: #4338ca; }
    .tag-success { background-color: #d1fae5; color: #047857; }
    .tag-blue { background-color: #dbeafe; color: #1d4ed8; }
    .kpi-val { font-size: 24px; font-weight: 800; line-height: 1.1; margin-bottom: 4px; }
    .kpi-label { font-size: 13px; font-weight: 600; color: #475569; }
    .kpi-sub { font-size: 11px; color: #94a3b8; margin-top: 4px; }

    /* Tables */
    .table-compact { width: 100%; border-collapse: collapse; font-size: 13px; }
    .table-compact th { padding: 8px 10px; background-color: #f8fafc; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; }
    .table-compact td { padding: 10px; border-bottom: 1px solid #f1f5f9; }
  `]
})
export class SuperAdminDashboardComponent implements OnInit {
  private adminStore = inject(AdminStoreService);
  private systemStore = inject(SystemStoreService);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  currentUser: any;
  data: any = null;
  isLoading = true;

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
      this.data = await this.systemStore.getSuperAdminDashboard();
    } catch (e) {
      console.warn('Super Admin dashboard load error:', e);
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  async switchCampus(branchId: string) {
    const branch = this.adminStore.getBranches().find(b => b.id === branchId);
    if (branch) {
      await this.adminStore.setSelectedBranch(branch);
      this.loadDashboardData();
    }
  }
}
