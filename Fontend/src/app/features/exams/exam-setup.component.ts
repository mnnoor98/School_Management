import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ExamStoreService } from '../../core/services/stores/exam-store.service';
import { AcademicStoreService } from '../../core/services/stores/academic-store.service';
import { CampusSessionService } from '../../core/services/campus-session.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Exam, ExamScheduleItem, SchoolClass, Subject, Branch, AcademicYear } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';
import { ModalComponent } from '../../shared/components/modal.component';

type SetupTab = 'terms' | 'schedules' | 'grading' | 'schemes';


interface ClassSubjectSchemeRow {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
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
  isCustom: boolean;
  isDirty?: boolean;
}

@Component({
  selector: 'app-exam-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent, ModalComponent],
  template: `
    <div class="page-container">
      <!-- PAGE HEADER -->
      <div class="page-header no-print">
        <div>
          <div class="header-tag">
            <span class="pulse-dot"></span>
            Academic Evaluation Engine
          </div>
          <h1 class="page-title">
            <app-icon name="sliders" [size]="28" class="title-icon"></app-icon>
            Academic Examination Setup & Schedules
          </h1>
          <p class="page-subtitle">
            Configure examination term cycles, subject datesheets, grading brackets, and transcript publication states.
          </p>
        </div>
        <div class="page-actions">
          <a routerLink="/app/exams/marks" class="btn btn-outline">
            <app-icon name="edit-3" [size]="16"></app-icon>
            <span>Enter Marks</span>
          </a>
          <a routerLink="/app/exams/marksheet" class="btn btn-outline">
            <app-icon name="file-text" [size]="16"></app-icon>
            <span>View Marksheets</span>
          </a>
          <button type="button" class="btn btn-primary" (click)="openCreateExamModal()">
            <app-icon name="plus" [size]="16"></app-icon>
            <span>Create Exam Term</span>
          </button>
        </div>
      </div>

      <!-- TOP SUMMARY CARDS -->
      <div class="stats-grid no-print">
        <div class="stat-card">
          <div class="stat-icon-box bg-indigo">
            <app-icon name="award" [size]="22"></app-icon>
          </div>
          <div class="stat-details">
            <span class="stat-label">Total Exam Cycles</span>
            <div class="stat-value-row">
              <span class="stat-number">{{ exams.length }}</span>
              <span class="stat-badge info">{{ getActiveBranchName() }}</span>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-box bg-emerald">
            <app-icon name="eye" [size]="22"></app-icon>
          </div>
          <div class="stat-details">
            <span class="stat-label">Published & Live</span>
            <div class="stat-value-row">
              <span class="stat-number">{{ getPublishedCount() }}</span>
              <span class="stat-badge success">Results Visible</span>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-box bg-amber">
            <app-icon name="clock" [size]="22"></app-icon>
          </div>
          <div class="stat-details">
            <span class="stat-label">In-Progress / Draft</span>
            <div class="stat-value-row">
              <span class="stat-number">{{ getDraftCount() }}</span>
              <span class="stat-badge warning">Evaluation Phase</span>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-box bg-purple">
            <app-icon name="calendar" [size]="22"></app-icon>
          </div>
          <div class="stat-details">
            <span class="stat-label">Scheduled Exam Papers</span>
            <div class="stat-value-row">
              <span class="stat-number">{{ schedules.length }}</span>
              <span class="stat-badge neutral">Timetable Slots</span>
            </div>
          </div>
        </div>
      </div>

      <!-- NAVIGATION TABS -->
      <div class="tab-nav-bar no-print">
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab === 'terms'"
          (click)="activeTab = 'terms'"
        >
          <app-icon name="layers" [size]="16"></app-icon>
          <span>Examination Terms ({{ filteredExams.length }})</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab === 'schedules'"
          (click)="activeTab = 'schedules'"
        >
          <app-icon name="calendar" [size]="16"></app-icon>
          <span>Subject Timetable & Datesheet</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab === 'grading'"
          (click)="activeTab = 'grading'"
        >
          <app-icon name="bar-chart-2" [size]="16"></app-icon>
          <span>Grading Policy & GPA Scale</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab === 'schemes'"
          (click)="switchTab('schemes')"
        >
          <app-icon name="sliders" [size]="16"></app-icon>
          <span>Marks Distribution & MCQ Setup</span>
        </button>
      </div>

      <!-- TAB 1: EXAM TERMS LIST -->
      <div *ngIf="activeTab === 'terms'" class="tab-pane">
        <!-- SEARCH & FILTER TOOLBAR -->
        <div class="filter-toolbar">
          <div class="search-box">
            <app-icon name="search" [size]="16" class="search-icon"></app-icon>
            <input
              type="text"
              class="search-input"
              placeholder="Search exam by term name or academic session..."
              [(ngModel)]="searchQuery"
            />
            <button *ngIf="searchQuery" type="button" class="btn-clear" (click)="searchQuery = ''">
              <app-icon name="x" [size]="14"></app-icon>
            </button>
          </div>

          <div class="filter-select-group">
            <div class="select-wrap">
              <span class="filter-label">Term:</span>
              <select [(ngModel)]="selectedTermFilter" class="filter-select">
                <option value="ALL">All Terms</option>
                <option value="First Term">First Term</option>
                <option value="Mid Term">Mid Term</option>
                <option value="Final Term">Final Term</option>
                <option value="Pre-Test">Pre-Test / Model</option>
              </select>
            </div>

            <div class="select-wrap">
              <span class="filter-label">Status:</span>
              <select [(ngModel)]="selectedStatusFilter" class="filter-select">
                <option value="ALL">All Status</option>
                <option value="PUBLISHED">Published Only</option>
                <option value="DRAFT">In Progress / Draft</option>
              </select>
            </div>

            <button type="button" class="btn btn-sm btn-outline" (click)="resetFilters()">
              <app-icon name="rotate-ccw" [size]="14"></app-icon>
              <span>Reset</span>
            </button>
          </div>
        </div>

        <!-- EXAM CARDS GRID -->
        <div class="exam-grid" *ngIf="filteredExams.length > 0; else noExamsFound">
          <div *ngFor="let ex of filteredExams" class="exam-card">
            <div class="exam-card-header">
              <div class="exam-icon-bubble" [class.is-pub]="ex.isPublished">
                <app-icon name="award" [size]="22"></app-icon>
              </div>
              <div class="exam-info-header">
                <div class="exam-top-tags">
                  <span class="term-chip">{{ ex.term }}</span>
                  <span class="campus-chip">
                    <app-icon name="map-pin" [size]="11"></app-icon>
                    {{ getExamBranchName(ex.branchId) }}
                  </span>
                </div>
                <h3 class="exam-card-name">{{ ex.name }}</h3>
                <span class="exam-session-text">Session: {{ ex.academicYear }}</span>
              </div>
              <div class="publish-status-pill" [class.published]="ex.isPublished" [class.draft]="!ex.isPublished">
                <span class="status-indicator-dot"></span>
                {{ ex.isPublished ? 'PUBLISHED' : 'IN PROGRESS' }}
              </div>
            </div>

            <!-- DATES & TIMEFRAME STRIP -->
            <div class="exam-timeline-strip">
              <div class="timeline-slot">
                <span class="t-label">Start Date:</span>
                <span class="t-val">{{ ex.startDate }}</span>
              </div>
              <div class="timeline-divider">
                <app-icon name="arrow-right" [size]="13"></app-icon>
              </div>
              <div class="timeline-slot">
                <span class="t-label">End Date:</span>
                <span class="t-val">{{ ex.endDate }}</span>
              </div>
              <div class="timeline-duration">
                <span>{{ calculateDurationDays(ex.startDate, ex.endDate) }} days window</span>
              </div>
            </div>

            <p class="exam-instructions-text" *ngIf="ex.instructions">
              <app-icon name="info" [size]="14" class="info-icon"></app-icon>
              {{ ex.instructions }}
            </p>

            <!-- CARD ACTION BUTTONS -->
            <div class="exam-card-actions">
              <a [routerLink]="['/app/exams/marks']" class="btn btn-sm btn-primary">
                <app-icon name="edit-3" [size]="14"></app-icon>
                <span>Enter Scores</span>
              </a>
              <a [routerLink]="['/app/exams/marksheet']" class="btn btn-sm btn-outline">
                <app-icon name="file-text" [size]="14"></app-icon>
                <span>Marksheets</span>
              </a>
              <button
                type="button"
                class="btn btn-sm btn-outline"
                [class.btn-pub-active]="ex.isPublished"
                (click)="togglePublish(ex)"
                [title]="ex.isPublished ? 'Hide from students & guardians' : 'Make results visible'"
              >
                <app-icon [name]="ex.isPublished ? 'eye-off' : 'eye'" [size]="14"></app-icon>
                <span>{{ ex.isPublished ? 'Unpublish' : 'Publish' }}</span>
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline"
                (click)="viewScheduleForExam(ex)"
                title="View Subject Timetable"
              >
                <app-icon name="calendar" [size]="14"></app-icon>
                <span>Datesheet</span>
              </button>
              <button
                type="button"
                class="btn btn-sm btn-icon-only"
                (click)="openEditExamModal(ex)"
                title="Edit Exam Term"
              >
                <app-icon name="settings" [size]="15"></app-icon>
              </button>
              <button
                type="button"
                class="btn btn-sm btn-icon-only btn-danger-hover"
                (click)="confirmDeleteExam(ex)"
                title="Delete Exam Term"
              >
                <app-icon name="trash-2" [size]="15"></app-icon>
              </button>
            </div>
          </div>
        </div>

        <ng-template #noExamsFound>
          <div class="empty-state-card">
            <div class="empty-icon-wrap">
              <app-icon name="search" [size]="32"></app-icon>
            </div>
            <h4>No Examination Terms Found</h4>
            <p>No exams match the selected filter criteria or campus scope. Try adjusting your query or create a new exam cycle.</p>
            <button type="button" class="btn btn-primary mt-3" (click)="openCreateExamModal()">
              <app-icon name="plus" [size]="16"></app-icon>
              <span>Add New Examination Term</span>
            </button>
          </div>
        </ng-template>
      </div>

      <!-- TAB 2: DATESHEET & TIMETABLE -->
      <div *ngIf="activeTab === 'schedules'" class="tab-pane">
        <div class="schedule-control-card no-print">
          <div class="schedule-selectors">
            <div class="form-group mb-0">
              <label class="form-label">Selected Exam Cycle:</label>
              <select class="form-select" [(ngModel)]="selectedScheduleExamId" (change)="onScheduleExamChange()">
                <option *ngFor="let ex of exams" [value]="ex.id">
                  {{ ex.name }} ({{ ex.term }})
                </option>
              </select>
            </div>

            <div class="form-group mb-0">
              <label class="form-label">Academic Class:</label>
              <select class="form-select" [(ngModel)]="selectedScheduleClassId">
                <option value="ALL">All Classes</option>
                <option *ngFor="let c of classes" [value]="c.id">
                  {{ c.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="schedule-actions-row">
            <button type="button" class="btn btn-outline" (click)="printDatesheet()">
              <app-icon name="printer" [size]="16"></app-icon>
              <span>Print Datesheet</span>
            </button>
            <button type="button" class="btn btn-primary" (click)="openAddScheduleModal()">
              <app-icon name="plus" [size]="16"></app-icon>
              <span>+ Add Subject Exam Slot</span>
            </button>
          </div>
        </div>

        <!-- TIMETABLE TABLE & PRINTABLE DATESHEET -->
        <div class="card printable-datesheet-card" id="printable-datesheet">
          <!-- OFFICIAL INSTITUTIONAL PRINT HEADER (PRINT ONLY) -->
          <div class="print-datesheet-header only-print">
            <div class="print-header-inner">
              <div class="print-crest-col">
                <div class="crest-emblem">
                  <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5"></path>
                    <path d="M2 12l10 5 10-5"></path>
                  </svg>
                </div>
              </div>
              <div class="print-title-col">
                <h1 class="inst-name">SCHOLARS INTERNATIONAL ACADEMY</h1>
                <p class="inst-meta">
                  <span>{{ getActiveBranchName() }}</span>
                  <span class="meta-sep">•</span>
                  <span>Ministry of Education & BISE Curriculum Aligned</span>
                  <span class="meta-sep">•</span>
                  <span>Academic Session: {{ getSelectedExamSession() }}</span>
                </p>
                <div class="datesheet-doc-badge">
                  OFFICIAL EXAMINATION TIMETABLE & DATESHEET
                </div>
              </div>
              <div class="print-meta-col">
                <div class="meta-line"><span class="m-lbl">Term:</span> <strong class="m-val">{{ getSelectedExamTerm() }}</strong></div>
                <div class="meta-line"><span class="m-lbl">Session:</span> <span class="m-val">{{ getSelectedExamSession() }}</span></div>
                <div class="meta-line"><span class="m-lbl">Issued:</span> <span class="m-val">{{ todayDateFormatted }}</span></div>
                <div class="meta-line"><span class="m-lbl">Ref No:</span> <span class="m-val">SIA/EXAM/{{ getSelectedExamSession().split('-')[0] }}-{{ getSelectedScheduleClassCode() }}</span></div>
              </div>
            </div>

            <!-- DATESHEET METADATA BANNER -->
            <div class="datesheet-summary-banner">
              <div class="ds-banner-item">
                <span class="lbl">Examination Name:</span>
                <strong class="val">{{ getSelectedExamName() }}</strong>
              </div>
              <div class="ds-banner-item">
                <span class="lbl">Target Class:</span>
                <strong class="val">{{ getSelectedScheduleClassName() }}</strong>
              </div>
              <div class="ds-banner-item">
                <span class="lbl">Exam Window:</span>
                <strong class="val">{{ getSelectedExamPeriod() }}</strong>
              </div>
              <div class="ds-banner-item">
                <span class="lbl">Total Papers:</span>
                <strong class="val">{{ filteredSchedules.length }} Examination Papers</strong>
              </div>
            </div>
          </div>

          <!-- SCREEN CARD HEADER (HIDDEN IN PRINT) -->
          <div class="card-header flex-between no-print">
            <div class="card-title">
              <app-icon name="calendar" [size]="18" class="text-primary"></app-icon>
              <span>Exam Timetable: {{ getSelectedExamName() }}</span>
            </div>
            <span class="badge-accent">{{ filteredSchedules.length }} Examination Papers Scheduled</span>
          </div>

          <div class="app-table-wrapper">
            <table class="app-table">
              <thead>
                <tr>
                  <th class="col-sl">#</th>
                  <th>Exam Date & Day</th>
                  <th>Target Class</th>
                  <th>Subject Paper</th>
                  <th>Time Slot</th>
                  <th>Hall / Room</th>
                  <th>Full / Pass Marks</th>
                  <th class="text-right no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let sch of filteredSchedules; let i = index">
                  <td class="col-sl font-mono">{{ i + 1 }}</td>
                  <td>
                    <div class="date-cell">
                      <span class="date-badge-cal">{{ formatExamDate(sch.examDate) }}</span>
                      <span class="day-label">{{ sch.day || getDayFromDate(sch.examDate) }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="class-tag">{{ sch.className }}</span>
                  </td>
                  <td>
                    <strong class="subject-name">{{ sch.subjectName }}</strong>
                  </td>
                  <td>
                    <span class="time-slot-pill">
                      <app-icon name="clock" [size]="12" class="no-print"></app-icon>
                      {{ sch.startTime }} - {{ sch.endTime }}
                    </span>
                  </td>
                  <td>
                    <span class="room-pill">
                      <app-icon name="map-pin" [size]="12" class="no-print"></app-icon>
                      {{ sch.roomNo }}
                    </span>
                  </td>
                  <td>
                    <span class="marks-pill">
                      <strong>{{ sch.fullMarks }}</strong> / {{ sch.passMarks }}
                    </span>
                  </td>
                  <td class="text-right no-print">
                    <button
                      type="button"
                      class="btn-action-icon btn-danger"
                      (click)="deleteScheduleEntry(sch)"
                      title="Remove from datesheet"
                    >
                      <app-icon name="trash-2" [size]="14"></app-icon>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="filteredSchedules.length === 0">
                  <td colspan="8" class="text-center py-5 text-muted">
                    No examination timetable entries added for the selected exam & class. Click <strong>+ Add Subject Exam Slot</strong> to populate the datesheet.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- CANDIDATE DIRECTIVES & DISCIPLINE (PRINT ONLY) -->
          <div class="print-candidate-directives only-print">
            <div class="directives-header">
              <strong>IMPORTANT EXAMINATION DIRECTIVES FOR CANDIDATES:</strong>
            </div>
            <ol class="directives-list">
              <li>Examinees must occupy designated desks in their allocated examination hall <strong>at least 15 minutes</strong> before the start bell.</li>
              <li>Entry to the hall strictly requires presentation of the authorized <strong>Physical Admit Card</strong> and institutional Student ID.</li>
              <li>Mobile phones, programmable calculators, smartwatches, digital devices, and loose notes/papers are strictly prohibited inside the exam hall.</li>
              <li>No candidate shall be permitted to submit scripts or leave the hall during the <strong>first 60 minutes</strong> of the session.</li>
              <li>Candidates must bring their own required writing and geometry instruments; borrowing items inside the hall is strictly forbidden.</li>
              <li>Any adoption of unfair means, misconduct, or breach of examination rules will lead to immediate cancellation of candidature.</li>
            </ol>
          </div>

          <!-- OFFICIAL SIGNATURES & INSTITUTIONAL SEAL (PRINT ONLY) -->
          <div class="print-signatures-container only-print">
            <div class="sig-column">
              <div class="sig-placeholder"></div>
              <div class="sig-line"></div>
              <div class="sig-role">Class Teacher / Invigilator</div>
              <div class="sig-sub">Department of Academics</div>
            </div>

            <div class="sig-column seal-col">
              <div class="official-seal-frame">
                <span class="seal-icon">★</span>
                <span class="seal-text">OFFICIAL INSTITUTIONAL SEAL</span>
                <span class="seal-branch">{{ getActiveBranchName() }}</span>
              </div>
            </div>

            <div class="sig-column">
              <div class="sig-placeholder"></div>
              <div class="sig-line"></div>
              <div class="sig-role">Controller of Examinations</div>
              <div class="sig-sub">Academic Examination Committee</div>
            </div>

            <div class="sig-column">
              <div class="sig-placeholder"></div>
              <div class="sig-line"></div>
              <div class="sig-role">Principal & Head of Institution</div>
              <div class="sig-sub">Scholars International Academy</div>
            </div>
          </div>

          <!-- PRINT FOOTER NOTE (PRINT ONLY) -->
          <div class="print-footer-endorsement only-print">
            <span>This is an official document generated by Scholars International Academy ERP. Verified on {{ todayDateFormatted }}.</span>
            <span>Document Ref: SIA-EXAM-DS-{{ getSelectedExamSession() }}</span>
          </div>
        </div>
      </div>

      <!-- TAB 3: GRADING BRACKETS & POLICY -->
      <div *ngIf="activeTab === 'grading'" class="tab-pane">
        <div class="card mb-4">
          <div class="card-header">
            <div class="card-title">
              <app-icon name="sliders" [size]="18" class="text-primary"></app-icon>
              <span>Standard Institutional GPA Grading Policy (Scale of 5.00)</span>
            </div>
            <span class="badge-accent">Govt. Education Board & Institution Aligned</span>
          </div>

          <div class="app-table-wrapper">
            <table class="app-table">
              <thead>
                <tr>
                  <th>Marks Score Range</th>
                  <th>Letter Grade</th>
                  <th>Grade Point (GP)</th>
                  <th>Academic Remarks</th>
                  <th>Evaluation Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>80% — 100%</strong></td>
                  <td><span class="grade-pill grade-a-plus">A+</span></td>
                  <td><strong>5.00</strong></td>
                  <td>Outstanding / Highest Institutional Honors</td>
                  <td><span class="badge-success">Passed with Distinction</span></td>
                </tr>
                <tr>
                  <td><strong>70% — 79%</strong></td>
                  <td><span class="grade-pill grade-a">A</span></td>
                  <td><strong>4.00</strong></td>
                  <td>Excellent Performance</td>
                  <td><span class="badge-success">Passed</span></td>
                </tr>
                <tr>
                  <td><strong>60% — 69%</strong></td>
                  <td><span class="grade-pill grade-a-minus">A-</span></td>
                  <td><strong>3.50</strong></td>
                  <td>Very Good Achievement</td>
                  <td><span class="badge-success">Passed</span></td>
                </tr>
                <tr>
                  <td><strong>50% — 59%</strong></td>
                  <td><span class="grade-pill grade-b">B</span></td>
                  <td><strong>3.00</strong></td>
                  <td>Above Average Standard</td>
                  <td><span class="badge-success">Passed</span></td>
                </tr>
                <tr>
                  <td><strong>40% — 49%</strong></td>
                  <td><span class="grade-pill grade-c">C</span></td>
                  <td><strong>2.00</strong></td>
                  <td>Satisfactory Passing Grade</td>
                  <td><span class="badge-warning">Passed</span></td>
                </tr>
                <tr>
                  <td><strong>33% — 39%</strong></td>
                  <td><span class="grade-pill grade-d">D</span></td>
                  <td><strong>1.00</strong></td>
                  <td>Marginal Pass / Academic Warning</td>
                  <td><span class="badge-warning">Marginal Pass</span></td>
                </tr>
                <tr>
                  <td><strong>0% — 32%</strong></td>
                  <td><span class="grade-pill grade-f">F</span></td>
                  <td><strong>0.00</strong></td>
                  <td>Failing Grade / Remedial Retake Mandated</td>
                  <td><span class="badge-danger">Failed</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="info-card-strip">
          <app-icon name="award" [size]="24" class="text-primary"></app-icon>
          <div class="info-content">
            <h4>GPA Calculation Methodology:</h4>
            <p>
              Grade Point Average (GPA) is computed by taking the weighted sum of grade points across all compulsory and elective evaluated subjects, divided by total subject count. Optional Biology / 4th subject benefits from excess points over 2.0 GP added to overall total up to a maximum 5.00 GPA cap.
            </p>
          </div>
        </div>
      </div>


      <!-- TAB 4: CLASS & SUBJECT MARKS DISTRIBUTION & MCQ SETUP -->
      <div *ngIf="activeTab === 'schemes'" class="tab-pane">
        <!-- TOP CONTROLS & FILTER -->
        <div class="card mb-4">
          <div class="card-header flex-between flex-wrap gap-3">
            <div>
              <div class="card-title">
                <app-icon name="sliders" [size]="20" class="text-primary"></app-icon>
                <span>Class-wise Subject Assessment & Marks Distribution Setup</span>
              </div>
              <p class="text-sm text-muted mb-0">
                Configure Theory, MCQ, Practical, and Viva mark weightings per class and subject. In junior classes or subjects like Math, easily turn off MCQ so marks entry displays only relevant columns.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <a [routerLink]="['/app/exams/marks']" [queryParams]="{ classId: selectedSchemeClassId }" class="btn btn-primary">
                <app-icon name="edit-3" [size]="15"></app-icon>
                <span>Go to Marks Entry Ledger</span>
              </a>
            </div>
          </div>

          <div class="card-body">
            <div class="scheme-filter-grid">
              <div class="form-group mb-0">
                <label class="form-label font-bold">
                  <app-icon name="book-open" [size]="14"></app-icon>
                  Select Academic Class:
                </label>
                <select class="form-control" [(ngModel)]="selectedSchemeClassId" (change)="loadSchemesForSelectedClass()">
                  <option *ngFor="let c of classes" [value]="c.id">{{ c.name }} ({{ c.code || 'ID: ' + c.id }})</option>
                </select>
              </div>

              <div class="scheme-tier-banner">
                <div class="tier-badge-pill" [ngClass]="getSchemeClassTierClass()">
                  <app-icon [name]="getSchemeClassTierIcon()" [size]="14"></app-icon>
                  <span>{{ getSchemeClassTierLabel() }}</span>
                </div>
                <div class="tier-desc">
                  {{ getSchemeClassTierHelp() }}
                </div>
              </div>

              <div class="scheme-actions-box">
                <button type="button" class="btn btn-outline" (click)="applyTierPolicyToAllSubjects()">
                  <app-icon name="zap" [size]="14"></app-icon>
                  <span>Auto-Apply Tier Policy</span>
                </button>
                <button type="button" class="btn btn-secondary" (click)="saveAllSchemesForClass()">
                  <app-icon name="save" [size]="14"></app-icon>
                  <span>Save All for {{ getSelectedSchemeClassName() }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- SUBJECT DISTRIBUTION TABLE -->
        <div class="card mb-4">
          <div class="card-header flex-between flex-wrap gap-2">
            <div class="card-title">
              <app-icon name="clipboard-check" [size]="18" class="text-primary"></app-icon>
              <span>Subjects Assessment Matrix for {{ getSelectedSchemeClassName() }} ({{ schemeRows.length }} Subjects)</span>
            </div>
            <div class="badge-accent">
              <app-icon name="info" [size]="13"></app-icon>
              <span>MCQ Toggle removes MCQ column from marks entry</span>
            </div>
          </div>

          <div class="app-table-wrapper">
            <table class="app-table">
              <thead>
                <tr>
                  <th style="width: 170px;">Subject & Code</th>
                  <th style="width: 130px;" class="text-center">Full / Pass Mark</th>
                  <th style="width: 140px;" class="text-center">MCQ Required?</th>
                  <th style="width: 110px;" class="text-center">Written / Theory</th>
                  <th style="width: 100px;" class="text-center">MCQ Mark</th>
                  <th style="width: 100px;" class="text-center">Practical</th>
                  <th style="width: 100px;" class="text-center">Viva / Oral</th>
                  <th style="width: 100px;" class="text-center">Total Valid</th>
                  <th style="min-width: 240px;">Quick Standard Presets</th>
                  <th style="width: 130px;" class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of schemeRows" [class.row-dirty]="row.isDirty">
                  <td>
                    <div class="font-bold text-dark">{{ row.subjectName }}</div>
                    <div class="text-xs text-muted font-mono">{{ row.subjectCode }}</div>
                  </td>

                  <td class="text-center">
                    <div class="dual-inputs-inline">
                      <input type="number" class="form-control form-control-sm text-center" style="width: 55px;" [(ngModel)]="row.fullMarks" (change)="onRowFieldChanged(row)" title="Full Marks" />
                      <span class="dual-sep">/</span>
                      <input type="number" class="form-control form-control-sm text-center" style="width: 50px;" [(ngModel)]="row.passMarks" (change)="onRowFieldChanged(row)" title="Pass Marks" />
                    </div>
                  </td>

                  <td class="text-center">
                    <button
                      type="button"
                      class="btn btn-sm btn-mcq-toggle"
                      [class.mcq-on]="row.hasMcq"
                      [class.mcq-off]="!row.hasMcq"
                      (click)="toggleSubjectMcq(row)"
                      title="Click to toggle MCQ component on or off"
                    >
                      <app-icon [name]="row.hasMcq ? 'check-circle' : 'minus-circle'" [size]="13"></app-icon>
                      <span>{{ row.hasMcq ? 'MCQ Active' : 'NO MCQ' }}</span>
                    </button>
                  </td>

                  <td class="text-center">
                    <input
                      type="number"
                      class="form-control form-control-sm text-center"
                      [(ngModel)]="row.theoryMax"
                      (input)="onRowFieldChanged(row)"
                      [disabled]="!row.hasTheory"
                      min="0"
                    />
                  </td>

                  <td class="text-center">
                    <input
                      type="number"
                      class="form-control form-control-sm text-center"
                      [(ngModel)]="row.mcqMax"
                      (input)="onRowFieldChanged(row)"
                      [disabled]="!row.hasMcq"
                      min="0"
                      [placeholder]="row.hasMcq ? '0' : '—'"
                    />
                  </td>

                  <td class="text-center">
                    <input
                      type="number"
                      class="form-control form-control-sm text-center"
                      [(ngModel)]="row.practicalMax"
                      (input)="onRowFieldChanged(row)"
                      [disabled]="!row.hasPractical"
                      min="0"
                      [placeholder]="row.hasPractical ? '0' : '—'"
                    />
                  </td>

                  <td class="text-center">
                    <input
                      type="number"
                      class="form-control form-control-sm text-center"
                      [(ngModel)]="row.vivaMax"
                      (input)="onRowFieldChanged(row)"
                      [disabled]="!row.hasViva"
                      min="0"
                      [placeholder]="row.hasViva ? '0' : '—'"
                    />
                  </td>

                  <td class="text-center">
                    <span
                      class="sum-check-badge"
                      [class.sum-valid]="getRowSum(row) === row.fullMarks"
                      [class.sum-invalid]="getRowSum(row) !== row.fullMarks"
                      [title]="'Components sum: ' + getRowSum(row) + ' / ' + row.fullMarks"
                    >
                      {{ getRowSum(row) }} / {{ row.fullMarks }}
                    </span>
                  </td>

                  <td>
                    <div class="preset-btns-flex">
                      <button type="button" class="btn-preset-pill" (click)="applyPreset(row, 'math')" title="100% Written, No MCQ">
                        📐 Math (100)
                      </button>
                      <button type="button" class="btn-preset-pill" (click)="applyPreset(row, 'primary')" title="80 Written + 20 Viva, No MCQ">
                        🎒 80+20 (No MCQ)
                      </button>
                      <button type="button" class="btn-preset-pill" (click)="applyPreset(row, 'secondary_70_30')" title="Theory 70 + MCQ 30">
                        🎓 70/30
                      </button>
                      <button type="button" class="btn-preset-pill" (click)="applyPreset(row, 'science_50_25_25')" title="Theory 50 + MCQ 25 + Practical 25">
                        🔬 50/25/25
                      </button>
                      <button type="button" class="btn-preset-pill" (click)="applyPreset(row, 'ict_25_25')" title="Theory 25 + Practical 25, No MCQ">
                        💻 ICT 25/25
                      </button>
                    </div>
                  </td>

                  <td class="text-center">
                    <div class="action-btns-inline">
                      <button type="button" class="btn btn-sm btn-primary" (click)="saveScheme(row)" title="Save scheme for this subject">
                        <app-icon name="save" [size]="13"></app-icon>
                        <span>{{ row.isDirty ? 'Save*' : 'Saved' }}</span>
                      </button>
                      <button type="button" class="btn btn-sm btn-outline" (click)="navigateToMarks(row.subjectId)" title="Open in Marks Entry screen">
                        <app-icon name="edit-3" [size]="13"></app-icon>
                      </button>
                    </div>
                  </td>
                </tr>

                <tr *ngIf="schemeRows.length === 0">
                  <td colspan="10" class="text-center py-5 text-muted">
                    <app-icon name="book-open" [size]="36" class="mb-2 text-slate-400"></app-icon>
                    <div>No subjects found for this campus.</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- CREATE / EDIT EXAM MODAL -->
      <app-modal
        [isOpen]="isExamModalOpen"
        (isOpenChange)="isExamModalOpen = $event"
        [title]="modalMode === 'create' ? 'Create New Examination Cycle' : 'Edit Examination Parameters'"
        [subtitle]="modalMode === 'create' ? 'Configure a new institutional term, assessment period and publication visibility.' : 'Modify dates, term description or publication status.'"
        [maxWidth]="600"
      >
        <div class="modal-form-content">
          <div class="form-group">
            <label class="form-label required">Examination Name</label>
            <input
              type="text"
              class="form-control"
              placeholder="e.g. Mid Term Examination 2026"
              [(ngModel)]="examForm.name"
            />
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label required">Term Category</label>
              <select class="form-control" [(ngModel)]="examForm.term">
                <option value="First Term">First Term</option>
                <option value="Mid Term">Mid Term</option>
                <option value="Final Term">Final Term</option>
                <option value="Pre-Test">Pre-Test / Model Test</option>
                <option value="Special Assessment">Special Assessment</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label required">Academic Session</label>
              <select class="form-control" [(ngModel)]="examForm.academicYear">
                <option *ngFor="let ay of academicYears" [value]="ay.name">
                  {{ ay.name }} {{ ay.isCurrent ? '(Current)' : '' }}
                </option>
                <option *ngIf="academicYears.length === 0" value="2026 - 2027">2026 - 2027</option>
              </select>
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label required">Start Date</label>
              <input type="date" class="form-control" [(ngModel)]="examForm.startDate" />
            </div>

            <div class="form-group">
              <label class="form-label required">End Date</label>
              <input type="date" class="form-control" [(ngModel)]="examForm.endDate" />
            </div>
          </div>

          <div class="form-group" *ngIf="isSuperAdmin">
            <label class="form-label">Campus Branch</label>
            <select class="form-control" [(ngModel)]="examForm.branchId">
              <option *ngFor="let b of branches" [value]="b.id">
                {{ b.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Instructions / Exam Hall Directives</label>
            <textarea
              class="form-control"
              rows="3"
              placeholder="e.g. Reporting time 9:30 AM. Scientific calculators permitted for Math only."
              [(ngModel)]="examForm.instructions"
            ></textarea>
          </div>

          <div class="form-check-box">
            <label class="checkbox-container">
              <input type="checkbox" [(ngModel)]="examForm.isPublished" />
              <span class="checkmark"></span>
              <span class="check-label">
                <strong>Publish Marksheets Immediately</strong>
                <small class="d-block text-muted">Make examination report cards and grades visible to students & guardians</small>
              </span>
            </label>
          </div>
        </div>

        <div footer class="modal-footer-btns">
          <button type="button" class="btn btn-outline" (click)="isExamModalOpen = false">
            Cancel
          </button>
          <button type="button" class="btn btn-primary" (click)="saveExam()">
            <app-icon name="check" [size]="16"></app-icon>
            <span>{{ modalMode === 'create' ? 'Create Examination' : 'Save Changes' }}</span>
          </button>
        </div>
      </app-modal>

      <!-- ADD SCHEDULE ENTRY MODAL -->
      <app-modal
        [isOpen]="isScheduleModalOpen"
        (isOpenChange)="isScheduleModalOpen = $event"
        title="Schedule Exam Subject Paper"
        subtitle="Add a specific paper, exam hall and timing slot to the institutional datesheet."
        [maxWidth]="580"
      >
        <div class="modal-form-content">
          <div class="form-group">
            <label class="form-label required">Academic Class</label>
            <select class="form-control" [(ngModel)]="scheduleForm.classId" (change)="onScheduleClassChange()">
              <option *ngFor="let c of classes" [value]="c.id">{{ c.name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label required">Subject Paper</label>
            <select class="form-control" [(ngModel)]="scheduleForm.subjectId" (change)="onScheduleSubjectChange()">
              <option *ngFor="let sub of subjects" [value]="sub.id" [disabled]="isSubjectScheduledInExam(scheduleForm.classId, sub.id)">
                {{ sub.name }} ({{ sub.code }}) - Full Marks: {{ sub.fullMarks }}
                <ng-container *ngIf="getScheduledItemForSubject(scheduleForm.classId, sub.id) as scheduled">
                  — [Already Scheduled: {{ formatExamDate(scheduled.examDate) }}]
                </ng-container>
              </option>
            </select>
          </div>

          <!-- Conflict Warning Banner -->
          <div *ngIf="getScheduledItemForSubject(scheduleForm.classId, scheduleForm.subjectId) as conflictSub" class="schedule-conflict-warning">
            <app-icon name="alert-triangle" [size]="16" class="conflict-icon"></app-icon>
            <div class="conflict-text">
              <strong>Duplicate Subject Alert:</strong> {{ conflictSub.subjectName }} is already scheduled for {{ scheduleForm.className }} on {{ formatExamDate(conflictSub.examDate) }} ({{ conflictSub.startTime }}). A subject can only be scheduled once per examination term.
            </div>
          </div>

          <div *ngIf="!getScheduledItemForSubject(scheduleForm.classId, scheduleForm.subjectId) && getTimeSlotClash(scheduleForm.classId, scheduleForm.examDate, scheduleForm.startTime) as clashSlot" class="schedule-conflict-warning">
            <app-icon name="alert-triangle" [size]="16" class="conflict-icon"></app-icon>
            <div class="conflict-text">
              <strong>Time Slot Clash:</strong> {{ clashSlot.subjectName }} is already scheduled at {{ clashSlot.startTime }} on this date for {{ scheduleForm.className }}.
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label required">Exam Date</label>
              <input type="date" class="form-control" [(ngModel)]="scheduleForm.examDate" (change)="onScheduleDateChange()" />
            </div>

            <div class="form-group">
              <label class="form-label">Day of Week</label>
              <input type="text" class="form-control" [value]="scheduleForm.day" readonly />
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label required">Start Time</label>
              <input type="text" class="form-control" placeholder="10:00 AM" [(ngModel)]="scheduleForm.startTime" />
            </div>

            <div class="form-group">
              <label class="form-label required">End Time</label>
              <input type="text" class="form-control" placeholder="01:00 PM" [(ngModel)]="scheduleForm.endTime" />
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label required">Hall / Room No.</label>
              <input type="text" class="form-control" placeholder="Room 301, 302" [(ngModel)]="scheduleForm.roomNo" />
            </div>

            <div class="form-group">
              <label class="form-label required">Full / Pass Marks</label>
              <div class="input-group-dual">
                <input type="number" class="form-control" placeholder="100" [(ngModel)]="scheduleForm.fullMarks" />
                <span class="dual-sep">/</span>
                <input type="number" class="form-control" placeholder="33" [(ngModel)]="scheduleForm.passMarks" />
              </div>
            </div>
          </div>
        </div>

        <div footer class="modal-footer-btns">
          <button type="button" class="btn btn-outline" (click)="isScheduleModalOpen = false">
            Cancel
          </button>
          <button type="button" class="btn btn-primary" (click)="saveScheduleEntry()" [disabled]="isSubjectScheduledInExam(scheduleForm.classId, scheduleForm.subjectId) || !!getTimeSlotClash(scheduleForm.classId, scheduleForm.examDate, scheduleForm.startTime)">
            <app-icon name="plus" [size]="16"></app-icon>
            <span>Add to Timetable</span>
          </button>
        </div>
      </app-modal>

      <!-- DELETE CONFIRMATION MODAL -->
      <app-modal
        [isOpen]="isDeleteModalOpen"
        (isOpenChange)="isDeleteModalOpen = $event"
        title="Confirm Exam Deletion"
        subtitle="This action will remove the examination cycle and its associated schedules."
        [maxWidth]="480"
      >
        <div class="delete-warning-box">
          <div class="warning-icon-wrap">
            <app-icon name="alert-triangle" [size]="28" class="text-danger"></app-icon>
          </div>
          <div>
            <h4>Are you sure you want to delete this exam?</h4>
            <p>
              Examination: <strong>{{ selectedExamForDelete?.name }}</strong>
            </p>
            <p class="text-sm text-muted">
              All associated timetable records will be permanently removed.
            </p>
          </div>
        </div>

        <div footer class="modal-footer-btns">
          <button type="button" class="btn btn-outline" (click)="isDeleteModalOpen = false">
            Cancel
          </button>
          <button type="button" class="btn btn-danger" (click)="proceedDeleteExam()">
            <app-icon name="trash-2" [size]="16"></app-icon>
            <span>Confirm Delete</span>
          </button>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    /* SCHEMES TAB STYLES */
    .scheme-filter-grid {
      display: grid;
      grid-template-columns: 280px 1fr auto;
      gap: 16px;
      align-items: center;
    }
    @media (max-width: 900px) {
      .scheme-filter-grid { grid-template-columns: 1fr; }
    }
    .scheme-tier-banner {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .tier-badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
      width: fit-content;
    }
    .tier-primary { background: #ecfdf5; color: #047857; }
    .tier-secondary { background: #ede9fe; color: #6d28d9; }
    .tier-pre { background: #fef3c7; color: #b45309; }
    .tier-desc { font-size: 0.75rem; color: #64748b; }
    .scheme-actions-box { display: flex; gap: 8px; align-items: center; }

    .btn-mcq-toggle {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.2s;
    }
    .btn-mcq-toggle.mcq-on {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
    }
    .btn-mcq-toggle.mcq-off {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fca5a5;
    }
    .sum-check-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
    }
    .sum-valid { background: #dcfce7; color: #166534; }
    .sum-invalid { background: #fee2e2; color: #991b1b; }
    .preset-btns-flex { display: flex; gap: 5px; flex-wrap: wrap; }
    .btn-preset-pill {
      font-size: 0.7rem;
      font-weight: 600;
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 2px 6px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-preset-pill:hover {
      background: #4f46e5;
      color: #ffffff;
      border-color: #4f46e5;
    }
    .action-btns-inline { display: flex; gap: 6px; justify-content: center; }
    .dual-inputs-inline { display: inline-flex; align-items: center; gap: 4px; }
    .row-dirty { background-color: #fffbeb !important; }

    .text-primary { color: #4f46e5; }
    .text-danger { color: #ef4444; }
    .text-muted { color: #64748b; }
    .text-sm { font-size: 0.8125rem; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .py-5 { padding-top: 2rem; padding-bottom: 2rem; }
    .mt-3 { margin-top: 12px; }
    .mb-0 { margin-bottom: 0 !important; }
    .mb-4 { margin-bottom: 24px; }
    .flex-between { display: flex; align-items: center; justify-content: space-between; }

    /* Header Tag */
    .header-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      background: #eef2ff;
      color: #4f46e5;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
    }
    .title-icon {
      color: #4f46e5;
      margin-right: 8px;
      vertical-align: middle;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    @media (max-width: 1024px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .stats-grid { grid-template-columns: 1fr; }
    }
    .stat-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
      transition: all 0.2s;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    .stat-icon-box {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .bg-indigo { background: #eef2ff; color: #4f46e5; }
    .bg-emerald { background: #ecfdf5; color: #059669; }
    .bg-amber { background: #fffbeb; color: #d97706; }
    .bg-purple { background: #faf5ff; color: #9333ea; }

    .stat-details { flex: 1; }
    .stat-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .stat-value-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-top: 2px;
    }
    .stat-number {
      font-size: 1.45rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1;
    }
    .stat-badge {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 6px;
      text-transform: uppercase;
    }
    .stat-badge.info { background: #eef2ff; color: #4338ca; }
    .stat-badge.success { background: #ecfdf5; color: #047857; }
    .stat-badge.warning { background: #fffbeb; color: #b45309; }
    .stat-badge.neutral { background: #f1f5f9; color: #475569; }

    /* Tab Nav Bar */
    .tab-nav-bar {
      display: flex;
      gap: 8px;
      border-bottom: 2px solid #e2e8f0;
      margin-bottom: 20px;
    }
    .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border: none;
      background: transparent;
      color: #64748b;
      font-size: 0.875rem;
      font-weight: 700;
      cursor: pointer;
      position: relative;
      transition: all 0.2s;
    }
    .tab-btn:hover { color: #1e293b; }
    .tab-btn.active {
      color: #4f46e5;
    }
    .tab-btn.active::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      right: 0;
      height: 2px;
      background: #4f46e5;
    }

    /* Filter Toolbar */
    .filter-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      background: #ffffff;
      padding: 12px 18px;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .search-box {
      position: relative;
      flex: 1;
      min-width: 260px;
    }
    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }
    .search-input {
      width: 100%;
      padding: 8px 36px 8px 36px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 0.85rem;
      outline: none;
      transition: all 0.2s;
    }
    .search-input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
    .btn-clear {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
    }

    .filter-select-group {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .select-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .filter-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
    .filter-select {
      padding: 6px 12px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 0.825rem;
      font-weight: 600;
      color: #1e293b;
      background: #ffffff;
      outline: none;
      cursor: pointer;
    }

    /* Exam Cards Grid */
    .exam-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }
    @media (max-width: 900px) {
      .exam-grid { grid-template-columns: 1fr; }
    }
    .exam-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
      transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .exam-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
      border-color: #c7d2fe;
    }
    .exam-card-header {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 16px;
    }
    .exam-icon-bubble {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: #eef2ff;
      color: #4f46e5;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .exam-icon-bubble.is-pub {
      background: #ecfdf5;
      color: #059669;
    }
    .exam-info-header { flex: 1; }
    .exam-top-tags {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }
    .term-chip {
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      background: #f1f5f9;
      color: #475569;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .campus-chip {
      font-size: 0.65rem;
      font-weight: 700;
      background: #e0f2fe;
      color: #0369a1;
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }
    .exam-card-name {
      font-size: 1.125rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      line-height: 1.25;
    }
    .exam-session-text {
      font-size: 0.78rem;
      color: #64748b;
      font-weight: 600;
    }

    .publish-status-pill {
      font-size: 0.7rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      text-transform: uppercase;
    }
    .publish-status-pill.published {
      background: #dcfce7;
      color: #15803d;
    }
    .publish-status-pill.draft {
      background: #fef3c7;
      color: #b45309;
    }
    .status-indicator-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    /* Timeline Strip */
    .exam-timeline-strip {
      display: flex;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 10px 14px;
      border-radius: 10px;
      margin-bottom: 12px;
      font-size: 0.8125rem;
      gap: 12px;
    }
    .timeline-slot {
      display: flex;
      flex-direction: column;
    }
    .t-label {
      font-size: 0.65rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
    }
    .t-val {
      font-weight: 700;
      color: #1e293b;
    }
    .timeline-divider {
      color: #cbd5e1;
      display: flex;
      align-items: center;
    }
    .timeline-duration {
      margin-left: auto;
      font-size: 0.72rem;
      font-weight: 700;
      color: #6366f1;
      background: #eef2ff;
      padding: 3px 8px;
      border-radius: 6px;
    }

    .exam-instructions-text {
      font-size: 0.78rem;
      color: #64748b;
      margin-bottom: 16px;
      line-height: 1.4;
      display: flex;
      align-items: flex-start;
      gap: 6px;
      background: #fffbeb;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid #fef3c7;
    }
    .info-icon {
      color: #d97706;
      flex-shrink: 0;
      margin-top: 2px;
    }

    /* Actions */
    .exam-card-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      padding-top: 12px;
      border-top: 1px solid #f1f5f9;
    }
    .btn-pub-active {
      color: #15803d !important;
      border-color: #86efac !important;
      background: #f0fdf4 !important;
    }
    .btn-icon-only {
      width: 32px;
      height: 32px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: #ffffff;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-icon-only:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .btn-danger-hover:hover {
      background: #fee2e2 !important;
      color: #dc2626 !important;
      border-color: #fca5a5 !important;
    }

    /* Empty state */
    .empty-state-card {
      background: #ffffff;
      border: 1px dashed #cbd5e1;
      border-radius: 16px;
      padding: 48px 24px;
      text-align: center;
      color: #64748b;
    }
    .empty-icon-wrap {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #f1f5f9;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px auto;
    }

    /* Tab 2: Schedule & Timetable */
    .schedule-control-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 16px 20px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      flex-wrap: wrap;
    }
    .schedule-selectors {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .schedule-actions-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .badge-accent {
      font-size: 0.75rem;
      font-weight: 700;
      background: #eef2ff;
      color: #4f46e5;
      padding: 4px 10px;
      border-radius: 999px;
    }

    .date-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .date-badge-cal {
      font-weight: 700;
      color: #0f172a;
      font-size: 0.825rem;
    }
    .day-label {
      font-size: 0.7rem;
      color: #64748b;
    }
    .time-slot-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 0.775rem;
      font-weight: 600;
      color: #334155;
    }
    .class-tag {
      font-size: 0.775rem;
      font-weight: 700;
      color: #4f46e5;
      background: #eef2ff;
      padding: 3px 8px;
      border-radius: 6px;
    }
    .room-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.78rem;
      font-weight: 600;
      color: #0284c7;
      background: #f0f9ff;
      padding: 2px 7px;
      border-radius: 6px;
    }
    .marks-pill {
      font-size: 0.8rem;
      color: #475569;
    }
    .btn-action-icon {
      border: none;
      background: transparent;
      padding: 6px;
      border-radius: 6px;
      cursor: pointer;
      color: #94a3b8;
      transition: all 0.2s;
    }
    .btn-action-icon.btn-danger:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    /* Tab 3: Grading */
    .grade-pill {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 6px;
      font-weight: 800;
      font-size: 0.8rem;
    }
    .grade-a-plus { background: #ecfdf5; color: #059669; }
    .grade-a { background: #f0fdf4; color: #16a34a; }
    .grade-a-minus { background: #eff6ff; color: #2563eb; }
    .grade-b { background: #fffbeb; color: #d97706; }
    .grade-c { background: #fff7ed; color: #ea580c; }
    .grade-d { background: #fdf2f8; color: #db2777; }
    .grade-f { background: #fef2f2; color: #dc2626; }

    .badge-success { background: #ecfdf5; color: #059669; padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; }
    .badge-warning { background: #fffbeb; color: #d97706; padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; }
    .badge-danger { background: #fef2f2; color: #dc2626; padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; }

    .info-card-strip {
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }
    .info-content h4 {
      font-size: 0.95rem;
      font-weight: 800;
      color: #1e1b4b;
      margin: 0 0 6px 0;
    }
    .info-content p {
      font-size: 0.825rem;
      color: #3730a3;
      margin: 0;
      line-height: 1.5;
    }

    /* Modal Form */
    .modal-form-content {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .form-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .form-label.required::after {
      content: ' *';
      color: #ef4444;
    }
    .form-control, .form-select {
      padding: 8px 12px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 0.85rem;
      outline: none;
      transition: all 0.2s;
      background: #ffffff;
      width: 100%;
    }
    .form-control:focus, .form-select:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    .input-group-dual {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .dual-sep {
      color: #94a3b8;
      font-weight: 700;
    }

    .form-check-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 12px 14px;
      border-radius: 10px;
    }
    .checkbox-container {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      cursor: pointer;
    }
    .check-label strong {
      display: block;
      font-size: 0.84rem;
      color: #0f172a;
    }
    .modal-footer-btns {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      width: 100%;
    }

    /* Delete dialog */
    .delete-warning-box {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 10px 0;
    }
    .warning-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #fee2e2;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .delete-warning-box h4 {
      margin: 0 0 6px 0;
      font-size: 1rem;
      font-weight: 800;
      color: #0f172a;
    }
    .delete-warning-box p {
      margin: 0 0 4px 0;
      font-size: 0.85rem;
    }

    /* Print Formatting & Institutional Layout */
    .only-print {
      display: none;
    }
    .col-sl {
      width: 44px;
      text-align: center;
    }

    @media print {
      @page {
        size: A4 portrait;
        margin: 10mm 12mm;
      }

      body, html {
        background: #ffffff !important;
        color: #000000 !important;
        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif !important;
      }

      .no-print {
        display: none !important;
      }

      .only-print {
        display: block !important;
      }

      .page-container {
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
      }

      .tab-pane {
        padding: 0 !important;
        margin: 0 !important;
        display: block !important;
      }

      .card.printable-datesheet-card,
      #printable-datesheet {
        border: none !important;
        box-shadow: none !important;
        background: transparent !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      .app-table-wrapper {
        overflow: visible !important;
        width: 100% !important;
        border: none !important;
        box-shadow: none !important;
        margin-bottom: 12px !important;
      }

      .app-table {
        width: 100% !important;
        border-collapse: collapse !important;
        table-layout: auto !important;
        margin: 0 !important;
        font-size: 11px !important;
      }

      .app-table th {
        background: #f1f5f9 !important;
        color: #0f172a !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        font-size: 9.5px !important;
        letter-spacing: 0.5px !important;
        border: 1px solid #94a3b8 !important;
        padding: 6px 8px !important;
        text-align: left !important;
      }

      .app-table th.col-sl {
        text-align: center !important;
      }

      .app-table td {
        border: 1px solid #cbd5e1 !important;
        padding: 6px 8px !important;
        color: #0f172a !important;
        font-size: 10.5px !important;
        vertical-align: middle !important;
      }

      .app-table td.col-sl {
        text-align: center !important;
      }

      .app-table tr {
        page-break-inside: avoid !important;
      }

      .app-table tbody tr:nth-child(even) td {
        background-color: #f8fafc !important;
      }

      /* Datesheet print header */
      .print-datesheet-header {
        margin-bottom: 14px;
        border-bottom: 2px solid #0f172a;
        padding-bottom: 10px;
      }

      .print-header-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 10px;
      }

      .crest-emblem {
        width: 50px;
        height: 50px;
        border-radius: 8px;
        border: 2px solid #0f172a;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #0f172a;
      }

      .print-title-col {
        flex: 1;
        text-align: center;
      }

      .inst-name {
        font-size: 18px !important;
        font-weight: 900 !important;
        color: #0f172a !important;
        letter-spacing: 0.8px !important;
        margin: 0 0 2px 0 !important;
        text-transform: uppercase;
      }

      .inst-meta {
        font-size: 10px !important;
        color: #475569 !important;
        margin: 0 0 6px 0 !important;
      }

      .meta-sep {
        margin: 0 6px;
        color: #94a3b8;
      }

      .datesheet-doc-badge {
        display: inline-block;
        background: #0f172a !important;
        color: #ffffff !important;
        font-size: 10.5px !important;
        font-weight: 800 !important;
        letter-spacing: 1px !important;
        padding: 3px 12px !important;
        border-radius: 4px;
        text-transform: uppercase;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .print-meta-col {
        text-align: right;
        font-size: 9.5px;
        color: #334155;
        min-width: 150px;
      }

      .meta-line {
        line-height: 1.35;
      }

      .m-lbl {
        color: #64748b;
        font-weight: 600;
        margin-right: 3px;
      }

      .m-val {
        color: #0f172a;
      }

      .datesheet-summary-banner {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        background: #f8fafc !important;
        border: 1px solid #cbd5e1 !important;
        border-radius: 4px;
        padding: 6px 10px;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .ds-banner-item {
        font-size: 9.5px;
        display: flex;
        flex-direction: column;
      }

      .ds-banner-item .lbl {
        color: #64748b;
        font-size: 8.5px;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .ds-banner-item .val {
        color: #0f172a;
        font-weight: 700;
        font-size: 10.5px;
      }

      .date-cell {
        display: flex;
        flex-direction: column;
      }

      .date-badge-cal {
        font-weight: 700 !important;
        color: #0f172a !important;
        font-size: 10.5px !important;
      }

      .day-label {
        font-size: 9.5px !important;
        color: #475569 !important;
        font-weight: 600 !important;
      }

      .class-tag {
        font-weight: 700 !important;
        color: #0f172a !important;
        background: #f1f5f9 !important;
        border: 1px solid #cbd5e1 !important;
        padding: 2px 5px !important;
        border-radius: 3px !important;
        font-size: 9.5px !important;
        display: inline-block;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .subject-name {
        font-weight: 700 !important;
        color: #0f172a !important;
        font-size: 11px !important;
      }

      .time-slot-pill {
        font-weight: 600 !important;
        color: #0f172a !important;
        background: transparent !important;
        padding: 0 !important;
        border: none !important;
        white-space: nowrap !important;
        font-size: 10px !important;
      }

      .room-pill {
        font-weight: 600 !important;
        color: #0f172a !important;
        background: transparent !important;
        padding: 0 !important;
        border: none !important;
        font-size: 10px !important;
      }

      .marks-pill {
        font-weight: 700 !important;
        color: #0f172a !important;
        background: transparent !important;
        padding: 0 !important;
        border: none !important;
        font-size: 10px !important;
        white-space: nowrap !important;
      }

      /* Candidate Directives */
      .print-candidate-directives {
        margin-top: 12px;
        background: #fafaf9 !important;
        border: 1px dashed #94a3b8 !important;
        border-radius: 4px;
        padding: 6px 10px;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        page-break-inside: avoid !important;
      }

      .directives-header {
        font-size: 9px;
        letter-spacing: 0.5px;
        color: #0f172a;
        margin-bottom: 3px;
      }

      .directives-list {
        margin: 0;
        padding-left: 14px;
        font-size: 8.5px;
        line-height: 1.4;
        color: #334155;
      }

      .directives-list li {
        margin-bottom: 1.5px;
      }

      /* Signatures container */
      .print-signatures-container {
        margin-top: 32px;
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 12px;
        padding: 0 10px;
        page-break-inside: avoid !important;
      }

      .sig-column {
        text-align: center;
        width: 140px;
      }

      .sig-line {
        border-bottom: 1.5px solid #0f172a;
        margin-bottom: 5px;
      }

      .sig-role {
        font-size: 9.5px;
        font-weight: 700;
        color: #0f172a;
      }

      .sig-sub {
        font-size: 8px;
        color: #64748b;
      }

      .seal-col {
        width: 110px;
      }

      .official-seal-frame {
        border: 1.5px dashed #64748b;
        border-radius: 50%;
        width: 76px;
        height: 76px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 4px;
      }

      .seal-icon {
        font-size: 10px;
        color: #64748b;
      }

      .seal-text {
        font-size: 6.5px;
        font-weight: 800;
        color: #475569;
        line-height: 1.1;
        letter-spacing: 0.3px;
      }

      .seal-branch {
        font-size: 6px;
        color: #64748b;
      }

      .print-footer-endorsement {
        margin-top: 16px;
        border-top: 1px solid #e2e8f0;
        padding-top: 4px;
        display: flex;
        justify-content: space-between;
        font-size: 7.5px;
        color: #94a3b8;
      }
    }

    .schedule-conflict-warning {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 16px;
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }
    .schedule-conflict-warning .conflict-icon {
      color: #dc2626;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .schedule-conflict-warning .conflict-text {
      font-size: 0.82rem;
      color: #991b1b;
      line-height: 1.45;
    }
  `]
})
export class ExamSetupComponent implements OnInit {
  private examStore = inject(ExamStoreService);
  private academicStore = inject(AcademicStoreService);
  private campus = inject(CampusSessionService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  getAssessmentScheme(classId: string, subjectId: string): any {
    try {
      const raw = localStorage.getItem(`sms_scheme_${classId}_${subjectId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  saveAssessmentScheme(classId: string, subjectId: string, scheme: any): void {
    try {
      localStorage.setItem(`sms_scheme_${classId}_${subjectId}`, JSON.stringify(scheme));
    } catch { }
  }

  activeTab: SetupTab = 'terms';

  exams: Exam[] = [];
  schedules: ExamScheduleItem[] = [];
  classes: SchoolClass[] = [];
  subjects: Subject[] = [];
  branches: Branch[] = [];
  academicYears: AcademicYear[] = [];

  // Filter properties
  searchQuery = '';
  selectedTermFilter = 'ALL';
  selectedStatusFilter = 'ALL';

  // Schedule Tab selectors
  selectedScheduleExamId = '';
  selectedScheduleClassId = 'ALL';

  // Modals state
  isExamModalOpen = false;
  modalMode: 'create' | 'edit' = 'create';
  selectedExamId = '';

  examForm: {
    name: string;
    term: string;
    academicYear: string;
    startDate: string;
    endDate: string;
    branchId: string;
    instructions: string;
    isPublished: boolean;
  } = {
      name: '',
      term: 'First Term',
      academicYear: '2026 - 2027',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      branchId: 'br-01',
      instructions: '',
      isPublished: false
    };

  isScheduleModalOpen = false;
  scheduleForm: {
    classId: string;
    className: string;
    subjectId: string;
    subjectName: string;
    examDate: string;
    day: string;
    startTime: string;
    endTime: string;
    roomNo: string;
    fullMarks: number;
    passMarks: number;
  } = {
      classId: '',
      className: '',
      subjectId: '',
      subjectName: '',
      examDate: new Date().toISOString().split('T')[0],
      day: 'Sunday',
      startTime: '10:00 AM',
      endTime: '01:00 PM',
      roomNo: 'Room 301',
      fullMarks: 100,
      passMarks: 33
    };

  isDeleteModalOpen = false;
  selectedExamForDelete: Exam | null = null;

  get isSuperAdmin(): boolean {
    const u = this.auth.getCurrentUser();
    return !!u?.isSuperAdmin || u?.roleName === 'Super Admin' || u?.roleId === 'role-superadmin';
  }


  private route = inject(ActivatedRoute);
  selectedSchemeClassId = '';
  schemeRows: ClassSubjectSchemeRow[] = [];

  switchTab(tab: SetupTab) {
    this.activeTab = tab;
    if (tab === 'schemes') {
      if (!this.selectedSchemeClassId && this.classes.length > 0) {
        this.selectedSchemeClassId = this.classes[0].id;
      }
      this.loadSchemesForSelectedClass();
    }
  }

  getSelectedSchemeClassName(): string {
    const cls = this.classes.find(c => c.id === this.selectedSchemeClassId);
    return cls ? cls.name : 'Selected Class';
  }

  getSchemeClassTier(): 'pre-primary' | 'primary' | 'secondary' {
    const cls = this.classes.find(c => c.id === this.selectedSchemeClassId);
    const name = (cls?.name || '').toLowerCase();
    if (['play', 'narsari', 'nursery', 'kg', 'pre-primary', 'kindergarten'].some(k => name.includes(k))) return 'pre-primary';
    if (['six', 'seven', 'eight', 'nine', 'ten', '6', '7', '8', '9', '10', 'secondary'].some(k => name.includes(k))) return 'secondary';
    return 'primary';
  }

  getSchemeClassTierLabel(): string {
    const tier = this.getSchemeClassTier();
    if (tier === 'pre-primary') return '🧸 Pre-Primary Tier';
    if (tier === 'primary') return '🎒 Primary Tier (Class 1-5)';
    return '🎓 Secondary Tier (Class 6-10)';
  }

  getSchemeClassTierIcon(): string {
    const tier = this.getSchemeClassTier();
    if (tier === 'pre-primary') return 'award';
    if (tier === 'primary') return 'book-open';
    return 'layers';
  }

  getSchemeClassTierClass(): string {
    const tier = this.getSchemeClassTier();
    if (tier === 'pre-primary') return 'tier-pre';
    if (tier === 'primary') return 'tier-primary';
    return 'tier-secondary';
  }

  getSchemeClassTierHelp(): string {
    const tier = this.getSchemeClassTier();
    if (tier === 'primary') {
      return 'Govt. Education Board Policy: Primary classes (1 to 5) do NOT have MCQ. Written is 100 or 80+20 Oral.';
    }
    if (tier === 'pre-primary') {
      return 'Early childhood evaluation: purely Activity & Viva based. NO MCQ required.';
    }
    return 'Secondary curriculum standard: General subjects 70 CQ + 30 MCQ, Science 50/25/25, ICT 25/25, Math customizable.';
  }

  loadSchemesForSelectedClass() {
    if (!this.selectedSchemeClassId && this.classes.length > 0) {
      this.selectedSchemeClassId = this.classes[0].id;
    }
    const tier = this.getSchemeClassTier();

    this.schemeRows = this.subjects.map(sub => {
      const saved = this.getAssessmentScheme(this.selectedSchemeClassId, sub.id);
      if (saved) {
        return {
          subjectId: sub.id,
          subjectName: sub.name,
          subjectCode: sub.code,
          fullMarks: saved.fullMarks ?? sub.fullMarks ?? 100,
          passMarks: saved.passMarks ?? sub.passMarks ?? 33,
          hasTheory: saved.hasTheory !== false,
          theoryName: saved.theoryName || 'Theory',
          theoryMax: saved.theoryMax ?? 70,
          hasMcq: !!saved.hasMcq,
          mcqName: saved.mcqName || 'MCQ',
          mcqMax: saved.mcqMax ?? 0,
          hasPractical: !!saved.hasPractical,
          practicalName: saved.practicalName || 'Practical',
          practicalMax: saved.practicalMax ?? 0,
          hasViva: !!saved.hasViva,
          vivaName: saved.vivaName || 'Oral / Viva',
          vivaMax: saved.vivaMax ?? 0,
          isCustom: true,
          isDirty: false
        };
      }

      // Default smart detection based on tier & subject
      const subName = (sub.name || '').toLowerCase();
      const subCode = (sub.code || '').toLowerCase();
      const full = sub.fullMarks || 100;
      const isMath = subName.includes('math') || subName.includes('গণিত') || subCode.includes('mat');
      const isIct = full === 50 || subName.includes('ict') || subName.includes('computer');
      const isScience = subName.includes('physics') || subName.includes('chem') || subName.includes('bio') || subName.includes('science');

      if (isIct) {
        return {
          subjectId: sub.id, subjectName: sub.name, subjectCode: sub.code,
          fullMarks: 50, passMarks: 17,
          hasTheory: true, theoryName: 'Theory', theoryMax: 25,
          hasMcq: false, mcqName: 'MCQ', mcqMax: 0,
          hasPractical: true, practicalName: 'Practical', practicalMax: 25,
          hasViva: false, vivaName: 'Viva', vivaMax: 0,
          isCustom: false, isDirty: false
        };
      }

      if (tier === 'pre-primary') {
        return {
          subjectId: sub.id, subjectName: sub.name, subjectCode: sub.code,
          fullMarks: full, passMarks: Math.round(full * 0.33),
          hasTheory: true, theoryName: 'Activity', theoryMax: 80,
          hasMcq: false, mcqName: 'MCQ', mcqMax: 0,
          hasPractical: false, practicalName: 'Practical', practicalMax: 0,
          hasViva: true, vivaName: 'Oral', vivaMax: 20,
          isCustom: false, isDirty: false
        };
      }

      if (tier === 'primary') {
        return {
          subjectId: sub.id, subjectName: sub.name, subjectCode: sub.code,
          fullMarks: full, passMarks: Math.round(full * 0.33),
          hasTheory: true, theoryName: 'Written Exam', theoryMax: isMath ? full : Math.round(full * 0.8),
          hasMcq: false, mcqName: 'MCQ', mcqMax: 0,
          hasPractical: false, practicalName: 'Practical', practicalMax: 0,
          hasViva: !isMath, vivaName: 'Oral / Viva', vivaMax: isMath ? 0 : Math.round(full * 0.2),
          isCustom: false, isDirty: false
        };
      }

      // Secondary Tier
      if (isMath) {
        return {
          subjectId: sub.id, subjectName: sub.name, subjectCode: sub.code,
          fullMarks: full, passMarks: Math.round(full * 0.33),
          hasTheory: true, theoryName: 'Written Exam', theoryMax: full,
          hasMcq: false, mcqName: 'MCQ', mcqMax: 0,
          hasPractical: false, practicalName: 'Practical', practicalMax: 0,
          hasViva: false, vivaName: 'Viva', vivaMax: 0,
          isCustom: false, isDirty: false
        };
      }

      if (isScience) {
        return {
          subjectId: sub.id, subjectName: sub.name, subjectCode: sub.code,
          fullMarks: 100, passMarks: 33,
          hasTheory: true, theoryName: 'Theory (CQ)', theoryMax: 50,
          hasMcq: true, mcqName: 'MCQ', mcqMax: 25,
          hasPractical: true, practicalName: 'Practical', practicalMax: 25,
          hasViva: false, vivaName: 'Viva', vivaMax: 0,
          isCustom: false, isDirty: false
        };
      }

      // General Secondary
      return {
        subjectId: sub.id, subjectName: sub.name, subjectCode: sub.code,
        fullMarks: 100, passMarks: 33,
        hasTheory: true, theoryName: 'Theory (CQ)', theoryMax: 70,
        hasMcq: true, mcqName: 'MCQ', mcqMax: 30,
        hasPractical: false, practicalName: 'Practical', practicalMax: 0,
        hasViva: false, vivaName: 'Viva', vivaMax: 0,
        isCustom: false, isDirty: false
      };
    });
    this.cdr.markForCheck();
  }

  getRowSum(row: ClassSubjectSchemeRow): number {
    return (row.hasTheory ? row.theoryMax : 0) +
      (row.hasMcq ? row.mcqMax : 0) +
      (row.hasPractical ? row.practicalMax : 0) +
      (row.hasViva ? row.vivaMax : 0);
  }

  onRowFieldChanged(row: ClassSubjectSchemeRow) {
    row.isDirty = true;
    this.cdr.markForCheck();
  }

  toggleSubjectMcq(row: ClassSubjectSchemeRow) {
    row.hasMcq = !row.hasMcq;
    if (row.hasMcq) {
      if (row.mcqMax === 0) row.mcqMax = 30;
      if (row.theoryMax === row.fullMarks) row.theoryMax = Math.max(0, row.fullMarks - row.mcqMax);
    } else {
      row.theoryMax += row.mcqMax;
      row.mcqMax = 0;
    }
    row.isDirty = true;
    this.cdr.markForCheck();
  }

  applyPreset(row: ClassSubjectSchemeRow, preset: 'math' | 'primary' | 'secondary_70_30' | 'science_50_25_25' | 'ict_25_25') {
    if (preset === 'math') {
      row.fullMarks = 100; row.passMarks = 33;
      row.hasTheory = true; row.theoryName = 'Written Exam'; row.theoryMax = 100;
      row.hasMcq = false; row.mcqMax = 0;
      row.hasPractical = false; row.practicalMax = 0;
      row.hasViva = false; row.vivaMax = 0;
    } else if (preset === 'primary') {
      row.fullMarks = 100; row.passMarks = 33;
      row.hasTheory = true; row.theoryName = 'Written Exam'; row.theoryMax = 80;
      row.hasMcq = false; row.mcqMax = 0;
      row.hasPractical = false; row.practicalMax = 0;
      row.hasViva = true; row.vivaName = 'Oral / Viva'; row.vivaMax = 20;
    } else if (preset === 'secondary_70_30') {
      row.fullMarks = 100; row.passMarks = 33;
      row.hasTheory = true; row.theoryName = 'Theory (CQ)'; row.theoryMax = 70;
      row.hasMcq = true; row.mcqName = 'MCQ'; row.mcqMax = 30;
      row.hasPractical = false; row.practicalMax = 0;
      row.hasViva = false; row.vivaMax = 0;
    } else if (preset === 'science_50_25_25') {
      row.fullMarks = 100; row.passMarks = 33;
      row.hasTheory = true; row.theoryName = 'Theory (CQ)'; row.theoryMax = 50;
      row.hasMcq = true; row.mcqName = 'MCQ'; row.mcqMax = 25;
      row.hasPractical = true; row.practicalName = 'Practical'; row.practicalMax = 25;
      row.hasViva = false; row.vivaMax = 0;
    } else if (preset === 'ict_25_25') {
      row.fullMarks = 50; row.passMarks = 17;
      row.hasTheory = true; row.theoryName = 'Theory'; row.theoryMax = 25;
      row.hasMcq = false; row.mcqMax = 0;
      row.hasPractical = true; row.practicalName = 'Practical'; row.practicalMax = 25;
      row.hasViva = false; row.vivaMax = 0;
    }
    row.isDirty = true;
    this.cdr.markForCheck();
  }

  applyTierPolicyToAllSubjects() {
    const tier = this.getSchemeClassTier();
    this.schemeRows.forEach(row => {
      const isMath = row.subjectName.toLowerCase().includes('math') || row.subjectCode.toLowerCase().includes('mat');
      const isIct = row.fullMarks === 50 || row.subjectName.toLowerCase().includes('ict');
      if (isIct) {
        this.applyPreset(row, 'ict_25_25');
      } else if (tier === 'primary' || tier === 'pre-primary') {
        if (isMath) {
          this.applyPreset(row, 'math');
        } else {
          this.applyPreset(row, 'primary');
        }
      } else {
        if (isMath) {
          this.applyPreset(row, 'math');
        } else {
          this.applyPreset(row, 'secondary_70_30');
        }
      }
    });
    this.toast.info('Tier Policy Applied', `Updated mark structures for ${this.getSelectedSchemeClassName()}. Click 'Save All' to commit.`);
  }

  saveScheme(row: ClassSubjectSchemeRow) {
    if (this.getRowSum(row) !== row.fullMarks) {
      this.toast.error('Sum Mismatch', `${row.subjectName}: Components sum (${this.getRowSum(row)}) must equal Full Marks (${row.fullMarks}).`);
      return;
    }
    this.saveAssessmentScheme(this.selectedSchemeClassId, row.subjectId, row);
    row.isDirty = false;
    row.isCustom = true;
    this.toast.success('Assessment Configured', `Marks distribution saved for ${row.subjectName} in ${this.getSelectedSchemeClassName()}.`);
    this.cdr.markForCheck();
  }

  saveAllSchemesForClass() {
    let errorCount = 0;
    this.schemeRows.forEach(row => {
      if (this.getRowSum(row) !== row.fullMarks) {
        errorCount++;
      } else {
        this.saveAssessmentScheme(this.selectedSchemeClassId, row.subjectId, row);
        row.isDirty = false;
        row.isCustom = true;
      }
    });

    if (errorCount > 0) {
      this.toast.warning('Partial Save', `${this.schemeRows.length - errorCount} subjects saved. ${errorCount} subjects had sum mismatches.`);
    } else {
      this.toast.success('All Schemes Saved', `All ${this.schemeRows.length} subject mark distributions saved for ${this.getSelectedSchemeClassName()}.`);
    }
    this.cdr.markForCheck();
  }

  navigateToMarks(subjectId: string) {
    this.router.navigate(['/app/exams/marks'], {
      queryParams: {
        classId: this.selectedSchemeClassId,
        subjectId
      }
    });
  }

  async ngOnInit() {
    this.examStore.getExams$().subscribe(list => {
      this.exams = list;
      if (!this.selectedScheduleExamId && list.length > 0) {
        this.selectedScheduleExamId = list[0].id;
      }
    });

    this.examStore.getExamSchedules$().subscribe(list => {
      this.schedules = list;
    });

    this.classes = this.academicStore.getClasses();
    this.academicStore.getClasses$().subscribe(c => {
      this.classes = c;
      if (c.length > 0 && !this.scheduleForm.classId) {
        this.scheduleForm.classId = c[0].id;
        this.scheduleForm.className = c[0].name;
      }
    });

    this.subjects = this.academicStore.getSubjects();
    this.academicStore.getSubjects$().subscribe(s => {
      this.subjects = s;
      if (s.length > 0 && !this.scheduleForm.subjectId) {
        this.scheduleForm.subjectId = s[0].id;
        this.scheduleForm.subjectName = s[0].name;
        this.scheduleForm.fullMarks = s[0].fullMarks;
        this.scheduleForm.passMarks = s[0].passMarks;
      }
    });

    this.branches = [
      { id: 'br-02c70f', schoolId: 'sch-01', code: 'DMD', name: 'Dhanmondi Campus', address: 'Dhanmondi, Dhaka', phone: '+880 1711-000001', isActive: true },
      { id: 'br-8996de', schoolId: 'sch-01', code: 'UTR', name: 'Uttara Campus', address: 'Uttara Sector 4, Dhaka', phone: '+880 1711-000002', isActive: true },
      { id: 'br-6fd98e', schoolId: 'sch-01', code: 'RYB', name: 'Rayerbag Campus', address: 'Rayerbag, Dhaka', phone: '+880 1711-000003', isActive: true }
    ];

    this.academicYears = [
      { id: 'ay-2026', name: '2026 - 2027', isCurrent: true, isLocked: false, startDate: '2026-01-01', endDate: '2026-12-31' }
    ];

    await Promise.all([
      this.examStore.loadExams(),
      this.examStore.loadExamSchedules(),
      this.academicStore.loadClasses(),
      this.academicStore.loadSubjects()
    ]);

    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'schemes') {
        this.activeTab = 'schemes';
        if (params['classId']) {
          this.selectedSchemeClassId = params['classId'];
        }
        this.loadSchemesForSelectedClass();
      }
    });

  }

  get filteredExams(): Exam[] {
    return this.exams.filter(ex => {
      // Search
      const q = this.searchQuery.trim().toLowerCase();
      const matchesSearch = !q ||
        ex.name.toLowerCase().includes(q) ||
        ex.term.toLowerCase().includes(q) ||
        ex.academicYear.toLowerCase().includes(q);

      // Term
      const matchesTerm = this.selectedTermFilter === 'ALL' ||
        ex.term.toLowerCase().includes(this.selectedTermFilter.toLowerCase());

      // Status
      const matchesStatus = this.selectedStatusFilter === 'ALL' ||
        (this.selectedStatusFilter === 'PUBLISHED' && ex.isPublished) ||
        (this.selectedStatusFilter === 'DRAFT' && !ex.isPublished);

      return matchesSearch && matchesTerm && matchesStatus;
    });
  }

  get filteredSchedules(): ExamScheduleItem[] {
    const list = this.schedules.filter(sch => {
      const matchExam = !this.selectedScheduleExamId || sch.examId === this.selectedScheduleExamId;
      const matchClass = this.selectedScheduleClassId === 'ALL' || sch.classId === this.selectedScheduleClassId;
      return matchExam && matchClass;
    });

    return [...list].sort((a, b) => {
      const dateA = (a.examDate || '').split('T')[0];
      const dateB = (b.examDate || '').split('T')[0];
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      const timeA = (a.startTime || '');
      const timeB = (b.startTime || '');
      if (timeA !== timeB) return timeA.localeCompare(timeB);
      return (a.className || '').localeCompare(b.className || '');
    });
  }

  getPublishedCount(): number {
    return this.exams.filter(e => e.isPublished).length;
  }

  getDraftCount(): number {
    return this.exams.filter(e => !e.isPublished).length;
  }

  getActiveBranchName(): string {
    const id = this.campus.branchId;
    if (id === 'br-02c70f') return 'Dhanmondi Campus';
    if (id === 'br-8996de') return 'Uttara Campus';
    if (id === 'br-6fd98e') return 'Rayerbag Campus';
    return 'Main Campus (Central)';
  }

  getExamBranchName(branchId?: string): string {
    if (!branchId) return 'Main Campus';
    const b = this.branches.find(x => x.id === branchId);
    return b ? b.name : (branchId === 'br-02c70f' ? 'Dhanmondi Campus' : 'Main Campus');
  }

  getSelectedExamName(): string {
    const ex = this.exams.find(e => e.id === this.selectedScheduleExamId);
    return ex ? ex.name : 'All Examinations';
  }

  getSelectedExamTerm(): string {
    const ex = this.exams.find(e => e.id === this.selectedScheduleExamId);
    return ex ? ex.term : 'All Terms';
  }

  getSelectedExamSession(): string {
    const ex = this.exams.find(e => e.id === this.selectedScheduleExamId);
    return ex?.academicYear || '2026 - 2027';
  }

  getSelectedScheduleClassName(): string {
    if (this.selectedScheduleClassId === 'ALL') return 'All Classes (Composite Datesheet)';
    const c = this.classes.find(cls => cls.id === this.selectedScheduleClassId);
    return c ? c.name : 'All Classes';
  }

  getSelectedScheduleClassCode(): string {
    if (this.selectedScheduleClassId === 'ALL') return 'ALL';
    const c = this.classes.find(cls => cls.id === this.selectedScheduleClassId);
    return c ? (c.code || c.name.replace(/\s+/g, '').toUpperCase()) : 'GEN';
  }

  getSelectedExamPeriod(): string {
    const ex = this.exams.find(e => e.id === this.selectedScheduleExamId);
    if (!ex) return 'Academic Session 2026-2027';
    return `${this.formatExamDate(ex.startDate)} to ${this.formatExamDate(ex.endDate)}`;
  }

  get todayDateFormatted(): string {
    return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatExamDate(dateStr: string): string {
    if (!dateStr) return '';
    const clean = dateStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = parts[2];
      const mIdx = parseInt(parts[1], 10) - 1;
      const year = parts[0];
      if (mIdx >= 0 && mIdx < 12) {
        return `${day} ${months[mIdx]} ${year}`;
      }
    }
    return clean;
  }

  getDayFromDate(dateStr: string): string {
    if (!dateStr) return '';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day).getDay();
      return days[d] || '';
    }
    return '';
  }

  calculateDurationDays(start: string, end: string): number {
    try {
      const s = new Date(start).getTime();
      const e = new Date(end).getTime();
      if (isNaN(s) || isNaN(e) || e < s) return 14;
      return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
    } catch {
      return 14;
    }
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedTermFilter = 'ALL';
    this.selectedStatusFilter = 'ALL';
  }

  // --- EXAM TERM MODALS ---
  openCreateExamModal() {
    this.modalMode = 'create';
    const currentAy = this.academicYears.find(a => a.isCurrent);
    this.examForm = {
      name: '',
      term: 'First Term',
      academicYear: currentAy ? currentAy.name : '2026 - 2027',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      branchId: this.campus.branchId || 'br-02c70f',
      instructions: 'Reporting time 9:30 AM sharp. Students must carry physical admit cards.',
      isPublished: false
    };
    this.isExamModalOpen = true;
  }

  openEditExamModal(ex: Exam) {
    this.modalMode = 'edit';
    this.selectedExamId = ex.id;
    this.examForm = {
      name: ex.name,
      term: ex.term,
      academicYear: ex.academicYear,
      startDate: ex.startDate ? ex.startDate.split('T')[0] : '',
      endDate: ex.endDate ? ex.endDate.split('T')[0] : '',
      branchId: ex.branchId || 'br-01',
      instructions: ex.instructions || '',
      isPublished: ex.isPublished
    };
    this.isExamModalOpen = true;
  }

  saveExam() {
    if (!this.examForm.name.trim()) {
      this.toast.error('Validation Error', 'Please enter a valid examination title.');
      return;
    }
    if (!this.examForm.startDate || !this.examForm.endDate) {
      this.toast.error('Validation Error', 'Please provide start and end dates.');
      return;
    }

    if (this.modalMode === 'create') {
      const created = this.examStore.createExam(this.examForm);
      this.toast.success('Exam Cycle Created', `${created.name} (${created.term}) has been registered.`);
    } else {
      const updated = this.examStore.updateExam(this.selectedExamId, this.examForm);
      if (updated) {
        this.toast.success('Exam Updated', `${updated.name} parameters have been updated.`);
      }
    }
    this.isExamModalOpen = false;
    this.exams = this.examStore.getExams();
    this.cdr.markForCheck();
  }

  togglePublish(exam: Exam) {
    const updated = this.examStore.toggleExamPublish(exam.id);
    if (updated) {
      if (updated.isPublished) {
        this.toast.success('Marksheets Published', `${updated.name} results are now visible to students and parents.`);
      } else {
        this.toast.warning('Draft / In-Progress', `${updated.name} marksheets are now hidden from student portals.`);
      }
      this.exams = this.examStore.getExams();
      this.cdr.markForCheck();
    }
  }

  confirmDeleteExam(ex: Exam) {
    this.selectedExamForDelete = ex;
    this.isDeleteModalOpen = true;
  }

  proceedDeleteExam() {
    if (this.selectedExamForDelete) {
      const name = this.selectedExamForDelete.name;
      this.examStore.deleteExam(this.selectedExamForDelete.id);
      this.toast.info('Exam Deleted', `${name} has been removed.`);
    }
    this.isDeleteModalOpen = false;
    this.selectedExamForDelete = null;
    this.exams = this.examStore.getExams();
    this.cdr.markForCheck();
  }

  viewScheduleForExam(ex: Exam) {
    this.selectedScheduleExamId = ex.id;
    this.activeTab = 'schedules';
  }

  // --- SCHEDULE / DATESHEET MODALS ---
  getScheduledItemForSubject(classId: string, subjectId: string): ExamScheduleItem | undefined {
    if (!classId || !subjectId) return undefined;
    const subObj = this.subjects.find(s => s.id === subjectId);
    const subName = subObj ? subObj.name.trim().toLowerCase() : '';
    return this.schedules.find(s =>
      s.examId === this.selectedScheduleExamId &&
      s.classId === classId &&
      (s.subjectId === subjectId || (subName && s.subjectName && s.subjectName.trim().toLowerCase() === subName))
    );
  }

  isSubjectScheduledInExam(classId: string, subjectId: string): boolean {
    return !!this.getScheduledItemForSubject(classId, subjectId);
  }

  getTimeSlotClash(classId: string, examDate: string, startTime: string): ExamScheduleItem | undefined {
    if (!classId || !examDate || !startTime) return undefined;
    const targetDate = examDate.split('T')[0];
    const cleanTime = startTime.trim().toLowerCase();
    return this.schedules.find(s =>
      s.examId === this.selectedScheduleExamId &&
      s.classId === classId &&
      s.examDate && s.examDate.split('T')[0] === targetDate &&
      s.startTime && s.startTime.trim().toLowerCase() === cleanTime
    );
  }

  onScheduleExamChange() {
    // Reactive refresh of filtered schedules
  }

  onScheduleClassChange() {
    const c = this.classes.find(x => x.id === this.scheduleForm.classId);
    if (c) {
      this.scheduleForm.className = c.name;
      // If current subject is already scheduled for this newly selected class, auto-pick the first unscheduled subject
      if (this.isSubjectScheduledInExam(this.scheduleForm.classId, this.scheduleForm.subjectId)) {
        const availableSub = this.subjects.find(s => !this.isSubjectScheduledInExam(this.scheduleForm.classId, s.id));
        if (availableSub) {
          this.scheduleForm.subjectId = availableSub.id;
          this.scheduleForm.subjectName = availableSub.name;
          this.scheduleForm.fullMarks = availableSub.fullMarks;
          this.scheduleForm.passMarks = availableSub.passMarks;
        }
      }
    }
  }

  onScheduleSubjectChange() {
    const sub = this.subjects.find(x => x.id === this.scheduleForm.subjectId);
    if (sub) {
      this.scheduleForm.subjectName = sub.name;
      this.scheduleForm.fullMarks = sub.fullMarks;
      this.scheduleForm.passMarks = sub.passMarks;
    }
  }

  onScheduleDateChange() {
    if (this.scheduleForm.examDate) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const d = new Date(this.scheduleForm.examDate).getDay();
      this.scheduleForm.day = days[d] || 'Sunday';
    }
  }

  openAddScheduleModal() {
    const ex = this.exams.find(e => e.id === this.selectedScheduleExamId) || this.exams[0];
    const defaultClass = (this.selectedScheduleClassId && this.selectedScheduleClassId !== 'ALL')
      ? (this.classes.find(c => c.id === this.selectedScheduleClassId) || this.classes[0])
      : this.classes[0];

    const classId = defaultClass ? defaultClass.id : '';
    const className = defaultClass ? defaultClass.name : 'Class Ten (10)';

    // Find the first unscheduled subject for this class
    const unscheduledSub = this.subjects.find(s => !this.isSubjectScheduledInExam(classId, s.id)) || this.subjects[0];

    this.scheduleForm = {
      classId: classId,
      className: className,
      subjectId: unscheduledSub ? unscheduledSub.id : '',
      subjectName: unscheduledSub ? unscheduledSub.name : 'General Mathematics',
      examDate: ex ? (ex.startDate ? ex.startDate.split('T')[0] : new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
      day: 'Sunday',
      startTime: '10:00 AM',
      endTime: '01:00 PM',
      roomNo: 'Room 301',
      fullMarks: unscheduledSub ? unscheduledSub.fullMarks : 100,
      passMarks: unscheduledSub ? unscheduledSub.passMarks : 33
    };
    this.onScheduleDateChange();
    this.isScheduleModalOpen = true;
  }

  saveScheduleEntry() {
    if (!this.scheduleForm.subjectId || !this.scheduleForm.classId) {
      this.toast.error('Validation Error', 'Please select class and subject paper.');
      return;
    }

    // 1. Guard against duplicate subject in the same class and exam
    const existingSubject = this.getScheduledItemForSubject(this.scheduleForm.classId, this.scheduleForm.subjectId);
    if (existingSubject) {
      this.toast.error(
        'Duplicate Subject Conflict',
        `${this.scheduleForm.subjectName} is already scheduled for ${this.scheduleForm.className} on ${this.formatExamDate(existingSubject.examDate)}. A subject can only be scheduled once per examination term.`
      );
      return;
    }

    // 2. Guard against time slot clash
    const timeClash = this.getTimeSlotClash(this.scheduleForm.classId, this.scheduleForm.examDate, this.scheduleForm.startTime);
    if (timeClash) {
      this.toast.error(
        'Time Slot Clash',
        `Class '${this.scheduleForm.className}' already has '${timeClash.subjectName}' scheduled on ${this.formatExamDate(this.scheduleForm.examDate)} at ${this.scheduleForm.startTime}.`
      );
      return;
    }

    const item: Partial<ExamScheduleItem> = {
      examId: this.selectedScheduleExamId,
      classId: this.scheduleForm.classId,
      className: this.scheduleForm.className,
      subjectId: this.scheduleForm.subjectId,
      subjectName: this.scheduleForm.subjectName,
      examDate: this.scheduleForm.examDate,
      day: this.scheduleForm.day,
      startTime: this.scheduleForm.startTime,
      endTime: this.scheduleForm.endTime,
      roomNo: this.scheduleForm.roomNo,
      fullMarks: this.scheduleForm.fullMarks,
      passMarks: this.scheduleForm.passMarks,
      branchId: this.campus.branchId || 'br-02c70f'
    };

    this.examStore.addExamSchedule(item);
    this.toast.success('Timetable Slot Added', `${item.subjectName} exam scheduled for ${item.examDate}.`);
    this.isScheduleModalOpen = false;
    this.schedules = this.examStore.getExamSchedules();
    this.cdr.markForCheck();
  }

  deleteScheduleEntry(sch: ExamScheduleItem) {
    this.examStore.deleteExamSchedule(sch.id);
    this.toast.info('Slot Removed', `Removed ${sch.subjectName} paper from timetable.`);
    this.schedules = this.examStore.getExamSchedules();
    this.cdr.markForCheck();
  }

  printDatesheet() {
    this.activeTab = 'schedules';
    document.body.classList.add('printing-datesheet');
    this.cdr.detectChanges();
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing-datesheet');
      }, 500);
    }, 150);
  }
}
