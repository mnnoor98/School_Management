import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide"
      [ngClass]="badgeClass"
    >
      <span *ngIf="showDot" class="w-1.5 h-1.5 rounded-full" [ngClass]="dotClass"></span>
      <ng-content></ng-content>
      <span>{{ label }}</span>
    </span>
  `,
  styles: [`
    .badge-success { background: rgba(16, 185, 129, 0.12); color: #059669; border: 1px solid rgba(16, 185, 129, 0.25); }
    .badge-warning { background: rgba(245, 158, 11, 0.12); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.25); }
    .badge-danger { background: rgba(239, 68, 68, 0.12); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.25); }
    .badge-info { background: rgba(59, 130, 246, 0.12); color: #2563eb; border: 1px solid rgba(59, 130, 246, 0.25); }
    .badge-purple { background: rgba(139, 92, 246, 0.12); color: #7c3aed; border: 1px solid rgba(139, 92, 246, 0.25); }
    .badge-neutral { background: rgba(100, 116, 139, 0.12); color: #475569; border: 1px solid rgba(100, 116, 139, 0.25); }

    .dot-success { background-color: #10b981; }
    .dot-warning { background-color: #f59e0b; }
    .dot-danger { background-color: #ef4444; }
    .dot-info { background-color: #3b82f6; }
    .dot-purple { background-color: #8b5cf6; }
    .dot-neutral { background-color: #94a3b8; }
  `]
})
export class BadgeComponent {
  @Input() variant: 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral' = 'neutral';
  @Input() label?: string;
  @Input() showDot: boolean = true;

  get badgeClass(): string {
    return `badge-${this.variant}`;
  }

  get dotClass(): string {
    return `dot-${this.variant}`;
  }
}
