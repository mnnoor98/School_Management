import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="stat-card" [ngClass]="themeClass">
      <div class="stat-header">
        <span class="stat-title">{{ title }}</span>
        <div class="stat-icon-wrap">
          <app-icon [name]="icon" [size]="20"></app-icon>
        </div>
      </div>
      <div class="stat-body">
        <h3 class="stat-value">{{ value }}</h3>
        <div class="stat-footer" *ngIf="subtitle || trend">
          <span *ngIf="trend" class="stat-trend" [ngClass]="trendPositive ? 'trend-up' : 'trend-down'">
            {{ trend }}
          </span>
          <span class="stat-subtitle">{{ subtitle }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 16px;
      padding: 20px;
      transition: all 0.25s ease;
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04);
      position: relative;
      overflow: hidden;
    }
    .stat-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.08);
      border-color: var(--primary-light, #c7d2fe);
    }
    .stat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .stat-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-muted, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .stat-icon-wrap {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .theme-blue .stat-icon-wrap { background: #eff6ff; color: #2563eb; }
    .theme-emerald .stat-icon-wrap { background: #ecfdf5; color: #059669; }
    .theme-amber .stat-icon-wrap { background: #fffbeb; color: #d97706; }
    .theme-purple .stat-icon-wrap { background: #f5f3ff; color: #7c3aed; }
    .theme-rose .stat-icon-wrap { background: #fff1f2; color: #e11d48; }

    .stat-value {
      font-size: 1.85rem;
      font-weight: 700;
      color: var(--text-color, #0f172a);
      margin: 0 0 6px 0;
      letter-spacing: -0.02em;
    }
    .stat-footer {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8125rem;
    }
    .stat-trend {
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 6px;
    }
    .trend-up {
      background: #ecfdf5;
      color: #059669;
    }
    .trend-down {
      background: #fff1f2;
      color: #e11d48;
    }
    .stat-subtitle {
      color: var(--text-muted, #64748b);
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
