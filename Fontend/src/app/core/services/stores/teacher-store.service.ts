import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Teacher, TeacherLeaveApplication } from '../../models';
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
export class TeacherStoreService {
  private http = inject(HttpClient);
  private campus = inject(CampusSessionService);
  private readonly API_BASE = '/api/v1';

  private defaultTeachers: Teacher[] = [
    { id: 'tch-001', employeeCode: 'FAC-2022-001', fullName: 'Sarah Jenkins', designation: 'Assistant Professor', department: 'Physical Sciences', qualification: 'M.Sc in Applied Mathematics', email: 'sarah.jenkins@scholarsacademy.edu.bd', phone: '+880 1819-000002', joiningDate: '2022-06-01', status: 'Active', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', assignedSubjects: ['Mathematics', 'Physics'] },
    { id: 'tch-002', employeeCode: 'FAC-2022-002', fullName: 'Kaniz Fatema', designation: 'Senior Faculty', department: 'Pre-Primary Education', qualification: 'M.Ed, University of Dhaka', email: 'kaniz.fatema@scholarsacademy.edu.bd', phone: '+880 1711-100001', joiningDate: '2021-01-10', status: 'Active', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', assignedSubjects: ['English', 'Rhymes', 'Drawing'] },
    { id: 'tch-003', employeeCode: 'FAC-2022-003', fullName: 'Rukhsana Akter', designation: 'Senior Teacher', department: 'English & Literature', qualification: 'M.A in English', email: 'rukhsana.akter@scholarsacademy.edu.bd', phone: '+880 1711-100002', joiningDate: '2020-03-15', status: 'Active', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', assignedSubjects: ['English Literature', 'Grammar'] },
    { id: 'tch-004', employeeCode: 'FAC-2022-004', fullName: 'Mizanur Rahman', designation: 'Faculty Member', department: 'General Science', qualification: 'B.Sc (Hons), M.Sc', email: 'mizanur.rahman@scholarsacademy.edu.bd', phone: '+880 1711-100003', joiningDate: '2021-07-01', status: 'Active', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', assignedSubjects: ['General Science', 'Biology'] },
    { id: 'tch-005', employeeCode: 'FAC-2022-005', fullName: 'Shahidul Islam', designation: 'Faculty Member', department: 'Social Science', qualification: 'M.S.S in Sociology', email: 'shahidul.islam@scholarsacademy.edu.bd', phone: '+880 1711-100004', joiningDate: '2019-11-20', status: 'Active', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', assignedSubjects: ['Bangladesh & Global Studies', 'History'] },
    { id: 'tch-006', employeeCode: 'FAC-2022-006', fullName: 'Jannatul Ferdous', designation: 'Faculty Member', department: 'Bangla Language', qualification: 'M.A in Bangla Literature', email: 'jannatul.ferdous@scholarsacademy.edu.bd', phone: '+880 1711-100005', joiningDate: '2022-02-01', status: 'Active', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', assignedSubjects: ['Bangla 1st Paper', 'Bangla 2nd Paper'] },
    { id: 'tch-007', employeeCode: 'FAC-2022-007', fullName: 'Hasan Mahmud', designation: 'Faculty Member', department: 'Physical Education & Science', qualification: 'B.P.Ed, M.Sc', email: 'hasan.mahmud@scholarsacademy.edu.bd', phone: '+880 1711-100006', joiningDate: '2020-08-14', status: 'Active', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', assignedSubjects: ['Physical Education', 'Health Science'] },
    { id: 'tch-008', employeeCode: 'FAC-2022-008', fullName: 'Farzana Haque', designation: 'Faculty Member', department: 'Fine Arts & Crafts', qualification: 'B.F.A, M.F.A, Charukala', email: 'farzana.haque@scholarsacademy.edu.bd', phone: '+880 1711-100007', joiningDate: '2021-04-10', status: 'Active', avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=150', assignedSubjects: ['Arts & Crafts', 'Music'] }
  ];

  private teachers$ = new BehaviorSubject<Teacher[]>(this.defaultTeachers);
  private teacherLeaves$ = new BehaviorSubject<TeacherLeaveApplication[]>([]);

  getTeachers$() { return this.teachers$.asObservable(); }
  getTeacherLeaves$() { return this.teacherLeaves$.asObservable(); }

  getTeachers(): Teacher[] { return this.teachers$.value; }
  getTeacherLeaves(): TeacherLeaveApplication[] { return this.teacherLeaves$.value; }

  setTeachers(teachers: Teacher[]) { this.teachers$.next(teachers); }
  setTeacherLeaves(leaves: TeacherLeaveApplication[]) { this.teacherLeaves$.next(leaves); }

  clear() {
    this.teachers$.next([]);
    this.teacherLeaves$.next([]);
  }

  async loadTeachers(): Promise<Teacher[]> {
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<Teacher[]>>(`${this.API_BASE}/teachers`));
      if (res?.success && res.data) {
        this.teachers$.next(res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('TeacherStore loadTeachers error:', e);
    }
    return this.teachers$.value;
  }

  async addTeacher(teacher: Partial<Teacher>): Promise<Teacher> {
    const payload = {
      employeeCode: teacher.employeeCode,
      fullName: teacher.fullName,
      designation: teacher.designation || 'Teacher',
      department: teacher.department || 'General',
      qualification: teacher.qualification || 'M.Sc / B.Ed',
      email: teacher.email || `${teacher.employeeCode?.toLowerCase()}@scholarsacademy.edu.bd`,
      phone: teacher.phone || '+880 1700-000000',
      joiningDate: teacher.joiningDate ? new Date(teacher.joiningDate).toISOString() : new Date().toISOString(),
      status: teacher.status || 'Active',
      avatar: teacher.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
      assignedSubjects: teacher.assignedSubjects || []
    };
    try {
      const res = await firstValueFrom(this.http.post<ApiResponse<Teacher>>(`${this.API_BASE}/teachers`, payload));
      if (res?.success && res.data) {
        this.teachers$.next([...this.teachers$.value, res.data]);
        return res.data;
      }
    } catch (e) {
      console.warn('Backend addTeacher failed, saving locally:', e);
    }
    const newT: Teacher = {
      id: 'tch-' + Math.random().toString(36).substring(2, 9),
      ...payload,
      joiningDate: new Date(payload.joiningDate)
    } as any;
    this.teachers$.next([...this.teachers$.value, newT]);
    return newT;
  }

  async updateTeacher(id: string, teacher: Partial<Teacher>): Promise<Teacher> {
    const payload = {
      employeeCode: teacher.employeeCode,
      fullName: teacher.fullName,
      designation: teacher.designation,
      department: teacher.department,
      qualification: teacher.qualification,
      email: teacher.email,
      phone: teacher.phone,
      joiningDate: teacher.joiningDate ? new Date(teacher.joiningDate).toISOString() : new Date().toISOString(),
      status: teacher.status,
      avatar: teacher.avatar,
      assignedSubjects: teacher.assignedSubjects
    };
    try {
      const res = await firstValueFrom(this.http.put<ApiResponse<Teacher>>(`${this.API_BASE}/teachers/${id}`, payload));
      if (res?.success && res.data) {
        const updated = this.teachers$.value.map(t => t.id === id ? res.data : t);
        this.teachers$.next(updated);
        return res.data;
      }
    } catch (e) {
      console.warn('Backend updateTeacher failed, saving locally:', e);
    }
    const updated = this.teachers$.value.map(t => t.id === id ? { ...t, ...teacher } as Teacher : t);
    this.teachers$.next(updated);
    return updated.find(t => t.id === id)!;
  }

  async deleteTeacher(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete<ApiResponse<boolean>>(`${this.API_BASE}/teachers/${id}`));
    } catch (e) {
      console.warn('Backend deleteTeacher failed, saving locally:', e);
    }
    this.teachers$.next(this.teachers$.value.filter(t => t.id !== id));
    return true;
  }

  // --- Leaves ---
  async loadTeacherLeaves(): Promise<TeacherLeaveApplication[]> {
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<TeacherLeaveApplication[]>>(`${this.API_BASE}/teachers/leaves`));
      if (res?.success && res.data) {
        this.teacherLeaves$.next(res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('TeacherStore loadTeacherLeaves error:', e);
    }
    return this.teacherLeaves$.value;
  }

  async applyTeacherLeave(leave: Partial<TeacherLeaveApplication>): Promise<TeacherLeaveApplication> {
    const newLeave: TeacherLeaveApplication = {
      id: 'tl-' + Date.now().toString().slice(-5),
      teacherId: leave.teacherId || 'tch-01',
      teacherName: leave.teacherName || 'Teacher',
      employeeCode: leave.employeeCode || 'EMP-100',
      department: leave.department || 'General',
      leaveType: leave.leaveType || 'Casual Leave',
      startDate: leave.startDate || new Date().toISOString().split('T')[0],
      endDate: leave.endDate || new Date().toISOString().split('T')[0],
      totalDays: leave.totalDays || 1,
      reason: leave.reason || '',
      status: 'Pending',
      appliedOn: new Date().toISOString().split('T')[0],
      branchId: this.campus.branchId
    };

    try {
      const res = await firstValueFrom(this.http.post<ApiResponse<TeacherLeaveApplication>>(`${this.API_BASE}/teachers/leaves`, {
        teacherId: newLeave.teacherId,
        teacherName: newLeave.teacherName,
        employeeCode: newLeave.employeeCode,
        department: newLeave.department,
        leaveType: newLeave.leaveType,
        startDate: new Date(newLeave.startDate).toISOString(),
        endDate: new Date(newLeave.endDate).toISOString(),
        totalDays: newLeave.totalDays,
        reason: newLeave.reason
      }));
      if (res?.success && res.data) {
        const updated = [res.data, ...this.teacherLeaves$.value.filter(l => l.id !== newLeave.id)];
        this.teacherLeaves$.next(updated);
        return res.data;
      }
    } catch (e) {
      console.warn('Backend applyTeacherLeave failed, saving locally:', e);
    }

    const updated = [newLeave, ...this.teacherLeaves$.value];
    this.teacherLeaves$.next(updated);
    return newLeave;
  }

  async updateTeacherLeaveStatus(id: string, status: 'Approved' | 'Rejected', remark: string): Promise<void> {
    try {
      await firstValueFrom(this.http.put<ApiResponse<TeacherLeaveApplication>>(`${this.API_BASE}/teachers/leaves/${id}/status`, {
        status,
        reviewRemark: remark
      }));
    } catch (e) {
      console.warn('Backend updateTeacherLeaveStatus failed:', e);
    }

    const list = this.teacherLeaves$.value.map(l => {
      if (l.id === id) {
        return {
          ...l,
          status,
          reviewedBy: 'Principal',
          reviewRemark: remark
        };
      }
      return l;
    });
    this.teacherLeaves$.next(list);
  }
}
