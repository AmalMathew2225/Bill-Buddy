import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

class ApiService {
  // Use your machine's local IP for physical device
  static const String baseUrl = 'https://v0-new-project-mpiu8no7d5u.vercel.app';

  Future<Map<String, dynamic>> uploadReceipt(File imageFile) async {
    final request = http.MultipartRequest('POST', Uri.parse('$baseUrl/api/process-receipt'));
    request.files.add(await http.MultipartFile.fromPath('file', imageFile.path));

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to upload receipt: ${response.body}');
    }
  }

  Future<String> createWalletPass(Map<String, dynamic> receiptData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/create-wallet-pass'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(receiptData),
    );

    if (response.statusCode == 200) {
      final jsonResponse = json.decode(response.body);
      if (jsonResponse['saveUrl'] != null) {
        return jsonResponse['saveUrl'];
      } else {
        throw Exception('No save URL returned');
      }
    } else {
      throw Exception('Failed to create pass: ${response.body}');
    }
  }

  Future<String> sendChatMessage(String message, String? contextData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/chat'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'message': message,
        'contextData': contextData
      }),
    );

    if (response.statusCode == 200) {
      final jsonResponse = json.decode(response.body);
      return jsonResponse['reply'];
    } else {
      throw Exception('Failed to get response');
    }
  }
}
