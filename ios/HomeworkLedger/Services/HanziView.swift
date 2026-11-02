import SwiftUI
import WebKit

struct HanziView: View {
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        NavigationStack {
            if let folder = Bundle.main.url(forResource: "hanzi", withExtension: nil),
               FileManager.default.fileExists(atPath: folder.appendingPathComponent("index.html").path) {
                HanziWebView(folder: folder, close: { dismiss() }).ignoresSafeArea(edges: .bottom)
                    .toolbar(.hidden, for: .navigationBar)
            } else {
                VStack(spacing: 20) { Text("离线字库未能读取，请检查应用资源。"); Button("返回") { dismiss() } }
            }
        }
    }
}

private struct HanziWebView: UIViewRepresentable {
    let folder: URL
    let close: () -> Void
    func makeCoordinator() -> Coordinator { Coordinator(folder: folder, close: close) }
    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        configuration.userContentController.add(context.coordinator, name: "closeLookup")
        let source = "document.getElementById('lookupBack').addEventListener('click',function(e){e.stopImmediatePropagation();window.webkit.messageHandlers.closeLookup.postMessage('close');},true);"
        configuration.userContentController.addUserScript(WKUserScript(source: source, injectionTime: .atDocumentEnd, forMainFrameOnly: true))
        let view = WKWebView(frame: .zero, configuration: configuration)
        view.navigationDelegate = context.coordinator
        view.loadFileURL(folder.appendingPathComponent("index.html"), allowingReadAccessTo: folder)
        return view
    }
    func updateUIView(_ uiView: WKWebView, context: Context) { }
    static func dismantleUIView(_ uiView: WKWebView, coordinator: Coordinator) {
        uiView.stopLoading(); uiView.configuration.userContentController.removeScriptMessageHandler(forName: "closeLookup")
        uiView.navigationDelegate = nil
    }
    final class Coordinator: NSObject, WKScriptMessageHandler, WKNavigationDelegate {
        let folder: URL
        let close: () -> Void
        init(folder: URL, close: @escaping () -> Void) { self.folder = folder; self.close = close }
        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            if message.name == "closeLookup", message.frameInfo.isMainFrame { close() }
        }
        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
            let base = folder.standardizedFileURL.path + "/"
            decisionHandler(url.isFileURL && url.standardizedFileURL.path.hasPrefix(base) ? .allow : .cancel)
        }
    }
}
