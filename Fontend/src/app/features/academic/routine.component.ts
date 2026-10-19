import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDbService } from '../../core/services/mock-db.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { RoutinePeriod, SchoolClass, Section, Teacher, Subject, User } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';
import { ModalComponent } from '../../shared/components/modal.component';

@Component({
  selector: 'app-routine',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, ModalComponent],
  template: `
    <div class="page-container">
      <!-- HEADER -->
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <app-icon name="calendar-clock" [size]="28" class="text-primary"></app-icon>
            {{ (isStudent || isGuardian) ? (isGuardian ? 'Ward Academic Class Timetable (Tanvir Ahmed)' : 'My Academic Class Timetable') : 'Class Routine & Schedule Matrix' }}
          </h1>
          <p class="page-subtitle">
            {{ (isStudent || isGuardian) 
              ? 'Weekly routine for enrolled courses, faculty instructors, and assigned rooms (Class 10 - Section A Padma).' 
              : 'Institutional schedule management with automated teacher and room conflict detection.' 
            }}
          </p>
        </div>

        <!-- ACTION BUTTONS: STRICTLY PERMISSION GUARDED (PDF Section 13) -->
        <div class="page-actions">
          <button type="button" class="btn btn-outline" (click)="printRoutine()">
            <app-icon name="printer" [size]="16"></app-icon>
            <span>Print Timetable</span>
          </button>
          
          <!-- Only visible to authorized users (Admins / Teachers), hidden for Students! -->
          <button
            *ngIf="canAssignPeriod"
            type="button"
            class="btn btn-primary"
            (click)="openAddPeriodModal()"
          >
            <app-icon name="plus" [size]="16"></app-icon>
            <span>Assign Routine Period</span>
          </button>
        </div>
      </div>

      <!-- PERSONALIZED STUDENT BANNER (For Students and Guardians) -->
      <div *ngIf="(isStudent || isGuardian) && currentUser" class="student-hero-banner mb-4">
        <div class="hero-left">
          <img [src]="isGuardian ? 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80' : currentUser.avatar" [alt]="currentUser.fullName" class="hero-avatar" />
          <div>
            <div class="hero-tag">{{ isGuardian ? 'PARENT / GUARDIAN PORTAL • ENROLLED WARD' : 'STUDENT ENROLLMENT DOSSIER' }}</div>
            <h2 class="hero-name">{{ isGuardian ? 'Tanvir Ahmed (Roll #01)' : currentUser.fullName }}</h2>
            <div class="hero-meta">
              <span class="meta-chip">Class 10 — Section A (Padma)</span>
              <span class="meta-chip">Roll #01</span>
              <span class="meta-chip">Session: 2026-2027</span>
              <span class="meta-chip chip-active">● Active Status</span>
            </div>
          </div>
        </div>
        <div class="hero-right">
          <button type="button" class="btn btn-sm btn-outline-white" (click)="browseOtherClasses = !browseOtherClasses">
            <app-icon name="layers" [size]="14"></app-icon>
            <span>{{ browseOtherClasses ? 'Return to My Class' : 'View Other Classes' }}</span>
          </button>
        </div>
      </div>

      <!-- CLASS & SECTION SELECTOR STRIP (Shown for Admins/Teachers or when Student toggles browse) -->
      <div class="card mb-4" *ngIf="!isStudent || browseOtherClasses">
        <div class="card-body p-3">
          <div class="routine-filter-row">
            <div class="form-group mb-0">
              <label class="form-label">Academic Class:</label>
              <select class="form-select form-select-sm" [(ngModel)]="selectedClassId" (change)="onClassChange()">
                <option *ngFor="let c of classes" [value]="c.id">{{ c.name }}</option>
              </select>
            </div>

            <div class="form-group mb-0">
              <label class="form-label">Section / Group:</label>
              <select class="form-select form-select-sm" [(ngModel)]="selectedSectionId">
                <option *ngFor="let s of sections" [value]="s.id">{{ s.name }}</option>
              </select>
            </div>

            <div class="conflict-guard-pill">
              <app-icon name="shield-check" [size]="16" class="text-emerald"></app-icon>
              <span>Automated Schedule Conflict Engine Active</span>
            </div>
          </div>
        </div>
      </div>

      <!-- TIMETABLE WEEKLY GRID (PDF Section 07) -->
      <div class="card timetable-card">
        <div class="card-header">
          <div class="card-title">
            <app-icon name="calendar-clock" [size]="18" class="text-primary"></app-icon>
            <span>Weekly Schedule: <strong>{{ getClassName() }} ({{ getSectionName() }})</strong></span>
          </div>
          <span class="total-slots-tag">4 Periods Daily • 5 Days Week</span>
        </div>

        <div class="timetable-grid-wrapper">
          <table class="timetable-grid">
            <thead>
              <tr>
                <th style="width: 140px;" class="col-day">Day</th>
                <th class="col-period">
                  <div class="period-th">
                    <span class="th-pname">Period 1</span>
                    <span class="th-time">08:30 – 09:15 AM</span>
                  </div>
                </th>
                <th class="col-period">
                  <div class="period-th">
                    <span class="th-pname">Period 2</span>
                    <span class="th-time">09:15 – 10:00 AM</span>
                  </div>
                </th>
                <th style="width: 80px;" class="col-break">
                  <div class="break-th">
                    <span>BREAK</span>
                  </div>
                </th>
                <th class="col-period">
                  <div class="period-th">
                    <span class="th-pname">Period 3</span>
                    <span class="th-time">10:15 – 11:00 AM</span>
                  </div>
                </th>
                <th class="col-period">
                  <div class="period-th">
                    <span class="th-pname">Period 4</span>
                    <span class="th-time">11:00 – 11:45 AM</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let day of days">
                <td class="day-cell">
                  <span class="day-name">{{ day }}</span>
                </td>
                
                <!-- Period 1 -->
                <td class="slot-cell">
                  <div *ngIf="getPeriod(day, 1) as p; else emptySlot" class="slot-card" [ngClass]="getSubjectTheme(p.subjectName)">
                    <div class="slot-top">
                      <span class="slot-badge">{{ p.subjectName }}</span>
                      <span class="slot-room">{{ p.roomNo }}</span>
                    </div>
                    <div class="slot-teacher">
                      <app-icon name="user" [size]="14"></app-icon>
                      <span>{{ p.teacherName }}</span>
                    </div>
                  </div>
                </td>

                <!-- Period 2 -->
                <td class="slot-cell">
                  <div *ngIf="getPeriod(day, 2) as p; else emptySlot" class="slot-card" [ngClass]="getSubjectTheme(p.subjectName)">
                    <div class="slot-top">
                      <span class="slot-badge">{{ p.subjectName }}</span>
                      <span class="slot-room">{{ p.roomNo }}</span>
                    </div>
                    <div class="slot-teacher">
                      <app-icon name="user" [size]="14"></app-icon>
                      <span>{{ p.teacherName }}</span>
                    </div>
                  </div>
                </td>

                <!-- Tiffin Break -->
                <td class="break-cell">
                  <div class="break-pill">
                    <span class="tiffin-text">TIFFIN</span>
                  </div>
                </td>

                <!-- Period 3 -->
                <td class="slot-cell">
                  <div *ngIf="getPeriod(day, 3) as p; else emptySlot" class="slot-card" [ngClass]="getSubjectTheme(p.subjectName)">
                    <div class="slot-top">
                      <span class="slot-badge">{{ p.subjectName }}</span>
                      <span class="slot-room">{{ p.roomNo }}</span>
                    </div>
                    <div class="slot-teacher">
                      <app-icon name="user" [size]="14"></app-icon>
                      <span>{{ p.teacherName }}</span>
                    </div>
                  </div>
                </td>

                <!-- Period 4 -->
                <td class="slot-cell">
                  <div *ngIf="getPeriod(day, 4) as p; else emptySlot" class="slot-card" [ngClass]="getSubjectTheme(p.subjectName)">
                    <div class="slot-top">
                      <span class="slot-badge">{{ p.subjectName }}</span>
                      <span class="slot-room">{{ p.roomNo }}</span>
                    </div>
                    <div class="slot-teacher">
                      <app-icon name="user" [size]="14"></app-icon>
                      <span>{{ p.teacherName }}</span>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <ng-template #emptySlot>
            <div class="empty-period-slot">
              <span class="empty-dash"></span>
              <span class="empty-label">Free Period</span>
            </div>
          </ng-template>
        </div>
      </div>
    </div>

    <!-- ASSIGN PERIOD MODAL -->
    <app-modal
      [(isOpen)]="isModalOpen"
      title="Assign Routine Period"
      subtitle="Conflict check verifies teacher and room availability."
      [maxWidth]="540"
    >
      <form (ngSubmit)="savePeriod()">
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Day of Week <span class="required">*</span></label>
            <select class="form-select" [(ngModel)]="newPeriod.day" name="day">
              <option *ngFor="let d of days" [value]="d">{{ d }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Period Number <span class="required">*</span></label>
            <select class="form-select" [(ngModel)]="newPeriod.periodNumber" name="periodNumber">
              <option [ngValue]="1">Period 1 (08:30 - 09:15 AM)</option>
              <option [ngValue]="2">Period 2 (09:15 - 10:00 AM)</option>
              <option [ngValue]="3">Period 3 (10:15 - 11:00 AM)</option>
              <option [ngValue]="4">Period 4 (11:00 - 11:45 AM)</option>
            </select>
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Subject <span class="required">*</span></label>
            <select class="form-select" [(ngModel)]="newPeriod.subjectId" name="subjectId">
              <option *ngFor="let sub of subjects" [value]="sub.id">{{ sub.name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Teacher <span class="required">*</span></label>
            <select class="form-select" [(ngModel)]="newPeriod.teacherId" name="teacherId">
              <option *ngFor="let t of teachers" [value]="t.id">{{ t.fullName }} ({{ t.department }})</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Classroom / Lab Number <span class="required">*</span></label>
          <input type="text" class="form-control" [(ngModel)]="newPeriod.roomNo" name="roomNo" placeholder="e.g. Room 301, Lab 2" required />
        </div>

        <div class="flex justify-end gap-2 mt-4" footer>
          <button type="button" class="btn btn-outline" (click)="isModalOpen = false">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Routine Period</button>
        </div>
      </form>
    </app-modal>
  `,
  styles: [`
    .mb-4 { margin-bottom: 24px; }
    .mb-0 { margin-bottom: 0 !important; }
    .mt-4 { margin-top: 16px; }
    .text-primary { color: #4f46e5; }
    .text-emerald { color: #059669; }

    /* Student Hero Banner */
    .student-hero-banner {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%);
      color: #ffffff;
      border-radius: 18px;
      padding: 22px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .hero-left {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .hero-avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      border: 3px solid #818cf8;
      object-fit: cover;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    }
    .hero-tag {
      font-size: 0.7rem;
      font-weight: 800;
      color: #a5b4fc;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .hero-name {
      font-size: 1.4rem;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 8px 0;
      letter-spacing: -0.02em;
    }
    .hero-meta {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .meta-chip {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 0.775rem;
      font-weight: 600;
      color: #e0e7ff;
    }
    .chip-active {
      background: rgba(16, 185, 129, 0.2);
      border-color: rgba(16, 185, 129, 0.4);
      color: #a7f3d0;
    }
    .btn-outline-white {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #ffffff;
    }
    .btn-outline-white:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .routine-filter-row {
      display: flex;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }
    .conflict-guard-pill {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 999px;
      font-size: 0.775rem;
      font-weight: 700;
      color: #166534;
    }
    .total-slots-tag {
      font-size: 0.75rem;
      font-weight: 700;
      background: #eef2ff;
      color: #4f46e5;
      padding: 4px 10px;
      border-radius: 6px;
    }

    /* Timetable Grid */
    .timetable-card {
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
    }
    .timetable-grid-wrapper {
      overflow-x: auto;
    }
    .timetable-grid {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      table-layout: fixed;
    }
    .timetable-grid th {
      background: #f8fafc;
      padding: 14px 12px;
      border-bottom: 2px solid #e2e8f0;
      border-right: 1px solid #f1f5f9;
      text-align: center;
    }
    .timetable-grid td {
      padding: 10px;
      border-bottom: 1px solid #f1f5f9;
      border-right: 1px solid #f1f5f9;
      vertical-align: middle;
      background: #ffffff;
    }
    .period-th {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }
    .th-pname {
      font-size: 0.85rem;
      font-weight: 800;
      color: #0f172a;
    }
    .th-time {
      font-size: 0.72rem;
      font-weight: 600;
      color: #64748b;
      font-family: monospace;
    }
    .day-cell {
      background: #f8fafc !important;
      text-align: center;
      border-right: 2px solid #e2e8f0 !important;
    }
    .day-name {
      font-size: 0.95rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.01em;
    }

    /* Slot Card Designs */
    .slot-card {
      border-radius: 12px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid transparent;
      cursor: default;
    }
    .slot-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px -2px rgba(0, 0, 0, 0.08);
    }
    .slot-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 6px;
    }
    .slot-badge {
      font-size: 0.825rem;
      font-weight: 800;
      letter-spacing: -0.01em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .slot-room {
      font-size: 0.68rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(0, 0, 0, 0.06);
      white-space: nowrap;
    }
    .slot-teacher {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      opacity: 0.9;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Vibrant Subject Themes */
    .theme-indigo {
      background: #eef2ff;
      border-color: #c7d2fe;
      color: #3730a3;
    }
    .theme-indigo .slot-badge { color: #3730a3; }

    .theme-purple {
      background: #f5f3ff;
      border-color: #ddd6fe;
      color: #5b21b6;
    }
    .theme-purple .slot-badge { color: #5b21b6; }

    .theme-emerald {
      background: #ecfdf5;
      border-color: #a7f3d0;
      color: #065f46;
    }
    .theme-emerald .slot-badge { color: #065f46; }

    .theme-sky {
      background: #f0f9ff;
      border-color: #bae6fd;
      color: #0369a1;
    }
    .theme-sky .slot-badge { color: #0369a1; }

    .theme-rose {
      background: #fff1f2;
      border-color: #fecdd3;
      color: #9f1239;
    }
    .theme-rose .slot-badge { color: #9f1239; }

    .theme-amber {
      background: #fffbeb;
      border-color: #fde68a;
      color: #92400e;
    }
    .theme-amber .slot-badge { color: #92400e; }

    /* Break / Tiffin */
    .break-cell {
      background: #f1f5f9 !important;
      text-align: center;
      vertical-align: middle;
    }
    .break-pill {
      writing-mode: vertical-rl;
      text-orientation: mixed;
      margin: 0 auto;
      letter-spacing: 0.2em;
      font-size: 0.7rem;
      font-weight: 800;
      color: #94a3b8;
    }

    /* Empty Free Period */
    .empty-period-slot {
      border: 1px dashed #cbd5e1;
      border-radius: 10px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      background: #fafafa;
    }
    .empty-dash {
      width: 16px;
      height: 2px;
      background: #cbd5e1;
      border-radius: 2px;
    }
    .empty-label {
      font-size: 0.72rem;
      font-weight: 600;
      color: #94a3b8;
    }
  `]
})
export class RoutineComponent implements OnInit {
  private db = inject(MockDbService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  currentUser: User | null = null;
  isStudent = false;
  isGuardian = false;
  canAssignPeriod = false;
  browseOtherClasses = false;

  classes: SchoolClass[] = [];
  sections: Section[] = [];
  subjects: Subject[] = [];
  teachers: Teacher[] = [];

  selectedClassId = 'cls-10';
  selectedSectionId = 'sec-10a';

  routine: RoutinePeriod[] = [];
  days: ('Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday')[] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday'
  ];

