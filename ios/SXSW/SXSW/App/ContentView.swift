import SwiftUI

struct ContentView: View {
    @Environment(AuthViewModel.self) private var authViewModel

    var body: some View {
        Group {
            if authViewModel.shouldShowMainApp {
                MainTabView()
            } else {
                LoginView()
            }
        }
        .task {
            await authViewModel.checkSession()
        }
    }
}

// MARK: - Main Tab View

struct MainTabView: View {
    @Environment(AuthViewModel.self) private var authViewModel
    @State private var selectedTab = 0

    var body: some View {
        ZStack(alignment: .bottom) {
            // Content
            Group {
                switch selectedTab {
                case 0: HomeView(selectedTab: $selectedTab)
                case 1: ExploreView()
                case 2: ScheduleView()
                case 3: RecommendationsView()
                case 4: MoreView()
                default: HomeView(selectedTab: $selectedTab)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            // Pad bottom so content doesn't hide behind floating tab bar
            .padding(.bottom, 70)

            // Floating tab bar
            CustomTabBar(selectedTab: $selectedTab)
                .padding(.horizontal, 12)
                .padding(.bottom, 2)
        }
        .ignoresSafeArea(.keyboard)
        .background(Color(.systemGroupedBackground))
        .onReceive(NotificationCenter.default.publisher(for: .navigateToEvent)) { notification in
            if notification.userInfo?["eventId"] != nil {
                selectedTab = 1
            }
        }
    }
}

// MARK: - Custom Floating Tab Bar

struct CustomTabBar: View {
    @Binding var selectedTab: Int

    private let tabs: [(label: String, icon: String)] = [
        ("HOME", "house.fill"),
        ("EXPLORE", "magnifyingglass"),
        ("SCHEDULE", "calendar"),
        ("NETWORK", "bubble.left.and.bubble.right.fill"),
        ("MORE", "line.3.horizontal"),
    ]

    private let activeColor = Color(red: 0.35, green: 0.8, blue: 0.5)
    private let inactiveColor = Color.white

    var body: some View {
        HStack(spacing: 0) {
            ForEach(Array(tabs.enumerated()), id: \.offset) { index, tab in
                Button {
                    selectedTab = index
                } label: {
                    VStack(spacing: 3) {
                        Image(systemName: tab.icon)
                            .font(.system(size: 18, weight: .medium))

                        Text(tab.label)
                            .font(.system(size: 9, weight: .bold))
                    }
                    .foregroundStyle(selectedTab == index ? activeColor : inactiveColor)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 4)
        .background(
            RoundedRectangle(cornerRadius: 18)
                .fill(Color(red: 0.13, green: 0.13, blue: 0.14))
        )
    }
}

#Preview {
    ContentView()
        .environment(AuthViewModel())
}
