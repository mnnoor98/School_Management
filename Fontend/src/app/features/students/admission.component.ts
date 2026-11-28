import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StudentStoreService } from '../../core/services/stores/student-store.service';
import { AcademicStoreService } from '../../core/services/stores/academic-store.service';
import { CampusSessionService } from '../../core/services/campus-session.service';
import { ToastService } from '../../core/services/toast.service';
import { Student, SchoolClass, Section, Branch, AcademicYear, LookupOption, DistrictLookup, DivisionLookup, AdmissionLookups } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { compressAndResizeImage } from '../../core/utils/image-optimizer.util';
import { CampusImageDirective } from '../../shared/components/campus-image.directive';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-admission',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, CampusImageDirective],
  template: `
    <div class="admission-portal-container">
      
      <!-- 1. TOP EXECUTIVE HEADER BAR -->
      <div class="admission-header-card">
        <div class="header-left">
          <div class="header-icon-badge">
            <app-icon name="user" [size]="24" class="text-blue-600"></app-icon>
          </div>
          <div>
            <h1 class="header-main-title">Student Admission</h1>
            <p class="header-sub-title">Register a new student to the school</p>
          </div>
        </div>

        <div class="header-actions">
          <!-- Mode Switcher (Optional Quick Toggle) -->
          <button 
            type="button" 
            class="btn-action btn-bulk-toggle" 
            (click)="admissionMode = admissionMode === 'single' ? 'bulk' : 'single'">
            <app-icon [name]="admissionMode === 'single' ? 'file-spreadsheet' : 'user'" [size]="15"></app-icon>
            <span>{{ admissionMode === 'single' ? 'Bulk Excel Import' : 'Single Form Wizard' }}</span>
          </button>

          <button type="button" class="btn-action btn-new" (click)="resetForm()">
            <app-icon name="plus" [size]="15"></app-icon>
            <span>+ New</span>
          </button>

          <button type="button" class="btn-action btn-save" (click)="saveStudent()" [disabled]="isSubmitting">
            <app-icon *ngIf="!isSubmitting" name="save" [size]="15"></app-icon>
            <app-icon *ngIf="isSubmitting" name="loader" [size]="15" class="spin"></app-icon>
            <span>{{ isSubmitting ? 'Saving...' : 'Save' }}</span>
          </button>

          <button type="button" class="btn-action btn-save-print" (click)="saveAndPrint()" [disabled]="isSubmitting">
            <app-icon name="printer" [size]="15"></app-icon>
            <span>Save & Print</span>
          </button>

          <button type="button" class="btn-action btn-reset" (click)="resetForm()">
            <app-icon name="rotate-ccw" [size]="15"></app-icon>
            <span>Reset</span>
          </button>
        </div>
      </div>

      <!-- 2. STEPPER NAVIGATION (HORIZONTAL PILLS) -->
      <div class="stepper-nav-bar" *ngIf="admissionMode === 'single'">
        <!-- Step 1: Student Information -->
        <button 
          type="button" 
          class="step-pill-btn" 
          [class.active]="step === 1" 
          (click)="goToStep(1)">
          <span class="step-num-badge">1</span>
          <span class="step-label">Student Information</span>
        </button>

        <span class="step-chevron">
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none"><path d="M1 9L5 5L1 1" stroke="#CBD5E1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>

        <!-- Step 2: Parent / Guardian -->
        <button 
          type="button" 
          class="step-pill-btn" 
          [class.active]="step === 2" 
          (click)="goToStep(2)">
          <span class="step-num-badge">2</span>
          <span class="step-label">Parent / Guardian</span>
        </button>

        <span class="step-chevron">
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none"><path d="M1 9L5 5L1 1" stroke="#CBD5E1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>

        <!-- Step 3: Academic Details -->
        <button 
          type="button" 
          class="step-pill-btn" 
          [class.active]="step === 3" 
          (click)="goToStep(3)">
          <span class="step-num-badge">3</span>
          <span class="step-label">Academic Details</span>
        </button>

        <span class="step-chevron">
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none"><path d="M1 9L5 5L1 1" stroke="#CBD5E1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>

        <!-- Step 4: Documents -->
        <button 
          type="button" 
          class="step-pill-btn" 
          [class.active]="step === 4" 
          (click)="goToStep(4)">
          <span class="step-num-badge">4</span>
          <span class="step-label">Documents</span>
        </button>

        <span class="step-chevron">
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none"><path d="M1 9L5 5L1 1" stroke="#CBD5E1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>

        <!-- Step 5: Summary -->
        <button 
          type="button" 
          class="step-pill-btn" 
          [class.active]="step === 5" 
          (click)="goToStep(5)">
          <span class="step-num-badge">5</span>
          <span class="step-label">Summary</span>
        </button>
      </div>

      <!-- 3. BULK EXCEL MODE (IF TOGGLED) -->
      <div *ngIf="admissionMode === 'bulk'" class="bulk-excel-container animate-fade-in mb-4">
        <div class="bulk-header-strip">
          <div class="d-flex align-center gap-3">
            <div class="bulk-icon-box">
              <app-icon name="file-spreadsheet" [size]="24" class="text-emerald"></app-icon>
            </div>
            <div>
              <h3 class="bulk-title">Bulk Student Admission via Excel (.xlsx)</h3>
              <p class="bulk-subtitle">Upload cohorts of student applicants directly into the assigned class and section.</p>
            </div>
          </div>
          <button type="button" class="btn btn-outline-primary" (click)="downloadExcelTemplate()">
            <app-icon name="download" [size]="15"></app-icon>
            <span>Download .xlsx Template</span>
          </button>
        </div>

        <div class="bulk-grid-cards">
          <!-- Step 1: Select Placement -->
          <div class="bulk-step-card">
            <div class="bulk-step-tag">Step 1</div>
            <h4 class="bulk-step-title">Select Target Class & Section</h4>
            <div class="form-group mb-3">
              <label class="form-label-custom">Target Class *</label>
              <select class="form-select-custom" [(ngModel)]="bulkClassId" (change)="onBulkClassChange()">
                <option *ngFor="let c of classes" [value]="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div class="form-group mb-0">
              <label class="form-label-custom">Target Section *</label>
              <select class="form-select-custom" [(ngModel)]="bulkSectionId">
                <option *ngFor="let s of bulkAvailableSections" [value]="s.id">{{ s.name }} (Capacity: {{ s.currentStudentCount }}/{{ s.capacity }})</option>
              </select>
            </div>
          </div>

          <!-- Step 2: Upload Excel -->
          <div class="bulk-step-card">
            <div class="bulk-step-tag">Step 2</div>
            <h4 class="bulk-step-title">Upload Excel File</h4>
            <p class="text-muted text-xs mb-3">Select the filled .xlsx template containing applicant details.</p>
            <input type="file" #fileInput (change)="onBulkFileSelected($event)" accept=".xlsx, .xls" style="display: none;" />
            <button type="button" class="btn btn-browse-excel w-100" (click)="fileInput.click()">
              <app-icon name="upload" [size]="16"></app-icon>
              <span>{{ selectedBulkFile ? selectedBulkFile.name : 'Browse Spreadsheet (.xlsx)' }}</span>
            </button>
            <div *ngIf="selectedBulkFile" class="selected-file-pill mt-2">
              <span class="file-name">{{ selectedBulkFile.name }} ({{ (selectedBulkFile.size / 1024).toFixed(1) }} KB)</span>
              <button type="button" class="btn-clear-file" (click)="selectedBulkFile = null; bulkImportResult = null">✕</button>
            </div>
          </div>

          <!-- Step 3: Ingest Data -->
          <div class="bulk-step-card">
            <div class="bulk-step-tag">Step 3</div>
            <h4 class="bulk-step-title">Process & Commit</h4>
            <p class="text-muted text-xs mb-3">Validate records and commit new students into database registry.</p>
            <button 
              type="button" 
              class="btn btn-commit-bulk w-100" 
              [disabled]="!selectedBulkFile || isImporting" 
              (click)="submitBulkAdmission()">
              <app-icon *ngIf="!isImporting" name="check-circle" [size]="16"></app-icon>
              <app-icon *ngIf="isImporting" name="loader" [size]="16" class="spin"></app-icon>
              <span>{{ isImporting ? 'Ingesting...' : 'Import Students' }}</span>
            </button>
          </div>
        </div>

        <!-- Import stats summary -->
        <div *ngIf="bulkImportResult" class="import-summary-banner mt-3" [class.has-errors]="bulkImportResult.errors?.length">
          <div class="summary-text">
            <strong>Batch Result:</strong> Total {{ bulkImportResult.totalRows }} rows | Enrolled: <span class="text-emerald font-bold">{{ bulkImportResult.importedCount }}</span> | Skipped: <span class="text-danger">{{ bulkImportResult.skippedCount }}</span>
          </div>
          <div *ngIf="bulkImportResult.errors?.length" class="error-list mt-2">
            <div *ngFor="let err of bulkImportResult.errors.slice(0, 4)" class="text-danger text-xs">• {{ err }}</div>
          </div>
        </div>
      </div>

      <!-- 4. SIGNATURE TWO-COLUMN WORKSPACE (SINGLE MODE) -->
      <div *ngIf="admissionMode === 'single'" class="admission-workspace-grid">
        
        <!-- ==================== LEFT COLUMN ==================== -->
        <div class="left-profile-column">
          <div class="left-profile-card">
            
            <!-- Photo Frame with Floating Camera Button -->
            <div class="photo-box-wrapper">
              <img 
                *ngIf="photoPreviewUrl || formData.photoUrl" 
                campusImage 
                [src]="photoPreviewUrl || formData.photoUrl" 
                alt="Student Photo" 
                class="student-photo-img" />
              
              <div *ngIf="!photoPreviewUrl && !formData.photoUrl" class="photo-placeholder-wrap">
                <!-- Clean friendly student avatar illustration -->
                <div class="default-avatar-graphic">
                  <app-icon name="user" [size]="64" class="text-sky-300"></app-icon>
                </div>
              </div>

              <!-- Uploading Spinner Overlay -->
              <div *ngIf="isUploadingPhoto" class="photo-upload-spinner">
                <app-icon name="loader" [size]="24" class="spin text-white"></app-icon>
              </div>

              <!-- Hidden File Input -->
              <input 
                type="file" 
                #photoInput 
                accept="image/png,image/jpeg,image/webp" 
                style="display: none;" 
                (change)="onPhotoSelected($event)" />

              <!-- Floating Camera Button -->
              <button 
                type="button" 
                class="floating-camera-btn" 
                (click)="photoInput.click()" 
                [disabled]="isUploadingPhoto" 
                title="Upload Student Photo">
                <app-icon name="camera" [size]="18"></app-icon>
              </button>

              <!-- Floating Remove Photo Button -->
              <button 
                *ngIf="photoPreviewUrl || formData.photoUrl"
                type="button" 
                class="floating-remove-photo-btn" 
                (click)="clearPhoto(photoInput)" 
                [disabled]="isUploadingPhoto" 
                title="Remove Student Photo">
                <app-icon name="trash" [size]="14"></app-icon>
              </button>
            </div>

            <!-- Meta Information Stack -->
            <div class="meta-info-stack">
              <!-- Admission No. -->
              <div class="meta-row admission-no-row">
                <span class="meta-label">Admission No.</span>
                <span class="meta-auto-badge">(Auto)</span>
              </div>

              <div class="meta-divider"></div>

              <!-- Session * -->
              <div class="meta-form-row">
                <div class="meta-form-header">
                  <div class="meta-icon-box">
                    <app-icon name="calendar" [size]="16" class="text-blue-600"></app-icon>
                  </div>
                  <label class="meta-form-label">Academic Session <span class="req-star">*</span></label>
                </div>
                <div class="select-wrapper">
                  <select class="left-column-select" [(ngModel)]="formData.academicYearId" (change)="onSessionChange()">
                    <option value="" disabled>Select Session</option>
                    <option *ngFor="let s of academicSessions" [value]="s.id">{{ s.name }} {{ s.isCurrent ? '(Current)' : '' }}</option>
                  </select>
                  <span class="select-chevron">▾</span>
                </div>
              </div>

              <!-- Admission Date -->
              <div class="meta-item-row">
                <div class="meta-item-left">
                  <div class="meta-icon-box">
                    <app-icon name="calendar-check" [size]="16" class="text-blue-600"></app-icon>
                  </div>
                  <span class="meta-item-title">Admission Date</span>
                </div>
                <span class="meta-item-val font-semibold">{{ todayFormatted }}</span>
              </div>

              <!-- Class * -->
              <div class="meta-form-row">
                <div class="meta-form-header">
                  <div class="meta-icon-box">
                    <app-icon name="clock" [size]="16" class="text-blue-600"></app-icon>
                  </div>
                  <label class="meta-form-label">Class <span class="req-star">*</span></label>
                </div>
                <div class="select-wrapper">
                  <select class="left-column-select" [(ngModel)]="formData.classId" (change)="onClassSelect()">
                    <option value="" disabled>Select Class</option>
                    <option *ngFor="let c of classes" [value]="c.id">{{ c.name }}</option>
                  </select>
                  <span class="select-chevron">▾</span>
                </div>
              </div>

              <!-- Section * -->
              <div class="meta-form-row">
                <div class="meta-form-header">
                  <div class="meta-icon-box">
                    <app-icon name="edit" [size]="16" class="text-blue-600"></app-icon>
                  </div>
                  <label class="meta-form-label">Section <span class="req-star">*</span></label>
                </div>
                <div class="select-wrapper">
                  <select class="left-column-select" [(ngModel)]="formData.sectionId">
                    <option value="" disabled>Select Section</option>
                    <option *ngFor="let s of availableSections" [value]="s.id">{{ s.name }}</option>
                  </select>
                  <span class="select-chevron">▾</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- ==================== RIGHT COLUMN ==================== -->
        <div class="right-content-column">
          <div class="right-content-card">

            <!-- ================= STEP 1: STUDENT INFORMATION ================= -->
            <div *ngIf="step === 1" class="step-pane animate-fade-in">
              
              <!-- SECTION A: Student Information -->
              <div class="form-box-section mb-4">
                <div class="section-title-strip">
                  <app-icon name="user" [size]="18" class="text-blue-600"></app-icon>
                  <h3 class="section-title-text">Student Information</h3>
                </div>

                <!-- Row 1: Student Name, Date of Birth, Gender -->
                <div class="form-row-3">
                  <div class="form-group-field">
                    <label class="field-label">Student Name <span class="req-star">*</span></label>
                    <input 
                      type="text" 
                      class="field-input" 
                      [(ngModel)]="formData.fullName" 
                      placeholder="Enter full name" 
                      required />
                  </div>

                  <div class="form-group-field">
                    <label class="field-label">Date of Birth <span class="req-star">*</span></label>
                    <div class="input-icon-wrap">
                      <input 
                        type="date" 
                        class="field-input pr-icon" 
                        [(ngModel)]="formData.dateOfBirth" 
                        required />
                    </div>
                  </div>

                  <div class="form-group-field">
                    <label class="field-label">Gender <span class="req-star">*</span></label>
                    <div class="select-wrapper">
                      <select class="field-select" [(ngModel)]="formData.gender">
                        <option *ngFor="let g of genderOptions" [value]="g.id">{{ g.label }}</option>
                      </select>
                      <span class="select-chevron">▾</span>
                    </div>
                  </div>
                </div>

                <!-- Row 2: Blood Group, Nationality, Religion -->
                <div class="form-row-3">
                  <div class="form-group-field">
                    <label class="field-label">Blood Group</label>
                    <div class="select-wrapper">
                      <select class="field-select" [(ngModel)]="formData.bloodGroup">
                        <option value="">Select Blood Group</option>
                        <option *ngFor="let b of bloodGroupOptions" [value]="b.id">{{ b.label }}</option>
                      </select>
                      <span class="select-chevron">▾</span>
                    </div>
                  </div>

                  <div class="form-group-field">
                    <label class="field-label">Nationality</label>
                    <div class="select-wrapper">
                      <select class="field-select" [(ngModel)]="studentNationality">
                        <option *ngFor="let n of nationalityOptions" [value]="n.id">{{ n.label }}</option>
                      </select>
                      <span class="select-chevron">▾</span>
                    </div>
                  </div>

                  <div class="form-group-field">
                    <label class="field-label">Religion</label>
                    <div class="select-wrapper">
                      <select class="field-select" [(ngModel)]="formData.religion">
                        <option value="">Select Religion</option>
                        <option *ngFor="let r of religionOptions" [value]="r.id">{{ r.label }}</option>
                      </select>
                      <span class="select-chevron">▾</span>
                    </div>
                  </div>
                </div>

                <!-- Row 3: Mobile (Student), Email, Previous School -->
                <div class="form-row-3">
                  <div class="form-group-field">
                    <label class="field-label">Mobile (Student)</label>
                    <input 
                      type="tel" 
                      class="field-input" 
                      [(ngModel)]="formData.phone" 
                      placeholder="01XXXXXXXXX" />
                  </div>

                  <div class="form-group-field">
                    <label class="field-label">Email</label>
                    <input 
                      type="email" 
                      class="field-input" 
                      [(ngModel)]="formData.email" 
                      placeholder="student@email.com" />
                  </div>

                  <div class="form-group-field">
                    <label class="field-label">Previous School</label>
                    <input 
                      type="text" 
                      class="field-input" 
                      [(ngModel)]="studentPreviousSchool" 
                      placeholder="Enter school name" />
                  </div>
                </div>

                <!-- Optional Bangla Name Row -->
                <div class="form-row-1 mt-3">
                  <div class="form-group-field">
                    <label class="field-label">Bangla Name (বাংলা নাম - ঐচ্ছিক)</label>
                    <input 
                      type="text" 
                      class="field-input" 
                      [(ngModel)]="formData.banglaName" 
                      placeholder="যেমনঃ তৌসিফ নূর" />
                  </div>
                </div>
              </div>

              <!-- SECTION B: Present Address (Mint/Teal Banner) -->
              <div class="address-banner-section mb-4">
                <div class="teal-header-strip">
                  <app-icon name="map-pin" [size]="16" class="text-teal-600"></app-icon>
                  <span class="banner-title">Present Address</span>
                </div>

                <div class="address-fields-grid">
                  <div class="form-group-field col-address">
                    <label class="field-label">Address <span class="req-star">*</span></label>
                    <input 
                      type="text" 
                      class="field-input" 
                      [(ngModel)]="formData.presentAddress" 
                      placeholder="Enter present address" 
                      required />
                  </div>

                  <div class="form-group-field col-geo">
                    <label class="field-label">Division</label>
                    <div class="select-wrapper">
                      <select class="field-select" [(ngModel)]="studentDivision" (change)="onDivisionChange()">
                        <option value="">Select Division</option>
                        <option *ngFor="let div of divisions" [value]="div.name">{{ div.name }}</option>
                      </select>
                      <span class="select-chevron">▾</span>
                    </div>
                  </div>

                  <div class="form-group-field col-geo">
                    <label class="field-label">District</label>
                    <div class="select-wrapper">
                      <select class="field-select" [(ngModel)]="studentDistrict" (change)="onDistrictChange()">
                        <option value="">Select District</option>
                        <option *ngFor="let dist of availableDistricts" [value]="dist.name">{{ dist.name }}</option>
                      </select>
                      <span class="select-chevron">▾</span>
                    </div>
                  </div>

                  <div class="form-group-field col-geo">
                    <label class="field-label">Upazila / Thana</label>
                    <div class="select-wrapper">
                      <select class="field-select" [(ngModel)]="studentUpazila">
                        <option value="">Select Upazila</option>
                        <option *ngFor="let upz of availableUpazilas" [value]="upz">{{ upz }}</option>
                      </select>
                      <span class="select-chevron">▾</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- SECTION C: Quick Info (Blue Banner) -->
              <div class="quickinfo-banner-section">
                <div class="blue-header-strip">
                  <app-icon name="info" [size]="16" class="text-blue-600"></app-icon>
                  <span class="banner-title">Quick Info</span>
                </div>

                <div class="quickinfo-controls-row">
                  <label class="custom-checkbox-wrap">
                    <input type="checkbox" [(ngModel)]="isHostel" />
                    <span class="checkbox-box"></span>
                    <span class="checkbox-label">Hostel</span>
                  </label>

                  <label class="custom-checkbox-wrap">
                    <input type="checkbox" [(ngModel)]="isTransport" />
                    <span class="checkbox-box"></span>
                    <span class="checkbox-label">Transport</span>
                  </label>

                  <div class="status-toggle-wrap">
                    <span class="status-label">Status <span class="req-star">*</span></span>
                    <label class="switch-toggle">
                      <input type="checkbox" [(ngModel)]="isActiveStatus" />
                      <span class="toggle-slider"></span>
                    </label>
                    <span class="status-text font-semibold text-emerald">Active</span>
                  </div>
                </div>
              </div>

              <!-- STEP 1 BOTTOM ACTION BAR -->
              <div class="pane-bottom-actions mt-4">
                <div></div>
                <button type="button" class="btn btn-next-step" (click)="nextStep()">
                  <span>Next: Parent / Guardian</span>
                  <app-icon name="arrow-right" [size]="16"></app-icon>
                </button>
              </div>
            </div>

            <!-- ================= STEP 2: PARENT / GUARDIAN ================= -->
            <div *ngIf="step === 2" class="step-pane animate-fade-in">
              <div class="section-title-strip mb-3">
                <app-icon name="users" [size]="18" class="text-blue-600"></app-icon>
                <h3 class="section-title-text">Parent & Guardian Details</h3>
              </div>

              <!-- Father's Info -->
              <div class="guardian-subcard mb-3">
                <div class="subcard-header blue-tint">
                  <span>Father's Information (পিতার তথ্য)</span>
                </div>
                <div class="form-row-3 p-3">
                  <div class="form-group-field">
                    <label class="field-label">Father's Name</label>
                    <input type="text" class="field-input" [(ngModel)]="fatherName" placeholder="Enter father's name" />
                  </div>
                  <div class="form-group-field">
                    <label class="field-label">Father's Phone</label>
                    <input type="tel" class="field-input" [(ngModel)]="fatherPhone" placeholder="01XXXXXXXXX" />
                  </div>
                  <div class="form-group-field">
                    <label class="field-label">Father's Occupation</label>
                    <input type="text" class="field-input" [(ngModel)]="fatherOccupation" placeholder="e.g. Businessman, Engineer" />
                  </div>
                </div>
              </div>

              <!-- Mother's Info -->
              <div class="guardian-subcard mb-3">
                <div class="subcard-header purple-tint">
                  <span>Mother's Information (মাতার তথ্য)</span>
                </div>
                <div class="form-row-3 p-3">
                  <div class="form-group-field">
                    <label class="field-label">Mother's Name</label>
                    <input type="text" class="field-input" [(ngModel)]="motherName" placeholder="Enter mother's name" />
                  </div>
                  <div class="form-group-field">
                    <label class="field-label">Mother's Phone</label>
                    <input type="tel" class="field-input" [(ngModel)]="motherPhone" placeholder="01XXXXXXXXX" />
                  </div>
                  <div class="form-group-field">
                    <label class="field-label">Mother's Occupation</label>
                    <input type="text" class="field-input" [(ngModel)]="motherOccupation" placeholder="e.g. Homemaker, Teacher" />
                  </div>
                </div>
              </div>

              <!-- Legal / Primary Guardian -->
              <div class="guardian-subcard mb-3">
                <div class="subcard-header teal-tint">
                  <span>Primary Legal Guardian * (প্রধান অভিভাবক)</span>
                </div>
                <div class="form-row-3 p-3">
                  <div class="form-group-field">
                    <label class="field-label">Guardian Name <span class="req-star">*</span></label>
                    <input type="text" class="field-input" [(ngModel)]="formData.guardianName" placeholder="Full name of guardian" required />
                  </div>
                  <div class="form-group-field">
                    <label class="field-label">Relationship <span class="req-star">*</span></label>
                    <div class="select-wrapper">
                      <select class="field-select" [(ngModel)]="formData.guardianRelation">
                        <option *ngFor="let rel of guardianRelationOptions" [value]="rel.id">{{ rel.label }}</option>
                      </select>
                      <span class="select-chevron">▾</span>
                    </div>
                  </div>
                  <div class="form-group-field">
                    <label class="field-label">Guardian Phone <span class="req-star">*</span></label>
                    <input type="tel" class="field-input" [(ngModel)]="formData.guardianPhone" placeholder="01XXXXXXXXX" required />
                  </div>
                </div>
                <div class="form-row-2 px-3 pb-3">
                  <div class="form-group-field">
                    <label class="field-label">Guardian Occupation</label>
                    <input type="text" class="field-input" [(ngModel)]="formData.guardianOccupation" placeholder="e.g. Govt. Officer" />
                  </div>
                  <div class="form-group-field">
                    <label class="field-label">Annual Family Income</label>
                    <input type="text" class="field-input" [(ngModel)]="formData.guardianIncome" placeholder="e.g. ৳ 500,000" />
                  </div>
                </div>
              </div>

              <!-- Permanent Address -->
              <div class="guardian-subcard">
                <div class="subcard-header amber-tint d-flex justify-between align-center">
                  <span>Permanent Address (স্থায়ী ঠিকানা)</span>
                  <label class="d-flex align-center gap-2 cursor-pointer text-xs font-normal">
                    <input type="checkbox" (change)="syncPermanentAddress($event)" />
                    <span>Same as Present Address</span>
                  </label>
                </div>
                <div class="p-3">
                  <input type="text" class="field-input" [(ngModel)]="formData.permanentAddress" placeholder="Village / Area, Post, Police Station, District" />
                </div>
              </div>

              <!-- STEP 2 BOTTOM ACTION BAR -->
              <div class="pane-bottom-actions mt-4">
                <button type="button" class="btn btn-prev-step" (click)="prevStep()">
                  <app-icon name="arrow-left" [size]="16"></app-icon>
                  <span>Back: Student Information</span>
                </button>
                <button type="button" class="btn btn-next-step" (click)="nextStep()">
                  <span>Next: Academic Details</span>
                  <app-icon name="arrow-right" [size]="16"></app-icon>
                </button>
              </div>
            </div>

            <!-- ================= STEP 3: ACADEMIC DETAILS ================= -->
            <div *ngIf="step === 3" class="step-pane animate-fade-in">
              <div class="section-title-strip mb-3">
                <app-icon name="book-open" [size]="18" class="text-blue-600"></app-icon>
                <h3 class="section-title-text">Academic Details & Enrollment Parameters</h3>
              </div>

              <!-- Placement Details -->
              <div class="guardian-subcard mb-3">
                <div class="subcard-header blue-tint">
                  <span>Campus Placement & Identification</span>
                </div>
                <div class="form-row-3 p-3">
                  <div class="form-group-field">
                    <label class="field-label">Assigned Roll Number</label>
                    <input type="text" class="field-input" [(ngModel)]="formData.rollNo" placeholder="e.g. 05 or Auto" />
                  </div>
                  <div class="form-group-field">
                    <label class="field-label">Admission Category</label>
                    <div class="select-wrapper">
                      <select class="field-select" [(ngModel)]="admissionCategory">
                        <option *ngFor="let cat of admissionCategoryOptions" [value]="cat.id">{{ cat.label }}</option>
                      </select>
                      <span class="select-chevron">▾</span>
                    </div>
                  </div>
                  <div class="form-group-field">
                    <label class="field-label">Academic Shift</label>
                    <div class="select-wrapper">
                      <select class="field-select" [(ngModel)]="academicShift">
                        <option *ngFor="let sh of academicShiftOptions" [value]="sh.id">{{ sh.label }}</option>
                      </select>
                      <span class="select-chevron">▾</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Prior Academics -->
              <div class="guardian-subcard mb-3">
                <div class="subcard-header teal-tint">
                  <span>Prior Education & Credentials</span>
                </div>
                <div class="form-row-3 p-3">
                  <div class="form-group-field">
                    <label class="field-label">Last Class Passed</label>
                    <input type="text" class="field-input" [(ngModel)]="lastClassPassed" placeholder="e.g. Class 4" />
                  </div>
                  <div class="form-group-field">
                    <label class="field-label">Passing Year</label>
                    <input type="text" class="field-input" [(ngModel)]="lastPassingYear" placeholder="e.g. 2025" />
                  </div>
                  <div class="form-group-field">
                    <label class="field-label">GPA / Marks Obtained</label>
                    <input type="text" class="field-input" [(ngModel)]="lastGpaMarks" placeholder="e.g. 5.00 / 85%" />
                  </div>
                </div>
                <div class="form-row-1 px-3 pb-3">
                  <div class="form-group-field">
                    <label class="field-label">Transfer Certificate (TC) Number</label>
                    <input type="text" class="field-input" [(ngModel)]="tcNumber" placeholder="TC identification or reference code" />
                  </div>
                </div>
              </div>

              <!-- Preferences / Health -->
              <div class="guardian-subcard">
                <div class="subcard-header purple-tint">
                  <span>Co-Curricular Interests & Health Notes</span>
                </div>
                <div class="form-row-2 p-3">
                  <div class="form-group-field">
                    <label class="field-label">Extracurricular Activities</label>
                    <input type="text" class="field-input" [(ngModel)]="coCurricular" placeholder="e.g. Debating, Cricket, Art, Scouting" />
                  </div>
                  <div class="form-group-field">
                    <label class="field-label">Medical / Health Notes</label>
                    <input type="text" class="field-input" [(ngModel)]="medicalNotes" placeholder="e.g. None or Allergies / Asthma" />
                  </div>
                </div>
              </div>

              <!-- STEP 3 BOTTOM ACTION BAR -->
              <div class="pane-bottom-actions mt-4">
                <button type="button" class="btn btn-prev-step" (click)="prevStep()">
                  <app-icon name="arrow-left" [size]="16"></app-icon>
                  <span>Back: Parent / Guardian</span>
                </button>
                <button type="button" class="btn btn-next-step" (click)="nextStep()">
                  <span>Next: Documents</span>
                  <app-icon name="arrow-right" [size]="16"></app-icon>
                </button>
              </div>
            </div>

            <!-- ================= STEP 4: DOCUMENTS ================= -->
            <div *ngIf="step === 4" class="step-pane animate-fade-in">
              <div class="section-title-strip mb-3">
                <app-icon name="file-text" [size]="18" class="text-blue-600"></app-icon>
                <h3 class="section-title-text">Verification Documents & Certificates</h3>
              </div>

              <div class="documents-grid">
                <!-- Doc 1: Birth Certificate -->
                <div class="doc-upload-card">
                  <div class="doc-icon-wrap blue-bg">
                    <app-icon name="award" [size]="22" class="text-blue-600"></app-icon>
                  </div>
                  <div class="doc-info">
                    <h4 class="doc-title">Birth Certificate (জন্ম নিবন্ধন) <span class="req-star">*</span></h4>
                    <p class="doc-desc">Digital Birth Registration Certificate (BRC) copy.</p>
                    <span class="doc-status text-emerald font-semibold">Ready to upload (PDF/JPG)</span>
                  </div>
                  <button type="button" class="btn-doc-browse">Choose File</button>
                </div>

                <!-- Doc 2: Transfer Certificate -->
                <div class="doc-upload-card">
                  <div class="doc-icon-wrap teal-bg">
                    <app-icon name="arrow-right-circle" [size]="22" class="text-teal-600"></app-icon>
                  </div>
                  <div class="doc-info">
                    <h4 class="doc-title">Transfer Certificate (TC)</h4>
                    <p class="doc-desc">Official TC issued by previous school authority.</p>
                    <span class="doc-status text-muted">Optional for Class 1</span>
                  </div>
                  <button type="button" class="btn-doc-browse">Choose File</button>
                </div>

                <!-- Doc 3: Previous Marksheet -->
                <div class="doc-upload-card">
                  <div class="doc-icon-wrap purple-bg">
                    <app-icon name="clipboard-check" [size]="22" class="text-indigo-600"></app-icon>
                  </div>
                  <div class="doc-info">
                    <h4 class="doc-title">Academic Transcript / Marksheet</h4>
                    <p class="doc-desc">Previous year official grade report or certificate.</p>
                    <span class="doc-status text-muted">Optional</span>
                  </div>
                  <button type="button" class="btn-doc-browse">Choose File</button>
                </div>

                <!-- Doc 4: Guardian NID -->
                <div class="doc-upload-card">
                  <div class="doc-icon-wrap amber-bg">
                    <app-icon name="shield" [size]="22" class="text-amber-600"></app-icon>
                  </div>
                  <div class="doc-info">
                    <h4 class="doc-title">Guardian National ID (এনআইডি)</h4>
                    <p class="doc-desc">Photocopy of Parent/Guardian National Identity Card.</p>
                    <span class="doc-status text-muted">Verification purpose</span>
                  </div>
                  <button type="button" class="btn-doc-browse">Choose File</button>
                </div>
              </div>

              <!-- STEP 4 BOTTOM ACTION BAR -->
              <div class="pane-bottom-actions mt-4">
                <button type="button" class="btn btn-prev-step" (click)="prevStep()">
                  <app-icon name="arrow-left" [size]="16"></app-icon>
                  <span>Back: Academic Details</span>
                </button>
                <button type="button" class="btn btn-next-step" (click)="nextStep()">
                  <span>Next: Summary & Dossier</span>
                  <app-icon name="arrow-right" [size]="16"></app-icon>
                </button>
              </div>
            </div>

            <!-- ================= STEP 5: SUMMARY & VERIFICATION ================= -->
            <div *ngIf="step === 5" class="step-pane animate-fade-in" id="admission-dossier-print">
              <div class="section-title-strip mb-3">
                <app-icon name="check-circle" [size]="18" class="text-emerald"></app-icon>
                <h3 class="section-title-text">Admission Dossier & Verification Summary</h3>
              </div>

              <!-- Official Student Dossier Card -->
              <div class="dossier-card mb-4">
                <div class="dossier-header">
                  <div class="dossier-student-block">
                    <img 
                      *ngIf="photoPreviewUrl || formData.photoUrl" 
                      campusImage 
                      [src]="photoPreviewUrl || formData.photoUrl" 
                      alt="Student" 
                      class="dossier-thumb" />
                    <div *ngIf="!photoPreviewUrl && !formData.photoUrl" class="dossier-thumb-empty">
                      <app-icon name="user" [size]="32" class="text-slate-400"></app-icon>
                    </div>

                    <div class="dossier-names">
                      <h2 class="dossier-fullname">{{ formData.fullName || 'Untitled Applicant' }}</h2>
                      <p class="dossier-subname text-muted">{{ formData.banglaName ? formData.banglaName + ' • ' : '' }}{{ formData.gender }} • Blood: {{ formData.bloodGroup || 'N/A' }}</p>
                      <span class="dossier-campus-badge">{{ activeBranch?.name || 'Selected Campus' }} • Session {{ activeSessionName }}</span>
                    </div>
                  </div>

                  <div class="dossier-status-block">
                    <span class="dossier-badge-green">Admission Ready</span>
                    <span class="dossier-date-text">Enrolled: {{ todayFormatted }}</span>
                  </div>
                </div>

                <div class="dossier-table-grid">
                  <div class="dossier-cell">
                    <span class="cell-k">Class & Section:</span>
                    <strong class="cell-v">{{ getSelectedClassName() }} — {{ getSelectedSectionName() }}</strong>
                  </div>
                  <div class="dossier-cell">
                    <span class="cell-k">Roll Number:</span>
                    <strong class="cell-v">Roll #{{ formData.rollNo || '01' }}</strong>
                  </div>
                  <div class="dossier-cell">
                    <span class="cell-k">Primary Guardian:</span>
                    <strong class="cell-v">{{ formData.guardianName || 'N/A' }} ({{ formData.guardianRelation }})</strong>
                  </div>
                  <div class="dossier-cell">
                    <span class="cell-k">Guardian Phone:</span>
                    <strong class="cell-v">{{ formData.guardianPhone || 'N/A' }}</strong>
                  </div>
                  <div class="dossier-cell">
                    <span class="cell-k">Present Address:</span>
                    <strong class="cell-v">{{ formData.presentAddress || 'N/A' }}</strong>
                  </div>
                  <div class="dossier-cell">
                    <span class="cell-k">Hostel & Transport:</span>
                    <strong class="cell-v">Hostel: {{ isHostel ? 'Yes' : 'No' }} | Transport: {{ isTransport ? 'Yes' : 'No' }}</strong>
                  </div>
                </div>
              </div>

              <!-- Final Commit Buttons -->
              <div class="pane-bottom-actions d-flex justify-between align-center mt-4">
                <button type="button" class="btn btn-prev-step" (click)="prevStep()">
                  <app-icon name="arrow-left" [size]="16"></app-icon>
                  <span>Back: Documents</span>
                </button>

                <div class="d-flex gap-2">
                  <button type="button" class="btn btn-save-print" (click)="saveAndPrint()" [disabled]="isSubmitting">
                    <app-icon name="printer" [size]="16"></app-icon>
                    <span>Save & Print Form</span>
                  </button>
                  <button type="button" class="btn btn-commit-final" (click)="saveStudent()" [disabled]="isSubmitting">
                    <app-icon *ngIf="!isSubmitting" name="check-circle" [size]="18"></app-icon>
                    <app-icon *ngIf="isSubmitting" name="loader" [size]="18" class="spin"></app-icon>
                    <span>{{ isSubmitting ? 'Registering Student...' : 'Complete Admission & Generate ID' }}</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  `,
  styles: [`
    .admission-portal-container {
      padding: 0 0 40px 0;
      color: #0f172a;
      max-width: 1400px;
      margin: 0 auto;
    }

    .d-flex { display: flex; }
    .align-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .gap-2 { gap: 8px; }
    .gap-3 { gap: 12px; }
    .w-100 { width: 100%; }
    .mb-0 { margin-bottom: 0 !important; }
    .mb-2 { margin-bottom: 8px !important; }
    .mb-3 { margin-bottom: 14px !important; }
    .mb-4 { margin-bottom: 20px !important; }
    .mt-2 { margin-top: 8px !important; }
    .mt-3 { margin-top: 14px !important; }
    .mt-4 { margin-top: 22px !important; }
    .p-3 { padding: 14px !important; }
    .px-3 { padding-left: 14px !important; padding-right: 14px !important; }
    .pb-3 { padding-bottom: 14px !important; }

    .text-muted { color: #64748b; }
    .text-emerald { color: #059669; }
    .text-blue-600 { color: #2563eb; }
    .text-teal-600 { color: #0d9488; }
    .text-sky-300 { color: #7dd3fc; }
    .text-danger { color: #ef4444; }
    .font-semibold { font-weight: 600; }
    .font-bold { font-weight: 700; }
    .text-xs { font-size: 0.75rem; }
    .req-star { color: #ef4444; font-weight: 700; margin-left: 2px; }

    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .animate-fade-in { animation: fadeIn 0.2s ease-in-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

    /* 1. TOP EXECUTIVE HEADER CARD */
    .admission-header-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 16px 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
      margin-bottom: 18px;
      flex-wrap: wrap;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .header-icon-badge {
      width: 46px;
      height: 46px;
      border-radius: 12px;
      background: #eff6ff;
      border: 1.5px solid #dbeafe;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .header-main-title {
      font-size: 1.4rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.02em;
      line-height: 1.2;
    }
    .header-sub-title {
      font-size: 0.8125rem;
      color: #64748b;
      margin: 2px 0 0 0;
      font-weight: 500;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .btn-action {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 0.825rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
      border: 1px solid transparent;
      outline: none;
    }
    .btn-new {
      background: #2563eb;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
    }
    .btn-new:hover { background: #1d4ed8; }
    .btn-save {
      background: #4f46e5;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(79, 70, 229, 0.25);
    }
    .btn-save:hover { background: #4338ca; }
    .btn-save-print {
      background: #059669;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25);
    }
    .btn-save-print:hover { background: #047857; }
    .btn-reset {
      background: #ffffff;
      color: #334155;
      border: 1.5px solid #cbd5e1;
    }
    .btn-reset:hover { background: #f8fafc; border-color: #94a3b8; }
    .btn-bulk-toggle {
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #e2e8f0;
    }
    .btn-bulk-toggle:hover { background: #e2e8f0; }

    /* 2. STEPPER NAVIGATION (HORIZONTAL PILLS) */
    .stepper-nav-bar {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 6px 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 22px;
      overflow-x: auto;
    }
    .step-pill-btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 8px 18px;
      border-radius: 10px;
      background: #f1f5f9;
      color: #475569;
      border: none;
      font-size: 0.84rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
      white-space: nowrap;
    }
    .step-pill-btn:hover {
      background: #e2e8f0;
      color: #1e293b;
    }
    .step-pill-btn.active {
      background: #2563eb;
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.28);
    }
    .step-num-badge {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #e2e8f0;
      color: #64748b;
      font-size: 0.72rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .step-pill-btn.active .step-num-badge {
      background: #ffffff;
      color: #2563eb;
      font-weight: 800;
    }
    .step-chevron {
      display: flex;
      align-items: center;
      padding: 0 2px;
    }

    /* 3. SIGNATURE TWO-COLUMN WORKSPACE */
    .admission-workspace-grid {
      display: grid;
      grid-template-columns: 290px 1fr;
      gap: 22px;
      align-items: start;
    }
    @media (max-width: 991px) {
      .admission-workspace-grid {
        grid-template-columns: 1fr;
      }
    }

    /* LEFT COLUMN: Profile & Placement */
    .left-profile-column {
      display: flex;
      flex-direction: column;
    }
    .left-profile-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 16px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
    }
    .photo-box-wrapper {
      background: linear-gradient(180deg, #ecfdf5 0%, #f0fdfa 40%, #eff6ff 100%);
      border: 1.5px solid #ccfbf1;
      border-radius: 16px;
      height: 220px;
      width: 100%;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    .student-photo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .photo-placeholder-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      width: 100%;
    }
    .default-avatar-graphic {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: #e0f2fe;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .photo-upload-spinner {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .floating-camera-btn {
      position: absolute;
      bottom: 10px;
      right: 10px;
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: #2563eb;
      color: #ffffff;
      border: 2.5px solid #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 8px rgba(37, 99, 235, 0.35);
      cursor: pointer;
      transition: all 0.15s ease-in-out;
    }
    .floating-camera-btn:hover {
      background: #1d4ed8;
      transform: scale(1.05);
    }
    .floating-remove-photo-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #ef4444;
      color: #ffffff;
      border: 2px solid #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
      cursor: pointer;
      transition: all 0.15s ease-in-out;
    }
    .floating-remove-photo-btn:hover {
      background: #dc2626;
      transform: scale(1.05);
    }

    /* Meta Info List */
    .meta-info-stack {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .admission-no-row {
      padding: 0 2px;
    }
    .meta-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #475569;
    }
    .meta-auto-badge {
      font-size: 0.8125rem;
      font-weight: 700;
      color: #10b981;
    }
    .meta-divider {
      height: 1px;
      background: #f1f5f9;
      margin: 2px 0;
    }
    .meta-item-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 2px 0;
    }
    .meta-item-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .meta-icon-box {
      width: 28px;
      height: 28px;
      border-radius: 7px;
      background: #eff6ff;
      border: 1px solid #dbeafe;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .meta-item-title {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #475569;
    }
    .meta-item-val {
      font-size: 0.8125rem;
      color: #0f172a;
    }
    .meta-form-row {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 2px;
    }
    .meta-form-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .meta-form-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #334155;
    }
    .left-column-select {
      width: 100%;
      height: 38px;
      padding: 0 28px 0 12px;
      border-radius: 9px;
      border: 1.5px solid #cbd5e1;
      background: #ffffff;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #0f172a;
      appearance: none;
      outline: none;
      transition: all 0.15s ease-in-out;
    }
    .left-column-select:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
    }
    .select-wrapper {
      position: relative;
      width: 100%;
    }
    .select-chevron {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      font-size: 0.7rem;
      color: #94a3b8;
    }

    /* RIGHT COLUMN: Main Form */
    .right-content-column {
      min-width: 0;
    }
    .right-content-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 24px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
    }

    /* Form Fields & Grid */
    .form-box-section {
      display: flex;
      flex-direction: column;
    }
    .section-title-strip {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    .section-title-text {
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .form-row-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 14px;
    }
    .form-row-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 14px;
    }
    .form-row-1 {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }
    @media (max-width: 768px) {
      .form-row-3, .form-row-2 {
        grid-template-columns: 1fr;
      }
    }

    .form-group-field {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .field-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #334155;
    }
    .field-input {
      width: 100%;
      height: 40px;
      padding: 0 12px;
      border-radius: 9px;
      border: 1.5px solid #cbd5e1;
      background: #ffffff;
      font-size: 0.835rem;
      color: #0f172a;
      outline: none;
      transition: all 0.15s ease-in-out;
    }
    .field-input::placeholder {
      color: #94a3b8;
    }
    .field-input:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
    }
    .field-select {
      width: 100%;
      height: 40px;
      padding: 0 28px 0 12px;
      border-radius: 9px;
      border: 1.5px solid #cbd5e1;
      background: #ffffff;
      font-size: 0.835rem;
      color: #0f172a;
      appearance: none;
      outline: none;
      transition: all 0.15s ease-in-out;
    }
    .field-select:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
    }

    /* Present Address Section */
    .address-banner-section {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      overflow: hidden;
    }
    .teal-header-strip {
      background: #f0fdfa;
      border-bottom: 1px solid #ccfbf1;
      padding: 9px 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #0f766e;
      font-weight: 700;
      font-size: 0.85rem;
    }
    .address-fields-grid {
      padding: 16px;
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 14px;
    }
    @media (max-width: 900px) {
      .address-fields-grid {
        grid-template-columns: 1fr 1fr;
      }
      .col-address { grid-column: span 2; }
    }

    /* Quick Info Section */
    .quickinfo-banner-section {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      overflow: hidden;
    }
    .blue-header-strip {
      background: #eff6ff;
      border-bottom: 1px solid #dbeafe;
      padding: 9px 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #1e40af;
      font-weight: 700;
      font-size: 0.85rem;
    }
    .quickinfo-controls-row {
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 36px;
      flex-wrap: wrap;
    }
    .custom-checkbox-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
    }
    .custom-checkbox-wrap input {
      width: 17px;
      height: 17px;
      accent-color: #2563eb;
      cursor: pointer;
    }
    .status-toggle-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-left: auto;
    }
    .status-label {
      font-size: 0.835rem;
      font-weight: 600;
      color: #334155;
    }
    .switch-toggle {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
    }
    .switch-toggle input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .toggle-slider {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background-color: #cbd5e1;
      transition: .2s;
      border-radius: 24px;
    }
    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .2s;
      border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    }
    .switch-toggle input:checked + .toggle-slider {
      background-color: #10b981;
    }
    .switch-toggle input:checked + .toggle-slider:before {
      transform: translateX(20px);
    }

    /* Subcard Styles for Step 2 & 3 */
    .guardian-subcard {
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      overflow: hidden;
      background: #ffffff;
    }
    .subcard-header {
      padding: 9px 16px;
      font-size: 0.85rem;
      font-weight: 700;
    }
    .blue-tint { background: #eff6ff; color: #1d4ed8; border-bottom: 1px solid #dbeafe; }
    .purple-tint { background: #f5f3ff; color: #5b21b6; border-bottom: 1px solid #ede9fe; }
    .teal-tint { background: #f0fdfa; color: #0f766e; border-bottom: 1px solid #ccfbf1; }
    .amber-tint { background: #fffbeb; color: #92400e; border-bottom: 1px solid #fef3c7; }

    /* Documents Grid */
    .documents-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    @media (max-width: 768px) {
      .documents-grid { grid-template-columns: 1fr; }
    }
    .doc-upload-card {
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    }
    .doc-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .blue-bg { background: #eff6ff; }
    .teal-bg { background: #f0fdfa; }
    .purple-bg { background: #f5f3ff; }
    .amber-bg { background: #fffbeb; }
    .doc-title { font-size: 0.9rem; font-weight: 700; color: #0f172a; margin: 0 0 3px 0; }
    .doc-desc { font-size: 0.775rem; color: #64748b; margin: 0 0 4px 0; }
    .doc-status { font-size: 0.75rem; }
    .btn-doc-browse {
      background: #f8fafc;
      border: 1.5px dashed #cbd5e1;
      border-radius: 8px;
      padding: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
    }
    .btn-doc-browse:hover { border-color: #2563eb; color: #2563eb; background: #eff6ff; }

    /* Dossier Card (Step 5) */
    .dossier-card {
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      background: #ffffff;
    }
    .dossier-header {
      background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #e2e8f0;
      flex-wrap: wrap;
      gap: 16px;
    }
    .dossier-student-block {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .dossier-thumb {
      width: 64px;
      height: 64px;
      border-radius: 14px;
      object-fit: cover;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .dossier-thumb-empty {
      width: 64px;
      height: 64px;
      border-radius: 14px;
      background: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .dossier-fullname { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0; }
    .dossier-subname { font-size: 0.825rem; margin: 2px 0 6px 0; }
    .dossier-campus-badge {
      display: inline-block;
      background: #dbeafe;
      color: #1e40af;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.725rem;
      font-weight: 700;
    }
    .dossier-badge-green {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 0.775rem;
      font-weight: 700;
    }
    .dossier-date-text { font-size: 0.775rem; color: #64748b; margin-top: 4px; display: block; }
    .dossier-table-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1px;
      background: #f1f5f9;
    }
    .dossier-cell {
      background: #ffffff;
      padding: 14px 18px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .cell-k { font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; }
    .cell-v { font-size: 0.875rem; color: #0f172a; font-weight: 700; }

    /* Pane Bottom Buttons */
    .pane-bottom-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
    }
    .btn-prev-step {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 18px;
      border-radius: 10px;
      background: #ffffff;
      color: #475569;
      border: 1.5px solid #cbd5e1;
      font-size: 0.835rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-prev-step:hover { background: #f8fafc; }
    .btn-next-step {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 20px;
      border-radius: 10px;
      background: #2563eb;
      color: #ffffff;
      border: none;
      font-size: 0.835rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
    }
    .btn-next-step:hover { background: #1d4ed8; }
    .btn-commit-final {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 22px;
      border-radius: 10px;
      background: #059669;
      color: #ffffff;
      border: none;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);
    }
    .btn-commit-final:hover { background: #047857; }

    /* Bulk Mode Styles */
    .bulk-excel-container {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 22px;
    }
    .bulk-header-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .bulk-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #ecfdf5;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .bulk-title { font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0; }
    .bulk-subtitle { font-size: 0.8rem; color: #64748b; margin: 2px 0 0 0; }
    .bulk-grid-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    @media (max-width: 900px) {
      .bulk-grid-cards { grid-template-columns: 1fr; }
    }
    .bulk-step-card {
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px;
      background: #f8fafc;
      position: relative;
    }
    .bulk-step-tag {
      display: inline-block;
      background: #e0f2fe;
      color: #0284c7;
      padding: 2px 8px;
      border-radius: 5px;
      font-size: 0.7rem;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .bulk-step-title { font-size: 0.9rem; font-weight: 700; color: #0f172a; margin: 0 0 10px 0; }
    .form-label-custom { font-size: 0.775rem; font-weight: 600; color: #475569; display: block; margin-bottom: 4px; }
    .form-select-custom {
      width: 100%;
      height: 38px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      padding: 0 10px;
      font-size: 0.8125rem;
    }
    .btn-browse-excel {
      background: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 9px 14px;
      font-weight: 600;
      font-size: 0.8125rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
    }
    .btn-commit-bulk {
      background: #059669;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 10px 14px;
      font-weight: 700;
      font-size: 0.835rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
    }
    .btn-commit-bulk:disabled { opacity: 0.6; cursor: not-allowed; }
    .selected-file-pill {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 6px;
      padding: 4px 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.75rem;
      color: #065f46;
    }
    .btn-clear-file {
      background: none;
      border: none;
      color: #ef4444;
      font-weight: bold;
      cursor: pointer;
    }
    .import-summary-banner {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 10px;
      padding: 12px 16px;
      font-size: 0.825rem;
    }
    .import-summary-banner.has-errors {
      background: #fffbeb;
      border-color: #fde68a;
    }

    /* PRINT SPECIFIC STYLES */
    @media print {
      body * { visibility: hidden; }
      #admission-dossier-print, #admission-dossier-print * { visibility: visible; }
      #admission-dossier-print {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
      .pane-bottom-actions { display: none !important; }
    }
  `]
})
export class AdmissionComponent implements OnInit {
  private studentStore = inject(StudentStoreService);
  private academicStore = inject(AcademicStoreService);
  private campus = inject(CampusSessionService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private authService = inject(AuthService);

  getActiveBranchName(): string {
    const bId = this.campus.branchId;
    if (bId === 'br-02c70f') return 'Dhanmondi Campus';
    if (bId === 'br-8996de') return 'Uttara Campus';
    if (bId === 'br-6fd98e') return 'Rayerbag Campus';
    return 'Main Campus (Central)';
  }

  admissionMode: 'single' | 'bulk' = 'single';
  bulkClassId = 'cls-10';
  bulkSectionId = 'sec-10a';
  bulkAvailableSections: Section[] = [];
  selectedBulkFile: File | null = null;
  isImporting = false;
  isSubmitting = false;
  bulkImportResult: any = null;

  step = 1;
  classes: SchoolClass[] = [];
  sections: Section[] = [];
  availableSections: Section[] = [];

  activeBranch: Branch | null = null;
  activeSessionName = '2026 – 2027';
  todayFormatted = '';

  photoPreviewUrl: string | null = null;
  isUploadingPhoto = false;

  // Student Information Extra State
  studentNationality = 'Bangladeshi';
  studentPreviousSchool = '';
  studentDivision = 'Dhaka';
  studentDistrict = 'Dhaka';
  studentUpazila = 'Dhanmondi';
  isHostel = false;
  isTransport = false;
  isActiveStatus = true;

  // Parent / Guardian Extra State
  fatherName = '';
  fatherPhone = '';
  fatherOccupation = '';
  motherName = '';
  motherPhone = '';
  motherOccupation = '';

  // Academic Extra State
  admissionCategory = 'Regular';
  academicShift = 'Morning';
  lastClassPassed = '';
  lastPassingYear = '2025';
  lastGpaMarks = '';
  tcNumber = '';
  coCurricular = '';
  medicalNotes = '';

  // Database Reference Lookups
  academicSessions: AcademicYear[] = [];
  genderOptions: LookupOption[] = [
    { id: 'Male', label: 'Male' },
    { id: 'Female', label: 'Female' },
    { id: 'Other', label: 'Other' }
  ];
  bloodGroupOptions: LookupOption[] = [
    { id: 'A+', label: 'A+' },
    { id: 'A-', label: 'A-' },
    { id: 'B+', label: 'B+' },
    { id: 'B-', label: 'B-' },
    { id: 'O+', label: 'O+' },
    { id: 'O-', label: 'O-' },
    { id: 'AB+', label: 'AB+' },
    { id: 'AB-', label: 'AB-' }
  ];
  nationalityOptions: LookupOption[] = [
    { id: 'Bangladeshi', label: '🇧🇩 Bangladeshi' },
    { id: 'Other', label: '🌐 Other' }
  ];
  religionOptions: LookupOption[] = [
    { id: 'Islam', label: 'Islam' },
    { id: 'Hinduism', label: 'Hinduism' },
    { id: 'Christianity', label: 'Christianity' },
    { id: 'Buddhism', label: 'Buddhism' },
    { id: 'Other', label: 'Other' }
  ];
  guardianRelationOptions: LookupOption[] = [
    { id: 'Father', label: 'Father (পিতা)' },
    { id: 'Mother', label: 'Mother (মাতা)' },
    { id: 'Brother', label: 'Brother (ভাই)' },
    { id: 'Sister', label: 'Sister (বোন)' },
    { id: 'Uncle', label: 'Uncle (চাচা/মামা)' },
    { id: 'Aunt', label: 'Aunt (ফুফু/খালা)' },
    { id: 'Legal Guardian', label: 'Legal Guardian (আইনগত অভিভাবক)' },
    { id: 'Other', label: 'Other (অন্যান্য)' }
  ];
  admissionCategoryOptions: LookupOption[] = [
    { id: 'Regular', label: 'Regular Student' },
    { id: 'Transfer', label: 'Transfer In' },
    { id: 'Scholarship', label: 'Merit Scholarship' },
    { id: 'Quota', label: 'Sibling / Quota' },
    { id: 'StaffWard', label: 'Staff Ward' }
  ];
  academicShiftOptions: LookupOption[] = [
    { id: 'Morning', label: 'Morning Shift (প্রভাতি)' },
    { id: 'Day', label: 'Day Shift (দিবা)' }
  ];

  // Cascading Geographic Data (Division -> District -> Upazila)
  divisions: DivisionLookup[] = [];
  availableDistricts: DistrictLookup[] = [];
  availableUpazilas: string[] = [];

  formData: Partial<Student> = {
    fullName: '',
    banglaName: '',
    dateOfBirth: '2012-01-15',
    gender: 'Male',
    bloodGroup: 'B+',
    religion: 'Islam',
    phone: '',
    email: '',
    presentAddress: '',
    permanentAddress: '',
    photoUrl: '',
    guardianName: '',
    guardianRelation: 'Father',
    guardianPhone: '',
    guardianOccupation: '',
    guardianIncome: '',
    academicYearId: '',
    classId: '',
    sectionId: '',
    rollNo: '01'
  };

  async ngOnInit() {
    await Promise.all([
      this.academicStore.loadClasses(),
      this.academicStore.loadSections(),
      this.studentStore.loadAdmissionLookups()
    ]);

    this.classes = this.academicStore.getClasses();
    this.sections = this.academicStore.getSections();

    // 1. Load dynamic lookups from Database
    this.studentStore.getAdmissionLookups$().subscribe(lookups => {
      if (lookups) {
        this.genderOptions = lookups.genders || [];
        this.bloodGroupOptions = lookups.bloodGroups || [];
        this.nationalityOptions = lookups.nationalities || [];
        this.religionOptions = lookups.religions || [];
        this.guardianRelationOptions = lookups.guardianRelations || [];
        this.admissionCategoryOptions = lookups.admissionCategories || [];
        this.academicShiftOptions = lookups.academicShifts || [];
        this.divisions = lookups.divisions || [];

        // Initialize cascading geographic dropdowns
        if (this.divisions.length > 0) {
          const defaultDiv = this.divisions.find(d => d.name === this.studentDivision) || this.divisions[0];
          this.studentDivision = defaultDiv.name;
          this.availableDistricts = defaultDiv.districts || [];

          if (this.availableDistricts.length > 0) {
            const defaultDist = this.availableDistricts.find(d => d.name === this.studentDistrict) || this.availableDistricts[0];
            this.studentDistrict = defaultDist.name;
            this.availableUpazilas = defaultDist.upazilas || [];

            if (this.availableUpazilas.length > 0 && !this.availableUpazilas.includes(this.studentUpazila)) {
              this.studentUpazila = this.availableUpazilas[0];
            }
          }
        }
      }
    });

    // 2. Load Academic Sessions
    this.academicSessions = [
      { id: 'ay-2026', name: '2026 - 2027', startDate: '2026-01-01', endDate: '2026-12-31', isCurrent: true, isLocked: false }
    ];
    this.formData.academicYearId = 'ay-2026';
    this.activeSessionName = '2026 – 2027';

    this.academicStore.getClasses$().subscribe(cls => {
      this.classes = cls || [];
      if (this.classes.length > 0) {
        if (!this.formData.classId || !this.classes.some(c => c.id === this.formData.classId)) {
          this.formData.classId = this.classes[0].id;
          this.bulkClassId = this.classes[0].id;
        }
        this.onClassSelect();
        this.onBulkClassChange();
      }
    });

    this.academicStore.getSections$().subscribe(sec => {
      this.sections = sec || [];
      this.onClassSelect();
      this.onBulkClassChange();
    });

    this.activeBranch = {
      id: this.campus.branchId || 'br-02c70f',
      schoolId: 'sch-01',
      code: 'DMD',
      name: this.getActiveBranchName(),
      address: 'Dhanmondi, Dhaka',
      phone: '+880 1711-000001',
      isActive: true
    };

    // Format current date: e.g. "15 Nov 2026"
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    this.todayFormatted = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

    if (this.classes.length > 0) {
      this.formData.classId = this.classes[0].id;
      this.bulkClassId = this.classes[0].id;
    }

    this.onClassSelect();
    this.onBulkClassChange();
  }

  onSessionChange() {
    const selected = this.academicSessions.find(s => s.id === this.formData.academicYearId);
    if (selected) {
      this.activeSessionName = selected.name;
    }
  }

  onDivisionChange() {
    const selected = this.divisions.find(d => d.name === this.studentDivision);
    this.availableDistricts = selected ? selected.districts : [];
    if (this.availableDistricts.length > 0) {
      this.studentDistrict = this.availableDistricts[0].name;
      this.onDistrictChange();
    } else {
      this.studentDistrict = '';
      this.availableUpazilas = [];
      this.studentUpazila = '';
    }
  }

  onDistrictChange() {
    const selected = this.availableDistricts.find(d => d.name === this.studentDistrict);
    this.availableUpazilas = selected ? selected.upazilas : [];
    if (this.availableUpazilas.length > 0) {
      this.studentUpazila = this.availableUpazilas[0];
    } else {
      this.studentUpazila = '';
    }
  }

  onClassSelect() {
    this.availableSections = this.sections.filter(s => s.classId === this.formData.classId);
    if (this.availableSections.length > 0) {
      this.formData.sectionId = this.availableSections[0].id;
    } else {
      this.formData.sectionId = '';
    }
  }

  onBulkClassChange() {
    this.bulkAvailableSections = this.sections.filter(s => s.classId === this.bulkClassId);
    if (this.bulkAvailableSections.length > 0) {
      this.bulkSectionId = this.bulkAvailableSections[0].id;
    } else {
      this.bulkSectionId = '';
    }
  }

  getSelectedClassName(): string {
    return this.classes.find(c => c.id === this.formData.classId)?.name || 'Class';
  }

  getSelectedSectionName(): string {
    return this.availableSections.find(s => s.id === this.formData.sectionId)?.name || 'Section';
  }

  syncPermanentAddress(event: any) {
    if (event.target.checked) {
      this.formData.permanentAddress = this.formData.presentAddress;
    }
  }

  async onPhotoSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.toast.error('Invalid Format', 'Please upload an image file (JPG, PNG, or WebP).');
      event.target.value = '';
      return;
    }

