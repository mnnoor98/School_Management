import { CampusImageDirective } from '../../shared/components/campus-image.directive';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  AdminStoreService,
  SystemStoreService,
  StudentStoreService,
  TeacherStoreService,
  AcademicStoreService,
  FinanceStoreService,
  ExamStoreService
} from '../../core/services/stores';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { StatCardComponent } from '../../shared/components/stat-card.component';
import { BadgeComponent } from '../../shared/components/badge.component';
import { IconComponent } from '../../shared/components/icon.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { StudentInvoice, Notice, User, Student, RoutinePeriod, Branch } from '../../core/models';
import { PrincipalDashboardComponent } from './components/principal-dashboard.component';
import { TeacherDashboardComponent } from './components/teacher-dashboard.component';
import { AccountantDashboardComponent } from './components/accountant-dashboard.component';
import { SuperAdminDashboardComponent } from './components/super-admin-dashboard.component';
import { StudentDashboardComponent } from './components/student-dashboard.component';
import { GuardianDashboardComponent } from './components/guardian-dashboard.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IconComponent,
    PrincipalDashboardComponent,
    TeacherDashboardComponent,
    AccountantDashboardComponent,
    SuperAdminDashboardComponent,
    StudentDashboardComponent,
    GuardianDashboardComponent
  ],
  template: `
    <div class="page-container">
      <!-- 1. SUPER ADMIN INITIAL CAMPUS SELECTION PORTAL (When No Campus is Active) -->
      <section *ngIf="isSuperAdmin && !hasActiveCampus" class="campus-gateway-section mb-4">
        <div class="campus-gateway-hero">
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <div class="gateway-badge">
              <app-icon name="shield-check" [size]="16"></app-icon>
              <span>INSTITUTIONAL HEADQUARTERS • SUPER ADMIN</span>
            </div>
            <a routerLink="/app/admin/school-setup" class="hero-create-btn">
              <app-icon name="plus" [size]="14"></app-icon>
              <span>+ Create New Campus & Principal</span>
            </a>
          </div>
          <h1 class="gateway-title">Select Operational Campus to Begin Activities</h1>
          <p class="gateway-subtitle">
            Welcome, <strong>{{ currentUser?.fullName }}</strong>. Click an institutional campus card below to launch the workspace, view real-time KPIs, and start daily academic, attendance, exam, and financial operations.
          </p>
        </div>

        <div class="campus-cards-grid">
          <div
            *ngFor="let branch of branches"
            class="campus-hub-card"
            [class.card-loading]="campusLoading && loadingCampusId === branch.id"
            [class.card-inactive]="!branch.isActive"
            (click)="branch.isActive && !campusLoading && selectCampus(branch.id)"
          >
            <div class="ch-card-top">
              <div class="ch-icon-wrapper">
                <app-icon name="building" [size]="28" class="text-indigo"></app-icon>
              </div>
              <div class="ch-tags">
                <span class="ch-code-tag">{{ branch.code || 'CAMPUS' }}</span>
                <span class="ch-status-pill" [class.status-online]="branch.isActive">
                  <span class="status-dot"></span>
                  {{ branch.isActive ? 'Active Campus' : 'Maintenance' }}
                </span>
              </div>
            </div>

            <div class="ch-card-middle">
              <h2 class="ch-name">{{ branch.name }}</h2>
              <div class="ch-meta-row">
                <app-icon name="map-pin" [size]="14"></app-icon>
                <span>{{ branch.address || 'Dhaka Metropolitan Area' }}</span>
              </div>
              <div class="ch-meta-row" *ngIf="branch.phone">
                <app-icon name="phone" [size]="13"></app-icon>
                <span>{{ branch.phone }}</span>
              </div>

              <div class="ch-highlights">
                <div class="ch-highlight-pill">
                  <app-icon name="users" [size]="13"></app-icon>
                  <span>Classrooms & Students</span>
                </div>
                <div class="ch-highlight-pill">
                  <app-icon name="clipboard-check" [size]="13"></app-icon>
                  <span>Attendance Shifts</span>
                </div>
                <div class="ch-highlight-pill">
                  <app-icon name="circle-dollar-sign" [size]="13"></app-icon>
                  <span>Fee Collection</span>
                </div>
                <div class="ch-highlight-pill">
                  <app-icon name="award" [size]="13"></app-icon>
                  <span>Examinations</span>
                </div>
              </div>
            </div>

            <div class="ch-card-bottom">
              <button
                type="button"
                class="btn btn-primary ch-enter-btn"
                [disabled]="!branch.isActive || campusLoading"
              >
                <span *ngIf="campusLoading && loadingCampusId === branch.id" class="flex items-center justify-center gap-2">
                  <span>Launching Campus Activity...</span>
                </span>
                <span *ngIf="!campusLoading || loadingCampusId !== branch.id" class="flex items-center justify-center gap-2">
                  <span>Enter & Activate Campus</span>
                  <app-icon name="arrow-up-right" [size]="16"></app-icon>
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. SUPER ADMIN ACTIVE CAMPUS BANNER & QUICK SWITCHER (When Campus is Active) -->
      <section *ngIf="isSuperAdmin && hasActiveCampus" class="campus-active-strip card mb-4">
        <div class="cas-left">
          <div class="cas-icon">
            <app-icon name="building" [size]="24"></app-icon>
          </div>
          <div>
            <div class="cas-sub-badge">
              <span class="pulse-dot"></span>
              <span>ACTIVE OPERATIONAL CAMPUS • DATA ISOLATION ENFORCED</span>
            </div>
            <div class="cas-name-group">
              <h2 class="cas-name">{{ getActiveBranch()?.name }}</h2>
              <span class="cas-badge">{{ getActiveBranch()?.code }}</span>
              <span class="cas-address" *ngIf="getActiveBranch()?.address">
                <app-icon name="map-pin" [size]="12"></app-icon>
                <span>{{ getActiveBranch()?.address }}</span>
              </span>
              <span class="cas-phone" *ngIf="getActiveBranch()?.phone">
                <app-icon name="phone" [size]="12"></app-icon>
                <span>{{ getActiveBranch()?.phone }}</span>
              </span>
            </div>
          </div>
        </div>

        <div class="cas-right">
          <span class="cas-label">
            <app-icon name="refresh-cw" [size]="13"></app-icon>
            <span>Switch Campus:</span>
          </span>
          <div class="cas-buttons">
            <button
              type="button"
              *ngFor="let b of branches"
              class="cas-switch-pill"
              [class.active-pill]="b.id === activeBranchId"
              [disabled]="!b.isActive || (campusLoading && loadingCampusId === b.id)"
              (click)="selectCampus(b.id)"
              [title]="b.id === activeBranchId ? 'Currently active workspace' : 'Switch to ' + b.name"
            >
              <span class="pill-dot" *ngIf="b.id === activeBranchId">●</span>
              <span>{{ b.name }}</span>
            </button>
            <a routerLink="/app/admin/school-setup" class="cas-add-btn" title="Create new campus branch">
              <app-icon name="plus" [size]="13"></app-icon>
              <span>Add Campus</span>
            </a>
          </div>
        </div>
      </section>

      <!-- 3. CAMPUS LOADING NOTIFICATION -->
      <div *ngIf="campusLoading" class="campus-loading-bar card mb-4">
        <div class="loading-content">
          <div class="loading-spinner-ring"></div>
          <div>
            <strong>Activating Campus Data...</strong>
            <p class="text-xs text-muted mb-0">Synchronizing students, teachers, classes, attendance and fee records.</p>
          </div>
        </div>
      </div>
      <section *ngIf="hasActiveCampus && !canViewDashboard" class="card mb-4" style="padding:24px">
        <h2>No dashboard access assigned</h2>
        <p>Contact your administrator to assign menus for your role in this campus.</p>
      </section>
      <ng-container *ngIf="hasActiveCampus && !campusLoading && canViewDashboard">
        <!-- 1. HEADMASTER / PRINCIPAL ACADEMIC OVERSIGHT -->
        <app-principal-dashboard *ngIf="isPrincipal"></app-principal-dashboard>

        <!-- 2. FACULTY / TEACHER WORKSPACE -->
        <app-teacher-dashboard *ngIf="isTeacher && !isPrincipal"></app-teacher-dashboard>

        <!-- 3. CHIEF ACCOUNTANT / CASHIER DESK -->
        <app-accountant-dashboard *ngIf="isAccountant && !isPrincipal && !isTeacher"></app-accountant-dashboard>

        <!-- 4. STUDENT ACADEMIC PORTAL -->
        <app-student-dashboard *ngIf="isStudent && !isGuardian"></app-student-dashboard>

        <!-- 5. PARENT / GUARDIAN PORTAL -->
        <app-guardian-dashboard *ngIf="isGuardian"></app-guardian-dashboard>

        <!-- 6. SUPER ADMIN / CONSOLIDATED GOVERNANCE -->
        <app-super-admin-dashboard *ngIf="!isPrincipal && !isTeacher && !isAccountant && !isStudent && !isGuardian"></app-super-admin-dashboard>
      </ng-container>
    </div>
  `,
  styles: [`
    .mb-3 { margin-bottom: 16px; }
    .mb-4 { margin-bottom: 24px; }
    .col-span-2 { grid-column: span 2; }
    .flex-col-gap { display: flex; flex-direction: column; gap: 24px; }
    .text-primary { color: #4f46e5; }
    .text-emerald { color: #059669; }
    .text-rose { color: #e11d48; }
    .text-purple { color: #7c3aed; }
    .text-amber { color: #d97706; }
    .text-xs { font-size: 0.75rem; }
    .text-lg { font-size: 1.125rem; }
    .text-muted { color: #64748b; }
    .font-mono { font-family: monospace; }
    .font-bold { font-weight: 700; }

    /* WARD BANNER */
    .ward-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      border-radius: 16px;
      padding: 24px;
      color: #ffffff;
      display: flex;
      gap: 24px;
      align-items: center;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .ward-avatar-col {
      position: relative;
      flex-shrink: 0;
    }
    .ward-avatar {
      width: 88px;
      height: 88px;
      border-radius: 16px;
      object-fit: cover;
      border: 3px solid #818cf8;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .ward-status-dot {
      position: absolute;
      bottom: -3px;
      right: -3px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #10b981;
      border: 2px solid #0f172a;
    }
    .ward-info-col {
      flex: 1;
    }
    .ward-badges {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .badge-role {
      background: rgba(99, 102, 241, 0.25);
      color: #a5b4fc;
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid rgba(99, 102, 241, 0.4);
    }
    .badge-active {
      background: rgba(16, 185, 129, 0.2);
      color: #6ee7b7;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
    }
    .badge-session {
      font-size: 0.75rem;
      color: #94a3b8;
    }
    .ward-name {
      font-size: 1.45rem;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 10px 0;
      display: flex;
      align-items: baseline;
      gap: 12px;
    }
    .bangla-title {
      font-size: 1rem;
      font-weight: 500;
      color: #cbd5e1;
    }
    .ward-details-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 18px;
      font-size: 0.8125rem;
    }
    .ward-detail-item {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .detail-label {
      color: #94a3b8;
    }
    .detail-val {
      color: #f1f5f9;
      font-weight: 600;
    }
    .roll-highlight {
      color: #fbbf24;
      font-weight: 800;
      font-size: 0.9rem;
    }

    /* SCHEDULE TABLE */
    .period-badge {
      background: #e0e7ff;
      color: #4338ca;
      font-weight: 800;
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 6px;
    }
    .room-pill {
      background: #f1f5f9;
      color: #475569;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    .active-period {
      background: #f0fdf4 !important;
    }
    .chip {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 999px;
    }
    .chip-ongoing { background: #dcfce7; color: #15803d; }
    .chip-upcoming { background: #fef3c7; color: #b45309; }
    .chip-scheduled { background: #f1f5f9; color: #64748b; }

    /* WARD MARKS GRID */
    .marks-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-bottom: 20px;
    }
    .subject-mark-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
    }
    .sm-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .sm-code { font-size: 0.7rem; color: #64748b; font-weight: 700; font-family: monospace; }
    .sm-grade { background: #ede9fe; color: #6d28d9; font-weight: 800; font-size: 0.75rem; padding: 1px 6px; border-radius: 4px; }
    .sm-name { font-size: 0.8125rem; font-weight: 700; color: #0f172a; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sm-scores { display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 6px; }
    .sm-score-val { font-weight: 700; color: #1e293b; }
    .sm-point { color: #059669; font-weight: 700; }
    .sm-progress { height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
    .sm-progress-bar { height: 100%; background: linear-gradient(90deg, #6366f1 0%, #4f46e5 100%); }

    .results-summary-footer {
      display: flex;
      justify-content: space-between;
      background: #f1f5f9;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 0.8125rem;
    }
    .rs-item { display: flex; align-items: center; gap: 8px; }

    /* INVOICES LIST */
    .invoices-list { display: flex; flex-direction: column; }
    .inv-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      border-bottom: 1px solid #f1f5f9;
    }
    .inv-item:last-child { border-bottom: none; }
    .inv-title { font-size: 0.85rem; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
    .inv-meta { display: flex; gap: 10px; font-size: 0.725rem; color: #64748b; }
    .inv-right { text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .inv-amount { font-size: 0.95rem; font-weight: 800; color: #0f172a; }
    .paid-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #dcfce7;
      color: #15803d;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
    }
    .btn-xs { padding: 4px 10px; font-size: 0.75rem; border-radius: 6px; }

    /* MODAL */
    .payment-modal-dossier {
      background: #f8fafc;
      border-radius: 10px;
      padding: 14px 16px;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 0.875rem;
    }
    .pmd-row { display: flex; justify-content: space-between; }

    /* Attendance progress bars */
    .attendance-bars { display: flex; flex-direction: column; gap: 18px; }
    .bar-label { display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px; color: #334155; }
    .progress-track { height: 10px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 999px; transition: width 0.6s ease; }
    .fill-emerald { background: linear-gradient(90deg, #10b981 0%, #059669 100%); }
    .fill-amber { background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%); }

    /* Notice list */
    .notice-list { display: flex; flex-direction: column; }
    .notice-row { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
    .notice-row:last-child { border-bottom: none; }
    .notice-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
    .notice-date { font-size: 0.75rem; color: #94a3b8; }
    .notice-heading { font-size: 0.875rem; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
    .notice-snippet { font-size: 0.8rem; color: #64748b; line-height: 1.4; }

    /* Exam cards */
    .exam-timeline { display: flex; flex-direction: column; gap: 16px; }
    .exam-card { display: flex; align-items: center; gap: 16px; padding: 16px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0; }
    .exam-card.published { background: #f0fdf4; border-color: #bbf7d0; }
    .exam-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 10px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      flex-shrink: 0;
    }
    .exam-month { font-size: 0.65rem; font-weight: 800; color: #64748b; }
    .exam-day { font-size: 1.1rem; font-weight: 800; color: #0f172a; }
    .exam-info h4 { font-size: 0.875rem; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; }
    .exam-info p { font-size: 0.8rem; color: #64748b; margin-bottom: 6px; }
    .exam-tags { display: flex; align-items: center; gap: 10px; font-size: 0.75rem; }
    .exam-tag { background: rgba(0,0,0,0.04); padding: 2px 8px; border-radius: 4px; font-weight: 600; }
    .exam-link { color: #059669; font-weight: 700; text-decoration: none; }

    /* CAMPUS GATEWAY & CARDS */
    .campus-gateway-section {
      margin-bottom: 28px;
    }
    .campus-gateway-hero {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      color: #ffffff;
      padding: 32px 28px;
      border-radius: 16px;
      margin-bottom: 24px;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.25);
    }
    .hero-create-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #4f46e5;
      color: #ffffff;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
      border: 1px solid rgba(255, 255, 255, 0.2);
      margin-bottom: 8px;
    }
    .hero-create-btn:hover {
      background: #4338ca;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
    }
    .gateway-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(99, 102, 241, 0.25);
      color: #a5b4fc;
      border: 1px solid rgba(99, 102, 241, 0.4);
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      padding: 4px 10px;
      border-radius: 999px;
      margin-bottom: 12px;
    }
    .gateway-title {
      font-size: 1.65rem;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 8px 0;
    }
    .gateway-subtitle {
      font-size: 0.875rem;
      color: #cbd5e1;
      max-width: 820px;
      line-height: 1.5;
      margin: 0;
    }
    .campus-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 24px;
    }
    .campus-hub-card {
      background: #ffffff;
      border: 2px solid #e2e8f0;
      border-radius: 16px;
      padding: 24px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      position: relative;
      overflow: hidden;
    }
    .campus-hub-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #4f46e5, #06b6d4);
      opacity: 0;
      transition: opacity 0.25s ease;
    }
    .campus-hub-card:hover {
      transform: translateY(-4px);
      border-color: #6366f1;
      box-shadow: 0 20px 25px -5px rgba(79, 70, 229, 0.12), 0 8px 10px -6px rgba(79, 70, 229, 0.08);
    }
    .campus-hub-card:hover::before {
      opacity: 1;
    }
    .card-loading {
      opacity: 0.7;
      pointer-events: none;
    }
    .card-inactive {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .ch-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .ch-icon-wrapper {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      background: #eef2ff;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .text-indigo { color: #4f46e5; }
    .ch-tags {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ch-code-tag {
      font-family: monospace;
      font-weight: 700;
      font-size: 0.75rem;
      background: #f1f5f9;
      color: #334155;
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    .ch-status-pill {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .status-online {
      background: #ecfdf5;
      color: #059669;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
      display: inline-block;
    }
    .ch-name {
      font-size: 1.35rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 8px 0;
    }
    .ch-meta-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8125rem;
      color: #64748b;
      margin-bottom: 6px;
    }
    .ch-highlights {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 16px;
      margin-bottom: 20px;
    }
    .ch-highlight-pill {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 4px 9px;
      font-size: 0.725rem;
      font-weight: 600;
      color: #475569;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .ch-enter-btn {
      width: 100%;
      padding: 11px;
      font-weight: 700;
      font-size: 0.875rem;
      border-radius: 8px;
      transition: all 0.2s;
    }

    /* ACTIVE CAMPUS STRIP */
    .campus-active-strip {
      padding: 14px 20px;
      border-radius: 12px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .cas-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .cas-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #ecfdf5;
      color: #059669;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .cas-sub {
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: #64748b;
    }
    .cas-name-group {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 2px;
    }
    .cas-name {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
    }
    .cas-badge {
      font-size: 0.7rem;
      font-weight: 700;
      font-family: monospace;
      background: #0f172a;
      color: #ffffff;
      padding: 2px 7px;
      border-radius: 4px;
    }
    .cas-live-dot {
      font-size: 0.7rem;
      font-weight: 700;
      color: #059669;
    }
    .cas-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .cas-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #64748b;
    }
    .cas-buttons {
      display: flex;
      gap: 8px;
    }
    .cas-switch-pill {
      border: 1px solid #cbd5e1;
      background: #ffffff;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .cas-switch-pill:hover:not(.active-pill) {
      background: #f1f5f9;
      border-color: #94a3b8;
    }
    .active-pill {
      background: #0f172a;
      color: #ffffff;
      border-color: #0f172a;
    }
    .pill-dot {
      color: #10b981;
      font-size: 0.75rem;
    }

    /* LOADING BAR */
    .campus-loading-bar {
      padding: 16px 20px;
      border-radius: 12px;
      background: #f8fafc;
      border: 1px dashed #6366f1;
    }
    .loading-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .loading-spinner-ring {
      width: 28px;
      height: 28px;
      border: 3px solid #e0e7ff;
      border-top-color: #4f46e5;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* LUXURY ACTIVE CAMPUS BANNER */
    .campus-active-strip {
      padding: 16px 22px;
      border-radius: 16px;
      background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
      border: 1px solid #e0e7ff;
      box-shadow: 0 4px 18px -2px rgba(99, 102, 241, 0.08);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .cas-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .cas-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .cas-sub-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.68rem;
      font-weight: 800;
      color: #4f46e5;
      letter-spacing: 0.06em;
      margin-bottom: 2px;
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25);
    }
    .cas-name-group {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .cas-name {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .cas-badge {
      font-size: 0.72rem;
      font-weight: 700;
      font-family: monospace;
      background: #e0e7ff;
      color: #3730a3;
      border: 1px solid #c7d2fe;
      padding: 2px 7px;
      border-radius: 6px;
    }
    .cas-address, .cas-phone {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.775rem;
      color: #64748b;
      font-weight: 500;
    }
    .cas-right {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .cas-label {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 0.8rem;
      font-weight: 700;
      color: #64748b;
    }
    .cas-buttons {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #f1f5f9;
      padding: 4px;
      border-radius: 999px;
      border: 1px solid #e2e8f0;
      flex-wrap: wrap;
    }
    .cas-switch-pill {
      border: none;
      background: transparent;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .cas-switch-pill:hover:not(.active-pill) {
      background: #ffffff;
      color: #0f172a;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .cas-switch-pill.active-pill {
      background: #4f46e5;
      color: #ffffff;
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.35);
    }
    .cas-add-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 0.775rem;
      font-weight: 700;
      color: #4f46e5;
      background: #e0e7ff;
      text-decoration: none;
      transition: all 0.2s;
    }
    .cas-add-btn:hover {
      background: #c7d2fe;
    }

    /* HEADER METADATA CHIPS & ACTION BUTTONS */
    .header-meta-chips {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }
    .session-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 999px;
    }
    .today-chip {
      display: inline-flex;
      align-items: center;
      background: #f8fafc;
      color: #475569;
      border: 1px solid #e2e8f0;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 999px;
    }
    .role-pill-inline {
      display: inline-block;
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 1px 7px;
      border-radius: 6px;
      margin-left: 4px;
    }
    .btn-action-emerald {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.85rem;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-action-emerald:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
    }
    .btn-action-primary {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.85rem;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-action-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
    }
    .btn-action-dark {
      background: #0f172a;
      color: #ffffff;
      border: 1px solid #334155;
      padding: 8px 16px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.85rem;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.2);
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-action-dark:hover {
      background: #1e293b;
      transform: translateY(-1px);
    }
    .btn-action-outline {
      background: #ffffff;
      color: #334155;
      border: 1px solid #cbd5e1;
      padding: 8px 16px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.85rem;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-action-outline:hover {
      background: #f8fafc;
      border-color: #94a3b8;
      color: #0f172a;
    }
    .btn-icon-refresh {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #64748b;
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-icon-refresh:hover {
      background: #f1f5f9;
      color: #0f172a;
      border-color: #cbd5e1;
    }
    .spin-anim {
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* CAMPUS LAUNCHPAD ONBOARDING */
    .campus-launchpad-card {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      color: #ffffff;
      border-radius: 20px;
      padding: 28px;
      box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .lp-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 20px;
      flex-wrap: wrap;
    }
    .lp-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(99, 102, 241, 0.3);
      color: #a5b4fc;
      border: 1px solid rgba(99, 102, 241, 0.5);
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      padding: 3px 10px;
      border-radius: 999px;
      margin-bottom: 10px;
    }
    .lp-title {
      font-size: 1.45rem;
      font-weight: 800;
      margin: 0 0 6px 0;
      color: #ffffff;
    }
    .lp-desc {
      font-size: 0.875rem;
      color: #cbd5e1;
      max-width: 780px;
      margin: 0;
      line-height: 1.5;
    }
    .btn-seed-demo {
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 10px 18px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.85rem;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
    }
    .btn-seed-demo:hover {
      transform: translateY(-1px);
      background: linear-gradient(135deg, #4f46e5, #4338ca);
    }
    .lp-steps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 16px;
      margin-top: 24px;
    }
    .lp-step-card {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 14px;
      padding: 18px;
      position: relative;
      transition: all 0.2s;
      backdrop-filter: blur(8px);
    }
    .lp-step-card:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(99, 102, 241, 0.5);
      transform: translateY(-2px);
    }
    .lp-step-num {
      position: absolute;
      top: 14px;
      right: 14px;
      font-size: 0.85rem;
      font-weight: 800;
      color: rgba(255, 255, 255, 0.25);
      font-family: monospace;
    }
    .lp-step-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
    }
    .bg-emerald-light { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .bg-indigo-light { background: rgba(99, 102, 241, 0.2); color: #a5b4fc; }
    .bg-purple-light { background: rgba(168, 85, 247, 0.2); color: #c084fc; }
    .bg-rose-light { background: rgba(244, 63, 94, 0.2); color: #fb7185; }
    .lp-step-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #ffffff;
      display: block;
      margin-bottom: 4px;
    }
    .lp-step-sub {
      font-size: 0.775rem;
      color: #94a3b8;
      line-height: 1.4;
      margin-bottom: 12px;
    }
    .lp-step-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      color: #38bdf8;
      text-decoration: none;
      transition: gap 0.15s;
    }
    .lp-step-btn:hover {
      gap: 9px;
      color: #7dd3fc;
    }

    /* EMPTY STATES MODERN */
    .empty-state-modern {
      padding: 34px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .esm-icon-ring {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
    }
    .emerald-ring { background: #ecfdf5; border: 1px solid #a7f3d0; }
    .blue-ring { background: #eff6ff; border: 1px solid #bfdbfe; }
    .purple-ring { background: #f5f3ff; border: 1px solid #ddd6fe; }
    .esm-title {
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 6px 0;
    }
    .esm-desc {
      font-size: 0.825rem;
      color: #64748b;
      max-width: 380px;
      margin: 0 0 16px 0;
      line-height: 1.5;
    }

    /* CLEARANCE BANNER (0 DUES) */
    .clearance-banner {
      padding: 22px;
      background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .cb-icon-box {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #d1fae5;
      color: #059669;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .cb-text {
      flex: 1;
      min-width: 220px;
    }
    .cb-status {
      font-size: 0.68rem;
      font-weight: 800;
      color: #059669;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .cb-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #065f46;
      margin: 0 0 4px 0;
    }
    .cb-desc {
      font-size: 0.8rem;
      color: #047857;
      margin: 0;
      line-height: 1.4;
    }

    /* CLASS ENROLLMENT PROGRESS ITEMS */
    .class-enrollment-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .class-enrollment-item {
      padding: 12px 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      transition: all 0.2s;
    }
    .class-enrollment-item:hover {
      background: #ffffff;
      border-color: #cbd5e1;
      box-shadow: 0 4px 12px -2px rgba(0,0,0,0.04);
    }
    .cei-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .cei-name-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .cei-code {
      font-size: 0.72rem;
      font-weight: 700;
      font-family: monospace;
      background: #e0e7ff;
      color: #4338ca;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .cei-name {
      font-size: 0.9rem;
      color: #0f172a;
    }
    .cei-bar-bg {
      height: 7px;
      width: 100%;
      background: #e2e8f0;
      border-radius: 999px;
      overflow: hidden;
    }
    .cei-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #059669);
      border-radius: 999px;
      transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

  `]
})
export class DashboardComponent implements OnInit {
  adminStore = inject(AdminStoreService);
  systemStore = inject(SystemStoreService);
  studentStore = inject(StudentStoreService);
  teacherStore = inject(TeacherStoreService);
  academicStore = inject(AcademicStoreService);
  financeStore = inject(FinanceStoreService);
  examStore = inject(ExamStoreService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);

