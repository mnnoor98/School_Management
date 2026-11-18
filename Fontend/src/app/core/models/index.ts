export type MenuType = 'Group' | 'Page' | 'Action';

export interface MenuItem {
  superAdminOnly?: boolean;
  id: string;
  name: string;
  code: string;
  parentCode?: string | null;
  route?: string;
  icon: string;
  type: MenuType;
  displayOrder: number;
  isActive: boolean;
  isVisible: boolean;
  permissionCode?: string;
  badge?: string;
  children?: MenuItem[];
}

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export';

export interface RolePermission {
  roleId: string;
  menuCode: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  export: boolean;
}

export type OverrideType = 'Inherit' | 'Allow' | 'Deny';

export interface UserMenuOverride {
  userId: string;
  menuCode: string;
  action: PermissionAction;
  override: OverrideType;
}

export interface User {
  isSuperAdmin?: boolean;
  id: string;
  username: string;
  fullName: string;
  email: string;
  roleId: string;
  roleName: string;
  schoolId: string;
  branchId: string;
  avatar: string;
  phone: string;
  isActive: boolean;
  password?: string;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string;
  isSystem: boolean;
  userCount: number;
}

export interface School {
  id: string;
  name: string;
  code: string;
  address: string;
  contact: string;
  email: string;
  logo: string;
  website: string;
  status: 'Active' | 'Inactive';
}

export interface Branch {
  id: string;
  schoolId: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
}

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isLocked: boolean;
}

export interface SchoolClass {
  id: string;
  name: string;
  code: string;
  tier?: string;
  branchId?: string;
  sortOrder: number;
  sectionCount: number;
  studentCount: number;
  isActive?: boolean;
}

export interface Section {
  id: string;
  classId: string;
  className: string;
  name: string;
  branchId?: string;
  capacity: number;
  currentStudentCount: number;
  classTeacherId?: string;
  classTeacherName?: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  type: 'Compulsory' | 'Optional';
  fullMarks: number;
  passMarks: number;
}

export interface ClassSubjectMapping {
  id: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
}

export interface RoutinePeriod {
  id: string;
  day: 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday';
  periodNumber: number;
  startTime: string;
  endTime: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  roomNo: string;
  branchId?: string;
}

export interface Student {
  id: string;
  admissionNo: string;
  fullName: string;
  banglaName?: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  religion: string;
  email: string;
  phone: string;
  presentAddress: string;
  permanentAddress: string;
  photoUrl: string;
  branchId?: string;
  
  // Guardian Info
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
  guardianOccupation: string;
  guardianIncome: string;

  // Parents Info
  fatherName?: string;
  fatherPhone?: string;
  fatherOccupation?: string;
  fatherNid?: string;
  motherName?: string;
  motherPhone?: string;
  motherOccupation?: string;
  motherNid?: string;

  // Extended Details
  nationality?: string;
  previousSchool?: string;
  division?: string;
  district?: string;
  upazila?: string;

  // Emergency Contact
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;

  // Logistics & Additional Academic
  shift?: string;
  admissionCategory?: string;
  lastClassPassed?: string;
  lastPassingYear?: string;
  lastGpaMarks?: string;
  tcNumber?: string;
  coCurricular?: string;
  medicalNotes?: string;
  isHostel?: boolean;
  isTransport?: boolean;

  // Academic Info
  academicYearId: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  rollNo: string;
  admissionDate: string;
  status: 'Active' | 'Transferred' | 'Graduated' | 'Inactive';
}

export interface Teacher {
  id: string;
  employeeCode: string;
  fullName: string;
  designation: string;
  department: string;
  qualification: string;
  email: string;
  phone: string;
  joiningDate: string;
  status: 'Active' | 'On Leave' | 'Resigned';
  avatar: string;
  assignedSubjects: string[];
  branchId?: string;
}

export interface TeacherLeaveApplication {
  id: string;
  teacherId: string;
  teacherName: string;
  employeeCode: string;
  department: string;
  leaveType: 'Casual Leave' | 'Sick Leave' | 'Earned Leave' | 'Maternity Leave' | 'Medical Leave' | 'Unpaid Leave' | string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedOn: string;
  reviewedBy?: string;
  reviewRemark?: string;
  branchId?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  classId: string;
  sectionId: string;
  status: 'Present' | 'Absent' | 'Late';
  remark?: string;
  markedBy: string;
  lastUpdated?: string;
  branchId?: string;
}

