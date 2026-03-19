import SwiftUI

@Observable
final class RecommendationsViewModel {
    var recommendations: [Recommendation] = []
    var isLoading = false
    var error: String?

    func loadRecommendations() async {
        isLoading = true
        error = nil

        do {
            let response: APIResponse<[Recommendation]> = try await APIClient.shared.request(
                .recommendations
            )
            recommendations = response.data
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func dismiss(_ recommendation: Recommendation) {
        recommendations.removeAll { $0.id == recommendation.id }
    }

    func dismissAt(offsets: IndexSet) {
        recommendations.remove(atOffsets: offsets)
    }
}
