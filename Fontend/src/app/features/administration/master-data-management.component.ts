import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MasterDataStoreService } from '../../core/services/stores/master-data-store.service';
import { AdminStoreService } from '../../core/services/stores/admin-store.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import {
  AcademicShift,
  AdmissionCategory,
  Department,
  Designation,
  GradingScale,
  MasterLookupItem,
  AcademicYear,
  Branch
} from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { BadgeComponent } from '../../shared/components/badge.component';

type MasterTab = 'shifts' | 'categories' | 'sessions' | 'departments' | 'designations' | 'grading' | 'lookups' | 'bridges';

@Component({
  selector: 'app-master-data-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent, ModalComponent, BadgeComponent],
  template: `
    <div class="page-container">
      <!-- 1. PAGE HEADER -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-badge-icon">
            <app-icon name="layers" [size]="28" class="text-indigo"></app-icon>
          </div>
          <div>
            <h1 class="page-title">Institutional Master Data & Taxonomy Center</h1>
            <p class="page-subtitle">
              Centrally configure institutional academic shifts, admission quotas, grading scales, faculty departments, designations, and system lookups.
            </p>
          </div>
        </div>

        <div class="header-actions">
          <button type="button" class="btn btn-outline-white" (click)="exportMasterData()">
            <app-icon name="download" [size]="16" class="text-emerald"></app-icon>
            <span>Export Dictionary</span>
          </button>
          
          <button type="button" class="btn btn-primary-purple" (click)="openAddModalForActiveTab()">
            <app-icon name="plus" [size]="16"></app-icon>
            <span>{{ getAddButtonLabel() }}</span>
          </button>
        </div>
      </div>

      <!-- 2. TOP KPI CARDS -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-purple" (click)="activeTab = 'shifts'">
          <div class="kpi-icon-wrap icon-purple">
            <app-icon name="calendar-clock" [size]="22" class="text-purple"></app-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">Academic Shifts</span>
            <h2 class="kpi-value">{{ shifts.length }} Shifts</h2>
            <span class="kpi-sub">{{ getActiveCount(shifts) }} Active</span>
          </div>
        </div>

        <div class="kpi-card kpi-blue" (click)="activeTab = 'categories'">
          <div class="kpi-icon-wrap icon-blue">
            <app-icon name="award" [size]="22" class="text-blue"></app-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">Admission Quotas</span>
            <h2 class="kpi-value">{{ admissionCategories.length }} Categories</h2>
            <span class="kpi-sub">Waiver & Quota Policies</span>
          </div>
        </div>

        <div class="kpi-card kpi-emerald" (click)="activeTab = 'departments'">
          <div class="kpi-icon-wrap icon-emerald">
            <app-icon name="briefcase" [size]="22" class="text-emerald"></app-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">Depts & Designations</span>
            <h2 class="kpi-value">{{ departments.length }} / {{ designations.length }}</h2>
            <span class="kpi-sub">Faculty & Staff Hierarchy</span>
          </div>
        </div>

        <div class="kpi-card kpi-amber" (click)="activeTab = 'grading'">
          <div class="kpi-icon-wrap icon-amber">
            <app-icon name="clipboard-check" [size]="22" class="text-amber"></app-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">Grading & GPA Scales</span>
            <h2 class="kpi-value">{{ gradingScales.length }} Grades</h2>
            <span class="kpi-sub">GPA 5.0 Scale Defined</span>
          </div>
        </div>
      </div>

      <!-- 3. NAVIGATION TABS -->
      <div class="tabs-container">
        <button 
          type="button" 
          class="tab-btn" 
          [class.active]="activeTab === 'shifts'" 
          (click)="activeTab = 'shifts'"
        >
          <app-icon name="calendar-clock" [size]="16"></app-icon>
          <span>Academic Shifts ({{ shifts.length }})</span>
        </button>

        <button 
          type="button" 
          class="tab-btn" 
          [class.active]="activeTab === 'categories'" 
          (click)="activeTab = 'categories'"
        >
          <app-icon name="award" [size]="16"></app-icon>
          <span>Admission Quotas & Categories ({{ admissionCategories.length }})</span>
        </button>

        <button 
          type="button" 
          class="tab-btn" 
          [class.active]="activeTab === 'sessions'" 
          (click)="activeTab = 'sessions'"
        >
          <app-icon name="calendar" [size]="16"></app-icon>
          <span>Academic Sessions ({{ academicYears.length }})</span>
        </button>

        <button 
          type="button" 
          class="tab-btn" 
          [class.active]="activeTab === 'departments'" 
          (click)="activeTab = 'departments'"
        >
          <app-icon name="building" [size]="16"></app-icon>
          <span>Faculty Departments ({{ departments.length }})</span>
        </button>

        <button 
          type="button" 
          class="tab-btn" 
          [class.active]="activeTab === 'designations'" 
          (click)="activeTab = 'designations'"
        >
          <app-icon name="user-check" [size]="16"></app-icon>
          <span>Staff Designations ({{ designations.length }})</span>
        </button>

        <button 
          type="button" 
          class="tab-btn" 
          [class.active]="activeTab === 'grading'" 
          (click)="activeTab = 'grading'"
        >
          <app-icon name="award" [size]="16"></app-icon>
          <span>Grading System ({{ gradingScales.length }})</span>
        </button>

        <button 
          type="button" 
          class="tab-btn" 
          [class.active]="activeTab === 'lookups'" 
          (click)="activeTab = 'lookups'"
        >
          <app-icon name="sliders" [size]="16"></app-icon>
          <span>Demographic Lookups</span>
        </button>

        <button 
          type="button" 
          class="tab-btn" 
          [class.active]="activeTab === 'bridges'" 
          (click)="activeTab = 'bridges'"
        >
          <app-icon name="layers" [size]="16"></app-icon>
          <span>All Master Pages</span>
        </button>
      </div>

      <!-- 4. TAB CONTENTS -->

      <!-- TAB 1: ACADEMIC SHIFTS -->
      <div *ngIf="activeTab === 'shifts'" class="tab-pane">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Institutional Academic Shifts</h3>
              <p class="card-subtitle">Define daily operational shift timings, assigned grade tiers, and campus morning/day periods.</p>
            </div>
            <button type="button" class="btn btn-primary-purple btn-sm" (click)="openAddShiftModal()">
              <app-icon name="plus" [size]="14"></app-icon>
              <span>+ Add Shift</span>
            </button>
          </div>

          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 100px;">Code</th>
                  <th>Shift Title & Bangla Label</th>
                  <th style="width: 220px;">Operating Schedule</th>
                  <th>Description / Academic Scope</th>
                  <th style="width: 110px;">Status</th>
                  <th style="width: 110px; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of shifts">
                  <td><code class="code-pill">{{ s.code }}</code></td>
                  <td>
                    <strong class="row-title">{{ s.name }}</strong>
                    <div class="text-xs text-muted" *ngIf="s.banglaName">{{ s.banglaName }}</div>
                  </td>
                  <td>
                    <div class="time-range-pill">
                      <app-icon name="calendar-clock" [size]="13" class="text-indigo"></app-icon>
                      <span>{{ s.startTime }} – {{ s.endTime }}</span>
                    </div>
                  </td>
                  <td class="text-sm text-slate-600">{{ s.description || 'Standard institutional session schedule' }}</td>
                  <td>
                    <button 
                      type="button" 
                      class="status-pill" 
                      [class.active]="s.isActive" 
                      (click)="toggleShiftStatus(s)"
                    >
                      {{ s.isActive ? 'Active' : 'Inactive' }}
                    </button>
                  </td>
                  <td style="text-align: right;">
                    <div class="action-buttons">
                      <button type="button" class="btn-icon" title="Edit Shift" (click)="openEditShiftModal(s)">
                        <app-icon name="edit" [size]="14"></app-icon>
                      </button>
                      <button type="button" class="btn-icon text-danger" title="Delete Shift" (click)="deleteShift(s)">
                        <app-icon name="trash-2" [size]="14"></app-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 2: ADMISSION CATEGORIES -->
      <div *ngIf="activeTab === 'categories'" class="tab-pane">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Admission Quotas, Categories & Waiver Policies</h3>
              <p class="card-subtitle">Manage reserved seat allocations, sibling concessions, and scholarship waivers used in student enrollment.</p>
            </div>
            <button type="button" class="btn btn-primary-purple btn-sm" (click)="openAddCategoryModal()">
              <app-icon name="plus" [size]="14"></app-icon>
              <span>+ Add Category</span>
            </button>
          </div>

          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 100px;">Code</th>
                  <th>Category Title & Policy Name</th>
                  <th style="width: 120px;">Quota Seat %</th>
                  <th style="width: 140px;">Tuition Waiver %</th>
                  <th>Eligibility Remarks</th>
                  <th style="width: 110px;">Status</th>
                  <th style="width: 110px; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of admissionCategories">
                  <td><code class="code-pill">{{ c.code }}</code></td>
                  <td>
                    <strong class="row-title">{{ c.name }}</strong>
                    <div class="text-xs text-muted" *ngIf="c.banglaName">{{ c.banglaName }}</div>
                  </td>
                  <td>
                    <span class="badge-quota">{{ c.quotaPercentage || 0 }}%</span>
                  </td>
                  <td>
                    <span class="badge-waiver" [class.waiver-full]="(c.discountPercentage || 0) === 100">
                      {{ c.discountPercentage || 0 }}% Waiver
                    </span>
                  </td>
                  <td class="text-sm text-slate-600">{{ c.remarks || 'Standard admission criteria apply' }}</td>
                  <td>
                    <button 
                      type="button" 
                      class="status-pill" 
                      [class.active]="c.isActive" 
                      (click)="toggleCategoryStatus(c)"
                    >
                      {{ c.isActive ? 'Active' : 'Inactive' }}
                    </button>
                  </td>
                  <td style="text-align: right;">
                    <div class="action-buttons">
                      <button type="button" class="btn-icon" title="Edit Category" (click)="openEditCategoryModal(c)">
                        <app-icon name="edit" [size]="14"></app-icon>
                      </button>
                      <button type="button" class="btn-icon text-danger" title="Delete Category" (click)="deleteCategory(c)">
                        <app-icon name="trash-2" [size]="14"></app-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 3: ACADEMIC SESSIONS -->
      <div *ngIf="activeTab === 'sessions'" class="tab-pane">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Academic Years & Calendar Sessions</h3>
              <p class="card-subtitle">Configure academic sessions, set active session for admissions, and archive completed calendar years.</p>
            </div>
            <button type="button" class="btn btn-primary-purple btn-sm" (click)="openAddSessionModal()">
              <app-icon name="plus" [size]="14"></app-icon>
              <span>+ New Session</span>
            </button>
          </div>

          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Session Title</th>
                  <th style="width: 220px;">Calendar Date Range</th>
                  <th style="width: 150px;">Current Status</th>
                  <th style="width: 150px;">Lock State</th>
                  <th style="width: 180px; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let ay of academicYears">
                  <td>
                    <div class="flex items-center gap-2">
                      <app-icon name="calendar" [size]="16" class="text-indigo"></app-icon>
                      <strong class="row-title">{{ ay.name }}</strong>
                    </div>
                  </td>
                  <td class="text-sm text-slate-600">
                    {{ formatDate(ay.startDate) }} – {{ formatDate(ay.endDate) }}
                  </td>
                  <td>
                    <app-badge 
                      [variant]="ay.isCurrent ? 'success' : 'neutral'" 
                      [label]="ay.isCurrent ? 'Active Current' : 'Previous / Upcoming'"
                    ></app-badge>
                  </td>
                  <td>
                    <app-badge 
                      [variant]="ay.isLocked ? 'danger' : 'info'" 
                      [label]="ay.isLocked ? 'Locked / Archived' : 'Unlocked (Editable)'"
                    ></app-badge>
                  </td>
                  <td style="text-align: right;">
                    <div class="action-buttons">
                      <button 
                        *ngIf="!ay.isCurrent" 
                        type="button" 
                        class="btn-text-action" 
                        (click)="setAsCurrentSession(ay)"
                      >
                        Make Current
                      </button>
                      <button 
                        type="button" 
                        class="btn-text-action" 
                        (click)="toggleSessionLock(ay)"
                      >
                        {{ ay.isLocked ? 'Unlock' : 'Lock' }}
                      </button>
                      <button type="button" class="btn-icon text-danger" title="Delete Session" (click)="deleteSession(ay)">
                        <app-icon name="trash-2" [size]="14"></app-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 4: DEPARTMENTS -->
      <div *ngIf="activeTab === 'departments'" class="tab-pane">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Academic & Administrative Departments</h3>
              <p class="card-subtitle">Manage curriculum faculties, academic heads, and department allocations across campus staff.</p>
            </div>
            <button type="button" class="btn btn-primary-purple btn-sm" (click)="openAddDepartmentModal()">
              <app-icon name="plus" [size]="14"></app-icon>
              <span>+ Add Department</span>
            </button>
          </div>

          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 100px;">Code</th>
                  <th>Department Title</th>
                  <th style="width: 200px;">Department Head</th>
                  <th style="width: 120px;">Faculty Count</th>
                  <th>Description</th>
                  <th style="width: 110px;">Status</th>
                  <th style="width: 110px; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let d of departments">
                  <td><code class="code-pill">{{ d.code }}</code></td>
                  <td><strong class="row-title">{{ d.name }}</strong></td>
                  <td>
                    <div class="flex items-center gap-1 text-sm font-semibold text-slate-800">
                      <app-icon name="user" [size]="13" class="text-indigo"></app-icon>
                      <span>{{ d.headTeacherName || 'Not Appointed' }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge-quota">{{ d.teacherCount || 0 }} Faculty</span>
                  </td>
                  <td class="text-sm text-slate-600">{{ d.description || 'Academic curriculum department' }}</td>
                  <td>
                    <button 
                      type="button" 
                      class="status-pill" 
                      [class.active]="d.isActive" 
                      (click)="toggleDepartmentStatus(d)"
                    >
                      {{ d.isActive ? 'Active' : 'Inactive' }}
                    </button>
                  </td>
                  <td style="text-align: right;">
                    <div class="action-buttons">
                      <button type="button" class="btn-icon" title="Edit Department" (click)="openEditDepartmentModal(d)">
                        <app-icon name="edit" [size]="14"></app-icon>
                      </button>
                      <button type="button" class="btn-icon text-danger" title="Delete Department" (click)="deleteDepartment(d)">
                        <app-icon name="trash-2" [size]="14"></app-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 5: DESIGNATIONS -->
      <div *ngIf="activeTab === 'designations'" class="tab-pane">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Institutional Designations & Roles</h3>
              <p class="card-subtitle">Maintain employment designations, hierarchy rankings, and teaching versus non-teaching classifications.</p>
            </div>
            <button type="button" class="btn btn-primary-purple btn-sm" (click)="openAddDesignationModal()">
              <app-icon name="plus" [size]="14"></app-icon>
              <span>+ Add Designation</span>
            </button>
          </div>

          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 80px;">Rank</th>
                  <th style="width: 100px;">Code</th>
                  <th>Designation Title</th>
                  <th style="width: 160px;">Staff Classification</th>
                  <th style="width: 110px;">Status</th>
                  <th style="width: 110px; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let des of designations">
                  <td><span class="rank-pill">#{{ des.rankOrder }}</span></td>
                  <td><code class="code-pill">{{ des.code }}</code></td>
                  <td><strong class="row-title">{{ des.title }}</strong></td>
                  <td>
                    <app-badge 
                      [variant]="des.category === 'Teaching' ? 'success' : (des.category === 'Administrative' ? 'purple' : 'neutral')" 
                      [label]="des.category"
                    ></app-badge>
                  </td>
                  <td>
                    <button 
                      type="button" 
                      class="status-pill" 
                      [class.active]="des.isActive" 
                      (click)="toggleDesignationStatus(des)"
                    >
                      {{ des.isActive ? 'Active' : 'Inactive' }}
                    </button>
                  </td>
                  <td style="text-align: right;">
                    <div class="action-buttons">
                      <button type="button" class="btn-icon" title="Edit Designation" (click)="openEditDesignationModal(des)">
                        <app-icon name="edit" [size]="14"></app-icon>
                      </button>
                      <button type="button" class="btn-icon text-danger" title="Delete Designation" (click)="deleteDesignation(des)">
                        <app-icon name="trash-2" [size]="14"></app-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 6: GRADING & GPA SCALES -->
      <div *ngIf="activeTab === 'grading'" class="tab-pane">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Grading Matrix & GPA Scale Intervals</h3>
              <p class="card-subtitle">Configure institutional examination grade thresholds, GPA points (5.0 scale), and performance remarks.</p>
            </div>
            <button type="button" class="btn btn-primary-purple btn-sm" (click)="openAddGradeScaleModal()">
              <app-icon name="plus" [size]="14"></app-icon>
              <span>+ Add Grade Scale</span>
            </button>
          </div>

          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 100px;">Letter Grade</th>
                  <th style="width: 120px;">Grade Point</th>
                  <th style="width: 160px;">Marks Range</th>
                  <th>Performance Remark</th>
                  <th style="width: 120px;">Result Outcome</th>
                  <th style="width: 110px; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let g of gradingScales">
                  <td>
                    <span class="letter-grade-pill" [class.grade-fail]="!g.isPassing">{{ g.letterGrade }}</span>
                  </td>
                  <td><strong class="gpa-point">{{ g.gradePoint.toFixed(2) }}</strong></td>
                  <td>
                    <span class="marks-range">{{ g.minMarks }}% – {{ g.maxMarks }}%</span>
                  </td>
                  <td class="text-sm font-semibold text-slate-800">{{ g.remarks }}</td>
                  <td>
                    <app-badge 
                      [variant]="g.isPassing ? 'success' : 'danger'" 
                      [label]="g.isPassing ? 'Passed' : 'Failed'"
                    ></app-badge>
                  </td>
                  <td style="text-align: right;">
                    <div class="action-buttons">
                      <button type="button" class="btn-icon" title="Edit Grade" (click)="openEditGradeScaleModal(g)">
                        <app-icon name="edit" [size]="14"></app-icon>
                      </button>
                      <button type="button" class="btn-icon text-danger" title="Delete Grade" (click)="deleteGradeScale(g)">
                        <app-icon name="trash-2" [size]="14"></app-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 7: LOOKUPS & DEMOGRAPHICS -->
      <div *ngIf="activeTab === 'lookups'" class="tab-pane">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Student & Demographic Dropdown Lookups</h3>
              <p class="card-subtitle">Manage standard lookup values for Blood Groups, Religions, Genders, Guardian Relations, and Nationalities.</p>
            </div>
            
            <div class="flex items-center gap-2">
              <select [(ngModel)]="selectedLookupFilter" class="form-input form-input-sm">
                <option value="ALL">All Categories</option>
                <option value="Qualification">Educational Qualifications</option>
                <option value="Religion">Religions</option>
                <option value="BloodGroup">Blood Groups</option>
                <option value="Gender">Genders</option>
                <option value="GuardianRelation">Guardian Relations</option>
              </select>
              <button type="button" class="btn btn-primary-purple btn-sm" (click)="openAddLookupModal()">
                <app-icon name="plus" [size]="14"></app-icon>
                <span>+ Add Item</span>
              </button>
            </div>
          </div>

          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 140px;">Lookup Type</th>
                  <th style="width: 100px;">Code / Key</th>
                  <th>English Display Label</th>
                  <th>Bangla Display Label</th>
                  <th style="width: 90px;">Sort Order</th>
                  <th style="width: 100px;">Status</th>
                  <th style="width: 100px; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let lk of filteredLookups">
                  <td>
                    <span class="type-pill">{{ lk.type }}</span>
                  </td>
                  <td><code class="code-pill">{{ lk.code }}</code></td>
                  <td><strong class="row-title">{{ lk.name }}</strong></td>
                  <td class="text-sm text-slate-600">{{ lk.banglaName || '—' }}</td>
                  <td>{{ lk.displayOrder }}</td>
                  <td>
                    <button 
                      type="button" 
                      class="status-pill" 
                      [class.active]="lk.isActive" 
                      (click)="toggleLookupStatus(lk)"
                    >
                      {{ lk.isActive ? 'Active' : 'Inactive' }}
                    </button>
                  </td>
                  <td style="text-align: right;">
                    <div class="action-buttons">
                      <button type="button" class="btn-icon text-danger" title="Delete Lookup" (click)="deleteLookup(lk)">
                        <app-icon name="trash-2" [size]="14"></app-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 8: ALL MASTER BRIDGES -->
      <div *ngIf="activeTab === 'bridges'" class="tab-pane">
        <div class="grid-3">
          <div class="bridge-card" routerLink="/app/academic/classes">
            <div class="bridge-icon-wrap icon-purple">
              <app-icon name="school" [size]="24" class="text-purple"></app-icon>
            </div>
            <div>
              <h4 class="bridge-title">Classes & Sections Setup</h4>
              <p class="bridge-desc">Academic tiers, class codes, seat capacity, section allocations, and class teachers.</p>
              <span class="bridge-link">Open Classes Setup →</span>
            </div>
          </div>

          <div class="bridge-card" routerLink="/app/academic/subjects">
            <div class="bridge-icon-wrap icon-blue">
              <app-icon name="book-open" [size]="24" class="text-blue"></app-icon>
            </div>
            <div>
              <h4 class="bridge-title">Curriculum Subjects Catalog</h4>
              <p class="bridge-desc">Subject syllabus, compulsory/optional types, pass mark benchmarks, and grade mapping.</p>
              <span class="bridge-link">Open Subjects Setup →</span>
            </div>
          </div>

          <div class="bridge-card" routerLink="/app/finance/structure">
            <div class="bridge-icon-wrap icon-emerald">
              <app-icon name="circle-dollar-sign" [size]="24" class="text-emerald"></app-icon>
            </div>
            <div>
              <h4 class="bridge-title">Fee Structures & Heads</h4>
              <p class="bridge-desc">Monthly tuition schedules, admission fees, session dues, and invoice generation tariffs.</p>
              <span class="bridge-link">Open Fee Structures →</span>
            </div>
          </div>

          <div class="bridge-card" routerLink="/app/admin/school-setup">
            <div class="bridge-icon-wrap icon-amber">
              <app-icon name="building" [size]="24" class="text-amber"></app-icon>
            </div>
            <div>
              <h4 class="bridge-title">Campus Branches & EIIN</h4>
              <p class="bridge-desc">Multi-campus isolation, branch contact info, physical premises, and institutional profile.</p>
              <span class="bridge-link">Open School Setup →</span>
            </div>
          </div>

          <div class="bridge-card" routerLink="/app/exams/setup">
            <div class="bridge-icon-wrap icon-purple">
              <app-icon name="award" [size]="24" class="text-purple"></app-icon>
            </div>
            <div>
              <h4 class="bridge-title">Examinations & Terms</h4>
              <p class="bridge-desc">Mid-term, final term, model tests, exam timetable schedules, and marks distribution.</p>
              <span class="bridge-link">Open Exam Setup →</span>
            </div>
          </div>

          <div class="bridge-card" routerLink="/app/academic/routine">
            <div class="bridge-icon-wrap icon-blue">
              <app-icon name="calendar-clock" [size]="24" class="text-blue"></app-icon>
            </div>
            <div>
              <h4 class="bridge-title">Timetable & Period Engine</h4>
              <p class="bridge-desc">Weekly class routine, period slots, faculty allocation, and classroom rooms.</p>
              <span class="bridge-link">Open Timetable Engine →</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= MODALS ================= -->

      <!-- 1. SHIFT MODAL -->
      <app-modal [isOpen]="isShiftModalOpen" [title]="isEditingShift ? 'Edit Academic Shift' : 'Add New Academic Shift'" (close)="isShiftModalOpen = false">
        <form (ngSubmit)="saveShift()" class="modal-form">
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Shift Title <span class="required">*</span></label>
              <input type="text" [(ngModel)]="shiftForm.name" name="shiftName" class="form-input" placeholder="e.g. Morning Shift" required />
            </div>
            <div class="form-group">
              <label class="form-label">Shift Code <span class="required">*</span></label>
              <input type="text" [(ngModel)]="shiftForm.code" name="shiftCode" class="form-input" placeholder="e.g. MORN, DAY" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Bangla Title</label>
            <input type="text" [(ngModel)]="shiftForm.banglaName" name="shiftBangla" class="form-input" placeholder="e.g. প্রভাতী শাখা" />
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Start Time</label>
              <input type="text" [(ngModel)]="shiftForm.startTime" name="shiftStart" class="form-input" placeholder="e.g. 07:30 AM" />
            </div>
            <div class="form-group">
              <label class="form-label">End Time</label>
              <input type="text" [(ngModel)]="shiftForm.endTime" name="shiftEnd" class="form-input" placeholder="e.g. 11:45 AM" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Description / Academic Tier</label>
            <input type="text" [(ngModel)]="shiftForm.description" name="shiftDesc" class="form-input" placeholder="e.g. Pre-Primary to Class 5" />
          </div>

          <div class="form-group">
            <label class="form-label">Status</label>
            <select [(ngModel)]="shiftForm.isActive" name="shiftStatus" class="form-input">
              <option [ngValue]="true">Active</option>
              <option [ngValue]="false">Inactive</option>
            </select>
          </div>

          <div class="modal-footer-actions">
            <button type="button" class="btn btn-outline-white" (click)="isShiftModalOpen = false">Cancel</button>
            <button type="submit" class="btn btn-primary-purple" [disabled]="!shiftForm.name.trim()">
              <span>{{ isEditingShift ? 'Update Shift' : 'Save Shift' }}</span>
            </button>
          </div>
        </form>
      </app-modal>

      <!-- 2. CATEGORY MODAL -->
      <app-modal [isOpen]="isCategoryModalOpen" [title]="isEditingCategory ? 'Edit Admission Category' : 'Add Admission Category'" (close)="isCategoryModalOpen = false">
        <form (ngSubmit)="saveCategory()" class="modal-form">
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Category Title <span class="required">*</span></label>
              <input type="text" [(ngModel)]="categoryForm.name" name="catName" class="form-input" placeholder="e.g. Merit Scholarship" required />
            </div>
            <div class="form-group">
              <label class="form-label">Category Code <span class="required">*</span></label>
              <input type="text" [(ngModel)]="categoryForm.code" name="catCode" class="form-input" placeholder="e.g. MERIT, GEN" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Bangla Title</label>
            <input type="text" [(ngModel)]="categoryForm.banglaName" name="catBangla" class="form-input" placeholder="e.g. মেধা বৃত্তি কোটা" />
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Quota Percentage (%)</label>
              <input type="number" [(ngModel)]="categoryForm.quotaPercentage" name="catQuota" class="form-input" min="0" max="100" />
            </div>
            <div class="form-group">
              <label class="form-label">Fee Waiver (%)</label>
              <input type="number" [(ngModel)]="categoryForm.discountPercentage" name="catDisc" class="form-input" min="0" max="100" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Eligibility Remarks / Terms</label>
            <textarea rows="2" [(ngModel)]="categoryForm.remarks" name="catRemarks" class="form-input" placeholder="Specific documentation required or criteria"></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Status</label>
            <select [(ngModel)]="categoryForm.isActive" name="catStatus" class="form-input">
              <option [ngValue]="true">Active</option>
              <option [ngValue]="false">Inactive</option>
            </select>
          </div>

          <div class="modal-footer-actions">
            <button type="button" class="btn btn-outline-white" (click)="isCategoryModalOpen = false">Cancel</button>
            <button type="submit" class="btn btn-primary-purple" [disabled]="!categoryForm.name.trim()">
              <span>{{ isEditingCategory ? 'Update Category' : 'Save Category' }}</span>
            </button>
          </div>
        </form>
      </app-modal>

      <!-- 3. DEPARTMENT MODAL -->
      <app-modal [isOpen]="isDepartmentModalOpen" [title]="isEditingDepartment ? 'Edit Department' : 'Add Academic Department'" (close)="isDepartmentModalOpen = false">
        <form (ngSubmit)="saveDepartment()" class="modal-form">
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Department Title <span class="required">*</span></label>
              <input type="text" [(ngModel)]="departmentForm.name" name="deptName" class="form-input" placeholder="e.g. Department of Physical Sciences" required />
            </div>
            <div class="form-group">
              <label class="form-label">Department Code <span class="required">*</span></label>
              <input type="text" [(ngModel)]="departmentForm.code" name="deptCode" class="form-input" placeholder="e.g. SCI, MATH" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Head of Department (Faculty)</label>
            <input type="text" [(ngModel)]="departmentForm.headTeacherName" name="deptHead" class="form-input" placeholder="Faculty member name" />
          </div>

          <div class="form-group">
            <label class="form-label">Description / Scope</label>
            <input type="text" [(ngModel)]="departmentForm.description" name="deptDesc" class="form-input" placeholder="e.g. Physics, Chemistry curriculum" />
          </div>

          <div class="modal-footer-actions">
            <button type="button" class="btn btn-outline-white" (click)="isDepartmentModalOpen = false">Cancel</button>
            <button type="submit" class="btn btn-primary-purple" [disabled]="!departmentForm.name.trim()">
              <span>{{ isEditingDepartment ? 'Update Department' : 'Save Department' }}</span>
            </button>
          </div>
        </form>
      </app-modal>

      <!-- 4. DESIGNATION MODAL -->
      <app-modal [isOpen]="isDesignationModalOpen" [title]="isEditingDesignation ? 'Edit Designation' : 'Add Staff Designation'" (close)="isDesignationModalOpen = false">
        <form (ngSubmit)="saveDesignation()" class="modal-form">
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Designation Title <span class="required">*</span></label>
              <input type="text" [(ngModel)]="designationForm.title" name="desTitle" class="form-input" placeholder="e.g. Senior Faculty Teacher" required />
            </div>
            <div class="form-group">
              <label class="form-label">Designation Code <span class="required">*</span></label>
              <input type="text" [(ngModel)]="designationForm.code" name="desCode" class="form-input" placeholder="e.g. ST, AP" required />
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Staff Classification</label>
              <select [(ngModel)]="designationForm.category" name="desCat" class="form-input">
                <option value="Teaching">Teaching</option>
                <option value="Administrative">Administrative</option>
                <option value="Non-Teaching">Non-Teaching / Support</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Hierarchy Rank Order</label>
              <input type="number" [(ngModel)]="designationForm.rankOrder" name="desRank" class="form-input" min="1" max="50" />
            </div>
          </div>

          <div class="modal-footer-actions">
            <button type="button" class="btn btn-outline-white" (click)="isDesignationModalOpen = false">Cancel</button>
            <button type="submit" class="btn btn-primary-purple" [disabled]="!designationForm.title.trim()">
              <span>{{ isEditingDesignation ? 'Update Designation' : 'Save Designation' }}</span>
            </button>
          </div>
        </form>
      </app-modal>

      <!-- 5. GRADING SCALE MODAL -->
      <app-modal [isOpen]="isGradingModalOpen" [title]="isEditingGrading ? 'Edit Grade Scale' : 'Add Grade Scale'" (close)="isGradingModalOpen = false">
        <form (ngSubmit)="saveGradeScale()" class="modal-form">
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Letter Grade <span class="required">*</span></label>
              <input type="text" [(ngModel)]="gradingForm.letterGrade" name="grdLetter" class="form-input" placeholder="e.g. A+, A" required />
            </div>
            <div class="form-group">
              <label class="form-label">Grade Point (GPA) <span class="required">*</span></label>
              <input type="number" [(ngModel)]="gradingForm.gradePoint" name="grdPoint" class="form-input" step="0.01" min="0" max="5.0" required />
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Min Marks (%) <span class="required">*</span></label>
              <input type="number" [(ngModel)]="gradingForm.minMarks" name="grdMin" class="form-input" min="0" max="100" required />
            </div>
            <div class="form-group">
              <label class="form-label">Max Marks (%) <span class="required">*</span></label>
              <input type="number" [(ngModel)]="gradingForm.maxMarks" name="grdMax" class="form-input" min="0" max="100" required />
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Performance Remark</label>
              <input type="text" [(ngModel)]="gradingForm.remarks" name="grdRemarks" class="form-input" placeholder="e.g. Outstanding" />
            </div>
            <div class="form-group">
              <label class="form-label">Result Outcome</label>
              <select [(ngModel)]="gradingForm.isPassing" name="grdPass" class="form-input">
                <option [ngValue]="true">Passed</option>
                <option [ngValue]="false">Failed</option>
              </select>
            </div>
          </div>

          <div class="modal-footer-actions">
            <button type="button" class="btn btn-outline-white" (click)="isGradingModalOpen = false">Cancel</button>
            <button type="submit" class="btn btn-primary-purple" [disabled]="!gradingForm.letterGrade.trim()">
              <span>{{ isEditingGrading ? 'Update Grade' : 'Save Grade' }}</span>
            </button>
          </div>
        </form>
      </app-modal>

      <!-- 6. LOOKUP ITEM MODAL -->
      <app-modal [isOpen]="isLookupModalOpen" title="Add Demographic Lookup Item" (close)="isLookupModalOpen = false">
        <form (ngSubmit)="saveLookupItem()" class="modal-form">
          <div class="form-group">
            <label class="form-label">Lookup Category <span class="required">*</span></label>
            <select [(ngModel)]="lookupForm.type" name="lkType" class="form-input">
              <option value="Qualification">Educational Qualification</option>
              <option value="Religion">Religion</option>
              <option value="BloodGroup">Blood Group</option>
              <option value="Gender">Gender</option>
              <option value="GuardianRelation">Guardian Relation</option>
              <option value="Nationality">Nationality</option>
            </select>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Item Label (English) <span class="required">*</span></label>
              <input type="text" [(ngModel)]="lookupForm.name" name="lkName" class="form-input" placeholder="e.g. Islam, A+, Father" required />
            </div>
            <div class="form-group">
              <label class="form-label">Item Code / Value <span class="required">*</span></label>
              <input type="text" [(ngModel)]="lookupForm.code" name="lkCode" class="form-input" placeholder="e.g. ISLAM, A_POS" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Bangla Display Label</label>
            <input type="text" [(ngModel)]="lookupForm.banglaName" name="lkBangla" class="form-input" placeholder="e.g. ইসলাম, পিতা" />
          </div>

          <div class="modal-footer-actions">
            <button type="button" class="btn btn-outline-white" (click)="isLookupModalOpen = false">Cancel</button>
            <button type="submit" class="btn btn-primary-purple" [disabled]="!lookupForm.name.trim()">
              <span>Save Lookup Item</span>
            </button>
          </div>
        </form>
      </app-modal>

      <!-- 7. ACADEMIC SESSION MODAL -->
      <app-modal [isOpen]="isSessionModalOpen" title="Add New Academic Session" (close)="isSessionModalOpen = false">
        <form (ngSubmit)="saveSession()" class="modal-form">
          <div class="form-group">
            <label class="form-label">Session Name <span class="required">*</span></label>
            <input type="text" [(ngModel)]="sessionForm.name" name="sessName" class="form-input" placeholder="e.g. 2027 – 2028" required />
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Start Date <span class="required">*</span></label>
              <input type="date" [(ngModel)]="sessionForm.startDate" name="sessStart" class="form-input" required />
            </div>
            <div class="form-group">
              <label class="form-label">End Date <span class="required">*</span></label>
              <input type="date" [(ngModel)]="sessionForm.endDate" name="sessEnd" class="form-input" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Session Flags</label>
            <div class="checkbox-box">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="sessionForm.isCurrent" name="sessCurrent" />
                <span>Designate as Current Active Academic Year</span>
              </label>
            </div>
          </div>

          <div class="modal-footer-actions">
            <button type="button" class="btn btn-outline-white" (click)="isSessionModalOpen = false">Cancel</button>
            <button type="submit" class="btn btn-primary-purple" [disabled]="!sessionForm.name.trim()">
              <span>Create Session</span>
            </button>
          </div>
        </form>
      </app-modal>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px 32px;
      max-width: 1540px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
      min-height: calc(100vh - 70px);
    }

    /* Page Header */
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
      max-width: 900px;
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
    .btn-sm {
      padding: 6px 14px;
      font-size: 0.775rem;
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
    .text-emerald { color: #16a34a; }
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

    /* KPI Cards */
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
      cursor: pointer;
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
    .icon-amber  { background: #ffedd5; }
    .text-amber  { color: #ea580c; }

    .kpi-body {
      display: flex;
      flex-direction: column;
    }
    .kpi-label {
      font-size: 0.775rem;
      font-weight: 600;
      color: #64748b;
    }
    .kpi-value {
      font-size: 1.35rem;
      font-weight: 800;
      color: #0f172a;
      margin: 2px 0;
    }
    .kpi-sub {
      font-size: 0.72rem;
      color: #94a3b8;
    }

    /* Tabs Navigation */
    .tabs-container {
      display: flex;
      gap: 6px;
      background: #f1f5f9;
      padding: 6px;
      border-radius: 12px;
      overflow-x: auto;
    }
    .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 8px;
      border: none;
      background: transparent;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }
    .tab-btn:hover {
      color: #0f172a;
      background: rgba(255, 255, 255, 0.6);
    }
    .tab-btn.active {
      background: #ffffff;
      color: #6366f1;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    /* Content Cards */
    .tab-pane {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
      overflow: hidden;
    }
    .card-header {
      padding: 16px 20px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fbfcfe;
    }
    .card-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .card-subtitle {
      font-size: 0.775rem;
      color: #64748b;
      margin: 2px 0 0 0;
    }

    /* Tables */
    .table-wrapper {
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.84rem;
    }
    .data-table th {
      background: #f8fafc;
      padding: 12px 16px;
      text-align: left;
      font-weight: 700;
      color: #475569;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      border-bottom: 1px solid #e2e8f0;
    }
    .data-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .data-table tr:hover td {
      background: #f8fafc;
    }

    .row-title {
      color: #0f172a;
      font-size: 0.875rem;
    }
    .code-pill {
      background: #f1f5f9;
      color: #475569;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-family: monospace;
      font-weight: 600;
    }
    .time-range-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #f5f3ff;
      border: 1px solid #ede9fe;
      color: #4f46e5;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-quota {
      background: #eff6ff;
      color: #0284c7;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .badge-waiver {
      background: #f0fdf4;
      color: #16a34a;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .badge-waiver.waiver-full {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }
    .status-pill {
      background: #e2e8f0;
      color: #64748b;
      border: none;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.72rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
    }
    .status-pill.active {
      background: #dcfce7;
      color: #15803d;
    }
    .rank-pill {
      background: #ede9fe;
      color: #6366f1;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 800;
    }
    .letter-grade-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: #ede9fe;
      color: #6366f1;
      font-weight: 800;
      font-size: 0.9375rem;
    }
    .letter-grade-pill.grade-fail {
      background: #fee2e2;
      color: #dc2626;
    }
    .gpa-point {
      color: #0f172a;
      font-size: 0.9375rem;
    }
    .marks-range {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .type-pill {
      background: #f1f5f9;
      color: #475569;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .action-buttons {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 4px;
    }
    .btn-icon {
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
    .btn-icon:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .btn-icon.text-danger:hover {
      background: #fee2e2;
      color: #ef4444;
    }
    .btn-text-action {
      background: transparent;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-text-action:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    /* Bridges Grid */
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .bridge-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 20px;
      display: flex;
      gap: 16px;
      cursor: pointer;
      text-decoration: none;
      color: inherit;
      transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
    }
    .bridge-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
      border-color: #c7d2fe;
    }
    .bridge-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .bridge-title {
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .bridge-desc {
      font-size: 0.8125rem;
      color: #64748b;
      margin: 6px 0 10px 0;
      line-height: 1.4;
    }
    .bridge-link {
      font-size: 0.8125rem;
      font-weight: 700;
      color: #6366f1;
    }

    /* Modals & Forms */
    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding-top: 4px;
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
    .form-input-sm {
      height: 34px;
      font-size: 0.775rem;
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
    .checkbox-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8125rem;
      color: #334155;
      cursor: pointer;
    }
    .modal-footer-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 10px;
      border-top: 1px solid #f1f5f9;
      padding-top: 14px;
    }

    @media (max-width: 1024px) {
      .kpi-grid { grid-template-columns: 1fr 1fr; }
      .grid-3 { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .kpi-grid { grid-template-columns: 1fr; }
      .page-container { padding: 16px; }
    }
  `]
})
export class MasterDataManagementComponent implements OnInit {
  private masterDataStore = inject(MasterDataStoreService);
  private adminStore = inject(AdminStoreService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  activeTab: MasterTab = 'shifts';

  // Data collections
  shifts: AcademicShift[] = [];
  admissionCategories: AdmissionCategory[] = [];
  departments: Department[] = [];
  designations: Designation[] = [];
  gradingScales: GradingScale[] = [];
  lookups: MasterLookupItem[] = [];
  academicYears: AcademicYear[] = [];

  selectedLookupFilter: string = 'ALL';

  // Shift Modal
  isShiftModalOpen = false;
  isEditingShift = false;
  shiftForm: {
    id?: string;
    code: string;
    name: string;
    banglaName: string;
    startTime: string;
    endTime: string;
    description: string;
    isActive: boolean;
  } = {
      code: '',
      name: '',
      banglaName: '',
      startTime: '08:00 AM',
      endTime: '01:00 PM',
      description: '',
      isActive: true
    };

  // Category Modal
  isCategoryModalOpen = false;
  isEditingCategory = false;
  categoryForm: {
    id?: string;
    code: string;
    name: string;
    banglaName: string;
    quotaPercentage: number;
    discountPercentage: number;
    remarks: string;
    isActive: boolean;
  } = {
      code: '',
      name: '',
      banglaName: '',
      quotaPercentage: 10,
      discountPercentage: 0,
      remarks: '',
      isActive: true
    };

  // Department Modal
  isDepartmentModalOpen = false;
  isEditingDepartment = false;
  departmentForm: {
    id?: string;
    code: string;
    name: string;
    headTeacherName: string;
    teacherCount: number;
    description: string;
    isActive: boolean;
  } = {
      code: '',
      name: '',
      headTeacherName: '',
      teacherCount: 0,
      description: '',
      isActive: true
    };

  // Designation Modal
  isDesignationModalOpen = false;
  isEditingDesignation = false;
  designationForm: {
    id?: string;
    code: string;
    title: string;
    category: 'Teaching' | 'Administrative' | 'Non-Teaching';
    rankOrder: number;
    isActive: boolean;
  } = {
      code: '',
      title: '',
      category: 'Teaching',
      rankOrder: 1,
      isActive: true
    };

  // Grading Scale Modal
  isGradingModalOpen = false;
  isEditingGrading = false;
  gradingForm: {
    id?: string;
    letterGrade: string;
    gradePoint: number;
    minMarks: number;
    maxMarks: number;
    remarks: string;
    isPassing: boolean;
  } = {
      letterGrade: '',
      gradePoint: 4.0,
      minMarks: 70,
      maxMarks: 79,
      remarks: '',
      isPassing: true
    };

  // Lookup Item Modal
  isLookupModalOpen = false;
  lookupForm: {
    type: MasterLookupItem['type'];
    code: string;
    name: string;
    banglaName: string;
  } = {
      type: 'Religion',
      code: '',
      name: '',
      banglaName: ''
    };

  // Session Modal
  isSessionModalOpen = false;
  sessionForm: {
    name: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
  } = {
      name: '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(new Date().getFullYear() + 1, 11, 31).toISOString().slice(0, 10),
      isCurrent: false
    };

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.shifts = this.masterDataStore.getShifts();
    this.admissionCategories = this.masterDataStore.getAdmissionCategories();
    this.departments = this.masterDataStore.getDepartments();
    this.designations = this.masterDataStore.getDesignations();
    this.gradingScales = this.masterDataStore.getGradingScales();
    this.lookups = this.masterDataStore.getLookups();
    this.academicYears = this.adminStore.getAcademicYears();

    // Subscribe for reactive updates
    this.masterDataStore.getShifts$().subscribe(s => { this.shifts = s; this.cdr.markForCheck(); });
    this.masterDataStore.getAdmissionCategories$().subscribe(c => { this.admissionCategories = c; this.cdr.markForCheck(); });
    this.masterDataStore.getDepartments$().subscribe(d => { this.departments = d; this.cdr.markForCheck(); });
    this.masterDataStore.getDesignations$().subscribe(des => { this.designations = des; this.cdr.markForCheck(); });
    this.masterDataStore.getGradingScales$().subscribe(g => { this.gradingScales = g; this.cdr.markForCheck(); });
    this.masterDataStore.getLookups$().subscribe(lk => { this.lookups = lk; this.cdr.markForCheck(); });
    this.adminStore.getAcademicYears$().subscribe(ay => { this.academicYears = ay; this.cdr.markForCheck(); });
  }

