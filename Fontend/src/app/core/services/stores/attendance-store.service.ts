import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom, map, catchError, of, tap } from 'rxjs';
import { AttendanceRecord, AttendanceCorrectionLog, AcademicHoliday, WeekendSettings, SpecialWorkingDay } from '../../models';
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
export class AttendanceStoreService {
  private http = inject(HttpClient);
  private campus = inject(CampusSessionService);
  private readonly API_BASE = '/api/v1';

  private attendance$ = new BehaviorSubject<AttendanceRecord[]>([]);
  private attendanceLogs$ = new BehaviorSubject<AttendanceCorrectionLog[]>([]);
  private weekendSettings$ = new BehaviorSubject<WeekendSettings>({
    weekendDays: [5, 6], // Standard BD Friday (5) & Saturday (6)
    customNote: 'Standard Institutional Weekend: Friday & Saturday'
  });
  private holidays$ = new BehaviorSubject<AcademicHoliday[]>([]);
  private specialWorkingDays$ = new BehaviorSubject<SpecialWorkingDay[]>([]);

  getAttendance$() { return this.attendance$.asObservable(); }
  getAttendanceLogs$() { return this.attendanceLogs$.asObservable(); }
  getWeekendSettings$() { return this.weekendSettings$.asObservable(); }
  getWeekendSettings(): WeekendSettings { return this.weekendSettings$.value; }
  getHolidays$() { return this.holidays$.asObservable(); }
  getHolidays(): AcademicHoliday[] { return this.holidays$.value; }
  getSpecialWorkingDays$() { return this.specialWorkingDays$.asObservable(); }
  getSpecialWorkingDays(): SpecialWorkingDay[] { return this.specialWorkingDays$.value; }

  getAttendance(date: string, classId: string, sectionId: string): AttendanceRecord[] {
    const activeBranch = this.campus.branchId;
    return this.attendance$.value.filter(
      a => (a.date === date || a.date.startsWith(date)) &&
           a.classId === classId &&
           a.sectionId === sectionId &&
           (!activeBranch || activeBranch === 'ALL' || (a.branchId || 'br-01') === activeBranch)
    );
  }

  getAttendanceLogs(): AttendanceCorrectionLog[] {
    return this.attendanceLogs$.value;
  }

  setAttendance(records: AttendanceRecord[]) {
    this.attendance$.next(records);
  }

  setAttendanceLogs(logs: AttendanceCorrectionLog[]) {
    this.attendanceLogs$.next(logs);
  }

  saveAttendance(records: AttendanceRecord[]) {
    const current = [...this.attendance$.value];
    for (const r of records) {
      const idx = current.findIndex(a => a.id === r.id || (a.studentId === r.studentId && a.date === r.date));
      if (idx > -1) {
        current[idx] = { ...current[idx], ...r };
      } else {
        current.push(r);
      }
    }
    this.attendance$.next(current);
  }

  correctAttendance(recordId: string, newStatus: AttendanceRecord['status'], reason: string): void {
    const records = [...this.attendance$.value];
    const idx = records.findIndex(r => r.id === recordId);
    if (idx > -1) {
      const prevStatus = records[idx].status;
      records[idx].status = newStatus;
      records[idx].remark = `Corrected: ${reason}`;
      records[idx].lastUpdated = new Date().toISOString();
      this.attendance$.next(records);

      this.submitAttendanceCorrection(
        recordId,
        records[idx].studentId,
        records[idx].studentName,
        records[idx].date,
        prevStatus,
        newStatus,
        reason
      );
    }
  }

  clear() {
    this.attendance$.next([]);
    this.attendanceLogs$.next([]);
  }

