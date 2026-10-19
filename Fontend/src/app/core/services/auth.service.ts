import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
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

  private readonly API_URL = 'http://localhost:5000/api/v1';
  private readonly TOKEN_KEY = 'sms_auth_token';
  private _isAuthenticated$ = new BehaviorSubject<boolean>(this.checkInitialAuth());
  private currentUser$ = new BehaviorSubject<User | null>(this.db.getCurrentUser());

  constructor() {
    this.db.getCurrentUser$().subscribe(u => {
      this.currentUser$.next(u);
    });
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
}
