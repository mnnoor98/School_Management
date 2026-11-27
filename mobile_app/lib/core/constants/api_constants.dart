import 'package:flutter/foundation.dart';
import 'dart:io' show Platform;

class ApiConstants {
  // Platform-smart default base URLs
  static const String defaultLocalDesktopUrl = 'http://127.0.0.1:5000/api/v1';
  static const String defaultAndroidEmulatorUrl = 'http://10.0.2.2:5000/api/v1';
  static const String defaultLanUrl = 'http://192.168.0.106:5000/api/v1';
  static const String defaultTunnelUrl = 'https://amounts-josh-haven-strikes.trycloudflare.com/api/v1';

  static String get initialDefaultUrl {
    if (kIsWeb) return defaultLocalDesktopUrl;
    try {
      if (Platform.isAndroid) return defaultAndroidEmulatorUrl;
    } catch (_) {}
    return defaultLocalDesktopUrl;
  }

  // Storage keys
  static const String keyBaseUrl = 'sp_base_url';
  static const String keyAuthToken = 'sp_auth_token';
  static const String keyUserRole = 'sp_user_role';
  static const String keyUsername = 'sp_username';
  static const String keyFullName = 'sp_fullname';
  static const String keyRememberMe = 'sp_remember_me';

  // API Endpoints
  static const String loginEndpoint = '/auth/login';
  static const String profileEndpoint = '/auth/me';
  static const String healthEndpoint = '/health';
  static const String studentsEndpoint = '/students';
  static const String attendanceEndpoint = '/attendance';
  static const String feeVouchersEndpoint = '/feevouchers';
  static const String noticesEndpoint = '/notices';
}
