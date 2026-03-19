import SwiftUI

struct LoginView: View {
    @Environment(AuthViewModel.self) private var authViewModel
    @State private var showSignIn = false
    @State private var showSignUp = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Spacer()

                // SXSW wordmark logo
                Image("SXSWWordmark")
                    .renderingMode(.template)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 240)
                    .foregroundStyle(.primary)

                Spacer()

                // Action buttons
                VStack(spacing: 12) {
                    Button {
                        showSignIn = true
                    } label: {
                        Text("LOG IN")
                            .font(.sxswHeadline(18))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.primary)

                    Button {
                        showSignUp = true
                    } label: {
                        Text("SIGN UP")
                            .font(.sxswHeadline(18))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                    }
                    .buttonStyle(.bordered)
                    .tint(.primary)

                    Button {
                        authViewModel.skipAuth()
                    } label: {
                        Text("Stay logged out")
                            .font(.sxswBodySmall)
                            .foregroundColor(.black)
                            .underline()
                    }
                    .padding(.top, 8)
                }
                .padding(.horizontal, 32)
                .padding(.bottom, 48)
            }
            .sheet(isPresented: $showSignIn) {
                MagicLinkSheet(mode: .signIn)
                    .environment(authViewModel)
            }
            .sheet(isPresented: $showSignUp) {
                MagicLinkSheet(mode: .signUp)
                    .environment(authViewModel)
            }
        }
    }
}

// MARK: - Magic Link Sheet (shared for sign in & sign up)

struct MagicLinkSheet: View {
    enum Mode {
        case signIn, signUp

        var title: String {
            switch self {
            case .signIn: return "Log In"
            case .signUp: return "Sign Up"
            }
        }

        var subtitle: String {
            switch self {
            case .signIn: return "Enter your email to receive a sign-in link."
            case .signUp: return "Enter your email to create an account."
            }
        }

        var buttonLabel: String {
            switch self {
            case .signIn: return "Send Sign-In Link"
            case .signUp: return "Send Sign-Up Link"
            }
        }
    }

    let mode: Mode
    @Environment(AuthViewModel.self) private var authViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        @Bindable var auth = authViewModel

        NavigationStack {
            VStack(spacing: 32) {
                Spacer()

                // Logo mark
                Image("SXSWLogo")
                    .renderingMode(.template)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 60, height: 60)
                    .foregroundStyle(.primary)

                VStack(spacing: 8) {
                    Text(mode.title)
                        .font(.sxswTitle)

                    Text(mode.subtitle)
                        .font(.sxswBodyDefault)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }

                switch auth.state {
                case .idle, .error, .sendingLink:
                    VStack(spacing: 16) {
                        TextField("Email address", text: $auth.email)
                            .textFieldStyle(.roundedBorder)
                            .textContentType(.emailAddress)
                            .keyboardType(.emailAddress)
                            .autocorrectionDisabled()
                            .textInputAutocapitalization(.never)
                            .font(.sxswBodyDefault)

                        Button {
                            Task { await authViewModel.sendMagicLink() }
                        } label: {
                            if case .sendingLink = auth.state {
                                ProgressView()
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 12)
                            } else {
                                Text(mode.buttonLabel)
                                    .font(.sxswBodyLarge)
                                    .fontWeight(.semibold)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 12)
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.primary)
                        .disabled(authViewModel.email.isEmpty || auth.state == .sendingLink)

                        if case .error(let message) = auth.state {
                            Text(message)
                                .font(.sxswDetail)
                                .foregroundStyle(.red)
                                .multilineTextAlignment(.center)
                        }
                    }
                    .padding(.horizontal, 32)

                case .linkSent(let email):
                    MagicLinkSentView(email: email) {
                        auth.state = .idle
                    }
                    .padding(.horizontal, 32)

                case .verifying:
                    VStack(spacing: 16) {
                        ProgressView()
                        Text("Verifying...")
                            .font(.sxswBodyDefault)
                            .foregroundStyle(.secondary)
                    }

                case .authenticated:
                    EmptyView()
                }

                Spacer()
                Spacer()
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                        .font(.sxswBodyDefault)
                }
            }
            .onChange(of: authViewModel.isAuthenticated) { _, authenticated in
                if authenticated { dismiss() }
            }
        }
    }
}

extension AuthViewModel.AuthState: Equatable {
    static func == (lhs: AuthViewModel.AuthState, rhs: AuthViewModel.AuthState) -> Bool {
        switch (lhs, rhs) {
        case (.idle, .idle), (.sendingLink, .sendingLink), (.verifying, .verifying):
            return true
        case (.linkSent(let a), .linkSent(let b)):
            return a == b
        case (.authenticated(let a), .authenticated(let b)):
            return a.id == b.id
        case (.error(let a), .error(let b)):
            return a == b
        default:
            return false
        }
    }
}

struct MagicLinkSentView: View {
    let email: String
    let onResend: () -> Void

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "envelope.badge.fill")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)

            Text("Check your email")
                .font(.sxswTitle2)

            Text("We sent a magic link to **\(email)**.\nTap the link to sign in.")
                .font(.sxswBodyDefault)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            Button("Use a different email") {
                onResend()
            }
            .font(.sxswBodySmall)
            .foregroundStyle(.secondary)
            .padding(.top, 8)
        }
    }
}

#Preview {
    LoginView()
        .environment(AuthViewModel())
}
