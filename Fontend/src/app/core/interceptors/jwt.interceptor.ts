import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { takeUntil } from 'rxjs';
import { CampusSessionService } from '../services/campus-session.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('sms_auth_token');
  const campus = inject(CampusSessionService);
  const apiUrl = location.port === '4200' ? 'http://localhost:5000' : location.origin;

  let clonedReq = req;

  // Prepend backend base URL if relative path
  if (req.url.startsWith('/api/')) {
    clonedReq = req.clone({
      url: `${apiUrl}${req.url}`
    });
  }

  // Attach JWT Bearer token if present
  const isApi = clonedReq.url.startsWith(`${apiUrl}/api/`) || clonedReq.url.startsWith('/api/');
  if (token && isApi) {
    clonedReq = clonedReq.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  const effectiveBranchId = campus.branchId || (campus.userId ? localStorage.getItem(`sms_active_branch_${campus.userId}`) : null) || 'br-01';
  if (isApi && effectiveBranchId) {
    clonedReq = clonedReq.clone({ setHeaders: { 'X-Campus-Id': effectiveBranchId } });
  }

  return next(clonedReq);
};