export interface AttendanceCorrectionLog {
  id: string;
  attendanceId: string;
  date: string;
  studentName: string;
  previousStatus: string;
  newStatus: string;
  reason: string;
  updatedBy: string;
  timestamp: string;
}

export interface WeekendSettings {
  branchId?: string;
  weekendDays: number[]; // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  customNote?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface AcademicHoliday {
  id: string;
  branchId?: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  type: 'Public' | 'Religious' | 'Institutional' | 'Vacation' | 'Emergency';
  description?: string;
  isActive: boolean;
}

export interface Exam {
  id: string;
  name: string;
  term: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  branchId?: string;
  code?: string;
  instructions?: string;
}

export interface ExamScheduleItem {
  id: string;
  examId: string;
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
  branchId?: string;
}

export interface ExamMark {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  subjectName: string;
  fullMarks: number;
  obtainedMarks: number;
  theoryMarks?: number;
  mcqMarks?: number;
  practicalMarks?: number;
  vivaMarks?: number;
  isAbsent?: boolean;
  grade: string;
  gradePoint: number;
  isPass: boolean;
  remark?: string;
  branchId?: string;
}

export interface StudentMarksheet {
  student: Student;
  examName: string;
  academicYear: string;
  marks: ExamMark[];
  totalMarks: number;
  totalObtained: number;
  gpa: number;
  letterGrade: string;
  remarks: string;
  positionInClass: number;
}

export interface FeeType {
  id: string;
  name: string;
  code: string;
  frequency: 'One-Time' | 'Monthly' | 'Term-Wise' | 'Annual';
  description: string;
  defaultAmount?: number;
}

export interface FeeStructure {
  id: string;
  academicYearId: string;
  classId: string;
  className: string;
  feeTypeId: string;
  feeTypeName: string;
  amount: number;
  dueDate: string;
  branchId?: string;
}

export interface StudentInvoice {
  id: string;
  invoiceNo: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  className: string;
  sectionName: string;
  feeTypeId: string;
  feeTypeName: string;
  totalAmount: number;
  discountAmount: number;
  netAmount: number;
  paidAmount: number;
  dueAmount: number;
  dueDate: string;
  status: 'Paid' | 'Partial' | 'Unpaid' | 'Overdue';
  branchId?: string;
}

export interface FeePayment {
  id: string;
  receiptNo: string;
  invoiceId: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  className: string;
  amountPaid: number;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'bKash' | 'Nagad';
  transactionRef?: string;
  paymentDate: string;
  collectedBy: string;
  notes?: string;
}

export interface ExpenseCategory {
  id: string;
  branchId?: string;
  name: string;
  code: string;
  description?: string;
  monthlyBudgetLimit: number;
  isActive: boolean;
}

