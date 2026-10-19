import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MockDbService } from '../../core/services/mock-db.service';
import { ToastService } from '../../core/services/toast.service';
import { Student, SchoolClass, Section } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';
import { BadgeComponent } from '../../shared/components/badge.component';

@Component({
  selector: 'app-admission',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, BadgeComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <app-icon name="user-plus" [size]="26" class="text-primary"></app-icon>
            New Student Admission (Multi-Step Lifecycle)
          </h1>
          <p class="page-subtitle">
            Comprehensive student enrollment wizard: Basic Info ➔ Guardian ➔ Academic Placement ➔ Review.
          </p>
        </div>
      </div>

      <!-- STEP WIZARD PROGRESS BAR -->
      <div class="wizard-steps-track mb-4">
        <div class="wizard-step" [class.active]="step === 1" [class.completed]="step > 1" (click)="goToStep(1)">
          <div class="step-num">1</div>
          <span class="step-title">Basic Info</span>
        </div>
        <div class="wizard-connector" [class.active]="step > 1"></div>

        <div class="wizard-step" [class.active]="step === 2" [class.completed]="step > 2" (click)="goToStep(2)">
          <div class="step-num">2</div>
          <span class="step-title">Guardian Info</span>
        </div>
        <div class="wizard-connector" [class.active]="step > 2"></div>

        <div class="wizard-step" [class.active]="step === 3" [class.completed]="step > 3" (click)="goToStep(3)">
          <div class="step-num">3</div>
          <span class="step-title">Academic Placement</span>
        </div>
        <div class="wizard-connector" [class.active]="step > 3"></div>

        <div class="wizard-step" [class.active]="step === 4" [class.completed]="step > 4" (click)="goToStep(4)">
          <div class="step-num">4</div>
          <span class="step-title">Review & Submit</span>
        </div>
      </div>

      <!-- WIZARD STEP BODIES -->
      <div class="card">
        <div class="card-body">
          <!-- STEP 1: BASIC INFORMATION -->
          <div *ngIf="step === 1" class="wizard-pane">
            <h3 class="pane-heading">Step 1: Student Personal Details</h3>
            
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Full Name (English) <span class="required">*</span></label>
                <input type="text" class="form-control" [(ngModel)]="formData.fullName" placeholder="e.g. Mehedi Hasan" required />
              </div>

              <div class="form-group">
                <label class="form-label">Bangla Name (বাংলা নাম)</label>
                <input type="text" class="form-control" [(ngModel)]="formData.banglaName" placeholder="e.g. মেহেদী হাসান" />
              </div>
            </div>

            <div class="grid-3">
              <div class="form-group">
                <label class="form-label">Date of Birth <span class="required">*</span></label>
                <input type="date" class="form-control" [(ngModel)]="formData.dateOfBirth" required />
              </div>

              <div class="form-group">
                <label class="form-label">Gender <span class="required">*</span></label>
                <select class="form-select" [(ngModel)]="formData.gender">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Blood Group</label>
                <select class="form-select" [(ngModel)]="formData.bloodGroup">
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Contact Phone <span class="required">*</span></label>
                <input type="tel" class="form-control" [(ngModel)]="formData.phone" placeholder="+880 1700-000000" required />
              </div>

              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" class="form-control" [(ngModel)]="formData.email" placeholder="student@school.com" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Present Residential Address</label>
              <textarea rows="2" class="form-control" [(ngModel)]="formData.presentAddress" placeholder="Full street address, city, postcode"></textarea>
            </div>
          </div>

          <!-- STEP 2: GUARDIAN INFORMATION -->
          <div *ngIf="step === 2" class="wizard-pane">
            <h3 class="pane-heading">Step 2: Guardian & Emergency Contacts</h3>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Primary Guardian Name <span class="required">*</span></label>
                <input type="text" class="form-control" [(ngModel)]="formData.guardianName" placeholder="Father / Mother / Legal Guardian" required />
              </div>

              <div class="form-group">
                <label class="form-label">Relationship to Student <span class="required">*</span></label>
                <select class="form-select" [(ngModel)]="formData.guardianRelation">
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Legal Guardian">Legal Guardian</option>
                </select>
              </div>
            </div>

            <div class="grid-3">
              <div class="form-group">
                <label class="form-label">Guardian Mobile Number <span class="required">*</span></label>
                <input type="tel" class="form-control" [(ngModel)]="formData.guardianPhone" placeholder="+880 1800-000000" required />
              </div>

              <div class="form-group">
                <label class="form-label">Occupation</label>
                <input type="text" class="form-control" [(ngModel)]="formData.guardianOccupation" placeholder="e.g. Government Officer, Doctor" />
              </div>

              <div class="form-group">
                <label class="form-label">Monthly Household Income</label>
                <input type="text" class="form-control" [(ngModel)]="formData.guardianIncome" placeholder="e.g. ৳ 80,000 / month" />
              </div>
            </div>
          </div>

          <!-- STEP 3: ACADEMIC PLACEMENT -->
          <div *ngIf="step === 3" class="wizard-pane">
            <h3 class="pane-heading">Step 3: Academic Placement & Enrollment Roll</h3>

            <div class="grid-3">
              <div class="form-group">
                <label class="form-label">Admitted Class <span class="required">*</span></label>
                <select class="form-select" [(ngModel)]="formData.classId" (change)="onClassSelect()">
                  <option *ngFor="let c of classes" [value]="c.id">{{ c.name }}</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Section Allocation <span class="required">*</span></label>
                <select class="form-select" [(ngModel)]="formData.sectionId">
                  <option *ngFor="let s of availableSections" [value]="s.id">{{ s.name }} (Capacity: {{ s.currentStudentCount }}/{{ s.capacity }})</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Roll Number <span class="required">*</span></label>
                <input type="text" class="form-control" [(ngModel)]="formData.rollNo" placeholder="e.g. 05" required />
              </div>
            </div>

            <div class="enrollment-validation-box">
              <app-icon name="shield-check" [size]="20" class="text-primary"></app-icon>
              <div>
                <strong>Active Enrollment Duplicate Guard:</strong>
                <p>The system prevents duplicate active enrollments within the same session.</p>
              </div>
            </div>
          </div>

          <!-- STEP 4: REVIEW & CONFIRMATION -->
          <div *ngIf="step === 4" class="wizard-pane">
            <h3 class="pane-heading">Step 4: Review Application & Submit</h3>

            <div class="review-card">
              <div class="review-grid">
                <div class="review-item">
                  <span class="review-lbl">Student Name:</span>
                  <strong>{{ formData.fullName }} ({{ formData.banglaName }})</strong>
                </div>
                <div class="review-item">
                  <span class="review-lbl">Gender / Blood:</span>
                  <strong>{{ formData.gender }} ({{ formData.bloodGroup }})</strong>
                </div>
                <div class="review-item">
                  <span class="review-lbl">Guardian:</span>
                  <strong>{{ formData.guardianName }} ({{ formData.guardianRelation }}) - {{ formData.guardianPhone }}</strong>
                </div>
                <div class="review-item">
                  <span class="review-lbl">Assigned Class & Section:</span>
                  <strong>{{ getSelectedClassName() }} — {{ getSelectedSectionName() }}</strong>
                </div>
                <div class="review-item">
                  <span class="review-lbl">Roll Number:</span>
                  <strong>Roll {{ formData.rollNo }}</strong>
                </div>
                <div class="review-item">
                  <span class="review-lbl">Initial Status:</span>
                  <app-badge variant="success" label="Active Student"></app-badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card-footer">
          <button type="button" class="btn btn-outline" (click)="prevStep()" [disabled]="step === 1">
            Back
          </button>
          <button type="button" class="btn btn-primary" (click)="nextStep()" *ngIf="step < 4">
            Next Step
          </button>
          <button type="button" class="btn btn-success" (click)="submitAdmission()" *ngIf="step === 4">
            <app-icon name="check" [size]="16"></app-icon>
            Complete Admission & Generate ID
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mb-4 { margin-bottom: 24px; }
    .text-primary { color: #4f46e5; }
    .wizard-steps-track {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      padding: 16px 24px;
      border-radius: 14px;
      border: 1px solid var(--border-color);
    }
    .wizard-step {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
    }
    .step-num {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #f1f5f9;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
    }
    .step-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: #64748b;
    }
    .wizard-step.active .step-num {
      background: #4f46e5;
      color: #ffffff;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
    }
    .wizard-step.active .step-title {
      color: #4f46e5;
      font-weight: 700;
    }
    .wizard-step.completed .step-num {
      background: #10b981;
      color: #ffffff;
    }
    .wizard-connector {
      flex: 1;
      height: 2px;
      background: #e2e8f0;
      margin: 0 16px;
    }
    .wizard-connector.active {
      background: #10b981;
    }
    .pane-heading {
      font-size: 1.15rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #f1f5f9;
    }
    .enrollment-validation-box {
      margin-top: 20px;
      padding: 14px 18px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.85rem;
      color: #166534;
    }
    .review-card {
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 24px;
    }
    .review-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    .review-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .review-lbl {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
    }
  `]
})
export class AdmissionComponent implements OnInit {
  private db = inject(MockDbService);
  private toast = inject(ToastService);
  private router = inject(Router);

  step = 1;
  classes: SchoolClass[] = [];
  sections: Section[] = [];
  availableSections: Section[] = [];

  formData: Partial<Student> = {
    fullName: '',
    banglaName: '',
    dateOfBirth: '2010-05-15',
    gender: 'Male',
    bloodGroup: 'B+',
    phone: '',
    email: '',
    presentAddress: '',
    guardianName: '',
    guardianRelation: 'Father',
    guardianPhone: '',
    guardianOccupation: '',
    guardianIncome: '',
    classId: 'cls-10',
    sectionId: 'sec-10a',
    rollNo: '05'
  };

  ngOnInit() {
    this.classes = this.db.getClasses();
    this.sections = this.db.getSections();
    this.onClassSelect();
  }

  onClassSelect() {
    this.availableSections = this.sections.filter(s => s.classId === this.formData.classId);
    if (this.availableSections.length > 0) {
      this.formData.sectionId = this.availableSections[0].id;
    }
  }

  getSelectedClassName(): string {
    return this.classes.find(c => c.id === this.formData.classId)?.name || '';
  }

  getSelectedSectionName(): string {
    return this.availableSections.find(s => s.id === this.formData.sectionId)?.name || '';
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
      this.step++;
    }
  }

  prevStep() {
    if (this.step > 1) this.step--;
  }

  validateCurrentStep(): boolean {
    if (this.step === 1 && !this.formData.fullName) {
      this.toast.error('Required Field', 'Please provide student full name.');
      return false;
    }
    if (this.step === 2 && !this.formData.guardianName) {
      this.toast.error('Required Field', 'Please provide guardian full name.');
      return false;
    }
    return true;
  }

  submitAdmission() {
    this.formData.className = this.getSelectedClassName();
    this.formData.sectionName = this.getSelectedSectionName();
    const created = this.db.addStudent(this.formData);
    this.toast.success(
      'Admission Completed',
      `Student ${created.fullName} registered with ID ${created.admissionNo}`
    );
    this.router.navigate(['/app/students/list']);
  }
}
