import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDbService } from '../../core/services/mock-db.service';
import { ToastService } from '../../core/services/toast.service';
import { SchoolClass, Section, Student, AttendanceRecord } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-attendance-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <app-icon name="clipboard-check" [size]="26" class="text-primary"></app-icon>
            Daily Student Attendance Register
          </h1>
          <p class="page-subtitle">
            Record class attendance with one-click toggles (Present / Late / Absent) and instantaneous save.
          </p>
        </div>
        <div class="page-actions">
          <button type="button" class="btn btn-outline" (click)="markAllPresent()">
            <app-icon name="check-square" [size]="16"></app-icon>
            <span>Mark All Present</span>
          </button>
          <button type="button" class="btn btn-primary" (click)="saveAttendance()">
            <app-icon name="check" [size]="16"></app-icon>
            <span>Save Attendance Register</span>
          </button>
        </div>
      </div>

      <!-- SELECTION STRIP (Date -> Class -> Section -> Load Students) -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="filter-grid">
            <div class="form-group mb-0">
              <label class="form-label">Attendance Date <span class="required">*</span></label>
              <input type="date" class="form-control" [(ngModel)]="selectedDate" (change)="loadStudentsForAttendance()" />
            </div>

            <div class="form-group mb-0">
              <label class="form-label">Select Class <span class="required">*</span></label>
              <select class="form-select" [(ngModel)]="selectedClassId" (change)="onClassChange()">
                <option *ngFor="let c of classes" [value]="c.id">{{ c.name }}</option>
              </select>
            </div>

            <div class="form-group mb-0">
              <label class="form-label">Select Section <span class="required">*</span></label>
              <select class="form-select" [(ngModel)]="selectedSectionId" (change)="loadStudentsForAttendance()">
                <option *ngFor="let s of sections" [value]="s.id">{{ s.name }}</option>
              </select>
            </div>

            <div class="attendance-summary-badge">
              <span class="sum-lbl">Session Attendance:</span>
              <strong>{{ getPresentCount() }} / {{ attendanceRows.length }} Present</strong>
              <div class="sum-rate">{{ getRate() }}% Present Rate</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ATTENDANCE REGISTER TABLE -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <app-icon name="users" [size]="18"></app-icon>
            <span>Class Roster for {{ getSelectedClassName() }} ({{ getSelectedSectionName() }})</span>
          </div>
          <span class="date-tag">{{ selectedDate }}</span>
        </div>

        <div class="app-table-wrapper">
          <table class="app-table">
            <thead>
              <tr>
                <th style="width: 80px;">Roll</th>
                <th>Student Name</th>
                <th>Admission No</th>
                <th style="text-align: center; width: 320px;">Attendance Status Toggle</th>
                <th>Remark / Note</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of attendanceRows" [class.absent-row]="row.status === 'Absent'">
                <td>
                  <span class="roll-badge">#{{ row.rollNo }}</span>
                </td>
                <td>
                  <strong>{{ row.studentName }}</strong>
                </td>
                <td>
                  <code class="code-tag">{{ row.admissionNo }}</code>
                </td>
                <td style="text-align: center;">
                  <div class="status-toggle-group">
                    <button
                      type="button"
                      class="toggle-btn btn-present"
                      [class.active]="row.status === 'Present'"
                      (click)="row.status = 'Present'"
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      class="toggle-btn btn-late"
                      [class.active]="row.status === 'Late'"
                      (click)="row.status = 'Late'"
                    >
                      Late
                    </button>
                    <button
                      type="button"
                      class="toggle-btn btn-absent"
                      [class.active]="row.status === 'Absent'"
                      (click)="row.status = 'Absent'"
                    >
                      Absent
                    </button>
                  </div>
                </td>
                <td>
                  <input
                    type="text"
                    class="form-control form-control-sm"
                    [(ngModel)]="row.remark"
                    placeholder="e.g. Doctor appointment, fever"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mb-4 { margin-bottom: 24px; }
    .mb-0 { margin-bottom: 0 !important; }
    .text-primary { color: #4f46e5; }
    .filter-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1.2fr;
      gap: 20px;
      align-items: center;
    }
    .attendance-summary-badge {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 10px 16px;
      display: flex;
      flex-direction: column;
    }
    .sum-lbl {
      font-size: 0.7rem;
      font-weight: 700;
      color: #166534;
      text-transform: uppercase;
    }
    .sum-rate {
      font-size: 0.75rem;
      font-weight: 600;
      color: #059669;
    }
    .date-tag {
      font-size: 0.8125rem;
      font-weight: 700;
      background: #eef2ff;
      color: #4f46e5;
      padding: 4px 12px;
      border-radius: 8px;
    }
    .roll-badge {
      font-weight: 800;
      color: #0f172a;
      background: #f1f5f9;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.85rem;
    }
    .code-tag {
      font-size: 0.75rem;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .status-toggle-group {
      display: inline-flex;
      border-radius: 10px;
      background: #f1f5f9;
      padding: 3px;
      gap: 3px;
    }
    .toggle-btn {
      border: none;
      background: transparent;
      padding: 6px 14px;
      border-radius: 7px;
      font-size: 0.785rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
      color: #64748b;
    }
    .btn-present.active {
      background: #10b981;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
    }
    .btn-late.active {
      background: #f59e0b;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3);
    }
    .btn-absent.active {
      background: #ef4444;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);
    }
    .absent-row {
      background: #fff1f2 !important;
    }
  `]
})
export class AttendanceEntryComponent implements OnInit {
  private db = inject(MockDbService);
  private toast = inject(ToastService);

  classes: SchoolClass[] = [];
  sections: Section[] = [];

  selectedDate = new Date().toISOString().split('T')[0];
  selectedClassId = 'cls-10';
  selectedSectionId = 'sec-10a';

  attendanceRows: {
    studentId: string;
    studentName: string;
    admissionNo: string;
    rollNo: string;
    status: 'Present' | 'Absent' | 'Late';
    remark: string;
  }[] = [];

  ngOnInit() {
    this.classes = this.db.getClasses();
    this.onClassChange();
  }

  onClassChange() {
    this.sections = this.db.getSections(this.selectedClassId);
    if (this.sections.length > 0) {
      this.selectedSectionId = this.sections[0].id;
    }
    this.loadStudentsForAttendance();
  }

  loadStudentsForAttendance() {
    const students = this.db.getStudents(this.selectedClassId, this.selectedSectionId);
    const existing = this.db.getAttendance(this.selectedDate, this.selectedClassId, this.selectedSectionId);
    const existingMap = new Map(existing.map(a => [a.studentId, a]));

    this.attendanceRows = students.map(s => {
      const rec = existingMap.get(s.id);
      return {
        studentId: s.id,
        studentName: s.fullName,
        admissionNo: s.admissionNo,
        rollNo: s.rollNo,
        status: rec ? rec.status : 'Present',
        remark: rec?.remark || ''
      };
    });
  }

  markAllPresent() {
    this.attendanceRows.forEach(r => (r.status = 'Present'));
    this.toast.info('Marked All Present', 'All students marked as Present.');
  }

  getPresentCount(): number {
    return this.attendanceRows.filter(r => r.status === 'Present').length;
  }

  getRate(): number {
    if (this.attendanceRows.length === 0) return 100;
    return Math.round((this.getPresentCount() / this.attendanceRows.length) * 100);
  }

  getSelectedClassName() {
    return this.classes.find(c => c.id === this.selectedClassId)?.name || '';
  }

  getSelectedSectionName() {
    return this.sections.find(s => s.id === this.selectedSectionId)?.name || '';
  }

  saveAttendance() {
    const records: AttendanceRecord[] = this.attendanceRows.map(r => ({
      id: '',
      date: this.selectedDate,
      studentId: r.studentId,
      studentName: r.studentName,
      rollNo: r.rollNo,
      classId: this.selectedClassId,
      sectionId: this.selectedSectionId,
      status: r.status,
      remark: r.remark,
      markedBy: this.db.getCurrentUser().fullName
    }));

    this.db.saveAttendance(records);
    this.toast.success('Attendance Saved', `Register saved for ${records.length} students on ${this.selectedDate}`);
  }
}
