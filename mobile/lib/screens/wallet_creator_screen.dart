import 'package:flutter/material.dart';
import 'package:mobile/services/api_service.dart';
import 'package:url_launcher/url_launcher.dart';

class WalletCreatorScreen extends StatefulWidget {
  const WalletCreatorScreen({super.key});

  @override
  State<WalletCreatorScreen> createState() => _WalletCreatorScreenState();
}

class _WalletCreatorScreenState extends State<WalletCreatorScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _headerCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  bool _loading = false;
  final _api = ApiService();

  Future<void> _create() async {
      if(!_formKey.currentState!.validate()) return;
      setState(() => _loading = true);
      
      try {
          // Mock data construction for pass
          final data = {
              'merchant': _titleCtrl.text,
              'date': DateTime.now().toString().split(' ')[0],
              'total': 0, // Generic
              'items': [{'name': _descCtrl.text, 'price': 0}]
          };
          
          final url = await _api.createWalletPass(data);
          final uri = Uri.parse(url);
          if (await canLaunchUrl(uri)) {
             await launchUrl(uri, mode: LaunchMode.externalApplication);
          }
      } catch (e) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      } finally {
          setState(() => _loading = false);
      }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(title: const Text('Create Wallet Pass')),
        body: Form(
            key: _formKey,
            child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                    TextFormField(
                        controller: _titleCtrl,
                        decoration: const InputDecoration(labelText: 'Pass Title (Merchant)', border: OutlineInputBorder()),
                        validator: (v) => v!.isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: 20),
                    TextFormField(
                        controller: _headerCtrl,
                        decoration: const InputDecoration(labelText: 'Header Text', border: OutlineInputBorder()),
                    ),
                    const SizedBox(height: 20),
                    TextFormField(
                        controller: _descCtrl,
                        decoration: const InputDecoration(labelText: 'Description / Items', border: OutlineInputBorder()),
                        maxLines: 3,
                    ),
                    const SizedBox(height: 40),
                    SizedBox(
                        height: 50,
                        child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.black, foregroundColor: Colors.white),
                            onPressed: _loading ? null : _create,
                            icon: const Icon(Icons.wallet),
                            label: Text(_loading ? 'Creating...' : 'Generate Google Wallet Pass')
                        )
                    )
                ]
            )
        )
    );
  }
}
