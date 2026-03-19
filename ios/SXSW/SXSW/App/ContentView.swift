import SwiftUI

struct ContentView: View {
    @Environment(AuthViewModel.self) private var authViewModel

    var body: some View {
        Group {
            switch authViewModel.state {
            case .authenticated:
                MainTabView()
            default:
                LoginView()
            }
        }
        .task {
            await authViewModel.checkSession()
        }
    }
}

struct MainTabView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            Tab("Explore", systemImage: "sparkles", value: 0) {
                ExploreView()
            }

            Tab("Schedule", systemImage: "calendar", value: 1) {
                ScheduleView()
            }

            Tab("Map", systemImage: "map", value: 2) {
                MapView()
            }

            Tab("For You", systemImage: "star", value: 3) {
                RecommendationsView()
            }

            Tab("Profile", systemImage: "person.circle", value: 4) {
                ProfileView()
            }
        }
        .tint(.sxswOrange)
        .onReceive(NotificationCenter.default.publisher(for: .navigateToEvent)) { notification in
            if notification.userInfo?["eventId"] != nil {
                selectedTab = 1
            }
        }
    }
}

#Preview {
    ContentView()
        .environment(AuthViewModel())
}
