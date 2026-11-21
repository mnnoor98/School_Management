import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { Exam, ExamScheduleItem, ExamMark, StudentMarksheet, Student, Subject, AdmitCard } from '../../models';
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
export class ExamStoreService {
  private http = inject(HttpClient);
  private campus = inject(CampusSessionService);
  private readonly API_BASE = '/api/v1';

  private exams$ = new BehaviorSubject<Exam[]>([]);
  private examSchedules$ = new BehaviorSubject<ExamScheduleItem[]>([]);
  private marks$ = new BehaviorSubject<ExamMark[]>([]);

  getExams$() { return this.exams$.asObservable(); }
  getExamSchedules$() { return this.examSchedules$.asObservable(); }
  getMarks$() { return this.marks$.asObservable(); }

  getExams(): Exam[] { return this.exams$.value; }
  getExamSchedules(examId?: string, classId?: string): ExamScheduleItem[] {
    let list = this.examSchedules$.value;
    if (examId) list = list.filter(s => s.examId === examId);
    if (classId) list = list.filter(s => s.classId === classId);
    return list;
  }
  getExamMarks(examId: string, classId?: string, subjectId?: string, sectionId?: string): ExamMark[] {
    return this.marks$.value.filter(
      m => m.examId === examId &&
        (!classId || m.classId === classId) &&
        (!subjectId || m.subjectId === subjectId) &&
        (!sectionId || !m.sectionId || m.sectionId === sectionId)
    );
  }

  setExams(exams: Exam[]) { this.exams$.next(exams); }
  setExamSchedules(schedules: ExamScheduleItem[]) { this.examSchedules$.next(schedules); }
  setMarks(marks: ExamMark[]) { this.marks$.next(marks); }

  clear() {
    this.exams$.next([]);
    this.examSchedules$.next([]);
    this.marks$.next([]);
  }

  async loadExams(): Promise<Exam[]> {
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<Exam[]>>(`${this.API_BASE}/exams`));
      if (res?.success && res.data) {
        this.exams$.next(res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('ExamStore loadExams error:', e);
    }
    return this.exams$.value;
  }

  createExam(examData: Partial<Exam>): Exam {
    const newExam: Exam = {
      id: 'ex-' + Date.now().toString().slice(-6),
      name: examData.name || 'New Examination Term',
      term: examData.term || 'First Term',
      academicYear: examData.academicYear || '2026 - 2027',
      startDate: examData.startDate || new Date().toISOString().split('T')[0],
      endDate: examData.endDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      isPublished: !!examData.isPublished,
      branchId: this.campus.branchId || 'br-01',
      code: examData.code,
      instructions: examData.instructions
    };

    this.http.post<ApiResponse<Exam>>(`${this.API_BASE}/exams`, {
      name: newExam.name,
      term: newExam.term,
      academicYear: newExam.academicYear,
      startDate: new Date(newExam.startDate).toISOString(),
      endDate: new Date(newExam.endDate).toISOString(),
      isPublished: newExam.isPublished
    }).subscribe({
      next: res => {
        if (res?.success && res.data) {
          const updated = this.exams$.value.map(e => e.id === newExam.id ? { ...e, id: res.data.id } : e);
          this.exams$.next(updated);
        }
      }
    });

    const updated = [newExam, ...this.exams$.value];
    this.exams$.next(updated);
    return newExam;
  }

  updateExam(id: string, examData: Partial<Exam>): Exam | null {
    const list = [...this.exams$.value];
    const idx = list.findIndex(e => e.id === id);
    if (idx === -1) return null;

    const updatedExam: Exam = {
      ...list[idx],
      ...examData
    };
    list[idx] = updatedExam;
    this.exams$.next(list);

    this.http.put<ApiResponse<Exam>>(`${this.API_BASE}/exams/${id}`, {
      name: updatedExam.name,
      term: updatedExam.term,
      academicYear: updatedExam.academicYear,
      startDate: new Date(updatedExam.startDate).toISOString(),
      endDate: new Date(updatedExam.endDate).toISOString(),
      isPublished: updatedExam.isPublished
    }).subscribe();

    return updatedExam;
  }

