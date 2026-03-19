import Foundation
import CoreLocation

struct Venue: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let address: String?
    let latitude: Double
    let longitude: Double
    let capacity: Int?
    let description: String?
    let imageUrl: String?
    let floorMapUrl: String?
    let neighborhood: String?
    var events: [Event]?

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }

    static func == (lhs: Venue, rhs: Venue) -> Bool {
        lhs.id == rhs.id
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}