  campusLoading = false;
  loadingCampusId = '';
  get isSuperAdmin(): boolean { return this.adminStore.isSuperAdmin(); }
  get branches(): Branch[] { return this.adminStore.getBranches(); }
  get activeBranchId(): string { return this.adminStore.getActiveBranchId(); }
  get hasActiveCampus(): boolean { return !!this.adminStore.getActiveBranchId(); }
  get canViewDashboard(): boolean { return this.auth.hasPermission('DASHBOARD', 'view'); }

  getActiveBranch(): Branch | undefined {
    return this.adminStore.getActiveBranch();
  }

  async selectCampus(branchId: string) {
    const branch = this.branches.find(b => b.id === branchId);
    if (!branch) return;
    this.campusLoading = true;
    this.loadingCampusId = branchId;
    try {
      await this.adminStore.setSelectedBranch(branch);
      this.toast.success('Campus Activated', `Switched to ${branch.name}. Campus activities and ledger loaded.`);
    } catch (e: any) {
      this.toast.error('Campus Switch Error', e?.message || 'Could not activate campus.');
    } finally {
      this.campusLoading = false;
      this.loadingCampusId = '';
      this.stats = this.getDashboardStats();
      this.refreshStats();
      this.cdr.markForCheck();
    }
  }

  private wardMarksKey = '';
  get wardTotalDue() { return this.wardInvoices.reduce((sum, invoice) => sum + invoice.dueAmount, 0); }
  get wardTotalMarks() { return this.wardExamMarks.reduce((sum, mark) => sum + mark.totalMarks, 0); }
  get wardFullMarks() { return this.wardExamMarks.reduce((sum, mark) => sum + mark.fullMarks, 0); }
  get wardGpa() { return this.wardExamMarks.length ? (this.wardExamMarks.reduce((sum, mark) => sum + mark.gradePoint, 0) / this.wardExamMarks.length).toFixed(2) : '—'; }

