import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:mobile/services/api_service.dart';
import 'package:url_launcher/url_launcher.dart';

class ReceiptFormScreen extends StatefulWidget {
  final Map<String, dynamic>? initialData;

  const ReceiptFormScreen({super.key, this.initialData});

  @override
  State<ReceiptFormScreen> createState() => _ReceiptFormScreenState();
}

class _ReceiptFormScreenState extends State<ReceiptFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _api = ApiService();
  
  late TextEditingController _merchantController;
  late TextEditingController _totalController;
  late TextEditingController _dateController;
  late TextEditingController _categoryController;
  
  List<Map<String, dynamic>> _items = [];
  bool _isGeneratingPass = false;

  @override
  void initState() {
    super.initState();
    final data = widget.initialData ?? {};
    _merchantController = TextEditingController(text: data['merchant'] ?? '');
    _totalController = TextEditingController(text: (data['total'] ?? 0).toString());
    _dateController = TextEditingController(text: data['date'] ?? DateFormat('yyyy-MM-dd').format(DateTime.now()));
    _categoryController = TextEditingController(text: data['category'] ?? 'Uncategorized');
    
    if (data['items'] != null) {
        _items = List<Map<String, dynamic>>.from(data['items']);
    }
  }

  void _save() {
    if (_formKey.currentState!.validate()) {
      final receipt = {
        'id': widget.initialData?['id'] ?? DateTime.now().millisecondsSinceEpoch,
        'merchant': _merchantController.text,
        'date': _dateController.text,
        'total': double.tryParse(_totalController.text) ?? 0.0,
        'category': _categoryController.text,
        'items': _items,
      };
      
      Navigator.pop(context, receipt);
    }
  }

  Future<void> _addToWallet() async {
    setState(() => _isGeneratingPass = true);
    
    // Auto-save form data to a temporary object for the API
    final receiptData = {
        'merchant': _merchantController.text,
        'date': _dateController.text,
        'total': double.tryParse(_totalController.text) ?? 0.0,
        'items': _items,
    };

    try {
        final url = await _api.createWalletPass(receiptData);
        final uri = Uri.parse(url);
        if (await canLaunchUrl(uri)) {
            await launchUrl(uri, mode: LaunchMode.externalApplication);
        } else {
            throw 'Could not launch wallet URL';
        }
    } catch (e) {
        if(!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed: $e'), backgroundColor: Colors.red),
        );
    } finally {
        if(mounted) setState(() => _isGeneratingPass = false);
    }
  }

  void _addItem() {
      setState(() {
          _items.add({'name': '', 'price': 0});
      });
  }

  void _removeItem(int index) {
      setState(() {
          _items.removeAt(index);
      });
  }
  
  void _updateItem(int index, String field, dynamic value) {
      setState(() {
          _items[index][field] = value;
          // Auto-calculate total
          if (field == 'price') {
             // Optional: sum up items to update total
          }
      });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.initialData == null ? 'New Receipt' : 'Edit Receipt'),
        actions: [
            TextButton(
                onPressed: _save,
                child: const Text('SAVE', style: TextStyle(color: Colors.blue, fontWeight: FontWeight.bold)),
            )
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Main info card
            Card(
                child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                        children: [
                            TextFormField(
                                controller: _merchantController,
                                decoration: const InputDecoration(labelText: 'Merchant', icon: Icon(Icons.store)),
                                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                                validator: (v) => v!.isEmpty ? 'Required' : null,
                            ),
                            const SizedBox(height: 10),
                            Row(children: [
                                Expanded(
                                    child: TextFormField(
                                        controller: _dateController,
                                        decoration: const InputDecoration(labelText: 'Date', icon: Icon(Icons.calendar_today)),
                                    ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                    child: TextFormField(
                                        controller: _totalController,
                                        decoration: const InputDecoration(labelText: 'Total', icon: Icon(Icons.attach_money)),
                                        keyboardType: TextInputType.number,
                                        style: const TextStyle(color: Colors.greenAccent, fontWeight: FontWeight.bold),
                                    ),
                                ),
                            ]),
                            const SizedBox(height: 10),
                            TextFormField(
                                controller: _categoryController,
                                decoration: const InputDecoration(labelText: 'Category', icon: Icon(Icons.label)),
                            ),
                        ]
                    )
                )
            ),
            
            const SizedBox(height: 20),
            
            Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                     const Text('ITEMS', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold, letterSpacing: 1)),
                     IconButton(icon: const Icon(Icons.add_circle, color: Colors.blue), onPressed: _addItem)
                ]
            ),
            
            // Items List
            ..._items.asMap().entries.map((entry) {
                final i = entry.key;
                final item = entry.value;
                return Card(
                    color: Colors.white.withOpacity(0.05),
                    margin: const EdgeInsets.only(bottom: 8),
                    child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        child: Row(
                            children: [
                                Expanded(flex: 2, child: TextFormField(
                                    initialValue: item['name'],
                                    decoration: const InputDecoration(border: InputBorder.none, hintText: 'Item Name'),
                                    onChanged: (v) => _updateItem(i, 'name', v),
                                )),
                                Expanded(flex: 1, child: TextFormField(
                                    initialValue: (item['price'] ?? 0).toString(),
                                    decoration: const InputDecoration(border: InputBorder.none, prefixText: '₹'),
                                    keyboardType: TextInputType.number,
                                    onChanged: (v) => _updateItem(i, 'price', double.tryParse(v) ?? 0),
                                )),
                                IconButton(
                                    icon: const Icon(Icons.close, color: Colors.red, size: 18),
                                    onPressed: () => _removeItem(i),
                                )
                            ]
                        )
                    )
                );
            }),
            
            const SizedBox(height: 30),
            
            // Wallet Button
            SizedBox(
                height: 50,
                child: ElevatedButton.icon(
                    onPressed: _isGeneratingPass ? null : _addToWallet,
                    icon: _isGeneratingPass 
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) 
                        : const Icon(Icons.wallet, color: Colors.white),
                    label: Text(_isGeneratingPass ? 'Generating Pass...' : 'Add to Google Wallet'),
                    style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black,
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: Colors.white24)
                    ),
                )
            )
          ],
        ),
      ),
    );
  }
}
