import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDbService } from '../../core/services/mock-db.service';
import { AuditLog } from '../../core/models';
import { BadgeComponent } from '../../shared/components/badge.component';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeComponent, IconComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <app-icon name="history" [size]="26" class="text-primary"></app-icon>
            Security & System Audit Trail
          </h1>
          <p class="page-subtitle">
            Immutable tracking of administrative actions, permission overrides, fee postings, and status changes.
          </p>
        </div>
      </div>

      <!-- FILTER BAR -->
      <div class="card mb-4">
        <div class="card-body p-3">
          <div class="filter-row">
            <div class="search-wrap">
              <app-icon name="search" [size]="16" class="search-icon"></app-icon>
              <input
                type="text"
                class="form-control form-control-sm"
                [(ngModel)]="searchTerm"
                placeholder="Search audit trail by user, module, or details..."
              />
            </div>

            <div class="filter-action">
              <label class="filter-lbl">Action Type:</label>
              <select [(ngModel)]="selectedAction" class="form-select form-select-sm">
                <option value="ALL">All Actions</option>
                <option value="Create">Create</option>
                <option value="Update">Update</option>
                <option value="Override">Override</option>
                <option value="Delete">Delete</option>
                <option value="Login">Login</option>
                <option value="Export">Export</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- AUDIT LOG TABLE (PDF Section 13) -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <app-icon name="shield-check" [size]="18"></app-icon>
            <span>Activity Logs (Who • When • Action • Scope • Record)</span>
          </div>
          <span class="count-pill">{{ filteredLogs.length }} Entries</span>
        </div>

        <div class="app-table-wrapper">
          <table class="app-table">
            <thead>
              <tr>
                <th>Timestamp (When)</th>
                <th>Operator (Who)</th>
                <th>Action</th>
                <th>System Module</th>
                <th>Target Record</th>
                <th>Audit Details & Changes</th>
                <th>Scope</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let log of filteredLogs">
                <td>
                  <span class="timestamp-text">{{ log.timestamp }}</span>
                </td>
                <td>
                  <div>
                    <strong>{{ log.userName }}</strong>
                    <div class="text-xs text-muted">{{ log.userRole }}</div>
                  </div>
                </td>
                <td>
                  <app-badge [variant]="getActionVariant(log.action)" [label]="log.action"></app-badge>
                </td>
                <td>
                  <strong>{{ log.module }}</strong>
                </td>
                <td>
                  <code class="code-tag">{{ log.targetRecord }}</code>
                </td>
                <td>
                  <span class="details-text">{{ log.details }}</span>
                </td>
                <td>
                  <span class="scope-tag">{{ log.schoolScope }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mb-4 { margin-bottom: 24px; }
    .text-primary { color: #4f46e5; }
    .text-xs { font-size: 0.75rem; }
    .text-muted { color: #64748b; }
    .count-pill {
      background: #eef2ff;
      color: #4f46e5;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 999px;
    }
    .filter-row {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .search-wrap {
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
    .search-wrap input {
      padding-left: 36px;
    }
    .filter-action {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .filter-lbl {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #64748b;
    }
    .timestamp-text {
      font-family: monospace;
      font-size: 0.785rem;
      color: #475569;
    }
    .code-tag {
      font-size: 0.75rem;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .details-text {
      font-size: 0.825rem;
      color: #334155;
    }
    .scope-tag {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 4px;
    }
  `]
})
export class AuditLogComponent implements OnInit {
  private db = inject(MockDbService);

  logs: AuditLog[] = [];
  searchTerm = '';
  selectedAction = 'ALL';

  ngOnInit() {
    this.logs = this.db.getAuditLogs();
  }

  get filteredLogs(): AuditLog[] {
    let list = this.logs;
    if (this.selectedAction !== 'ALL') {
      list = list.filter(l => l.action === this.selectedAction);
    }
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(
        l =>
          l.userName.toLowerCase().includes(q) ||
          l.module.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q) ||
          l.targetRecord.toLowerCase().includes(q)
      );
    }
    return list;
  }

  getActionVariant(action: AuditLog['action']) {
    switch (action) {
      case 'Create': return 'success';
      case 'Update': return 'info';
      case 'Override': return 'purple';
      case 'Delete': return 'danger';
      case 'Login': return 'neutral';
      case 'Export': return 'warning';
      default: return 'neutral';
    }
  }
}
