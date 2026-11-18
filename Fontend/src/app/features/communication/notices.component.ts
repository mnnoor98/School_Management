import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SystemStoreService } from '../../core/services/stores/system-store.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Notice } from '../../core/models';
import { BadgeComponent } from '../../shared/components/badge.component';
import { IconComponent } from '../../shared/components/icon.component';
import { ModalComponent } from '../../shared/components/modal.component';

@Component({
  selector: 'app-notices',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeComponent, IconComponent, ModalComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <app-icon name="bell" [size]="26" class="text-primary"></app-icon>
            Institutional Notice Board & Bulletins
          </h1>
          <p class="page-subtitle">
            Publish announcements, urgent emergency alerts, exam circulars, and target audiences.
          </p>
        </div>
        <div class="page-actions">
          <button type="button" class="btn btn-primary" (click)="isModalOpen = true">
            <app-icon name="plus" [size]="16"></app-icon>
            <span>Publish New Notice</span>
          </button>
        </div>
      </div>

      <!-- NOTICES FEED -->
      <div class="grid-2">
        <div *ngFor="let notice of notices" class="notice-card" [class.important-notice]="notice.isImportant">
          <div class="n-head">
            <div class="flex items-center gap-2">
              <app-badge [variant]="notice.isImportant ? 'danger' : 'info'" [label]="notice.category"></app-badge>
              <app-badge variant="neutral" [label]="'Audience: ' + notice.targetAudience"></app-badge>
            </div>
            <span class="n-date">{{ notice.publishedDate }}</span>
          </div>

          <h3 class="n-title">{{ notice.title }}</h3>
          <p class="n-content">{{ notice.content }}</p>

          <div class="n-foot">
            <span class="n-author">Published by: {{ notice.author }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ADD NOTICE MODAL -->
    <app-modal
      [(isOpen)]="isModalOpen"
      title="Publish Institutional Notice"
      subtitle="Broadcast announcements to teachers, students, or all users."
      [maxWidth]="560"
    >
      <form (ngSubmit)="publishNotice()">
        <div class="form-group">
          <label class="form-label">Notice Title <span class="required">*</span></label>
          <input type="text" class="form-control" [(ngModel)]="newNotice.title" name="title" required placeholder="e.g. Science Fair Registration Open" />
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Notice Category <span class="required">*</span></label>
            <select class="form-select" [(ngModel)]="newNotice.category" name="category">
              <option value="General">General</option>
              <option value="Academic">Academic</option>
              <option value="Exam">Exam Circular</option>
              <option value="Holiday">Holiday Notice</option>
              <option value="Emergency">Urgent Emergency</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Target Audience <span class="required">*</span></label>
            <select class="form-select" [(ngModel)]="newNotice.targetAudience" name="targetAudience">
              <option value="All">All Users</option>
              <option value="Teachers">Teachers Only</option>
              <option value="Students">Students & Guardians Only</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Notice Body / Message <span class="required">*</span></label>
          <textarea rows="4" class="form-control" [(ngModel)]="newNotice.content" name="content" required placeholder="Enter the complete bulletin details..."></textarea>
        </div>

        <div class="form-group">
          <label class="form-check">
            <input type="checkbox" [(ngModel)]="newNotice.isImportant" name="isImportant" />
            <span class="font-bold text-danger">Mark as High Priority / Urgent Alert</span>
          </label>
        </div>

        <div class="flex justify-end gap-2 mt-4" footer>
          <button type="button" class="btn btn-outline" (click)="isModalOpen = false">Cancel</button>
          <button type="submit" class="btn btn-primary" [disabled]="!newNotice.title">Publish Bulletin</button>
        </div>
      </form>
    </app-modal>
  `,
  styles: [`
    .text-primary { color: #4f46e5; }
    .text-danger { color: #ef4444; }
    .font-bold { font-weight: 700; }
    .notice-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 20px;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .notice-card.important-notice {
      border-left: 4px solid #ef4444;
      background: #fffdfd;
    }
    .n-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .n-date {
      font-size: 0.75rem;
      color: #94a3b8;
    }
    .n-title {
      font-size: 1.05rem;
      color: #0f172a;
      margin: 0;
    }
    .n-content {
      font-size: 0.85rem;
      color: #475569;
      line-height: 1.5;
      flex: 1;
    }
    .n-foot {
      padding-top: 10px;
      border-top: 1px solid #f1f5f9;
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 600;
    }
  `]
})
export class NoticesComponent implements OnInit {
  private systemStore = inject(SystemStoreService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  notices: Notice[] = [];
  isModalOpen = false;

  newNotice: Partial<Notice> = {
    title: '',
    category: 'General',
    targetAudience: 'All',
    content: '',
    isImportant: false
  };

  ngOnInit() {
    this.systemStore.loadNotices().then(list => {
      this.notices = list;
      this.cdr.markForCheck();
    });

    this.systemStore.getNotices$().subscribe(list => {
      this.notices = list;
      this.cdr.markForCheck();
    });
  }

  publishNotice() {
    if (!this.newNotice.title) return;
    const authorName = this.auth.getCurrentUser()?.fullName || 'Principal Office';
    this.systemStore.addNotice(this.newNotice, authorName);
    this.toast.success('Notice Published', `"${this.newNotice.title}" has been broadcast.`);
    this.isModalOpen = false;
    this.newNotice = {
      title: '',
      category: 'General',
      targetAudience: 'All',
      content: '',
      isImportant: false
    };
    this.cdr.markForCheck();
  }
}
