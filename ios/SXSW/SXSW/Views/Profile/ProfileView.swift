import SwiftUI

struct ProfileView: View {
    @Environment(AuthViewModel.self) private var authViewModel
    @State private var viewModel = ProfileViewModel()
    @State private var networkMonitor = NetworkMonitor.shared

    var body: some View {
        NavigationStack {
            List {
                // User info
                if let user = viewModel.user {
                    Section {
                        HStack(spacing: 16) {
                            if let avatarUrl = user.avatarUrl, let url = URL(string: avatarUrl) {
                                AsyncImage(url: url) { image in
                                    image.resizable()
                                        .aspectRatio(contentMode: .fill)
                                } placeholder: {
                                    Circle().fill(.quaternary)
                                }
                                .frame(width: 60, height: 60)
                                .clipShape(Circle())
                            } else {
                                Image(systemName: "person.circle.fill")
                                    .font(.system(size: 60))
                                    .foregroundStyle(.quaternary)
                            }

                            VStack(alignment: .leading, spacing: 4) {
                                Text(user.name ?? "SXSW Attendee")
                                    .font(.headline)
                                Text(user.email)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }

                // Notifications
                Section("Notifications") {
                    Toggle("Push Notifications", isOn: Binding(
                        get: { viewModel.notificationsEnabled },
                        set: { enabled in
                            if enabled {
                                Task { await viewModel.requestNotificationPermission() }
                            }
                        }
                    ))
                }

                // App info
                Section("App") {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text(viewModel.appVersion)
                            .foregroundStyle(.secondary)
                    }

                    HStack {
                        Text("Network")
                        Spacer()
                        HStack(spacing: 6) {
                            Circle()
                                .fill(networkMonitor.isConnected ? .green : .red)
                                .frame(width: 8, height: 8)
                            Text(networkMonitor.isConnected ? "Online" : "Offline")
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                // Sign out
                Section {
                    Button(role: .destructive) {
                        Task { await authViewModel.logout() }
                    } label: {
                        HStack {
                            Spacer()
                            Text("Sign Out")
                            Spacer()
                        }
                    }
                }
            }
            .navigationTitle("Profile")
            .refreshable {
                await viewModel.loadProfile()
            }
            .task {
                await viewModel.loadProfile()
            }
        }
    }
}

#Preview {
    ProfileView()
        .environment(AuthViewModel())
}
