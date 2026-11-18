import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { Student, AdmissionLookups, LookupOption, DivisionLookup } from '../../models';
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
export class StudentStoreService {
  private http = inject(HttpClient);
  private campus = inject(CampusSessionService);
  private readonly API_BASE = '/api/v1';

  private students$ = new BehaviorSubject<Student[]>([]);

  getStudents$() { return this.students$.asObservable(); }
  getStudents(classId?: string, sectionId?: string): Student[] {
    let list = this.students$.value;
    if (classId) list = list.filter(s => s.classId === classId);
    if (sectionId) list = list.filter(s => s.sectionId === sectionId);
    return list;
  }

  getStudentById(id: string): Student | undefined {
    return this.students$.value.find(s => s.id === id);
  }

  setStudents(students: Student[]) {
    this.students$.next(students);
  }

  clear() {
    this.students$.next([]);
  }

  async loadStudents(classId?: string, sectionId?: string, search?: string): Promise<Student[]> {
    let url = `${this.API_BASE}/students?`;
    const params: string[] = [];
    if (classId) params.push(`classId=${encodeURIComponent(classId)}`);
    if (sectionId) params.push(`sectionId=${encodeURIComponent(sectionId)}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    url += params.join('&');

    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<Student[]>>(url));
      if (res?.success && res.data) {
        this.students$.next(res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('StudentStore loadStudents error:', e);
    }
    return this.students$.value;
  }

  async addStudent(student: Partial<Student>): Promise<Student> {
    const admissionPayload = {
      fullName: student.fullName,
      banglaName: student.banglaName,
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString() : new Date('2010-01-01').toISOString(),
      gender: student.gender || 'Male',
      bloodGroup: student.bloodGroup || 'A+',
      religion: student.religion || 'Islam',
      email: student.email || `${student.fullName?.toLowerCase().replace(/\s+/g, '')}@student.school.com`,
      phone: student.phone || '+880 1700-000000',
      presentAddress: student.presentAddress || 'Dhaka',
      permanentAddress: student.permanentAddress || 'Bangladesh',
      photoUrl: student.photoUrl,
      guardianName: student.guardianName,
      guardianRelation: student.guardianRelation || 'Father',
      guardianPhone: student.guardianPhone,
      guardianOccupation: student.guardianOccupation,
      guardianIncome: student.guardianIncome,
      fatherName: student.fatherName,
      fatherPhone: student.fatherPhone,
      fatherOccupation: student.fatherOccupation,
      fatherNid: student.fatherNid,
      motherName: student.motherName,
      motherPhone: student.motherPhone,
      motherOccupation: student.motherOccupation,
      motherNid: student.motherNid,
      nationality: student.nationality || 'Bangladeshi',
      previousSchool: student.previousSchool,
      division: student.division,
      district: student.district,
      upazila: student.upazila,
      emergencyContactName: student.emergencyContactName,
      emergencyContactPhone: student.emergencyContactPhone,
      emergencyContactRelation: student.emergencyContactRelation,
      shift: student.shift || 'Morning',
      admissionCategory: student.admissionCategory || 'Regular',
      lastClassPassed: student.lastClassPassed,
      lastPassingYear: student.lastPassingYear,
      lastGpaMarks: student.lastGpaMarks,
      tcNumber: student.tcNumber,
      coCurricular: student.coCurricular,
      medicalNotes: student.medicalNotes,
      isHostel: !!student.isHostel,
      isTransport: !!student.isTransport,
      classId: student.classId || '',
      sectionId: student.sectionId || '',
      academicYearId: student.academicYearId || undefined,
      rollNo: student.rollNo || undefined,
      status: student.status || 'Active'
    };

    try {
      const res = await firstValueFrom(this.http.post<ApiResponse<Student>>(`${this.API_BASE}/students/admissions`, admissionPayload));
      if (res?.success && res.data) {
        const updated = [res.data, ...this.students$.value.filter(s => s.id !== res.data.id)];
        this.students$.next(updated);
        return res.data;
      }
    } catch (e: any) {
      console.warn('Backend admission failed:', e);
      if (!environment.enableMockFallback) {
        const errorMsg = e?.error?.message || e?.message || 'Admission failed on server.';
        throw new Error(errorMsg);
      }
    }

    const fallbackStudent: Student = {
      id: 'std-' + (1000 + this.students$.value.length + 1),
      admissionNo: `ADM-2026-${String(this.students$.value.length + 1).padStart(3, '0')}`,
      fullName: student.fullName || '',
      banglaName: student.banglaName || '',
      dateOfBirth: student.dateOfBirth || '2010-01-01',
      gender: student.gender || 'Male',
      bloodGroup: student.bloodGroup || 'A+',
      religion: student.religion || 'Islam',
      email: student.email || '',
      phone: student.phone || '',
      presentAddress: student.presentAddress || '',
      permanentAddress: student.permanentAddress || '',
      photoUrl: student.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      branchId: this.campus.branchId || 'br-01',
      guardianName: student.guardianName || '',
      guardianRelation: student.guardianRelation || 'Father',
      guardianPhone: student.guardianPhone || '',
      guardianOccupation: student.guardianOccupation || '',
      guardianIncome: student.guardianIncome || '',
      fatherName: student.fatherName || '',
      fatherPhone: student.fatherPhone || '',
      fatherOccupation: student.fatherOccupation || '',
      fatherNid: student.fatherNid || '',
      motherName: student.motherName || '',
      motherPhone: student.motherPhone || '',
      motherOccupation: student.motherOccupation || '',
      motherNid: student.motherNid || '',
      nationality: student.nationality || 'Bangladeshi',
      previousSchool: student.previousSchool || '',
      division: student.division || '',
      district: student.district || '',
      upazila: student.upazila || '',
      emergencyContactName: student.emergencyContactName || '',
      emergencyContactPhone: student.emergencyContactPhone || '',
      emergencyContactRelation: student.emergencyContactRelation || '',
      shift: student.shift || 'Morning',
      admissionCategory: student.admissionCategory || 'Regular',
      lastClassPassed: student.lastClassPassed || '',
      lastPassingYear: student.lastPassingYear || '',
      lastGpaMarks: student.lastGpaMarks || '',
      tcNumber: student.tcNumber || '',
      coCurricular: student.coCurricular || '',
      medicalNotes: student.medicalNotes || '',
      isHostel: !!student.isHostel,
      isTransport: !!student.isTransport,
      academicYearId: student.academicYearId || 'ay-2026',
      classId: student.classId || '',
      className: student.className || '',
      sectionId: student.sectionId || '',
      sectionName: student.sectionName || '',
      rollNo: student.rollNo || String(this.students$.value.length + 1).padStart(2, '0'),
      admissionDate: new Date().toISOString().split('T')[0],
      status: (student.status as any) || 'Active'
    };

    const updated = [fallbackStudent, ...this.students$.value];
    this.students$.next(updated);
    return fallbackStudent;
  }

  async updateStudent(id: string, updatedFields: Partial<Student>): Promise<Student> {
    const payload = {
      fullName: updatedFields.fullName,
      banglaName: updatedFields.banglaName,
      dateOfBirth: updatedFields.dateOfBirth ? new Date(updatedFields.dateOfBirth).toISOString() : undefined,
      gender: updatedFields.gender,
      bloodGroup: updatedFields.bloodGroup,
      religion: updatedFields.religion,
      email: updatedFields.email,
      phone: updatedFields.phone,
      presentAddress: updatedFields.presentAddress,
      permanentAddress: updatedFields.permanentAddress,
      photoUrl: updatedFields.photoUrl,
      guardianName: updatedFields.guardianName,
      guardianRelation: updatedFields.guardianRelation,
      guardianPhone: updatedFields.guardianPhone,
      guardianOccupation: updatedFields.guardianOccupation,
      guardianIncome: updatedFields.guardianIncome,
      fatherName: updatedFields.fatherName,
      fatherPhone: updatedFields.fatherPhone,
      fatherOccupation: updatedFields.fatherOccupation,
      fatherNid: updatedFields.fatherNid,
      motherName: updatedFields.motherName,
      motherPhone: updatedFields.motherPhone,
      motherOccupation: updatedFields.motherOccupation,
      motherNid: updatedFields.motherNid,
      nationality: updatedFields.nationality,
      previousSchool: updatedFields.previousSchool,
      division: updatedFields.division,
      district: updatedFields.district,
      upazila: updatedFields.upazila,
      emergencyContactName: updatedFields.emergencyContactName,
      emergencyContactPhone: updatedFields.emergencyContactPhone,
      emergencyContactRelation: updatedFields.emergencyContactRelation,
      shift: updatedFields.shift,
      admissionCategory: updatedFields.admissionCategory,
      lastClassPassed: updatedFields.lastClassPassed,
      lastPassingYear: updatedFields.lastPassingYear,
      lastGpaMarks: updatedFields.lastGpaMarks,
      tcNumber: updatedFields.tcNumber,
      coCurricular: updatedFields.coCurricular,
      medicalNotes: updatedFields.medicalNotes,
      isHostel: updatedFields.isHostel,
      isTransport: updatedFields.isTransport,
      classId: updatedFields.classId,
      sectionId: updatedFields.sectionId,
      rollNo: updatedFields.rollNo,
      status: updatedFields.status
    };

    try {
      const res = await firstValueFrom(this.http.put<ApiResponse<Student>>(`${this.API_BASE}/students/${id}`, payload));
      if (res?.success && res.data) {
        const list = this.students$.value.map(s => s.id === id ? res.data : s);
        this.students$.next(list);
        return res.data;
      }
    } catch (e: any) {
      console.warn('Backend updateStudent failed:', e);
      if (!environment.enableMockFallback) {
        const errorMsg = e?.error?.message || e?.message || 'Failed to update student on server.';
        throw new Error(errorMsg);
      }
    }

    const list = this.students$.value.map(s => s.id === id ? { ...s, ...updatedFields } as Student : s);
    this.students$.next(list);
    return list.find(s => s.id === id)!;
  }

  async updateStudentStatus(studentId: string, status: Student['status'], reason: string): Promise<void> {
    const payload = { status, reason: reason || `Status changed to ${status}` };
    try {
      const res = await firstValueFrom(this.http.put<ApiResponse<Student>>(`${this.API_BASE}/students/${studentId}/status`, payload));
      if (res?.success && res.data) {
        const list = this.students$.value.map(s => s.id === studentId ? { ...s, status: res.data.status } : s);
        this.students$.next(list);
        return;
      }
    } catch (e) {
      console.warn('Backend updateStudentStatus failed, updating local store:', e);
    }

    const list = this.students$.value.map(s => {
      if (s.id === studentId) {
        return { ...s, status };
      }
      return s;
    });
    this.students$.next(list);
  }

  async batchPromoteStudents(
    targetAcademicYearId: string,
    targetClassId: string,
    targetSectionId: string,
    promotions: Array<{
      studentId: string;
      newRollNo: string;
      targetClassId?: string;
      targetSectionId?: string;
      status?: string;
    }>
  ): Promise<boolean> {
    const payload = {
      targetAcademicYearId,
      targetClassId,
      targetSectionId,
      students: promotions
    };

    try {
      await firstValueFrom(this.http.post<ApiResponse<number>>(`${this.API_BASE}/students/batch-promote`, payload));
      return true;
    } catch (e: any) {
      console.warn('Backend batchPromote failed:', e);
      if (!environment.enableMockFallback) {
        const errorMsg = e?.error?.message || e?.message || 'Promotion failed on server.';
        throw new Error(errorMsg);
      }
    }
    return false;
  }

  async deleteStudent(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete<ApiResponse<boolean>>(`${this.API_BASE}/students/${id}`));
      this.students$.next(this.students$.value.filter(s => s.id !== id));
      return true;
    } catch (e: any) {
      console.warn('Backend deleteStudent failed:', e);
      if (!environment.enableMockFallback) {
        const errorMsg = e?.error?.message || e?.message || 'Failed to delete student on server.';
        throw new Error(errorMsg);
      }
    }
    this.students$.next(this.students$.value.filter(s => s.id !== id));
    return true;
  }

  downloadImportTemplate(): Observable<Blob> {
    return this.http.get(`${this.API_BASE}/students/import-template`, {
      responseType: 'blob'
    });
  }

  async bulkImportStudents(file: File, classId: string, sectionId: string, academicYearId?: string): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('classId', classId);
    formData.append('sectionId', sectionId);
    if (academicYearId) {
      formData.append('academicYearId', academicYearId);
    }

    const res = await firstValueFrom(this.http.post<ApiResponse<any>>(`${this.API_BASE}/students/bulk-import`, formData));
    if (res?.success) {
      await this.loadStudents(classId, sectionId);
    }
    return res;
  }

  // --- Admission Lookups ---
  private admissionLookups$ = new BehaviorSubject<AdmissionLookups | null>(null);

  getAdmissionLookups$(): Observable<AdmissionLookups | null> {
    return this.admissionLookups$.asObservable();
  }

  async loadAdmissionLookups(): Promise<AdmissionLookups> {
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<AdmissionLookups>>(`${this.API_BASE}/students/admission-lookups`));
      if (res?.success && res.data) {
        this.admissionLookups$.next(res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('Backend loadAdmissionLookups failed, using defaults:', e);
    }
    const def = this.getDefaultAdmissionLookups();
    this.admissionLookups$.next(def);
    return def;
  }

  getDefaultAdmissionLookups(): AdmissionLookups {
    return {
      academicYears: [
        { id: 'ay-2025', label: '2024 – 2025' },
        { id: 'ay-2026', label: '2025 – 2026' },
        { id: 'ay-2027', label: '2026 – 2027', description: 'Current Session' }
      ],
      classes: [],
      genders: [
        { id: 'Male', label: 'Male' },
        { id: 'Female', label: 'Female' },
        { id: 'Other', label: 'Other' }
      ],
      bloodGroups: [
        { id: 'A+', label: 'A+' },
        { id: 'A-', label: 'A-' },
        { id: 'B+', label: 'B+' },
        { id: 'B-', label: 'B-' },
        { id: 'O+', label: 'O+' },
        { id: 'O-', label: 'O-' },
        { id: 'AB+', label: 'AB+' },
        { id: 'AB-', label: 'AB-' }
      ],
      religions: [
        { id: 'Islam', label: 'Islam' },
        { id: 'Hinduism', label: 'Hinduism' },
        { id: 'Christianity', label: 'Christianity' },
        { id: 'Buddhism', label: 'Buddhism' },
        { id: 'Other', label: 'Other' }
      ],
      nationalities: [
        { id: 'Bangladeshi', label: '🇧🇩 Bangladeshi' },
        { id: 'Other', label: '🌐 Other' }
      ],
      guardianRelations: [
        { id: 'Father', label: 'Father (পিতা)' },
        { id: 'Mother', label: 'Mother (মাতা)' },
        { id: 'Brother', label: 'Brother (ভাই)' },
        { id: 'Sister', label: 'Sister (বোন)' },
        { id: 'Uncle', label: 'Uncle (চাচা/মামা)' },
        { id: 'Aunt', label: 'Aunt (ফুফু/খালা)' },
        { id: 'Legal Guardian', label: 'Legal Guardian (আইনগত অভিভাবক)' },
        { id: 'Other', label: 'Other (অন্যান্য)' }
      ],
      admissionCategories: [
        { id: 'cat-01', label: 'General Admission (সাধারণ কোটা)' },
        { id: 'cat-02', label: 'Teacher / Staff Child (শিক্ষক ও স্টাফ সন্তান)' },
        { id: 'cat-03', label: 'Sibling Concession (সহোদর ভাই/বোন)' },
        { id: 'cat-04', label: 'Freedom Fighter Quota (বীর মুক্তিযোদ্ধা কোটা)' },
        { id: 'cat-05', label: 'Merit Scholarship (মেধা বৃত্তি কোটা)' },
        { id: 'cat-06', label: 'Special Needs / Inclusive (বিশেষ চাহিদা সম্পন্ন)' }
      ],
      academicShifts: [
        { id: 'shf-01', label: 'Morning Shift (প্রভাতী শাখা)' },
        { id: 'shf-02', label: 'Day Shift (দিবা শাখা)' }
      ],
      divisions: [
        {
          name: 'Dhaka',
          districts: [
            { name: 'Dhaka', upazilas: ['Dhanmondi', 'Gulshan', 'Mirpur', 'Mohammadpur', 'Uttara', 'Tejgaon', 'Badda', 'Motijheel', 'Khilgaon', 'Savar', 'Keraniganj', 'Dhamrai'] },
            { name: 'Gazipur', upazilas: ['Gazipur Sadar', 'Kaliakair', 'Kapasia', 'Sreepur', 'Kaliganj', 'Tongi'] },
            { name: 'Narayanganj', upazilas: ['Narayanganj Sadar', 'Araihazar', 'Bandar', 'Rupganj', 'Sonargaon'] },
            { name: 'Tangail', upazilas: ['Tangail Sadar', 'Gopalpur', 'Basail', 'Bhuapur', 'Delduar', 'Ghatail', 'Kalihati', 'Madhupur', 'Mirzapur', 'Nagarpur', 'Sakhipur'] }
          ]
        },
        {
          name: 'Chittagong',
          districts: [
            { name: 'Chittagong', upazilas: ['Kotwali', 'Panchlaish', 'Double Mooring', 'Halishahar', 'Agrabad', 'Hathazari', 'Raozan', 'Fatikchhari', 'Patiya', 'Sitakunda', 'Mirsharai'] },
            { name: 'Coxs Bazar', upazilas: ['Coxs Bazar Sadar', 'Chakaria', 'Maheshkhali', 'Teknaf', 'Ukhia', 'Ramu', 'Pekua'] }
          ]
        },
        {
          name: 'Rajshahi',
          districts: [
            { name: 'Rajshahi', upazilas: ['Boalia', 'Motihar', 'Rajpara', 'Shah Makhdum', 'Godagari', 'Paba', 'Tanore', 'Bagmara', 'Durgapur', 'Puthia', 'Charghat', 'Bagha'] },
            { name: 'Bogra', upazilas: ['Bogra Sadar', 'Adamdighi', 'Dhunat', 'Dupchanchia', 'Gabtali', 'Kahaloo', 'Nandigram', 'Sariakandi', 'Shajahanpur', 'Sherpur', 'Shibganj', 'Sonatola'] }
          ]
        },
        {
          name: 'Sylhet',
          districts: [
            { name: 'Sylhet', upazilas: ['Sylhet Sadar', 'Beanibazar', 'Golapganj', 'Companiganj', 'Fenchuganj', 'Balaganj', 'Biswanath', 'Gowainghat', 'Jaintiapur', 'Kanaighat', 'Zakiganj'] }
          ]
        }
      ]
    };
  }
}
