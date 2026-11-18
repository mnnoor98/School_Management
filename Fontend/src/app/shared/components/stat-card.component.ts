import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="stat-card" [ngClass]="themeClass">
      <div class="stat-top-bar"></div>
      <div class="stat-inner">
        <div class="stat-header">
          <div class="stat-meta">
            <span class="stat-title">{{ title }}</span>
            <div *ngIf="trend" class="stat-trend-pill" [ngClass]="trendPositive ? 'trend-up' : 'trend-neutral'">
              <span class="trend-dot">●</span>
              <span>{{ trend }}</span>
            </div>
          </div>
          <div class="stat-icon-wrap">
            <app-icon [name]="icon" [size]="20"></app-icon>
          </div>
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ value }}</div>
          <div class="stat-footer" *ngIf="subtitle">
            <span class="stat-subtitle">{{ subtitle }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      position: relative;
      overflow: hidden;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 4px 12px -2px rgba(15, 23, 42, 0.04);
    }
    .stat-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 24px -4px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.04);
      border-color: #cbd5e1;
    }
    .stat-top-bar {
      height: 3px;
      width: 100%;
      position: absolute;
      top: 0;
      left: 0;
    }
    .theme-blue .stat-top-bar { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
    .theme-emerald .stat-top-bar { background: linear-gradient(90deg, #10b981, #34d399); }
    .theme-purple .stat-top-bar { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
    .theme-amber .stat-top-bar { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .theme-rose .stat-top-bar { background: linear-gradient(90deg, #f43f5e, #fb7185); }

    .stat-inner {
      padding: 20px;
    }
    .stat-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
    }
    .stat-meta {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .stat-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .stat-trend-pill {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      width: fit-content;
    }
    .trend-up {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #d1fae5;
    }
    .trend-neutral {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
    }
    .trend-dot {
      font-size: 0.6rem;
    }

    .stat-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }
    .theme-blue .stat-icon-wrap {
      background: #eff6ff;
      color: #2563eb;
      border: 1px solid #dbeafe;
    }
    .theme-emerald .stat-icon-wrap {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #d1fae5;
    }
    .theme-purple .stat-icon-wrap {
      background: #f5f3ff;
      color: #7c3aed;
      border: 1px solid #ede9fe;
    }
    .theme-amber .stat-icon-wrap {
      background: #fffbeb;
      color: #d97706;
      border: 1px solid #fef3c7;
    }
    .theme-rose .stat-icon-wrap {
      background: #fff1f2;
      color: #e11d48;
      border: 1px solid #ffe4e6;
    }

    .stat-card:hover .stat-icon-wrap {
      transform: scale(1.05);
    }

    .stat-value {
      font-size: 2.15rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.03em;
      line-height: 1.15;
      margin: 0 0 6px 0;
    }
    .stat-footer {
      display: flex;
      align-items: center;
      font-size: 0.8rem;
    }
    .stat-subtitle {
      color: #64748b;
      font-weight: 500;
    }
  `]
})
export class StatCardComponent {
  @Input() title: string = '';
  @Input() value: string | number = '';
  @Input() icon: string = 'layout-dashboard';
  @Input() subtitle?: string;
  @Input() trend?: string;
  @Input() trendPositive: boolean = true;
  @Input() theme: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' = 'blue';

  get themeClass(): string {
    return `theme-${this.theme}`;
  }
}
