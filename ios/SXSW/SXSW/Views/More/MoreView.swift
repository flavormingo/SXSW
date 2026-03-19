import SwiftUI

struct MoreView: View {
    @Environment(AuthViewModel.self) private var authViewModel

    var body: some View {
        NavigationStack {
            List {
                if authViewModel.isAuthenticated {
                    Section {
                        NavigationLink {
                            ProfileView()
                        } label: {
                            HStack(spacing: 14) {
                                Circle()
                                    .fill(Color(.systemGray5))
                                    .frame(width: 44, height: 44)
                                    .overlay {
                                        Text(authViewModel.currentUser?.name?.prefix(1).uppercased() ?? "?")
                                            .font(.sxswHeadline(18))
                                            .foregroundStyle(.secondary)
                                    }

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(authViewModel.currentUser?.name ?? "Your Profile")
                                        .font(.sxswBodyLarge)
                                    Text(authViewModel.currentUser?.email ?? "")
                                        .font(.sxswDetail)
                                        .foregroundStyle(.secondary)
                                }
                            }
                        }
                    }
                }

                Section {
                    NavigationLink {
                        RecommendationsView()
                    } label: {
                        Label {
                            Text("For You")
                                .font(.sxswBodyDefault)
                        } icon: {
                            Image(systemName: "sparkles")
                        }
                    }
                }

                Section {
                    HStack {
                        Text("Version")
                            .font(.sxswBodyDefault)
                        Spacer()
                        Text(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0")
                            .font(.sxswDetail)
                            .foregroundStyle(.secondary)
                    }

                    if !NetworkMonitor.shared.isConnected {
                        HStack {
                            Image(systemName: "wifi.slash")
                                .foregroundStyle(.orange)
                            Text("Offline Mode")
                                .font(.sxswBodyDefault)
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                if authViewModel.isAuthenticated {
                    Section {
                        Button("Sign Out", role: .destructive) {
                            Task { await authViewModel.logout() }
                        }
                        .font(.sxswBodyDefault)
                    }
                } else if authViewModel.isGuestMode {
                    Section {
                        Button {
                            authViewModel.isGuestMode = false
                        } label: {
                            Text("Sign In / Create Account")
                                .font(.sxswBodyDefault)
                        }
                    }
                }
            }
            .navigationTitle("More")
        }
    }
}