    this.isUploadingPhoto = true;
    try {
      // Automatically optimize and resize image regardless of original MB size
      const optimizedFile = await compressAndResizeImage(file);

      // Generate local preview immediately for fluid UX
      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreviewUrl = reader.result as string;
      };
      reader.readAsDataURL(optimizedFile);

      const res = await this.authService.uploadFile(optimizedFile, 'students');
      if (res && res.url) {
        this.formData.photoUrl = res.url;
        this.toast.success('Photo Uploaded', `Student picture attached successfully (${Math.round(optimizedFile.size / 1024)} KB).`);
      } else {
        this.toast.error('Upload Failed', 'Could not upload student photo. Please try again.');
        this.photoPreviewUrl = null;
      }
    } catch (err: any) {
      this.toast.error('Upload Error', err?.message || 'Error uploading photo.');
      this.photoPreviewUrl = null;
    } finally {
      this.isUploadingPhoto = false;
      event.target.value = '';
    }
  }

  clearPhoto(input?: HTMLInputElement) {
    this.photoPreviewUrl = null;
    this.formData.photoUrl = '';
    if (input) input.value = '';
    this.toast.info('Photo Removed', 'Student photograph cleared.');
  }

  goToStep(s: number) {
    if (s < this.step) {
      this.step = s;
    } else if (this.validateCurrentStep()) {
      this.step = s;
    }
  }

  nextStep() {
    if (this.validateCurrentStep()) {
      if (this.step < 5) this.step++;
    }
  }

  prevStep() {
    if (this.step > 1) this.step--;
  }

  validateCurrentStep(): boolean {
    if (this.step === 1 && !this.formData.fullName?.trim()) {
      this.toast.error('Required Field', 'Please enter student full name.');
      return false;
    }
    if (this.step === 1 && !this.formData.classId) {
      this.toast.error('Required Field', 'Please select a Class.');
      return false;
    }
    if (this.step === 2 && !this.formData.guardianName?.trim()) {
      if (this.fatherName?.trim()) {
        this.formData.guardianName = this.fatherName.trim();
        this.formData.guardianRelation = 'Father';
        if (!this.formData.guardianPhone && this.fatherPhone) {
          this.formData.guardianPhone = this.fatherPhone;
        }
      } else if (this.motherName?.trim()) {
        this.formData.guardianName = this.motherName.trim();
        this.formData.guardianRelation = 'Mother';
        if (!this.formData.guardianPhone && this.motherPhone) {
          this.formData.guardianPhone = this.motherPhone;
        }
      } else {
        this.toast.error('Required Field', 'Please enter primary guardian full name.');
        return false;
      }
    }
    return true;
  }

  resetForm() {
    const curYear = this.academicSessions.find(y => y.isCurrent) || this.academicSessions[0];
    this.formData = {
      fullName: '',
      banglaName: '',
      dateOfBirth: '2012-01-15',
      gender: (this.genderOptions[0]?.id as any) || 'Male',
      bloodGroup: this.bloodGroupOptions[0]?.id || 'B+',
      religion: this.religionOptions[0]?.id || 'Islam',
      phone: '',
      email: '',
      presentAddress: '',
      permanentAddress: '',
      photoUrl: '',
      guardianName: '',
      guardianRelation: this.guardianRelationOptions[0]?.id || 'Father',
      guardianPhone: '',
      guardianOccupation: '',
      guardianIncome: '',
      academicYearId: curYear?.id || '',
      classId: this.classes[0]?.id || '',
      sectionId: '',
      rollNo: '01'
    };
    this.activeSessionName = curYear?.name || '2025 – 2026';
    this.studentNationality = this.nationalityOptions[0]?.id || 'Bangladeshi';
    this.studentPreviousSchool = '';
    this.admissionCategory = this.admissionCategoryOptions[0]?.id || 'Regular';
    this.academicShift = this.academicShiftOptions[0]?.id || 'Morning';
    if (this.divisions.length > 0) {
      this.studentDivision = this.divisions[0].name;
      this.onDivisionChange();
    }
    this.photoPreviewUrl = null;
    this.fatherName = '';
    this.fatherPhone = '';
    this.fatherOccupation = '';
    this.motherName = '';
    this.motherPhone = '';
    this.motherOccupation = '';
    this.lastClassPassed = '';
    this.lastPassingYear = '2025';
    this.lastGpaMarks = '';
    this.tcNumber = '';
    this.coCurricular = '';
    this.medicalNotes = '';
    this.isHostel = false;
    this.isTransport = false;
    this.isActiveStatus = true;
    this.step = 1;
    this.onClassSelect();
    this.toast.info('Form Reset', 'Admission form has been reset for a new student.');
  }

  syncAllFormFields() {
    if (!this.formData.guardianName?.trim()) {
      this.formData.guardianName = this.fatherName || this.motherName || 'Legal Guardian';
      this.formData.guardianPhone = this.fatherPhone || this.motherPhone || this.formData.phone || '01700000000';
    }

    this.formData.className = this.getSelectedClassName();
    this.formData.sectionName = this.getSelectedSectionName();
    this.formData.status = this.isActiveStatus ? 'Active' : 'Inactive';

    // Synchronize all extended bio and guardian fields
    this.formData.fatherName = this.fatherName;
    this.formData.fatherPhone = this.fatherPhone;
    this.formData.fatherOccupation = this.fatherOccupation;
    this.formData.motherName = this.motherName;
    this.formData.motherPhone = this.motherPhone;
    this.formData.motherOccupation = this.motherOccupation;
    this.formData.nationality = this.studentNationality;
    this.formData.previousSchool = this.studentPreviousSchool;
    this.formData.division = this.studentDivision;
    this.formData.district = this.studentDistrict;
    this.formData.upazila = this.studentUpazila;
    this.formData.isHostel = this.isHostel;
    this.formData.isTransport = this.isTransport;
    this.formData.admissionCategory = this.admissionCategory;
    this.formData.shift = this.academicShift;
    this.formData.lastClassPassed = this.lastClassPassed;
    this.formData.lastPassingYear = this.lastPassingYear;
    this.formData.lastGpaMarks = this.lastGpaMarks;
    this.formData.tcNumber = this.tcNumber;
    this.formData.coCurricular = this.coCurricular;
    this.formData.medicalNotes = this.medicalNotes;
  }

  async saveStudent() {
    if (!this.formData.fullName?.trim()) {
      this.step = 1;
      this.toast.error('Required Field', 'Student Name is required.');
      return;
    }
    if (!this.formData.classId) {
      this.toast.error('Required Field', 'Please select a Class.');
      return;
    }
    if (!this.formData.sectionId) {
      this.toast.error('Required Field', 'Please select a Section.');
      return;
    }

    if (!this.formData.dateOfBirth) {
      this.formData.dateOfBirth = '2015-01-01';
    }

    this.syncAllFormFields();

    this.isSubmitting = true;
    try {
      const created = await this.studentStore.addStudent(this.formData);
      this.toast.success(
        'Admission Successful',
        `Student ${created.fullName} enrolled with ID: ${created.admissionNo || created.id}`
      );
      this.router.navigate(['/app/students/list']);
    } catch (err: any) {
      this.toast.error('Admission Failed', err?.message || 'Could not complete admission.');
    } finally {
      this.isSubmitting = false;
    }
  }

  async saveAndPrint() {
    if (!this.formData.fullName?.trim()) {
      this.step = 1;
      this.toast.error('Required Field', 'Student Name is required before printing.');
      return;
    }
    this.syncAllFormFields();

    this.step = 5;
    setTimeout(() => {
      window.print();
    }, 400);
  }

  downloadExcelTemplate() {
    this.studentStore.downloadImportTemplate().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Student_Admission_Template.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
        this.toast.success('Template Downloaded', 'Open in Excel, enter applicant details, and upload.');
      },
      error: () => this.toast.error('Download Failed', 'Could not download Excel template.')
    });
  }

  onBulkFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedBulkFile = file;
      this.bulkImportResult = null;
    }
  }

  async submitBulkAdmission() {
    if (!this.selectedBulkFile) {
      this.toast.error('File Required', 'Please choose an Excel file to import.');
      return;
    }
    if (!this.bulkClassId || !this.bulkSectionId) {
      this.toast.error('Selection Required', 'Please choose target Class and Section.');
      return;
    }

    this.isImporting = true;
    try {
      const res = await this.studentStore.bulkImportStudents(
        this.selectedBulkFile,
        this.bulkClassId,
        this.bulkSectionId
      );
      if (res?.success && res.data) {
        this.bulkImportResult = res.data;
        this.toast.success('Bulk Import Succeeded', res.message || `Imported ${res.data.importedCount} student(s).`);
        if (res.data.importedCount > 0 && (!res.data.errors || res.data.errors.length === 0)) {
          setTimeout(() => this.router.navigate(['/app/students/list']), 2000);
        }
      }
    } catch (err: any) {
      this.toast.error('Import Failed', err?.error?.message || err?.message || 'Could not process Excel import.');
    } finally {
      this.isImporting = false;
    }
  }
}
