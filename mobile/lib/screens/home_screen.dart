import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile/screens/receipt_form_screen.dart';
import 'package:mobile/services/api_service.dart';
import 'dart:io';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ApiService _api = ApiService();
  final ImagePicker _picker = ImagePicker();
  List<Map<String, dynamic>> _recents = []; // In a real app, use local storage/database

  double get _totalMonth => _recents.fold(0, (sum, item) => sum + (item['total'] ?? 0));

  Future<void> _pickImage() async {
    final XFile? photo = await _picker.pickImage(source: ImageSource.camera);
    if (photo != null) {
      _processReceipt(File(photo.path));
    }
  }

  Future<void> _processReceipt(File file) async {
    // Show loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final data = await _api.uploadReceipt(file);
      Navigator.pop(context); // Hide loading
      
      // Go to Edit/Confirm Screen
      _navigateToForm(data);
    } catch (e) {
      Navigator.pop(context); // Hide loading
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  void _navigateToForm(Map<String, dynamic>? initialData) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (ctx) => ReceiptFormScreen(initialData: initialData),
      ),
    );

    if (result != null) {
        // Save result
       setState(() {
         _recents.insert(0, result);
       });
    }
  }

  void _deleteReceipt(int index) {
      setState(() {
          _recents.removeAt(index);
      });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('BILL BUDDY', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.5)),
        centerTitle: true,
        actions: [
            Padding(
                padding: const EdgeInsets.only(right: 16.0),
                child: Center(
                    child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                            color: Colors.white10,
                            borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                            'AI AGENT', 
                            style: TextStyle(fontSize: 10, color: Colors.blue[300])
                        )
                    )
                ),
            )
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Month Total Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                    colors: [Colors.blue[900]!, Colors.blue[600]!],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 10, offset: Offset(0, 4))]
              ),
              child: Column(
                children: [
                  const Text('Total Month Spending', style: TextStyle(color: Colors.white70)),
                  const SizedBox(height: 8),
                  Text(
                    '₹${_totalMonth.toStringAsFixed(2)}',
                    style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            const Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                    Text('Recents', style: TextStyle(color: Colors.white54, fontSize: 13, letterSpacing: 1, fontWeight: FontWeight.bold)),
                ]
            ),
            
            Expanded(
              child: _recents.isEmpty 
               ? Center(child: Column(
                   mainAxisAlignment: MainAxisAlignment.center,
                   children: [
                       Icon(Icons.receipt_long, size: 48, color: Colors.white24),
                       const SizedBox(height: 16),
                       const Text('No receipts yet', style: TextStyle(color: Colors.white24)),
                   ],
               ))
               : ListView.separated(
                  itemCount: _recents.length,
                  padding: const EdgeInsets.only(top: 16),
                  separatorBuilder: (ctx, i) => const Divider(color: Colors.white10),
                  itemBuilder: (ctx, index) {
                    final item = _recents[index];
                    return Dismissible(
                        key: ValueKey(item['id'] ?? index),
                        direction: DismissDirection.endToStart,
                        background: Container(
                            alignment: Alignment.centerRight,
                            padding: const EdgeInsets.only(right: 20),
                            color: Colors.red,
                            child: const Icon(Icons.delete, color: Colors.white),
                        ),
                        onDismissed: (_) => _deleteReceipt(index),
                        child: ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(item['merchant'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.bold)),
                            subtitle: Text('${item['date']} • ${item['category']}', style: const TextStyle(color: Colors.grey)),
                            trailing: Text(
                                '₹${item['total'].toStringAsFixed(2)}',
                                style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.greenAccent, fontSize: 16)
                            ),
                            onTap: () {
                                // Navigate to edit
                                _navigateToForm(item);
                            },
                        )
                    );
                  },
                ),
            ),
          ],
        ),
      ),
      floatingActionButton: Column(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
              FloatingActionButton(
                  heroTag: 'manual',
                  onPressed: () => _navigateToForm(null),
                  backgroundColor: Colors.white10,
                  child: const Icon(Icons.edit, color: Colors.white),
              ),
              const SizedBox(height: 16),
              FloatingActionButton(
                heroTag: 'camera',
                onPressed: _pickImage,
                backgroundColor: const Color(0xFF3B82F6),
                child: const Icon(Icons.camera_alt, color: Colors.white),
              ),
          ],
      ),
    );
  }
}
