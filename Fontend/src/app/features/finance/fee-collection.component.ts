import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDbService } from '../../core/services/mock-db.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Student, StudentInvoice, FeePayment } from '../../core/models';
import { ModalComponent } from '../../shared/components/modal.component';
import { BadgeComponent } from '../../shared/components/badge.component';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-fee-collection',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, BadgeComponent, IconComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <app-icon name="circle-dollar-sign" [size]="26" class="text-emerald"></app-icon>
            {{ (isGuardian || isStudent) ? 'Online Fee Payment & Official Vouchers' : 'Counter Fee Collection & Instant Receipt' }}
          </h1>
          <p class="page-subtitle">
            {{ (isGuardian || isStudent) 
              ? 'View outstanding institutional fees for Tanvir Ahmed, settle online via mobile banking/card, and download vouchers.' 
              : 'Search student, view outstanding institutional dues, post atomic receipt, and print voucher.' 
            }}
          </p>
        </div>
      </div>

      <!-- SEARCH & STUDENT SELECTOR -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="search-student-grid">
            <div class="form-group mb-0" *ngIf="!isGuardian && !isStudent">
              <label class="form-label">Search / Select Enrolled Student <span class="required">*</span></label>
              <select class="form-select" [(ngModel)]="selectedStudentId" (change)="onStudentSelect()">
                <option *ngFor="let s of students" [value]="s.id">
                  {{ s.fullName }} — Roll #{{ s.rollNo }} ({{ s.className }} - {{ s.sectionName }})
                </option>
              </select>
            </div>

            <div class="form-group mb-0" *ngIf="isGuardian || isStudent">
              <label class="form-label">Enrolled Ward Dossier:</label>
              <div class="ward-student-pill">
                <strong>Tanvir Ahmed</strong> (Roll #01 — Class 10 Padma)
              </div>
            </div>

            <div class="selected-summary-card" *ngIf="selectedStudent">
              <img [src]="selectedStudent.photoUrl" class="stud-thumb" />
              <div>
                <strong>{{ selectedStudent.fullName }}</strong>
                <p class="text-xs text-muted">ID: {{ selectedStudent.admissionNo }} • Guardian: {{ selectedStudent.guardianName }} ({{ selectedStudent.guardianPhone }})</p>
                <div class="total-due-badge">
                  <span>Outstanding Balance:</span>
                  <strong class="text-danger">৳ {{ getTotalStudentDue() }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- OUTSTANDING INVOICES LIST (PDF Section 10) -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <app-icon name="receipt" [size]="18"></app-icon>
            <span>Unpaid / Due Institutional Invoices</span>
          </div>
          <span class="due-count">{{ studentInvoices.length }} Invoices Found</span>
        </div>

        <div class="app-table-wrapper">
          <table class="app-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Fee Type & Term</th>
                <th>Due Date</th>
                <th>Total Bill</th>
                <th>Paid</th>
                <th>Outstanding Due</th>
                <th>Status</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let inv of studentInvoices" [class.paid-row]="inv.status === 'Paid'">
                <td><code class="code-tag">{{ inv.invoiceNo }}</code></td>
                <td><strong>{{ inv.feeTypeName }}</strong></td>
                <td>{{ inv.dueDate }}</td>
                <td>৳ {{ inv.netAmount }}</td>
                <td>৳ {{ inv.paidAmount }}</td>
                <td><strong class="text-danger">৳ {{ inv.dueAmount }}</strong></td>
                <td>
                  <app-badge [variant]="inv.status === 'Paid' ? 'success' : 'danger'" [label]="inv.status"></app-badge>
                </td>
                <td style="text-align: right;">
                  <button
                    type="button"
                    class="btn btn-sm btn-primary"
                    [disabled]="inv.dueAmount <= 0"
                    (click)="openPaymentModal(inv)"
                  >
                    <app-icon name="credit-card" [size]="14"></app-icon>
                    <span>{{ (isGuardian || isStudent) ? 'Pay Now' : 'Receive Payment' }}</span>
                  </button>
                </td>
              </tr>
              <tr *ngIf="studentInvoices.length === 0">
                <td colspan="8" class="text-center py-4 text-muted">No pending or historical invoices for this student.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- PAYMENT COLLECTION MODAL -->
    <app-modal
      [(isOpen)]="isPaymentModalOpen"
      title="Fee Collection Transaction"
      subtitle="Ensure atomic posting and prevent duplicate receipt generation."
      [maxWidth]="540"
    >
      <div *ngIf="activeInvoice">
        <div class="invoice-summary-banner">
          <div class="is-row">
            <span>Student:</span> <strong>{{ activeInvoice.studentName }} (Roll #{{ activeInvoice.rollNo }})</strong>
          </div>
          <div class="is-row">
            <span>Invoice No:</span> <code class="code-tag">{{ activeInvoice.invoiceNo }}</code>
          </div>
          <div class="is-row">
            <span>Fee Item:</span> <strong>{{ activeInvoice.feeTypeName }}</strong>
          </div>
          <div class="is-row">
            <span>Outstanding Balance:</span> <strong class="text-danger">৳ {{ activeInvoice.dueAmount }}</strong>
          </div>
        </div>

        <form (ngSubmit)="processPayment()">
          <div class="form-group mt-3">
            <label class="form-label">Payment Amount (৳) <span class="required">*</span></label>
            <input
              type="number"
              class="form-control"
              [(ngModel)]="paymentAmount"
              name="paymentAmount"
              [max]="activeInvoice.dueAmount"
              min="1"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Payment Channel / Method <span class="required">*</span></label>
            <select class="form-select" [(ngModel)]="paymentMethod" name="paymentMethod">
              <option value="Cash">Cash (Counter Handover)</option>
              <option value="bKash">bKash Merchant Pay</option>
              <option value="Nagad">Nagad MFS</option>
              <option value="Bank Transfer">Bank Transfer (Sonali / City Bank)</option>
            </select>
          </div>

          <div class="form-group" *ngIf="paymentMethod !== 'Cash'">
            <label class="form-label">Transaction Reference / TrxID</label>
            <input
              type="text"
              class="form-control font-mono"
              [(ngModel)]="transactionRef"
              name="transactionRef"
              placeholder="e.g. 8X93N19"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Accounts Officer Remarks</label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="paymentNotes"
              name="paymentNotes"
              placeholder="e.g. Received at Accounts Counter Desk 1"
            />
          </div>

          <div class="flex justify-end gap-2 mt-4">
            <button type="button" class="btn btn-outline" (click)="isPaymentModalOpen = false">Cancel</button>
            <button type="submit" class="btn btn-success" [disabled]="!paymentAmount || paymentAmount <= 0">
              <app-icon name="check" [size]="16"></app-icon>
              <span>Confirm & Generate Money Receipt</span>
            </button>
          </div>
        </form>
      </div>
    </app-modal>

    <!-- PRINTABLE RECEIPT MODAL -->
    <app-modal
      [(isOpen)]="isReceiptOpen"
      title="Official Institutional Fee Money Receipt"
      subtitle="Authorized Accounts Voucher"
      [maxWidth]="600"
    >
      <div *ngIf="latestPayment" class="receipt-print-wrapper printable-area">
        <div class="receipt-head">
          <h3>{{ school.name }}</h3>
          <p>{{ school.address }} • Accounts Copy</p>
          <div class="receipt-no-tag">MONEY RECEIPT: {{ latestPayment.receiptNo }}</div>
        </div>

        <div class="receipt-meta-grid">
          <div><span class="text-muted">Student:</span> <strong>{{ latestPayment.studentName }}</strong></div>
          <div><span class="text-muted">Class:</span> <strong>{{ latestPayment.className }}</strong></div>
          <div><span class="text-muted">Class Roll:</span> <strong>#{{ latestPayment.rollNo }}</strong></div>
          <div><span class="text-muted">Payment Date:</span> <strong>{{ latestPayment.paymentDate }}</strong></div>
          <div><span class="text-muted">Payment Method:</span> <strong>{{ latestPayment.paymentMethod }}</strong></div>
          <div><span class="text-muted">Trx Ref:</span> <strong>{{ latestPayment.transactionRef || 'CASH' }}</strong></div>
        </div>

        <div class="receipt-amount-box">
          <span>Amount Received:</span>
          <strong class="receipt-amt">৳ {{ latestPayment.amountPaid.toLocaleString() }} BDT</strong>
        </div>

        <div class="receipt-sign">
          <div>
            <div class="r-line"></div>
            <span>Student / Payee</span>
          </div>
          <div>
            <div class="r-line"></div>
            <span>Collected By: {{ latestPayment.collectedBy }}</span>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2 no-print" footer>
        <button type="button" class="btn btn-outline" (click)="isReceiptOpen = false">Close</button>
        <button type="button" class="btn btn-primary" (click)="printReceipt()">
          <app-icon name="printer" [size]="16"></app-icon>
          <span>Print Receipt Voucher</span>
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .mb-4 { margin-bottom: 24px; }
    .mb-0 { margin-bottom: 0 !important; }
    .mt-3 { margin-top: 12px; }
    .mt-4 { margin-top: 16px; }
    .text-emerald { color: #059669; }
    .text-danger { color: #ef4444; }
    .text-muted { color: #64748b; }
    .text-xs { font-size: 0.75rem; }
    .font-mono { font-family: monospace; }
    .search-student-grid {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 20px;
      align-items: center;
    }
    .ward-student-pill {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.875rem;
    }
    .selected-summary-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 18px;
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: 12px;
    }
    .stud-thumb {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
    }
    .total-due-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8125rem;
      margin-top: 4px;
    }
    .code-tag {
      font-size: 0.75rem;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .due-count {
      background: #ecfdf5;
      color: #059669;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 999px;
    }
    .paid-row {
      opacity: 0.65;
    }
    .invoice-summary-banner {
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 14px 18px;
    }
    .is-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      margin-bottom: 6px;
    }

    /* Print Receipt */
    .receipt-print-wrapper {
      padding: 20px;
      background: #ffffff;
      border: 1px dashed #94a3b8;
      border-radius: 12px;
    }
    .receipt-head {
      text-align: center;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .receipt-head h3 {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .receipt-head p {
      font-size: 0.75rem;
      color: #64748b;
      margin: 2px 0 8px 0;
    }
    .receipt-no-tag {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      background: #0f172a;
      color: #ffffff;
      padding: 2px 10px;
      border-radius: 4px;
    }
    .receipt-meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      font-size: 0.825rem;
      margin-bottom: 20px;
    }
    .receipt-amount-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 12px 18px;
      border-radius: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }
    .receipt-amt {
      font-size: 1.35rem;
      color: #059669;
    }
    .receipt-sign {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: #475569;
    }
    .r-line {
      width: 140px;
      border-top: 1px solid #94a3b8;
      margin-bottom: 4px;
    }
  `]
})
export class FeeCollectionComponent implements OnInit {
  private db = inject(MockDbService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  isGuardian = false;
  isStudent = false;

  school = this.db.getSchool();
  students: Student[] = [];
  selectedStudentId = 'std-1001';
  selectedStudent: Student | undefined;

  studentInvoices: StudentInvoice[] = [];

  // Payment Modal
  isPaymentModalOpen = false;
  activeInvoice: StudentInvoice | null = null;
  paymentAmount = 0;
  paymentMethod: FeePayment['paymentMethod'] = 'Cash';
  transactionRef = '';
  paymentNotes = '';

  // Receipt Modal
  isReceiptOpen = false;
  latestPayment: FeePayment | null = null;

  ngOnInit() {
    this.students = this.db.getStudents();

    this.auth.getCurrentUser$().subscribe(user => {
      this.isGuardian = user?.roleId === 'role-guardian' || (user?.roleName || '').includes('Guardian');
      this.isStudent = user?.roleId === 'role-student' || (user?.roleName || '').includes('Student');
      if (this.isGuardian || this.isStudent) {
        this.selectedStudentId = 'std-1001';
        this.paymentMethod = 'bKash';
      }
      this.onStudentSelect();
    });
  }

  onStudentSelect() {
    this.selectedStudent = this.students.find(s => s.id === this.selectedStudentId);
    this.loadInvoices();
  }

  loadInvoices() {
    this.studentInvoices = this.db.getInvoices(this.selectedStudentId);
  }

  getTotalStudentDue(): number {
    return this.studentInvoices.reduce((sum, i) => sum + i.dueAmount, 0);
  }

  openPaymentModal(invoice: StudentInvoice) {
    this.activeInvoice = invoice;
    this.paymentAmount = invoice.dueAmount;
    this.paymentMethod = 'Cash';
    this.transactionRef = '';
    this.paymentNotes = '';
    this.isPaymentModalOpen = true;
  }

  processPayment() {
    if (!this.activeInvoice || this.paymentAmount <= 0) return;

    try {
      const payment = this.db.collectFeePayment({
        invoiceId: this.activeInvoice.id,
        studentId: this.selectedStudentId,
        amountPaid: this.paymentAmount,
        paymentMethod: this.paymentMethod,
        transactionRef: this.transactionRef,
        notes: this.paymentNotes
      });

      this.latestPayment = payment;
      this.isPaymentModalOpen = false;
      this.loadInvoices();
      this.toast.success('Payment Received', `Collected ৳ ${payment.amountPaid}. Receipt: ${payment.receiptNo}`);
      this.isReceiptOpen = true;
    } catch (e: any) {
      this.toast.error('Payment Error', e.message);
    }
  }

  printReceipt() {
    window.print();
  }
}
