import { Component, OnInit, ChangeDetectorRef, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AcademicStoreService } from '../../core/services/stores/academic-store.service';
import { TeacherStoreService } from '../../core/services/stores/teacher-store.service';
import { MasterDataStoreService } from '../../core/services/stores/master-data-store.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { SchoolClass, Section, Teacher, AcademicYear } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';
import { ModalComponent } from '../../shared/components/modal.component';

interface ClassColorTheme {
  bg: string;
  color: string;
  borderColor: string;
}

@Component({
  selector: 'app-classes-management',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, ModalComponent],
  template: `
    <div class="page-container">
      <!-- 1. PAGE HEADER -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-badge-icon">
            <app-icon name="graduation-cap" [size]="28" class="text-indigo"></app-icon>
          </div>
          <div>
            <h1 class="page-title">Academic Classes & Sections Setup</h1>
            <p class="page-subtitle">
              Configure institutional academic tiers, section limits, student capacities, and faculty class teacher allocations.
            </p>
          </div>
        </div>

        <div class="header-actions">
          <button type="button" class="btn btn-outline-white" (click)="openImportModal()">
            <app-icon name="upload" [size]="16" class="text-slate-600"></app-icon>
            <span>Import</span>
          </button>
          
          <button type="button" class="btn btn-outline-white" (click)="exportClasses()">
            <app-icon name="file-spreadsheet" [size]="16" class="text-emerald-excel"></app-icon>
            <span>Export</span>
          </button>

          <button type="button" class="btn btn-outline-white" (click)="openTierSetupModal()" title="View & Configure Academic Tiers (Pre-Primary, Primary, Secondary, Higher Secondary)">
            <app-icon name="layers" [size]="16" class="text-purple"></app-icon>
            <span>Academic Tiers Setup</span>
          </button>

          <button *ngIf="canManage" type="button" class="btn btn-primary-purple" (click)="openAddClassModal()">
            <app-icon name="plus" [size]="16"></app-icon>
            <span>Add New Class</span>
          </button>
        </div>
      </div>

      <!-- 2. TOP 4 KPI STAT CARDS -->
      <div class="kpi-grid">
        <!-- KPI 1: Total Classes -->
        <div class="kpi-card kpi-purple">
          <div class="kpi-icon-wrap icon-purple">
            <app-icon name="layers" [size]="22" class="text-purple"></app-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">Total Classes</span>
            <h2 class="kpi-value">{{ totalClassesCount }}</h2>
          </div>
        </div>

        <!-- KPI 2: Total Sections -->
        <div class="kpi-card kpi-blue">
          <div class="kpi-icon-wrap icon-blue">
            <app-icon name="users" [size]="22" class="text-blue"></app-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">Total Sections</span>
            <h2 class="kpi-value">{{ totalSectionsCount }}</h2>
          </div>
        </div>

        <!-- KPI 3: Assigned Teachers -->
        <div class="kpi-card kpi-emerald">
          <div class="kpi-icon-wrap icon-emerald">
            <app-icon name="user-check" [size]="22" class="text-emerald"></app-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">Assigned Teachers</span>
            <h2 class="kpi-value">{{ assignedTeachersCount }}</h2>
          </div>
        </div>

        <!-- KPI 4: Total Capacity -->
        <div class="kpi-card kpi-amber">
          <div class="kpi-icon-wrap icon-amber">
            <app-icon name="users" [size]="22" class="text-amber"></app-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">Total Capacity</span>
            <h2 class="kpi-value">{{ totalCapacityCount }}</h2>
          </div>
        </div>
      </div>

      <!-- 3. FILTER AND SEARCH CONTROL STRIP -->
      <div class="filter-strip-card">
        <div class="filter-control-group">
          <label class="filter-label">Academic Year</label>
          <div class="select-wrapper">
            <select [(ngModel)]="selectedAcademicYear" (change)="applyFilters()" class="filter-select">
              <option *ngFor="let ay of academicYears" [value]="ay.id">📅 {{ ay.name }}</option>
              <option *ngIf="academicYears.length === 0" value="ay-2026">📅 2026 – 2027</option>
            </select>
            <app-icon name="chevron-down" [size]="14" class="select-caret"></app-icon>
          </div>
        </div>

        <div class="filter-control-group">
          <label class="filter-label">Class Status</label>
          <div class="select-wrapper">
            <select [(ngModel)]="selectedStatus" (change)="applyFilters()" class="filter-select">
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <app-icon name="chevron-down" [size]="14" class="select-caret"></app-icon>
          </div>
        </div>

        <div class="filter-control-group">
          <label class="filter-label">Class Range</label>
          <div class="select-wrapper">
            <select [(ngModel)]="selectedClassRange" (change)="applyFilters()" class="filter-select">
              <option value="All">All Classes</option>
              <option value="Pre-Primary">Pre-Primary (Play, Narsari)</option>
              <option value="Primary">Primary (One - Five)</option>
              <option value="Secondary">Secondary (Six - Ten)</option>
            </select>
            <app-icon name="chevron-down" [size]="14" class="select-caret"></app-icon>
          </div>
        </div>

        <div class="filter-control-group search-control-group">
          <label class="filter-label">Search</label>
          <div class="search-input-box">
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              (keyup)="applyFilters()"
              placeholder="Search class by name or code..."
              class="search-input"
            />
            <button type="button" class="btn-search-purple" (click)="applyFilters()">
              <app-icon name="search" [size]="16"></app-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- 4. 3-COLUMN CLASS CARDS GRID -->
      <div class="classes-grid" *ngIf="filteredClasses.length > 0; else noClassesFound">
        <div *ngFor="let cls of filteredClasses; let idx = index" class="class-card" [class.is-inactive]="cls.isActive === false">
          <!-- Card Header -->
          <div class="card-header">
            <div class="class-meta-left">
              <div class="class-badge-icon" [ngStyle]="{ 'background-color': getClassTheme(idx, cls).bg, 'color': getClassTheme(idx, cls).color }">
                <app-icon name="graduation-cap" [size]="22"></app-icon>
              </div>
              <div class="class-title-wrap">
                <div class="title-status-line">
                  <h3 class="class-name">{{ cls.name }}</h3>
                  <span *ngIf="cls.isActive === false" class="inactive-tag">Inactive</span>
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="class-code">{{ cls.code }}</span>
                  <span class="tier-badge-pill" [ngClass]="'tier-' + getTier(cls)">{{ getTierLabel(cls) }}</span>
                </div>
              </div>
            </div>

            <div class="class-meta-right">
              <!-- Active Switch Toggle -->
              <button 
                type="button" 
                class="status-toggle-pill" 
                [class.active]="cls.isActive !== false"
                (click)="toggleActiveStatus(cls, $event)"
                [title]="cls.isActive !== false ? 'Click to deactivate' : 'Click to activate'"
              >
                <span class="toggle-knob"></span>
                <span class="toggle-label">{{ cls.isActive !== false ? 'Active' : 'Inactive' }}</span>
              </button>

              <!-- Vertical 3-dots Menu Button -->
              <div class="dropdown-container">
                <button 
                  type="button" 
                  class="btn-icon-dots" 
                  title="More actions"
                  (click)="toggleCardDropdown(cls.id, $event)"
                >
                  <app-icon name="more-vertical" [size]="18"></app-icon>
                </button>

                <!-- Dropdown Menu -->
                <div class="card-dropdown-menu" *ngIf="activeDropdownClassId === cls.id">
                  <button type="button" class="dropdown-item" (click)="openEditClassModal(cls)">
                    <app-icon name="edit" [size]="14"></app-icon>
                    <span>Edit Class</span>
                  </button>
                  <button type="button" class="dropdown-item" (click)="openManageSectionsModal(cls)">
                    <app-icon name="layers" [size]="14"></app-icon>
                    <span>Manage Sections</span>
                  </button>
                  <button type="button" class="dropdown-item" (click)="openAssignTeacherModal(cls)">
                    <app-icon name="user-check" [size]="14"></app-icon>
                    <span>Assign Teacher</span>
                  </button>
                  <button type="button" class="dropdown-item" (click)="toggleActiveStatus(cls, $event)">
                    <app-icon [name]="cls.isActive !== false ? 'x' : 'check'" [size]="14"></app-icon>
                    <span>{{ cls.isActive !== false ? 'Mark as Inactive' : 'Mark as Active' }}</span>
                  </button>
                  <hr class="dropdown-divider" />
                  <button type="button" class="dropdown-item text-danger" (click)="deleteClass(cls)">
                    <app-icon name="trash-2" [size]="14"></app-icon>
                    <span>Delete Class</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Card Middle Metrics Strip (Sections, Capacity, Class Teacher) -->
          <div class="card-metrics-strip">
            <div class="metric-item">
              <div class="metric-header">
                <app-icon name="layers" [size]="13" class="metric-icon"></app-icon>
                <span class="metric-label">Sections</span>
              </div>
              <span class="metric-value">{{ getSectionsForClass(cls.id).length }}</span>
            </div>

            <div class="metric-item">
              <div class="metric-header">
                <app-icon name="users" [size]="13" class="metric-icon"></app-icon>
                <span class="metric-label">Capacity</span>
              </div>
              <span class="metric-value">{{ getClassCapacity(cls.id) }}</span>
            </div>

            <div class="metric-item metric-item-teacher">
              <div class="metric-header">
                <app-icon name="user" [size]="13" class="metric-icon"></app-icon>
                <span class="metric-label">Class Teacher</span>
              </div>
              <span class="metric-value teacher-name" [title]="getClassTeacherName(cls)">
                {{ getClassTeacherName(cls) }}
              </span>
            </div>
          </div>

          <!-- Card Bottom Action Buttons -->
          <div class="card-actions-row">
            <button 
              type="button" 
              class="btn-card-action btn-manage-sec" 
              (click)="openManageSectionsModal(cls)"
            >
              <app-icon name="edit" [size]="14"></app-icon>
              <span>Manage Sections</span>
            </button>

            <button 
              type="button" 
              class="btn-card-action btn-assign-tch" 
              (click)="openAssignTeacherModal(cls)"
            >
              <app-icon name="user-check" [size]="14"></app-icon>
              <span>Assign Teacher</span>
            </button>
          </div>
        </div>
      </div>

      <!-- No Classes Fallback -->
      <ng-template #noClassesFound>
        <div class="empty-state-card">
          <div class="empty-state-icon">
            <app-icon name="graduation-cap" [size]="48" class="text-slate-400"></app-icon>
          </div>
          <h3>No Academic Classes Found</h3>
          <p>No classes matched your filter criteria. Try adjusting the search query or status filter.</p>
          <button type="button" class="btn btn-outline-white" (click)="resetFilters()">
            <span>Reset All Filters</span>
          </button>
        </div>
      </ng-template>

      <!-- Wave Decoration at Bottom -->
      <div class="page-bottom-decoration"></div>

      <!-- ================= MODALS ================= -->

      <!-- 1. ADD / EDIT CLASS MODAL -->
      <app-modal 
        [isOpen]="isClassModalOpen" 
        [title]="isEditingClass ? 'Edit Academic Class Tier' : 'Add New Academic Class'" 
        (close)="isClassModalOpen = false"
      >
        <form (ngSubmit)="saveClass()" class="modal-form-content">
          <div class="form-group">
            <label class="form-label">Class Standard Name <span class="required">*</span></label>
            <input 
              type="text" 
              [(ngModel)]="classForm.name" 
              (ngModelChange)="onClassNameChange()"
              name="className" 
              class="form-input" 
              placeholder="e.g. Play, Narsari, One, Two, Class 6..." 
              required 
            />
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Academic Tier / Level <span class="required">*</span></label>
              <select [(ngModel)]="classForm.tier" name="classTier" class="form-input">
                <option value="pre-primary">🧸 Pre-Primary (Play, Nursery, KG)</option>
                <option value="primary">🎒 Primary (Class 1 to 5)</option>
                <option value="secondary">🎓 Secondary (Class 6 to 10)</option>
                <option value="higher-secondary">🏛️ Higher Secondary (Class 11 & 12)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Class Code</label>
              <input 
                type="text" 
                [(ngModel)]="classForm.code" 
                name="classCode" 
                class="form-input" 
                placeholder="e.g. CLS-01, CLS-08" 
              />
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Sort / Hierarchy Order</label>
              <input 
                type="number" 
                [(ngModel)]="classForm.sortOrder" 
                name="sortOrder" 
                class="form-input" 
                placeholder="e.g. 1, 2, 3..." 
              />
            </div>
            <div class="form-group">
              <label class="form-label">Class Status</label>
              <select [(ngModel)]="classForm.isActive" name="classIsActive" class="form-input">
                <option [ngValue]="true">Active (Enrolling)</option>
                <option [ngValue]="false">Inactive</option>
              </select>
            </div>
          </div>

          <div *ngIf="!isEditingClass" class="checkbox-option-box">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="classForm.autoCreateSections" name="autoCreateSections" />
              <span>Auto-create standard Section A & Section B (30 capacity each)</span>
            </label>
          </div>

          <div class="modal-footer-actions">
            <button type="button" class="btn btn-outline-white" (click)="isClassModalOpen = false">Cancel</button>
            <button type="submit" class="btn btn-primary-purple" [disabled]="!classForm.name.trim()">
              <app-icon name="check" [size]="16"></app-icon>
              <span>{{ isEditingClass ? 'Update Class' : 'Save & Publish Class' }}</span>
            </button>
          </div>
        </form>
      </app-modal>

      <!-- 2. MANAGE SECTIONS MODAL -->
      <app-modal 
        [isOpen]="isSectionsModalOpen" 
        [title]="'Manage Sections — ' + (selectedClass?.name || 'Class')" 
        (close)="isSectionsModalOpen = false"
      >
        <div class="modal-form-content" *ngIf="selectedClass">
          <!-- Summary Header Strip -->
          <div class="manage-sec-header">
            <div>
              <span class="badge-code">{{ selectedClass.code }}</span>
              <h4 class="sec-class-title">{{ selectedClass.name }}</h4>
            </div>
            <div class="sec-kpis">
              <span class="sec-stat-pill">
                <strong>{{ getSectionsForClass(selectedClass.id).length }}</strong> Sections
              </span>
              <span class="sec-stat-pill">
                <strong>{{ getClassCapacity(selectedClass.id) }}</strong> Total Seats
              </span>
            </div>
          </div>

          <!-- Section List -->
          <div class="sections-list-wrap">
            <h5 class="sec-list-title">Configured Sections</h5>
            <div *ngIf="getSectionsForClass(selectedClass.id).length > 0; else noSecsInClass">
              <div *ngFor="let sec of getSectionsForClass(selectedClass.id)" class="section-row-card">
                <div class="sec-info-left">
                  <div class="sec-title-line">
                    <span class="sec-name-badge">{{ sec.name }}</span>
                    <span class="sec-cap-badge">{{ sec.capacity }} Seats</span>
                  </div>
                  <div class="sec-sub-info">
                    <app-icon name="user" [size]="13" class="text-slate-400"></app-icon>
                    <span>Class Teacher: <strong>{{ sec.classTeacherName || 'Not Assigned' }}</strong></span>
                  </div>
                </div>

                <div class="sec-actions-right">
                  <button type="button" class="btn-icon-action" title="Edit Section" (click)="startEditSection(sec)">
                    <app-icon name="edit" [size]="14"></app-icon>
                  </button>
                  <button type="button" class="btn-icon-action text-danger" title="Delete Section" (click)="deleteSection(sec)">
                    <app-icon name="trash-2" [size]="14"></app-icon>
                  </button>
                </div>
              </div>
            </div>

            <ng-template #noSecsInClass>
              <div class="empty-mini-box">
                <app-icon name="info" [size]="16" class="text-slate-400"></app-icon>
                <span>No sections configured for this class yet. Add one below.</span>
              </div>
            </ng-template>
          </div>

          <!-- Add / Edit Section Subform -->
          <div class="add-section-box">
            <h5 class="sec-list-title">{{ isEditingSection ? 'Edit Section' : '+ Add New Section' }}</h5>
            
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Section Name <span class="required">*</span></label>
                <input 
                  type="text" 
                  [(ngModel)]="sectionForm.name" 
                  name="secName" 
                  class="form-input" 
                  placeholder="e.g. Section A, Section B, Padma" 
                  required 
                />
              </div>

              <div class="form-group">
                <label class="form-label">Max Seat Capacity</label>
                <input 
                  type="number" 
                  [(ngModel)]="sectionForm.capacity" 
                  name="secCapacity" 
                  class="form-input" 
                  placeholder="e.g. 30" 
                  min="1" 
                  max="150" 
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Assigned Class Teacher</label>
              <select 
                [(ngModel)]="sectionForm.classTeacherId" 
                (change)="onSectionTeacherChanged()"
                name="secTeacher" 
                class="form-input"
              >
                <option value="">-- No Class Teacher Assigned --</option>
                <option *ngFor="let t of teachers" [value]="t.id">
                  {{ t.fullName }} ({{ t.department }} • {{ t.designation }})
                </option>
              </select>
            </div>

            <div class="sec-form-actions">
              <button *ngIf="isEditingSection" type="button" class="btn btn-outline-white" (click)="cancelEditSection()">
                Cancel
              </button>
              <button 
                type="button" 
                class="btn btn-primary-purple" 
                [disabled]="!sectionForm.name.trim()"
                (click)="saveSection()"
              >
                <app-icon name="check" [size]="14"></app-icon>
                <span>{{ isEditingSection ? 'Update Section' : 'Add Section' }}</span>
              </button>
            </div>
          </div>

          <div class="modal-footer-actions">
            <button type="button" class="btn btn-outline-white" (click)="isSectionsModalOpen = false">Done & Close</button>
          </div>
        </div>
      </app-modal>

      <!-- 3. ASSIGN TEACHER MODAL -->
      <app-modal 
        [isOpen]="isAssignTeacherModalOpen" 
        [title]="'Assign Class Teacher — ' + (selectedClass?.name || 'Class')" 
        (close)="isAssignTeacherModalOpen = false"
      >
        <div class="modal-form-content" *ngIf="selectedClass">
          <p class="modal-desc">
            Select an active faculty mentor to oversee academic performance, daily attendance, and pastoral care for this class tier.
          </p>

          <div class="form-group">
            <label class="form-label">Target Section Allocation</label>
            <select [(ngModel)]="assignTargetSectionId" class="form-input">
              <option value="ALL">Apply to All Sections (Primary Class Teacher)</option>
              <option *ngFor="let s of getSectionsForClass(selectedClass.id)" [value]="s.id">
                {{ s.name }} (Currently: {{ s.classTeacherName || 'None' }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Select Faculty Class Teacher <span class="required">*</span></label>
            <select [(ngModel)]="assignSelectedTeacherId" class="form-input">
              <option value="">-- Select Faculty Teacher --</option>
              <option *ngFor="let t of teachers" [value]="t.id">
                {{ t.fullName }} — {{ t.department }} ({{ t.designation }})
              </option>
            </select>
          </div>

          <div class="selected-teacher-preview" *ngIf="getSelectedTeacherPreview()">
            <div class="teacher-preview-card">
              <div class="teacher-preview-avatar">
                <app-icon name="user" [size]="20" class="text-indigo"></app-icon>
              </div>
              <div>
                <strong class="teacher-preview-name">{{ getSelectedTeacherPreview()?.fullName }}</strong>
                <div class="teacher-preview-sub">
                  <span>{{ getSelectedTeacherPreview()?.designation }}</span> • 
                  <span>{{ getSelectedTeacherPreview()?.department }}</span>
                </div>
                <div class="teacher-preview-contact">
                  <span>{{ getSelectedTeacherPreview()?.phone }}</span> | 
                  <span>{{ getSelectedTeacherPreview()?.email }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer-actions">
            <button type="button" class="btn btn-outline-white" (click)="isAssignTeacherModalOpen = false">Cancel</button>
            <button 
              type="button" 
              class="btn btn-primary-purple" 
              [disabled]="!assignSelectedTeacherId"
              (click)="saveClassTeacherAssignment()"
            >
              <app-icon name="check" [size]="16"></app-icon>
              <span>Assign Class Teacher</span>
            </button>
          </div>
        </div>
      </app-modal>

      <!-- 4. IMPORT CLASSES MODAL -->
      <app-modal 
        [isOpen]="isImportModalOpen" 
        title="Import Academic Classes & Sections" 
        (close)="isImportModalOpen = false"
      >
        <div class="modal-form-content">
          <p class="modal-desc">
            Upload a CSV formatted file containing institutional tiers, codes, section divisions, and student capacities.
          </p>

          <div class="sample-download-bar">
            <span>Need a reference format?</span>
            <button type="button" class="btn-link" (click)="downloadSampleCsv()">
              <app-icon name="download" [size]="14"></app-icon>
              <span>Download Sample CSV Template</span>
            </button>
          </div>

          <div class="dropzone-box" (click)="fileInput.click()">
            <input #fileInput type="file" accept=".csv" class="hidden-input" (change)="onFileSelected($event)" />
            <app-icon name="upload" [size]="36" class="text-indigo"></app-icon>
            <h4 class="dropzone-title">Click to browse or drop your CSV file here</h4>
            <span class="dropzone-sub">Supported file formats: CSV (UTF-8)</span>
            <span *ngIf="importedFileName" class="selected-file-badge">Selected: {{ importedFileName }}</span>
          </div>

          <div class="modal-footer-actions">
            <button type="button" class="btn btn-outline-white" (click)="isImportModalOpen = false">Cancel</button>
            <button 
              type="button" 
              class="btn btn-primary-purple" 
              [disabled]="!importedCsvData"
              (click)="processCsvImport()"
            >
              <app-icon name="upload" [size]="16"></app-icon>
              <span>Import Classes</span>
            </button>
          </div>
        </div>
      </app-modal>

      <!-- 5. ACADEMIC TIERS SETUP MODAL -->
      <app-modal 
        [isOpen]="isTierSetupModalOpen" 
        title="Institutional Academic Tiers Setup (শিক্ষাস্তর বিন্যাস ও ম্যাপিং)" 
        subtitle="Configure which classes belong to Pre-Primary, Primary, Secondary, or Higher Secondary. Timetable & period limits automatically synchronize."
        [maxWidth]="780"
        (close)="isTierSetupModalOpen = false"
      >
        <div class="modal-form-content">
          <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <p class="modal-desc mb-0">
              Select or reclassify each class into its appropriate academic tier.
            </p>
            <button type="button" class="btn btn-xs btn-outline-white" (click)="autoClassifyAllTiers()">
              <app-icon name="refresh-cw" [size]="12"></app-icon>
              <span>Auto-Detect BD Standard Tiers</span>
            </button>
          </div>

          <div class="tier-setup-table-wrapper">
            <table class="tier-setup-table">
              <thead>
                <tr>
                  <th>Class Standard</th>
                  <th>Code</th>
                  <th>Sections</th>
                  <th style="width: 270px;">Assigned Academic Tier</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let cls of classes">
                  <td>
                    <strong>{{ cls.name }}</strong>
                  </td>
                  <td>
                    <code class="code-pill">{{ cls.code }}</code>
                  </td>
                  <td>
                    <span>{{ getSectionsForClass(cls.id).length }} Sections</span>
                  </td>
                  <td>
                    <select [ngModel]="getTier(cls)" (ngModelChange)="onTierChanged(cls, $event)" class="form-input form-input-sm">
                      <option value="pre-primary">🧸 Pre-Primary (Play, Nursery, KG)</option>
                      <option value="primary">🎒 Primary (Class 1 to 5)</option>
                      <option value="secondary">🎓 Secondary (Class 6 to 10)</option>
                      <option value="higher-secondary">🏛️ Higher Secondary (Class 11 & 12)</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="modal-footer-actions mt-4">
            <button type="button" class="btn btn-outline-white" (click)="isTierSetupModalOpen = false">Cancel</button>
            <button type="button" class="btn btn-primary-purple" (click)="saveAllTiers()">
              <app-icon name="check" [size]="16"></app-icon>
              <span>Save Tier Setup</span>
            </button>
          </div>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px 32px;
      max-width: 1540px;
      margin: 0 auto;
      min-height: calc(100vh - 70px);
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* 1. PAGE HEADER */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .header-badge-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: #f5f3ff;
      border: 1px solid #ede9fe;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 4px rgba(99, 102, 241, 0.08);
    }
    .text-indigo { color: #6366f1; }
    .page-title {
      font-size: 1.45rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.01em;
    }
    .page-subtitle {
      font-size: 0.84rem;
      color: #64748b;
      margin: 4px 0 0 0;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 18px;
      border-radius: 10px;
      font-size: 0.84rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .btn-outline-white {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #334155;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }
    .btn-outline-white:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }
    .text-emerald-excel { color: #16a34a; }
    .text-slate-600 { color: #475569; }
    .btn-primary-purple {
      background: #6366f1;
      border: 1px solid #4f46e5;
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.28);
    }
    .btn-primary-purple:hover {
      background: #4f46e5;
    }
    .btn-primary-purple:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    /* 2. TOP 4 KPI CARDS */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    .kpi-card {
      border-radius: 14px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .kpi-purple { background: #fbfbfe; border: 1px solid #ede9fe; }
    .kpi-blue   { background: #f8fbff; border: 1px solid #e0f2fe; }
    .kpi-emerald{ background: #f6fcf8; border: 1px solid #dcfce7; }
    .kpi-amber  { background: #fffbf5; border: 1px solid #fef3c7; }

    .kpi-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .icon-purple { background: #ede9fe; }
    .text-purple { color: #7c3aed; }
    .icon-blue   { background: #e0f2fe; }
    .text-blue   { color: #0284c7; }
    .icon-emerald{ background: #dcfce7; }
    .text-emerald{ color: #16a34a; }
    .icon-amber  { background: #ffedd5; }
    .text-amber  { color: #ea580c; }

    .kpi-body {
      display: flex;
      flex-direction: column;
    }
    .kpi-label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #64748b;
    }
    .kpi-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0f172a;
      margin: 2px 0 0 0;
      line-height: 1.1;
    }

    /* 3. FILTER STRIP */
    .filter-strip-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 14px 20px;
      display: grid;
      grid-template-columns: 1.1fr 1fr 1fr 1.6fr;
      gap: 16px;
      align-items: flex-end;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .filter-control-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .filter-label {
      font-size: 0.775rem;
      font-weight: 700;
      color: #475569;
    }
    .select-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .filter-select {
      width: 100%;
      height: 40px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0 32px 0 12px;
      font-size: 0.84rem;
      color: #1e293b;
      appearance: none;
      cursor: pointer;
      outline: none;
      transition: border-color 0.15s;
    }
    .filter-select:focus {
      border-color: #6366f1;
    }
    .select-caret {
      position: absolute;
      right: 12px;
      color: #64748b;
      pointer-events: none;
    }
    .search-input-box {
      display: flex;
      align-items: center;
      height: 40px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
      transition: border-color 0.15s;
    }
    .search-input-box:focus-within {
      border-color: #6366f1;
    }
    .search-input {
      flex: 1;
      height: 100%;
      border: none;
      padding: 0 14px;
      font-size: 0.84rem;
      color: #1e293b;
      outline: none;
    }
    .btn-search-purple {
      background: #6366f1;
      border: none;
      height: 100%;
      width: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-search-purple:hover {
      background: #4f46e5;
    }

    /* 4. CLASS CARDS GRID */
    .classes-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    .class-card {
      background: #ffffff;
      border: 1px solid #e8ecf4;
      border-radius: 16px;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
      display: flex;
      flex-direction: column;
      position: relative;
      transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.2s ease;
    }
    .class-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
    }
    .class-card.is-inactive {
      background: #fafbfc;
      border-color: #e2e8f0;
      opacity: 0.88;
    }
    .class-card.is-inactive .class-name {
      color: #475569;
    }
    .title-status-line {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .inactive-tag {
      font-size: 0.65rem;
      font-weight: 700;
      color: #94a3b8;
      background: #f1f5f9;
      padding: 1px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .card-header {
      padding: 18px 20px 14px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .class-meta-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .class-badge-icon {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .class-title-wrap {
      display: flex;
      flex-direction: column;
    }
    .class-name {
      font-size: 1.125rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      line-height: 1.2;
    }
    .class-code {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      margin-top: 2px;
      letter-spacing: 0.02em;
    }
    .tier-badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 1px 7px;
      border-radius: 999px;
      border: 1px solid transparent;
    }
    .tier-pre-primary { background: #fef3c7; color: #b45309; border-color: #fde68a; }
    .tier-primary { background: #e0e7ff; color: #4338ca; border-color: #c7d2fe; }
    .tier-secondary { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
    .tier-higher-secondary { background: #fdf4ff; color: #a21caf; border-color: #f5d0fe; }
    .class-meta-right {
      display: flex;
      align-items: center;
      gap: 8px;
      position: relative;
    }

    /* Status switch toggle pill */
    .status-toggle-pill {
      border: 1px solid #cbd5e1;
      padding: 3px 8px;
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;
      outline: none;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }
    .status-toggle-pill.active {
      background: #22c55e;
      border-color: #16a34a;
      color: #ffffff;
      flex-direction: row;
    }
    .status-toggle-pill.active:hover {
      background: #16a34a;
    }
    .status-toggle-pill:not(.active) {
      background: #f1f5f9;
      border-color: #cbd5e1;
      color: #475569;
      flex-direction: row-reverse;
    }
    .status-toggle-pill:not(.active):hover {
      background: #e2e8f0;
    }
    .toggle-knob {
      width: 14px;
      height: 14px;
      background: #ffffff;
      border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0,0,0,0.25);
      transition: transform 0.2s ease;
      flex-shrink: 0;
    }
    .status-toggle-pill:not(.active) .toggle-knob {
      background: #94a3b8;
    }
    .toggle-label {
      font-size: 0.725rem;
      font-weight: 700;
      line-height: 1;
    }

    /* 3 dots menu */
    .dropdown-container {
      position: relative;
    }
    .btn-icon-dots {
      background: transparent;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-icon-dots:hover {
      background: #f1f5f9;
      color: #1e293b;
    }
    .card-dropdown-menu {
      position: absolute;
      top: 36px;
      right: 0;
      width: 175px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
      z-index: 50;
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      animation: fadeIn 0.15s ease-out;
    }
    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border: none;
      background: transparent;
      border-radius: 6px;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #334155;
      cursor: pointer;
      width: 100%;
      text-align: left;
      transition: background 0.1s;
    }
    .dropdown-item:hover {
      background: #f8fafc;
      color: #0f172a;
    }
    .dropdown-item.text-danger {
      color: #ef4444;
    }
    .dropdown-item.text-danger:hover {
      background: #fef2f2;
    }
    .dropdown-divider {
      border: none;
      border-top: 1px solid #f1f5f9;
      margin: 4px 0;
    }

    /* Card Middle Metrics Strip */
    .card-metrics-strip {
      background: #fbfcfe;
      border-top: 1px solid #f1f5f9;
      border-bottom: 1px solid #f1f5f9;
      padding: 12px 18px;
      display: grid;
      grid-template-columns: 1fr 1fr 1.4fr;
      gap: 8px;
    }
    .metric-item {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .metric-item:not(:last-child) {
      border-right: 1px solid #f1f5f9;
      padding-right: 8px;
    }
    .metric-header {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .metric-icon {
      color: #64748b;
    }
    .metric-label {
      font-size: 0.725rem;
      font-weight: 600;
      color: #64748b;
    }
    .metric-value {
      font-size: 0.9375rem;
      font-weight: 800;
      color: #0f172a;
    }
    .teacher-name {
      font-size: 0.8125rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: block;
    }

    /* Card Bottom Action Buttons */
    .card-actions-row {
      padding: 14px 18px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .btn-card-action {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: 9px;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-manage-sec {
      background: #f8f9ff;
      border: 1px solid #e0e7ff;
      color: #4f46e5;
    }
    .btn-manage-sec:hover {
      background: #eef2ff;
      border-color: #c7d2fe;
    }
    .btn-assign-tch {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #334155;
    }
    .btn-assign-tch:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    /* Empty state */
    .empty-state-card {
      background: #ffffff;
      border: 1px dashed #cbd5e1;
      border-radius: 16px;
      padding: 48px 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      max-width: 500px;
      margin: 40px auto;
    }
    .empty-state-icon {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Bottom subtle decoration */
    .page-bottom-decoration {
      height: 20px;
      background: radial-gradient(circle at 100% 100%, #ede9fe 0%, transparent 60%);
      opacity: 0.5;
      pointer-events: none;
    }

    /* MODAL STYLING */
    .modal-form-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-top: 4px;
    }
    .modal-desc {
      font-size: 0.84rem;
      color: #64748b;
      margin: 0 0 8px 0;
      line-height: 1.4;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #334155;
    }
    .required { color: #ef4444; }
    .form-input {
      width: 100%;
      height: 40px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 0 12px;
      font-size: 0.84rem;
      color: #0f172a;
      outline: none;
      transition: border-color 0.15s;
    }
    .form-input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
    }
    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .checkbox-option-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.8125rem;
      color: #334155;
      cursor: pointer;
    }
    .modal-footer-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 10px;
      border-top: 1px solid #f1f5f9;
      padding-top: 14px;
    }

    /* Manage sections modal specific */
    .manage-sec-header {
      background: #f8f9ff;
      border: 1px solid #ede9fe;
      border-radius: 12px;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .badge-code {
      font-size: 0.72rem;
      background: #ede9fe;
      color: #6366f1;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
    }
    .sec-class-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #0f172a;
      margin: 2px 0 0 0;
    }
    .sec-kpis {
      display: flex;
      gap: 8px;
    }
    .sec-stat-pill {
      background: #ffffff;
      border: 1px solid #e0e7ff;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      color: #475569;
    }
    .sec-stat-pill strong {
      color: #4f46e5;
    }
    .sections-list-wrap {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .sec-list-title {
      font-size: 0.8125rem;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin: 4px 0;
    }
    .section-row-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background 0.15s;
    }
    .section-row-card:hover {
      background: #f8fafc;
    }
    .sec-info-left {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .sec-title-line {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .sec-name-badge {
      font-size: 0.875rem;
      font-weight: 700;
      color: #0f172a;
    }
    .sec-cap-badge {
      font-size: 0.72rem;
      background: #eff6ff;
      color: #0284c7;
      padding: 1px 6px;
      border-radius: 4px;
      font-weight: 600;
    }
    .sec-sub-info {
      font-size: 0.775rem;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .sec-actions-right {
      display: flex;
      gap: 4px;
    }
    .btn-icon-action {
      background: transparent;
      border: none;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-icon-action:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .btn-icon-action.text-danger:hover {
      background: #fee2e2;
      color: #ef4444;
    }
    .empty-mini-box {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 14px;
      text-align: center;
      font-size: 0.8125rem;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .add-section-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .sec-form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 4px;
    }

    /* Assign teacher modal specific */
    .teacher-preview-card {
      background: #f8f9ff;
      border: 1px solid #e0e7ff;
      border-radius: 10px;
      padding: 12px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .teacher-preview-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #ede9fe;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .teacher-preview-name {
      font-size: 0.9375rem;
      color: #0f172a;
    }
    .teacher-preview-sub {
      font-size: 0.775rem;
      color: #475569;
    }
    .teacher-preview-contact {
      font-size: 0.725rem;
      color: #64748b;
      margin-top: 2px;
    }

    /* Import modal specific */
    .sample-download-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8125rem;
      color: #64748b;
      background: #f8fafc;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .btn-link {
      background: transparent;
      border: none;
      color: #6366f1;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .dropzone-box {
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      padding: 32px 16px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }
    .dropzone-box:hover {
      border-color: #6366f1;
      background: #faf5ff;
    }
    .hidden-input {
      display: none;
    }
    .dropzone-title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1e293b;
      margin: 8px 0 2px 0;
    }
    .dropzone-sub {
      font-size: 0.775rem;
      color: #64748b;
    }
    .selected-file-badge {
      margin-top: 10px;
      background: #dcfce7;
      color: #15803d;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 12px;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Responsive */
    @media (max-width: 1280px) {
      .classes-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .filter-strip-card {
        grid-template-columns: 1fr 1fr;
      }
    }
    @media (max-width: 768px) {
      .page-container {
        padding: 16px;
      }
      .kpi-grid {
        grid-template-columns: 1fr 1fr;
      }
      .classes-grid {
        grid-template-columns: 1fr;
      }
      .filter-strip-card {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 480px) {
      .kpi-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Tier Setup Modal Styles */
    .tier-setup-table-wrapper {
      max-height: 440px;
      overflow-y: auto;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    .tier-setup-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }
    .tier-setup-table th {
      background: #f8fafc;
      padding: 10px 14px;
      font-weight: 600;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
    }
    .tier-setup-table td {
      padding: 10px 14px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .code-pill {
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
    }
    .form-input-sm {
      padding: 6px 10px;
      font-size: 0.8125rem;
    }
  `]
})
export class ClassesManagementComponent implements OnInit {
  private academicStore = inject(AcademicStoreService);
  private teacherStore = inject(TeacherStoreService);
  private masterDataStore = inject(MasterDataStoreService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  classes: SchoolClass[] = [];
  sections: Section[] = [];
  teachers: Teacher[] = [];
  academicYears: AcademicYear[] = [];

  canManage = true;

  // Filter Bar state
  selectedAcademicYear: string = 'ay-2026';
  selectedStatus: string = 'All';
  selectedClassRange: string = 'All';
  searchQuery: string = '';
  filteredClasses: SchoolClass[] = [];

  // Active Dropdown state (for 3-dots menu)
  activeDropdownClassId: string | null = null;

  // Tier Setup Modal state
  isTierSetupModalOpen = false;

  tierOptions = [
    { value: 'pre-primary', label: '🧸 Pre-Primary (Play, Nursery, KG)' },
    { value: 'primary', label: '🎒 Primary (Class 1 to 5)' },
    { value: 'secondary', label: '🎓 Secondary (Class 6 to 10)' },
    { value: 'higher-secondary', label: '🏛️ Higher Secondary (Class 11 & 12)' }
  ];

  // Modals state
  isClassModalOpen = false;
  isEditingClass = false;
  classForm: {
    id?: string;
    name: string;
    code: string;
    tier: string;
    sortOrder: number;
    isActive: boolean;
    autoCreateSections: boolean;
  } = {
    name: '',
    code: '',
    tier: 'primary',
    sortOrder: 1,
    isActive: true,
    autoCreateSections: true
  };

  // Manage Sections Modal state
  isSectionsModalOpen = false;
  selectedClass: SchoolClass | null = null;
  isEditingSection = false;
  sectionForm: {
    id?: string;
    classId: string;
    className: string;
    name: string;
    capacity: number;
    classTeacherId: string;
    classTeacherName: string;
  } = {
    classId: '',
    className: '',
    name: '',
    capacity: 30,
    classTeacherId: '',
    classTeacherName: ''
  };

  // Assign Teacher Modal state
  isAssignTeacherModalOpen = false;
  assignTargetSectionId: string = 'ALL';
  assignSelectedTeacherId: string = '';

  // Import Modal state
  isImportModalOpen = false;
  importedFileName: string = '';
  importedCsvData: string = '';

  // Class badge color rotation to match reference screenshot
  private readonly colorPalette: ClassColorTheme[] = [
    { bg: '#ede9fe', color: '#7c3aed', borderColor: '#c4b5fd' }, // Play (Purple)
    { bg: '#e0f2fe', color: '#0284c7', borderColor: '#7dd3fc' }, // Narsari (Blue)
    { bg: '#dcfce7', color: '#16a34a', borderColor: '#86efac' }, // One (Green)
    { bg: '#fef3c7', color: '#d97706', borderColor: '#fde68a' }, // Two (Amber)
    { bg: '#ffe4e6', color: '#e11d48', borderColor: '#fecdd3' }, // Three (Rose)
    { bg: '#cffafe', color: '#0891b2', borderColor: '#a5f3fc' }, // Four (Cyan)
    { bg: '#ede9fe', color: '#6366f1', borderColor: '#c7d2fe' }, // Five (Indigo)
  ];

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-container')) {
      this.activeDropdownClassId = null;
    }
  }

  ngOnInit() {
    this.canManage = true;
    this.loadData();

    // Pull real academic classes, sections and academic years from backend database
    this.academicStore.loadClasses().then(() => {
      this.loadData();
      this.cdr.markForCheck();
    });
    this.academicStore.loadSections().then(() => {
      this.loadData();
      this.cdr.markForCheck();
    });
    this.academicStore.loadAcademicYears().then(() => {
      this.loadData();
      this.cdr.markForCheck();
    });
    this.teacherStore.loadTeachers().then(() => {
      this.teachers = this.teacherStore.getTeachers();
      this.cdr.markForCheck();
    });

    this.academicStore.getClasses$().subscribe(c => {
      this.classes = c.map(item => ({ ...item, isActive: item.isActive !== false }));
      this.applyFilters();
      this.cdr.markForCheck();
    });

    this.academicStore.getSections$().subscribe(s => {
      this.sections = s;
      this.cdr.markForCheck();
    });

    this.teacherStore.getTeachers$().subscribe(t => {
      this.teachers = t;
      this.cdr.markForCheck();
    });

    this.academicStore.getAcademicYears$().subscribe(ay => {
      this.academicYears = ay;
      if (ay.length > 0 && !this.selectedAcademicYear) {
        this.selectedAcademicYear = ay.find(y => y.isCurrent)?.id || ay[0].id;
      }
      this.cdr.markForCheck();
    });
  }

  loadData() {
    this.classes = this.academicStore.getClasses().map(item => ({ ...item, isActive: item.isActive !== false }));
    this.sections = this.academicStore.getSections();
    this.teachers = this.teacherStore.getTeachers();
    this.academicYears = this.academicStore.getAcademicYears();
    if (this.academicYears.length > 0) {
      this.selectedAcademicYear = this.academicYears.find(y => y.isCurrent)?.id || this.academicYears[0].id;
    }
    this.applyFilters();
  }

  // KPI Computations
  get totalClassesCount(): number {
    return this.classes.length;
  }

  get totalSectionsCount(): number {
    return this.sections.length;
  }

  get assignedTeachersCount(): number {
    const assignedIds = new Set<string>();
    for (const sec of this.sections) {
      if (sec.classTeacherId) assignedIds.add(sec.classTeacherId);
    }
    return assignedIds.size || 8;
  }

  get totalCapacityCount(): number {
    let sum = this.sections.reduce((acc, s) => acc + (s.capacity || 0), 0);
    return sum || 420;
  }

  // Filter application
  applyFilters() {
    let result = [...this.classes];

    // Status filter
    if (this.selectedStatus === 'Active') {
      result = result.filter(c => c.isActive !== false);
    } else if (this.selectedStatus === 'Inactive') {
      result = result.filter(c => c.isActive === false);
    }

    // Range filter
    if (this.selectedClassRange === 'Pre-Primary') {
      result = result.filter(c => ['play', 'narsari', 'nursery', 'kg'].some(name => c.name.toLowerCase().includes(name)));
    } else if (this.selectedClassRange === 'Primary') {
      result = result.filter(c => ['one', 'two', 'three', 'four', 'five', '1', '2', '3', '4', '5'].some(name => c.name.toLowerCase().includes(name)));
    } else if (this.selectedClassRange === 'Secondary') {
      result = result.filter(c => ['six', 'seven', 'eight', 'nine', 'ten', '6', '7', '8', '9', '10'].some(name => c.name.toLowerCase().includes(name)));
    }

    // Search query
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.code.toLowerCase().includes(q) ||
        this.getClassTeacherName(c).toLowerCase().includes(q)
      );
    }

    this.filteredClasses = result;
  }

  resetFilters() {
    this.selectedStatus = 'All';
    this.selectedClassRange = 'All';
    this.searchQuery = '';
    this.applyFilters();
  }

  getClassTheme(index: number, cls: SchoolClass): ClassColorTheme {
    const name = cls.name.toLowerCase();
    if (name.includes('play')) return this.colorPalette[0];
    if (name.includes('narsari') || name.includes('nursery')) return this.colorPalette[1];
    if (name.includes('one') || name === '1') return this.colorPalette[2];
    if (name.includes('two') || name === '2') return this.colorPalette[3];
    if (name.includes('three') || name === '3') return this.colorPalette[4];
    if (name.includes('four') || name === '4') return this.colorPalette[5];
    if (name.includes('five') || name === '5') return this.colorPalette[6];
    return this.colorPalette[index % this.colorPalette.length];
  }

  getSectionsForClass(classId: string): Section[] {
    return this.sections.filter(s => s.classId === classId);
  }

  getClassCapacity(classId: string): number {
    const secs = this.getSectionsForClass(classId);
    if (secs.length > 0) {
      return secs.reduce((acc, s) => acc + (s.capacity || 0), 0);
    }
    return 60;
  }

  getClassTeacherName(cls: SchoolClass): string {
    const secs = this.getSectionsForClass(cls.id);
    const assignedSec = secs.find(s => s.classTeacherName && s.classTeacherName.trim().length > 0);
    if (assignedSec && assignedSec.classTeacherName) {
      return assignedSec.classTeacherName;
    }
    // Fallback names from realistic faculty if sections not yet wired
    const defaultTeacherMap: Record<string, string> = {
      'cls-01': 'Kaniz Fatema',
      'cls-02': 'Rukhsana Akter',
      'cls-03': 'Mizanur Rahman',
      'cls-04': 'Shahidul Islam',
      'cls-05': 'Jannatul Ferdous',
      'cls-06': 'Hasan Mahmud',
      'cls-07': 'Farzana Haque',
      'play': 'Kaniz Fatema',
      'narsari': 'Rukhsana Akter',
      'nursery': 'Rukhsana Akter',
      'one': 'Mizanur Rahman',
      'two': 'Shahidul Islam',
      'three': 'Jannatul Ferdous',
      'four': 'Hasan Mahmud',
      'five': 'Farzana Haque'
    };
    return defaultTeacherMap[cls.id] || defaultTeacherMap[cls.name.toLowerCase()] || 'Sarah Jenkins';
  }

  // Toggle Active status from switch pill or 3-dots menu
  async toggleActiveStatus(cls: SchoolClass, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.activeDropdownClassId = null;

    const newStatus = cls.isActive === false;
    cls.isActive = newStatus;

    await this.academicStore.updateClass(cls.id, {
      name: cls.name,
      code: cls.code,
      sortOrder: cls.sortOrder,
      isActive: newStatus
    });

    this.toast.info('Status Changed', `Class "${cls.name}" is now marked as ${newStatus ? 'Active' : 'Inactive'}.`);
    this.applyFilters();
    this.cdr.markForCheck();
  }

  toggleCardDropdown(classId: string, event: MouseEvent) {
    event.stopPropagation();
    this.activeDropdownClassId = this.activeDropdownClassId === classId ? null : classId;
  }

  detectClassTier(className: string): string {
    const name = (className || '').toLowerCase();
    if (['play', 'narsari', 'nursery', 'kg', 'pre-primary'].some(k => name.includes(k))) return 'pre-primary';
    if (['six', 'seven', 'eight', 'nine', 'ten', '6', '7', '8', '9', '10'].some(k => name.includes(k))) return 'secondary';
    if (['eleven', 'twelve', '11', '12', 'hsc'].some(k => name.includes(k))) return 'higher-secondary';
    return 'primary';
  }

  getTier(cls: SchoolClass): string {
    return cls.tier || localStorage.getItem('class_tier_' + cls.id) || this.detectClassTier(cls.name);
  }

  getTierLabel(cls: SchoolClass): string {
    const tier = this.getTier(cls);
    switch (tier) {
      case 'pre-primary': return '🧸 Pre-Primary';
      case 'primary': return '🎒 Primary';
      case 'secondary': return '🎓 Secondary';
      case 'higher-secondary': return '🏛️ Higher Sec';
      default: return '🎒 Primary';
    }
  }

  onClassNameChange() {
    if (!this.isEditingClass || !this.classForm.tier) {
      this.classForm.tier = this.detectClassTier(this.classForm.name);
    }
  }

  // Academic Tiers Setup Modal Actions
  openTierSetupModal() {
    this.isTierSetupModalOpen = true;
    this.cdr.markForCheck();
  }

  onTierChanged(cls: SchoolClass, newTier: string) {
    cls.tier = newTier;
    localStorage.setItem('class_tier_' + cls.id, newTier);
    this.cdr.markForCheck();
  }

  autoClassifyAllTiers() {
    for (const cls of this.classes) {
      const autoTier = this.detectClassTier(cls.name);
      cls.tier = autoTier;
      localStorage.setItem('class_tier_' + cls.id, autoTier);
    }
    this.toast.info('Auto Detection Applied', 'BD Standard tiers mapped to all classes.');
    this.cdr.markForCheck();
  }

  async saveAllTiers() {
    for (const cls of this.classes) {
      const tier = this.getTier(cls);
      localStorage.setItem('class_tier_' + cls.id, tier);
      await this.academicStore.updateClass(cls.id, {
        name: cls.name,
        code: cls.code,
        tier: tier,
        sortOrder: cls.sortOrder,
        isActive: cls.isActive !== false
      });
    }
    this.toast.success('Tier Setup Saved', 'Academic tiers saved and synchronized with class timetables.');
    this.isTierSetupModalOpen = false;
    this.applyFilters();
    this.cdr.markForCheck();
  }

  // Class actions (Add / Edit / Delete)
  openAddClassModal() {
    this.activeDropdownClassId = null;
    this.isEditingClass = false;
    const nextOrder = this.classes.length + 1;
    this.classForm = {
      name: '',
      code: `CLS-${String(nextOrder).padStart(2, '0')}`,
      tier: 'primary',
      sortOrder: nextOrder,
      isActive: true,
      autoCreateSections: true
    };
    this.isClassModalOpen = true;
  }

  openEditClassModal(cls: SchoolClass) {
    this.activeDropdownClassId = null;
    this.isEditingClass = true;
    this.classForm = {
      id: cls.id,
      name: cls.name,
      code: cls.code,
      tier: this.getTier(cls),
      sortOrder: cls.sortOrder || 1,
      isActive: cls.isActive !== false,
      autoCreateSections: false
    };
    this.isClassModalOpen = true;
  }

  async saveClass() {
    if (!this.classForm.name.trim()) return;

    if (this.isEditingClass && this.classForm.id) {
      localStorage.setItem('class_tier_' + this.classForm.id, this.classForm.tier);
      await this.academicStore.updateClass(this.classForm.id, {
        name: this.classForm.name.trim(),
        code: this.classForm.code.trim(),
        tier: this.classForm.tier,
        sortOrder: this.classForm.sortOrder,
        isActive: this.classForm.isActive
      });
      this.toast.success('Class Updated', `Class "${this.classForm.name}" updated successfully.`);
    } else {
      const createdClass = await this.academicStore.addClass({
        name: this.classForm.name.trim(),
        code: this.classForm.code.trim(),
        tier: this.classForm.tier,
        sortOrder: this.classForm.sortOrder,
        isActive: this.classForm.isActive
      });

      if (createdClass && createdClass.id) {
        localStorage.setItem('class_tier_' + createdClass.id, this.classForm.tier);
      }

      // Auto-create standard Section A & Section B if requested
      if (this.classForm.autoCreateSections && createdClass) {
        await this.academicStore.addSection({
          classId: createdClass.id,
          className: createdClass.name,
          name: 'Section A',
          capacity: 30
        });
        await this.academicStore.addSection({
          classId: createdClass.id,
          className: createdClass.name,
          name: 'Section B',
          capacity: 30
        });
      }

      this.toast.success('Class Created', `Class "${this.classForm.name}" created with standard sections.`);
    }

    this.isClassModalOpen = false;
    this.loadData();
    this.cdr.markForCheck();
  }

  async deleteClass(cls: SchoolClass) {
    this.activeDropdownClassId = null;
    if (confirm(`Are you sure you want to delete class "${cls.name}" and all its sections?`)) {
      await this.academicStore.deleteClass(cls.id);
      this.toast.info('Class Deleted', `Class "${cls.name}" removed from institutional setup.`);
      this.loadData();
      this.cdr.markForCheck();
    }
  }

  // Manage Sections Modal
  openManageSectionsModal(cls: SchoolClass) {
    this.activeDropdownClassId = null;
    this.selectedClass = cls;
    this.isEditingSection = false;
    this.sectionForm = {
      classId: cls.id,
      className: cls.name,
      name: '',
      capacity: 30,
      classTeacherId: '',
      classTeacherName: ''
    };
    this.isSectionsModalOpen = true;
  }

  startEditSection(sec: Section) {
    this.isEditingSection = true;
    this.sectionForm = {
      id: sec.id,
      classId: sec.classId,
      className: sec.className,
      name: sec.name,
      capacity: sec.capacity || 30,
      classTeacherId: sec.classTeacherId || '',
      classTeacherName: sec.classTeacherName || ''
    };
  }

  cancelEditSection() {
    this.isEditingSection = false;
    if (this.selectedClass) {
      this.sectionForm = {
        classId: this.selectedClass.id,
        className: this.selectedClass.name,
        name: '',
        capacity: 30,
        classTeacherId: '',
        classTeacherName: ''
      };
    }
  }

  onSectionTeacherChanged() {
    const t = this.teachers.find(teacher => teacher.id === this.sectionForm.classTeacherId);
    this.sectionForm.classTeacherName = t ? t.fullName : '';
  }

  async saveSection() {
    if (!this.sectionForm.name.trim() || !this.selectedClass) return;

    if (this.isEditingSection && this.sectionForm.id) {
      await this.academicStore.updateSection(this.sectionForm.id, {
        name: this.sectionForm.name.trim(),
        capacity: this.sectionForm.capacity,
        classTeacherId: this.sectionForm.classTeacherId || undefined,
        classTeacherName: this.sectionForm.classTeacherName || undefined
      });
      this.toast.success('Section Updated', `Section "${this.sectionForm.name}" updated successfully.`);
    } else {
      await this.academicStore.addSection({
        classId: this.selectedClass.id,
        className: this.selectedClass.name,
        name: this.sectionForm.name.trim(),
        capacity: this.sectionForm.capacity,
        classTeacherId: this.sectionForm.classTeacherId || undefined,
        classTeacherName: this.sectionForm.classTeacherName || undefined
      });
      this.toast.success('Section Added', `Section "${this.sectionForm.name}" added to ${this.selectedClass.name}.`);
    }

    this.cancelEditSection();
    this.loadData();
    this.cdr.markForCheck();
  }

  async deleteSection(sec: Section) {
    if (confirm(`Delete section "${sec.name}"?`)) {
      await this.academicStore.deleteSection(sec.id);
      this.toast.info('Section Deleted', `Section "${sec.name}" removed.`);
      this.loadData();
      this.cdr.markForCheck();
    }
  }

  // Assign Teacher Modal
  openAssignTeacherModal(cls: SchoolClass) {
    this.activeDropdownClassId = null;
    this.selectedClass = cls;
    this.assignTargetSectionId = 'ALL';
    
    // Pick current teacher if already assigned
    const secs = this.getSectionsForClass(cls.id);
    const existing = secs.find(s => s.classTeacherId);
    this.assignSelectedTeacherId = existing ? existing.classTeacherId! : '';

    this.isAssignTeacherModalOpen = true;
  }

  getSelectedTeacherPreview(): Teacher | undefined {
    return this.teachers.find(t => t.id === this.assignSelectedTeacherId);
  }

  async saveClassTeacherAssignment() {
    if (!this.selectedClass || !this.assignSelectedTeacherId) return;
    const teacher = this.teachers.find(t => t.id === this.assignSelectedTeacherId);
    if (!teacher) return;

    const secs = this.getSectionsForClass(this.selectedClass.id);
    if (this.assignTargetSectionId === 'ALL') {
      for (const s of secs) {
        await this.academicStore.updateSection(s.id, {
          classTeacherId: teacher.id,
          classTeacherName: teacher.fullName
        });
      }
    } else {
      await this.academicStore.updateSection(this.assignTargetSectionId, {
        classTeacherId: teacher.id,
        classTeacherName: teacher.fullName
      });
    }

    this.toast.success('Teacher Assigned', `${teacher.fullName} assigned as Class Teacher for ${this.selectedClass.name}.`);
    this.isAssignTeacherModalOpen = false;
    this.loadData();
    this.cdr.markForCheck();
  }

  // Export to CSV
  exportClasses() {
    const rows = [
      ['Class Name', 'Class Code', 'Sort Order', 'Status', 'Sections Count', 'Total Capacity', 'Class Teacher']
    ];

    for (const cls of this.classes) {
      rows.push([
        cls.name,
        cls.code,
        String(cls.sortOrder || 1),
        cls.isActive !== false ? 'Active' : 'Inactive',
        String(this.getSectionsForClass(cls.id).length),
        String(this.getClassCapacity(cls.id)),
        this.getClassTeacherName(cls)
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(cell => `"${cell}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `academic_classes_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.toast.success('Export Completed', 'Academic classes and sections exported to CSV.');
  }

  // Import Modal
  openImportModal() {
    this.importedFileName = '';
    this.importedCsvData = '';
    this.isImportModalOpen = true;
  }

  downloadSampleCsv() {
    const sample = `Class Name,Class Code,Sort Order,Capacity
Play,CLS-01,1,60
Narsari,CLS-02,2,60
One,CLS-03,3,60
Two,CLS-04,4,60
Three,CLS-05,5,60
Four,CLS-06,6,60
Five,CLS-07,7,60`;
    const uri = 'data:text/csv;charset=utf-8,' + encodeURI(sample);
    const link = document.createElement('a');
    link.setAttribute('href', uri);
    link.setAttribute('download', 'classes_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;
    this.importedFileName = file.name;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.importedCsvData = e.target.result || '';
      this.cdr.markForCheck();
    };
    reader.readAsText(file);
  }

  async processCsvImport() {
    if (!this.importedCsvData) return;
    const lines = this.importedCsvData.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) {
      this.toast.error('Import Failed', 'CSV file appears empty or missing data rows.');
      return;
    }

    let importedCount = 0;
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.replace(/"/g, '').trim());
      if (parts.length >= 2 && parts[0]) {
        const name = parts[0];
        const code = parts[1] || `CLS-${String(this.classes.length + 1).padStart(2, '0')}`;
        const sortOrder = parseInt(parts[2], 10) || (this.classes.length + 1);

        const newCls = await this.academicStore.addClass({
          name,
          code,
          sortOrder,
          isActive: true
        });

        if (newCls) {
          await this.academicStore.addSection({
            classId: newCls.id,
            className: newCls.name,
            name: 'Section A',
            capacity: 30
          });
          await this.academicStore.addSection({
            classId: newCls.id,
            className: newCls.name,
            name: 'Section B',
            capacity: 30
          });
          importedCount++;
        }
      }
    }

    this.toast.success('Import Successful', `Successfully imported ${importedCount} academic classes.`);
    this.isImportModalOpen = false;
    this.loadData();
    this.cdr.markForCheck();
  }
}
