import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceStoreService } from '../../core/services/stores/finance-store.service';
import { AcademicStoreService } from '../../core/services/stores/academic-store.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { FeeType, FeeStructure, SchoolClass, AcademicYear } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { BadgeComponent } from '../../shared/components/badge.component';

@Component({
  selector: 'app-fee-structure',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, ModalComponent, BadgeComponent],
  template: `
    <div class="page-container">
      <!-- HEADER -->
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <app-icon name="credit-card" [size]="28" class="text-emerald"></app-icon>
            Institutional Fee Structure & Schedule
          </h1>
          <p class="page-subtitle">
            Configure tuition tariff schedules, admission fees, lab dues, and payment policies per academic standard.
          </p>
        </div>
        <div class="page-actions" *ngIf="canManage">
          <button
            type="button"
            class="btn btn-outline"
            (click)="seedStandardFeeCategories()"
            title="Seed standard institutional academic fee categories into PostgreSQL"
          >
            <app-icon name="plus-circle" [size]="16" class="text-indigo"></app-icon>
            <span>Seed Standard Heads</span>
          </button>
          <button
            *ngIf="activeTab === 'structures'"
            type="button"
            class="btn btn-primary"
            (click)="openAddStructureModal()"
          >
            <app-icon name="plus" [size]="16"></app-icon>
            <span>Set Class Fee Rate</span>
          </button>
          <button
            *ngIf="activeTab === 'types'"
            type="button"
            class="btn btn-primary"
            (click)="openAddTypeModal()"
          >
            <app-icon name="plus" [size]="16"></app-icon>
            <span>Add Fee Type</span>
          </button>
        </div>
      </div>

      <!-- TABS -->
      <div class="tabs-nav mb-4">
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab === 'structures'"
          (click)="activeTab = 'structures'"
        >
          <app-icon name="layers" [size]="16"></app-icon>
          <span>Class Fee Schedules ({{ structures.length }})</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab === 'types'"
          (click)="activeTab = 'types'"
        >
          <app-icon name="tag" [size]="16"></app-icon>
          <span>Accredited Fee Categories ({{ feeTypes.length }})</span>
        </button>
      </div>

      <!-- TAB 1: STRUCTURES MATRIX -->
      <div *ngIf="activeTab === 'structures'">
        <!-- FILTER BAR -->
        <div class="card mb-4">
          <div class="card-body p-3">
            <div class="filter-strip">
              <div class="filter-item">
                <label class="filter-lbl">Class Filter:</label>
                <select [(ngModel)]="selectedClassId" class="form-select form-select-sm">
                  <option value="ALL">All Academic Classes</option>
                  <option *ngFor="let c of classes" [value]="c.id">{{ c.name }}</option>
                </select>
              </div>

              <div class="filter-item">
                <label class="filter-lbl">Fee Category:</label>
                <select [(ngModel)]="selectedFeeTypeId" class="form-select form-select-sm">
                  <option value="ALL">All Categories</option>
                  <option *ngFor="let ft of feeTypes" [value]="ft.id">{{ ft.name }} ({{ ft.frequency }})</option>
                </select>
              </div>

              <div class="count-pill ms-auto">
                {{ filteredStructures.length }} Rates Defined
              </div>
            </div>
          </div>
        </div>

        <!-- STRUCTURES TABLE -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <app-icon name="receipt" [size]="18"></app-icon>
              <span>Fee Tariff Schedule Matrix</span>
            </div>
          </div>

          <div class="app-table-wrapper">
            <table class="app-table">
              <thead>
                <tr>
                  <th>Academic Class</th>
                  <th>Fee Particular / Head</th>
                  <th>Payment Cycle</th>
                  <th style="text-align: right;">Standard Amount</th>
                  <th>Default Due Date</th>
                  <th style="text-align: right;" *ngIf="canManage">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let fs of filteredStructures">
                  <td>
                    <span class="class-badge">{{ fs.className }}</span>
                  </td>
                  <td>
                    <strong>{{ fs.feeTypeName }}</strong>
                  </td>
                  <td>
                    <app-badge [variant]="getFrequencyVariant(getFeeTypeFrequency(fs.feeTypeId))" [label]="getFeeTypeFrequency(fs.feeTypeId)"></app-badge>
                  </td>
                  <td style="text-align: right; font-weight: 700; color: #047857; font-size: 0.95rem;">
                    ৳ {{ fs.amount.toLocaleString() }}
                  </td>
                  <td>
                    <span class="due-text">{{ fs.dueDate || '10th of Month' }}</span>
                  </td>
                  <td style="text-align: right;" *ngIf="canManage">
                    <div class="table-actions">
                      <button type="button" class="btn-icon" title="Edit Rate" (click)="openEditStructureModal(fs)">
                        <app-icon name="edit-3" [size]="15"></app-icon>
                      </button>
                      <button type="button" class="btn-icon text-danger" title="Remove Rate" (click)="deleteStructure(fs)">
                        <app-icon name="trash-2" [size]="15"></app-icon>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="filteredStructures.length === 0">
                  <td colspan="6" class="text-center py-4 text-muted">
                    No fee structures found matching the criteria. Click "Set Class Fee Rate" to add one.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 2: FEE TYPES CATALOG -->
      <div *ngIf="activeTab === 'types'">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <app-icon name="tag" [size]="18"></app-icon>
              <span>Fee Types & Frequency Rules</span>
            </div>
            <span class="count-pill">{{ feeTypes.length }} Categories</span>
          </div>

          <div class="app-table-wrapper">
            <table class="app-table">
              <thead>
                <tr>
                  <th style="width: 130px;">Code</th>
                  <th>Fee Particular Title</th>
                  <th style="width: 140px;">Billing Frequency</th>
                  <th>Policy Description</th>
                  <th style="text-align: right; width: 110px;" *ngIf="canManage">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let ft of feeTypes">
                  <td><code class="code-tag">{{ ft.code }}</code></td>
                  <td><strong>{{ ft.name }}</strong></td>
                  <td>
                    <app-badge [variant]="getFrequencyVariant(ft.frequency)" [label]="ft.frequency"></app-badge>
                  </td>
                  <td class="text-muted text-sm">{{ ft.description || 'Institutional fee head' }}</td>
                  <td style="text-align: right;" *ngIf="canManage">
                    <div class="table-actions">
                      <button type="button" class="btn-icon" title="Edit Category" (click)="openEditTypeModal(ft)">
                        <app-icon name="edit-3" [size]="15"></app-icon>
                      </button>
                      <button type="button" class="btn-icon text-danger" title="Delete Category" (click)="deleteFeeType(ft)">
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

      <!-- MODAL: ADD / EDIT STRUCTURE -->
      <app-modal [isOpen]="isStructureModalOpen" [title]="isEditingStructure ? 'Edit Class Fee Rate' : 'Set Class Fee Rate'" (close)="isStructureModalOpen = false">
        <form (ngSubmit)="saveStructure()" class="modal-form">
          <div class="form-group">
            <label class="form-label">Academic Class <span class="required">*</span></label>
            <select [(ngModel)]="structureForm.classId" name="classId" class="form-select" [disabled]="isEditingStructure" required>
              <option value="">-- Select Target Class --</option>
              <option *ngFor="let c of classes" [value]="c.id">{{ c.name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Fee Particular / Category <span class="required">*</span></label>
            <select [(ngModel)]="structureForm.feeTypeId" name="feeTypeId" class="form-select" [disabled]="isEditingStructure" required>
              <option value="">-- Select Fee Particular --</option>
              <option *ngFor="let ft of feeTypes" [value]="ft.id">{{ ft.name }} ({{ ft.frequency }})</option>
            </select>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Fee Amount (৳ BDT) <span class="required">*</span></label>
              <input type="number" [(ngModel)]="structureForm.amount" name="amount" class="form-control" placeholder="e.g. 3500" min="0" required />
            </div>
            <div class="form-group">
              <label class="form-label">Monthly Due Date</label>
              <input type="date" [(ngModel)]="structureForm.dueDate" name="dueDate" class="form-control" />
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" (click)="isStructureModalOpen = false">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!structureForm.classId || !structureForm.feeTypeId || structureForm.amount <= 0">
              <app-icon name="check" [size]="16"></app-icon>
              <span>{{ isEditingStructure ? 'Update Rate' : 'Save Fee Rate' }}</span>
            </button>
          </div>
        </form>
      </app-modal>

      <!-- MODAL: ADD / EDIT FEE TYPE -->
      <app-modal [isOpen]="isTypeModalOpen" [title]="isEditingType ? 'Edit Fee Category' : 'Add New Fee Category'" (close)="isTypeModalOpen = false">
        <form (ngSubmit)="saveFeeType()" class="modal-form">
          <div class="form-group">
            <label class="form-label">Fee Category Name <span class="required">*</span></label>
            <input type="text" [(ngModel)]="typeForm.name" name="ftName" class="form-control" placeholder="e.g. Computer Lab Fee, Term Exam Fee" required />
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Category Code <span class="required">*</span></label>
              <input type="text" [(ngModel)]="typeForm.code" name="ftCode" class="form-control" placeholder="e.g. FEE-LAB" required />
            </div>
            <div class="form-group">
              <label class="form-label">Billing Cycle Frequency</label>
              <select [(ngModel)]="typeForm.frequency" name="ftFreq" class="form-select">
                <option value="Monthly">Monthly</option>
                <option value="Term-Wise">Term-Wise</option>
                <option value="Annual">Annual</option>
                <option value="One-Time">One-Time</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Description / Accounting Head</label>
            <input type="text" [(ngModel)]="typeForm.description" name="ftDesc" class="form-control" placeholder="Optional notes about when and how this fee applies" />
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" (click)="isTypeModalOpen = false">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!typeForm.name || !typeForm.code">
              <app-icon name="check" [size]="16"></app-icon>
              <span>{{ isEditingType ? 'Update Category' : 'Save Category' }}</span>
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
    .text-emerald { color: #059669; }
    .text-primary { color: #4f46e5; }
    .text-danger { color: #ef4444; }
    .text-muted { color: #64748b; }
    .text-sm { font-size: 0.8125rem; }
    .ms-auto { margin-left: auto; }

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
      color: #059669;
      border-bottom-color: #059669;
    }

    .filter-strip {
      display: flex;
      align-items: center;
      gap: 16px;
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

    .class-badge {
      background: #eff6ff;
      color: #1d4ed8;
      font-size: 0.775rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
    }
    .due-text {
      font-size: 0.8125rem;
      color: #64748b;
    }
    .code-tag {
      background: #f1f5f9;
      color: #334155;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
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
      .filter-strip { flex-direction: column; align-items: stretch; }
    }
  `]
})
export class FeeStructureComponent implements OnInit {
  private financeStore = inject(FinanceStoreService);
  private academicStore = inject(AcademicStoreService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  structures: FeeStructure[] = [];
  feeTypes: FeeType[] = [];
  classes: SchoolClass[] = [];

  activeTab: 'structures' | 'types' = 'structures';
  selectedClassId = 'ALL';
  selectedFeeTypeId = 'ALL';
  canManage = true;
  isLoading = false;
  isSubmitting = false;

  // Structure Modal
  isStructureModalOpen = false;
  isEditingStructure = false;
  structureForm: {
    id?: string;
    classId: string;
    feeTypeId: string;
    amount: number;
    dueDate: string;
  } = {
      classId: '',
      feeTypeId: '',
      amount: 2500,
      dueDate: ''
    };

  // Fee Type Modal
  isTypeModalOpen = false;
  isEditingType = false;
  typeForm: {
    id?: string;
    name: string;
    code: string;
    frequency: 'One-Time' | 'Monthly' | 'Term-Wise' | 'Annual';
    description: string;
  } = {
      name: '',
      code: '',
      frequency: 'Monthly',
      description: ''
    };

  async ngOnInit() {
    this.canManage = this.auth.hasPermission('FIN_STRUCTURE', 'edit');
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    this.cdr.markForCheck();
    try {
      const [fs, ft, cls] = await Promise.all([
        this.financeStore.loadFeeStructures(),
        this.financeStore.loadFeeTypes(),
        this.academicStore.loadClasses()
      ]);
      this.structures = fs || [];
      this.feeTypes = ft || [];
      this.classes = cls || [];
    } catch (e: any) {
      console.error('Error loading fee structure data:', e);
      this.toast.error('Load Error', 'Could not load fee structure from database.');
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  get filteredStructures(): FeeStructure[] {
    return this.structures.filter(s => {
      const matchClass = this.selectedClassId === 'ALL' || s.classId === this.selectedClassId;
      const matchType = this.selectedFeeTypeId === 'ALL' || s.feeTypeId === this.selectedFeeTypeId;
      return matchClass && matchType;
    });
  }

  getFeeTypeFrequency(typeId: string): string {
    const ft = this.feeTypes.find(t => t.id === typeId);
    return ft ? ft.frequency : 'Monthly';
  }

  getFrequencyVariant(freq: string): 'info' | 'purple' | 'success' | 'warning' {
    switch (freq) {
      case 'Monthly': return 'info';
      case 'Term-Wise': return 'purple';
      case 'Annual': return 'success';
      default: return 'warning';
    }
  }

  // Structure Modals
  openAddStructureModal() {
    this.isEditingStructure = false;
    this.structureForm = {
      classId: this.classes[0]?.id || '',
      feeTypeId: this.feeTypes[0]?.id || '',
      amount: 2500,
      dueDate: new Date().toISOString().split('T')[0]
    };
    this.isStructureModalOpen = true;
  }

  openEditStructureModal(fs: FeeStructure) {
    this.isEditingStructure = true;
    this.structureForm = {
      id: fs.id,
      classId: fs.classId,
      feeTypeId: fs.feeTypeId,
      amount: fs.amount,
      dueDate: fs.dueDate ? fs.dueDate.split('T')[0] : ''
    };
    this.isStructureModalOpen = true;
  }

  async saveStructure() {
    if (!this.structureForm.classId || !this.structureForm.feeTypeId || this.structureForm.amount <= 0) {
      this.toast.warning('Invalid Input', 'Please select class, fee category, and valid amount.');
      return;
    }

    const cls = this.classes.find(c => c.id === this.structureForm.classId);
    const ft = this.feeTypes.find(t => t.id === this.structureForm.feeTypeId);

    this.isSubmitting = true;
    try {
      await this.financeStore.setFeeStructure({
        classId: this.structureForm.classId,
        className: cls?.name || 'Class',
        feeTypeId: this.structureForm.feeTypeId,
        feeTypeName: ft?.name || 'Fee',
        amount: this.structureForm.amount,
        dueDate: this.structureForm.dueDate
      });
      this.toast.success('Fee Rate Saved', `Fee rate set for ${cls?.name} - ${ft?.name}.`);
      this.isStructureModalOpen = false;
      await this.loadData();
    } catch (e: any) {
      this.toast.error('Save Error', e.message || 'Failed to save fee rate.');
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  async deleteStructure(fs: FeeStructure) {
    if (confirm(`Remove fee rate for ${fs.className} (${fs.feeTypeName})?`)) {
      try {
        await this.financeStore.deleteFeeStructure(fs.id);
        this.toast.info('Rate Removed', 'Fee rate removed from schedule.');
        await this.loadData();
      } catch (e: any) {
        this.toast.error('Delete Error', e.message || 'Could not delete fee structure.');
      }
    }
  }

  // Fee Type Modals
  openAddTypeModal() {
    this.isEditingType = false;
    this.typeForm = {
      name: '',
      code: 'FEE-' + (this.feeTypes.length + 101),
      frequency: 'Monthly',
      description: ''
    };
    this.isTypeModalOpen = true;
  }

  openEditTypeModal(ft: FeeType) {
    this.isEditingType = true;
    this.typeForm = {
      id: ft.id,
      name: ft.name,
      code: ft.code,
      frequency: ft.frequency,
      description: ft.description
    };
    this.isTypeModalOpen = true;
  }

  async saveFeeType() {
    if (!this.typeForm.name.trim() || !this.typeForm.code.trim()) {
      this.toast.warning('Required Fields', 'Fee category name and code are required.');
      return;
    }

    this.isSubmitting = true;
    try {
      if (this.isEditingType && this.typeForm.id) {
        await this.financeStore.updateFeeType(this.typeForm.id, {
          name: this.typeForm.name.trim(),
          code: this.typeForm.code.trim(),
          frequency: this.typeForm.frequency,
          description: this.typeForm.description.trim()
        });
        this.toast.success('Category Updated', `Fee category "${this.typeForm.name}" updated.`);
      } else {
        await this.financeStore.addFeeType({
          name: this.typeForm.name.trim(),
          code: this.typeForm.code.trim(),
          frequency: this.typeForm.frequency,
          description: this.typeForm.description.trim()
        });
        this.toast.success('Category Created', `New category "${this.typeForm.name}" saved in database.`);
      }
      this.isTypeModalOpen = false;
      await this.loadData();
    } catch (e: any) {
      this.toast.error('Category Error', e.message || 'Failed to save fee category.');
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  async deleteFeeType(ft: FeeType) {
    if (confirm(`Are you sure you want to delete category "${ft.name}"?`)) {
      try {
        await this.financeStore.deleteFeeType(ft.id);
        this.toast.info('Category Removed', `Fee category "${ft.name}" deleted from database.`);
        await this.loadData();
      } catch (e: any) {
        this.toast.error('Delete Error', e.message || 'Cannot delete category in active use.');
      }
    }
  }

  async seedStandardFeeCategories() {
    const standardFeeHeads = [
      { name: 'Monthly Tuition Fee', code: 'TUIT-M', frequency: 'Monthly' as const, description: 'Standard monthly academic tuition fee' },
      { name: 'Semester Examination Fee', code: 'EXAM-SEM', frequency: 'Term-Wise' as const, description: 'Terminal & annual exam question paper and evaluation fee' },
      { name: 'Admission & Registration Fee', code: 'ADM-REG', frequency: 'One-Time' as const, description: 'New student admission processing and board registration' },
      { name: 'Science & IT Lab Resource Fee', code: 'LAB-RES', frequency: 'Annual' as const, description: 'Computer lab, internet and physics/chem/bio consumable charge' },
      { name: 'Library & Learning Resource Fee', code: 'LIB-RES', frequency: 'Annual' as const, description: 'Library card, book acquisition and digital portal access' },
      { name: 'Annual Session Development Charge', code: 'SESS-DEV', frequency: 'Annual' as const, description: 'Institutional development, sports and cultural events' }
    ];

    this.isSubmitting = true;
    let added = 0;
    try {
      const existingNames = new Set(this.feeTypes.map(t => t.name.toLowerCase()));
      for (const head of standardFeeHeads) {
        if (!existingNames.has(head.name.toLowerCase())) {
          await this.financeStore.addFeeType(head);
          added++;
        }
      }
      if (added > 0) {
        this.toast.success('Categories Seeded', `Successfully imported ${added} standard academic fee categories into PostgreSQL.`);
      } else {
        this.toast.info('Up-to-Date', 'Standard fee heads are already configured in database.');
      }
      await this.loadData();
    } catch (e: any) {
      this.toast.error('Seed Error', e.message || 'Failed to seed fee heads.');
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }
}
