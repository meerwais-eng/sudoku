package com.sudoku.premium

import android.app.Activity
import android.content.pm.ApplicationInfo
import android.os.Bundle
import android.util.Log
import android.view.View
import android.view.ViewTreeObserver
import android.view.WindowManager
import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var webAppInterface: WebAppInterface
    private var customView: View? = null
    private var customViewContainer: FrameLayout? = null
    private var originalSystemUiVisibility: Int = 0
    private var originalOrientation: Int = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Enable WebView debugging only for debug builds (security: disable in release)
        WebView.setWebContentsDebuggingEnabled(0 != applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE)

        // Keep screen on during gameplay
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // Create container for fullscreen mode
        customViewContainer = FrameLayout(this)

        // Setup WebView
        webView = WebView(this)
        webView.id = View.generateViewId()
        setContentView(webView)

        // Create the native-to-web bridge interface
        webAppInterface = WebAppInterface(this)

        configureWebView()

        // CRITICAL: Delay loadUrl() until after the WebView has been measured and laid out.
        // When loadUrl() is called directly in onCreate(), the WebView hasn't been through
        // Android's measure/layout pass yet, so its physical dimensions are 0. The page
        // loads so fast from local assets that the viewport is computed with innerWidth=0,
        // innerHeight=0. This makes the body width=0px, collapsing all content to zero
        // width → invisible → white screen.
        //
        // View.post() is NOT sufficient — it only queues after the current Handler message,
        // but the layout pass hasn't completed yet at that point (confirmed: w=0, h=0).
        //
        // ViewTreeObserver.OnGlobalLayoutListener fires AFTER the entire view tree has been
        // measured and laid out, guaranteeing webView.width/height are non-zero.
        //
        // Load the app using loadUrl() — this gives the page a proper https:// origin
        // which is CRITICAL for JavaScript APIs like fetch() and dynamic import() to work.
        //
        // loadDataWithBaseURL() creates a data: URL with an opaque (null) origin. While the
        // baseUrl parameter resolves relative URLs in HTML attributes (src, href), JavaScript
        // APIs like fetch() and import() use the document's actual origin (the data: URL's
        // null origin), NOT the baseUrl. This breaks Turbopack's dynamic chunk loading which
        // uses fetch()/import() internally, causing React hydration to fail silently → white screen.
        //
        // With loadUrl(), the page URL is https://appassets.android.platform.net/index.html
        // which has a proper https:// origin. All JS APIs work correctly.
        //
        // How it works:
        // 1. WebView requests https://appassets.android.platform.net/index.html
        // 2. shouldInterceptRequest() intercepts and delegates to WebViewAssetLoader
        // 3. PublicAssetsPathHandler serves index.html from assets (with injected error-catching JS)
        // 4. The page has a proper https:// origin for JavaScript API calls
        // 5. Root-relative paths like /_next/... resolve correctly
        webView.viewTreeObserver.addOnGlobalLayoutListener(object : ViewTreeObserver.OnGlobalLayoutListener {
            override fun onGlobalLayout() {
                // Remove listener immediately — we only need this once
                webView.viewTreeObserver.removeOnGlobalLayoutListener(this)
                Log.d("SudokuMain", "Loading app via loadUrl after layout: w=${webView.width}, h=${webView.height}")
                webView.loadUrl("https://appassets.android.platform.net/index.html")
            }
        })
    }

    private fun configureWebView() {
        val settings = webView.settings

        // Enable JavaScript (required for the game)
        settings.javaScriptEnabled = true

        // Enable DOM storage (required for localStorage persistence)
        settings.domStorageEnabled = true

        // Enable database storage
        settings.databaseEnabled = true

        // Set cache mode - use cache when offline, load from assets
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        // Allow file access (still needed for some WebView internals)
        settings.allowFileAccess = true
        settings.allowContentAccess = true

        // NOTE: allowFileAccessFromFileURLs and allowUniversalAccessFromFileURLs are
        // NO LONGER needed because we serve content via https:// (WebViewAssetLoader)
        // instead of file://. This eliminates all file:// protocol security issues.
        // The deprecated settings have been removed.

        // NOTE: mixedContentMode is NO LONGER needed because all content is served
        // via https://appassets.android.platform.net/ — same origin as the page.
        // No mixed content (file:// + https://) occurs.

        // Responsive layout
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true

        // Prevent zoom (game handles its own UI scaling)
        settings.setSupportZoom(false)
        settings.builtInZoomControls = false

        // Text scaling - ensure fonts render at proper size on small screens
        settings.textZoom = 100
        settings.defaultFontSize = 16

        // Layout algorithm for responsive mobile-first design
        settings.layoutAlgorithm = WebSettings.LayoutAlgorithm.TEXT_AUTOSIZING
        settings.displayZoomControls = false
        settings.loadsImagesAutomatically = true
        settings.blockNetworkImage = false
        settings.blockNetworkLoads = false
        settings.mediaPlaybackRequiresUserGesture = false

        // Create WebViewAssetLoader — the officially recommended way to serve local
        // assets in WebView. It serves content via https://appassets.android.platform.net/
        // which eliminates all file:// protocol issues:
        // - Root-relative paths resolve correctly
        // - shouldInterceptRequest() is called for https:// URLs
        // - No mixed content or file access security issues
        // - Turbopack dynamic chunk loading works correctly
        val assetLoader = WebViewAssetLoader.Builder()
            .setDomain("appassets.android.platform.net")
            .addPathHandler("/", PublicAssetsPathHandler(this))
            .build()

        // Set custom WebViewClient that delegates to assetLoader
        webView.webViewClient = SudokuWebViewClient(this, assetLoader)

        // Handle fullscreen requests (for potential video/audio)
        webView.webChromeClient = SudokuChromeClient(this)

        // Bridge native Android functionality to JavaScript as window.SudokuAndroid
        webView.addJavascriptInterface(webAppInterface, "SudokuAndroid")

        // === Touch Input Latency Optimizations ===

        // 1. Enable hardware layer acceleration — uses GPU for rendering which
        //    dramatically reduces touch response latency for WebView content
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)

        // 2. Fast scrollbar — auto-fade after 1.5s so scrollbar doesn't consume
        //    touch area or trigger unnecessary redraws during gameplay
        webView.isScrollbarFadingEnabled = true
        webView.scrollBarFadeDuration = 1500

        // 3. Disable over-scroll bounce — eliminates unnecessary scroll calculations
        //    and visual bounce that can delay touch response in a non-scrolling game UI
        webView.overScrollMode = View.OVER_SCROLL_NEVER

        // 4. Focus immediately on touch — ensures the WebView receives focus
        //    instantly on first touch, avoiding any focus-change delay
        webView.isFocusableInTouchMode = true
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    /**
     * Handle the Android hardware/software back button.
     *
     * Strategy: Delegate to JavaScript rather than navigating the WebView history.
     * The web app uses a single-page architecture (Next.js) with an internal
     * screen stack (screenHistory) managed by Zustand. WebView.canGoBack()
     * tracks URL history which doesn't correspond to the app's screen navigation.
     *
     * Instead, we call window.__sudokuHandleBackPress() which:
     * 1. If not on the Home screen → calls goBack() to navigate to the previous screen
     * 2. If on the Home screen → calls SudokuAndroid.requestExitDialog() which
     *    shows a native AlertDialog asking "Do you want to exit the app?" with Yes/No
     *
     * This ensures the exit confirmation dialog is always shown when the user
     * is on the home screen, regardless of the web app's current state.
     */
    override fun onBackPressed() {
        webView.evaluateJavascript(
            "if(typeof window.__sudokuHandleBackPress==='function'){window.__sudokuHandleBackPress();}else{window.SudokuAndroid.requestExitDialog();}",
            null
        )
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onRestoreInstanceState(savedInstanceState: Bundle) {
        super.onRestoreInstanceState(savedInstanceState)
        webView.restoreState(savedInstanceState)
    }

    // Inner class for fullscreen Chrome client + console message handler
    inner class SudokuChromeClient(private val activity: Activity) : WebChromeClient() {

        // CRITICAL: Forward all JavaScript console messages to Android logcat.
        // Without this, JS errors are completely invisible — the #1 reason we couldn't
        // diagnose the white screen issue. Now any console.log/error/warn from the
        // WebView will appear in logcat tagged as "SudokuConsole".
        override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
            if (consoleMessage != null) {
                val level = when (consoleMessage.messageLevel()) {
                    ConsoleMessage.MessageLevel.ERROR -> "ERROR"
                    ConsoleMessage.MessageLevel.WARNING -> "WARN"
                    ConsoleMessage.MessageLevel.LOG -> "LOG"
                    ConsoleMessage.MessageLevel.DEBUG -> "DEBUG"
                    else -> "INFO"
                }
                Log.d("SudokuConsole", "[$level] ${consoleMessage.message()} — ${consoleMessage.sourceId()}:${consoleMessage.lineNumber()}")
            }
            return true // We handled it — don't suppress console output
        }

        override fun onShowCustomView(view: View?, callback: CustomViewCallback?) {
            if (customView != null) {
                onHideCustomView()
                return
            }
            customView = view
            originalSystemUiVisibility = activity.window.decorView.systemUiVisibility
            originalOrientation = activity.requestedOrientation

            customViewContainer?.addView(customView)
            activity.window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            )
            activity.requestedOrientation = android.content.pm.ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        }

        override fun onHideCustomView() {
            if (customView == null) return
            activity.window.decorView.systemUiVisibility = originalSystemUiVisibility
            activity.requestedOrientation = originalOrientation
            customViewContainer?.removeView(customView)
            customView = null
        }
    }
}