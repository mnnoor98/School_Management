import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { SchoolClass, Section, Subject, RoutinePeriod, AcademicYear } from '../../models';
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
export class AcademicStoreService {
  private http = inject(HttpClient);
  private campus = inject(CampusSessionService);
  private readonly API_BASE = '/api/v1';

  private loadStorage<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(`sms_${this.campus.branchId || 'global'}_${key}`);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private saveStorage<T>(key: string, data: T): void {
    try {
      localStorage.setItem(`sms_${this.campus.branchId || 'global'}_${key}`, JSON.stringify(data));
    } catch {}
  }

  private classes$ = new BehaviorSubject<SchoolClass[]>(this.loadStorage('academic_classes', []));
  private sections$ = new BehaviorSubject<Section[]>(this.loadStorage('academic_sections', []));
  private subjects$ = new BehaviorSubject<Subject[]>(this.loadStorage('academic_subjects', []));
  private routine$ = new BehaviorSubject<RoutinePeriod[]>(this.loadStorage('academic_routine', []));
  private academicYears$ = new BehaviorSubject<AcademicYear[]>(this.loadStorage('academic_years', []));

  // Observables
  getClasses$() { return this.classes$.asObservable(); }
  getSections$() { return this.sections$.asObservable(); }
  getSubjects$() { return this.subjects$.asObservable(); }
  getRoutine$() { return this.routine$.asObservable(); }
  getAcademicYears$() { return this.academicYears$.asObservable(); }

  // Snapshot values
  getClasses(): SchoolClass[] { return this.classes$.value; }
  getSections(classId?: string): Section[] {
    return classId ? this.sections$.value.filter(s => s.classId === classId) : this.sections$.value;
  }
  getSubjects(): Subject[] { return this.subjects$.value; }
  getRoutine(): RoutinePeriod[] { return this.routine$.value; }
  getAcademicYears(): AcademicYear[] { return this.academicYears$.value; }

  setClasses(data: SchoolClass[]) { this.classes$.next(data); }
  setSections(data: Section[]) { this.sections$.next(data); }
  setSubjects(data: Subject[]) { this.subjects$.next(data); }
  setRoutine(data: RoutinePeriod[]) { this.routine$.next(data); }
  setAcademicYears(data: AcademicYear[]) { this.academicYears$.next(data); }

  clear() {
    this.classes$.next([]);
    this.sections$.next([]);
    this.subjects$.next([]);
    this.routine$.next([]);
    this.academicYears$.next([]);
  }

