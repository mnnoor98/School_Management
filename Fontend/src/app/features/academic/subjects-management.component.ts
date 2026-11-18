import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AcademicStoreService } from '../../core/services/stores/academic-store.service';
import { MasterDataStoreService } from '../../core/services/stores/master-data-store.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Subject, SchoolClass } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { BadgeComponent } from '../../shared/components/badge.component';

@Component({
  selector: 'app-subjects-management',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, ModalComponent, BadgeComponent],
  template: `
    <div class="page-container">
      <!-- HEADER -->
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <app-icon name="book-open" [size]="28" class="text-primary"></app-icon>
            Academic Subject Setup & Class Mapping
          </h1>
          <p class="page-subtitle">
            Catalog institutional curriculum courses, pass-mark thresholds, and assign syllabus subjects to academic grades.
          </p>
        </div>
        <div class="page-actions" *ngIf="canManage">
          <button type="button" class="btn btn-primary" (click)="openAddSubjectModal()">
            <app-icon name="plus" [size]="16"></app-icon>
            <span>Add New Subject</span>
          </button>
        </div>
      </div>

      <!-- TABS NAV -->
      <div class="tabs-nav mb-4">
        <button type="button" class="tab-btn" [class.active]="activeTab === 'catalog'" (click)="activeTab = 'catalog'">
          <app-icon name="layers" [size]="16"></app-icon>
          <span>Curriculum Subject Catalog ({{ subjects.length }})</span>
        </button>
        <button type="button" class="tab-btn" [class.active]="activeTab === 'mapping'" (click)="activeTab = 'mapping'; loadClassMapping()">
          <app-icon name="sliders" [size]="16"></app-icon>
          <span>Class-Subject Assignment Matrix</span>
        </button>
      </div>

      <!-- TAB 1: SUBJECT CATALOG -->
      <div *ngIf="activeTab === 'catalog'">
        <!-- FILTER BAR -->
        <div class="card mb-4">
          <div class="card-body p-3">
            <div class="filter-strip">
              <div class="search-wrap">
                <app-icon name="search" [size]="16" class="search-icon"></app-icon>
                <input
                  type="text"
                  [(ngModel)]="searchTerm"
                  class="form-control form-control-sm"
                  placeholder="Search by subject name or code..."
                />
              </div>

              <div class="filter-item">
                <label class="filter-lbl">Subject Type:</label>
                <select [(ngModel)]="selectedType" class="form-select form-select-sm">
                  <option value="ALL">All Types</option>
                  <option value="Compulsory">Compulsory</option>
                  <option value="Optional">Optional / Elective</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- SUBJECTS TABLE -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <app-icon name="book-open" [size]="18"></app-icon>
              <span>Accredited Subject Directory</span>
            </div>
            <span class="count-pill">{{ filteredSubjects.length }} Subjects Configured</span>
          </div>

          <div class="app-table-wrapper">
            <table class="app-table">
              <thead>
                <tr>
                  <th style="width: 120px;">Code</th>
                  <th>Subject Title</th>
                  <th style="width: 140px;">Curriculum Type</th>
                  <th style="text-align: right; width: 120px;">Full Marks</th>
                  <th style="text-align: right; width: 120px;">Pass Marks</th>
                  <th style="text-align: right; width: 120px;" *ngIf="canManage">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of filteredSubjects">
                  <td><code class="code-tag">{{ s.code }}</code></td>
                  <td>
                    <strong>{{ s.name }}</strong>
                  </td>
                  <td>
                    <app-badge [variant]="s.type === 'Compulsory' ? 'info' : 'purple'" [label]="s.type"></app-badge>
                  </td>
                  <td style="text-align: right; font-weight: 600;">{{ s.fullMarks }}</td>
                  <td style="text-align: right; color: #dc2626; font-weight: 600;">{{ s.passMarks }}</td>
                  <td style="text-align: right;" *ngIf="canManage">
                    <div class="table-actions">
                      <button type="button" class="btn-icon" title="Edit Subject" (click)="openEditSubjectModal(s)">
                        <app-icon name="edit-3" [size]="15"></app-icon>
                      </button>
                      <button type="button" class="btn-icon text-danger" title="Delete Subject" (click)="deleteSubject(s)">
                        <app-icon name="trash-2" [size]="15"></app-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 2: CLASS-SUBJECT ASSIGNMENT MATRIX -->
      <div *ngIf="activeTab === 'mapping'">
        <!-- MATRIX VIEW MODE SWITCHER & QUICK ACTIONS -->
        <div class="matrix-toolbar mb-4">
          <div class="matrix-mode-pills">
            <button 
              type="button" 
              class="matrix-mode-btn" 
              [class.active]="matrixViewMode === 'grid'" 
              (click)="matrixViewMode = 'grid'"
            >
              <app-icon name="grid" [size]="15"></app-icon>
              <span>Full Curriculum Matrix Grid</span>
            </button>
            <button 
              type="button" 
              class="matrix-mode-btn" 
              [class.active]="matrixViewMode === 'inspector'" 
              (click)="matrixViewMode = 'inspector'"
            >
              <app-icon name="layers" [size]="15"></app-icon>
              <span>Single Class Inspector</span>
            </button>
          </div>

          <div class="matrix-action-buttons" *ngIf="canManage">
            <button type="button" class="btn btn-outline btn-sm" (click)="autoAssignCompulsoryAll()">
              <app-icon name="check-square" [size]="14"></app-icon>
              <span>Auto-Assign Compulsory</span>
            </button>
            <button 
              type="button" 
              class="btn btn-primary btn-sm" 
              (click)="saveEntireMatrix()" 
              [disabled]="isSavingMapping"
            >
              <app-icon name="save" [size]="14"></app-icon>
              <span>{{ isSavingMapping ? 'Saving Matrix...' : 'Save Entire Matrix' }}</span>
            </button>
          </div>
        </div>

        <!-- 2A. FULL MATRIX GRID TABLE -->
        <div *ngIf="matrixViewMode === 'grid'" class="card matrix-table-card">
          <div class="card-header">
            <div class="card-title">
              <app-icon name="grid" [size]="18" class="text-primary"></app-icon>
              <span>Class-Subject Allocation Matrix Grid</span>
            </div>
            <div class="text-xs text-muted">
              Click any cell to toggle subject inclusion for that academic class standard.
            </div>
          </div>

          <div class="matrix-scroll-container">
            <table class="matrix-interactive-table">
              <thead>
                <tr>
                  <th class="matrix-sticky-header matrix-col-class">Class Standard</th>
                  <th *ngFor="let sub of subjects" class="matrix-col-subj">
                    <div class="matrix-subj-title">{{ sub.name }}</div>
                    <div class="matrix-subj-code">{{ sub.code }} ({{ sub.fullMarks }}m)</div>
                  </th>
                  <th class="matrix-col-summary">Total Subjects</th>
                  <th class="matrix-col-summary">Total Marks</th>
                  <th class="matrix-col-actions" *ngIf="canManage">Row Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let cls of classes">
                  <td class="matrix-sticky-header matrix-cell-class">
                    <div class="cls-name-txt">{{ cls.name }}</div>
                    <span class="cls-code-pill">{{ cls.code }}</span>
                  </td>

                  <td *ngFor="let sub of subjects" class="matrix-cell-toggle">
                    <button 
                      type="button" 
                      class="cell-toggle-btn" 
                      [class.active]="isMatrixSubjectAssigned(cls.id, sub.id)"
                      (click)="toggleMatrixSubject(cls.id, sub.id)"
                      [title]="cls.name + ': ' + sub.name + ' (' + (isMatrixSubjectAssigned(cls.id, sub.id) ? 'Included' : 'Excluded') + ')'"
                    >
                      <span *ngIf="isMatrixSubjectAssigned(cls.id, sub.id)" class="cell-active-label">
                        <app-icon name="check" [size]="12"></app-icon>
                        <span>{{ sub.type === 'Compulsory' ? 'Comp' : 'Elec' }}</span>
                      </span>
                      <span *ngIf="!isMatrixSubjectAssigned(cls.id, sub.id)" class="cell-inactive-label">
                        <app-icon name="plus" [size]="11"></app-icon>
                      </span>
                    </button>
                  </td>

                  <td class="matrix-cell-sum font-bold text-center">
                    {{ getMatrixAssignedCount(cls.id) }} / {{ subjects.length }}
                  </td>

                  <td class="matrix-cell-sum font-bold text-center text-primary">
                    {{ getMatrixTotalMarks(cls.id) }}
                  </td>

                  <td class="matrix-cell-act" *ngIf="canManage">
                    <button 
                      type="button" 
                      class="btn btn-outline btn-xs" 
                      (click)="saveClassMappingRow(cls.id)"
                      [disabled]="isSavingMapping"
                    >
                      <app-icon name="check" [size]="12"></app-icon>
                      <span>Save</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 2B. SINGLE CLASS INSPECTOR (ORIGINAL SIDE-BY-SIDE) -->
        <div *ngIf="matrixViewMode === 'inspector'" class="mapping-layout">
          <!-- LEFT PANEL: SELECT CLASS -->
          <div class="card class-selector-pane">
            <div class="card-header">
              <div class="card-title">
                <app-icon name="layers" [size]="16"></app-icon>
                <span>Select Target Class</span>
              </div>
            </div>
            <div class="class-picker-list">
              <button
                *ngFor="let c of classes"
                type="button"
                class="class-picker-item"
                [class.active]="selectedClassId === c.id"
                (click)="onSelectClassForMapping(c.id)"
              >
                <div>
                  <div class="c-name">{{ c.name }}</div>
                  <span class="c-code">{{ c.code }}</span>
                </div>
                <app-icon name="chevron-right" [size]="16" class="arrow"></app-icon>
              </button>
            </div>
          </div>

          <!-- RIGHT PANEL: CHECKLIST OF SUBJECTS FOR THIS CLASS -->
          <div class="card subjects-assign-pane">
            <div class="card-header">
              <div>
                <h3 class="card-title">
                  <app-icon name="check-square" [size]="18" class="text-primary"></app-icon>
                  <span>Assigned Curriculum for {{ getSelectedClassName() }}</span>
                </h3>
                <p class="text-xs text-muted mt-1">Select all subjects taught and examined in this academic standard.</p>
              </div>

              <button
                *ngIf="canManage"
                type="button"
                class="btn btn-primary btn-sm"
                (click)="saveClassMapping()"
                [disabled]="isSavingMapping"
              >
                <app-icon name="check" [size]="15"></app-icon>
                <span>{{ isSavingMapping ? 'Saving...' : 'Save Class Curriculum' }}</span>
              </button>
            </div>

            <div class="card-body">
              <div class="subjects-checkbox-grid">
                <label *ngFor="let s of subjects" class="subject-check-card" [class.selected]="isSubjectSelected(s.id)">
                  <input
                    type="checkbox"
                    [checked]="isSubjectSelected(s.id)"
                    (change)="toggleSubjectSelection(s.id)"
                  />
                  <div class="subj-check-body">
                    <div class="subj-check-title">
                      <strong>{{ s.name }}</strong>
                      <code class="code-sm">{{ s.code }}</code>
                    </div>
                    <div class="subj-check-meta">
                      <app-badge [variant]="s.type === 'Compulsory' ? 'info' : 'purple'" [label]="s.type"></app-badge>
                      <span class="marks-text">Full: {{ s.fullMarks }} • Pass: {{ s.passMarks }}</span>
                    </div>
                  </div>
                </label>
              </div>

              <div class="summary-footer mt-4">
                <span class="badge-count">{{ selectedSubjectIds.length }} Subjects Assigned</span>
                <span class="total-marks-sum">
                  Total Class Marks: <strong>{{ calculateTotalClassMarks() }}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL: ADD / EDIT SUBJECT -->
      <app-modal [isOpen]="isModalOpen" [title]="isEditing ? 'Edit Academic Subject' : 'Add New Curriculum Subject'" (close)="isModalOpen = false">
        <form (ngSubmit)="saveSubject()" class="modal-form">
          <div class="form-group">
            <label class="form-label">Subject Title <span class="required">*</span></label>
            <input type="text" [(ngModel)]="form.name" name="subjName" class="form-control" placeholder="e.g. Higher Mathematics, English Literature" required />
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Subject Code <span class="required">*</span></label>
              <input type="text" [(ngModel)]="form.code" name="subjCode" class="form-control" placeholder="e.g. MATH-101" required />
            </div>
            <div class="form-group">
              <label class="form-label">Subject Type</label>
              <select [(ngModel)]="form.type" name="subjType" class="form-select">
                <option value="Compulsory">Compulsory</option>
                <option value="Optional">Optional / Elective</option>
              </select>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Total Exam Full Marks</label>
              <input type="number" [(ngModel)]="form.fullMarks" name="fullMarks" class="form-control" placeholder="100" min="1" max="500" />
            </div>
            <div class="form-group">
              <label class="form-label">Minimum Pass Marks</label>
              <input type="number" [(ngModel)]="form.passMarks" name="passMarks" class="form-control" placeholder="33" min="1" max="500" />
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" (click)="isModalOpen = false">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!form.name || !form.code">
              <app-icon name="check" [size]="16"></app-icon>
              <span>{{ isEditing ? 'Update Subject' : 'Save Subject' }}</span>
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
    .text-danger { color: #ef4444; }
    .text-muted { color: #64748b; }
    .text-xs { font-size: 0.75rem; }
    .mt-1 { margin-top: 4px; }
    .mt-4 { margin-top: 16px; }

    .tabs-nav {
      display: flex;
      gap: 12px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 2px;
    }
    .tab-btn {
      background: transparent;
      border: none;
      padding: 10px 18px;
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 2px solid transparent;
      margin-bottom: -4px;
      transition: all 0.2s;
    }
    .tab-btn:hover { color: #0f172a; }
    .tab-btn.active {
      color: #4f46e5;
      border-bottom-color: #4f46e5;
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

    .code-tag {
      background: #f1f5f9;
      color: #334155;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.775rem;
      font-weight: 600;
    }
    .code-sm {
      background: #f1f5f9;
      padding: 2px 5px;
      border-radius: 3px;
      font-size: 0.7rem;
    }
    .table-actions {
      display: flex;
      justify-content: flex-end;
      gap: 6px;
    }
    .btn-icon {
      background: transparent;
      border: none;
      padding: 6px;
      border-radius: 6px;
      cursor: pointer;
      color: #64748b;
      display: flex;
      align-items: center;
    }
    .btn-icon:hover { background: #f1f5f9; }

    /* Mapping Layout */
    .mapping-layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 20px;
    }
    .class-picker-list {
      display: flex;
      flex-direction: column;
      padding: 8px;
      gap: 4px;
    }
    .class-picker-item {
      background: transparent;
      border: 1px solid transparent;
      border-radius: 10px;
      padding: 12px 14px;
      text-align: left;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.15s;
    }
    .class-picker-item:hover { background: #f8fafc; }
    .class-picker-item.active {
      background: #eff6ff;
      border-color: #bfdbfe;
    }
    .c-name {
      font-size: 0.9375rem;
      font-weight: 700;
      color: #0f172a;
    }
    .class-picker-item.active .c-name { color: #1d4ed8; }
    .c-code {
      font-size: 0.725rem;
      color: #64748b;
      font-family: monospace;
    }
    .class-picker-item .arrow { color: #94a3b8; }
    .class-picker-item.active .arrow { color: #1d4ed8; }

    .subjects-checkbox-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 12px;
    }
    .subject-check-card {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .subject-check-card:hover {
      border-color: #cbd5e1;
      background: #ffffff;
    }
    .subject-check-card.selected {
      background: #faf5ff;
      border-color: #c084fc;
    }
    .subject-check-card input {
      margin-top: 3px;
      cursor: pointer;
    }
    .subj-check-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .subj-check-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .subj-check-meta {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .marks-text {
      font-size: 0.72rem;
      color: #64748b;
    }

    .summary-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f8fafc;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
    }
    .badge-count {
      font-size: 0.8125rem;
      font-weight: 700;
      color: #4f46e5;
    }
    .total-marks-sum {
      font-size: 0.875rem;
      color: #334155;
    }

    /* Full Matrix Grid Styles */
    .matrix-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .matrix-mode-pills {
      display: flex;
      gap: 4px;
      background: #f1f5f9;
      padding: 4px;
      border-radius: 10px;
    }
    .matrix-mode-btn {
      background: transparent;
      border: none;
      padding: 7px 14px;
      border-radius: 7px;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s;
    }
    .matrix-mode-btn:hover { color: #0f172a; }
    .matrix-mode-btn.active {
      background: #ffffff;
      color: #4f46e5;
      font-weight: 700;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .matrix-action-buttons {
      display: flex;
      gap: 8px;
    }

    .matrix-table-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      overflow: hidden;
    }
    .matrix-scroll-container {
      overflow-x: auto;
      max-width: 100%;
    }
    .matrix-interactive-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 0.8125rem;
    }
    .matrix-interactive-table th, .matrix-interactive-table td {
      padding: 10px 8px;
      border-bottom: 1px solid #f1f5f9;
      border-right: 1px solid #f8fafc;
      vertical-align: middle;
    }
    .matrix-sticky-header {
      position: sticky;
      left: 0;
      background: #ffffff;
      z-index: 2;
    }
    .matrix-interactive-table thead .matrix-sticky-header {
      background: #f8fafc;
      z-index: 3;
    }
    .matrix-col-class {
      min-width: 140px;
      border-right: 2px solid #e2e8f0 !important;
      text-align: left;
    }
    .matrix-cell-class {
      border-right: 2px solid #e2e8f0 !important;
      text-align: left;
    }
    .cls-name-txt {
      font-weight: 700;
      color: #0f172a;
    }
    .cls-code-pill {
      font-size: 0.6875rem;
      background: #f1f5f9;
      color: #64748b;
      padding: 1px 6px;
      border-radius: 4px;
      font-family: monospace;
    }
    .matrix-col-subj {
      min-width: 110px;
      text-align: center;
      background: #f8fafc;
    }
    .matrix-subj-title {
      font-weight: 700;
      color: #1e293b;
      font-size: 0.75rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 120px;
    }
    .matrix-subj-code {
      font-size: 0.6875rem;
      color: #64748b;
      font-weight: 500;
    }
    .matrix-cell-toggle {
      text-align: center;
    }
    .cell-toggle-btn {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
      padding: 4px 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 48px;
      transition: all 0.15s;
    }
    .cell-toggle-btn:hover {
      border-color: #94a3b8;
      background: #f1f5f9;
    }
    .cell-toggle-btn.active {
      background: #dbeafe;
      border: 1px solid #3b82f6;
      color: #1d4ed8;
      font-weight: 700;
    }
    .cell-active-label {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 0.6875rem;
    }
    .cell-inactive-label {
      color: #94a3b8;
    }
    .matrix-col-summary {
      min-width: 90px;
      text-align: center;
      background: #f8fafc;
    }
    .matrix-cell-sum {
      font-size: 0.8125rem;
    }
    .matrix-col-actions, .matrix-cell-act {
      min-width: 70px;
      text-align: center;
    }
    .btn-xs {
      padding: 3px 8px;
      font-size: 0.725rem;
      border-radius: 5px;
    }

    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 8px;
    }
    .required { color: #ef4444; }

    @media (max-width: 768px) {
      .mapping-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class SubjectsManagementComponent implements OnInit {
  private academicStore = inject(AcademicStoreService);
  private masterDataStore = inject(MasterDataStoreService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  subjects: Subject[] = [];
  classes: SchoolClass[] = [];

  activeTab: 'catalog' | 'mapping' = 'catalog';
  searchTerm = '';
  selectedType = 'ALL';
  canManage = true;

  // Modal
  isModalOpen = false;
  isEditing = false;
  form: { id?: string; code: string; name: string; type: 'Compulsory' | 'Optional'; fullMarks: number; passMarks: number } = {
    code: '',
    name: '',
    type: 'Compulsory',
    fullMarks: 100,
    passMarks: 33
  };

  // Class Mapping State
  matrixViewMode: 'grid' | 'inspector' = 'grid';
  matrixMappings: { [classId: string]: string[] } = {};
  selectedClassId = '';
  selectedSubjectIds: string[] = [];
  isSavingMapping = false;

  ngOnInit() {
    this.canManage = this.auth.hasPermission('ACAD_SUBJECTS', 'edit');
    this.loadData();

    this.academicStore.loadSubjects().then(() => {
      this.loadData();
      this.cdr.markForCheck();
    });

    this.academicStore.loadClasses().then(() => {
      this.loadData();
      this.loadAllMatrixMappings();
      this.cdr.markForCheck();
    });

    this.academicStore.getSubjects$().subscribe(s => {
      this.subjects = s;
      this.cdr.markForCheck();
    });
    this.academicStore.getClasses$().subscribe(c => {
      this.classes = c;
      this.cdr.markForCheck();
    });
  }

  loadData() {
    this.subjects = this.academicStore.getSubjects();
    this.classes = this.academicStore.getClasses();
    if (this.classes.length > 0 && !this.selectedClassId) {
      this.selectedClassId = this.classes[0].id;
    }
  }

  async loadAllMatrixMappings() {
    for (const c of this.classes) {
      const mapped = await this.academicStore.getClassSubjects(c.id);
      if (mapped && mapped.length > 0) {
        this.matrixMappings[c.id] = mapped.map((m: any) => m.subjectId);
      } else {
        this.matrixMappings[c.id] = this.subjects.filter(s => s.type === 'Compulsory').map(s => s.id);
      }
    }
    if (this.selectedClassId && this.matrixMappings[this.selectedClassId]) {
      this.selectedSubjectIds = [...this.matrixMappings[this.selectedClassId]];
    }
    this.cdr.markForCheck();
  }

  isMatrixSubjectAssigned(classId: string, subjectId: string): boolean {
    const list = this.matrixMappings[classId];
    return list ? list.includes(subjectId) : false;
  }

  toggleMatrixSubject(classId: string, subjectId: string) {
    if (!this.matrixMappings[classId]) {
      this.matrixMappings[classId] = [];
    }
    const current = this.matrixMappings[classId];
    const idx = current.indexOf(subjectId);
    if (idx > -1) {
      this.matrixMappings[classId] = current.filter(id => id !== subjectId);
    } else {
      this.matrixMappings[classId] = [...current, subjectId];
    }
    if (this.selectedClassId === classId) {
      this.selectedSubjectIds = [...this.matrixMappings[classId]];
    }
    this.cdr.markForCheck();
  }

  getMatrixAssignedCount(classId: string): number {
    return (this.matrixMappings[classId] || []).length;
  }

  getMatrixTotalMarks(classId: string): number {
    const assigned = this.matrixMappings[classId] || [];
    return this.subjects
      .filter(s => assigned.includes(s.id))
      .reduce((sum, s) => sum + (s.fullMarks || 100), 0);
  }

  async saveClassMappingRow(classId: string) {
    const subjectIds = this.matrixMappings[classId] || [];
    const clsName = this.classes.find(c => c.id === classId)?.name || 'Class';
    this.isSavingMapping = true;
    try {
      await this.academicStore.assignClassSubjects(classId, subjectIds);
      this.toast.success('Row Saved', `Updated curriculum for ${clsName} (${subjectIds.length} subjects).`);
    } catch {
      this.toast.error('Save Failed', `Could not save curriculum for ${clsName}.`);
    } finally {
      this.isSavingMapping = false;
      this.cdr.markForCheck();
    }
  }

  async saveEntireMatrix() {
    this.isSavingMapping = true;
    let savedCount = 0;
    try {
      for (const cls of this.classes) {
        const subjectIds = this.matrixMappings[cls.id] || [];
        await this.academicStore.assignClassSubjects(cls.id, subjectIds);
        savedCount++;
      }
      this.toast.success('Matrix Saved', `Successfully updated curriculum across all ${savedCount} classes.`);
    } catch (e) {
      this.toast.error('Save Incomplete', 'One or more class mappings could not be saved.');
    } finally {
      this.isSavingMapping = false;
      this.cdr.markForCheck();
    }
  }

  autoAssignCompulsoryAll() {
    const compulsoryIds = this.subjects.filter(s => s.type === 'Compulsory').map(s => s.id);
    for (const cls of this.classes) {
      const current = new Set(this.matrixMappings[cls.id] || []);
      compulsoryIds.forEach(id => current.add(id));
      this.matrixMappings[cls.id] = Array.from(current);
    }
    this.toast.info('Auto-Mapped', 'All compulsory subjects have been assigned across all classes in the matrix.');
    this.cdr.markForCheck();
  }

  get filteredSubjects(): Subject[] {
    return this.subjects.filter(s => {
      const matchSearch =
        !this.searchTerm ||
        s.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        s.code.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchType = this.selectedType === 'ALL' || s.type === this.selectedType;
      return matchSearch && matchType;
    });
  }

  openAddSubjectModal() {
    this.isEditing = false;
    this.form = {
      code: '',
      name: '',
      type: 'Compulsory',
      fullMarks: 100,
      passMarks: 33
    };
    this.isModalOpen = true;
  }

  openEditSubjectModal(sub: Subject) {
    this.isEditing = true;
    this.form = {
      id: sub.id,
      code: sub.code,
      name: sub.name,
      type: sub.type,
      fullMarks: sub.fullMarks,
      passMarks: sub.passMarks
    };
    this.isModalOpen = true;
  }

  async saveSubject() {
    if (!this.form.name.trim() || !this.form.code.trim()) return;

    if (this.isEditing && this.form.id) {
      await this.academicStore.updateSubject(this.form.id, {
        code: this.form.code.trim(),
        name: this.form.name.trim(),
        type: this.form.type,
        fullMarks: this.form.fullMarks,
        passMarks: this.form.passMarks
      });
      this.toast.success('Subject Updated', `Subject "${this.form.name}" has been updated.`);
    } else {
      await this.academicStore.addSubject({
        code: this.form.code.trim(),
        name: this.form.name.trim(),
        type: this.form.type,
        fullMarks: this.form.fullMarks,
        passMarks: this.form.passMarks
      });
      this.toast.success('Subject Created', `Subject "${this.form.name}" has been added.`);
    }

    this.isModalOpen = false;
    this.loadData();
    this.cdr.markForCheck();
  }

  async deleteSubject(sub: Subject) {
    if (confirm(`Are you sure you want to delete subject "${sub.name}" (${sub.code})?`)) {
      await this.academicStore.deleteSubject(sub.id);
      this.toast.info('Subject Removed', `Subject "${sub.name}" was deleted.`);
      this.loadData();
      this.cdr.markForCheck();
    }
  }

  // Mapping methods
  getSelectedClassName(): string {
    const cls = this.classes.find(c => c.id === this.selectedClassId);
    return cls ? cls.name : 'Selected Class';
  }

  async onSelectClassForMapping(classId: string) {
    this.selectedClassId = classId;
    await this.loadClassMapping();
    this.cdr.markForCheck();
  }

  async loadClassMapping() {
    if (!this.selectedClassId) return;
    const mappings = await this.academicStore.getClassSubjects(this.selectedClassId);
    if (mappings && mappings.length > 0) {
      this.selectedSubjectIds = mappings.map((m: any) => m.subjectId);
    } else {
      // Default: If no mapping yet, assign all compulsory subjects
      this.selectedSubjectIds = this.subjects.filter(s => s.type === 'Compulsory').map(s => s.id);
    }
    this.cdr.markForCheck();
  }

  isSubjectSelected(subjectId: string): boolean {
    return this.selectedSubjectIds.includes(subjectId);
  }

  toggleSubjectSelection(subjectId: string) {
    if (this.isSubjectSelected(subjectId)) {
      this.selectedSubjectIds = this.selectedSubjectIds.filter(id => id !== subjectId);
    } else {
      this.selectedSubjectIds = [...this.selectedSubjectIds, subjectId];
    }
    this.cdr.markForCheck();
  }

  calculateTotalClassMarks(): number {
    return this.subjects
      .filter(s => this.selectedSubjectIds.includes(s.id))
      .reduce((sum, s) => sum + (s.fullMarks || 100), 0);
  }

  async saveClassMapping() {
    if (!this.selectedClassId) return;
    this.isSavingMapping = true;
    this.cdr.markForCheck();
    try {
      const ok = await this.academicStore.assignClassSubjects(this.selectedClassId, this.selectedSubjectIds);
      if (ok) {
        this.toast.success('Curriculum Saved', `Assigned ${this.selectedSubjectIds.length} subjects to ${this.getSelectedClassName()}.`);
      } else {
        this.toast.warning('Curriculum Saved Locally', `Saved locally for ${this.getSelectedClassName()}.`);
      }
    } catch (e) {
      this.toast.error('Save Failed', 'Could not save class subjects assignment.');
    } finally {
      this.isSavingMapping = false;
      this.cdr.markForCheck();
    }
  }
}
