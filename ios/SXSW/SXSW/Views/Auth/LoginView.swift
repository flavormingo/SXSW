import SwiftUI

struct LoginView: View {
    @Environment(AuthViewModel.self) private var authViewModel

    var body: some View {
        @Bindable var auth = authViewModel

        NavigationStack {
            VStack(spacing: 32) {
                Spacer()

                // Logo area
                VStack(spacing: 12) {
                    Image(systemName: "music.mic.circle.fill")
                        .font(.system(size: 80))
                        .foregroundStyle(.sxswOrange)

                    Text("SXSW")
                        .font(.largeTitle)
                        .fontWeight(.black)
                        .foregroundStyle(.primary)

                    Text("Sign in to personalize your experience")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }

                // Form
                VStack(spacing: 16) {
                    switch auth.state {
                    case .idle, .error:
                        emailForm

                    case .sendingLink:
                        emailForm
                            .disabled(true)
                            .overlay {
                                ProgressView()
                            }

                    case .linkSent(let email):
                        MagicLinkSentView(email: email) {
                            auth.state = .idle
                        }

                    case .verifying:
                        VStack(spacing: 16) {
                            ProgressView()
                            Text("Verifying...")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }

                    case .authenticated:
                        EmptyView()
                    }

                    if case .error(let message) = auth.state {
                        Text(message)
                            .font(.caption)
                            .foregroundStyle(.red)
                            .multilineTextAlignment(.center)
                    }
                }
                .padding(.horizontal, 32)

                Spacer()
                Spacer()
            }
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private var emailForm: some View {
        @Bindable var auth = authViewModel

        return VStack(spacing: 16) {
            TextField("Email address", text: $auth.email)
                .textFieldStyle(.roundedBorder)
                .textContentType(.emailAddress)
                .keyboardType(.emailAddress)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)

            Button {
                Task {
                    await authViewModel.sendMagicLink()
                }
            } label: {
                Text("Send Magic Link")
                    .fontWeight(.semibold)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
            }
            .buttonStyle(.borderedProminent)
            .tint(.sxswOrange)
            .disabled(authViewModel.email.isEmpty)
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
                .foregroundStyle(.sxswOrange)

            Text("Check your email")
                .font(.title2)
                .fontWeight(.bold)

            Text("We sent a magic link to **\(email)**. Tap the link to sign in.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            Button("Use a different email") {
                onResend()
            }
            .font(.subheadline)
            .foregroundStyle(.sxswOrange)
            .padding(.top, 8)
        }
    }
}

#Preview {
    LoginView()
        .environment(AuthViewModel())
}
