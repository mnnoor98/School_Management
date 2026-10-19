import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDbService } from '../../core/services/mock-db.service';
import { Teacher } from '../../core/models';
import { BadgeComponent } from '../../shared/components/badge.component';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeComponent, IconComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <app-icon name="briefcase" [size]="26" class="text-primary"></app-icon>
            Faculty & Academic Staff Directory
          </h1>
          <p class="page-subtitle">
            Manage teacher profiles, subject assignments, departments, and qualification dossiers.
          </p>
        </div>
      </div>

      <!-- TEACHERS GRID -->
      <div class="grid-3">
        <div *ngFor="let t of teachers" class="teacher-card">
          <div class="t-header">
            <img [src]="t.avatar" [alt]="t.fullName" class="t-avatar" />
            <div>
              <h3 class="t-name">{{ t.fullName }}</h3>
              <span class="t-desig">{{ t.designation }}</span>
              <div class="mt-1">
                <app-badge variant="purple" [label]="t.department"></app-badge>
              </div>
            </div>
          </div>

          <div class="t-body">
            <div class="t-info-row">
              <span class="text-muted">Employee Code:</span>
              <code class="code-tag">{{ t.employeeCode }}</code>
            </div>
            <div class="t-info-row">
              <span class="text-muted">Qualification:</span>
              <strong>{{ t.qualification }}</strong>
            </div>
            <div class="t-info-row">
              <span class="text-muted">Contact:</span>
              <span>{{ t.phone }}</span>
            </div>
            <div class="t-info-row">
              <span class="text-muted">Assigned:</span>
              <span class="subj-badge" *ngFor="let s of t.assignedSubjects">{{ s }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .text-primary { color: #4f46e5; }
    .text-muted { color: #64748b; }
    .mt-1 { margin-top: 4px; }
    .teacher-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 20px;
      box-shadow: var(--shadow-sm);
      transition: all 0.2s;
    }
    .teacher-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-md);
      border-color: #c7d2fe;
    }
    .t-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f1f5f9;
    }
    .t-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #e0e7ff;
    }
    .t-name {
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .t-desig {
      font-size: 0.775rem;
      color: #64748b;
    }
    .t-body {
      display: flex;
      flex-direction: column;
      gap: 10px;
      font-size: 0.8125rem;
    }
    .t-info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .code-tag {
      font-size: 0.75rem;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .subj-badge {
      font-size: 0.72rem;
      background: #eef2ff;
      color: #4f46e5;
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 600;
    }
  `]
})
export class TeachersComponent implements OnInit {
  private db = inject(MockDbService);
  teachers: Teacher[] = [];

  ngOnInit() {
    this.teachers = this.db.getTeachers();
  }
}