export interface ExpenseVoucherItem {
  id?: string;
  expenseVoucherId?: string;
  particulars: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface ExpenseVoucher {
  id: string;
  branchId: string;
  voucherNo: string;
  expenseDate: string;
  expenseCategoryId: string;
  categoryName: string;
  amount: number;
  paymentMethod: 'Cash' | 'Bank Cheque' | 'bKash' | 'Nagad' | string;
  bankAccountOrChequeNo?: string;
  paidTo: string;
  contactPhone?: string;
  attachmentUrl?: string;
  status: 'Draft' | 'PendingApproval' | 'Approved' | 'Paid' | 'Rejected' | string;
  createdBy: string;
  approvedBy?: string;
  approvalDate?: string;
  notes?: string;
  items: ExpenseVoucherItem[];
}

export interface ExpenseSummary {
  todayTotal: number;
  thisMonthTotal: number;
  pendingApprovalCount: number;
  pendingApprovalAmount: number;
  byCategory: { categoryName: string; voucherCount: number; totalAmount: number }[];
  recentVouchers: ExpenseVoucher[];
}

export interface Notice {
  id: string;
  title: string;
  category: 'General' | 'Academic' | 'Exam' | 'Holiday' | 'Emergency';
  targetAudience: 'All' | 'Teachers' | 'Students' | 'Parents';
  publishedDate: string;
  content: string;
  isImportant: boolean;
  author: string;
  branchId?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: 'Create' | 'Update' | 'Delete' | 'Approve' | 'Login' | 'Override' | 'Export' | (string & {});
  module: string;
  targetRecord: string;
  details: string;
  schoolScope: string;
  branchId?: string;
}

export interface DatabaseBackup {
  fileName: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  createdAt: string;
  type: string;
  status: string;
}

export interface SmsTemplate {
  id: string;
  title: string;
  category: 'Fee' | 'Attendance' | 'Exam' | 'Emergency' | 'General';
  content: string;
}

export interface SmsDispatchLog {
  id: string;
  recipientGroup: string;
  recipientCount: number;
  message: string;
  senderName: string;
  sentAt: string;
  status: 'Delivered' | 'Pending' | 'Failed';
  creditsUsed: number;
  branchId?: string;
}

export interface SystemServerStatus {
  serverTime: string;
  uptime: string;
  machineName: string;
  osDescription: string;
  dotnetVersion: string;
  processId: number;
  memoryUsageFormatted: string;
  databaseHealthy: boolean;
  databaseName: string;
  databaseLatencyMs: number;
  frontendDeployed: boolean;
  activeFrontendVersion: string;
  frontendDeployedAt: string;
  frontendDeployedBy: string;
  frontendBundleSize: string;
  appBaseUrl: string;
  totalDeployedFiles: number;
}

export interface DeploymentRecord {
  id: string;
  version: string;
  archiveName: string;
  deployedAt: string;
  deployedBy: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  fileCount: number;
  status: 'Active' | 'Archived' | 'RolledBack';
  hasIndexHtml: boolean;
  notes: string;
}

export interface BuildDeployResult {
  success: boolean;
  version: string;
  message: string;
  deployedFileCount: number;
  totalSizeFormatted: string;
  deployedAt: string;
  buildLog: string;
}

export interface LookupOption {
  id: string;
  label: string;
  description?: string;
}

export interface DistrictLookup {
  name: string;
  upazilas: string[];
}

export interface DivisionLookup {
  name: string;
  districts: DistrictLookup[];
}

export interface AdmissionLookups {
  academicYears: LookupOption[];
  classes: LookupOption[];
  genders: LookupOption[];
  bloodGroups: LookupOption[];
  religions: LookupOption[];
  nationalities: LookupOption[];
  guardianRelations: LookupOption[];
  admissionCategories: LookupOption[];
  academicShifts: LookupOption[];
  divisions: DivisionLookup[];
}

export interface AcademicShift {
  id: string;
  code: string;
  name: string;
  banglaName?: string;
  startTime: string;
  endTime: string;
  branchId?: string;
  isActive: boolean;
  description?: string;
}

export interface AdmissionCategory {
  id: string;
  code: string;
  name: string;
  banglaName?: string;
  quotaPercentage?: number;
  discountPercentage?: number;
  isActive: boolean;
  remarks?: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  headTeacherName?: string;
  teacherCount?: number;
  isActive: boolean;
  description?: string;
}

export interface Designation {
  id: string;
  code: string;
  title: string;
  category: 'Teaching' | 'Non-Teaching' | 'Administrative';
  rankOrder: number;
  isActive: boolean;
}

export interface GradingScale {
  id: string;
  letterGrade: string;
  gradePoint: number;
  minMarks: number;
  maxMarks: number;
  remarks: string;
  isPassing: boolean;
}

export interface MasterLookupItem {
  id: string;
  type: 'Gender' | 'BloodGroup' | 'Religion' | 'Nationality' | 'GuardianRelation' | 'StudentStatus' | 'Qualification';
  code: string;
  name: string;
  banglaName?: string;
  displayOrder: number;
  isActive: boolean;
}

// Milestone 2: Staff & Teacher Payroll
export interface SalaryStructure {
  id?: string;
  branchId?: string;
  teacherId: string;
  employeeCode?: string;
  employeeName?: string;
  designation?: string;
  department?: string;
  basicPay: number;
  houseRent: number;
  medicalAllowance: number;
  conveyance: number;
  specialAllowance: number;
  grossSalary?: number;
  providentFundPercent: number;
  bankName: string;
  branchName: string;
  bankAccountNo: string;
  mobileWalletNo?: string;
  isActive: boolean;
  notes?: string;
}

export interface EmployeePayroll {
  id: string;
  branchId?: string;
  salaryMonthYear: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  teacherId: string;
  employeeCode: string;
  employeeName: string;
  designation: string;
  department: string;
  basicPay: number;
  houseRent: number;
  medicalAllowance: number;
  conveyance: number;
  specialAllowance: number;
  grossSalary: number;
  totalWorkingDays: number;
  daysPresent: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  leaveDeduction: number;
  providentFundDeduction: number;
  taxDeduction: number;
  advanceSalaryDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  bonusAmount: number;
  bonusParticulars?: string;
  netPayable: number;
  paymentStatus: 'Draft' | 'Approved' | 'Paid';
  paymentMethod: 'Bank Transfer' | 'Cash' | 'bKash';
  bankName: string;
  bankAccountNo: string;
  transactionRef?: string;
  disbursementDate?: string;
  preparedBy: string;
  approvedBy?: string;
  approvalDate?: string;
  remarks?: string;
}

export interface PayrollSummary {
  salaryMonthYear: string;
  totalEmployees: number;
  totalGrossPayroll: number;
  totalDeductions: number;
  totalNetPayable: number;
  totalDisbursed: number;
  pendingApprovalCount: number;
  pendingDisbursementCount: number;
  fullyPaidCount: number;
}

export interface PaySlip {
  payroll: EmployeePayroll;
  schoolName: string;
  schoolAddress: string;
  campusName: string;
  netPayableInWords: string;
}

export interface BankAccount {
  id: string;
  branchId: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  branchName: string;
  accountType: 'Current' | 'Savings' | 'CashVault' | 'PettyCash' | 'MobileWallet';
  openingBalance: number;
  currentBalance: number;
  currency: string;
  routingNumber?: string;
  swiftCode?: string;
  isDefaultForTuition: boolean;
  isActive: boolean;
  notes?: string;
  createdAt?: string;
}

export interface BankTransaction {
  id: string;
  branchId: string;
  bankAccountId: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  transactionDate: string;
  transactionType: 'Deposit' | 'Withdrawal' | 'TransferIn' | 'TransferOut' | 'CounterCashDeposit' | 'ExpenseDebit' | 'PayrollDisbursement';
  amount: number;
  balanceAfter: number;
  referenceNo?: string;
  description: string;
  counterpartyOrAccount?: string;
  depositSlipAttachment?: string;
  transactedBy: string;
}

export interface PettyCashVoucher {
  id: string;
  branchId: string;
  voucherNo: string;
  voucherDate: string;
  payeeName: string;
  amount: number;
  category: string;
  purpose: string;
  receiptAttachment?: string;
  status: 'Approved' | 'Reimbursed' | 'Rejected';
  approvedBy: string;
  reimbursedFromBankAccountId?: string;
  reimbursedDate?: string;
}

export interface TreasurySummary {
  totalLiquidFunds: number;
  totalBankBalances: number;
  totalVaultCash: number;
  totalPettyCashBalance: number;
  totalMonthlyDeposits: number;
  totalMonthlyWithdrawals: number;
  activeAccountsCount: number;
  pendingPettyCashCount: number;
}

export interface AdmitCardScheduleItem {
  subjectCode: string;
  subjectName: string;
  examDate: string;
  day: string;
  timeSlot: string;
  roomNo: string;
}

export interface AdmitCard {
  schoolName: string;
  schoolAddress: string;
  campusName: string;
  branchId: string;
  examName: string;
  term: string;
  academicYear: string;
  studentId: string;
  fullName: string;
  banglaName?: string;
  admissionNo: string;
  rollNo: string;
  className: string;
  sectionName: string;
  shift?: string;
  avatar?: string;
  fatherName?: string;
  motherName?: string;
  schedules: AdmitCardScheduleItem[];
  instructions: string[];
  generatedAt: string;
}

export interface CertificateType {
  code: string;
  titleEnglish: string;
  titleBangla: string;
  description: string;
}

export interface GenerateCertificateRequest {
  studentId: string;
  certificateType: string;
  referenceNo?: string;
  issueDate?: string;
  conduct?: string;
  reasonForLeaving?: string;
  examPassed?: string;
  gpaOrMarks?: string;
  customRemarks?: string;
}

export interface CertificateDossier {
  certificateNo: string;
  certificateType: string;
  typeTitleEnglish: string;
  typeTitleBangla: string;
  issueDate: string;
  schoolName: string;
  schoolAddress: string;
  campusName: string;
  eiinNo: string;
  affiliation: string;
  studentId: string;
  fullName: string;
  banglaName?: string;
  admissionNo: string;
  rollNo: string;
  className: string;
  sectionName: string;
  academicSession: string;
  dateOfBirth?: string;
  fatherName?: string;
  motherName?: string;
  address?: string;
  avatar?: string;
  conduct: string;
  reasonForLeaving?: string;
  examPassed?: string;
  gpaOrMarks?: string;
  customRemarks?: string;
  paragraphEnglish: string;
  paragraphBangla: string;
  securityVerificationCode: string;
  signatoryHeadTitle: string;
  signatoryTeacherTitle: string;
}




