import { CampusImageDirective } from '../../shared/components/campus-image.directive';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AcademicStoreService } from '../../core/services/stores/academic-store.service';
import { TeacherStoreService } from '../../core/services/stores/teacher-store.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { RoutinePeriod, SchoolClass, Section, Teacher, Subject, User } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';
import { ModalComponent } from '../../shared/components/modal.component';

export type AcademicTier = 'pre-primary' | 'primary' | 'secondary';

export interface PeriodSlotDef {
  periodNumber: number;
  label: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export interface BreakSlotDef {
  enabled: boolean;
  name: string;
  afterPeriod: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export interface RoutineStructureConfig {
  tier: AcademicTier;
  totalPeriods: number;
  schoolStartTime: string; // e.g. "08:30"
  periodDurationMinutes: number; // e.g. 40
  break: BreakSlotDef;
  periods: PeriodSlotDef[];
}

@Component({
  selector: 'app-routine',
  standalone: true,
  imports: [CampusImageDirective, CommonModule, FormsModule, IconComponent, ModalComponent],
  template: `
    <div class="page-container">
      <!-- 1. INSTITUTIONAL PAGE HEADER -->
      <div class="page-header no-print">
        <div class="header-left">
          <div class="header-badge-icon">
            <app-icon name="calendar-clock" [size]="28" class="text-indigo"></app-icon>
          </div>
          <div>
            <h1 class="page-title">
              {{ (isStudent || isGuardian) ? (isGuardian ? 'Ward Academic Class Timetable' : 'My Academic Class Timetable') : 'Academic Class Timetable & Routine Matrix' }}
            </h1>
            <p class="page-subtitle">
              {{ (isStudent || isGuardian) 
                ? 'Weekly routine for enrolled courses, faculty instructors, and assigned rooms.' 
                : 'Dynamic tier-based academic scheduling engine with automated faculty & room conflict detection.' 
              }}
            </p>
          </div>
        </div>

        <!-- PRINCIPAL & ADMIN ACTION BUTTONS -->
        <div class="header-actions">
          <button type="button" class="btn btn-outline" (click)="printRoutine()" title="Print Official Timetable">
            <app-icon name="printer" [size]="16"></app-icon>
            <span>Print Timetable</span>
          </button>

          <!-- Structure Customization (Principal/Admin Only) -->
          <button
            *ngIf="canManageRoutine"
            type="button"
            class="btn btn-outline"
            (click)="openStructureModal()"
            title="Configure Class Period Structure & Timings"
          >
            <app-icon name="sliders" [size]="16" class="text-indigo"></app-icon>
            <span>Period Timings</span>
          </button>

          <!-- Apply Academic Plan Template -->
          <button
            *ngIf="canManageRoutine"
            type="button"
            class="btn btn-outline btn-tier-template"
            (click)="applyTierTemplate()"
            title="Auto-fill recommended class routine template"
          >
            <app-icon name="sparkles" [size]="16" class="text-amber"></app-icon>
            <span>Apply Tier Plan</span>
          </button>

          <!-- Assign Routine Period Modal -->
          <button
            *ngIf="canManageRoutine"
            type="button"
            class="btn btn-primary"
            (click)="openAddPeriodModal()"
          >
            <app-icon name="plus" [size]="16"></app-icon>
            <span>Assign Period</span>
          </button>
        </div>
      </div>

      <!-- 2. PERSONALIZED STUDENT / GUARDIAN BANNER -->
      <div *ngIf="(isStudent || isGuardian) && currentUser" class="student-hero-banner mb-4 no-print">
        <div class="hero-left">
          <img 
            campusImage 
            [src]="isGuardian ? 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80' : currentUser.avatar" 
            [alt]="currentUser.fullName" 
            class="hero-avatar" />
          <div>
            <div class="hero-tag">{{ isGuardian ? 'PARENT / GUARDIAN PORTAL • ENROLLED WARD' : 'STUDENT ENROLLMENT DOSSIER' }}</div>
            <h2 class="hero-name">{{ isGuardian ? 'Tanvir Ahmed (Roll #01)' : currentUser.fullName }}</h2>
            <div class="hero-meta">
              <span class="meta-chip">{{ getClassName() }} — {{ getSectionName() }}</span>
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

      <!-- 3. KPI METRICS CARDS -->
      <div class="kpi-grid mb-4 no-print" *ngIf="!isStudent || browseOtherClasses">
        <!-- KPI 1: Class Tier & Periods -->
        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-indigo">
            <app-icon name="graduation-cap" [size]="20"></app-icon>
          </div>
          <div class="kpi-info">
            <div class="kpi-label">Academic Tier</div>
            <div class="kpi-value text-capitalize">{{ activeStructure.tier }} Tier</div>
            <div class="kpi-subtext">{{ activeStructure.totalPeriods }} Periods Daily ({{ activeStructure.periodDurationMinutes }}m)</div>
          </div>
        </div>

        <!-- KPI 2: Schedule Completeness -->
        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-emerald">
            <app-icon name="check-circle" [size]="20"></app-icon>
          </div>
          <div class="kpi-info">
            <div class="kpi-label">Weekly Slots Filled</div>
            <div class="kpi-value">{{ currentFilledSlots }} / {{ totalWeeklySlots }}</div>
            <div class="kpi-subtext">{{ scheduleEfficiencyPercent }}% Completeness</div>
          </div>
        </div>

        <!-- KPI 3: Assigned Faculty -->
        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-sky">
            <app-icon name="users" [size]="20"></app-icon>
          </div>
          <div class="kpi-info">
            <div class="kpi-label">Faculty Assigned</div>
            <div class="kpi-value">{{ uniqueTeachersCount }} Teachers</div>
            <div class="kpi-subtext">Conflict Guard Active</div>
          </div>
        </div>

        <!-- KPI 4: Academic Timing Range -->
        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-purple">
            <app-icon name="calendar-clock" [size]="20"></app-icon>
          </div>
          <div class="kpi-info">
            <div class="kpi-label">School Timing</div>
            <div class="kpi-value">{{ schoolTimeRange }}</div>
            <div class="kpi-subtext">{{ activeStructure.break.name }} at {{ activeStructure.break.startTime }}</div>
          </div>
        </div>
      </div>

      <!-- 4. CONTROLS, SELECTORS & QUICK ACTIONS BAR -->
      <div class="controls-card mb-4 no-print" *ngIf="!isStudent || browseOtherClasses">
        <div class="routine-controls-row">
          <!-- Class Selector -->
          <div class="control-item">
            <label class="control-label">Academic Class</label>
            <div class="custom-select-wrap">
              <select class="control-select" [(ngModel)]="selectedClassId" (change)="onClassChange()">
                <option *ngFor="let c of classes" [value]="c.id">{{ c.name }} ({{ c.code || 'CLS' }})</option>
              </select>
              <span class="select-caret">▾</span>
            </div>
          </div>

          <!-- Section Selector -->
          <div class="control-item">
            <label class="control-label">Section / Group</label>
            <div class="custom-select-wrap">
              <select class="control-select" [(ngModel)]="selectedSectionId" (change)="onSectionChange()">
                <option *ngFor="let s of sections" [value]="s.id">{{ s.name }}</option>
                <option *ngIf="sections.length === 0" value="">-- No Sections Configured --</option>
              </select>
              <span class="select-caret">▾</span>
            </div>
          </div>

          <!-- View Mode Toggle: Class Timetable vs Teacher Schedule -->
          <div class="control-item" *ngIf="canManageRoutine">
            <label class="control-label">Timetable View</label>
            <div class="view-toggle-pills">
              <button 
                type="button" 
                class="pill-btn" 
                [class.active]="viewMode === 'class'" 
                (click)="viewMode = 'class'">
                Class Matrix
              </button>
              <button 
                type="button" 
                class="pill-btn" 
                [class.active]="viewMode === 'teacher'" 
                (click)="viewMode = 'teacher'">
                Faculty View
              </button>
            </div>
          </div>

          <!-- Teacher Selector (When Faculty View is Active) -->
          <div class="control-item" *ngIf="viewMode === 'teacher'">
            <label class="control-label">Select Faculty Member</label>
            <div class="custom-select-wrap">
              <select class="control-select" [(ngModel)]="selectedTeacherId">
                <option *ngFor="let t of teachers" [value]="t.id">{{ t.fullName }} ({{ t.department }})</option>
              </select>
              <span class="select-caret">▾</span>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div class="controls-actions-group" *ngIf="canManageRoutine && viewMode === 'class'">
            <button type="button" class="btn-ctrl" (click)="openCloneModal()" title="Clone Timetable to Another Section">
              <app-icon name="layers" [size]="14"></app-icon>
              <span>Clone Routine</span>
            </button>
            
            <button type="button" class="btn-ctrl btn-ctrl-danger" (click)="confirmClearRoutine()" title="Clear Current Routine">
              <app-icon name="trash" [size]="14"></app-icon>
              <span>Clear</span>
            </button>
          </div>

          <!-- Conflict Status Pill -->
          <div class="conflict-guard-status">
            <app-icon name="shield-check" [size]="16" class="text-emerald"></app-icon>
            <span>Automated Conflict Guard Active</span>
          </div>
        </div>
      </div>

      <!-- 5. PRINT HEADER (Visible only when printing) -->
      <div class="print-header-sheet only-print">
        <div class="print-school-title">SCHOLARS INTERNATIONAL ACADEMY</div>
        <div class="print-school-subtitle">Institutional Academic Class Routine • Session 2026–2027</div>
        <div class="print-meta-grid">
          <div><strong>Class:</strong> {{ getClassName() }}</div>
          <div><strong>Section:</strong> {{ getSectionName() }}</div>
          <div><strong>Academic Tier:</strong> {{ activeStructure.tier | uppercase }}</div>
          <div><strong>Issued:</strong> Academic Session 2026-2027</div>
        </div>
      </div>

      <!-- 6. DYNAMIC TIMETABLE WEEKLY GRID (CLASS MATRIX VIEW) -->
      <div class="card timetable-card mb-4" *ngIf="viewMode === 'class'">
        <div class="card-header no-print">
          <div class="card-title">
            <app-icon name="calendar-clock" [size]="18" class="text-indigo"></app-icon>
            <span>Weekly Schedule: <strong>{{ getClassName() }} ({{ getSectionName() }})</strong></span>
          </div>
          <div class="header-tags-wrap">
            <span class="tier-badge" [ngClass]="'tier-' + activeStructure.tier">{{ activeStructure.tier | uppercase }} TIER</span>
            <span class="slots-tag">{{ activeStructure.totalPeriods }} Periods Daily • {{ days.length }} Days Week</span>
          </div>
        </div>

        <div class="timetable-grid-wrapper">
          <table class="timetable-grid">
            <thead>
              <tr>
                <th style="width: 120px;" class="col-day">Day</th>
                
                <!-- Dynamic Period Columns & Break Placement -->
                <ng-container *ngFor="let p of activeStructure.periods">
                  <th class="col-period">
                    <div class="period-th">
                      <span class="th-pname">{{ p.label }}</span>
                      <span class="th-time">{{ p.startTime }} – {{ p.endTime }}</span>
                    </div>
                  </th>

                  <!-- Break Column inserted dynamically -->
                  <th *ngIf="activeStructure.break.enabled && activeStructure.break.afterPeriod === p.periodNumber" class="col-break">
                    <div class="break-th">
                      <span class="break-title">{{ activeStructure.break.name }}</span>
                      <span class="break-time">{{ activeStructure.break.startTime }} – {{ activeStructure.break.endTime }}</span>
                    </div>
                  </th>
                </ng-container>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let day of days">
                <!-- Day Label -->
                <td class="day-cell">
                  <span class="day-name">{{ day }}</span>
                </td>

                <!-- Period Slots -->
                <ng-container *ngFor="let p of activeStructure.periods">
                  <td class="slot-cell">
                    <!-- If Period is Assigned -->
                    <div 
                      *ngIf="getPeriod(day, p.periodNumber) as slot; else emptySlotTpl" 
                      class="slot-card" 
                      [ngClass]="getSubjectTheme(slot.subjectName)"
                      (click)="canManageRoutine ? openEditPeriodModal(slot) : null"
                    >
                      <div class="slot-top">
                        <span class="slot-badge">{{ slot.subjectName }}</span>
                        <span class="slot-room">{{ slot.roomNo }}</span>
                      </div>
                      
                      <div class="slot-teacher">
                        <app-icon name="user" [size]="13"></app-icon>
                        <span class="teacher-name-txt">{{ slot.teacherName }}</span>
                      </div>

                      <!-- Action Buttons on Hover -->
                      <div class="slot-hover-actions no-print" *ngIf="canManageRoutine">
                        <button type="button" class="btn-slot-act" (click)="$event.stopPropagation(); openEditPeriodModal(slot)" title="Edit Period">
                          <app-icon name="edit" [size]="12"></app-icon>
                        </button>
                        <button type="button" class="btn-slot-act btn-slot-del" (click)="$event.stopPropagation(); deleteSlot(slot.id)" title="Remove Period">
                          <app-icon name="trash" [size]="12"></app-icon>
                        </button>
                      </div>
                    </div>

                    <!-- Empty Slot Template -->
                    <ng-template #emptySlotTpl>
                      <div 
                        class="empty-slot-card" 
                        [class.clickable]="canManageRoutine"
                        (click)="canManageRoutine ? openAddPeriodModal(day, p.periodNumber) : null"
                        title="Click to assign period"
                      >
                        <span class="empty-dash"></span>
                        <span class="empty-label">{{ canManageRoutine ? '+ Assign' : 'Free Period' }}</span>
                      </div>
                    </ng-template>
                  </td>

                  <!-- Break Column in Table Body -->
                  <td *ngIf="activeStructure.break.enabled && activeStructure.break.afterPeriod === p.periodNumber" class="break-cell">
                    <div class="break-pill">
                      <span>{{ activeStructure.break.name }}</span>
                    </div>
                  </td>
                </ng-container>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 7. FACULTY INDIVIDUAL SCHEDULE VIEW (TEACHER VIEW) -->
      <div class="card timetable-card mb-4" *ngIf="viewMode === 'teacher'">
        <div class="card-header no-print">
          <div class="card-title">
            <app-icon name="user" [size]="18" class="text-indigo"></app-icon>
            <span>Faculty Schedule: <strong>{{ getSelectedTeacherName() }}</strong></span>
          </div>
          <span class="slots-tag">{{ getTeacherPeriodCount() }} Assigned Periods Weekly</span>
        </div>

        <div class="timetable-grid-wrapper">
          <table class="timetable-grid">
            <thead>
              <tr>
                <th style="width: 120px;" class="col-day">Day</th>
                <ng-container *ngFor="let p of activeStructure.periods">
                  <th class="col-period">
                    <div class="period-th">
                      <span class="th-pname">{{ p.label }}</span>
                      <span class="th-time">{{ p.startTime }} – {{ p.endTime }}</span>
                    </div>
                  </th>
                </ng-container>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let day of days">
                <td class="day-cell">
                  <span class="day-name">{{ day }}</span>
                </td>
                <td *ngFor="let p of activeStructure.periods" class="slot-cell">
                  <div *ngIf="getTeacherPeriod(day, p.periodNumber) as tp; else freeTeacherSlot" class="slot-card theme-indigo">
                    <div class="slot-top">
                      <span class="slot-badge">{{ tp.subjectName }}</span>
                      <span class="slot-room">{{ tp.roomNo }}</span>
                    </div>
                    <div class="slot-teacher">
                      <app-icon name="graduation-cap" [size]="13"></app-icon>
                      <span>{{ tp.className }} ({{ tp.sectionName }})</span>
                    </div>
                  </div>
                  <ng-template #freeTeacherSlot>
                    <div class="empty-slot-card">
                      <span class="empty-label">Available</span>
                    </div>
                  </ng-template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 8. PRINT FOOTER (Visible only when printing) -->
      <div class="print-footer-sheet only-print">
        <div class="print-sign-box">
          <div class="sign-line"></div>
          <div>Class Teacher</div>
        </div>
        <div class="print-sign-box">
          <div class="sign-line"></div>
          <div>Academic Coordinator</div>
        </div>
        <div class="print-sign-box">
          <div class="sign-line"></div>
          <div>Principal & Head of School</div>
        </div>
      </div>
    </div>

    <!-- MODAL 1: ASSIGN / EDIT PERIOD SLOT -->
    <app-modal
      [(isOpen)]="isPeriodModalOpen"
      [title]="isEditingPeriod ? 'Edit Routine Period Slot' : 'Assign Academic Period'"
      [subtitle]="'Configuring schedule for ' + getClassName() + ' (' + getSectionName() + ')'"
      [maxWidth]="600"
    >
      <form (ngSubmit)="savePeriodSlot()">
        <!-- CONFLICT DETECTION WARNING BANNER -->
        <div *ngIf="conflictWarning" class="conflict-alert-box mb-3">
          <div class="conflict-alert-icon">
            <app-icon name="alert-triangle" [size]="20"></app-icon>
          </div>
          <div class="conflict-alert-content">
            <div class="conflict-alert-title">Schedule Conflict Detected!</div>
            <div class="conflict-alert-desc">{{ conflictWarning }}</div>
            <div class="mt-2 flex gap-2">
              <button 
                *ngIf="conflictWarning.includes('Classroom Conflict')" 
                type="button" 
                class="btn-conflict-resolve" 
                (click)="suggestFreeRoom()"
              >
                <app-icon name="check-circle" [size]="14"></app-icon>
                <span>Switch to Free Room</span>
              </button>
              <button 
                *ngIf="conflictWarning.includes('Faculty Conflict')" 
                type="button" 
                class="btn-conflict-resolve" 
                (click)="suggestFreeTeacher()"
              >
                <app-icon name="check-circle" [size]="14"></app-icon>
                <span>Switch to Free Faculty</span>
              </button>
              <button 
                type="button" 
                class="btn-conflict-override" 
                (click)="forceSavePeriod()"
                title="Save this period assignment anyway"
              >
                <app-icon name="alert-circle" [size]="14"></app-icon>
                <span>Save Anyway (Override)</span>
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="!conflictWarning && newPeriod.teacherId && newPeriod.roomNo" class="conflict-safe-badge mb-3">
          <app-icon name="shield-check" [size]="16" class="text-emerald"></app-icon>
          <span>Conflict Free: Teacher and Classroom are available for this period.</span>
        </div>

        <div class="grid-2">
          <!-- Day of Week -->
          <div class="form-group">
            <label class="form-label">Day of Week <span class="required">*</span></label>
            <select class="form-select" [(ngModel)]="newPeriod.day" name="day" (change)="checkConflicts()">
              <option *ngFor="let d of days" [value]="d">{{ d }}</option>
            </select>
          </div>

          <!-- Period Number -->
          <div class="form-group">
            <label class="form-label">Period Slot <span class="required">*</span></label>
            <select class="form-select" [(ngModel)]="newPeriod.periodNumber" name="periodNumber" (change)="checkConflicts()">
              <option *ngFor="let p of activeStructure.periods" [ngValue]="p.periodNumber">
                {{ p.label }} ({{ p.startTime }} - {{ p.endTime }})
              </option>
            </select>
          </div>
        </div>

        <div class="grid-2">
          <!-- Subject (Class Matrix Prioritized) -->
          <div class="form-group">
            <div class="flex justify-between items-center mb-1">
              <label class="form-label mb-0">Subject (Class Matrix) <span class="required">*</span></label>
              <span *ngIf="classMatrixSubjects.length > 0 && classMatrixSubjects.length < subjects.length" class="badge-curriculum-count">
                {{ classMatrixSubjects.length }} in {{ getClassName() }} Matrix
              </span>
            </div>
            <select class="form-select" [(ngModel)]="newPeriod.subjectId" name="subjectId" (change)="onSubjectChange()" required>
              <optgroup *ngIf="classMatrixSubjects.length > 0" [label]="getClassName() + ' Curriculum Matrix (' + classMatrixSubjects.length + ' Subjects)'">
                <option *ngFor="let sub of classMatrixSubjects" [value]="sub.id">
                  {{ sub.name }} ({{ sub.code }}) - {{ sub.type }}
                </option>
              </optgroup>
              <optgroup *ngIf="otherSubjects.length > 0" label="Other School Subjects">
                <option *ngFor="let sub of otherSubjects" [value]="sub.id">
                  {{ sub.name }} ({{ sub.code }})
                </option>
              </optgroup>
            </select>
          </div>

          <!-- Faculty Teacher -->
          <div class="form-group">
            <label class="form-label">Teacher <span class="required">*</span></label>
            <select class="form-select" [(ngModel)]="newPeriod.teacherId" name="teacherId" (change)="checkConflicts()" required>
              <option *ngFor="let t of teachers" [value]="t.id">{{ t.fullName }} ({{ t.department }})</option>
            </select>
          </div>
        </div>

        <!-- Classroom / Room -->
        <div class="form-group">
          <div class="flex justify-between items-center mb-1">
            <label class="form-label mb-0">Classroom / Lab Number <span class="required">*</span></label>
            <button 
              *ngIf="conflictWarning && conflictWarning.includes('Classroom')" 
              type="button" 
              class="btn-text text-indigo text-xs" 
              (click)="suggestFreeRoom()"
            >
              Auto-fix: Suggest Free Room
            </button>
          </div>
          <input 
            type="text" 
            list="classroom-suggestions"
            class="form-control" 
            [(ngModel)]="newPeriod.roomNo" 
            name="roomNo" 
            (input)="checkConflicts()" 
            placeholder="e.g. Room 301, Science Lab, ICT Lab" 
            required 
          />
          <datalist id="classroom-suggestions">
            <option *ngFor="let r of standardRooms" [value]="r"></option>
          </datalist>
          <!-- Quick Room Chips -->
          <div class="quick-room-chips mt-2">
            <span class="chip-label">Quick select:</span>
            <button 
              type="button" 
              *ngFor="let r of quickRooms" 
              class="room-chip" 
              [class.active]="newPeriod.roomNo === r"
              (click)="newPeriod.roomNo = r; checkConflicts()"
            >
              {{ r }}
            </button>
          </div>

          <!-- Conflict override toggle when conflict detected -->
          <div *ngIf="conflictWarning" class="conflict-override-check mt-3">
            <label class="flex items-center gap-2 cursor-pointer text-xs font-semibold text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
              <input type="checkbox" [(ngModel)]="allowConflictOverride" name="allowConflictOverride" />
              <span>Allow Simultaneous Room / Faculty Assignment (Save Anyway without blocking)</span>
            </label>
          </div>
        </div>

        <div class="flex justify-between items-center mt-4" footer>
          <div>
            <button 
              *ngIf="isEditingPeriod && activeEditingSlotId" 
              type="button" 
              class="btn btn-outline-danger" 
              (click)="deleteSlot(activeEditingSlotId); isPeriodModalOpen = false"
            >
              <app-icon name="trash" [size]="14"></app-icon>
              <span>Delete Slot</span>
            </button>
          </div>

          <div class="flex gap-2">
            <button type="button" class="btn btn-outline" (click)="isPeriodModalOpen = false">Cancel</button>
            <button type="submit" class="btn btn-primary">
              {{ isEditingPeriod ? 'Update Slot' : 'Save Routine Period' }}
            </button>
          </div>
        </div>
      </form>
    </app-modal>

    <!-- MODAL 2: PRINCIPAL TIMETABLE STRUCTURE & TIMINGS CUSTOMIZER -->
    <app-modal
      [(isOpen)]="isStructureModalOpen"
      title="Configure Class Period Structure & Timings"
      subtitle="Principal Administrative Engine: Customize daily periods, timings, and recess breaks."
      [maxWidth]="650"
    >
      <form (ngSubmit)="saveStructureConfig()">
        <!-- Class Context Info Banner -->
        <div class="class-context-banner mb-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <app-icon name="info" [size]="18" class="text-indigo"></app-icon>
              <span>Configuring Schedule Structure for: <strong class="text-purple">{{ getClassName() }}</strong></span>
            </div>
            <span class="tier-pill-small">{{ (editStructure.tier || activeStructure.tier) | uppercase }} TIER</span>
          </div>
          <p class="text-xs text-muted mb-0 mt-1">
            Choose a standard tier preset below for {{ getClassName() }}, or manually customize total periods, start time, and recess breaks.
          </p>
        </div>

        <!-- Preset Tier Selectors -->
        <div class="tier-preset-section mb-3">
          <label class="form-label font-bold">Quick Academic Tier Presets:</label>
          <div class="tier-presets-row">
            <button 
              type="button" 
              class="btn-tier-preset" 
              [class.active]="editStructure.tier === 'pre-primary'" 
              (click)="applyTierPreset('pre-primary')"
              title="Apply Pre-Primary Tier (Play, Nursery, KG)"
            >
              <strong>Pre-Primary</strong>
              <div class="tier-desc-hint">Play, Nursery, KG</div>
              <span>4 Periods • 35m • Recess after P2</span>
            </button>

            <button 
              type="button" 
              class="btn-tier-preset" 
              [class.active]="editStructure.tier === 'primary'" 
              (click)="applyTierPreset('primary')"
              title="Apply Primary Tier (Class 1 to 5)"
            >
              <strong>Primary</strong>
              <div class="tier-desc-hint">Class 1 to 5 (One - Five)</div>
              <span>6 Periods • 40m • Tiffin after P3</span>
            </button>

            <button 
              type="button" 
              class="btn-tier-preset" 
              [class.active]="editStructure.tier === 'secondary'" 
              (click)="applyTierPreset('secondary')"
              title="Apply Secondary Tier (Class 6 to 10/12)"
            >
              <strong>Secondary</strong>
              <div class="tier-desc-hint">Class 6 to 10 / 12</div>
              <span>7 Periods • 45m • Lunch/Prayer after P4</span>
            </button>
          </div>
        </div>

        <!-- Academic Tier Setup Screen Link Banner -->
        <div class="tier-setup-link-box mb-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <app-icon name="layers" [size]="16" class="text-primary"></app-icon>
              <span class="text-xs text-slate-700">
                To customize which Academic Tier (Pre-Primary / Primary / Secondary) each class belongs to:
              </span>
            </div>
            <a routerLink="/app/academic/classes" class="btn-tier-setup-link" title="Open Academic Classes & Sections Setup Screen">
              <span>Class Tier Setup Screen</span>
              <app-icon name="external-link" [size]="12"></app-icon>
            </a>
          </div>
        </div>

        <div class="grid-2">
          <!-- Total Periods -->
          <div class="form-group">
            <label class="form-label">Total Daily Periods <span class="required">*</span></label>
            <select class="form-select" [(ngModel)]="editStructure.totalPeriods" name="totalPeriods" (change)="recalculatePeriodTimings()">
              <option [ngValue]="4">4 Periods Daily</option>
              <option [ngValue]="5">5 Periods Daily</option>
              <option [ngValue]="6">6 Periods Daily</option>
              <option [ngValue]="7">7 Periods Daily</option>
              <option [ngValue]="8">8 Periods Daily</option>
            </select>
          </div>

          <!-- School Start Time -->
          <div class="form-group">
            <label class="form-label">School Start Time <span class="required">*</span></label>
            <select class="form-select" [(ngModel)]="editStructure.schoolStartTime" name="schoolStartTime" (change)="recalculatePeriodTimings()">
              <option value="08:00 AM">08:00 AM</option>
              <option value="08:15 AM">08:15 AM</option>
              <option value="08:30 AM">08:30 AM</option>
              <option value="08:45 AM">08:45 AM</option>
              <option value="09:00 AM">09:00 AM</option>
            </select>
          </div>
        </div>

        <div class="grid-2">
          <!-- Period Duration -->
          <div class="form-group">
            <label class="form-label">Period Duration (Minutes) <span class="required">*</span></label>
            <select class="form-select" [(ngModel)]="editStructure.periodDurationMinutes" name="periodDurationMinutes" (change)="recalculatePeriodTimings()">
              <option [ngValue]="30">30 Minutes</option>
              <option [ngValue]="35">35 Minutes</option>
              <option [ngValue]="40">40 Minutes</option>
              <option [ngValue]="45">45 Minutes</option>
              <option [ngValue]="50">50 Minutes</option>
            </select>
          </div>

          <!-- Break Enabled -->
          <div class="form-group">
            <label class="form-label">Recess / Break Slot</label>
            <select class="form-select" [(ngModel)]="editStructure.break.enabled" name="breakEnabled" (change)="recalculatePeriodTimings()">
              <option [ngValue]="true">Enabled</option>
              <option [ngValue]="false">No Break</option>
            </select>
          </div>
        </div>

        <div class="grid-3" *ngIf="editStructure.break.enabled">
          <!-- Break Placement -->
          <div class="form-group">
            <label class="form-label">Break After Period</label>
            <select class="form-select" [(ngModel)]="editStructure.break.afterPeriod" name="afterPeriod" (change)="recalculatePeriodTimings()">
              <option *ngFor="let p of getAvailableBreakPositions()" [ngValue]="p">After Period {{ p }}</option>
            </select>
          </div>

          <!-- Break Label -->
          <div class="form-group">
            <label class="form-label">Break Label</label>
            <input type="text" class="form-control" [(ngModel)]="editStructure.break.name" name="breakName" placeholder="TIFFIN, RECESS" />
          </div>

          <!-- Break Duration -->
          <div class="form-group">
            <label class="form-label">Break Duration</label>
            <select class="form-select" [(ngModel)]="editStructure.break.durationMinutes" name="breakDuration" (change)="recalculatePeriodTimings()">
              <option [ngValue]="15">15 Minutes</option>
              <option [ngValue]="20">20 Minutes</option>
              <option [ngValue]="25">25 Minutes</option>
              <option [ngValue]="30">30 Minutes</option>
              <option [ngValue]="40">40 Minutes</option>
            </select>
          </div>
        </div>

        <!-- Computed Period Schedule Preview -->
        <div class="schedule-preview-box mt-3">
          <div class="preview-title">Generated Timings Preview:</div>
          <div class="preview-chips-list">
            <ng-container *ngFor="let p of editStructure.periods">
              <span class="preview-chip">{{ p.label }}: {{ p.startTime }}–{{ p.endTime }}</span>
              <span *ngIf="editStructure.break.enabled && editStructure.break.afterPeriod === p.periodNumber" class="preview-chip chip-break">
                {{ editStructure.break.name }}: {{ editStructure.break.startTime }}–{{ editStructure.break.endTime }}
              </span>
            </ng-container>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-4" footer>
          <button type="button" class="btn btn-outline" (click)="isStructureModalOpen = false">Cancel</button>
          <button type="submit" class="btn btn-primary">Apply & Save Structure</button>
        </div>
      </form>
    </app-modal>

    <!-- MODAL 3: CLONE TIMETABLE TO ANOTHER SECTION -->
    <app-modal
      [(isOpen)]="isCloneModalOpen"
      title="Clone Timetable to Another Section"
      subtitle="Replicate the entire weekly timetable from current section to a target section."
      [maxWidth]="500"
    >
      <div class="clone-modal-body">
        <p class="text-sm text-slate-600 mb-3">
          Copying from: <strong>{{ getClassName() }} — {{ getSectionName() }}</strong>
        </p>

        <div class="form-group">
          <label class="form-label">Target Class</label>
          <select class="form-select" [(ngModel)]="cloneTargetClassId" (change)="onCloneClassChange()">
            <option *ngFor="let c of classes" [value]="c.id">{{ c.name }}</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Target Section</label>
          <select class="form-select" [(ngModel)]="cloneTargetSectionId">
            <option *ngFor="let s of cloneSections" [value]="s.id">{{ s.name }}</option>
          </select>
        </div>

        <div class="flex justify-end gap-2 mt-4" footer>
          <button type="button" class="btn btn-outline" (click)="isCloneModalOpen = false">Cancel</button>
          <button type="button" class="btn btn-primary" (click)="executeCloneRoutine()">Clone Timetable</button>
        </div>
      </div>
    </app-modal>
  `,
  styles: [`
    .mb-4 { margin-bottom: 24px; }
    .mb-3 { margin-bottom: 16px; }
    .mt-3 { margin-top: 12px; }
    .mt-4 { margin-top: 16px; }
    .text-indigo { color: #4f46e5; }
    .text-emerald { color: #059669; }
    .text-amber { color: #d97706; }
    .font-bold { font-weight: 700; }
    .text-capitalize { text-transform: capitalize; }

    /* Page Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .header-badge-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
      margin: 0;
    }
    .page-subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin: 2px 0 0 0;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .btn-tier-template {
      background: #fffbeb;
      border-color: #fde68a;
      color: #b45309;
      font-weight: 700;
    }
    .btn-tier-template:hover {
      background: #fef3c7;
    }

    /* KPI Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }
    .kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 18px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.04);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.08);
    }
    .kpi-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .kpi-indigo { background: #eef2ff; color: #4f46e5; border: 1px solid #c7d2fe; }
    .kpi-emerald { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
    .kpi-sky { background: #f0f9ff; color: #0284c7; border: 1px solid #bae6fd; }
    .kpi-purple { background: #faf5ff; color: #9333ea; border: 1px solid #e9d5ff; }
    .kpi-label {
      font-size: 0.775rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .kpi-value {
      font-size: 1.35rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .kpi-subtext {
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: 500;
    }

    /* Controls Strip */
    .controls-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 16px 20px;
      box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.04);
    }
    .routine-controls-row {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .control-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .control-label {
      font-size: 0.725rem;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .custom-select-wrap {
      position: relative;
      display: inline-flex;
      align-items: center;
    }
    .control-select {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 8px 32px 8px 12px;
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
      appearance: none;
      cursor: pointer;
      min-width: 170px;
    }
    .control-select:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }
    .select-caret {
      position: absolute;
      right: 12px;
      color: #94a3b8;
      pointer-events: none;
      font-size: 0.8rem;
    }

    /* View Toggle Pills */
    .view-toggle-pills {
      display: flex;
      background: #f1f5f9;
      padding: 3px;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
    }
    .pill-btn {
      border: none;
      background: transparent;
      padding: 6px 12px;
      font-size: 0.8rem;
      font-weight: 700;
      color: #64748b;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .pill-btn.active {
      background: #ffffff;
      color: #4f46e5;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
    }

    /* Action buttons in controls */
    .controls-actions-group {
      display: flex;
      gap: 8px;
      margin-left: auto;
    }
    .btn-ctrl {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 700;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #334155;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-ctrl:hover {
      background: #f8fafc;
      border-color: #94a3b8;
    }
    .btn-ctrl-danger {
      color: #dc2626;
      border-color: #fca5a5;
    }
    .btn-ctrl-danger:hover {
      background: #fef2f2;
      border-color: #f87171;
    }

    .conflict-guard-status {
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
      white-space: nowrap;
    }

    /* Timetable Card & Grid */
    .timetable-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    .card-header {
      padding: 16px 22px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
    }
    .card-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
    }
    .header-tags-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .tier-badge {
      font-size: 0.72rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 6px;
      letter-spacing: 0.04em;
    }
    .tier-pre-primary { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .tier-primary { background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }
    .tier-secondary { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .slots-tag {
      font-size: 0.75rem;
      font-weight: 700;
      background: #f1f5f9;
      color: #475569;
      padding: 4px 10px;
      border-radius: 6px;
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
      padding: 12px 10px;
      border-bottom: 2px solid #e2e8f0;
      border-right: 1px solid #f1f5f9;
      text-align: center;
    }
    .timetable-grid td {
      padding: 8px;
      border-bottom: 1px solid #f1f5f9;
      border-right: 1px solid #f1f5f9;
      vertical-align: middle;
      background: #ffffff;
      position: relative;
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
      font-size: 0.7rem;
      font-weight: 600;
      color: #64748b;
      font-family: monospace;
    }

    /* Day Column */
    .day-cell {
      background: #f8fafc !important;
      text-align: center;
      border-right: 2px solid #e2e8f0 !important;
      width: 110px;
    }
    .day-name {
      font-size: 0.95rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.01em;
    }

    /* Break Column */
    .col-break {
      width: 75px;
      background: #f1f5f9 !important;
    }
    .break-th {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .break-title {
      font-size: 0.75rem;
      font-weight: 800;
      color: #475569;
    }
    .break-time {
      font-size: 0.65rem;
      color: #94a3b8;
      font-family: monospace;
    }
    .break-cell {
      background: #f8fafc !important;
      text-align: center;
      vertical-align: middle;
      border-left: 1px dashed #cbd5e1;
      border-right: 1px dashed #cbd5e1;
    }
    .break-pill {
      writing-mode: vertical-rl;
      text-orientation: mixed;
      margin: 0 auto;
      letter-spacing: 0.18em;
      font-size: 0.7rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
    }

    /* Slot Card */
    .slot-card {
      border-radius: 12px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid transparent;
      cursor: pointer;
      position: relative;
    }
    .slot-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px -2px rgba(0, 0, 0, 0.1);
    }
    .slot-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 4px;
    }
    .slot-badge {
      font-size: 0.8rem;
      font-weight: 800;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .slot-room {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.75);
      border: 1px solid rgba(0, 0, 0, 0.08);
      white-space: nowrap;
    }
    .slot-teacher {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.725rem;
      font-weight: 600;
      opacity: 0.9;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .teacher-name-txt {
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Hover action buttons on slot */
    .slot-hover-actions {
      position: absolute;
      top: 4px;
      right: 4px;
      display: none;
      gap: 3px;
      background: rgba(255, 255, 255, 0.92);
      padding: 2px 4px;
      border-radius: 6px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
    }
    .slot-card:hover .slot-hover-actions {
      display: flex;
    }
    .btn-slot-act {
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 3px;
      border-radius: 4px;
      color: #475569;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-slot-act:hover {
      background: #f1f5f9;
      color: #1e293b;
    }
    .btn-slot-del:hover {
      background: #fef2f2;
      color: #dc2626;
    }

    /* Subject Color Themes */
    .theme-indigo { background: #eef2ff; border-color: #c7d2fe; color: #3730a3; }
    .theme-emerald { background: #ecfdf5; border-color: #a7f3d0; color: #065f46; }
    .theme-sky { background: #f0f9ff; border-color: #bae6fd; color: #0369a1; }
    .theme-purple { background: #f5f3ff; border-color: #ddd6fe; color: #5b21b6; }
    .theme-rose { background: #fff1f2; border-color: #fecdd3; color: #9f1239; }
    .theme-amber { background: #fffbeb; border-color: #fde68a; color: #92400e; }
    .theme-teal { background: #f0fdfa; border-color: #99f6e4; color: #0f766e; }

    /* Empty Slot */
    .empty-slot-card {
      border: 1px dashed #cbd5e1;
      border-radius: 10px;
      padding: 12px 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      background: #fafafa;
      transition: all 0.2s;
    }
    .empty-slot-card.clickable {
      cursor: pointer;
    }
    .empty-slot-card.clickable:hover {
      background: #f1f5f9;
      border-color: #94a3b8;
      border-style: solid;
    }
    .empty-dash {
      width: 14px;
      height: 2px;
      background: #cbd5e1;
      border-radius: 2px;
    }
    .empty-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: #94a3b8;
    }
    .empty-slot-card.clickable:hover .empty-label {
      color: #4f46e5;
    }

    /* Student Banner */
    .student-hero-banner {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%);
      color: #ffffff;
      border-radius: 18px;
      padding: 20px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .hero-left { display: flex; align-items: center; gap: 18px; }
    .hero-avatar {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      border: 3px solid #818cf8;
      object-fit: cover;
    }
    .hero-tag {
      font-size: 0.68rem;
      font-weight: 800;
      color: #a5b4fc;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .hero-name {
      font-size: 1.3rem;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 6px 0;
    }
    .hero-meta { display: flex; gap: 8px; flex-wrap: wrap; }
    .meta-chip {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
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

    /* Conflict Warnings */
    .conflict-alert-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 12px;
      padding: 12px 14px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      color: #991b1b;
    }
    .conflict-alert-icon {
      color: #dc2626;
      margin-top: 1px;
    }
    .conflict-alert-title {
      font-size: 0.85rem;
      font-weight: 800;
      color: #991b1b;
      margin-bottom: 2px;
    }
    .conflict-alert-desc {
      font-size: 0.775rem;
      color: #b91c1c;
      line-height: 1.4;
    }
    .conflict-safe-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      font-size: 0.775rem;
      font-weight: 600;
      color: #166534;
    }
    .btn-conflict-resolve {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 11px;
      background: #dc2626;
      color: #ffffff;
      font-weight: 700;
      font-size: 0.75rem;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(220, 38, 38, 0.3);
      transition: all 0.2s;
    }
    .btn-conflict-resolve:hover {
      background: #b91c1c;
      transform: translateY(-1px);
    }
    .btn-conflict-override {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 11px;
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-conflict-override:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .badge-curriculum-count {
      font-size: 0.72rem;
      font-weight: 700;
      color: #4f46e5;
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      padding: 2px 8px;
      border-radius: 12px;
    }
    .quick-room-chips {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
    }
    .chip-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: #64748b;
    }
    .room-chip {
      font-size: 0.72rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 6px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      color: #334155;
      cursor: pointer;
      transition: all 0.15s;
    }
    .room-chip:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .room-chip.active {
      background: #6366f1;
      border-color: #6366f1;
      color: #ffffff;
      font-weight: 700;
    }

    /* Structure Presets */
    .class-context-banner {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #6366f1;
      padding: 10px 14px;
      border-radius: 8px;
    }
    .tier-pill-small {
      background: #e0e7ff;
      color: #4338ca;
      font-size: 0.6875rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 999px;
      letter-spacing: 0.05em;
    }
    .tier-desc-hint {
      font-size: 0.72rem;
      color: #6366f1;
      font-weight: 600;
      margin-bottom: 2px;
    }
    .tier-setup-link-box {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 8px 12px;
    }
    .btn-tier-setup-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      background: #eff6ff;
      color: #2563eb;
      font-size: 0.75rem;
      font-weight: 700;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      text-decoration: none;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .btn-tier-setup-link:hover {
      background: #2563eb;
      color: #ffffff;
    }
    .tier-presets-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }
    .btn-tier-preset {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 10px;
      text-align: left;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 3px;
      transition: all 0.2s;
    }
    .btn-tier-preset strong {
      font-size: 0.85rem;
      color: #0f172a;
    }
    .btn-tier-preset span {
      font-size: 0.7rem;
      color: #64748b;
    }
    .btn-tier-preset:hover {
      border-color: #cbd5e1;
      background: #f1f5f9;
    }
    .btn-tier-preset.active {
      border-color: #6366f1;
      background: #eef2ff;
    }
    .btn-tier-preset.active strong {
      color: #4f46e5;
    }

    /* Preview Chips */
    .schedule-preview-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 14px;
    }
    .preview-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .preview-chips-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .preview-chip {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 600;
      color: #334155;
      font-family: monospace;
    }
    .preview-chip.chip-break {
      background: #fef3c7;
      border-color: #fde68a;
      color: #92400e;
      font-weight: 700;
    }

    /* Forms */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
    .form-group { margin-bottom: 14px; }
    .form-label {
      display: block;
      font-size: 0.8rem;
      font-weight: 700;
      color: #334155;
      margin-bottom: 6px;
    }
    .required { color: #dc2626; }
    .form-control, .form-select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.85rem;
      background: #ffffff;
      color: #0f172a;
    }
    .form-control:focus, .form-select:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }
    .flex { display: flex; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .justify-end { justify-content: flex-end; }
    .gap-2 { gap: 8px; }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 16px;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid transparent;
    }
    .btn-primary {
      background: #4f46e5;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #4338ca;
    }
    .btn-outline {
      background: #ffffff;
      border-color: #cbd5e1;
      color: #334155;
    }
    .btn-outline:hover {
      background: #f8fafc;
      border-color: #94a3b8;
    }
    .btn-outline-danger {
      background: #ffffff;
      border-color: #fca5a5;
      color: #dc2626;
    }
    .btn-outline-danger:hover {
      background: #fef2f2;
    }

    /* Print Formatting */
    .only-print { display: none; }
    @media print {
      .no-print { display: none !important; }
      .only-print { display: block !important; }
      .page-container { padding: 0 !important; }
      .timetable-card { border: none !important; box-shadow: none !important; }
      .timetable-grid th, .timetable-grid td {
        border: 1px solid #94a3b8 !important;
        padding: 6px !important;
      }
      .print-school-title {
        font-size: 1.4rem;
        font-weight: 900;
        text-align: center;
        color: #000000;
      }
      .print-school-subtitle {
        font-size: 0.95rem;
        text-align: center;
        color: #475569;
        margin-bottom: 12px;
      }
      .print-meta-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin-bottom: 16px;
        font-size: 0.85rem;
        border-bottom: 2px solid #000;
        padding-bottom: 8px;
      }
      .print-footer-sheet {
        margin-top: 50px;
        display: flex;
        justify-content: space-between;
        padding: 0 30px;
      }
      .print-sign-box {
        text-align: center;
        font-size: 0.8rem;
        font-weight: 700;
      }
      .sign-line {
        width: 140px;
        border-bottom: 1px solid #000;
        margin-bottom: 6px;
      }
    }
  `]
})
export class RoutineComponent implements OnInit {
  private academicStore = inject(AcademicStoreService);
  private teacherStore = inject(TeacherStoreService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  currentUser: User | null = null;
  isStudent = false;
  isGuardian = false;
  canManageRoutine = false;
  browseOtherClasses = false;

  classes: SchoolClass[] = [];
  sections: Section[] = [];
  subjects: Subject[] = [];
  classMatrixSubjects: Subject[] = [];
  isLoadingMatrixSubjects = false;
  teachers: Teacher[] = [];

  get otherSubjects(): Subject[] {
    const matrixIds = this.classMatrixSubjects.map(s => s.id);
    return this.subjects.filter(s => !matrixIds.includes(s.id));
  }

  get quickRooms(): string[] {
    const home = this.getSectionHomeRoom();
    const list = [home, home.replace('1', '2'), 'Science Lab', 'Computer Lab', 'Activity Hall'];
    return Array.from(new Set(list.filter(Boolean)));
  }

  get standardRooms(): string[] {
    return [
      'Play Room 1', 'Play Room 2', 'Nursery 1', 'Nursery 2',
      'Room 101', 'Room 102', 'Room 201', 'Room 202',
      'Room 301', 'Room 302', 'Room 401', 'Room 402',
      'Room 501', 'Room 502', 'Room 901', 'Room 902',
      'Room 1001', 'Room 1002', 'Lecture Hall A', 'Lecture Hall B',
      'Science Lab', 'Physics Lab', 'Chemistry Lab', 'Biology Lab',
      'Computer Lab', 'Activity Hall', 'Library'
    ];
  }

  selectedClassId = 'cls-03'; // Default to Class 1 or first available
  selectedSectionId = 'sec-03a';
  viewMode: 'class' | 'teacher' = 'class';
  selectedTeacherId = 'tch-01';

  routine: RoutinePeriod[] = [];
  days: ('Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday')[] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday'
  ];

  // Active Structure Configuration for Current Class
  activeStructure: RoutineStructureConfig = this.getTierDefaultStructure('primary');
  editStructure: RoutineStructureConfig = this.getTierDefaultStructure('primary');

  // Modals State
  isPeriodModalOpen = false;
  isEditingPeriod = false;
  activeEditingSlotId: string | null = null;

  isStructureModalOpen = false;
  isCloneModalOpen = false;

  // Conflict state
  conflictWarning: string | null = null;

  // New/Editing Period Model
  newPeriod: Partial<RoutinePeriod> = {
    day: 'Sunday',
    periodNumber: 1,
    subjectId: '',
    teacherId: '',
    roomNo: 'Room 101'
  };

  // Clone Model
  cloneTargetClassId = '';
  cloneTargetSectionId = '';
  cloneSections: Section[] = [];

  ngOnInit() {
    // 1. Subscribe to User & Roles
    this.auth.getCurrentUser$().subscribe(user => {
      this.currentUser = user;
      this.isStudent = user?.roleId === 'role-student' || user?.roleName?.includes('Student') || false;
      this.isGuardian = user?.roleId === 'role-guardian' || user?.roleName?.includes('Guardian') || false;
      this.canManageRoutine = this.auth.hasPermission('ACAD_ROUTINE', 'create') || !this.isStudent;
    });

    // 2. Load Classes & Sections from DB / Store
    Promise.all([
      this.academicStore.loadClasses(),
      this.academicStore.loadSections()
    ]).then(() => {
      this.classes = this.academicStore.getClasses();
      if (this.classes.length > 0 && !this.classes.some(c => c.id === this.selectedClassId)) {
        this.selectedClassId = this.classes[0].id;
      }
      this.onClassChange();
      this.cdr.markForCheck();
    });

    // 3. Load Subjects & Teachers
    this.academicStore.loadSubjects().then(() => {
      this.subjects = this.academicStore.getSubjects();
      if (!this.newPeriod.subjectId && this.subjects.length > 0) {
        this.newPeriod.subjectId = this.subjects[0].id;
      }
      this.cdr.markForCheck();
    });

    this.academicStore.loadRoutine().then(() => {
      this.routine = this.academicStore.getRoutine();
      this.cdr.markForCheck();
    });

    this.teacherStore.loadTeachers().then(() => {
      this.teachers = this.teacherStore.getTeachers();
      if (!this.newPeriod.teacherId && this.teachers.length > 0) {
        this.newPeriod.teacherId = this.teachers[0].id;
        this.selectedTeacherId = this.teachers[0].id;
      }
      this.cdr.markForCheck();
    });

    this.academicStore.getClasses$().subscribe(clsList => {
      if (clsList && clsList.length > 0) {
        this.classes = clsList;
        if (!this.classes.some(c => c.id === this.selectedClassId)) {
          this.selectedClassId = this.classes[0].id;
        }
        this.onClassChange();
      }
    });

    this.academicStore.getSections$().subscribe(() => {
      this.sections = this.academicStore.getSections(this.selectedClassId);
      if (this.sections.length > 0 && !this.sections.some(s => s.id === this.selectedSectionId)) {
        this.selectedSectionId = this.sections[0].id;
      }
      this.cdr.markForCheck();
    });

    this.academicStore.getSubjects$().subscribe(subList => {
      this.subjects = subList && subList.length > 0 ? subList : [];
      if (!this.newPeriod.subjectId && this.subjects.length > 0) {
        this.newPeriod.subjectId = this.subjects[0].id;
      }
    });

    this.teacherStore.getTeachers$().subscribe(t => {
      this.teachers = t;
      if (!this.newPeriod.teacherId && this.teachers.length > 0) {
        this.newPeriod.teacherId = this.teachers[0].id;
        this.selectedTeacherId = this.teachers[0].id;
      }
      this.cdr.markForCheck();
    });

    this.academicStore.getRoutine$().subscribe(r => {
      this.routine = r;
      this.cdr.markForCheck();
    });
  }

  // --- CLASS & SECTION SELECTION ---
  async onClassChange() {
    this.sections = this.academicStore.getSections(this.selectedClassId);
    if (this.sections.length > 0 && !this.sections.some(s => s.id === this.selectedSectionId)) {
      this.selectedSectionId = this.sections[0].id;
    }

    // Automatically adapt structure based on Class Tier or cached config
    this.loadClassStructureConfig();
    await this.loadClassMatrixSubjects();
    this.cdr.markForCheck();
  }

  onSectionChange() {
    this.cdr.markForCheck();
  }

  // --- ACADEMIC TIER LOGIC ---
  detectClassTier(className: string): AcademicTier {
    const name = (className || '').toLowerCase();
    if (['play', 'narsari', 'nursery', 'kg', 'pre-primary', 'preprimary'].some(k => name.includes(k))) {
      return 'pre-primary';
    }
    if (['six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', '6', '7', '8', '9', '10', '11', '12', 'ssc', 'hsc'].some(k => name.includes(k))) {
      return 'secondary';
    }
    return 'primary';
  }

  getClassTier(classId?: string): AcademicTier {
    const cid = classId || this.selectedClassId;
    const currentClass = this.classes.find(c => c.id === cid);
    const configuredTier = (currentClass?.tier || localStorage.getItem('class_tier_' + cid) || '') as AcademicTier;
    if (configuredTier === 'pre-primary' || configuredTier === 'primary' || configuredTier === 'secondary') {
      return configuredTier;
    }
    return this.detectClassTier(currentClass?.name || '');
  }

  getTierDefaultStructure(tier: AcademicTier): RoutineStructureConfig {
    if (tier === 'pre-primary') {
      const cfg: RoutineStructureConfig = {
        tier: 'pre-primary',
        totalPeriods: 4,
        schoolStartTime: '09:00 AM',
        periodDurationMinutes: 35,
        break: {
          enabled: true,
          name: 'SNACK & PLAY',
          afterPeriod: 2,
          startTime: '10:10 AM',
          endTime: '10:35 AM',
          durationMinutes: 25
        },
        periods: []
      };
      cfg.periods = this.computePeriodsList(cfg);
      return cfg;
    }

    if (tier === 'secondary') {
      const cfg: RoutineStructureConfig = {
        tier: 'secondary',
        totalPeriods: 7,
        schoolStartTime: '08:00 AM',
        periodDurationMinutes: 45,
        break: {
          enabled: true,
          name: 'PRAYER & LUNCH',
          afterPeriod: 4,
          startTime: '11:00 AM',
          endTime: '11:30 AM',
          durationMinutes: 30
        },
        periods: []
      };
      cfg.periods = this.computePeriodsList(cfg);
      return cfg;
    }

    // Default: Primary Tier
    const priCfg: RoutineStructureConfig = {
      tier: 'primary',
      totalPeriods: 6,
      schoolStartTime: '08:30 AM',
      periodDurationMinutes: 40,
      break: {
        enabled: true,
        name: 'TIFFIN BREAK',
        afterPeriod: 3,
        startTime: '10:30 AM',
        endTime: '10:55 AM',
        durationMinutes: 25
      },
      periods: []
    };
    priCfg.periods = this.computePeriodsList(priCfg);
    return priCfg;
  }

  loadClassStructureConfig() {
    const tier = this.getClassTier(this.selectedClassId);

    // Check localStorage for customized structure by classId or tier
    const storageKey = `routine_cfg_${this.selectedClassId}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        this.activeStructure = JSON.parse(saved);
        return;
      }
    } catch {}

    // Fallback to Tier Default
    this.activeStructure = this.getTierDefaultStructure(tier);
  }

  computePeriodsList(cfg: RoutineStructureConfig): PeriodSlotDef[] {
    const list: PeriodSlotDef[] = [];
    let currentMinutes = this.parseTimeToMinutes(cfg.schoolStartTime);

    for (let i = 1; i <= cfg.totalPeriods; i++) {
      const startStr = this.formatMinutesToTime(currentMinutes);
      const endMinutes = currentMinutes + cfg.periodDurationMinutes;
      const endStr = this.formatMinutesToTime(endMinutes);

      list.push({
        periodNumber: i,
        label: `Period ${i}`,
        startTime: startStr,
        endTime: endStr,
        durationMinutes: cfg.periodDurationMinutes
      });

      currentMinutes = endMinutes;

      // If break is after this period, advance time by break duration
      if (cfg.break.enabled && cfg.break.afterPeriod === i) {
        cfg.break.startTime = this.formatMinutesToTime(currentMinutes);
        currentMinutes += cfg.break.durationMinutes;
        cfg.break.endTime = this.formatMinutesToTime(currentMinutes);
      }
    }

    return list;
  }

  parseTimeToMinutes(timeStr: string): number {
    const clean = timeStr.trim().toUpperCase();
    const isPM = clean.includes('PM');
    const isAM = clean.includes('AM');
    const parts = clean.replace('AM', '').replace('PM', '').trim().split(':');
    let hours = parseInt(parts[0], 10) || 8;
    const mins = parseInt(parts[1], 10) || 0;

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    return hours * 60 + mins;
  }

  formatMinutesToTime(minutesTotal: number): string {
    let hours = Math.floor(minutesTotal / 60);
    const mins = minutesTotal % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    if (hours === 0) hours = 12;

    const formattedHours = hours < 10 ? '0' + hours : '' + hours;
    const formattedMins = mins < 10 ? '0' + mins : '' + mins;

    return `${formattedHours}:${formattedMins} ${ampm}`;
  }

  // --- STRUCTURE CUSTOMIZER MODAL ---
  openStructureModal() {
    this.editStructure = JSON.parse(JSON.stringify(this.activeStructure));
    this.recalculatePeriodTimings();
    this.isStructureModalOpen = true;
  }

  applyTierPreset(tier: AcademicTier) {
    this.editStructure = this.getTierDefaultStructure(tier);
    // Also save class tier to keep system-wide sync
    localStorage.setItem('class_tier_' + this.selectedClassId, tier);
    const cls = this.classes.find(c => c.id === this.selectedClassId);
    if (cls) cls.tier = tier;
  }

  recalculatePeriodTimings() {
    this.editStructure.periods = this.computePeriodsList(this.editStructure);
  }

  getAvailableBreakPositions(): number[] {
    const pos: number[] = [];
    const limit = Math.max(1, (this.editStructure.totalPeriods || 6) - 1);
    for (let i = 1; i <= limit; i++) {
      pos.push(i);
    }
    return pos;
  }

  saveStructureConfig() {
    this.recalculatePeriodTimings();
    this.activeStructure = JSON.parse(JSON.stringify(this.editStructure));

    // Save to localStorage
    const storageKey = `routine_cfg_${this.selectedClassId}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(this.activeStructure));
      if (this.activeStructure.tier) {
        localStorage.setItem('class_tier_' + this.selectedClassId, this.activeStructure.tier);
        const cls = this.classes.find(c => c.id === this.selectedClassId);
        if (cls) cls.tier = this.activeStructure.tier;
      }
    } catch {}

    this.toast.success(
      'Schedule Structure Saved',
      `Updated ${this.getClassName()} to ${this.activeStructure.totalPeriods} periods daily (${this.activeStructure.periodDurationMinutes}m intervals).`
    );
    this.isStructureModalOpen = false;
    this.cdr.markForCheck();
  }