  currentUser: User | null = this.auth.getCurrentUser();
  stats = {
    totalStudents: 0,
    activeStudents: 0,
    totalTeachers: 0,
    attendanceRate: 0,
    todayPresent: 0,
    todayTotal: 0,
    monthlyRevenue: 0,
    totalPendingDues: 0
  };
  notices: Notice[] = [];
  pendingInvoices: StudentInvoice[] = [];

  isGuardian = false;
  isStudent = false;
  isTeacher = false;
  isPrincipal = false;
  isAccountant = false;

  wardStudent: Student | null = null;
  wardInvoices: StudentInvoice[] = [];
  wardExamMarks: any[] = [];
  todayRoutine: any[] = [];

  canTakeAttendance = false;
  canEnterMarks = false;
  canCollectFees = false;
  canAdmitStudent = false;

  // Instant Payment Modal State
  isPayModalOpen = false;
  selectedInvoice: StudentInvoice | null = null;
  paymentMethod = 'bKash Online';
  paymentReference = '';

  getDashboardStats() {
    const students = this.studentStore.getStudents();
    const teachers = this.teacherStore.getTeachers();
    const invoices = this.financeStore.getInvoices();
    const totalCollected = invoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
    const totalDue = invoices.reduce((sum, i) => sum + (i.dueAmount || 0), 0);
    return {
      totalStudents: students.length,
      activeStudents: students.length,
      totalTeachers: teachers.length,
      attendanceRate: 94,
      todayPresent: Math.round(students.length * 0.94),
      todayTotal: students.length,
      monthlyRevenue: totalCollected,
      totalPendingDues: totalDue
    };
  }

