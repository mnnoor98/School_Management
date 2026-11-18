import { CampusImageDirective } from '../shared/components/campus-image.directive';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { AdminStoreService } from '../core/services/stores/admin-store.service';
import { IconComponent } from '../shared/components/icon.component';
import { ToastContainerComponent } from '../shared/components/toast-container.component';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CampusImageDirective, CommonModule, FormsModule, IconComponent, ToastContainerComponent],
  template: `
    <app-toast-container></app-toast-container>
    <div class="login-wrapper">
      <div class="login-left">
        <div class="brand-bar">
          <div class="brand-logo">
            <app-icon name="graduation-cap" [size]="28"></app-icon>
          </div>
          <div>
            <h2 class="brand-title">{{ school.name }}</h2>
            <span class="brand-badge">Enterprise Academic Portal</span>
          </div>
        </div>

        <div class="login-card">
          <div class="card-intro">
            <h3>Sign In to Your Portal</h3>
            <p>Enter your institutional credentials or choose a demo persona below.</p>
          </div>

          <!-- Quick Persona Switcher for Instant Demo Access -->
          <div class="demo-personas">
            <label class="demo-label">Instant Demo Login (Pre-configured Roles):</label>
            <div class="persona-chips">
              <button
                type="button"
                *ngFor="let u of demoUsers"
                class="persona-chip"
                [class.active]="username === u.username"
                (click)="selectPersona(u.username)"
              >
                <img campusImage [src]="u.avatar" [alt]="u.fullName" class="chip-avatar" />
                <div class="chip-info">
                  <span class="chip-role">{{ u.roleName }}</span>
                  <span class="chip-name">{{ u.fullName }}</span>
                </div>
              </button>
            </div>
          </div>

          <form (ngSubmit)="onLogin()" class="login-form">
            <div class="form-group">
              <label class="form-label">Username / Institutional ID <span class="required">*</span></label>
              <div class="input-with-icon">
                <app-icon name="user" [size]="18" class="field-icon"></app-icon>
                <input
                  type="text"
                  [(ngModel)]="username"
                  name="username"
                  class="form-control"
                  placeholder="e.g. admin, teacher, accountant"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Password <span class="required">*</span></label>
              <div class="input-with-icon">
                <app-icon name="lock" [size]="18" class="field-icon"></app-icon>
                <input
                  type="password"
                  [(ngModel)]="password"
                  name="password"
                  class="form-control"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div class="form-actions-row">
              <label class="form-check">
                <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe" />
                <span>Keep me logged in</span>
              </label>
              <a href="javascript:void(0)" class="forgot-link">Forgot password?</a>
            </div>

            <button type="submit" class="btn btn-primary btn-block btn-lg" [disabled]="loading">
              <app-icon name="arrow-up-right" [size]="18" *ngIf="!loading"></app-icon>
              <span>{{ loading ? 'Authenticating...' : 'Sign In to Portal' }}</span>
            </button>
          </form>

          <div class="login-footer-info">
            <p>Protected by Role-Based Access Control & User Overrides Engine</p>
            <small>Branch Scope: {{ school.code }} • Academic Session 2026</small>
          </div>
        </div>
      </div>

      <div class="login-right">
        <div class="showcase-content">
          <div class="badge-pill">
            <app-icon name="shield-check" [size]="16"></app-icon>
            <span>Angular 22 + Dynamic RBAC Engine</span>
          </div>
          <h1>Next-Generation School Management & Academic Lifecycle</h1>
          <p class="showcase-desc">
            Complete institutional workflows covering Dynamic Menus, Permission Matrices, Student Lifecycle,
            Teacher Routines, Digital Attendance, Examination Results & Finance Collection.
          </p>

          <div class="feature-grid">
            <div class="feature-item">
              <div class="feat-icon"><app-icon name="menu" [size]="20"></app-icon></div>
              <div>
                <h4>Dynamic Menu Tree</h4>
                <p>Database-driven menus with granular parent-child routing</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feat-icon"><app-icon name="user-check" [size]="20"></app-icon></div>
              <div>
                <h4>User-Specific Overrides</h4>
                <p>Explicit Allow/Deny overrides overriding role defaults</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feat-icon"><app-icon name="circle-dollar-sign" [size]="20"></app-icon></div>
              <div>
                <h4>Instant Fee Collection</h4>
                <p>Atomic invoices, payment receipts and due tracking</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feat-icon"><app-icon name="award" [size]="20"></app-icon></div>
              <div>
                <h4>Automated Marksheet</h4>
                <p>Term exam marks entry, GPA computation & printable cards</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      background: #f8fafc;
    }
    .login-left {
      flex: 1;
      max-width: 600px;
      padding: 40px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      background: #ffffff;
      box-shadow: 10px 0 30px rgba(0,0,0,0.03);
      z-index: 10;
    }
    .brand-bar {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 32px;
    }
    .brand-logo {
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
      color: #ffffff;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 16px rgba(79, 70, 229, 0.25);
    }
    .brand-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .brand-badge {
      font-size: 0.75rem;
      font-weight: 600;
      color: #6366f1;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .card-intro h3 {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 6px;
    }
    .card-intro p {
      font-size: 0.875rem;
      color: #64748b;
      margin-bottom: 24px;
    }
    .demo-personas {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 14px;
      margin-bottom: 24px;
    }
    .demo-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #475569;
      margin-bottom: 10px;
      letter-spacing: 0.03em;
    }
    .persona-chips {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    .persona-chip {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s;
    }
    .persona-chip:hover, .persona-chip.active {
      border-color: #4f46e5;
      background: #eef2ff;
      box-shadow: 0 2px 6px rgba(79, 70, 229, 0.15);
    }
    .chip-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
    }
    .chip-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .chip-role {
      font-size: 0.7rem;
      font-weight: 700;
      color: #4f46e5;
    }
    .chip-name {
      font-size: 0.75rem;
      color: #334155;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .input-with-icon {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-with-icon .field-icon {
      position: absolute;
      left: 14px;
      color: #94a3b8;
    }
    .input-with-icon .form-control {
      padding-left: 42px;
    }
    .form-actions-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      font-size: 0.8125rem;
    }
    .forgot-link {
      color: #4f46e5;
      text-decoration: none;
      font-weight: 600;
    }
    .btn-block {
      width: 100%;
    }
    .btn-lg {
      padding: 12px 20px;
      font-size: 0.95rem;
    }
    .login-footer-info {
      margin-top: 32px;
      text-align: center;
      color: #94a3b8;
      font-size: 0.75rem;
      line-height: 1.5;
    }

    /* Right Showcase */
    .login-right {
      flex: 1.3;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%);
      color: #ffffff;
      padding: 60px 80px;
      display: flex;
      align-items: center;
      position: relative;
      overflow: hidden;
    }
    .showcase-content {
      max-width: 680px;
    }
    .badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(8px);
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #c7d2fe;
      margin-bottom: 24px;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .showcase-content h1 {
      font-size: 2.5rem;
      line-height: 1.2;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 16px;
      letter-spacing: -0.03em;
    }
    .showcase-desc {
      font-size: 1.05rem;
      color: #cbd5e1;
      line-height: 1.6;
      margin-bottom: 40px;
    }
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    .feature-item {
      display: flex;
      gap: 14px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 16px;
      border-radius: 14px;
      backdrop-filter: blur(4px);
    }
    .feat-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgba(99, 102, 241, 0.2);
      color: #a5b4fc;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .feature-item h4 {
      font-size: 0.95rem;
      color: #ffffff;
      margin-bottom: 4px;
    }
    .feature-item p {
      font-size: 0.775rem;
      color: #94a3b8;
      line-height: 1.4;
    }

    @media (max-width: 1024px) {
      .login-right { display: none; }
      .login-left { max-width: 100%; }
    }
  `]
})
export class AuthLayoutComponent {
  private auth = inject(AuthService);
  private db = inject(AdminStoreService);

  school = this.db.getSchool();
  demoUsers = [
    { username: 'admin', fullName: 'System Administrator', roleName: 'Super Admin', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
    { username: 'teacher', fullName: 'Sarah Jenkins', roleName: 'Teacher', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80' },
    { username: 'accountant', fullName: 'Kamal Hossain', roleName: 'Accountant', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' },
    { username: 'student', fullName: 'Tanvir Ahmed', roleName: 'Student', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80' }
  ];

  username = 'admin';
  password = 'admin123';
  rememberMe = true;
  loading = false;

  async selectPersona(uname: string) {
    this.username = uname;
    this.password = uname.toLowerCase() + '123';
    await this.onLogin();
  }

  async onLogin() {
    this.loading = true;
    try {
      const ok = await this.auth.login(this.username, this.password);
      if (!ok) {
        this.loading = false;
      }
    } catch (err) {
      this.loading = false;
    } finally {
      this.loading = false;
    }
  }
}
