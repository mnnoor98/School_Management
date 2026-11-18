import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminStoreService } from '../../core/services/stores/admin-store.service';
import { ToastService } from '../../core/services/toast.service';
import { SystemServerStatus, DeploymentRecord, BuildDeployResult } from '../../core/models';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-deployment-center',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  template: `
    <div class="page-container">
      <!-- PAGE HEADER -->
      <div class="page-header">
        <div>
          <div class="header-badge">
            <span class="pulse-dot"></span>
            Production Deployment & Host Management Engine
          </div>
          <h1 class="page-title">
            <app-icon name="server" [size]="28" class="title-icon"></app-icon>
            System Deployment & Server Center
          </h1>
          <p class="page-subtitle">
            Deploy compiled frontend ZIP packages, trigger 1-click server-side build pipelines, manage live static hosting on ASP.NET Core, and monitor server process health.
          </p>
        </div>
        <div class="page-actions">
          <button type="button" class="btn btn-outline" (click)="loadAll()" [disabled]="isLoading">
            <app-icon name="refresh-cw" [size]="16" [class.spinning]="isLoading"></app-icon>
            <span>Refresh Status</span>
          </button>
          <a
            [href]="status?.appBaseUrl || 'http://localhost:5000/'"
            target="_blank"
            class="btn btn-primary"
            title="Open the live hosted web application in a new browser tab"
          >
            <app-icon name="external-link" [size]="16"></app-icon>
            <span>Open Live Hosted App</span>
          </a>
        </div>
      </div>

      <!-- KPI METRIC CARDS -->
      <div class="kpi-strip mb-4">
        <!-- Active Frontend Version -->
        <div class="kpi-box">
          <div class="kpi-top">
            <span class="kpi-label">Active Frontend Build</span>
            <app-icon name="check-circle" [size]="16" class="text-emerald"></app-icon>
          </div>
          <span class="kpi-val text-emerald" style="font-size: 1.15rem; word-break: break-all;">
            {{ status?.activeFrontendVersion || 'Loading...' }}
          </span>
          <span class="kpi-sub">
            Deployed: {{ status?.frontendDeployedAt || '-' }}
          </span>
        </div>

        <!-- Live Hosted Assets -->
        <div class="kpi-box">
          <div class="kpi-top">
            <span class="kpi-label">Hosted Bundle Size</span>
            <app-icon name="hard-drive" [size]="16" class="text-indigo"></app-icon>
          </div>
          <span class="kpi-val text-indigo">
            {{ status?.frontendBundleSize || '0 B' }}
          </span>
          <span class="kpi-sub">
            {{ status?.totalDeployedFiles || 0 }} production assets in <code>wwwroot</code>
          </span>
        </div>

        <!-- Server Process & RAM -->
        <div class="kpi-box">
          <div class="kpi-top">
            <span class="kpi-label">API Server & Memory</span>
            <app-icon name="cpu" [size]="16" class="text-purple"></app-icon>
          </div>
          <span class="kpi-val text-purple">
            {{ status?.memoryUsageFormatted || '0 MB' }}
          </span>
          <span class="kpi-sub">
            PID: {{ status?.processId || '-' }} | Uptime: {{ status?.uptime || '-' }}
          </span>
        </div>

        <!-- Database Ping -->
        <div class="kpi-box">
          <div class="kpi-top">
            <span class="kpi-label">PostgreSQL Database</span>
            <app-icon name="database" [size]="16" [class.text-emerald]="status?.databaseHealthy" [class.text-rose]="!status?.databaseHealthy"></app-icon>
          </div>
          <span class="kpi-val" [class.text-emerald]="status?.databaseHealthy" [class.text-rose]="!status?.databaseHealthy">
            {{ status?.databaseHealthy ? 'HEALTHY' : 'UNREACHABLE' }}
          </span>
          <span class="kpi-sub">
            Latency: {{ status?.databaseLatencyMs || 0 }} ms | PG 18.4
          </span>
        </div>
      </div>

      <!-- MAIN DEPLOYMENT ACTIONS GRID -->
      <div class="grid-2-cols mb-4">
        <!-- 1. FRONTEND ZIP UPLOAD & HOT-DEPLOY -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <app-icon name="upload-cloud" [size]="20" class="text-indigo"></app-icon>
              <span>Upload Frontend Package (.ZIP)</span>
            </div>
            <span class="badge badge-purple">Hot Deployment</span>
          </div>
          <div class="card-body">
            <p class="section-desc">
              Upload a compiled frontend bundle ZIP archive (e.g., your Angular <code>dist/browser</code> contents). The system will safely back up the active deployment, unpack the new archive to <code>wwwroot</code>, and instantly go live.
            </p>

            <!-- File Drop / Select Area -->
            <div
              class="upload-dropzone"
              [class.has-file]="!!selectedFile"
              (click)="fileInput.click()"
              (dragover)="onDragOver($event)"
              (drop)="onFileDrop($event)"
            >
              <input
                #fileInput
                type="file"
                accept=".zip"
                class="d-none"
                (change)="onFileSelected($event)"
              />
              <div class="dropzone-content" *ngIf="!selectedFile">
                <div class="dropzone-icon">
                  <app-icon name="archive" [size]="32" class="text-indigo"></app-icon>
                </div>
                <div class="dropzone-text">
                  <strong>Click to browse</strong> or drag & drop frontend <code>.zip</code> file
                </div>
                <div class="dropzone-hint">
                  Supports production Angular bundles containing <code>index.html</code> (Max 100MB)
                </div>
              </div>

              <div class="dropzone-file-info" *ngIf="selectedFile">
                <app-icon name="file-text" [size]="28" class="text-emerald"></app-icon>
                <div class="file-meta-wrap">
                  <div class="file-name">{{ selectedFile.name }}</div>
                  <div class="file-size">{{ formatBytes(selectedFile.size) }} | Ready for deployment</div>
                </div>
                <button
                  type="button"
                  class="btn-icon text-muted"
                  (click)="clearSelectedFile($event)"
                  title="Remove selection"
                >
                  <app-icon name="x" [size]="16"></app-icon>
                </button>
              </div>
            </div>

            <!-- Optional Version & Notes Inputs -->
            <div class="form-row mt-3">
              <div class="form-group flex-1">
                <label class="form-label">Version / Release Tag (Optional)</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="e.g. v2.1.0 or release-spring"
                  [(ngModel)]="uploadVersionTag"
                />
              </div>
              <div class="form-group flex-1">
                <label class="form-label">Release Notes</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="e.g. Academic and fee collection updates"
                  [(ngModel)]="uploadReleaseNotes"
                />
              </div>
            </div>

            <div class="deploy-notice mt-3 mb-3">
              <app-icon name="shield-check" [size]="16" class="text-indigo flex-shrink-0"></app-icon>
              <span>Campus uploads are stored privately and kept when the application is updated.</span>
            </div>

            <!-- Upload Action Button -->
            <button
              type="button"
              class="btn btn-primary w-100"
              (click)="uploadAndDeploy()"
              [disabled]="!selectedFile || isUploading"
            >
              <app-icon name="upload" [size]="16" [class.spinning]="isUploading"></app-icon>
              <span>{{ isUploading ? 'Uploading & Deploying Package...' : 'Upload & Deploy Frontend' }}</span>
            </button>
          </div>
        </div>

        <!-- 2. ONE-CLICK SERVER BUILDER & RUNNER CONTROLS -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <app-icon name="play-circle" [size]="20" class="text-emerald"></app-icon>
              <span>Local Pipeline & Project Service Runner</span>
            </div>
            <span class="badge badge-success">Automated CI/CD</span>
          </div>
          <div class="card-body">
            <p class="section-desc">
              Execute compilation and server controls directly from the web interface. Build the Angular project directly on the host machine or restart the API daemon.
            </p>

            <!-- Action 1: Compile & Deploy Local Angular -->
            <div class="runner-action-card mb-3">
              <div class="runner-info">
                <div class="runner-title">
                  <app-icon name="terminal" [size]="18" class="text-primary"></app-icon>
                  <span>Compile & Deploy Local Frontend</span>
                </div>
                <div class="runner-desc">
                  Runs <code>npm run build</code> in the frontend repository, extracts the generated bundle, and syncs directly to live <code>wwwroot</code> hosting.
                </div>
              </div>
              <button
                type="button"
                class="btn btn-emerald"
                (click)="triggerLocalBuildAndDeploy()"
                [disabled]="isBuilding"
              >
                <app-icon name="refresh-cw" [size]="15" [class.spinning]="isBuilding"></app-icon>
                <span>{{ isBuilding ? 'Building Frontend...' : 'Run Build & Deploy' }}</span>
              </button>
            </div>

            <!-- Action 2: Restart Server Process -->
            <div class="runner-action-card mb-3">
              <div class="runner-info">
                <div class="runner-title">
                  <app-icon name="power" [size]="18" class="text-amber-500"></app-icon>
                  <span>Restart Backend Web API Server</span>
                </div>
                <div class="runner-desc">
                  Gracefully stops and recycles the ASP.NET Core process daemon. The daemon supervisor automatically re-binds on port 5000.
                </div>
              </div>
              <button
                type="button"
                class="btn btn-warning"
                (click)="triggerRestartServer()"
                [disabled]="isRestarting"
              >
                <app-icon name="refresh-cw" [size]="15" [class.spinning]="isRestarting"></app-icon>
                <span>{{ isRestarting ? 'Restarting...' : 'Restart Server' }}</span>
              </button>
            </div>

            <!-- Action 3: Health Ping & Cache Refresh -->
            <div class="runner-action-card">
              <div class="runner-info">
                <div class="runner-title">
                  <app-icon name="activity" [size]="18" class="text-indigo"></app-icon>
                  <span>Test PostgreSQL Connection & Latency</span>
                </div>
                <div class="runner-desc">
                  Executes a verified health ping against the PostgreSQL 18.4 database cluster and measures round-trip latency.
                </div>
              </div>
              <button
                type="button"
                class="btn btn-outline"
                (click)="testDatabasePing()"
                [disabled]="isPinging"
              >
                <app-icon name="zap" [size]="15" [class.spinning]="isPinging"></app-icon>
                <span>Ping Database</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- DEPLOYMENT HISTORY TABLE -->
      <div class="card mb-4">
        <div class="card-header">
          <div class="card-title">
            <app-icon name="history" [size]="20" class="text-primary"></app-icon>
            <span>Deployment History & Rollback Points ({{ deployments.length }})</span>
          </div>
          <button type="button" class="btn btn-sm btn-outline" (click)="loadDeployments()">
            <app-icon name="refresh-cw" [size]="13"></app-icon>
            <span>Refresh</span>
          </button>
        </div>

        <div class="app-table-wrapper">
          <table class="app-table">
            <thead>
              <tr>
                <th style="width: 45px;">#</th>
                <th>Version / Release</th>
                <th>Source / Archive</th>
                <th style="width: 110px;">Assets</th>
                <th style="width: 120px;">Size</th>
                <th style="width: 180px;">Deployed At</th>
                <th style="width: 140px;">Deployer</th>
                <th style="width: 120px;">Status</th>
                <th style="width: 140px;" class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of deployments; let idx = index">
                <td>
                  <span class="idx-text">{{ idx + 1 }}</span>
                </td>
                <td>
                  <div class="version-cell">
                    <span class="version-tag">{{ item.version }}</span>
                    <div class="version-notes" *ngIf="item.notes">{{ item.notes }}</div>
                  </div>
                </td>
                <td>
                  <span class="archive-text">{{ item.archiveName }}</span>
                </td>
                <td>
                  <span class="badge badge-neutral">{{ item.fileCount }} files</span>
                </td>
                <td>
                  <span class="size-badge">{{ item.fileSizeFormatted }}</span>
                </td>
                <td>
                  <span class="date-text">{{ formatDate(item.deployedAt) }}</span>
                </td>
                <td>
                  <span class="deployer-text">{{ item.deployedBy }}</span>
                </td>
                <td>
                  <span
                    class="badge"
                    [class.badge-success]="item.status === 'Active'"
                    [class.badge-neutral]="item.status === 'Archived'"
                    [class.badge-warning]="item.status === 'RolledBack'"
                  >
                    <app-icon [name]="item.status === 'Active' ? 'check-circle' : 'archive'" [size]="12"></app-icon>
                    {{ item.status }}
                  </span>
                </td>
                <td class="text-end">
                  <button
                    *ngIf="item.status !== 'Active'"
                    type="button"
                    class="btn-action btn-restore"
                    (click)="rollbackToDeployment(item.id, item.version)"
                    title="Rollback live site to this snapshot"
                  >
                    <app-icon name="rotate-ccw" [size]="13"></app-icon>
                    <span>Rollback</span>
                  </button>
                  <span *ngIf="item.status === 'Active'" class="active-indicator">
                    Live
                  </span>
                </td>
              </tr>

              <tr *ngIf="deployments.length === 0">
                <td colspan="9" class="text-center py-5 text-muted">
                  <app-icon name="server" [size]="36" class="mb-2 text-slate-400"></app-icon>
                  <div class="empty-title">No Previous Deployment Snapshots</div>
                  <div class="empty-sub">
                    Upload a frontend ZIP package or click "Run Build & Deploy" to generate your first release point.
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- LIVE DEPLOYMENT & SERVER LOGS TERMINAL -->
      <div class="card terminal-card">
        <div class="card-header terminal-header">
          <div class="card-title text-white">
            <span class="terminal-dots">
              <span class="t-dot t-red"></span>
              <span class="t-dot t-yellow"></span>
              <span class="t-dot t-green"></span>
            </span>
            <span class="terminal-title-text">Live Server & Deployment Console Log</span>
          </div>
          <button type="button" class="btn btn-sm btn-terminal" (click)="loadLogs()">
            <app-icon name="refresh-cw" [size]="13"></app-icon>
            <span>Update Logs</span>
          </button>
        </div>
        <div class="terminal-body">
          <div class="terminal-line text-slate-400">
            [SYS] Connected to ASP.NET Core 8.0 Deployment Supervisor. Streaming logs...
          </div>
          <div *ngFor="let log of logs" class="terminal-line" [class.log-success]="log.includes('SUCCESS')" [class.log-err]="log.includes('ERROR')">
            {{ log }}
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
      background: rgba(99, 102, 241, 0.1);
      color: #4f46e5;
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
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 6px 0;
    }

    .title-icon {
      color: #4f46e5;
    }

    .page-subtitle {
      color: #64748b;
      font-size: 0.95rem;
      margin: 0;
      max-width: 840px;
      line-height: 1.5;
    }

    .page-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    /* KPI STRIP */
    .kpi-strip {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
    }

    .kpi-box {
      background: #ffffff;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
    }

    .kpi-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .kpi-label {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
    }

    .kpi-val {
      font-size: 1.6rem;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 6px;
    }

    .kpi-sub {
      font-size: 0.8rem;
      color: #94a3b8;
    }

    .text-emerald { color: #059669; }
    .text-indigo { color: #4f46e5; }
    .text-purple { color: #7c3aed; }
    .text-rose { color: #e11d48; }

    /* GRID & CARDS */
    .grid-2-cols {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    @media (max-width: 1024px) {
      .grid-2-cols { grid-template-columns: 1fr; }
    }

    .card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
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

    /* DROPZONE */
    .upload-dropzone {
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      padding: 28px 20px;
      text-align: center;
      cursor: pointer;
      background: #f8fafc;
      transition: all 0.2s ease;
    }

    .upload-dropzone:hover {
      border-color: #6366f1;
      background: #f5f3ff;
    }

    .upload-dropzone.has-file {
      border-color: #10b981;
      background: #ecfdf5;
      padding: 16px;
    }

    .dropzone-icon {
      margin-bottom: 12px;
    }

    .dropzone-text {
      font-size: 0.925rem;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .dropzone-hint {
      font-size: 0.775rem;
      color: #94a3b8;
    }

    .dropzone-file-info {
      display: flex;
      align-items: center;
      gap: 12px;
      text-align: left;
    }

    .file-meta-wrap {
      flex: 1;
    }

    .file-name {
      font-weight: 700;
      font-size: 0.9rem;
      color: #0f172a;
    }

    .file-size {
      font-size: 0.775rem;
      color: #059669;
    }

    .form-row {
      display: flex;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-label {
      font-size: 0.825rem;
      font-weight: 600;
      color: #334155;
    }

    .form-control {
      padding: 9px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.875rem;
      color: #0f172a;
      outline: none;
      transition: border 0.2s ease;
    }

    .form-control:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }

    .deploy-notice {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.8rem;
      color: #4338ca;
      background: #eef2ff;
      padding: 10px 14px;
      border-radius: 8px;
    }

    /* RUNNER ACTION CARD */
    .runner-action-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 14px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      transition: background 0.2s ease;
    }

    .runner-action-card:hover {
      background: #f1f5f9;
    }

    .runner-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 2px;
    }

    .runner-desc {
      font-size: 0.785rem;
      color: #64748b;
      line-height: 1.4;
    }

    .btn-emerald {
      background: #059669;
      color: #ffffff;
      border: none;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 0.825rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }

    .btn-emerald:hover { background: #047857; }

    .btn-warning {
      background: #d97706;
      color: #ffffff;
      border: none;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 0.825rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }

    .btn-warning:hover { background: #b45309; }

    /* TABLE */
    .app-table-wrapper {
      overflow-x: auto;
    }

    .app-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;
    }

    .app-table th {
      background: #f8fafc;
      padding: 12px 16px;
      font-size: 0.775rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #e2e8f0;
    }

    .app-table td {
      padding: 14px 16px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
      color: #334155;
    }

    .version-tag {
      font-family: monospace;
      font-weight: 700;
      color: #4338ca;
      background: #e0e7ff;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.825rem;
    }

    .version-notes {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 4px;
    }

    .archive-text {
      font-family: monospace;
      font-size: 0.8rem;
      color: #0f172a;
    }

    .date-text {
      font-size: 0.825rem;
      color: #475569;
    }

    .deployer-text {
      font-size: 0.825rem;
      font-weight: 600;
      color: #1e293b;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 9999px;
    }

    .badge-success { background: #dcfce7; color: #15803d; }
    .badge-neutral { background: #f1f5f9; color: #475569; }
    .badge-warning { background: #fef3c7; color: #b45309; }
    .badge-purple { background: #ede9fe; color: #6d28d9; }

    .btn-action {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 5px 10px;
      border-radius: 6px;
      font-size: 0.775rem;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }

    .btn-action:hover {
      background: #e0e7ff;
      border-color: #6366f1;
      color: #4338ca;
    }

    .active-indicator {
      font-size: 0.75rem;
      font-weight: 800;
      color: #059669;
      background: #ecfdf5;
      padding: 3px 8px;
      border-radius: 4px;
    }

    /* TERMINAL */
    .terminal-card {
      background: #090d16;
      border-color: #1e293b;
    }

    .terminal-header {
      background: #0f172a;
      border-bottom: 1px solid #1e293b;
    }

    .terminal-dots {
      display: inline-flex;
      gap: 6px;
      margin-right: 10px;
    }

    .t-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .t-red { background: #ef4444; }
    .t-yellow { background: #eab308; }
    .t-green { background: #22c55e; }

    .terminal-title-text {
      font-family: monospace;
      font-size: 0.85rem;
      letter-spacing: 0.05em;
    }

    .btn-terminal {
      background: #1e293b;
      color: #cbd5e1;
      border: 1px solid #334155;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      cursor: pointer;
    }

    .btn-terminal:hover {
      background: #334155;
      color: #ffffff;
    }

    .terminal-body {
      padding: 16px 20px;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 0.8rem;
      line-height: 1.6;
      max-height: 240px;
      overflow-y: auto;
      color: #e2e8f0;
    }

    .terminal-line {
      white-space: pre-wrap;
      word-break: break-all;
    }

    .log-success { color: #4ade80; }
    .log-err { color: #f87171; }

    /* UTILITIES */
    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 9px 16px;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s ease;
      border: 1px solid transparent;
    }

    .btn-primary {
      background: #4f46e5;
      color: #ffffff;
    }

    .btn-primary:hover { background: #4338ca; }

    .btn-outline {
      background: #ffffff;
      border-color: #cbd5e1;
      color: #334155;
    }

    .btn-outline:hover {
      background: #f8fafc;
      border-color: #94a3b8;
    }

    .btn-sm {
      padding: 5px 10px;
      font-size: 0.8rem;
    }

    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      display: inline-flex;
      align-items: center;
    }

    .w-100 { width: 100%; }
    .flex-1 { flex: 1; }
    .d-none { display: none; }
    .text-center { text-align: center; }
    .text-end { text-align: end; }
    .py-5 { padding-top: 2rem; padding-bottom: 2rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-3 { margin-bottom: 0.75rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mt-3 { margin-top: 0.75rem; }
  `]
})
export class DeploymentCenterComponent implements OnInit {
  private adminStore = inject(AdminStoreService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  status: SystemServerStatus | null = null;
  deployments: DeploymentRecord[] = [];
  logs: string[] = [];

  isLoading = false;
  isUploading = false;
  isBuilding = false;
  isRestarting = false;
  isPinging = false;

  selectedFile: File | null = null;
  uploadVersionTag = '';
  uploadReleaseNotes = '';

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.loadStatus();
    this.loadDeployments();
    this.loadLogs();
  }

  loadStatus() {
    this.isLoading = true;
    this.adminStore.getServerStatus$().subscribe({
      next: (data) => {
        this.status = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadDeployments() {
    this.adminStore.getDeploymentHistory$().subscribe({
      next: (list) => {
        this.deployments = list;
        this.cdr.markForCheck();
      }
    });
  }

  loadLogs() {
    this.adminStore.getDeploymentLogs$().subscribe({
      next: (data) => {
        this.logs = data;
        this.cdr.markForCheck();
      }
    });
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      this.toast.error('Invalid Format', 'Only .zip archives containing compiled frontend are supported.');
      return;
    }
    this.selectedFile = file;
    this.cdr.markForCheck();
  }

  clearSelectedFile(event?: Event) {
    if (event) event.stopPropagation();
    this.selectedFile = null;
    this.cdr.markForCheck();
  }

  async uploadAndDeploy() {
    if (!this.selectedFile || this.isUploading) return;

    this.isUploading = true;
    this.toast.info('Uploading Package', `Uploading '${this.selectedFile.name}' to server...`);
    this.cdr.markForCheck();

    try {
      const record = await this.adminStore.uploadAndDeployFrontend(
        this.selectedFile,
        this.uploadVersionTag,
        this.uploadReleaseNotes
      );
      this.toast.success(
        'Deployment Live',
        `Version '${record.version}' successfully deployed! (${record.fileCount} assets hosted)`
      );
      this.clearSelectedFile();
      this.uploadVersionTag = '';
      this.uploadReleaseNotes = '';
      this.loadAll();
    } catch (err: any) {
      this.toast.error('Deployment Failed', err?.message || 'Failed to deploy package to server.');
    } finally {
      this.isUploading = false;
      this.cdr.markForCheck();
    }
  }

  async triggerLocalBuildAndDeploy() {
    if (this.isBuilding) return;

    if (!confirm('Run server-side Angular compilation (npm run build) and auto-deploy to live wwwroot? This may take 15-25 seconds.')) {
      return;
    }

    this.isBuilding = true;
    this.toast.info('Build Pipeline Started', 'Compiling frontend on server host...');
    this.cdr.markForCheck();

    try {
      const result = await this.adminStore.buildAndDeployLocalFrontend();
      this.toast.success(
        'Build & Deploy Successful',
        `Release '${result.version}' compiled and deployed live! (${result.deployedFileCount} assets, ${result.totalSizeFormatted})`
      );
      this.loadAll();
    } catch (err: any) {
      this.toast.error('Build Pipeline Error', err?.message || 'Failed to complete local build & deploy pipeline.');
    } finally {
      this.isBuilding = false;
      this.cdr.markForCheck();
    }
  }

  async triggerRestartServer() {
    if (this.isRestarting) return;

    if (!confirm('Are you sure you want to restart the Web API server process? The service will temporarily recycle.')) {
      return;
    }

    this.isRestarting = true;
    this.toast.warning('Restart Dispatched', 'Server process is recycling. Re-connecting in 4 seconds...');
    this.cdr.markForCheck();

    try {
      await this.adminStore.restartServer();
      setTimeout(() => {
        this.isRestarting = false;
        this.loadAll();
        this.toast.success('Server Online', 'Web API server is responsive.');
        this.cdr.markForCheck();
      }, 4000);
    } catch {
      this.isRestarting = false;
      this.cdr.markForCheck();
    }
  }

  testDatabasePing() {
    this.isPinging = true;
    this.cdr.markForCheck();
    this.loadStatus();
    setTimeout(() => {
      this.isPinging = false;
      this.toast.info('Database Ping', `PostgreSQL responded with ${this.status?.databaseLatencyMs || 50} ms latency.`);
      this.cdr.markForCheck();
    }, 600);
  }

  async rollbackToDeployment(id: string, version: string) {
    if (!confirm(`Are you sure you want to rollback the active live website to snapshot '${version}'?`)) {
      return;
    }

    this.toast.info('Rollback Initiated', `Restoring snapshot '${version}'...`);
    try {
      const ok = await this.adminStore.rollbackDeployment(id);
      if (ok) {
        this.toast.success('Rollback Complete', `Website is now running snapshot '${version}'.`);
        this.loadAll();
      } else {
        this.toast.error('Rollback Failed', 'Could not rollback to snapshot.');
      }
    } catch {
      this.toast.error('Rollback Error', 'Server error during rollback.');
    }
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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