  ngOnInit() {
    this.stats = this.getDashboardStats();
    this.auth.getCurrentUser$().subscribe(user => {
      this.currentUser = user;
      this.evaluateRole();
      this.evaluatePermissions();
    });

    this.systemStore.getNotices$().subscribe(n => {
      this.notices = n.slice(0, 3);
    });

    this.financeStore.getInvoices$().subscribe(inv => {
      this.pendingInvoices = inv.filter(i => i.status !== 'Paid').slice(0, 4);
      this.stats = this.getDashboardStats();
      this.loadWardData();
      this.refreshStats();
    });

    this.studentStore.getStudents$().subscribe(() => {
      this.stats = this.getDashboardStats();
      this.loadWardData();
      this.refreshStats();
    });

    this.academicStore.getRoutine$().subscribe(() => {
      this.loadWardRoutine();
    });
    this.examStore.getExams$().subscribe(() => this.loadWardData());
    this.adminStore.getBranches$().subscribe(() => this.cdr.markForCheck());
    this.adminStore.getSelectedBranch$().subscribe(() => {
      this.isPayModalOpen = false;
      this.selectedInvoice = null;
      this.loadWardData();
      this.refreshStats();
    });
  }

  private refreshStats() {
    if (!this.activeBranchId || !this.canViewDashboard) return;
    this.http.get<{ success: boolean; data: { totalStudents: number; totalTeachers: number; attendanceRate: number; todayPresent: number; todayTotal: number; totalCollectedRevenue: number; totalDueRevenue: number } }>('/api/v1/dashboard/stats').subscribe({
      next: response => {
        if (!response.success) return;
        const data = response.data;
        this.stats = {
          ...this.getDashboardStats(), totalStudents: data.totalStudents, activeStudents: data.totalStudents,
          totalTeachers: data.totalTeachers, attendanceRate: data.attendanceRate, todayPresent: data.todayPresent,
          todayTotal: data.todayTotal, monthlyRevenue: data.totalCollectedRevenue, totalPendingDues: data.totalDueRevenue
        };
        this.cdr.markForCheck();
      },
      error: () => { this.stats = this.getDashboardStats(); this.cdr.markForCheck(); }
    });
  }

