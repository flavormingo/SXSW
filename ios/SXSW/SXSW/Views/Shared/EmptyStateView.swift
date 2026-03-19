import SwiftUI

struct EmptyStateView: View {
    let icon: String
    let title: String
    let message: String

    var body: some View {
        VStack(spacing: 16) {
            Spacer()

            Image(systemName: icon)
                .font(.sxswHeadline(48))
                .foregroundStyle(.secondary)

            Text(title)
                .font(.sxswHeadlineDefault)

            Text(message)
                .font(.sxswBodyDefault)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    EmptyStateView(
        icon: "calendar",
        title: "No Events",
        message: "Your schedule is empty. Browse events to add some."
    )
}