  // --- TIMETABLE MATRIX HELPERS ---
  getClassName(): string {
    return this.classes.find(c => c.id === this.selectedClassId)?.name || 'Class One';
  }

  getSectionName(): string {
    return this.sections.find(s => s.id === this.selectedSectionId)?.name || 'Section A';
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

  getTeacherPeriod(day: string, periodNumber: number): RoutinePeriod | undefined {
    return this.routine.find(
      r =>
        r.day === day &&
        r.periodNumber === periodNumber &&
        r.teacherId === this.selectedTeacherId
    );
  }

  getSelectedTeacherName(): string {
    return this.teachers.find(t => t.id === this.selectedTeacherId)?.fullName || 'Faculty Member';
  }

  getTeacherPeriodCount(): number {
    return this.routine.filter(r => r.teacherId === this.selectedTeacherId).length;
  }

  getSubjectTheme(subjName: string): string {
    const s = (subjName || '').toLowerCase();
    if (s.includes('math') || s.includes('arithmetic') || s.includes('number')) return 'theme-indigo';
    if (s.includes('phys') || s.includes('chem') || s.includes('bio') || s.includes('science')) return 'theme-emerald';
    if (s.includes('eng') || s.includes('rhyme') || s.includes('phonic')) return 'theme-sky';
    if (s.includes('bang') || s.includes('bornomala') || s.includes('sahitya')) return 'theme-rose';
    if (s.includes('ict') || s.includes('comp') || s.includes('tech')) return 'theme-amber';
    if (s.includes('art') || s.includes('craft') || s.includes('draw') || s.includes('play')) return 'theme-teal';
    if (s.includes('bgs') || s.includes('social') || s.includes('relig') || s.includes('history')) return 'theme-purple';
    return 'theme-indigo';
  }

  // --- KPI METRICS GETTERS ---
  get totalWeeklySlots(): number {
    return this.days.length * this.activeStructure.totalPeriods;
  }

  get currentFilledSlots(): number {
    return this.routine.filter(
      r => r.classId === this.selectedClassId && r.sectionId === this.selectedSectionId
    ).length;
  }

  get scheduleEfficiencyPercent(): number {
    if (this.totalWeeklySlots === 0) return 0;
    return Math.round((this.currentFilledSlots / this.totalWeeklySlots) * 100);
  }

  get uniqueTeachersCount(): number {
    const sectionRoutines = this.routine.filter(
      r => r.classId === this.selectedClassId && r.sectionId === this.selectedSectionId
    );
    const teacherIds = new Set(sectionRoutines.map(r => r.teacherId).filter(Boolean));
    return teacherIds.size;
  }

  get schoolTimeRange(): string {
    const pList = this.activeStructure.periods;
    if (pList.length === 0) return '08:30 AM – 01:15 PM';
    return `${pList[0].startTime} – ${pList[pList.length - 1].endTime}`;
  }

  // --- CLASS-SUBJECT MATRIX & ROOM SELECTION LOGIC ---
  async loadClassMatrixSubjects() {
    if (!this.selectedClassId) {
      this.classMatrixSubjects = this.subjects;
      return;
    }
    this.isLoadingMatrixSubjects = true;
    try {
      const mappings = await this.academicStore.getClassSubjects(this.selectedClassId);
      if (mappings && mappings.length > 0) {
        const assignedIds = mappings.map((m: any) => m.subjectId);
        const matched = this.subjects.filter(s => assignedIds.includes(s.id));
        if (matched.length > 0) {
          this.classMatrixSubjects = matched;
        } else {
          this.classMatrixSubjects = mappings.map((m: any) => ({
            id: m.subjectId,
            code: m.subjectCode || 'SUB',
            name: m.subjectName || 'Subject',
            type: m.subjectType || 'Compulsory',
            fullMarks: m.fullMarks || 100,
            passMarks: m.passMarks || 33
          } as Subject));
        }
      } else {
        this.classMatrixSubjects = this.subjects;
      }
    } catch {
      this.classMatrixSubjects = this.subjects;
    } finally {
      this.isLoadingMatrixSubjects = false;
      this.cdr.markForCheck();
    }
  }

  getDefaultRoomForClass(className: string, sectionName: string = ''): string {
    const name = (className || '').toLowerCase();
    const isSecB = (sectionName || '').toLowerCase().includes('b') || (sectionName || '').toLowerCase().includes('2');

    if (name.includes('play')) return isSecB ? 'Play Room 2' : 'Play Room 1';
    if (name.includes('narsari') || name.includes('nursery')) return isSecB ? 'Nursery 2' : 'Nursery 1';
    if (name.includes('one') || name.includes(' 1') || name.includes('cls-01')) return isSecB ? 'Room 102' : 'Room 101';
    if (name.includes('two') || name.includes(' 2') || name.includes('cls-02')) return isSecB ? 'Room 202' : 'Room 201';
    if (name.includes('three') || name.includes(' 3') || name.includes('cls-03') || name.includes('cls-05')) return isSecB ? 'Room 302' : 'Room 301';
    if (name.includes('four') || name.includes(' 4') || name.includes('cls-04') || name.includes('cls-06')) return isSecB ? 'Room 402' : 'Room 401';
    if (name.includes('five') || name.includes(' 5') || name.includes('cls-07')) return isSecB ? 'Room 502' : 'Room 501';
    if (name.includes('six') || name.includes(' 6')) return isSecB ? 'Room 602' : 'Room 601';
    if (name.includes('seven') || name.includes(' 7')) return isSecB ? 'Room 702' : 'Room 701';
    if (name.includes('eight') || name.includes(' 8')) return isSecB ? 'Room 802' : 'Room 801';
    if (name.includes('nine') || name.includes(' 9') || name.includes('cls-09')) return isSecB ? 'Room 902' : 'Room 901';
    if (name.includes('ten') || name.includes('10')) return isSecB ? 'Room 1002' : 'Room 1001';
    if (name.includes('eleven') || name.includes('11')) return 'Lecture Hall A';
    if (name.includes('twelve') || name.includes('12')) return 'Lecture Hall B';
    return isSecB ? 'Room 102' : 'Room 101';
  }

  getSectionHomeRoom(): string {
    const existing = this.routine.find(r => r.classId === this.selectedClassId && r.sectionId === this.selectedSectionId && r.roomNo);
    if (existing?.roomNo) return existing.roomNo;
    return this.getDefaultRoomForClass(this.getClassName(), this.getSectionName());
  }

  findAvailableRoom(day: string, periodNumber: number, preferredRoom?: string): string {
    const slotDef = this.activeStructure.periods.find(p => p.periodNumber === periodNumber);
    const curStart = slotDef?.startTime || '';
    const curEnd = slotDef?.endTime || '';

    const isRoomBusy = (room: string) => {
      const roomNorm = room.trim().toLowerCase();
      return this.routine.some(r => {
        if (r.id === this.activeEditingSlotId) return false;
        if (r.day !== day) return false;
        if ((r.roomNo || '').trim().toLowerCase() !== roomNorm) return false;
        if (r.classId === this.selectedClassId && r.sectionId === this.selectedSectionId) return false;
        if (curStart && curEnd && r.startTime && r.endTime) {
          return this.isTimeOverlap(curStart, curEnd, r.startTime, r.endTime);
        }
        return r.periodNumber === periodNumber;
      });
    };

    if (preferredRoom && !isRoomBusy(preferredRoom)) {
      return preferredRoom;
    }

    const homeRoom = this.getSectionHomeRoom();
    if (!isRoomBusy(homeRoom)) {
      return homeRoom;
    }

    const candidates = [
      homeRoom,
      homeRoom + ' (Annex)',
      'Room 301', 'Room 302', 'Room 201', 'Room 202', 'Room 101', 'Room 102',
      'Room 401', 'Room 501', 'Science Lab', 'Computer Lab', 'Activity Hall'
    ];
    for (const c of candidates) {
      if (!isRoomBusy(c)) return c;
    }
    return homeRoom + ' (Alt)';
  }

  findAvailableTeacher(day: string, periodNumber: number, preferredTeacherId?: string): string {
    const slotDef = this.activeStructure.periods.find(p => p.periodNumber === periodNumber);
    const curStart = slotDef?.startTime || '';
    const curEnd = slotDef?.endTime || '';

    const isTeacherBusy = (tchId: string) => {
      return this.routine.some(r => {
        if (r.id === this.activeEditingSlotId) return false;
        if (r.day !== day) return false;
        if (r.teacherId !== tchId) return false;
        if (curStart && curEnd && r.startTime && r.endTime) {
          return this.isTimeOverlap(curStart, curEnd, r.startTime, r.endTime);
        }
        return r.periodNumber === periodNumber;
      });
    };

    if (preferredTeacherId && !isTeacherBusy(preferredTeacherId)) {
      return preferredTeacherId;
    }

    const available = this.teachers.find(t => !isTeacherBusy(t.id));
    return available ? available.id : (preferredTeacherId || this.teachers[0]?.id || '');
  }

  suggestFreeRoom() {
    const available = this.findAvailableRoom(this.newPeriod.day || 'Sunday', this.newPeriod.periodNumber || 1);
    this.newPeriod.roomNo = available;
    this.checkConflicts();
    this.toast.info('Room Updated', `Switched to available room: ${available}`);
  }

  suggestFreeTeacher() {
    const available = this.findAvailableTeacher(this.newPeriod.day || 'Sunday', this.newPeriod.periodNumber || 1);
    this.newPeriod.teacherId = available;
    this.checkConflicts();
    const tch = this.teachers.find(t => t.id === available);
    this.toast.info('Teacher Updated', `Switched to available faculty: ${tch?.fullName || available}`);
  }

  onSubjectChange() {
    if (!this.newPeriod.subjectId) return;
    const sub = this.subjects.find(s => s.id === this.newPeriod.subjectId);
    if (!sub) return;

    const matchingTeacher = this.teachers.find(t =>
      (t.assignedSubjects && (t.assignedSubjects.includes(sub.name) || t.assignedSubjects.includes(sub.code))) ||
      (t.department && sub.name.toLowerCase().includes(t.department.toLowerCase()))
    );

    if (matchingTeacher) {
      const slotDef = this.activeStructure.periods.find(p => p.periodNumber === this.newPeriod.periodNumber);
      const curStart = slotDef?.startTime || '';
      const curEnd = slotDef?.endTime || '';
      const isOccupied = this.routine.some(r => {
        if (r.id === this.activeEditingSlotId) return false;
        if (r.day !== this.newPeriod.day) return false;
        if (r.teacherId !== matchingTeacher.id) return false;
        if (curStart && curEnd && r.startTime && r.endTime) {
          return this.isTimeOverlap(curStart, curEnd, r.startTime, r.endTime);
        }
        return r.periodNumber === this.newPeriod.periodNumber;
      });

      if (!isOccupied) {
        this.newPeriod.teacherId = matchingTeacher.id;
      }
    }

    this.checkConflicts();
  }

  isTimeOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
    const sA = this.parseTimeToMinutes(startA);
    const eA = this.parseTimeToMinutes(endA);
    const sB = this.parseTimeToMinutes(startB);
    const eB = this.parseTimeToMinutes(endB);
    if (sA === 0 && eA === 0) return false;
    if (sB === 0 && eB === 0) return false;
    return Math.max(sA, sB) < Math.min(eA, eB);
  }

