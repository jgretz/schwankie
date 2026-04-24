import UIKit
import SwiftUI
import Social
import UniformTypeIdentifiers

private let appGroup = "group.com.schwankie.app"
private let apiUrlKey = "apiUrl"
private let apiKeyKey = "apiKey"

class ShareViewController: UIViewController {
  override func viewDidLoad() {
    super.viewDidLoad()
    let view = ShareView(
      extract: { [weak self] completion in self?.extractSharedURL(completion: completion) },
      onDismiss: { [weak self] in
        self?.extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
      }
    )
    let host = UIHostingController(rootView: view)
    addChild(host)
    host.view.translatesAutoresizingMaskIntoConstraints = false
    self.view.addSubview(host.view)
    NSLayoutConstraint.activate([
      host.view.leadingAnchor.constraint(equalTo: self.view.leadingAnchor),
      host.view.trailingAnchor.constraint(equalTo: self.view.trailingAnchor),
      host.view.topAnchor.constraint(equalTo: self.view.topAnchor),
      host.view.bottomAnchor.constraint(equalTo: self.view.bottomAnchor),
    ])
    host.didMove(toParent: self)
  }

  private func extractSharedURL(completion: @escaping (String?) -> Void) {
    guard
      let item = extensionContext?.inputItems.first as? NSExtensionItem,
      let providers = item.attachments
    else {
      completion(nil)
      return
    }

    let urlType = UTType.url.identifier
    let textType = UTType.plainText.identifier

    for provider in providers where provider.hasItemConformingToTypeIdentifier(urlType) {
      provider.loadItem(forTypeIdentifier: urlType, options: nil) { value, _ in
        if let url = value as? URL {
          completion(url.absoluteString)
        } else if let s = value as? String {
          completion(s)
        } else {
          completion(nil)
        }
      }
      return
    }

    for provider in providers where provider.hasItemConformingToTypeIdentifier(textType) {
      provider.loadItem(forTypeIdentifier: textType, options: nil) { value, _ in
        completion(value as? String)
      }
      return
    }

    completion(nil)
  }
}

private enum SaveStatus: Equatable {
  case saving
  case success
  case error(String)
}

struct ShareView: View {
  let extract: (@escaping (String?) -> Void) -> Void
  let onDismiss: () -> Void

  @State private var status: SaveStatus = .saving

  private let accent = Color(red: 91/255, green: 111/255, blue: 138/255)
  private let bg = Color(red: 247/255, green: 243/255, blue: 237/255)
  private let text = Color(red: 30/255, green: 30/255, blue: 30/255)
  private let errorColor = Color(red: 179/255, green: 64/255, blue: 64/255)
  private let cancelBg = Color(red: 228/255, green: 220/255, blue: 203/255)
  private let cancelText = Color(red: 61/255, green: 52/255, blue: 42/255)

  var body: some View {
    ZStack {
      bg.ignoresSafeArea()
      VStack(spacing: 16) {
        Image("Logo")
          .resizable()
          .aspectRatio(contentMode: .fit)
          .frame(width: 72, height: 72)
          .cornerRadius(16)

        switch status {
        case .saving:
          ProgressView()
            .scaleEffect(1.2)
            .tint(accent)
          Text("Saving link…")
            .font(.system(size: 17, weight: .medium))
            .foregroundColor(text)
        case .success:
          Text("✓")
            .font(.system(size: 44, weight: .semibold))
            .foregroundColor(accent)
          Text("Link saved")
            .font(.system(size: 17, weight: .medium))
            .foregroundColor(text)
        case .error(let message):
          Text("✕")
            .font(.system(size: 44, weight: .semibold))
            .foregroundColor(errorColor)
          Text(message)
            .font(.system(size: 15))
            .foregroundColor(text)
            .multilineTextAlignment(.center)
            .padding(.horizontal, 24)
          Button(action: onDismiss) {
            Text("Close")
              .font(.system(size: 16, weight: .semibold))
              .foregroundColor(cancelText)
              .padding(.horizontal, 28)
              .padding(.vertical, 12)
              .background(cancelBg)
              .cornerRadius(10)
          }
          .padding(.top, 8)
        }
      }
    }
    .onAppear(perform: run)
  }

