import SwiftUI

struct RecommendationsView: View {
    @State private var viewModel = RecommendationsViewModel()

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading {
                    LoadingView()
                } else if let error = viewModel.error {
                    ErrorView(message: error) {
                        Task { await viewModel.loadRecommendations() }
                    }
                } else if viewModel.recommendations.isEmpty {
                    EmptyStateView(
                        icon: "sparkles",
                        title: "No Recommendations Yet",
                        message: "Add events to your schedule and favorites to get personalized recommendations."
                    )
                } else {
                    recommendationsList
                }
            }
            .navigationTitle("For You")
            .refreshable {
                await viewModel.loadRecommendations()
            }
            .task {
                await viewModel.loadRecommendations()
            }
        }
    }

    private var recommendationsList: some View {
        List {
            ForEach(viewModel.recommendations) { rec in
                NavigationLink {
                    EventDetailView(eventId: rec.event.id)
                } label: {
                    VStack(alignment: .leading, spacing: 8) {
                        EventCardView(event: rec.event)

                        HStack(spacing: 6) {
                            Image(systemName: "sparkles")
                                .font(.sxswDetailSmall)
                                .foregroundStyle(.sxswOrange)
                            Text(rec.reason)
                                .font(.sxswDetail)
                                .foregroundStyle(.secondary)
                                .italic()
                        }

                        // Score indicator
                        HStack(spacing: 4) {
                            ForEach(0..<5) { index in
                                Image(systemName: index < Int(rec.score * 5)
                                      ? "star.fill" : "star")
                                    .font(.sxswDetailSmall)
                                    .foregroundStyle(.sxswOrange)
                            }
                        }
                    }
                }
            }
            .onDelete { offsets in
                viewModel.dismissAt(offsets: offsets)
            }
        }
        .listStyle(.plain)
    }
}

#Preview {
    RecommendationsView()
}
