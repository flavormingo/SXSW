import Foundation
import CoreLocation

enum AppConstants {
    // MARK: - API

    static let apiBaseURL = "https://api.sxsw.pizza"

    // MARK: - App

    static let appScheme = "sxsw"
    static let bundleId = "com.madebysnacks.SXSW"

    // MARK: - Pagination

    static let pageSize = 20

    // MARK: - Cache TTLs (in seconds)

    static let eventCacheTTL: TimeInterval = 300        // 5 minutes
    static let scheduleCacheTTL: TimeInterval = 120     // 2 minutes
    static let venueCacheTTL: TimeInterval = 3600       // 1 hour
    static let trackCacheTTL: TimeInterval = 86400      // 24 hours

    // MARK: - Festival Dates

    static let festivalStartDate = "2026-03-13"
    static let festivalEndDate = "2026-03-22"

    // MARK: - Austin Map

    static let austinCenter = CLLocationCoordinate2D(
        latitude: 30.2672,
        longitude: -97.7431
    )
    static let austinSpanDelta: Double = 0.05
}
