import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { FeeType, FeeStructure, StudentInvoice, FeePayment, ExpenseCategory, ExpenseVoucher, ExpenseSummary, SalaryStructure, EmployeePayroll, PayrollSummary, PaySlip, BankAccount, BankTransaction, PettyCashVoucher, TreasurySummary } from '../../models';
import { CampusSessionService } from '../campus-session.service';
import { environment } from '../../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class FinanceStoreService {
  private http = inject(HttpClient);
  private campus = inject(CampusSessionService);
  private readonly API_BASE = '/api/v1';

  private feeTypes$ = new BehaviorSubject<FeeType[]>([]);
  private feeStructure$ = new BehaviorSubject<FeeStructure[]>([]);
  private invoices$ = new BehaviorSubject<StudentInvoice[]>([]);
  private payments$ = new BehaviorSubject<FeePayment[]>([]);

  getFeeTypes$() { return this.feeTypes$.asObservable(); }
  getFeeStructure$() { return this.feeStructure$.asObservable(); }
  getInvoices$() { return this.invoices$.asObservable(); }
  getPayments$() { return this.payments$.asObservable(); }

  getFeeTypes(): FeeType[] { return this.feeTypes$.value; }
  getFeeStructure(): FeeStructure[] { return this.feeStructure$.value; }
  getInvoices(studentId?: string): StudentInvoice[] {
    let list = this.invoices$.value;
    if (studentId) list = list.filter(i => i.studentId === studentId);
    return list;
  }
  getPayments(studentId?: string): FeePayment[] {
    let list = this.payments$.value;
    if (studentId) list = list.filter(p => p.studentId === studentId);
    return list;
  }

  setFeeTypes(types: FeeType[]) { this.feeTypes$.next(types); }
  setFeeStructures(structures: FeeStructure[]) { this.feeStructure$.next(structures); }
  setInvoices(invoices: StudentInvoice[]) { this.invoices$.next(invoices); }
  setPayments(payments: FeePayment[]) { this.payments$.next(payments); }

  clear() {
    this.feeTypes$.next([]);
    this.feeStructure$.next([]);
    this.invoices$.next([]);
    this.payments$.next([]);
  }

  // --- Fee Types CRUD ---
  async loadFeeTypes(): Promise<FeeType[]> {
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<FeeType[]>>(`${this.API_BASE}/fees/types`));
      if (res?.success && res.data) {
        this.feeTypes$.next(res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('FinanceStore loadFeeTypes error:', e);
    }
    return this.feeTypes$.value;
  }

  async addFeeType(ft: Partial<FeeType>): Promise<FeeType> {
    const payload = {
      name: ft.name,
      code: ft.code || ('FEE-' + (ft.name || '').replace(/\s+/g, '').toUpperCase()),
      frequency: ft.frequency || 'Monthly',
      description: ft.description || ''
    };
    try {
      const res = await firstValueFrom(this.http.post<ApiResponse<FeeType>>(`${this.API_BASE}/fees/types`, payload));
      if (res?.success && res.data) {
        this.feeTypes$.next([...this.feeTypes$.value, res.data]);
        return res.data;
      }
    } catch (e: any) {
      console.warn('Backend addFeeType failed:', e);
      if (!environment.enableMockFallback) {
        const errorMsg = e?.error?.message || e?.message || 'Failed to add fee type on server.';
        throw new Error(errorMsg);
      }
    }
    const newFt: FeeType = {
      id: 'ft-' + Math.random().toString(36).substring(2, 9),
      name: payload.name || 'New Fee',
      code: payload.code,
      frequency: payload.frequency as any,
      description: payload.description
    };
    this.feeTypes$.next([...this.feeTypes$.value, newFt]);
    return newFt;
  }

  async updateFeeType(id: string, ft: Partial<FeeType>): Promise<FeeType> {
    const payload = {
      name: ft.name,
      code: ft.code,
      frequency: ft.frequency,
      description: ft.description
    };
    try {
      const res = await firstValueFrom(this.http.put<ApiResponse<FeeType>>(`${this.API_BASE}/fees/types/${id}`, payload));
      if (res?.success && res.data) {
        const updated = this.feeTypes$.value.map(t => t.id === id ? res.data : t);
        this.feeTypes$.next(updated);
        return res.data;
      }
    } catch (e: any) {
      console.warn('Backend updateFeeType failed:', e);
      if (!environment.enableMockFallback) {
        const errorMsg = e?.error?.message || e?.message || 'Failed to update fee type on server.';
        throw new Error(errorMsg);
      }
    }
    const updated = this.feeTypes$.value.map(t => t.id === id ? { ...t, ...ft } as FeeType : t);
    this.feeTypes$.next(updated);
    return updated.find(t => t.id === id)!;
  }

  async deleteFeeType(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete<ApiResponse<boolean>>(`${this.API_BASE}/fees/types/${id}`));
    } catch (e: any) {
      console.warn('Backend deleteFeeType failed:', e);
      if (!environment.enableMockFallback) {
        const errorMsg = e?.error?.message || e?.message || 'Failed to delete fee type on server.';
        throw new Error(errorMsg);
      }
    }
    this.feeTypes$.next(this.feeTypes$.value.filter(t => t.id !== id));
    return true;
  }

  // --- Fee Structures ---
  async loadFeeStructures(): Promise<FeeStructure[]> {
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<FeeStructure[]>>(`${this.API_BASE}/fees/structures`));
      if (res?.success && res.data) {
        this.feeStructure$.next(res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('FinanceStore loadFeeStructures error:', e);
    }
    return this.feeStructure$.value;
  }

  async setFeeStructure(fs: Partial<FeeStructure>): Promise<FeeStructure> {
    const payload = {
      academicYearId: fs.academicYearId || 'ay-2026',
      classId: fs.classId,
      feeTypeId: fs.feeTypeId,
      amount: fs.amount || 0,
      dueDate: fs.dueDate
    };
    try {
      const res = await firstValueFrom(this.http.post<ApiResponse<FeeStructure>>(`${this.API_BASE}/fees/structures`, payload));
      if (res?.success && res.data) {
        const existingIdx = this.feeStructure$.value.findIndex(s => s.classId === fs.classId && s.feeTypeId === fs.feeTypeId);
        let list = [...this.feeStructure$.value];
        if (existingIdx >= 0) {
          list[existingIdx] = res.data;
        } else {
          list.push(res.data);
        }
        this.feeStructure$.next(list);
        return res.data;
      }
    } catch (e: any) {
      console.warn('Backend setFeeStructure failed:', e);
      if (!environment.enableMockFallback) {
        const errorMsg = e?.error?.message || e?.message || 'Failed to save fee structure on server.';
        throw new Error(errorMsg);
      }
    }
    const newFs: FeeStructure = {
      id: 'fs-' + Math.random().toString(36).substring(2, 9),
      academicYearId: payload.academicYearId,
      classId: payload.classId || '',
      className: fs.className || '',
      feeTypeId: payload.feeTypeId || '',
      feeTypeName: fs.feeTypeName || '',
      amount: payload.amount,
      dueDate: payload.dueDate || ''
    };
    this.feeStructure$.next([...this.feeStructure$.value, newFs]);
    return newFs;
  }

  async deleteFeeStructure(id: string): Promise<boolean> {
    try {
      const res = await firstValueFrom(this.http.delete<ApiResponse<boolean>>(`${this.API_BASE}/fees/structures/${id}`));
      this.feeStructure$.next(this.feeStructure$.value.filter(s => s.id !== id));
      return res?.data ?? true;
    } catch (e: any) {
      console.warn('Backend deleteFeeStructure failed:', e);
      throw e;
    }
  }

  async batchGenerateInvoicesAsync(request: {
    academicYearId?: string;
    classId?: string;
    feeTypeId: string;
    monthYear: string;
    dueDate: string;
  }): Promise<any> {
    const payload = {
      academicYearId: request.academicYearId || 'ay-2026',
      classId: request.classId === 'ALL' ? null : request.classId,
      feeTypeId: request.feeTypeId,
      monthYear: request.monthYear,
      dueDate: request.dueDate
    };
    const res = await firstValueFrom(
      this.http.post<ApiResponse<any>>(`${this.API_BASE}/fees/invoices/generate-batch`, payload)
    );
    await this.loadInvoices();
    return res.data;
  }

  // --- Invoices & Payments ---
  async loadInvoices(studentId?: string): Promise<StudentInvoice[]> {
    try {
      const url = studentId ? `${this.API_BASE}/fees/invoices?studentId=${studentId}` : `${this.API_BASE}/fees/invoices`;
      const res = await firstValueFrom(this.http.get<ApiResponse<StudentInvoice[]>>(url));
      if (res?.success && res.data) {
        if (studentId) {
          const others = this.invoices$.value.filter(i => i.studentId !== studentId);
          const merged = [...others, ...res.data];
          this.invoices$.next(merged);
          return res.data;
        } else {
          this.invoices$.next(res.data);
          return res.data;
        }
      }
    } catch (e) {
      console.warn('FinanceStore loadInvoices error:', e);
    }
    return this.invoices$.value;
  }

  async loadPayments(studentId?: string): Promise<FeePayment[]> {
    try {
      const url = studentId ? `${this.API_BASE}/fees/payments?studentId=${studentId}` : `${this.API_BASE}/fees/payments`;
      const res = await firstValueFrom(this.http.get<ApiResponse<FeePayment[]>>(url));
      if (res?.success && res.data) {
        if (studentId) {
          const others = this.payments$.value.filter(p => p.studentId !== studentId);
          const merged = [...others, ...res.data];
          this.payments$.next(merged);
          return res.data;
        } else {
          this.payments$.next(res.data);
          return res.data;
        }
      }
    } catch (e) {
      console.warn('FinanceStore loadPayments error:', e);
    }
    return this.payments$.value;
  }

  async createStudentInvoiceAsync(params: {
    studentId: string;
    feeTypeId: string;
    customAmount?: number;
    dueDate?: string;
    notes?: string;
  }): Promise<StudentInvoice> {
    try {
      const res = await firstValueFrom(this.http.post<ApiResponse<StudentInvoice>>(`${this.API_BASE}/fees/invoices`, params));
      if (res?.success && res.data) {
        await this.loadInvoices();
        return res.data;
      }
      throw new Error(res?.message || 'Invoice creation failed on server.');
    } catch (e: any) {
      console.error('createStudentInvoice error:', e);
      throw e;
    }
  }

  async getDailyClosingReconciliationAsync(date?: string): Promise<any> {
    try {
      const url = date ? `${this.API_BASE}/fees/reconciliation/daily-closing?date=${date}` : `${this.API_BASE}/fees/reconciliation/daily-closing`;
      const res = await firstValueFrom(this.http.get<ApiResponse<any>>(url));
      return res?.data;
    } catch (e) {
      console.warn('getDailyClosingReconciliationAsync error:', e);
      return null;
    }
  }

  async applyInvoiceDiscount(id: string, discount: number): Promise<StudentInvoice> {
    try {
      const res = await firstValueFrom(this.http.put<ApiResponse<StudentInvoice>>(`${this.API_BASE}/fees/invoices/${id}/discount`, { discountAmount: discount }));
      if (res?.success && res.data) {
        const updated = this.invoices$.value.map(i => i.id === id ? res.data : i);
        this.invoices$.next(updated);
        return res.data;
      }
    } catch (e: any) {
      console.warn('Backend applyInvoiceDiscount failed:', e);
      if (!environment.enableMockFallback) {
        const errorMsg = e?.error?.message || e?.message || 'Failed to apply discount on server.';
        throw new Error(errorMsg);
      }
    }
    const updated = this.invoices$.value.map(i => {
      if (i.id === id) {
        const disc = Math.min(discount, i.totalAmount);
        const net = Math.max(0, i.totalAmount - disc);
        const due = Math.max(0, net - i.paidAmount);
        return {
          ...i,
          discountAmount: disc,
          netAmount: net,
          dueAmount: due,
          status: (due === 0 ? 'Paid' : (i.paidAmount > 0 ? 'Partial' : 'Unpaid')) as any
        };
      }
      return i;
    });
    this.invoices$.next(updated);
    return updated.find(i => i.id === id)!;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete<ApiResponse<boolean>>(`${this.API_BASE}/fees/invoices/${id}`));
    } catch (e: any) {
      console.warn('Backend deleteInvoice failed:', e);
      if (!environment.enableMockFallback) {
        const errorMsg = e?.error?.message || e?.message || 'Failed to delete invoice on server.';
        throw new Error(errorMsg);
      }
    }
    this.invoices$.next(this.invoices$.value.filter(i => i.id !== id));
    return true;
  }

  async batchCollectFeePaymentsAsync(params: {
    studentId: string;
    items: { invoiceId: string; amountToPay: number }[];
    paymentMethod: FeePayment['paymentMethod'];
    transactionRef?: string;
    notes?: string;
    discount?: number;
    lateFee?: number;
  }): Promise<FeePayment> {
    const payload = {
      studentId: params.studentId,
      items: params.items.map(i => ({ invoiceId: i.invoiceId, amountPaid: i.amountToPay })),
      paymentMethod: params.paymentMethod,
      transactionRef: params.transactionRef,
      notes: params.notes,
      discount: params.discount,
      lateFee: params.lateFee
    };

    try {
      const res = await firstValueFrom(this.http.post<ApiResponse<FeePayment>>(`${this.API_BASE}/fees/collect-batch`, payload));
      if (res?.success && res.data) {
        await this.loadInvoices();
        await this.loadPayments();
        return res.data;
      }
      throw new Error(res?.message || 'Payment collection failed on server.');
    } catch (e: any) {
      console.error('Batch collect error:', e);
      throw e;
    }
  }

  async collectFeePaymentAsync(payment: {
    invoiceId: string;
    studentId: string;
    amountPaid: number;
    paymentMethod: FeePayment['paymentMethod'];
    transactionRef?: string;
    notes?: string;
  }, collectorName: string = 'Staff'): Promise<FeePayment> {
    const invoices = [...this.invoices$.value];
    const invoice = invoices.find(i => i.id === payment.invoiceId) || invoices[0];

    const payload = {
      invoiceId: payment.invoiceId,
      amountPaid: payment.amountPaid,
      paymentMethod: payment.paymentMethod,
      transactionRef: payment.transactionRef,
      notes: payment.notes
    };

    try {
      const res = await firstValueFrom(this.http.post<ApiResponse<FeePayment>>(`${this.API_BASE}/fees/collect`, payload));
      if (res?.success && res.data) {
        const serverPayment = res.data;
        await this.loadInvoices();
        await this.loadPayments();
        return serverPayment;
      }
    } catch (e: any) {
      console.warn('Backend collectPayment failed:', e);
      throw e;
    }

    const receiptNo = 'RCPT-2026-' + Date.now().toString().slice(-4);
    const fallbackPayment: FeePayment = {
      id: 'pay-' + Date.now(),
      receiptNo,
      invoiceId: payment.invoiceId,
      studentId: payment.studentId,
      studentName: invoice?.studentName || '',
      rollNo: invoice?.rollNo || '',
      className: invoice?.className || '',
      amountPaid: payment.amountPaid,
      paymentMethod: payment.paymentMethod,
      transactionRef: payment.transactionRef,
      paymentDate: new Date().toISOString().split('T')[0],
      collectedBy: collectorName,
      notes: payment.notes
    };

    if (invoice) {
      invoice.paidAmount += payment.amountPaid;
      invoice.dueAmount = Math.max(0, invoice.netAmount - invoice.paidAmount);
      invoice.status = invoice.dueAmount === 0 ? 'Paid' : 'Partial';
      this.invoices$.next(invoices);
    }

    const payments = [fallbackPayment, ...this.payments$.value];
    this.payments$.next(payments);
    return fallbackPayment;
  }

  collectFeePayment(payment: {
    invoiceId: string;
    studentId: string;
    amountPaid: number;
    paymentMethod: FeePayment['paymentMethod'];
    transactionRef?: string;
    notes?: string;
  }, collectorName: string = 'Staff'): FeePayment {
    this.collectFeePaymentAsync(payment, collectorName).catch(err => {
      console.error('Unhandled payment collection error:', err);
    });

    const invoices = [...this.invoices$.value];
    const invoice = invoices.find(i => i.id === payment.invoiceId) || invoices[0];
    const receiptNo = 'RCPT-2026-' + Date.now().toString().slice(-4);
    return {
      id: 'pay-' + Date.now(),
      receiptNo,
      invoiceId: payment.invoiceId,
      studentId: payment.studentId,
      studentName: invoice?.studentName || '',
      rollNo: invoice?.rollNo || '',
      className: invoice?.className || '',
      amountPaid: payment.amountPaid,
      paymentMethod: payment.paymentMethod,
      transactionRef: payment.transactionRef,
      paymentDate: new Date().toISOString().split('T')[0],
      collectedBy: collectorName,
      notes: payment.notes
    };
  }

  async initiateOnlinePayment(invoiceId: string, amount: number, paymentMethod: string, customerPhone?: string): Promise<ApiResponse<any>> {
    return await firstValueFrom(
      this.http.post<ApiResponse<any>>(`${this.API_BASE}/fees/online-payment/initiate`, {
        invoiceId,
        amount,
        paymentMethod,
        customerPhone
      })
    );
  }

  async executeOnlinePayment(transactionId: string, invoiceId: string, amount: number, paymentMethod: string, transactionRef?: string): Promise<ApiResponse<FeePayment>> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<FeePayment>>(`${this.API_BASE}/fees/online-payment/execute`, {
        transactionId,
        invoiceId,
        amount,
        paymentMethod,
        transactionRef
      })
    );
    if (res?.success && res.data) {
      await this.loadInvoices();
      await this.loadPayments();
    }
    return res;
  }

  async getDailyClosingReconciliation(date?: string): Promise<ApiResponse<any>> {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return await firstValueFrom(
      this.http.get<ApiResponse<any>>(`${this.API_BASE}/fees/reconciliation/daily-closing${query}`)
    );
  }

  // --- Campus Expense & Voucher Operations ---
  async loadExpenseCategories(): Promise<ExpenseCategory[]> {
    try {
      const res = await firstValueFrom(
        this.http.get<ApiResponse<ExpenseCategory[]>>(`${this.API_BASE}/expenses/categories`)
      );
      return res?.data || [];
    } catch (e) {
      console.warn('loadExpenseCategories error:', e);
      return [];
    }
  }

  async createExpenseCategory(category: Partial<ExpenseCategory>): Promise<ExpenseCategory> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<ExpenseCategory>>(`${this.API_BASE}/expenses/categories`, category)
    );
    return res.data;
  }

  async deleteExpenseCategory(id: string): Promise<boolean> {
    const res = await firstValueFrom(
      this.http.delete<ApiResponse<boolean>>(`${this.API_BASE}/expenses/categories/${id}`)
    );
    return res.data;
  }

  async loadExpenseVouchers(startDate?: string, endDate?: string, categoryId?: string, status?: string): Promise<ExpenseVoucher[]> {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (categoryId && categoryId !== 'ALL') params.set('categoryId', categoryId);
    if (status && status !== 'ALL') params.set('status', status);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    try {
      const res = await firstValueFrom(
        this.http.get<ApiResponse<ExpenseVoucher[]>>(`${this.API_BASE}/expenses/vouchers${queryString}`)
      );
      return res?.data || [];
    } catch (e) {
      console.warn('loadExpenseVouchers error:', e);
      return [];
    }
  }

  async getExpenseSummary(): Promise<ExpenseSummary | null> {
    try {
      const res = await firstValueFrom(
        this.http.get<ApiResponse<ExpenseSummary>>(`${this.API_BASE}/expenses/summary`)
      );
      return res?.data || null;
    } catch (e) {
      console.warn('getExpenseSummary error:', e);
      return null;
    }
  }

  async createExpenseVoucher(voucher: any): Promise<ExpenseVoucher> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<ExpenseVoucher>>(`${this.API_BASE}/expenses/vouchers`, voucher)
    );
    return res.data;
  }

  async approveExpenseVoucher(id: string, action: string, notes?: string): Promise<ExpenseVoucher> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<ExpenseVoucher>>(`${this.API_BASE}/expenses/vouchers/${id}/approve`, {
        action,
        notes
      })
    );
    return res.data;
  }

  async deleteExpenseVoucher(id: string): Promise<boolean> {
    const res = await firstValueFrom(
      this.http.delete<ApiResponse<boolean>>(`${this.API_BASE}/expenses/vouchers/${id}`)
    );
    return res?.data ?? true;
  }

  async uploadExpenseAttachment(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await firstValueFrom(
      this.http.post<ApiResponse<string>>(`${this.API_BASE}/expenses/upload-attachment`, formData)
    );
    return res.data;
  }

  // --- MILESTONE 2: TEACHER & STAFF PAYROLL ENGINE ---

  async loadSalaryStructures(): Promise<SalaryStructure[]> {
    try {
      const res = await firstValueFrom(
        this.http.get<ApiResponse<SalaryStructure[]>>(`${this.API_BASE}/payroll/structures`)
      );
      return res?.data || [];
    } catch (e) {
      console.warn('loadSalaryStructures error:', e);
      return [];
    }
  }

  async saveSalaryStructure(data: Partial<SalaryStructure>): Promise<SalaryStructure> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<SalaryStructure>>(`${this.API_BASE}/payroll/structures`, data)
    );
    return res.data;
  }

  async loadPayrolls(monthYear?: string, status?: string): Promise<EmployeePayroll[]> {
    const params = new URLSearchParams();
    if (monthYear) params.set('monthYear', monthYear);
    if (status && status !== 'ALL') params.set('status', status);

    const qs = params.toString() ? `?${params.toString()}` : '';
    try {
      const res = await firstValueFrom(
        this.http.get<ApiResponse<EmployeePayroll[]>>(`${this.API_BASE}/payroll/sheets${qs}`)
      );
      return res?.data || [];
    } catch (e) {
      console.warn('loadPayrolls error:', e);
      return [];
    }
  }

  async getPayrollSummary(monthYear?: string): Promise<PayrollSummary | null> {
    const qs = monthYear ? `?monthYear=${encodeURIComponent(monthYear)}` : '';
    try {
      const res = await firstValueFrom(
        this.http.get<ApiResponse<PayrollSummary>>(`${this.API_BASE}/payroll/summary${qs}`)
      );
      return res?.data || null;
    } catch (e) {
      console.warn('getPayrollSummary error:', e);
      return null;
    }
  }

  async generateMonthlyPayroll(monthYear: string, bonusAmount?: number, bonusParticulars?: string): Promise<EmployeePayroll[]> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<EmployeePayroll[]>>(`${this.API_BASE}/payroll/generate`, {
        salaryMonthYear: monthYear,
        bonusAmount: bonusAmount || 0,
        bonusParticulars
      })
    );
    return res.data;
  }

  async approvePayroll(id: string): Promise<EmployeePayroll> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<EmployeePayroll>>(`${this.API_BASE}/payroll/${id}/approve`, {})
    );
    return res.data;
  }

  async batchApprovePayrolls(monthYear: string): Promise<number> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<number>>(`${this.API_BASE}/payroll/approve-month`, {
        salaryMonthYear: monthYear
      })
    );
    return res.data;
  }

  async disbursePayroll(id: string, method: string = 'Bank Transfer', ref?: string, date?: string): Promise<EmployeePayroll> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<EmployeePayroll>>(`${this.API_BASE}/payroll/${id}/disburse`, {
        paymentMethod: method,
        transactionRef: ref,
        disbursementDate: date
      })
    );
    return res.data;
  }

  async batchDisbursePayrolls(monthYear: string, method: string = 'Bank Transfer', ref?: string, date?: string): Promise<number> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<number>>(`${this.API_BASE}/payroll/disburse-month?monthYear=${encodeURIComponent(monthYear)}`, {
        paymentMethod: method,
        transactionRef: ref,
        disbursementDate: date
      })
    );
    return res.data;
  }

  async getPaySlip(payrollId: string): Promise<PaySlip | null> {
    try {
      const res = await firstValueFrom(
        this.http.get<ApiResponse<PaySlip>>(`${this.API_BASE}/payroll/${payrollId}/payslip`)
      );
      return res?.data || null;
    } catch (e) {
      console.warn('getPaySlip error:', e);
      return null;
    }
  }

  // =========================================================================
  // BANKING & TREASURY ENGINE (MILESTONE 3)
  // =========================================================================

  private bankAccounts$ = new BehaviorSubject<BankAccount[]>([]);
  private bankTransactions$ = new BehaviorSubject<BankTransaction[]>([]);
  private pettyCashVouchers$ = new BehaviorSubject<PettyCashVoucher[]>([]);

  getBankAccounts$() { return this.bankAccounts$.asObservable(); }
  getBankTransactions$() { return this.bankTransactions$.asObservable(); }
  getPettyCashVouchers$() { return this.pettyCashVouchers$.asObservable(); }

  async loadBankAccounts(): Promise<BankAccount[]> {
    try {
      const res = await firstValueFrom(
        this.http.get<ApiResponse<BankAccount[]>>(`${this.API_BASE}/banking/accounts`)
      );
      if (res?.success && res.data) {
        this.bankAccounts$.next(res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('loadBankAccounts error:', e);
    }
    return [];
  }

  async createBankAccount(payload: any): Promise<BankAccount> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<BankAccount>>(`${this.API_BASE}/banking/accounts`, payload)
    );
    if (!res?.success) throw new Error(res?.message || 'Failed to create bank account.');
    await this.loadBankAccounts();
    return res.data;
  }

  async updateBankAccount(id: string, payload: any): Promise<BankAccount> {
    const res = await firstValueFrom(
      this.http.put<ApiResponse<BankAccount>>(`${this.API_BASE}/banking/accounts/${id}`, payload)
    );
    if (!res?.success) throw new Error(res?.message || 'Failed to update bank account.');
    await this.loadBankAccounts();
    return res.data;
  }

  async toggleBankAccountStatus(id: string): Promise<boolean> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<boolean>>(`${this.API_BASE}/banking/accounts/${id}/toggle-status`, {})
    );
    await this.loadBankAccounts();
    return res?.data || false;
  }

  async loadBankTransactions(bankAccountId?: string, fromDate?: string, toDate?: string): Promise<BankTransaction[]> {
    try {
      let url = `${this.API_BASE}/banking/transactions?`;
      if (bankAccountId && bankAccountId !== 'ALL') url += `bankAccountId=${encodeURIComponent(bankAccountId)}&`;
      if (fromDate) url += `fromDate=${encodeURIComponent(fromDate)}&`;
      if (toDate) url += `toDate=${encodeURIComponent(toDate)}&`;

      const res = await firstValueFrom(
        this.http.get<ApiResponse<BankTransaction[]>>(url)
      );
      if (res?.success && res.data) {
        this.bankTransactions$.next(res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('loadBankTransactions error:', e);
    }
    return [];
  }

  async recordBankDeposit(payload: any): Promise<BankTransaction> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<BankTransaction>>(`${this.API_BASE}/banking/deposit`, payload)
    );
    if (!res?.success) throw new Error(res?.message || 'Failed to record deposit.');
    await Promise.all([this.loadBankAccounts(), this.loadBankTransactions()]);
    return res.data;
  }

  async recordBankWithdrawal(payload: any): Promise<BankTransaction> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<BankTransaction>>(`${this.API_BASE}/banking/withdraw`, payload)
    );
    if (!res?.success) throw new Error(res?.message || 'Failed to record withdrawal.');
    await Promise.all([this.loadBankAccounts(), this.loadBankTransactions()]);
    return res.data;
  }

  async transferBetweenAccounts(payload: any): Promise<boolean> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<boolean>>(`${this.API_BASE}/banking/transfer`, payload)
    );
    if (!res?.success) throw new Error(res?.message || 'Transfer failed.');
    await Promise.all([this.loadBankAccounts(), this.loadBankTransactions()]);
    return true;
  }

  async loadPettyCashVouchers(status?: string): Promise<PettyCashVoucher[]> {
    try {
      let url = `${this.API_BASE}/banking/petty-cash?`;
      if (status && status !== 'ALL') url += `status=${encodeURIComponent(status)}&`;

      const res = await firstValueFrom(
        this.http.get<ApiResponse<PettyCashVoucher[]>>(url)
      );
      if (res?.success && res.data) {
        this.pettyCashVouchers$.next(res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('loadPettyCashVouchers error:', e);
    }
    return [];
  }

  async createPettyCashVoucher(payload: any): Promise<PettyCashVoucher> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<PettyCashVoucher>>(`${this.API_BASE}/banking/petty-cash`, payload)
    );
    if (!res?.success) throw new Error(res?.message || 'Failed to issue petty cash voucher.');
    await Promise.all([this.loadPettyCashVouchers(), this.loadBankAccounts()]);
    return res.data;
  }

  async reimbursePettyCashVoucher(id: string, bankAccountId: string): Promise<boolean> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<boolean>>(`${this.API_BASE}/banking/petty-cash/${id}/reimburse?bankAccountId=${encodeURIComponent(bankAccountId)}`, {})
    );
    if (!res?.success) throw new Error(res?.message || 'Failed to reimburse petty cash voucher.');
    await Promise.all([this.loadPettyCashVouchers(), this.loadBankAccounts(), this.loadBankTransactions()]);
    return true;
  }

  async getTreasurySummary(): Promise<TreasurySummary | null> {
    try {
      const res = await firstValueFrom(
        this.http.get<ApiResponse<TreasurySummary>>(`${this.API_BASE}/banking/summary`)
      );
      return res?.data || null;
    } catch (e) {
      console.warn('getTreasurySummary error:', e);
      return null;
    }
  }
}
