import 'package:flutter_test/flutter_test.dart';
import 'package:school_management_mobile/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const SchoolManagementApp());
    expect(find.byType(SchoolManagementApp), findsOneWidget);
  });
}