  // --- CONFLICT DETECTION ENGINE ---
  checkConflicts() {
    this.conflictWarning = null;
    if (!this.newPeriod.day || !this.newPeriod.periodNumber) return;

    const currentPNum = this.newPeriod.periodNumber;
    const currentDay = this.newPeriod.day;
    const slotDef = this.activeStructure.periods.find(p => p.periodNumber === currentPNum);
    const curStart = slotDef?.startTime || this.newPeriod.startTime || '';
    const curEnd = slotDef?.endTime || this.newPeriod.endTime || '';

    // 1. Check Faculty Teacher Conflict across ALL classes
    if (this.newPeriod.teacherId) {
      const tchConflict = this.routine.find(r => {
        if (r.id === this.activeEditingSlotId) return false;
        if (r.day !== currentDay) return false;
        if (r.teacherId !== this.newPeriod.teacherId) return false;

        if (curStart && curEnd && r.startTime && r.endTime) {
          return this.isTimeOverlap(curStart, curEnd, r.startTime, r.endTime);
        }
        return r.periodNumber === currentPNum;
      });

      if (tchConflict) {
        this.conflictWarning = `Faculty Conflict: ${tchConflict.teacherName} is already assigned to ${tchConflict.className} (${tchConflict.sectionName}) in Period ${tchConflict.periodNumber} (${tchConflict.startTime} - ${tchConflict.endTime}) on ${currentDay}.`;
        return;
      }
    }

    // 2. Check Classroom / Lab Conflict across ALL classes
    if (this.newPeriod.roomNo && this.newPeriod.roomNo.trim()) {
      const roomNormalized = this.newPeriod.roomNo.trim().toLowerCase();
      const roomConflict = this.routine.find(r => {
        if (r.id === this.activeEditingSlotId) return false;
        if (r.classId === this.selectedClassId && r.sectionId === this.selectedSectionId) return false;
        if (r.day !== currentDay) return false;
        if ((r.roomNo || '').trim().toLowerCase() !== roomNormalized) return false;

        if (curStart && curEnd && r.startTime && r.endTime) {
          return this.isTimeOverlap(curStart, curEnd, r.startTime, r.endTime);
        }
        return r.periodNumber === currentPNum;
      });

      if (roomConflict) {
        this.conflictWarning = `Classroom Conflict: ${this.newPeriod.roomNo} is already occupied by ${roomConflict.className} (${roomConflict.sectionName}) in Period ${roomConflict.periodNumber} (${roomConflict.startTime} - ${roomConflict.endTime}) on ${currentDay}.`;
        return;
      }
    }
  }