  toggleExamPublish(id: string): Exam | null {
    const list = [...this.exams$.value];
    const idx = list.findIndex(e => e.id === id);
    if (idx === -1) return null;

    list[idx] = { ...list[idx], isPublished: !list[idx].isPublished };
    this.exams$.next(list);

    this.http.put<ApiResponse<boolean>>(`${this.API_BASE}/exams/${id}/toggle-publish`, {}).subscribe();
    return list[idx];
  }

  deleteExam(id: string): boolean {
    const list = this.exams$.value.filter(e => e.id !== id);
    this.exams$.next(list);

    const schedules = this.examSchedules$.value.filter(s => s.examId !== id);
    this.examSchedules$.next(schedules);

    this.http.delete<ApiResponse<boolean>>(`${this.API_BASE}/exams/${id}`).subscribe();
    return true;
  }

  // --- Schedules ---
  async loadExamSchedules(): Promise<ExamScheduleItem[]> {
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<ExamScheduleItem[]>>(`${this.API_BASE}/exams/schedules`));
      if (res?.success && res.data) {
        this.examSchedules$.next(res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('ExamStore loadExamSchedules error:', e);
    }
    return this.examSchedules$.value;
  }

  addExamSchedule(schedule: Partial<ExamScheduleItem>): ExamScheduleItem {
    const newItem: ExamScheduleItem = {
      id: 'ex-sch-' + Date.now().toString().slice(-5),
      examId: schedule.examId || '',
      classId: schedule.classId || '',
      className: schedule.className || '',
      subjectId: schedule.subjectId || '',
      subjectName: schedule.subjectName || '',
      examDate: schedule.examDate || new Date().toISOString().split('T')[0],
      day: schedule.day || 'Sunday',
      startTime: schedule.startTime || '10:00 AM',
      endTime: schedule.endTime || '01:00 PM',
      roomNo: schedule.roomNo || 'Room 101',
      fullMarks: schedule.fullMarks || 100,
      passMarks: schedule.passMarks || 33,
      branchId: this.campus.branchId || 'br-01'
    };

    this.http.post<ApiResponse<ExamScheduleItem>>(`${this.API_BASE}/exams/schedules`, {
      examId: newItem.examId,
      classId: newItem.classId,
      className: newItem.className,
      subjectId: newItem.subjectId,
      subjectName: newItem.subjectName,
      examDate: new Date(newItem.examDate).toISOString(),
      day: newItem.day,
      startTime: newItem.startTime,
      endTime: newItem.endTime,
      roomNo: newItem.roomNo,
      fullMarks: newItem.fullMarks,
      passMarks: newItem.passMarks
    }).subscribe({
      next: res => {
        if (res?.success && res.data) {
          const updated = this.examSchedules$.value.map(s => s.id === newItem.id ? res.data : s);
          this.examSchedules$.next(updated);
        }
      },
      error: err => {
        // Rollback optimistic addition if server rejects (e.g. duplicate or clash)
        const rollback = this.examSchedules$.value.filter(s => s.id !== newItem.id);
        this.examSchedules$.next(rollback);
      }
    });

    const updated = [...this.examSchedules$.value, newItem];
    this.examSchedules$.next(updated);
    return newItem;
  }

  deleteExamSchedule(id: string): boolean {
    this.http.delete<ApiResponse<boolean>>(`${this.API_BASE}/exams/schedules/${id}`).subscribe();
    const updated = this.examSchedules$.value.filter(s => s.id !== id);
    this.examSchedules$.next(updated);
    return true;
  }

  // --- Marks ---
  saveExamMarks(marks: ExamMark[]): void {
    if (!marks || marks.length === 0) return;

    if (marks.length > 0) {
      this.http.post(`${this.API_BASE}/exams/${marks[0].examId}/marks`, {
        examId: marks[0].examId,
        classId: marks[0].classId,
        sectionId: marks[0].sectionId,
        subjectId: marks[0].subjectId,
        marks: marks.map(m => ({
          studentId: m.studentId,
          studentName: m.studentName,
          rollNo: m.rollNo,
          obtainedMarks: m.obtainedMarks,
          theoryMarks: m.theoryMarks ?? 0,
          mcqMarks: m.mcqMarks ?? 0,
          practicalMarks: m.practicalMarks ?? 0,
          isAbsent: !!m.isAbsent,
          remark: m.remark || ''
        }))
      }).subscribe({
        error: (err) => console.warn('Backend marks sync notice:', err)
      });
    }

    const current = [...this.marks$.value];
    for (const m of marks) {
      const idx = current.findIndex(c => c.examId === m.examId && c.studentId === m.studentId && c.subjectId === m.subjectId);
      const record: ExamMark = {
        ...m,
        id: idx > -1 && current[idx].id ? current[idx].id : ('mk-' + Date.now() + Math.random().toString(36).substring(2, 6)),
        branchId: m.branchId || this.campus.branchId || 'br-01'
      };

      if (idx > -1) {
        current[idx] = record;
      } else {
        current.push(record);
      }
    }

    this.marks$.next(current);
  }

