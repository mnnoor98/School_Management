import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminStoreService } from '../../core/services/stores/admin-store.service';
import { ToastService } from '../../core/services/toast.service';
import { MenuItem, MenuType } from '../../core/models';
import { ModalComponent } from '../../shared/components/modal.component';
import { BadgeComponent } from '../../shared/components/badge.component';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-menu-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, BadgeComponent, IconComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <app-icon name="menu" [size]="26" class="text-primary"></app-icon>
            Dynamic Menu Management
          </h1>
          <p class="page-subtitle">
            Configure system navigation nodes, hierarchical tree, routes, and active visibility states.
          </p>
        </div>
        <div class="page-actions">
          <button type="button" class="btn btn-primary" (click)="openAddModal()">
            <app-icon name="plus" [size]="16"></app-icon>
            <span>Add Menu Node</span>
          </button>
        </div>
      </div>

      <!-- FILTER & SEARCH BAR -->
      <div class="card mb-4">
        <div class="card-body p-3">
          <div class="search-filter-row">
            <div class="search-box">
              <app-icon name="search" [size]="16" class="search-icon"></app-icon>
              <input
                type="text"
                [(ngModel)]="searchTerm"
                class="form-control form-control-sm"
                placeholder="Search menus by title or code..."
              />
            </div>
            <div class="filter-group">
              <label class="filter-label">Filter Type:</label>
              <select [(ngModel)]="filterType" class="form-select form-select-sm">
                <option value="ALL">All Types</option>
                <option value="Group">Group</option>
                <option value="Page">Page</option>
                <option value="Action">Action</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- MENU TREE TABLE -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <app-icon name="layers" [size]="18"></app-icon>
            <span>Hierarchical Menu Registry</span>
          </div>
          <span class="badge-count">{{ filteredMenus.length }} Nodes</span>
        </div>

        <div class="app-table-wrapper">
          <table class="app-table">
            <thead>
              <tr>
                <th>Display Order</th>
                <th>Menu Name & Icon</th>
                <th>Menu Code</th>
                <th>Type</th>
                <th>Parent Group</th>
                <th>Registered Route</th>
                <th>Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let item of filteredMenus">
                <!-- Parent Row -->
                <tr [class.row-inactive]="!item.isActive">
                  <td>
                    <span class="order-badge">{{ item.displayOrder }}</span>
                  </td>
                  <td>
                    <div class="menu-name-cell">
                      <app-icon [name]="item.icon" [size]="18" class="text-primary"></app-icon>
                      <strong>{{ item.name }}</strong>
                    </div>
                  </td>
                  <td>
                    <code class="code-tag">{{ item.code }}</code>
                  </td>
                  <td>
                    <app-badge [variant]="getTypeBadgeVariant(item.type)" [label]="item.type"></app-badge>
                  </td>
                  <td>
                    <span class="text-muted">{{ item.parentCode || 'Root (Top-Level)' }}</span>
                  </td>
                  <td>
                    <span class="route-text">{{ item.route || '— (Group Container)' }}</span>
                  </td>
                  <td>
                    <app-badge [variant]="item.isActive ? 'success' : 'danger'" [label]="item.isActive ? 'Active' : 'Deactivated'"></app-badge>
                  </td>
                  <td style="text-align: right;">
                    <div class="btn-group-right">
                      <button type="button" class="btn btn-sm btn-outline" (click)="openEditModal(item)">
                        <app-icon name="edit" [size]="14"></app-icon>
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        class="btn btn-sm"
                        [ngClass]="item.isActive ? 'btn-danger' : 'btn-success'"
                        (click)="toggleActive(item)"
                      >
                        {{ item.isActive ? 'Deactivate' : 'Activate' }}
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- Child Rows if any -->
                <tr *ngFor="let child of item.children" class="child-row" [class.row-inactive]="!child.isActive">
                  <td>
                    <span class="child-indent">↳</span>
                    <span class="order-badge">{{ child.displayOrder }}</span>
                  </td>
                  <td>
                    <div class="menu-name-cell pl-4">
                      <app-icon [name]="child.icon" [size]="16" class="text-secondary"></app-icon>
                      <span>{{ child.name }}</span>
                    </div>
                  </td>
                  <td>
                    <code class="code-tag">{{ child.code }}</code>
                  </td>
                  <td>
                    <app-badge [variant]="getTypeBadgeVariant(child.type)" [label]="child.type"></app-badge>
                  </td>
                  <td>
                    <span class="parent-ref">{{ item.name }}</span>
                  </td>
                  <td>
                    <span class="route-text">{{ child.route }}</span>
                  </td>
                  <td>
                    <app-badge [variant]="child.isActive ? 'success' : 'danger'" [label]="child.isActive ? 'Active' : 'Deactivated'"></app-badge>
                  </td>
                  <td style="text-align: right;">
                    <div class="btn-group-right">
                      <button type="button" class="btn btn-sm btn-outline" (click)="openEditModal(child)">
                        <app-icon name="edit" [size]="14"></app-icon>
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        class="btn btn-sm"
                        [ngClass]="child.isActive ? 'btn-danger' : 'btn-success'"
                        (click)="toggleActive(child)"
                      >
                        {{ child.isActive ? 'Deactivate' : 'Activate' }}
                      </button>
                    </div>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ADD / EDIT MENU MODAL -->
    <app-modal
      [(isOpen)]="isModalOpen"
      [title]="isEditing ? 'Edit Dynamic Menu Node' : 'Create Dynamic Menu Node'"
      [subtitle]="'Configure routing code, authorization code, and hierarchy.'"
      [maxWidth]="600"
    >
      <form (ngSubmit)="saveMenuForm()" #menuForm="ngForm">
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Menu Title <span class="required">*</span></label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="currentMenu.name"
              name="name"
              required
              placeholder="e.g. Student Invoices"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Unique Code <span class="required">*</span></label>
            <input
              type="text"
              class="form-control font-mono"
              [(ngModel)]="currentMenu.code"
              name="code"
              [disabled]="isEditing"
              required
              placeholder="e.g. FIN_INVOICES"
            />
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Menu Type <span class="required">*</span></label>
            <select class="form-select" [(ngModel)]="currentMenu.type" name="type" required>
              <option value="Page">Page (Navigable View)</option>
              <option value="Group">Group (Dropdown Container)</option>
              <option value="Action">Action (Button/Capability)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Parent Group (Selector)</label>
            <select class="form-select" [(ngModel)]="currentMenu.parentCode" name="parentCode">
              <option [ngValue]="null">None (Top-Level Root Menu)</option>
              <option *ngFor="let g of groupMenus" [value]="g.code">{{ g.name }} ({{ g.code }})</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">
            Angular Route URL <span class="required" *ngIf="currentMenu.type === 'Page'">*</span>
          </label>
          <input
            type="text"
            class="form-control font-mono"
            [(ngModel)]="currentMenu.route"
            name="route"
            placeholder="/app/finance/invoices"
            [required]="currentMenu.type === 'Page'"
          />
          <small class="form-hint" *ngIf="currentMenu.type === 'Group'">Groups do not require routes.</small>
        </div>

        <div class="grid-3">
          <div class="form-group">
            <label class="form-label">Icon Name</label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="currentMenu.icon"
              name="icon"
              placeholder="e.g. layers, user, book"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Display Order</label>
            <input
              type="number"
              class="form-control"
              [(ngModel)]="currentMenu.displayOrder"
              name="displayOrder"
              min="1"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Permission Code</label>
            <input
              type="text"
              class="form-control font-mono"
              [(ngModel)]="currentMenu.permissionCode"
              name="permissionCode"
              placeholder="CODE_VIEW"
            />
          </div>
        </div>

        <div class="modal-toggles">
          <label class="form-check">
            <input type="checkbox" [(ngModel)]="currentMenu.isActive" name="isActive" />
            <span>Is Active (System enabled)</span>
          </label>
          <label class="form-check">
            <input type="checkbox" [(ngModel)]="currentMenu.isVisible" name="isVisible" />
            <span>Is Visible (Render in Sidebar)</span>
          </label>
        </div>

        <div class="modal-actions-bar">
          <button type="button" class="btn btn-outline" (click)="isModalOpen = false">Cancel</button>
          <button type="submit" class="btn btn-primary" [disabled]="!menuForm.form.valid">
            <span>{{ isEditing ? 'Save Changes' : 'Create Menu Node' }}</span>
          </button>
        </div>
      </form>
    </app-modal>
  `,
  styles: [`
    .mb-4 { margin-bottom: 24px; }
    .text-primary { color: #4f46e5; }
    .text-secondary { color: #64748b; }
    .pl-4 { padding-left: 20px; }
    .font-mono { font-family: monospace; }
    .badge-count {
      background: #eef2ff;
      color: #4f46e5;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 999px;
    }
    .search-filter-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .search-box {
      position: relative;
      flex: 1;
      min-width: 260px;
    }
    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }
    .search-box input {
      padding-left: 36px;
    }
    .filter-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .filter-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #64748b;
    }
    .order-badge {
      display: inline-block;
      width: 24px;
      height: 24px;
      line-height: 24px;
      text-align: center;
      background: #f1f5f9;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      color: #475569;
    }
    .menu-name-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .code-tag {
      font-size: 0.75rem;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      color: #334155;
    }
    .route-text {
      font-family: monospace;
      font-size: 0.8rem;
      color: #64748b;
    }
    .btn-group-right {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
    }
    .child-row {
      background: #fafbfc;
    }
    .child-indent {
      color: #94a3b8;
      margin-right: 6px;
      font-weight: 700;
    }
    .parent-ref {
      font-size: 0.8125rem;
      color: #64748b;
    }
    .row-inactive {
      opacity: 0.55;
      background: #fef2f2 !important;
    }
    .modal-toggles {
      display: flex;
      gap: 24px;
      margin: 16px 0 24px 0;
      padding: 12px;
      background: #f8fafc;
      border-radius: 10px;
    }
    .form-hint {
      display: block;
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 4px;
    }
    .modal-actions-bar {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
    }
  `]
})
export class MenuManagementComponent implements OnInit {
  private db = inject(AdminStoreService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  menus: MenuItem[] = [];
  searchTerm = '';
  filterType = 'ALL';

  isModalOpen = false;
  isEditing = false;

  currentMenu: Partial<MenuItem> = {
    name: '',
    code: '',
    parentCode: null,
    type: 'Page',
    route: '',
    icon: 'layers',
    displayOrder: 1,
    isActive: true,
    isVisible: true
  };

  ngOnInit() {
    this.db.getMenus$().subscribe(list => {
      this.menus = list;
    });
    this.db.loadMenus();
  }

  get groupMenus(): MenuItem[] {
    return this.menus.filter(m => m.type === 'Group');
  }

  get filteredMenus(): MenuItem[] {
    let list = this.menus;
    if (this.filterType !== 'ALL') {
      list = list.filter(m => m.type === this.filterType);
    }
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(
        m => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)
      );
    }
    return list;
  }

  getTypeBadgeVariant(type: MenuType) {
    switch (type) {
      case 'Group': return 'purple';
      case 'Page': return 'info';
      case 'Action': return 'warning';
      default: return 'neutral';
    }
  }

  openAddModal() {
    this.isEditing = false;
    this.currentMenu = {
      name: '',
      code: '',
      parentCode: null,
      type: 'Page',
      route: '',
      icon: 'layers',
      displayOrder: this.menus.length + 1,
      isActive: true,
      isVisible: true
    };
    this.isModalOpen = true;
  }

  openEditModal(item: MenuItem) {
    this.isEditing = true;
    this.currentMenu = { ...item };
    this.isModalOpen = true;
  }

  toggleActive(item: MenuItem) {
    this.db.toggleMenuStatus(item.id);
    this.toast.info('Status Updated', `${item.name} is now ${!item.isActive ? 'Active' : 'Inactive'}`);
    this.cdr.markForCheck();
  }

  saveMenuForm() {
    if (!this.currentMenu.name || !this.currentMenu.code) {
      this.toast.error('Validation Error', 'Name and Code are required.');
      return;
    }

    const res = this.db.saveMenu(this.currentMenu as MenuItem);
    if (res.success) {
      this.toast.success('Success', res.message);
      this.isModalOpen = false;
      this.cdr.markForCheck();
    } else {
      this.toast.error('Error', res.message);
    }
  }
}