  // --- ASSIGN & EDIT PERIOD MODAL ---
  async openAddPeriodModal(day?: string, periodNumber?: number) {
    this.isEditingPeriod = false;
    this.activeEditingSlotId = null;
    this.conflictWarning = null;

    if (this.classMatrixSubjects.length === 0) {
      await this.loadClassMatrixSubjects();
    }

    const selectedDay = (day as any) || 'Sunday';
    const selectedPNum = periodNumber || 1;
    const slotDef = this.activeStructure.periods.find(p => p.periodNumber === selectedPNum);

    const defaultSubject = this.classMatrixSubjects[0] || this.subjects[0];
    const defaultSubjectId = defaultSubject?.id || '';

    const homeRoom = this.getSectionHomeRoom();
    const availableRoom = this.findAvailableRoom(selectedDay, selectedPNum, homeRoom);
    const availableTeacherId = this.findAvailableTeacher(selectedDay, selectedPNum, this.teachers[0]?.id);

    this.newPeriod = {
      day: selectedDay,
      periodNumber: selectedPNum,
      startTime: slotDef ? slotDef.startTime : '08:30 AM',
      endTime: slotDef ? slotDef.endTime : '09:15 AM',
      subjectId: defaultSubjectId,
      teacherId: availableTeacherId,
      roomNo: availableRoom
    };

    this.checkConflicts();
    this.isPeriodModalOpen = true;
    this.cdr.markForCheck();
  }

