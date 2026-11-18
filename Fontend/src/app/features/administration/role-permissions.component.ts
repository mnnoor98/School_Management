import { firstValueFrom, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminStoreService } from '../../core/services/stores/admin-store.service';
import { ToastService } from '../../core/services/toast.service';
import { Role, MenuItem, RolePermission, Branch } from '../../core/models';
import { ModalComponent } from '../../shared/components/modal.component';
import { IconComponent } from '../../shared/components/icon.component';
import { BadgeComponent } from '../../shared/components/badge.component';

@Component({
  selector: 'app-role-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, IconComponent, BadgeComponent],
  template: `
    <div class="page-container">
      <!-- 1. PAGE HEADER CARD -->
      <div class="page-header-card mb-4">
        <div class="header-left-col">
          <div class="header-icon-box">
            <app-icon name="shield-check" [size]="28" class="text-primary"></app-icon>
          </div>
          <div class="header-text-block">
            <div class="header-eyebrow">
              <span class="eyebrow-pill">RBAC SECURITY GOVERNANCE</span>
              <span>CAMPUS CAPABILITY ENGINE</span>
            </div>
            <h1 class="page-title">Role Capability & Access Matrix</h1>
            <p class="page-subtitle">
              Configure fine-grained module access and operational privileges for institutional roles in <strong>{{ activeBranch?.name || 'Active Campus' }}</strong>.
            </p>
          </div>
        </div>
        <div class="header-right-col">
          <button type="button" class="btn btn-outline btn-reset" (click)="loadRolePermissions()" [disabled]="isLoading || isSaving" title="Reload from database">
            <app-icon name="refresh-cw" [size]="15" [class.spin]="isLoading"></app-icon>
            <span>Reset Matrix</span>
          </button>
          <button
            type="button"
            class="btn btn-primary btn-save-matrix"
            (click)="openConfirmModal()"
            [disabled]="isLoading || isSaving || isSuperAdminRole || !!errorMessage"
            title="Save updated capabilities for {{ activeRole?.name }}"
          >
            <app-icon name="check" [size]="18" *ngIf="!isSaving"></app-icon>
            <span *ngIf="isSaving">Saving Changes...</span>
            <span *ngIf="!isSaving">Save Role Permissions</span>
          </button>
        </div>
      </div>

      <!-- 2. LUXURY CAMPUS CONTEXT COMMAND STRIP -->
      <div class="campus-command-strip mb-4" *ngIf="activeBranch">
        <div class="campus-strip-left">
          <div class="campus-avatar-icon">
            <app-icon name="building" [size]="22" class="text-primary"></app-icon>
          </div>
          <div class="campus-meta">
            <div class="campus-eyebrow">
              <span class="active-dot"></span>
              CURRENTLY CONFIGURING PERMISSIONS FOR:
            </div>
            <div class="campus-title-wrap">
              <h2 class="campus-title">{{ activeBranch.name }}</h2>
              <span class="campus-code-badge">{{ activeBranch.code }}</span>
              <span class="campus-scope-tag">Campus Isolated Policies</span>
            </div>
          </div>
        </div>

        <!-- Super Admin Campus Switcher -->
        <div class="campus-strip-right" *ngIf="isSuperAdmin && branches.length > 0">
          <span class="strip-label">Switch Campus Scope:</span>
          <div class="campus-pill-group">
            <button
              type="button"
              *ngFor="let b of branches"
              class="campus-pill-btn"
              [class.active]="activeBranch.id === b.id"
              (click)="selectCampus(b)"
              [title]="'Configure role capabilities for ' + b.name"
            >
              <span class="pill-dot" *ngIf="activeBranch.id === b.id"></span>
              <span>{{ b.name }}</span>
            </button>
          </div>
        </div>

        <!-- Non-SuperAdmin Institutional Scope Info Panel -->
        <div class="campus-strip-right campus-isolated-badge-wrap" *ngIf="!isSuperAdmin">
          <div class="scope-info-pill">
            <app-icon name="shield" [size]="15" class="text-amber"></app-icon>
            <span class="scope-info-title">Institutional Scope:</span>
            <strong class="scope-info-val">{{ activeBranch.name }}</strong>
          </div>
          <div class="scope-status-pill">
            <span class="pulse-dot"></span>
            <span>Dedicated Campus Administration</span>
          </div>
        </div>
      </div>

      <!-- 3. ROLE SELECTOR STRIP -->
      <div class="role-selector-container mb-4">
        <div class="section-label-bar">
          <div class="section-heading-wrap">
            <app-icon name="users" [size]="16" class="text-primary"></app-icon>
            <span class="section-heading">SELECT INSTITUTIONAL ROLE TO CONFIGURE</span>
          </div>
          <span class="text-xs text-muted font-semibold">{{ roles.length }} Roles available in school registry</span>
        </div>

        <div class="role-cards-grid">
          <button
            type="button"
            *ngFor="let r of roles"
            class="role-card-btn"
            [class.active]="selectedRoleId === r.id"
            (click)="onRoleChange(r.id)"
            [title]="'Select ' + r.name"
          >
            <div class="role-icon-box" [ngClass]="'role-color-' + getRoleColorClass(r.code)">
              <app-icon [name]="getRoleIcon(r.code)" [size]="20"></app-icon>
            </div>
            <div class="role-card-info">
              <span class="role-name">{{ r.name }}</span>
              <div class="role-sub-meta">
                <span class="role-code">{{ r.code }}</span>
                <span class="role-users-tag" *ngIf="r.userCount !== undefined">{{ r.userCount }} users</span>
              </div>
            </div>
            <span class="active-check-badge" *ngIf="selectedRoleId === r.id">
              <app-icon name="check" [size]="12"></app-icon>
            </span>
          </button>
        </div>

        <!-- ACTIVE ROLE INSPECTOR BANNER -->
        <div class="role-inspector-card" [class.is-superadmin]="isSuperAdminRole">
          <div class="inspector-left">
            <div class="inspector-role-badge">
              <div class="inspector-icon-wrap" [ngClass]="'role-color-' + getRoleColorClass(activeRole?.code)">
                <app-icon [name]="getRoleIcon(activeRole?.code)" [size]="20"></app-icon>
              </div>
              <div class="inspector-text-block">
                <div class="inspector-title-row">
                  <strong class="inspector-role-name">{{ activeRole?.name }}</strong>
                  <app-badge [variant]="getRoleBadgeVariant(activeRole?.code)" [label]="activeRole?.code"></app-badge>
                  <span class="system-role-pill" *ngIf="activeRole?.isSystem">SYSTEM CORE</span>
                  <span class="coverage-pill">{{ visibleMenuCount }} of {{ totalModulesCount }} Modules Active ({{ coveragePercentage }}%)</span>
                </div>
                <p class="inspector-desc">{{ activeRole?.description || 'Institutional access role and capabilities.' }}</p>
              </div>
            </div>
            <!-- Progress Bar -->
            <div class="coverage-bar-track">
              <div class="coverage-bar-fill" [style.width.%]="coveragePercentage"></div>
            </div>
          </div>

          <div class="inspector-right" *ngIf="!isSuperAdminRole">
            <span class="preset-label">Quick Presets:</span>
            <div class="preset-buttons">
              <button type="button" class="preset-btn preset-grant" (click)="toggleAllView(true)" [disabled]="isLoading || isSaving">
                <app-icon name="eye" [size]="13"></app-icon>
                <span>Grant All View</span>
              </button>
              <button type="button" class="preset-btn preset-operator" (click)="applyOperatorPreset()" [disabled]="isLoading || isSaving">
                <app-icon name="edit" [size]="13"></app-icon>
                <span>Operator (R/W)</span>
              </button>
              <button type="button" class="preset-btn preset-readonly" (click)="applyReadOnlyPreset()" [disabled]="isLoading || isSaving">
                <app-icon name="book-open" [size]="13"></app-icon>
                <span>Read-Only</span>
              </button>
              <button type="button" class="preset-btn preset-clear" (click)="applyClearPreset()" [disabled]="isLoading || isSaving">
                <app-icon name="trash" [size]="13"></app-icon>
                <span>Clear All</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- SUPER ADMIN ROOT POLICY CALLOUT -->
      <div class="superadmin-callout mb-4" *ngIf="isSuperAdminRole">
        <div class="sa-icon-wrap">
          <app-icon name="shield-check" [size]="26"></app-icon>
        </div>
        <div class="sa-content">
          <h4>👑 Root System Administrator Authority</h4>
          <p>
            The Super Admin role possesses unrestricted root authority across all modules and campuses. 
            Precedence security policies prevent revoking system privileges for this role.
          </p>
        </div>
      </div>

      <!-- 4. KPI METRICS STRIP -->
      <div class="kpi-metric-strip mb-4" *ngIf="!isLoading && !errorMessage">
        <div class="kpi-card">
          <div class="kpi-icon-box kpi-blue">
            <app-icon name="layers" [size]="22"></app-icon>
          </div>
          <div>
            <div class="kpi-value">{{ totalModulesCount }}</div>
            <div class="kpi-label">Registered Screens</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-box kpi-indigo">
            <app-icon name="user-check" [size]="22"></app-icon>
          </div>
          <div>
            <div class="kpi-value">{{ visibleMenuCount }}</div>
            <div class="kpi-label">View Access Granted</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-box kpi-emerald">
            <app-icon name="edit" [size]="22"></app-icon>
          </div>
          <div>
            <div class="kpi-value">{{ modificationCount }}</div>
            <div class="kpi-label">Create / Edit Rights</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-box kpi-amber">
            <app-icon name="lock" [size]="22"></app-icon>
          </div>
          <div>
            <div class="kpi-value">{{ guardedCount }}</div>
            <div class="kpi-label">Guarded Privileges</div>
          </div>
        </div>
      </div>

      <!-- 5. SEARCH & FILTER STRIP -->
      <div class="filter-bar-card mb-4" *ngIf="!isLoading && !errorMessage">
        <div class="search-box">
          <app-icon name="search" [size]="16" class="search-icon-pos"></app-icon>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search modules by name, code or keyword (e.g. Students, Routine, Exam, Fees)..."
          />
          <button type="button" class="search-clear-btn" *ngIf="searchQuery" (click)="searchQuery = ''" title="Clear search">
            ✕
          </button>
        </div>
        <div class="category-chips">
          <button
            type="button"
            class="chip-btn"
            [class.active]="selectedCategory === 'ALL'"
            (click)="selectedCategory = 'ALL'"
          >
            <span>All Modules</span>
            <span class="chip-count">{{ getCategoryCount('ALL') }}</span>
          </button>
          <button
            type="button"
            class="chip-btn"
            [class.active]="selectedCategory === 'STUDENTS'"
            (click)="selectedCategory = 'STUDENTS'"
          >
            <span>Students & Academics</span>
            <span class="chip-count">{{ getCategoryCount('STUDENTS') }}</span>
          </button>
          <button
            type="button"
            class="chip-btn"
            [class.active]="selectedCategory === 'FACULTY'"
            (click)="selectedCategory = 'FACULTY'"
          >
            <span>Faculty & Attendance</span>
            <span class="chip-count">{{ getCategoryCount('FACULTY') }}</span>
          </button>
          <button
            type="button"
            class="chip-btn"
            [class.active]="selectedCategory === 'EXAMS'"
            (click)="selectedCategory = 'EXAMS'"
          >
            <span>Exams & Marks</span>
            <span class="chip-count">{{ getCategoryCount('EXAMS') }}</span>
          </button>
          <button
            type="button"
            class="chip-btn"
            [class.active]="selectedCategory === 'FINANCE'"
            (click)="selectedCategory = 'FINANCE'"
          >
            <span>Finance & Accounts</span>
            <span class="chip-count">{{ getCategoryCount('FINANCE') }}</span>
          </button>
          <button
            type="button"
            class="chip-btn"
            [class.active]="selectedCategory === 'SYSTEM'"
            (click)="selectedCategory = 'SYSTEM'"
          >
            <span>Admin & System</span>
            <span class="chip-count">{{ getCategoryCount('SYSTEM') }}</span>
          </button>
        </div>
      </div>

      <!-- 6. PERMISSION MATRIX TABLE -->
      <div class="card matrix-card">
        <div class="card-header matrix-card-header">
          <div class="card-title">
            <app-icon name="shield-check" [size]="20" class="text-primary"></app-icon>
            <span>Authorization Capability Matrix: <strong class="role-title-highlight">{{ activeRole?.name }}</strong></span>
          </div>
          <div class="matrix-header-meta">
            <span class="meta-pill campus-meta-pill">
              <span class="pill-dot"></span>
              Campus: <strong>{{ activeBranch?.name }}</strong>
            </span>
            <span class="meta-pill">
              {{ filteredMenus.length }} modules displayed
            </span>
          </div>
        </div>

        <div *ngIf="isLoading" class="loading-state">
          <app-icon name="refresh-cw" [size]="32" class="spin text-primary"></app-icon>
          <span>Loading authorization capabilities from PostgreSQL database...</span>
        </div>

        <div *ngIf="errorMessage && !isLoading" class="error-state">
          <app-icon name="lock" [size]="28" class="text-danger"></app-icon>
          <p>{{ errorMessage }}</p>
          <button type="button" class="btn btn-sm btn-outline" (click)="loadRolePermissions()">Try Again</button>
        </div>

        <fieldset *ngIf="!isLoading && !errorMessage" [disabled]="isSaving || isSuperAdminRole" class="matrix-fieldset">
          <div class="app-table-wrapper">
            <table class="app-table matrix-table">
              <thead>
                <tr>
                  <th class="col-screen">Screen / Functional Module</th>
                  <th class="col-code">Code</th>
                  <th class="text-center col-action">
                    <div class="action-header action-view" title="Toggle read/view access">
                      <app-icon name="user-check" [size]="13"></app-icon>
                      <span>View</span>
                    </div>
                  </th>
                  <th class="text-center col-action">
                    <div class="action-header action-create" title="Create records">
                      <app-icon name="plus" [size]="13"></app-icon>
                      <span>Create</span>
                    </div>
                  </th>
                  <th class="text-center col-action">
                    <div class="action-header action-edit" title="Modify existing records">
                      <app-icon name="edit" [size]="13"></app-icon>
                      <span>Edit</span>
                    </div>
                  </th>
                  <th class="text-center col-action">
                    <div class="action-header action-delete" title="Delete records">
                      <app-icon name="trash" [size]="13"></app-icon>
                      <span>Delete</span>
                    </div>
                  </th>
                  <th class="text-center col-action">
                    <div class="action-header action-approve" title="Approve sensitive operations">
                      <app-icon name="check-circle" [size]="13"></app-icon>
                      <span>Approve</span>
                    </div>
                  </th>
                  <th class="text-center col-action">
                    <div class="action-header action-export" title="Export reports and data">
                      <app-icon name="download" [size]="13"></app-icon>
                      <span>Export</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <ng-container *ngFor="let menu of filteredMenus">
                  <!-- Group Header Row -->
                  <tr class="matrix-group-row">
                    <td>
                      <div class="group-title-cell">
                        <div class="group-icon-wrap">
                          <app-icon [name]="menu.icon" [size]="18" class="text-primary"></app-icon>
                        </div>
                        <div class="group-info-wrap">
                          <span class="group-title">{{ menu.name }}</span>
                          <span class="group-count" *ngIf="menu.children?.length">{{ menu.children?.length }} screens</span>
                        </div>
                      </div>
                    </td>
                    <td><code class="code-tag group-code">{{ menu.code }}</code></td>
                    <!-- Group View Toggle -->
                    <td class="text-center">
                      <label class="perm-toggle-wrapper" [title]="'Toggle View for all ' + menu.name + ' screens'">
                        <input
                          type="checkbox"
                          class="perm-toggle-input view-chk group-input"
                          [(ngModel)]="permMap[menu.code].view"
                          [disabled]="isMenuLocked(menu)"
                          (change)="cascadeGroupView(menu)"
                        />
                      </label>
                    </td>
                    <!-- Group Action Toggles -->
                    <td class="text-center" *ngFor="let act of ['create', 'edit', 'delete', 'approve', 'export']">
                      <label class="perm-toggle-wrapper" [title]="'Toggle ' + act + ' for all ' + menu.name + ' screens'">
                        <input
                          type="checkbox"
                          class="perm-toggle-input group-input"
                          [ngClass]="act + '-chk'"
                          [checked]="isGroupActionChecked(menu, act)"
                          (change)="toggleGroupAction(menu, act, $event)"
                          [disabled]="isMenuLocked(menu)"
                        />
                      </label>
                    </td>
                  </tr>

                  <!-- Children Screen Sub-Rows -->
                  <tr *ngFor="let child of menu.children" class="matrix-child-row" [class.row-active]="permMap[child.code]?.view" [class.row-locked]="isMenuLocked(child)">
                    <td>
                      <div class="child-screen-cell">
                        <span class="tree-branch-line">└</span>
                        <div class="screen-icon-wrap" [class.active-screen-icon]="permMap[child.code]?.view">
                          <app-icon [name]="child.icon" [size]="15"></app-icon>
                        </div>
                        <div class="screen-info">
                          <strong class="screen-name">{{ child.name }}</strong>
                          <span class="active-screen-badge" *ngIf="permMap[child.code]?.view && !isMenuLocked(child)">
                            Active
                          </span>
                          <span class="locked-badge" *ngIf="isMenuLocked(child)">
                            <app-icon name="lock" [size]="11"></app-icon> Super Admin Only
                          </span>
                        </div>
                      </div>
                    </td>
                    <td><code class="code-tag">{{ child.code }}</code></td>
                    
                    <!-- View Cell -->
                    <td class="text-center">
                      <label class="perm-toggle-wrapper" [title]="isMenuLocked(child) ? 'Locked for this role' : 'Toggle View access for ' + child.name">
                        <input
                          type="checkbox"
                          class="perm-toggle-input view-chk"
                          [(ngModel)]="permMap[child.code].view"
                          [disabled]="isMenuLocked(child)"
                          (change)="onChildViewChange(menu)"
                        />
                      </label>
                    </td>

                    <!-- Action Cells (Create, Edit, Delete, Approve, Export) -->
                    <td class="text-center" *ngFor="let act of ['create', 'edit', 'delete', 'approve', 'export']">
                      <label
                        class="perm-toggle-wrapper"
                        [class.is-locked]="isMenuLocked(child)"
                        [title]="isMenuLocked(child) ? 'Locked for this role' : (!permMap[child.code]?.view ? 'Click to enable View & ' + act : 'Toggle ' + act)"
                      >
                        <input
                          type="checkbox"
                          class="perm-toggle-input"
                          [ngClass]="act + '-chk'"
                          [class.action-inactive]="!permMap[child.code]?.view"
                          [checked]="isChildActionChecked(child, act)"
                          [disabled]="isMenuLocked(child)"
                          (change)="toggleAction(child, act)"
                        />
                      </label>
                    </td>
                  </tr>
                </ng-container>

                <tr *ngIf="filteredMenus.length === 0">
                  <td colspan="8" class="text-center py-5 text-muted">
                    <app-icon name="info" [size]="20" class="mb-2"></app-icon>
                    <p class="font-semibold">No screens match your search or category filter.</p>
                    <button type="button" class="btn btn-xs btn-outline mt-2" (click)="searchQuery = ''; selectedCategory = 'ALL'">
                      Clear Filters
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </fieldset>
      </div>

      <!-- STICKY FLOATING BOTTOM ACTION DOCK -->
      <div class="floating-save-dock" *ngIf="!isLoading && !errorMessage && !isSuperAdminRole">
        <div class="dock-inner">
          <div class="dock-meta">
            <span class="dock-role-pill">
              <span class="pill-dot"></span>
              Role: <strong>{{ activeRole?.name }}</strong>
            </span>
            <span class="dock-campus-pill">
              Campus: <strong>{{ activeBranch?.name }}</strong>
            </span>
          </div>
          <div class="dock-actions">
            <button type="button" class="btn btn-sm btn-outline btn-dock-reset" (click)="loadRolePermissions()" [disabled]="isLoading || isSaving">
              <app-icon name="refresh-cw" [size]="14"></app-icon>
              <span>Reset</span>
            </button>
            <button
              type="button"
              class="btn btn-sm btn-primary btn-dock-save"
              (click)="openConfirmModal()"
              [disabled]="isLoading || isSaving || isSuperAdminRole"
            >
              <app-icon name="check" [size]="16" *ngIf="!isSaving"></app-icon>
              <span *ngIf="isSaving">Saving...</span>
              <span *ngIf="!isSaving">Save Role Permissions</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 7. CONFIRMATION MODAL -->
    <app-modal [isOpen]="isConfirmOpen" title="Confirm Capability Deployment" (closed)="isConfirmOpen = false">
      <div class="confirm-modal-body">
        <div class="confirm-summary-banner">
          <div class="confirm-role-icon" [ngClass]="'role-color-' + getRoleColorClass(activeRole?.code)">
            <app-icon [name]="getRoleIcon(activeRole?.code)" [size]="24"></app-icon>
          </div>
          <div>
            <div class="confirm-role-title">{{ activeRole?.name }} ({{ activeRole?.code }})</div>
            <div class="confirm-campus-tag">Active Campus: {{ activeBranch?.name }} ({{ activeBranch?.code }})</div>
          </div>
        </div>

        <p class="confirm-note">
          You are about to persist updated menu permissions for <strong>{{ activeRole?.name }}</strong>.
          These rights will immediately govern access for all users assigned to this role in <strong>{{ activeBranch?.name }}</strong>.
        </p>

        <div class="warning-callout">
          <app-icon name="shield-check" [size]="20" class="text-amber"></app-icon>
          <div>
            <strong>Session Synchronization:</strong>
            <p>Active user menus will automatically refresh on their next screen navigation.</p>
          </div>
        </div>
      </div>

      <div class="confirm-actions" footer>
        <button type="button" class="btn btn-outline" (click)="isConfirmOpen = false">Cancel</button>
        <button type="button" class="btn btn-primary" (click)="saveBulkPermissions()" [disabled]="isSaving">
          <app-icon name="check" [size]="16" *ngIf="!isSaving"></app-icon>
          <span>{{ isSaving ? 'Saving...' : 'Confirm & Save Changes' }}</span>
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .page-container {
      padding: 4px 0 32px 0;
    }
    .mb-4 { margin-bottom: 24px; }
    .mt-2 { margin-top: 8px; }
    .text-center { text-align: center; }
    .text-primary { color: #4f46e5; }
    .text-danger { color: #ef4444; }
    .text-amber { color: #d97706; }
    .text-muted { color: #64748b; }
    .text-xs { font-size: 0.75rem; }
    .font-semibold { font-weight: 600; }
    .py-5 { padding-top: 36px; padding-bottom: 36px; }
    .flex { display: flex; }
    .items-center { align-items: center; }
    .gap-3 { gap: 12px; }

    /* 1. Page Header Card */
    .page-header-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 20px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
      flex-wrap: wrap;
    }
    .header-left-col {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .header-icon-box {
      width: 54px;
      height: 54px;
      border-radius: 14px;
      background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
      border: 1.5px solid #c7d2fe;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.12);
    }
    .header-text-block {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .header-eyebrow {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.6875rem;
      font-weight: 800;
      color: #64748b;
      letter-spacing: 0.06em;
    }
    .eyebrow-pill {
      background: #f1f5f9;
      color: #334155;
      padding: 2px 7px;
      border-radius: 5px;
      font-size: 0.65rem;
      border: 1px solid #e2e8f0;
    }
    .page-title {
      font-size: 1.35rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      line-height: 1.2;
    }
    .page-subtitle {
      font-size: 0.8125rem;
      color: #64748b;
      margin: 0;
      line-height: 1.4;
    }
    .header-right-col {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .btn-reset {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 9px 16px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.8125rem;
    }
    .btn-save-matrix {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 20px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.875rem;
      background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
      border: none;
      color: #ffffff;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-save-matrix:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(79, 70, 229, 0.35);
    }
    .btn-save-matrix:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
    }

    /* 2. Luxury Campus Command Strip */
    .campus-command-strip {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 14px 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.02);
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
      border: 1.5px solid #c7d2fe;
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
      display: inline-block;
    }

    /* Dedicated Non-SuperAdmin Scope Info Panel */
    .campus-isolated-badge-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .scope-info-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.775rem;
      color: #92400e;
    }
    .scope-info-title {
      font-weight: 600;
    }
    .scope-info-val {
      font-weight: 800;
      color: #78350f;
    }
    .scope-status-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 700;
      color: #065f46;
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
      display: inline-block;
    }

    /* 3. Role Selector Strip */
    .role-selector-container {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 18px 22px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.02);
    }
    .section-label-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }
    .section-heading-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-heading {
      font-size: 0.725rem;
      font-weight: 800;
      color: #475569;
      letter-spacing: 0.06em;
    }
    .role-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }
    .role-card-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      text-align: left;
      position: relative;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .role-card-btn:hover {
      border-color: #cbd5e1;
      background: #f8fafc;
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }
    .role-card-btn.active {
      border-color: #4f46e5;
      background: #f5f7ff;
      box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2), 0 4px 12px rgba(79, 70, 229, 0.08);
    }
    .role-icon-box {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .role-color-purple { background: #ede9fe; color: #7c3aed; }
    .role-color-indigo { background: #e0e7ff; color: #4338ca; }
    .role-color-emerald { background: #d1fae5; color: #059669; }
    .role-color-blue { background: #dbeafe; color: #2563eb; }
    .role-color-amber { background: #fef3c7; color: #d97706; }
    .role-color-rose { background: #ffe4e6; color: #e11d48; }

    .role-card-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;
      gap: 2px;
    }
    .role-name {
      font-size: 0.85rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.25;
      word-break: break-word;
    }
    .role-sub-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 2px;
    }
    .role-code {
      font-size: 0.65rem;
      font-family: monospace;
      color: #64748b;
      font-weight: 700;
    }
    .role-users-tag {
      font-size: 0.65rem;
      background: #e2e8f0;
      color: #475569;
      padding: 1px 5px;
      border-radius: 4px;
      font-weight: 700;
    }
    .active-check-badge {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 17px;
      height: 17px;
      border-radius: 50%;
      background: #4f46e5;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3);
    }

    /* Active Role Inspector */
    .role-inspector-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .role-inspector-card.is-superadmin {
      background: #faf5ff;
      border-color: #e9d5ff;
    }
    .inspector-left {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
      min-width: 280px;
    }
    .inspector-role-badge {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .inspector-icon-wrap {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .inspector-text-block {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .inspector-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .inspector-role-name {
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
    }
    .system-role-pill {
      font-size: 0.65rem;
      font-weight: 700;
      background: #e2e8f0;
      color: #334155;
      padding: 1px 6px;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
    }
    .coverage-pill {
      font-size: 0.72rem;
      font-weight: 700;
      color: #4f46e5;
      background: #eef2ff;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid #c7d2fe;
    }
    .inspector-desc {
      font-size: 0.8125rem;
      color: #64748b;
      margin: 0;
    }
    .coverage-bar-track {
      width: 100%;
      height: 6px;
      background: #e2e8f0;
      border-radius: 9999px;
      overflow: hidden;
    }
    .coverage-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #4f46e5 0%, #10b981 100%);
      border-radius: 9999px;
      transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .inspector-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
    }
    .preset-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .preset-buttons {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .preset-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.775rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #334155;
    }
    .preset-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 2px 5px rgba(0,0,0,0.06);
    }
    .preset-grant:hover { background: #eef2ff; border-color: #a5b4fc; color: #4338ca; }
    .preset-operator:hover { background: #ecfdf5; border-color: #6ee7b7; color: #047857; }
    .preset-readonly:hover { background: #f0f9ff; border-color: #7dd3fc; color: #0369a1; }
    .preset-clear:hover { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }

    /* Super Admin Callout */
    .superadmin-callout {
      background: #faf5ff;
      border: 1px solid #d8b4fe;
      border-left: 4px solid #9333ea;
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      gap: 16px;
      align-items: center;
    }
    .sa-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #f3e8ff;
      color: #9333ea;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .sa-content h4 {
      font-size: 0.95rem;
      font-weight: 800;
      color: #581c87;
      margin: 0 0 4px 0;
    }
    .sa-content p {
      font-size: 0.8125rem;
      color: #7e22ce;
      margin: 0;
      line-height: 1.4;
    }

    /* 4. KPI Metrics Strip */
    .kpi-metric-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
    }
    @media (max-width: 900px) {
      .kpi-metric-strip { grid-template-columns: repeat(2, 1fr); }
    }
    .kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
      transition: all 0.2s ease;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      border-color: #cbd5e1;
    }
    .kpi-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .kpi-blue { background: #e0f2fe; color: #0284c7; }
    .kpi-indigo { background: #e0e7ff; color: #4338ca; }
    .kpi-emerald { background: #d1fae5; color: #059669; }
    .kpi-amber { background: #fef3c7; color: #d97706; }
    .kpi-value {
      font-size: 1.45rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.1;
    }
    .kpi-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      margin-top: 3px;
    }

    /* 5. Filter Bar */
    .filter-bar-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .search-box {
      flex: 1;
      min-width: 260px;
      position: relative;
    }
    .search-box input {
      width: 100%;
      padding: 9px 36px 9px 36px;
      border-radius: 8px;
      border: 1.5px solid #cbd5e1;
      font-size: 0.8125rem;
      outline: none;
      transition: all 0.2s ease;
      background: #f8fafc;
    }
    .search-box input:focus {
      background: #ffffff;
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
    }
    .search-icon-pos {
      position: absolute;
      left: 11px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }
    .search-clear-btn {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      border: none;
      background: #e2e8f0;
      color: #475569;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.7rem;
    }
    .category-chips {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .chip-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 13px;
      border-radius: 9999px;
      font-size: 0.775rem;
      font-weight: 700;
      color: #475569;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .chip-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .chip-btn.active {
      background: #0f172a;
      color: #ffffff;
      border-color: #0f172a;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.2);
    }
    .chip-count {
      font-size: 0.65rem;
      padding: 1px 6px;
      border-radius: 9999px;
      background: rgba(0, 0, 0, 0.08);
      color: inherit;
      font-weight: 800;
    }
    .chip-btn.active .chip-count {
      background: rgba(255, 255, 255, 0.25);
      color: #ffffff;
    }

    /* 6. Matrix Table & Checkbox Controls */
    .matrix-card {
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      background: #ffffff;
    }
    .matrix-card-header {
      padding: 16px 22px;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .role-title-highlight {
      color: #4f46e5;
    }
    .matrix-header-meta {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .meta-pill {
      font-size: 0.75rem;
      color: #64748b;
      background: #f1f5f9;
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    .campus-meta-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #0f172a;
    }
    .matrix-fieldset {
      border: 0;
      padding: 0;
      margin: 0;
      min-width: 0;
    }
    .matrix-table {
      width: 100%;
      border-collapse: collapse;
    }
    .matrix-table th {
      background: #f8fafc;
      padding: 14px 16px;
      font-size: 0.75rem;
      font-weight: 800;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 2px solid #cbd5e1;
    }
    .col-screen { width: 33%; }
    .col-code { width: 13%; }
    .col-action { width: 9%; }

    .action-header {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 0.72rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }
    .action-view { color: #4338ca; background: #e0e7ff; border: 1px solid #c7d2fe; }
    .action-create { color: #047857; background: #d1fae5; border: 1px solid #a7f3d0; }
    .action-edit { color: #0369a1; background: #e0f2fe; border: 1px solid #bae6fd; }
    .action-delete { color: #b91c1c; background: #fee2e2; border: 1px solid #fecaca; }
    .action-approve { color: #b45309; background: #fef3c7; border: 1px solid #fde68a; }
    .action-export { color: #6d28d9; background: #ede9fe; border: 1px solid #ddd6fe; }

    /* Group Row */
    .matrix-group-row {
      background: #f8fafc;
      border-top: 2px solid #cbd5e1;
      border-bottom: 1.5px solid #cbd5e1;
    }
    .group-title-cell {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
    }
    .group-icon-wrap {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .group-info-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .group-title {
      font-size: 0.925rem;
      font-weight: 800;
      color: #0f172a;
    }
    .group-count {
      font-size: 0.6875rem;
      font-weight: 700;
      color: #475569;
      background: #e2e8f0;
      padding: 2px 7px;
      border-radius: 9999px;
    }
    .group-code {
      font-weight: 800;
      color: #1e293b;
      background: #e2e8f0;
      border: 1px solid #cbd5e1;
    }

    /* Child Rows */
    .matrix-child-row {
      border-bottom: 1px solid #f1f5f9;
      transition: all 0.15s ease;
      background: #ffffff;
    }
    .matrix-child-row:hover {
      background: #f8fafc;
    }
    .matrix-child-row.row-active {
      background: #f8faff;
      border-left: 3px solid #4f46e5;
    }
    .matrix-child-row.row-active:hover {
      background: #f1f5ff;
    }
    .matrix-child-row.row-locked {
      background: #fafbfc;
      opacity: 0.85;
    }
    .child-screen-cell {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-left: 22px;
      padding-top: 8px;
      padding-bottom: 8px;
    }
    .tree-branch-line {
      color: #cbd5e1;
      font-size: 1.1rem;
      font-weight: bold;
      line-height: 1;
    }
    .screen-icon-wrap {
      width: 28px;
      height: 28px;
      border-radius: 7px;
      background: #f1f5f9;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.15s ease;
    }
    .screen-icon-wrap.active-screen-icon {
      background: #e0e7ff;
      color: #4338ca;
    }
    .screen-info {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .screen-name {
      font-size: 0.835rem;
      color: #0f172a;
      font-weight: 700;
    }
    .active-screen-badge {
      font-size: 0.65rem;
      font-weight: 800;
      color: #059669;
      background: #d1fae5;
      padding: 1px 6px;
      border-radius: 4px;
      border: 1px solid #a7f3d0;
    }
    .locked-badge {
      font-size: 0.65rem;
      font-weight: 700;
      color: #9333ea;
      background: #f3e8ff;
      padding: 2px 7px;
      border-radius: 4px;
      border: 1px solid #e9d5ff;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .code-tag {
      font-size: 0.72rem;
      background: #f1f5f9;
      padding: 3px 7px;
      border-radius: 5px;
      color: #475569;
      font-family: monospace;
      border: 1px solid #e2e8f0;
      font-weight: 600;
    }

    /* Modern Tactical Checkbox Controls (Fixing Invisibility & UX) */
    .perm-toggle-wrapper {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      user-select: none;
      padding: 4px;
    }
    .perm-toggle-input {
      appearance: none;
      -webkit-appearance: none;
      width: 22px;
      height: 22px;
      border: 2px solid #94a3b8;
      border-radius: 6px;
      background: #ffffff;
      cursor: pointer;
      transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
      outline: none;
      position: relative;
      margin: 0;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    .perm-toggle-input:hover:not(:disabled) {
      border-color: #4f46e5;
      transform: scale(1.1);
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
    }
    .perm-toggle-input:checked {
      background-color: var(--chk-color, #4f46e5);
      border-color: var(--chk-color, #4f46e5);
      background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='none' stroke='white' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3e%3cpolyline points='3.5 8.5 6.5 11.5 12.5 5.5'/%3e%3c/svg%3e");
      background-size: 85% 85%;
      background-position: center;
      background-repeat: no-repeat;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }
    .perm-toggle-input.view-chk:checked { --chk-color: #4f46e5; }
    .perm-toggle-input.create-chk:checked { --chk-color: #10b981; }
    .perm-toggle-input.edit-chk:checked { --chk-color: #0284c7; }
    .perm-toggle-input.delete-chk:checked { --chk-color: #ef4444; }
    .perm-toggle-input.approve-chk:checked { --chk-color: #f59e0b; }
    .perm-toggle-input.export-chk:checked { --chk-color: #8b5cf6; }

    /* Action Inactive State (when View is off) - Crisp, Solid, High Visibility & Clickable */
    .perm-toggle-input.action-inactive {
      border: 1.5px solid #94a3b8;
      background: #ffffff;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }
    .perm-toggle-input.action-inactive:hover {
      border: 2px solid #6366f1;
      background: #eef2ff;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.16);
      transform: scale(1.1);
    }

    /* Locked state (for Super Admin only menus) */
    .perm-toggle-input:disabled {
      border: 1.5px solid #e2e8f0;
      background-color: #f1f5f9;
      cursor: not-allowed;
      background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='%2394a3b8' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M4 7V4a4 4 0 018 0v3h1a1 1 0 011 1v6a1 1 0 01-1 1H2a1 1 0 01-1-1V8a1 1 0 011-1h2zm2-3a2 2 0 114 0v3H6V4z'/%3e%3c/svg%3e");
      background-size: 55% 55%;
      background-position: center;
      background-repeat: no-repeat;
      opacity: 0.65;
    }

    .group-input {
      width: 20px;
      height: 20px;
    }

    /* Floating Save Dock */
    .floating-save-dock {
      position: sticky;
      bottom: 16px;
      z-index: 40;
      margin-top: 24px;
      padding: 0 4px;
    }
    .dock-inner {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      border: 1px solid #cbd5e1;
      border-radius: 14px;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08);
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .dock-meta {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .dock-role-pill, .dock-campus-pill {
      font-size: 0.82rem;
      color: #475569;
      background: #f1f5f9;
      padding: 5px 12px;
      border-radius: 9999px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
    }
    .dock-role-pill strong, .dock-campus-pill strong {
      color: #0f172a;
    }
    .dock-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn-dock-reset {
      border: 1.5px solid #cbd5e1;
      font-weight: 600;
      color: #475569;
      background: #ffffff;
      padding: 7px 16px;
      border-radius: 8px;
    }
    .btn-dock-reset:hover {
      background: #f8fafc;
      border-color: #94a3b8;
    }
    .btn-dock-save {
      background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
      color: #ffffff;
      font-weight: 600;
      padding: 8px 20px;
      border-radius: 8px;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-dock-save:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(79, 70, 229, 0.35);
    }

    /* States */
    .loading-state, .error-state {
      padding: 56px 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 14px;
      color: #64748b;
    }
    .spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Confirmation Modal */
    .confirm-modal-body {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .confirm-summary-banner {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 18px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
    }
    .confirm-role-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .confirm-role-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
    }
    .confirm-campus-tag {
      font-size: 0.775rem;
      color: #64748b;
      margin-top: 2px;
    }
    .confirm-note {
      font-size: 0.875rem;
      color: #334155;
      line-height: 1.5;
      margin: 0;
    }
    .warning-callout {
      display: flex;
      gap: 12px;
      padding: 12px 16px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 10px;
      font-size: 0.775rem;
      color: #92400e;
    }
    .warning-callout p {
      margin: 2px 0 0 0;
    }
    .confirm-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      width: 100%;
    }
  `]
})
export class RolePermissionsComponent implements OnInit, OnDestroy {
  private db = inject(AdminStoreService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  branches: Branch[] = [];
  activeBranch: Branch | null = null;
  selectedBranchId = '';
  isSuperAdmin = false;

  roles: Role[] = [];
  selectedRoleId = 'role-teacher';

  menus: MenuItem[] = [];
  permMap: { [menuCode: string]: RolePermission } = {};
  isConfirmOpen = false;

  // Search & Filtering
  searchQuery = '';
  selectedCategory = 'ALL';

  get activeRole(): Role | undefined {
    return this.roles.find(r => r.id === this.selectedRoleId);
  }

  isLoading = true;
  isSaving = false;
  errorMessage = '';
  private loadGeneration = 0;

  get isSuperAdminRole() {
    return this.activeRole?.code === 'SUPER_ADMIN' && this.activeRole.isSystem;
  }

  get totalModulesCount(): number {
    return this.flattenMenus().filter(menu => menu.type === 'Page').length;
  }

  get visibleMenuCount(): number {
    return this.flattenMenus().filter(menu => menu.type === 'Page' && this.permMap[menu.code]?.view).length;
  }

  get modificationCount(): number {
    return this.flattenMenus().filter(menu => menu.type === 'Page' && (this.permMap[menu.code]?.create || this.permMap[menu.code]?.edit)).length;
  }

  get guardedCount(): number {
    return this.flattenMenus().filter(menu => menu.type === 'Page' && (this.permMap[menu.code]?.delete || this.permMap[menu.code]?.approve)).length;
  }

  get coveragePercentage(): number {
    const total = this.totalModulesCount;
    if (total === 0) return 0;
    return Math.round((this.visibleMenuCount / total) * 100);
  }

  getCategoryCount(cat: string): number {
    if (cat === 'ALL') return this.flattenMenus().filter(m => m.type === 'Page').length;
    return this.flattenMenus().filter(m => {
      if (m.type !== 'Page') return false;
      const c = m.code.toUpperCase();
      if (cat === 'STUDENTS') return c.includes('STU') || c.includes('ACAD');
      if (cat === 'FACULTY') return c.includes('TEACH') || c.includes('ATTEND');
      if (cat === 'EXAMS') return c.includes('EXAM');
      if (cat === 'FINANCE') return c.includes('FIN');
      if (cat === 'SYSTEM') return c.includes('ADMIN') || c.includes('SEC') || c.includes('COMM');
      return true;
    }).length;
  }

  get filteredMenus(): MenuItem[] {
    let list = this.menus;

    if (this.selectedCategory !== 'ALL') {
      list = list.filter(m => {
        const c = m.code.toUpperCase();
        if (this.selectedCategory === 'STUDENTS') return c.includes('STU') || c.includes('ACAD');
        if (this.selectedCategory === 'FACULTY') return c.includes('TEACH') || c.includes('ATTEND');
        if (this.selectedCategory === 'EXAMS') return c.includes('EXAM');
        if (this.selectedCategory === 'FINANCE') return c.includes('FIN');
        if (this.selectedCategory === 'SYSTEM') return c.includes('ADMIN') || c.includes('SEC') || c.includes('COMM');
        return true;
      });
    }

    if (!this.searchQuery.trim()) {
      return list;
    }

    const q = this.searchQuery.toLowerCase().trim();
    return list.map(group => {
      const groupMatches = group.name.toLowerCase().includes(q) || group.code.toLowerCase().includes(q);
      const matchingChildren = (group.children || []).filter(c =>
        c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
      );
      if (groupMatches || matchingChildren.length > 0) {
        return {
          ...group,
          children: groupMatches ? group.children : matchingChildren
        };
      }
      return null;
    }).filter(Boolean) as MenuItem[];
  }

  private flattenMenus(items = this.menus): MenuItem[] {
    return items.flatMap(menu => [menu, ...this.flattenMenus(menu.children || [])]);
  }

  async ngOnInit() {
    this.isSuperAdmin = this.db.isSuperAdmin();

    this.db.getBranches$().pipe(takeUntil(this.destroy$)).subscribe(b => {
      this.branches = b;
      this.cdr.markForCheck();
    });

    this.db.getSelectedBranch$().pipe(takeUntil(this.destroy$)).subscribe(branch => {
      this.activeBranch = branch;
      this.selectedBranchId = branch ? branch.id : '';
      this.cdr.markForCheck();
    });

    this.branches = this.db.getBranches();
    this.selectedBranchId = this.db.getActiveBranchId();
    this.activeBranch = this.branches.find(b => b.id === this.selectedBranchId) || null;

    try {
      const [roles] = await Promise.all([firstValueFrom(this.db.fetchRoles()), this.db.refreshAuthorizedMenus()]);
      this.roles = roles.data;
      this.menus = this.db.getMenus();
      if (!this.roles.some(role => role.id === this.selectedRoleId)) {
        this.selectedRoleId = this.roles.find(role => role.code !== 'SUPER_ADMIN')?.id || this.roles[0]?.id || '';
      }
      await this.loadRolePermissions();
    } catch {
      this.errorMessage = 'Could not load roles and menus. Please try again.';
      this.isLoading = false;
      this.cdr.markForCheck();
    }
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
      this.selectedBranchId = branch.id;
      await this.loadRolePermissions();
    } catch {
      this.toast.error('Error', 'Failed to switch campus.');
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  onRoleChange(roleId: string) {
    if (this.selectedRoleId === roleId) return;
    this.selectedRoleId = roleId;
    this.isConfirmOpen = false;
    void this.loadRolePermissions();
  }

  isMenuLocked(menu: MenuItem): boolean {
    if (this.isSuperAdminRole) return false;
    const isPrincipalTarget = this.activeRole?.code === 'PRINCIPAL' || (this.activeRole?.name || '').includes('Principal');
    if (isPrincipalTarget) {
      return ['ADMIN_SCHOOL', 'ADMIN_BACKUP', 'ADMIN_DEPLOYMENT', 'SEC_MENUS', 'SEC_AUDIT'].includes(menu.code);
    }
    const isCampusAdminMenu = ['SECURITY', 'SEC_USERS', 'SEC_USER_OVERRIDES', 'SEC_ROLES'].includes(menu.code);
    return isCampusAdminMenu || !!menu.superAdminOnly;
  }

  getRoleIcon(roleCode?: string): string {
    const code = (roleCode || '').toUpperCase();
    if (code === 'SUPER_ADMIN') return 'shield-check';
    if (code === 'PRINCIPAL') return 'award';
    if (code === 'TEACHER') return 'graduation-cap';
    if (code === 'STUDENT') return 'book-open';
    if (code === 'ACCOUNTANT') return 'credit-card';
    if (code === 'GUARDIAN') return 'users';
    return 'user-check';
  }

  getRoleColorClass(roleCode?: string): string {
    const code = (roleCode || '').toUpperCase();
    if (code === 'SUPER_ADMIN') return 'purple';
    if (code === 'PRINCIPAL') return 'amber';
    if (code === 'TEACHER') return 'indigo';
    if (code === 'STUDENT') return 'blue';
    if (code === 'ACCOUNTANT') return 'emerald';
    if (code === 'GUARDIAN') return 'rose';
    return 'indigo';
  }

  getRoleBadgeVariant(roleCode?: string): 'purple' | 'info' | 'success' | 'warning' | 'danger' | 'neutral' {
    const code = (roleCode || '').toUpperCase();
    if (code === 'SUPER_ADMIN') return 'purple';
    if (code === 'PRINCIPAL') return 'warning';
    if (code === 'TEACHER') return 'info';
    if (code === 'STUDENT') return 'info';
    if (code === 'ACCOUNTANT') return 'success';
    if (code === 'GUARDIAN') return 'warning';
    return 'neutral';
  }

  async loadRolePermissions() {
    const generation = ++this.loadGeneration;
    const roleId = this.selectedRoleId;
    this.isLoading = true;
    this.errorMessage = '';
    this.permMap = {};
    try {
      if (!roleId) throw new Error('Select a role first.');
      const existing = this.isSuperAdminRole ? [] : (await firstValueFrom(this.db.fetchRolePermissions(roleId))).data;
      if (generation !== this.loadGeneration || roleId !== this.selectedRoleId) return;
      const existingMap = new Map(existing.map(permission => [permission.menuCode, permission]));
      for (const menu of this.flattenMenus()) {
        const saved = existingMap.get(menu.code);
        const full = !!this.isSuperAdminRole;
        const view = !this.isMenuLocked(menu) && (full || !!saved?.view);
        const actions = view && menu.type !== 'Group';
        this.permMap[menu.code] = {
          roleId, menuCode: menu.code, view,
          create: actions && (full || !!saved?.create), edit: actions && (full || !!saved?.edit),
          delete: actions && (full || !!saved?.delete), approve: actions && (full || !!saved?.approve),
          export: actions && (full || !!saved?.export)
        };
      }
      this.updateGroupViews();
    } catch (error: any) {
      if (generation === this.loadGeneration) this.errorMessage = error?.error?.errors?.[0] || error?.message || 'Could not load permissions.';
    } finally {
      if (generation === this.loadGeneration) { this.isLoading = false; this.cdr.markForCheck(); }
    }
  }

  private clearActions(permission: RolePermission) {
    permission.create = permission.edit = permission.delete = permission.approve = permission.export = false;
  }

  private updateGroupViews() {
    for (const menu of this.flattenMenus().reverse()) {
      if (menu.type === 'Group') {
        this.permMap[menu.code].view = (menu.children || []).some(child => this.permMap[child.code]?.view);
        this.clearActions(this.permMap[menu.code]);
      }
    }
  }

  cascadeGroupView(menu: MenuItem) {
    const view = this.permMap[menu.code].view;
    for (const item of this.flattenMenus([menu])) {
      if (this.isMenuLocked(item)) continue;
      const permission = this.permMap[item.code];
      permission.view = view;
      if (!view || item.type === 'Group') this.clearActions(permission);
    }
    this.updateGroupViews();
  }

  onChildViewChange(parent: MenuItem) {
    for (const child of parent.children || []) if (!this.permMap[child.code].view) this.clearActions(this.permMap[child.code]);
    this.updateGroupViews();
  }

  toggleAction(child: MenuItem, action: string) {
    if (this.isMenuLocked(child)) return;
    const perm = this.permMap[child.code] as any;
    if (!perm) return;
    if (!perm.view) {
      perm.view = true;
      perm[action] = true;
    } else {
      perm[action] = !perm[action];
    }
    this.updateGroupViews();
    this.cdr.markForCheck();
  }

  toggleAllView(enable: boolean) {
    for (const menu of this.flattenMenus()) {
      if (this.isMenuLocked(menu)) continue;
      const permission = this.permMap[menu.code];
      permission.view = enable;
      if (!enable) this.clearActions(permission);
    }
    this.updateGroupViews();
  }

  toggleGroupAction(group: MenuItem, action: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const checked = input.checked;
    for (const child of group.children || []) {
      if (this.isMenuLocked(child)) continue;
      const perm = this.permMap[child.code] as any;
      if (!perm) continue;
      if (checked) {
        perm.view = true;
        perm[action] = true;
      } else {
        perm[action] = false;
      }
    }
    this.updateGroupViews();
    this.cdr.markForCheck();
  }

  isGroupActionChecked(group: MenuItem, action: string): boolean {
    const children = (group.children || []).filter(c => !this.isMenuLocked(c));
    if (children.length === 0) return false;
    return children.every(c => (this.permMap[c.code] as any)?.[action]);
  }

  isChildActionChecked(child: MenuItem, action: string): boolean {
    return !!(this.permMap[child.code] as any)?.[action];
  }

  applyOperatorPreset() {
    if (this.isSuperAdminRole) return;
    for (const menu of this.flattenMenus()) {
      if (this.isMenuLocked(menu)) continue;
      const perm = this.permMap[menu.code];
      if (!perm) continue;
      perm.view = true;
      if (menu.type !== 'Group') {
        perm.create = true;
        perm.edit = true;
        perm.export = true;
        perm.delete = false;
        perm.approve = false;
      }
    }
    this.updateGroupViews();
    this.toast.info('Preset Applied', `Configured Operator profile (View, Create, Edit, Export) for ${this.activeRole?.name}.`);
    this.cdr.markForCheck();
  }

  applyReadOnlyPreset() {
    if (this.isSuperAdminRole) return;
    for (const menu of this.flattenMenus()) {
      if (this.isMenuLocked(menu)) continue;
      const perm = this.permMap[menu.code];
      if (!perm) continue;
      perm.view = true;
      this.clearActions(perm);
    }
    this.updateGroupViews();
    this.toast.info('Preset Applied', `Configured Read-Only profile for ${this.activeRole?.name}.`);
    this.cdr.markForCheck();
  }

  applyClearPreset() {
    if (this.isSuperAdminRole) return;
    for (const menu of this.flattenMenus()) {
      if (this.isMenuLocked(menu)) continue;
      const perm = this.permMap[menu.code];
      if (!perm) continue;
      perm.view = false;
      this.clearActions(perm);
    }
    this.updateGroupViews();
    this.toast.warning('Permissions Cleared', `All permissions revoked for ${this.activeRole?.name}.`);
    this.cdr.markForCheck();
  }

  openConfirmModal() {
    if (!this.isLoading && !this.isSaving && !this.isSuperAdminRole && !this.errorMessage) this.isConfirmOpen = true;
  }

  async saveBulkPermissions() {
    if (this.isLoading || this.isSaving || this.isSuperAdminRole || this.errorMessage) return;
    this.isSaving = true;
    try {
      const list = Object.values(this.permMap).map(permission => ({ ...permission }));
      const response = await firstValueFrom(this.db.saveRolePermissions(this.selectedRoleId, list));
      if (!response.success) throw new Error(response.errors?.[0] || response.message);
      this.toast.success('Menus Updated', `Saved ${this.activeRole?.name} menus for ${this.activeBranch?.name || 'campus'}.`);
      this.isConfirmOpen = false;
      await this.loadRolePermissions();
    } catch (error: any) {
      this.toast.error('Not saved', error?.error?.errors?.[0] || error?.message || 'Menu permissions could not be saved.');
    } finally {
      this.isSaving = false;
      this.cdr.markForCheck();
    }
  }
}
