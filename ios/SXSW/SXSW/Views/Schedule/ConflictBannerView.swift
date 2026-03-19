import SwiftUI

struct ConflictBannerView: View {
    let count: Int

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.subheadline)

            Text(count == 1
                 ? "1 schedule conflict"
                 : "\(count) schedule conflicts")
                .font(.subheadline)
                .fontWeight(.medium)

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
        }
        .foregroundStyle(.white)
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(.orange.gradient)
    }
}

#Preview {
    VStack {
        ConflictBannerView(count: 1)
        ConflictBannerView(count: 3)
    }
}
