import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { CampusSessionService } from '../services/campus-session.service';

export const permissionGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);
  const campus = inject(CampusSessionService);

  // Await authentication restoration before permission inspection
  await auth.ready;

  if (!auth.isAuthenticated()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  if (!campus.branchId && !state.url.includes('/app/dashboard')) {
    toast.info('Select a campus', 'Choose a campus on the dashboard to continue.');
    return router.createUrlTree(['/app/dashboard']);
  }
  await auth.refreshMenuAccess(false);
  // Dashboard remains the landing page when a role has no assigned screens.
  if (state.url.split('?')[0] === '/app/dashboard') return true;

  const currentPath = state.url.split('?')[0];

  // 1. If the route explicitly exists in the user's authorized menu tree from backend, grant access
  const hasAuthorizedRoute = auth.getMyMenus().some(m =>
    (m.route && m.route === currentPath) ||
    (m.children && m.children.some(c => c.route === currentPath))
  );
  if (hasAuthorizedRoute) {
    return true;
  }

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
