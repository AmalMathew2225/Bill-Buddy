import 'package:flutter/material.dart';

import 'package:mobile/screens/dashboard_screen.dart';

void main() {
  runApp(const BillBuddyApp());
}

class BillBuddyApp extends StatelessWidget {
  const BillBuddyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Bill Buddy',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F172A), // Dark Slate
        primaryColor: const Color(0xFF3B82F6), // Bright Blue
        cardColor: const Color(0xFF1E293B), // Card BG
        appBarTheme: const AppBarTheme(
            backgroundColor: Color(0xFF3B82F6),
            foregroundColor: Colors.white,
            elevation: 0,
            centerTitle: true,
        ),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF3B82F6),
          secondary: Color(0xFF10B981), // Emerald Green
          surface: Color(0xFF1E293B),
          background: Color(0xFF0F172A),
          onSurface: Colors.white,
        ),
        useMaterial3: true,
        fontFamily: 'Roboto', // Default, but ensures clarity
      ),
      home: const DashboardScreen(),
    );
  }
}
