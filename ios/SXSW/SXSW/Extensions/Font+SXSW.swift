import SwiftUI

extension Font {
    // MARK: - Headlines (Founders Grotesk Condensed Bold)

    static func sxswHeadline(_ size: CGFloat) -> Font {
        .custom("FoundersGroteskCondensed-Bold", size: size)
    }

    static let sxswLargeTitle = sxswHeadline(34)
    static let sxswTitle = sxswHeadline(28)
    static let sxswTitle2 = sxswHeadline(22)
    static let sxswTitle3 = sxswHeadline(20)
    static let sxswHeadlineDefault = sxswHeadline(17)

    // MARK: - Body (Founders Grotesk Text Regular)

    static func sxswBody(_ size: CGFloat) -> Font {
        .custom("FoundersGroteskText-Regular", size: size)
    }

    static let sxswBodyLarge = sxswBody(17)
    static let sxswBodyDefault = sxswBody(15)
    static let sxswBodySmall = sxswBody(13)
    static let sxswCaption = sxswBody(12)

    // MARK: - Mono / Details (Founders Grotesk Mono Regular)

    static func sxswMono(_ size: CGFloat) -> Font {
        .custom("FoundersGroteskMono-Regular", size: size)
    }

    static let sxswDetail = sxswMono(13)
    static let sxswDetailSmall = sxswMono(11)
    static let sxswDetailLarge = sxswMono(15)
}
