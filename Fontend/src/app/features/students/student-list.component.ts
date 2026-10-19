import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MockDbService } from '../../core/services/mock-db.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Student, SchoolClass, Section, StudentInvoice, ExamMark } from '../../core/models';
import { ModalComponent } from '../../shared/components/modal.component';
import { BadgeComponent } from '../../shared/components/badge.component';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModalComponent, BadgeComponent, IconComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <app-icon name="users" [size]="26" class="text-primary"></app-icon>
            Institutional Student Directory
          </h1>
          <p class="page-subtitle">
            Manage student records, lifecycle statuses, fee balances, and comprehensive profile dossiers.
          </p>
        </div>
        <div class="page-actions">
          <button type="button" class="btn btn-outline" (click)="exportToCSV()" *ngIf="canExport">
            <app-icon name="download" [size]="16"></app-icon>
            <span>Export CSV</span>
          </button>
          <a routerLink="/app/students/admission" class="btn btn-primary" *ngIf="canAdmit">
            <app-icon name="user-plus" [size]="16"></app-icon>
            <span>New Admission</span>
          </a>
        </div>
      </div>

      <!-- FILTER STRIP -->
      <div class="card mb-4">
        <div class="card-body p-3">
          <div class="filter-strip">
            <div class="search-input-wrap">
              <app-icon name="search" [size]="16" class="search-icon"></app-icon>
              <input
                type="text"
                [(ngModel)]="searchTerm"
                class="form-control form-control-sm"
                placeholder="Search by student name, roll or admission ID..."
              />
            </div>

            <div class="filter-item">
              <label class="filter-lbl">Class:</label>
              <select [(ngModel)]="selectedClassId" class="form-select form-select-sm" (change)="onFilterClassChange()">
                <option value="ALL">All Classes</option>
                <option *ngFor="let c of classes" [value]="c.id">{{ c.name }}</option>
              </select>
            </div>

            <div class="filter-item">
              <label class="filter-lbl">Section:</label>
              <select [(ngModel)]="selectedSectionId" class="form-select form-select-sm">
                <option value="ALL">All Sections</option>
                <option *ngFor="let s of filteredSections" [value]="s.id">{{ s.name }}</option>
              </select>
            </div>

            <div class="filter-item">
              <label class="filter-lbl">Status:</label>
              <select [(ngModel)]="selectedStatus" class="form-select form-select-sm">
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Transferred">Transferred</option>
                <option value="Graduated">Graduated</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- STUDENTS TABLE -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <app-icon name="layers" [size]="18"></app-icon>
            <span>Registered Students</span>
          </div>
          <span class="count-pill">{{ filteredStudents.length }} Records Found</span>
        </div>

        <div class="app-table-wrapper">
          <table class="app-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Admission No</th>
                <th>Class & Section</th>
                <th>Roll</th>
                <th>Guardian Contact</th>
                <th>Lifecycle Status</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let student of filteredStudents">
                <td>
                  <div class="student-avatar-cell">
                    <img [src]="student.photoUrl" [alt]="student.fullName" class="student-avatar" />
                    <div>
                      <strong class="student-name-link" (click)="openProfile(student)">{{ student.fullName }}</strong>
                      <div class="text-xs text-muted">{{ student.banglaName || student.gender }}</div>
                    </div>
                  </div>
                </td>
                <td><code class="code-tag">{{ student.admissionNo }}</code></td>
                <td>
                  <div class="class-meta">
                    <strong>{{ student.className }}</strong>
                    <span class="text-xs text-muted">{{ student.sectionName }}</span>
                  </div>
                </td>
                <td>
                  <span class="roll-pill">#{{ student.rollNo }}</span>
                </td>
                <td>
                  <div>{{ student.guardianName }} ({{ student.guardianRelation }})</div>
                  <div class="text-xs text-muted font-mono">{{ student.guardianPhone }}</div>
                </td>
                <td>
                  <app-badge [variant]="getStatusVariant(student.status)" [label]="student.status"></app-badge>
                </td>
                <td style="text-align: right;">
                  <div class="table-actions-right">
                    <button type="button" class="btn btn-sm btn-outline" (click)="openProfile(student)">
                      <app-icon name="user" [size]="14"></app-icon>
                      <span>Profile</span>
                    </button>
                    <button type="button" class="btn btn-sm btn-secondary" (click)="openStatusModal(student)" *ngIf="canEditStatus">
                      Status
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- STUDENT PROFILE DOSSIER MODAL (PDF Section 08) -->
    <app-modal
      [(isOpen)]="isProfileOpen"
      [title]="activeStudent ? activeStudent.fullName : 'Student Dossier'"
      [subtitle]="activeStudent ? 'Admission: ' + activeStudent.admissionNo + ' • Roll: ' + activeStudent.rollNo : ''"
      [maxWidth]="800"
    >
      <div *ngIf="activeStudent" class="profile-container">
        <!-- TABS NAV -->
        <div class="tabs-nav">
          <button type="button" class="tab-btn" [class.active]="profileTab === 'personal'" (click)="profileTab = 'personal'">
            <app-icon name="user" [size]="16"></app-icon>
            <span>Personal & Guardian</span>
          </button>
          <button type="button" class="tab-btn" [class.active]="profileTab === 'academic'" (click)="profileTab = 'academic'">
            <app-icon name="graduation-cap" [size]="16"></app-icon>
            <span>Academic & Enrollment</span>
          </button>
          <button type="button" class="tab-btn" [class.active]="profileTab === 'fees'" (click)="profileTab = 'fees'">
            <app-icon name="circle-dollar-sign" [size]="16"></app-icon>
            <span>Fee Ledger</span>
          </button>
          <button type="button" class="tab-btn" [class.active]="profileTab === 'exams'" (click)="profileTab = 'exams'">
            <app-icon name="award" [size]="16"></app-icon>
            <span>Exam Results</span>
          </button>
        </div>

        <!-- TAB CONTENT -->
        <!-- 1. Personal & Guardian -->
        <div *ngIf="profileTab === 'personal'" class="tab-pane">
          <div class="profile-header-strip">
            <img [src]="activeStudent.photoUrl" class="profile-photo-large" />
            <div>
              <h3>{{ activeStudent.fullName }}</h3>
              <p class="text-sm text-muted">বাংলা নাম: {{ activeStudent.banglaName || 'N/A' }}</p>
              <div class="flex gap-2 mt-2">
                <app-badge variant="info" [label]="'DOB: ' + activeStudent.dateOfBirth"></app-badge>
                <app-badge variant="purple" [label]="'Blood: ' + activeStudent.bloodGroup"></app-badge>
                <app-badge [variant]="getStatusVariant(activeStudent.status)" [label]="activeStudent.status"></app-badge>
              </div>
            </div>
          </div>

          <div class="grid-2 mt-4">
            <div class="info-card">
              <h4>Contact & Address</h4>
              <p><strong>Phone:</strong> {{ activeStudent.phone }}</p>
              <p><strong>Email:</strong> {{ activeStudent.email }}</p>
              <p><strong>Present Address:</strong> {{ activeStudent.presentAddress || 'Dhanmondi, Dhaka' }}</p>
            </div>

            <div class="info-card">
              <h4>Guardian Information</h4>
              <p><strong>Guardian Name:</strong> {{ activeStudent.guardianName }} ({{ activeStudent.guardianRelation }})</p>
              <p><strong>Guardian Mobile:</strong> {{ activeStudent.guardianPhone }}</p>
              <p><strong>Occupation:</strong> {{ activeStudent.guardianOccupation }}</p>
              <p><strong>Monthly Income:</strong> {{ activeStudent.guardianIncome }}</p>
            </div>
          </div>
        </div>

        <!-- 2. Academic & Enrollment -->
        <div *ngIf="profileTab === 'academic'" class="tab-pane">
          <div class="info-card">
            <h4>Current Session Placement</h4>
            <div class="grid-3 mt-2">
              <div>
                <span class="text-xs text-muted">Academic Class:</span>
                <div><strong>{{ activeStudent.className }}</strong></div>
              </div>
              <div>
                <span class="text-xs text-muted">Section:</span>
                <div><strong>{{ activeStudent.sectionName }}</strong></div>
              </div>
              <div>
                <span class="text-xs text-muted">Class Roll:</span>
                <div><strong>#{{ activeStudent.rollNo }}</strong></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Fee Ledger -->
        <div *ngIf="profileTab === 'fees'" class="tab-pane">
          <div class="app-table-wrapper">
            <table class="app-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Description</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let inv of studentInvoices">
                  <td><code class="code-tag">{{ inv.invoiceNo }}</code></td>
                  <td>{{ inv.feeTypeName }}</td>
                  <td>৳ {{ inv.netAmount }}</td>
                  <td>৳ {{ inv.paidAmount }}</td>
                  <td><strong class="text-danger">৳ {{ inv.dueAmount }}</strong></td>
                  <td>
                    <app-badge [variant]="inv.status === 'Paid' ? 'success' : 'danger'" [label]="inv.status"></app-badge>
                  </td>
                </tr>
                <tr *ngIf="studentInvoices.length === 0">
                  <td colspan="6" class="text-center py-4 text-muted">No invoices generated for this student.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 4. Exams & Results -->
        <div *ngIf="profileTab === 'exams'" class="tab-pane">
          <div class="app-table-wrapper">
            <table class="app-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Full Marks</th>
                  <th>Obtained</th>
                  <th>Grade</th>
                  <th>Grade Point</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let mk of studentMarks">
                  <td><strong>{{ mk.subjectName }}</strong></td>
                  <td>{{ mk.fullMarks }}</td>
                  <td>{{ mk.obtainedMarks }}</td>
                  <td><span class="grade-badge">{{ mk.grade }}</span></td>
                  <td><strong>{{ mk.gradePoint }}</strong></td>
                </tr>
                <tr *ngIf="studentMarks.length === 0">
                  <td colspan="5" class="text-center py-4 text-muted">No exam marks entered for this student yet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </app-modal>

    <!-- STATUS TRANSITION MODAL (PDF Section 08) -->
    <app-modal
      [(isOpen)]="isStatusModalOpen"
      title="Update Student Lifecycle Status"
      subtitle="Sensitive lifecycle actions require administrative permission and audit logging."
      [maxWidth]="480"
    >
      <div *ngIf="statusTargetStudent">
        <p class="mb-3">
          Updating status for: <strong>{{ statusTargetStudent.fullName }}</strong> (Roll {{ statusTargetStudent.rollNo }})
        </p>

        <div class="form-group">
          <label class="form-label">New Status <span class="required">*</span></label>
          <select class="form-select" [(ngModel)]="newStatus">
            <option value="Active">Active</option>
            <option value="Transferred">Transferred (TC Issued)</option>
            <option value="Graduated">Graduated (Completed SSC/HSC)</option>
            <option value="Inactive">Inactive / Suspended</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Reason / Administrative Remark <span class="required">*</span></label>
          <textarea rows="3" class="form-control" [(ngModel)]="statusReason" placeholder="Enter reason for audit record..."></textarea>
        </div>
      </div>

      <div class="flex justify-end gap-2" footer>
        <button type="button" class="btn btn-outline" (click)="isStatusModalOpen = false">Cancel</button>
        <button type="button" class="btn btn-primary" (click)="saveStudentStatus()">Confirm Status Change</button>
      </div>
    </app-modal>
  `,
  styles: [`
    .mb-4 { margin-bottom: 24px; }
    .mt-4 { margin-top: 16px; }
    .mt-2 { margin-top: 8px; }
    .text-primary { color: #4f46e5; }
    .text-danger { color: #ef4444; }
    .text-xs { font-size: 0.75rem; }
    .text-sm { font-size: 0.8125rem; }
    .text-muted { color: #64748b; }
    .font-mono { font-family: monospace; }
    .count-pill {
      background: #eef2ff;
      color: #4f46e5;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 999px;
    }
    .filter-strip {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .search-input-wrap {
      position: relative;
      flex: 1;
      min-width: 240px;
    }
    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }
    .search-input-wrap input {
      padding-left: 36px;
    }
    .filter-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .filter-lbl {
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748b;
    }
    .student-avatar-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .student-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }
    .student-name-link {
      cursor: pointer;
      color: #0f172a;
      transition: color 0.15s;
    }
    .student-name-link:hover {
      color: #4f46e5;
    }
    .roll-pill {
      display: inline-block;
      padding: 2px 8px;
      background: #f1f5f9;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.8rem;
    }
    .code-tag {
      font-size: 0.75rem;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .table-actions-right {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .profile-header-strip {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }
    .profile-photo-large {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid #ffffff;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    .info-card {
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 16px;
    }
    .info-card h4 {
      font-size: 0.9rem;
      color: #0f172a;
      margin-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
    }
    .info-card p {
      font-size: 0.825rem;
      color: #334155;
      margin-bottom: 8px;
    }
    .grade-badge {
      display: inline-block;
      padding: 2px 8px;
      background: #ecfdf5;
      color: #059669;
      font-weight: 700;
      border-radius: 6px;
      font-size: 0.8rem;
    }
  `]
})
export class StudentListComponent implements OnInit {
  private db = inject(MockDbService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  classes: SchoolClass[] = [];
  sections: Section[] = [];
  filteredSections: Section[] = [];
  students: Student[] = [];

  searchTerm = '';
  selectedClassId = 'ALL';
  selectedSectionId = 'ALL';
  selectedStatus = 'ALL';

  canAdmit = false;
  canExport = false;
  canEditStatus = false;

  // Profile modal
  isProfileOpen = false;
  activeStudent: Student | null = null;
  profileTab: 'personal' | 'academic' | 'fees' | 'exams' = 'personal';
  studentInvoices: StudentInvoice[] = [];
  studentMarks: ExamMark[] = [];

  // Status modal
  isStatusModalOpen = false;
  statusTargetStudent: Student | null = null;
  newStatus: Student['status'] = 'Active';
  statusReason = '';

  ngOnInit() {
    this.db.getClasses$().subscribe(c => this.classes = c);
    this.db.getSections$().subscribe(s => {
      this.sections = s;
      this.filteredSections = s;
    });

    this.db.getStudents$().subscribe(list => {
      this.students = list;
    });

    this.canAdmit = this.auth.hasPermission('STUD_ADMISSION', 'create');
    this.canExport = this.auth.hasPermission('STUD_LIST', 'export');
    this.canEditStatus = this.auth.hasPermission('STUD_LIST', 'edit');
  }

  onFilterClassChange() {
    if (this.selectedClassId === 'ALL') {
      this.filteredSections = this.sections;
    } else {
      this.filteredSections = this.sections.filter(s => s.classId === this.selectedClassId);
    }
    this.selectedSectionId = 'ALL';
  }

  get filteredStudents(): Student[] {
    let list = this.students;
    if (this.selectedClassId !== 'ALL') {
      list = list.filter(s => s.classId === this.selectedClassId);
    }
    if (this.selectedSectionId !== 'ALL') {
      list = list.filter(s => s.sectionId === this.selectedSectionId);
    }
    if (this.selectedStatus !== 'ALL') {
      list = list.filter(s => s.status === this.selectedStatus);
    }
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(
        s =>
          s.fullName.toLowerCase().includes(q) ||
          s.admissionNo.toLowerCase().includes(q) ||
          s.rollNo.includes(q)
      );
    }
    return list;
  }

  getStatusVariant(status: Student['status']) {
    switch (status) {
      case 'Active': return 'success';
      case 'Transferred': return 'warning';
      case 'Graduated': return 'purple';
      case 'Inactive': return 'danger';
    }
  }

  openProfile(student: Student) {
    this.activeStudent = student;
    this.profileTab = 'personal';
    this.studentInvoices = this.db.getInvoices(student.id);
    this.studentMarks = this.db.getExamMarks('ex-mid-26', student.classId, '').filter(m => m.studentId === student.id);
    this.isProfileOpen = true;
  }

  openStatusModal(student: Student) {
    this.statusTargetStudent = student;
    this.newStatus = student.status;
    this.statusReason = '';
    this.isStatusModalOpen = true;
  }

  saveStudentStatus() {
    if (!this.statusTargetStudent || !this.statusReason) {
      this.toast.error('Validation Error', 'Please specify the administrative reason.');
      return;
    }
    this.db.updateStudentStatus(this.statusTargetStudent.id, this.newStatus, this.statusReason);
    this.toast.success('Status Updated', `Student status changed to ${this.newStatus}`);
    this.isStatusModalOpen = false;
  }

  exportToCSV() {
    this.toast.success('Export Ready', `Exported ${this.filteredStudents.length} student records.`);
    this.db.logAudit('Export', 'Student Directory', `Exported student list CSV`);
  }
}
