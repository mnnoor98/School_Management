class UserModel {
  final String username;
  final String fullName;
  final String role;
  final String token;
  final String? branchId;

  UserModel({
    required this.username,
    required this.fullName,
    required this.role,
    required this.token,
    this.branchId,
  });

  factory UserModel.fromJson(Map<String, dynamic> json, String token) {
    return UserModel(
      username: json['username'] ?? json['email'] ?? 'User',
      fullName: json['fullName'] ?? json['name'] ?? json['username'] ?? 'User',
      role: json['role'] ?? 'Admin',
      token: token,
      branchId: json['branchId'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'username': username,
      'fullName': fullName,
      'role': role,
      'token': token,
      'branchId': branchId,
    };
  }
}
