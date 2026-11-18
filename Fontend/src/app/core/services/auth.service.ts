import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom, fromEvent, timer } from 'rxjs';
import { User, MenuItem, PermissionAction, RolePermission, UserMenuOverride } from '../models';
import { ToastService } from './toast.service';
import { CampusSessionService } from './campus-session.service';
import { AdminStoreService } from './stores/admin-store.service';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private campus = inject(CampusSessionService);
  private adminStore = inject(AdminStoreService);

  private readonly API_URL = '/api/v1';
  private readonly TOKEN_KEY = 'sms_auth_token';

  private loadCachedUser(): User | null {
    try {
      const data = localStorage.getItem('sms_current_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private loadCachedMenus(): MenuItem[] {
    try {
      const data = localStorage.getItem('sms_my_menus');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private _isAuthenticated$ = new BehaviorSubject<boolean>(this.checkInitialAuth());
  private currentUser$ = new BehaviorSubject<User | null>(this.loadCachedUser());
  private myMenus$ = new BehaviorSubject<MenuItem[]>(this.loadCachedMenus());
  private myRolePermissions$ = new BehaviorSubject<RolePermission[]>([]);
  private myOverrides$ = new BehaviorSubject<UserMenuOverride[]>([]);

  readonly ready: Promise<void>;

  constructor() {
    const cached = this.currentUser$.value;
    if (cached && cached.id) {
      this.campus.configure(cached);
      this._isAuthenticated$.next(true);
    }
    this.ready = this.restoreSession();
    const refresh = () => { if (this.isAuthenticated() && this.currentUser$.value?.id) void this.refreshMenuAccess(); };
    fromEvent(window, 'focus').subscribe(refresh);
    timer(30000, 30000).subscribe(refresh);
  }

  private async restoreSession() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      this._isAuthenticated$.next(false);
      return;
    }

    try {
      const response = await firstValueFrom(this.http.get<ApiResponse<User>>(`${this.API_URL}/auth/me`));
      if (response && response.success && response.data) {
        this.setCurrentUser(response.data);
        this._isAuthenticated$.next(true);
      } else {
        this._isAuthenticated$.next(true);
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        console.warn('Authentication token expired or rejected by server:', err);
        this.clearSession();
        this._isAuthenticated$.next(false);
        return;
      }
      console.warn('Session restore network/server warning, keeping credentials:', err);
      this._isAuthenticated$.next(true);
    }

    try {
      await Promise.allSettled([
        this.refreshAuthorizedMenus(),
        this.adminStore.refreshAllFromBackend()
      ]);
    } catch (e) {
      console.warn('Background sync warning during session restore:', e);
    }
  }

  private checkInitialAuth(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    return !!token;
  }

  isAuthenticated(): boolean {
    return this._isAuthenticated$.value;
  }

  getIsAuthenticated$(): Observable<boolean> {
    return this._isAuthenticated$.asObservable();
  }

  getCurrentUser(): User | null {
    return this.currentUser$.value;
  }

  getCurrentUser$(): Observable<User | null> {
    return this.currentUser$.asObservable();
  }

  setCurrentUser(user: User): void {
    this.currentUser$.next(user);
    try {
      localStorage.setItem('sms_current_user', JSON.stringify(user));
      localStorage.setItem('sms_user_role', user.roleName || '');
    } catch {}
    this.campus.configure(user);
  }

  clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('sms_current_user');
    localStorage.removeItem('sms_user_role');
    localStorage.removeItem('sms_my_menus');
    this.currentUser$.next(null);
    this.myMenus$.next([]);
    this.myRolePermissions$.next([]);
    this.myOverrides$.next([]);
    this._isAuthenticated$.next(false);
  }

  async login(username: string, password?: string): Promise<boolean> {
    const effectivePassword = password || (username.toLowerCase() === 'admin' ? 'admin123' : username.toLowerCase() + '123');

    try {
      const res = await firstValueFrom(
        this.http.post<ApiResponse<LoginResponse>>(`${this.API_URL}/auth/login`, {
          username: username.trim(),
          password: effectivePassword
        })
      );

      if (res && res.success && res.data) {
        localStorage.setItem(this.TOKEN_KEY, res.data.accessToken);
        this.setCurrentUser(res.data.user);
        this._isAuthenticated$.next(true);

        await Promise.allSettled([
          this.refreshAuthorizedMenus(),
          this.adminStore.refreshAllFromBackend()
        ]);

        this.toast.success('Welcome Back!', `Signed in as ${res.data.user.fullName} (${res.data.user.roleName})`);
        this.router.navigate(['/app/dashboard']);
        return true;
      } else {
        this.toast.error('Login Failed', res?.message || 'Invalid credentials.');
        return false;
      }
    } catch (err: any) {
      console.error('API login error:', err);
      const msg = err?.error?.message || err?.error?.title || 'Invalid credentials or connection error.';
      this.toast.error('Login Failed', msg);
      return false;
    }
  }

  async switchRole(userId: string) {
    const users = this.adminStore.getUsers();
    const targetUser = users.find(u => u.id === userId);
    if (targetUser) {
      await this.login(targetUser.username, targetUser.username.toLowerCase() + '123');
      this.toast.info('Role Switched', `Active session switched to: ${targetUser.fullName} (${targetUser.roleName})`);
    }
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.API_URL}/auth/logout`, {}));
    } catch {}

    this.clearSession();
    this.toast.info('Logged Out', 'You have been safely signed out.');
    this.router.navigate(['/login']);
  }

  hasPermission(menuCode: string, action: PermissionAction = 'view'): boolean {
    const user = this.currentUser$.value;
    if (!user) return false;
    const isSuperAdmin = user.isSuperAdmin || (user.roleName || '').toLowerCase().includes('super') || (user.roleName || '').toLowerCase().includes('admin');
    if (isSuperAdmin) return true;

    // Check user overrides first
    const override = this.myOverrides$.value.find(o => o.menuCode === menuCode && o.action === action);
    if (override) {
      if (override.override === 'Allow') return true;
      if (override.override === 'Deny') return false;
    }

    // Fall back to role permissions
    const rolePerm = this.myRolePermissions$.value.find(rp => rp.menuCode === menuCode);
    if (rolePerm) {
      return !!(rolePerm as any)[action];
    }

    if (menuCode === 'DASHBOARD' && action === 'view') return true;
    return this.myMenus$.value.some(m => m.code === menuCode || (m.children && m.children.some(c => c.code === menuCode)));
  }

  getMyMenus(): MenuItem[] {
    return this.myMenus$.value;
  }

  async refreshAuthorizedMenus(): Promise<void> {
    if (!this.isAuthenticated()) return;
    try {
      const [menusRes, permsRes] = await Promise.allSettled([
        firstValueFrom(this.http.get<ApiResponse<MenuItem[]>>(`${this.API_URL}/menus/my`)),
        firstValueFrom(this.http.get<ApiResponse<{ rolePermissions: RolePermission[]; overrides: UserMenuOverride[] }>>(`${this.API_URL}/menus/my/permissions`))
      ]);

      if (menusRes.status === 'fulfilled' && menusRes.value?.success && Array.isArray(menusRes.value.data)) {
        this.myMenus$.next(menusRes.value.data);
        try {
          localStorage.setItem('sms_my_menus', JSON.stringify(menusRes.value.data));
        } catch {}
      }

      if (permsRes.status === 'fulfilled' && permsRes.value?.success && permsRes.value.data) {
        if (Array.isArray(permsRes.value.data.rolePermissions)) {
          this.myRolePermissions$.next(permsRes.value.data.rolePermissions);
        }
        if (Array.isArray(permsRes.value.data.overrides)) {
          this.myOverrides$.next(permsRes.value.data.overrides);
        }
      }
    } catch (e) {
      console.warn('refreshAuthorizedMenus warning:', e);
    }
  }

  async refreshMenuAccess(enforceCurrentRoute = true) {
    await this.refreshAuthorizedMenus();
    if (!enforceCurrentRoute) return;
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) route = route.firstChild;
    const code = route.data['permissionCode'] as string | undefined;
    if (code && this.router.url.startsWith('/app/') && !this.router.url.startsWith('/app/dashboard') && !this.hasPermission(code, 'view')) {
      await this.router.navigate(['/app/dashboard']);
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const res = await firstValueFrom(
        this.http.post<ApiResponse<boolean>>(`${this.API_URL}/users/change-password`, {
          currentPassword,
          newPassword
        })
      );
      if (res && res.success) {
        this.toast.success('Password Updated', 'Your account password has been changed successfully.');
        return true;
      }
      this.toast.error('Update Failed', res?.message || 'Could not change password.');
      return false;
    } catch (err: any) {
      const msg = err?.error?.message || err?.error?.title || 'Incorrect current password or server error.';
      this.toast.error('Error', msg);
      return false;
    }
  }

  async updateProfile(data: Partial<User>): Promise<boolean> {
    try {
      const res = await firstValueFrom(
        this.http.put<ApiResponse<User>>(`${this.API_URL}/users/my-profile`, data)
      );
      if (res && res.success && res.data) {
        this.setCurrentUser(res.data);
        this.toast.success('Profile Saved', 'Personal information updated successfully.');
        return true;
      }
    } catch (err: any) {
      this.toast.error('Profile not saved', err?.error?.message || err?.error?.detail || 'Please try again.');
    }
    return false;
  }

  async uploadFile(file: File, folder: string = 'general'): Promise<{ url: string; fileName: string } | null> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      const res = await firstValueFrom(
        this.http.post<ApiResponse<{ url: string; fileName: string }>>(`${this.API_URL}/files/upload`, formData)
      );
      if (res && res.success && res.data) {
        return res.data;
      }
    } catch (err: any) {
      this.toast.error('Upload failed', err?.error?.message || 'The file could not be uploaded.');
    }
    return null;
  }
}
