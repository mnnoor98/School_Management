import { CampusImageDirective } from '../../shared/components/campus-image.directive';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ExamStoreService } from '../../core/services/stores/exam-store.service';
import { AcademicStoreService } from '../../core/services/stores/academic-store.service';
import { StudentStoreService } from '../../core/services/stores/student-store.service';
import { CampusSessionService } from '../../core/services/campus-session.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Exam, SchoolClass, Section, Subject, Student, ExamMark } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';
import { ModalComponent } from '../../shared/components/modal.component';

interface MarkEntryRow {
  studentId: string;
  studentName: string;
  rollNo: string;
  admissionNo: string;
  avatar: string;
  theoryMarks: number;
  mcqMarks: number;
  practicalMarks: number;
  vivaMarks: number;
  totalObtained: number;
  fullMarks: number;
  grade: string;
  gradePoint: number;
  isPass: boolean;
  isAbsent: boolean;
  remark: string;
  isDirty?: boolean;
  isPreviouslySaved?: boolean;
}

interface SubjectBreakdown {
  fullMarks: number;
  passMarks: number;
  hasTheory: boolean;
  theoryName: string;
  theoryMax: number;
  hasMcq: boolean;
  mcqName: string;
  mcqMax: number;
  hasPractical: boolean;
  practicalName: string;
  practicalMax: number;
  hasViva: boolean;
  vivaName: string;
  vivaMax: number;
  isCustom?: boolean;
}