  async openEditPeriodModal(slot: RoutinePeriod) {
    this.isEditingPeriod = true;
    this.activeEditingSlotId = slot.id;
    this.conflictWarning = null;

    if (this.classMatrixSubjects.length === 0) {
      await this.loadClassMatrixSubjects();
    }

    this.newPeriod = {
      id: slot.id,
      day: slot.day,
      periodNumber: slot.periodNumber,
      startTime: slot.startTime,
      endTime: slot.endTime,
      subjectId: slot.subjectId,
      teacherId: slot.teacherId,
      roomNo: slot.roomNo
    };

    this.forceSaveWithConflict = false;
    this.checkConflicts();
    this.isPeriodModalOpen = true;
    this.cdr.markForCheck();
  }

  forceSaveWithConflict = false;
  allowConflictOverride = false;

  async forceSavePeriod() {
    this.forceSaveWithConflict = true;
    await this.savePeriodSlot();
  }

  async savePeriodSlot() {
    this.checkConflicts();
    if (this.conflictWarning && !this.forceSaveWithConflict && !this.allowConflictOverride) {
      const confirmOverride = confirm(
        `Conflict Alert:\n${this.conflictWarning}\n\nDo you want to save this period anyway as an authorized override / shared space?`
      );
      if (!confirmOverride) {
        return;
      }
    }
    this.forceSaveWithConflict = false;
    this.allowConflictOverride = false;

    const sub = this.subjects.find(s => s.id === this.newPeriod.subjectId);
    const tch = this.teachers.find(t => t.id === this.newPeriod.teacherId);
    const slotDef = this.activeStructure.periods.find(p => p.periodNumber === this.newPeriod.periodNumber);

    const periodObj: RoutinePeriod = {
      id: this.activeEditingSlotId || ('rt-' + Date.now()),
      day: (this.newPeriod.day as any) || 'Sunday',
      periodNumber: this.newPeriod.periodNumber || 1,
      startTime: slotDef?.startTime || this.newPeriod.startTime || '08:30 AM',
      endTime: slotDef?.endTime || this.newPeriod.endTime || '09:15 AM',
      classId: this.selectedClassId,
      className: this.getClassName(),
      sectionId: this.selectedSectionId,
      sectionName: this.getSectionName(),
      subjectId: this.newPeriod.subjectId || '',
      subjectName: sub?.name || 'Subject',
      teacherId: this.newPeriod.teacherId || '',
      teacherName: tch?.fullName || 'Faculty Instructor',
      roomNo: this.newPeriod.roomNo || this.getSectionHomeRoom()
    };

    await this.academicStore.saveRoutinePeriod(periodObj as RoutinePeriod);
    this.toast.success(
      this.isEditingPeriod ? 'Period Updated' : 'Period Scheduled',
      `${periodObj.subjectName} assigned to ${periodObj.day} Period ${periodObj.periodNumber}.`
    );

    this.isPeriodModalOpen = false;
    this.cdr.markForCheck();
  }

