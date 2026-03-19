import SwiftUI

struct EventCardView: View {
    let event: Event

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                if let track = event.track {
                    TrackBadge(name: track.name, color: Color(hex: track.color ?? "888888"))
                }

                if event.isFeatured {
                    Image(systemName: "star.fill")
                        .font(.sxswDetailSmall)
                        .foregroundStyle(.yellow)
                }

                if event.isHappeningNow {
                    HStack(spacing: 4) {
                        Circle()
                            .fill(.red)
                            .frame(width: 6, height: 6)
                        Text("LIVE")
                            .font(.sxswDetailSmall)
                            .fontWeight(.bold)
                            .foregroundStyle(.red)
                    }
                }

                Spacer()

                Text(event.eventType.displayName)
                    .font(.sxswDetailSmall)
                    .foregroundStyle(.secondary)
            }

            Text(event.title)
                .font(.sxswHeadlineDefault)
                .lineLimit(2)

            HStack(spacing: 12) {
                Label(event.formattedTimeRange, systemImage: "clock")
                    .font(.sxswDetail)
                    .foregroundStyle(.secondary)

                if let venue = event.venue {
                    Label(venue.name, systemImage: "mappin")
                        .font(.sxswDetail)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }

            if event.isCancelled {
                Text("CANCELLED")
                    .font(.sxswDetailSmall)
                    .fontWeight(.bold)
                    .foregroundStyle(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(.red)
                    .clipShape(Capsule())
            }
        }
        .padding(.vertical, 4)
        .opacity(event.isCancelled ? 0.6 : 1.0)
    }
}

#Preview {
    List {
        EventCardView(event: Event(
            id: "1",
            title: "The Future of AI in Music Production",
            description: nil,
            shortDescription: nil,
            startTime: Date(),
            endTime: Date().addingTimeInterval(3600),
            day: "2026-03-13",
            venueId: "v1",
            trackId: "t1",
            eventType: .panel,
            imageUrl: nil,
            tags: nil,
            speakers: nil,
            rsvpUrl: nil,
            isFeatured: true,
            isCancelled: false,
            capacity: nil,
            attendeeCount: nil,
            venue: VenueSummary(id: "v1", name: "Austin Convention Center", address: nil),
            track: TrackSummary(id: "t1", name: "Music", color: "E85D3A"),
            notify: nil,
            addedAt: nil
        ))
    }
}
