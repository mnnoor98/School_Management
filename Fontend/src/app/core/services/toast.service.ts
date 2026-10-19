import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts$ = new BehaviorSubject<ToastMessage[]>([]);

  getToasts$() {
    return this.toasts$.asObservable();
  }

  show(type: ToastMessage['type'], title: string, message: string, duration = 4000) {
    const id = 'toast-' + Date.now() + Math.random().toString(36).substring(2, 5);
    const newToast: ToastMessage = { id, type, title, message, duration };
    this.toasts$.next([...this.toasts$.value, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  success(title: string, message: string = '') {
    this.show('success', title, message);
  }

  error(title: string, message: string = '') {
    this.show('error', title, message, 5000);
  }

  warning(title: string, message: string = '') {
    this.show('warning', title, message);
  }

  info(title: string, message: string = '') {
    this.show('info', title, message);
  }

  remove(id: string) {
    this.toasts$.next(this.toasts$.value.filter(t => t.id !== id));
  }
}
