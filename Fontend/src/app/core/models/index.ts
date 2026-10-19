export type MenuType = 'Group' | 'Page' | 'Action';

export interface MenuItem {
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
  sortOrder: number;
  sectionCount: number;
  studentCount: number;
}

export interface Section {
  id: string;
  classId: string;
  className: string;
  name: string;
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
  
  // Guardian Info
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
  guardianOccupation: string;
  guardianIncome: string;

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

export interface Exam {
  id: string;
  name: string;
  term: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  isPublished: boolean;
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
  grade: string;
  gradePoint: number;
  isPass: boolean;
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

export interface Notice {
  id: string;
  title: string;
  category: 'General' | 'Academic' | 'Exam' | 'Holiday' | 'Emergency';
  targetAudience: 'All' | 'Teachers' | 'Students' | 'Parents';
  publishedDate: string;
  content: string;
  isImportant: boolean;
  author: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: 'Create' | 'Update' | 'Delete' | 'Approve' | 'Login' | 'Override' | 'Export';
  module: string;
  targetRecord: string;
  details: string;
  schoolScope: string;
}