  fetchAttendanceRecords(classId: string, sectionId: string, date: string): Observable<AttendanceRecord[]> {
    return this.http.get<ApiResponse<AttendanceRecord[]>>(
      `${this.API_BASE}/attendance/students?classId=${encodeURIComponent(classId)}&sectionId=${encodeURIComponent(sectionId)}&date=${encodeURIComponent(date)}`
    ).pipe(
      map(res => {
        const records = res?.data || [];
        const current = [...this.attendance$.value];
        const dateStr = date.split('T')[0];

        for (const rec of records) {
          const recDateStr = typeof rec.date === 'string' ? rec.date.split('T')[0] : dateStr;
          const normalizedRec: AttendanceRecord = {
            ...rec,
            date: recDateStr
          };
          const idx = current.findIndex(a => a.studentId === rec.studentId && (a.date === recDateStr || a.date.startsWith(recDateStr)));
          if (idx > -1) {
            current[idx] = normalizedRec;
          } else {
            current.push(normalizedRec);
          }
        }
        this.attendance$.next(current);
        return records;
      }),
      catchError(err => {
        console.error('Error fetching attendance from API:', err);
        return of(this.getAttendance(date, classId, sectionId));
      })
    );
  }

  fetchAttendanceRange(classId?: string, sectionId?: string, startDate?: string, endDate?: string): Observable<AttendanceRecord[]> {
    let url = `${this.API_BASE}/attendance/students?`;
    if (classId) url += `classId=${encodeURIComponent(classId)}&`;
    if (sectionId) url += `sectionId=${encodeURIComponent(sectionId)}&`;
    if (startDate) url += `startDate=${encodeURIComponent(startDate)}&`;
    if (endDate) url += `endDate=${encodeURIComponent(endDate)}&`;

    return this.http.get<ApiResponse<AttendanceRecord[]>>(url).pipe(
      map(res => {
        const records = res?.data || [];
        const current = [...this.attendance$.value];

        for (const rec of records) {
          const recDateStr = typeof rec.date === 'string' ? rec.date.split('T')[0] : '';
          const normalizedRec: AttendanceRecord = {
            ...rec,
            date: recDateStr || rec.date
          };
          const idx = current.findIndex(a => a.id === rec.id || (a.studentId === rec.studentId && a.date === normalizedRec.date));
          if (idx > -1) {
            current[idx] = normalizedRec;
          } else {
            current.push(normalizedRec);
          }
        }
        this.attendance$.next(current);
        return records;
      }),
      catchError(err => {
        console.warn('Error fetching attendance range from API:', err);
        return of(this.attendance$.value);
      })
    );
  }

