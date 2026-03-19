import Foundation
import UIKit

@MainActor
final class AnalyticsService {
    static let shared = AnalyticsService()

    private var buffer: [[String: Any]] = []
    private let flushThreshold = 10
    private let deviceId: String
    private let platform = "ios"

    private var appVersion: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown"
    }

    private init() {
        if let savedId = KeychainService.loadString(forKey: "analytics_device_id") {
            self.deviceId = savedId
        } else {
            let newId = UUID().uuidString
            try? KeychainService.save(string: newId, forKey: "analytics_device_id")
            self.deviceId = newId
        }
    }

    func track(eventName: String, properties: [String: Any] = [:]) {
        let eventData: [String: Any] = [
            "event": eventName,
            "properties": properties,
            "deviceId": deviceId,
            "platform": platform,
            "appVersion": appVersion,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ]

        buffer.append(eventData)

        if buffer.count >= flushThreshold {
            Task {
                await flush()
            }
        }
    }

    func flush() async {
        guard !buffer.isEmpty else { return }

        let eventsToFlush = buffer
        buffer.removeAll()

        do {
            let jsonData = try JSONSerialization.data(withJSONObject: eventsToFlush)
            let _: SuccessResponse = try await APIClient.shared.request(
                .trackAnalytics(payload: jsonData)
            )
        } catch {
            buffer.insert(contentsOf: eventsToFlush, at: 0)
            print("[Analytics] Flush failed: \(error)")
        }
    }
}
