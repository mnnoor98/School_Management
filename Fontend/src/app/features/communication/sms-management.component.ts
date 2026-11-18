import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SystemStoreService } from '../../core/services/stores/system-store.service';
import { AcademicStoreService } from '../../core/services/stores/academic-store.service';
import { StudentStoreService } from '../../core/services/stores/student-store.service';
import { TeacherStoreService } from '../../core/services/stores/teacher-store.service';
import { FinanceStoreService } from '../../core/services/stores/finance-store.service';
import { ToastService } from '../../core/services/toast.service';
import { SchoolClass, SmsDispatchLog, SmsTemplate } from '../../core/models';
import { ModalComponent } from '../../shared/components/modal.component';
import { BadgeComponent } from '../../shared/components/badge.component';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-sms-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModalComponent, BadgeComponent, IconComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <app-icon name="message-square" [size]="26" class="text-primary"></app-icon>
            <span>Institutional SMS Gateway & Broadcast Dispatch</span>
          </h1>
          <p class="page-subtitle">
            Broadcast emergency alerts, fee due reminders, exam notices, and attendance notifications via high-throughput SMS gateway.
          </p>
        </div>
        <div class="page-actions">
          <a routerLink="/app/communication/notices" class="btn btn-outline">
            <app-icon name="bell" [size]="16"></app-icon>
            <span>Notice Board</span>
          </a>
        </div>
      </div>

      <!-- KPI METRICS SUMMARY -->
      <div class="grid-4 mb-4">
        <div class="kpi-card">
          <div class="kpi-icon-wrap bg-blue-subtle text-primary">
            <app-icon name="send" [size]="22"></app-icon>
          </div>
          <div>
            <div class="kpi-label">SMS Dispatched</div>
            <div class="kpi-value">{{ totalDispatchedCount }}</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap bg-green-subtle text-success">
            <app-icon name="credit-card" [size]="22"></app-icon>
          </div>
          <div>
            <div class="kpi-label">Gateway Credits</div>
            <div class="kpi-value text-success">{{ gatewayCredits | number }}</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap bg-purple-subtle text-purple">
            <app-icon name="check-circle" [size]="22"></app-icon>
          </div>
          <div>
            <div class="kpi-label">Delivery Success</div>
            <div class="kpi-value text-purple">99.4%</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap bg-amber-subtle text-warning">
            <app-icon name="bookmark" [size]="22"></app-icon>
          </div>
          <div>
            <div class="kpi-label">Standard Templates</div>
            <div class="kpi-value text-warning">{{ templates.length }}</div>
          </div>
        </div>
      </div>

      <!-- TABS BAR -->
      <div class="tabs-bar mb-4">
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab === 'compose'"
          (click)="activeTab = 'compose'"
        >
          <app-icon name="edit-3" [size]="16"></app-icon>
          <span>Broadcast Composer</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab === 'templates'"
          (click)="activeTab = 'templates'"
        >
          <app-icon name="file-text" [size]="16"></app-icon>
          <span>Template Library</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab === 'logs'"
          (click)="activeTab = 'logs'"
        >
          <app-icon name="clock" [size]="16"></app-icon>
          <span>Delivery History & Logs</span>
        </button>
      </div>

      <!-- TAB 1: BROADCAST COMPOSER -->
      <div *ngIf="activeTab === 'compose'">
        <div class="composer-grid">
          <!-- Form Panel -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">
                <app-icon name="send" [size]="18" class="text-primary"></app-icon>
                <span>Compose Broadcast Dispatch</span>
              </div>
            </div>
            <div class="card-body">
              <!-- Target Recipient Group -->
              <div class="form-group">
                <label class="form-label">Recipient Audience <span class="required">*</span></label>
                <select class="form-select" [(ngModel)]="recipientType" (change)="onRecipientTypeChange()">
                  <option value="ALL_PARENTS">All Enrolled Students' Guardians ({{ totalStudentsCount }} Recipients)</option>
                  <option value="SPECIFIC_CLASS">Specific Class Enrolled Students</option>
                  <option value="ALL_TEACHERS">All Teachers & Faculty Members ({{ totalTeachersCount }} Recipients)</option>
                  <option value="FEE_OVERDUE">Guardians with Outstanding Fee Dues ({{ overdueCount }} Recipients)</option>
                  <option value="CUSTOM">Custom Phone Numbers</option>
                </select>
              </div>

              <!-- Specific Class Select -->
              <div class="form-group" *ngIf="recipientType === 'SPECIFIC_CLASS'">
                <label class="form-label">Select Class:</label>
                <select class="form-select" [(ngModel)]="selectedClassId" (change)="updateRecipientCount()">
                  <option *ngFor="let c of classes" [value]="c.id">{{ c.name }}</option>
                </select>
              </div>

              <!-- Custom Numbers -->
              <div class="form-group" *ngIf="recipientType === 'CUSTOM'">
                <label class="form-label">Phone Numbers (comma separated):</label>
                <textarea
                  rows="2"
                  class="form-control"
                  [(ngModel)]="customNumbers"
                  (input)="updateRecipientCount()"
                  placeholder="01700000001, 01800000002..."
                ></textarea>
              </div>

              <!-- Dynamic Tags -->
              <div class="form-group">
                <label class="form-label">Insert Dynamic Merge Tags:</label>
                <div class="tag-buttons-strip">
                  <button type="button" class="tag-chip" (click)="insertTag('{StudentName}')">
                    + Student Name
                  </button>
                  <button type="button" class="tag-chip" (click)="insertTag('{RollNo}')">
                    + Roll No
                  </button>
                  <button type="button" class="tag-chip" (click)="insertTag('{DueAmount}')">
                    + Due Amount
                  </button>
                  <button type="button" class="tag-chip" (click)="insertTag('{SchoolName}')">
                    + School Name
                  </button>
                </div>
              </div>

              <!-- Message Body -->
              <div class="form-group">
                <label class="form-label">SMS Message Body <span class="required">*</span></label>
                <textarea
                  rows="5"
                  class="form-control font-sans"
                  [(ngModel)]="smsMessage"
                  placeholder="Type your message here..."
                ></textarea>
                <div class="char-count-bar mt-2 flex-between text-xs text-muted">
                  <span>{{ smsMessage.length }} characters • <strong>{{ smsParts }} SMS Part(s)</strong></span>
                  <span>Est. Cost: <strong>{{ estimatedCost }} Credits</strong></span>
                </div>
              </div>

              <!-- Action button -->
              <div class="flex justify-end mt-4">
                <button
                  type="button"
                  class="btn btn-primary btn-lg"
                  (click)="openConfirmModal()"
                  [disabled]="!smsMessage.trim() || currentRecipientCount === 0"
                >
                  <app-icon name="send" [size]="18"></app-icon>
                  <span>Dispatch SMS ({{ currentRecipientCount }} Recipients)</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Phone Mockup Preview Panel -->
          <div class="phone-preview-card">
            <div class="phone-frame">
              <div class="phone-speaker"></div>
              <div class="phone-screen">
                <div class="phone-header-bar">
                  <div class="text-xs text-muted font-bold">{{ school.name }}</div>
                  <div class="text-xxs text-muted">SMS Gateway • Live Preview</div>
                </div>

                <div class="sms-bubble">
                  <div class="sms-text">{{ getPreviewText() }}</div>
                  <div class="sms-time text-xxs text-muted">Just now • Delivered</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: TEMPLATE LIBRARY -->
      <div *ngIf="activeTab === 'templates'">
        <div class="templates-grid">
          <div class="card template-card" *ngFor="let t of templates">
            <div class="card-header flex-between">
              <div class="card-title">
                <app-icon name="file-text" [size]="16" class="text-primary"></app-icon>
                <span>{{ t.title }}</span>
              </div>
              <span class="category-badge">{{ t.category }}</span>
            </div>
            <div class="card-body">
              <p class="template-content font-mono">{{ t.content }}</p>
            </div>
            <div class="card-footer flex justify-end">
              <button type="button" class="btn btn-sm btn-outline" (click)="useTemplate(t)">
                <app-icon name="arrow-up-right" [size]="14"></app-icon>
                <span>Use This Template</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: DELIVERY LOGS -->
      <div *ngIf="activeTab === 'logs'">
        <div class="card">
          <div class="card-header flex-between">
            <div class="card-title">
              <app-icon name="list" [size]="18"></app-icon>
              <span>SMS Dispatch History & Delivery Audit</span>
            </div>
            <span class="count-pill">{{ logs.length }} Dispatches Logged</span>
          </div>

          <div class="app-table-wrapper">
            <table class="app-table">
              <thead>
                <tr>
                  <th>Dispatch Time</th>
                  <th>Recipient Group</th>
                  <th>Recipients</th>
                  <th>Message Excerpt</th>
                  <th>Credits</th>
                  <th>Sender</th>
                  <th style="text-align: right;">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of logs">
                  <td class="font-mono text-xs">{{ item.sentAt }}</td>
                  <td><strong>{{ item.recipientGroup }}</strong></td>
                  <td><span class="roll-pill">{{ item.recipientCount }}</span></td>
                  <td>
                    <div class="text-sm text-slate-700 max-w-md">{{ item.message }}</div>
                  </td>
                  <td class="font-bold text-slate-800">{{ item.creditsUsed }}</td>
                  <td>{{ item.senderName }}</td>
                  <td style="text-align: right;">
                    <app-badge variant="success" [label]="item.status" [showDot]="true"></app-badge>
                  </td>
                </tr>
                <tr *ngIf="logs.length === 0">
                  <td colspan="7" class="text-center py-5 text-muted">
                    No SMS dispatches logged yet.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- CONFIRM DISPATCH MODAL -->
    <app-modal
      [(isOpen)]="isConfirmModalOpen"
      title="Confirm SMS Broadcast Dispatch"
      subtitle="Review dispatch parameters before deducting SMS credits."
      [maxWidth]="480"
    >
      <div class="confirm-body">
        <div class="confirm-summary mb-3">
          <div class="summary-row">
            <span class="text-muted">Target Group:</span>
            <strong>{{ getRecipientGroupLabel() }}</strong>
          </div>
          <div class="summary-row">
            <span class="text-muted">Total Recipients:</span>
            <strong class="text-primary">{{ currentRecipientCount }} Contacts</strong>
          </div>
          <div class="summary-row">
            <span class="text-muted">SMS Parts per Msg:</span>
            <strong>{{ smsParts }} Part(s)</strong>
          </div>
          <div class="summary-row">
            <span class="text-muted">Total Credits Deducted:</span>
            <strong class="text-success">{{ estimatedCost }} Credits</strong>
          </div>
        </div>

        <div class="alert-box">
          <app-icon name="info" [size]="18" class="text-primary"></app-icon>
          <div>
            Messages will be delivered immediately through the connected telecom SMS gateway.
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2" footer>
        <button type="button" class="btn btn-outline" (click)="isConfirmModalOpen = false">Cancel</button>
        <button
          type="button"
          class="btn btn-primary"
          (click)="confirmSend()"
          [disabled]="isSending"
        >
          <app-icon name="send" [size]="16"></app-icon>
          <span>{{ isSending ? 'Transmitting...' : 'Confirm & Dispatch SMS' }}</span>
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .mb-3 { margin-bottom: 12px; }
    .mb-4 { margin-bottom: 24px; }
    .mt-2 { margin-top: 8px; }
    .mt-4 { margin-top: 16px; }
    .text-primary { color: #4f46e5; }
    .text-success { color: #059669; }
    .text-warning { color: #d97706; }
    .text-purple { color: #7c3aed; }
    .text-muted { color: #64748b; }
    .text-slate-700 { color: #334155; }
    .text-slate-800 { color: #1e293b; }
    .text-slate-900 { color: #0f172a; }
    .text-xs { font-size: 0.75rem; }
    .text-xxs { font-size: 0.6875rem; }
    .text-sm { font-size: 0.8125rem; }
    .font-mono { font-family: monospace; }
    .font-sans { font-family: inherit; }
    .font-bold { font-weight: 700; }
    .max-w-md { max-width: 400px; }
    .flex-between {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    @media (max-width: 992px) {
      .grid-4 { grid-template-columns: repeat(2, 1fr); }
    }
    .kpi-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .kpi-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .bg-blue-subtle { background: #eff6ff; }
    .bg-green-subtle { background: #ecfdf5; }
    .bg-amber-subtle { background: #fffbeb; }
    .bg-purple-subtle { background: #f5f3ff; }
    .kpi-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .kpi-value {
      font-size: 1.4rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
    }

    /* Tabs */
    .tabs-bar {
      display: flex;
      gap: 8px;
      background: #e2e8f0;
      padding: 4px;
      border-radius: 10px;
      width: fit-content;
    }
    .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border: none;
      background: transparent;
      color: #64748b;
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .tab-btn.active {
      background: #ffffff;
      color: #4f46e5;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    /* Composer Layout */
    .composer-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 24px;
      align-items: start;
    }
    @media (max-width: 900px) {
      .composer-grid { grid-template-columns: 1fr; }
    }
    .tag-buttons-strip {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .tag-chip {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1d4ed8;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .tag-chip:hover {
      background: #dbeafe;
    }

    /* Phone Mockup */
    .phone-preview-card {
      display: flex;
      justify-content: center;
    }
    .phone-frame {
      width: 280px;
      height: 480px;
      background: #0f172a;
      border-radius: 36px;
      padding: 16px 12px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.15);
      border: 4px solid #334155;
      display: flex;
      flex-direction: column;
    }
    .phone-speaker {
      width: 50px;
      height: 4px;
      background: #334155;
      border-radius: 2px;
      margin: 4px auto 12px;
    }
    .phone-screen {
      background: #f1f5f9;
      flex: 1;
      border-radius: 20px;
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
    }
    .phone-header-bar {
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 8px;
      margin-bottom: 16px;
      text-align: center;
    }
    .sms-bubble {
      background: #ffffff;
      border-radius: 12px;
      padding: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.04);
      border-left: 3px solid #4f46e5;
    }
    .sms-text {
      font-size: 0.8125rem;
      color: #1e293b;
      line-height: 1.4;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .sms-time {
      margin-top: 8px;
      text-align: right;
    }

    /* Templates Grid */
    .templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }
    .template-card {
      display: flex;
      flex-direction: column;
    }
    .category-badge {
      background: #eef2ff;
      color: #4f46e5;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
    }
    .template-content {
      font-size: 0.825rem;
      color: #334155;
      line-height: 1.4;
      white-space: pre-wrap;
    }

    /* Confirm Modal */
    .confirm-summary {
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 12px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px dashed #e2e8f0;
      font-size: 0.875rem;
    }
    .summary-row:last-child {
      border-bottom: none;
    }
    .alert-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 10px 12px;
      border-radius: 8px;
      display: flex;
      gap: 10px;
      font-size: 0.8rem;
      color: #1e40af;
    }
    .roll-pill {
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 700;
    }
    .count-pill {
      background: #eef2ff;
      color: #4f46e5;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 999px;
    }
    .required {
      color: #ef4444;
    }
  `]
})
export class SmsManagementComponent implements OnInit {
  private systemStore = inject(SystemStoreService);
  private academicStore = inject(AcademicStoreService);
  private studentStore = inject(StudentStoreService);
  private teacherStore = inject(TeacherStoreService);
  private financeStore = inject(FinanceStoreService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  school = this.systemStore.getSchool();
  classes: SchoolClass[] = [];
  logs: SmsDispatchLog[] = [];

  activeTab: 'compose' | 'templates' | 'logs' = 'compose';

  gatewayCredits = 8420;
  recipientType = 'ALL_PARENTS';
  selectedClassId = '';
  customNumbers = '';
  smsMessage = 'Dear Guardian, this is an important notice from Scholars Academy regarding upcoming academic sessions. Please check the student portal for details.';

  totalStudentsCount = 0;
  totalTeachersCount = 0;
  overdueCount = 0;

  isConfirmModalOpen = false;
  isSending = false;

  templates: SmsTemplate[] = [
    {
      id: 'tpl-1',
      title: 'Fee Payment Due Reminder',
      category: 'Fee',
      content: 'Dear Guardian, the tuition fee for {StudentName} (Roll #{RollNo}) of Tk {DueAmount} is due on 25th of this month. Please clear the dues to avoid late penalty. — {SchoolName}'
    },
    {
      id: 'tpl-2',
      title: 'Student Absence Alert',
      category: 'Attendance',
      content: 'Alert: Your ward {StudentName} (Roll #{RollNo}) was marked ABSENT today without prior leave notice. Please contact the class teacher. — {SchoolName}'
    },
    {
      id: 'tpl-3',
      title: 'Term Exam Result Published',
      category: 'Exam',
      content: 'Term Exam progress report card for {StudentName} (Roll #{RollNo}) is published online. Please log in to the portal to view the marksheet. — {SchoolName}'
    },
    {
      id: 'tpl-4',
      title: 'Emergency School Closure',
      category: 'Emergency',
      content: 'Urgent Announcement: Due to inclement weather, school will remain closed tomorrow. Online classes will follow the normal routine. — {SchoolName}'
    }
  ];

  ngOnInit() {
    this.academicStore.loadClasses().then(cls => {
      this.classes = cls;
      if (cls.length > 0 && !this.selectedClassId) {
        this.selectedClassId = cls[0].id;
      }
      this.cdr.markForCheck();
    });

    this.academicStore.getClasses$().subscribe(cls => {
      this.classes = cls;
      if (cls.length > 0 && !this.selectedClassId) {
        this.selectedClassId = cls[0].id;
      }
      this.cdr.markForCheck();
    });

    this.studentStore.loadStudents().then(st => {
      this.totalStudentsCount = st.length;
      this.cdr.markForCheck();
    });

    this.studentStore.getStudents$().subscribe(st => {
      this.totalStudentsCount = st.length;
      this.cdr.markForCheck();
    });

    this.teacherStore.loadTeachers().then(tch => {
      this.totalTeachersCount = tch.length;
      this.cdr.markForCheck();
    });

    this.teacherStore.getTeachers$().subscribe(tch => {
      this.totalTeachersCount = tch.length;
      this.cdr.markForCheck();
    });

    this.financeStore.loadInvoices().then(inv => {
      const overdue = inv.filter(i => i.status === 'Overdue' || (i.dueAmount > 0 && i.status === 'Unpaid'));
      this.overdueCount = new Set(overdue.map(i => i.studentId)).size;
      this.cdr.markForCheck();
    });

    this.financeStore.getInvoices$().subscribe(inv => {
      const overdue = inv.filter(i => i.status === 'Overdue' || (i.dueAmount > 0 && i.status === 'Unpaid'));
      this.overdueCount = new Set(overdue.map(i => i.studentId)).size;
      this.cdr.markForCheck();
    });

    this.systemStore.loadSmsLogs().then(logs => {
      this.logs = logs;
      this.cdr.markForCheck();
    });

    this.systemStore.getSmsLogs$().subscribe(logs => {
      this.logs = logs;
      this.cdr.markForCheck();
    });

    this.systemStore.loadSmsTemplates().then(tpls => {
      if (tpls && tpls.length > 0) {
        this.templates = tpls;
      }
      this.cdr.markForCheck();
    });
  }

  get totalDispatchedCount(): number {
    return this.logs.reduce((sum, l) => sum + l.recipientCount, 0);
  }

  get currentRecipientCount(): number {
    switch (this.recipientType) {
      case 'ALL_PARENTS': return this.totalStudentsCount;
      case 'SPECIFIC_CLASS':
        return this.studentStore.getStudents(this.selectedClassId).length;
      case 'ALL_TEACHERS': return this.totalTeachersCount;
      case 'FEE_OVERDUE': return this.overdueCount;
      case 'CUSTOM':
        return this.customNumbers.split(',').filter(n => n.trim().length >= 8).length;
      default: return 0;
    }
  }

  get smsParts(): number {
    if (!this.smsMessage) return 1;
    return Math.max(1, Math.ceil(this.smsMessage.length / 160));
  }

  get estimatedCost(): number {
    return this.smsParts * this.currentRecipientCount;
  }

  onRecipientTypeChange() {
    // updates recipient count
  }

  updateRecipientCount() {
    // updates recipient count
  }

  insertTag(tag: string) {
    this.smsMessage += ' ' + tag;
  }

  getPreviewText(): string {
    if (!this.smsMessage) return 'Your SMS text will appear here...';
    return this.smsMessage
      .replace(/{StudentName}/g, 'Tanvir Ahmed')
      .replace(/{RollNo}/g, '01')
      .replace(/{DueAmount}/g, '3,500')
      .replace(/{SchoolName}/g, this.school.name);
  }

  useTemplate(t: SmsTemplate) {
    this.smsMessage = t.content;
    this.activeTab = 'compose';
    this.toast.info('Template Loaded', `Applied "${t.title}" to message composer.`);
  }

  getRecipientGroupLabel(): string {
    switch (this.recipientType) {
      case 'ALL_PARENTS': return 'All Parents & Guardians';
      case 'SPECIFIC_CLASS': {
        const c = this.classes.find(cls => cls.id === this.selectedClassId);
        return `Class: ${c?.name || 'Selected Class'}`;
      }
      case 'ALL_TEACHERS': return 'All Teachers & Faculty';
      case 'FEE_OVERDUE': return 'Fee Overdue Guardians';
      case 'CUSTOM': return 'Custom Phone Contacts';
      default: return 'Recipients';
    }
  }

  openConfirmModal() {
    if (!this.smsMessage.trim()) {
      this.toast.error('Validation Error', 'SMS message body cannot be empty.');
      return;
    }
    if (this.currentRecipientCount === 0) {
      this.toast.error('No Recipients', 'Selected audience contains 0 contacts.');
      return;
    }
    this.isConfirmModalOpen = true;
  }

  confirmSend() {
    this.isSending = true;
    setTimeout(() => {
      this.systemStore.sendSmsDispatch(this.getRecipientGroupLabel(), this.currentRecipientCount, this.smsMessage);
      this.gatewayCredits -= this.estimatedCost;
      this.toast.success(
        'SMS Dispatched',
        `Broadcast sent to ${this.currentRecipientCount} recipients (${this.estimatedCost} credits deducted).`
      );
      this.isSending = false;
      this.isConfirmModalOpen = false;
      this.activeTab = 'logs';
      this.cdr.markForCheck();
    }, 600);
  }
}
