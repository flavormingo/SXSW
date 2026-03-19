import SwiftUI
import SwiftData

struct EventListView: View {
    @State private var viewModel = EventListViewModel()
    @State private var showFilters = false
    @Environment(\.modelContext) private var modelContext

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading && viewModel.events.isEmpty {
                    LoadingView()
                } else if let error = viewModel.error, viewModel.events.isEmpty {
                    ErrorView(message: error) {
                        Task { await viewModel.loadEvents() }
                    }
                } else if viewModel.events.isEmpty {
                    EmptyStateView(
                        icon: "calendar.badge.exclamationmark",
                        title: "No Events",
                        message: "No events match your filters. Try adjusting your search."
                    )
                } else {
                    eventList
                }
            }
            .navigationTitle("Events")
            .searchable(text: $viewModel.searchQuery, prompt: "Search events...")
            .onSubmit(of: .search) {
                Task { await viewModel.search() }
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showFilters = true
                    } label: {
                        Image(systemName: viewModel.hasActiveFilters
                              ? "line.3.horizontal.decrease.circle.fill"
                              : "line.3.horizontal.decrease.circle")
                    }
                }
            }
            .sheet(isPresented: $showFilters) {
                EventFilterView(viewModel: viewModel) {
                    Task { await viewModel.loadEvents() }
                }
            }
            .refreshable {
                await viewModel.loadEvents()
            }
            .task {
                await viewModel.loadFilters()
                await viewModel.loadEvents()
            }
        }
    }

    private var eventList: some View {
        List {
            ForEach(viewModel.events) { event in
                NavigationLink(value: event) {
                    EventCardView(event: event)
                }
            }

            if viewModel.hasMore {
                HStack {
                    Spacer()
                    if viewModel.isLoadingMore {
                        ProgressView()
                    } else {
                        Button("Load More") {
                            Task { await viewModel.loadMore() }
                        }
                    }
                    Spacer()
                }
                .listRowSeparator(.hidden)
                .onAppear {
                    Task { await viewModel.loadMore() }
                }
            }
        }
        .listStyle(.plain)
        .navigationDestination(for: Event.self) { event in
            EventDetailView(eventId: event.id)
        }
    }
}

#Preview {
    EventListView()
}
