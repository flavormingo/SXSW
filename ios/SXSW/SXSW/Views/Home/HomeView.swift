import SwiftUI

struct HomeView: View {
    @Environment(AuthViewModel.self) private var authViewModel
    @Binding var selectedTab: Int
    @State private var featuredEvents: [Event] = []

    private var greeting: String {
        if let name = authViewModel.currentUser?.name, !name.isEmpty {
            return "WELCOME \(name.uppercased())"
        } else if authViewModel.isAuthenticated {
            return "WELCOME BACK"
        } else {
            return "WELCOME"
        }
    }

    private let cardRadius: CGFloat = 14

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                // Header — welcome aligned to card text (20pt), avatar flush right (0 padding)
                HStack(alignment: .center) {
                    Text(greeting)
                        .font(.sxswMono(15))
                        .foregroundStyle(.primary)

                    Spacer()

                    Circle()
                        .fill(Color.white)
                        .frame(width: 54, height: 54)
                        .overlay {
                            if let name = authViewModel.currentUser?.name, !name.isEmpty {
                                Text(name.prefix(1).uppercased())
                                    .font(.sxswHeadline(22))
                                    .foregroundStyle(.white)
                            } else {
                                Image(systemName: "person.fill")
                                    .font(.system(size: 22))
                                    .foregroundStyle(Color(.systemGray2))
                            }
                        }
                }
                .padding(.leading, 20)
                .padding(.trailing, 0)
                .padding(.top, 12)
                .padding(.bottom, 0)

                // Cards — full viewport width, no horizontal padding, each individually rounded
                VStack(spacing: 0) {
                    // Hero card (white)
                    heroContent
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color(.systemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: cardRadius))

                    // Colored nav cards
                    NavigationCard(title: "EXPLORE", color: Color(red: 1.0, green: 0.6, blue: 0.45), radius: cardRadius) {
                        selectedTab = 1
                    }

                    NavigationCard(title: "SCHEDULE", color: Color(red: 1.0, green: 0.6, blue: 0.78), radius: cardRadius) {
                        selectedTab = 2
                    }

                    NavigationCard(title: "NETWORK", color: Color(red: 0.6, green: 0.9, blue: 0.7), radius: cardRadius) {
                        selectedTab = 3
                    }
                }

                Spacer(minLength: 60)
            }
        }
        .background(Color(.systemGroupedBackground))
        .task {
            do {
                featuredEvents = try await EventService.shared.getFeatured()
            } catch {
                print("[Home] Failed to load featured: \(error)")
            }
        }
    }

    @ViewBuilder
    private var heroContent: some View {
        if let featured = featuredEvents.first {
            VStack(alignment: .leading, spacing: 0) {
                Text(featured.title.uppercased())
                    .font(.sxswHeadline(34))
                    .foregroundStyle(.primary)
                    .lineLimit(5)
                    .padding(.horizontal, 20)
                    .padding(.top, 28)
                    .padding(.bottom, 40)
            }
        } else {
            VStack(alignment: .leading, spacing: 0) {
                Text("SXSW 2027\nAUSTIN, TEXAS")
                    .font(.sxswHeadline(34))
                    .foregroundStyle(.primary)
                    .padding(.horizontal, 20)
                    .padding(.top, 28)
                    .padding(.bottom, 40)
            }
        }
    }
}

// MARK: - Navigation Card

struct NavigationCard: View {
    let title: String
    let color: Color
    let radius: CGFloat
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                Text(title)
                    .font(.sxswHeadline(36))
                    .foregroundStyle(.black)

                Spacer()

                Image(systemName: "arrow.right")
                    .font(.system(size: 28, weight: .medium))
                    .foregroundStyle(.black)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 20)
            .frame(maxWidth: .infinity)
            .background(color)
            .clipShape(RoundedRectangle(cornerRadius: radius))
        }
        .buttonStyle(.plain)
    }
}
