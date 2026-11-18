import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class CampusSessionService {
  readonly changed$ = new Subject<void>();
  branchId = localStorage.getItem('sms_last_active_branch') || 'br-01';
  schoolId = 'sch-01';
  userId = '';

  configure(user: User) {
    this.userId = user.id;
    this.schoolId = user.schoolId || 'sch-01';
    if (user.isSuperAdmin) {
      const saved = localStorage.getItem(`sms_active_branch_${user.id}`);
      this.branchId = saved || user.branchId || 'br-01';
    } else {
      this.branchId = user.branchId || 'br-01';
    }
    localStorage.setItem('sms_last_active_branch', this.branchId);
    this.changed$.next();
  }

  select(branchId: string) {
    this.branchId = branchId;
    localStorage.setItem('sms_last_active_branch', branchId);
    if (this.userId) {
      if (branchId) {
        localStorage.setItem(`sms_active_branch_${this.userId}`, branchId);
      } else {
        localStorage.removeItem(`sms_active_branch_${this.userId}`);
      }
    }
    this.changed$.next();
  }

  get storagePrefix() {
    return `sms_campus_${this.schoolId}_${this.branchId}_${this.userId}_`;
  }
}
