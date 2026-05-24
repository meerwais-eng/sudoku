package com.sudoku.premium

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.webkit.MimeTypeMap
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import java.io.InputStream
import java.net.URLConnection

/**
 * Custom WebViewClient that serves all content from the local assets directory.
 * This makes the app fully offline-capable — no server or internet required.
 *
 * Strategy:
 * - All requests to the app's own origin are served from assets
 * - External CDN requests (fonts, etc.) are intercepted and served locally if available,
 *   or allowed to proceed if online
 * - If offline, everything falls back to local assets
 */
class SudokuWebViewClient(private val context: Context) : WebViewClient() {

    private val assetBasePath = "public"

    override fun shouldInterceptRequest(
        view: WebView?,
        request: WebResourceRequest?
    ): WebResourceResponse? {
        if (request == null) return null

        val url = request.url.toString()

        // Serve local app content from assets
        if (url.startsWith("file:///android_asset/")) {
            return null // Let WebView handle asset URLs natively
        }

        // For our app's pages and resources, serve from assets
        val assetPath = mapUrlToAssetPath(url)
        if (assetPath != null) {
            return loadFromAssets(assetPath)
        }

        // If offline, try to serve external resources from cached assets
        if (!isNetworkAvailable()) {
            val cachedAssetPath = mapExternalUrlToCachedAsset(url)
            if (cachedAssetPath != null) {
                return loadFromAssets(cachedAssetPath)
            }
        }

        // Let external requests proceed normally (fonts, etc.)
        return super.shouldInterceptRequest(view, request)
    }

    override fun onPageFinished(view: WebView?, url: String?) {
        super.onPageFinished(view, url)
        // The native WebAppInterface is already injected as window.SudokuAndroid
        // by MainActivity.addJavascriptInterface(). Here we add convenience
        // synchronous properties that the web app can check without calling methods.
        view?.evaluateJavascript(
            """
            if (typeof window.SudokuAndroid !== 'undefined') {
                // Add synchronous convenience flags alongside the native @JavascriptInterface methods
                window.SudokuAndroid._isNative = true;
                window.SudokuAndroid._platform = 'android';
            }
            """.trimIndent(), null
        )
    }

    /**
     * Maps a web URL to the corresponding asset file path.
     * Handles Next.js static export routing (index.html, 404.html fallback).
     */
    private fun mapUrlToAssetPath(url: String): String? {
        // Only handle our own app URLs (file:// or same-origin)
        if (!url.startsWith("file:///android_asset/") && !url.startsWith("https://") && !url.startsWith("http://")) {
            return null
        }

        var path: String

        if (url.startsWith("file:///android_asset/")) {
            path = url.removePrefix("file:///android_asset/")
        } else {
            // Extract path from http/https URLs
            val uri = android.net.Uri.parse(url)
            path = uri.path ?: "/"
        }

        // Remove leading slash
        if (path.startsWith("/")) {
            path = path.removePrefix("/")
        }

        // Map root to index.html
        if (path.isEmpty() || path == "/") {
            return "$assetBasePath/index.html"
        }

        // Construct full asset path
        val fullPath = "$assetBasePath/$path"

        // Check if the exact file exists in assets
        if (assetExists(fullPath)) {
            return fullPath
        }

        // Next.js static export: /some-page → /some-page.html
        val htmlPath = "$fullPath.html"
        if (assetExists(htmlPath)) {
            return htmlPath
        }

        // Next.js static export: /some-page/ → /some-page/index.html
        val indexHtmlPath = "$fullPath/index.html"
        if (assetExists(indexHtmlPath)) {
            return indexHtmlPath
        }

        // Fallback to 404.html for unknown routes
        val notFoundPath = "$assetBasePath/404.html"
        if (assetExists(notFoundPath)) {
            return notFoundPath
        }

        // Final fallback to index.html
        return "$assetBasePath/index.html"
    }

    /**
     * Maps external CDN URLs to locally cached asset files.
     * Used when offline to serve fonts and other resources from assets.
     */
    private fun mapExternalUrlToCachedAsset(url: String): String? {
        // Cache Google Fonts locally if needed
        // For now, we rely on the game not requiring external fonts offline
        // (Geist fonts are bundled in the Next.js static export)
        return null
    }

    /**
     * Loads a file from the assets directory as a WebResourceResponse.
     */
    private fun loadFromAssets(assetPath: String): WebResourceResponse? {
        try {
            val inputStream: InputStream? = context.assets.open(assetPath)
            if (inputStream == null) return null

            val mimeType = getMimeType(assetPath)
            val encoding = if (mimeType.startsWith("text/") || mimeType == "application/javascript") {
                "UTF-8"
            } else {
                null
            }

            return WebResourceResponse(mimeType, encoding, inputStream)
        } catch (e: Exception) {
            // File not found in assets
            return null
        }
    }

    /**
     * Checks if a file exists in the assets directory.
     */
    private fun assetExists(path: String): Boolean {
        try {
            val stream = context.assets.open(path)
            stream.close()
            return true
        } catch (e: Exception) {
            return false
        }
    }

    /**
     * Determines MIME type from file extension.
     */
    private fun getMimeType(path: String): String {
        val extension = path.substringAfterLast('.', "").lowercase()
        return when (extension) {
            "html" -> "text/html"
            "js" -> "application/javascript"
            "css" -> "text/css"
            "json" -> "application/json"
            "png" -> "image/png"
            "jpg", "jpeg" -> "image/jpeg"
            "gif" -> "image/gif"
            "svg" -> "image/svg+xml"
            "ico" -> "image/x-icon"
            "webp" -> "image/webp"
            "woff" -> "font/woff"
            "woff2" -> "font/woff2"
            "ttf" -> "font/ttf"
            "otf" -> "font/otf"
            "webm" -> "video/webm"
            "mp4" -> "video/mp4"
            "mp3" -> "audio/mpeg"
            "wav" -> "audio/wav"
            "ogg" -> "audio/ogg"
            "xml" -> "application/xml"
            "txt" -> "text/plain"
            else -> {
                MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension)
                    ?: URLConnection.guessContentTypeFromName(path)
                    ?: "application/octet-stream"
            }
        }
    }

    /**
     * Checks if network is available.
     */
    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }
}