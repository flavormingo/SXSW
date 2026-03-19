import SwiftUI
import MapKit

struct MapView: View {
    @State private var viewModel = MapViewModel()
    @State private var cameraPosition: MapCameraPosition = .region(
        MKCoordinateRegion(
            center: AppConstants.austinCenter,
            span: MKCoordinateSpan(
                latitudeDelta: AppConstants.austinSpanDelta,
                longitudeDelta: AppConstants.austinSpanDelta
            )
        )
    )

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottom) {
                Map(position: $cameraPosition) {
                    UserAnnotation()

                    ForEach(viewModel.venues) { venue in
                        Annotation(venue.name, coordinate: venue.coordinate) {
                            Button {
                                Task { await viewModel.selectVenue(venue) }
                            } label: {
                                Image(systemName: "mappin.circle.fill")
                                    .font(.sxswTitle)
                                    .foregroundStyle(.sxswOrange)
                                    .background(
                                        Circle()
                                            .fill(.white)
                                            .frame(width: 26, height: 26)
                                    )
                            }
                        }
                    }
                }
                .mapControls {
                    MapUserLocationButton()
                    MapCompass()
                    MapScaleView()
                }

                if viewModel.showVenueDetail, let venue = viewModel.selectedVenue {
                    VenueDetailSheet(venue: venue, viewModel: viewModel)
                        .transition(.move(edge: .bottom))
                }
            }
            .navigationTitle("Map")
            .navigationBarTitleDisplayMode(.inline)
            .task {
                await viewModel.loadVenues()
            }
        }
    }
}

struct VenueDetailSheet: View {
    let venue: Venue
    @Bindable var viewModel: MapViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(venue.name)
                        .font(.sxswHeadlineDefault)
                    if let address = venue.address {
                        Text(address)
                            .font(.sxswDetail)
                            .foregroundStyle(.secondary)
                    }
                    if let neighborhood = venue.neighborhood {
                        Text(neighborhood)
                            .font(.sxswDetailSmall)
                            .foregroundStyle(.secondary)
                    }
                }

                Spacer()

                Button {
                    viewModel.showVenueDetail = false
                    viewModel.selectedVenue = nil
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.sxswTitle3)
                        .foregroundStyle(.secondary)
                }
            }

            if let events = venue.events, !events.isEmpty {
                Divider()

                Text("Upcoming Events")
                    .font(.sxswBodyDefault)
                    .fontWeight(.semibold)

                ForEach(events.prefix(3)) { event in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(event.title)
                                .font(.sxswDetail)
                                .fontWeight(.medium)
                                .lineLimit(1)
                            Text(event.formattedTimeRange)
                                .font(.sxswDetailSmall)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        if event.isHappeningNow {
                            Text("LIVE")
                                .font(.sxswDetailSmall)
                                .fontWeight(.bold)
                                .foregroundStyle(.red)
                        }
                    }
                }
            }

            Button {
                viewModel.openInMaps(venue)
            } label: {
                Label("Open in Maps", systemImage: "arrow.triangle.turn.up.right.circle.fill")
                    .font(.sxswBodyDefault)
                    .fontWeight(.medium)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
            }
            .buttonStyle(.borderedProminent)
            .tint(.sxswOrange)
        }
        .padding()
        .background(.regularMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .padding()
        .shadow(radius: 10)
    }
}

#Preview {
    MapView()
}