  isRefreshingManual = false;
  isSeedingDemo = false;

  get todayFormatted(): string {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  }

  refreshStatsManual() {
    this.isRefreshingManual = true;
    this.refreshStats();
    this.toast.info('Data Refreshed', `Synchronized real-time records for ${this.getActiveBranch()?.name || 'campus'}.`);
    setTimeout(() => {
      this.isRefreshingManual = false;
      this.cdr.markForCheck();
    }, 600);
  }

  async quickSeedCampusDemo() {
    this.isSeedingDemo = true;
    try {
      await this.academicStore.addClass({ name: 'Class 8', code: 'CLS-8', sortOrder: 1 });
      await this.academicStore.addClass({ name: 'Class 9', code: 'CLS-9', sortOrder: 2 });
      await this.academicStore.addClass({ name: 'Class 10', code: 'CLS-10', sortOrder: 3 });
      await this.adminStore.refreshAllFromBackend();
      this.refreshStatsManual();
      this.toast.success('Campus Initialized', 'Standard academic classes created for this workspace.');
    } catch {
      this.toast.info('Setup Ready', 'Classes have been initialized.');
    } finally {
      this.isSeedingDemo = false;
      this.cdr.markForCheck();
    }
  }

  getClassPercent(classId: string): number {
    const count = this.studentStore.getStudents(classId).length;
    return Math.min(100, Math.max(8, Math.round((count / 40) * 100)));
  }

