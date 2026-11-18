import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminStoreService } from '../../core/services/stores/admin-store.service';
import { ToastService } from '../../core/services/toast.service';
import { School, Branch, AcademicYear } from '../../core/models';
import { BadgeComponent } from '../../shared/components/badge.component';
import { IconComponent } from '../../shared/components/icon.component';
import { ModalComponent } from '../../shared/components/modal.component';

@Component({
  selector: 'app-school-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeComponent, IconComponent, ModalComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <app-icon name="building" [size]="26" class="text-primary"></app-icon>
            School & Institutional Academic Setup
          </h1>
          <p class="page-subtitle">
            Configure institutional profile, campus branches, and academic session calendar locks directly stored in PostgreSQL.
          </p>
        </div>
        <div class="page-actions">
          <button type="button" class="btn btn-outline" (click)="loadFreshData()" [disabled]="isLoading">
            <app-icon name="refresh-cw" [size]="16"></app-icon>
            <span>Reload Data</span>
          </button>
          <button type="button" class="btn btn-primary" (click)="saveSchoolProfile()" [disabled]="isSavingSchool">
            <app-icon name="check" [size]="16" *ngIf="!isSavingSchool"></app-icon>
            <span>{{ isSavingSchool ? 'Saving to Database...' : 'Save School Profile' }}</span>
          </button>
        </div>
      </div>

      <div class="grid-2">
        <!-- 1. School Profile Form -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <app-icon name="building" [size]="18" class="text-primary"></app-icon>
              <span>Institution Profile & EIIN</span>
            </div>
            <app-badge variant="success" [label]="school.status || 'Active'"></app-badge>
          </div>
          <div class="card-body">
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">School Name <span class="required">*</span></label>
                <input type="text" class="form-control" [(ngModel)]="school.name" placeholder="Official institution name" />
              </div>
              <div class="form-group">
                <label class="form-label">EIIN / Institution Code <span class="required">*</span></label>
                <input type="text" class="form-control" [(ngModel)]="school.code" placeholder="e.g. SCH-01" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Campus Address <span class="required">*</span></label>
              <textarea rows="2" class="form-control" [(ngModel)]="school.address" placeholder="Physical campus location"></textarea>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Contact Phone</label>
                <input type="text" class="form-control" [(ngModel)]="school.contact" placeholder="+880 1700-000000" />
              </div>
              <div class="form-group">
                <label class="form-label">Official Email</label>
                <input type="email" class="form-control" [(ngModel)]="school.email" placeholder="info@school.edu.bd" />
              </div>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Official Portal Website</label>
                <input type="text" class="form-control" [(ngModel)]="school.website" placeholder="https://school.edu.bd" />
              </div>
              <div class="form-group">
                <label class="form-label">Status</label>
                <select class="form-select" [(ngModel)]="school.status">
                  <option value="Active">Active Institution</option>
                  <option value="Maintenance">Under Maintenance</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Campus Branches & Academic Years -->
        <div class="flex flex-col gap-4">
          <!-- Campus Branches -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">
                <app-icon name="layers" [size]="18" class="text-indigo"></app-icon>
                <span>Campus Branches (Multi-Branch Scope)</span>
              </div>
              <button type="button" class="btn btn-sm btn-primary" (click)="openAddBranchModal()">
                <app-icon name="plus" [size]="14"></app-icon>
                <span>Add Branch</span>
              </button>
            </div>
            <div class="card-body p-0">
              <div *ngIf="branches.length === 0" class="empty-state-p">
                No campus branches found. Click 'Add Branch' to add one.
              </div>
              <div *ngFor="let b of branches" class="branch-item">
                <div class="branch-info">
                  <div class="flex items-center gap-2">
                    <strong class="branch-name">{{ b.name }}</strong>
                    <code class="code-tag">{{ b.code }}</code>
                  </div>
                  <p class="text-xs text-muted">{{ b.address }} • Tel: {{ b.phone }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <app-badge [variant]="b.isActive ? 'success' : 'neutral'" [label]="b.isActive ? 'Active' : 'Inactive'"></app-badge>
                  <button type="button" class="btn-icon" title="Edit Branch" (click)="openEditBranchModal(b)">
                    <app-icon name="edit" [size]="14"></app-icon>
                  </button>
                  <button type="button" class="btn-icon" [title]="b.isActive ? 'Deactivate Branch' : 'Activate Branch'" (click)="toggleBranchStatus(b)">
                    <app-icon [name]="b.isActive ? 'slash' : 'check'" [size]="14"></app-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Academic Years -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">
                <app-icon name="calendar-clock" [size]="18" class="text-emerald"></app-icon>
                <span>Academic Sessions & Lock Status</span>
              </div>
              <button type="button" class="btn btn-sm btn-primary" (click)="openAddYearModal()">
                <app-icon name="plus" [size]="14"></app-icon>
                <span>New Session</span>
              </button>
            </div>
            <div class="card-body p-0">
              <div *ngIf="academicYears.length === 0" class="empty-state-p">
                No academic sessions found. Click 'New Session' to add one.
              </div>
              <div *ngFor="let ay of academicYears" class="session-item">
                <div class="session-info">
                  <strong>{{ ay.name }}</strong>
                  <p class="text-xs text-muted">
                    {{ formatDate(ay.startDate) }} to {{ formatDate(ay.endDate) }}
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <app-badge *ngIf="ay.isCurrent" variant="success" label="Current Session"></app-badge>
                  <app-badge *ngIf="ay.isLocked" variant="danger" label="Locked / Archived"></app-badge>
                  <app-badge *ngIf="!ay.isLocked && !ay.isCurrent" variant="neutral" label="Unlocked"></app-badge>

                  <button
                    type="button"
                    class="btn btn-xs btn-outline"
                    *ngIf="!ay.isCurrent"
                    (click)="setCurrentYear(ay)"
                    title="Set as Current Session"
                  >
                    Make Current
                  </button>
                  <button
                    type="button"
                    class="btn btn-xs"
                    [class.btn-outline]="!ay.isLocked"
                    [class.btn-danger]="ay.isLocked"
                    (click)="toggleYearLock(ay)"
                    [title]="ay.isLocked ? 'Unlock Session' : 'Lock & Archive Session'"
                  >
                    <app-icon [name]="ay.isLocked ? 'lock' : 'unlock'" [size]="12"></app-icon>
                    <span>{{ ay.isLocked ? 'Unlock' : 'Lock' }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: ADD / EDIT BRANCH -->
    <app-modal
      [isOpen]="isBranchModalOpen"
      [title]="isEditingBranch ? 'Edit Campus Branch' : 'Add New Campus Branch'"
      subtitle="Configure branch identification, code, address, and assigned principal."
      [maxWidth]="580"
      (closed)="closeBranchModal()"
    >
      <div body class="modal-form">
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Branch Code <span class="required">*</span></label>
            <input type="text" class="form-control" [(ngModel)]="branchForm.code" placeholder="e.g. BR-03" />
          </div>
          <div class="form-group">
            <label class="form-label">Branch Name <span class="required">*</span></label>
            <input type="text" class="form-control" [(ngModel)]="branchForm.name" placeholder="e.g. Dhanmondi Campus" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Campus Address <span class="required">*</span></label>
          <input type="text" class="form-control" [(ngModel)]="branchForm.address" placeholder="Road, area, city" />
        </div>
        <div class="form-group">
          <label class="form-label">Contact Phone</label>
          <input type="text" class="form-control" [(ngModel)]="branchForm.phone" placeholder="+880 1700-000000" />
        </div>

        <!-- Campus Principal / Head Teacher creation -->
        <div *ngIf="!isEditingBranch" class="principal-box">
          <div class="principal-box-header">
            <app-icon name="user-check" [size]="16" class="text-primary"></app-icon>
            <span class="font-semibold text-sm">Campus Principal / Head Teacher (Optional)</span>
          </div>
          <p class="text-xs text-muted">Create the lead administrator account strictly locked to this new campus.</p>
          
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Principal Full Name</label>
              <input type="text" class="form-control" [(ngModel)]="branchForm.principalFullName" placeholder="e.g. Dr. Rafiqul Islam" />
            </div>
            <div class="form-group">
              <label class="form-label">Username</label>
              <input type="text" class="form-control" [(ngModel)]="branchForm.principalUsername" placeholder="e.g. principal_dhanmondi" />
            </div>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" [(ngModel)]="branchForm.principalEmail" placeholder="principal@campus.edu.bd" />
            </div>
            <div class="form-group">
              <label class="form-label">Initial Password</label>
              <input type="text" class="form-control" [(ngModel)]="branchForm.principalPassword" placeholder="Default: principal123" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Principal Phone</label>
            <input type="text" class="form-control" [(ngModel)]="branchForm.principalPhone" placeholder="+880 1700-000000" />
          </div>
        </div>
      </div>

      <div footer class="flex justify-end gap-2">
        <button type="button" class="btn btn-outline" (click)="closeBranchModal()">Cancel</button>
        <button type="button" class="btn btn-primary" (click)="saveBranch()" [disabled]="isSubmittingBranch">
          <span>{{ isSubmittingBranch ? 'Saving...' : 'Save Branch' }}</span>
        </button>
      </div>
    </app-modal>

    <!-- MODAL: ADD ACADEMIC SESSION -->
    <app-modal
      [isOpen]="isYearModalOpen"
      title="Add Academic Session"
      subtitle="Create a new academic calendar year session with start and end bounds."
      [maxWidth]="500"
      (closed)="closeYearModal()"
    >
      <div body class="modal-form">
        <div class="form-group">
          <label class="form-label">Session Name <span class="required">*</span></label>
          <input type="text" class="form-control" [(ngModel)]="yearForm.name" placeholder="e.g. 2027 - 2028 Academic Session" />
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Start Date <span class="required">*</span></label>
            <input type="date" class="form-control" [(ngModel)]="yearForm.startDate" />
          </div>
          <div class="form-group">
            <label class="form-label">End Date <span class="required">*</span></label>
            <input type="date" class="form-control" [(ngModel)]="yearForm.endDate" />
          </div>
        </div>
        <div class="form-group">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" [(ngModel)]="yearForm.isCurrent" />
            <span class="text-sm font-semibold">Set as Current Active Session immediately</span>
          </label>
        </div>
      </div>

      <div footer class="flex justify-end gap-2">
        <button type="button" class="btn btn-outline" (click)="closeYearModal()">Cancel</button>
        <button type="button" class="btn btn-primary" (click)="saveAcademicYear()" [disabled]="isSubmittingYear">
          <span>{{ isSubmittingYear ? 'Creating...' : 'Create Session' }}</span>
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .mb-4 { margin-bottom: 24px; }
    .text-primary { color: #4f46e5; }
    .text-indigo { color: #6366f1; }
    .text-emerald { color: #10b981; }
    .text-xs { font-size: 0.75rem; }
    .text-sm { font-size: 0.875rem; }
    .text-muted { color: #64748b; }
    .font-semibold { font-weight: 600; }
    .cursor-pointer { cursor: pointer; }
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .items-center { align-items: center; }
    .justify-end { justify-content: flex-end; }
    .gap-2 { gap: 8px; }
    .gap-4 { gap: 16px; }

    .branch-item, .session-item {
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #f1f5f9;
      transition: background 0.15s;
    }
    .branch-item:hover, .session-item:hover {
      background: #f8fafc;
    }
    .branch-item:last-child, .session-item:last-child {
      border-bottom: none;
    }
    .branch-name {
      font-size: 0.9rem;
      color: #0f172a;
    }
    .code-tag {
      font-size: 0.75rem;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
      color: #4f46e5;
    }
    .empty-state-p {
      padding: 24px;
      text-align: center;
      color: #94a3b8;
      font-size: 0.85rem;
    }
    .btn-icon {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      color: #475569;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-icon:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .btn-xs {
      padding: 3px 8px;
      font-size: 0.725rem;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .btn-danger {
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fca5a5;
    }
    .btn-danger:hover {
      background: #fecaca;
    }
    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .principal-box {
      margin-top: 4px;
      padding: 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .principal-box-header {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #1e293b;
    }
  `]
})
export class SchoolSetupComponent implements OnInit {
  private db = inject(AdminStoreService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  school: School = this.db.getSchool();
  branches: Branch[] = [];
  academicYears: AcademicYear[] = [];

  isLoading = false;
  isSavingSchool = false;

  // Branch Modal
  isBranchModalOpen = false;
  isEditingBranch = false;
  isSubmittingBranch = false;
  editingBranchId = '';
  branchForm = {
    code: '',
    name: '',
    address: '',
    phone: '',
    principalUsername: '',
    principalFullName: '',
    principalEmail: '',
    principalPassword: 'principal123',
    principalPhone: ''
  };

  // Academic Year Modal
  isYearModalOpen = false;
  isSubmittingYear = false;
  yearForm = {
    name: '',
    startDate: '2027-01-01',
    endDate: '2027-12-31',
    isCurrent: false
  };

  ngOnInit() {
    this.db.getSchool$().subscribe(s => this.school = { ...s });
    this.db.getBranches$().subscribe(b => this.branches = b);
    this.db.getAcademicYears$().subscribe(ay => this.academicYears = ay);

    this.loadFreshData();
  }

  async loadFreshData() {
    this.isLoading = true;
    try {
      await this.db.refreshAllFromBackend();
      this.toast.info('Data Refreshed', 'Loaded latest school configuration from database.');
    } catch {
      // Handled silently
    } finally {
      this.isLoading = false;
    }
  }

  saveSchoolProfile() {
    if (!this.school.name?.trim() || !this.school.code?.trim()) {
      this.toast.error('Validation Error', 'School Name and Institution Code are required.');
      return;
    }

    this.isSavingSchool = true;
    this.db.updateSchool(this.school).subscribe({
      next: res => {
        this.isSavingSchool = false;
        if (res && res.success) {
          this.toast.success('Database Updated', 'School institutional profile saved to PostgreSQL successfully.');
          this.db.refreshAllFromBackend();
        } else {
          this.toast.error('Save Failed', res?.message || 'Could not update school profile.');
        }
      },
      error: err => {
        this.isSavingSchool = false;
        this.toast.error('Error', err?.error?.message || 'Server connection error.');
      }
    });
  }

  // Branch operations
  openAddBranchModal() {
    this.isEditingBranch = false;
    this.editingBranchId = '';
    const nextNum = this.branches.length + 1;
    this.branchForm = {
      code: `BR-0${nextNum}`,
      name: '',
      address: '',
      phone: '',
      principalUsername: '',
      principalFullName: '',
      principalEmail: '',
      principalPassword: 'principal123',
      principalPhone: ''
    };
    this.isBranchModalOpen = true;
  }

  openEditBranchModal(b: Branch) {
    this.isEditingBranch = true;
    this.editingBranchId = b.id;
    this.branchForm = {
      code: b.code,
      name: b.name,
      address: b.address,
      phone: b.phone,
      principalUsername: '',
      principalFullName: '',
      principalEmail: '',
      principalPassword: '',
      principalPhone: ''
    };
    this.isBranchModalOpen = true;
  }

  closeBranchModal() {
    this.isBranchModalOpen = false;
  }

  saveBranch() {
    if (!this.branchForm.code.trim() || !this.branchForm.name.trim()) {
      this.toast.error('Validation Error', 'Branch Code and Name are required.');
      return;
    }

    this.isSubmittingBranch = true;
    const action = this.isEditingBranch
      ? this.db.updateBranch(this.editingBranchId, this.branchForm)
      : this.db.addBranch(this.branchForm);

    action.subscribe({
      next: res => {
        this.isSubmittingBranch = false;
        if (res && res.success) {
          this.toast.success('Success', res.message || 'Branch saved successfully.');
          this.closeBranchModal();
          this.db.refreshAllFromBackend();
          this.cdr.markForCheck();
        } else {
          this.toast.error('Error', res?.message || 'Could not save branch.');
        }
      },
      error: err => {
        this.isSubmittingBranch = false;
        this.toast.error('Error', err?.error?.message || 'Could not save branch.');
        this.cdr.markForCheck();
      }
    });
  }

  toggleBranchStatus(b: Branch) {
    this.db.toggleBranch(b.id).subscribe({
      next: res => {
        if (res && res.success) {
          this.toast.info('Status Updated', res.message);
          this.db.refreshAllFromBackend();
          this.cdr.markForCheck();
        }
      }
    });
  }

  // Academic year operations
  openAddYearModal() {
    this.yearForm = {
      name: '2027 - 2028 Academic Session',
      startDate: '2027-01-01',
      endDate: '2027-12-31',
      isCurrent: false
    };
    this.isYearModalOpen = true;
  }

  closeYearModal() {
    this.isYearModalOpen = false;
  }

  saveAcademicYear() {
    if (!this.yearForm.name.trim() || !this.yearForm.startDate || !this.yearForm.endDate) {
      this.toast.error('Validation Error', 'Session Name and valid dates are required.');
      return;
    }

    this.isSubmittingYear = true;
    this.db.addAcademicYear(this.yearForm).subscribe({
      next: res => {
        this.isSubmittingYear = false;
        if (res && res.success) {
          this.toast.success('Session Created', 'New academic session added to database.');
          this.closeYearModal();
          this.db.refreshAllFromBackend();
          this.cdr.markForCheck();
        } else {
          this.toast.error('Error', res?.message || 'Could not create academic session.');
        }
      },
      error: err => {
        this.isSubmittingYear = false;
        this.toast.error('Error', err?.error?.message || 'Could not create academic session.');
        this.cdr.markForCheck();
      }
    });
  }

  toggleYearLock(ay: AcademicYear) {
    this.db.toggleAcademicYearLock(ay.id).subscribe({
      next: res => {
        if (res && res.success) {
          this.toast.info('Session Lock', res.message);
          this.db.refreshAllFromBackend();
          this.cdr.markForCheck();
        }
      }
    });
  }

  setCurrentYear(ay: AcademicYear) {
    this.db.setCurrentAcademicYear(ay.id).subscribe({
      next: res => {
        if (res && res.success) {
          this.toast.success('Current Session Set', res.message);
          this.db.refreshAllFromBackend();
          this.cdr.markForCheck();
        }
      }
    });
  }

  formatDate(d: string): string {
    if (!d) return '-';
    try {
      return new Date(d).toISOString().split('T')[0];
    } catch {
      return d;
    }
  }
}
