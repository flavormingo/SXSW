import Foundation

enum RequestInterceptor {
    static func injectAuthToken(into request: inout URLRequest) {
        if let token = KeychainService.loadString(forKey: "auth_token") {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
    }

    static func injectRequestId(into request: inout URLRequest) {
        request.setValue(UUID().uuidString, forHTTPHeaderField: "X-Request-ID")
    }

    static func injectContentType(into request: inout URLRequest) {
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
    }

    static func injectStandardHeaders(into request: inout URLRequest) {
        injectAuthToken(into: &request)
        injectRequestId(into: &request)
        injectContentType(into: &request)
    }

    static func handleUnauthorizedResponse(_ response: HTTPURLResponse) -> Bool {
        if response.statusCode == 401 {
            try? KeychainService.delete(forKey: "auth_token")
            NotificationCenter.default.post(name: .authSessionExpired, object: nil)
            return true
        }
        return false
    }
}
