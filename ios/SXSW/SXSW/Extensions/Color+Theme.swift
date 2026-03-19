import SwiftUI

extension Color {
    // SXSW Brand Colors
    static let sxswBlack = Color(hex: "1A1A1A")
    static let sxswOrange = Color(hex: "E85D3A")
    static let sxswTeal = Color(hex: "2ABFBF")
    static let sxswAccent = Color.sxswOrange

    // Track Colors
    static let trackMusic = Color(hex: "E85D3A")
    static let trackFilm = Color(hex: "3A7CE8")
    static let trackInteractive = Color(hex: "3AE89B")
    static let trackComedy = Color(hex: "E8D53A")
    static let trackGaming = Color(hex: "9B3AE8")
    static let trackWellness = Color(hex: "E83A8C")
    static let trackFood = Color(hex: "E8A33A")
    static let trackTech = Color(hex: "3AD4E8")
}

extension ShapeStyle where Self == Color {
    static var sxswOrange: Color { .sxswOrange }
    static var sxswTeal: Color { .sxswTeal }
    static var sxswBlack: Color { .sxswBlack }
}
