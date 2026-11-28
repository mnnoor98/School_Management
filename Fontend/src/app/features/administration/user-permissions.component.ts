import { CampusImageDirective } from '../../shared/components/campus-image.directive';
import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminStoreService } from '../../core/services/stores/admin-store.service';
import { ToastService } from '../../core/services/toast.service';
import { User, Role, MenuItem, UserMenuOverride, OverrideType, PermissionAction, Branch } from '../../core/models';
import { BadgeComponent } from '../../shared/components/badge.component';
import { IconComponent } from '../../shared/components/icon.component';
import { ModalComponent } from '../../shared/components/modal.component';

interface UserPermissionRow {
  menu: MenuItem;
  roleGranted: boolean;
  override: OverrideType;
  effective: boolean;
}

@Component({
  selector: 'app-user-permissions',
  standalone: true,
  imports: [CampusImageDirective, CommonModule, FormsModule, BadgeComponent, IconComponent, ModalComponent],
  template: `
    <div class="page-container">
      <!-- PAGE HEADER -->
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <app-icon name="user-check" [size]="26" class="text-primary"></app-icon>
            Institutional Users & Access Control
          </h1>
          <p class="page-subtitle">
            Manage system accounts, create logins, reset credentials, and configure granular menu precedence overrides.
          </p>
        </div>
        <div class="page-actions">
          <button type="button" class="btn btn-outline" (click)="loadFreshData()" [disabled]="isLoading">
            <app-icon name="refresh-cw" [size]="16"></app-icon>
            <span>Reload</span>
          </button>
          <button type="button" class="btn btn-primary" *ngIf="activeTab === 'users'" (click)="openCreateUserModal()">
            <app-icon name="user-plus" [size]="16"></app-icon>
            <span>Create New User</span>
          </button>
          <button type="button" class="btn btn-primary" *ngIf="activeTab === 'overrides'" (click)="saveAllOverrides()" [disabled]="isSavingOverrides">
            <app-icon name="check" [size]="16" *ngIf="!isSavingOverrides"></app-icon>
            <span>{{ isSavingOverrides ? 'Saving Overrides...' : 'Save User Overrides' }}</span>
          </button>
        </div>
      </div>


      <!-- LUXURY CAMPUS CONTEXT COMMAND STRIP -->
      <div class="campus-command-strip mb-4" *ngIf="activeBranch">
        <div class="campus-strip-left">
          <div class="campus-avatar-icon">
            <app-icon name="building" [size]="22" class="text-primary"></app-icon>
          </div>
          <div class="campus-meta">
            <div class="campus-eyebrow">
              <span class="active-dot"></span>
              CURRENTLY MANAGING USERS FOR:
            </div>
            <div class="campus-title-wrap">
              <h2 class="campus-title">{{ activeBranch.name }}</h2>
              <span class="campus-code-badge">{{ activeBranch.code }}</span>
              <span class="campus-scope-tag">Campus Isolated Scope</span>
            </div>
          </div>
        </div>

        <div class="campus-strip-right" *ngIf="isSuperAdmin && branches.length > 0">
          <span class="strip-label">Switch Campus:</span>
          <div class="campus-pill-group">
            <button
              type="button"
              *ngFor="let b of branches"
              class="campus-pill-btn"
              [class.active]="activeBranch.id === b.id"
              (click)="selectCampus(b)"
              [title]="'Switch user directory to ' + b.name"
            >
              <span class="pill-dot" *ngIf="activeBranch.id === b.id"></span>
              <span>{{ b.name }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- NAVIGATION TABS -->
      <div class="tab-strip mb-4">
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab === 'users'"
          (click)="activeTab = 'users'"
        >
          <app-icon name="users" [size]="16"></app-icon>
          <span>User Accounts & Directory</span>
          <span class="tab-badge">{{ users.length }}</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab === 'overrides'"
          (click)="activeTab = 'overrides'"
        >
          <app-icon name="shield-check" [size]="16"></app-icon>
          <span>Granular Menu Overrides Matrix</span>
        </button>
      </div>

      <!-- TAB 1: USER ACCOUNTS DIRECTORY -->
      <div *ngIf="activeTab === 'users'">
        <!-- FILTER STRIP -->
        <div class="card mb-4">
          <div class="card-body p-3">
            <div class="filter-strip">
              <div class="search-input-wrap">
                <app-icon name="search" [size]="16" class="search-icon"></app-icon>
                <input
                  type="text"
                  [(ngModel)]="searchTerm"
                  class="form-control form-control-sm"
                  placeholder="Search user by name, username, email or phone..."
                />
              </div>

              <div class="filter-item" *ngIf="isSuperAdmin && branches.length > 0">
                <label class="filter-lbl">Campus:</label>
                <select [(ngModel)]="selectedCampusFilter" class="form-select form-select-sm">
                  <option value="ALL">All Campuses</option>
                  <option *ngFor="let b of branches" [value]="b.id">📍 {{ b.name }}</option>
                </select>
              </div>

              <div class="filter-item">
                <label class="filter-lbl">Role:</label>
                <select [(ngModel)]="selectedRoleFilter" class="form-select form-select-sm">
                  <option value="ALL">All Roles</option>
                  <option *ngFor="let r of roles" [value]="r.name">{{ r.name }}</option>
                </select>
              </div>

              <div class="filter-item">
                <label class="filter-lbl">Status:</label>
                <select [(ngModel)]="selectedStatusFilter" class="form-select form-select-sm">
                  <option value="ALL">All Statuses</option>
                  <option value="Active">Active Accounts</option>
                  <option value="Inactive">Deactivated</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- USERS TABLE -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <app-icon name="users" [size]="18" class="text-primary"></app-icon>
              <span>Registered Accounts for {{ activeBranch?.name || 'Active Campus' }}</span>
            </div>
            <span class="text-xs text-muted">Showing {{ filteredUsers.length }} of {{ users.length }} accounts in {{ activeBranch?.name || 'Selected Campus' }}</span>
          </div>

          <div class="app-table-wrapper">
            <table class="app-table">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Username</th>
                  <th>Assigned Campus</th>
                  <th>Assigned Role</th>
                  <th>Contact Details</th>
                  <th>Account Status</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of filteredUsers">
                  <td>
                    <div class="user-profile-cell">
                      <img campusImage [src]="u.avatar" [alt]="u.fullName" class="user-table-avatar" />
                      <div>
                        <strong class="user-table-name">{{ u.fullName }}</strong>
                        <span class="user-id-code">ID: {{ u.id }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <code class="code-tag">{{ u.username }}</code>
                  </td>
                  <td>
                    <span class="campus-code-badge">📍 {{ getUserBranchName(u.branchId) }}</span>
                  </td>
                  <td>
                    <app-badge [variant]="getRoleBadgeVariant(u.roleName)" [label]="u.roleName"></app-badge>
                  </td>
                  <td>
                    <div class="contact-info">
                      <span class="text-xs">{{ u.email }}</span>
                      <span class="text-xs text-muted">{{ u.phone }}</span>
                    </div>
                  </td>
                  <td>
                    <app-badge [variant]="u.isActive ? 'success' : 'neutral'" [label]="u.isActive ? 'Active' : 'Deactivated'"></app-badge>
                  </td>
                  <td>
                    <div class="table-actions-right">
                      <button
                        type="button"
                        class="btn btn-xs btn-outline"
                        title="Configure Menu Overrides"
                        (click)="switchToOverridesForUser(u)"
                      >
                        <app-icon name="shield-check" [size]="12"></app-icon>
                        <span>Permissions</span>
                      </button>
                      <button
                        type="button"
                        class="btn btn-xs btn-outline"
                        title="Edit Account Details"
                        (click)="openEditUserModal(u)"
                      >
                        <app-icon name="edit" [size]="12"></app-icon>
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        class="btn btn-xs btn-outline"
                        title="Reset Password"
                        (click)="openResetPasswordModal(u)"
                      >
                        <app-icon name="key" [size]="12"></app-icon>
                        <span>Reset</span>
                      </button>
                      <button
                        type="button"
                        class="btn btn-xs"
                        [class.btn-outline]="u.isActive"
                        [class.btn-danger]="!u.isActive"
                        [title]="u.isActive ? 'Deactivate User' : 'Activate User'"
                        (click)="toggleUserActive(u)"
                        *ngIf="u.username.toLowerCase() !== 'admin'"
                      >
                        <app-icon [name]="u.isActive ? 'slash' : 'check'" [size]="12"></app-icon>
                        <span>{{ u.isActive ? 'Disable' : 'Enable' }}</span>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="filteredUsers.length === 0">
                  <td colspan="6" class="p-0">
                    <div class="empty-campus-users-card">
                      <div class="empty-users-icon">
                        <app-icon name="users" [size]="36"></app-icon>
                      </div>
                      <h3 class="empty-users-title">No Accounts Found in {{ activeBranch?.name || 'Selected Campus' }}</h3>
                      <p class="empty-users-desc">
                        There are currently no users created for <strong>{{ activeBranch?.name || 'this campus' }}</strong>.
                        Every user created here will be strictly isolated to {{ activeBranch?.name || 'this campus' }}.
                      </p>
                      <button type="button" class="btn btn-primary" (click)="openCreateUserModal()">
                        <app-icon name="user-plus" [size]="16"></app-icon>
                        <span>Create First User for {{ activeBranch?.name || 'This Campus' }}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 2: GRANULAR MENU OVERRIDES MATRIX -->
      <div *ngIf="activeTab === 'overrides'">
        <!-- PRECEDENCE RULE BANNER -->
        <div class="card precedence-banner mb-4">
          <div class="precedence-header">
            <app-icon name="shield-check" [size]="20" class="text-primary"></app-icon>
            <strong>Authorization Precedence Engine:</strong>
          </div>
          <div class="precedence-flow">
            <div class="step-pill step-deny">1. Explicit User Deny</div>
            <span class="step-arr">➔</span>
            <div class="step-pill step-allow">2. Explicit User Allow</div>
            <span class="step-arr">➔</span>
            <div class="step-pill step-role">3. Role Grants</div>
            <span class="step-arr">➔</span>
            <div class="step-pill step-default">4. Default Deny</div>
          </div>
          <p class="precedence-note">
            Allows custom permission overrides per individual user without modifying global role assignments. For example, grant a specific Teacher access to Fee Collection!
          </p>
        </div>

        <!-- USER SELECTOR & ROLE SUMMARY -->
        <div class="card mb-4">
          <div class="card-body">
            <div class="user-select-grid">
              <div class="form-group mb-0">
                <label class="form-label">Select Target User:</label>
                <select class="form-select user-select" [(ngModel)]="selectedUserId" (change)="onUserChange()">
                  <option *ngFor="let u of users" [value]="u.id">
                    {{ u.fullName }} — [{{ u.roleName }}] ({{ u.username }})
                  </option>
                </select>
              </div>

              <div class="user-summary-card" *ngIf="selectedUser">
                <img campusImage [src]="selectedUser.avatar" [alt]="selectedUser.fullName" class="target-avatar" />
                <div>
                  <h4 class="target-name">{{ selectedUser.fullName }}</h4>
                  <div class="target-details">
                    <app-badge [variant]="getRoleBadgeVariant(selectedUser.roleName)" [label]="selectedUser.roleName"></app-badge>
                    <span>{{ selectedUser.email }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- OVERRIDE ASSIGNMENT TABLE -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <app-icon name="lock" [size]="18" class="text-primary"></app-icon>
              <span>Menu Access Override Matrix for {{ selectedUser?.fullName }}</span>
            </div>
            <span class="text-sm text-muted">Real-time Effective Access Calculation</span>
          </div>

          <div class="app-table-wrapper">
            <table class="app-table">
              <thead>
                <tr>
                  <th>Menu / Feature</th>
                  <th>Menu Code</th>
                  <th>Role Base Grant</th>
                  <th>User Override Action</th>
                  <th>Effective Access</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of rows" [class.highlight-override]="row.override !== 'Inherit'">
                  <td>
                    <div class="flex items-center gap-2">
                      <app-icon [name]="row.menu.icon" [size]="16" class="text-primary"></app-icon>
                      <strong>{{ row.menu.name }}</strong>
                      <span *ngIf="row.menu.parentCode" class="parent-label">({{ row.menu.parentCode }})</span>
                    </div>
                  </td>
                  <td><code class="code-tag">{{ row.menu.code }}</code></td>
                  <td>
                    <app-badge
                      [variant]="row.roleGranted ? 'success' : 'neutral'"
                      [label]="row.roleGranted ? 'Granted by Role' : 'Not in Role'"
                    ></app-badge>
                  </td>
                  <td>
                    <div class="override-radio-group">
                      <label class="radio-chip" [class.active]="row.override === 'Inherit'">
                        <input
                          type="radio"
                          [name]="'override_' + row.menu.code"
                          value="Inherit"
                          [(ngModel)]="row.override"
                          (change)="recomputeEffective(row)"
                        />
                        <span>Inherit Role</span>
                      </label>

                      <label class="radio-chip chip-allow" [class.active]="row.override === 'Allow'">
                        <input
                          type="radio"
                          [name]="'override_' + row.menu.code"
                          value="Allow"
                          [(ngModel)]="row.override"
                          (change)="recomputeEffective(row)"
                        />
                        <span>Allow (Force)</span>
                      </label>

                      <label class="radio-chip chip-deny" [class.active]="row.override === 'Deny'">
                        <input
                          type="radio"
                          [name]="'override_' + row.menu.code"
                          value="Deny"
                          [(ngModel)]="row.override"
                          (change)="recomputeEffective(row)"
                        />
                        <span>Deny (Block)</span>
                      </label>
                    </div>
                  </td>
                  <td>
                    <div class="effective-cell">
                      <app-badge
                        [variant]="row.effective ? 'success' : 'danger'"
                        [label]="row.effective ? 'ACCESS ALLOWED' : 'ACCESS DENIED'"
                      ></app-badge>
                      <span class="effective-reason" *ngIf="row.override === 'Allow'">(User Allow Override)</span>
                      <span class="effective-reason text-danger" *ngIf="row.override === 'Deny'">(User Deny Override)</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: CREATE NEW USER -->
    <app-modal
      [isOpen]="isCreateModalOpen"
      title="Create New User Account"
      subtitle="Register a new institutional user with role and credentials in PostgreSQL."
      [maxWidth]="550"
      (closed)="closeCreateModal()"
    >
      <div body class="modal-form">
        <!-- ACTIVE CAMPUS TARGET SCOPE CALLOUT -->
        <div class="campus-target-callout" *ngIf="activeBranch">
          <div class="callout-icon-wrap">
            <app-icon name="map-pin" [size]="20" class="text-primary"></app-icon>
          </div>
          <div class="callout-details">
            <div class="callout-title">
              Target Campus: <strong>{{ activeBranch.name }}</strong>
              <span class="campus-code-badge ml-1">{{ activeBranch.code }}</span>
            </div>
            <div class="callout-sub">
              This account will be permanently scoped to <strong>{{ activeBranch.name }}</strong>. All academic records, attendance, and finance actions by this user will be isolated to this campus.
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Assigned Campus / Branch <span class="required">*</span></label>
          <select class="form-select" [(ngModel)]="createForm.branchId">
            <option *ngFor="let b of branches" [value]="b.id">📍 {{ b.name }} ({{ b.code }})</option>
          </select>
          <small class="text-xs text-muted">Select which campus this user account will belong to.</small>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Username <span class="required">*</span></label>
            <input type="text" class="form-control" [(ngModel)]="createForm.username" placeholder="e.g. jdoe" />
          </div>
          <div class="form-group">
            <label class="form-label">Role <span class="required">*</span></label>
            <select class="form-select" [(ngModel)]="createForm.roleId">
              <option *ngFor="let r of assignableRoles" [value]="r.id">{{ r.name }}</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Full Name <span class="required">*</span></label>
          <input type="text" class="form-control" [(ngModel)]="createForm.fullName" placeholder="Full legal name" />
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Email Address <span class="required">*</span></label>
            <input type="email" class="form-control" [(ngModel)]="createForm.email" placeholder="user@school.edu.bd" />
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="text" class="form-control" [(ngModel)]="createForm.phone" placeholder="+880 1700-000000" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Initial Password <span class="required">*</span></label>
          <input type="text" class="form-control" [(ngModel)]="createForm.password" placeholder="Default: password123" />
          <small class="text-xs text-muted">User can use this password to sign in immediately.</small>
        </div>
      </div>

      <div footer class="flex justify-end gap-2">
        <button type="button" class="btn btn-outline" (click)="closeCreateModal()">Cancel</button>
        <button type="button" class="btn btn-primary" (click)="saveNewUser()" [disabled]="isSubmitting">
          <span>{{ isSubmitting ? 'Creating Account...' : 'Create Account' }}</span>
        </button>
      </div>
    </app-modal>

    <!-- MODAL: EDIT USER -->
    <app-modal
      [isOpen]="isEditModalOpen"
      title="Edit User Profile"
      subtitle="Update contact details, role assignment, and active status."
      [maxWidth]="500"
      (closed)="closeEditModal()"
    >
      <div body class="modal-form">
        <div class="form-group">
          <label class="form-label">Assigned Campus / Branch <span class="required">*</span></label>
          <select class="form-select" [(ngModel)]="editForm.branchId">
            <option *ngFor="let b of branches" [value]="b.id">📍 {{ b.name }} ({{ b.code }})</option>
          </select>
          <small class="text-xs text-muted">Change which campus this user account is assigned to.</small>
        </div>

        <div class="form-group">
          <label class="form-label">Full Name <span class="required">*</span></label>
          <input type="text" class="form-control" [(ngModel)]="editForm.fullName" />
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Email Address <span class="required">*</span></label>
            <input type="email" class="form-control" [(ngModel)]="editForm.email" />
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="text" class="form-control" [(ngModel)]="editForm.phone" />
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Assigned Role <span class="required">*</span></label>
            <select class="form-select" [(ngModel)]="editForm.roleId">
              <option *ngFor="let r of assignableRoles" [value]="r.id">{{ r.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Account Status</label>
            <select class="form-select" [(ngModel)]="editForm.isActive">
              <option [ngValue]="true">Active</option>
              <option [ngValue]="false">Deactivated</option>
            </select>
          </div>
        </div>
      </div>

      <div footer class="flex justify-end gap-2">
        <button type="button" class="btn btn-outline" (click)="closeEditModal()">Cancel</button>
        <button type="button" class="btn btn-primary" (click)="saveEditedUser()" [disabled]="isSubmitting">
          <span>{{ isSubmitting ? 'Saving...' : 'Save Changes' }}</span>
        </button>
      </div>
    </app-modal>

    <!-- MODAL: RESET PASSWORD -->
    <app-modal
      [isOpen]="isResetModalOpen"
      title="Reset User Password"
      subtitle="Issue a new password for {{ targetResetUser?.fullName }} ({{ targetResetUser?.username }})."
      [maxWidth]="450"
      (closed)="closeResetModal()"
    >
      <div body class="modal-form">
        <div class="form-group">
          <label class="form-label">New Password <span class="required">*</span></label>
          <input type="text" class="form-control" [(ngModel)]="newPassword" placeholder="e.g. password123" />
        </div>
        <div class="quick-pwd-buttons">
          <span class="text-xs text-muted">Quick suggestions:</span>
          <button type="button" class="btn btn-xs btn-outline" (click)="newPassword = targetResetUser?.username + '123'">
            {{ targetResetUser?.username }}123
          </button>
          <button type="button" class="btn btn-xs btn-outline" (click)="newPassword = 'password123'">
            password123
          </button>
        </div>
      </div>

      <div footer class="flex justify-end gap-2">
        <button type="button" class="btn btn-outline" (click)="closeResetModal()">Cancel</button>
        <button type="button" class="btn btn-primary" (click)="confirmPasswordReset()" [disabled]="isSubmitting">
          <span>{{ isSubmitting ? 'Resetting...' : 'Reset Password' }}</span>
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .mb-4 { margin-bottom: 24px; }
    .mb-0 { margin-bottom: 0 !important; }
    .py-4 { padding-top: 16px; padding-bottom: 16px; }
    .text-primary { color: #4f46e5; }
    .text-danger { color: #ef4444; }
    .text-xs { font-size: 0.75rem; }
    .text-sm { font-size: 0.8125rem; }
    .text-muted { color: #64748b; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .flex { display: flex; }
    .items-center { align-items: center; }
    .justify-end { justify-content: flex-end; }
    .gap-2 { gap: 8px; }

    /* Tabs */
    .tab-strip {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 8px;
    }
    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 10px;
      font-size: 0.875rem;
      font-weight: 700;
      color: #64748b;
      background: transparent;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tab-btn:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .tab-btn.active {
      background: #eef2ff;
      color: #4f46e5;
      border-color: #c7d2fe;
    }
    .tab-badge {
      padding: 2px 8px;
      background: #ffffff;
      border-radius: 999px;
      font-size: 0.75rem;
      border: 1px solid #c7d2fe;
    }

    /* Filters */
    .filter-strip {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .search-input-wrap {
      flex: 1;
      min-width: 260px;
      position: relative;
    }
    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }
    .search-input-wrap .form-control {
      padding-left: 36px;
    }
    .filter-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .filter-lbl {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #475569;
      white-space: nowrap;
    }

    /* Users Table */
    .user-profile-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .user-table-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      object-fit: cover;
      border: 1px solid #e2e8f0;
    }
    .user-table-name {
      display: block;
      font-size: 0.875rem;
      color: #0f172a;
    }
    .user-id-code {
      font-size: 0.7rem;
      color: #94a3b8;
      font-family: monospace;
    }
    .contact-info {
      display: flex;
      flex-direction: column;
    }
    .code-tag {
      font-size: 0.75rem;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
      color: #4f46e5;
    }
    .table-actions-right {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
    }
    .btn-xs {
      padding: 4px 8px;
      font-size: 0.75rem;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .btn-danger {
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fca5a5;
    }

    /* Precedence Banner */
    .precedence-banner {
      background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
      border: 1px solid #c7d2fe;
      padding: 16px 20px;
    }
    .precedence-header {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.95rem;
      margin-bottom: 10px;
    }
    .precedence-flow {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 6px;
    }
    .step-pill {
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .step-deny { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }
    .step-allow { background: #dcfce7; color: #16a34a; border: 1px solid #86efac; }
    .step-role { background: #e0e7ff; color: #4338ca; border: 1px solid #a5b4fc; }
    .step-default { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
    .step-arr { color: #94a3b8; font-weight: bold; }
    .precedence-note {
      font-size: 0.8rem;
      color: #475569;
      margin: 6px 0 0 0;
    }

    /* Override Matrix */
    .user-select-grid {
      display: grid;
      grid-template-columns: 1fr 1.5fr;
      gap: 20px;
      align-items: center;
    }
    .user-summary-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 10px 14px;
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: 10px;
    }
    .target-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }
    .target-name {
      font-size: 0.9rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 2px;
    }
    .target-details {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.75rem;
      color: #64748b;
    }
    .parent-label {
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: normal;
    }
    .override-radio-group {
      display: flex;
      gap: 6px;
    }
    .radio-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      background: #f1f5f9;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      font-size: 0.725rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s;
    }
    .radio-chip input { display: none; }
    .radio-chip.active {
      background: #e2e8f0;
      color: #0f172a;
      border-color: #94a3b8;
    }
    .radio-chip.chip-allow.active {
      background: #dcfce7;
      color: #15803d;
      border-color: #86efac;
    }
    .radio-chip.chip-deny.active {
      background: #fee2e2;
      color: #b91c1c;
      border-color: #fca5a5;
    }
    .effective-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .effective-reason {
      font-size: 0.7rem;
      color: #16a34a;
      font-weight: 600;
    }
    .highlight-override {
      background: #faf5ff;
    }

    
    /* Luxury Campus Command Strip */
    .campus-command-strip {
      background: #ffffff;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 14px;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
      flex-wrap: wrap;
    }
    .campus-strip-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .campus-avatar-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .campus-meta {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .campus-eyebrow {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.6875rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      color: #64748b;
      text-transform: uppercase;
    }
    .active-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
      display: inline-block;
    }
    .campus-title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .campus-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      line-height: 1.2;
    }
    .campus-code-badge {
      font-size: 0.7rem;
      font-weight: 700;
      background: #f1f5f9;
      color: #475569;
      padding: 2px 7px;
      border-radius: 6px;
      font-family: monospace;
      border: 1px solid #cbd5e1;
    }
    .campus-scope-tag {
      font-size: 0.72rem;
      font-weight: 700;
      color: #4f46e5;
      background: #eef2ff;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid #c7d2fe;
    }
    .campus-strip-right {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .strip-label {
      font-size: 0.8125rem;
      font-weight: 700;
      color: #64748b;
    }
    .campus-pill-group {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .campus-pill-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: 9999px;
      font-size: 0.8125rem;
      font-weight: 700;
      color: #475569;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .campus-pill-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
      border-color: #94a3b8;
    }
    .campus-pill-btn.active {
      background: #0f172a;
      color: #ffffff;
      border-color: #0f172a;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.2);
    }
    .pill-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #34d399;
    }
    .p-0 { padding: 0 !important; }
    .ml-1 { margin-left: 4px; }
    .empty-campus-users-card {
      padding: 44px 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #fafbfc;
      border-radius: 8px;
    }
    .empty-users-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #eef2ff;
      color: #4f46e5;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 14px;
      border: 1px solid #c7d2fe;
    }
    .empty-users-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 6px 0;
    }
    .empty-users-desc {
      max-width: 440px;
      font-size: 0.84rem;
      color: #64748b;
      line-height: 1.5;
      margin: 0 0 18px 0;
    }
    .campus-target-callout {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #4f46e5;
      border-radius: 8px;
      padding: 12px 14px;
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    .callout-icon-wrap {
      flex-shrink: 0;
      margin-top: 2px;
    }
    .callout-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .callout-title {
      font-size: 0.875rem;
      color: #0f172a;
      display: flex;
      align-items: center;
    }
    .callout-sub {
      font-size: 0.775rem;
      color: #64748b;
      line-height: 1.4;
    }
    .campus-sub-tag {
      display: inline-block;
      margin-top: 2px;
      font-size: 0.6875rem;
      color: #4f46e5;
      background: #eef2ff;
      padding: 1px 6px;
      border-radius: 4px;
      font-weight: 600;
      margin-left: 6px;
    }

    /* Modal */
    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .quick-pwd-buttons {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
    }
  `]
})
export class UserPermissionsComponent implements OnInit, OnDestroy {
  private db = inject(AdminStoreService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  branches: Branch[] = [];
  activeBranch: Branch | null = null;
  isSuperAdmin = false;

  activeTab: 'users' | 'overrides' = 'users';

  users: User[] = [];
  roles: Role[] = [];
  menus: MenuItem[] = [];

  get assignableRoles(): Role[] {
    if (this.isSuperAdmin) return this.roles;
    return this.roles.filter(r => r.code !== 'SUPER_ADMIN' && !r.name.includes('Super Admin'));
  }

  // Filter state
  searchTerm = '';
  selectedRoleFilter = 'ALL';
  selectedStatusFilter = 'ALL';
  selectedCampusFilter = 'ALL';

  // Override Matrix state
  selectedUserId = '';
  selectedUser: User | null = null;
  rows: UserPermissionRow[] = [];

  isLoading = false;
  isSavingOverrides = false;
  isSubmitting = false;

  // Create User Modal
  isCreateModalOpen = false;
  createForm = {
    username: '',
    fullName: '',
    email: '',
    phone: '',
    roleId: '',
    branchId: '',
    password: 'password123'
  };

  // Edit User Modal
  isEditModalOpen = false;
  editingUserId = '';
  editForm = {
    fullName: '',
    email: '',
    phone: '',
    roleId: '',
    branchId: '',
    isActive: true
  };

  // Reset Password Modal
  isResetModalOpen = false;
  targetResetUser: User | null = null;
  newPassword = 'password123';

  ngOnInit() {
    this.isSuperAdmin = this.db.isSuperAdmin();

    this.db.getBranches$().pipe(takeUntil(this.destroy$)).subscribe(b => {
      this.branches = b;
      this.cdr.markForCheck();
    });

    this.db.getSelectedBranch$().pipe(takeUntil(this.destroy$)).subscribe(branch => {
      this.activeBranch = branch;
      this.cdr.markForCheck();
    });

    this.db.getUsers$().pipe(takeUntil(this.destroy$)).subscribe(u => {
      this.users = u;
      if (!this.selectedUserId && u.length > 0) {
        this.selectedUserId = u[0].id;
        this.selectedUser = u[0];
        this.buildMatrix();
      }
      this.cdr.markForCheck();
    });

    this.db.getRoles$().pipe(takeUntil(this.destroy$)).subscribe(r => {
      this.roles = r;
      if (!this.createForm.roleId && r.length > 0) {
        this.createForm.roleId = r[0].id;
      }
      this.cdr.markForCheck();
    });

    this.db.getMenus$().pipe(takeUntil(this.destroy$)).subscribe(m => {
      this.menus = m;
      this.buildMatrix();
      this.cdr.markForCheck();
    });

    this.loadFreshData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async selectCampus(branch: Branch) {
    if (!this.isSuperAdmin || !branch?.id || branch.id === this.activeBranch?.id) return;
    this.isLoading = true;
    this.cdr.markForCheck();
    try {
      await this.db.setSelectedBranch(branch);
      this.activeBranch = branch;
      await this.loadFreshData();
    } catch {
      this.toast.error('Error', 'Failed to switch campus.');
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  async loadFreshData() {
    this.isLoading = true;
    this.cdr.markForCheck();
    try {
      await this.db.refreshAllFromBackend();
    } catch {
      // Handled silently
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  getUserBranchName(branchId: string | undefined): string {
    if (!branchId) return 'Main Campus';
    const b = this.branches.find(x => x.id === branchId);
    return b ? b.name : (branchId === 'br-02' ? 'Uttara Campus' : branchId);
  }

  get filteredUsers(): User[] {
    let list = this.users;

    if (this.selectedCampusFilter !== 'ALL') {
      list = list.filter(u => u.branchId === this.selectedCampusFilter);
    }

    if (this.selectedRoleFilter !== 'ALL') {
      list = list.filter(u => u.roleName === this.selectedRoleFilter);
    }

    if (this.selectedStatusFilter === 'Active') {
      list = list.filter(u => u.isActive);
    } else if (this.selectedStatusFilter === 'Inactive') {
      list = list.filter(u => !u.isActive);
    }

    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(u =>
        u.fullName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q))
      );
    }

    return list;
  }

  getRoleBadgeVariant(roleName: string): 'success' | 'warning' | 'info' | 'purple' | 'danger' | 'neutral' {
    if (roleName.includes('Admin')) return 'purple';
    if (roleName.includes('Teacher')) return 'info';
    if (roleName.includes('Accountant')) return 'success';
    if (roleName.includes('Student')) return 'info';
    if (roleName.includes('Guardian')) return 'warning';
    return 'neutral';
  }

  switchToOverridesForUser(user: User) {
    this.selectedUserId = user.id;
    this.selectedUser = user;
    this.buildMatrix();
    this.activeTab = 'overrides';
  }

  onUserChange() {
    this.selectedUser = this.users.find(u => u.id === this.selectedUserId) || null;
    this.buildMatrix();
  }

  buildMatrix() {
    if (!this.selectedUser) return;

    const userOverrides = this.db.getUserOverrides(this.selectedUserId);
    const overrideMap = new Map<string, OverrideType>();
    userOverrides.forEach(uo => {
      overrideMap.set(`${uo.menuCode}:${uo.action}`, uo.override);
    });

    const flatMenus: MenuItem[] = [];
    const flatten = (items: MenuItem[]) => {
      for (const m of items) {
        flatMenus.push(m);
        if (m.children) flatten(m.children);
      }
    };
    flatten(this.menus);

    this.rows = flatMenus.map(menu => {
      const roleGranted = this.checkRoleGranted(menu.code, 'view');
      const override = overrideMap.get(`${menu.code}:view`) || 'Inherit';

      let effective = false;
      if (override === 'Deny') effective = false;
      else if (override === 'Allow') effective = true;
      else effective = roleGranted;

      return {
        menu,
        roleGranted,
        override,
        effective
      };
    });
  }

  checkRoleGranted(menuCode: string, action: PermissionAction): boolean {
    if (!this.selectedUser) return false;
    const rolePerms = this.db.getRolePermissions(this.selectedUser.roleId);
    const p = rolePerms.find(rp => rp.menuCode === menuCode);
    return !!p && p[action];
  }

  recomputeEffective(row: UserPermissionRow) {
    if (row.override === 'Deny') row.effective = false;
    else if (row.override === 'Allow') row.effective = true;
    else row.effective = row.roleGranted;
  }

  saveAllOverrides() {
    if (!this.selectedUser) return;

    this.isSavingOverrides = true;
    this.rows.forEach(r => {
      this.db.saveUserOverride({
        userId: this.selectedUserId,
        menuCode: r.menu.code,
        action: 'view',
        override: r.override
      });
    });

    setTimeout(() => {
      this.isSavingOverrides = false;
      this.toast.success(
        'Overrides Updated',
        `User-specific overrides applied for ${this.selectedUser?.fullName}. Active menus refreshed in database.`
      );
    }, 400);
  }

  // --- User Account CRUD Operations ---
  openCreateUserModal() {
    this.createForm = {
      username: '',
      fullName: '',
      email: '',
      phone: '',
      roleId: this.roles[0]?.id || 'role-teacher',
      branchId: this.activeBranch?.id || (this.branches[0]?.id ?? 'br-01'),
      password: 'password123'
    };
    this.isCreateModalOpen = true;
  }

  closeCreateModal() {
    this.isCreateModalOpen = false;
  }

  saveNewUser() {
    if (!this.createForm.username.trim() || !this.createForm.fullName.trim() || !this.createForm.email.trim()) {
      this.toast.error('Validation Error', 'Username, Full Name and Email are required.');
      return;
    }

    const selectedRole = this.roles.find(r => r.id === this.createForm.roleId);

    this.isSubmitting = true;
    this.db.createUser({
      username: this.createForm.username.trim(),
      fullName: this.createForm.fullName.trim(),
      email: this.createForm.email.trim(),
      phone: this.createForm.phone.trim(),
      roleId: this.createForm.roleId,
      roleName: selectedRole?.name || 'Teacher',
      password: this.createForm.password.trim() || 'password123',
      branchId: this.createForm.branchId || this.activeBranch?.id
    }).subscribe({
      next: async res => {
        this.isSubmitting = false;
        if (res && res.success) {
          const targetBranchName = this.getUserBranchName(this.createForm.branchId || this.activeBranch?.id);
          this.toast.success('Account Created', `User ${res.data.fullName} registered for ${targetBranchName}.`);
          this.closeCreateModal();
          await this.db.refreshAllFromBackend();
          this.cdr.markForCheck();
        } else {
          this.toast.error('Error', res?.message || 'Could not create user account.');
        }
      },
      error: err => {
        this.isSubmitting = false;
        this.toast.error('Error', err?.error?.message || 'Server error creating user.');
        this.cdr.markForCheck();
      }
    });
  }

  openEditUserModal(u: User) {
    this.editingUserId = u.id;
    this.editForm = {
      fullName: u.fullName,
      email: u.email,
      phone: u.phone || '',
      roleId: u.roleId,
      branchId: u.branchId || this.activeBranch?.id || 'br-01',
      isActive: u.isActive
    };
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
  }

  saveEditedUser() {
    if (!this.editForm.fullName.trim() || !this.editForm.email.trim()) {
      this.toast.error('Validation Error', 'Full Name and Email are required.');
      return;
    }

    this.isSubmitting = true;
    this.db.updateUser(this.editingUserId, {
      fullName: this.editForm.fullName.trim(),
      email: this.editForm.email.trim(),
      phone: this.editForm.phone?.trim() ?? '',
      roleId: this.editForm.roleId,
      branchId: this.editForm.branchId,
      isActive: this.editForm.isActive
    }).subscribe({
      next: async res => {
        this.isSubmitting = false;
        if (res && res.success) {
          this.toast.success('Profile Updated', 'User account updated successfully in database.');
          this.closeEditModal();
          await this.db.refreshAllFromBackend();
          this.cdr.markForCheck();
        } else {
          this.toast.error('Error', res?.message || 'Could not update user.');
        }
      },
      error: err => {
        this.isSubmitting = false;
        this.toast.error('Error', err?.error?.message || 'Server error updating user.');
        this.cdr.markForCheck();
      }
    });
  }

  toggleUserActive(u: User) {
    this.db.toggleUserStatus(u.id).subscribe({
      next: res => {
        if (res && res.success) {
          this.toast.info('Status Changed', res.message);
          this.db.refreshAllFromBackend();
          this.cdr.markForCheck();
        } else {
          this.toast.error('Error', res?.message || 'Could not change status.');
        }
      },
      error: err => {
        this.toast.error('Error', err?.error?.message || 'Action failed.');
      }
    });
  }

  openResetPasswordModal(u: User) {
    this.targetResetUser = u;
    this.newPassword = `${u.username.toLowerCase()}123`;
    this.isResetModalOpen = true;
  }

  closeResetModal() {
    this.isResetModalOpen = false;
    this.targetResetUser = null;
  }

  confirmPasswordReset() {
    if (!this.targetResetUser) return;

    this.isSubmitting = true;
    this.db.resetUserPassword(this.targetResetUser.id, this.newPassword).subscribe({
      next: res => {
        this.isSubmitting = false;
        if (res && res.success) {
          this.toast.success('Password Reset', res.message || 'Password updated in database.');
          this.closeResetModal();
          this.cdr.markForCheck();
        } else {
          this.toast.error('Error', res?.message || 'Could not reset password.');
        }
      },
      error: err => {
        this.isSubmitting = false;
        this.toast.error('Error', err?.error?.message || 'Failed to reset password.');
        this.cdr.markForCheck();
      }
    });
  }
}
