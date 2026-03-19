import SwiftUI

struct TrackBadge: View {
    let name: String
    let color: Color

    var body: some View {
        Text(name)
            .font(.sxswDetailSmall)
            .fontWeight(.semibold)
            .foregroundStyle(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(color)
            .clipShape(Capsule())
    }
}

#Preview {
    HStack {
        TrackBadge(name: "Music", color: .red)
        TrackBadge(name: "Film", color: .blue)
        TrackBadge(name: "Interactive", color: .green)
    }
}