  private func run() {
    extract { urlString in
      DispatchQueue.main.async {
        guard let raw = urlString, !raw.isEmpty else {
          finish(.error("No URL to save"))
          return
        }
        let normalized = normalizeURL(raw)
        guard isValidURL(normalized) else {
          finish(.error("Invalid URL"))
          return
        }
        guard
          let defaults = UserDefaults(suiteName: appGroup),
          let apiUrl = defaults.string(forKey: apiUrlKey),
          !apiUrl.isEmpty
        else {
          finish(.error("Open the Schwankie app at least once to configure."))
          return
        }
        let apiKey = defaults.string(forKey: apiKeyKey)

        createLink(apiUrl: apiUrl, apiKey: apiKey, url: normalized, title: titleFromURL(normalized)) { result in
          DispatchQueue.main.async {
            switch result {
            case .success:
              UINotificationFeedbackGenerator().notificationOccurred(.success)
              status = .success
              DispatchQueue.main.asyncAfter(deadline: .now() + 1.2, execute: onDismiss)
            case .failure(let error):
              finish(.error(error.localizedDescription))
            }
          }
        }
      }
    }
  }

  private func finish(_ status: SaveStatus) {
    UINotificationFeedbackGenerator().notificationOccurred(.error)
    self.status = status
  }
}

private func normalizeURL(_ input: String) -> String {
  let trimmed = input.trimmingCharacters(in: .whitespacesAndNewlines)
  if trimmed.lowercased().hasPrefix("http://") || trimmed.lowercased().hasPrefix("https://") {
    return trimmed
  }
  return "https://\(trimmed)"
}

private func isValidURL(_ input: String) -> Bool {
  let pattern = #"^https?://[^\s.]+\.[^\s]+"#
  return input.range(of: pattern, options: .regularExpression) != nil
}

private func titleFromURL(_ input: String) -> String {
  guard let url = URL(string: input), let host = url.host else { return "Shared Link" }
  return host
}

private func createLink(
  apiUrl: String,
  apiKey: String?,
  url: String,
  title: String,
  completion: @escaping (Result<Void, Error>) -> Void
) {
  let trimmedBase = apiUrl.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
  guard let endpoint = URL(string: trimmedBase + "/api/links") else {
    completion(.failure(NSError(domain: "ShareExt", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid API URL"])))
    return
  }

  var request = URLRequest(url: endpoint)
  request.httpMethod = "POST"
  request.setValue("application/json", forHTTPHeaderField: "Content-Type")
  if let key = apiKey, !key.isEmpty {
    request.setValue("Bearer \(key)", forHTTPHeaderField: "Authorization")
  }

  let payload: [String: Any] = ["url": url, "title": title, "status": "queued"]
  do {
    request.httpBody = try JSONSerialization.data(withJSONObject: payload)
  } catch {
    completion(.failure(error))
    return
  }

  URLSession.shared.dataTask(with: request) { data, response, error in
    if let error = error {
      completion(.failure(error))
      return
    }
    guard let http = response as? HTTPURLResponse else {
      completion(.failure(NSError(domain: "ShareExt", code: 0, userInfo: [NSLocalizedDescriptionKey: "No response"])))
      return
    }
    if (200..<300).contains(http.statusCode) {
      completion(.success(()))
    } else {
      let body = data.flatMap { String(data: $0, encoding: .utf8) } ?? ""
      let message = "HTTP \(http.statusCode)\(body.isEmpty ? "" : ": \(body)")"
      completion(.failure(NSError(domain: "ShareExt", code: http.statusCode, userInfo: [NSLocalizedDescriptionKey: message])))
    }
  }.resume()
}