  get filteredLookups(): MasterLookupItem[] {
    if (this.selectedLookupFilter === 'ALL') return this.lookups;
    return this.lookups.filter(l => l.type === this.selectedLookupFilter);
  }

  getActiveCount(items: { isActive?: boolean }[]): number {
    return items.filter(i => i.isActive !== false).length;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  getAddButtonLabel(): string {
    switch (this.activeTab) {
      case 'shifts': return '+ Add Shift';
      case 'categories': return '+ Add Quota Category';
      case 'sessions': return '+ New Academic Session';
      case 'departments': return '+ Add Department';
      case 'designations': return '+ Add Designation';
      case 'grading': return '+ Add Grade Scale';
      case 'lookups': return '+ Add Lookup Item';
      default: return '+ Add Master Entry';
    }
  }

  openAddModalForActiveTab() {
    switch (this.activeTab) {
      case 'shifts': this.openAddShiftModal(); break;
      case 'categories': this.openAddCategoryModal(); break;
      case 'sessions': this.openAddSessionModal(); break;
      case 'departments': this.openAddDepartmentModal(); break;
      case 'designations': this.openAddDesignationModal(); break;
      case 'grading': this.openAddGradeScaleModal(); break;
      case 'lookups': this.openAddLookupModal(); break;
      case 'bridges': this.activeTab = 'shifts'; this.openAddShiftModal(); break;
    }
  }

  // --- SHIFTS ---
  openAddShiftModal() {
    this.isEditingShift = false;
    this.shiftForm = {
      code: `SHF-${this.shifts.length + 1}`,
      name: '',
      banglaName: '',
      startTime: '08:00 AM',
      endTime: '01:00 PM',
      description: '',
      isActive: true
    };
    this.isShiftModalOpen = true;
  }

  openEditShiftModal(s: AcademicShift) {
    this.isEditingShift = true;
    this.shiftForm = {
      id: s.id,
      code: s.code,
      name: s.name,
      banglaName: s.banglaName || '',
      startTime: s.startTime,
      endTime: s.endTime,
      description: s.description || '',
      isActive: s.isActive
    };
    this.isShiftModalOpen = true;
  }

  async saveShift() {
    if (!this.shiftForm.name.trim()) return;
    if (this.isEditingShift && this.shiftForm.id) {
      await this.masterDataStore.updateShift(this.shiftForm.id, this.shiftForm);
      this.toast.success('Shift Updated', `Shift "${this.shiftForm.name}" updated successfully.`);
    } else {
      await this.masterDataStore.addShift(this.shiftForm);
      this.toast.success('Shift Added', `New shift "${this.shiftForm.name}" created.`);
    }
    this.isShiftModalOpen = false;
  }

  async toggleShiftStatus(s: AcademicShift) {
    const newStatus = !s.isActive;
    await this.masterDataStore.updateShift(s.id, { isActive: newStatus });
    this.toast.info('Status Changed', `Shift "${s.name}" is now ${newStatus ? 'Active' : 'Inactive'}.`);
  }

  async deleteShift(s: AcademicShift) {
    if (confirm(`Are you sure you want to delete shift "${s.name}"?`)) {
      await this.masterDataStore.deleteShift(s.id);
      this.toast.info('Shift Deleted', `Shift "${s.name}" has been removed.`);
    }
  }

  // --- CATEGORIES ---
  openAddCategoryModal() {
    this.isEditingCategory = false;
    this.categoryForm = {
      code: `CAT-${this.admissionCategories.length + 1}`,
      name: '',
      banglaName: '',
      quotaPercentage: 5,
      discountPercentage: 0,
      remarks: '',
      isActive: true
    };
    this.isCategoryModalOpen = true;
  }

  openEditCategoryModal(c: AdmissionCategory) {
    this.isEditingCategory = true;
    this.categoryForm = {
      id: c.id,
      code: c.code,
      name: c.name,
      banglaName: c.banglaName || '',
      quotaPercentage: c.quotaPercentage || 0,
      discountPercentage: c.discountPercentage || 0,
      remarks: c.remarks || '',
      isActive: c.isActive
    };
    this.isCategoryModalOpen = true;
  }

  async saveCategory() {
    if (!this.categoryForm.name.trim()) return;
    if (this.isEditingCategory && this.categoryForm.id) {
      await this.masterDataStore.updateAdmissionCategory(this.categoryForm.id, this.categoryForm);
      this.toast.success('Category Updated', `Category "${this.categoryForm.name}" updated.`);
    } else {
      await this.masterDataStore.addAdmissionCategory(this.categoryForm);
      this.toast.success('Category Added', `Admission category "${this.categoryForm.name}" created.`);
    }
    this.isCategoryModalOpen = false;
  }

  async toggleCategoryStatus(c: AdmissionCategory) {
    const newStatus = !c.isActive;
    await this.masterDataStore.updateAdmissionCategory(c.id, { isActive: newStatus });
    this.toast.info('Status Changed', `Category "${c.name}" is now ${newStatus ? 'Active' : 'Inactive'}.`);
  }

  async deleteCategory(c: AdmissionCategory) {
    if (confirm(`Delete admission category "${c.name}"?`)) {
      await this.masterDataStore.deleteAdmissionCategory(c.id);
      this.toast.info('Category Deleted', `Category "${c.name}" removed.`);
    }
  }

  // --- SESSIONS ---
  openAddSessionModal() {
    const curYear = new Date().getFullYear();
    this.sessionForm = {
      name: `${curYear + 1} – ${curYear + 2}`,
      startDate: `${curYear + 1}-01-01`,
      endDate: `${curYear + 1}-12-31`,
      isCurrent: false
    };
    this.isSessionModalOpen = true;
  }

  async saveSession() {
    if (!this.sessionForm.name.trim()) return;
    try {
      await firstValueFrom(this.adminStore.addAcademicYear({
        name: this.sessionForm.name.trim(),
        startDate: this.sessionForm.startDate,
        endDate: this.sessionForm.endDate,
        isCurrent: this.sessionForm.isCurrent
      }));
    } catch {
      // Local optimistic fallback
    }
    this.toast.success('Session Created', `Academic session "${this.sessionForm.name}" added.`);
    this.isSessionModalOpen = false;
    this.academicYears = this.adminStore.getAcademicYears();
  }

  async setAsCurrentSession(ay: AcademicYear) {
    try {
      await firstValueFrom(this.adminStore.setCurrentAcademicYear(ay.id));
    } catch {
      ay.isCurrent = true;
    }
    this.toast.success('Active Session Set', `Session "${ay.name}" is now active current.`);
    this.academicYears = this.adminStore.getAcademicYears();
  }

  async toggleSessionLock(ay: AcademicYear) {
    try {
      await firstValueFrom(this.adminStore.toggleAcademicYearLock(ay.id));
    } catch {
      ay.isLocked = !ay.isLocked;
    }
    this.toast.info('Session Updated', `Session "${ay.name}" lock state toggled.`);
    this.academicYears = this.adminStore.getAcademicYears();
  }

  async deleteSession(ay: AcademicYear) {
    if (ay.isCurrent) {
      this.toast.error('Cannot Delete', 'Current active academic session cannot be deleted.');
      return;
    }
    if (confirm(`Delete session "${ay.name}"?`)) {
      this.academicYears = this.academicYears.filter(y => y.id !== ay.id);
      this.toast.info('Session Removed', `Session "${ay.name}" removed.`);
    }
  }

  // --- DEPARTMENTS ---
  openAddDepartmentModal() {
    this.isEditingDepartment = false;
    this.departmentForm = {
      code: `DPT-${this.departments.length + 1}`,
      name: '',
      headTeacherName: '',
      teacherCount: 0,
      description: '',
      isActive: true
    };
    this.isDepartmentModalOpen = true;
  }

  openEditDepartmentModal(d: Department) {
    this.isEditingDepartment = true;
    this.departmentForm = {
      id: d.id,
      code: d.code,
      name: d.name,
      headTeacherName: d.headTeacherName || '',
      teacherCount: d.teacherCount || 0,
      description: d.description || '',
      isActive: d.isActive
    };
    this.isDepartmentModalOpen = true;
  }

  async saveDepartment() {
    if (!this.departmentForm.name.trim()) return;
    if (this.isEditingDepartment && this.departmentForm.id) {
      await this.masterDataStore.updateDepartment(this.departmentForm.id, this.departmentForm);
      this.toast.success('Department Updated', `Department "${this.departmentForm.name}" updated.`);
    } else {
      await this.masterDataStore.addDepartment(this.departmentForm);
      this.toast.success('Department Created', `Department "${this.departmentForm.name}" created.`);
    }
    this.isDepartmentModalOpen = false;
  }

  async toggleDepartmentStatus(d: Department) {
    const newStatus = !d.isActive;
    await this.masterDataStore.updateDepartment(d.id, { isActive: newStatus });
    this.toast.info('Status Changed', `Department "${d.name}" is now ${newStatus ? 'Active' : 'Inactive'}.`);
  }

  async deleteDepartment(d: Department) {
    if (confirm(`Delete department "${d.name}"?`)) {
      await this.masterDataStore.deleteDepartment(d.id);
      this.toast.info('Department Removed', `Department "${d.name}" removed.`);
    }
  }

  // --- DESIGNATIONS ---
  openAddDesignationModal() {
    this.isEditingDesignation = false;
    this.designationForm = {
      code: `DES-${this.designations.length + 1}`,
      title: '',
      category: 'Teaching',
      rankOrder: this.designations.length + 1,
      isActive: true
    };
    this.isDesignationModalOpen = true;
  }

  openEditDesignationModal(des: Designation) {
    this.isEditingDesignation = true;
    this.designationForm = {
      id: des.id,
      code: des.code,
      title: des.title,
      category: des.category,
      rankOrder: des.rankOrder,
      isActive: des.isActive
    };
    this.isDesignationModalOpen = true;
  }

  async saveDesignation() {
    if (!this.designationForm.title.trim()) return;
    if (this.isEditingDesignation && this.designationForm.id) {
      await this.masterDataStore.updateDesignation(this.designationForm.id, this.designationForm);
      this.toast.success('Designation Updated', `Designation "${this.designationForm.title}" updated.`);
    } else {
      await this.masterDataStore.addDesignation(this.designationForm);
      this.toast.success('Designation Created', `Designation "${this.designationForm.title}" added.`);
    }
    this.isDesignationModalOpen = false;
  }

  async toggleDesignationStatus(des: Designation) {
    const newStatus = !des.isActive;
    await this.masterDataStore.updateDesignation(des.id, { isActive: newStatus });
    this.toast.info('Status Changed', `Designation "${des.title}" is now ${newStatus ? 'Active' : 'Inactive'}.`);
  }

  async deleteDesignation(des: Designation) {
    if (confirm(`Delete designation "${des.title}"?`)) {
      await this.masterDataStore.deleteDesignation(des.id);
      this.toast.info('Designation Removed', `Designation "${des.title}" removed.`);
    }
  }

  // --- GRADING SCALES ---
  openAddGradeScaleModal() {
    this.isEditingGrading = false;
    this.gradingForm = {
      letterGrade: '',
      gradePoint: 4.0,
      minMarks: 70,
      maxMarks: 79,
      remarks: 'Excellent',
      isPassing: true
    };
    this.isGradingModalOpen = true;
  }

  openEditGradeScaleModal(g: GradingScale) {
    this.isEditingGrading = true;
    this.gradingForm = {
      id: g.id,
      letterGrade: g.letterGrade,
      gradePoint: g.gradePoint,
      minMarks: g.minMarks,
      maxMarks: g.maxMarks,
      remarks: g.remarks,
      isPassing: g.isPassing
    };
    this.isGradingModalOpen = true;
  }

  async saveGradeScale() {
    if (!this.gradingForm.letterGrade.trim()) return;
    if (this.isEditingGrading && this.gradingForm.id) {
      await this.masterDataStore.updateGradingScale(this.gradingForm.id, this.gradingForm);
      this.toast.success('Grade Scale Updated', `Grade "${this.gradingForm.letterGrade}" updated.`);
    } else {
      await this.masterDataStore.addGradingScale(this.gradingForm);
      this.toast.success('Grade Scale Added', `Grade "${this.gradingForm.letterGrade}" added to matrix.`);
    }
    this.isGradingModalOpen = false;
  }

  async deleteGradeScale(g: GradingScale) {
    if (confirm(`Delete grade scale "${g.letterGrade}"?`)) {
      await this.masterDataStore.deleteGradingScale(g.id);
      this.toast.info('Grade Removed', `Grade scale "${g.letterGrade}" removed.`);
    }
  }

  // --- LOOKUP ITEMS ---
  openAddLookupModal() {
    this.lookupForm = {
      type: this.selectedLookupFilter === 'ALL' ? 'Religion' : (this.selectedLookupFilter as any),
      code: '',
      name: '',
      banglaName: ''
    };
    this.isLookupModalOpen = true;
  }

  async saveLookupItem() {
    if (!this.lookupForm.name.trim()) return;
    await this.masterDataStore.addLookupItem({
      type: this.lookupForm.type,
      code: this.lookupForm.code.trim() || this.lookupForm.name.trim().toUpperCase(),
      name: this.lookupForm.name.trim(),
      banglaName: this.lookupForm.banglaName.trim(),
      displayOrder: this.lookups.length + 1,
      isActive: true
    });
    this.toast.success('Lookup Item Added', `"${this.lookupForm.name}" added to ${this.lookupForm.type} list.`);
    this.isLookupModalOpen = false;
  }

  async toggleLookupStatus(lk: MasterLookupItem) {
    const newStatus = !lk.isActive;
    await this.masterDataStore.updateLookupItem(lk.id, { isActive: newStatus });
    this.toast.info('Status Changed', `Item "${lk.name}" is now ${newStatus ? 'Active' : 'Inactive'}.`);
  }

  async deleteLookup(lk: MasterLookupItem) {
    if (confirm(`Delete lookup item "${lk.name}"?`)) {
      await this.masterDataStore.deleteLookupItem(lk.id);
      this.toast.info('Item Removed', `Lookup item "${lk.name}" removed.`);
    }
  }

  // Export full master dictionary
  exportMasterData() {
    const data = {
      exportedAt: new Date().toISOString(),
      institution: this.adminStore.getSchool().name,
      academicShifts: this.shifts,
      admissionCategories: this.admissionCategories,
      academicYears: this.academicYears,
      departments: this.departments,
      designations: this.designations,
      gradingScales: this.gradingScales,
      demographicLookups: this.lookups
    };

    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', jsonStr);
    dlAnchor.setAttribute('download', `institutional_master_data_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();

    this.toast.success('Export Complete', 'Institutional master data dictionary exported successfully.');
  }
}