@Component({
  selector: 'app-marks-entry',
  standalone: true,
  imports: [CampusImageDirective, CommonModule, FormsModule, RouterModule, IconComponent, ModalComponent],
  template: `
    <div class="page-container">
      <!-- PAGE HEADER -->
      <div class="page-header no-print">
        <div>
          <div class="header-badge">
            <span class="pulse-dot"></span>
            Academic Evaluation Ledger
            <span class="role-pill" *ngIf="isTeacher">Faculty Evaluator Mode</span>
          </div>
          <h1 class="page-title">
            <app-icon name="edit-3" [size]="28" class="title-icon"></app-icon>
            Examination Marks Entry & Grade Ledger
          </h1>
          <p class="page-subtitle">
            Enter and record student assessment scores (Theory, MCQ, Practical) with real-time GPA grading, absentee logging, and transcript sync.
          </p>
        </div>
        <div class="page-actions">
          <button type="button" class="btn btn-outline btn-scheme-setup" (click)="openAssessmentModal()" title="Configure dynamic mark distribution (Written, MCQ, Practical, Viva)">
            <app-icon name="sliders" [size]="16"></app-icon>
            <span>Assessment Setup</span>
          </button>
          <button type="button" class="btn btn-outline" (click)="quickFillSampleMarks()" title="Populate realistic scores for testing">
            <app-icon name="zap" [size]="16"></app-icon>
            <span>Auto Fill Sample</span>
          </button>
          <button type="button" class="btn btn-outline" (click)="clearAllMarks()" title="Reset all score fields to zero">
            <app-icon name="refresh-cw" [size]="16"></app-icon>
            <span>Clear Entries</span>
          </button>
          <button type="button" class="btn btn-outline" (click)="downloadExcelTemplate()" title="Download Excel template pre-filled with student roll numbers and names">
            <app-icon name="file-text" [size]="16"></app-icon>
            <span>Excel Template</span>
          </button>
          <input type="file" #excelInput (change)="onExcelFileSelected($event)" accept=".xlsx, .xls, .csv" style="display: none;" />
          <button type="button" class="btn btn-outline" [disabled]="isUploadingExcel" (click)="excelInput.click()" title="Upload completed Excel marks sheet">
            <app-icon *ngIf="!isUploadingExcel" name="upload" [size]="16"></app-icon>
            <app-icon *ngIf="isUploadingExcel" name="loader" [size]="16" class="spin-icon"></app-icon>
            <span>{{ isUploadingExcel ? 'Uploading...' : 'Upload Excel' }}</span>
          </button>
          <button type="button" class="btn btn-outline" (click)="exportToCsv()" title="Export marks table as CSV file">
            <app-icon name="download" [size]="16"></app-icon>
            <span>Export CSV</span>
          </button>
          <button type="button" class="btn btn-secondary" (click)="printMarksLedger()" title="Print examination grade ledger">
            <app-icon name="printer" [size]="16"></app-icon>
            <span>Print Ledger</span>
          </button>
          <button type="button" class="btn btn-primary" (click)="saveMarksLedger()">
            <app-icon name="save" [size]="16"></app-icon>
            <span>{{ hasDirtyRows() ? 'Save Edits (' + getDirtyRowsCount() + ')' : (getSavedRecordsCount() > 0 ? 'Update Marks Ledger' : 'Save Marks Ledger') }}</span>
          </button>
        </div>
      </div>

      <!-- SELECTION & FILTER BAR -->
      <div class="card mb-4 filter-card no-print">
        <div class="card-body">
          <div class="filter-grid">
            <div class="form-group mb-0">
              <label class="form-label">
                <app-icon name="award" [size]="14"></app-icon>
                Examination Term <span class="required">*</span>
              </label>
              <select class="form-select" [(ngModel)]="selectedExamId" (change)="onFilterChange()">
                <option *ngFor="let e of exams" [value]="e.id">
                  {{ e.name }} ({{ e.term }})
                </option>
              </select>
            </div>

            <div class="form-group mb-0">
              <label class="form-label">
                <app-icon name="book-open" [size]="14"></app-icon>
                Academic Class <span class="required">*</span>
              </label>
              <select class="form-select" [(ngModel)]="selectedClassId" (change)="onClassChange()">
                <option *ngFor="let c of classes" [value]="c.id">{{ c.name }}</option>
              </select>
            </div>

            <div class="form-group mb-0">
              <label class="form-label">
                <app-icon name="layers" [size]="14"></app-icon>
                Class Section <span class="required">*</span>
              </label>
              <select class="form-select" [(ngModel)]="selectedSectionId" (change)="onFilterChange()">
                <option *ngFor="let s of sections" [value]="s.id">{{ s.name }}</option>
              </select>
            </div>

            <div class="form-group mb-0">
              <label class="form-label">
                <app-icon name="file-text" [size]="14"></app-icon>
                Subject Assessment <span class="required">*</span>
              </label>
              <select class="form-select" [(ngModel)]="selectedSubjectId" (change)="onSubjectChange()">
                <option *ngFor="let sub of subjects" [value]="sub.id">
                  {{ sub.name }} ({{ sub.code }}) • {{ sub.fullMarks }} Marks
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- PRINT-ONLY INSTITUTION LETTERHEAD HEADER -->
      <div class="print-header only-print">
        <div class="print-title-area">
          <h2>{{ schoolName }}</h2>
          <p class="print-sub">{{ schoolAddress }}</p>
          <div class="print-report-tag">EXAMINATION MARKS LEDGER & ASSESSMENT TABULATION</div>
        </div>
        <div class="print-meta-grid">
          <div><strong>Exam Term:</strong> {{ getSelectedExamName() }}</div>
          <div><strong>Academic Year:</strong> 2026 - 2027</div>
          <div><strong>Class:</strong> {{ getSelectedClassName() }} ({{ getSelectedSectionName() }})</div>
          <div><strong>Subject:</strong> {{ getSelectedSubjectName() }} (Full: {{ breakdown.theoryMax + breakdown.mcqMax + breakdown.practicalMax }})</div>
          <div><strong>Date:</strong> {{ todayDate }}</div>
          <div><strong>Campus:</strong> {{ getActiveCampusName() }}</div>
        </div>
      </div>

      <!-- KPI METRIC HIGHLIGHTS STRIP -->
      <div class="kpi-strip mb-4 no-print">
        <div class="kpi-box">
          <div class="kpi-top">
            <span class="kpi-label">Section Enrollment</span>
            <app-icon name="users" [size]="16" class="text-indigo"></app-icon>
          </div>
          <span class="kpi-val">{{ markRows.length }}</span>
          <span class="kpi-sub">Students in {{ getSelectedSectionName() }}</span>
        </div>

        <div class="kpi-box">
          <div class="kpi-top">
            <span class="kpi-label">Marks Evaluated</span>
            <app-icon name="check-circle" [size]="16" class="text-emerald"></app-icon>
          </div>
          <span class="kpi-val text-primary">{{ getRecordedCount() }} / {{ markRows.length }}</span>
          <span class="kpi-sub">{{ getCompletionRate() }}% Evaluation Completed</span>
        </div>

        <div class="kpi-box">
          <div class="kpi-top">
            <span class="kpi-label">Subject Average</span>
            <app-icon name="bar-chart-2" [size]="16" class="text-indigo"></app-icon>
          </div>
          <span class="kpi-val text-indigo">{{ getAverageMarks() }} <small>/ {{ getSelectedSubjectFullMarks() }}</small></span>
          <span class="kpi-sub">Class Mean Score</span>
        </div>

        <div class="kpi-box">
          <div class="kpi-top">
            <span class="kpi-label">Highest Score</span>
            <app-icon name="award" [size]="16" class="text-emerald"></app-icon>
          </div>
          <span class="kpi-val text-emerald">{{ getHighestScore() }}</span>
          <span class="kpi-sub">{{ getHighestAchievedMark() }}</span>
        </div>

        <div class="kpi-box">
          <div class="kpi-top">
            <span class="kpi-label">Pass Percentage</span>
            <app-icon name="trending-up" [size]="16" class="text-success"></app-icon>
          </div>
          <span class="kpi-val text-success">{{ getPassRate() }}%</span>
          <span class="kpi-sub">{{ getPassedCount() }} Passing • {{ getAbsentCount() }} Absent</span>
        </div>
      </div>

      <!-- DYNAMIC ASSESSMENT STRUCTURE & SCHEME BANNER -->
      <div class="assessment-structure-banner mb-4 no-print">
        <div class="banner-left">
          <div class="banner-icon-box">
            <app-icon name="sliders" [size]="20" class="text-indigo"></app-icon>
          </div>
          <div class="banner-text">
            <div class="banner-title-line">
              <span class="banner-title">Assessment Distribution: <strong>{{ getSelectedSubjectName() }}</strong></span>
              <span class="scheme-badge badge-tier-info">
                {{ getActiveTierLabel() }}
              </span>
              <span class="scheme-badge" [class.badge-custom]="isCurrentBreakdownCustom" [class.badge-default]="!isCurrentBreakdownCustom">
                <app-icon [name]="isCurrentBreakdownCustom ? 'check-circle' : 'info'" [size]="12"></app-icon>
                {{ isCurrentBreakdownCustom ? 'Custom Configured' : 'Tier Default' }}
              </span>
              <span class="scheme-badge badge-nomcq" *ngIf="!breakdown.hasMcq">
                <app-icon name="minus-circle" [size]="12"></app-icon>
                NO MCQ Required
              </span>
            </div>
            <div class="banner-pills-row">
              <span class="comp-pill pill-theory" *ngIf="breakdown.hasTheory">
                {{ breakdown.theoryName }}: <strong>{{ breakdown.theoryMax }}</strong>
              </span>
              <span class="comp-pill pill-mcq" *ngIf="breakdown.hasMcq">
                {{ breakdown.mcqName }}: <strong>{{ breakdown.mcqMax }}</strong>
              </span>
              <span class="comp-pill pill-practical" *ngIf="breakdown.hasPractical">
                {{ breakdown.practicalName }}: <strong>{{ breakdown.practicalMax }}</strong>
              </span>
              <span class="comp-pill pill-viva" *ngIf="breakdown.hasViva">
                {{ breakdown.vivaName }}: <strong>{{ breakdown.vivaMax }}</strong>
              </span>
              <span class="comp-pill pill-total">Total: <strong>{{ breakdown.fullMarks }}</strong></span>
              <span class="comp-pill pill-pass">Pass Mark: <strong>{{ breakdown.passMarks }}</strong></span>
            </div>
          </div>
        </div>
        <div class="banner-right">
          <button type="button" class="btn btn-sm btn-primary" (click)="openAssessmentModal()">
            <app-icon name="sliders" [size]="14"></app-icon>
            <span>Configure Scheme</span>
          </button>
          <button type="button" class="btn btn-sm btn-outline-danger" *ngIf="isCurrentBreakdownCustom" (click)="resetAssessmentScheme()" title="Reset to standard curriculum tier structure">
            <app-icon name="rotate-ccw" [size]="14"></app-icon>
            <span>Reset</span>
          </button>
        </div>
      </div>

      <!-- SAVED RECORDS & EDIT MODE ALERT -->
      <div class="edit-mode-alert mb-4 no-print" *ngIf="getSavedRecordsCount() > 0">
        <div class="alert-left">
          <div class="alert-icon-box">
            <app-icon name="edit-3" [size]="18" class="text-emerald"></app-icon>
          </div>
          <div>
            <div class="alert-title">
              <strong>Evaluation Ledger Loaded:</strong> Showing recorded marks for <strong>{{ getSelectedSubjectName() }}</strong>
              <span class="badge-record-count">{{ getSavedRecordsCount() }} of {{ markRows.length }} Evaluated</span>
              <span class="badge-modified-count" *ngIf="hasDirtyRows()">{{ getDirtyRowsCount() }} Row(s) Modified</span>
            </div>
            <div class="alert-sub">
              Scores are editable. You can modify any Theory, MCQ, Practical, or Viva marks directly in the table. Click <strong>Update Marks Ledger</strong> to save changes.
            </div>
          </div>
        </div>
        <div class="alert-actions">
          <button type="button" class="btn btn-sm btn-outline" *ngIf="hasDirtyRows()" (click)="discardUnsavedChanges()" title="Revert uncommitted edits back to saved scores">
            <app-icon name="rotate-ccw" [size]="14"></app-icon>
            <span>Discard Changes</span>
          </button>
          <button type="button" class="btn btn-sm btn-primary" (click)="saveMarksLedger()">
            <app-icon name="save" [size]="14"></app-icon>
            <span>{{ hasDirtyRows() ? 'Save Edits (' + getDirtyRowsCount() + ')' : 'Update Marks Ledger' }}</span>
          </button>
        </div>
      </div>

      <!-- MARKS ENTRY TABLE CARD -->
      <div class="card">
        <div class="card-header no-print">
          <div class="card-title-group">
            <div class="card-title">
              <app-icon name="clipboard-check" [size]="20" class="text-primary"></app-icon>
              <span>
                Assessment Sheet: <strong>{{ getSelectedSubjectName() }}</strong>
              </span>
              <span class="sub-pill">Class: {{ getSelectedClassName() }} — {{ getSelectedSectionName() }}</span>
              <button
                type="button"
                class="btn-inline-setup"
                (click)="openAssessmentModal()"
                title="Configure marks distribution, Written/MCQ weightings, or turn off MCQ"
              >
                <app-icon name="sliders" [size]="13"></app-icon>
                <span>Marks Setup (MCQ on/off)</span>
              </button>
            </div>
            <div class="breakdown-badges">
              <span class="badge-item bg-indigo-subtle" *ngIf="breakdown.hasTheory">{{ breakdown.theoryName }}: Max {{ breakdown.theoryMax }}</span>
              <span class="badge-item bg-purple-subtle" *ngIf="breakdown.hasMcq">{{ breakdown.mcqName }}: Max {{ breakdown.mcqMax }}</span>
              <span class="badge-item bg-emerald-subtle" *ngIf="breakdown.hasPractical">{{ breakdown.practicalName }}: Max {{ breakdown.practicalMax }}</span>
              <span class="badge-item bg-amber-subtle" *ngIf="breakdown.hasViva">{{ breakdown.vivaName }}: Max {{ breakdown.vivaMax }}</span>
              <span class="badge-item bg-rose-subtle">Pass Mark: {{ breakdown.passMarks }}</span>
            </div>
          </div>

          <div class="table-search-row">
            <div class="search-box">
              <app-icon name="search" [size]="15" class="search-icon"></app-icon>
              <input
                type="text"
                class="form-control form-control-sm search-input"
                placeholder="Search student or roll..."
                [(ngModel)]="searchQuery"
              />
            </div>
            <select class="form-select form-select-sm status-filter" [(ngModel)]="statusFilter">
              <option value="ALL">All Students ({{ markRows.length }})</option>
              <option value="PASS">Passing Only ({{ getPassedCount() }})</option>
              <option value="FAIL">Failing Only ({{ getFailedCount() }})</option>
              <option value="ABSENT">Absent Only ({{ getAbsentCount() }})</option>
              <option value="PENDING">Pending ({{ getPendingCount() }})</option>
            </select>
          </div>
        </div>

        <div class="app-table-wrapper">
          <table class="app-table">
            <thead>
              <tr>
                <th style="width: 70px;">Roll</th>
                <th>Student Dossier</th>
                <th style="width: 100px;" class="text-center">Attendance</th>
                <th style="width: 120px;" class="text-center th-clickable" *ngIf="breakdown.hasTheory" (click)="openAssessmentModal()" title="Click to customize Theory marks distribution">
                  <div class="th-inner-click">
                    <span>{{ breakdown.theoryName }} ({{ breakdown.theoryMax }})</span>
                    <app-icon name="sliders" [size]="11" class="th-icon-hint"></app-icon>
                  </div>
                </th>
                <th style="width: 110px;" class="text-center th-clickable" *ngIf="breakdown.hasMcq" (click)="openAssessmentModal()" title="Click to configure or disable MCQ marks">
                  <div class="th-inner-click">
                    <span>{{ breakdown.mcqName }} ({{ breakdown.mcqMax }})</span>
                    <app-icon name="sliders" [size]="11" class="th-icon-hint"></app-icon>
                  </div>
                </th>
                <th style="width: 110px;" class="text-center th-clickable" *ngIf="breakdown.hasPractical" (click)="openAssessmentModal()" title="Click to configure Practical marks">
                  <div class="th-inner-click">
                    <span>{{ breakdown.practicalName }} ({{ breakdown.practicalMax }})</span>
                    <app-icon name="sliders" [size]="11" class="th-icon-hint"></app-icon>
                  </div>
                </th>
                <th style="width: 110px;" class="text-center th-clickable" *ngIf="breakdown.hasViva" (click)="openAssessmentModal()" title="Click to configure Viva marks">
                  <div class="th-inner-click">
                    <span>{{ breakdown.vivaName }} ({{ breakdown.vivaMax }})</span>
                    <app-icon name="sliders" [size]="11" class="th-icon-hint"></app-icon>
                  </div>
                </th>
                <th style="width: 110px;" class="text-center">Total ({{ breakdown.fullMarks }})</th>
                <th style="width: 85px;" class="text-center">Grade</th>
                <th style="width: 75px;" class="text-center">GPA</th>
                <th style="width: 95px;" class="text-center">Status</th>
                <th style="min-width: 180px;">Teacher Remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr
                *ngFor="let row of filteredMarkRows; let idx = index"
                [class.failing-row]="!row.isPass && !row.isAbsent && row.totalObtained > 0"
                [class.absent-row]="row.isAbsent"
              >
                <td>
                  <span class="roll-badge">#{{ row.rollNo }}</span>
                </td>

                <td>
                  <div class="student-cell">
                    <img campusImage [src]="row.avatar" [alt]="row.studentName" class="table-avatar" />
                    <div>
                      <div class="student-name-row">
                        <span class="student-name">{{ row.studentName }}</span>
                        <span class="row-entry-pill" [class.entry-dirty]="row.isDirty" [class.entry-saved]="!row.isDirty && row.isPreviouslySaved" [class.entry-new]="!row.isDirty && !row.isPreviouslySaved">
                          <app-icon [name]="row.isDirty ? 'edit-2' : (row.isPreviouslySaved ? 'check' : 'plus')" [size]="10"></app-icon>
                          {{ row.isDirty ? 'Modified' : (row.isPreviouslySaved ? 'Saved' : 'New') }}
                        </span>
                      </div>
                      <div class="student-adm">{{ row.admissionNo }}</div>
                    </div>
                  </div>
                </td>

                <!-- Absent Toggle -->
                <td class="text-center">
                  <button
                    type="button"
                    class="absent-toggle-btn"
                    [class.is-absent]="row.isAbsent"
                    (click)="toggleAbsent(row)"
                    [title]="row.isAbsent ? 'Student is Absent' : 'Student is Present'"
                  >
                    <span class="status-indicator"></span>
                    <span>{{ row.isAbsent ? 'Absent' : 'Present' }}</span>
                  </button>
                </td>

                <!-- Theory Marks Input -->
                <td class="text-center" *ngIf="breakdown.hasTheory">
                  <input
                    type="number"
                    min="0"
                    [max]="breakdown.theoryMax"
                    class="form-control marks-input"
                    [class.input-error]="row.theoryMarks > breakdown.theoryMax"
                    [disabled]="row.isAbsent"
                    [(ngModel)]="row.theoryMarks"
                    (input)="recalculateRow(row)"
                    placeholder="0"
                  />
                </td>

                <!-- MCQ Marks Input -->
                <td class="text-center" *ngIf="breakdown.hasMcq">
                  <input
                    type="number"
                    min="0"
                    [max]="breakdown.mcqMax"
                    class="form-control marks-input"
                    [class.input-error]="row.mcqMarks > breakdown.mcqMax"
                    [disabled]="row.isAbsent"
                    [(ngModel)]="row.mcqMarks"
                    (input)="recalculateRow(row)"
                    placeholder="0"
                  />
                </td>

                <!-- Practical Marks Input -->
                <td class="text-center" *ngIf="breakdown.hasPractical">
                  <input
                    type="number"
                    min="0"
                    [max]="breakdown.practicalMax"
                    class="form-control marks-input"
                    [class.input-error]="row.practicalMarks > breakdown.practicalMax"
                    [disabled]="row.isAbsent"
                    [(ngModel)]="row.practicalMarks"
                    (input)="recalculateRow(row)"
                    placeholder="0"
                  />
                </td>

                <!-- Viva / Oral Marks Input -->
                <td class="text-center" *ngIf="breakdown.hasViva">
                  <input
                    type="number"
                    min="0"
                    [max]="breakdown.vivaMax"
                    class="form-control marks-input"
                    [class.input-error]="row.vivaMarks > breakdown.vivaMax"
                    [disabled]="row.isAbsent"
                    [(ngModel)]="row.vivaMarks"
                    (input)="recalculateRow(row)"
                    placeholder="0"
                  />
                </td>

                <!-- Total Marks Badge -->
                <td class="text-center">
                  <span
                    class="total-badge"
                    [class.badge-danger]="!row.isPass && !row.isAbsent"
                    [class.badge-absent]="row.isAbsent"
                  >
                    {{ row.isAbsent ? 'ABS' : row.totalObtained }}
                  </span>
                </td>

                <!-- Letter Grade Pill -->
                <td class="text-center">
                  <span class="grade-pill" [ngClass]="getGradeClass(row.grade)">
                    {{ row.isAbsent ? 'F' : row.grade }}
                  </span>
                </td>

                <!-- GPA Point -->
                <td class="text-center">
                  <strong class="gp-text" [class.text-danger]="!row.isPass">{{ row.isAbsent ? '0.0' : row.gradePoint.toFixed(1) }}</strong>
                </td>

                <!-- Status Pill -->
                <td class="text-center">
                  <span
                    class="status-pill"
                    [class.pass]="row.isPass && !row.isAbsent"
                    [class.fail]="!row.isPass && !row.isAbsent"
                    [class.absent]="row.isAbsent"
                  >
                    {{ row.isAbsent ? 'ABSENT' : (row.isPass ? 'PASSED' : 'FAILED') }}
                  </span>
                </td>

                <!-- Teacher Remark -->
                <td>
                  <input
                    type="text"
                    class="form-control remark-input"
                    [(ngModel)]="row.remark"
                    (change)="markRowDirty(row)"
                    placeholder="e.g. Good grasp of concepts"
                  />
                </td>
              </tr>

              <tr *ngIf="filteredMarkRows.length === 0">
                <td colspan="11" class="text-center py-5 text-muted">
                  <app-icon name="users" [size]="36" class="mb-2 text-slate-400"></app-icon>
                  <div class="empty-title">No Enrolled Students Found</div>
                  <div class="empty-sub">
                    No students matching your selection criteria in {{ getSelectedClassName() }} ({{ getSelectedSectionName() }}).
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PRINT FOOTER SIGNATURE BAR -->
        <div class="print-signatures only-print">
          <div class="sig-box">
            <div class="sig-line"></div>
            <span>Subject Teacher's Signature</span>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <span>Class Teacher's Signature</span>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <span>Exam Controller</span>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <span>Head of Institution / Principal</span>
          </div>
        </div>

        <!-- CARD FOOTER ACTIONS BAR -->
        <div class="card-footer-bar no-print">
          <div class="footer-hint">
            <app-icon name="info" [size]="16" class="text-muted"></app-icon>
            <span>
              Grading Scheme: <strong>A+</strong> (80-100), <strong>A</strong> (70-79), <strong>A-</strong> (60-69),
              <strong>B</strong> (50-59), <strong>C</strong> (40-49), <strong>D</strong> (33-39), <strong>F</strong> (&lt;33).
            </span>
          </div>
          <div class="footer-actions">
            <button type="button" class="btn btn-outline" (click)="batchFillRemarks('Satisfactory performance.')">
              <app-icon name="message-square" [size]="15"></app-icon>
              <span>Batch Remark</span>
            </button>
            <a routerLink="/app/exams/marksheet" class="btn btn-secondary">
              <app-icon name="file-text" [size]="15"></app-icon>
              <span>View Marksheets</span>
            </a>
            <button type="button" class="btn btn-primary" (click)="saveMarksLedger()">
              <app-icon name="save" [size]="16"></app-icon>
              <span>{{ hasDirtyRows() ? 'Save Modified Marks (' + getDirtyRowsCount() + ')' : (getSavedRecordsCount() > 0 ? 'Update Marks Ledger (' + markRows.length + ' Students)' : 'Save Marks Ledger (' + markRows.length + ' Students)') }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ASSESSMENT SETUP MODAL -->
      <app-modal
        [(isOpen)]="isAssessmentModalOpen"
        title="Configure Assessment Scheme & Mark Distribution"
        subtitle="Customize class-wise Theory, MCQ, Practical, and Viva weightings for academic evaluation."
        [maxWidth]="760"
      >
        <div class="assessment-modal-body">
          <!-- Academic Context Box -->
          <div class="setup-context-box mb-4">
            <div class="context-item">
              <span class="ctx-label">Class:</span>
              <strong class="ctx-val">{{ getSelectedClassName() }}</strong>
            </div>
            <div class="context-item">
              <span class="ctx-label">Subject:</span>
              <strong class="ctx-val">{{ getSelectedSubjectName() }}</strong>
            </div>
            <div class="context-item">
              <span class="ctx-label">Exam:</span>
              <strong class="ctx-val">{{ getSelectedExamName() }}</strong>
            </div>
            <div class="context-item">
              <span class="ctx-label">Status:</span>
              <span class="scheme-badge" [class.badge-custom]="isCurrentBreakdownCustom" [class.badge-default]="!isCurrentBreakdownCustom">
                {{ isCurrentBreakdownCustom ? 'Custom Scheme' : 'Tier Default' }}
              </span>
            </div>
          </div>

          <!-- Quick Academic Tier Presets (Pre-Primary, Primary, Secondary) -->
          <div class="quick-tier-presets-box mb-4">
            <div class="tier-presets-header">
              <div class="section-title">
                <app-icon name="layers" [size]="15" class="text-indigo-600"></app-icon>
                <span>Quick Academic Tier Presets:</span>
              </div>
              <div class="flex items-center gap-2">
                <a [routerLink]="['/app/exams/setup']" [queryParams]="{ tab: 'schemes', classId: selectedClassId }" (click)="isAssessmentModalOpen = false" class="tier-setup-link" title="Open Full Assessment Matrix Setup Screen">
                  <app-icon name="sliders" [size]="12"></app-icon>
                  <span>Class Marks Setup Screen</span>
                </a>
                <a routerLink="/app/academic/classes" (click)="isAssessmentModalOpen = false" class="tier-setup-link" title="Open Academic Classes & Tiers Setup">
                  <app-icon name="external-link" [size]="12"></app-icon>
                  <span>Classes & Tiers</span>
                </a>
              </div>
            </div>
            <div class="tier-cards-row">
              <!-- Pre-Primary -->
              <button
                type="button"
                class="tier-card-btn"
                [class.active-tier]="assessmentFormActiveTier === 'pre-primary'"
                (click)="applyAcademicTierPreset('pre-primary')"
              >
                <div class="tier-card-top">
                  <span class="tier-card-name">🧸 Pre-Primary</span>
                  <span class="badge-tier-nomcq">NO MCQ</span>
                </div>
                <div class="tier-card-desc">Written 80m • Viva 20m</div>
                <div class="tier-card-sub">Play, Narsari, KG (Oral/CA & Activity)</div>
              </button>

              <!-- Primary -->
              <button
                type="button"
                class="tier-card-btn"
                [class.active-tier]="assessmentFormActiveTier === 'primary'"
                (click)="applyAcademicTierPreset('primary')"
              >
                <div class="tier-card-top">
                  <span class="tier-card-name">🎒 Primary</span>
                  <span class="badge-tier-nomcq">NO MCQ</span>
                </div>
                <div class="tier-card-desc">Written 80m • Viva 20m</div>
                <div class="tier-card-sub">Class 1 to 5 (General Math: 100% Written)</div>
              </button>

              <!-- Secondary -->
              <button
                type="button"
                class="tier-card-btn"
                [class.active-tier]="assessmentFormActiveTier === 'secondary'"
                (click)="applyAcademicTierPreset('secondary')"
              >
                <div class="tier-card-top">
                  <span class="tier-card-name">🎓 Secondary</span>
                  <span class="badge-tier-hasmcq">CQ + MCQ</span>
                </div>
                <div class="tier-card-desc">Theory (CQ) 70m • MCQ 30m</div>
                <div class="tier-card-sub">Class 6 to 10 (Science: CQ 50 + MCQ 25 + Lab 25)</div>
              </button>
            </div>
          </div>

          <!-- Subject Specific Templates Section -->
          <div class="presets-section mb-4">
            <div class="section-title">
              <app-icon name="zap" [size]="15" class="text-amber-500"></app-icon>
              <span>Subject Specific Templates</span>
            </div>
            <p class="presets-hint">Click to quickly configure standard subject distributions:</p>
            <div class="preset-cards-grid">
              <button type="button" class="preset-card" (click)="applyAssessmentPreset('math_100')">
                <div class="preset-header">
                  <span class="preset-name">📐 Mathematics (100% Written)</span>
                  <span class="badge-no-mcq">NO MCQ</span>
                </div>
                <div class="preset-desc">Written 100 • Full Mark 100</div>
                <span class="preset-tag">General / Higher Math</span>
              </button>

              <button type="button" class="preset-card" (click)="applyAssessmentPreset('science_50_25_25')">
                <div class="preset-header">
                  <span class="preset-name">🔬 Science with Lab</span>
                  <span class="badge-has-lab">3 Components</span>
                </div>
                <div class="preset-desc">Theory 50 • MCQ 25 • Practical 25</div>
                <span class="preset-tag">Physics, Chem, Bio</span>
              </button>

              <button type="button" class="preset-card" (click)="applyAssessmentPreset('ict_25_25')">
                <div class="preset-header">
                  <span class="preset-name">💻 ICT / Half Paper (50)</span>
                  <span class="badge-half">NO MCQ</span>
                </div>
                <div class="preset-desc">Theory 25 • Practical 25</div>
                <span class="preset-tag">ICT, Computer (Full: 50)</span>
              </button>

              <button type="button" class="preset-card" (click)="applyAssessmentPreset('secondary_70_30')">
                <div class="preset-header">
                  <span class="preset-name">📖 Secondary General (CQ+MCQ)</span>
                  <span class="badge-has-mcq">CQ + MCQ</span>
                </div>
                <div class="preset-desc">Theory (CQ) 70 • MCQ 30</div>
                <span class="preset-tag">Bangla, English, BGS</span>
              </button>
            </div>
          </div>

          <!-- Component Toggles & Weightings -->
          <div class="components-form-section mb-4">
            <div class="section-title">
              <app-icon name="sliders" [size]="15" class="text-indigo-600"></app-icon>
              <span>Custom Component Allocation & Labels</span>
            </div>

            <!-- Component 1: Theory / Written -->
            <div class="comp-config-row" [class.comp-disabled]="!assessmentForm.hasTheory">
              <div class="comp-toggle-box">
                <input type="checkbox" id="chkTheory" [(ngModel)]="assessmentForm.hasTheory" />
                <label for="chkTheory" class="comp-title">Theory / Written Exam</label>
              </div>
              <div class="comp-inputs-box" *ngIf="assessmentForm.hasTheory">
                <div class="form-group mb-0">
                  <label class="form-label-xs">Column Header Name</label>
                  <input type="text" class="form-control form-control-sm" [(ngModel)]="assessmentForm.theoryName" placeholder="e.g. Theory, Written" />
                </div>
                <div class="form-group mb-0 w-80">
                  <label class="form-label-xs">Max Marks</label>
                  <input type="number" min="1" max="100" class="form-control form-control-sm text-center font-bold" [(ngModel)]="assessmentForm.theoryMax" />
                </div>
              </div>
            </div>

            <!-- Component 2: MCQ (Toggleable ON/OFF!) -->
            <div class="comp-config-row" [class.comp-disabled]="!assessmentForm.hasMcq">
              <div class="comp-toggle-box">
                <input type="checkbox" id="chkMcq" [(ngModel)]="assessmentForm.hasMcq" />
                <label for="chkMcq" class="comp-title">
                  Multiple Choice (MCQ)
                  <span class="pill-disabled" *ngIf="!assessmentForm.hasMcq">Disabled (No MCQ Column)</span>
                </label>
              </div>
              <div class="comp-inputs-box" *ngIf="assessmentForm.hasMcq">
                <div class="form-group mb-0">
                  <label class="form-label-xs">Column Header Name</label>
                  <input type="text" class="form-control form-control-sm" [(ngModel)]="assessmentForm.mcqName" placeholder="e.g. MCQ, Objective" />
                </div>
                <div class="form-group mb-0 w-80">
                  <label class="form-label-xs">Max Marks</label>
                  <input type="number" min="1" max="100" class="form-control form-control-sm text-center font-bold" [(ngModel)]="assessmentForm.mcqMax" />
                </div>
              </div>
            </div>

            <!-- Component 3: Practical -->
            <div class="comp-config-row" [class.comp-disabled]="!assessmentForm.hasPractical">
              <div class="comp-toggle-box">
                <input type="checkbox" id="chkPractical" [(ngModel)]="assessmentForm.hasPractical" />
                <label for="chkPractical" class="comp-title">
                  Practical / Lab Work
                  <span class="pill-disabled" *ngIf="!assessmentForm.hasPractical">Disabled</span>
                </label>
              </div>
              <div class="comp-inputs-box" *ngIf="assessmentForm.hasPractical">
                <div class="form-group mb-0">
                  <label class="form-label-xs">Column Header Name</label>
                  <input type="text" class="form-control form-control-sm" [(ngModel)]="assessmentForm.practicalName" placeholder="e.g. Practical, Lab" />
                </div>
                <div class="form-group mb-0 w-80">
                  <label class="form-label-xs">Max Marks</label>
                  <input type="number" min="1" max="100" class="form-control form-control-sm text-center font-bold" [(ngModel)]="assessmentForm.practicalMax" />
                </div>
              </div>
            </div>

            <!-- Component 4: Viva / Oral / CA -->
            <div class="comp-config-row" [class.comp-disabled]="!assessmentForm.hasViva">
              <div class="comp-toggle-box">
                <input type="checkbox" id="chkViva" [(ngModel)]="assessmentForm.hasViva" />
                <label for="chkViva" class="comp-title">
                  Oral / Viva / Continuous Assessment
                  <span class="pill-disabled" *ngIf="!assessmentForm.hasViva">Disabled</span>
                </label>
              </div>
              <div class="comp-inputs-box" *ngIf="assessmentForm.hasViva">
                <div class="form-group mb-0">
                  <label class="form-label-xs">Column Header Name</label>
                  <input type="text" class="form-control form-control-sm" [(ngModel)]="assessmentForm.vivaName" placeholder="e.g. Oral / Viva, CA" />
                </div>
                <div class="form-group mb-0 w-80">
                  <label class="form-label-xs">Max Marks</label>
                  <input type="number" min="1" max="100" class="form-control form-control-sm text-center font-bold" [(ngModel)]="assessmentForm.vivaMax" />
                </div>
              </div>
            </div>
          </div>

          <!-- Total Calculation & Validation Strip -->
          <div class="validation-strip mb-4" [class.is-valid]="isAssessmentFormValid()" [class.is-invalid]="!isAssessmentFormValid()">
            <div class="v-left">
              <app-icon [name]="isAssessmentFormValid() ? 'check-circle' : 'alert-circle'" [size]="22" [class.text-emerald]="isAssessmentFormValid()" [class.text-rose]="!isAssessmentFormValid()"></app-icon>
              <div>
                <div class="v-title">
                  Component Sum: <strong>{{ getAssessmentFormSum() }}</strong> / Target Full Marks: <strong>{{ assessmentForm.fullMarks }}</strong>
                </div>
                <div class="v-desc" *ngIf="isAssessmentFormValid()">
                  Allocation balanced. Active components equal {{ assessmentForm.fullMarks }} marks.
                </div>
                <div class="v-desc text-danger font-bold" *ngIf="!isAssessmentFormValid()">
                  Component sum ({{ getAssessmentFormSum() }}) does not match Full Marks ({{ assessmentForm.fullMarks }}). Difference: {{ assessmentForm.fullMarks - getAssessmentFormSum() }}
                </div>
              </div>
            </div>

            <div class="v-right">
              <div class="field-item">
                <label>Full Marks:</label>
                <input type="number" class="form-control form-control-sm font-bold text-center w-70" [(ngModel)]="assessmentForm.fullMarks" />
              </div>
              <div class="field-item">
                <label>Pass Mark:</label>
                <input type="number" class="form-control form-control-sm font-bold text-center w-70" [(ngModel)]="assessmentForm.passMarks" />
              </div>
            </div>
          </div>

          <!-- GENERATED TABLE COLUMNS LIVE PREVIEW -->
          <div class="table-preview-box mb-4">
            <div class="preview-header">
              <div class="preview-label">
                <app-icon name="eye" [size]="14" class="text-indigo-600"></app-icon>
                <span>GENERATED TABLE COLUMNS PREVIEW:</span>
              </div>
              <span class="preview-note" *ngIf="!assessmentForm.hasMcq">
                <app-icon name="check" [size]="12" class="text-emerald"></app-icon>
                NO MCQ Mode Active (Column Hidden)
              </span>
            </div>
            <div class="preview-cols-row">
              <span class="preview-col static-col">Roll</span>
              <span class="preview-col static-col">Student Dossier</span>
              <span class="preview-col static-col">Attendance</span>
              <span class="preview-col comp-col theory-col" *ngIf="assessmentForm.hasTheory">
                {{ assessmentForm.theoryName || 'Theory' }} ({{ assessmentForm.theoryMax }})
              </span>
              <span class="preview-col comp-col mcq-col" *ngIf="assessmentForm.hasMcq">
                {{ assessmentForm.mcqName || 'MCQ' }} ({{ assessmentForm.mcqMax }})
              </span>
              <span class="preview-col comp-col practical-col" *ngIf="assessmentForm.hasPractical">
                {{ assessmentForm.practicalName || 'Practical' }} ({{ assessmentForm.practicalMax }})
              </span>
              <span class="preview-col comp-col viva-col" *ngIf="assessmentForm.hasViva">
                {{ assessmentForm.vivaName || 'Viva' }} ({{ assessmentForm.vivaMax }})
              </span>
              <span class="preview-col static-col">Total ({{ assessmentForm.fullMarks }})</span>
              <span class="preview-col static-col">Grade</span>
              <span class="preview-col static-col">GPA</span>
              <span class="preview-col static-col">Status</span>
              <span class="preview-col static-col">Remarks</span>
            </div>
          </div>

          <!-- Scope of Application -->
          <div class="scope-selection-box mb-4">
            <div class="section-title">
              <app-icon name="layers" [size]="15" class="text-indigo-600"></app-icon>
              <span>Apply Assessment Scheme To:</span>
            </div>
            <div class="scope-options-list">
              <label class="scope-option">
                <input type="radio" name="assessmentScope" value="subject_only" [(ngModel)]="assessmentScope" />
                <span>Only <strong>{{ getSelectedSubjectName() }}</strong> in <strong>{{ getSelectedClassName() }}</strong></span>
              </label>
              <label class="scope-option">
                <input type="radio" name="assessmentScope" value="all_subjects_in_class" [(ngModel)]="assessmentScope" />
                <span>All subjects in <strong>{{ getSelectedClassName() }}</strong> (e.g. enforce Primary no-MCQ for whole class)</span>
              </label>
              <label class="scope-option">
                <input type="radio" name="assessmentScope" value="all_classes_for_subject" [(ngModel)]="assessmentScope" />
                <span><strong>{{ getSelectedSubjectName() }}</strong> across ALL classes</span>
              </label>
            </div>
          </div>

          <!-- Modal Action Buttons -->
          <div class="modal-footer-custom">
            <button type="button" class="btn btn-outline" (click)="isAssessmentModalOpen = false">Cancel</button>
            <button type="button" class="btn btn-outline-danger" *ngIf="isCurrentBreakdownCustom" (click)="resetAssessmentScheme()">
              <app-icon name="rotate-ccw" [size]="14"></app-icon>
              <span>Reset Default</span>
            </button>
            <button type="button" class="btn btn-primary" [disabled]="!isAssessmentFormValid()" (click)="saveAssessmentScheme()">
              <app-icon name="check" [size]="16"></app-icon>
              <span>Apply & Save Assessment Structure</span>
            </button>
          </div>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    /* Edit Mode Alert Banner */
    .edit-mode-alert {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-left: 4px solid #16a34a;
      border-radius: 12px;
      padding: 12px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .alert-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .alert-icon-box {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #dcfce7;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .alert-title {
      font-size: 0.9rem;
      color: #14532d;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .alert-sub {
      font-size: 0.78rem;
      color: #166534;
      margin-top: 2px;
    }
    .badge-record-count {
      font-size: 0.72rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 9999px;
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
    }
    .badge-modified-count {
      font-size: 0.72rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 9999px;
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fde68a;
    }
    .alert-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    /* Student Name & Row Pills */
    .student-name-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .row-entry-pill {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 0.68rem;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .entry-saved {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }
    .entry-dirty {
      background: #fffbeb;
      color: #d97706;
      border: 1px solid #fcd34d;
    }
    .entry-new {
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid #cbd5e1;
    }

    /* Quick Academic Tier Presets (Matches Routine design) */
    .quick-tier-presets-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
    }
    .tier-presets-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .tier-setup-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #4f46e5;
      text-decoration: none;
      cursor: pointer;
    }
    .tier-setup-link:hover {
      text-decoration: underline;
    }
    .tier-cards-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    @media (max-width: 680px) {
      .tier-cards-row {
        grid-template-columns: 1fr;
      }
    }
    .tier-card-btn {
      background: #ffffff;
      border: 2px solid #e2e8f0;
      border-radius: 9px;
      padding: 12px 14px;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .tier-card-btn:hover {
      border-color: #6366f1;
      background: #faf5ff;
      transform: translateY(-1px);
    }
    .tier-card-btn.active-tier {
      border-color: #4f46e5;
      background: #eef2ff;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
    }
    .tier-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .tier-card-name {
      font-size: 0.9rem;
      font-weight: 800;
      color: #0f172a;
    }
    .badge-tier-nomcq {
      font-size: 0.65rem;
      font-weight: 800;
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fecdd3;
      padding: 1px 6px;
      border-radius: 4px;
    }
    .badge-tier-hasmcq {
      font-size: 0.65rem;
      font-weight: 800;
      background: #e0e7ff;
      color: #4338ca;
      border: 1px solid #c7d2fe;
      padding: 1px 6px;
      border-radius: 4px;
    }
    .tier-card-desc {
      font-size: 0.78rem;
      font-weight: 700;
      color: #334155;
    }
    .tier-card-sub {
      font-size: 0.72rem;
      color: #64748b;
    }

    /* Live Table Column Preview */
    .table-preview-box {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 10px;
      padding: 12px 16px;
    }
    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .preview-label {
      font-size: 0.75rem;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .preview-note {
      font-size: 0.72rem;
      font-weight: 700;
      color: #059669;
      background: #ecfdf5;
      padding: 2px 8px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .preview-cols-row {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding-bottom: 4px;
    }
    .preview-col {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 5px;
      white-space: nowrap;
    }
    .preview-col.static-col {
      background: #e2e8f0;
      color: #475569;
    }
    .preview-col.comp-col.theory-col {
      background: #e0e7ff;
      color: #3730a3;
      border: 1px solid #c7d2fe;
    }
    .preview-col.comp-col.mcq-col {
      background: #f3e8ff;
      color: #6b21a8;
      border: 1px solid #e9d5ff;
    }
    .preview-col.comp-col.practical-col {
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .preview-col.comp-col.viva-col {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }

    /* Setup button */
    .btn-scheme-setup {
      background: #f8fafc;
      border-color: #cbd5e1;
      color: #3b82f6;
      font-weight: 700;
    }
    .btn-scheme-setup:hover {
      background: #eff6ff;
      border-color: #3b82f6;
      color: #1d4ed8;
    }

    /* Assessment Structure Banner */
    .assessment-structure-banner {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #6366f1;
      border-radius: 12px;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    .banner-left {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }
    .banner-icon-box {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #eef2ff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .banner-title-line {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
      flex-wrap: wrap;
    }
    .banner-title {
      font-size: 0.95rem;
      color: #1e293b;
      font-weight: 600;
    }
    .scheme-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .badge-custom {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }
    .badge-default {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
    }
    .badge-nomcq {
      background: #fff1f2;
      color: #e11d48;
      border: 1px solid #fecdd3;
    }
    .badge-tier-info {
      background: #eef2ff;
      color: #3730a3;
      border: 1px solid #c7d2fe;
    }
    .banner-pills-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .comp-pill {
      font-size: 0.75rem;
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 600;
    }
    .pill-theory { background: #eef2ff; color: #4338ca; }
    .pill-mcq { background: #faf5ff; color: #7e22ce; }
    .pill-practical { background: #ecfdf5; color: #047857; }
    .pill-viva { background: #fffbeb; color: #b45309; }
    .pill-total { background: #0f172a; color: #ffffff; }
    .pill-pass { background: #fef2f2; color: #b91c1c; }
    .banner-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    /* Assessment Setup Modal Content */
    .assessment-modal-body {
      padding: 4px;
    }
    .setup-context-box {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 12px 16px;
      border-radius: 8px;
    }
    .context-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .ctx-label {
      font-size: 0.72rem;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
    }
    .ctx-val {
      font-size: 0.88rem;
      color: #0f172a;
    }
    .section-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
    }
    .presets-hint {
      font-size: 0.78rem;
      color: #64748b;
      margin-bottom: 10px;
    }
    .preset-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      gap: 10px;
    }
    .preset-card {
      border: 1px solid #e2e8f0;
      background: #ffffff;
      padding: 10px 12px;
      border-radius: 8px;
      text-align: left;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .preset-card:hover {
      border-color: #6366f1;
      background: #f5f3ff;
      transform: translateY(-1px);
      box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.1);
    }
    .preset-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .preset-name {
      font-weight: 700;
      font-size: 0.82rem;
      color: #0f172a;
    }
    .badge-no-mcq {
      font-size: 0.65rem;
      font-weight: 800;
      background: #fee2e2;
      color: #dc2626;
      padding: 1px 6px;
      border-radius: 4px;
    }
    .badge-has-mcq {
      font-size: 0.65rem;
      font-weight: 800;
      background: #e0e7ff;
      color: #4338ca;
      padding: 1px 6px;
      border-radius: 4px;
    }
    .badge-has-lab {
      font-size: 0.65rem;
      font-weight: 800;
      background: #d1fae5;
      color: #065f46;
      padding: 1px 6px;
      border-radius: 4px;
    }
    .badge-half {
      font-size: 0.65rem;
      font-weight: 800;
      background: #fef3c7;
      color: #92400e;
      padding: 1px 6px;
      border-radius: 4px;
    }
    .preset-desc {
      font-size: 0.75rem;
      color: #475569;
      font-weight: 500;
    }
    .preset-tag {
      font-size: 0.7rem;
      color: #94a3b8;
    }

    /* Component Config Rows */
    .components-form-section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px;
    }
    .comp-config-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 10px 12px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .comp-config-row.comp-disabled {
      opacity: 0.6;
      background: #f1f5f9;
    }
    .comp-toggle-box {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .comp-title {
      font-weight: 700;
      font-size: 0.85rem;
      color: #1e293b;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .pill-disabled {
      font-size: 0.68rem;
      font-weight: 700;
      background: #fee2e2;
      color: #dc2626;
      padding: 1px 6px;
      border-radius: 4px;
    }
    .comp-inputs-box {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .form-label-xs {
      font-size: 0.7rem;
      color: #64748b;
      margin-bottom: 2px;
      display: block;
    }
    .w-80 {
      width: 80px;
    }
    .w-70 {
      width: 70px;
    }

    /* Validation Strip */
    .validation-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid;
    }
    .validation-strip.is-valid {
      background: #ecfdf5;
      border-color: #6ee7b7;
    }
    .validation-strip.is-invalid {
      background: #fff1f2;
      border-color: #fca5a5;
    }
    .v-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .v-title {
      font-size: 0.88rem;
      font-weight: 700;
      color: #0f172a;
    }
    .v-desc {
      font-size: 0.78rem;
      color: #475569;
    }
    .v-right {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .field-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #1e293b;
    }

    /* Scope selection */
    .scope-selection-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 12px 16px;
      border-radius: 8px;
    }
    .scope-options-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .scope-option {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.82rem;
      color: #334155;
      cursor: pointer;
    }

    /* Modal custom footer */
    .modal-footer-custom {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 10px;
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
      margin-top: 10px;
    }

    .page-container {
      padding: 24px 32px;
      max-width: 1480px;
      margin: 0 auto;
    }

    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(99, 102, 241, 0.1);
      color: #4f46e5;
      font-size: 0.8rem;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 9999px;
      margin-bottom: 8px;
      letter-spacing: 0.02em;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background: #4f46e5;
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(99, 102, 241, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
    }

    .role-pill {
      background: #e0e7ff;
      color: #3730a3;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      margin-left: 4px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      gap: 20px;
    }

    .page-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 1.65rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
      margin: 0 0 6px 0;
    }

    .title-icon {
      color: #4f46e5;
    }

    .page-subtitle {
      font-size: 0.95rem;
      color: #64748b;
      margin: 0;
      max-width: 720px;
      line-height: 1.5;
    }

    .page-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 9px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      text-decoration: none;
      border: 1px solid transparent;
    }

    .btn-primary {
      background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.28);
    }
    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(79, 70, 229, 0.38);
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #334155;
      border-color: #e2e8f0;
    }
    .btn-secondary:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    .btn-outline {
      background: #ffffff;
      color: #475569;
      border-color: #cbd5e1;
    }
    .btn-outline:hover {
      background: #f8fafc;
      color: #1e293b;
      border-color: #94a3b8;
    }

    /* Filter Card */
    .filter-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .filter-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 18px;
    }

    @media (max-width: 992px) {
      .filter-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 576px) {
      .filter-grid {
        grid-template-columns: 1fr;
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.82rem;
      font-weight: 700;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .required {
      color: #ef4444;
    }

    .form-select, .form-control {
      padding: 9px 12px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      font-size: 0.9rem;
      color: #1e293b;
      background: #ffffff;
      transition: all 0.2s ease;
    }
    .form-select:focus, .form-control:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }

    /* KPI Highlights Strip */
    .kpi-strip {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 16px;
    }
    @media (max-width: 1200px) {
      .kpi-strip {
        grid-template-columns: repeat(3, 1fr);
      }
    }
    @media (max-width: 768px) {
      .kpi-strip {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 480px) {
      .kpi-strip {
        grid-template-columns: 1fr;
      }
    }

    .kpi-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .kpi-box:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
    }

    .kpi-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .kpi-label {
      font-size: 0.78rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .kpi-val {
      font-size: 1.65rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.1;
      margin-bottom: 4px;
    }
    .kpi-val small {
      font-size: 0.9rem;
      color: #94a3b8;
      font-weight: 500;
    }

    .kpi-sub {
      font-size: 0.77rem;
      color: #64748b;
    }

    .text-primary { color: #4f46e5; }
    .text-indigo { color: #6366f1; }
    .text-emerald { color: #10b981; }
    .text-success { color: #059669; }
    .text-danger { color: #ef4444; }
    .text-muted { color: #64748b; }

    /* Card Layout */
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .card-header {
      padding: 16px 20px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 14px;
      background: #fafafa;
    }

    .card-title-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .card-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.05rem;
      color: #1e293b;
      font-weight: 700;
      flex-wrap: wrap;
    }

    .sub-pill {
      background: #e2e8f0;
      color: #475569;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-left: 6px;
    }

    .breakdown-badges {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .badge-item {
      font-size: 0.76rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 5px;
    }
    .bg-indigo-subtle { background: #e0e7ff; color: #4338ca; }
    .bg-purple-subtle { background: #f3e8ff; color: #7e22ce; }
    .bg-emerald-subtle { background: #d1fae5; color: #065f46; }
    .bg-rose-subtle { background: #ffe4e6; color: #be123c; }

    .table-search-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .search-box {
      position: relative;
      width: 220px;
    }
    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }
    .search-input {
      padding-left: 32px !important;
      font-size: 0.825rem;
    }

    .status-filter {
      width: 170px;
      font-size: 0.825rem;
    }

    /* Table Styles */
    .app-table-wrapper {
      overflow-x: auto;
    }

    .app-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .app-table thead th {
      background: #f8fafc;
      color: #475569;
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 12px 14px;
      border-bottom: 2px solid #e2e8f0;
      white-space: nowrap;
    }

    .th-clickable {
      cursor: pointer;
      user-select: none;
      transition: all 0.2s ease;
    }
    .th-clickable:hover {
      background: #eff6ff !important;
      color: #4338ca !important;
    }
    .th-inner-click {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
    }
    .th-icon-hint {
      color: #6366f1;
      opacity: 0.6;
      transition: all 0.2s ease;
    }
    .th-clickable:hover .th-icon-hint {
      opacity: 1;
      transform: scale(1.2);
    }

    .btn-inline-setup {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #4338ca;
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      border-radius: 6px;
      cursor: pointer;
      margin-left: 10px;
      transition: all 0.2s ease;
    }
    .btn-inline-setup:hover {
      background: #4338ca;
      color: #ffffff;
      border-color: #4338ca;
      box-shadow: 0 2px 6px rgba(67, 56, 202, 0.25);
    }

    .app-table tbody td {
      padding: 12px 14px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
      font-size: 0.875rem;
      color: #1e293b;
    }

    .app-table tbody tr:hover {
      background: #fbfcfe;
    }

    .failing-row {
      background: #fff8f8 !important;
    }
    .absent-row {
      background: #fffdf5 !important;
      opacity: 0.88;
    }

    .roll-badge {
      display: inline-block;
      font-weight: 800;
      color: #4f46e5;
      background: #eef2ff;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.82rem;
    }

    .student-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .table-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #e2e8f0;
    }

    .student-name {
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
    }

    .student-adm {
      font-size: 0.75rem;
      color: #64748b;
      font-family: monospace;
    }

    /* Absent toggle button */
    .absent-toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .absent-toggle-btn .status-indicator {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
    }
    .absent-toggle-btn.is-absent {
      background: #fef3c7;
      border-color: #f59e0b;
      color: #b45309;
    }
    .absent-toggle-btn.is-absent .status-indicator {
      background: #ef4444;
    }

    /* Marks Inputs */
    .marks-input {
      width: 74px;
      text-align: center;
      font-weight: 700;
      margin: 0 auto;
      padding: 6px;
      font-size: 0.95rem;
      border-radius: 6px;
    }
    .marks-input:disabled {
      background: #f1f5f9;
      color: #94a3b8;
      cursor: not-allowed;
      border-color: #e2e8f0;
    }
    .input-error {
      border-color: #ef4444 !important;
      background: #fef2f2 !important;
      color: #b91c1c !important;
    }

    .total-badge {
      display: inline-block;
      font-size: 0.95rem;
      font-weight: 800;
      padding: 4px 12px;
      background: #f1f5f9;
      color: #0f172a;
      border-radius: 6px;
      min-width: 48px;
    }
    .total-badge.badge-danger {
      background: #fee2e2;
      color: #dc2626;
    }
    .total-badge.badge-absent {
      background: #fef3c7;
      color: #d97706;
      font-size: 0.8rem;
    }

    .grade-pill {
      display: inline-block;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 0.82rem;
      letter-spacing: 0.02em;
    }
    .grade-a-plus { background: #10b981; color: #ffffff; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.25); }
    .grade-a { background: #059669; color: #ffffff; }
    .grade-a-minus { background: #0284c7; color: #ffffff; }
    .grade-b { background: #6366f1; color: #ffffff; }
    .grade-c { background: #f59e0b; color: #ffffff; }
    .grade-d { background: #ea580c; color: #ffffff; }
    .grade-f { background: #ef4444; color: #ffffff; }

    .gp-text {
      font-size: 0.92rem;
      font-weight: 800;
      color: #0f172a;
    }

    .status-pill {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 9999px;
      letter-spacing: 0.03em;
    }
    .status-pill.pass {
      background: #d1fae5;
      color: #065f46;
    }
    .status-pill.fail {
      background: #fee2e2;
      color: #991b1b;
    }
    .status-pill.absent {
      background: #fef3c7;
      color: #92400e;
    }

    .remark-input {
      font-size: 0.825rem;
      padding: 6px 10px;
      border-radius: 6px;
      width: 100%;
    }

    .empty-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #334155;
      margin-bottom: 4px;
    }
    .empty-sub {
      font-size: 0.85rem;
      color: #94a3b8;
    }

    /* Card Footer Bar */
    .card-footer-bar {
      padding: 14px 20px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    .footer-hint {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.82rem;
      color: #64748b;
    }

    .footer-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    /* Print Only Styles */
    .only-print {
      display: none;
    }

    @media print {
      .no-print {
        display: none !important;
      }
      .only-print {
        display: block !important;
      }
      .page-container {
        padding: 0 !important;
        max-width: 100% !important;
      }
      .card {
        border: none !important;
        box-shadow: none !important;
      }
      .app-table thead th {
        background: #f1f5f9 !important;
        color: #000000 !important;
        border-bottom: 1px solid #000000 !important;
      }
      .app-table tbody td {
        border-bottom: 1px solid #cccccc !important;
        color: #000000 !important;
      }
      .print-header {
        margin-bottom: 20px;
        text-align: center;
      }
      .print-title-area h2 {
        margin: 0;
        font-size: 1.6rem;
      }
      .print-sub {
        margin: 2px 0 8px 0;
        font-size: 0.85rem;
        color: #555;
      }
      .print-report-tag {
        font-size: 1rem;
        font-weight: 800;
        letter-spacing: 0.05em;
        margin: 6px 0;
        text-transform: uppercase;
      }
      .print-meta-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
        text-align: left;
        border: 1px solid #999;
        padding: 8px 12px;
        font-size: 0.8rem;
        margin-top: 10px;
      }
      .print-signatures {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        margin-top: 60px;
        text-align: center;
      }
      .sig-line {
        border-top: 1px dashed #333;
        margin-bottom: 6px;
      }
      .sig-box span {
        font-size: 0.75rem;
        font-weight: 700;
      }
    }
  `]
})
export class MarksEntryComponent implements OnInit {
  private examStore = inject(ExamStoreService);
  private academicStore = inject(AcademicStoreService);
  private studentStore = inject(StudentStoreService);
  private campus = inject(CampusSessionService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  Math = Math;
  todayDate = new Date().toLocaleDateString('en-GB');

  schoolName = 'Scholars International Academy';
  schoolAddress = 'House 14, Road 8, Dhanmondi R/A, Dhaka-1205';

  isTeacher = false;
  isUploadingExcel = false;
  isSaving = false;

  exams: Exam[] = [];
  classes: SchoolClass[] = [];
  sections: Section[] = [];
  subjects: Subject[] = [];

  selectedExamId = '';
  selectedClassId = '';
  selectedSectionId = '';
  selectedSubjectId = '';

  markRows: MarkEntryRow[] = [];
  searchQuery = '';
  statusFilter: 'ALL' | 'PASS' | 'FAIL' | 'ABSENT' | 'PENDING' = 'ALL';

  breakdown: SubjectBreakdown = {
    fullMarks: 100,
    passMarks: 33,
    hasTheory: true,
    theoryName: 'Theory',
    theoryMax: 70,
    hasMcq: true,
    mcqName: 'MCQ',
    mcqMax: 30,
    hasPractical: false,
    practicalName: 'Practical',
    practicalMax: 0,
    hasViva: false,
    vivaName: 'Oral / Viva',
    vivaMax: 0,
    isCustom: false
  };

  // Assessment Scheme Modal State
  isAssessmentModalOpen = false;
  isCurrentBreakdownCustom = false;
  assessmentScope: 'subject_only' | 'all_subjects_in_class' | 'all_classes_for_subject' = 'subject_only';
  assessmentFormActiveTier: 'pre-primary' | 'primary' | 'secondary' = 'secondary';

  assessmentForm = {
    fullMarks: 100,
    passMarks: 33,
    hasTheory: true,
    theoryName: 'Theory / Written',
    theoryMax: 70,
    hasMcq: true,
    mcqName: 'MCQ',
    mcqMax: 30,
    hasPractical: false,
    practicalName: 'Practical',
    practicalMax: 0,
    hasViva: false,
    vivaName: 'Oral / Viva',
    vivaMax: 0
  };

  detectClassTier(className: string): 'pre-primary' | 'primary' | 'secondary' | 'higher-secondary' {
    const name = (className || '').toLowerCase();
    if (['play', 'narsari', 'nursery', 'kg', 'pre-primary', 'kindergarten'].some(k => name.includes(k))) return 'pre-primary';
    if (['six', 'seven', 'eight', 'nine', 'ten', '6', '7', '8', '9', '10', 'secondary'].some(k => name.includes(k))) return 'secondary';
    if (['eleven', 'twelve', '11', '12', 'hsc', 'college', 'higher-secondary'].some(k => name.includes(k))) return 'higher-secondary';
    return 'primary';
  }

  getClassTier(cls: SchoolClass | undefined): string {
    if (!cls) return 'primary';
    return cls.tier || localStorage.getItem('class_tier_' + cls.id) || this.detectClassTier(cls.name);
  }

  getActiveTierLabel(): string {
    const cls = this.classes.find(c => c.id === this.selectedClassId);
    const tier = this.getClassTier(cls);
    if (tier === 'pre-primary') return '🧸 Pre-Primary Tier';
    if (tier === 'primary') return '🎒 Primary Tier';
    if (tier === 'secondary') return '🎓 Secondary Tier';
    return '🏛️ Higher Sec Tier';
  }

  async ngOnInit() {
    const curUser = this.auth.getCurrentUser();
    const roleName = curUser?.roleName?.toLowerCase() || '';
    const roleId = curUser?.roleId?.toLowerCase() || '';

    if (roleId === 'role-student' || roleId === 'role-guardian' || roleName.includes('student') || roleName.includes('guardian')) {
      this.toast.error(
        'Access Denied (403)',
        'Students and Guardians cannot access or enter examination marks. Redirecting to your Marksheet...'
      );
      this.router.navigate(['/app/exams/marksheet']);
      return;
    }

    this.isTeacher = roleName.includes('teacher') || roleId.includes('teacher');
    this.schoolName = 'Scholars International Academy';
    this.schoolAddress = 'House 14, Road 8, Dhanmondi R/A, Dhaka-1205';

    await this.loadInitialMasterData();

    this.route.queryParams.subscribe(params => {
      if (params['examId'] && this.exams.some(e => e.id === params['examId'])) {
        this.selectedExamId = params['examId'];
      }
      if (params['classId'] && this.classes.some(c => c.id === params['classId'])) {
        this.selectedClassId = params['classId'];
        this.updateSections();
      }
      if (params['sectionId'] && this.sections.some(s => s.id === params['sectionId'])) {
        this.selectedSectionId = params['sectionId'];
      }
      if (params['subjectId'] && this.subjects.some(sub => sub.id === params['subjectId'])) {
        this.selectedSubjectId = params['subjectId'];
      }
      this.calculateSubjectBreakdown();
      this.loadMarkRows();
    });

    this.campus.changed$.subscribe(async () => {
      await this.loadInitialMasterData();
      this.calculateSubjectBreakdown();
      await this.loadMarkRows();
      this.cdr.markForCheck();
    });

    this.calculateSubjectBreakdown();
    await this.loadMarkRows();
  }

  async loadInitialMasterData() {
    try {
      const [exs, cls, subs, studs] = await Promise.all([
        this.examStore.loadExams(),
        this.academicStore.loadClasses(),
        this.academicStore.loadSubjects(),
        this.studentStore.loadStudents()
      ]);

      this.exams = exs || this.examStore.getExams();
      if (!this.exams.some(e => e.id === this.selectedExamId) && this.exams.length > 0) {
        this.selectedExamId = this.exams[0].id;
      }

      this.classes = cls || this.academicStore.getClasses();
      if (!this.classes.some(c => c.id === this.selectedClassId) && this.classes.length > 0) {
        this.selectedClassId = this.classes[0].id;
      }
      this.updateSections();

      this.subjects = subs || this.academicStore.getSubjects();
      if (!this.subjects.some(s => s.id === this.selectedSubjectId) && this.subjects.length > 0) {
        this.selectedSubjectId = this.subjects[0].id;
      }
    } catch (e) {
      console.warn('Error loading exam master data:', e);
    }
  }

  updateSections() {
    const all = this.academicStore.getSections();
    this.sections = all.filter(s => !this.selectedClassId || s.classId === this.selectedClassId);
    if (this.sections.length > 0) {
      if (!this.sections.some(s => s.id === this.selectedSectionId)) {
        this.selectedSectionId = this.sections[0].id;
      }
    } else {
      this.selectedSectionId = '';
    }
  }

onClassChange() {
  if (this.hasDirtyRows()) {
    this.saveMarksLedger(true);
  }
  this.updateSections();
  this.calculateSubjectBreakdown();
  this.loadMarkRows(true);
}

onFilterChange() {
  if (this.hasDirtyRows()) {
    this.saveMarksLedger(true);
  }
  this.loadMarkRows(true);
}

onSubjectChange() {
  if (this.hasDirtyRows()) {
    this.saveMarksLedger(true);
  }
  this.calculateSubjectBreakdown();
  this.loadMarkRows(true);
}

// --- Dynamic Assessment Scheme Logic ---
getAssessmentScheme(classId ?: string, subjectId ?: string): any {
  try {
    if (classId && subjectId) {
      const item = localStorage.getItem(`exam_scheme_${classId}_${subjectId}`);
      if (item) return JSON.parse(item);
    }
    if (subjectId) {
      const item = localStorage.getItem(`exam_scheme_${subjectId}`);
      if (item) return JSON.parse(item);
    }
  } catch { }
  return null;
}

saveAssessmentSchemeToStorage(classId: string, subjectId: string, scheme: any, applyToAllClasses = false) {
  try {
    if (applyToAllClasses) {
      localStorage.setItem(`exam_scheme_${subjectId}`, JSON.stringify(scheme));
    } else {
      localStorage.setItem(`exam_scheme_${classId}_${subjectId}`, JSON.stringify(scheme));
    }
  } catch { }
}

resetAssessmentSchemeStorage(classId: string, subjectId: string) {
  try {
    localStorage.removeItem(`exam_scheme_${classId}_${subjectId}`);
    localStorage.removeItem(`exam_scheme_${subjectId}`);
  } catch { }
}

calculateSubjectBreakdown() {
  // 1. Check custom saved scheme first (stored per class+subject or subject-wide)
  const customScheme = this.getAssessmentScheme(this.selectedClassId, this.selectedSubjectId);
  if (customScheme) {
    this.breakdown = {
      fullMarks: customScheme.fullMarks ?? 100,
      passMarks: customScheme.passMarks ?? 33,
      hasTheory: customScheme.hasTheory !== false,
      theoryName: customScheme.theoryName || 'Theory',
      theoryMax: customScheme.theoryMax ?? 70,
      hasMcq: !!customScheme.hasMcq,
      mcqName: customScheme.mcqName || 'MCQ',
      mcqMax: customScheme.mcqMax ?? 0,
      hasPractical: !!customScheme.hasPractical,
      practicalName: customScheme.practicalName || 'Practical',
      practicalMax: customScheme.practicalMax ?? 0,
      hasViva: !!customScheme.hasViva,
      vivaName: customScheme.vivaName || 'Oral / Viva',
      vivaMax: customScheme.vivaMax ?? 0,
      isCustom: true
    };
    this.isCurrentBreakdownCustom = true;
    const cls = this.classes.find(c => c.id === this.selectedClassId);
    const tier = this.getClassTier(cls);
    this.assessmentFormActiveTier = (tier === 'pre-primary' || tier === 'primary' || tier === 'secondary') ? tier : 'secondary';
    return;
  }

  this.isCurrentBreakdownCustom = false;
  const sub = this.subjects.find(s => s.id === this.selectedSubjectId);
  const cls = this.classes.find(c => c.id === this.selectedClassId);
  const full = sub?.fullMarks || 100;
  const subName = (sub?.name || '').toLowerCase();
  const subCode = (sub?.code || '').toLowerCase();
  const tier = this.getClassTier(cls);
  this.assessmentFormActiveTier = (tier === 'pre-primary' || tier === 'primary' || tier === 'secondary') ? tier : 'secondary';

  // Subject classifications
  const isMath = subName.includes('math') || subName.includes('গণিত') || subCode.includes('mat');
  const isIctOr50 = full === 50 || subName.includes('ict') || subName.includes('computer') || subCode.includes('ict');
  const isPracticalScience =
    subName.includes('physics') ||
    subName.includes('chemistry') ||
    subName.includes('biology') ||
    subName.includes('science') ||
    subCode.includes('phy') ||
    subCode.includes('che') ||
    subCode.includes('bio');

  if (isIctOr50) {
    // ICT / 50 Marks Paper: 25 Written + 25 Practical, NO MCQ!
    this.breakdown = {
      fullMarks: 50,
      passMarks: 17,
      hasTheory: true,
      theoryName: 'Theory',
      theoryMax: 25,
      hasMcq: false,
      mcqName: 'MCQ',
      mcqMax: 0,
      hasPractical: true,
      practicalName: 'Practical',
      practicalMax: 25,
      hasViva: false,
      vivaName: 'Oral / Viva',
      vivaMax: 0,
      isCustom: false
    };
  } else if (tier === 'pre-primary') {
    // Pre-Primary Tier (Play, Narsari, KG): NO MCQ!
    this.breakdown = {
      fullMarks: full,
      passMarks: Math.round(full * 0.33),
      hasTheory: true,
      theoryName: 'Written & Activity',
      theoryMax: Math.round(full * 0.8),
      hasMcq: false,
      mcqName: 'MCQ',
      mcqMax: 0,
      hasPractical: false,
      practicalName: 'Practical',
      practicalMax: 0,
      hasViva: true,
      vivaName: 'Oral / Viva',
      vivaMax: Math.round(full * 0.2),
      isCustom: false
    };
  } else if (tier === 'primary') {
    // Primary Tier (Class 1 - 5): NO MCQ!
    if (isMath) {
      // Mathematics in Primary: 100% Written, NO MCQ!
      this.breakdown = {
        fullMarks: full,
        passMarks: Math.round(full * 0.33),
        hasTheory: true,
        theoryName: 'Written Exam',
        theoryMax: full,
        hasMcq: false,
        mcqName: 'MCQ',
        mcqMax: 0,
        hasPractical: false,
        practicalName: 'Practical',
        practicalMax: 0,
        hasViva: false,
        vivaName: 'Oral / Viva',
        vivaMax: 0,
        isCustom: false
      };
    } else {
      // Other subjects in Primary: Written 80 + Viva 20, NO MCQ!
      this.breakdown = {
        fullMarks: full,
        passMarks: Math.round(full * 0.33),
        hasTheory: true,
        theoryName: 'Written Exam',
        theoryMax: Math.round(full * 0.8),
        hasMcq: false,
        mcqName: 'MCQ',
        mcqMax: 0,
        hasPractical: false,
        practicalName: 'Practical',
        practicalMax: 0,
        hasViva: true,
        vivaName: 'Oral / Viva',
        vivaMax: Math.round(full * 0.2),
        isCustom: false
      };
    }
  } else if (isMath) {
    // Secondary Mathematics: 100% Written Exam, NO MCQ!
    this.breakdown = {
      fullMarks: full,
      passMarks: Math.round(full * 0.33),
      hasTheory: true,
      theoryName: 'Written Exam',
      theoryMax: full,
      hasMcq: false,
      mcqName: 'MCQ',
      mcqMax: 0,
      hasPractical: false,
      practicalName: 'Practical',
      practicalMax: 0,
      hasViva: false,
      vivaName: 'Oral / Viva',
      vivaMax: 0,
      isCustom: false
    };
  } else if (isPracticalScience) {
    // Secondary Science with Lab: Theory (CQ) 50 + MCQ 25 + Practical 25
    this.breakdown = {
      fullMarks: 100,
      passMarks: 33,
      hasTheory: true,
      theoryName: 'Theory (CQ)',
      theoryMax: 50,
      hasMcq: true,
      mcqName: 'MCQ',
      mcqMax: 25,
      hasPractical: true,
      practicalName: 'Practical',
      practicalMax: 25,
      hasViva: false,
      vivaName: 'Oral / Viva',
      vivaMax: 0,
      isCustom: false
    };
  } else {
    // Secondary General (Bangla, English, BGS): Theory (CQ) 70 + MCQ 30
    this.breakdown = {
      fullMarks: 100,
      passMarks: 33,
      hasTheory: true,
      theoryName: 'Theory (CQ)',
      theoryMax: 70,
      hasMcq: true,
      mcqName: 'MCQ',
      mcqMax: 30,
      hasPractical: false,
      practicalName: 'Practical',
      practicalMax: 0,
      hasViva: false,
      vivaName: 'Oral / Viva',
      vivaMax: 0,
      isCustom: false
    };
  }
}

openAssessmentModal() {
  this.assessmentForm = {
    fullMarks: this.breakdown.fullMarks,
    passMarks: this.breakdown.passMarks,
    hasTheory: this.breakdown.hasTheory,
    theoryName: this.breakdown.theoryName,
    theoryMax: this.breakdown.theoryMax,
    hasMcq: this.breakdown.hasMcq,
    mcqName: this.breakdown.mcqName,
    mcqMax: this.breakdown.mcqMax,
    hasPractical: this.breakdown.hasPractical,
    practicalName: this.breakdown.practicalName,
    practicalMax: this.breakdown.practicalMax,
    hasViva: this.breakdown.hasViva,
    vivaName: this.breakdown.vivaName,
    vivaMax: this.breakdown.vivaMax
  };
  const cls = this.classes.find(c => c.id === this.selectedClassId);
  const tier = this.getClassTier(cls);
  this.assessmentFormActiveTier = (tier === 'pre-primary' || tier === 'primary' || tier === 'secondary') ? tier : 'secondary';
  this.assessmentScope = 'subject_only';
  this.isAssessmentModalOpen = true;
}

applyAcademicTierPreset(tier: 'pre-primary' | 'primary' | 'secondary') {
  this.assessmentFormActiveTier = tier;
  if (tier === 'pre-primary') {
    this.assessmentForm.fullMarks = 100;
    this.assessmentForm.passMarks = 33;
    this.assessmentForm.hasTheory = true;
    this.assessmentForm.theoryName = 'Written & Activity';
    this.assessmentForm.theoryMax = 80;
    this.assessmentForm.hasMcq = false;
    this.assessmentForm.mcqName = 'MCQ';
    this.assessmentForm.mcqMax = 0;
    this.assessmentForm.hasPractical = false;
    this.assessmentForm.practicalName = 'Practical';
    this.assessmentForm.practicalMax = 0;
    this.assessmentForm.hasViva = true;
    this.assessmentForm.vivaName = 'Oral / Viva';
    this.assessmentForm.vivaMax = 20;
  } else if (tier === 'primary') {
    const sub = this.subjects.find(s => s.id === this.selectedSubjectId);
    const isMath = (sub?.name || '').toLowerCase().includes('math');
    this.assessmentForm.fullMarks = 100;
    this.assessmentForm.passMarks = 33;
    this.assessmentForm.hasTheory = true;
    this.assessmentForm.theoryName = 'Written Exam';
    this.assessmentForm.theoryMax = isMath ? 100 : 80;
    this.assessmentForm.hasMcq = false;
    this.assessmentForm.mcqName = 'MCQ';
    this.assessmentForm.mcqMax = 0;
    this.assessmentForm.hasPractical = false;
    this.assessmentForm.practicalName = 'Practical';
    this.assessmentForm.practicalMax = 0;
    this.assessmentForm.hasViva = !isMath;
    this.assessmentForm.vivaName = 'Oral / Viva';
    this.assessmentForm.vivaMax = isMath ? 0 : 20;
  } else if (tier === 'secondary') {
    this.assessmentForm.fullMarks = 100;
    this.assessmentForm.passMarks = 33;
    this.assessmentForm.hasTheory = true;
    this.assessmentForm.theoryName = 'Theory (CQ)';
    this.assessmentForm.theoryMax = 70;
    this.assessmentForm.hasMcq = true;
    this.assessmentForm.mcqName = 'MCQ';
    this.assessmentForm.mcqMax = 30;
    this.assessmentForm.hasPractical = false;
    this.assessmentForm.practicalName = 'Practical';
    this.assessmentForm.practicalMax = 0;
    this.assessmentForm.hasViva = false;
    this.assessmentForm.vivaName = 'Oral / Viva';
    this.assessmentForm.vivaMax = 0;
  }
}

applyAssessmentPreset(preset: 'primary_80_20' | 'math_100' | 'secondary_70_30' | 'science_50_25_25' | 'ict_25_25') {
  if (preset === 'primary_80_20') {
    this.applyAcademicTierPreset('primary');
  } else if (preset === 'math_100') {
    this.assessmentForm.fullMarks = 100;
    this.assessmentForm.passMarks = 33;
    this.assessmentForm.hasTheory = true;
    this.assessmentForm.theoryName = 'Written Exam';
    this.assessmentForm.theoryMax = 100;
    this.assessmentForm.hasMcq = false;
    this.assessmentForm.mcqName = 'MCQ';
    this.assessmentForm.mcqMax = 0;
    this.assessmentForm.hasPractical = false;
    this.assessmentForm.practicalName = 'Practical';
    this.assessmentForm.practicalMax = 0;
    this.assessmentForm.hasViva = false;
    this.assessmentForm.vivaName = 'Oral / Viva';
    this.assessmentForm.vivaMax = 0;
  } else if (preset === 'secondary_70_30') {
    this.applyAcademicTierPreset('secondary');
  } else if (preset === 'science_50_25_25') {
    this.assessmentFormActiveTier = 'secondary';
    this.assessmentForm.fullMarks = 100;
    this.assessmentForm.passMarks = 33;
    this.assessmentForm.hasTheory = true;
    this.assessmentForm.theoryName = 'Theory (CQ)';
    this.assessmentForm.theoryMax = 50;
    this.assessmentForm.hasMcq = true;
    this.assessmentForm.mcqName = 'MCQ';
    this.assessmentForm.mcqMax = 25;
    this.assessmentForm.hasPractical = true;
    this.assessmentForm.practicalName = 'Practical';
    this.assessmentForm.practicalMax = 25;
    this.assessmentForm.hasViva = false;
    this.assessmentForm.vivaName = 'Oral / Viva';
    this.assessmentForm.vivaMax = 0;
  } else if (preset === 'ict_25_25') {
    this.assessmentForm.fullMarks = 50;
    this.assessmentForm.passMarks = 17;
    this.assessmentForm.hasTheory = true;
    this.assessmentForm.theoryName = 'Theory';
    this.assessmentForm.theoryMax = 25;
    this.assessmentForm.hasMcq = false;
    this.assessmentForm.mcqName = 'MCQ';
    this.assessmentForm.mcqMax = 0;
    this.assessmentForm.hasPractical = true;
    this.assessmentForm.practicalName = 'Practical';
    this.assessmentForm.practicalMax = 25;
    this.assessmentForm.hasViva = false;
    this.assessmentForm.vivaName = 'Oral / Viva';
    this.assessmentForm.vivaMax = 0;
  }
}

getAssessmentFormSum(): number {
  let sum = 0;
  if (this.assessmentForm.hasTheory) sum += Number(this.assessmentForm.theoryMax || 0);
  if (this.assessmentForm.hasMcq) sum += Number(this.assessmentForm.mcqMax || 0);
  if (this.assessmentForm.hasPractical) sum += Number(this.assessmentForm.practicalMax || 0);
  if (this.assessmentForm.hasViva) sum += Number(this.assessmentForm.vivaMax || 0);
  return sum;
}

isAssessmentFormValid(): boolean {
  return this.getAssessmentFormSum() === Number(this.assessmentForm.fullMarks) && this.getAssessmentFormSum() > 0;
}

saveAssessmentScheme() {
  if (!this.isAssessmentFormValid()) {
    this.toast.error('Validation Error', `Component sum (${this.getAssessmentFormSum()}) must equal Total Full Marks (${this.assessmentForm.fullMarks}).`);
    return;
  }

  const schemeToSave = {
    fullMarks: Number(this.assessmentForm.fullMarks),
    passMarks: Number(this.assessmentForm.passMarks),
    hasTheory: !!this.assessmentForm.hasTheory,
    theoryName: this.assessmentForm.theoryName || 'Theory',
    theoryMax: this.assessmentForm.hasTheory ? Number(this.assessmentForm.theoryMax) : 0,
    hasMcq: !!this.assessmentForm.hasMcq,
    mcqName: this.assessmentForm.mcqName || 'MCQ',
    mcqMax: this.assessmentForm.hasMcq ? Number(this.assessmentForm.mcqMax) : 0,
    hasPractical: !!this.assessmentForm.hasPractical,
    practicalName: this.assessmentForm.practicalName || 'Practical',
    practicalMax: this.assessmentForm.hasPractical ? Number(this.assessmentForm.practicalMax) : 0,
    hasViva: !!this.assessmentForm.hasViva,
    vivaName: this.assessmentForm.vivaName || 'Oral / Viva',
    vivaMax: this.assessmentForm.hasViva ? Number(this.assessmentForm.vivaMax) : 0,
    isCustom: true
  };

  if (this.assessmentScope === 'all_subjects_in_class') {
    for (const sub of this.subjects) {
      this.saveAssessmentSchemeToStorage(this.selectedClassId, sub.id, schemeToSave, false);
    }
    this.toast.success('Assessment Scheme Applied', `Applied dynamic scheme across ALL subjects in ${this.getSelectedClassName()}.`);
  } else if (this.assessmentScope === 'all_classes_for_subject') {
    this.saveAssessmentSchemeToStorage(this.selectedClassId, this.selectedSubjectId, schemeToSave, true);
    this.toast.success('Assessment Scheme Applied', `Applied dynamic scheme for ${this.getSelectedSubjectName()} across ALL classes.`);
  } else {
    this.saveAssessmentSchemeToStorage(this.selectedClassId, this.selectedSubjectId, schemeToSave, false);
    this.toast.success('Assessment Scheme Saved', `Saved assessment scheme for ${this.getSelectedSubjectName()} in ${this.getSelectedClassName()}.`);
  }

  this.isAssessmentModalOpen = false;
  this.calculateSubjectBreakdown();
  this.loadMarkRows();
}

resetAssessmentScheme() {
  this.resetAssessmentSchemeStorage(this.selectedClassId, this.selectedSubjectId);
  this.toast.info('Scheme Reset', `Assessment distribution reset to default curriculum tier.`);
  this.isAssessmentModalOpen = false;
  this.calculateSubjectBreakdown();
  this.loadMarkRows();
}

// --- Marks Editing State Helpers ---
hasDirtyRows(): boolean {
  return this.markRows.some(r => !!r.isDirty);
}

getDirtyRowsCount(): number {
  return this.markRows.filter(r => !!r.isDirty).length;
}

getSavedRecordsCount(): number {
  return this.markRows.filter(r => !!r.isPreviouslySaved || r.totalObtained > 0 || r.isAbsent).length;
}

discardUnsavedChanges() {
  this.populateMarkRowsFromCurrentState();
  this.toast.info('Edits Discarded', 'Restored previously saved marks from ledger.');
}

populateMarkRowsFromCurrentState(): void {
  if(!this.selectedClassId) {
  this.markRows = [];
  return;
}

const allStudents = this.studentStore.getStudents();
const students = allStudents.filter(s =>
  (!this.selectedClassId || s.classId === this.selectedClassId) &&
  (!this.selectedSectionId || this.selectedSectionId === 'ALL' || s.sectionId === this.selectedSectionId)
);

  const existingMarks: ExamMark[] = this.examStore.getExamMarks(
    this.selectedExamId,
    this.selectedClassId,
    this.selectedSubjectId,
    this.selectedSectionId === 'ALL' ? undefined : this.selectedSectionId
  );

  const markMap = new Map<string, ExamMark>();
  for (const m of existingMarks) {
    if (m.studentId) markMap.set(m.studentId, m);
  }

  const fullMarks = this.breakdown.fullMarks;

  this.markRows = students.map(s => {
    const existing = markMap.get(s.id) || existingMarks.find((m: ExamMark) => m.rollNo === s.rollNo);

  let theory = 0;
  let mcq = 0;
  let practical = 0;
  let viva = 0;
  let isAbsent = false;
  let remark = '';
  let isPreviouslySaved = false;

  if (existing) {
    isPreviouslySaved = true;
    isAbsent = !!existing.isAbsent;
    remark = existing.remark || '';

    const hasComponentValues =
      (existing.theoryMarks !== undefined && existing.theoryMarks !== null && existing.theoryMarks > 0) ||
      (existing.mcqMarks !== undefined && existing.mcqMarks !== null && existing.mcqMarks > 0) ||
      (existing.practicalMarks !== undefined && existing.practicalMarks !== null && existing.practicalMarks > 0) ||
      (existing.vivaMarks !== undefined && existing.vivaMarks !== null && existing.vivaMarks > 0);

    if (hasComponentValues) {
      theory = existing.theoryMarks ?? 0;
      mcq = existing.mcqMarks ?? 0;
      practical = existing.practicalMarks ?? 0;
      viva = existing.vivaMarks ?? 0;
    } else if (existing.obtainedMarks !== undefined && existing.obtainedMarks > 0) {
      const total = existing.obtainedMarks;
      if (!this.breakdown.hasMcq && !this.breakdown.hasPractical && !this.breakdown.hasViva) {
        theory = Math.min(total, this.breakdown.theoryMax);
      } else if (!this.breakdown.hasMcq && this.breakdown.hasViva) {
        theory = Math.min(Math.round(total * 0.8), this.breakdown.theoryMax);
        viva = Math.max(0, total - theory);
      } else if (this.breakdown.hasPractical) {
        practical = Math.min(Math.round(total * 0.25), this.breakdown.practicalMax);
        theory = Math.min(Math.round(total * 0.5), this.breakdown.theoryMax);
        mcq = Math.max(0, total - (theory + practical));
      } else {
        theory = Math.min(Math.round(total * 0.7), this.breakdown.theoryMax);
        mcq = Math.max(0, total - theory);
      }
    }
  }

  const activeTheory = this.breakdown.hasTheory ? Math.min(theory, this.breakdown.theoryMax) : 0;
  const activeMcq = this.breakdown.hasMcq ? Math.min(mcq, this.breakdown.mcqMax) : 0;
  const activePractical = this.breakdown.hasPractical ? Math.min(practical, this.breakdown.practicalMax) : 0;
  const activeViva = this.breakdown.hasViva ? Math.min(viva, this.breakdown.vivaMax) : 0;

  const totalObtained = isAbsent ? 0 : Math.min(activeTheory + activeMcq + activePractical + activeViva, fullMarks);
  const { grade, gp, isPass } = isAbsent
    ? { grade: 'F', gp: 0.0, isPass: false }
    : this.calculateGrade(totalObtained, fullMarks);

  return {
    studentId: s.id,
    studentName: s.fullName,
    rollNo: s.rollNo,
    admissionNo: s.admissionNo,
    avatar: s.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    theoryMarks: activeTheory,
    mcqMarks: activeMcq,
    practicalMarks: activePractical,
    vivaMarks: activeViva,
    totalObtained,
    fullMarks,
    grade,
    gradePoint: gp,
    isPass: isPass && totalObtained >= this.breakdown.passMarks,
    isAbsent,
    remark: remark || (isAbsent ? 'Absent during exam session' : (isPass ? 'Good comprehension.' : 'Needs remedial guidance.')),
    isDirty: false,
    isPreviouslySaved: isPreviouslySaved || totalObtained > 0 || isAbsent
  };
});
  }

  async loadMarkRows(notifyIfLoaded = false) {
  if (!this.selectedClassId) {
    this.markRows = [];
    return;
  }

  this.populateMarkRowsFromCurrentState();

  if (this.selectedExamId && this.selectedSubjectId) {
    try {
      const serverMarks = await this.examStore.fetchExamMarks(
        this.selectedExamId,
        this.selectedClassId,
        this.selectedSectionId,
        this.selectedSubjectId
      );
      if (serverMarks && serverMarks.length > 0) {
        this.populateMarkRowsFromCurrentState();
      }
    } catch (e) {
      // Continue with local storage data
    }
  }

  if (notifyIfLoaded && this.getSavedRecordsCount() > 0) {
    this.toast.info('Marks Loaded', `Loaded ${this.getSavedRecordsCount()} saved student records for ${this.getSelectedSubjectName()}. Editable below.`);
  }
}

recalculateRow(row: MarkEntryRow) {
  row.isDirty = true;
  if (row.isAbsent) {
    row.totalObtained = 0;
    row.grade = 'F';
    row.gradePoint = 0.0;
    row.isPass = false;
    return;
  }

  const rawTheory = Number(row.theoryMarks);
  const rawMcq = Number(row.mcqMarks);
  const rawPractical = Number(row.practicalMarks);
  const rawViva = Number(row.vivaMarks);

  const theory = this.breakdown.hasTheory && !isNaN(rawTheory) ? Math.min(Math.max(0, rawTheory), this.breakdown.theoryMax) : 0;
  const mcq = this.breakdown.hasMcq && !isNaN(rawMcq) ? Math.min(Math.max(0, rawMcq), this.breakdown.mcqMax) : 0;
  const practical = this.breakdown.hasPractical && !isNaN(rawPractical) ? Math.min(Math.max(0, rawPractical), this.breakdown.practicalMax) : 0;
  const viva = this.breakdown.hasViva && !isNaN(rawViva) ? Math.min(Math.max(0, rawViva), this.breakdown.vivaMax) : 0;

  row.totalObtained = Math.min(theory + mcq + practical + viva, this.breakdown.fullMarks);

  const { grade, gp, isPass } = this.calculateGrade(row.totalObtained, this.breakdown.fullMarks);
  row.grade = grade;
  row.gradePoint = gp;
  row.isPass = isPass && row.totalObtained >= this.breakdown.passMarks;
}

toggleAbsent(row: MarkEntryRow) {
  row.isAbsent = !row.isAbsent;
  if (row.isAbsent) {
    row.remark = 'Absent from examination session';
  } else {
    row.remark = 'Present';
  }
  this.recalculateRow(row);
}

calculateGrade(obtained: number, fullMarks: number): { grade: string; gp: number; isPass: boolean } {
  const pct = fullMarks > 0 ? (obtained / fullMarks) * 100 : 0;
  if (pct >= 80) return { grade: 'A+', gp: 5.0, isPass: true };
  if (pct >= 70) return { grade: 'A', gp: 4.0, isPass: true };
  if (pct >= 60) return { grade: 'A-', gp: 3.5, isPass: true };
  if (pct >= 50) return { grade: 'B', gp: 3.0, isPass: true };
  if (pct >= 40) return { grade: 'C', gp: 2.0, isPass: true };
  if (pct >= 33) return { grade: 'D', gp: 1.0, isPass: true };
  return { grade: 'F', gp: 0.0, isPass: false };
}

getGradeClass(grade: string): string {
  switch (grade) {
    case 'A+': return 'grade-a-plus';
    case 'A': return 'grade-a';
    case 'A-': return 'grade-a-minus';
    case 'B': return 'grade-b';
    case 'C': return 'grade-c';
    case 'D': return 'grade-d';
    default: return 'grade-f';
  }
}

quickFillSampleMarks() {
  this.markRows.forEach((r, idx) => {
    r.isAbsent = idx === 4; // realistic scenario: student #5 absent
    if (r.isAbsent) {
      r.theoryMarks = 0;
      r.mcqMarks = 0;
      r.practicalMarks = 0;
      r.vivaMarks = 0;
      r.remark = 'Absent with medical leave';
    } else {
      const factor = 0.55 + ((idx * 8) % 40) / 100;
      r.theoryMarks = this.breakdown.hasTheory ? Math.min(Math.round(this.breakdown.theoryMax * factor), this.breakdown.theoryMax) : 0;
      r.mcqMarks = this.breakdown.hasMcq ? Math.min(Math.round(this.breakdown.mcqMax * factor), this.breakdown.mcqMax) : 0;
      r.practicalMarks = this.breakdown.hasPractical ? Math.min(Math.round(this.breakdown.practicalMax * factor), this.breakdown.practicalMax) : 0;
      r.vivaMarks = this.breakdown.hasViva ? Math.min(Math.round(this.breakdown.vivaMax * factor), this.breakdown.vivaMax) : 0;
      r.remark = idx % 2 === 0 ? 'Consistent performance and conceptual clarity.' : 'Satisfactory result.';
    }
    this.recalculateRow(r);
  });
  this.toast.info('Sample Marks Populated', `Realistic score distributions assigned for ${this.getSelectedSubjectName()} based on active scheme.`);
}

clearAllMarks() {
  this.markRows.forEach(r => {
    r.theoryMarks = 0;
    r.mcqMarks = 0;
    r.practicalMarks = 0;
    r.vivaMarks = 0;
    r.isAbsent = false;
    r.remark = '';
    this.recalculateRow(r);
  });
  this.toast.info('Ledger Cleared', 'All scores for the current class section have been reset.');
}

batchFillRemarks(remark: string) {
  this.markRows.forEach(r => {
    if (!r.isAbsent) {
      r.remark = remark;
    }
  });
  this.toast.success('Batch Remarks Applied', `Assigned: "${remark}" across all present students.`);
}

markRowDirty(row: MarkEntryRow) {
  row.isDirty = true;
}

  async saveMarksLedger(isSilent = false) {
  if (this.markRows.length === 0) {
    if (!isSilent) this.toast.warning('No Records', 'There are no student rows to save.');
    return;
  }

  this.isSaving = true;
  try {
    const marks: ExamMark[] = this.markRows.map(r => {
      const student = this.studentStore.getStudents().find(s => s.id === r.studentId);
      const effectiveBranchId = student?.branchId || this.campus.branchId || 'br-01';
      const branchId = effectiveBranchId === 'ALL' ? 'br-01' : effectiveBranchId;

      const rawTheory = Number(r.theoryMarks);
      const rawMcq = Number(r.mcqMarks);
      const rawPractical = Number(r.practicalMarks);
      const rawViva = Number(r.vivaMarks);

      const clampedTheory = this.breakdown.hasTheory && !isNaN(rawTheory) ? Math.min(Math.max(0, rawTheory), this.breakdown.theoryMax) : 0;
      const clampedMcq = this.breakdown.hasMcq && !isNaN(rawMcq) ? Math.min(Math.max(0, rawMcq), this.breakdown.mcqMax) : 0;
      const clampedPractical = this.breakdown.hasPractical && !isNaN(rawPractical) ? Math.min(Math.max(0, rawPractical), this.breakdown.practicalMax) : 0;
      const clampedViva = this.breakdown.hasViva && !isNaN(rawViva) ? Math.min(Math.max(0, rawViva), this.breakdown.vivaMax) : 0;

      const total = r.isAbsent ? 0 : Math.min(clampedTheory + clampedMcq + clampedPractical + clampedViva, this.breakdown.fullMarks);

      return {
        id: '',
        examId: this.selectedExamId,
        studentId: r.studentId,
        studentName: r.studentName,
        rollNo: r.rollNo,
        classId: this.selectedClassId,
        sectionId: this.selectedSectionId,
        subjectId: this.selectedSubjectId,
        subjectName: this.getSelectedSubjectName(),
        fullMarks: this.breakdown.fullMarks,
        obtainedMarks: total,
        theoryMarks: r.isAbsent ? 0 : clampedTheory,
        mcqMarks: r.isAbsent ? 0 : clampedMcq,
        practicalMarks: r.isAbsent ? 0 : clampedPractical,
        vivaMarks: r.isAbsent ? 0 : clampedViva,
        isAbsent: r.isAbsent,
        grade: r.grade,
        gradePoint: r.gradePoint,
        isPass: r.isPass,
        remark: r.remark || '',
        branchId: branchId
      };
    });

    await this.examStore.saveExamMarksAsync(marks);

    // Reset dirty state on all rows
    this.markRows.forEach(r => {
      r.isDirty = false;
      r.isPreviouslySaved = true;
    });

    if (!isSilent) {
      this.toast.success(
        'Marks Ledger Updated',
        `Successfully saved and updated assessment scores for ${marks.length} students in ${this.getSelectedSubjectName()} (${this.getSelectedClassName()}).`
      );
    }
  } catch (err: any) {
    this.toast.error('Save Error', err?.message || 'Could not save examination marks to database.');
  } finally {
    this.isSaving = false;
    this.cdr.markForCheck();
  }
}

downloadExcelTemplate() {
  if (!this.selectedExamId && this.exams.length > 0) this.selectedExamId = this.exams[0].id;
  if (!this.selectedClassId && this.classes.length > 0) this.selectedClassId = this.classes[0].id;
  if ((!this.selectedSectionId || this.selectedSectionId === '') && this.sections.length > 0) this.selectedSectionId = this.sections[0].id;
  if (!this.selectedSubjectId && this.subjects.length > 0) this.selectedSubjectId = this.subjects[0].id;

  if (!this.selectedExamId || !this.selectedClassId || !this.selectedSubjectId) {
    this.generateFallbackTemplate();
    return;
  }

  const secId = this.selectedSectionId || 'ALL';
  this.examStore.downloadMarksTemplate(this.selectedExamId, this.selectedClassId, secId, this.selectedSubjectId)
    .subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeSubject = this.getSelectedSubjectName().replace(/[\s\(\)]+/g, '_');
        a.download = `Marks_Template_${safeSubject}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toast.success('Template Downloaded', 'Open in Excel, enter scores, and upload.');
      },
      error: () => {
        this.generateFallbackTemplate();
      }
    });
}

generateFallbackTemplate() {
  const students = this.markRows.length > 0
    ? this.markRows.map(r => ({ id: r.studentId, rollNo: r.rollNo, name: r.studentName }))
    : [
      { id: 'st-001', rollNo: '01', name: 'Rahim Ahmed' },
      { id: 'st-002', rollNo: '02', name: 'Karim Ullah' },
      { id: 'st-003', rollNo: '03', name: 'Nusrat Jahan' },
      { id: 'st-004', rollNo: '04', name: 'Taskin Noor' }
    ];

  const examTitle = this.getSelectedExamName();
  const classTitle = this.getSelectedClassName();
  const subjectTitle = this.getSelectedSubjectName();
  const fullMarks = this.breakdown.fullMarks;

  const titleRow = `"Exam: ${examTitle} | Class: ${classTitle} | Subject: ${subjectTitle} (Full Marks: ${fullMarks})"`;

  const headers = ['Student ID (Do not edit)', 'Roll No', 'Student Name'];
  if (this.breakdown.hasTheory) headers.push(`${this.breakdown.theoryName} Marks (Max ${this.breakdown.theoryMax})`);
  if (this.breakdown.hasMcq) headers.push(`${this.breakdown.mcqName} Marks (Max ${this.breakdown.mcqMax})`);
  if (this.breakdown.hasPractical) headers.push(`${this.breakdown.practicalName} Marks (Max ${this.breakdown.practicalMax})`);
  if (this.breakdown.hasViva) headers.push(`${this.breakdown.vivaName} Marks (Max ${this.breakdown.vivaMax})`);
  headers.push('Is Absent (TRUE/FALSE)', 'Remarks');

  const headerRow = headers.join(',');
  const dataRows = students.map(s => {
    const parts = [`"${s.id}"`, `"${s.rollNo}"`, `"${s.name}"`];
    if (this.breakdown.hasTheory) parts.push('0');
    if (this.breakdown.hasMcq) parts.push('0');
    if (this.breakdown.hasPractical) parts.push('0');
    if (this.breakdown.hasViva) parts.push('0');
    parts.push('FALSE', '""');
    return parts.join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [titleRow, headerRow, ...dataRows].join('\r\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Marks_Template_${subjectTitle.replace(/[\s\(\)]+/g, '_') || 'Sample'}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  this.toast.success('Template Downloaded', 'Pre-formatted marks entry template generated successfully.');
}

  async onExcelFileSelected(event: any) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!this.selectedExamId || !this.selectedClassId || !this.selectedSubjectId) {
    this.toast.error('Selection Required', 'Please select Exam, Class, Section, and Subject before uploading.');
    event.target.value = '';
    return;
  }

  this.isUploadingExcel = true;

  // If CSV file, parse directly in browser
  if (file.name.toLowerCase().endsWith('.csv')) {
    try {
      await this.parseCsvMarksFile(file);
    } catch (err: any) {
      this.toast.error('Upload Error', err?.message || 'Could not parse CSV marks file.');
    } finally {
      this.isUploadingExcel = false;
      event.target.value = '';
    }
    return;
  }

  // Otherwise upload Excel (.xlsx, .xls) to backend parser
  this.examStore.bulkUploadMarks(
    this.selectedExamId,
    file,
    this.selectedClassId,
    this.selectedSectionId || '',
    this.selectedSubjectId
  )
    .then(res => {
      this.toast.success('Marks Uploaded', res.message || 'Successfully imported marks from Excel.');
      this.loadMarkRows();
    })
    .catch(err => {
      this.toast.error('Upload Error', err?.error?.message || err?.message || 'Could not parse Excel marks sheet.');
    })
    .finally(() => {
      this.isUploadingExcel = false;
      event.target.value = '';
    });
}

  async parseCsvMarksFile(file: File) {
  const text = await file.text();
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  let startIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes('student') || lower.includes('theory') || lower.includes('roll')) {
      startIdx = i + 1;
      break;
    }
  }

  let updatedCount = 0;
  for (let i = startIdx; i < lines.length; i++) {
    const parts = lines[i].split(',').map(p => p.replace(/^"|"$/g, '').trim());
    if (parts.length < 3) continue;

    const studentId = parts[0];
    const rollNo = parts[1];

    let colIdx = 3;
    let theory = 0;
    let mcq = 0;
    let practical = 0;
    let viva = 0;

    if (this.breakdown.hasTheory && parts.length > colIdx) {
      theory = parseFloat(parts[colIdx++]) || 0;
    }
    if (this.breakdown.hasMcq && parts.length > colIdx) {
      mcq = parseFloat(parts[colIdx++]) || 0;
    }
    if (this.breakdown.hasPractical && parts.length > colIdx) {
      practical = parseFloat(parts[colIdx++]) || 0;
    }
    if (this.breakdown.hasViva && parts.length > colIdx) {
      viva = parseFloat(parts[colIdx++]) || 0;
    }

    const absentStr = (parts[colIdx] || '').toUpperCase();
    const isAbsent = absentStr === 'TRUE' || absentStr === '1' || absentStr === 'YES';
    const remark = parts[colIdx + 1] || '';

    const row = this.markRows.find(r => (studentId && r.studentId === studentId) || (rollNo && r.rollNo === rollNo));
    if (row) {
      row.theoryMarks = theory;
      row.mcqMarks = mcq;
      row.practicalMarks = practical;
      row.vivaMarks = viva;
      row.isAbsent = isAbsent;
      row.remark = remark;
      this.recalculateRow(row);
      updatedCount++;
    }
  }

  if (updatedCount > 0) {
    this.saveMarksLedger();
    this.toast.success('CSV Marks Imported', `Successfully imported marks for ${updatedCount} students.`);
  } else {
    this.toast.error('Import Failed', 'No matching student records found in CSV file.');
  }
}

exportToCsv() {
  if (this.markRows.length === 0) {
    this.toast.warning('No Data', 'No student marks available to export.');
    return;
  }

  const headers = ['Roll', 'Admission No', 'Student Name', 'Status'];
  if (this.breakdown.hasTheory) headers.push(this.breakdown.theoryName);
  if (this.breakdown.hasMcq) headers.push(this.breakdown.mcqName);
  if (this.breakdown.hasPractical) headers.push(this.breakdown.practicalName);
  if (this.breakdown.hasViva) headers.push(this.breakdown.vivaName);
  headers.push('Total Obtained', 'Full Marks', 'Grade', 'GPA', 'Pass/Fail', 'Remarks');

  const rows = this.markRows.map(r => {
    const row = [
      r.rollNo,
      r.admissionNo,
      `"${r.studentName}"`,
      r.isAbsent ? 'ABSENT' : 'PRESENT'
    ];
    if (this.breakdown.hasTheory) row.push(String(r.theoryMarks));
    if (this.breakdown.hasMcq) row.push(String(r.mcqMarks));
    if (this.breakdown.hasPractical) row.push(String(r.practicalMarks));
    if (this.breakdown.hasViva) row.push(String(r.vivaMarks));
    row.push(
      String(r.totalObtained),
      String(r.fullMarks),
      r.grade,
      r.gradePoint.toFixed(1),
      r.isPass ? 'PASS' : 'FAIL',
      `"${r.remark || ''}"`
    );
    return row;
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const safeName = `${this.getSelectedSubjectName()}_${this.getSelectedClassName()}_${this.getSelectedSectionName()}`.replace(/[\s\(\)]+/g, '_');
  link.setAttribute('download', `Marks_Ledger_${safeName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  this.toast.success('CSV Exported', `Marks ledger downloaded as CSV spreadsheet.`);
}

printMarksLedger() {
  window.print();
}

  // --- Filtering Helpers ---
  get filteredMarkRows(): MarkEntryRow[] {
  return this.markRows.filter(r => {
    // Query filter
    const matchesQuery =
      !this.searchQuery ||
      r.studentName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      r.rollNo.includes(this.searchQuery) ||
      r.admissionNo.toLowerCase().includes(this.searchQuery.toLowerCase());

    if (!matchesQuery) return false;

    // Status filter
    if (this.statusFilter === 'PASS') return r.isPass && !r.isAbsent;
    if (this.statusFilter === 'FAIL') return !r.isPass && !r.isAbsent;
    if (this.statusFilter === 'ABSENT') return r.isAbsent;
    if (this.statusFilter === 'PENDING') return r.totalObtained === 0 && !r.isAbsent;
    return true;
  });
}

// --- KPI & Stat Helpers ---
getSelectedExamName(): string {
  return this.exams.find(e => e.id === this.selectedExamId)?.name || 'Examination Term';
}

getSelectedClassName(): string {
  return this.classes.find(c => c.id === this.selectedClassId)?.name || '';
}

getSelectedSectionName(): string {
  return this.sections.find(s => s.id === this.selectedSectionId)?.name || '';
}

getSelectedSubjectName(): string {
  return this.subjects.find(s => s.id === this.selectedSubjectId)?.name || 'Subject';
}

getSelectedSubjectFullMarks(): number {
  return this.subjects.find(s => s.id === this.selectedSubjectId)?.fullMarks || 100;
}

getActiveCampusName(): string {
  const bId = this.campus.branchId;
  if (bId === 'br-02c70f') return 'Dhanmondi Campus';
  if (bId === 'br-8996de') return 'Uttara Campus';
  if (bId === 'br-6fd98e') return 'Rayerbag Campus';
  return 'Main Campus (Central)';
}

getRecordedCount(): number {
  return this.markRows.filter(r => r.totalObtained > 0 || r.isAbsent).length;
}

getCompletionRate(): number {
  if (this.markRows.length === 0) return 0;
  return Math.round((this.getRecordedCount() / this.markRows.length) * 100);
}

getAverageMarks(): number {
  const present = this.markRows.filter(r => !r.isAbsent && r.totalObtained > 0);
  if (present.length === 0) return 0;
  const sum = present.reduce((acc, r) => acc + r.totalObtained, 0);
  return Math.round(sum / present.length);
}

getHighestScore(): number {
  if (this.markRows.length === 0) return 0;
  return Math.max(...this.markRows.map(r => r.totalObtained));
}

getHighestAchievedMark(): string {
  const top = this.getHighestScore();
  return top > 0 ? `${top} Marks Achieved` : 'Awaiting Marks';
}

getPassedCount(): number {
  return this.markRows.filter(r => r.isPass && !r.isAbsent).length;
}

getFailedCount(): number {
  return this.markRows.filter(r => !r.isPass && !r.isAbsent).length;
}

getAbsentCount(): number {
  return this.markRows.filter(r => r.isAbsent).length;
}

getPendingCount(): number {
  return this.markRows.filter(r => r.totalObtained === 0 && !r.isAbsent).length;
}

getPassRate(): number {
  const presentCount = this.markRows.filter(r => !r.isAbsent).length;
  if (presentCount === 0) return 0;
  return Math.round((this.getPassedCount() / presentCount) * 100);
}
}
