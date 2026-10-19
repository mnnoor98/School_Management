import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../core/services/toast.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="toast-stack">
      <div
        *ngFor="let toast of toasts$ | async"
        class="toast-item"
        [ngClass]="'toast-' + toast.type"
      >
        <div class="toast-icon">
          <app-icon [name]="getIcon(toast.type)" [size]="20"></app-icon>
        </div>
        <div class="toast-content">
          <strong class="toast-title">{{ toast.title }}</strong>
          <p class="toast-message" *ngIf="toast.message">{{ toast.message }}</p>
        </div>
        <button type="button" class="toast-close" (click)="remove(toast.id)">
          <app-icon name="x" [size]="14"></app-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 420px;
      width: 100%;
      pointer-events: none;
    }
    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      border-left: 4px solid #64748b;
      animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .toast-success { border-left-color: #10b981; }
    .toast-success .toast-icon { color: #10b981; }
    .toast-error { border-left-color: #ef4444; }
    .toast-error .toast-icon { color: #ef4444; }
    .toast-warning { border-left-color: #f59e0b; }
    .toast-warning .toast-icon { color: #f59e0b; }
    .toast-info { border-left-color: #3b82f6; }
    .toast-info .toast-icon { color: #3b82f6; }

    .toast-icon {
      margin-top: 2px;
      flex-shrink: 0;
    }
    .toast-content {
      flex: 1;
    }
    .toast-title {
      display: block;
      font-size: 0.9rem;
      font-weight: 600;
      color: #0f172a;
    }
    .toast-message {
      font-size: 0.8125rem;
      color: #475569;
      margin: 3px 0 0 0;
      line-height: 1.4;
    }
    .toast-close {
      border: none;
      background: transparent;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
    }
    .toast-close:hover {
      color: #0f172a;
      background: #f1f5f9;
    }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastContainerComponent {
  private toastService = inject(ToastService);
  toasts$ = this.toastService.getToasts$();

  remove(id: string) {
    this.toastService.remove(id);
  }

  getIcon(type: ToastMessage['type']): string {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'x';
      case 'warning': return 'bell';
      case 'info': return 'shield-check';
    }
  }
}