  async saveExamMarksAsync(marks: ExamMark[]): Promise<boolean> {
    if (!marks || marks.length === 0) return true;

    const payload = {
      examId: marks[0].examId,
      classId: marks[0].classId,
      sectionId: marks[0].sectionId || '',
      subjectId: marks[0].subjectId,
      marks: marks.map(m => ({
        studentId: m.studentId,
        studentName: m.studentName,
        rollNo: m.rollNo,
        obtainedMarks: m.obtainedMarks,
        theoryMarks: m.theoryMarks ?? 0,
        mcqMarks: m.mcqMarks ?? 0,
        practicalMarks: m.practicalMarks ?? 0,
        isAbsent: !!m.isAbsent,
        remark: m.remark || ''
      }))
    };

    try {
      const res = await firstValueFrom(
        this.http.post<ApiResponse<boolean>>(`${this.API_BASE}/exams/${marks[0].examId}/marks`, payload)
      );

      // Update local cache
      const current = [...this.marks$.value];
      for (const m of marks) {
        const idx = current.findIndex(c => c.examId === m.examId && c.studentId === m.studentId && c.subjectId === m.subjectId);
        const record: ExamMark = {
          ...m,
          id: idx > -1 && current[idx].id ? current[idx].id : ('mk-' + Date.now() + Math.random().toString(36).substring(2, 6)),
          branchId: m.branchId || this.campus.branchId || 'br-01'
        };

        if (idx > -1) {
          current[idx] = record;
        } else {
          current.push(record);
        }
      }
      this.marks$.next(current);

      return res?.success ?? true;
    } catch (e: any) {
      console.error('Error saving exam marks to server:', e);
      throw e;
    }
  }

  getStudentMarksheet(student: Student, exam: Exam, subjects?: Subject[]): StudentMarksheet | null {
    if (!student || !exam) return null;

    const studentMarksRaw = this.marks$.value.filter(m => m.studentId === student.id && m.examId === exam.id);
    const subMap = new Map<string, ExamMark>();
    studentMarksRaw.forEach(m => {
      const key = (m.subjectId || m.subjectName || '').trim().toLowerCase();
      if (!subMap.has(key)) {
        subMap.set(key, m);
      }
    });
    const studentMarks = Array.from(subMap.values());

    if (studentMarks.length === 0) {
      return {
        student,
        examName: exam.name,
        academicYear: exam.academicYear,
        marks: [],
        totalMarks: 0,
        totalObtained: 0,
        gpa: 0,
        letterGrade: 'N/A',
        remarks: 'No assessment marks submitted yet for this examination.',
        positionInClass: 0
      };
    }

    const totalMarks = studentMarks.reduce((sum, m) => sum + (m.fullMarks || 100), 0);
    const totalObtained = studentMarks.reduce((sum, m) => sum + m.obtainedMarks, 0);
    const hasFail = studentMarks.some(m => !m.isPass || m.grade === 'F' || m.isAbsent || m.obtainedMarks < 33);
    const totalGP = studentMarks.reduce((sum, m) => sum + (m.gradePoint || 0), 0);
    const gpa = hasFail ? 0.0 : (studentMarks.length > 0 ? Number((totalGP / studentMarks.length).toFixed(2)) : 0.0);
    const letterGrade = hasFail ? 'F' : (gpa >= 5.0 ? 'A+' : gpa >= 4.0 ? 'A' : gpa >= 3.5 ? 'A-' : gpa >= 3.0 ? 'B' : gpa >= 2.0 ? 'C' : gpa >= 1.0 ? 'D' : 'F');
    const remarks = hasFail
      ? 'Did not achieve minimum passing marks in all subjects. Requires remedial examination.'
      : (gpa >= 5.0 ? 'Exceptional academic performance with GPA 5.00 (Golden / Top Honors).' :
         gpa >= 4.0 ? 'Outstanding academic excellence and top class honors.' :
         gpa >= 3.5 ? 'Very good academic standing with steady consistency.' :
         gpa >= 3.0 ? 'Good academic progress with room for improvement.' : 'Passed with minimum grade threshold.');

    return {
      student,
      examName: exam.name,
      academicYear: exam.academicYear,
      marks: studentMarks,
      totalMarks,
      totalObtained,
      gpa,
      letterGrade,
      remarks,
      positionInClass: 1
    };
  }

