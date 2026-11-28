import { CampusImageDirective } from '../../shared/components/campus-image.directive';
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { StudentStoreService } from '../../core/services/stores/student-store.service';
import { AcademicStoreService } from '../../core/services/stores/academic-store.service';
import { FinanceStoreService } from '../../core/services/stores/finance-store.service';
import { ExamStoreService } from '../../core/services/stores/exam-store.service';
import { SystemStoreService } from '../../core/services/stores/system-store.service';
import { CampusSessionService } from '../../core/services/campus-session.service';
import { compressAndResizeImage } from '../../core/utils/image-optimizer.util';
import { Student, SchoolClass, Section, StudentInvoice, ExamMark, AcademicYear, DivisionLookup, DistrictLookup, LookupOption } from '../../core/models';
import { ModalComponent } from '../../shared/components/modal.component';
import { BadgeComponent } from '../../shared/components/badge.component';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CampusImageDirective, CommonModule, FormsModule, RouterModule, ModalComponent, BadgeComponent, IconComponent],
  template: `
    <div class="page-container">
      <!-- 1. PAGE HEADER -->
      <div class="student-list-header mb-4">
        <div class="header-left">
          <div class="header-icon-box">
            <app-icon name="users" [size]="24" class="text-white"></app-icon>
          </div>
          <div>
            <h1 class="header-title">Student List</h1>
            <p class="header-subtitle">Manage, search and view all students</p>
          </div>
        </div>

        <div class="header-actions" *ngIf="!isGuardian && !isStudent">
          <a routerLink="/app/students/admission" class="btn-head btn-primary-head" *ngIf="canAdmit">
            <app-icon name="plus" [size]="16"></app-icon>
            <span>New Admission</span>
          </a>

          <a routerLink="/app/students/admission" class="btn-head btn-white-head" *ngIf="canAdmit" title="Bulk Excel Import">
            <app-icon name="upload" [size]="15"></app-icon>
            <span>Import</span>
          </a>

          <button type="button" class="btn-head btn-white-head" (click)="exportToCSV()" *ngIf="canExport" title="Export Student Records">
            <svg class="excel-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect width="20" height="20" x="2" y="2" rx="3" fill="#16a34a"/>
              <path d="M7 7l10 10M17 7L7 17" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
            <span>Export</span>
          </button>

          <button type="button" class="btn-head btn-white-head" (click)="printStudentList()" title="Print Current View">
            <app-icon name="printer" [size]="15"></app-icon>
            <span>Print</span>
          </button>
        </div>
      </div>

      <!-- 2. KPI METRICS CARDS -->
      <div class="kpi-grid mb-4">
        <!-- Card 1: Total Students -->
        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-blue">
            <app-icon name="user" [size]="20"></app-icon>
          </div>
          <div class="kpi-info">
            <div class="kpi-label">Total Students</div>
            <div class="kpi-value">{{ totalStudentsCount | number }}</div>
          </div>
        </div>

        <!-- Card 2: Boys -->
        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-sky">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="10" cy="14" r="5"/><line x1="19" y1="5" x2="13.6" y2="10.4"/><polyline points="15 5 19 5 19 9"/>
            </svg>
          </div>
          <div class="kpi-info">
            <div class="kpi-label">Boys</div>
            <div class="kpi-value">{{ boysCount | number }}</div>
          </div>
        </div>

        <!-- Card 3: Girls -->
        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-pink">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#db2777" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="9" r="5"/><line x1="12" y1="14" x2="12" y2="21"/><line x1="9" y1="18" x2="15" y2="18"/>
            </svg>
          </div>
          <div class="kpi-info">
            <div class="kpi-label">Girls</div>
            <div class="kpi-value">{{ girlsCount | number }}</div>
          </div>
        </div>

        <!-- Card 4: Classes -->
        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-purple">
            <app-icon name="layers" [size]="20" class="text-purple"></app-icon>
          </div>
          <div class="kpi-info">
            <div class="kpi-label">Classes</div>
            <div class="kpi-value">{{ classesCount | number }}</div>
          </div>
        </div>

        <!-- Card 5: Sections -->
        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-emerald">
            <app-icon name="grid" [size]="20" class="text-emerald"></app-icon>
          </div>
          <div class="kpi-info">
            <div class="kpi-label">Sections</div>
            <div class="kpi-value">{{ sectionsCount | number }}</div>
          </div>
        </div>
      </div>

      <!-- 3. CONTROL & SEARCH BAR -->
      <div class="control-filter-card mb-4" *ngIf="!isGuardian && !isStudent">
        <div class="filter-dropdowns-group">
          <!-- Class -->
          <div class="control-filter-item">
            <label class="control-label">Class</label>
            <div class="custom-select-wrap">
              <select [(ngModel)]="selectedClassId" class="control-select" (change)="onFilterClassChange()">
                <option value="ALL">All Classes</option>
                <option *ngFor="let c of classes" [value]="c.id">{{ c.name }}</option>
              </select>
              <span class="dropdown-chevron">▾</span>
            </div>
          </div>

          <!-- Section -->
          <div class="control-filter-item">
            <label class="control-label">Section</label>
            <div class="custom-select-wrap">
              <select [(ngModel)]="selectedSectionId" class="control-select" (change)="onFilterChange()">
                <option value="ALL">All Sections</option>
                <option *ngFor="let s of filteredSections" [value]="s.id">{{ s.name }}</option>
              </select>
              <span class="dropdown-chevron">▾</span>
            </div>
          </div>

          <!-- Session -->
          <div class="control-filter-item">
            <label class="control-label">Session</label>
            <div class="custom-select-wrap">
              <select [(ngModel)]="selectedSession" class="control-select" (change)="onFilterChange()">
                <option *ngFor="let y of sessions" [value]="y.name">{{ y.name }}</option>
              </select>
              <span class="dropdown-chevron">▾</span>
            </div>
          </div>

          <!-- Status -->
          <div class="control-filter-item">
            <label class="control-label">Status</label>
            <div class="custom-select-wrap">
              <select [(ngModel)]="selectedStatus" class="control-select" (change)="onFilterChange()">
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Transferred">Transferred</option>
                <option value="Graduated">Graduated</option>
                <option value="Inactive">Inactive</option>
              </select>
              <span class="dropdown-chevron">▾</span>
            </div>
          </div>
        </div>

        <!-- Search Box with attached Blue Button -->
        <div class="search-input-group">
          <div class="search-field-wrap">
            <app-icon name="search" [size]="15" class="search-field-icon"></app-icon>
            <input
              type="text"
              [(ngModel)]="searchTerm"
              (ngModelChange)="onSearchChange()"
              class="search-text-input"
              placeholder="Search by name, roll or admission no..."
            />
          </div>
          <button type="button" class="search-submit-btn" (click)="onFilterChange()" title="Search">
            <app-icon name="search" [size]="15"></app-icon>
          </button>
        </div>
      </div>

      <!-- 4. STUDENT DATA TABLE -->
      <div class="student-table-card mb-4">
        <div class="table-responsive">
          <table class="student-data-table">
            <thead>
              <tr>
                <th class="th-chk">
                  <input type="checkbox" class="custom-chk" [checked]="isAllSelected" (change)="toggleSelectAll($event)" />
                </th>
                <th class="th-photo">Photo</th>
                <th class="th-sortable" (click)="sortBy('admissionNo')">
                  <div class="th-sort-inner">
                    <span>Admission No</span>
                    <span class="sort-indicator">{{ sortColumn === 'admissionNo' ? (sortAscending ? '▲' : '▼') : '⇅' }}</span>
                  </div>
                </th>
                <th class="th-sortable" (click)="sortBy('rollNo')">
                  <div class="th-sort-inner">
                    <span>Roll No</span>
                    <span class="sort-indicator">{{ sortColumn === 'rollNo' ? (sortAscending ? '▲' : '▼') : '⇅' }}</span>
                  </div>
                </th>
                <th class="th-sortable" (click)="sortBy('fullName')">
                  <div class="th-sort-inner">
                    <span>Student Name</span>
                    <span class="sort-indicator">{{ sortColumn === 'fullName' ? (sortAscending ? '▲' : '▼') : '⇅' }}</span>
                  </div>
                </th>
                <th class="th-sortable" (click)="sortBy('className')">
                  <div class="th-sort-inner">
                    <span>Class</span>
                    <span class="sort-indicator">{{ sortColumn === 'className' ? (sortAscending ? '▲' : '▼') : '⇅' }}</span>
                  </div>
                </th>
                <th class="th-sortable" (click)="sortBy('sectionName')">
                  <div class="th-sort-inner">
                    <span>Section</span>
                    <span class="sort-indicator">{{ sortColumn === 'sectionName' ? (sortAscending ? '▲' : '▼') : '⇅' }}</span>
                  </div>
                </th>
                <th class="th-sortable" (click)="sortBy('gender')">
                  <div class="th-sort-inner">
                    <span>Gender</span>
                    <span class="sort-indicator">{{ sortColumn === 'gender' ? (sortAscending ? '▲' : '▼') : '⇅' }}</span>
                  </div>
                </th>
                <th class="th-sortable" (click)="sortBy('phone')">
                  <div class="th-sort-inner">
                    <span>Mobile</span>
                    <span class="sort-indicator">{{ sortColumn === 'phone' ? (sortAscending ? '▲' : '▼') : '⇅' }}</span>
                  </div>
                </th>
                <th class="th-sortable" (click)="sortBy('status')">
                  <div class="th-sort-inner">
                    <span>Status</span>
                    <span class="sort-indicator">{{ sortColumn === 'status' ? (sortAscending ? '▲' : '▼') : '⇅' }}</span>
                  </div>
                </th>
                <th class="th-actions text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let student of paginatedStudents" [class.row-selected]="selectedStudentsMap[student.id]">
                <td class="td-chk">
                  <input type="checkbox" class="custom-chk" [(ngModel)]="selectedStudentsMap[student.id]" />
                </td>
                <td class="td-photo">
                  <img 
                    campusImage 
                    [src]="student.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'" 
                    [alt]="student.fullName" 
                    class="avatar-thumb" />
                </td>
                <td class="td-adm">
                  <span class="adm-no-text">{{ student.admissionNo }}</span>
                </td>
                <td class="td-roll">
                  <span class="roll-text">{{ student.rollNo }}</span>
                </td>
                <td class="td-name">
                  <div class="name-block" (click)="openProfile(student)" title="View Dossier">
                    <span class="student-name">{{ student.fullName }}</span>
                    <span class="student-bangla" *ngIf="student.banglaName">{{ student.banglaName }}</span>
                  </div>
                </td>
                <td class="td-class">{{ student.className || 'General' }}</td>
                <td class="td-section">{{ student.sectionName || 'A' }}</td>
                <td class="td-gender">
                  <span class="gender-pill gender-male" *ngIf="student.gender?.toLowerCase() === 'male'">
                    <span class="gender-symbol">♂</span> Male
                  </span>
                  <span class="gender-pill gender-female" *ngIf="student.gender?.toLowerCase() === 'female'">
                    <span class="gender-symbol">♀</span> Female
                  </span>
                  <span class="gender-pill gender-other" *ngIf="student.gender?.toLowerCase() !== 'male' && student.gender?.toLowerCase() !== 'female'">
                    {{ student.gender || 'Other' }}
                  </span>
                </td>
                <td class="td-mobile">{{ student.phone || student.guardianPhone || '01712-345678' }}</td>
                <td class="td-status">
                  <span class="status-pill" [ngClass]="'status-' + (student.status || 'Active').toLowerCase()">
                    {{ student.status || 'Active' }}
                  </span>
                </td>
                <td class="td-actions">
                  <div class="action-btn-group">
                    <button type="button" class="table-act-btn btn-view" (click)="openProfile(student)" title="View Profile">
                      <app-icon name="eye" [size]="15"></app-icon>
                    </button>
                    <button type="button" class="table-act-btn btn-edit" (click)="openEditModal(student)" *ngIf="canEditStatus && !isGuardian && !isStudent" title="Edit Student">
                      <app-icon name="edit" [size]="15"></app-icon>
                    </button>
                    <button type="button" class="table-act-btn btn-del" (click)="openStatusModal(student)" *ngIf="canEditStatus && !isGuardian && !isStudent" title="Update Lifecycle Status">
                      <app-icon name="trash" [size]="15"></app-icon>
                    </button>
                  </div>
                </td>
              </tr>

              <tr *ngIf="paginatedStudents.length === 0">
                <td colspan="11" class="empty-table-cell">
                  <div class="empty-state-box">
                    <app-icon name="users" [size]="36" class="text-muted mb-2"></app-icon>
                    <p class="empty-title">No students found matching current filters.</p>
                    <p class="empty-desc">Try resetting your search term or selecting another Class/Section.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 5. PAGINATION STRIP -->
      <div class="pagination-footer-strip" *ngIf="!isGuardian && !isStudent">
        <div class="pagination-left-info">
          Showing <strong>{{ totalStudentsCount > 0 ? (startIndex + 1) : 0 }}</strong> to <strong>{{ endIndex }}</strong> of <strong>{{ totalStudentsCount | number }}</strong> students
        </div>

        <div class="pagination-center-nav">
          <button type="button" class="page-nav-btn" (click)="goToPage(1)" [disabled]="currentPage === 1" title="First Page">
            «
          </button>
          <button type="button" class="page-nav-btn" (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 1" title="Previous Page">
            ‹
          </button>

          <ng-container *ngFor="let p of visiblePages">
            <span *ngIf="p === -1" class="page-ellipsis">...</span>
            <button 
              *ngIf="p !== -1" 
              type="button" 
              class="page-num-btn" 
              [class.active]="p === currentPage" 
              (click)="goToPage(p)">
              {{ p }}
            </button>
          </ng-container>

          <button type="button" class="page-nav-btn" (click)="goToPage(currentPage + 1)" [disabled]="currentPage === totalPages" title="Next Page">
            ›
          </button>
          <button type="button" class="page-nav-btn" (click)="goToPage(totalPages)" [disabled]="currentPage === totalPages" title="Last Page">
            »
          </button>
        </div>

        <div class="pagination-right-limit">
          <span class="limit-label">Rows per page</span>
          <div class="limit-select-wrap">
            <select [(ngModel)]="pageSize" (change)="onPageSizeChange()" class="limit-select">
              <option [value]="5">5</option>
              <option [value]="10">10</option>
              <option [value]="25">25</option>
              <option [value]="50">50</option>
              <option [value]="100">100</option>
            </select>
            <span class="dropdown-chevron-sm">▾</span>
          </div>
        </div>
      </div>
    </div>

    <!-- STUDENT PROFILE DOSSIER MODAL -->
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
            <img campusImage [src]="activeStudent.photoUrl" class="profile-photo-large" />
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
              <p><strong>Mobile:</strong> {{ activeStudent.phone || 'N/A' }}</p>
              <p><strong>Email:</strong> {{ activeStudent.email || 'N/A' }}</p>
              <p><strong>Present Address:</strong> {{ activeStudent.presentAddress || 'N/A' }}</p>
              <p *ngIf="activeStudent.district"><strong>Geo Region:</strong> {{ activeStudent.upazila ? activeStudent.upazila + ', ' : '' }}{{ activeStudent.district }}, {{ activeStudent.division }}</p>
              <p *ngIf="activeStudent.permanentAddress"><strong>Permanent Address:</strong> {{ activeStudent.permanentAddress }}</p>
            </div>

            <div class="info-card">
              <h4>Guardian & Parents Information</h4>
              <p><strong>Guardian:</strong> {{ activeStudent.guardianName }} ({{ activeStudent.guardianRelation }}) - {{ activeStudent.guardianPhone }}</p>
              <p *ngIf="activeStudent.fatherName"><strong>Father:</strong> {{ activeStudent.fatherName }} {{ activeStudent.fatherPhone ? '(' + activeStudent.fatherPhone + ')' : '' }} {{ activeStudent.fatherOccupation ? '• ' + activeStudent.fatherOccupation : '' }}</p>
              <p *ngIf="activeStudent.motherName"><strong>Mother:</strong> {{ activeStudent.motherName }} {{ activeStudent.motherPhone ? '(' + activeStudent.motherPhone + ')' : '' }} {{ activeStudent.motherOccupation ? '• ' + activeStudent.motherOccupation : '' }}</p>
              <p *ngIf="activeStudent.emergencyContactName"><strong>Emergency Contact:</strong> {{ activeStudent.emergencyContactName }} ({{ activeStudent.emergencyContactRelation }}) - {{ activeStudent.emergencyContactPhone }}</p>
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
                  <th>Fee Type</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let inv of studentInvoices">
                  <td><code>{{ inv.invoiceNo }}</code></td>
                  <td>{{ inv.feeTypeName }}</td>
                  <td>{{ inv.dueDate || 'Current Term' }}</td>
                  <td>{{ inv.totalAmount | currency:'BDT':'symbol':'1.0-0' }}</td>
                  <td>{{ inv.paidAmount | currency:'BDT':'symbol':'1.0-0' }}</td>
                  <td>
                    <span class="status-pill" [ngClass]="'status-' + inv.status.toLowerCase()">{{ inv.status }}</span>
                  </td>
                </tr>
                <tr *ngIf="studentInvoices.length === 0">
                  <td colspan="6" class="text-center py-4 text-muted">No fee records found for this student.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 4. Exam Results -->
        <div *ngIf="profileTab === 'exams'" class="tab-pane">
          <div class="app-table-wrapper">
            <table class="app-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Full Marks</th>
                  <th>Obtained Marks</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let mark of studentMarks">
                  <td>{{ mark.subjectName }}</td>
                  <td>{{ mark.fullMarks || 100 }}</td>
                  <td><strong>{{ mark.obtainedMarks }}</strong></td>
                  <td>
                    <span class="grade-badge">{{ mark.grade }}</span>
                  </td>
                </tr>
                <tr *ngIf="studentMarks.length === 0">
                  <td colspan="4" class="text-center py-4 text-muted">No published examination results yet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </app-modal>

    <!-- UPDATE STATUS MODAL -->
    <app-modal
      [(isOpen)]="isStatusModalOpen"
      title="Update Student Lifecycle Status"
      subtitle="Sensitive lifecycle actions require administrative permission and audit logging."
      [maxWidth]="500"
    >
      <div *ngIf="statusTargetStudent" class="status-modal-content">
        <p class="mb-3">
          Updating status for: <strong>{{ statusTargetStudent.fullName }}</strong> (Roll {{ statusTargetStudent.rollNo }})
        </p>
        <div class="form-group mb-3">
          <label class="form-label">New Status <span class="required">*</span></label>
          <select [(ngModel)]="newStatus" class="form-select">
            <option value="Active">Active Student</option>
            <option value="Transferred">Transferred (TC Issued)</option>
            <option value="Graduated">Graduated (Completed SSC/HSC)</option>
            <option value="Inactive">Suspended / Inactive</option>
          </select>
        </div>
        <div class="form-group mb-4">
          <label class="form-label">Reason / Administrative Remark (Optional)</label>
          <textarea
            [(ngModel)]="statusReason"
            class="form-control"
            rows="3"
            placeholder="Enter reason for audit record (e.g. TC request approved, graduation ceremony)..."
          ></textarea>
        </div>
      </div>

      <div class="flex justify-end gap-2" footer>
        <button type="button" class="btn btn-outline" (click)="isStatusModalOpen = false">Cancel</button>
        <button type="button" class="btn btn-primary" (click)="saveStudentStatus()" [disabled]="isSubmittingStatus">
          <app-icon name="check" [size]="16"></app-icon>
          <span>{{ isSubmittingStatus ? 'Saving...' : 'Confirm Status Change' }}</span>
        </button>
      </div>
    </app-modal>

    <!-- EDIT STUDENT MODAL -->
    <app-modal
      [(isOpen)]="isEditModalOpen"
      title="Edit Student Information"
      subtitle="Modify complete student bio, parent/guardian records, address, and academic placement."
      [maxWidth]="840"
    >
      <div class="edit-student-content" *ngIf="editForm">
        <!-- 1. TOP PROFILE STRIP -->
        <div class="edit-profile-strip">
          <div class="edit-photo-avatar-box">
            <img 
              *ngIf="editPhotoPreview || editForm.photoUrl" 
              campusImage 
              [src]="editPhotoPreview || editForm.photoUrl" 
              alt="Student Avatar" 
              class="edit-avatar-img" />
            <div *ngIf="!editPhotoPreview && !editForm.photoUrl" class="edit-avatar-placeholder">
              <app-icon name="user" [size]="36"></app-icon>
            </div>
            <div *ngIf="isUploadingEditPhoto" class="edit-photo-spinner">
              <app-icon name="loader" [size]="20" class="spin text-white"></app-icon>
            </div>
          </div>

          <div class="edit-profile-summary">
            <div class="d-flex align-center gap-2 mb-1">
              <h3 class="edit-student-name">{{ editForm.fullName || 'Student Name' }}</h3>
              <span class="badge-tag-adm">{{ editForm.admissionNo || 'ID: New' }}</span>
              <span class="badge-tag-status" [class.active-tag]="editForm.status === 'Active'">{{ editForm.status || 'Active' }}</span>
            </div>
            <div class="edit-student-meta text-xs text-muted">
              <span>{{ editForm.banglaName ? editForm.banglaName + ' • ' : '' }}</span>
              <span>Roll: #{{ editForm.rollNo || '01' }} • </span>
              <span>{{ getEditClassName() }} — {{ getEditSectionName() }}</span>
            </div>
            <div class="edit-photo-action-btns mt-2">
              <input type="file" #editPhotoInput (change)="onEditPhotoSelected($event)" accept="image/png,image/jpeg,image/webp" style="display: none;" />
              <button type="button" class="btn btn-xs btn-outline" (click)="editPhotoInput.click()" [disabled]="isUploadingEditPhoto">
                <app-icon name="camera" [size]="13"></app-icon>
                <span>{{ editPhotoPreview || editForm.photoUrl ? 'Change Photo' : 'Upload Photo' }}</span>
              </button>
              <button type="button" class="btn btn-xs btn-outline-danger" *ngIf="editPhotoPreview || editForm.photoUrl" (click)="removeEditPhoto(editPhotoInput)" [disabled]="isUploadingEditPhoto">
                <app-icon name="trash" [size]="13"></app-icon>
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 2. SEGMENTED TABS BAR -->
        <div class="edit-modal-tabs">
          <button 
            type="button" 
            class="edit-tab-btn" 
            [class.active]="editModalTab === 'basic'" 
            (click)="editModalTab = 'basic'">
            <app-icon name="user" [size]="15"></app-icon>
            <span>Basic Info</span>
          </button>
          <button 
            type="button" 
            class="edit-tab-btn" 
            [class.active]="editModalTab === 'parents'" 
            (click)="editModalTab = 'parents'">
            <app-icon name="users" [size]="15"></app-icon>
            <span>Parents & Guardian</span>
          </button>
          <button 
            type="button" 
            class="edit-tab-btn" 
            [class.active]="editModalTab === 'address'" 
            (click)="editModalTab = 'address'">
            <app-icon name="map-pin" [size]="15"></app-icon>
            <span>Address & Emergency</span>
          </button>
          <button 
            type="button" 
            class="edit-tab-btn" 
            [class.active]="editModalTab === 'academic'" 
            (click)="editModalTab = 'academic'">
            <app-icon name="book-open" [size]="15"></app-icon>
            <span>Academic & Logistics</span>
          </button>
        </div>

        <!-- 3. TAB 1: BASIC INFORMATION -->
        <div *ngIf="editModalTab === 'basic'" class="edit-tab-content animate-fade-in">
          <div class="edit-section-card">
            <div class="subcard-header blue-tint">
              <span>Personal Bio & Identification</span>
            </div>
            <div class="p-3">
              <div class="grid-3 mb-3">
                <div class="form-group">
                  <label class="form-label">Full Name <span class="required">*</span></label>
                  <input type="text" class="form-control" [(ngModel)]="editForm.fullName" placeholder="Full legal name" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Bangla Name (বাংলা নাম)</label>
                  <input type="text" class="form-control" [(ngModel)]="editForm.banglaName" placeholder="বাংলায় পূর্ণ নাম" />
                </div>
                <div class="form-group">
                  <label class="form-label">Date of Birth <span class="required">*</span></label>
                  <input type="date" class="form-control" [(ngModel)]="editForm.dateOfBirth" required />
                </div>
              </div>

              <div class="grid-3 mb-3">
                <div class="form-group">
                  <label class="form-label">Gender <span class="required">*</span></label>
                  <select class="form-select" [(ngModel)]="editForm.gender">
                    <option *ngFor="let g of genders" [value]="g">{{ g }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Blood Group</label>
                  <select class="form-select" [(ngModel)]="editForm.bloodGroup">
                    <option value="">Select Blood Group</option>
                    <option *ngFor="let bg of bloodGroups" [value]="bg">{{ bg }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Religion</label>
                  <select class="form-select" [(ngModel)]="editForm.religion">
                    <option *ngFor="let r of religions" [value]="r">{{ r }}</option>
                  </select>
                </div>
              </div>

              <div class="grid-3">
                <div class="form-group">
                  <label class="form-label">Nationality</label>
                  <select class="form-select" [(ngModel)]="editForm.nationality">
                    <option *ngFor="let n of nationalities" [value]="n">{{ n }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Student Mobile</label>
                  <input type="tel" class="form-control" [(ngModel)]="editForm.phone" placeholder="01XXXXXXXXX" />
                </div>
                <div class="form-group">
                  <label class="form-label">Email Address</label>
                  <input type="email" class="form-control" [(ngModel)]="editForm.email" placeholder="student@school.edu.bd" />
                </div>
              </div>

              <div class="grid-1 mt-3">
                <div class="form-group">
                  <label class="form-label">Previous School Attended</label>
                  <input type="text" class="form-control" [(ngModel)]="editForm.previousSchool" placeholder="Name of previous educational institution (if applicable)" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. TAB 2: PARENTS & GUARDIAN -->
        <div *ngIf="editModalTab === 'parents'" class="edit-tab-content animate-fade-in">
          <!-- Father's Box -->
          <div class="edit-section-card mb-3">
            <div class="subcard-header blue-tint">
              <span>Father's Details (পিতার তথ্য)</span>
            </div>
            <div class="grid-2 p-3">
              <div class="form-group">
                <label class="form-label">Father's Name</label>
                <input type="text" class="form-control" [(ngModel)]="editForm.fatherName" placeholder="Father's full name" />
              </div>
              <div class="form-group">
                <label class="form-label">Father's Mobile</label>
                <input type="tel" class="form-control" [(ngModel)]="editForm.fatherPhone" placeholder="01XXXXXXXXX" />
              </div>
              <div class="form-group">
                <label class="form-label">Occupation</label>
                <input type="text" class="form-control" [(ngModel)]="editForm.fatherOccupation" placeholder="e.g. Businessman, Engineer" />
              </div>
              <div class="form-group">
                <label class="form-label">National ID (NID)</label>
                <input type="text" class="form-control" [(ngModel)]="editForm.fatherNid" placeholder="NID or Smart Card number" />
              </div>
            </div>
          </div>

          <!-- Mother's Box -->
          <div class="edit-section-card mb-3">
            <div class="subcard-header purple-tint">
              <span>Mother's Details (মাতার তথ্য)</span>
            </div>
            <div class="grid-2 p-3">
              <div class="form-group">
                <label class="form-label">Mother's Name</label>
                <input type="text" class="form-control" [(ngModel)]="editForm.motherName" placeholder="Mother's full name" />
              </div>
              <div class="form-group">
                <label class="form-label">Mother's Mobile</label>
                <input type="tel" class="form-control" [(ngModel)]="editForm.motherPhone" placeholder="01XXXXXXXXX" />
              </div>
              <div class="form-group">
                <label class="form-label">Occupation</label>
                <input type="text" class="form-control" [(ngModel)]="editForm.motherOccupation" placeholder="e.g. Homemaker, Doctor, Teacher" />
              </div>
              <div class="form-group">
                <label class="form-label">National ID (NID)</label>
                <input type="text" class="form-control" [(ngModel)]="editForm.motherNid" placeholder="NID or Smart Card number" />
              </div>
            </div>
          </div>

          <!-- Legal Guardian Box -->
          <div class="edit-section-card">
            <div class="subcard-header teal-tint">
              <span>Primary Legal Guardian * (প্রধান অভিভাবক)</span>
            </div>
            <div class="grid-3 p-3">
              <div class="form-group">
                <label class="form-label">Guardian Name <span class="required">*</span></label>
                <input type="text" class="form-control" [(ngModel)]="editForm.guardianName" placeholder="Full name of legal guardian" required />
              </div>
              <div class="form-group">
                <label class="form-label">Relationship <span class="required">*</span></label>
                <select class="form-select" [(ngModel)]="editForm.guardianRelation">
                  <option *ngFor="let rel of guardianRelations" [value]="rel.id">{{ rel.label }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Guardian Mobile <span class="required">*</span></label>
                <input type="tel" class="form-control" [(ngModel)]="editForm.guardianPhone" placeholder="01XXXXXXXXX" required />
              </div>
              <div class="form-group">
                <label class="form-label">Guardian Occupation</label>
                <input type="text" class="form-control" [(ngModel)]="editForm.guardianOccupation" placeholder="e.g. Govt. Service" />
              </div>
              <div class="form-group">
                <label class="form-label">Annual Family Income</label>
                <input type="text" class="form-control" [(ngModel)]="editForm.guardianIncome" placeholder="e.g. ৳ 500,000" />
              </div>
            </div>
          </div>
        </div>

        <!-- 5. TAB 3: ADDRESS & EMERGENCY -->
        <div *ngIf="editModalTab === 'address'" class="edit-tab-content animate-fade-in">
          <!-- Present Address -->
          <div class="edit-section-card mb-3">
            <div class="subcard-header teal-tint">
              <span>Present Address (বর্তমান ঠিকানা)</span>
            </div>
            <div class="p-3">
              <div class="form-group mb-3">
                <label class="form-label">Street Address / Village / House <span class="required">*</span></label>
                <input type="text" class="form-control" [(ngModel)]="editForm.presentAddress" placeholder="Holding, Road, Area, Post Office" required />
              </div>
              <div class="grid-3">
                <div class="form-group">
                  <label class="form-label">Division</label>
                  <select class="form-select" [(ngModel)]="editForm.division" (change)="onEditDivisionChange()">
                    <option value="">Select Division</option>
                    <option *ngFor="let div of divisions" [value]="div.name">{{ div.name }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">District</label>
                  <select class="form-select" [(ngModel)]="editForm.district" (change)="onEditDistrictChange()">
                    <option value="">Select District</option>
                    <option *ngFor="let dist of availableDistricts" [value]="dist.name">{{ dist.name }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Upazila / Thana</label>
                  <select class="form-select" [(ngModel)]="editForm.upazila">
                    <option value="">Select Upazila</option>
                    <option *ngFor="let upz of availableUpazilas" [value]="upz">{{ upz }}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Permanent Address -->
          <div class="edit-section-card mb-3">
            <div class="subcard-header amber-tint d-flex justify-between align-center">
              <span>Permanent Address (স্থায়ী ঠিকানা)</span>
              <label class="d-flex align-center gap-2 cursor-pointer text-xs font-normal">
                <input type="checkbox" (change)="syncEditPermanentAddress($event)" />
                <span>Same as Present Address</span>
              </label>
            </div>
            <div class="p-3">
              <div class="form-group">
                <label class="form-label">Permanent Address Line</label>
                <input type="text" class="form-control" [(ngModel)]="editForm.permanentAddress" placeholder="Village / Area, Post, Police Station, District" />
              </div>
            </div>
          </div>

          <!-- Emergency Contact -->
          <div class="edit-section-card">
            <div class="subcard-header red-tint">
              <span>Emergency Contact Details (জরুরি যোগাযোগ)</span>
            </div>
            <div class="grid-3 p-3">
              <div class="form-group">
                <label class="form-label">Contact Person Name</label>
                <input type="text" class="form-control" [(ngModel)]="editForm.emergencyContactName" placeholder="Full name" />
              </div>
              <div class="form-group">
                <label class="form-label">Emergency Phone</label>
                <input type="tel" class="form-control" [(ngModel)]="editForm.emergencyContactPhone" placeholder="01XXXXXXXXX" />
              </div>
              <div class="form-group">
                <label class="form-label">Relationship to Student</label>
                <input type="text" class="form-control" [(ngModel)]="editForm.emergencyContactRelation" placeholder="e.g. Uncle, Grandfather" />
              </div>
            </div>
          </div>
        </div>

        <!-- 6. TAB 4: ACADEMIC & LOGISTICS -->
        <div *ngIf="editModalTab === 'academic'" class="edit-tab-content animate-fade-in">
          <!-- Class & Section Placement -->
          <div class="edit-section-card mb-3">
            <div class="subcard-header blue-tint">
              <span>Academic Placement & Status</span>
            </div>
            <div class="grid-2 p-3">
              <div class="form-group">
                <label class="form-label">Assigned Class <span class="required">*</span></label>
                <select class="form-select" [(ngModel)]="editForm.classId" (change)="onEditClassChange()">
                  <option *ngFor="let c of classes" [value]="c.id">{{ c.name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Assigned Section <span class="required">*</span></label>
                <select class="form-select" [(ngModel)]="editForm.sectionId">
                  <option *ngFor="let s of editSections" [value]="s.id">{{ s.name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Roll Number</label>
                <input type="text" class="form-control" [(ngModel)]="editForm.rollNo" placeholder="e.g. 05" />
              </div>
              <div class="form-group">
                <label class="form-label">Enrollment Status <span class="required">*</span></label>
                <select class="form-select" [(ngModel)]="editForm.status">
                  <option *ngFor="let st of statuses" [value]="st">{{ st }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Parameters & Facilities -->
          <div class="edit-section-card mb-3">
            <div class="subcard-header purple-tint">
              <span>Shift, Category & School Facilities</span>
            </div>
            <div class="p-3">
              <div class="grid-2 mb-3">
                <div class="form-group">
                  <label class="form-label">Academic Shift</label>
                  <select class="form-select" [(ngModel)]="editForm.shift">
                    <option *ngFor="let sh of shifts" [value]="sh">{{ sh }} Shift</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Admission Category</label>
                  <select class="form-select" [(ngModel)]="editForm.admissionCategory">
                    <option *ngFor="let cat of admissionCategories" [value]="cat.id">{{ cat.label }}</option>
                  </select>
                </div>
              </div>
              <div class="d-flex align-center gap-4 pt-2">
                <label class="d-flex align-center gap-2 cursor-pointer font-semibold text-sm">
                  <input type="checkbox" [(ngModel)]="editForm.isHostel" />
                  <span>Hostel Resident (ছাত্রাবাস সুবিধা)</span>
                </label>
                <label class="d-flex align-center gap-2 cursor-pointer font-semibold text-sm">
                  <input type="checkbox" [(ngModel)]="editForm.isTransport" />
                  <span>School Transport (যাতায়াত সুবিধা)</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Prior Credentials & Health -->
          <div class="edit-section-card">
            <div class="subcard-header teal-tint">
              <span>Prior Credentials & Co-Curricular / Medical Notes</span>
            </div>
            <div class="p-3">
              <div class="grid-4 mb-3">
                <div class="form-group">
                  <label class="form-label">Last Class Passed</label>
                  <input type="text" class="form-control" [(ngModel)]="editForm.lastClassPassed" placeholder="e.g. Class 4" />
                </div>
                <div class="form-group">
                  <label class="form-label">Passing Year</label>
                  <input type="text" class="form-control" [(ngModel)]="editForm.lastPassingYear" placeholder="e.g. 2025" />
                </div>
                <div class="form-group">
                  <label class="form-label">GPA / Marks</label>
                  <input type="text" class="form-control" [(ngModel)]="editForm.lastGpaMarks" placeholder="e.g. 5.00" />
                </div>
                <div class="form-group">
                  <label class="form-label">TC Number</label>
                  <input type="text" class="form-control" [(ngModel)]="editForm.tcNumber" placeholder="TC ref code" />
                </div>
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Extracurricular Activities</label>
                  <input type="text" class="form-control" [(ngModel)]="editForm.coCurricular" placeholder="e.g. Cricket, Debating, Art" />
                </div>
                <div class="form-group">
                  <label class="form-label">Medical / Health Notes</label>
                  <input type="text" class="form-control" [(ngModel)]="editForm.medicalNotes" placeholder="e.g. Asthma, Allergies, or None" />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div class="flex justify-between align-center" footer>
        <div class="text-xs text-muted">
          Active Tab: <span class="font-bold text-primary">{{ editModalTab.toUpperCase() }}</span>
        </div>
        <div class="flex gap-2">
          <button type="button" class="btn btn-outline" (click)="isEditModalOpen = false">Cancel</button>
          <button type="button" class="btn btn-primary" (click)="saveStudentEdit()" [disabled]="isSubmittingEdit">
            <app-icon *ngIf="!isSubmittingEdit" name="check" [size]="16"></app-icon>
            <app-icon *ngIf="isSubmittingEdit" name="loader" [size]="16" class="spin"></app-icon>
            <span>{{ isSubmittingEdit ? 'Saving Changes...' : 'Save Profile Changes' }}</span>
          </button>
        </div>
      </div>
    </app-modal>
  `,
  styles: [`
    .mb-4 { margin-bottom: 20px; }
    .mt-4 { margin-top: 16px; }
    .mt-2 { margin-top: 8px; }
    .text-white { color: #ffffff; }
    .text-primary { color: #2563eb; }
    .text-purple { color: #9333ea; }
    .text-emerald { color: #16a34a; }
    .text-xs { font-size: 0.75rem; }
    .text-sm { font-size: 0.8125rem; }
    .text-muted { color: #64748b; }
    .flex { display: flex; }
    .gap-2 { gap: 8px; }
    .justify-end { justify-content: flex-end; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }

    /* 1. Header Styles */
    .student-list-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .header-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
      flex-shrink: 0;
    }
    .header-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      line-height: 1.2;
    }
    .header-subtitle {
      font-size: 0.85rem;
      color: #64748b;
      margin: 3px 0 0 0;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .btn-head {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 18px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s ease-in-out;
    }
    .btn-primary-head {
      background: #2563eb;
      color: #ffffff;
      border: none;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    }
    .btn-primary-head:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
    }
    .btn-white-head {
      background: #ffffff;
      color: #0f172a;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }
    .btn-white-head:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
      transform: translateY(-1px);
    }
    .excel-icon {
      flex-shrink: 0;
    }

    /* 2. KPI Stat Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 16px;
    }
    @media (max-width: 1024px) {
      .kpi-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }
    @media (max-width: 640px) {
      .kpi-grid {
        grid-template-columns: 1fr;
      }
    }
    .kpi-card {
      background: #ffffff;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      padding: 16px 18px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
    }
    .kpi-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .kpi-blue {
      background: #e0f2fe;
      color: #0284c7;
    }
    .kpi-sky {
      background: #e0f2fe;
      color: #0284c7;
    }
    .kpi-pink {
      background: #fce7f3;
      color: #db2777;
    }
    .kpi-purple {
      background: #f3e8ff;
      color: #9333ea;
    }
    .kpi-emerald {
      background: #dcfce7;
      color: #16a34a;
    }
    .kpi-info {
      overflow: hidden;
    }
    .kpi-label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #64748b;
      white-space: nowrap;
    }
    .kpi-value {
      font-size: 1.625rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.15;
      margin-top: 2px;
    }

    /* 3. Control & Filter Strip */
    .control-filter-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    }
    .filter-dropdowns-group {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }
    .control-filter-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .control-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
    }
    .custom-select-wrap {
      position: relative;
      min-width: 130px;
    }
    .control-select {
      appearance: none;
      -webkit-appearance: none;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 7px 28px 7px 12px;
      font-size: 0.825rem;
      font-weight: 500;
      color: #1e293b;
      width: 100%;
      outline: none;
      cursor: pointer;
      transition: border-color 0.15s;
    }
    .control-select:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    .dropdown-chevron {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      color: #64748b;
      font-size: 0.75rem;
    }
    .search-input-group {
      display: flex;
      align-items: center;
      margin-top: auto;
    }
    .search-field-wrap {
      position: relative;
      width: 270px;
    }
    .search-field-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      pointer-events: none;
    }
    .search-text-input {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-right: none;
      border-radius: 8px 0 0 8px;
      padding: 7.5px 12px 7.5px 34px;
      font-size: 0.825rem;
      color: #0f172a;
      width: 100%;
      outline: none;
      transition: border-color 0.15s;
    }
    .search-text-input:focus {
      border-color: #2563eb;
    }
    .search-submit-btn {
      background: #2563eb;
      color: #ffffff;
      width: 38px;
      height: 35px;
      border: none;
      border-radius: 0 8px 8px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.15s;
    }
    .search-submit-btn:hover {
      background: #1d4ed8;
    }

    /* 4. Table Styles */
    .student-table-card {
      background: #ffffff;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    }
    .table-responsive {
      overflow-x: auto;
    }
    .student-data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .student-data-table thead th {
      padding: 12px 14px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #1e293b;
      border-bottom: 1px solid #e2e8f0;
      background: #ffffff;
      white-space: nowrap;
    }
    .th-chk, .td-chk {
      width: 44px;
      text-align: center;
    }
    .th-photo, .td-photo {
      width: 56px;
      text-align: center;
    }
    .th-sortable {
      cursor: pointer;
      user-select: none;
      transition: background 0.12s;
    }
    .th-sortable:hover {
      background: #f8fafc;
    }
    .th-sort-inner {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .sort-indicator {
      font-size: 0.75rem;
      color: #94a3b8;
    }
    .custom-chk {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      border: 1.5px solid #cbd5e1;
      cursor: pointer;
      accent-color: #2563eb;
    }
    .student-data-table tbody tr {
      border-bottom: 1px solid #f1f5f9;
      transition: background 0.12s ease-in-out;
    }
    .student-data-table tbody tr:hover {
      background: #f8fafc;
    }
    .student-data-table tbody tr.row-selected {
      background: #f0f7ff;
    }
    .student-data-table tbody tr:last-child {
      border-bottom: none;
    }
    .student-data-table tbody td {
      padding: 12px 14px;
      font-size: 0.825rem;
      color: #334155;
      vertical-align: middle;
      white-space: nowrap;
    }
    .avatar-thumb {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      object-fit: cover;
      border: 1px solid #e2e8f0;
      display: inline-block;
    }
    .adm-no-text {
      font-size: 0.825rem;
      font-weight: 500;
      color: #1e293b;
    }
    .roll-text {
      font-size: 0.825rem;
      color: #334155;
      font-weight: 500;
    }
    .name-block {
      display: inline-flex;
      flex-direction: column;
      cursor: pointer;
    }
    .student-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: #0f172a;
      transition: color 0.15s;
    }
    .student-name:hover {
      color: #2563eb;
    }
    .student-bangla {
      font-size: 0.72rem;
      color: #64748b;
    }
    .td-class, .td-section {
      font-size: 0.825rem;
      color: #334155;
    }
    .gender-pill {
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .gender-male {
      background: #eff6ff;
      color: #2563eb;
    }
    .gender-female {
      background: #fdf2f8;
      color: #db2777;
    }
    .gender-other {
      background: #f1f5f9;
      color: #475569;
    }
    .gender-symbol {
      font-size: 0.85rem;
      line-height: 1;
    }
    .td-mobile {
      font-size: 0.825rem;
      color: #334155;
    }
    .status-pill {
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      display: inline-block;
    }
    .status-active {
      background: #f0fdf4;
      color: #16a34a;
    }
    .status-inactive {
      background: #fef2f2;
      color: #dc2626;
    }
    .status-transferred {
      background: #fffbeb;
      color: #d97706;
    }
    .status-graduated {
      background: #faf5ff;
      color: #7c3aed;
    }
    .action-btn-group {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .table-act-btn {
      width: 32px;
      height: 32px;
      border-radius: 7px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
      background: #ffffff;
      border: 1px solid #e2e8f0;
    }
    .btn-view {
      color: #2563eb;
    }
    .btn-view:hover {
      background: #eff6ff;
      border-color: #93c5fd;
      transform: scale(1.05);
    }
    .btn-edit {
      color: #0284c7;
    }
    .btn-edit:hover {
      background: #f0f9ff;
      border-color: #7dd3fc;
      transform: scale(1.05);
    }
    .btn-del {
      color: #ef4444;
      border-color: #fee2e2;
    }
    .btn-del:hover {
      background: #fef2f2;
      border-color: #fca5a5;
      transform: scale(1.05);
    }

    /* Empty state */
    .empty-table-cell {
      padding: 48px 16px;
      text-align: center;
    }
    .empty-state-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .empty-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: #1e293b;
      margin: 4px 0 2px 0;
    }
    .empty-desc {
      font-size: 0.825rem;
      color: #64748b;
      margin: 0;
    }

    /* 5. Pagination Footer */
    .pagination-footer-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      font-size: 0.825rem;
      flex-wrap: wrap;
      gap: 14px;
    }
    .pagination-left-info {
      color: #64748b;
    }
    .pagination-left-info strong {
      color: #0f172a;
    }
    .pagination-center-nav {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .page-nav-btn {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      color: #475569;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      transition: all 0.12s;
    }
    .page-nav-btn:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #cbd5e1;
    }
    .page-nav-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .page-num-btn {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: none;
      background: transparent;
      color: #475569;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.12s;
    }
    .page-num-btn:hover:not(.active) {
      background: #f1f5f9;
    }
    .page-num-btn.active {
      background: #2563eb;
      color: #ffffff;
    }
    .page-ellipsis {
      padding: 0 4px;
      color: #94a3b8;
    }
    .pagination-right-limit {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .limit-label {
      color: #64748b;
      font-size: 0.825rem;
    }
    .limit-select-wrap {
      position: relative;
    }
    .limit-select {
      appearance: none;
      -webkit-appearance: none;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 5px 24px 5px 10px;
      font-size: 0.825rem;
      font-weight: 600;
      color: #1e293b;
      outline: none;
      cursor: pointer;
    }
    .dropdown-chevron-sm {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      color: #64748b;
      font-size: 0.7rem;
    }

    /* Modal Dossier Styles */
    .tabs-nav {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
      margin-bottom: 16px;
    }
    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 6px;
      border: none;
      background: transparent;
      font-size: 0.85rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
    }
    .tab-btn.active {
      background: #eff6ff;
      color: #2563eb;
    }
    .profile-header-strip {
      display: flex;
      align-items: center;
      gap: 18px;
      background: #f8fafc;
      padding: 16px;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
    }
    .profile-photo-large {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .info-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px;
    }
    .info-card h4 {
      font-size: 0.875rem;
      color: #0f172a;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid #f1f5f9;
    }
    .info-card p {
      font-size: 0.825rem;
      color: #334155;
      margin-bottom: 6px;
    }
    .grade-badge {
      padding: 2px 8px;
      background: #ecfdf5;
      color: #059669;
      font-weight: 700;
      border-radius: 6px;
      font-size: 0.8rem;
    }
    .form-section-heading {
      font-size: 0.85rem;
      font-weight: 700;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 1px dashed #e2e8f0;
    }
    .required {
      color: #ef4444;
    }

    /* Edit Modal Photo */
    .edit-photo-card {
      display: flex;
      align-items: center;
      gap: 18px;
      padding: 14px 18px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      margin-bottom: 18px;
    }
    .edit-photo-avatar-box {
      position: relative;
      width: 72px;
      height: 72px;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      background: #e2e8f0;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .edit-avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .edit-avatar-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background: #f1f5f9;
      color: #94a3b8;
    }
    .edit-photo-spinner {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .edit-photo-info {
      flex: 1;
    }
    .edit-photo-title {
      font-weight: 700;
      font-size: 0.95rem;
      color: #1e293b;
      margin-bottom: 2px;
    }
    .btn-outline-danger {
      border: 1px solid #fecaca;
      background: #ffffff;
      color: #dc2626;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .btn-outline-danger:hover {
      background: #fef2f2;
      border-color: #ef4444;
    }

    /* Edit Profile Strip */
    .edit-profile-strip {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      margin-bottom: 16px;
    }
    .edit-student-name {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
    }
    .badge-tag-adm {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 7px;
    }
    .badge-tag-status {
      background: #f1f5f9;
      color: #64748b;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 7px;
    }
    .badge-tag-status.active-tag {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }

    /* Edit Modal Tabs Bar */
    .edit-modal-tabs {
      display: flex;
      gap: 6px;
      background: #f1f5f9;
      padding: 4px;
      border-radius: 10px;
      margin-bottom: 16px;
      overflow-x: auto;
    }
    .edit-tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 8px 14px;
      border-radius: 8px;
      background: transparent;
      border: none;
      font-size: 0.82rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
      white-space: nowrap;
    }
    .edit-tab-btn:hover {
      color: #1e293b;
      background: #e2e8f0;
    }
    .edit-tab-btn.active {
      background: #ffffff;
      color: #2563eb;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      font-weight: 700;
    }

    /* Subcard Styles */
    .edit-section-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      background: #ffffff;
    }
    .subcard-header {
      padding: 9px 14px;
      font-size: 0.835rem;
      font-weight: 700;
    }
    .blue-tint { background: #eff6ff; color: #1d4ed8; border-bottom: 1px solid #dbeafe; }
    .purple-tint { background: #f5f3ff; color: #5b21b6; border-bottom: 1px solid #ede9fe; }
    .teal-tint { background: #f0fdfa; color: #0f766e; border-bottom: 1px solid #ccfbf1; }
    .amber-tint { background: #fffbeb; color: #92400e; border-bottom: 1px solid #fef3c7; }
    .red-tint { background: #fef2f2; color: #b91c1c; border-bottom: 1px solid #fee2e2; }

    .d-flex { display: flex; }
    .align-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .cursor-pointer { cursor: pointer; }
    .font-semibold { font-weight: 600; }
    .font-bold { font-weight: 700; }
    .mb-1 { margin-bottom: 4px; }
    .mb-3 { margin-bottom: 12px; }
    .pt-2 { padding-top: 8px; }
    .p-3 { padding: 14px; }
    .gap-3 { gap: 12px; }
    .gap-4 { gap: 16px; }
    .grid-1 { display: grid; grid-template-columns: 1fr; gap: 14px; }
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 768px) {
      .grid-3, .grid-4 { grid-template-columns: 1fr; }
    }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .animate-fade-in { animation: fadeIn 0.2s ease-in-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

    /* Print styles */
    @media print {
      .student-list-header .header-actions,
      .control-filter-card,
      .pagination-footer-strip,
      .th-chk, .td-chk,
      .th-actions, .td-actions {
        display: none !important;
      }
      .page-container {
        padding: 0;
      }
      .student-table-card {
        border: none;
        box-shadow: none;
      }
      .student-data-table thead th,
      .student-data-table tbody td {
        padding: 8px 10px;
        font-size: 9pt;
      }
    }
  `]
})
export class StudentListComponent implements OnInit {
  private studentStore = inject(StudentStoreService);
  private academicStore = inject(AcademicStoreService);
  private financeStore = inject(FinanceStoreService);
  private examStore = inject(ExamStoreService);
  private systemStore = inject(SystemStoreService);
  private campusSession = inject(CampusSessionService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  classes: SchoolClass[] = [];
  sections: Section[] = [];
  filteredSections: Section[] = [];
  sessions: AcademicYear[] = [];
  students: Student[] = [];

  searchTerm = '';
  selectedClassId = 'ALL';
  selectedSectionId = 'ALL';
  selectedSession = '2025 - 2026';
  selectedStatus = 'ALL';

  // Selection
  selectedStudentsMap: Record<string, boolean> = {};

  // Sorting
  sortColumn: string = 'rollNo';
  sortAscending: boolean = true;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 5;

  canAdmit = false;
  canExport = false;
  canEditStatus = false;

  isGuardian = false;
  isStudent = false;

  // Profile modal
  isProfileOpen = false;
  activeStudent: Student | null = null;
  profileTab: 'personal' | 'academic' | 'fees' | 'exams' = 'personal';
  studentInvoices: StudentInvoice[] = [];
  studentMarks: ExamMark[] = [];

  // Status modal
  isStatusModalOpen = false;
  isSubmittingStatus = false;
  statusTargetStudent: Student | null = null;
  newStatus: Student['status'] = 'Active';
  statusReason = '';

  // Edit modal
  isEditModalOpen = false;
  isSubmittingEdit = false;
  editModalTab: 'basic' | 'parents' | 'address' | 'academic' = 'basic';
  editSections: Section[] = [];
  editForm: Partial<Student> = {};

  editPhotoPreview: string | null = null;
  isUploadingEditPhoto = false;

  divisions: DivisionLookup[] = [];
  availableDistricts: DistrictLookup[] = [];
  availableUpazilas: string[] = [];

  genders = ['Male', 'Female', 'Other'];
  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  religions = ['Islam', 'Hinduism', 'Christianity', 'Buddhism', 'Other'];
  nationalities = ['Bangladeshi', 'Other'];
  guardianRelations = [
    { id: 'Father', label: 'Father (পিতা)' },
    { id: 'Mother', label: 'Mother (মাতা)' },
    { id: 'Brother', label: 'Brother (ভাই)' },
    { id: 'Sister', label: 'Sister (বোন)' },
    { id: 'Uncle', label: 'Uncle (চাচা/মামা)' },
    { id: 'Aunt', label: 'Aunt (ফুফু/খালা)' },
    { id: 'Legal Guardian', label: 'Legal Guardian (আইনগত অভিভাবক)' },
    { id: 'Other', label: 'Other (অন্যান্য)' }
  ];
  shifts = ['Morning', 'Day'];
  admissionCategories = [
    { id: 'Regular', label: 'Regular Student' },
    { id: 'Transfer', label: 'Transfer In' },
    { id: 'Scholarship', label: 'Merit Scholarship' },
    { id: 'Quota', label: 'Sibling / Quota' },
    { id: 'StaffWard', label: 'Staff Ward' }
  ];
  statuses = ['Active', 'Transferred', 'Graduated', 'Inactive'];

  async ngOnInit() {
    this.academicStore.getClasses$().subscribe(c => {
      this.classes = c || [];
      this.cdr.markForCheck();
    });

    this.academicStore.getSections$().subscribe(s => {
      this.sections = s || [];
      this.onFilterClassChange();
      this.cdr.markForCheck();
    });

    this.studentStore.getStudents$().subscribe(list => {
      this.students = list || [];
      this.cdr.markForCheck();
    });

    this.studentStore.getAdmissionLookups$().subscribe(lookups => {
      if (lookups) {
        if (lookups.divisions && lookups.divisions.length > 0) {
          this.divisions = lookups.divisions;
          this.updateGeoDistrictsAndUpazilas();
        }
        if (lookups.religions && lookups.religions.length > 0) {
          this.religions = lookups.religions.map(r => r.label);
        }
        if (lookups.bloodGroups && lookups.bloodGroups.length > 0) {
          this.bloodGroups = lookups.bloodGroups.map(b => b.label);
        }
        if (lookups.nationalities && lookups.nationalities.length > 0) {
          this.nationalities = lookups.nationalities.map(n => n.id);
        }
        if (lookups.admissionCategories && lookups.admissionCategories.length > 0) {
          this.admissionCategories = lookups.admissionCategories;
        }
        if (lookups.academicYears && lookups.academicYears.length > 0) {
          this.sessions = lookups.academicYears.map((y: any) => ({
            id: y.id,
            name: y.label || y.name || '2025 - 2026',
            startDate: y.startDate || '2025-01-01',
            endDate: y.endDate || '2025-12-31',
            isCurrent: y.isCurrent ?? (y.id === 'ay-2026'),
            isLocked: !!y.isLocked
          }));
          const curr = this.sessions.find(y => y.isCurrent);
          if (curr) {
            this.selectedSession = curr.name;
          }
        }
        this.cdr.markForCheck();
      }
    });

    try {
      await Promise.all([
        this.academicStore.loadClasses(),
        this.academicStore.loadSections(),
        this.studentStore.loadStudents(),
        this.studentStore.loadAdmissionLookups()
      ]);
    } catch (e) {
      console.warn('Student list data loading error:', e);
    }

    if (this.sessions.length === 0) {
      this.sessions = [
        { id: 'ay-2026', name: '2025 - 2026', startDate: '2025-01-01', endDate: '2025-12-31', isCurrent: true, isLocked: false }
      ];
      this.selectedSession = '2025 - 2026';
    }

    this.auth.getCurrentUser$().subscribe(user => {
      const role = (user?.roleName || '').toLowerCase();
      const roleId = (user?.roleId || '').toLowerCase();
      this.isGuardian = role.includes('guardian') || roleId.includes('guardian');
      this.isStudent = role.includes('student') || roleId.includes('student');

      if (this.isGuardian || this.isStudent) {
        this.canAdmit = false;
        this.canExport = false;
        this.canEditStatus = false;
      } else {
        this.canAdmit = this.auth.hasPermission('STUD_ADMISSION', 'create') || this.auth.hasPermission('STU_ADMIT', 'create');
        this.canExport = this.auth.hasPermission('STUD_LIST', 'export') || this.auth.hasPermission('STU_LIST', 'export');
        this.canEditStatus = this.auth.hasPermission('STUD_LIST', 'edit') || this.auth.hasPermission('STU_LIST', 'edit');
      }
      this.cdr.markForCheck();
    });
  }

  // Statistics Getters
  get totalStudentsCount(): number {
    return this.filteredStudents.length;
  }

  get boysCount(): number {
    return this.filteredStudents.filter(s => (s.gender || '').toLowerCase() === 'male').length;
  }

  get girlsCount(): number {
    return this.filteredStudents.filter(s => (s.gender || '').toLowerCase() === 'female').length;
  }

  get classesCount(): number {
    return this.classes.length;
  }

  get sectionsCount(): number {
    return this.sections.length;
  }

  onFilterClassChange() {
    if (this.selectedClassId === 'ALL') {
      this.filteredSections = this.sections;
    } else {
      this.filteredSections = this.sections.filter(s => s.classId === this.selectedClassId);
    }
    this.selectedSectionId = 'ALL';
    this.currentPage = 1;
  }

  onFilterChange() {
    this.currentPage = 1;
  }

  onSearchChange() {
    this.currentPage = 1;
  }

  get filteredStudents(): Student[] {
    let list = this.students;

    if (this.isGuardian || this.isStudent) {
      const user = this.auth.getCurrentUser();
      const ward = this.students.find(s =>
        s.id === user?.id ||
        (user?.email && s.email === user.email) ||
        (user?.phone && (s.phone === user.phone || s.guardianPhone === user.phone))
      );
      if (ward) {
        const found = list.filter(s => s.id === ward.id || s.fullName.toLowerCase() === ward.fullName.toLowerCase());
        return found.length > 0 ? found : [ward];
      }
      return list.length > 0 ? [list[0]] : [];
    }

    if (this.selectedClassId !== 'ALL') {
      list = list.filter(s => s.classId === this.selectedClassId);
    }
    if (this.selectedSectionId !== 'ALL') {
      list = list.filter(s => s.sectionId === this.selectedSectionId);
    }
    if (this.selectedStatus !== 'ALL') {
      list = list.filter(s => (s.status || '').toLowerCase() === this.selectedStatus.toLowerCase());
    }
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(
        s =>
          (s.fullName || '').toLowerCase().includes(q) ||
          (s.admissionNo || '').toLowerCase().includes(q) ||
          (s.rollNo || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  // Sorting
  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortAscending = !this.sortAscending;
    } else {
      this.sortColumn = column;
      this.sortAscending = true;
    }
    this.currentPage = 1;
  }

  get sortedStudents(): Student[] {
    const list = [...this.filteredStudents];
    list.sort((a: any, b: any) => {
      let valA = a[this.sortColumn] ?? '';
      let valB = b[this.sortColumn] ?? '';

      if (this.sortColumn === 'rollNo') {
        const numA = parseInt(valA, 10);
        const numB = parseInt(valB, 10);
        if (!isNaN(numA) && !isNaN(numB)) {
          return this.sortAscending ? numA - numB : numB - numA;
        }
      }

      valA = valA.toString().toLowerCase();
      valB = valB.toString().toLowerCase();

      if (valA < valB) return this.sortAscending ? -1 : 1;
      if (valA > valB) return this.sortAscending ? 1 : -1;
      return 0;
    });
    return list;
  }

  // Pagination
  get totalPages(): number {
    return Math.ceil(this.sortedStudents.length / this.pageSize) || 1;
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.pageSize, this.sortedStudents.length);
  }

  get paginatedStudents(): Student[] {
    return this.sortedStudents.slice(this.startIndex, this.endIndex);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onPageSizeChange() {
    this.currentPage = 1;
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (this.currentPage > 3) pages.push(-1); // ellipsis
      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(total - 1, this.currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (this.currentPage < total - 2) pages.push(-1);
      pages.push(total);
    }
    return pages;
  }

  // Selection
  get isAllSelected(): boolean {
    const list = this.paginatedStudents;
    return list.length > 0 && list.every(s => this.selectedStudentsMap[s.id]);
  }

  toggleSelectAll(event: any) {
    const checked = event.target.checked;
    for (const s of this.paginatedStudents) {
      this.selectedStudentsMap[s.id] = checked;
    }
  }

  getStatusVariant(status: Student['status']) {
    switch (status) {
      case 'Active': return 'success';
      case 'Transferred': return 'warning';
      case 'Graduated': return 'purple';
      case 'Inactive': return 'danger';
      default: return 'info';
    }
  }

  async openProfile(student: Student) {
    this.activeStudent = student;
    this.profileTab = 'personal';
    this.isProfileOpen = true;
    this.cdr.markForCheck();

    try {
      const invoices = await this.financeStore.loadInvoices(student.id);
      this.studentInvoices = invoices || [];
    } catch {
      this.studentInvoices = this.financeStore.getInvoices(student.id);
    }

    try {
      const exams = await this.examStore.loadExams();
      const activeExam = exams.find(e => e.isPublished) || exams[0];
      if (activeExam) {
        const marks = await this.examStore.fetchExamMarks(activeExam.id, student.classId, student.sectionId);
        this.studentMarks = (marks || []).filter(m => m.studentId === student.id);
      } else {
        this.studentMarks = [];
      }
    } catch {
      this.studentMarks = this.examStore.getExamMarks('', student.classId, '').filter(m => m.studentId === student.id);
    }
    this.cdr.markForCheck();
  }

  openStatusModal(student: Student) {
    this.statusTargetStudent = student;
    this.newStatus = student.status;
    this.statusReason = '';
    this.isStatusModalOpen = true;
  }

  async saveStudentStatus() {
    if (!this.statusTargetStudent) {
      this.toast.error('Validation Error', 'No student selected.');
      return;
    }

    const reason = this.statusReason?.trim() || `Status updated to ${this.newStatus}`;
    this.isSubmittingStatus = true;
    this.cdr.markForCheck();
    try {
      await this.studentStore.updateStudentStatus(this.statusTargetStudent.id, this.newStatus, reason);
      this.toast.success('Status Updated', `Student status changed to ${this.newStatus}`);
      this.isStatusModalOpen = false;
      this.statusTargetStudent = null;
      this.statusReason = '';
      this.students = this.studentStore.getStudents();
      const user = this.auth.getCurrentUser();
      this.systemStore.logAudit('Update', 'Student Status', `Changed status to ${this.newStatus}. Reason: ${reason}`, user?.fullName || 'Administrator', user?.roleName || 'Admin');
    } catch (err: any) {
      this.toast.error('Status Update Failed', err?.message || 'Could not update student lifecycle status.');
    } finally {
      this.isSubmittingStatus = false;
      this.cdr.markForCheck();
    }
  }

  getEditClassName(): string {
    return this.classes.find(c => c.id === this.editForm.classId)?.name || 'Class';
  }

  getEditSectionName(): string {
    return this.editSections.find(s => s.id === this.editForm.sectionId)?.name || 'Section';
  }

  updateGeoDistrictsAndUpazilas() {
    if (!this.divisions || this.divisions.length === 0) return;
    const curDivName = this.editForm.division || 'Dhaka';
    const div = this.divisions.find(d => d.name === curDivName) || this.divisions[0];
    this.availableDistricts = div ? div.districts : [];

    const curDistName = this.editForm.district || (this.availableDistricts[0]?.name || '');
    const dist = this.availableDistricts.find(d => d.name === curDistName) || this.availableDistricts[0];
    this.availableUpazilas = dist ? dist.upazilas : [];
  }

  onEditDivisionChange() {
    const div = this.divisions.find(d => d.name === this.editForm.division);
    this.availableDistricts = div ? div.districts : [];
    if (this.availableDistricts.length > 0) {
      this.editForm.district = this.availableDistricts[0].name;
      this.onEditDistrictChange();
    } else {
      this.editForm.district = '';
      this.availableUpazilas = [];
      this.editForm.upazila = '';
    }
    this.cdr.markForCheck();
  }

  onEditDistrictChange() {
    const dist = this.availableDistricts.find(d => d.name === this.editForm.district);
    this.availableUpazilas = dist ? dist.upazilas : [];
    if (this.availableUpazilas.length > 0) {
      this.editForm.upazila = this.availableUpazilas[0];
    } else {
      this.editForm.upazila = '';
    }
    this.cdr.markForCheck();
  }

  syncEditPermanentAddress(event: any) {
    if (event.target.checked) {
      this.editForm.permanentAddress = this.editForm.presentAddress;
    }
  }

  openEditModal(student: Student) {
    this.editModalTab = 'basic';
    this.editForm = {
      ...student,
      fatherName: student.fatherName || '',
      fatherPhone: student.fatherPhone || '',
      fatherOccupation: student.fatherOccupation || '',
      fatherNid: student.fatherNid || '',
      motherName: student.motherName || '',
      motherPhone: student.motherPhone || '',
      motherOccupation: student.motherOccupation || '',
      motherNid: student.motherNid || '',
      nationality: student.nationality || 'Bangladeshi',
      previousSchool: student.previousSchool || '',
      division: student.division || 'Dhaka',
      district: student.district || 'Dhaka',
      upazila: student.upazila || 'Dhanmondi',
      emergencyContactName: student.emergencyContactName || '',
      emergencyContactPhone: student.emergencyContactPhone || '',
      emergencyContactRelation: student.emergencyContactRelation || '',
      shift: student.shift || 'Morning',
      admissionCategory: student.admissionCategory || 'Regular',
      lastClassPassed: student.lastClassPassed || '',
      lastPassingYear: student.lastPassingYear || '2025',
      lastGpaMarks: student.lastGpaMarks || '',
      tcNumber: student.tcNumber || '',
      coCurricular: student.coCurricular || '',
      medicalNotes: student.medicalNotes || '',
      isHostel: !!student.isHostel,
      isTransport: !!student.isTransport,
      religion: student.religion || 'Islam',
      bloodGroup: student.bloodGroup || 'B+',
      gender: student.gender || 'Male'
    };
    this.editPhotoPreview = null;
    this.editSections = this.sections.filter(s => s.classId === student.classId);
    this.updateGeoDistrictsAndUpazilas();
    this.isEditModalOpen = true;
    this.cdr.markForCheck();
  }

  async onEditPhotoSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.toast.error('Invalid Format', 'Please upload an image file (JPG, PNG, WebP).');
      event.target.value = '';
      return;
    }

    this.isUploadingEditPhoto = true;
    this.cdr.markForCheck();
    try {
      // Automatically optimize and resize image regardless of original MB size
      const optimizedFile = await compressAndResizeImage(file);

      const reader = new FileReader();
      reader.onload = () => {
        this.editPhotoPreview = reader.result as string;
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(optimizedFile);

      const res = await this.auth.uploadFile(optimizedFile, 'students');
      if (res && res.url) {
        this.editForm.photoUrl = res.url;
        this.toast.success('Photo Uploaded', `Student picture updated (${Math.round(optimizedFile.size / 1024)} KB).`);
      } else {
        this.toast.error('Upload Failed', 'Could not upload student picture.');
        this.editPhotoPreview = null;
      }
    } catch (err: any) {
      this.toast.error('Upload Error', err?.message || 'Error uploading photo.');
      this.editPhotoPreview = null;
    } finally {
      this.isUploadingEditPhoto = false;
      event.target.value = '';
      this.cdr.markForCheck();
    }
  }

  removeEditPhoto(input?: HTMLInputElement) {
    this.editPhotoPreview = null;
    this.editForm.photoUrl = '';
    if (input) input.value = '';
    this.toast.info('Photo Cleared', 'Student photograph removed.');
    this.cdr.markForCheck();
  }

  onEditClassChange() {
    if (this.editForm.classId) {
      this.editSections = this.sections.filter(s => s.classId === this.editForm.classId);
      if (this.editSections.length > 0) {
        this.editForm.sectionId = this.editSections[0].id;
      }
    }
  }

  async saveStudentEdit() {
    if (!this.editForm.id || !this.editForm.fullName?.trim()) {
      this.toast.error('Validation Error', 'Full Name is required.');
      this.editModalTab = 'basic';
      return;
    }

    if (!this.editForm.guardianName?.trim()) {
      if (this.editForm.fatherName?.trim()) {
        this.editForm.guardianName = this.editForm.fatherName.trim();
        this.editForm.guardianRelation = 'Father';
        if (!this.editForm.guardianPhone && this.editForm.fatherPhone) {
          this.editForm.guardianPhone = this.editForm.fatherPhone;
        }
      } else if (this.editForm.motherName?.trim()) {
        this.editForm.guardianName = this.editForm.motherName.trim();
        this.editForm.guardianRelation = 'Mother';
        if (!this.editForm.guardianPhone && this.editForm.motherPhone) {
          this.editForm.guardianPhone = this.editForm.motherPhone;
        }
      } else {
        this.toast.error('Validation Error', 'Guardian Name is required.');
        this.editModalTab = 'parents';
        return;
      }
    }

    if (!this.editForm.guardianPhone?.trim()) {
      this.editForm.guardianPhone = this.editForm.phone || '01700-000000';
    }

    this.isSubmittingEdit = true;
    this.cdr.markForCheck();
    try {
      await this.studentStore.updateStudent(this.editForm.id, this.editForm);
      this.toast.success('Profile Saved', `Updated complete student profile for ${this.editForm.fullName}`);
      this.isEditModalOpen = false;
      this.students = this.studentStore.getStudents();
      this.cdr.markForCheck();
      const user = this.auth.getCurrentUser();
      this.systemStore.logAudit('Update', 'Student Profile', `Updated complete student profile for ID ${this.editForm.id}`, user?.fullName || 'Administrator', user?.roleName || 'Admin');
    } catch (err: any) {
      this.toast.error('Save Failed', err?.message || 'Could not update student details.');
    } finally {
      this.isSubmittingEdit = false;
      this.cdr.markForCheck();
    }
  }

  printStudentList() {
    window.print();
  }

  exportToCSV() {
    const list = this.filteredStudents;
    if (list.length === 0) {
      this.toast.warning('No Data', 'No student records to export.');
      return;
    }
    const headers = ['Admission No', 'Roll No', 'Full Name', 'Bangla Name', 'Class', 'Section', 'Gender', 'Phone', 'Status'];
    const rows = list.map(s => [
      `"${s.admissionNo}"`,
      `"${s.rollNo}"`,
      `"${s.fullName}"`,
      `"${s.banglaName || ''}"`,
      `"${s.className || ''}"`,
      `"${s.sectionName || ''}"`,
      `"${s.gender || ''}"`,
      `"${s.phone || s.guardianPhone || ''}"`,
      `"${s.status || 'Active'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Student_List_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.toast.success('Export Successful', `Exported ${list.length} student records.`);
    const user = this.auth.getCurrentUser();
    this.systemStore.logAudit('Export', 'Student Directory', `Exported student list CSV (${list.length} rows)`, user?.fullName || 'Administrator', user?.roleName || 'Admin');
  }
}
