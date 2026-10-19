import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockDbService } from '../../core/services/mock-db.service';
import { ToastService } from '../../core/services/toast.service';
import { BadgeComponent } from '../../shared/components/badge.component';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, BadgeComponent, IconComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <app-icon name="pie-chart" [size]="26" class="text-primary"></app-icon>
            Institutional Reporting & Executive Analytics Hub
          </h1>
          <p class="page-subtitle">
            Comprehensive audit-ready reports: Attendance percentages, Fee collections, Outstanding arrears & Exam distributions.
          </p>
        </div>
        <div class="page-actions">
          <button type="button" class="btn btn-outline" (click)="printReport()">
            <app-icon name="printer" [size]="16"></app-icon>
            <span>Print Report</span>
          </button>
          <button type="button" class="btn btn-primary" (click)="exportCSV()">
            <app-icon name="download" [size]="16"></app-icon>
            <span>Export Analytics</span>
          </button>
        </div>
      </div>

      <!-- REPORT TABS -->
      <div class="tabs-nav mb-4">
        <button type="button" class="tab-btn" [class.active]="activeTab === 'finance'" (click)="activeTab = 'finance'">
          <app-icon name="circle-dollar-sign" [size]="16"></app-icon>
          <span>Fee Collection & Arrears</span>
        </button>
        <button type="button" class="tab-btn" [class.active]="activeTab === 'attendance'" (click)="activeTab = 'attendance'">
          <app-icon name="clipboard-check" [size]="16"></app-icon>
          <span>Attendance Analytics</span>
        </button>
        <button type="button" class="tab-btn" [class.active]="activeTab === 'exams'" (click)="activeTab = 'exams'">
          <app-icon name="award" [size]="16"></app-icon>
          <span>Examination Merit Matrix</span>
        </button>
      </div>

      <!-- 1. FINANCE REPORT -->
      <div *ngIf="activeTab === 'finance'">
        <div class="grid-3 mb-4">
          <div class="kpi-box border-emerald">
            <span class="kpi-lbl">Total Realized Collection</span>
            <h3 class="kpi-val text-emerald">৳ {{ stats.monthlyRevenue.toLocaleString() }}</h3>
            <span class="kpi-sub">October 2026</span>
          </div>
          <div class="kpi-box border-rose">
            <span class="kpi-lbl">Total Outstanding Arrears</span>
            <h3 class="kpi-val text-danger">৳ {{ stats.totalPendingDues.toLocaleString() }}</h3>
            <span class="kpi-sub">Unpaid invoices</span>
          </div>
          <div class="kpi-box border-blue">
            <span class="kpi-lbl">Recovery Ratio</span>
            <h3 class="kpi-val text-primary">82.4%</h3>
            <span class="kpi-sub">Institutional target: >80%</span>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <app-icon name="receipt" [size]="18"></app-icon>
              <span>Student Invoices Ledger Breakdown</span>
            </div>
          </div>
          <div class="app-table-wrapper">
            <table class="app-table">
              <thead>
                <tr>
                  <th>Student & Roll</th>
                  <th>Class</th>
                  <th>Fee Particulars</th>
                  <th>Total Due</th>
                  <th>Amount Paid</th>
                  <th>Balance Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let inv of invoices">
                  <td><strong>{{ inv.studentName }}</strong> (Roll #{{ inv.rollNo }})</td>
                  <td>{{ inv.className }}</td>
                  <td>{{ inv.feeTypeName }}</td>
                  <td>৳ {{ inv.netAmount }}</td>
                  <td>৳ {{ inv.paidAmount }}</td>
                  <td><strong class="text-danger">৳ {{ inv.dueAmount }}</strong></td>
                  <td>
                    <app-badge [variant]="inv.status === 'Paid' ? 'success' : 'danger'" [label]="inv.status"></app-badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 2. ATTENDANCE REPORT -->
      <div *ngIf="activeTab === 'attendance'">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <app-icon name="clipboard-check" [size]="18"></app-icon>
              <span>Class-Wise Monthly Attendance Performance</span>
            </div>
          </div>
          <div class="app-table-wrapper">
            <table class="app-table">
              <thead>
                <tr>
                  <th>Academic Class</th>
                  <th>Sections</th>
                  <th>Enrolled Strength</th>
                  <th>Average Attendance</th>
                  <th>Compliance Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Class Ten (10)</strong></td>
                  <td>Section A (Padma), Section B (Meghna)</td>
                  <td>72 Students</td>
                  <td><strong class="text-emerald">96.8%</strong></td>
                  <td><app-badge variant="success" label="Optimal Compliance"></app-badge></td>
                </tr>
                <tr>
                  <td><strong>Class Nine (9)</strong></td>
                  <td>Section A (Lotus), Section B (Tulip)</td>
                  <td>65 Students</td>
                  <td><strong class="text-emerald">95.4%</strong></td>
                  <td><app-badge variant="success" label="Optimal Compliance"></app-badge></td>
                </tr>
                <tr>
                  <td><strong>Class Eleven (11 - College)</strong></td>
                  <td>Science, Business Studies</td>
                  <td>58 Students</td>
                  <td><strong class="text-warning">93.1%</strong></td>
                  <td><app-badge variant="warning" label="Satisfactory"></app-badge></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 3. EXAMS REPORT -->
      <div *ngIf="activeTab === 'exams'">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <app-icon name="award" [size]="18"></app-icon>
              <span>Mid Term Examination 2026 — Merit Standings (Class 10)</span>
            </div>
          </div>
          <div class="app-table-wrapper">
            <table class="app-table">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Student Name</th>
                  <th>Class Roll</th>
                  <th>Total Marks</th>
                  <th>GPA (Out of 5.00)</th>
                  <th>Letter Grade</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong class="text-primary">1st Place</strong></td>
                  <td><strong>Ayesha Siddiqua</strong></td>
                  <td>#02</td>
                  <td>466 / 500 (93.2%)</td>
                  <td><strong class="text-emerald">5.00</strong></td>
                  <td><span class="badge-grade">A+</span></td>
                  <td>Outstanding academic standing</td>
                </tr>
                <tr>
                  <td><strong class="text-primary">2nd Place</strong></td>
                  <td><strong>Tanvir Ahmed</strong></td>
                  <td>#01</td>
                  <td>452 / 500 (90.4%)</td>
                  <td><strong class="text-emerald">5.00</strong></td>
                  <td><span class="badge-grade">A+</span></td>
                  <td>Distinction with honors</td>
                </tr>
                <tr>
                  <td><strong class="text-primary">3rd Place</strong></td>
                  <td><strong>Rahimul Islam</strong></td>
                  <td>#03</td>
                  <td>412 / 500 (82.4%)</td>
                  <td><strong class="text-emerald">4.80</strong></td>
                  <td><span class="badge-grade">A</span></td>
                  <td>Very Good</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mb-4 { margin-bottom: 24px; }
    .text-primary { color: #4f46e5; }
    .text-emerald { color: #059669; }
    .text-danger { color: #ef4444; }
    .text-warning { color: #d97706; }
    .kpi-box {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 20px;
      box-shadow: var(--shadow-sm);
    }
    .border-emerald { border-left: 4px solid #10b981; }
    .border-rose { border-left: 4px solid #ef4444; }
    .border-blue { border-left: 4px solid #4f46e5; }
    .kpi-lbl {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
    }
    .kpi-val {
      font-size: 1.8rem;
      font-weight: 800;
      margin: 4px 0;
    }
    .kpi-sub {
      font-size: 0.8rem;
      color: #94a3b8;
    }
    .badge-grade {
      display: inline-block;
      padding: 2px 8px;
      background: #ecfdf5;
      color: #059669;
      font-weight: 800;
      border-radius: 4px;
    }
  `]
})
export class ReportsComponent implements OnInit {
  private db = inject(MockDbService);
  private toast = inject(ToastService);

  activeTab: 'finance' | 'attendance' | 'exams' = 'finance';
  stats = this.db.getDashboardStats();
  invoices = this.db.getInvoices();

  ngOnInit() {
    this.stats = this.db.getDashboardStats();
    this.invoices = this.db.getInvoices();
  }

  printReport() {
    window.print();
  }

  exportCSV() {
    this.toast.success('Analytics Exported', 'CSV summary generated and downloaded.');
    this.db.logAudit('Export', 'Reports Hub', 'Exported consolidated institutional analytical dataset');
  }
}
