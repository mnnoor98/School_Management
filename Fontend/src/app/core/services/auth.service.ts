import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom, fromEvent, timer } from 'rxjs';
import { User, MenuItem, PermissionAction } from '../models';
import { MockDbService } from './mock-db.service';
import { ToastService } from './toast.service';

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
  private db = inject(MockDbService);
  private toast = inject(ToastService);

  private readonly API_URL = '/api/v1';
  private readonly TOKEN_KEY = 'sms_auth_token';
  private _isAuthenticated$ = new BehaviorSubject<boolean>(this.checkInitialAuth());
  private currentUser$ = new BehaviorSubject<User | null>(this.db.getCurrentUser());
  readonly ready: Promise<void>;

  constructor() {
    const cached = this.db.getCurrentUser();
    if (cached && cached.id) {
      this.currentUser$.next(cached);
      this._isAuthenticated$.next(true);
    }
    this.db.getCurrentUser$().subscribe(u => {
      this.currentUser$.next(u);
    });
    this.ready = this.restoreSession();
    const refresh = () => { if (this.isAuthenticated() && this.db.getCurrentUser().id) void this.refreshMenuAccess(); };
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
        this.db.setCurrentUser(response.data);
        this._isAuthenticated$.next(true);
      } else {
        // If response is not success, do not blindly clear session unless 401
        this._isAuthenticated$.next(true);
      }
    } catch (err: any) {
      // ONLY log out and purge token if it is explicitly 401 Unauthorized or 403 Forbidden
      if (err?.status === 401 || err?.status === 403) {
        console.warn('Authentication token expired or rejected by server:', err);
        localStorage.removeItem(this.TOKEN_KEY);
        this.db.clearSession();
        this._isAuthenticated$.next(false);
        return;
      }
      // If server returned 500 or offline/timeout or cancelled observable, retain authenticated state!
      console.warn('Session restore network/server warning, keeping credentials:', err);
      this._isAuthenticated$.next(true);
    }

    // Safely load background catalogs and menus without risking session termination
    try {
      await Promise.allSettled([
        this.db.refreshAllFromBackend(),
        this.db.refreshAuthorizedMenus()
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
        this.db.setCurrentUser(res.data.user);
        this._isAuthenticated$.next(true);

        // Fetch live server data & menus from database for the authenticated user
        await this.db.refreshAllFromBackend();
        await this.db.refreshAuthorizedMenus();

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
    const users = this.db.getUsers();
    const targetUser = users.find(u => u.id === userId);
    if (targetUser) {
      // Re-login with the target persona to acquire their server JWT & claims
      await this.login(targetUser.username, targetUser.username.toLowerCase() + '123');
      this.toast.info('Role Switched', `Active session switched to: ${targetUser.fullName} (${targetUser.roleName})`);
    }
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.API_URL}/auth/logout`, {}));
    } catch {
      // Ignore network errors on logout
    }

    localStorage.removeItem(this.TOKEN_KEY);
    this.db.clearSession();
    this._isAuthenticated$.next(false);
    this.toast.info('Logged Out', 'You have been safely signed out.');
    this.router.navigate(['/login']);
  }

  hasPermission(menuCode: string, action: PermissionAction = 'view'): boolean {
    return this.db.hasPermission(menuCode, action);
  }

  getMyMenus(): MenuItem[] {
    return this.db.getMyMenuTree();
  }

  async refreshMenuAccess(enforceCurrentRoute = true) {
    await this.db.refreshAuthorizedMenus();
    if (!enforceCurrentRoute) return;
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) route = route.firstChild;
    const code = route.data['permissionCode'] as string | undefined;
    if (code && this.router.url.startsWith('/app/') && !this.router.url.startsWith('/app/dashboard') && !this.db.hasPermission(code, 'view')) {
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
        this.db.setCurrentUser(res.data);
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
