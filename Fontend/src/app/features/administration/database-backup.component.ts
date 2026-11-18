import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminStoreService } from '../../core/services/stores/admin-store.service';
import { ToastService } from '../../core/services/toast.service';
import { DatabaseBackup } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-database-backup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  template: `
    <div class="page-container">
      <!-- PAGE HEADER -->
      <div class="page-header">
        <div>
          <div class="header-badge">
            <span class="pulse-dot"></span>
            PostgreSQL 18.4 Disaster Recovery & Resilience
          </div>
          <h1 class="page-title">
            <app-icon name="database" [size]="28" class="title-icon"></app-icon>
            Database Backup & Disaster Recovery Center
          </h1>
          <p class="page-subtitle">
            Manage automated database snapshots, trigger on-demand PostgreSQL dumps, download backup archives, and execute verified point-in-time database restorations.
          </p>
        </div>
        <div class="page-actions">
          <button type="button" class="btn btn-outline" (click)="refreshBackups()" [disabled]="isLoading">
            <app-icon name="refresh-cw" [size]="16" [class.spinning]="isLoading"></app-icon>
            <span>Refresh Archives</span>
          </button>
          <button type="button" class="btn btn-primary" (click)="takeInstantBackup()" [disabled]="isBackingUp">
            <app-icon name="download-cloud" [size]="16" [class.spinning]="isBackingUp"></app-icon>
            <span>{{ isBackingUp ? 'Exporting Snapshot...' : 'Create Instant Backup' }}</span>
          </button>
        </div>
      </div>

      <!-- KPI METRIC CARDS -->
      <div class="kpi-strip mb-4">
        <div class="kpi-box">
          <div class="kpi-top">
            <span class="kpi-label">Archived Snapshots</span>
            <app-icon name="archive" [size]="16" class="text-indigo"></app-icon>
          </div>
          <span class="kpi-val text-indigo">{{ backups.length }}</span>
          <span class="kpi-sub">Total database restore points</span>
        </div>

        <div class="kpi-box">
          <div class="kpi-top">
            <span class="kpi-label">Latest Snapshot</span>
            <app-icon name="clock" [size]="16" class="text-emerald"></app-icon>
          </div>
          <span class="kpi-val text-emerald" style="font-size: 1.1rem; line-height: 1.6;">
            {{ getLatestBackupTime() }}
          </span>
          <span class="kpi-sub">Most recent recovery point</span>
        </div>

        <div class="kpi-box">
          <div class="kpi-top">
            <span class="kpi-label">Total Storage Used</span>
            <app-icon name="hard-drive" [size]="16" class="text-amber"></app-icon>
          </div>
          <span class="kpi-val text-amber">{{ getTotalStorageFormatted() }}</span>
          <span class="kpi-sub">Consolidated backup directory</span>
        </div>

        <div class="kpi-box">
          <div class="kpi-top">
            <span class="kpi-label">Auto-Scheduler Status</span>
            <app-icon name="calendar" [size]="16" class="text-primary"></app-icon>
          </div>
          <span class="kpi-val text-primary" style="font-size: 1.15rem;">Active • 02:00 AM</span>
          <span class="kpi-sub">Daily automated background task</span>
        </div>
      </div>

      <!-- QUICK TOOLS / TWO COLUMNS -->
      <div class="grid-2col mb-4">
        <!-- Manual Backup Card -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <app-icon name="zap" [size]="18" class="text-indigo"></app-icon>
              <span>On-Demand Snapshot Generator</span>
            </div>
          </div>
          <div class="card-body">
            <p class="section-desc">
              Generate an instant, transaction-consistent PostgreSQL export of all institutional schemas (Academic, Students, Attendance, Examinations, Finance, and System Configuration).
            </p>
            <div class="form-group mb-3">
              <label class="form-label">Backup Scope & Format</label>
              <div class="format-pill-group">
                <label class="format-pill active">
                  <input type="radio" name="format" checked />
                  <span>Full SQL Dump (Plain text .sql with schemas & data)</span>
                </label>
              </div>
            </div>
            <div class="backup-meta-note mb-3">
              <app-icon name="check-circle" [size]="15" class="text-emerald"></app-icon>
              <span>Target: <code>school_management</code> &bull; Host: <code>localhost:5432</code> &bull; User: <code>postgres</code></span>
            </div>
            <button type="button" class="btn btn-primary w-100" (click)="takeInstantBackup()" [disabled]="isBackingUp">
              <app-icon name="download-cloud" [size]="16" [class.spinning]="isBackingUp"></app-icon>
              <span>{{ isBackingUp ? 'Running PostgreSQL pg_dump...' : 'Trigger Immediate Backup Export' }}</span>
            </button>
          </div>
        </div>

        <!-- Automation & Scheduler Guide Card -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <app-icon name="cpu" [size]="18" class="text-emerald"></app-icon>
              <span>Automated Schedule & Control Panel Scripts</span>
            </div>
          </div>
          <div class="card-body">
            <p class="section-desc">
              Automated backups run without human intervention via Windows Task Scheduler. You can also trigger scripts from the terminal or Control Panel:
            </p>
            <div class="script-chips">
              <div class="script-chip">
                <code>menu.bat [Option 7]</code>
                <span>Interactive backup control panel</span>
              </div>
              <div class="script-chip">
                <code>scripts/backup-database.bat</code>
                <span>One-click instant backup</span>
              </div>
              <div class="script-chip">
                <code>scripts/schedule-auto-backup.bat</code>
                <span>Configure Windows auto-scheduler</span>
              </div>
            </div>
            <div class="task-command-box mt-3">
              <span class="cmd-label">Windows Task Scheduler Command:</span>
              <code class="cmd-text">schtasks /create /tn "SchoolManagement_Daily_DbBackup" /tr "...\scripts\backup-database.bat /auto" /sc daily /st 02:00 /f</code>
            </div>
          </div>
        </div>
      </div>

      <!-- BACKUP ARCHIVES TABLE CARD -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <app-icon name="database" [size]="20" class="text-primary"></app-icon>
            <span>Available Recovery Snapshots ({{ filteredBackups.length }})</span>
          </div>
          <div class="search-box">
            <app-icon name="search" [size]="15" class="search-icon"></app-icon>
            <input
              type="text"
              class="form-control form-control-sm search-input"
              placeholder="Search backup archive..."
              [(ngModel)]="searchQuery"
            />
          </div>
        </div>

        <div class="app-table-wrapper">
          <table class="app-table">
            <thead>
              <tr>
                <th style="width: 45px;">#</th>
                <th>Backup File Name</th>
                <th style="width: 120px;">Size</th>
                <th style="width: 190px;">Created Date & Time</th>
                <th style="width: 100px;">Format</th>
                <th style="width: 110px;">Status</th>
                <th style="width: 220px;" class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of filteredBackups; let idx = index">
                <td>
                  <span class="idx-text">{{ idx + 1 }}</span>
                </td>
                <td>
                  <div class="file-cell">
                    <div class="file-icon-wrap">
                      <app-icon name="file-text" [size]="18" class="text-indigo"></app-icon>
                    </div>
                    <div>
                      <div class="file-name">{{ item.fileName }}</div>
                      <div class="file-meta">PostgreSQL Consistent Snapshot</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="size-badge">{{ item.fileSizeFormatted }}</span>
                </td>
                <td>
                  <span class="date-text">{{ formatDate(item.createdAt) }}</span>
                </td>
                <td>
                  <span class="format-badge">{{ item.type }}</span>
                </td>
                <td>
                  <span class="badge badge-success">
                    <app-icon name="check-circle" [size]="12"></app-icon>
                    {{ item.status }}
                  </span>
                </td>
                <td class="text-end">
                  <div class="action-buttons">
                    <button
                      type="button"
                      class="btn-action btn-download"
                      (click)="downloadBackup(item.fileName)"
                      title="Download archive to your computer"
                    >
                      <app-icon name="download" [size]="14"></app-icon>
                      <span>Download</span>
                    </button>
                    <button
                      type="button"
                      class="btn-action btn-restore"
                      (click)="openRestoreModal(item.fileName)"
                      title="Restore database to this snapshot"
                    >
                      <app-icon name="refresh-cw" [size]="14"></app-icon>
                      <span>Restore</span>
                    </button>
                    <button
                      type="button"
                      class="btn-action btn-delete"
                      (click)="deleteBackup(item.fileName)"
                      title="Delete this snapshot archive"
                    >
                      <app-icon name="trash-2" [size]="14"></app-icon>
                    </button>
                  </div>
                </td>
              </tr>

              <tr *ngIf="filteredBackups.length === 0">
                <td colspan="7" class="text-center py-5 text-muted">
                  <app-icon name="database" [size]="36" class="mb-2 text-slate-400"></app-icon>
                  <div class="empty-title">No Backup Snapshots Found</div>
                  <div class="empty-sub">
                    Click "Create Instant Backup" above or run <code>backup-database.bat</code> to create your first archive.
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- RESTORE CONFIRMATION MODAL -->
      <div class="modal-backdrop" *ngIf="isRestoreModalOpen" (click)="closeRestoreModal()">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-danger">
              <app-icon name="alert-triangle" [size]="22" class="text-rose-500"></app-icon>
              <span>Confirm Database Restoration</span>
            </div>
            <button type="button" class="btn-close" (click)="closeRestoreModal()">&times;</button>
          </div>

          <div class="modal-body">
            <div class="alert-box-danger mb-3">
              <strong>CRITICAL WARNING:</strong> Restoring this backup will replace current database records with the snapshot data. Any changes made after this backup was created will be reverted!
            </div>

            <div class="restore-details mb-3">
              <div><strong>Target File:</strong> <code>{{ restoreTargetFile }}</code></div>
              <div><strong>Database:</strong> <code>school_management</code> (PostgreSQL 18.4)</div>
            </div>

            <div class="form-group">
              <label class="form-label">
                To confirm restoration, please type <strong>RESTORE</strong> below:
              </label>
              <input
                type="text"
                class="form-control"
                placeholder="Type RESTORE in uppercase"
                [(ngModel)]="restoreConfirmationInput"
              />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline" (click)="closeRestoreModal()" [disabled]="isRestoring">
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-danger"
              (click)="executeRestore()"
              [disabled]="restoreConfirmationInput !== 'RESTORE' || isRestoring"
            >
              <app-icon name="refresh-cw" [size]="16" [class.spinning]="isRestoring"></app-icon>
              <span>{{ isRestoring ? 'Restoring Database...' : 'Confirm & Restore Now' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px 32px;
      max-width: 1480px;
      margin: 0 auto;
    }

    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.1);
      color: #059669;
      font-size: 0.8rem;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 9999px;
      margin-bottom: 8px;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      gap: 20px;
    }

    .page-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 1.65rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
      margin: 0 0 6px 0;
    }

    .title-icon {
      color: #4f46e5;
    }

    .page-subtitle {
      font-size: 0.95rem;
      color: #64748b;
      margin: 0;
      max-width: 780px;
      line-height: 1.5;
    }

    .page-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 9px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid transparent;
      text-decoration: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.28);
    }
    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(79, 70, 229, 0.38);
    }

    .btn-danger {
      background: #dc2626;
      color: #ffffff;
    }
    .btn-danger:hover:not(:disabled) {
      background: #b91c1c;
    }

    .btn-outline {
      background: #ffffff;
      color: #475569;
      border-color: #cbd5e1;
    }
    .btn-outline:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #94a3b8;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* KPI Strip */
    .kpi-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    @media (max-width: 992px) {
      .kpi-strip {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .kpi-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .kpi-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .kpi-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .kpi-val {
      font-size: 1.6rem;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 4px;
    }

    .kpi-sub {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    /* 2 Col Grid */
    .grid-2col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
    }

    @media (max-width: 992px) {
      .grid-2col {
        grid-template-columns: 1fr;
      }
    }

    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      overflow: hidden;
    }

    .card-header {
      padding: 16px 20px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
    }

    .card-body {
      padding: 20px;
    }

    .section-desc {
      font-size: 0.875rem;
      color: #64748b;
      line-height: 1.5;
      margin-bottom: 16px;
    }

    .format-pill-group {
      display: flex;
      gap: 10px;
    }

    .format-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 0.825rem;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
    }

    .backup-meta-note {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
      color: #475569;
      background: #f1f5f9;
      padding: 8px 12px;
      border-radius: 8px;
    }

    .backup-meta-note code {
      background: #e2e8f0;
      padding: 2px 5px;
      border-radius: 4px;
      font-family: monospace;
      color: #0f172a;
    }

    .script-chips {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .script-chip {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 0.8rem;
    }

    .script-chip code {
      background: #e0e7ff;
      color: #3730a3;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-weight: 700;
    }

    .task-command-box {
      background: #0f172a;
      color: #f8fafc;
      border-radius: 8px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .cmd-label {
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: 600;
      text-transform: uppercase;
    }

    .cmd-text {
      font-family: monospace;
      font-size: 0.775rem;
      color: #38bdf8;
      word-break: break-all;
    }

    /* Table */
    .app-table-wrapper {
      overflow-x: auto;
    }

    .app-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .app-table th {
      background: #f8fafc;
      padding: 12px 16px;
      text-align: left;
      font-weight: 700;
      font-size: 0.785rem;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      border-bottom: 1px solid #e2e8f0;
    }

    .app-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }

    .app-table tr:hover {
      background: #f8fafc;
    }

    .file-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .file-icon-wrap {
      width: 36px;
      height: 36px;
      background: rgba(99, 102, 241, 0.1);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .file-name {
      font-weight: 700;
      color: #0f172a;
      font-family: monospace;
      font-size: 0.85rem;
    }

    .file-meta {
      font-size: 0.75rem;
      color: #64748b;
    }

    .size-badge {
      background: #f1f5f9;
      color: #334155;
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.8rem;
    }

    .format-badge {
      background: #e0e7ff;
      color: #4338ca;
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.75rem;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .badge-success {
      background: rgba(16, 185, 129, 0.12);
      color: #059669;
    }

    .action-buttons {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .btn-action {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 7px;
      font-size: 0.785rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.15s ease;
    }

    .btn-download {
      background: #f1f5f9;
      color: #334155;
      border-color: #e2e8f0;
    }
    .btn-download:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    .btn-restore {
      background: rgba(245, 158, 11, 0.1);
      color: #d97706;
      border-color: rgba(245, 158, 11, 0.2);
    }
    .btn-restore:hover {
      background: #d97706;
      color: #ffffff;
    }

    .btn-delete {
      background: transparent;
      color: #94a3b8;
      padding: 6px 8px;
    }
    .btn-delete:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    /* Search */
    .search-box {
      display: flex;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 2px 10px;
    }

    .search-icon {
      color: #94a3b8;
      margin-right: 6px;
    }

    .search-input {
      border: none;
      background: transparent;
      outline: none;
      font-size: 0.85rem;
      padding: 6px 0;
      width: 220px;
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal-box {
      background: #ffffff;
      border-radius: 16px;
      max-width: 520px;
      width: 100%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      overflow: hidden;
    }

    .modal-header {
      padding: 18px 22px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-title-danger {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.1rem;
      font-weight: 800;
      color: #991b1b;
    }

    .btn-close {
      background: transparent;
      border: none;
      font-size: 1.5rem;
      color: #94a3b8;
      cursor: pointer;
      line-height: 1;
    }

    .modal-body {
      padding: 22px;
    }

    .alert-box-danger {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
      padding: 12px 14px;
      border-radius: 8px;
      font-size: 0.825rem;
      line-height: 1.5;
    }

    .restore-details {
      background: #f8fafc;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.825rem;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .restore-details code {
      font-family: monospace;
      color: #0f172a;
    }

    .modal-footer {
      padding: 14px 22px;
      background: #f8fafc;
      border-top: 1px solid #f1f5f9;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  `]
})
export class DatabaseBackupComponent implements OnInit {
  private adminStore = inject(AdminStoreService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  backups: DatabaseBackup[] = [];
  searchQuery = '';

  isLoading = false;
  isBackingUp = false;
  isRestoring = false;

  // Restore Modal State
  isRestoreModalOpen = false;
  restoreTargetFile = '';
  restoreConfirmationInput = '';

  ngOnInit() {
    this.refreshBackups();
  }

  refreshBackups() {
    this.isLoading = true;
    this.adminStore.getDatabaseBackups$().subscribe({
      next: (data) => {
        this.backups = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  async takeInstantBackup() {
    if (this.isBackingUp) return;
    this.isBackingUp = true;
    this.toast.info('Export In Progress', 'Generating PostgreSQL database snapshot archive...');

    try {
      const created = await this.adminStore.createDatabaseBackup();
      this.toast.success(
        'Database Backup Created',
        `Snapshot '${created.fileName}' (${created.fileSizeFormatted}) successfully generated!`
      );
      this.refreshBackups();
    } catch (err) {
      this.toast.error('Backup Failed', 'Could not create database backup. Check server logs.');
    } finally {
      this.isBackingUp = false;
    }
  }

  downloadBackup(fileName: string) {
    this.adminStore.downloadDatabaseBackup(fileName);
    this.toast.info('Download Initiated', `Downloading '${fileName}' to your computer.`);
  }

  openRestoreModal(fileName: string) {
    this.restoreTargetFile = fileName;
    this.restoreConfirmationInput = '';
    this.isRestoreModalOpen = true;
  }

  closeRestoreModal(force = false) {
    if (this.isRestoring && !force) return;
    this.isRestoreModalOpen = false;
    this.restoreTargetFile = '';
    this.restoreConfirmationInput = '';
    this.cdr.markForCheck();
  }

  async executeRestore() {
    if (this.restoreConfirmationInput !== 'RESTORE' || !this.restoreTargetFile || this.isRestoring) {
      return;
    }

    this.isRestoring = true;
    this.cdr.markForCheck();
    this.toast.warning('Restoration Started', `Applying snapshot '${this.restoreTargetFile}' to PostgreSQL...`);

    try {
      const success = await this.adminStore.restoreDatabaseBackup(this.restoreTargetFile);
      if (success) {
        this.toast.success(
          'Database Restored',
          `Database 'school_management' successfully restored from snapshot '${this.restoreTargetFile}'.`
        );
        this.isRestoring = false;
        this.closeRestoreModal(true);
        this.refreshBackups();
      } else {
        this.toast.error('Restore Error', 'Restoration encountered an issue. Check server logs.');
      }
    } catch {
      this.toast.error('Restore Failed', 'Failed to communicate with restore service.');
    } finally {
      this.isRestoring = false;
      this.cdr.markForCheck();
    }
  }

  async deleteBackup(fileName: string) {
    if (!confirm(`Are you sure you want to delete backup file '${fileName}'? This cannot be undone.`)) {
      return;
    }

    try {
      await this.adminStore.deleteDatabaseBackup(fileName);
      this.toast.success('Backup Deleted', `Archive '${fileName}' has been deleted.`);
      this.refreshBackups();
    } catch {
      this.toast.error('Delete Failed', 'Failed to delete backup file.');
    }
  }

  get filteredBackups(): DatabaseBackup[] {
    if (!this.searchQuery) return this.backups;
    const q = this.searchQuery.toLowerCase();
    return this.backups.filter(b => b.fileName.toLowerCase().includes(q));
  }

  getLatestBackupTime(): string {
    if (this.backups.length === 0) return 'No backups yet';
    const latest = this.backups[0];
    return this.formatDate(latest.createdAt);
  }

  getTotalStorageFormatted(): string {
    if (this.backups.length === 0) return '0 KB';
    const totalBytes = this.backups.reduce((acc, b) => acc + (b.fileSizeBytes || 0), 0);
    if (totalBytes < 1024) return `${totalBytes} B`;
    if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
    return `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }
}
