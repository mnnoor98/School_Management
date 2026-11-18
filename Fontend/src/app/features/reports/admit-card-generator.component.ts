import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ExamStoreService } from '../../core/services/stores/exam-store.service';
import { AcademicStoreService } from '../../core/services/stores/academic-store.service';
import { StudentStoreService } from '../../core/services/stores/student-store.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/components/icon.component';
import { Exam, SchoolClass, Section, Student, AdmitCard } from '../../core/models';

@Component({
  selector: 'app-admit-card-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  template: `
    <div class="admit-container">
      <!-- 1. FILTER CONTROLS BAR (NO-PRINT) -->
      <div class="card filter-card mb-4 no-print">
        <div class="card-body">
          <div class="filter-header mb-3">
            <div class="flex items-center gap-2">
              <app-icon name="file-text" [size]="20" class="text-primary"></app-icon>
              <h2 class="text-lg font-bold">Examination Admit Card Generator (প্রবেশপত্র জেনারেটর)</h2>
            </div>
            <p class="text-sm text-muted">
              Select examination term, class, and section to generate official institutional admit cards with exam schedules and instructions.
            </p>
          </div>

          <div class="grid-4-col gap-3">
            <div class="form-group mb-0">
              <label class="form-label font-bold">Examination / Term <span class="text-danger">*</span></label>
              <select class="form-select" [(ngModel)]="selectedExamId" (change)="onExamOrClassChange()">
                <option value="" disabled>-- Select Exam Term --</option>
                <option *ngFor="let ex of exams" [value]="ex.id">{{ ex.name }} ({{ ex.term }})</option>
              </select>
            </div>

            <div class="form-group mb-0">
              <label class="form-label font-bold">Class <span class="text-danger">*</span></label>
              <select class="form-select" [(ngModel)]="selectedClassId" (change)="onClassChange()">
                <option value="ALL">All Classes</option>
                <option *ngFor="let c of classes" [value]="c.id">{{ c.name }}</option>
              </select>
            </div>

            <div class="form-group mb-0">
              <label class="form-label font-bold">Section</label>
              <select class="form-select" [(ngModel)]="selectedSectionId" (change)="onSectionChange()">
                <option value="ALL">All Sections</option>
                <option *ngFor="let s of filteredSections" [value]="s.id">{{ s.name }}</option>
              </select>
            </div>

            <div class="form-group mb-0">
              <label class="form-label font-bold">Student (Optional)</label>
              <select class="form-select" [(ngModel)]="selectedStudentId">
                <option value="ALL">All Students (Batch Print)</option>
                <option *ngFor="let st of filteredStudents" [value]="st.id">
                  Roll {{ st.rollNo }} - {{ st.fullName }}
                </option>
              </select>
            </div>
          </div>

          <div class="filter-actions mt-3 flex justify-between items-center">
            <div class="summary-pill text-xs font-bold text-muted">
              <span *ngIf="admitCards.length > 0">
                Ready to print <strong>{{ admitCards.length }}</strong> Admit Card(s)
              </span>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                class="btn btn-outline"
                (click)="printAdmitCards()"
                [disabled]="admitCards.length === 0"
                title="Print Admit Cards"
              >
                <app-icon name="printer" [size]="16"></app-icon>
                <span>Print Admit Cards ({{ admitCards.length }})</span>
              </button>
              <button
                type="button"
                class="btn btn-primary"
                (click)="generateAdmitCards()"
                [disabled]="isLoading || !selectedExamId"
              >
                <app-icon *ngIf="!isLoading" name="zap" [size]="16"></app-icon>
                <app-icon *ngIf="isLoading" name="loader" [size]="16" class="spin-icon"></app-icon>
                <span>{{ isLoading ? 'Compiling Cards...' : 'Generate Admit Cards' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. EMPTY STATE -->
      <div *ngIf="admitCards.length === 0 && !isLoading" class="card empty-card text-center py-5 no-print">
        <app-icon name="file-text" [size]="48" class="text-muted mb-2"></app-icon>
        <h3 class="font-bold text-slate-700">No Admit Cards Generated Yet</h3>
        <p class="text-sm text-muted">Select an examination and click "Generate Admit Cards" to preview and print.</p>
      </div>

      <!-- 3. ADMIT CARDS RENDER GRID (PRINT & SCREEN) -->
      <div class="admit-cards-wrapper" *ngIf="admitCards.length > 0">
        <div class="admit-card-item" *ngFor="let card of admitCards">
          <!-- CARD BORDER FRAME -->
          <div class="ac-frame">
            <!-- 3.1 INSTITUTIONAL HEADER -->
            <div class="ac-header">
              <div class="ac-logo">
                <app-icon name="award" [size]="44" class="text-primary"></app-icon>
              </div>
              <div class="ac-school-meta">
                <h1 class="ac-school-name">{{ card.schoolName }}</h1>
                <p class="ac-school-sub">{{ card.schoolAddress }} • Campus: {{ card.campusName }}</p>
                <div class="ac-title-badge">
                  OFFICIAL EXAMINATION ADMIT CARD (প্রবেশপত্র)
                </div>
                <div class="ac-exam-term">
                  <strong>{{ card.examName }}</strong> ({{ card.term }}) • Academic Session: {{ card.academicYear }}
                </div>
              </div>
              <div class="ac-photo-box">
                <img [src]="card.avatar || 'assets/default-avatar.png'" (error)="onPhotoError($event)" alt="Candidate Photo" class="ac-photo" />
                <span class="ac-photo-tag">Photo</span>
              </div>
            </div>

            <!-- 3.2 CANDIDATE PROFILE GRID -->
            <div class="ac-student-grid">
              <div class="ac-grid-cell">
                <span class="ac-lbl">Student Name:</span>
                <strong class="ac-val">{{ card.fullName }}</strong>
                <span *ngIf="card.banglaName" class="ac-bangla-name">({{ card.banglaName }})</span>
              </div>
              <div class="ac-grid-cell">
                <span class="ac-lbl">Class / Grade:</span>
                <strong class="ac-val text-primary">{{ card.className }}</strong>
              </div>
              <div class="ac-grid-cell">
                <span class="ac-lbl">Section & Shift:</span>
                <strong class="ac-val">{{ card.sectionName }} ({{ card.shift || 'Morning' }})</strong>
              </div>
              <div class="ac-grid-cell">
                <span class="ac-lbl">Class Roll No:</span>
                <strong class="ac-val font-mono text-emerald">#{{ card.rollNo }}</strong>
              </div>
              <div class="ac-grid-cell">
                <span class="ac-lbl">Admission / Student ID:</span>
                <strong class="ac-val font-mono">{{ card.admissionNo }}</strong>
              </div>
              <div class="ac-grid-cell">
                <span class="ac-lbl">Father's Name:</span>
                <span class="ac-val">{{ card.fatherName || 'Guardian' }}</span>
              </div>
            </div>

            <!-- 3.3 EXAMINATION SCHEDULE TABLE -->
            <div class="ac-schedule-section">
              <div class="ac-section-title">
                <span>Examination Schedule & Timetable</span>
                <span class="ac-room-pill">Venue: Respective Campus Classrooms</span>
              </div>
              <table class="ac-table">
                <thead>
                  <tr>
                    <th style="width: 15%;">Subject Code</th>
                    <th>Subject Title</th>
                    <th style="width: 18%;">Exam Date</th>
                    <th style="width: 14%;">Day</th>
                    <th style="width: 20%;">Time Slot</th>
                    <th style="width: 15%; text-align: center;">Room No</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let s of card.schedules">
                    <td class="font-mono font-bold">{{ s.subjectCode }}</td>
                    <td><strong>{{ s.subjectName }}</strong></td>
                    <td>{{ s.examDate }}</td>
                    <td>{{ s.day }}</td>
                    <td class="font-mono">{{ s.timeSlot }}</td>
                    <td class="text-center font-bold text-primary">{{ s.roomNo }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 3.4 RULES & INSTRUCTIONS -->
            <div class="ac-rules-section">
              <div class="ac-rules-title">General Candidate Instructions / পরীক্ষার্থীদের জন্য বিশেষ নির্দেশনাবলী:</div>
              <ol class="ac-rules-list">
                <li *ngFor="let inst of card.instructions">{{ inst }}</li>
              </ol>
            </div>

            <!-- 3.5 SIGNATURE BLOCKS -->
            <div class="ac-signatures">
              <div class="ac-sig-box">
                <div class="ac-sig-line"></div>
                <span>Candidate's Signature</span>
              </div>
              <div class="ac-sig-box">
                <div class="ac-sig-line"></div>
                <span>Class Teacher / Invigilator</span>
              </div>
              <div class="ac-sig-box">
                <div class="ac-sig-seal">OFFICIAL SEAL</div>
                <div class="ac-sig-line"></div>
                <span>Controller of Exams / Principal</span>
              </div>
            </div>

            <div class="ac-footer-bar">
              <span>Security Token: SIA-VERIFIED-{{ card.admissionNo }} • Generated: {{ card.generatedAt }}</span>
              <span>This admit card is electronically generated and digitally authenticated.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mb-0 { margin-bottom: 0 !important; }
    .mb-2 { margin-bottom: 8px; }
    .mb-3 { margin-bottom: 14px; }
    .mb-4 { margin-bottom: 20px; }
    .mt-3 { margin-top: 14px; }
    .text-primary { color: #4f46e5; }
    .text-emerald { color: #059669; }
    .text-danger { color: #ef4444; }
    .text-muted { color: #64748b; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 700; }
    .font-mono { font-family: monospace; }
    .grid-4-col { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 900px) {
      .grid-4-col { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 600px) {
      .grid-4-col { grid-template-columns: 1fr; }
    }

    .admit-container { padding: 4px; }
    .filter-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 18px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .empty-card {
      background: #ffffff;
      border: 2px dashed #cbd5e1;
      border-radius: 10px;
    }

    /* Admit Cards List */
    .admit-cards-wrapper {
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .admit-card-item {
      background: #ffffff;
      page-break-after: always;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
    }

    .ac-frame {
      border: 3px double #0f172a;
      padding: 24px;
      position: relative;
      background: #ffffff;
    }

    /* Header */
    .ac-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 14px;
      margin-bottom: 14px;
      gap: 16px;
    }
    .ac-logo { flex-shrink: 0; }
    .ac-school-meta {
      flex: 1;
      text-align: center;
    }
    .ac-school-name {
      font-size: 1.5rem;
      font-weight: 900;
      color: #0f172a;
      margin: 0;
      letter-spacing: 0.02em;
    }
    .ac-school-sub {
      font-size: 0.8rem;
      color: #475569;
      margin: 2px 0 6px;
    }
    .ac-title-badge {
      display: inline-block;
      background: #0f172a;
      color: #ffffff;
      font-weight: 800;
      font-size: 0.85rem;
      padding: 3px 14px;
      border-radius: 4px;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .ac-exam-term {
      font-size: 0.85rem;
      color: #334155;
    }
    .ac-photo-box {
      width: 90px;
      height: 105px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
    }
    .ac-photo {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .ac-photo-tag {
      font-size: 0.65rem;
      color: #94a3b8;
    }

    /* Student Grid */
    .ac-student-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 10px 14px;
      border-radius: 6px;
      margin-bottom: 16px;
      font-size: 0.82rem;
    }
    .ac-grid-cell { display: flex; flex-direction: column; }
    .ac-lbl { color: #64748b; font-size: 0.72rem; text-transform: uppercase; font-weight: 700; }
    .ac-val { color: #0f172a; }
    .ac-bangla-name { font-size: 0.78rem; color: #475569; }

    /* Schedule Table */
    .ac-schedule-section { margin-bottom: 16px; }
    .ac-section-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 6px;
    }
    .ac-room-pill {
      font-size: 0.7rem;
      background: #e0e7ff;
      color: #3730a3;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
    }
    .ac-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.78rem;
    }
    .ac-table th, .ac-table td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
    }
    .ac-table th {
      background: #f1f5f9;
      font-weight: 700;
      color: #1e293b;
      text-align: left;
    }

    /* Rules */
    .ac-rules-section {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-radius: 6px;
      padding: 8px 14px;
      margin-bottom: 20px;
      font-size: 0.72rem;
      color: #78350f;
    }
    .ac-rules-title { font-weight: 800; margin-bottom: 4px; }
    .ac-rules-list { margin: 0; padding-left: 18px; }
    .ac-rules-list li { margin-bottom: 2px; }

    /* Signatures */
    .ac-signatures {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 36px;
      margin-bottom: 12px;
      padding: 0 16px;
    }
    .ac-sig-box {
      width: 170px;
      text-align: center;
      position: relative;
    }
    .ac-sig-line {
      border-top: 1px solid #0f172a;
      margin-bottom: 4px;
    }
    .ac-sig-box span {
      font-size: 0.72rem;
      font-weight: 700;
      color: #1e293b;
    }
    .ac-sig-seal {
      font-size: 0.65rem;
      color: #94a3b8;
      border: 1px dashed #cbd5e1;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 6px;
    }

    .ac-footer-bar {
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      display: flex;
      justify-content: space-between;
      font-size: 0.65rem;
      color: #94a3b8;
    }

    .spin-icon { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    /* Print Rules */
    @media print {
      .no-print { display: none !important; }
      body { background: #ffffff !important; }
      .admit-container { padding: 0 !important; }
      .admit-card-item {
        box-shadow: none !important;
        margin-bottom: 0 !important;
        page-break-after: always;
        height: 100%;
      }
      .ac-frame {
        border: 2px solid #000000 !important;
        padding: 18px !important;
      }
    }
  `]
})
export class AdmitCardGeneratorComponent implements OnInit {
  private examStore = inject(ExamStoreService);
  private academicStore = inject(AcademicStoreService);
  private studentStore = inject(StudentStoreService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  exams: Exam[] = [];
  classes: SchoolClass[] = [];
  sections: Section[] = [];
  students: Student[] = [];

  selectedExamId = '';
  selectedClassId = 'ALL';
  selectedSectionId = 'ALL';
  selectedStudentId = 'ALL';

  isLoading = false;
  admitCards: AdmitCard[] = [];

  async ngOnInit() {
    this.isLoading = true;
    try {
      await Promise.all([
        this.examStore.loadExams(),
        this.academicStore.loadClasses(),
        this.academicStore.loadSections(),
        this.studentStore.loadStudents()
      ]);

      this.exams = this.examStore.getExams();
      this.classes = this.academicStore.getClasses();
      this.sections = this.academicStore.getSections();
      this.students = this.studentStore.getStudents();

      if (this.exams.length > 0) {
        this.selectedExamId = this.exams[0].id;
      }
    } catch (e) {
      console.error('Init error:', e);
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  get filteredSections(): Section[] {
    if (!this.selectedClassId || this.selectedClassId === 'ALL') {
      return this.sections;
    }
    return this.sections.filter(s => s.classId === this.selectedClassId);
  }

  get filteredStudents(): Student[] {
    return this.students.filter(st => {
      const matchClass = this.selectedClassId === 'ALL' || st.classId === this.selectedClassId;
      const matchSection = this.selectedSectionId === 'ALL' || st.sectionId === this.selectedSectionId;
      return matchClass && matchSection;
    });
  }

  onClassChange() {
    this.selectedSectionId = 'ALL';
    this.selectedStudentId = 'ALL';
  }

  onSectionChange() {
    this.selectedStudentId = 'ALL';
  }

  onExamOrClassChange() {
    this.cdr.markForCheck();
  }

  async generateAdmitCards() {
    if (!this.selectedExamId) {
      this.toast.warning('Exam Required', 'Please select an examination term.');
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    try {
      const classId = this.selectedClassId === 'ALL' ? undefined : this.selectedClassId;
      const sectionId = this.selectedSectionId === 'ALL' ? undefined : this.selectedSectionId;
      const studentId = this.selectedStudentId === 'ALL' ? undefined : this.selectedStudentId;

      this.admitCards = await this.examStore.loadAdmitCards(this.selectedExamId, classId, sectionId, studentId);

      if (this.admitCards.length === 0) {
        this.toast.info('No Records', 'No active students found matching the selected class and section criteria.');
      } else {
        this.toast.success('Admit Cards Compiled', `Generated ${this.admitCards.length} official admit card(s).`);
      }
    } catch (e: any) {
      console.error('Admit card generation error:', e);
      this.toast.error('Generation Failed', e?.message || 'Could not compile admit cards.');
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  printAdmitCards() {
    window.print();
  }

  onPhotoError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img) img.src = 'assets/default-avatar.png';
  }
}
