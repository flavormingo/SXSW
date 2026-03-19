import Foundation
import MapKit

@Observable
final class MapViewModel {
    var venues: [Venue] = []
    var selectedVenue: Venue?
    var isLoading = false
    var error: String?
    var showVenueDetail = false

    var region = MKCoordinateRegion(
        center: AppConstants.austinCenter,
        span: MKCoordinateSpan(
            latitudeDelta: AppConstants.austinSpanDelta,
            longitudeDelta: AppConstants.austinSpanDelta
        )
    )

    func loadVenues() async {
        isLoading = true
        error = nil

        do {
            let response: APIResponse<[Venue]> = try await APIClient.shared.request(.venues)
            venues = response.data
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func selectVenue(_ venue: Venue) async {
        do {
            let response: APIResponse<Venue> = try await APIClient.shared.request(
                .venueDetail(id: venue.id)
            )
            selectedVenue = response.data
        } catch {
            selectedVenue = venue
        }

        showVenueDetail = true

        withAnimation {
            region = MKCoordinateRegion(
                center: venue.coordinate,
                span: MKCoordinateSpan(latitudeDelta: 0.005, longitudeDelta: 0.005)
            )
        }
    }

    func openInMaps(_ venue: Venue) {
        let mapItem = MKMapItem(placemark: MKPlacemark(coordinate: venue.coordinate))
        mapItem.name = venue.name
        mapItem.openInMaps(launchOptions: [
            MKLaunchOptionsDirectionsModeKey: MKLaunchOptionsDirectionsModeWalking
        ])
    }

    private func withAnimation(_ block: () -> Void) {
        block()
    }
}
