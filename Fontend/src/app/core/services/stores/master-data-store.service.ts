import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import {
  AcademicShift,
  AdmissionCategory,
  Department,
  Designation,
  GradingScale,
  MasterLookupItem,
  LookupOption
} from '../../models';
import { CampusSessionService } from '../campus-session.service';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class MasterDataStoreService {
  private http = inject(HttpClient);
  private campus = inject(CampusSessionService);
  private readonly API_BASE = '/api/v1';

  // 1. Academic Shifts
  private readonly defaultShifts: AcademicShift[] = [
    {
      id: 'shf-01',
      code: 'MORN',
      name: 'Morning Shift',
      banglaName: 'প্রভাতী শাখা',
      startTime: '07:30 AM',
      endTime: '11:45 AM',
      isActive: true,
      description: 'Pre-Primary to Class 5 early morning academic schedule'
    },
    {
      id: 'shf-02',
      code: 'DAY',
      name: 'Day Shift',
      banglaName: 'দিবা শাখা',
      startTime: '12:15 PM',
      endTime: '05:00 PM',
      isActive: true,
      description: 'Class 6 to Class 10 standard afternoon academic schedule'
    },
    {
      id: 'shf-03',
      code: 'EVE',
      name: 'Evening / Coaching Shift',
      banglaName: 'সান্ধ্য / বিশেষ কোচিং শাখা',
      startTime: '05:30 PM',
      endTime: '08:00 PM',
      isActive: false,
      description: 'Special remedial coaching and board exam preparation sessions'
    }
  ];

  // 2. Admission Categories
  private readonly defaultAdmissionCategories: AdmissionCategory[] = [
    {
      id: 'cat-01',
      code: 'GEN',
      name: 'General Admission',
      banglaName: 'সাধারণ কোটা',
      quotaPercentage: 75,
      discountPercentage: 0,
      isActive: true,
      remarks: 'Open merit admission for standard institutional seats'
    },
    {
      id: 'cat-02',
      code: 'MERIT',
      name: 'Merit Scholarship',
      banglaName: 'মেধা বৃত্তি কোটা',
      quotaPercentage: 10,
      discountPercentage: 100,
      isActive: true,
      remarks: 'Full tuition waiver for top scoring students in entrance exam'
    },
    {
      id: 'cat-03',
      code: 'FF_QUOTA',
      name: 'Freedom Fighter Quota',
      banglaName: 'বীর মুক্তিযোদ্ধা সন্তান/নাতী কোটা',
      quotaPercentage: 5,
      discountPercentage: 50,
      isActive: true,
      remarks: '50% fee concession for descendants of recognized freedom fighters'
    },
    {
      id: 'cat-04',
      code: 'SIBLING',
      name: 'Sibling Concession',
      banglaName: 'সহোদর ভাই/বোন কোটা',
      quotaPercentage: 5,
      discountPercentage: 25,
      isActive: true,
      remarks: '25% tuition fee waiver for second or third sibling currently enrolled'
    },
    {
      id: 'cat-05',
      code: 'STAFF',
      name: 'Staff Child Quota',
      banglaName: 'শিক্ষক ও কর্মচারী সন্তান কোটা',
      quotaPercentage: 3,
      discountPercentage: 100,
      isActive: true,
      remarks: 'Institutional benefit for confirmed faculty and administrative staff children'
    },
    {
      id: 'cat-06',
      code: 'SPEC_NEEDS',
      name: 'Special Needs / Underprivileged',
      banglaName: 'প্রতিবন্ধী ও অনগ্রসর কোটা',
      quotaPercentage: 2,
      discountPercentage: 50,
      isActive: true,
      remarks: 'Dedicated quota with special academic accommodations'
    }
  ];

  // 3. Departments
  private readonly defaultDepartments: Department[] = [
    {
      id: 'dept-01',
      code: 'SCI',
      name: 'Department of Physical & Chemical Sciences',
      headTeacherName: 'Sarah Jenkins',
      teacherCount: 6,
      isActive: true,
      description: 'Physics, Chemistry, General Science curriculum laboratories'
    },
    {
      id: 'dept-02',
      code: 'BIO',
      name: 'Department of Biological Sciences & Environment',
      headTeacherName: 'Mizanur Rahman',
      teacherCount: 4,
      isActive: true,
      description: 'Biology, Botany, Environmental Studies'
    },
    {
      id: 'dept-03',
      code: 'MATH',
      name: 'Department of Pure & Applied Mathematics',
      headTeacherName: 'Kaniz Fatema',
      teacherCount: 5,
      isActive: true,
      description: 'General Math, Higher Math, Numerical Analysis'
    },
    {
      id: 'dept-04',
      code: 'ENG',
      name: 'Department of English Language & Literature',
      headTeacherName: 'Rukhsana Akter',
      teacherCount: 6,
      isActive: true,
      description: 'English 1st & 2nd Paper, Phonetics, IELTS Foundation'
    },
    {
      id: 'dept-05',
      code: 'BAN',
      name: 'Department of Bangla Language & Literature',
      headTeacherName: 'Jannatul Ferdous',
      teacherCount: 5,
      isActive: true,
      description: 'Bangla Sahitto, Byakoron, Cultural Studies'
    },
    {
      id: 'dept-06',
      code: 'SOC',
      name: 'Department of Social Sciences & History',
      headTeacherName: 'Shahidul Islam',
      teacherCount: 4,
      isActive: true,
      description: 'Bangladesh & Global Studies, Civics, Geography'
    },
    {
      id: 'dept-07',
      code: 'ICT',
      name: 'Department of Computer Science & ICT',
      headTeacherName: 'Hasan Mahmud',
      teacherCount: 3,
      isActive: true,
      description: 'ICT Lab, Robotics, Programming fundamentals'
    },
    {
      id: 'dept-08',
      code: 'ARTS',
      name: 'Department of Fine Arts, Music & Physical Ed',
      headTeacherName: 'Farzana Haque',
      teacherCount: 3,
      isActive: true,
      description: 'Drawing, Crafts, Music, Sports & Physical Training'
    }
  ];

  // 4. Designations
  private readonly defaultDesignations: Designation[] = [
    { id: 'des-01', code: 'PRIN', title: 'Principal & Head of Institution', category: 'Administrative', rankOrder: 1, isActive: true },
    { id: 'des-02', code: 'VP', title: 'Vice Principal (Academic Affairs)', category: 'Administrative', rankOrder: 2, isActive: true },
    { id: 'des-03', code: 'AP', title: 'Assistant Professor', category: 'Teaching', rankOrder: 3, isActive: true },
    { id: 'des-04', code: 'ST', title: 'Senior Faculty Teacher', category: 'Teaching', rankOrder: 4, isActive: true },
    { id: 'des-05', code: 'AT', title: 'Assistant Teacher', category: 'Teaching', rankOrder: 5, isActive: true },
    { id: 'des-06', code: 'JT', title: 'Junior / Pre-Primary Teacher', category: 'Teaching', rankOrder: 6, isActive: true },
    { id: 'des-07', code: 'BURSAR', title: 'Bursar & Chief Accountant', category: 'Administrative', rankOrder: 7, isActive: true },
    { id: 'des-08', code: 'IT_OFFICER', title: 'IT Systems Administrator', category: 'Non-Teaching', rankOrder: 8, isActive: true },
    { id: 'des-09', code: 'OFFICE_EXEC', title: 'Senior Office Executive', category: 'Non-Teaching', rankOrder: 9, isActive: true },
    { id: 'des-10', code: 'LAB_ASST', title: 'Laboratory Attendant', category: 'Non-Teaching', rankOrder: 10, isActive: true }
  ];

  // 5. Grading Scales
  private readonly defaultGradingScales: GradingScale[] = [
    { id: 'grd-01', letterGrade: 'A+', gradePoint: 5.00, minMarks: 80, maxMarks: 100, remarks: 'Outstanding (অসাধারণ)', isPassing: true },
    { id: 'grd-02', letterGrade: 'A',  gradePoint: 4.00, minMarks: 70, maxMarks: 79,  remarks: 'Excellent (চমৎকার)', isPassing: true },
    { id: 'grd-03', letterGrade: 'A-', gradePoint: 3.50, minMarks: 60, maxMarks: 69,  remarks: 'Very Good (খুব ভালো)', isPassing: true },
    { id: 'grd-04', letterGrade: 'B',  gradePoint: 3.00, minMarks: 50, maxMarks: 59,  remarks: 'Good (ভালো)', isPassing: true },
    { id: 'grd-05', letterGrade: 'C',  gradePoint: 2.00, minMarks: 40, maxMarks: 49,  remarks: 'Satisfactory (সন্তোষজনক)', isPassing: true },
    { id: 'grd-06', letterGrade: 'D',  gradePoint: 1.00, minMarks: 33, maxMarks: 39,  remarks: 'Pass (উত্তীর্ণ)', isPassing: true },
    { id: 'grd-07', letterGrade: 'F',  gradePoint: 0.00, minMarks: 0,  maxMarks: 32,  remarks: 'Fail (অনুত্তীর্ণ)', isPassing: false }
  ];

  // 6. Master Lookups
  private readonly defaultLookups: MasterLookupItem[] = [
    // Genders
    { id: 'lk-g1', type: 'Gender', code: 'Male', name: 'Male', banglaName: 'পুরুষ', displayOrder: 1, isActive: true },
    { id: 'lk-g2', type: 'Gender', code: 'Female', name: 'Female', banglaName: 'মহিলা', displayOrder: 2, isActive: true },
    { id: 'lk-g3', type: 'Gender', code: 'Other', name: 'Other', banglaName: 'অন্যান্য', displayOrder: 3, isActive: true },

    // Blood Groups
    { id: 'lk-b1', type: 'BloodGroup', code: 'A+', name: 'A Positive (A+)', displayOrder: 1, isActive: true },
    { id: 'lk-b2', type: 'BloodGroup', code: 'A-', name: 'A Negative (A-)', displayOrder: 2, isActive: true },
    { id: 'lk-b3', type: 'BloodGroup', code: 'B+', name: 'B Positive (B+)', displayOrder: 3, isActive: true },
    { id: 'lk-b4', type: 'BloodGroup', code: 'B-', name: 'B Negative (B-)', displayOrder: 4, isActive: true },
    { id: 'lk-b5', type: 'BloodGroup', code: 'O+', name: 'O Positive (O+)', displayOrder: 5, isActive: true },
    { id: 'lk-b6', type: 'BloodGroup', code: 'O-', name: 'O Negative (O-)', displayOrder: 6, isActive: true },
    { id: 'lk-b7', type: 'BloodGroup', code: 'AB+', name: 'AB Positive (AB+)', displayOrder: 7, isActive: true },
    { id: 'lk-b8', type: 'BloodGroup', code: 'AB-', name: 'AB Negative (AB-)', displayOrder: 8, isActive: true },

    // Religions
    { id: 'lk-r1', type: 'Religion', code: 'Islam', name: 'Islam', banglaName: 'ইসলাম', displayOrder: 1, isActive: true },
    { id: 'lk-r2', type: 'Religion', code: 'Hinduism', name: 'Hinduism', banglaName: 'হিন্দু', displayOrder: 2, isActive: true },
    { id: 'lk-r3', type: 'Religion', code: 'Christianity', name: 'Christianity', banglaName: 'খ্রিষ্টান', displayOrder: 3, isActive: true },
    { id: 'lk-r4', type: 'Religion', code: 'Buddhism', name: 'Buddhism', banglaName: 'বৌদ্ধ', displayOrder: 4, isActive: true },
    { id: 'lk-r5', type: 'Religion', code: 'Other', name: 'Other', banglaName: 'অন্যান্য', displayOrder: 5, isActive: true },

    // Guardian Relations
    { id: 'lk-rel1', type: 'GuardianRelation', code: 'Father', name: 'Father', banglaName: 'পিতা', displayOrder: 1, isActive: true },
    { id: 'lk-rel2', type: 'GuardianRelation', code: 'Mother', name: 'Mother', banglaName: 'মাতা', displayOrder: 2, isActive: true },
    { id: 'lk-rel3', type: 'GuardianRelation', code: 'Brother', name: 'Brother', banglaName: 'ভাই', displayOrder: 3, isActive: true },
    { id: 'lk-rel4', type: 'GuardianRelation', code: 'Sister', name: 'Sister', banglaName: 'বোন', displayOrder: 4, isActive: true },
    { id: 'lk-rel5', type: 'GuardianRelation', code: 'Uncle', name: 'Uncle', banglaName: 'চাচা/মামা', displayOrder: 5, isActive: true },
    { id: 'lk-rel6', type: 'GuardianRelation', code: 'Aunt', name: 'Aunt', banglaName: 'ফুফু/খালা', displayOrder: 6, isActive: true },
    { id: 'lk-rel7', type: 'GuardianRelation', code: 'Legal Guardian', name: 'Legal Guardian', banglaName: 'আইনগত অভিভাবক', displayOrder: 7, isActive: true },

    // Educational Qualifications
    { id: 'lk-q1', type: 'Qualification', code: 'BED', name: 'B.Ed (Bachelor of Education)', banglaName: 'বি.এড', displayOrder: 1, isActive: true },
    { id: 'lk-q2', type: 'Qualification', code: 'MED', name: 'M.Ed (Master of Education)', banglaName: 'এম.এড', displayOrder: 2, isActive: true },
    { id: 'lk-q3', type: 'Qualification', code: 'BSC', name: 'B.Sc / B.Sc (Hons)', banglaName: 'বি.এসসি (সম্মান)', displayOrder: 3, isActive: true },
    { id: 'lk-q4', type: 'Qualification', code: 'MSC', name: 'M.Sc (Master of Science)', banglaName: 'এম.এসসি', displayOrder: 4, isActive: true },
    { id: 'lk-q5', type: 'Qualification', code: 'BA', name: 'B.A / B.A (Hons)', banglaName: 'বি.এ (সম্মান)', displayOrder: 5, isActive: true },
    { id: 'lk-q6', type: 'Qualification', code: 'MA', name: 'M.A (Master of Arts)', banglaName: 'এম.এ', displayOrder: 6, isActive: true },
    { id: 'lk-q7', type: 'Qualification', code: 'BCOM', name: 'B.Com / BBA', banglaName: 'বিবিএ / বি.কম', displayOrder: 7, isActive: true },
    { id: 'lk-q8', type: 'Qualification', code: 'MCOM', name: 'M.Com / MBA', banglaName: 'এমবিএ / এম.কম', displayOrder: 8, isActive: true },
    { id: 'lk-q9', type: 'Qualification', code: 'PHD', name: 'Ph.D (Doctor of Philosophy)', banglaName: 'পিএইচ.ডি', displayOrder: 9, isActive: true },
    { id: 'lk-q10', type: 'Qualification', code: 'FAZIL', name: 'Fazil / Kamil (Madrasah)', banglaName: 'ফাজিল / কামিল', displayOrder: 10, isActive: true },
    { id: 'lk-q11', type: 'Qualification', code: 'DIPLOMA', name: 'Diploma in Engineering / Education', banglaName: 'ডিপ্লোমা', displayOrder: 11, isActive: true },
    { id: 'lk-q12', type: 'Qualification', code: 'MSC_BED', name: 'M.Sc, B.Ed', banglaName: 'এম.এসসি, বি.এড', displayOrder: 12, isActive: true },
    { id: 'lk-q13', type: 'Qualification', code: 'BSC_BED', name: 'B.Sc, B.Ed', banglaName: 'বি.এসসি, বি.এড', displayOrder: 13, isActive: true },
    { id: 'lk-q14', type: 'Qualification', code: 'MA_BED', name: 'M.A, B.Ed', banglaName: 'এম.এ, বি.এড', displayOrder: 14, isActive: true }
  ];

  // Observables
  private shifts$ = new BehaviorSubject<AcademicShift[]>(this.loadStorage('master_shifts', this.defaultShifts));
  private admissionCategories$ = new BehaviorSubject<AdmissionCategory[]>(this.loadStorage('master_categories', this.defaultAdmissionCategories));
  private departments$ = new BehaviorSubject<Department[]>(this.loadStorage('master_departments', this.defaultDepartments));
  private designations$ = new BehaviorSubject<Designation[]>(this.loadStorage('master_designations', this.defaultDesignations));
  private gradingScales$ = new BehaviorSubject<GradingScale[]>(this.loadStorage('master_grading_scales', this.defaultGradingScales));
  private lookups$ = new BehaviorSubject<MasterLookupItem[]>(this.loadStorage('master_lookups', this.defaultLookups));

  // Getters
  getShifts$() { return this.shifts$.asObservable(); }
  getAdmissionCategories$() { return this.admissionCategories$.asObservable(); }
  getDepartments$() { return this.departments$.asObservable(); }
  getDesignations$() { return this.designations$.asObservable(); }
  getGradingScales$() { return this.gradingScales$.asObservable(); }
  getLookups$() { return this.lookups$.asObservable(); }

  getShifts(): AcademicShift[] { return this.shifts$.value; }
  getAdmissionCategories(): AdmissionCategory[] { return this.admissionCategories$.value; }
  getDepartments(): Department[] { return this.departments$.value; }
  getDesignations(): Designation[] { return this.designations$.value; }
  getGradingScales(): GradingScale[] { return this.gradingScales$.value; }
  getLookups(type?: MasterLookupItem['type']): MasterLookupItem[] {
    const all = this.lookups$.value;
    return type ? all.filter(item => item.type === type) : all;
  }

  // --- Shift CRUD ---
  async addShift(item: Partial<AcademicShift>): Promise<AcademicShift> {
    const newItem: AcademicShift = {
      id: 'shf-' + Math.random().toString(36).substring(2, 9),
      code: item.code || ('SHF-' + (this.shifts$.value.length + 1)),
      name: item.name || 'New Shift',
      banglaName: item.banglaName || '',
      startTime: item.startTime || '08:00 AM',
      endTime: item.endTime || '01:00 PM',
      isActive: item.isActive !== false,
      description: item.description || ''
    };
    const updated = [...this.shifts$.value, newItem];
    this.shifts$.next(updated);
    this.saveStorage('master_shifts', updated);
    return newItem;
  }

  async updateShift(id: string, patch: Partial<AcademicShift>): Promise<AcademicShift> {
    const updated = this.shifts$.value.map(s => s.id === id ? { ...s, ...patch } as AcademicShift : s);
    this.shifts$.next(updated);
    this.saveStorage('master_shifts', updated);
    return updated.find(s => s.id === id)!;
  }

  async deleteShift(id: string): Promise<boolean> {
    const updated = this.shifts$.value.filter(s => s.id !== id);
    this.shifts$.next(updated);
    this.saveStorage('master_shifts', updated);
    return true;
  }

  // --- Admission Category CRUD ---
  async addAdmissionCategory(item: Partial<AdmissionCategory>): Promise<AdmissionCategory> {
    const newItem: AdmissionCategory = {
      id: 'cat-' + Math.random().toString(36).substring(2, 9),
      code: item.code || ('CAT-' + (this.admissionCategories$.value.length + 1)),
      name: item.name || 'New Category',
      banglaName: item.banglaName || '',
      quotaPercentage: item.quotaPercentage || 0,
      discountPercentage: item.discountPercentage || 0,
      isActive: item.isActive !== false,
      remarks: item.remarks || ''
    };
    const updated = [...this.admissionCategories$.value, newItem];
    this.admissionCategories$.next(updated);
    this.saveStorage('master_categories', updated);
    return newItem;
  }

  async updateAdmissionCategory(id: string, patch: Partial<AdmissionCategory>): Promise<AdmissionCategory> {
    const updated = this.admissionCategories$.value.map(c => c.id === id ? { ...c, ...patch } as AdmissionCategory : c);
    this.admissionCategories$.next(updated);
    this.saveStorage('master_categories', updated);
    return updated.find(c => c.id === id)!;
  }

  async deleteAdmissionCategory(id: string): Promise<boolean> {
    const updated = this.admissionCategories$.value.filter(c => c.id !== id);
    this.admissionCategories$.next(updated);
    this.saveStorage('master_categories', updated);
    return true;
  }

  // --- Department CRUD ---
  async addDepartment(item: Partial<Department>): Promise<Department> {
    const newItem: Department = {
      id: 'dept-' + Math.random().toString(36).substring(2, 9),
      code: item.code || ('DPT-' + (this.departments$.value.length + 1)),
      name: item.name || 'New Department',
      headTeacherName: item.headTeacherName || '',
      teacherCount: item.teacherCount || 0,
      isActive: item.isActive !== false,
      description: item.description || ''
    };
    const updated = [...this.departments$.value, newItem];
    this.departments$.next(updated);
    this.saveStorage('master_departments', updated);
    return newItem;
  }

  async updateDepartment(id: string, patch: Partial<Department>): Promise<Department> {
    const updated = this.departments$.value.map(d => d.id === id ? { ...d, ...patch } as Department : d);
    this.departments$.next(updated);
    this.saveStorage('master_departments', updated);
    return updated.find(d => d.id === id)!;
  }

  async deleteDepartment(id: string): Promise<boolean> {
    const updated = this.departments$.value.filter(d => d.id !== id);
    this.departments$.next(updated);
    this.saveStorage('master_departments', updated);
    return true;
  }

  // --- Designation CRUD ---
  async addDesignation(item: Partial<Designation>): Promise<Designation> {
    const newItem: Designation = {
      id: 'des-' + Math.random().toString(36).substring(2, 9),
      code: item.code || ('DES-' + (this.designations$.value.length + 1)),
      title: item.title || 'New Designation',
      category: item.category || 'Teaching',
      rankOrder: item.rankOrder || (this.designations$.value.length + 1),
      isActive: item.isActive !== false
    };
    const updated = [...this.designations$.value, newItem];
    this.designations$.next(updated);
    this.saveStorage('master_designations', updated);
    return newItem;
  }

  async updateDesignation(id: string, patch: Partial<Designation>): Promise<Designation> {
    const updated = this.designations$.value.map(d => d.id === id ? { ...d, ...patch } as Designation : d);
    this.designations$.next(updated);
    this.saveStorage('master_designations', updated);
    return updated.find(d => d.id === id)!;
  }

  async deleteDesignation(id: string): Promise<boolean> {
    const updated = this.designations$.value.filter(d => d.id !== id);
    this.designations$.next(updated);
    this.saveStorage('master_designations', updated);
    return true;
  }

  // --- Grading Scale CRUD ---
  async addGradingScale(item: Partial<GradingScale>): Promise<GradingScale> {
    const newItem: GradingScale = {
      id: 'grd-' + Math.random().toString(36).substring(2, 9),
      letterGrade: item.letterGrade || 'P',
      gradePoint: item.gradePoint ?? 1.0,
      minMarks: item.minMarks ?? 33,
      maxMarks: item.maxMarks ?? 39,
      remarks: item.remarks || '',
      isPassing: item.isPassing !== false
    };
    const updated = [...this.gradingScales$.value, newItem];
    this.gradingScales$.next(updated);
    this.saveStorage('master_grading_scales', updated);
    return newItem;
  }

  async updateGradingScale(id: string, patch: Partial<GradingScale>): Promise<GradingScale> {
    const updated = this.gradingScales$.value.map(g => g.id === id ? { ...g, ...patch } as GradingScale : g);
    this.gradingScales$.next(updated);
    this.saveStorage('master_grading_scales', updated);
    return updated.find(g => g.id === id)!;
  }

  async deleteGradingScale(id: string): Promise<boolean> {
    const updated = this.gradingScales$.value.filter(g => g.id !== id);
    this.gradingScales$.next(updated);
    this.saveStorage('master_grading_scales', updated);
    return true;
  }

  // --- Lookup Items CRUD ---
  async addLookupItem(item: Partial<MasterLookupItem>): Promise<MasterLookupItem> {
    const newItem: MasterLookupItem = {
      id: 'lk-' + Math.random().toString(36).substring(2, 9),
      type: item.type || 'Religion',
      code: item.code || item.name || 'NEW',
      name: item.name || 'New Item',
      banglaName: item.banglaName || '',
      displayOrder: item.displayOrder || (this.lookups$.value.length + 1),
      isActive: item.isActive !== false
    };
    const updated = [...this.lookups$.value, newItem];
    this.lookups$.next(updated);
    this.saveStorage('master_lookups', updated);
    return newItem;
  }

  async updateLookupItem(id: string, patch: Partial<MasterLookupItem>): Promise<MasterLookupItem> {
    const updated = this.lookups$.value.map(l => l.id === id ? { ...l, ...patch } as MasterLookupItem : l);
    this.lookups$.next(updated);
    this.saveStorage('master_lookups', updated);
    return updated.find(l => l.id === id)!;
  }

  async deleteLookupItem(id: string): Promise<boolean> {
    const updated = this.lookups$.value.filter(l => l.id !== id);
    this.lookups$.next(updated);
    this.saveStorage('master_lookups', updated);
    return true;
  }

  // --- Helpers for Admission Lookups ---
  getShiftLookupOptions(): LookupOption[] {
    return this.shifts$.value
      .filter(s => s.isActive)
      .map(s => ({
        id: s.name,
        label: `${s.name} (${s.startTime} - ${s.endTime})`,
        description: s.description
      }));
  }

  getAdmissionCategoryLookupOptions(): LookupOption[] {
    return this.admissionCategories$.value
      .filter(c => c.isActive)
      .map(c => ({
        id: c.name,
        label: `${c.name} ${c.discountPercentage ? `[${c.discountPercentage}% Waiver]` : ''}`,
        description: c.remarks
      }));
  }

  // Local storage helpers
  private loadStorage<T>(key: string, defaultVal: T): T {
    try {
      const stored = localStorage.getItem(`sma_${key}`);
      return stored ? JSON.parse(stored) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private saveStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`sma_${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn(`Error writing to local storage key ${key}:`, e);
    }
  }
}