  isModalOpen = false;
  newPeriod: Partial<RoutinePeriod> = {
    day: 'Tuesday',
    periodNumber: 1,
    subjectId: 'sub-mat',
    teacherId: 'tch-01',
    roomNo: 'Room 301'
  };

  ngOnInit() {
    this.classes = this.db.getClasses();
    this.subjects = this.db.getSubjects();
    this.teachers = this.db.getTeachers();

    this.auth.getCurrentUser$().subscribe(user => {
      this.currentUser = user;
      this.isStudent = user?.roleId === 'role-student' || user?.roleName.includes('Student') || false;
      this.isGuardian = user?.roleId === 'role-guardian' || user?.roleName.includes('Guardian') || false;
      this.canAssignPeriod = this.auth.hasPermission('ACAD_ROUTINE', 'create');

      // If student or guardian, lock directly to their enrolled Class 10 (Section A)
      if (this.isStudent || this.isGuardian) {
        this.selectedClassId = 'cls-10';
        this.selectedSectionId = 'sec-10a';
      }
      this.onClassChange();
    });

    this.db.getRoutine$().subscribe(r => {
      this.routine = r;
    });
  }

  onClassChange() {
    this.sections = this.db.getSections(this.selectedClassId);
    if (this.sections.length > 0 && !this.sections.some(s => s.id === this.selectedSectionId)) {
      this.selectedSectionId = this.sections[0].id;
    }
  }

