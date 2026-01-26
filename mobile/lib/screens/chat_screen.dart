import 'package:flutter/material.dart';
import 'package:mobile/services/api_service.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final List<Message> _messages = [
      Message(text: "Hello! I'm Maya, your Financial Advisor. Ask me anything about your budget!", isUser: false)
  ];
  final _ctrl = TextEditingController();
  final _api = ApiService();
  bool _loading = false;

  Future<void> _send() async {
      if (_ctrl.text.isEmpty) return;
      final text = _ctrl.text;
      _ctrl.clear();
      
      setState(() {
          _messages.add(Message(text: text, isUser: true));
          _loading = true;
      });

      try {
          final reply = await _api.sendChatMessage(text, "User has 31 eBills. Total spending this month: ₹354.00");
          setState(() {
              _messages.add(Message(text: reply, isUser: false));
          });
      } catch (e) {
           setState(() {
              _messages.add(Message(text: "Sorry, I'm having trouble connecting to the brain.", isUser: false));
          });
      } finally {
          setState(() => _loading = false);
      }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(title: const Text('Maya - Advisor')),
        body: Column(
            children: [
                Expanded(
                    child: ListView.builder(
                        padding: const EdgeInsets.all(10),
                        itemCount: _messages.length,
                        itemBuilder: (ctx, i) => _Bubble(_messages[i])
                    )
                ),
                if (_loading) const LinearProgressIndicator(),
                Container(
                    padding: const EdgeInsets.all(10),
                    color: const Color(0xFF1E293B),
                    child: Row(
                        children: [
                            Expanded(child: TextField(controller: _ctrl, decoration: const InputDecoration(hintText: 'Ask Maya...', border: InputBorder.none))),
                            IconButton(icon: const Icon(Icons.send, color: Colors.blue), onPressed: _send)
                        ]
                    )
                )
            ]
        )
    );
  }
}

class _Bubble extends StatelessWidget {
    final Message msg;
    const _Bubble(this.msg);
    
    @override
    Widget build(BuildContext context) {
        return Align(
            alignment: msg.isUser ? Alignment.centerRight : Alignment.centerLeft,
            child: Container(
                margin: const EdgeInsets.symmetric(vertical: 4),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                    color: msg.isUser ? Colors.blue : Colors.white10,
                    borderRadius: BorderRadius.circular(16)
                ),
                constraints: const BoxConstraints(maxWidth: 300),
                child: Text(msg.text, style: const TextStyle(height: 1.4))
            )
        );
    }
}

class Message {
    final String text;
    final bool isUser;
    Message({required this.text, required this.isUser});
}
