import 'dart:convert';
import 'dart:async' show TimeoutException;
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/api_constants.dart';
import '../../models/user_model.dart';
import 'dart:io' show Platform;

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String _baseUrl = ApiConstants.initialDefaultUrl;
  String? _token;
  UserModel? _currentUser;

  String get baseUrl => _baseUrl;
  UserModel? get currentUser => _currentUser;
  bool get isAuthenticated => _token != null && _token!.isNotEmpty;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    String? savedUrl = prefs.getString(ApiConstants.keyBaseUrl);

    // Auto-correct obsolete or unreachable saved URLs
    if (savedUrl != null) {
      if (savedUrl.contains('storm-injection-courier-parent')) {
        savedUrl = ApiConstants.defaultTunnelUrl;
        await prefs.setString(ApiConstants.keyBaseUrl, savedUrl);
      } else if (savedUrl.contains('10.0.2.2')) {
        savedUrl = ApiConstants.initialDefaultUrl;
        await prefs.setString(ApiConstants.keyBaseUrl, savedUrl);
      }
    }

    _baseUrl = savedUrl ?? ApiConstants.initialDefaultUrl;
    _token = prefs.getString(ApiConstants.keyAuthToken);

    final username = prefs.getString(ApiConstants.keyUsername);
    final fullName = prefs.getString(ApiConstants.keyFullName);
    final role = prefs.getString(ApiConstants.keyUserRole);

    if (_token != null && username != null) {
      _currentUser = UserModel(
        username: username,
        fullName: fullName ?? username,
        role: role ?? 'Super Admin',
        token: _token!,
      );
    }
  }

  Future<void> setBaseUrl(String newUrl) async {
    String cleaned = newUrl.trim();
    if (cleaned.endsWith('/')) {
      cleaned = cleaned.substring(0, cleaned.length - 1);
    }
    // Automatically ensure /api/v1 is present
    if (!cleaned.endsWith('/api/v1')) {
      cleaned = '$cleaned/api/v1';
    }

    _baseUrl = cleaned;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(ApiConstants.keyBaseUrl, _baseUrl);
  }

  Future<Map<String, dynamic>> checkServerHealth([String? testUrl]) async {
    String target = (testUrl ?? _baseUrl).trim();
    if (target.endsWith('/')) {
      target = target.substring(0, target.length - 1);
    }
    String healthUrl = target;
    if (healthUrl.endsWith('/api/v1')) {
      healthUrl = healthUrl.substring(0, healthUrl.length - 7);
    }
    healthUrl = '$healthUrl/health';

    final stopwatch = Stopwatch()..start();
    try {
      final res = await http.get(Uri.parse(healthUrl)).timeout(const Duration(seconds: 5));
      stopwatch.stop();
      if (res.statusCode == 200) {
        return {'healthy': true, 'latency': stopwatch.elapsedMilliseconds};
      }
      return {'healthy': false, 'error': 'Status ${res.statusCode}'};
    } catch (e) {
      stopwatch.stop();
      return {'healthy': false, 'error': e.toString()};
    }
  }

  Future<UserModel> login(String username, String password) async {
    final url = Uri.parse('$_baseUrl${ApiConstants.loginEndpoint}');

    http.Response response;
    try {
      response = await http
          .post(
            url,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'username': username.trim(),
              'password': password.trim(),
            }),
          )
          .timeout(const Duration(seconds: 12));
    } on TimeoutException {
      throw Exception('Connection timed out connecting to $_baseUrl. Tap "Configure Server" below to switch to Cloudflare Tunnel or Local PC.');
    } catch (e) {
      if (e.toString().contains('Failed host lookup') || e.toString().contains('Connection refused') || e.toString().contains('SocketException')) {
        throw Exception('Cannot reach server at $_baseUrl. Check your connection or tap "Configure Server".');
      }
      rethrow;
    }

    if (response.statusCode == 200) {
      final dynamic rootJson = jsonDecode(response.body);
      final Map<String, dynamic> data = rootJson is Map<String, dynamic>
          ? (rootJson['data'] is Map<String, dynamic> ? rootJson['data'] : rootJson)
          : <String, dynamic>{};

      final String token = data['accessToken'] ?? data['token'] ?? '';
      final Map<String, dynamic> userMap = data['user'] is Map<String, dynamic>
          ? data['user']
          : data;

      final user = UserModel(
        username: userMap['username'] ?? username,
        fullName: userMap['fullName'] ?? userMap['name'] ?? username,
        role: userMap['roleName'] ?? userMap['role'] ?? 'Super Admin',
        token: token,
        branchId: userMap['branchId'],
      );

      _token = token;
      _currentUser = user;

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(ApiConstants.keyAuthToken, token);
      await prefs.setString(ApiConstants.keyUsername, user.username);
      await prefs.setString(ApiConstants.keyFullName, user.fullName);
      await prefs.setString(ApiConstants.keyUserRole, user.role);

      return user;
    } else {
      String errorMsg = 'Invalid credentials or login failed (${response.statusCode})';
      try {
        final err = jsonDecode(response.body);
        if (err['message'] != null) errorMsg = err['message'];
      } catch (_) {}
      throw Exception(errorMsg);
    }
  }

  Future<void> logout() async {
    _token = null;
    _currentUser = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(ApiConstants.keyAuthToken);
    await prefs.remove(ApiConstants.keyUsername);
    await prefs.remove(ApiConstants.keyFullName);
    await prefs.remove(ApiConstants.keyUserRole);
  }

  Map<String, String> _headers() {
    final headers = {'Content-Type': 'application/json'};
    if (_token != null && _token!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $_token';
    }
    return headers;
  }

  Future<dynamic> get(String endpoint) async {
    final url = Uri.parse('$_baseUrl$endpoint');
    final response = await http.get(url, headers: _headers()).timeout(const Duration(seconds: 15));
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('API error: ${response.statusCode}');
    }
  }

  Future<dynamic> post(String endpoint, Map<String, dynamic> body) async {
    final url = Uri.parse('$_baseUrl$endpoint');
    final response = await http.post(
      url,
      headers: _headers(),
      body: jsonEncode(body),
    ).timeout(const Duration(seconds: 15));
    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception('API error: ${response.statusCode}');
    }
  }
}
