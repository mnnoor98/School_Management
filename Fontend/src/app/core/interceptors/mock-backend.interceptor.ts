import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of, delay } from 'rxjs';
import { MockDbService } from '../services/mock-db.service';

export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  const db = inject(MockDbService);
  const url = req.url;
  const method = req.method;

  // 1. Auth endpoints
  if (url.includes('/api/v1/auth/login') && method === 'POST') {
    const { username } = (req.body as any) || {};
    const users = db.getUsers();
    const user = users.find(u => u.username.toLowerCase() === (username || '').toLowerCase()) || users[0];
    db.setCurrentUser(user);

    return of(
      new HttpResponse({
        status: 200,
        body: {
          token: 'mock-jwt-token-' + Date.now(),
          refreshToken: 'mock-refresh-token-' + Date.now(),
          user
        }
      })
    ).pipe(delay(200));
  }

  if (url.includes('/api/v1/auth/me') && method === 'GET') {
    const user = db.getCurrentUser();
    return of(
      new HttpResponse({
        status: 200,
        body: user
      })
    ).pipe(delay(100));
  }

  // 2. Dynamic Menus (PDF Pages 5, 14)
  if (url.includes('/api/v1/menus/my') && method === 'GET') {
    const menus = db.getMyMenuTree();
    return of(
      new HttpResponse({
        status: 200,
        body: menus
      })
    ).pipe(delay(150));
  }

  if (url.endsWith('/api/v1/menus') && method === 'GET') {
    return of(
      new HttpResponse({
        status: 200,
        body: db.getMenus()
      })
    ).pipe(delay(100));
  }

  if (url.endsWith('/api/v1/menus') && method === 'POST') {
    const res = db.saveMenu(req.body as any);
    return of(
      new HttpResponse({
        status: res.success ? 200 : 400,
        body: res
      })
    ).pipe(delay(150));
  }

  // 3. Role menu permissions
  if (url.includes('/api/v1/roles/') && url.includes('/menu-permissions')) {
    const roleId = url.split('/')[4];
    if (method === 'GET') {
      return of(
        new HttpResponse({
          status: 200,
          body: db.getRolePermissions(roleId)
        })
      ).pipe(delay(150));
    }
    if (method === 'PUT') {
      db.saveRolePermissions(roleId, req.body as any);
      return of(
        new HttpResponse({
          status: 200,
          body: { success: true }
        })
      ).pipe(delay(150));
    }
  }

  // Pass-through for any other requests
  return next(req);
};