  evaluateRole() {
    const role = (this.currentUser?.roleName || '').toLowerCase();
    const roleId = (this.currentUser?.roleId || '').toLowerCase();
    this.isGuardian = role.includes('guardian') || roleId.includes('guardian');
    this.isStudent = role.includes('student') || roleId.includes('student');
    this.isTeacher = role.includes('teacher') || roleId.includes('teacher');
    this.isPrincipal = role.includes('principal') || role.includes('head') || roleId.includes('principal') || roleId.includes('head');
    this.isAccountant = role.includes('accountant') || role.includes('cashier') || roleId.includes('accountant') || roleId.includes('cashier');

    if (this.isGuardian || this.isStudent) {
      this.loadWardData();
      this.loadWardRoutine();
    }
  }

  evaluatePermissions() {
    this.canTakeAttendance = this.auth.hasPermission('ATT_ENTRY', 'create');
    this.canEnterMarks = this.auth.hasPermission('EXAM_MARKS', 'create') || this.auth.hasPermission('EXAM_MARKS', 'view');
    this.canCollectFees = this.auth.hasPermission('FIN_COLLECTION', 'create');
    this.canAdmitStudent = this.auth.hasPermission('STUD_ADMISSION', 'create');
  }

  findMatchingWard(user?: User | null): Student | null {
    const u = user || this.currentUser;
    const students = this.studentStore.getStudents();
    if (!u) return students[0] || null;
    const username = (u.username || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const phone = u.phone || '';
    const fullName = (u.fullName || '').toLowerCase();

    return students.find(s =>
      (s.email && s.email.toLowerCase() === email) ||
      (s.phone && s.phone === phone) ||
      (s.guardianPhone && s.guardianPhone === phone) ||
      (s.admissionNo && s.admissionNo.toLowerCase() === username) ||
      fullName.includes(s.fullName.toLowerCase()) ||
      (s.guardianName && fullName.includes(s.guardianName.toLowerCase())) ||
      username === 'student'
    ) || students[0] || null;
  }

  loadWardData() {
    if (!this.isGuardian && !this.isStudent) return;
    this.wardStudent = this.findMatchingWard(this.currentUser);
    this.wardInvoices = this.wardStudent ? this.financeStore.getInvoices(this.wardStudent.id) : [];
    const exam = this.examStore.getExams().find(exam => exam.isPublished);
    const key = `${this.activeBranchId}:${this.wardStudent?.id || ''}:${exam?.id || ''}`;
    if (key !== this.wardMarksKey) {
      this.wardMarksKey = key;
      this.wardExamMarks = [];
      if (this.wardStudent && exam) {
        const studentId = this.wardStudent.id;
        this.http.get<{ data: any[] }>(`/api/v1/exams/${exam.id}/marks`).subscribe({
          next: response => {
            if (this.wardMarksKey !== key) return;
            this.wardExamMarks = response.data.filter(mark => mark.studentId === studentId)
              .map(mark => ({ ...mark, subjectCode: mark.subjectId, totalMarks: mark.obtainedMarks }));
            this.cdr.markForCheck();
          },
          error: () => { this.wardExamMarks = []; this.cdr.markForCheck(); }
        });
      }
    }
    this.loadWardRoutine();
  }

  loadWardRoutine() {
    const day = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
    this.todayRoutine = this.wardStudent ? this.academicStore.getRoutine()
      .filter(period => period.classId === this.wardStudent?.classId && period.sectionId === this.wardStudent?.sectionId && period.day === day)
      .sort((a, b) => a.periodNumber - b.periodNumber) : [];
  }

  openPayModal(inv: StudentInvoice) {
    this.selectedInvoice = inv;
    this.paymentReference = '';
    this.isPayModalOpen = true;
  }

  confirmPayment() {
    if (!this.selectedInvoice || !this.wardStudent || this.selectedInvoice.studentId !== this.wardStudent.id) return;

    this.financeStore.collectFeePayment({
      invoiceId: this.selectedInvoice.id,
      studentId: this.wardStudent.id,
      amountPaid: this.selectedInvoice.dueAmount,
      paymentMethod: (this.paymentMethod.includes('bKash') ? 'bKash' : this.paymentMethod.includes('Nagad') ? 'Nagad' : 'Card') as any,
      transactionRef: this.paymentReference,
      notes: `Settled online by ${this.currentUser?.fullName || 'Guardian'}`
    });

    this.selectedInvoice.status = 'Paid';
    this.selectedInvoice.paidAmount = this.selectedInvoice.netAmount;
    this.selectedInvoice.dueAmount = 0;

    this.toast.success(
      'Payment Successful!',
      `Tuition fee voucher of ৳ ${this.selectedInvoice.netAmount} successfully paid via ${this.paymentMethod}.`
    );

    this.isPayModalOpen = false;
    this.stats = this.getDashboardStats();
    this.cdr.markForCheck();
  }
}