  async deleteSlot(id: string) {
    await this.academicStore.deleteRoutinePeriod(id);
    this.toast.info('Period Removed', 'The routine slot has been vacated.');
    this.cdr.markForCheck();
  }

  // --- ACADEMIC TIER TEMPLATE GENERATOR ---
  async applyTierTemplate() {
    const tier = this.activeStructure.tier;
    const batchPeriods: RoutinePeriod[] = [];
    const className = this.getClassName();
    const sectionName = this.getSectionName();
    const designatedRoom = this.getDefaultRoomForClass(className, sectionName);

    // Map subjects based on tier and class matrix
    if (tier === 'pre-primary') {
      const curSubjects = this.classMatrixSubjects.length > 0
        ? this.classMatrixSubjects.map((sub, idx) => ({
            name: sub.name,
            teacher: this.teachers[idx % this.teachers.length] || this.teachers[0],
            room: designatedRoom
          }))
        : [
            { name: 'English Rhymes & Phonics', teacher: this.teachers[0], room: designatedRoom },
            { name: 'Basic Numeracy & Shapes', teacher: this.teachers[1] || this.teachers[0], room: designatedRoom },
            { name: 'Bangla Bornomala & Stories', teacher: this.teachers[2] || this.teachers[0], room: designatedRoom },
            { name: 'Arts, Crafts & Coloring', teacher: this.teachers[3] || this.teachers[0], room: 'Activity Hall' }
          ];

      for (const day of this.days) {
        for (let pIdx = 0; pIdx < Math.min(4, this.activeStructure.periods.length); pIdx++) {
          const pDef = this.activeStructure.periods[pIdx];
          const sub = curSubjects[(pIdx + this.days.indexOf(day)) % curSubjects.length];

          batchPeriods.push({
            id: `rt-tpl-${this.selectedSectionId}-${day}-${pDef.periodNumber}`,
            day: day,
            periodNumber: pDef.periodNumber,
            startTime: pDef.startTime,
            endTime: pDef.endTime,
            classId: this.selectedClassId,
            className: className,
            sectionId: this.selectedSectionId,
            sectionName: sectionName,
            subjectId: `sub-tpl-${pIdx}`,
            subjectName: sub.name,
            teacherId: sub.teacher?.id || 'tch-01',
            teacherName: sub.teacher?.fullName || 'Faculty Instructor',
            roomNo: sub.room
          });
        }
      }
    } else if (tier === 'secondary') {
      const curSubjects = this.classMatrixSubjects.length > 0
        ? this.classMatrixSubjects.map((sub, idx) => ({
            name: sub.name,
            teacher: this.teachers[idx % this.teachers.length] || this.teachers[0],
            room: sub.name.toLowerCase().includes('lab') || sub.name.toLowerCase().includes('science') || sub.name.toLowerCase().includes('physics') || sub.name.toLowerCase().includes('chem') ? 'Science Lab' : (sub.name.toLowerCase().includes('ict') ? 'Computer Lab' : designatedRoom)
          }))
        : [
            { name: 'General / Higher Mathematics', teacher: this.teachers[0], room: designatedRoom },
            { name: 'Physics / Physical Science', teacher: this.teachers[1] || this.teachers[0], room: 'Science Lab' },
            { name: 'English 1st & 2nd Paper', teacher: this.teachers[2] || this.teachers[0], room: designatedRoom },
            { name: 'Information & Comm. Tech (ICT)', teacher: this.teachers[3] || this.teachers[0], room: 'Computer Lab' },
            { name: 'Bangla 1st & 2nd Paper', teacher: this.teachers[4] || this.teachers[0], room: designatedRoom },
            { name: 'Bangladesh & Global Studies', teacher: this.teachers[5] || this.teachers[0], room: designatedRoom },
            { name: 'Chemistry & Biology Lab', teacher: this.teachers[1] || this.teachers[0], room: 'Bio Lab' }
          ];

      for (const day of this.days) {
        for (let pIdx = 0; pIdx < Math.min(7, this.activeStructure.periods.length); pIdx++) {
          const pDef = this.activeStructure.periods[pIdx];
          const sub = curSubjects[(pIdx + this.days.indexOf(day)) % curSubjects.length];

          batchPeriods.push({
            id: `rt-tpl-${this.selectedSectionId}-${day}-${pDef.periodNumber}`,
            day: day,
            periodNumber: pDef.periodNumber,
            startTime: pDef.startTime,
            endTime: pDef.endTime,
            classId: this.selectedClassId,
            className: className,
            sectionId: this.selectedSectionId,
            sectionName: sectionName,
            subjectId: `sub-tpl-${pIdx}`,
            subjectName: sub.name,
            teacherId: sub.teacher?.id || 'tch-01',
            teacherName: sub.teacher?.fullName || 'Faculty Instructor',
            roomNo: sub.room
          });
        }
      }
    } else {
      // Primary Tier (Class 1 to 5)
      const curSubjects = this.classMatrixSubjects.length > 0
        ? this.classMatrixSubjects.map((sub, idx) => ({
            name: sub.name,
            teacher: this.teachers[idx % this.teachers.length] || this.teachers[0],
            room: designatedRoom
          }))
        : [
            { name: 'Primary Mathematics', teacher: this.teachers[0], room: designatedRoom },
            { name: 'English First Paper', teacher: this.teachers[1] || this.teachers[0], room: designatedRoom },
            { name: 'Bangla Sahitya', teacher: this.teachers[2] || this.teachers[0], room: designatedRoom },
            { name: 'General Science', teacher: this.teachers[3] || this.teachers[0], room: designatedRoom },
            { name: 'Bangladesh & Global Studies', teacher: this.teachers[4] || this.teachers[0], room: designatedRoom },
            { name: 'Religious & Moral Studies', teacher: this.teachers[5] || this.teachers[0], room: designatedRoom }
          ];

      for (const day of this.days) {
        for (let pIdx = 0; pIdx < Math.min(6, this.activeStructure.periods.length); pIdx++) {
          const pDef = this.activeStructure.periods[pIdx];
          const sub = curSubjects[(pIdx + this.days.indexOf(day)) % curSubjects.length];

          batchPeriods.push({
            id: `rt-tpl-${this.selectedSectionId}-${day}-${pDef.periodNumber}`,
            day: day,
            periodNumber: pDef.periodNumber,
            startTime: pDef.startTime,
            endTime: pDef.endTime,
            classId: this.selectedClassId,
            className: className,
            sectionId: this.selectedSectionId,
            sectionName: sectionName,
            subjectId: `sub-tpl-${pIdx}`,
            subjectName: sub.name,
            teacherId: sub.teacher?.id || 'tch-01',
            teacherName: sub.teacher?.fullName || 'Faculty Instructor',
            roomNo: sub.room
          });
        }
      }
    }

    await this.academicStore.saveRoutinesBatch(batchPeriods);
    this.toast.success(
      'Academic Plan Applied',
      `Auto-generated standard ${tier.toUpperCase()} timetable with ${batchPeriods.length} slots for ${className} (${sectionName}).`
    );
    this.cdr.markForCheck();
  }

