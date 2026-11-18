import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ExamStoreService } from '../../core/services/stores/exam-store.service';
import { AcademicStoreService } from '../../core/services/stores/academic-store.service';
import { StudentStoreService } from '../../core/services/stores/student-store.service';
import { SystemStoreService } from '../../core/services/stores/system-store.service';
import { CampusSessionService } from '../../core/services/campus-session.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Student, Exam, SchoolClass, Section, Subject, StudentMarksheet } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';
import { BadgeComponent } from '../../shared/components/badge.component';

export interface TabulationRow {
  rank: number;
  student: Student;
  subjectMarks: { [subjectId: string]: { marks: number; grade: string; isPass: boolean } };
  totalMarks: number;
  totalObtained: number;
  gpa: number;
  letterGrade: string;
  isPass: boolean;
  isAssessed: boolean;
}

@Component({
  selector: 'app-marksheet',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent, BadgeComponent],
  template: `
    <div class="page-container">
      <!-- PAGE HEADER (NO PRINT) -->
      <div class="page-header no-print">
        <div>
          <h1 class="page-title">
            <app-icon name="award" [size]="26" class="text-purple"></app-icon>
            <span>Academic Performance & Tabulation System</span>
          </h1>
          <p class="page-subtitle">
            Official institutional progress reports, class-wide tabulation sheets, and merit ranking.
          </p>
        </div>
        <div class="page-actions">
          <a
            [routerLink]="['/app/exams/marks']"
            [queryParams]="{ examId: selectedExamId, classId: selectedClassId, sectionId: selectedSectionId }"
            class="btn btn-outline"
            *ngIf="!isGuardian && !isStudent"
            title="Input assessment scores for class"
          >
            <app-icon name="edit-3" [size]="16"></app-icon>
            <span>Enter Marks</span>
          </a>
          <button
            type="button"
            class="btn btn-outline"
            (click)="exportTabulationCSV()"
            *ngIf="activeTab === 'tabulation' && !isGuardian && !isStudent"
            title="Export Class Tabulation to CSV"
          >
            <app-icon name="download" [size]="16"></app-icon>
            <span>Export CSV</span>
          </button>
          <button type="button" class="btn btn-primary" (click)="printPage()" title="Print official document">
            <app-icon name="printer" [size]="16"></app-icon>
            <span>{{ activeTab === 'card' ? 'Print Report Card' : 'Print Tabulation Sheet' }}</span>
          </button>
        </div>
      </div>

      <!-- VIEW MODE SWITCHER (NO PRINT) -->
      <div class="view-switcher-bar no-print" *ngIf="!isGuardian && !isStudent">
        <button
          type="button"
          class="switch-tab"
          [class.active]="activeTab === 'card'"
          (click)="activeTab = 'card'"
        >
          <app-icon name="file-text" [size]="18"></app-icon>
          <span>Individual Progress Report Card</span>
        </button>
        <button
          type="button"
          class="switch-tab"
          [class.active]="activeTab === 'tabulation'"
          (click)="activeTab = 'tabulation'"
        >
          <app-icon name="list-ordered" [size]="18"></app-icon>
          <span>Class Tabulation Sheet & Merit List</span>
        </button>
      </div>

      <!-- FILTER CONTROLS BAR (NO PRINT) -->
      <div class="card mb-4 no-print">
        <div class="card-body p-3">
          <div class="selector-row">
            <!-- Exam Selector -->
            <div class="form-group mb-0">
              <label class="form-label">Examination Term:</label>
              <select class="form-select form-select-sm" [(ngModel)]="selectedExamId" (change)="onExamOrFilterChange()">
                <option *ngFor="let e of exams" [value]="e.id">{{ e.name }} ({{ e.term }})</option>
              </select>
            </div>

            <!-- Class & Section Selectors (Admin / Teacher) -->
            <ng-container *ngIf="!isGuardian && !isStudent">
              <div class="form-group mb-0">
                <label class="form-label">Class:</label>
                <select class="form-select form-select-sm" [(ngModel)]="selectedClassId" (change)="onClassChange()">
                  <option *ngFor="let c of classes" [value]="c.id">{{ c.name }}</option>
                </select>
              </div>

              <div class="form-group mb-0">
                <label class="form-label">Section:</label>
                <select class="form-select form-select-sm" [(ngModel)]="selectedSectionId" (change)="onSectionChange()">
                  <option value="ALL" *ngIf="activeTab === 'tabulation'">All Sections</option>
                  <option *ngFor="let s of sections" [value]="s.id">{{ s.name }}</option>
                </select>
              </div>

              <!-- Student Selector (For Individual Card) -->
              <div class="form-group mb-0" *ngIf="activeTab === 'card'">
                <label class="form-label">Select Student:</label>
                <select class="form-select form-select-sm" [(ngModel)]="selectedStudentId" (change)="loadMarksheet()">
                  <option *ngFor="let s of filteredStudents" [value]="s.id">
                    {{ s.fullName }} (Roll #{{ s.rollNo }})
                  </option>
                  <option *ngIf="filteredStudents.length === 0" value="">No students in class</option>
                </select>
              </div>
            </ng-container>

            <!-- Student / Guardian View Indicator -->
            <div class="form-group mb-0" *ngIf="isGuardian || isStudent">
              <label class="form-label">Enrolled Student:</label>
              <div class="ward-tag-pill">
                <strong>{{ getSelectedStudentName() }}</strong>
                (Roll #{{ getSelectedStudentRoll() }} — {{ getSelectedClassName() }} {{ getSelectedSectionName() }})
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- LOADING STATE (NO PRINT) -->
      <div class="loading-state-card no-print" *ngIf="isLoading">
        <div class="spinner-pulse"></div>
        <span>Synchronizing assessment data with academic ledger...</span>
      </div>

      <!-- VIEW 1: INDIVIDUAL STUDENT MARKSHEET (PDF Section 09) -->
      <div *ngIf="activeTab === 'card' && !isLoading">
        <!-- REAL MARKS AVAILABLE STATE -->
        <div class="marksheet-paper printable-area" *ngIf="marksheet && marksheet.marks && marksheet.marks.length > 0">
          <!-- Letterhead Header -->
          <div class="report-header">
            <div class="report-logo">
              <app-icon name="graduation-cap" [size]="52" class="text-primary"></app-icon>
            </div>
            <div class="report-header-text">
              <h2>{{ school.name }}</h2>
              <p class="report-subtext">{{ school.address }} • Tel: {{ school.contact }}</p>
              <div class="report-badge-title">OFFICIAL STUDENT PROGRESS REPORT CARD</div>
              <p class="report-session">{{ marksheet.academicYear }} • {{ marksheet.examName }}</p>
            </div>
          </div>

          <!-- Student Meta Details & Grading Scale Reference -->
          <div class="report-meta-and-scale">
            <div class="student-meta-strip">
              <div class="meta-col">
                <div class="meta-row"><span class="m-lbl">Student Name:</span> <strong>{{ marksheet.student.fullName }}</strong></div>
                <div class="meta-row"><span class="m-lbl">Admission No:</span> <strong>{{ marksheet.student.admissionNo }}</strong></div>
                <div class="meta-row"><span class="m-lbl">Class & Section:</span> <strong>{{ marksheet.student.className }} ({{ marksheet.student.sectionName }})</strong></div>
              </div>
              <div class="meta-col">
                <div class="meta-row"><span class="m-lbl">Class Roll No:</span> <strong class="roll-hl">#{{ marksheet.student.rollNo }}</strong></div>
                <div class="meta-row"><span class="m-lbl">Guardian:</span> <strong>{{ marksheet.student.guardianName || 'Guardian Record On File' }}</strong></div>
                <div class="meta-row"><span class="m-lbl">Class Merit Position:</span> <strong class="text-purple">{{ getOrdinal(marksheet.positionInClass) }} Position</strong></div>
              </div>
            </div>

            <!-- Mini Grading Scale Reference Box -->
            <div class="grading-scale-mini">
              <div class="scale-title">Grading Scale (GPA 5.0)</div>
              <table class="scale-table">
                <thead>
                  <tr><th>Marks</th><th>Grade</th><th>GP</th></tr>
                </thead>
                <tbody>
                  <tr><td>80-100</td><td>A+</td><td>5.0</td></tr>
                  <tr><td>70-79</td><td>A</td><td>4.0</td></tr>
                  <tr><td>60-69</td><td>A-</td><td>3.5</td></tr>
                  <tr><td>50-59</td><td>B</td><td>3.0</td></tr>
                  <tr><td>40-49</td><td>C</td><td>2.0</td></tr>
                  <tr><td>33-39</td><td>D</td><td>1.0</td></tr>
                  <tr><td>0-32</td><td>F</td><td>0.0</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Marks Matrix Table -->
          <div class="report-table-wrap">
            <table class="report-table">
              <thead>
                <tr>
                  <th style="width: 50px;" class="text-center">SL</th>
                  <th>Subject Name</th>
                  <th class="text-center" style="width: 90px;">Full Marks</th>
                  <th class="text-center" style="width: 90px;">Pass Marks</th>
                  <th class="text-center" style="width: 110px;">Obtained</th>
                  <th class="text-center" style="width: 90px;">Grade</th>
                  <th class="text-center" style="width: 100px;">Grade Point</th>
                  <th class="text-center" style="width: 100px;">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let m of marksheet.marks; let idx = index">
                  <td class="text-center">{{ idx + 1 }}</td>
                  <td><strong>{{ m.subjectName }}</strong></td>
                  <td class="text-center">{{ m.fullMarks }}</td>
                  <td class="text-center">33</td>
                  <td class="text-center font-bold" [class.text-danger]="!m.isPass">{{ m.obtainedMarks }}</td>
                  <td class="text-center">
                    <span class="badge-grade" [class.grade-f]="m.grade === 'F'">{{ m.grade }}</span>
                  </td>
                  <td class="text-center font-mono font-bold">{{ m.gradePoint.toFixed(1) }}</td>
                  <td class="text-center">
                    <app-badge [variant]="m.isPass ? 'success' : 'danger'" [label]="m.isPass ? 'PASSED' : 'FAILED'" [showDot]="false"></app-badge>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="2"><strong>Aggregate / Total Result</strong></td>
                  <td class="text-center font-bold">{{ marksheet.totalMarks }}</td>
                  <td></td>
                  <td class="text-center font-bold">{{ marksheet.totalObtained }}</td>
                  <td class="text-center">
                    <span class="final-grade-pill" [class.pill-fail]="marksheet.letterGrade === 'F'">{{ marksheet.letterGrade }}</span>
                  </td>
                  <td class="text-center font-bold font-mono">{{ marksheet.gpa.toFixed(2) }}</td>
                  <td class="text-center">
                    <span [class.text-success]="marksheet.letterGrade !== 'F'" [class.text-danger]="marksheet.letterGrade === 'F'" class="font-bold">
                      {{ marksheet.letterGrade !== 'F' ? 'PASSED' : 'FAILED' }}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- GPA SUMMARY BOX -->
          <div class="gpa-kpi-strip">
            <div class="gpa-card">
              <span class="gpa-lbl">Grade Point Average (GPA)</span>
              <div class="gpa-val" [class.text-danger]="marksheet.letterGrade === 'F'">{{ marksheet.gpa.toFixed(2) }} / 5.00</div>
            </div>
            <div class="gpa-card">
              <span class="gpa-lbl">Overall Letter Grade</span>
              <div class="gpa-val" [class.text-primary]="marksheet.letterGrade !== 'F'" [class.text-danger]="marksheet.letterGrade === 'F'">{{ marksheet.letterGrade }}</div>
            </div>
            <div class="gpa-card">
              <span class="gpa-lbl">Class Standing</span>
              <div class="gpa-val text-emerald">{{ getOrdinal(marksheet.positionInClass) }}</div>
            </div>
          </div>

          <!-- Teacher Remarks & Signatures -->
          <div class="remarks-box">
            <span class="rem-lbl">Principal & Faculty Remarks:</span>
            <p class="rem-text">"{{ marksheet.remarks }}"</p>
          </div>

          <div class="signature-strip">
            <div class="sig-block">
              <div class="sig-line"></div>
              <span class="sig-title">Class Teacher Signature</span>
            </div>
            <div class="sig-block">
              <div class="sig-line"></div>
              <span class="sig-title">Exam Controller</span>
            </div>
            <div class="sig-block">
              <div class="sig-line"></div>
              <span class="sig-title">Headmaster / Principal</span>
            </div>
          </div>
        </div>

        <!-- AUTHENTIC NO DATA STATE (NO DEMO / NO FAKE SCORES) -->
        <div class="empty-report-card no-print" *ngIf="!marksheet || !marksheet.marks || marksheet.marks.length === 0">
          <div class="empty-state-icon">
            <app-icon name="clipboard" [size]="52" class="text-muted"></app-icon>
          </div>
          <h3>Assessment Marks Not Yet Submitted</h3>
          <p class="empty-state-desc">
            No examination scores have been recorded for <strong>{{ getSelectedStudentName() }}</strong>
            (Roll #{{ getSelectedStudentRoll() }}) in <strong>{{ getSelectedExamName() }}</strong>.
          </p>
          <div class="empty-meta-box">
            <div><span>Class:</span> <strong>{{ getSelectedClassName() }}</strong></div>
            <div><span>Section:</span> <strong>{{ getSelectedSectionName() }}</strong></div>
            <div><span>Term:</span> <strong>{{ getSelectedExamName() }}</strong></div>
          </div>
          <div class="empty-state-actions">
            <a
              [routerLink]="['/app/exams/marks']"
              [queryParams]="{ examId: selectedExamId, classId: selectedClassId, sectionId: selectedSectionId }"
              class="btn btn-primary"
              *ngIf="!isGuardian && !isStudent"
            >
              <app-icon name="edit-3" [size]="16"></app-icon>
              <span>Enter Assessment Scores for this Class</span>
            </a>
            <button type="button" class="btn btn-outline" (click)="refreshData()">
              <app-icon name="refresh-cw" [size]="16"></app-icon>
              <span>Refresh Ledger</span>
            </button>
          </div>
        </div>
      </div>

      <!-- VIEW 2: CLASS TABULATION SHEET & MERIT LIST -->
      <div *ngIf="activeTab === 'tabulation' && !isLoading">
        <!-- TABULATION KPI SUMMARY CARDS (NO PRINT) -->
        <div class="grid-4 mb-4 no-print">
          <div class="kpi-card">
            <div class="kpi-icon-wrap bg-blue-subtle text-primary">
              <app-icon name="users" [size]="20"></app-icon>
            </div>
            <div>
              <div class="kpi-label">Students Assessed</div>
              <div class="kpi-value">{{ assessedCount }} <span class="kpi-sub">/ {{ tabulationRows.length }}</span></div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon-wrap bg-green-subtle text-success">
              <app-icon name="check-circle" [size]="20"></app-icon>
            </div>
            <div>
              <div class="kpi-label">Passed Candidates</div>
              <div class="kpi-value text-success">{{ passedCount }}</div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon-wrap bg-red-subtle text-danger">
              <app-icon name="x-circle" [size]="20"></app-icon>
            </div>
            <div>
              <div class="kpi-label">Failed / Retake</div>
              <div class="kpi-value text-danger">{{ failedCount }}</div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon-wrap bg-purple-subtle text-purple">
              <app-icon name="award" [size]="20"></app-icon>
            </div>
            <div>
              <div class="kpi-label">Class Pass Rate</div>
              <div class="kpi-value text-purple">{{ passRate }}%</div>
            </div>
          </div>
        </div>

        <!-- NOTICE IF NO ASSESSMENTS RECORDED -->
        <div class="empty-tabulation-box no-print" *ngIf="assessedCount === 0 && tabulationRows.length > 0">
          <app-icon name="alert-circle" [size]="36" class="text-amber"></app-icon>
          <div class="empty-tab-text">
            <h4>Class Tabulation Ledger Pending</h4>
            <p>Assessment scores have not been recorded yet for <strong>{{ getSelectedClassName() }}</strong> in <strong>{{ getSelectedExamName() }}</strong>.</p>
          </div>
          <a
            [routerLink]="['/app/exams/marks']"
            [queryParams]="{ examId: selectedExamId, classId: selectedClassId, sectionId: selectedSectionId }"
            class="btn btn-primary btn-sm"
            *ngIf="!isGuardian && !isStudent"
          >
            <app-icon name="edit-3" [size]="14"></app-icon>
            <span>Enter Marks Now</span>
          </a>
        </div>

        <!-- TABULATION PRINTABLE SHEET CONTAINER -->
        <div class="tabulation-sheet-paper printable-area">
          <!-- Sheet Header -->
          <div class="tabulation-header">
            <div class="tab-school-title">{{ school.name }}</div>
            <div class="tab-sheet-subtitle">ACADEMIC TABULATION SHEET & CLASS MERIT RANKING</div>
            <div class="tab-meta-details">
              <span><strong>Session:</strong> 2026</span> •
              <span><strong>Examination:</strong> {{ getSelectedExamName() }}</span> •
              <span><strong>Class:</strong> {{ getSelectedClassName() }}</span> •
              <span><strong>Section:</strong> {{ selectedSectionId === 'ALL' ? 'All Sections' : getSelectedSectionName() }}</span>
            </div>
          </div>

          <!-- Tabulation Matrix Table -->
          <div class="app-table-wrapper">
            <table class="tabulation-table">
              <thead>
                <tr>
                  <th style="width: 60px;" class="text-center">Rank</th>
                  <th style="width: 70px;">Roll</th>
                  <th>Student Name</th>
                  <th *ngFor="let sub of classSubjects" class="text-center">
                    <div>{{ sub.name }}</div>
                    <div class="text-xxs text-muted">({{ sub.fullMarks }})</div>
                  </th>
                  <th class="text-center">Total</th>
                  <th class="text-center">GPA</th>
                  <th class="text-center">Grade</th>
                  <th class="text-center">Result</th>
                  <th class="text-center no-print" style="width: 90px;">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  *ngFor="let row of tabulationRows"
                  [class.highlight-top]="row.isAssessed && row.rank <= 3 && row.isPass"
                  [class.row-failed]="row.isAssessed && !row.isPass"
                  [class.row-unassessed]="!row.isAssessed"
                >
                  <!-- Rank / Medal -->
                  <td class="text-center font-bold font-mono">
                    <span *ngIf="row.isAssessed && row.rank === 1 && row.isPass" class="rank-badge rank-1" title="1st Position">🥇 1</span>
                    <span *ngIf="row.isAssessed && row.rank === 2 && row.isPass" class="rank-badge rank-2" title="2nd Position">🥈 2</span>
                    <span *ngIf="row.isAssessed && row.rank === 3 && row.isPass" class="rank-badge rank-3" title="3rd Position">🥉 3</span>
                    <span *ngIf="row.isAssessed && (row.rank > 3 || !row.isPass)" class="rank-num">#{{ row.rank }}</span>
                    <span *ngIf="!row.isAssessed" class="text-muted">—</span>
                  </td>

                  <!-- Roll -->
                  <td><span class="roll-pill font-mono">#{{ row.student.rollNo }}</span></td>

                  <!-- Name -->
                  <td>
                    <div class="font-bold text-slate-800">{{ row.student.fullName }}</div>
                    <div class="text-xs text-muted font-mono">{{ row.student.admissionNo }}</div>
                  </td>

                  <!-- Subject Marks -->
                  <td *ngFor="let sub of classSubjects" class="text-center">
                    <ng-container *ngIf="row.isAssessed && row.subjectMarks[sub.id]">
                      <div class="mark-val" [class.mark-fail]="row.subjectMarks[sub.id].isPass === false">
                        {{ row.subjectMarks[sub.id].marks }}
                      </div>
                      <div class="text-xxs text-muted">{{ row.subjectMarks[sub.id].grade }}</div>
                    </ng-container>
                    <span *ngIf="!row.isAssessed || !row.subjectMarks[sub.id]" class="text-muted">—</span>
                  </td>

                  <!-- Total -->
                  <td class="text-center font-bold">
                    {{ row.isAssessed ? row.totalObtained : '—' }}
                  </td>

                  <!-- GPA -->
                  <td class="text-center font-bold font-mono" [class.text-purple]="row.isAssessed && row.isPass" [class.text-danger]="row.isAssessed && !row.isPass">
                    {{ row.isAssessed ? row.gpa.toFixed(2) : '—' }}
                  </td>

                  <!-- Grade -->
                  <td class="text-center">
                    <span *ngIf="row.isAssessed" class="badge-grade" [class.grade-f]="row.letterGrade === 'F'">
                      {{ row.letterGrade }}
                    </span>
                    <span *ngIf="!row.isAssessed" class="text-muted">—</span>
                  </td>

                  <!-- Result -->
                  <td class="text-center">
                    <app-badge
                      *ngIf="row.isAssessed"
                      [variant]="row.isPass ? 'success' : 'danger'"
                      [label]="row.isPass ? 'PASSED' : 'FAILED'"
                      [showDot]="false"
                    ></app-badge>
                    <app-badge
                      *ngIf="!row.isAssessed"
                      variant="neutral"
                      label="PENDING"
                      [showDot]="false"
                    ></app-badge>
                  </td>

                  <!-- Action -->
                  <td class="text-center no-print">
                    <button
                      type="button"
                      class="btn btn-xs btn-outline"
                      (click)="viewStudentCard(row.student.id)"
                      title="View Individual Marksheet"
                    >
                      <app-icon name="eye" [size]="12"></app-icon>
                      <span>Card</span>
                    </button>
                  </td>
                </tr>

                <tr *ngIf="tabulationRows.length === 0">
                  <td [attr.colspan]="classSubjects.length + 8" class="text-center py-5 text-muted">
                    No enrolled students found for {{ getSelectedClassName() }}.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Bottom Endorsements -->
          <div class="tabulation-signatures">
            <div class="sig-block">
              <div class="sig-line"></div>
              <span class="sig-title">Tabulator</span>
            </div>
            <div class="sig-block">
              <div class="sig-line"></div>
              <span class="sig-title">Scrutinizer</span>
            </div>
            <div class="sig-block">
              <div class="sig-line"></div>
              <span class="sig-title">Exam Controller</span>
            </div>
            <div class="sig-block">
              <div class="sig-line"></div>
              <span class="sig-title">Principal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mb-0 { margin-bottom: 0; }
    .mb-4 { margin-bottom: 24px; }
    .text-primary { color: #4f46e5; }
    .text-purple { color: #7c3aed; }
    .text-emerald { color: #059669; }
    .text-success { color: #059669; }
    .text-danger { color: #ef4444; }
    .text-amber { color: #d97706; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 700; }
    .font-mono { font-family: monospace; }
    .text-xs { font-size: 0.75rem; }
    .text-xxs { font-size: 0.6875rem; }
    .text-muted { color: #64748b; }
    .text-slate-800 { color: #1e293b; }

    /* Switcher Tabs */
    .view-switcher-bar {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      background: #e2e8f0;
      padding: 4px;
      border-radius: 10px;
      width: fit-content;
    }
    .switch-tab {
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
    .switch-tab.active {
      background: #ffffff;
      color: #4f46e5;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    .selector-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    .ward-tag-pill {
      background: #e0e7ff;
      color: #3730a3;
      padding: 9px 14px;
      border-radius: 8px;
      font-size: 0.875rem;
      border: 1px solid #c7d2fe;
    }

    /* Loading state */
    .loading-state-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 36px;
      text-align: center;
      color: #64748b;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .spinner-pulse {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid #e0e7ff;
      border-top-color: #4f46e5;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* KPI Summary */
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
    .bg-red-subtle { background: #fef2f2; }
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
    .kpi-sub {
      font-size: 0.875rem;
      font-weight: 500;
      color: #94a3b8;
    }

    /* Print Paper Stylesheet */
    .marksheet-paper {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 36px 44px;
      max-width: 920px;
      margin: 0 auto;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
    }
    .report-header {
      display: flex;
      align-items: center;
      gap: 24px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 18px;
      margin-bottom: 20px;
    }
    .report-header-text h2 {
      margin: 0;
      font-size: 1.6rem;
      font-weight: 800;
      color: #0f172a;
    }
    .report-subtext {
      margin: 2px 0 8px;
      color: #64748b;
      font-size: 0.875rem;
    }
    .report-badge-title {
      display: inline-block;
      background: #312e81;
      color: #ffffff;
      font-size: 0.8125rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      padding: 4px 14px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .report-session {
      margin: 6px 0 0;
      font-weight: 700;
      color: #4f46e5;
      font-size: 0.9375rem;
    }

    /* Meta and Scale */
    .report-meta-and-scale {
      display: grid;
      grid-template-columns: 1fr 220px;
      gap: 16px;
      margin-bottom: 20px;
    }
    .student-meta-strip {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      background: #f8fafc;
      padding: 16px 20px;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
    }
    .grading-scale-mini {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 14px;
    }
    .scale-title {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
      text-align: center;
    }
    .scale-table {
      width: 100%;
      font-size: 0.6875rem;
      border-collapse: collapse;
      text-align: center;
    }
    .scale-table th {
      font-weight: 700;
      color: #475569;
      border-bottom: 1px solid #cbd5e1;
      padding: 2px 4px;
    }
    .scale-table td {
      padding: 2px 4px;
      color: #334155;
    }

    .meta-row {
      margin-bottom: 6px;
      font-size: 0.875rem;
      color: #1e293b;
    }
    .m-lbl {
      color: #64748b;
      display: inline-block;
      width: 140px;
    }
    .roll-hl {
      color: #4f46e5;
      font-family: monospace;
      font-size: 1rem;
    }
    .report-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .report-table th, .report-table td {
      border: 1px solid #cbd5e1;
      padding: 9px 12px;
      font-size: 0.875rem;
    }
    .report-table th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.04em;
    }
    .total-row {
      background: #f8fafc;
      font-weight: 700;
    }
    .badge-grade {
      display: inline-block;
      padding: 2px 8px;
      background: #eff6ff;
      color: #2563eb;
      font-weight: 700;
      border-radius: 4px;
      font-size: 0.8125rem;
    }
    .grade-f {
      background: #fef2f2;
      color: #dc2626;
    }
    .final-grade-pill {
      background: #4f46e5;
      color: #ffffff;
      padding: 3px 12px;
      border-radius: 999px;
      font-weight: 800;
      font-size: 0.875rem;
    }
    .pill-fail {
      background: #ef4444;
    }
    .gpa-kpi-strip {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }
    .gpa-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px;
      text-align: center;
    }
    .gpa-lbl {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .gpa-val {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
    }
    .remarks-box {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 32px;
    }
    .rem-lbl {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
    .rem-text {
      margin: 4px 0 0;
      font-style: italic;
      color: #334155;
      font-size: 0.9375rem;
    }
    .signature-strip {
      display: flex;
      justify-content: space-between;
      margin-top: 36px;
      padding-top: 20px;
    }
    .sig-block {
      text-align: center;
      width: 180px;
    }
    .sig-line {
      border-top: 1px solid #94a3b8;
      margin-bottom: 6px;
    }
    .sig-title {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 600;
    }

    /* Empty Report Card State */
    .empty-report-card {
      background: #ffffff;
      border: 2px dashed #cbd5e1;
      border-radius: 16px;
      padding: 56px 32px;
      text-align: center;
      max-width: 680px;
      margin: 0 auto;
    }
    .empty-state-icon {
      margin-bottom: 16px;
    }
    .empty-report-card h3 {
      font-size: 1.3rem;
      font-weight: 800;
      color: #1e293b;
      margin: 0 0 8px;
    }
    .empty-state-desc {
      color: #64748b;
      font-size: 0.9375rem;
      margin-bottom: 24px;
      max-width: 480px;
      margin-left: auto;
      margin-right: auto;
    }
    .empty-meta-box {
      display: flex;
      justify-content: center;
      gap: 24px;
      background: #f8fafc;
      padding: 12px 20px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      margin-bottom: 28px;
      font-size: 0.875rem;
      color: #475569;
    }
    .empty-state-actions {
      display: flex;
      justify-content: center;
      gap: 12px;
    }

    /* Empty Tabulation Box */
    .empty-tabulation-box {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
    }
    .empty-tab-text h4 {
      margin: 0 0 2px;
      font-size: 0.9375rem;
      font-weight: 700;
      color: #92400e;
    }
    .empty-tab-text p {
      margin: 0;
      font-size: 0.8125rem;
      color: #b45309;
    }

    /* Tabulation Sheet Styles */
    .tabulation-sheet-paper {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    }
    .tabulation-header {
      text-align: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #0f172a;
    }
    .tab-school-title {
      font-size: 1.4rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .tab-sheet-subtitle {
      font-size: 0.875rem;
      font-weight: 700;
      color: #4f46e5;
      letter-spacing: 0.08em;
      margin: 4px 0 8px;
    }
    .tab-meta-details {
      font-size: 0.8125rem;
      color: #475569;
    }
    .tabulation-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }
    .tabulation-table th, .tabulation-table td {
      border: 1px solid #e2e8f0;
      padding: 8px 10px;
      vertical-align: middle;
    }
    .tabulation-table th {
      background: #f8fafc;
      font-weight: 700;
      color: #334155;
    }
    .rank-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 6px;
      font-size: 0.8rem;
    }
    .rank-1 { background: #fef3c7; color: #b45309; }
    .rank-2 { background: #f1f5f9; color: #475569; }
    .rank-3 { background: #ffedd5; color: #c2410c; }
    .rank-num { color: #64748b; font-size: 0.75rem; }
    .roll-pill {
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .mark-val {
      font-weight: 600;
      color: #0f172a;
    }
    .mark-fail {
      color: #ef4444;
      font-weight: 700;
    }
    .highlight-top {
      background: #fffdf5;
    }
    .row-failed {
      background: #fff8f8;
    }
    .row-unassessed {
      background: #fcfcfc;
    }
    .tabulation-signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      padding-top: 16px;
    }

    /* Print Media Queries */
    @media print {
      body * {
        visibility: hidden;
      }
      .printable-area, .printable-area * {
        visibility: visible;
      }
      .printable-area {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        margin: 0;
        padding: 0;
        border: none;
        box-shadow: none;
      }
      .no-print {
        display: none !important;
      }
    }
  `]
})
export class MarksheetComponent implements OnInit {
  private examStore = inject(ExamStoreService);
  private academicStore = inject(AcademicStoreService);
  private studentStore = inject(StudentStoreService);
  private systemStore = inject(SystemStoreService);
  private campus = inject(CampusSessionService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  school = {
    name: 'Scholars International Academy',
    address: 'Plot 14, Road 2, Block-E, Dhaka 1212, Bangladesh',
    contact: '+880 1711-000000',
    ein: '108422',
    regNo: '4920/2012'
  };

  getActiveCampusName(): string {
    const bId = this.campus.branchId;
    if (bId === 'br-02c70f') return 'Dhanmondi Campus';
    if (bId === 'br-8996de') return 'Uttara Campus';
    if (bId === 'br-6fd98e') return 'Rayerbag Campus';
    return 'Main Campus (Central)';
  }

  exams: Exam[] = [];
  classes: SchoolClass[] = [];
  sections: Section[] = [];
  allStudents: Student[] = [];
  filteredStudents: Student[] = [];
  classSubjects: Subject[] = [];

  isGuardian = false;
  isStudent = false;
  isLoading = false;

  activeTab: 'card' | 'tabulation' = 'card';

  selectedExamId = '';
  selectedClassId = '';
  selectedSectionId = '';
  selectedStudentId = '';

  marksheet: StudentMarksheet | null = null;
  tabulationRows: TabulationRow[] = [];

  async ngOnInit() {
    this.auth.getCurrentUser$().subscribe(user => {
      this.isGuardian = user?.roleId === 'role-guardian' || (user?.roleName || '').includes('Guardian');
      this.isStudent = user?.roleId === 'role-student' || (user?.roleName || '').includes('Student');
      if (this.isGuardian || this.isStudent) {
        this.activeTab = 'card';
      }
    });

    // 1. Ensure master catalogs are loaded from real backend
    await Promise.all([
      this.examStore.loadExams(),
      this.academicStore.loadClasses(),
      this.academicStore.loadSections(),
      this.academicStore.loadSubjects(),
      this.studentStore.loadStudents()
    ]);

    this.exams = this.examStore.getExams();
    if (this.exams.length > 0) {
      this.selectedExamId = this.exams[0].id;
    }

    this.classes = this.academicStore.getClasses();
    if (this.classes.length > 0) {
      this.selectedClassId = this.classes[0].id;
    }

    await this.onClassChange();
  }

  async onExamOrFilterChange() {
    await this.refreshData();
  }

  async onClassChange() {
    this.sections = this.academicStore.getSections().filter(s => !this.selectedClassId || s.classId === this.selectedClassId);
    if (this.sections.length > 0) {
      this.selectedSectionId = this.sections[0].id;
    } else {
      this.selectedSectionId = 'ALL';
    }
    await this.loadClassSubjects();
    await this.updateFilteredStudents();
  }

  async onSectionChange() {
    await this.updateFilteredStudents();
  }

  async loadClassSubjects() {
    if (!this.selectedClassId) {
      this.classSubjects = [];
      return;
    }

    const mapped = await this.academicStore.getClassSubjects(this.selectedClassId);
    const allSubs = this.academicStore.getSubjects();

    if (mapped && mapped.length > 0) {
      this.classSubjects = mapped.map((m: any) => {
        if (m.name) return m;
        const sid = m.subjectId || m.id;
        const found = allSubs.find(s => s.id === sid);
        return found || {
          id: sid,
          name: m.subjectName || 'Subject',
          code: 'SUB',
          fullMarks: m.fullMarks || 100,
          passMarks: m.passMarks || 33
        };
      });
    } else {
      // Collect unique subjects from actual exam marks if available
      const marks = this.examStore.getExamMarks(this.selectedExamId, this.selectedClassId);
      const uniqueSubIds = Array.from(new Set(marks.map(m => m.subjectId)));
      if (uniqueSubIds.length > 0) {
        this.classSubjects = uniqueSubIds.map(sid => {
          const m = marks.find(x => x.subjectId === sid)!;
          return {
            id: sid,
            name: m.subjectName,
            code: 'SUB',
            fullMarks: m.fullMarks || 100,
            passMarks: 33
          } as Subject;
        });
      } else {
        this.classSubjects = allSubs.slice(0, 6);
      }
    }
  }

  async updateFilteredStudents() {
    this.allStudents = this.studentStore.getStudents();

    if (this.isGuardian || this.isStudent) {
      const u = this.auth.getCurrentUser();
      const ward = this.allStudents.find(s => s.id === u?.id || s.email === u?.email || s.admissionNo === u?.username);
      this.filteredStudents = ward ? [ward] : this.allStudents.slice(0, 1);
      if (ward) {
        this.selectedStudentId = ward.id;
        this.selectedClassId = ward.classId;
        this.selectedSectionId = ward.sectionId;
      }
    } else {
      this.filteredStudents = this.allStudents.filter(
        s => s.classId === this.selectedClassId &&
             (this.selectedSectionId === 'ALL' || s.sectionId === this.selectedSectionId)
      );

      if (this.filteredStudents.length > 0) {
        if (!this.filteredStudents.some(s => s.id === this.selectedStudentId)) {
          this.selectedStudentId = this.filteredStudents[0].id;
        }
      } else {
        this.selectedStudentId = '';
      }
    }

    await this.refreshData();
  }

  async refreshData() {
    if (!this.selectedExamId || !this.selectedClassId) return;

    this.isLoading = true;
    try {
      // 1. Fetch real assessment marks from backend for the selected exam & class
      await this.examStore.fetchExamMarks(this.selectedExamId, this.selectedClassId, this.selectedSectionId);

      // 2. Load individual report card and class tabulation ledger
      await Promise.all([
        this.loadMarksheet(),
        this.loadTabulation()
      ]);
    } catch (err) {
      console.warn('Sync error:', err);
    } finally {
      this.isLoading = false;
    }
  }

  async loadMarksheet() {
    if (!this.selectedStudentId || !this.selectedExamId) {
      this.marksheet = null;
      return;
    }

    // Direct backend marksheet query
    const sheet = await this.examStore.fetchStudentMarksheet(this.selectedExamId, this.selectedStudentId);
    if (sheet) {
      this.marksheet = sheet;
    } else {
      const st = this.allStudents.find(s => s.id === this.selectedStudentId);
      const ex = this.exams.find(e => e.id === this.selectedExamId);
      this.marksheet = st && ex ? this.examStore.getStudentMarksheet(st, ex, this.classSubjects) : null;
    }
  }

  async loadTabulation() {
    const studentsInClass = this.allStudents.filter(
      s => s.classId === this.selectedClassId &&
           (this.selectedSectionId === 'ALL' || s.sectionId === this.selectedSectionId)
    );

    // Fetch marks in memory for class
    const marks = this.examStore.getExamMarks(this.selectedExamId, this.selectedClassId, undefined, this.selectedSectionId);

    // If class subjects were not mapped, derive from actual student marks
    if (this.classSubjects.length === 0 && marks.length > 0) {
      const distinct = Array.from(new Set(marks.map(m => m.subjectId)));
      this.classSubjects = distinct.map(sid => {
        const m = marks.find(x => x.subjectId === sid)!;
        return {
          id: sid,
          name: m.subjectName,
          code: 'SUB',
          fullMarks: m.fullMarks || 100,
          passMarks: 33
        } as Subject;
      });
    }

    const assessedRows: Omit<TabulationRow, 'rank'>[] = [];
    const unassessedRows: Omit<TabulationRow, 'rank'>[] = [];

    studentsInClass.forEach(st => {
      const studentMarks = marks.filter(m => m.studentId === st.id);
      if (studentMarks.length > 0) {
        const subMarksMap: { [id: string]: { marks: number; grade: string; isPass: boolean } } = {};
        studentMarks.forEach(m => {
          subMarksMap[m.subjectId] = {
            marks: m.obtainedMarks,
            grade: m.grade,
            isPass: m.isPass
          };
        });

        const totalMarks = studentMarks.reduce((sum, m) => sum + (m.fullMarks || 100), 0);
        const totalObtained = studentMarks.reduce((sum, m) => sum + m.obtainedMarks, 0);
        const hasFail = studentMarks.some(m => !m.isPass || m.grade === 'F' || m.isAbsent || m.obtainedMarks < 33);
        const totalGP = studentMarks.reduce((sum, m) => sum + (m.gradePoint || 0), 0);
        const gpa = hasFail ? 0.0 : (studentMarks.length > 0 ? Number((totalGP / studentMarks.length).toFixed(2)) : 0.0);
        const letterGrade = hasFail ? 'F' : (gpa >= 5.0 ? 'A+' : gpa >= 4.0 ? 'A' : gpa >= 3.5 ? 'A-' : gpa >= 3.0 ? 'B' : gpa >= 2.0 ? 'C' : gpa >= 1.0 ? 'D' : 'F');

        assessedRows.push({
          student: st,
          subjectMarks: subMarksMap,
          totalMarks,
          totalObtained,
          gpa,
          letterGrade,
          isPass: !hasFail,
          isAssessed: true
        });
      } else {
        // Enrolled student but no assessment recorded yet
        unassessedRows.push({
          student: st,
          subjectMarks: {},
          totalMarks: 0,
          totalObtained: 0,
          gpa: 0,
          letterGrade: 'N/A',
          isPass: false,
          isAssessed: false
        });
      }
    });

    // Sort assessed students: Passed candidates first by GPA desc, then total marks desc; failed candidates thereafter
    assessedRows.sort((a, b) => {
      if (a.isPass && !b.isPass) return -1;
      if (!a.isPass && b.isPass) return 1;
      if (b.gpa !== a.gpa) return b.gpa - a.gpa;
      return b.totalObtained - a.totalObtained;
    });

    const rankedAssessed: TabulationRow[] = assessedRows.map((r, idx) => ({
      ...r,
      rank: idx + 1
    }));

    const rankedUnassessed: TabulationRow[] = unassessedRows.map(r => ({
      ...r,
      rank: 0
    }));

    this.tabulationRows = [...rankedAssessed, ...rankedUnassessed];
  }

  get assessedCount(): number {
    return this.tabulationRows.filter(r => r.isAssessed).length;
  }

  get passedCount(): number {
    return this.tabulationRows.filter(r => r.isAssessed && r.isPass).length;
  }

  get failedCount(): number {
    return this.tabulationRows.filter(r => r.isAssessed && !r.isPass).length;
  }

  get passRate(): number {
    if (this.assessedCount === 0) return 0;
    return Math.round((this.passedCount / this.assessedCount) * 100);
  }

  getSelectedExamName(): string {
    const e = this.exams.find(ex => ex.id === this.selectedExamId);
    return e ? `${e.name} (${e.term})` : 'Term Examination';
  }

  getSelectedClassName(): string {
    const c = this.classes.find(cls => cls.id === this.selectedClassId);
    return c ? c.name : 'Class';
  }

  getSelectedSectionName(): string {
    const s = this.sections.find(sec => sec.id === this.selectedSectionId);
    return s ? s.name : 'Section';
  }

  getSelectedStudentName(): string {
    const s = this.allStudents.find(st => st.id === this.selectedStudentId);
    return s ? s.fullName : (this.marksheet?.student?.fullName || 'Selected Student');
  }

  getSelectedStudentRoll(): string {
    const s = this.allStudents.find(st => st.id === this.selectedStudentId);
    return s ? s.rollNo : (this.marksheet?.student?.rollNo || '01');
  }

  getOrdinal(n: number): string {
    if (!n || n <= 0) return '—';
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  viewStudentCard(studentId: string) {
    this.selectedStudentId = studentId;
    this.activeTab = 'card';
    this.loadMarksheet();
  }

  printPage() {
    window.print();
  }

  exportTabulationCSV() {
    if (this.tabulationRows.length === 0) {
      this.toast.error('No Data', 'No records available to export.');
      return;
    }

    const headers = [
      'Rank',
      'Roll No',
      'Student Name',
      'Admission No',
      'Status',
      ...this.classSubjects.map(s => s.name),
      'Total Marks',
      'GPA',
      'Grade',
      'Result'
    ];

    const rows = this.tabulationRows.map(r => [
      r.isAssessed ? r.rank : '—',
      r.student.rollNo,
      `"${r.student.fullName}"`,
      r.student.admissionNo,
      r.isAssessed ? 'ASSESSED' : 'UNASSESSED',
      ...this.classSubjects.map(s => r.subjectMarks[s.id]?.marks ?? '—'),
      r.isAssessed ? r.totalObtained : '—',
      r.isAssessed ? r.gpa.toFixed(2) : '—',
      r.isAssessed ? r.letterGrade : '—',
      r.isAssessed ? (r.isPass ? 'PASSED' : 'FAILED') : 'PENDING'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Tabulation_Sheet_${this.getSelectedClassName()}_${this.selectedExamId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.toast.success('CSV Exported', `Tabulation sheet for ${this.getSelectedClassName()} exported successfully.`);
    const u = this.auth.getCurrentUser();
    this.systemStore.logAudit('Export', 'Exam Tabulation', `Exported tabulation CSV for class ${this.getSelectedClassName()}`, u?.fullName || 'Staff', u?.roleName || 'User');
  }
}
