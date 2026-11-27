import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/api_constants.dart';
import '../../models/user_model.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String _baseUrl = ApiConstants.defaultLocalUrl;
  String? _token;
  UserModel? _currentUser;

  String get baseUrl => _baseUrl;
  UserModel? get currentUser => _currentUser;
  bool get isAuthenticated => _token != null && _token!.isNotEmpty;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _baseUrl = prefs.getString(ApiConstants.keyBaseUrl) ?? ApiConstants.defaultLocalUrl;
    _token = prefs.getString(ApiConstants.keyAuthToken);
    
    final username = prefs.getString(ApiConstants.keyUsername);
    final fullName = prefs.getString(ApiConstants.keyFullName);
    final role = prefs.getString(ApiConstants.keyUserRole);

    if (_token != null && username != null) {
      _currentUser = UserModel(
        username: username,
        fullName: fullName ?? username,
        role: role ?? 'Admin',
        token: _token!,
      );
    }
  }

  Future<void> setBaseUrl(String newUrl) async {
    _baseUrl = newUrl.trim();
    if (_baseUrl.endsWith('/')) {
      _baseUrl = _baseUrl.substring(0, _baseUrl.length - 1);
    }
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(ApiConstants.keyBaseUrl, _baseUrl);
  }

  Future<UserModel> login(String username, String password) async {
    final url = Uri.parse('$_baseUrl${ApiConstants.loginEndpoint}');
    
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'username': username.trim(),
        'password': password.trim(),
      }),
    ).timeout(const Duration(seconds: 12));

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final token = data['token'] ?? data['accessToken'] ?? '';
      
      final user = UserModel(
        username: username,
        fullName: data['fullName'] ?? data['name'] ?? username,
        role: data['role'] ?? 'Admin',
        token: token,
        branchId: data['branchId'],
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
      String errorMsg = 'Login failed (${response.statusCode})';
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