  // --- CLONE TIMETABLE ---
  openCloneModal() {
    this.cloneTargetClassId = this.selectedClassId;
    this.onCloneClassChange();
    this.isCloneModalOpen = true;
  }

  onCloneClassChange() {
    this.cloneSections = this.academicStore.getSections(this.cloneTargetClassId).filter(
      s => !(this.cloneTargetClassId === this.selectedClassId && s.id === this.selectedSectionId)
    );
    if (this.cloneSections.length > 0) {
      this.cloneTargetSectionId = this.cloneSections[0].id;
    } else {
      this.cloneTargetSectionId = '';
    }
  }

  async executeCloneRoutine() {
    if (!this.cloneTargetSectionId) {
      this.toast.error('Select Target Section', 'Please choose a section to copy the timetable to.');
      return;
    }

    const currentSlots = this.routine.filter(
      r => r.classId === this.selectedClassId && r.sectionId === this.selectedSectionId
    );

    if (currentSlots.length === 0) {
      this.toast.warning('No Slots to Clone', 'Current section has no scheduled periods.');
      return;
    }

    const targetClass = this.classes.find(c => c.id === this.cloneTargetClassId);
    const targetSection = this.academicStore.getSections(this.cloneTargetClassId).find(s => s.id === this.cloneTargetSectionId);

    const clonedSlots: RoutinePeriod[] = currentSlots.map(slot => ({
      ...slot,
      id: `rt-cln-${this.cloneTargetSectionId}-${slot.day}-${slot.periodNumber}-${Date.now()}`,
      classId: this.cloneTargetClassId,
      className: targetClass?.name || slot.className,
      sectionId: this.cloneTargetSectionId,
      sectionName: targetSection?.name || 'Section',
      roomNo: (slot.roomNo || '').replace('101', '102').replace('201', '202') || 'Room 102'
    }));

    await this.academicStore.saveRoutinesBatch(clonedSlots);
    this.toast.success(
      'Timetable Cloned Successfully',
      `Replicated ${clonedSlots.length} periods to ${targetClass?.name} (${targetSection?.name}).`
    );

    this.isCloneModalOpen = false;
    this.cdr.markForCheck();
  }

  // --- CLEAR ROUTINE ---
  async confirmClearRoutine() {
    if (!confirm(`Are you sure you want to clear all routine periods for ${this.getClassName()} (${this.getSectionName()})?`)) {
      return;
    }

    const currentSlots = this.routine.filter(
      r => r.classId === this.selectedClassId && r.sectionId === this.selectedSectionId
    );

    for (const slot of currentSlots) {
      await this.academicStore.deleteRoutinePeriod(slot.id);
    }

    this.toast.info('Routine Cleared', `Removed all scheduled periods for ${this.getClassName()}.`);
    this.cdr.markForCheck();
  }

  // --- PRINT EXPORT ---
  printRoutine() {
    window.print();
  }
}