  getClassName(): string {
    return this.classes.find(c => c.id === this.selectedClassId)?.name || '';
  }

  getSectionName(): string {
    return this.sections.find(s => s.id === this.selectedSectionId)?.name || '';
  }

  getPeriod(day: string, periodNumber: number): RoutinePeriod | undefined {
    return this.routine.find(
      r =>
        r.day === day &&
        r.periodNumber === periodNumber &&
        r.classId === this.selectedClassId &&
        r.sectionId === this.selectedSectionId
    );
  }

  getSubjectTheme(subjName: string): string {
    const s = subjName.toLowerCase();
    if (s.includes('math')) return 'theme-indigo';
    if (s.includes('phys')) return 'theme-purple';
    if (s.includes('chem')) return 'theme-emerald';
    if (s.includes('eng')) return 'theme-sky';
    if (s.includes('bang')) return 'theme-rose';
    if (s.includes('ict') || s.includes('tech') || s.includes('comp')) return 'theme-amber';
    if (s.includes('bio')) return 'theme-emerald';
    return 'theme-indigo';
  }

  printRoutine() {
    window.print();
  }

  openAddPeriodModal() {
    this.newPeriod = {
      day: 'Tuesday',
      periodNumber: 1,
      subjectId: this.subjects[0]?.id,
      teacherId: this.teachers[0]?.id,
      roomNo: 'Room 301'
    };
    this.isModalOpen = true;
  }

