import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { IconComponent } from '../../shared/components/icon.component';
import { AcademicPerformanceReportComponent } from './academic-performance-report.component';
import { FinancialLedgerReportComponent } from './financial-ledger-report.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IconComponent,
    AcademicPerformanceReportComponent,
    FinancialLedgerReportComponent
  ],
  template: `
    <div class="reports-hub-wrapper">
      <!-- SUB-NAVIGATION BAR (NO-PRINT) -->
      <div class="hub-tabs-bar no-print mb-4">
        <div class="hub-tabs-left">
          <button
            type="button"
            class="hub-tab-btn"
            [class.active]="activeTab === 'academic'"
            (click)="switchTab('academic')"
          >
            <app-icon name="award" [size]="18"></app-icon>
            <span>Academic Performance & Merit Matrix</span>
          </button>
          <button
            type="button"
            class="hub-tab-btn"
            [class.active]="activeTab === 'finance'"
            (click)="switchTab('finance')"
          >
            <app-icon name="receipt" [size]="18"></app-icon>
            <span>Financial Ledger & Audit Suite</span>
          </button>
        </div>
      </div>

      <!-- TAB 1: ACADEMIC PERFORMANCE REPORT -->
      <div *ngIf="activeTab === 'academic'">
        <app-academic-performance-report></app-academic-performance-report>
      </div>

      <!-- TAB 2: FINANCIAL LEDGER REPORT -->
      <div *ngIf="activeTab === 'finance'">
        <app-financial-ledger-report></app-financial-ledger-report>
      </div>
    </div>
  `,
  styles: [`
    .mb-4 { margin-bottom: 20px; }
    .hub-tabs-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 2px;
      gap: 12px;
      overflow-x: auto;
    }
    .hub-tabs-left {
      display: flex;
      gap: 8px;
    }
    .hub-tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border: none;
      background: transparent;
      color: #64748b;
      font-weight: 700;
      font-size: 0.9rem;
      border-bottom: 3px solid transparent;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
      border-radius: 8px 8px 0 0;
    }
    .hub-tab-btn:hover {
      color: #1e293b;
      background: #f8fafc;
    }
    .hub-tab-btn.active {
      color: #4f46e5;
      border-bottom-color: #4f46e5;
      background: #eef2ff;
    }
  `]
})
export class ReportsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  activeTab: 'academic' | 'finance' = 'academic';

  ngOnInit() {
    this.route.data.subscribe(data => {
      if (data['defaultTab'] === 'finance' || data['defaultTab'] === 'financial') {
        this.activeTab = 'finance';
      } else if (data['defaultTab'] === 'academic' || data['defaultTab'] === 'exams') {
        this.activeTab = 'academic';
      }
    });

    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'finance' || params['tab'] === 'financial') {
        this.activeTab = 'finance';
      } else if (params['tab'] === 'academic' || params['tab'] === 'exams') {
        this.activeTab = 'academic';
      }
    });

    // Check URL path
    const url = this.router.url;
    if (url.includes('financial') || url.includes('finance')) {
      this.activeTab = 'finance';
    } else if (url.includes('academic')) {
      this.activeTab = 'academic';
    }
  }

  switchTab(tab: 'academic' | 'finance') {
    this.activeTab = tab;
  }
}
