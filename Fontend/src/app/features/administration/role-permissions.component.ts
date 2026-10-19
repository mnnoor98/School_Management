import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDbService } from '../../core/services/mock-db.service';
import { ToastService } from '../../core/services/toast.service';
import { Role, MenuItem, RolePermission, Branch } from '../../core/models';
import { ModalComponent } from '../../shared/components/modal.component';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-role-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, IconComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <app-icon name="lock" [size]="26" class="text-primary"></app-icon>
            Role Menu Permission Assignment
          </h1>
          <p class="page-subtitle">
            Configure matrix of capabilities (View, Create, Edit, Delete, Approve, Export) assigned to institutional roles.
          </p>
        </div>
        <div class="page-actions">
          <button type="button" class="btn btn-outline" (click)="loadRolePermissions()">
            <app-icon name="history" [size]="16"></app-icon>
            <span>Reset Matrix</span>
          </button>
          <button type="button" class="btn btn-primary" (click)="openConfirmModal()">
            <app-icon name="check" [size]="16"></app-icon>
            <span>Save Role Permissions</span>
          </button>
        </div>
      </div>

      <!-- SELECTION STRIP (School/Branch Scope + Role Selection) -->
      <div class="card mb-4 selection-card">
        <div class="card-body">
          <div class="selection-grid">
            <div class="form-group mb-0">
              <label class="form-label">School / Branch Scope:</label>
              <select class="form-select" [(ngModel)]="selectedBranchId">
                <option *ngFor="let b of branches" [value]="b.id">{{ b.name }} ({{ b.code }})</option>
              </select>
            </div>

            <div class="form-group mb-0">
              <label class="form-label">Target Role <span class="required">*</span>:</label>
              <select class="form-select role-select" [(ngModel)]="selectedRoleId" (change)="loadRolePermissions()">
                <option *ngFor="let r of roles" [value]="r.id">{{ r.name }} ({{ r.code }})</option>
              </select>
            </div>

            <div class="role-summary-box">
              <span class="summary-title">Active Role Status</span>
              <div class="summary-desc">
                <strong>{{ activeRole?.name }}</strong>
                <p>{{ activeRole?.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PERMISSION MATRIX TABLE -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <app-icon name="shield-check" [size]="18"></app-icon>
            <span>Granular Permission Matrix for: {{ activeRole?.name }}</span>
          </div>
          <div class="matrix-quick-actions">
            <button type="button" class="btn btn-sm btn-outline" (click)="toggleAllView(true)">Grant All View</button>
            <button type="button" class="btn btn-sm btn-outline" (click)="toggleAllView(false)">Revoke All View</button>
          </div>
        </div>

        <div class="app-table-wrapper">
          <table class="app-table">
            <thead>
              <tr>
                <th>Menu Module / Screen</th>
                <th>Menu Code</th>
                <th class="text-center">View</th>
                <th class="text-center">Create</th>
                <th class="text-center">Edit</th>
                <th class="text-center">Delete</th>
                <th class="text-center">Approve</th>
                <th class="text-center">Export</th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let menu of menus">
                <!-- Group / Parent Header Row -->
                <tr class="matrix-group-row">
                  <td>
                    <div class="flex items-center gap-2">
                      <app-icon [name]="menu.icon" [size]="18" class="text-primary"></app-icon>
                      <strong class="text-main">{{ menu.name }}</strong>
                    </div>
                  </td>
                  <td><code class="code-tag">{{ menu.code }}</code></td>
                  <td class="text-center">
                    <input
                      type="checkbox"
                      class="perm-checkbox"
                      [(ngModel)]="permMap[menu.code].view"
                      (change)="cascadeGroupView(menu)"
                    />
                  </td>
                  <td class="text-center">
                    <input
                      type="checkbox"
                      class="perm-checkbox"
                      [(ngModel)]="permMap[menu.code].create"
                      [disabled]="menu.type === 'Group'"
                    />
                  </td>
                  <td class="text-center">
                    <input
                      type="checkbox"
                      class="perm-checkbox"
                      [(ngModel)]="permMap[menu.code].edit"
                      [disabled]="menu.type === 'Group'"
                    />
                  </td>
                  <td class="text-center">
                    <input
                      type="checkbox"
                      class="perm-checkbox"
                      [(ngModel)]="permMap[menu.code].delete"
                      [disabled]="menu.type === 'Group'"
                    />
                  </td>
                  <td class="text-center">
                    <input
                      type="checkbox"
                      class="perm-checkbox"
                      [(ngModel)]="permMap[menu.code].approve"
                      [disabled]="menu.type === 'Group'"
                    />
                  </td>
                  <td class="text-center">
                    <input
                      type="checkbox"
                      class="perm-checkbox"
                      [(ngModel)]="permMap[menu.code].export"
                      [disabled]="menu.type === 'Group'"
                    />
                  </td>
                </tr>

                <!-- Nested Children Sub-Rows -->
                <tr *ngFor="let child of menu.children" class="matrix-child-row">
                  <td>
                    <div class="child-cell">
                      <span class="child-bullet">↳</span>
                      <app-icon [name]="child.icon" [size]="16" class="text-muted"></app-icon>
                      <span>{{ child.name }}</span>
                    </div>
                  </td>
                  <td><code class="code-tag">{{ child.code }}</code></td>
                  <td class="text-center">
                    <input
                      type="checkbox"
                      class="perm-checkbox"
                      [(ngModel)]="permMap[child.code].view"
                      (change)="onChildViewChange(menu)"
                    />
                  </td>
                  <td class="text-center">
                    <input
                      type="checkbox"
                      class="perm-checkbox"
                      [(ngModel)]="permMap[child.code].create"
                    />
                  </td>
                  <td class="text-center">
                    <input
                      type="checkbox"
                      class="perm-checkbox"
                      [(ngModel)]="permMap[child.code].edit"
                    />
                  </td>
                  <td class="text-center">
                    <input
                      type="checkbox"
                      class="perm-checkbox"
                      [(ngModel)]="permMap[child.code].delete"
                    />
                  </td>
                  <td class="text-center">
                    <input
                      type="checkbox"
                      class="perm-checkbox"
                      [(ngModel)]="permMap[child.code].approve"
                    />
                  </td>
                  <td class="text-center">
                    <input
                      type="checkbox"
                      class="perm-checkbox"
                      [(ngModel)]="permMap[child.code].export"
                    />
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- CONFIRMATION MODAL -->
    <app-modal
      [(isOpen)]="isConfirmOpen"
      title="Confirm Role Permissions Update"
      subtitle="Verify bulk update before applying to active user sessions."
      [maxWidth]="500"
    >
      <div class="confirm-content">
        <p>
          You are about to modify the security matrix for role:
          <strong>{{ activeRole?.name }}</strong> across branch <strong>{{ selectedBranchId }}</strong>.
        </p>
        <div class="warning-callout">
          <app-icon name="shield-check" [size]="20" class="text-amber"></app-icon>
          <p>
            Changes take immediate effect on navigation guards and backend authorization rules.
          </p>
        </div>
      </div>
      <div class="confirm-actions" footer>
        <button type="button" class="btn btn-outline" (click)="isConfirmOpen = false">Cancel</button>
        <button type="button" class="btn btn-primary" (click)="saveBulkPermissions()">
          Confirm & Save Changes
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .mb-4 { margin-bottom: 24px; }
    .mb-0 { margin-bottom: 0 !important; }
    .text-center { text-align: center; }
    .text-primary { color: #4f46e5; }
    .text-amber { color: #d97706; }
    .selection-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1.5fr;
      gap: 24px;
      align-items: center;
    }
    .role-summary-box {
      background: #f8fafc;
      border: 1px solid var(--border-color);
      padding: 12px 16px;
      border-radius: 10px;
    }
    .summary-title {
      font-size: 0.7rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .summary-desc strong {
      display: block;
      color: #0f172a;
      font-size: 0.9rem;
    }
    .summary-desc p {
      margin: 2px 0 0 0;
      font-size: 0.8rem;
      color: #64748b;
    }
    .matrix-group-row {
      background: #f8fafc;
      font-weight: 600;
    }
    .child-cell {
      padding-left: 24px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .child-bullet {
      color: #94a3b8;
      font-weight: bold;
    }
    .code-tag {
      font-size: 0.75rem;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      color: #475569;
    }
    .perm-checkbox {
      width: 18px;
      height: 18px;
      accent-color: #4f46e5;
      cursor: pointer;
    }
    .perm-checkbox:disabled {
      opacity: 0.2;
      cursor: not-allowed;
    }
    .confirm-content {
      font-size: 0.9rem;
      color: #334155;
      line-height: 1.5;
    }
    .warning-callout {
      margin-top: 16px;
      padding: 12px 16px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 10px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.825rem;
      color: #92400e;
    }
    .confirm-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      width: 100%;
    }
    .matrix-quick-actions {
      display: flex;
      gap: 8px;
    }
  `]
})
export class RolePermissionsComponent implements OnInit {
  private db = inject(MockDbService);
  private toast = inject(ToastService);

  branches: Branch[] = [];
  selectedBranchId = '';

  roles: Role[] = [];
  selectedRoleId = 'role-teacher';

  menus: MenuItem[] = [];
  permMap: { [menuCode: string]: RolePermission } = {};
  isConfirmOpen = false;

  get activeRole(): Role | undefined {
    return this.roles.find(r => r.id === this.selectedRoleId);
  }

  ngOnInit() {
    this.branches = this.db.getBranches();
    this.selectedBranchId = this.branches[0]?.id || '';
    this.roles = this.db.getRoles();
    this.menus = this.db.getMenus();
    this.loadRolePermissions();
  }

  loadRolePermissions() {
    const existing = this.db.getRolePermissions(this.selectedRoleId);
    const existingMap = new Map(existing.map(p => [p.menuCode, p]));

    // Initialize all menus and children
    this.permMap = {};
    const processItem = (item: MenuItem) => {
      const p = existingMap.get(item.code);
      this.permMap[item.code] = {
        roleId: this.selectedRoleId,
        menuCode: item.code,
        view: p ? p.view : false,
        create: p ? p.create : false,
        edit: p ? p.edit : false,
        delete: p ? p.delete : false,
        approve: p ? p.approve : false,
        export: p ? p.export : false
      };
      if (item.children) {
        item.children.forEach(c => processItem(c));
      }
    };

    this.menus.forEach(m => processItem(m));
  }

  cascadeGroupView(menu: MenuItem) {
    const isView = this.permMap[menu.code].view;
    if (menu.children) {
      menu.children.forEach(c => {
        this.permMap[c.code].view = isView;
      });
    }
  }

  onChildViewChange(parent: MenuItem) {
    // If any child is viewed, parent must be viewed (PDF Page 7)
    if (parent.children) {
      const anyChildView = parent.children.some(c => this.permMap[c.code].view);
      if (anyChildView) {
        this.permMap[parent.code].view = true;
      }
    }
  }

  toggleAllView(enable: boolean) {
    Object.keys(this.permMap).forEach(key => {
      this.permMap[key].view = enable;
    });
  }

  openConfirmModal() {
    this.isConfirmOpen = true;
  }

  saveBulkPermissions() {
    const list = Object.values(this.permMap);
    this.db.saveRolePermissions(this.selectedRoleId, list);
    this.toast.success('Matrix Saved', `Updated permissions matrix for ${this.activeRole?.name}`);
    this.isConfirmOpen = false;
  }
}
