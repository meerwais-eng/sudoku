package com.sudoku.premium

import android.app.Activity
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var webAppInterface: WebAppInterface
    private var customView: View? = null
    private var customViewContainer: FrameLayout? = null
    private var originalSystemUiVisibility: Int = 0
    private var originalOrientation: Int = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

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

        // Load the local static export from assets (Capacitor syncs to public/ dir)
        webView.loadUrl("file:///android_asset/public/index.html")
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

        // Allow file access from assets
        settings.allowFileAccess = true
        settings.allowContentAccess = true

        // Responsive layout
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true

        // Prevent zoom (game handles its own UI scaling)
        settings.setSupportZoom(false)
        settings.builtInZoomControls = false

        // Text scaling
        settings.textZoom = 100

        // Mixed content - allow assets (local) to work
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW

        // Set custom WebViewClient that loads from assets when offline
        webView.webViewClient = SudokuWebViewClient(this)

        // Handle fullscreen requests (for potential video/audio)
        webView.webChromeClient = SudokuChromeClient(this)

        // Bridge native Android functionality to JavaScript as window.SudokuAndroid
        webView.addJavascriptInterface(webAppInterface, "SudokuAndroid")
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

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        // Handle back button - let WebView navigate back if possible
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onRestoreInstanceState(savedInstanceState: Bundle) {
        super.onRestoreInstanceState(savedInstanceState)
        webView.restoreState(savedInstanceState)
    }

    // Inner class for fullscreen Chrome client
    inner class SudokuChromeClient(private val activity: Activity) : WebChromeClient() {
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