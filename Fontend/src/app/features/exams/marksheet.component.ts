import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDbService } from '../../core/services/mock-db.service';
import { AuthService } from '../../core/services/auth.service';
import { Student, Exam, StudentMarksheet } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';
import { BadgeComponent } from '../../shared/components/badge.component';

@Component({
  selector: 'app-marksheet',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, BadgeComponent],
  template: `
    <div class="page-container">
      <div class="page-header no-print">
        <div>
          <h1 class="page-title">
            <app-icon name="award" [size]="26" class="text-purple"></app-icon>
            Academic Marksheet & Progress Report Card
          </h1>
          <p class="page-subtitle">
            Official institutional transcript with GPA calculation, letter grades, and principal endorsement.
          </p>
        </div>
        <div class="page-actions">
          <button type="button" class="btn btn-primary" (click)="printReportCard()">
            <app-icon name="printer" [size]="16"></app-icon>
            <span>Print Report Card</span>
          </button>
        </div>
      </div>

      <!-- STUDENT & EXAM SELECTOR (NO PRINT) -->
      <div class="card mb-4 no-print">
        <div class="card-body">
          <div class="selector-row">
            <div class="form-group mb-0">
              <label class="form-label">Examination Term:</label>
              <select class="form-select" [(ngModel)]="selectedExamId" (change)="loadMarksheet()">
                <option *ngFor="let e of exams" [value]="e.id">{{ e.name }} ({{ e.term }})</option>
              </select>
            </div>

            <div class="form-group mb-0" *ngIf="!isGuardian && !isStudent">
              <label class="form-label">Select Student:</label>
              <select class="form-select" [(ngModel)]="selectedStudentId" (change)="loadMarksheet()">
                <option *ngFor="let s of students" [value]="s.id">
                  {{ s.fullName }} (Roll {{ s.rollNo }} - {{ s.className }})
                </option>
              </select>
            </div>

            <div class="form-group mb-0" *ngIf="isGuardian || isStudent">
              <label class="form-label">Enrolled Student:</label>
              <div class="ward-tag-pill">
                <strong>Tanvir Ahmed</strong> (Roll #01 — Class 10 Section A Padma)
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PRINTABLE MARKSHEET CARD (PDF Section 09) -->
      <div class="marksheet-paper printable-area" *ngIf="marksheet">
        <!-- Letterhead Header -->
        <div class="report-header">
          <div class="report-logo">
            <app-icon name="graduation-cap" [size]="48" class="text-primary"></app-icon>
          </div>
          <div class="report-header-text">
            <h2>{{ school.name }}</h2>
            <p class="report-subtext">{{ school.address }} • Tel: {{ school.contact }}</p>
            <div class="report-badge-title">OFFICIAL STUDENT PROGRESS REPORT CARD</div>
            <p class="report-session">{{ marksheet.academicYear }} • {{ marksheet.examName }}</p>
          </div>
        </div>

        <!-- Student Meta Details -->
        <div class="student-meta-strip">
          <div class="meta-col">
            <div class="meta-row"><span class="m-lbl">Student Name:</span> <strong>{{ marksheet.student.fullName }}</strong></div>
            <div class="meta-row"><span class="m-lbl">Admission No:</span> <strong>{{ marksheet.student.admissionNo }}</strong></div>
            <div class="meta-row"><span class="m-lbl">Class & Section:</span> <strong>{{ marksheet.student.className }} ({{ marksheet.student.sectionName }})</strong></div>
          </div>
          <div class="meta-col">
            <div class="meta-row"><span class="m-lbl">Class Roll No:</span> <strong class="roll-hl">#{{ marksheet.student.rollNo }}</strong></div>
            <div class="meta-row"><span class="m-lbl">Guardian:</span> <strong>{{ marksheet.student.guardianName }}</strong></div>
            <div class="meta-row"><span class="m-lbl">Date of Issue:</span> <strong>October 19, 2026</strong></div>
          </div>
        </div>

        <!-- Marks Matrix Table -->
        <div class="report-table-wrap">
          <table class="report-table">
            <thead>
              <tr>
                <th style="width: 50px;">SL</th>
                <th>Subject Name</th>
                <th class="text-center">Full Marks</th>
                <th class="text-center">Pass Marks</th>
                <th class="text-center">Marks Obtained</th>
                <th class="text-center">Letter Grade</th>
                <th class="text-center">Grade Point</th>
                <th class="text-center">Result</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let m of marksheet.marks; let idx = index">
                <td>{{ idx + 1 }}</td>
                <td><strong>{{ m.subjectName }}</strong></td>
                <td class="text-center">{{ m.fullMarks }}</td>
                <td class="text-center">33</td>
                <td class="text-center font-bold">{{ m.obtainedMarks }}</td>
                <td class="text-center">
                  <span class="badge-grade">{{ m.grade }}</span>
                </td>
                <td class="text-center font-mono font-bold">{{ m.gradePoint.toFixed(1) }}</td>
                <td class="text-center">
                  <app-badge variant="success" label="PASSED" [showDot]="false"></app-badge>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="2"><strong>Total / Aggregate</strong></td>
                <td class="text-center font-bold">{{ marksheet.totalMarks }}</td>
                <td></td>
                <td class="text-center font-bold">{{ marksheet.totalObtained }}</td>
                <td class="text-center">
                  <span class="final-grade-pill">{{ marksheet.letterGrade }}</span>
                </td>
                <td class="text-center font-bold font-mono">{{ marksheet.gpa }}</td>
                <td class="text-center">
                  <span class="text-success font-bold">PASSED</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- GPA SUMMARY BOX -->
        <div class="gpa-kpi-strip">
          <div class="gpa-card">
            <span class="gpa-lbl">Grade Point Average (GPA)</span>
            <div class="gpa-val">{{ marksheet.gpa }} / 5.00</div>
          </div>
          <div class="gpa-card">
            <span class="gpa-lbl">Overall Letter Grade</span>
            <div class="gpa-val text-primary">{{ marksheet.letterGrade }}</div>
          </div>
          <div class="gpa-card">
            <span class="gpa-lbl">Class Standing</span>
            <div class="gpa-val text-emerald">1st Position</div>
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
    </div>
  `,
  styles: [`
    .mb-4 { margin-bottom: 24px; }
    .text-primary { color: #4f46e5; }
    .text-purple { color: #7c3aed; }
    .text-emerald { color: #059669; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 700; }
    .font-mono { font-family: monospace; }
    .selector-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .ward-tag-pill {
      background: #e0e7ff;
      color: #3730a3;
      padding: 9px 14px;
      border-radius: 8px;
      font-size: 0.875rem;
      border: 1px solid #c7d2fe;
    }

    /* Print Paper Stylesheet */
    .marksheet-paper {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 40px 48px;
      max-width: 900px;
      margin: 0 auto;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
    }
    .report-header {
      display: flex;
      align-items: center;
      gap: 24px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .report-logo {
      width: 80px;
      height: 80px;
      border-radius: 16px;
      background: #eef2ff;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .report-header-text h2 {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .report-subtext {
      font-size: 0.8rem;
      color: #64748b;
      margin: 2px 0 6px 0;
    }
    .report-badge-title {
      display: inline-block;
      background: #0f172a;
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      padding: 3px 10px;
      border-radius: 4px;
    }
    .report-session {
      font-size: 0.85rem;
      font-weight: 600;
      color: #4f46e5;
      margin-top: 4px;
    }

    .student-meta-strip {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .meta-row {
      display: flex;
      font-size: 0.85rem;
      margin-bottom: 6px;
    }
    .m-lbl {
      width: 140px;
      color: #64748b;
    }
    .roll-hl {
      color: #4f46e5;
      font-size: 1rem;
    }

    .report-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .report-table th, .report-table td {
      border: 1px solid #cbd5e1;
      padding: 10px 14px;
      font-size: 0.85rem;
    }
    .report-table th {
      background: #f1f5f9;
      font-weight: 700;
      color: #334155;
    }
    .total-row {
      background: #f8fafc;
      font-weight: bold;
    }
    .badge-grade {
      display: inline-block;
      padding: 2px 8px;
      background: #ecfdf5;
      color: #059669;
      font-weight: 800;
      border-radius: 4px;
    }
    .final-grade-pill {
      background: #4f46e5;
      color: #ffffff;
      padding: 3px 12px;
      border-radius: 6px;
      font-weight: 800;
    }

    .gpa-kpi-strip {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .gpa-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px;
      text-align: center;
    }
    .gpa-lbl {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
    }
    .gpa-val {
      font-size: 1.6rem;
      font-weight: 800;
      color: #0f172a;
      margin-top: 4px;
    }

    .remarks-box {
      border-left: 4px solid #4f46e5;
      background: #f8fafc;
      padding: 12px 18px;
      border-radius: 0 10px 10px 0;
      margin-bottom: 48px;
    }
    .rem-lbl {
      font-size: 0.75rem;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
    }
    .rem-text {
      font-size: 0.875rem;
      font-style: italic;
      color: #1e293b;
      margin-top: 4px;
    }

    .signature-strip {
      display: flex;
      justify-content: space-between;
      margin-top: 60px;
      padding-top: 20px;
    }
    .sig-block {
      text-align: center;
      width: 180px;
    }
    .sig-line {
      border-top: 1px solid #64748b;
      margin-bottom: 6px;
    }
    .sig-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
    }
  `]
})
export class MarksheetComponent implements OnInit {
  private db = inject(MockDbService);
  private auth = inject(AuthService);

  school = this.db.getSchool();
  exams: Exam[] = [];
  students: Student[] = [];

  isGuardian = false;
  isStudent = false;

  selectedExamId = 'ex-mid-26';
  selectedStudentId = 'std-1001';

  marksheet: StudentMarksheet | null = null;

  ngOnInit() {
    this.exams = this.db.getExams();
    this.students = this.db.getStudents();

    this.auth.getCurrentUser$().subscribe(user => {
      this.isGuardian = user?.roleId === 'role-guardian' || (user?.roleName || '').includes('Guardian');
      this.isStudent = user?.roleId === 'role-student' || (user?.roleName || '').includes('Student');
      if (this.isGuardian || this.isStudent) {
        this.selectedStudentId = 'std-1001';
      }
      this.loadMarksheet();
    });
  }

  loadMarksheet() {
    this.marksheet = this.db.getStudentMarksheet(this.selectedStudentId, this.selectedExamId);
  }

  printReportCard() {
    window.print();
  }
}
