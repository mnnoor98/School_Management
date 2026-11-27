import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';

class NoticesScreen extends StatelessWidget {
  const NoticesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Campus Circulars & Notices'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildNoticeItem(
            date: 'Nov 26, 2026',
            priority: 'Important',
            title: 'Schedule for Final Term Examinations 2026',
            content:
                'The Final Term Examination for all grades (Play to Grade 10) will commence from December 08, 2026. The detailed datesheet and admit cards are available for download.',
            isUrgent: true,
          ),
          _buildNoticeItem(
            date: 'Nov 20, 2026',
            priority: 'Event',
            title: 'Annual Science Fair & Cultural Gala 2026',
            content:
                'All students interested in participating in project exhibitions and cultural performances are requested to register with their respective class teachers by November 30.',
            isUrgent: false,
          ),
          _buildNoticeItem(
            date: 'Nov 12, 2026',
            priority: 'Holiday',
            title: 'Campus Winter Dress Code & Timing Update',
            content:
                'Starting December 01, the school morning assembly will begin at 08:30 AM instead of 08:00 AM due to the winter schedule. Please ensure students wear designated navy blue sweaters/blazers.',
            isUrgent: false,
          ),
        ],
      ),
    );
  }

  Widget _buildNoticeItem({
    required String date,
    required String priority,
    required String title,
    required String content,
    required bool isUrgent,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isUrgent ? AppTheme.accentGold.withOpacity(0.5) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(date, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: isUrgent ? AppTheme.accentGold.withOpacity(0.15) : const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  priority,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: isUrgent ? AppTheme.accentGold : AppTheme.textDark,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.textDark)),
          const SizedBox(height: 6),
          Text(content, style: const TextStyle(fontSize: 13, color: Color(0xFF475569), height: 1.4)),
        ],
      ),
    );
  }
}
