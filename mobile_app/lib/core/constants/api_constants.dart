class ApiConstants {
  // Default base URL (Can be changed in app settings)
  static const String defaultLocalUrl = 'http://10.0.2.2:5000/api/v1'; // Android Emulator
  static const String defaultLanUrl = 'http://192.168.0.106:5000/api/v1'; // Local Wi-Fi
  static const String defaultTunnelUrl = 'https://amounts-josh-haven-strikes.trycloudflare.com/api/v1';

  // Storage keys
  static const String keyBaseUrl = 'sp_base_url';
  static const String keyAuthToken = 'sp_auth_token';
  static const String keyUserRole = 'sp_user_role';
  static const String keyUsername = 'sp_username';
  static const String keyFullName = 'sp_fullname';

  // API Endpoints
  static const String loginEndpoint = '/auth/login';
  static const String profileEndpoint = '/auth/me';
  static const String studentsEndpoint = '/students';
  static const String attendanceEndpoint = '/attendance';
  static const String feeVouchersEndpoint = '/feevouchers';
  static const String noticesEndpoint = '/notices';
}
