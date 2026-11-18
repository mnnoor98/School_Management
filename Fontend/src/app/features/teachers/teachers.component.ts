import { CampusImageDirective } from '../../shared/components/campus-image.directive';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TeacherStoreService } from '../../core/services/stores/teacher-store.service';
import { MasterDataStoreService } from '../../core/services/stores/master-data-store.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Teacher, Designation, Department, MasterLookupItem } from '../../core/models';
import { BadgeComponent } from '../../shared/components/badge.component';
import { IconComponent } from '../../shared/components/icon.component';
import { ModalComponent } from '../../shared/components/modal.component';

@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [CampusImageDirective, CommonModule, FormsModule, RouterModule, BadgeComponent, IconComponent, ModalComponent],
  template: `
    <div class="page-container">
      <!-- HEADER -->
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <app-icon name="briefcase" [size]="26" class="text-primary"></app-icon>
            Faculty & Academic Staff Directory
          </h1>
          <p class="page-subtitle">
            Manage teacher profiles, subject assignments, departments, and qualification dossiers.
          </p>
        </div>
        <div class="page-actions" *ngIf="canManage">
          <!-- Direct Link to Master Data Center -->
          <a routerLink="/app/admin/master-data" class="btn btn-outline-purple" title="Manage all institutional master data">
            <app-icon name="layers" [size]="16"></app-icon>
            <span>Master Data Center</span>
          </a>

          <button type="button" class="btn btn-primary" (click)="openAddTeacherModal()">
            <app-icon name="plus" [size]="16"></app-icon>
            <span>Add New Teacher</span>
          </button>
        </div>
      </div>

      <!-- FILTER STRIP -->
      <div class="card mb-4">
        <div class="card-body p-3">
          <div class="filter-strip">
            <div class="search-wrap">
              <app-icon name="search" [size]="16" class="search-icon"></app-icon>
              <input
                type="text"
                [(ngModel)]="searchTerm"
                class="form-control form-control-sm"
                placeholder="Search teacher by name, code, or department..."
              />
            </div>

            <div class="filter-item">
              <label class="filter-lbl">Department:</label>
              <select [(ngModel)]="selectedDepartment" class="form-select form-select-sm">
                <option value="ALL">All Departments</option>
                <option *ngFor="let d of departments" [value]="d">{{ d }}</option>
              </select>
            </div>

            <div class="count-badge">
              <span>{{ filteredTeachers.length }} Faculty Members</span>
            </div>
          </div>
        </div>
      </div>

      <!-- TEACHERS GRID -->
      <div class="grid-3">
        <div *ngFor="let t of filteredTeachers" class="teacher-card">
          <div class="t-header">
            <img campusImage [src]="t.avatar || defaultAvatar" [alt]="t.fullName" class="t-avatar" />
            <div class="t-title-info">
              <h3 class="t-name">{{ t.fullName }}</h3>
              <span class="t-desig">{{ t.designation }}</span>
              <div class="mt-1 d-flex gap-1">
                <app-badge variant="purple" [label]="t.department"></app-badge>
                <app-badge [variant]="t.status === 'Active' ? 'success' : 'warning'" [label]="t.status"></app-badge>
              </div>
            </div>

            <div class="card-top-actions" *ngIf="canManage">
              <button type="button" class="btn-icon-subtle" title="Edit Teacher" (click)="openEditTeacherModal(t)">
                <app-icon name="edit-3" [size]="15"></app-icon>
              </button>
              <button type="button" class="btn-icon-subtle text-danger" title="Remove Teacher" (click)="deleteTeacher(t)">
                <app-icon name="trash-2" [size]="15"></app-icon>
              </button>
            </div>
          </div>

          <div class="t-body">
            <div class="t-info-row">
              <span class="text-muted">Employee Code:</span>
              <code class="code-tag">{{ t.employeeCode }}</code>
            </div>
            <div class="t-info-row">
              <span class="text-muted">Qualification:</span>
              <strong>{{ t.qualification }}</strong>
            </div>
            <div class="t-info-row">
              <span class="text-muted">Email:</span>
              <span class="text-truncate">{{ t.email }}</span>
            </div>
            <div class="t-info-row">
              <span class="text-muted">Contact:</span>
              <span>{{ t.phone }}</span>
            </div>
            <div class="t-info-row">
              <span class="text-muted">Assigned Courses:</span>
              <div class="subj-badge-wrap">
                <span class="subj-badge" *ngFor="let s of t.assignedSubjects">{{ s }}</span>
                <span *ngIf="!t.assignedSubjects || t.assignedSubjects.length === 0" class="text-muted text-xs">None</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MAIN MODAL: ADD / EDIT TEACHER -->
      <app-modal [isOpen]="isModalOpen" [title]="isEditing ? 'Edit Teacher Dossier' : 'Add New Faculty Teacher'" (close)="isModalOpen = false">
        <form (ngSubmit)="saveTeacher()" class="modal-form">
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Full Name <span class="required">*</span></label>
              <input type="text" [(ngModel)]="form.fullName" name="fullName" class="form-control" placeholder="e.g. Dr. Mohammad Rafiqul Islam" required />
            </div>
            <div class="form-group">
              <label class="form-label">Employee Code <span class="required">*</span></label>
              <input type="text" [(ngModel)]="form.employeeCode" name="employeeCode" class="form-control" placeholder="e.g. TCH-010" required />
            </div>
          </div>

          <!-- DESIGNATION & ACADEMIC DEPARTMENT (DROPDOWNS WITH QUICK MASTER ENTRY) -->
          <div class="form-grid-2">
            <!-- Designation Dropdown -->
            <div class="form-group">
              <div class="label-with-action">
                <label class="form-label mb-0">Designation <span class="required">*</span></label>
                <button type="button" class="btn-quick-master" (click)="openQuickDesignationModal()" title="Add New Designation to Master Data">
                  + Add New
                </button>
              </div>
              <select [(ngModel)]="form.designation" name="designation" class="form-select" required>
                <option *ngFor="let des of designations" [value]="des.title">
                  {{ des.title }} ({{ des.category }})
                </option>
                <option *ngIf="isCustomDesignation(form.designation)" [value]="form.designation">
                  {{ form.designation }} (Custom)
                </option>
              </select>
            </div>

            <!-- Academic Department Dropdown -->
            <div class="form-group">
              <div class="label-with-action">
                <label class="form-label mb-0">Academic Department <span class="required">*</span></label>
                <button type="button" class="btn-quick-master" (click)="openQuickDepartmentModal()" title="Add New Department to Master Data">
                  + Add New
                </button>
              </div>
              <select [(ngModel)]="form.department" name="department" class="form-select" required>
                <option *ngFor="let dept of departmentsList" [value]="dept.name">
                  {{ dept.name }}
                </option>
                <option *ngIf="isCustomDepartment(form.department)" [value]="form.department">
                  {{ form.department }} (Custom)
                </option>
              </select>
            </div>
          </div>

          <!-- EDUCATIONAL QUALIFICATION & STATUS (DROPDOWNS WITH QUICK MASTER ENTRY) -->
          <div class="form-grid-2">
            <!-- Qualification Dropdown -->
            <div class="form-group">
              <div class="label-with-action">
                <label class="form-label mb-0">Educational Qualification</label>
                <button type="button" class="btn-quick-master" (click)="openQuickQualificationModal()" title="Add New Qualification to Master Data">
                  + Add New
                </button>
              </div>
              <select [(ngModel)]="form.qualification" name="qualification" class="form-select">
                <option *ngFor="let q of qualificationsList" [value]="q.name">
                  {{ q.name }} {{ q.banglaName ? '(' + q.banglaName + ')' : '' }}
                </option>
                <option *ngIf="isCustomQualification(form.qualification)" [value]="form.qualification">
                  {{ form.qualification }} (Custom)
                </option>
              </select>
            </div>

            <!-- Status Dropdown -->
            <div class="form-group">
              <label class="form-label">Status</label>
              <select [(ngModel)]="form.status" name="status" class="form-select">
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Official Email</label>
              <input type="email" [(ngModel)]="form.email" name="email" class="form-control" placeholder="e.g. rafiq@scholarsacademy.edu.bd" />
            </div>
            <div class="form-group">
              <label class="form-label">Contact Phone</label>
              <input type="text" [(ngModel)]="form.phone" name="phone" class="form-control" placeholder="e.g. +880 1711-223344" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Assigned Teaching Subjects (comma separated)</label>
            <input type="text" [(ngModel)]="assignedSubjectsString" name="assignedSubjects" class="form-control" placeholder="e.g. Higher Mathematics, Physics, ICT" />
          </div>

          <!-- PROFILE PICTURE FILE UPLOAD -->
          <div class="form-group picture-upload-group">
            <label class="form-label">Faculty Profile Picture</label>
            <div class="picture-upload-wrapper">
              <!-- Avatar Preview with camera overlay -->
              <div class="picture-preview-box" (click)="fileInput.click()" title="Click to upload/change photo">
                <img campusImage [src]="form.avatar || defaultAvatar" alt="Teacher Preview" class="picture-preview-img" />
                <div class="picture-overlay">
                  <app-icon name="camera" [size]="18" class="text-white"></app-icon>
                  <span class="overlay-text">Change</span>
                </div>
                <div *ngIf="isUploadingPhoto" class="upload-spinner-overlay">
                  <app-icon name="loader" [size]="20" class="spin text-white"></app-icon>
                </div>
              </div>

              <!-- Upload Actions and Helper Hint -->
              <div class="picture-info-actions">
                <div class="picture-buttons-row">
                  <input 
                    type="file" 
                    #fileInput 
                    (change)="onPhotoFileSelected($event)" 
                    accept="image/png, image/jpeg, image/jpg, image/webp" 
                    style="display: none;" 
                  />
                  <button type="button" class="btn btn-outline btn-sm" (click)="fileInput.click()">
                    <app-icon name="upload" [size]="14"></app-icon>
                    <span>Upload Picture</span>
                  </button>
                  <button 
                    *ngIf="form.avatar && form.avatar !== defaultAvatar" 
                    type="button" 
                    class="btn btn-outline-danger btn-sm" 
                    (click)="removePhoto()"
                  >
                    <app-icon name="trash" [size]="14"></app-icon>
                    <span>Remove</span>
                  </button>
                </div>
                <p class="picture-hint">
                  Upload file from computer (JPG, PNG, or WebP up to 5MB). Photo appears on teacher ID card, routine, and staff dossier.
                </p>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" (click)="isModalOpen = false">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!form.fullName || !form.employeeCode">
              <app-icon name="check" [size]="16"></app-icon>
              <span>{{ isEditing ? 'Update Teacher' : 'Save Teacher' }}</span>
            </button>
          </div>
        </form>
      </app-modal>

      <!-- QUICK MASTER ENTRY MODAL 1: ADD DESIGNATION -->
      <app-modal 
        [isOpen]="isQuickDesignationModalOpen" 
        title="Add Designation (Master Data Entry)" 
        (close)="isQuickDesignationModalOpen = false"
      >
        <form (ngSubmit)="saveQuickDesignation()" class="modal-form">
          <p class="text-sm text-muted mb-2">Create a new institutional designation. It will instantly appear in the teacher dropdown and Master Data.</p>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Designation Code <span class="required">*</span></label>
              <input type="text" [(ngModel)]="quickDesignation.code" name="desCode" class="form-control" placeholder="e.g. DES-11, LECT" required />
            </div>
            <div class="form-group">
              <label class="form-label">Category <span class="required">*</span></label>
              <select [(ngModel)]="quickDesignation.category" name="desCategory" class="form-select">
                <option value="Teaching">Teaching</option>
                <option value="Administrative">Administrative</option>
                <option value="Non-Teaching">Non-Teaching</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Designation Title <span class="required">*</span></label>
            <input type="text" [(ngModel)]="quickDesignation.title" name="desTitle" class="form-control" placeholder="e.g. Senior Lecturer (Physics)" required />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline" (click)="isQuickDesignationModalOpen = false">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!quickDesignation.title">
              <span>Save & Select</span>
            </button>
          </div>
        </form>
      </app-modal>

      <!-- QUICK MASTER ENTRY MODAL 2: ADD DEPARTMENT -->
      <app-modal 
        [isOpen]="isQuickDepartmentModalOpen" 
        title="Add Department (Master Data Entry)" 
        (close)="isQuickDepartmentModalOpen = false"
      >
        <form (ngSubmit)="saveQuickDepartment()" class="modal-form">
          <p class="text-sm text-muted mb-2">Create a new academic department. It will immediately be saved to Master Data and selected.</p>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Department Code <span class="required">*</span></label>
              <input type="text" [(ngModel)]="quickDepartment.code" name="deptCode" class="form-control" placeholder="e.g. DPT-09, ISL" required />
            </div>
            <div class="form-group">
              <label class="form-label">Department Head (Optional)</label>
              <input type="text" [(ngModel)]="quickDepartment.headTeacherName" name="deptHead" class="form-control" placeholder="e.g. Dr. Kamal Uddin" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Department Name <span class="required">*</span></label>
            <input type="text" [(ngModel)]="quickDepartment.name" name="deptName" class="form-control" placeholder="e.g. Department of Islamic Studies & Ethics" required />
          </div>
          <div class="form-group">
            <label class="form-label">Description / Scope</label>
            <input type="text" [(ngModel)]="quickDepartment.description" name="deptDesc" class="form-control" placeholder="e.g. Islamic Studies, Quran, Moral Values" />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline" (click)="isQuickDepartmentModalOpen = false">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!quickDepartment.name">
              <span>Save & Select</span>
            </button>
          </div>
        </form>
      </app-modal>

      <!-- QUICK MASTER ENTRY MODAL 3: ADD QUALIFICATION -->
      <app-modal 
        [isOpen]="isQuickQualificationModalOpen" 
        title="Add Educational Qualification (Master Data Entry)" 
        (close)="isQuickQualificationModalOpen = false"
      >
        <form (ngSubmit)="saveQuickQualification()" class="modal-form">
          <p class="text-sm text-muted mb-2">Add a new educational degree/qualification to the master lookup dictionary.</p>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Degree Code <span class="required">*</span></label>
              <input type="text" [(ngModel)]="quickQualification.code" name="qualCode" class="form-control" placeholder="e.g. MPHIL, BARCH" required />
            </div>
            <div class="form-group">
              <label class="form-label">Bangla Title</label>
              <input type="text" [(ngModel)]="quickQualification.banglaName" name="qualBn" class="form-control" placeholder="e.g. এম.ফিল" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Qualification Name (English) <span class="required">*</span></label>
            <input type="text" [(ngModel)]="quickQualification.name" name="qualName" class="form-control" placeholder="e.g. M.Phil in Mathematics" required />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline" (click)="isQuickQualificationModalOpen = false">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!quickQualification.name">
              <span>Save & Select</span>
            </button>
          </div>
        </form>
      </app-modal>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }
    .text-primary { color: #4f46e5; }
    .text-muted { color: #64748b; }
    .text-danger { color: #ef4444; }
    .text-xs { font-size: 0.75rem; }
    .text-sm { font-size: 0.825rem; }
    .mt-1 { margin-top: 4px; }
    .mb-0 { margin-bottom: 0 !important; }
    .mb-2 { margin-bottom: 8px; }
    .mb-4 { margin-bottom: 24px; }
    .d-flex { display: flex; }
    .gap-1 { gap: 6px; }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .page-subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin: 4px 0 0 0;
    }
    .page-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .filter-strip {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .search-wrap {
      position: relative;
      flex: 1;
    }
    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }
    .search-wrap input {
      padding-left: 36px;
      height: 38px;
    }
    .filter-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .filter-lbl {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #64748b;
      white-space: nowrap;
    }
    .count-badge {
      font-size: 0.8125rem;
      color: #475569;
      font-weight: 600;
      background: #f1f5f9;
      padding: 6px 12px;
      border-radius: 6px;
      white-space: nowrap;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 20px;
    }
    .teacher-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.04);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .teacher-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.08);
    }
    .t-header {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 14px;
      position: relative;
    }
    .t-avatar {
      width: 54px;
      height: 54px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #e0e7ff;
    }
    .t-title-info {
      flex: 1;
      min-width: 0;
    }
    .t-name {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .t-desig {
      font-size: 0.8rem;
      font-weight: 600;
      color: #6366f1;
    }
    .card-top-actions {
      display: flex;
      gap: 4px;
    }
    .btn-icon-subtle {
      background: transparent;
      border: none;
      padding: 4px;
      border-radius: 6px;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-icon-subtle:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .btn-icon-subtle.text-danger:hover {
      background: #fef2f2;
      color: #ef4444;
    }

    .t-body {
      padding-top: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .t-info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8125rem;
      gap: 8px;
    }
    .code-tag {
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.75rem;
      color: #475569;
      font-family: monospace;
    }
    .text-truncate {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 200px;
    }
    .subj-badge-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      justify-content: flex-end;
    }
    .subj-badge {
      font-size: 0.72rem;
      background: #eef2ff;
      color: #4f46e5;
      padding: 2px 7px;
      border-radius: 6px;
      font-weight: 600;
    }

    /* Form and Dropdown styling */
    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .label-with-action {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .form-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #334155;
    }
    .btn-quick-master {
      background: transparent;
      border: none;
      color: #4f46e5;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      padding: 0 4px;
      border-radius: 4px;
      transition: all 0.15s;
    }
    .btn-quick-master:hover {
      text-decoration: underline;
      color: #3730a3;
    }
    .form-control, .form-select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.85rem;
      background: #ffffff;
      color: #0f172a;
    }
    .form-select {
      cursor: pointer;
    }
    .form-control:focus, .form-select:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 10px;
    }
    .required { color: #ef4444; }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid transparent;
      text-decoration: none;
    }
    .btn-primary {
      background: #4f46e5;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #4338ca;
    }
    .btn-outline {
      background: #ffffff;
      border-color: #cbd5e1;
      color: #334155;
    }
    .btn-outline:hover {
      background: #f8fafc;
      border-color: #94a3b8;
    }
    .btn-outline-purple {
      background: #ffffff;
      border: 1px solid #c7d2fe;
      color: #4338ca;
    }
    .btn-outline-purple:hover {
      background: #eef2ff;
      border-color: #818cf8;
    }

    /* Picture Upload Card */
    .picture-upload-group {
      margin-top: 4px;
    }
    .picture-upload-wrapper {
      display: flex;
      align-items: center;
      gap: 18px;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 14px;
      padding: 14px 18px;
      transition: all 0.2s;
    }
    .picture-upload-wrapper:hover {
      border-color: #6366f1;
      background: #fdfdfe;
    }
    .picture-preview-box {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      position: relative;
      cursor: pointer;
      overflow: hidden;
      border: 3px solid #e0e7ff;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
      flex-shrink: 0;
      background: #eef2ff;
    }
    .picture-preview-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .picture-overlay {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .picture-preview-box:hover .picture-overlay {
      opacity: 1;
    }
    .overlay-text {
      font-size: 0.65rem;
      font-weight: 700;
      color: #ffffff;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .upload-spinner-overlay {
      position: absolute;
      inset: 0;
      background: rgba(79, 70, 229, 0.75);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .picture-info-actions {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .picture-buttons-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .picture-hint {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0;
      line-height: 1.35;
    }
    .btn-sm {
      padding: 6px 12px;
      font-size: 0.8rem;
      border-radius: 8px;
    }
    .btn-outline-danger {
      background: #ffffff;
      border: 1px solid #fca5a5;
      color: #dc2626;
    }
    .btn-outline-danger:hover {
      background: #fef2f2;
      border-color: #ef4444;
    }
    .text-white { color: #ffffff; }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .spin {
      animation: spin 1s linear infinite;
    }

    @media (max-width: 768px) {
      .grid-3 { grid-template-columns: 1fr; }
      .form-grid-2 { grid-template-columns: 1fr; }
      .filter-strip { flex-direction: column; align-items: stretch; }
    }
  `]
})
export class TeachersComponent implements OnInit {
  private masterDataStore = inject(MasterDataStoreService);
  private teacherStore = inject(TeacherStoreService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  teachers: Teacher[] = [];
  designations: Designation[] = [];
  departmentsList: Department[] = [];
  qualificationsList: MasterLookupItem[] = [];

  searchTerm = '';
  selectedDepartment = 'ALL';
  canManage = true;
  isLoading = false;

  defaultAvatar = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80';

  // Main Teacher Modal State
  isModalOpen = false;
  isEditing = false;
  assignedSubjectsString = '';
  form: {
    id?: string;
    employeeCode: string;
    fullName: string;
    designation: string;
    department: string;
    qualification: string;
    email: string;
    phone: string;
    status: 'Active' | 'On Leave' | 'Resigned';
    avatar: string;
  } = {
    employeeCode: '',
    fullName: '',
    designation: 'Assistant Teacher',
    department: 'Department of Physical & Chemical Sciences',
    qualification: 'M.Sc, B.Ed',
    email: '',
    phone: '',
    status: 'Active',
    avatar: ''
  };

  isUploadingPhoto = false;

  // Quick Master Entry Modals
  isQuickDesignationModalOpen = false;
  quickDesignation = {
    code: '',
    title: '',
    category: 'Teaching' as 'Teaching' | 'Administrative' | 'Non-Teaching'
  };

  isQuickDepartmentModalOpen = false;
  quickDepartment = {
    code: '',
    name: '',
    headTeacherName: '',
    description: ''
  };

  isQuickQualificationModalOpen = false;
  quickQualification = {
    code: '',
    name: '',
    banglaName: ''
  };

  async ngOnInit() {
    this.canManage = this.auth.hasPermission('TEACH_LIST', 'edit');
    await this.loadData();
    this.loadMasterLookups();
  }

  async loadData() {
    this.isLoading = true;
    this.cdr.markForCheck();
    try {
      this.teachers = await this.teacherStore.loadTeachers();
    } catch (e) {
      console.error('Error loading teachers:', e);
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  loadMasterLookups() {
    // 1. Load Designations from Master Data
    this.masterDataStore.getDesignations$().subscribe(desList => {
      this.designations = desList.filter(item => item.isActive !== false);
      if (!this.form.designation && this.designations.length > 0) {
        this.form.designation = this.designations[0].title;
      }
      this.cdr.markForCheck();
    });

    // 2. Load Academic Departments from Master Data
    this.masterDataStore.getDepartments$().subscribe(deptList => {
      this.departmentsList = deptList.filter(item => item.isActive !== false);
      if (!this.form.department && this.departmentsList.length > 0) {
        this.form.department = this.departmentsList[0].name;
      }
      this.cdr.markForCheck();
    });

    // 3. Load Educational Qualifications from Master Data Lookups
    this.masterDataStore.getLookups$().subscribe(lookups => {
      this.qualificationsList = lookups.filter(item => item.type === 'Qualification' && item.isActive !== false);
      if (!this.form.qualification && this.qualificationsList.length > 0) {
        this.form.qualification = this.qualificationsList[0].name;
      }
      this.cdr.markForCheck();
    });
  }

  get departments(): string[] {
    if (this.departmentsList.length > 0) {
      return this.departmentsList.map(d => d.name);
    }
    return Array.from(new Set(this.teachers.map(t => t.department).filter(Boolean)));
  }

  get filteredTeachers(): Teacher[] {
    return this.teachers.filter(t => {
      const matchSearch =
        !this.searchTerm ||
        t.fullName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        t.employeeCode.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        t.department.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        t.designation.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchDept = this.selectedDepartment === 'ALL' || t.department === this.selectedDepartment;
      return matchSearch && matchDept;
    });
  }

  isCustomDesignation(des: string): boolean {
    return !!des && !this.designations.some(d => d.title === des);
  }

  isCustomDepartment(dept: string): boolean {
    return !!dept && !this.departmentsList.some(d => d.name === dept);
  }

  isCustomQualification(qual: string): boolean {
    return !!qual && !this.qualificationsList.some(q => q.name === qual);
  }

  openAddTeacherModal() {
    this.isEditing = false;
    this.assignedSubjectsString = '';

    const defaultDes = this.designations[0]?.title || 'Assistant Teacher';
    const defaultDept = this.departmentsList[0]?.name || 'Department of Physical & Chemical Sciences';
    const defaultQual = this.qualificationsList[0]?.name || 'M.Sc, B.Ed';

    this.form = {
      employeeCode: 'TCH-0' + (this.teachers.length + 1),
      fullName: '',
      designation: defaultDes,
      department: defaultDept,
      qualification: defaultQual,
      email: '',
      phone: '+880 1711-000000',
      status: 'Active',
      avatar: this.defaultAvatar
    };
    this.isModalOpen = true;
  }

  openEditTeacherModal(t: Teacher) {
    this.isEditing = true;
    this.assignedSubjectsString = (t.assignedSubjects || []).join(', ');
    this.form = {
      id: t.id,
      employeeCode: t.employeeCode,
      fullName: t.fullName,
      designation: t.designation,
      department: t.department,
      qualification: t.qualification,
      email: t.email,
      phone: t.phone,
      status: t.status,
      avatar: t.avatar || this.defaultAvatar
    };
    this.isModalOpen = true;
  }

  async saveTeacher() {
    if (!this.form.fullName.trim() || !this.form.employeeCode.trim()) return;

    const subjects = this.assignedSubjectsString
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (this.isEditing && this.form.id) {
      await this.teacherStore.updateTeacher(this.form.id, {
        employeeCode: this.form.employeeCode.trim(),
        fullName: this.form.fullName.trim(),
        designation: this.form.designation.trim(),
        department: this.form.department.trim(),
        qualification: this.form.qualification.trim(),
        email: this.form.email.trim(),
        phone: this.form.phone.trim(),
        status: this.form.status,
        avatar: this.form.avatar.trim() || this.defaultAvatar,
        assignedSubjects: subjects
      });
      this.toast.success('Teacher Updated', `Profile for ${this.form.fullName} has been updated.`);
    } else {
      await this.teacherStore.addTeacher({
        employeeCode: this.form.employeeCode.trim(),
        fullName: this.form.fullName.trim(),
        designation: this.form.designation.trim(),
        department: this.form.department.trim(),
        qualification: this.form.qualification.trim(),
        email: this.form.email.trim(),
        phone: this.form.phone.trim(),
        status: this.form.status,
        avatar: this.form.avatar.trim() || this.defaultAvatar,
        assignedSubjects: subjects
      });
      this.toast.success('Teacher Added', `New teacher ${this.form.fullName} added successfully.`);
    }

    this.isModalOpen = false;
    await this.loadData();
    this.cdr.markForCheck();
  }

  async deleteTeacher(t: Teacher) {
    if (confirm(`Are you sure you want to remove teacher ${t.fullName} (${t.employeeCode})?`)) {
      await this.teacherStore.deleteTeacher(t.id);
      this.toast.info('Teacher Removed', `Teacher ${t.fullName} was removed.`);
      await this.loadData();
      this.cdr.markForCheck();
    }
  }

  // --- QUICK MASTER ENTRY ACTIONS ---
  openQuickDesignationModal() {
    this.quickDesignation = {
      code: 'DES-0' + (this.designations.length + 1),
      title: '',
      category: 'Teaching'
    };
    this.isQuickDesignationModalOpen = true;
  }

  async saveQuickDesignation() {
    if (!this.quickDesignation.title.trim()) return;

    const created = await this.masterDataStore.addDesignation({
      code: this.quickDesignation.code.trim() || ('DES-' + Date.now()),
      title: this.quickDesignation.title.trim(),
      category: this.quickDesignation.category,
      rankOrder: this.designations.length + 1,
      isActive: true
    });

    this.form.designation = created.title;
    this.toast.success('Designation Added', `"${created.title}" added to Master Data and selected.`);
    this.isQuickDesignationModalOpen = false;
    this.cdr.markForCheck();
  }

  openQuickDepartmentModal() {
    this.quickDepartment = {
      code: 'DPT-0' + (this.departmentsList.length + 1),
      name: '',
      headTeacherName: '',
      description: ''
    };
    this.isQuickDepartmentModalOpen = true;
  }

  async saveQuickDepartment() {
    if (!this.quickDepartment.name.trim()) return;

    const created = await this.masterDataStore.addDepartment({
      code: this.quickDepartment.code.trim() || ('DPT-' + Date.now()),
      name: this.quickDepartment.name.trim(),
      headTeacherName: this.quickDepartment.headTeacherName.trim(),
      description: this.quickDepartment.description.trim(),
      isActive: true
    });

    this.form.department = created.name;
    this.toast.success('Department Added', `"${created.name}" added to Master Data and selected.`);
    this.isQuickDepartmentModalOpen = false;
    this.cdr.markForCheck();
  }

  openQuickQualificationModal() {
    this.quickQualification = {
      code: 'DEG-0' + (this.qualificationsList.length + 1),
      name: '',
      banglaName: ''
    };
    this.isQuickQualificationModalOpen = true;
  }

  async saveQuickQualification() {
    if (!this.quickQualification.name.trim()) return;

    const created = await this.masterDataStore.addLookupItem({
      type: 'Qualification',
      code: this.quickQualification.code.trim() || this.quickQualification.name.trim().toUpperCase().substring(0, 6),
      name: this.quickQualification.name.trim(),
      banglaName: this.quickQualification.banglaName.trim(),
      displayOrder: this.qualificationsList.length + 1,
      isActive: true
    });

    this.form.qualification = created.name;
    this.toast.success('Qualification Added', `"${created.name}" added to Master Data and selected.`);
    this.isQuickQualificationModalOpen = false;
    this.cdr.markForCheck();
  }

  // --- PHOTO FILE UPLOAD HANDLERS ---
  async onPhotoFileSelected(event: any) {
    const file = event.target?.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.toast.error('Invalid Format', 'Please upload a valid image file (JPG, PNG, or WebP).');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.toast.error('File Too Large', 'Picture size must be less than 5MB.');
      event.target.value = '';
      return;
    }

    // 1. Immediately read local Data URL for immediate responsive preview
    const reader = new FileReader();
    reader.onload = () => {
      this.form.avatar = reader.result as string;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);

    // 2. Upload file to backend server
    this.isUploadingPhoto = true;
    try {
      const res = await this.auth.uploadFile(file, 'teachers');
      if (res && res.url) {
        this.form.avatar = res.url;
        this.toast.success('Picture Attached', 'Profile photo uploaded successfully.');
      } else {
        this.toast.info('Picture Attached', 'Local image preview attached to profile.');
      }
    } catch (err: any) {
      console.warn('Backend file upload fallback to local preview:', err);
    } finally {
      this.isUploadingPhoto = false;
      event.target.value = '';
      this.cdr.markForCheck();
    }
  }

  removePhoto() {
    this.form.avatar = this.defaultAvatar;
    this.toast.info('Photo Reset', 'Default institutional avatar restored.');
    this.cdr.markForCheck();
  }
}
