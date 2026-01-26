import 'package:flutter/material.dart';
import 'package:mobile/screens/camera_screen.dart';
import 'package:mobile/screens/chat_screen.dart';
import 'package:mobile/screens/receipt_form_screen.dart';
import 'package:mobile/screens/wallet_creator_screen.dart';
import 'package:mobile/services/api_service.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiService _api = ApiService();
  // Mocking "Clean Messages" as Receipts for parity
  List<Map<String, dynamic>> _recents = []; 
  
  double get _totalMonth => _recents.fold(0, (sum, item) => sum + (double.tryParse(item['total'].toString()) ?? 0));
  int get _cleanMessagesCount => _recents.length * 12 + 45; // Mock number to look like "634" in demo

  void _navigate (Widget screen) {
      Navigator.push(context, MaterialPageRoute(builder: (ctx) => screen));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          // Blue Header Section (Message Analytics Style)
          Container(
            padding: const EdgeInsets.only(top: 50, bottom: 20, left: 20, right: 20),
            color: Theme.of(context).primaryColor,
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(icon: const Icon(Icons.menu), onPressed: () {}),
                    const Text('Message Analytics', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    IconButton(
                        icon: const Icon(Icons.chat_bubble_outline), 
                        onPressed: () => _navigate(const ChatScreen())
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                // Analytics Card
                Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white30)
                    ),
                    child: Column(
                        children: [
                            const Text('Total Clean Messages', style: TextStyle(color: Colors.white70)),
                            const SizedBox(height: 5),
                            Text('$_cleanMessagesCount', style: const TextStyle(fontSize: 48, fontWeight: FontWeight.bold, color: Colors.white)),
                            const Text('eBills: 31', style: TextStyle(color: Colors.white54)),
                            const SizedBox(height: 15),
                            const Text('Last 7 Days: 25 Messages', style: TextStyle(color: Colors.white38, fontSize: 12)),
                        ]
                    )
                )
              ],
            ),
          ),
          
          // Filters
          Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                      _FilterChip('Today', false),
                      _FilterChip('7 Days', true), // Active
                      _FilterChip('30 Days', false),
                  ]
              )
          ),

          // Content List
          Expanded(
            child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                    const Text('Analysis Period', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 10),
                    _StatCard('eBills (31)', Colors.green, Icons.receipt_long, () {}),
                    _StatCard('Links Extracted', Colors.blue, Icons.link, () {}),
                    
                    const SizedBox(height: 20),
                    const Text('Recent Actions', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                    _ActionCard('Upload Receipt', Icons.camera_alt, () => _navigate(const CameraScreen())),
                    _ActionCard('Create Wallet Pass', Icons.wallet, () => _navigate(const WalletCreatorScreen())),
                ]
            )
          )
        ],
      ),
    );
  }
  
  Widget _FilterChip(String label, bool isActive) {
      return Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          decoration: BoxDecoration(
              color: isActive ? Colors.blue : Colors.white10,
              borderRadius: BorderRadius.circular(20),
          ),
          child: Text(label, style: TextStyle(color: isActive ? Colors.white : Colors.grey)),
      );
  }
  
  Widget _StatCard(String title, Color color, IconData icon, VoidCallback onTap) {
      return Container(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
              tileColor: const Color(0xFF1E293B),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: color.withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
                  child: Icon(icon, color: color),
              ),
              title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
              trailing: const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
              onTap: onTap,
          )
      );
  }

  Widget _ActionCard(String title, IconData icon, VoidCallback onTap) {
      return Container(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
              tileColor: const Color(0xFF1E293B),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              leading: Icon(icon, color: Colors.white70),
              title: Text(title),
              onTap: onTap,
          )
      );
  }
}
