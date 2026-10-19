import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { MockDbService } from '../core/services/mock-db.service';
import { MenuItem, User, Branch } from '../core/models';
import { IconComponent } from '../shared/components/icon.component';
import { ToastContainerComponent } from '../shared/components/toast-container.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, IconComponent, ToastContainerComponent],
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
          <span class="scope-label">Branch Scope</span>
          <select class="scope-select" [(ngModel)]="selectedBranchId" (change)="onBranchChange()">
            <option *ngFor="let b of branches" [value]="b.id">{{ b.name }}</option>
          </select>
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
            <img [src]="currentUser.avatar" [alt]="currentUser.fullName" class="user-avatar" />
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
            <!-- Sleek Role Testing Switcher (For Demo & Verification) -->
            <div class="role-switcher-pill">
              <div class="switcher-icon-wrap">
                <app-icon name="shield-check" [size]="16"></app-icon>
              </div>
              <div class="switcher-content">
                <span class="switcher-hint">Role Preview:</span>
                <select class="role-switcher-select" [(ngModel)]="currentUserId" (change)="onRoleSwitch()">
                  <option *ngFor="let u of allUsers" [value]="u.id">
                    {{ u.roleName }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Audit Trail Shortcut -->
            <a routerLink="/app/admin/audit-log" class="topbar-action-btn" title="Audit Trail">
              <app-icon name="history" [size]="18"></app-icon>
            </a>

            <!-- User Profile Summary -->
            <div class="topbar-profile" *ngIf="currentUser">
              <div class="profile-avatar-wrap">
                <img [src]="currentUser.avatar" [alt]="currentUser.fullName" class="profile-thumb" />
                <span class="online-indicator"></span>
              </div>
              <div class="profile-meta">
                <span class="meta-name">{{ currentUser.fullName }}</span>
                <span class="meta-role">{{ currentUser.roleName }}</span>
              </div>
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
      padding: 10px 16px;
      background: #1e293b;
      margin: 12px 14px 4px 14px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .scope-label {
      display: block;
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 4px;
      letter-spacing: 0.04em;
    }
    .scope-select {
      width: 100%;
      background: transparent;
      border: none;
      color: #e2e8f0;
      font-size: 0.8rem;
      font-weight: 600;
      outline: none;
      cursor: pointer;
    }
    .scope-select option {
      background: #0f172a;
      color: #ffffff;
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
  private db = inject(MockDbService);
  private router = inject(Router);

  school = this.db.getSchool();
  branches = this.db.getBranches();
  selectedBranchId = this.branches[0]?.id;
  allUsers = this.db.getUsers();

  currentUser: User | null = null;
  currentUserId = '';
  isSidebarCollapsed = false;

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
        this.refreshMenu();
      }
    });

    this.db.getSchool$().subscribe(s => this.school = s);
    this.db.getBranches$().subscribe(b => {
      this.branches = b;
      if (!this.selectedBranchId && b.length > 0) {
        this.selectedBranchId = b[0].id;
      }
    });
    this.db.getUsers$().subscribe(u => this.allUsers = u);

    this.db.getMenus$().subscribe(() => {
      this.refreshMenu();
    });

    this.db.getRolePermissions$().subscribe(() => {
      this.refreshMenu();
    });

    this.db.getUserOverrides$().subscribe(() => {
      this.refreshMenu();
    });
  }

  refreshMenu() {
    this.dynamicMenus = this.auth.getMyMenus();
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

  onBranchChange() {
    const b = this.branches.find(x => x.id === this.selectedBranchId);
    if (b) {
      this.db.setSelectedBranch(b);
      this.db.logAudit('Update', 'Branch Scope', `Switched active branch scope to: ${b.name}`);
    }
  }

  logout() {
    this.auth.logout();
  }
}
