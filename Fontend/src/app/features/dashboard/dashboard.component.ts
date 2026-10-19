import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MockDbService } from '../../core/services/mock-db.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { StatCardComponent } from '../../shared/components/stat-card.component';
import { BadgeComponent } from '../../shared/components/badge.component';
import { IconComponent } from '../../shared/components/icon.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { StudentInvoice, Notice, User, Student, RoutinePeriod } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, StatCardComponent, BadgeComponent, IconComponent, ModalComponent],
  template: `
    <div class="page-container">
      <!-- ========================================== -->
      <!-- 1. GUARDIAN & STUDENT PERSONALIZED PORTAL  -->
      <!-- ========================================== -->
      <ng-container *ngIf="isGuardian || isStudent; else adminDashboard">
        <!-- Guardian Portal Header -->
        <div class="page-header">
          <div>
            <h1 class="page-title">
              <app-icon name="graduation-cap" [size]="28" class="text-primary"></app-icon>
              <span>{{ isGuardian ? 'Parent & Guardian Academic Portal' : 'Student Academic Portal' }}</span>
            </h1>
            <p class="page-subtitle">
              Welcome back, <strong>{{ currentUser?.fullName }}</strong> ({{ currentUser?.roleName }}). Overview of academic performance, attendance, routine, and fee billing for your ward: <strong>{{ wardStudent?.fullName || 'Tanvir Ahmed' }}</strong>.
            </p>
          </div>
          <div class="page-actions">
            <a routerLink="/app/finance/collection" class="btn btn-primary" title="Clear pending dues">
              <app-icon name="circle-dollar-sign" [size]="16"></app-icon>
              <span>Pay Tuition Fee (৳ 1,500)</span>
            </a>
            <a routerLink="/app/exams/marksheet" class="btn btn-outline" title="View official report card">
              <app-icon name="award" [size]="16"></app-icon>
              <span>Progress Marksheet</span>
            </a>
            <a routerLink="/app/academic/routine" class="btn btn-secondary" title="View weekly timetable">
              <app-icon name="calendar-clock" [size]="16"></app-icon>
              <span>Class Schedule</span>
            </a>
          </div>
        </div>

        <!-- Student Dossier Hero Banner -->
        <div class="ward-banner mb-4">
          <div class="ward-avatar-col">
            <img [src]="wardStudent?.photoUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80'" alt="Student" class="ward-avatar" />
            <span class="ward-status-dot" title="Active in current session"></span>
          </div>
          <div class="ward-info-col">
            <div class="ward-badges">
              <span class="badge-role">WARD DOSSIER</span>
              <span class="badge-active">Active • Regular</span>
              <span class="badge-session">Academic Session: 2026-2027</span>
            </div>
            <h2 class="ward-name">{{ wardStudent?.fullName || 'Tanvir Ahmed' }} <span class="bangla-title">{{ wardStudent?.banglaName || 'তানভীর আহমেদ' }}</span></h2>
            <div class="ward-details-grid">
              <div class="ward-detail-item">
                <span class="detail-label">Admission ID:</span>
                <span class="detail-val font-mono">{{ wardStudent?.admissionNo || 'STU-2026-001' }}</span>
              </div>
              <div class="ward-detail-item">
                <span class="detail-label">Class & Section:</span>
                <span class="detail-val">Class 10 — Section A (Padma)</span>
              </div>
              <div class="ward-detail-item">
                <span class="detail-label">Class Roll:</span>
                <span class="detail-val roll-highlight">#{{ wardStudent?.rollNo || '01' }}</span>
              </div>
              <div class="ward-detail-item">
                <span class="detail-label">Class Teacher:</span>
                <span class="detail-val">Kazi Farhana (English)</span>
              </div>
              <div class="ward-detail-item">
                <span class="detail-label">Shift & Campus:</span>
                <span class="detail-val">Morning • Main Campus</span>
              </div>
            </div>
          </div>
        </div>

        <!-- KPI Metrics Grid (Student Specific) -->
        <div class="grid-4 mb-4">
          <app-stat-card
            title="Attendance Rate"
            value="96.0%"
            icon="clipboard-check"
            subtitle="48 days present / 2 absent"
            trend="Excellent (>90%)"
            [trendPositive]="true"
            theme="emerald"
          ></app-stat-card>

          <app-stat-card
            title="Academic Standing"
            value="GPA 5.00"
            icon="award"
            subtitle="Mid-Term Examination 2026"
            trend="Rank: 1st in Class"
            [trendPositive]="true"
            theme="purple"
          ></app-stat-card>

          <app-stat-card
            title="Pending Tuition Due"
            value="৳ 1,500"
            icon="circle-dollar-sign"
            subtitle="October 2026 Monthly Fee"
            trend="Due: Oct 25, 2026"
            [trendPositive]="false"
            theme="rose"
          ></app-stat-card>

          <app-stat-card
            title="Today's Next Class"
            value="09:00 AM"
            icon="calendar-clock"
            subtitle="General Mathematics"
            trend="Room 201 • Nusrat Jahan"
            [trendPositive]="true"
            theme="blue"
          ></app-stat-card>
        </div>

        <!-- Main Content 2-Column Split -->
        <div class="grid-3 mb-4">
          <!-- Left Column (Span 2): Today's Routine & Exam Performance -->
          <div class="col-span-2 flex-col-gap">
            <!-- Today's Schedule Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-title">
                  <app-icon name="calendar-clock" [size]="20" class="text-primary"></app-icon>
                  <span>Today's Class Schedule (Class 10 - Section A Padma)</span>
                </div>
                <a routerLink="/app/academic/routine" class="btn btn-sm btn-outline">Full Weekly Matrix</a>
              </div>
              <div class="app-table-wrapper">
                <table class="app-table">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Time</th>
                      <th>Subject</th>
                      <th>Faculty Instructor</th>
                      <th>Room</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let p of todayRoutine" [class.active-period]="p.periodNumber === 1">
                      <td><span class="period-badge">P-{{ p.periodNumber }}</span></td>
                      <td class="font-mono text-xs"><strong>{{ p.startTime }} - {{ p.endTime }}</strong></td>
                      <td><strong>{{ p.subjectName }}</strong></td>
                      <td>{{ p.teacherName }}</td>
                      <td><span class="room-pill">{{ p.roomNo }}</span></td>
                      <td>
                        <span *ngIf="p.periodNumber === 1" class="chip chip-ongoing">Ongoing Class</span>
                        <span *ngIf="p.periodNumber === 2" class="chip chip-upcoming">Next Up</span>
                        <span *ngIf="p.periodNumber > 2" class="chip chip-scheduled">Scheduled</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Ward Academic Results Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-title">
                  <app-icon name="award" [size]="20" class="text-purple"></app-icon>
                  <span>Mid-Term Examination 2026 Results (Official Grades)</span>
                </div>
                <a routerLink="/app/exams/marksheet" class="btn btn-sm btn-outline">Print Official Marksheet</a>
              </div>
              <div class="card-body">
                <div class="marks-grid">
                  <div class="subject-mark-card" *ngFor="let m of wardExamMarks">
                    <div class="sm-header">
                      <span class="sm-code">{{ m.subjectCode }}</span>
                      <span class="sm-grade">{{ m.grade }}</span>
                    </div>
                    <div class="sm-name">{{ m.subjectName }}</div>
                    <div class="sm-scores">
                      <span class="sm-score-val">{{ m.totalMarks }}/{{ m.fullMarks }}</span>
                      <span class="sm-point">GPA {{ m.gradePoint.toFixed(1) }}</span>
                    </div>
                    <div class="sm-progress">
                      <div class="sm-progress-bar" [style.width.%]="(m.totalMarks / m.fullMarks) * 100"></div>
                    </div>
                  </div>
                </div>
                <div class="results-summary-footer">
                  <div class="rs-item">
                    <span>Total Aggregate:</span>
                    <strong>502 / 550 (91.2%)</strong>
                  </div>
                  <div class="rs-item">
                    <span>Final Calculated GPA:</span>
                    <strong class="text-purple">5.00 (Golden A+)</strong>
                  </div>
                  <div class="rs-item">
                    <span>Institutional Rank:</span>
                    <strong class="text-emerald">1st Position in Section A</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Invoices & Notices -->
          <div class="flex-col-gap">
            <!-- Ward Invoices Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-title">
                  <app-icon name="credit-card" [size]="20" class="text-rose"></app-icon>
                  <span>Fee Invoices & Statements</span>
                </div>
                <a routerLink="/app/finance/collection" class="btn btn-sm btn-outline">Ledger</a>
              </div>
              <div class="card-body p-0">
                <div class="invoices-list">
                  <div class="inv-item" *ngFor="let inv of wardInvoices">
                    <div class="inv-left">
                      <div class="inv-title">{{ inv.feeTypeName }}</div>
                      <div class="inv-meta">
                        <span class="inv-no">{{ inv.invoiceNo }}</span>
                        <span class="inv-due">Due: {{ inv.dueDate }}</span>
                      </div>
                    </div>
                    <div class="inv-right">
                      <div class="inv-amount">৳ {{ inv.netAmount.toLocaleString() }}</div>
                      <div class="inv-action">
                        <span *ngIf="inv.status === 'Paid'" class="paid-badge">
                          <app-icon name="check" [size]="12"></app-icon>
                          <span>Paid</span>
                        </span>
                        <button
                          *ngIf="inv.status !== 'Paid'"
                          type="button"
                          class="btn btn-xs btn-primary"
                          (click)="openPayModal(inv)"
                        >
                          Pay Online
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- School Announcements Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-title">
                  <app-icon name="bell" [size]="20" class="text-primary"></app-icon>
                  <span>School Notices & Circulars</span>
                </div>
                <a routerLink="/app/communication/notices" class="btn btn-sm btn-outline">All Notices</a>
              </div>
              <div class="card-body p-0">
                <div class="notice-list">
                  <div *ngFor="let notice of notices" class="notice-row">
                    <div class="notice-meta">
                      <app-badge [variant]="notice.isImportant ? 'danger' : 'info'" [label]="notice.category"></app-badge>
                      <span class="notice-date">{{ notice.publishedDate }}</span>
                    </div>
                    <h4 class="notice-heading">{{ notice.title }}</h4>
                    <p class="notice-snippet">{{ notice.content }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- ========================================== -->
      <!-- 2. INSTITUTIONAL EXECUTIVE ADMIN DASHBOARD -->
      <!-- ========================================== -->
      <ng-template #adminDashboard>
        <!-- Welcome Header -->
        <div class="page-header">
          <div>
            <h1 class="page-title">
              <app-icon name="layout-dashboard" [size]="28" class="text-primary"></app-icon>
              Institutional Executive Dashboard
            </h1>
            <p class="page-subtitle">
              Welcome back, <strong>{{ currentUser?.fullName }}</strong> ({{ currentUser?.roleName }}). Here is today's academic & financial summary.
            </p>
          </div>
          <div class="page-actions">
            <a routerLink="/app/attendance/entry" class="btn btn-outline" *ngIf="canTakeAttendance">
              <app-icon name="clipboard-check" [size]="16"></app-icon>
              <span>Take Attendance</span>
            </a>
            <a routerLink="/app/finance/collection" class="btn btn-primary" *ngIf="canCollectFees">
              <app-icon name="circle-dollar-sign" [size]="16"></app-icon>
              <span>Fee Collection</span>
            </a>
            <a routerLink="/app/students/admission" class="btn btn-secondary" *ngIf="canAdmitStudent">
              <app-icon name="user-plus" [size]="16"></app-icon>
              <span>New Admission</span>
            </a>
          </div>
        </div>

        <!-- KPI METRICS GRID -->
        <div class="grid-4 mb-4">
          <app-stat-card
            title="Total Enrollment"
            [value]="stats.totalStudents"
            icon="users"
            subtitle="Active academic session"
            trend="+12% YoY"
            [trendPositive]="true"
            theme="blue"
          ></app-stat-card>

          <app-stat-card
            title="Today's Attendance"
            [value]="stats.attendanceRate + '%'"
            icon="clipboard-check"
            [subtitle]="stats.todayPresent + ' out of ' + stats.todayTotal + ' present'"
            trend="Target: >95%"
            [trendPositive]="stats.attendanceRate >= 95"
            theme="emerald"
          ></app-stat-card>

          <app-stat-card
            title="Monthly Fee Collection"
            [value]="'৳ ' + stats.monthlyRevenue.toLocaleString()"
            icon="circle-dollar-sign"
            subtitle="October 2026 collections"
            trend="82% collected"
            [trendPositive]="true"
            theme="purple"
          ></app-stat-card>

          <app-stat-card
            title="Pending Dues"
            [value]="'৳ ' + stats.totalPendingDues.toLocaleString()"
            icon="credit-card"
            subtitle="Unpaid student invoices"
            trend="Action required"
            [trendPositive]="false"
            theme="rose"
          ></app-stat-card>
        </div>

        <!-- MAIN CONTENT ROW -->
        <div class="grid-3 mb-4">
          <!-- Attendance Quick Monitor -->
          <div class="card col-span-2">
            <div class="card-header">
              <div class="card-title">
                <app-icon name="clipboard-check" [size]="20" class="text-emerald"></app-icon>
                <span>Today's Attendance Overview (Classes 9, 10, 11)</span>
              </div>
              <a routerLink="/app/attendance/reports" class="btn btn-sm btn-outline">Full Analytics</a>
            </div>
            <div class="card-body">
              <div class="attendance-bars">
                <div class="bar-group">
                  <div class="bar-label">
                    <strong>Class 10 - Section A (Padma)</strong>
                    <span>97.4% Present (37 / 38)</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill fill-emerald" style="width: 97.4%"></div>
                  </div>
                </div>

                <div class="bar-group">
                  <div class="bar-label">
                    <strong>Class 10 - Section B (Meghna)</strong>
                    <span>94.1% Present (32 / 34)</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill fill-emerald" style="width: 94.1%"></div>
                  </div>
                </div>

                <div class="bar-group">
                  <div class="bar-label">
                    <strong>Class 9 - Section A (Lotus)</strong>
                    <span>96.9% Present (32 / 33)</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill fill-emerald" style="width: 96.9%"></div>
                  </div>
                </div>

                <div class="bar-group">
                  <div class="bar-label">
                    <strong>Class 11 - Science Group</strong>
                    <span>93.3% Present (28 / 30)</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill fill-amber" style="width: 93.3%"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Institutional Notices Card -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">
                <app-icon name="bell" [size]="20" class="text-primary"></app-icon>
                <span>Recent Announcements</span>
              </div>
              <a routerLink="/app/communication/notices" class="btn btn-sm btn-outline">View All</a>
            </div>
            <div class="card-body p-0">
              <div class="notice-list">
                <div *ngFor="let notice of notices" class="notice-row">
                  <div class="notice-meta">
                    <app-badge [variant]="notice.isImportant ? 'danger' : 'info'" [label]="notice.category"></app-badge>
                    <span class="notice-date">{{ notice.publishedDate }}</span>
                  </div>
                  <h4 class="notice-heading">{{ notice.title }}</h4>
                  <p class="notice-snippet">{{ notice.content }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SECOND ROW: PENDING DUES & QUICK SHORTCUTS -->
        <div class="grid-2">
          <!-- Outstanding Dues Table -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">
                <app-icon name="circle-dollar-sign" [size]="20" class="text-rose"></app-icon>
                <span>Pending Fee Invoices (Requiring Clearance)</span>
              </div>
              <a routerLink="/app/finance/invoices" class="btn btn-sm btn-outline">All Invoices</a>
            </div>
            <div class="app-table-wrapper">
              <table class="app-table">
                <thead>
                  <tr>
                    <th>Student & Roll</th>
                    <th>Class</th>
                    <th>Fee Type</th>
                    <th>Due Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let inv of pendingInvoices">
                    <td>
                      <strong>{{ inv.studentName }}</strong>
                      <div class="text-xs text-muted">Roll: {{ inv.rollNo }}</div>
                    </td>
                    <td>{{ inv.className }}</td>
                    <td>{{ inv.feeTypeName }}</td>
                    <td><strong>৳ {{ inv.dueAmount.toLocaleString() }}</strong></td>
                    <td>
                      <app-badge [variant]="inv.status === 'Overdue' ? 'danger' : 'warning'" [label]="inv.status"></app-badge>
                    </td>
                    <td>
                      <a routerLink="/app/finance/collection" class="btn btn-sm btn-primary" *ngIf="canCollectFees">
                        Collect
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Academic Schedule & Exam Summary -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">
                <app-icon name="award" [size]="20" class="text-purple"></app-icon>
                <span>Upcoming Examination Timeline</span>
              </div>
              <a routerLink="/app/exams/setup" class="btn btn-sm btn-outline">Exam Setup</a>
            </div>
            <div class="card-body">
              <div class="exam-timeline">
                <div class="exam-card">
                  <div class="exam-badge">
                    <span class="exam-month">NOV</span>
                    <span class="exam-day">15</span>
                  </div>
                  <div class="exam-info">
                    <h4>Annual Final Examination 2026</h4>
                    <p>Classes 9, 10 & 11 • All Theory & Practical Subjects</p>
                    <div class="exam-tags">
                      <span class="exam-tag">Term: Final 2026</span>
                      <span class="exam-tag text-amber">Admit Card Issue: Nov 05</span>
                    </div>
                  </div>
                </div>

                <div class="exam-card published">
                  <div class="exam-badge">
                    <span class="exam-month">APR</span>
                    <span class="exam-day">10</span>
                  </div>
                  <div class="exam-info">
                    <h4>Mid Term Examination 2026 (Completed)</h4>
                    <p>Results processed & marksheet cards published to student portal</p>
                    <div class="exam-tags">
                      <span class="exam-tag text-emerald">Status: Published</span>
                      <a routerLink="/app/exams/marksheet" class="exam-link">View Marksheet</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-template>

      <!-- Quick Payment Modal for Guardian -->
      <app-modal
        [isOpen]="isPayModalOpen"
        [title]="'Instant Tuition Fee Settlement'"
        (close)="isPayModalOpen = false"
      >
        <div *ngIf="selectedInvoice">
          <div class="payment-modal-dossier mb-3">
            <div class="pmd-row"><span>Student:</span> <strong>{{ wardStudent?.fullName || 'Tanvir Ahmed' }}</strong> (Roll #01)</div>
            <div class="pmd-row"><span>Fee Particular:</span> <strong>{{ selectedInvoice.feeTypeName }}</strong></div>
            <div class="pmd-row"><span>Billing Month:</span> <strong>October 2026</strong></div>
            <div class="pmd-row"><span>Payable Amount:</span> <strong class="text-primary font-bold text-lg">৳ {{ selectedInvoice.dueAmount.toLocaleString() }}</strong></div>
          </div>

          <div class="form-group mb-3">
            <label class="form-label">Payment Gateway / Method:</label>
            <select class="form-select" [(ngModel)]="paymentMethod">
              <option value="bKash Online">bKash Merchant Payment (Instant)</option>
              <option value="Nagad">Nagad Direct Gateway</option>
              <option value="Rocket">Rocket Mobile Banking</option>
              <option value="City Bank Card">Credit / Debit Card (VISA / Mastercard)</option>
            </select>
          </div>

          <div class="form-group mb-4">
            <label class="form-label">Transaction Reference / Mobile Number:</label>
            <input type="text" class="form-control" [(ngModel)]="paymentReference" placeholder="e.g. 01712345678 or TRX-998811" />
          </div>

          <div class="modal-footer p-0">
            <button type="button" class="btn btn-outline" (click)="isPayModalOpen = false">Cancel</button>
            <button type="button" class="btn btn-primary" (click)="confirmPayment()">
              <app-icon name="check" [size]="16"></app-icon>
              <span>Confirm & Pay ৳ {{ selectedInvoice.dueAmount.toLocaleString() }}</span>
            </button>
          </div>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    .mb-3 { margin-bottom: 16px; }
    .mb-4 { margin-bottom: 24px; }
    .col-span-2 { grid-column: span 2; }
    .flex-col-gap { display: flex; flex-direction: column; gap: 24px; }
    .text-primary { color: #4f46e5; }
    .text-emerald { color: #059669; }
    .text-rose { color: #e11d48; }
    .text-purple { color: #7c3aed; }
    .text-amber { color: #d97706; }
    .text-xs { font-size: 0.75rem; }
    .text-lg { font-size: 1.125rem; }
    .text-muted { color: #64748b; }
    .font-mono { font-family: monospace; }
    .font-bold { font-weight: 700; }

    /* WARD BANNER */
    .ward-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      border-radius: 16px;
      padding: 24px;
      color: #ffffff;
      display: flex;
      gap: 24px;
      align-items: center;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .ward-avatar-col {
      position: relative;
      flex-shrink: 0;
    }
    .ward-avatar {
      width: 88px;
      height: 88px;
      border-radius: 16px;
      object-fit: cover;
      border: 3px solid #818cf8;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .ward-status-dot {
      position: absolute;
      bottom: -3px;
      right: -3px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #10b981;
      border: 2px solid #0f172a;
    }
    .ward-info-col {
      flex: 1;
    }
    .ward-badges {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .badge-role {
      background: rgba(99, 102, 241, 0.25);
      color: #a5b4fc;
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid rgba(99, 102, 241, 0.4);
    }
    .badge-active {
      background: rgba(16, 185, 129, 0.2);
      color: #6ee7b7;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
    }
    .badge-session {
      font-size: 0.75rem;
      color: #94a3b8;
    }
    .ward-name {
      font-size: 1.45rem;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 10px 0;
      display: flex;
      align-items: baseline;
      gap: 12px;
    }
    .bangla-title {
      font-size: 1rem;
      font-weight: 500;
      color: #cbd5e1;
    }
    .ward-details-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 18px;
      font-size: 0.8125rem;
    }
    .ward-detail-item {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .detail-label {
      color: #94a3b8;
    }
    .detail-val {
      color: #f1f5f9;
      font-weight: 600;
    }
    .roll-highlight {
      color: #fbbf24;
      font-weight: 800;
      font-size: 0.9rem;
    }

    /* SCHEDULE TABLE */
    .period-badge {
      background: #e0e7ff;
      color: #4338ca;
      font-weight: 800;
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 6px;
    }
    .room-pill {
      background: #f1f5f9;
      color: #475569;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    .active-period {
      background: #f0fdf4 !important;
    }
    .chip {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 999px;
    }
    .chip-ongoing { background: #dcfce7; color: #15803d; }
    .chip-upcoming { background: #fef3c7; color: #b45309; }
    .chip-scheduled { background: #f1f5f9; color: #64748b; }

    /* WARD MARKS GRID */
    .marks-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-bottom: 20px;
    }
    .subject-mark-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
    }
    .sm-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .sm-code { font-size: 0.7rem; color: #64748b; font-weight: 700; font-family: monospace; }
    .sm-grade { background: #ede9fe; color: #6d28d9; font-weight: 800; font-size: 0.75rem; padding: 1px 6px; border-radius: 4px; }
    .sm-name { font-size: 0.8125rem; font-weight: 700; color: #0f172a; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sm-scores { display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 6px; }
    .sm-score-val { font-weight: 700; color: #1e293b; }
    .sm-point { color: #059669; font-weight: 700; }
    .sm-progress { height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
    .sm-progress-bar { height: 100%; background: linear-gradient(90deg, #6366f1 0%, #4f46e5 100%); }

    .results-summary-footer {
      display: flex;
      justify-content: space-between;
      background: #f1f5f9;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 0.8125rem;
    }
    .rs-item { display: flex; align-items: center; gap: 8px; }

    /* INVOICES LIST */
    .invoices-list { display: flex; flex-direction: column; }
    .inv-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      border-bottom: 1px solid #f1f5f9;
    }
    .inv-item:last-child { border-bottom: none; }
    .inv-title { font-size: 0.85rem; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
    .inv-meta { display: flex; gap: 10px; font-size: 0.725rem; color: #64748b; }
    .inv-right { text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .inv-amount { font-size: 0.95rem; font-weight: 800; color: #0f172a; }
    .paid-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #dcfce7;
      color: #15803d;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
    }
    .btn-xs { padding: 4px 10px; font-size: 0.75rem; border-radius: 6px; }

    /* MODAL */
    .payment-modal-dossier {
      background: #f8fafc;
      border-radius: 10px;
      padding: 14px 16px;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 0.875rem;
    }
    .pmd-row { display: flex; justify-content: space-between; }

    /* Attendance progress bars */
    .attendance-bars { display: flex; flex-direction: column; gap: 18px; }
    .bar-label { display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px; color: #334155; }
    .progress-track { height: 10px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 999px; transition: width 0.6s ease; }
    .fill-emerald { background: linear-gradient(90deg, #10b981 0%, #059669 100%); }
    .fill-amber { background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%); }

    /* Notice list */
    .notice-list { display: flex; flex-direction: column; }
    .notice-row { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
    .notice-row:last-child { border-bottom: none; }
    .notice-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
    .notice-date { font-size: 0.75rem; color: #94a3b8; }
    .notice-heading { font-size: 0.875rem; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
    .notice-snippet { font-size: 0.8rem; color: #64748b; line-height: 1.4; }

    /* Exam cards */
    .exam-timeline { display: flex; flex-direction: column; gap: 16px; }
    .exam-card { display: flex; align-items: center; gap: 16px; padding: 16px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0; }
    .exam-card.published { background: #f0fdf4; border-color: #bbf7d0; }
    .exam-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 10px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      flex-shrink: 0;
    }
    .exam-month { font-size: 0.65rem; font-weight: 800; color: #64748b; }
    .exam-day { font-size: 1.1rem; font-weight: 800; color: #0f172a; }
    .exam-info h4 { font-size: 0.875rem; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; }
    .exam-info p { font-size: 0.8rem; color: #64748b; margin-bottom: 6px; }
    .exam-tags { display: flex; align-items: center; gap: 10px; font-size: 0.75rem; }
    .exam-tag { background: rgba(0,0,0,0.04); padding: 2px 8px; border-radius: 4px; font-weight: 600; }
    .exam-link { color: #059669; font-weight: 700; text-decoration: none; }
  `]
})
export class DashboardComponent implements OnInit {
  private db = inject(MockDbService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  currentUser: User | null = this.db.getCurrentUser();
  stats = this.db.getDashboardStats();
  notices: Notice[] = [];
  pendingInvoices: StudentInvoice[] = [];

  isGuardian = false;
  isStudent = false;

  wardStudent: Student | null = null;
  wardInvoices: StudentInvoice[] = [];
  wardExamMarks: any[] = [];
  todayRoutine: any[] = [];

  canTakeAttendance = false;
  canCollectFees = false;
  canAdmitStudent = false;

  // Instant Payment Modal State
  isPayModalOpen = false;
  selectedInvoice: StudentInvoice | null = null;
  paymentMethod = 'bKash Online';
  paymentReference = '';

  ngOnInit() {
    this.auth.getCurrentUser$().subscribe(user => {
      this.currentUser = user;
      this.evaluateRole();
      this.evaluatePermissions();
    });

    this.db.getNotices$().subscribe(n => {
      this.notices = n.slice(0, 3);
    });

    this.db.getInvoices$().subscribe(inv => {
      this.pendingInvoices = inv.filter(i => i.status !== 'Paid').slice(0, 4);
      this.stats = this.db.getDashboardStats();
      this.loadWardData();
    });

    this.db.getStudents$().subscribe(() => {
      this.stats = this.db.getDashboardStats();
      this.loadWardData();
    });

    this.db.getRoutine$().subscribe(() => {
      this.loadWardRoutine();
    });
  }

  evaluateRole() {
    const role = (this.currentUser?.roleName || '').toLowerCase();
    const roleId = (this.currentUser?.roleId || '').toLowerCase();
    this.isGuardian = role.includes('guardian') || roleId.includes('guardian');
    this.isStudent = role.includes('student') || roleId.includes('student');

    if (this.isGuardian || this.isStudent) {
      this.loadWardData();
      this.loadWardRoutine();
    }
  }

  evaluatePermissions() {
    this.canTakeAttendance = this.auth.hasPermission('ATT_ENTRY', 'create');
    this.canCollectFees = this.auth.hasPermission('FIN_COLLECTION', 'create');
    this.canAdmitStudent = this.auth.hasPermission('STUD_ADMISSION', 'create');
  }

  loadWardData() {
    const students = this.db.getStudents();
    // In our system, Tanvir Ahmed is the ward for guardian / student
    this.wardStudent = students.find(s => s.id === 'std-1001' || s.fullName.includes('Tanvir')) || students[0] || null;

    if (this.wardStudent) {
      this.wardInvoices = this.db.getInvoices(this.wardStudent.id);
      if (this.wardInvoices.length === 0) {
        // Fallback default invoices for display
        this.wardInvoices = [
          {
            id: 'inv-t-01',
            invoiceNo: 'INV-2026-001',
            studentId: this.wardStudent.id,
            studentName: this.wardStudent.fullName,
            rollNo: this.wardStudent.rollNo,
            className: this.wardStudent.className,
            sectionName: this.wardStudent.sectionName,
            feeTypeId: 'ft-01',
            feeTypeName: 'Monthly Tuition Fee (October 2026)',
            totalAmount: 1500,
            discountAmount: 0,
            netAmount: 1500,
            paidAmount: 0,
            dueAmount: 1500,
            dueDate: '2026-10-25',
            status: 'Unpaid'
          },
          {
            id: 'inv-t-02',
            invoiceNo: 'INV-2026-002',
            studentId: this.wardStudent.id,
            studentName: this.wardStudent.fullName,
            rollNo: this.wardStudent.rollNo,
            className: this.wardStudent.className,
            sectionName: this.wardStudent.sectionName,
            feeTypeId: 'ft-02',
            feeTypeName: 'Mid-Term Examination Fee',
            totalAmount: 1200,
            discountAmount: 0,
            netAmount: 1200,
            paidAmount: 1200,
            dueAmount: 0,
            dueDate: '2026-04-10',
            status: 'Paid'
          },
          {
            id: 'inv-t-03',
            invoiceNo: 'INV-2026-003',
            studentId: this.wardStudent.id,
            studentName: this.wardStudent.fullName,
            rollNo: this.wardStudent.rollNo,
            className: this.wardStudent.className,
            sectionName: this.wardStudent.sectionName,
            feeTypeId: 'ft-03',
            feeTypeName: 'Laboratory & IT Facility Fee',
            totalAmount: 800,
            discountAmount: 0,
            netAmount: 800,
            paidAmount: 800,
            dueAmount: 0,
            dueDate: '2026-02-15',
            status: 'Paid'
          }
        ];
      }

      this.wardExamMarks = [
        { subjectCode: 'MATH-101', subjectName: 'General Mathematics', totalMarks: 94, fullMarks: 100, grade: 'A+', gradePoint: 5.0 },
        { subjectCode: 'PHY-101', subjectName: 'Physics (Theory & Practical)', totalMarks: 91, fullMarks: 100, grade: 'A+', gradePoint: 5.0 },
        { subjectCode: 'CHE-101', subjectName: 'Chemistry', totalMarks: 88, fullMarks: 100, grade: 'A+', gradePoint: 5.0 },
        { subjectCode: 'ENG-101', subjectName: 'English First Paper', totalMarks: 92, fullMarks: 100, grade: 'A+', gradePoint: 5.0 },
        { subjectCode: 'BAN-101', subjectName: 'Bangla First Paper', totalMarks: 89, fullMarks: 100, grade: 'A+', gradePoint: 5.0 },
        { subjectCode: 'ICT-101', subjectName: 'Information & Comm. Tech', totalMarks: 48, fullMarks: 50, grade: 'A+', gradePoint: 5.0 }
      ];
    }
  }

  loadWardRoutine() {
    this.todayRoutine = [
      { periodNumber: 1, startTime: '09:00 AM', endTime: '09:45 AM', subjectName: 'General Mathematics', teacherName: 'Nusrat Jahan', roomNo: 'Room 201' },
      { periodNumber: 2, startTime: '09:45 AM', endTime: '10:30 AM', subjectName: 'Physics', teacherName: 'Dr. Tariqul Islam', roomNo: 'Science Lab' },
      { periodNumber: 3, startTime: '10:30 AM', endTime: '11:15 AM', subjectName: 'English First Paper', teacherName: 'Kazi Farhana', roomNo: 'Room 201' },
      { periodNumber: 4, startTime: '11:45 AM', endTime: '12:30 PM', subjectName: 'Chemistry', teacherName: 'Dr. Tariqul Islam', roomNo: 'Science Lab' },
      { periodNumber: 5, startTime: '12:30 PM', endTime: '01:15 PM', subjectName: 'ICT & Computer Lab', teacherName: 'Kazi Farhana', roomNo: 'Lab 1' }
    ];
  }

  openPayModal(inv: StudentInvoice) {
    this.selectedInvoice = inv;
    this.paymentReference = '01712' + Math.floor(100000 + Math.random() * 900000);
    this.isPayModalOpen = true;
  }

  confirmPayment() {
    if (!this.selectedInvoice) return;

    this.db.collectFeePayment({
      invoiceId: this.selectedInvoice.id,
      studentId: this.wardStudent?.id || 'std-1001',
      amountPaid: this.selectedInvoice.dueAmount,
      paymentMethod: (this.paymentMethod.includes('bKash') ? 'bKash' : this.paymentMethod.includes('Nagad') ? 'Nagad' : 'Card') as any,
      transactionRef: this.paymentReference,
      notes: `Settled online by ${this.currentUser?.fullName || 'Guardian'}`
    });

    this.selectedInvoice.status = 'Paid';
    this.selectedInvoice.paidAmount = this.selectedInvoice.netAmount;
    this.selectedInvoice.dueAmount = 0;

    this.toast.success(
      'Payment Successful!',
      `Tuition fee voucher of ৳ ${this.selectedInvoice.netAmount} successfully paid via ${this.paymentMethod}.`
    );

    this.isPayModalOpen = false;
  }
}