  // --- Academic Years ---
  async loadAcademicYears(): Promise<AcademicYear[]> {
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<AcademicYear[]>>(`${this.API_BASE}/academic-years`));
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        this.academicYears$.next(res.data);
        this.saveStorage('academic_years', res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('AcademicStore loadAcademicYears error:', e);
    }
    return this.academicYears$.value;
  }

  // --- Classes CRUD ---
  async loadClasses(): Promise<SchoolClass[]> {
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<SchoolClass[]>>(`${this.API_BASE}/classes`));
      if (res?.success && Array.isArray(res.data)) {
        const sorted = res.data.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        this.classes$.next(sorted);
        this.saveStorage('academic_classes', sorted);
        return sorted;
      }
    } catch (e) {
      console.warn('AcademicStore loadClasses error:', e);
    }
    return this.classes$.value;
  }

  async addClass(cls: Partial<SchoolClass>): Promise<SchoolClass> {
    const payload = {
      name: cls.name || 'New Class',
      code: cls.code || ('CLS-' + (cls.name || '').replace(/\s+/g, '').toUpperCase()),
      sortOrder: cls.sortOrder || (this.classes$.value.length + 1),
      isActive: cls.isActive !== undefined ? cls.isActive : true
    };
    try {
      const res = await firstValueFrom(this.http.post<ApiResponse<SchoolClass>>(`${this.API_BASE}/classes`, payload));
      if (res && res.data) {
        const newEntry: SchoolClass = { ...res.data, isActive: payload.isActive };
        const updated = [...this.classes$.value, newEntry];
        this.classes$.next(updated);
        this.saveStorage('academic_classes', updated);
        return newEntry;
      }
    } catch (e) {
      console.warn('Backend addClass failed, saving locally:', e);
    }
    const newClass: SchoolClass = {
      id: 'cls-' + Math.random().toString(36).substring(2, 9),
      name: cls.name || 'New Class',
      code: payload.code,
      sortOrder: payload.sortOrder,
      sectionCount: 0,
      studentCount: 0,
      isActive: payload.isActive
    };
    const updated = [...this.classes$.value, newClass];
    this.classes$.next(updated);
    this.saveStorage('academic_classes', updated);
    return newClass;
  }

  async updateClass(id: string, cls: Partial<SchoolClass>): Promise<SchoolClass> {
    const existing = this.classes$.value.find(c => c.id === id);
    const targetName = cls.name !== undefined ? cls.name : (existing?.name || '');
    const targetCode = cls.code !== undefined ? cls.code : (existing?.code || '');
    const targetSortOrder = cls.sortOrder !== undefined ? cls.sortOrder : (existing?.sortOrder || 0);
    const targetIsActive = cls.isActive !== undefined ? cls.isActive : (existing?.isActive !== false);

    const payload = {
      name: targetName,
      code: targetCode,
      sortOrder: targetSortOrder,
      isActive: targetIsActive
    };

    try {
      const res = await firstValueFrom(this.http.put<ApiResponse<SchoolClass>>(`${this.API_BASE}/classes/${id}`, payload));
      if (res && res.data) {
        const merged: SchoolClass = { ...existing, ...res.data, isActive: targetIsActive };
        const updated = this.classes$.value.map(c => c.id === id ? merged : c);
        this.classes$.next(updated);
        this.saveStorage('academic_classes', updated);
        return merged;
      }
    } catch (e) {
      console.warn('Backend updateClass failed, saving locally:', e);
    }
    const updated = this.classes$.value.map(c => c.id === id ? { ...c, ...existing, ...cls, isActive: targetIsActive } as SchoolClass : c);
    this.classes$.next(updated);
    this.saveStorage('academic_classes', updated);
    return updated.find(c => c.id === id)!;
  }

  async deleteClass(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete<ApiResponse<boolean>>(`${this.API_BASE}/classes/${id}`));
    } catch (e) {
      console.warn('Backend deleteClass failed, saving locally:', e);
    }
    const updatedClasses = this.classes$.value.filter(c => c.id !== id);
    const updatedSections = this.sections$.value.filter(s => s.classId !== id);
    this.classes$.next(updatedClasses);
    this.sections$.next(updatedSections);
    this.saveStorage('academic_classes', updatedClasses);
    this.saveStorage('academic_sections', updatedSections);
    return true;
  }

  // --- Sections CRUD ---
  async loadSections(): Promise<Section[]> {
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<Section[]>>(`${this.API_BASE}/sections`));
      if (res?.success && Array.isArray(res.data)) {
        this.sections$.next(res.data);
        this.saveStorage('academic_sections', res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('AcademicStore loadSections error:', e);
    }
    return this.sections$.value;
  }

  async addSection(sec: Partial<Section>): Promise<Section> {
    const payload = {
      classId: sec.classId,
      name: sec.name,
      capacity: sec.capacity || 40,
      classTeacherId: sec.classTeacherId,
      classTeacherName: sec.classTeacherName
    };
    try {
      const res = await firstValueFrom(this.http.post<ApiResponse<Section>>(`${this.API_BASE}/sections`, payload));
      if (res && res.data) {
        const updated = [...this.sections$.value, res.data];
        this.sections$.next(updated);
        this.saveStorage('academic_sections', updated);
        return res.data;
      }
    } catch (e) {
      console.warn('Backend addSection failed, saving locally:', e);
    }
    const newSec: Section = {
      id: 'sec-' + Math.random().toString(36).substring(2, 9),
      classId: sec.classId || '',
      className: sec.className || '',
      name: sec.name || 'Section A',
      capacity: sec.capacity || 40,
      currentStudentCount: 0,
      classTeacherId: sec.classTeacherId,
      classTeacherName: sec.classTeacherName
    };
    const updated = [...this.sections$.value, newSec];
    this.sections$.next(updated);
    this.saveStorage('academic_sections', updated);
    return newSec;
  }

  async updateSection(id: string, sec: Partial<Section>): Promise<Section> {
    const existing = this.sections$.value.find(s => s.id === id);
    const payload = {
      name: sec.name ?? existing?.name ?? '',
      capacity: sec.capacity ?? existing?.capacity ?? 40,
      classTeacherId: sec.classTeacherId !== undefined ? sec.classTeacherId : existing?.classTeacherId,
      classTeacherName: sec.classTeacherName !== undefined ? sec.classTeacherName : existing?.classTeacherName
    };
    try {
      const res = await firstValueFrom(this.http.put<ApiResponse<Section>>(`${this.API_BASE}/sections/${id}`, payload));
      if (res && res.data) {
        const merged = { ...existing, ...res.data };
        const updated = this.sections$.value.map(s => s.id === id ? merged : s);
        this.sections$.next(updated);
        this.saveStorage('academic_sections', updated);
        return merged;
      }
    } catch (e) {
      console.warn('Backend updateSection failed, saving locally:', e);
    }
    const updated = this.sections$.value.map(s => s.id === id ? { ...s, ...existing, ...sec } as Section : s);
    this.sections$.next(updated);
    this.saveStorage('academic_sections', updated);
    return updated.find(s => s.id === id)!;
  }

  async deleteSection(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete<ApiResponse<boolean>>(`${this.API_BASE}/sections/${id}`));
    } catch (e) {
      console.warn('Backend deleteSection failed, saving locally:', e);
    }
    const updated = this.sections$.value.filter(s => s.id !== id);
    this.sections$.next(updated);
    this.saveStorage('academic_sections', updated);
    return true;
  }

  // --- Subjects CRUD ---
  async loadSubjects(): Promise<Subject[]> {
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<Subject[]>>(`${this.API_BASE}/subjects`));
      if (res?.success && res.data) {
        this.subjects$.next(res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('AcademicStore loadSubjects error:', e);
    }
    return this.subjects$.value;
  }

  async addSubject(sub: Partial<Subject>): Promise<Subject> {
    const payload = {
      code: sub.code || ('SUB-' + (sub.name || '').replace(/\s+/g, '').toUpperCase()),
      name: sub.name,
      type: sub.type || 'Compulsory',
      fullMarks: sub.fullMarks || 100,
      passMarks: sub.passMarks || 33
    };
    try {
      const res = await firstValueFrom(this.http.post<ApiResponse<Subject>>(`${this.API_BASE}/subjects`, payload));
      if (res?.success && res.data) {
        this.subjects$.next([...this.subjects$.value, res.data]);
        return res.data;
      }
    } catch (e) {
      console.warn('Backend addSubject failed, saving locally:', e);
    }
    const newSub: Subject = {
      id: 'sub-' + Math.random().toString(36).substring(2, 9),
      code: payload.code,
      name: sub.name || 'New Subject',
      type: sub.type || 'Compulsory',
      fullMarks: sub.fullMarks || 100,
      passMarks: sub.passMarks || 33
    };
    this.subjects$.next([...this.subjects$.value, newSub]);
    return newSub;
  }

  async updateSubject(id: string, sub: Partial<Subject>): Promise<Subject> {
    const payload = {
      code: sub.code,
      name: sub.name,
      type: sub.type || 'Compulsory',
      fullMarks: sub.fullMarks || 100,
      passMarks: sub.passMarks || 33
    };
    try {
      const res = await firstValueFrom(this.http.put<ApiResponse<Subject>>(`${this.API_BASE}/subjects/${id}`, payload));
      if (res?.success && res.data) {
        const updated = this.subjects$.value.map(s => s.id === id ? res.data : s);
        this.subjects$.next(updated);
        return res.data;
      }
    } catch (e) {
      console.warn('Backend updateSubject failed, saving locally:', e);
    }
    const updated = this.subjects$.value.map(s => s.id === id ? { ...s, ...sub } as Subject : s);
    this.subjects$.next(updated);
    return updated.find(s => s.id === id)!;
  }

  async deleteSubject(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete<ApiResponse<boolean>>(`${this.API_BASE}/subjects/${id}`));
    } catch (e) {
      console.warn('Backend deleteSubject failed, saving locally:', e);
    }
    this.subjects$.next(this.subjects$.value.filter(s => s.id !== id));
    return true;
  }

  async getClassSubjects(classId: string): Promise<any[]> {
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<any[]>>(`${this.API_BASE}/classes/${classId}/subjects`));
      if (res?.success && Array.isArray(res.data)) {
        this.saveStorage(`class_subjects_${classId}`, res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('Backend getClassSubjects failed:', e);
    }
    return this.loadStorage<any[]>(`class_subjects_${classId}`, []);
  }

  async assignClassSubjects(classId: string, subjectIds: string[]): Promise<boolean> {
    const mockMappings = subjectIds.map(sid => ({ classId, subjectId: sid }));
    try {
      const res = await firstValueFrom(this.http.post<ApiResponse<boolean>>(`${this.API_BASE}/classes/${classId}/subjects`, { subjectIds }));
      this.saveStorage(`class_subjects_${classId}`, mockMappings);
      return res?.success !== false;
    } catch (e) {
      console.warn('Backend assignClassSubjects failed, saving locally:', e);
      this.saveStorage(`class_subjects_${classId}`, mockMappings);
      return false;
    }
  }

  // --- Routine ---
  async loadRoutine(): Promise<RoutinePeriod[]> {
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<RoutinePeriod[]>>(`${this.API_BASE}/class-routines`));
      if (res?.success && res.data) {
        this.routine$.next(res.data);
        this.saveStorage('academic_routine', res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('AcademicStore loadRoutine error:', e);
    }
    const local = this.loadStorage<RoutinePeriod[]>('academic_routine', []);
    if (local.length > 0 && this.routine$.value.length === 0) {
      this.routine$.next(local);
    }
    return this.routine$.value;
  }

  async saveRoutinePeriod(period: RoutinePeriod): Promise<RoutinePeriod> {
    try {
      const res = await firstValueFrom(this.http.post<ApiResponse<RoutinePeriod>>(`${this.API_BASE}/class-routines`, period));
      if (res?.success && res.data) {
        const updated = [...this.routine$.value.filter(r => r.id !== period.id && !(r.classId === period.classId && r.sectionId === period.sectionId && r.day === period.day && r.periodNumber === period.periodNumber)), res.data];
        this.routine$.next(updated);
        this.saveStorage('academic_routine', updated);
        return res.data;
      }
    } catch (e) {
      console.warn('Backend saveRoutinePeriod error, saving locally:', e);
    }
    const newEntry: RoutinePeriod = {
      ...period,
      id: period.id || ('rt-' + Math.random().toString(36).substring(2, 9))
    };
    const updated = [...this.routine$.value.filter(r => r.id !== newEntry.id && !(r.classId === newEntry.classId && r.sectionId === newEntry.sectionId && r.day === newEntry.day && r.periodNumber === newEntry.periodNumber)), newEntry];
    this.routine$.next(updated);
    this.saveStorage('academic_routine', updated);
    return newEntry;
  }

  async saveRoutinesBatch(periods: RoutinePeriod[]): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post<ApiResponse<boolean>>(`${this.API_BASE}/class-routines/batch`, periods));
    } catch (e) {
      console.warn('Backend saveRoutinesBatch error, saving locally:', e);
    }
    if (periods.length > 0) {
      const first = periods[0];
      const others = this.routine$.value.filter(r => !(r.classId === first.classId && r.sectionId === first.sectionId));
      const updated = [...others, ...periods];
      this.routine$.next(updated);
      this.saveStorage('academic_routine', updated);
    }
    return true;
  }

  async deleteRoutinePeriod(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete<ApiResponse<boolean>>(`${this.API_BASE}/class-routines/${id}`));
    } catch (e) {
      console.warn('Backend deleteRoutinePeriod error, saving locally:', e);
    }
    const updated = this.routine$.value.filter(r => r.id !== id);
    this.routine$.next(updated);
    this.saveStorage('academic_routine', updated);
    return true;
  }

  addRoutinePeriod(period: RoutinePeriod) {
    this.saveRoutinePeriod(period);
  }
}