  fetchCorrections(): Observable<AttendanceCorrectionLog[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.API_BASE}/attendance/corrections`).pipe(
      map(res => {
        const logs = (res?.data || []).map((c: any) => ({
          id: c.id,
          attendanceId: c.attendanceId,
          date: typeof c.date === 'string' ? c.date.split('T')[0] : c.date,
          studentName: c.studentName,
          previousStatus: c.previousStatus,
          newStatus: c.newStatus,
          reason: c.reason,
          updatedBy: c.updatedBy,
          timestamp: typeof c.timestamp === 'string' ? new Date(c.timestamp).toLocaleString('en-GB') : c.timestamp
        }));
        if (logs.length > 0) {
          this.attendanceLogs$.next(logs);
        }
        return logs;
      }),
      catchError(err => {
        console.warn('Error fetching attendance corrections:', err);
        return of(this.attendanceLogs$.value);
      })
    );
  }

  fetchAttendanceCorrections(): Observable<AttendanceCorrectionLog[]> {
    return this.fetchCorrections();
  }

  saveAttendanceRoster(
    classId: string,
    sectionId: string,
    date: string,
    records: { studentId: string; studentName: string; rollNo: string; status: 'Present' | 'Absent' | 'Late'; remark?: string }[]
  ): Observable<ApiResponse<boolean>> {
    const dateIso = new Date(date + 'T00:00:00Z').toISOString();

    const payload = {
      classId,
      sectionId,
      date: dateIso,
      records: records.map(r => ({
        studentId: r.studentId,
        studentName: r.studentName,
        rollNo: r.rollNo,
        status: r.status,
        remark: r.remark || ''
      }))
    };

    return this.http.post<ApiResponse<boolean>>(`${this.API_BASE}/attendance/students`, payload).pipe(
      tap(() => {
        const current = [...this.attendance$.value];
        const dateStr = date.split('T')[0];

        for (const r of records) {
          const idx = current.findIndex(a => a.studentId === r.studentId && (a.date === dateStr || a.date.startsWith(dateStr)));
          const updated: AttendanceRecord = {
            id: idx > -1 ? current[idx].id : 'att-' + Date.now() + Math.random().toString(36).substring(2, 6),
            date: dateStr,
            studentId: r.studentId,
            studentName: r.studentName,
            rollNo: r.rollNo,
            classId,
            sectionId,
            status: r.status,
            remark: r.remark || '',
            markedBy: 'Staff',
            branchId: this.campus.branchId || 'br-01',
            lastUpdated: new Date().toISOString()
          };
          if (idx > -1) {
            current[idx] = updated;
          } else {
            current.push(updated);
          }
        }
        this.attendance$.next(current);
      })
    );
  }

  submitAttendanceCorrection(
    attendanceId: string,
    studentId: string,
    studentName: string,
    date: string,
    prevStatus: string,
    newStatus: string,
    reason: string
  ): void {
    const newLog: AttendanceCorrectionLog = {
      id: 'cor-' + Date.now().toString().slice(-5),
      attendanceId,
      date,
      studentName,
      previousStatus: prevStatus,
      newStatus,
      reason,
      updatedBy: 'Administrator',
      timestamp: new Date().toLocaleString('en-GB')
    };

    const currentLogs = [newLog, ...this.attendanceLogs$.value];
    this.attendanceLogs$.next(currentLogs);

    if (attendanceId && !attendanceId.startsWith('att-')) {
      const dateIso = date ? new Date(date).toISOString() : new Date().toISOString();
      this.http.post(`${this.API_BASE}/attendance/correction`, {
        attendanceId,
        date: dateIso,
        studentName,
        previousStatus: prevStatus,
        newStatus,
        reason
      }).subscribe({
        error: (err) => console.warn('Attendance correction backend sync failed:', err)
      });
    }
  }

  // --- Weekend Settings ---
  fetchWeekendSettings(): Observable<WeekendSettings> {
    const cached = this.loadStorage<WeekendSettings>('weekend_settings', {
      weekendDays: [5, 6],
      customNote: 'Standard Institutional Weekend'
    });
    return this.http.get<ApiResponse<WeekendSettings>>(`${this.API_BASE}/attendance/weekend-settings`).pipe(
      map(res => {
        if (res && res.data) {
          this.weekendSettings$.next(res.data);
          this.saveStorage('weekend_settings', res.data);
          return res.data;
        }
        return cached;
      }),
      catchError(() => {
        this.weekendSettings$.next(cached);
        return of(cached);
      })
    );
  }

  async saveWeekendSettings(settings: WeekendSettings): Promise<WeekendSettings> {
    this.weekendSettings$.next(settings);
    this.saveStorage('weekend_settings', settings);
    try {
      const res = await firstValueFrom(this.http.post<ApiResponse<WeekendSettings>>(`${this.API_BASE}/attendance/weekend-settings`, settings));
      if (res && res.data) {
        this.weekendSettings$.next(res.data);
        this.saveStorage('weekend_settings', res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('Backend saveWeekendSettings failed, saved locally:', e);
    }
    return settings;
  }

  // --- Institutional Holidays ---
  fetchHolidays(): Observable<AcademicHoliday[]> {
    const cached = this.loadStorage<AcademicHoliday[]>('academic_holidays', []);
    return this.http.get<ApiResponse<AcademicHoliday[]>>(`${this.API_BASE}/attendance/holidays`).pipe(
      map(res => {
        if (res && res.data && res.data.length > 0) {
          this.holidays$.next(res.data);
          this.saveStorage('academic_holidays', res.data);
          return res.data;
        }
        if (cached.length > 0) {
          this.holidays$.next(cached);
          return cached;
        }
        return [];
      }),
      catchError(() => {
        this.holidays$.next(cached);
        return of(cached);
      })
    );
  }

  async saveHoliday(holiday: AcademicHoliday): Promise<AcademicHoliday> {
    const current = [...this.holidays$.value];
    let updated: AcademicHoliday = { ...holiday };
    if (!updated.id) {
      updated.id = 'hol-' + Math.random().toString(36).substring(2, 9);
      current.unshift(updated);
    } else {
      const idx = current.findIndex(h => h.id === updated.id);
      if (idx > -1) current[idx] = updated;
      else current.unshift(updated);
    }
    this.holidays$.next(current);
    this.saveStorage('academic_holidays', current);

    try {
      const res = await firstValueFrom(this.http.post<ApiResponse<AcademicHoliday>>(`${this.API_BASE}/attendance/holidays`, updated));
      if (res && res.data) {
        const finalCurrent = this.holidays$.value.map(h => h.id === updated.id ? res.data : h);
        this.holidays$.next(finalCurrent);
        this.saveStorage('academic_holidays', finalCurrent);
        return res.data;
      }
    } catch (e) {
      console.warn('Backend saveHoliday failed, saved locally:', e);
    }
    return updated;
  }

  async deleteHoliday(id: string): Promise<boolean> {
    const filtered = this.holidays$.value.filter(h => h.id !== id);
    this.holidays$.next(filtered);
    this.saveStorage('academic_holidays', filtered);

    try {
      await firstValueFrom(this.http.delete<ApiResponse<boolean>>(`${this.API_BASE}/attendance/holidays/${id}`));
      return true;
    } catch (e) {
      console.warn('Backend deleteHoliday failed, deleted locally:', e);
      return true;
    }
  }

  // --- Special Working Day (সরকারি নির্দেশে ছুটির দিনে ক্লাস ও হাজিরা সচল) ---
  fetchSpecialWorkingDays(): Observable<SpecialWorkingDay[]> {
    const cached = this.loadStorage<SpecialWorkingDay[]>('special_working_days', []);
    return this.http.get<ApiResponse<SpecialWorkingDay[]>>(`${this.API_BASE}/attendance/special-working-days`).pipe(
      map(res => {
        if (res && res.data) {
          this.specialWorkingDays$.next(res.data);
          this.saveStorage('special_working_days', res.data);
          return res.data;
        }
        if (cached.length > 0) {
          this.specialWorkingDays$.next(cached);
          return cached;
        }
        return [];
      }),
      catchError(() => {
        this.specialWorkingDays$.next(cached);
        return of(cached);
      })
    );
  }

  async declareSpecialWorkingDay(day: Partial<SpecialWorkingDay>): Promise<SpecialWorkingDay> {
    const current = [...this.specialWorkingDays$.value];
    let record: SpecialWorkingDay = {
      id: day.id || 'swd-' + Math.random().toString(36).substring(2, 9),
      date: day.date || '',
      reason: day.reason || 'Govt Order / Makeup Academic Class',
      orderReference: day.orderReference || '',
      declaredBy: day.declaredBy || 'Admin',
      createdAt: day.createdAt || new Date().toISOString()
    };

    const existingIdx = current.findIndex(d => d.date === record.date || (day.id && d.id === day.id));
    if (existingIdx > -1) {
      current[existingIdx] = record;
    } else {
      current.unshift(record);
    }

    this.specialWorkingDays$.next(current);
    this.saveStorage('special_working_days', current);

    try {
      const res = await firstValueFrom(
        this.http.post<ApiResponse<SpecialWorkingDay>>(`${this.API_BASE}/attendance/special-working-days`, record)
      );
      if (res && res.data) {
        const updated = this.specialWorkingDays$.value.map(d => d.date === record.date ? res.data : d);
        this.specialWorkingDays$.next(updated);
        this.saveStorage('special_working_days', updated);
        return res.data;
      }
    } catch (e) {
      console.warn('Backend declareSpecialWorkingDay failed, saved locally:', e);
    }
    return record;
  }

  async removeSpecialWorkingDay(dateOrId: string): Promise<boolean> {
    const current = this.specialWorkingDays$.value.filter(d => d.id !== dateOrId && d.date !== dateOrId);
    this.specialWorkingDays$.next(current);
    this.saveStorage('special_working_days', current);

    try {
      await firstValueFrom(
        this.http.delete<ApiResponse<boolean>>(`${this.API_BASE}/attendance/special-working-days/${encodeURIComponent(dateOrId)}`)
      );
      return true;
    } catch (e) {
      console.warn('Backend removeSpecialWorkingDay failed, removed locally:', e);
      return true;
    }
  }

  private saveStorage(key: string, data: any) {
    try {
      localStorage.setItem(`sms_campus_${this.campus.branchId || 'br-01'}_${key}`, JSON.stringify(data));
    } catch {}
  }

  private loadStorage<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(`sms_campus_${this.campus.branchId || 'br-01'}_${key}`);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  }
}
