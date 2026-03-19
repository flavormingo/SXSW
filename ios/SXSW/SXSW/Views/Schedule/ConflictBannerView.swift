import SwiftUI

struct ConflictBannerView: View {
    let count: Int

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.sxswBodyDefault)

            Text(count == 1
                 ? "1 schedule conflict"
                 : "\(count) schedule conflicts")
                .font(.sxswBodyDefault)
                .fontWeight(.medium)

            Spacer()

            Image(systemName: "chevron.right")
                .font(.sxswDetail)
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
