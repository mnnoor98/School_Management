import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';

class FeesScreen extends StatelessWidget {
  const FeesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('School Fees & Accounts'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Total Balance Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF047857), Color(0xFF10B981)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Fee Balance Status', style: TextStyle(color: Colors.white70, fontSize: 13)),
                  SizedBox(height: 6),
                  Text('৳ 0.00 Due', style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.bold)),
                  SizedBox(height: 6),
                  Text('All scheduled tuition & exam vouchers are fully paid.', style: TextStyle(color: Colors.white, fontSize: 12)),
                ],
              ),
            ),
            const SizedBox(height: 24),

            const Text(
              'Fee Vouchers & Payment History',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textDark),
            ),
            const SizedBox(height: 12),

            _buildVoucherCard(
              context,
              voucherNo: 'VCH-2026-1104',
              title: 'Monthly Tuition & Facility Fee (November 2026)',
              amount: '৳ 3,500',
              status: 'Paid',
              date: 'Paid on: Nov 10, 2026',
              statusColor: AppTheme.successGreen,
            ),
            _buildVoucherCard(
              context,
              voucherNo: 'VCH-2026-1012',
              title: 'Terminal Examination & Lab Fee',
              amount: '৳ 1,800',
              status: 'Paid',
              date: 'Paid on: Oct 15, 2026',
              statusColor: AppTheme.successGreen,
            ),
            _buildVoucherCard(
              context,
              voucherNo: 'VCH-2026-0902',
              title: 'Monthly Tuition & Transport Fee (September 2026)',
              amount: '৳ 4,200',
              status: 'Paid',
              date: 'Paid on: Sep 08, 2026',
              statusColor: AppTheme.successGreen,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVoucherCard(
    BuildContext context, {
    required String voucherNo,
    required String title,
    required String amount,
    required String status,
    required String date,
    required Color statusColor,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(voucherNo, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textMuted)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  status,
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: statusColor),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.textDark)),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(date, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
              Text(amount, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primaryNavy)),
            ],
          ),
          const Divider(height: 18),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.primaryNavy,
                side: const BorderSide(color: Color(0xFFCBD5E1)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Downloading Money Receipt for $voucherNo...')),
                );
              },
              icon: const Icon(Icons.download_rounded, size: 16),
              label: const Text('Download Money Receipt (PDF)', style: TextStyle(fontSize: 12)),
            ),
          ),
        ],
      ),
    );
  }
}
