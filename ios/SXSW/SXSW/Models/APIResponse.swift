import Foundation

struct APIResponse<T: Codable>: Codable {
    let data: T
    let pagination: Pagination?
}

struct Pagination: Codable {
    let nextCursor: String?
    let hasMore: Bool
    let total: Int?
}

struct APIError: Codable, Error, LocalizedError {
    let error: String
    let message: String?
    let statusCode: Int?

    var errorDescription: String? {
        message ?? error
    }
}

struct SuccessResponse: Codable {
    let success: Bool
    let message: String?
}
