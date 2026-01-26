import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile/screens/receipt_form_screen.dart';
import 'package:mobile/services/api_service.dart';

class CameraScreen extends StatefulWidget {
  const CameraScreen({super.key});

  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> {
  final ImagePicker _picker = ImagePicker();
  final ApiService _api = ApiService();
  File? _image;
  bool _isProcessing = false;

  Future<void> _takePhoto() async {
    final XFile? photo = await _picker.pickImage(source: ImageSource.camera);
    if (photo != null) {
      setState(() => _image = File(photo.path));
    }
  }

  Future<void> _pickGallery() async {
    final XFile? photo = await _picker.pickImage(source: ImageSource.gallery);
    if (photo != null) {
      setState(() => _image = File(photo.path));
    }
  }
  
  Future<void> _upload() async {
      if (_image == null) return;
      setState(() => _isProcessing = true);
      
      try {
          final data = await _api.uploadReceipt(_image!);
          if (!mounted) return;
          // Navigate to Form with data
          Navigator.pushReplacement(context, MaterialPageRoute(builder: (ctx) => ReceiptFormScreen(initialData: data)));
      } catch (e) {
          setState(() => _isProcessing = false);
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
            Column(
                children: [
                    // Header
                    Container(
                        padding: const EdgeInsets.only(top: 50, bottom: 20),
                        width: double.infinity,
                        color: Colors.blue,
                        alignment: Alignment.center,
                        child: const Text('Camera Upload', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    ),
                    Expanded(
                        child: _image == null 
                         ? Center(
                             child: Column(
                                 mainAxisAlignment: MainAxisAlignment.center,
                                 children: [
                                     const Icon(Icons.image_not_supported, size: 80, color: Colors.white24),
                                     const SizedBox(height: 20),
                                     const Text('No image selected', style: TextStyle(color: Colors.white54)),
                                 ]
                             )
                         )
                         : Image.file(_image!, fit: BoxFit.contain)
                    ),
                    // Controls
                    Container(
                        height: 200,
                        padding: const EdgeInsets.all(30),
                        decoration: const BoxDecoration(
                            color: Color(0xFF1E293B),
                            borderRadius: BorderRadius.vertical(top: Radius.circular(30))
                        ),
                        child: Column(
                            children: [
                                if (_image == null) ...[
                                    ListTile(
                                        leading: const Icon(Icons.camera_alt, color: Colors.blue),
                                        title: const Text('Take Photo', style: TextStyle(fontWeight: FontWeight.bold)),
                                        onTap: _takePhoto,
                                    ),
                                    ListTile(
                                        leading: const Icon(Icons.photo_library, color: Colors.purple),
                                        title: const Text('Choose from Gallery', style: TextStyle(fontWeight: FontWeight.bold)),
                                        onTap: _pickGallery,
                                    ),
                                ] else ...[
                                    const Text('Image Captured!', style: TextStyle(color: Colors.greenAccent)),
                                    const SizedBox(height: 20),
                                    SizedBox(
                                        width: double.infinity, 
                                        height: 50,
                                        child: ElevatedButton(
                                            style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
                                            onPressed: _isProcessing ? null : _upload,
                                            child: _isProcessing 
                                             ? const CircularProgressIndicator(color: Colors.white)
                                             : const Text('Next: Analyze', style: TextStyle(color: Colors.white))
                                        )
                                    ),
                                    TextButton(
                                        onPressed: () => setState(() => _image = null),
                                        child: const Text('Retake', style: TextStyle(color: Colors.white54))
                                    )
                                ]
                            ]
                        )
                    )
                ]
            ),
             Positioned(top: 50, left: 10, child: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => Navigator.pop(context))),
        ],
      ),
    );
  }
}
