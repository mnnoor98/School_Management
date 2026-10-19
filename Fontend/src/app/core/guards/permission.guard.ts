import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const permissionGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const permissionCode = route.data['permissionCode'] as string;
  if (!permissionCode) {
    return true; // No explicit permission restriction on route
  }

  // Precedence engine check
  const allowed = auth.hasPermission(permissionCode, 'view');
  if (allowed) {
    return true;
  }

  toast.error(
    'Access Denied (403)',
    `Your active role does not have authorization for this module [${permissionCode}].`
  );
  if (!state.url.includes('/app/dashboard')) {
    router.navigate(['/app/dashboard']);
  }
  return false;
};
