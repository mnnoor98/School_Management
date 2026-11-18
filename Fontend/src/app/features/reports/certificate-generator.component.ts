import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StudentStoreService } from '../../core/services/stores/student-store.service';
import { AcademicStoreService } from '../../core/services/stores/academic-store.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/components/icon.component';
import { Student, SchoolClass, CertificateType, CertificateDossier, GenerateCertificateRequest } from '../../core/models';

@Component({
  selector: 'app-certificate-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  template: `
    <div class="cert-container">
      <!-- 1. CONFIGURATION FORM & SEARCH BAR (NO-PRINT) -->
      <div class="card cert-config-card mb-4 no-print">
        <div class="card-body">
          <div class="config-header mb-3">
            <div class="flex items-center gap-2">
              <app-icon name="award" [size]="20" class="text-primary"></app-icon>
              <h2 class="text-lg font-bold">Institutional Certificate & Testimonial Suite (সনদপত্র ও প্রশংসাপত্র)</h2>
            </div>
            <p class="text-sm text-muted">
              Issue verified institutional Transfer Certificates (TC), Testimonials, Bonafide Enrolment letters, and Academic Merit awards.
            </p>
          </div>

          <div class="grid-3-col gap-3 mb-3">
            <!-- 1. CERTIFICATE TYPE -->
            <div class="form-group mb-0">
              <label class="form-label font-bold">Certificate Type <span class="text-danger">*</span></label>
              <select class="form-select" [(ngModel)]="selectedTypeCode" (change)="onTypeChange()">
                <option *ngFor="let t of certificateTypes" [value]="t.code">
                  {{ t.titleEnglish }}
                </option>
              </select>
            </div>

            <!-- 2. CLASS FILTER -->
            <div class="form-group mb-0">
              <label class="form-label font-bold">Class / Grade</label>
              <select class="form-select" [(ngModel)]="selectedClassId" (change)="onClassChange()">
                <option value="ALL">All Classes ({{ students.length }} Students)</option>
                <option *ngFor="let c of classes" [value]="c.id">{{ c.name }}</option>
              </select>
            </div>

            <!-- 3. STUDENT SELECTOR -->
            <div class="form-group mb-0">
              <label class="form-label font-bold">Target Student <span class="text-danger">*</span></label>
              <select class="form-select" [(ngModel)]="selectedStudentId" (change)="onStudentSelect()">
                <option value="" disabled>-- Select Candidate Student --</option>
                <option *ngFor="let st of filteredStudents" [value]="st.id">
                  Roll {{ st.rollNo }} - {{ st.fullName }} ({{ st.className }})
                </option>
              </select>
            </div>
          </div>

          <!-- DYNAMIC CUSTOM PARAMETERS -->
          <div class="grid-3-col gap-3 mb-3">
            <div class="form-group mb-0">
              <label class="form-label font-bold">Issue Date</label>
              <input type="date" class="form-control" [(ngModel)]="issueDate" />
            </div>

            <div class="form-group mb-0">
              <label class="form-label font-bold">Moral Conduct & Character</label>
              <select class="form-select" [(ngModel)]="conduct">
                <option value="Exemplary">Exemplary (অনুকরণীয় ও চমৎকার)</option>
                <option value="Very Good">Very Good (খুব ভালো)</option>
                <option value="Satisfactory">Satisfactory (সন্তোষজনক)</option>
              </select>
            </div>

            <div class="form-group mb-0" *ngIf="selectedTypeCode === 'TransferCertificate'">
              <label class="form-label font-bold">Reason for Leaving (ছাড়পত্রের কারণ)</label>
              <input type="text" class="form-control" [(ngModel)]="reasonForLeaving" placeholder="e.g. Guardian's Job Transfer" />
            </div>

            <div class="form-group mb-0" *ngIf="selectedTypeCode === 'Testimonial' || selectedTypeCode === 'MeritCertificate'">
              <label class="form-label font-bold">Examination Passed / Appeared</label>
              <input type="text" class="form-control" [(ngModel)]="examPassed" placeholder="e.g. Annual Academic Assessment" />
            </div>

            <div class="form-group mb-0" *ngIf="selectedTypeCode === 'Testimonial' || selectedTypeCode === 'MeritCertificate'">
              <label class="form-label font-bold">GPA or Score Achieved</label>
              <input type="text" class="form-control" [(ngModel)]="gpaOrMarks" placeholder="e.g. 5.00 (Golden A+)" />
            </div>
          </div>

          <div class="form-group mb-3">
            <label class="form-label">Special Institutional Remarks / Note (ঐচ্ছিক মন্তব্য)</label>
            <input type="text" class="form-control" [(ngModel)]="customRemarks" placeholder="Optional notes to be appended to the official dossier..." />
          </div>

          <div class="flex justify-between items-center pt-2 border-top">
            <div class="text-xs text-muted">
              <span *ngIf="currentDossier">
                Active Certificate Serial: <strong class="font-mono text-primary">{{ currentDossier.certificateNo }}</strong>
              </span>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                class="btn btn-outline"
                (click)="printCertificate()"
                [disabled]="!currentDossier"
                title="Print Official Certificate"
              >
                <app-icon name="printer" [size]="16"></app-icon>
                <span>Print Official Certificate</span>
              </button>
              <button
                type="button"
                class="btn btn-primary"
                (click)="generateCertificate()"
                [disabled]="isGenerating || !selectedStudentId"
              >
                <app-icon *ngIf="!isGenerating" name="award" [size]="16"></app-icon>
                <app-icon *ngIf="isGenerating" name="loader" [size]="16" class="spin-icon"></app-icon>
                <span>{{ isGenerating ? 'Authenticating & Generating...' : 'Generate Certificate' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. EMPTY STATE -->
      <div *ngIf="!currentDossier && !isGenerating" class="card empty-card text-center py-5 no-print">
        <app-icon name="award" [size]="48" class="text-muted mb-2"></app-icon>
        <h3 class="font-bold text-slate-700">No Certificate Generated</h3>
        <p class="text-sm text-muted">Select a student and certificate type above, then click "Generate Certificate" to view the official document.</p>
      </div>

      <!-- 3. OFFICIAL CERTIFICATE PARCHMENT (PRINT & SCREEN) -->
      <div class="cert-parchment-wrapper" *ngIf="currentDossier">
        <div class="cert-border-outer">
          <div class="cert-border-inner">
            <!-- 3.1 ORNAMENTAL CORNERS -->
            <div class="corner corner-tl"></div>
            <div class="corner corner-tr"></div>
            <div class="corner corner-bl"></div>
            <div class="corner corner-br"></div>

            <!-- 3.2 INSTITUTIONAL CREST & LETTERHEAD -->
            <div class="cert-header">
              <div class="cert-crest">
                <app-icon name="award" [size]="52" class="text-amber-700"></app-icon>
              </div>
              <div class="cert-school-meta">
                <div class="cert-gov-line">GOVERNMENT APPROVED INSTITUTIONAL EDUCATION BOARD RECOGNIZED</div>
                <h1 class="cert-school-name">{{ currentDossier.schoolName }}</h1>
                <p class="cert-school-addr">
                  {{ currentDossier.schoolAddress }} • Campus: {{ currentDossier.campusName }}
                </p>
                <p class="cert-board-meta">
                  EIIN: <strong>{{ currentDossier.eiinNo }}</strong> • Affiliated with: {{ currentDossier.affiliation }}
                </p>
              </div>
              <div class="cert-photo-slot" *ngIf="currentDossier.certificateType !== 'MeritCertificate'">
                <img [src]="currentDossier.avatar || 'assets/default-avatar.png'" (error)="onPhotoError($event)" alt="Student Photo" class="cert-photo" />
              </div>
            </div>

            <!-- 3.3 CERTIFICATE TITLE RIBBON -->
            <div class="cert-title-container">
              <div class="cert-title-ribbon">
                <span class="cert-main-title">{{ currentDossier.typeTitleEnglish }}</span>
                <span class="cert-bangla-title">{{ currentDossier.typeTitleBangla }}</span>
              </div>
            </div>

            <!-- 3.4 SERIAL & ISSUE DATE STRIP -->
            <div class="cert-serial-strip">
              <div>Serial / Ref No: <strong class="font-mono text-primary">{{ currentDossier.certificateNo }}</strong></div>
              <div>Date of Issue: <strong>{{ currentDossier.issueDate }}</strong></div>
            </div>

            <!-- 3.5 OFFICIAL TEXT PARAGRAPHS -->
            <div class="cert-body-content">
              <p class="cert-paragraph cert-p-eng">
                {{ currentDossier.paragraphEnglish }}
              </p>

              <div class="cert-divider"></div>

              <p class="cert-paragraph cert-p-bng">
                {{ currentDossier.paragraphBangla }}
              </p>

              <div *ngIf="currentDossier.customRemarks" class="cert-special-remarks">
                <strong>Institutional Note:</strong> {{ currentDossier.customRemarks }}
              </div>
            </div>

            <!-- 3.6 OFFICIAL SIGNATURES & EMBOSSED SEAL -->
            <div class="cert-signatures">
              <div class="cert-sig-block">
                <div class="cert-sig-line"></div>
                <div class="cert-sig-title">{{ currentDossier.signatoryTeacherTitle }}</div>
                <div class="cert-sig-sub">Academic & Records Division</div>
              </div>

              <div class="cert-seal-block">
                <div class="cert-seal-circle">
                  <span>INSTITUTIONAL</span>
                  <strong>SEAL</strong>
                  <span>OFFICIAL</span>
                </div>
              </div>

              <div class="cert-sig-block">
                <div class="cert-sig-line"></div>
                <div class="cert-sig-title">{{ currentDossier.signatoryHeadTitle }}</div>
                <div class="cert-sig-sub">Head of Institution</div>
              </div>
            </div>

            <!-- 3.7 SECURITY VERIFICATION FOOTER -->
            <div class="cert-footer-security">
              <div class="cert-sec-left">
                <span>Security Verification Hash: <strong>{{ currentDossier.securityVerificationCode }}</strong></span>
                <span>• Student ID: {{ currentDossier.admissionNo }}</span>
              </div>
              <div class="cert-sec-right">
                <span>Any alteration or erasure invalidates this certificate. Issued via Digital ERP.</span>
              </div>
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
    .mb-4 { margin-bottom: 24px; }
    .pt-2 { padding-top: 10px; }
    .border-top { border-top: 1px solid #e2e8f0; }
    .text-primary { color: #4f46e5; }
    .text-muted { color: #64748b; }
    .text-danger { color: #ef4444; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 700; }
    .font-mono { font-family: monospace; }
    .grid-3-col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
    @media (max-width: 900px) {
      .grid-3-col { grid-template-columns: 1fr; }
    }

    .cert-container { padding: 4px; }
    .cert-config-card {
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

    /* Certificate Parchment */
    .cert-parchment-wrapper {
      background: #ffffff;
      padding: 10px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      max-width: 950px;
      margin: 0 auto;
    }

    .cert-border-outer {
      border: 8px double #92400e;
      padding: 6px;
      background: #fffdfa;
    }

    .cert-border-inner {
      border: 2px solid #b45309;
      padding: 30px;
      position: relative;
      background: radial-gradient(circle, #ffffff 60%, #fffbf0 100%);
    }

    /* Ornamental Corners */
    .corner {
      position: absolute;
      width: 24px;
      height: 24px;
      border-color: #92400e;
      border-style: solid;
    }
    .corner-tl { top: 6px; left: 6px; border-width: 3px 0 0 3px; }
    .corner-tr { top: 6px; right: 6px; border-width: 3px 3px 0 0; }
    .corner-bl { bottom: 6px; left: 6px; border-width: 0 0 3px 3px; }
    .corner-br { bottom: 6px; right: 6px; border-width: 0 3px 3px 0; }

    /* Header */
    .cert-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 20px;
    }
    .cert-crest { flex-shrink: 0; }
    .cert-school-meta {
      flex: 1;
      text-align: center;
    }
    .cert-gov-line {
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.15em;
      color: #92400e;
      margin-bottom: 4px;
    }
    .cert-school-name {
      font-size: 1.85rem;
      font-weight: 900;
      color: #0f172a;
      margin: 0;
      font-family: serif;
      letter-spacing: 0.02em;
    }
    .cert-school-addr {
      font-size: 0.85rem;
      color: #475569;
      margin: 2px 0;
    }
    .cert-board-meta {
      font-size: 0.78rem;
      color: #64748b;
      margin: 0;
    }
    .cert-photo-slot {
      width: 85px;
      height: 105px;
      border: 1px solid #b45309;
      padding: 3px;
      background: #ffffff;
      flex-shrink: 0;
    }
    .cert-photo {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Ribbon Title */
    .cert-title-container {
      text-align: center;
      margin-bottom: 20px;
    }
    .cert-title-ribbon {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      background: linear-gradient(135deg, #78350f, #92400e);
      color: #ffffff;
      padding: 8px 36px;
      border-radius: 4px;
      box-shadow: 0 2px 6px rgba(120, 53, 15, 0.3);
    }
    .cert-main-title {
      font-size: 1.15rem;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-family: serif;
    }
    .cert-bangla-title {
      font-size: 0.85rem;
      font-weight: 600;
      opacity: 0.95;
    }

    /* Serial Strip */
    .cert-serial-strip {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #fed7aa;
      border-bottom: 1px solid #fed7aa;
      padding: 6px 12px;
      font-size: 0.8rem;
      color: #451a03;
      margin-bottom: 24px;
      background: #fffaf0;
    }

    /* Body Paragraphs */
    .cert-body-content {
      padding: 0 16px;
      margin-bottom: 36px;
    }
    .cert-paragraph {
      font-size: 0.98rem;
      line-height: 1.8;
      color: #1e293b;
      text-align: justify;
      margin-bottom: 16px;
    }
    .cert-p-eng {
      font-family: serif;
    }
    .cert-p-bng {
      font-size: 0.95rem;
      color: #334155;
    }
    .cert-divider {
      border-top: 1px dashed #cbd5e1;
      margin: 16px 0;
    }
    .cert-special-remarks {
      background: #f8fafc;
      border-left: 3px solid #92400e;
      padding: 8px 14px;
      font-size: 0.82rem;
      color: #475569;
      margin-top: 12px;
    }

    /* Signatures */
    .cert-signatures {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 0 24px;
      margin-top: 48px;
      margin-bottom: 24px;
    }
    .cert-sig-block {
      width: 200px;
      text-align: center;
    }
    .cert-sig-line {
      border-top: 1px solid #0f172a;
      margin-bottom: 6px;
    }
    .cert-sig-title {
      font-size: 0.82rem;
      font-weight: 800;
      color: #0f172a;
    }
    .cert-sig-sub {
      font-size: 0.72rem;
      color: #64748b;
    }
    .cert-seal-block {
      text-align: center;
    }
    .cert-seal-circle {
      width: 76px;
      height: 76px;
      border: 2px dashed #b45309;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #92400e;
      font-size: 0.65rem;
      letter-spacing: 0.05em;
    }

    /* Footer */
    .cert-footer-security {
      border-top: 1px solid #fed7aa;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      font-size: 0.7rem;
      color: #94a3b8;
    }

    .spin-icon { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    /* Print Styles */
    @media print {
      .no-print { display: none !important; }
      body { background: #ffffff !important; }
      .cert-container { padding: 0 !important; }
      .cert-parchment-wrapper {
        box-shadow: none !important;
        max-width: 100% !important;
        margin: 0 !important;
      }
      .cert-border-outer {
        border: 4px double #000000 !important;
      }
      .cert-border-inner {
        border: 1px solid #000000 !important;
        padding: 20px !important;
      }
    }
  `]
})
export class CertificateGeneratorComponent implements OnInit {
  private studentStore = inject(StudentStoreService);
  private academicStore = inject(AcademicStoreService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  students: Student[] = [];
  classes: SchoolClass[] = [];
  certificateTypes: CertificateType[] = [];

  selectedTypeCode = 'Testimonial';
  selectedClassId = 'ALL';
  selectedStudentId = '';

  issueDate = new Date().toISOString().slice(0, 10);
  conduct = 'Satisfactory';
  reasonForLeaving = "Guardian's Occupational Relocation";
  examPassed = 'Annual Academic Examination';
  gpaOrMarks = '5.00';
  customRemarks = '';

  isGenerating = false;
  currentDossier: CertificateDossier | null = null;

  async ngOnInit() {
    try {
      await Promise.all([
        this.studentStore.loadStudents(),
        this.academicStore.loadClasses()
      ]);

      this.students = this.studentStore.getStudents();
      this.classes = this.academicStore.getClasses();
      this.certificateTypes = await this.studentStore.getCertificateTypes();

      if (this.students.length > 0) {
        this.selectedStudentId = this.students[0].id;
      }
    } catch (e) {
      console.error('Init error in certificate generator:', e);
    } finally {
      this.cdr.markForCheck();
    }
  }

  get filteredStudents(): Student[] {
    if (!this.selectedClassId || this.selectedClassId === 'ALL') {
      return this.students;
    }
    return this.students.filter(s => s.classId === this.selectedClassId);
  }

  onTypeChange() {
    if (this.selectedTypeCode === 'TransferCertificate') {
      this.reasonForLeaving = "Guardian's Occupational Relocation";
    } else if (this.selectedTypeCode === 'MeritCertificate') {
      this.conduct = 'Exemplary';
      this.gpaOrMarks = '5.00 (Golden A+)';
    }
  }

  onClassChange() {
    const list = this.filteredStudents;
    if (list.length > 0) {
      this.selectedStudentId = list[0].id;
    } else {
      this.selectedStudentId = '';
    }
  }

  onStudentSelect() {
    this.currentDossier = null;
  }

  async generateCertificate() {
    if (!this.selectedStudentId) {
      this.toast.warning('Student Required', 'Please select a student.');
      return;
    }

    this.isGenerating = true;
    this.cdr.markForCheck();

    try {
      const req: GenerateCertificateRequest = {
        studentId: this.selectedStudentId,
        certificateType: this.selectedTypeCode,
        issueDate: this.issueDate ? new Date(this.issueDate).toISOString() : undefined,
        conduct: this.conduct,
        reasonForLeaving: this.selectedTypeCode === 'TransferCertificate' ? this.reasonForLeaving : undefined,
        examPassed: this.examPassed,
        gpaOrMarks: this.gpaOrMarks,
        customRemarks: this.customRemarks
      };

      this.currentDossier = await this.studentStore.generateCertificate(req);
      this.toast.success('Certificate Issued', `Generated ${this.currentDossier.typeTitleEnglish} (Ref: ${this.currentDossier.certificateNo}).`);
    } catch (e: any) {
      console.error('Certificate generation error:', e);
      this.toast.error('Generation Failed', e?.message || 'Could not generate certificate.');
    } finally {
      this.isGenerating = false;
      this.cdr.markForCheck();
    }
  }

  printCertificate() {
    window.print();
  }

  onPhotoError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img) img.src = 'assets/default-avatar.png';
  }
}
