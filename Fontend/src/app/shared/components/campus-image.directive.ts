import { Directive, ElementRef, Input, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { CampusSessionService } from '../../core/services/campus-session.service';

@Directive({ selector: 'img[campusImage]', standalone: true })
export class CampusImageDirective implements OnDestroy {
  private element = inject(ElementRef<HTMLImageElement>);
  private http = inject(HttpClient);
  private campus = inject(CampusSessionService);
  private request?: Subscription;
  private blobUrl = '';
  private changes = this.campus.changed$.subscribe(() => {
    if (this.request || this.blobUrl) this.clear();
  });

  @Input() set src(value: string | null | undefined) {
    this.clear();
    if (!value) return;
    if (value.startsWith('/api/v1/files/content/')) {
      this.request = this.http.get(value, { responseType: 'blob' }).subscribe({
        next: blob => {
          this.blobUrl = URL.createObjectURL(blob);
          this.element.nativeElement.src = this.blobUrl;
        },
        error: () => this.element.nativeElement.removeAttribute('src')
      });
    } else {
      this.element.nativeElement.src = value;
    }
  }

  private clear() {
    this.request?.unsubscribe();
    if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
    this.blobUrl = '';
    this.element.nativeElement.removeAttribute('src');
  }

  ngOnDestroy() { this.clear(); this.changes.unsubscribe(); }
}
