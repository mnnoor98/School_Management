import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'core/services/api_service.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiService().init();
  runApp(const SchoolManagementApp());
}

class SchoolManagementApp extends StatelessWidget {
  const SchoolManagementApp({super.key});

  @override
  Widget build(BuildContext context) {
    final apiService = ApiService();
    final bool isUserLoggedIn = apiService.isAuthenticated && apiService.currentUser != null;

    return MaterialApp(
      title: 'Scholars International Academy',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: isUserLoggedIn
          ? DashboardScreen(user: apiService.currentUser!)
          : const LoginScreen(),
    );
  }
}
