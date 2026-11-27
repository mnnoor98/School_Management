import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';
import '../core/services/api_service.dart';
import '../core/constants/api_constants.dart';
import 'dashboard_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController(text: 'admin');
  final _passwordController = TextEditingController(text: 'admin123');

  bool _obscurePassword = true;
  bool _isLoading = false;
  bool _rememberMe = true;
  String? _errorMessage;

  // Selected Portal Role: 0 = Admin, 1 = Teacher, 2 = Parent
  int _selectedRoleIndex = 0;
  final List<Map<String, dynamic>> _roles = [
    {'name': 'Admin', 'icon': Icons.admin_panel_settings_rounded, 'user': 'admin', 'pass': 'admin123'},
    {'name': 'Teacher', 'icon': Icons.school_rounded, 'user': 'teacher1', 'pass': 'teacher123'},
    {'name': 'Parent', 'icon': Icons.family_restroom_rounded, 'user': 'parent1', 'pass': 'parent123'},
  ];

  // Server Health Status
  bool _isCheckingHealth = false;
  bool _isServerOnline = false;
  int _serverLatency = 0;

  @override
  void initState() {
    super.initState();
    _checkServerStatus();
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _checkServerStatus() async {
    if (!mounted) return;
    setState(() => _isCheckingHealth = true);

    final res = await ApiService().checkServerHealth();
    if (!mounted) return;

    setState(() {
      _isCheckingHealth = false;
      _isServerOnline = res['healthy'] == true;
      _serverLatency = res['latency'] ?? 0;
    });
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final user = await ApiService().login(
        _usernameController.text,
        _passwordController.text,
      );

      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => DashboardScreen(user: user)),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _selectRole(int index) {
    setState(() {
      _selectedRoleIndex = index;
      _usernameController.text = _roles[index]['user'];
      _passwordController.text = _roles[index]['pass'];
      _errorMessage = null;
    });
  }

  void _showServerSettingsDialog() {
    final urlController = TextEditingController(text: ApiService().baseUrl);
    bool isTesting = false;
    String? testResult;
    bool? testSuccess;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) {
          return AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: const Row(
              children: [
                Icon(Icons.dns_rounded, color: AppTheme.primaryNavy),
                SizedBox(width: 10),
                Text('Server Configuration', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ],
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Specify the backend ERP API endpoint URL:',
                    style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: urlController,
                    decoration: InputDecoration(
                      labelText: 'API Base URL',
                      prefixIcon: const Icon(Icons.link_rounded),
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () => urlController.clear(),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Connection Test Status
                  if (testResult != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: (testSuccess == true ? AppTheme.successGreen : AppTheme.errorRed).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: (testSuccess == true ? AppTheme.successGreen : AppTheme.errorRed).withOpacity(0.3),
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            testSuccess == true ? Icons.check_circle_rounded : Icons.error_rounded,
                            size: 18,
                            color: testSuccess == true ? AppTheme.successGreen : AppTheme.errorRed,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              testResult!,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: testSuccess == true ? AppTheme.successGreen : AppTheme.errorRed,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                  const Text('Quick Presets:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      ActionChip(
                        avatar: const Icon(Icons.computer_rounded, size: 16),
                        label: const Text('Local PC (127.0.0.1)'),
                        onPressed: () => setDialogState(() => urlController.text = ApiConstants.defaultLocalDesktopUrl),
                      ),
                      ActionChip(
                        avatar: const Icon(Icons.wifi_rounded, size: 16),
                        label: const Text('Wi-Fi LAN (192.168...)'),
                        onPressed: () => setDialogState(() => urlController.text = ApiConstants.defaultLanUrl),
                      ),
                      ActionChip(
                        avatar: const Icon(Icons.phone_android_rounded, size: 16),
                        label: const Text('Emulator (10.0.2.2)'),
                        onPressed: () => setDialogState(() => urlController.text = ApiConstants.defaultAndroidEmulatorUrl),
                      ),
                      ActionChip(
                        avatar: const Icon(Icons.cloud_outlined, size: 16),
                        label: const Text('Cloudflare Tunnel'),
                        onPressed: () => setDialogState(() => urlController.text = ApiConstants.defaultTunnelUrl),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Test Button
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: isTesting
                          ? null
                          : () async {
                              setDialogState(() {
                                isTesting = true;
                                testResult = 'Pinging server...';
                                testSuccess = null;
                              });
                              final res = await ApiService().checkServerHealth(urlController.text);
                              setDialogState(() {
                                isTesting = false;
                                if (res['healthy'] == true) {
                                  testSuccess = true;
                                  testResult = 'Connected! Latency: ${res['latency']} ms (200 OK)';
                                } else {
                                  testSuccess = false;
                                  testResult = 'Connection failed: ${res['error'] ?? 'Unreachable'}';
                                }
                              });
                            },
                      icon: isTesting
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.speed_rounded, size: 18),
                      label: Text(isTesting ? 'Testing Connection...' : 'Test Connection'),
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: () async {
                  final scaffold = ScaffoldMessenger.of(context);
                  final nav = Navigator.of(ctx);
                  await ApiService().setBaseUrl(urlController.text);
                  nav.pop();
                  _checkServerStatus();
                  scaffold.showSnackBar(
                    SnackBar(
                      content: Text('Server endpoint set to: ${ApiService().baseUrl}'),
                      backgroundColor: AppTheme.primaryNavy,
                    ),
                  );
                },
                child: const Text('Save & Apply'),
              ),
            ],
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Institutional Header Badge
                    Center(
                      child: Container(
                        width: 84,
                        height: 84,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [AppTheme.primaryNavy, Color(0xFF1E40AF)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.primaryNavy.withOpacity(0.35),
                              blurRadius: 20,
                              offset: const Offset(0, 10),
                            ),
                          ],
                          border: Border.all(color: Colors.white.withOpacity(0.3), width: 1.5),
                        ),
                        child: const Icon(
                          Icons.school_rounded,
                          size: 46,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),

                    // Institution Titles
                    const Text(
                      'Scholars International Academy',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F172A),
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Institutional ERP & Academic Management Portal',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF64748B),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Main Card Container
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                        ],
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Role Selector Pills
                          const Text(
                            'Select Portal Access:',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF475569)),
                          ),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Row(
                              children: List.generate(_roles.length, (index) {
                                final isSelected = _selectedRoleIndex == index;
                                final role = _roles[index];
                                return Expanded(
                                  child: GestureDetector(
                                    onTap: () => _selectRole(index),
                                    child: AnimatedContainer(
                                      duration: const Duration(milliseconds: 200),
                                      padding: const EdgeInsets.symmetric(vertical: 8),
                                      decoration: BoxDecoration(
                                        color: isSelected ? Colors.white : Colors.transparent,
                                        borderRadius: BorderRadius.circular(10),
                                        boxShadow: isSelected
                                            ? [
                                                BoxShadow(
                                                  color: Colors.black.withOpacity(0.08),
                                                  blurRadius: 8,
                                                  offset: const Offset(0, 2),
                                                ),
                                              ]
                                            : null,
                                      ),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(
                                            role['icon'] as IconData,
                                            size: 16,
                                            color: isSelected ? AppTheme.primaryNavy : const Color(0xFF64748B),
                                          ),
                                          const SizedBox(width: 6),
                                          Text(
                                            role['name'] as String,
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                              color: isSelected ? AppTheme.primaryNavy : const Color(0xFF64748B),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                );
                              }),
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Error Message Box
                          if (_errorMessage != null)
                            Container(
                              padding: const EdgeInsets.all(12),
                              margin: const EdgeInsets.only(bottom: 16),
                              decoration: BoxDecoration(
                                color: AppTheme.errorRed.withOpacity(0.08),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: AppTheme.errorRed.withOpacity(0.3)),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Icon(Icons.error_outline_rounded, color: AppTheme.errorRed, size: 20),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          _errorMessage!,
                                          style: const TextStyle(
                                            color: AppTheme.errorRed,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w500,
                                            height: 1.3,
                                          ),
                                        ),
                                        if (_errorMessage!.contains('Timeout') || _errorMessage!.contains('failed'))
                                          Padding(
                                            padding: const EdgeInsets.only(top: 6),
                                            child: InkWell(
                                              onTap: _showServerSettingsDialog,
                                              child: const Text(
                                                'Tap here to check Server Connection settings →',
                                                style: TextStyle(
                                                  color: AppTheme.primaryNavy,
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.bold,
                                                  decoration: TextDecoration.underline,
                                                ),
                                              ),
                                            ),
                                          ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),

                          // Username Field
                          TextFormField(
                            controller: _usernameController,
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                            decoration: InputDecoration(
                              labelText: 'Username or Campus Email',
                              hintText: 'e.g. admin or teacher1',
                              prefixIcon: const Icon(Icons.person_outline_rounded, color: AppTheme.primaryNavy),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                            ),
                            validator: (v) => v == null || v.trim().isEmpty ? 'Please enter username' : null,
                          ),
                          const SizedBox(height: 16),

                          // Password Field
                          TextFormField(
                            controller: _passwordController,
                            obscureText: _obscurePassword,
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                            decoration: InputDecoration(
                              labelText: 'Password',
                              hintText: '••••••••',
                              prefixIcon: const Icon(Icons.lock_outline_rounded, color: AppTheme.primaryNavy),
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                  color: const Color(0xFF94A3B8),
                                  size: 20,
                                ),
                                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                              ),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                            ),
                            validator: (v) => v == null || v.trim().isEmpty ? 'Please enter password' : null,
                          ),
                          const SizedBox(height: 12),

                          // Remember Me & Forgot Password Row
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  SizedBox(
                                    width: 22,
                                    height: 22,
                                    child: Checkbox(
                                      value: _rememberMe,
                                      activeColor: AppTheme.primaryNavy,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                                      onChanged: (v) => setState(() => _rememberMe = v ?? true),
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  const Text('Remember me', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                                ],
                              ),
                              TextButton(
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Please contact school admin to reset password.')),
                                  );
                                },
                                child: const Text(
                                  'Forgot password?',
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.secondaryBlue),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 18),

                          // Submit Button with Gradient
                          Container(
                            height: 50,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [AppTheme.primaryNavy, Color(0xFF2563EB)],
                                begin: Alignment.centerLeft,
                                end: Alignment.centerRight,
                              ),
                              borderRadius: BorderRadius.circular(14),
                              boxShadow: [
                                BoxShadow(
                                  color: AppTheme.primaryNavy.withOpacity(0.3),
                                  blurRadius: 14,
                                  offset: const Offset(0, 6),
                                ),
                              ],
                            ),
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.transparent,
                                shadowColor: Colors.transparent,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              ),
                              onPressed: _isLoading ? null : _handleLogin,
                              child: _isLoading
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                                    )
                                  : const Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          'Sign In to Campus',
                                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                                        ),
                                        SizedBox(width: 8),
                                        Icon(Icons.arrow_forward_rounded, size: 18, color: Colors.white),
                                      ],
                                    ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Smart Server Status Bar (Clickable)
                    Center(
                      child: InkWell(
                        onTap: _showServerSettingsDialog,
                        borderRadius: BorderRadius.circular(20),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.03),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (_isCheckingHealth)
                                const SizedBox(
                                  width: 12,
                                  height: 12,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.secondaryBlue),
                                )
                              else
                                Container(
                                  width: 8,
                                  height: 8,
                                  decoration: BoxDecoration(
                                    color: _isServerOnline ? AppTheme.successGreen : AppTheme.errorRed,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              const SizedBox(width: 8),
                              Text(
                                _isServerOnline
                                    ? 'Server Online (${_serverLatency}ms) • ${ApiService().baseUrl.replaceAll('http://', '').replaceAll('/api/v1', '')}'
                                    : 'Server Offline • Tap to Configure',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: _isServerOnline ? const Color(0xFF334155) : AppTheme.errorRed,
                                ),
                              ),
                              const SizedBox(width: 6),
                              const Icon(Icons.settings_outlined, size: 14, color: Color(0xFF94A3B8)),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Scholars International Academy ERP v1.0 • Powered by Clean Architecture',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