  savePeriod() {
    // Conflict check (PDF Section 07)
    const teacherConflict = this.routine.find(
      r =>
        r.day === this.newPeriod.day &&
        r.periodNumber === this.newPeriod.periodNumber &&
        r.teacherId === this.newPeriod.teacherId
    );

    if (teacherConflict) {
      this.toast.error(
        'Schedule Conflict!',
        `Teacher ${teacherConflict.teacherName} is already assigned to ${teacherConflict.className} (${teacherConflict.sectionName}) in Period ${this.newPeriod.periodNumber} on ${this.newPeriod.day}.`
      );
      return;
    }

    const sub = this.subjects.find(s => s.id === this.newPeriod.subjectId);
    const tch = this.teachers.find(t => t.id === this.newPeriod.teacherId);

    const periodObj: RoutinePeriod = {
      id: 'rt-' + Date.now(),
      day: this.newPeriod.day as any,
      periodNumber: this.newPeriod.periodNumber || 1,
      startTime: '08:30 AM',
      endTime: '09:15 AM',
      classId: this.selectedClassId,
      className: this.getClassName(),
      sectionId: this.selectedSectionId,
      sectionName: this.getSectionName(),
      subjectId: this.newPeriod.subjectId || '',
      subjectName: sub?.name || '',
      teacherId: this.newPeriod.teacherId || '',
      teacherName: tch?.fullName || '',
      roomNo: this.newPeriod.roomNo || 'Room 301'
    };

    this.routine.push(periodObj);
    this.toast.success('Period Scheduled', `Assigned ${periodObj.subjectName} to ${periodObj.day} Period ${periodObj.periodNumber}`);
    this.isModalOpen = false;
  }
}
