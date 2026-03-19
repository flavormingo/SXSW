import Foundation

@MainActor
final class APIClient {
    static let shared = APIClient()

    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    private static let authTokenKey = "auth_token"

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        self.session = URLSession(configuration: config)

        self.decoder = JSONDecoder()
        self.decoder.keyDecodingStrategy = .convertFromSnakeCase

        let iso8601WithFractional = DateFormatter()
        iso8601WithFractional.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
        iso8601WithFractional.timeZone = TimeZone(identifier: "UTC")

        let iso8601Standard = DateFormatter()
        iso8601Standard.dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'"
        iso8601Standard.timeZone = TimeZone(identifier: "UTC")

        self.decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)

            if let date = iso8601WithFractional.date(from: dateString) {
                return date
            }
            if let date = iso8601Standard.date(from: dateString) {
                return date
            }
            if let date = ISO8601DateFormatter().date(from: dateString) {
                return date
            }

            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Cannot decode date: \(dateString)"
            )
        }

        self.encoder = JSONEncoder()
        self.encoder.keyEncodingStrategy = .convertToSnakeCase
        self.encoder.dateEncodingStrategy = .iso8601
    }

    var authToken: String? {
        KeychainService.loadString(forKey: Self.authTokenKey)
    }

    func setAuthToken(_ token: String) {
        try? KeychainService.save(string: token, forKey: Self.authTokenKey)
    }

    func clearAuthToken() {
        try? KeychainService.delete(forKey: Self.authTokenKey)
    }

    func request<T: Codable>(_ endpoint: Endpoint) async throws -> T {
        var urlRequest = endpoint.urlRequest()

        if let token = authToken {
            urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        urlRequest.setValue(UUID().uuidString, forHTTPHeaderField: "X-Request-ID")
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let (data, response) = try await session.data(for: urlRequest)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }

        if httpResponse.statusCode == 401 {
            clearAuthToken()
            NotificationCenter.default.post(name: .authSessionExpired, object: nil)
            throw APIError(error: "unauthorized", message: "Session expired", statusCode: 401)
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            if let apiError = try? decoder.decode(APIError.self, from: data) {
                throw apiError
            }
            throw APIError(
                error: "request_failed",
                message: "Request failed with status \(httpResponse.statusCode)",
                statusCode: httpResponse.statusCode
            )
        }

        return try decoder.decode(T.self, from: data)
    }

    func requestRaw(_ endpoint: Endpoint) async throws -> Data {
        var urlRequest = endpoint.urlRequest()

        if let token = authToken {
            urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        urlRequest.setValue(UUID().uuidString, forHTTPHeaderField: "X-Request-ID")
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let (data, response) = try await session.data(for: urlRequest)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError(
                error: "request_failed",
                message: "Request failed with status \(httpResponse.statusCode)",
                statusCode: httpResponse.statusCode
            )
        }

        return data
    }
}

struct AnyEncodable: Encodable {
    private let _encode: (Encoder) throws -> Void

    init<T: Encodable>(_ value: T) {
        _encode = { encoder in
            try value.encode(to: encoder)
        }
    }

    func encode(to encoder: Encoder) throws {
        try _encode(encoder)
    }
}

extension Notification.Name {
    static let authSessionExpired = Notification.Name("authSessionExpired")
    static let navigateToEvent = Notification.Name("navigateToEvent")
}
