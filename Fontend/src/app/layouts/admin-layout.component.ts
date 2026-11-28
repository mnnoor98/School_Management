import { CampusImageDirective } from '../shared/components/campus-image.directive';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { AdminStoreService } from '../core/services/stores/admin-store.service';
import { MenuItem, User, Branch } from '../core/models';
import { IconComponent } from '../shared/components/icon.component';
import { ToastContainerComponent } from '../shared/components/toast-container.component';
import { ToastService } from '../core/services/toast.service';
import { ModalComponent } from '../shared/components/modal.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CampusImageDirective, CommonModule, RouterModule, FormsModule, IconComponent, ToastContainerComponent, ModalComponent],
  template: `
    <app-toast-container></app-toast-container>
    <div class="app-layout" [class.sidebar-collapsed]="isSidebarCollapsed">
      <!-- SIDEBAR -->
      <aside class="sidebar">
        <!-- Sidebar Brand -->
        <div class="sidebar-brand">
          <div class="brand-icon">
            <app-icon name="graduation-cap" [size]="24"></app-icon>
          </div>
          <div class="brand-text" *ngIf="!isSidebarCollapsed">
            <span class="brand-title">{{ school.code }}</span>
            <span class="brand-sub">Academic Portal</span>
          </div>
        </div>

        <!-- School / Branch Scope Indicator (PDF Page 3) -->
        <div class="sidebar-scope" *ngIf="!isSidebarCollapsed">
          <div class="scope-header-row">
            <span class="scope-label">Campus Scope</span>
            <span class="scope-badge global" *ngIf="isSuperAdmin">Global Admin</span>
            <span class="scope-badge locked" *ngIf="!isSuperAdmin">
              <app-icon name="lock" [size]="10"></app-icon> Locked
            </span>
          </div>

          <!-- Super Admin: Can switch between All Campuses or specific Campus -->
          <div *ngIf="isSuperAdmin" class="scope-select-wrap">
            <select class="scope-select" [(ngModel)]="selectedBranchId" (change)="onBranchChange()">
              <option value="" disabled>Select a campus</option>
              <option *ngFor="let b of branches" [value]="b.id" [disabled]="!b.isActive">📍 {{ b.name }}</option>
            </select>
          </div>

          <!-- Non-Super Admin: Strictly locked to their assigned campus -->
          <div *ngIf="!isSuperAdmin" class="scope-locked-display" [title]="'Data strictly locked to ' + getCurrentUserBranchName()">
            <app-icon name="map-pin" [size]="14" class="campus-pin-icon"></app-icon>
            <span class="campus-name">{{ getCurrentUserBranchName() }}</span>
          </div>
        </div>

        <!-- Dynamic Menu List (PDF Section 02 & Section 03) -->
        <nav class="sidebar-nav">
          <div *ngFor="let item of dynamicMenus" class="nav-group">
            <!-- Leaf Page Menu Item -->
            <a
              *ngIf="item.type === 'Page' && item.route"
              [routerLink]="item.route"
              routerLinkActive="active"
              class="nav-link"
              [title]="item.name"
            >
              <app-icon [name]="item.icon" [size]="18" class="nav-icon"></app-icon>
              <span class="nav-text" *ngIf="!isSidebarCollapsed">{{ item.name }}</span>
              <span *ngIf="item.badge && !isSidebarCollapsed" class="nav-badge">{{ item.badge }}</span>
            </a>

            <!-- Group Menu with Nested Children -->
            <div *ngIf="item.type === 'Group'">
              <button
                type="button"
                class="nav-group-header"
                (click)="toggleGroup(item.code)"
                [class.expanded]="expandedGroups[item.code]"
                [title]="item.name"
              >
                <div class="group-left">
                  <app-icon [name]="item.icon" [size]="18" class="nav-icon"></app-icon>
                  <span class="nav-text" *ngIf="!isSidebarCollapsed">{{ item.name }}</span>
                </div>
                <app-icon
                  *ngIf="!isSidebarCollapsed"
                  name="chevron-down"
                  [size]="14"
                  class="group-arrow"
                ></app-icon>
              </button>

              <!-- Nested Children (Respects Parent-Child hierarchy and sort order) -->
              <div
                class="nav-children"
                *ngIf="expandedGroups[item.code] && !isSidebarCollapsed"
              >
                <a
                  *ngFor="let child of item.children"
                  [routerLink]="child.route"
                  routerLinkActive="active"
                  class="nav-child-link"
                >
                  <span class="child-bullet"></span>
                  <span class="child-text">{{ child.name }}</span>
                </a>
              </div>
            </div>
          </div>
        </nav>

        <!-- Sidebar User Footer -->
        <div class="sidebar-footer" *ngIf="currentUser">
          <div class="user-pill" *ngIf="!isSidebarCollapsed">
            <img campusImage [src]="currentUser.avatar" [alt]="currentUser.fullName" class="user-avatar" />
            <div class="user-info">
              <span class="user-name">{{ currentUser.fullName }}</span>
              <span class="user-role">{{ currentUser.roleName }}</span>
            </div>
          </div>
          <button type="button" class="btn-logout" (click)="logout()" title="Logout">
            <app-icon name="log-out" [size]="18"></app-icon>
          </button>
        </div>
      </aside>

      <!-- MAIN WRAPPER -->
      <div class="main-wrapper">
        <!-- TOPBAR -->
        <header class="topbar">
          <div class="topbar-left">
            <button type="button" class="btn-toggle-sidebar" (click)="toggleSidebar()">
              <app-icon name="menu" [size]="20"></app-icon>
            </button>
            <div class="breadcrumbs">
              <span class="school-name">{{ school.name }}</span>
              <span class="separator">/</span>
              <span class="academic-year-badge">Session: 2026-2027</span>
            </div>
          </div>

          <div class="topbar-right">
            <!-- Audit Trail Shortcut -->
            <a routerLink="/app/admin/audit-log" class="topbar-action-btn" title="Audit Trail">
              <app-icon name="history" [size]="18"></app-icon>
            </a>

            <!-- User Profile Summary -->
            <div class="topbar-profile" *ngIf="currentUser">
              <div class="profile-avatar-wrap" (click)="openProfileModal()" style="cursor: pointer;" title="Profile & Account Settings">
                <img campusImage [src]="currentUser.avatar" [alt]="currentUser.fullName" class="profile-thumb" />
                <span class="online-indicator"></span>
              </div>
              <div class="profile-meta" (click)="openProfileModal()" style="cursor: pointer;" title="Profile & Account Settings">
                <span class="meta-name">{{ currentUser.fullName }}</span>
                <span class="meta-role">{{ currentUser.roleName }}</span>
              </div>
              <button type="button" class="btn-topbar-action" (click)="openProfileModal()" title="Account Settings & Password">
                <app-icon name="user" [size]="16"></app-icon>
              </button>
              <button type="button" class="btn-topbar-logout" (click)="logout()" title="Sign Out">
                <app-icon name="log-out" [size]="16"></app-icon>
              </button>
            </div>
          </div>
        </header>

        <!-- CONTENT OUTLET -->
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>

    <!-- USER PROFILE & PASSWORD MODAL -->
    <app-modal
      [(isOpen)]="isProfileModalOpen"
      title="User Account & Security Settings"
      subtitle="Manage your personal profile details, profile photo, and security credentials."
      [maxWidth]="560"
    >
      <div *ngIf="currentUser" class="profile-modal-body">
        <!-- Tab Switcher -->
        <div class="modal-tab-bar mb-3">
          <button
            type="button"
            class="m-tab-btn"
            [class.active]="profileTab === 'info'"
            (click)="profileTab = 'info'"
          >
            <app-icon name="user" [size]="16"></app-icon>
            <span>My Profile</span>
          </button>
          <button
            type="button"
            class="m-tab-btn"
            [class.active]="profileTab === 'password'"
            (click)="profileTab = 'password'"
          >
            <app-icon name="lock" [size]="16"></app-icon>
            <span>Change Password</span>
          </button>
        </div>

        <!-- TAB 1: Profile Info & Photo Upload -->
        <div *ngIf="profileTab === 'info'">
          <div class="profile-photo-row mb-3">
            <div class="avatar-preview-box">
              <img campusImage [src]="editProfile.avatar || currentUser.avatar" class="avatar-preview-img" alt="Avatar" />
              <label class="btn-upload-avatar">
                <app-icon name="camera" [size]="14"></app-icon>
                <span>{{ isUploadingAvatar ? 'Uploading...' : 'Upload' }}</span>
                <input type="file" accept="image/*" (change)="onAvatarFileChange($event)" [disabled]="isUploadingAvatar" style="display: none;" />
              </label>
            </div>
            <div class="account-meta-box">
              <div class="text-xs text-muted uppercase font-bold">Account Persona</div>
              <div class="font-bold text-slate-800">{{ currentUser.username }}</div>
              <div class="badge-role-pill mt-1">{{ currentUser.roleName }}</div>
              <div class="text-xs text-muted mt-1">{{ getCurrentUserBranchName() }}</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Full Name <span class="required">*</span></label>
            <input type="text" class="form-control" [(ngModel)]="editProfile.fullName" placeholder="Full Name" />
          </div>

          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" class="form-control" [(ngModel)]="editProfile.email" placeholder="email@school.edu.bd" />
          </div>

          <div class="form-group">
            <label class="form-label">Phone / WhatsApp Number</label>
            <input type="text" class="form-control" [(ngModel)]="editProfile.phone" placeholder="+880 1..." />
          </div>
        </div>

        <!-- TAB 2: Change Password -->
        <div *ngIf="profileTab === 'password'">
          <div class="form-group">
            <label class="form-label">Current Password <span class="required">*</span></label>
            <input type="password" class="form-control" [(ngModel)]="pwdForm.currentPassword" placeholder="Enter current password" />
          </div>

          <div class="form-group">
            <label class="form-label">New Password <span class="required">*</span></label>
            <input type="password" class="form-control" [(ngModel)]="pwdForm.newPassword" placeholder="Min. 6 characters" />
          </div>

          <div class="form-group">
            <label class="form-label">Confirm New Password <span class="required">*</span></label>
            <input type="password" class="form-control" [(ngModel)]="pwdForm.confirmPassword" placeholder="Re-type new password" />
          </div>

          <div class="pwd-hint-box text-xs text-muted">
            <app-icon name="shield" [size]="14" class="text-primary"></app-icon>
            <span>Password must be at least 6 characters. Do not share your password with anyone.</span>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2" footer>
        <button type="button" class="btn btn-outline" (click)="isProfileModalOpen = false">Cancel</button>
        <button
          *ngIf="profileTab === 'info'"
          type="button"
          class="btn btn-primary"
          (click)="saveProfile()"
          [disabled]="isSavingProfile"
        >
          <app-icon name="check" [size]="16"></app-icon>
          <span>{{ isSavingProfile ? 'Saving...' : 'Save Profile Changes' }}</span>
        </button>
        <button
          *ngIf="profileTab === 'password'"
          type="button"
          class="btn btn-primary"
          (click)="savePassword()"
          [disabled]="isSavingPwd"
        >
          <app-icon name="lock" [size]="16"></app-icon>
          <span>{{ isSavingPwd ? 'Updating...' : 'Update Password' }}</span>
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
      background: #f8fafc;
    }
    /* SIDEBAR */
    .sidebar {
      width: 270px;
      background: #0f172a;
      color: #94a3b8;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: sticky;
      top: 0;
      height: 100vh;
      z-index: 100;
      border-right: 1px solid #1e293b;
    }
    .sidebar-collapsed .sidebar {
      width: 76px;
    }
    .sidebar-brand {
      height: 70px;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 20px;
      border-bottom: 1px solid #1e293b;
    }
    .brand-icon {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    }
    .brand-title {
      display: block;
      font-size: 1.05rem;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.01em;
    }
    .brand-sub {
      display: block;
      font-size: 0.72rem;
      font-weight: 600;
      color: #818cf8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .sidebar-scope {
      padding: 10px 14px;
      background: #1e293b;
      margin: 12px 14px 4px 14px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .scope-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .scope-label {
      font-size: 0.66rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #94a3b8;
      letter-spacing: 0.05em;
    }
    .scope-badge {
      font-size: 0.625rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }
    .scope-badge.global {
      background: rgba(79, 70, 229, 0.25);
      color: #a5b4fc;
      border: 1px solid rgba(165, 180, 252, 0.3);
    }
    .scope-badge.locked {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(251, 191, 36, 0.3);
    }
    .scope-select-wrap {
      width: 100%;
    }
    .scope-select {
      width: 100%;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 6px;
      padding: 4px 6px;
      color: #f1f5f9;
      font-size: 0.8rem;
      font-weight: 600;
      outline: none;
      cursor: pointer;
      transition: border-color 0.15s;
    }
    .scope-select:focus {
      border-color: #6366f1;
    }
    .scope-select option {
      background: #0f172a;
      color: #ffffff;
    }
    .scope-locked-display {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 2px;
      color: #e2e8f0;
      font-size: 0.82rem;
      font-weight: 600;
    }
    .campus-pin-icon {
      color: #38bdf8;
      flex-shrink: 0;
    }
    .campus-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* NAV ITEMS */
    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 14px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .sidebar-nav::-webkit-scrollbar {
      width: 5px;
    }
    .sidebar-nav::-webkit-scrollbar-thumb {
      background: #334155;
      border-radius: 4px;
    }

    .nav-link, .nav-group-header {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border-radius: 10px;
      color: #94a3b8;
      font-size: 0.86rem;
      font-weight: 600;
      text-decoration: none;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: all 0.18s ease;
      text-align: left;
    }
    .nav-link:hover, .nav-group-header:hover {
      background: #1e293b;
      color: #f1f5f9;
    }
    .nav-link.active {
      background: #4f46e5;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
    }
    .nav-link.active .nav-icon {
      color: #ffffff;
    }
    .group-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .nav-icon {
      color: #64748b;
      flex-shrink: 0;
      transition: color 0.18s;
    }
    .nav-link:hover .nav-icon, .nav-group-header:hover .nav-icon {
      color: #cbd5e1;
    }
    .nav-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .group-arrow {
      color: #64748b;
      transition: transform 0.2s ease;
    }
    .nav-group-header.expanded .group-arrow {
      transform: rotate(180deg);
    }

    .nav-children {
      margin: 4px 0 6px 14px;
      padding-left: 12px;
      border-left: 1px solid #1e293b;
      display: flex;
      flex-direction: column;
      gap: 2px;
      animation: fadeIn 0.2s ease;
    }
    .nav-child-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: 8px;
      color: #94a3b8;
      font-size: 0.8125rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.15s;
    }
    .child-bullet {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #475569;
      transition: all 0.15s;
    }
    .nav-child-link:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.04);
    }
    .nav-child-link:hover .child-bullet {
      background: #818cf8;
      transform: scale(1.3);
    }
    .nav-child-link.active {
      color: #818cf8;
      font-weight: 700;
      background: rgba(79, 70, 229, 0.15);
    }
    .nav-child-link.active .child-bullet {
      background: #818cf8;
      box-shadow: 0 0 6px #818cf8;
    }

    /* FOOTER */
    .sidebar-footer {
      padding: 14px 16px;
      border-top: 1px solid #1e293b;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #0b1120;
    }
    .user-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      overflow: hidden;
    }
    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #334155;
    }
    .user-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .user-name {
      font-size: 0.8125rem;
      font-weight: 700;
      color: #f1f5f9;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user-role {
      font-size: 0.7rem;
      color: #818cf8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .btn-logout {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 6px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .btn-logout:hover {
      background: #ef4444;
      color: #ffffff;
    }

    /* MAIN WRAPPER */
    .main-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .topbar {
      height: 70px;
      background: #ffffff;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 28px;
      position: sticky;
      top: 0;
      z-index: 90;
    }
    .topbar-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .btn-toggle-sidebar {
      background: #f1f5f9;
      border: 1px solid var(--border-color);
      color: #475569;
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-toggle-sidebar:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .breadcrumbs {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
    }
    .school-name {
      font-weight: 700;
      color: #0f172a;
    }
    .separator {
      color: #cbd5e1;
    }
    .academic-year-badge {
      background: #ecfdf5;
      color: #059669;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .role-switcher-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #f1f5f9;
      padding: 5px 12px;
      border-radius: 999px;
      border: 1px solid #e2e8f0;
      transition: all 0.2s;
    }
    .role-switcher-pill:hover {
      background: #e2e8f0;
      border-color: #cbd5e1;
    }
    .switcher-icon-wrap {
      color: #4f46e5;
      display: flex;
      align-items: center;
    }
    .switcher-content {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .switcher-hint {
      font-size: 0.72rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .role-switcher-select {
      border: none;
      background: transparent;
      font-size: 0.8125rem;
      font-weight: 700;
      color: #1e1b4b;
      outline: none;
      cursor: pointer;
    }
    .topbar-action-btn {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: #f8fafc;
      border: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      text-decoration: none;
      transition: all 0.2s;
    }
    .topbar-action-btn:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .topbar-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-left: 14px;
      border-left: 1px solid var(--border-color);
    }
    .profile-avatar-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .profile-thumb {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #e0e7ff;
    }
    .online-indicator {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 10px;
      height: 10px;
      background: #10b981;
      border: 2px solid #ffffff;
      border-radius: 50%;
    }
    .profile-meta {
      display: flex;
      flex-direction: column;
    }
    .meta-name {
      font-size: 0.825rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
    }
    .meta-role {
      font-size: 0.7rem;
      font-weight: 600;
      color: #4f46e5;
    }
    .btn-topbar-logout {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 6px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      margin-left: 4px;
    }
    .btn-topbar-logout:hover {
      background: #fee2e2;
      color: #dc2626;
    }
    .btn-topbar-action {
      background: transparent;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 6px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .btn-topbar-action:hover {
      background: #eef2ff;
      color: #4f46e5;
    }

    /* Profile Modal Styles */
    .modal-tab-bar {
      display: flex;
      gap: 8px;
      background: #f1f5f9;
      padding: 4px;
      border-radius: 8px;
    }
    .m-tab-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px;
      border: none;
      background: transparent;
      color: #64748b;
      font-size: 0.85rem;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .m-tab-btn.active {
      background: #ffffff;
      color: #4f46e5;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .profile-photo-row {
      display: flex;
      align-items: center;
      gap: 16px;
      background: #f8fafc;
      padding: 12px 16px;
      border-radius: 10px;
      border: 1px solid var(--border-color);
    }
    .avatar-preview-box {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .avatar-preview-img {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #c7d2fe;
    }
    .btn-upload-avatar {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-upload-avatar:hover {
      background: #eef2ff;
      color: #4f46e5;
      border-color: #818cf8;
    }
    .badge-role-pill {
      display: inline-block;
      background: #e0e7ff;
      color: #3730a3;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .pwd-hint-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #eff6ff;
      padding: 8px 12px;
      border-radius: 6px;
      margin-top: 12px;
      border: 1px solid #bfdbfe;
    }

    .main-content {
      flex: 1;
      padding: 24px;
      min-width: 0;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AdminLayoutComponent implements OnInit {
  private auth = inject(AuthService);
  private db = inject(AdminStoreService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  school = this.db.getSchool();
  branches = this.db.getBranches();
  selectedBranchId = '';
  allUsers = this.db.getAllUsersForTesting();

  currentUser: User | null = null;
  currentUserId = '';
  isSidebarCollapsed = false;

  get isSuperAdmin(): boolean {
    return this.db.isSuperAdmin();
  }

  getCurrentUserBranchName(): string {
    const u = this.currentUser;
    if (!u) return 'Main Campus';
    const b = this.branches.find(x => x.id === u.branchId);
    return b ? b.name : (u.branchId ? u.branchId : 'Main Campus');
  }

  dynamicMenus: MenuItem[] = [];
  expandedGroups: { [code: string]: boolean } = {
    STUDENTS: true,
    ACADEMICS: true,
    ATTENDANCE: true,
    EXAMS: true,
    FINANCE: true,
    SECURITY: true,
    REPORTS: true,
    ADMINISTRATION: true,
    ACADEMIC: true,
    STUDENT: true,
    EXAMINATION: true
  };

  ngOnInit() {
    this.auth.getCurrentUser$().subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.currentUserId = user.id;
        if (this.isSuperAdmin) {
          const sel = this.db.getSelectedBranch();
          this.selectedBranchId = sel ? sel.id : '';
        } else {
          this.selectedBranchId = user.branchId || 'br-01';
        }
        this.refreshMenu();
      }
    });

    this.db.getSchool$().subscribe(s => this.school = s);
    this.db.getSelectedBranch$().subscribe(branch => {
      this.selectedBranchId = branch ? branch.id : '';
      this.cdr.markForCheck();
    });
    this.db.getBranches$().subscribe(b => {
      this.branches = b;
      if (!this.selectedBranchId && b.length > 0) {
        this.selectedBranchId = this.isSuperAdmin ? '' : (this.currentUser?.branchId || b[0].id);
      }
    });
    this.db.getUsers$().subscribe(() => {
      this.allUsers = this.db.getAllUsersForTesting();
    });

    this.db.getMenus$().subscribe(() => {
      this.refreshMenu();
    });

    this.db.getRolePermissions$().subscribe(() => {
      this.refreshMenu();
    });

    this.db.getUserOverrides$().subscribe(() => {
      this.refreshMenu();
    });

    this.db.refreshAllFromBackend();
  }

  refreshMenu() {
    this.dynamicMenus = this.auth.getMyMenus();
    this.cdr.markForCheck();
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleGroup(groupCode: string) {
    this.expandedGroups[groupCode] = !this.expandedGroups[groupCode];
  }

  onRoleSwitch() {
    this.auth.switchRole(this.currentUserId);
  }

  async onBranchChange() {
    if (!this.isSuperAdmin) return;
    const branch = this.branches.find(b => b.id === this.selectedBranchId);
    if (!branch) return;
    await this.db.setSelectedBranch(branch);
    this.cdr.markForCheck();
  }

  logout() {
    this.auth.logout();
  }

  private toast = inject(ToastService);

  // Profile Modal State
  isProfileModalOpen = false;
  profileTab: 'info' | 'password' = 'info';
  editProfile = {
    fullName: '',
    email: '',
    phone: '',
    avatar: ''
  };
  pwdForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  isSavingProfile = false;
  isSavingPwd = false;
  isUploadingAvatar = false;

  openProfileModal() {
    if (this.currentUser) {
      this.editProfile = {
        fullName: this.currentUser.fullName || '',
        email: this.currentUser.email || '',
        phone: this.currentUser.phone || '',
        avatar: this.currentUser.avatar || ''
      };
      this.pwdForm = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
      this.profileTab = 'info';
      this.isProfileModalOpen = true;
    }
  }

  async onAvatarFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.isUploadingAvatar = true;
      try {
        const result = await this.auth.uploadFile(file, 'avatars');
        if (result && result.url) {
          this.editProfile.avatar = result.url;
          this.toast.success('Photo Uploaded', 'New profile avatar preview loaded.');
        }
      } catch {
        this.toast.error('Upload Error', 'Failed to upload avatar photo.');
      } finally {
        this.isUploadingAvatar = false;
      }
    }
  }

  async saveProfile() {
    if (!this.editProfile.fullName?.trim()) {
      this.toast.error('Validation Error', 'Full Name is required.');
      return;
    }

    this.isSavingProfile = true;
    try {
      const success = await this.auth.updateProfile(this.editProfile);
      if (success) {
        this.isProfileModalOpen = false;
        this.cdr.markForCheck();
      }
    } finally {
      this.isSavingProfile = false;
      this.cdr.markForCheck();
    }
  }

  async savePassword() {
    if (!this.pwdForm.currentPassword) {
      this.toast.error('Validation Error', 'Current password is required.');
      return;
    }
    if (!this.pwdForm.newPassword || this.pwdForm.newPassword.length < 6) {
      this.toast.error('Validation Error', 'New password must be at least 6 characters.');
      return;
    }
    if (this.pwdForm.newPassword !== this.pwdForm.confirmPassword) {
      this.toast.error('Validation Error', 'New password and confirmation do not match.');
      return;
    }

    this.isSavingPwd = true;
    try {
      const success = await this.auth.changePassword(this.pwdForm.currentPassword, this.pwdForm.newPassword);
      if (success) {
        this.isProfileModalOpen = false;
        this.cdr.markForCheck();
      }
    } finally {
      this.isSavingPwd = false;
      this.cdr.markForCheck();
    }
  }
}