  async fetchStudentMarksheet(examId: string, studentId: string): Promise<StudentMarksheet | null> {
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<StudentMarksheet>>(`${this.API_BASE}/exams/${examId}/students/${studentId}/marksheet`));
      if (res?.success && res.data) {
        return res.data;
      }
    } catch (e) {
      console.warn('Backend fetchStudentMarksheet notice:', e);
    }
    return null;
  }

  async fetchClassMarksheet(examId: string, classId: string, sectionId?: string): Promise<StudentMarksheet[]> {
    let url = `${this.API_BASE}/exams/${examId}/classes/${classId}/marksheet`;
    if (sectionId && sectionId !== 'ALL') {
      url += `?sectionId=${encodeURIComponent(sectionId)}`;
    }
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<StudentMarksheet[]>>(url));
      if (res?.success && res.data) {
        return res.data;
      }
    } catch (e) {
      console.warn('Backend fetchClassMarksheet notice:', e);
    }
    return [];
  }

  async fetchExamMarks(examId: string, classId?: string, sectionId?: string, subjectId?: string): Promise<ExamMark[]> {
    let url = `${this.API_BASE}/exams/${examId}/marks?`;
    const params: string[] = [];
    if (classId && classId !== 'ALL') params.push(`classId=${encodeURIComponent(classId)}`);
    if (sectionId && sectionId !== 'ALL') params.push(`sectionId=${encodeURIComponent(sectionId)}`);
    if (subjectId && subjectId !== 'ALL') params.push(`subjectId=${encodeURIComponent(subjectId)}`);
    url += params.join('&');

    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<ExamMark[]>>(url));
      if (res?.success && res.data) {
        const current = [...this.marks$.value.filter(m => !(m.examId === examId && (!classId || m.classId === classId) && (!sectionId || m.sectionId === sectionId) && (!subjectId || m.subjectId === subjectId)))];
        current.push(...res.data);
        this.marks$.next(current);
        return res.data;
      }
    } catch (e) {
      console.warn('Error fetching exam marks from backend:', e);
    }
    return this.getExamMarks(examId, classId, subjectId, sectionId);
  }

  downloadMarksTemplate(examId: string, classId: string, sectionId: string, subjectId: string): Observable<Blob> {
    return this.http.get(
      `${this.API_BASE}/exams/${examId}/marks-template?classId=${encodeURIComponent(classId)}&sectionId=${encodeURIComponent(sectionId)}&subjectId=${encodeURIComponent(subjectId)}`,
      { responseType: 'blob' }
    );
  }

  async bulkUploadMarks(examId: string, file: File, classId: string, sectionId: string, subjectId: string): Promise<ApiResponse<number>> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('classId', classId);
    formData.append('sectionId', sectionId);
    formData.append('subjectId', subjectId);

    const res = await firstValueFrom(this.http.post<ApiResponse<number>>(`${this.API_BASE}/exams/${examId}/marks-bulk-upload`, formData));
    if (res?.success) {
      await this.fetchExamMarks(examId, classId, sectionId, subjectId);
    }
    return res;
  }

  async loadAdmitCards(examId: string, classId?: string, sectionId?: string, studentId?: string): Promise<AdmitCard[]> {
    let url = `${this.API_BASE}/exams/${examId}/admit-cards?`;
    const params: string[] = [];
    if (classId && classId !== 'ALL') params.push(`classId=${encodeURIComponent(classId)}`);
    if (sectionId && sectionId !== 'ALL') params.push(`sectionId=${encodeURIComponent(sectionId)}`);
    if (studentId) params.push(`studentId=${encodeURIComponent(studentId)}`);
    url += params.join('&');

    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<AdmitCard[]>>(url));
      return res?.data || [];
    } catch (e) {
      console.warn('Error fetching admit cards from backend:', e);
      return [];
    }
  }
}
