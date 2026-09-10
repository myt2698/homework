package com.homework.ledger;

import android.app.Activity;
import android.app.Dialog;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;

/** Shared local handwriting component; does not modify the running homework timer. */
final class HanziLookupDialog extends Dialog {
    private static final String HOST = "appassets.androidplatform.net";
    private final Activity activity;
    private final boolean focus;
    private WebView browser;

    HanziLookupDialog(Activity activity, boolean focus) {
        super(activity);
        this.activity = activity;
        this.focus = focus;
    }

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        browser = new WebView(activity);
        browser.setBackgroundColor(Color.rgb(244, 248, 255));
        WebSettings settings = browser.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setBlockNetworkLoads(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        browser.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return localResource(request.getUrl(), request.getMethod());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return navigate(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return navigate(Uri.parse(url));
            }
        });
        setContentView(browser, new ViewGroup.LayoutParams(-1, -1));
        setCanceledOnTouchOutside(false);
        Window window = getWindow();
        if (window != null) {
            window.setBackgroundDrawable(new ColorDrawable(Color.WHITE));
            window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        }
        browser.loadUrl("https://" + HOST + "/hanzi/index.html?host=android&focus=" + (focus ? "1" : "0"));
    }

    @Override
    public void show() {
        super.show();
        Window window = getWindow();
        if (window != null) window.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
    }

    private boolean navigate(Uri uri) {
        if (isLocal(uri) && "/hanzi/close".equals(uri.getPath())) {
            dismiss();
            return true;
        }
        return !isLocal(uri);
    }

    private boolean isLocal(Uri uri) {
        String path = uri.getPath();
        return "https".equals(uri.getScheme()) && HOST.equals(uri.getHost()) && path != null
                && path.startsWith("/hanzi/") && !path.contains("..") && path.matches("[a-zA-Z0-9_./-]+");
    }

    private WebResourceResponse localResource(Uri uri, String method) {
        if (!"GET".equals(method) || !isLocal(uri)) return missing();
        String asset = uri.getPath().substring("/hanzi/".length());
        String mime = asset.endsWith(".js") ? "application/javascript" : asset.endsWith(".css") ? "text/css"
                : asset.endsWith(".html") ? "text/html" : asset.endsWith(".json") ? "application/json" : "text/plain";
        try {
            InputStream stream = activity.getAssets().open(asset);
            return new WebResourceResponse(mime, "UTF-8", 200, "OK", Collections.emptyMap(), stream);
        } catch (IOException error) {
            return missing();
        }
    }

    private WebResourceResponse missing() {
        return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
    }

    @Override
    public void dismiss() {
        if (browser != null) {
            browser.stopLoading();
            browser.onPause();
            if (browser.getParent() instanceof ViewGroup) ((ViewGroup) browser.getParent()).removeView(browser);
            browser.destroy();
            browser = null;
        }
        super.dismiss();
    }
}
