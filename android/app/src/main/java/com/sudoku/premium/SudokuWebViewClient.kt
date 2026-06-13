package com.sudoku.premium

import android.content.Context
import android.content.pm.ApplicationInfo
import android.util.Log
import android.webkit.MimeTypeMap
import android.webkit.WebResourceRequest
import android.webkit.WebResourceError
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.webkit.WebViewAssetLoader
import java.io.ByteArrayInputStream
import java.io.InputStream
import java.net.URLConnection

/**
 * Custom WebViewClient that uses WebViewAssetLoader to serve all local content
 * via https://appassets.android.platform.net/ instead of file:///android_asset/.
 *
 * This is the officially recommended approach by Android/Google for serving local
 * content in WebView. It eliminates all file:// protocol issues:
 *
 * - Root-relative paths like /_next/... from index.html resolve to
 *   https://appassets.android.platform.net/_next/... which our PublicAssetsPathHandler
 *   maps to assets/public/_next/... (the correct path)
 * - shouldInterceptRequest() IS called for https:// URLs (unlike file:// sub-resources)
 * - No allowFileAccessFromFileURLs / mixedContentMode hacks needed
 * - Turbopack's dynamic chunk loading works because /_next/... resolves correctly
 *
 * Strategy:
 * - ALL https://appassets.android.platform.net/ URLs are served by the assetLoader
 *   through our PublicAssetsPathHandler which maps to assets/public/
 * - External URLs (CDN, etc.) are let through to load normally
 * - onPageFinished injects native bridge flags
 */
class SudokuWebViewClient(
    private val context: Context,
    private val assetLoader: WebViewAssetLoader
) : WebViewClient() {

    private val TAG = "SudokuWebView"

    // Only log resource requests in debug builds.
    // In release builds, Log.d() calls create unnecessary I/O overhead in
    // shouldInterceptRequest() which is called on every resource load (JS, CSS,
    // fonts, etc.) — this is on a background thread but the string formatting
    // and I/O still add latency that can affect touch responsiveness.
    private val isDebugBuild = (0 != context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE)

    override fun shouldInterceptRequest(
        view: WebView?,
        request: WebResourceRequest?
    ): WebResourceResponse? {
        if (request == null) return null

        val url = request.url.toString()
        if (isDebugBuild) Log.d(TAG, "shouldInterceptRequest: $url")

        // Delegate to WebViewAssetLoader — it handles all
        // https://appassets.android.platform.net/ URLs by serving from assets
        val response = assetLoader.shouldInterceptRequest(request.url)
        if (response != null) {
            if (isDebugBuild) Log.d(TAG, "AssetLoader served: $url → mimeType=${response.mimeType}")
            return response
        }

        // For all other URLs (external https/http), let WebView handle normally
        if (isDebugBuild) Log.d(TAG, "External URL (not served by AssetLoader): $url")
        return super.shouldInterceptRequest(view, request)
    }

    // CRITICAL: Log any navigation/resource loading errors from the WebView.
    // These callbacks are essential for diagnosing white screen issues.
    override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
        if (request != null && error != null) {
            Log.e(TAG, "onReceivedError: url=${request.url}, errorCode=${error.errorCode}, description=${error.description}")
        }
        super.onReceivedError(view, request, error)
    }

    override fun onReceivedHttpError(view: WebView?, request: WebResourceRequest?, errorResponse: WebResourceResponse?) {
        if (request != null && errorResponse != null) {
            Log.e(TAG, "onReceivedHttpError: url=${request.url}, statusCode=${errorResponse.statusCode}, reason=${errorResponse.reasonPhrase}, mimeType=${errorResponse.mimeType}")
        }
        super.onReceivedHttpError(view, request, errorResponse)
    }

    override fun onPageFinished(view: WebView?, url: String?) {
        super.onPageFinished(view, url)
        Log.d(TAG, "onPageFinished: $url")

        // Set native platform flags AND install the back-press handler.
        // The back-press handler bridges Android's native onBackPressed() to
        // the web app's Zustand navigation logic:
        //
        // window.__sudokuHandleBackPress() is called by MainActivity.onBackPressed().
        // It reads the Zustand store's currentScreen and screenHistory to decide:
        //   1. Not on home screen → calls goBack() to navigate to previous screen
        //   2. On home screen → calls SudokuAndroid.requestExitDialog() which shows
        //      a native AlertDialog asking "Do you want to exit the app?" with Yes/No
        //
        // This is injected in onPageFinished rather than served in index.html because:
        // - It depends on window.SudokuAndroid being available (from addJavascriptInterface)
        // - It needs to access the Zustand store which loads asynchronously
        // - onPageFinished guarantees the page's JS context is fully initialized
        view?.evaluateJavascript(
            """
            (function() {
                if (typeof window.SudokuAndroid !== 'undefined') {
                    window.SudokuAndroid._isNative = true;
                    window.SudokuAndroid._platform = 'android';
                }
                window.__sudokuHandleBackPress = function() {
                    try {
                        var store = window.__sudokuStore && window.__sudokuStore.getState ? window.__sudokuStore.getState() : null;
                        if (store && store.currentScreen !== 'home') {
                            store.goBack();
                        } else {
                            window.SudokuAndroid.requestExitDialog();
                        }
                    } catch(e) {
                        console.error('__sudokuHandleBackPress error:', e);
                        window.SudokuAndroid.requestExitDialog();
                    }
                };
            })();
            """.trimIndent(), null
        )
    }
}

/**
 * Custom PathHandler for WebViewAssetLoader that maps ALL paths to assets/public/.
 *
 * The default AssetsPathHandler serves from the root of assets/ (e.g., assets/index.html).
 * But our Next.js static export is synced to assets/public/ by Capacitor.
 * So we need a custom handler that prepends "public/" to all paths.
 *
 * Examples:
 * - path="_next/static/chunks/abc.js" → opens "public/_next/static/chunks/abc.js"
 * - path="index.html" → opens "public/index.html"
 * - path="" (root) → opens "public/index.html"
 *
 * Also handles Next.js static export routing:
 * - /some-page → try /some-page.html, then /some-page/index.html, then 404.html
 */
class PublicAssetsPathHandler(private val context: Context) : WebViewAssetLoader.PathHandler {

    private val TAG = "PublicAssetsHandler"

    override fun handle(path: String): WebResourceResponse? {
        Log.d(TAG, "handle: path=$path")

        // Map root and index.html to the main page (with injected error-catching JS)
        if (path.isEmpty() || path == "/" || path == "public/" || path == "public" || path == "index.html") {
            return serveIndexHtmlWithInjectedJs()
        }

        // Construct full asset path: prepend "public/" to the URL path
        val fullPath = "public/$path"

        // Try exact file first
        val response = serveAsset(fullPath)
        if (response != null) return response

        // AAPT2 workaround: AAPT2 excludes directories starting with _ from the APK.
        // Our Gradle build renames _next/ → next/ in the assets directory.
        // When WebView requests /_next/... URLs, we need to map them to public/next/...
        if (path.startsWith("_next/")) {
            val renamedPath = "public/next/" + path.substring(6)
            Log.d(TAG, "AAPT2 workaround: mapping _next → next, path=$path → renamed=$renamedPath")
            val renamedResponse = serveAsset(renamedPath)
            if (renamedResponse != null) return renamedResponse
        }

        // Next.js static export: /some-page → /some-page.html
        val htmlPath = "$fullPath.html"
        val htmlResponse = serveAsset(htmlPath)
        if (htmlResponse != null) return htmlResponse

        // Next.js static export: /some-page/ → /some-page/index.html
        val indexHtmlPath = "$fullPath/index.html"
        val indexResponse = serveAsset(indexHtmlPath)
        if (indexResponse != null) return indexResponse

        // Fallback to 404.html
        val notFoundResponse = serveAsset("public/404.html")
        if (notFoundResponse != null) return notFoundResponse

        // Final fallback to index.html (SPA routing) — also with injected error-catching JS
        Log.w(TAG, "No asset found for path=$path, falling back to index.html")
        return serveIndexHtmlWithInjectedJs()
    }

    private fun serveAsset(assetPath: String): WebResourceResponse? {
        try {
            val inputStream: InputStream? = context.assets.open(assetPath)
            if (inputStream == null) {
                Log.e(TAG, "serveAsset: null stream for $assetPath")
                return null
            }

            val mimeType = getMimeType(assetPath)
            val encoding = if (mimeType.startsWith("text/") || mimeType == "application/javascript") {
                "UTF-8"
            } else {
                null
            }

            Log.d(TAG, "serveAsset: $assetPath → $mimeType")
            return WebResourceResponse(mimeType, encoding, inputStream)
        } catch (e: Exception) {
            // File not found in assets — this is normal, try next fallback
            return null
        }
    }

    /**
     * Serves index.html with injected error-catching JavaScript.
     *
     * Since we use loadUrl() instead of loadDataWithBaseURL(), we can't modify
     * the HTML content before loading it into the WebView. Instead, we inject
     * the error-catching JS when PublicAssetsPathHandler serves index.html.
     * This ensures the handlers are installed before any other JavaScript runs,
     * catching errors during page load and React hydration.
     */
    private fun serveIndexHtmlWithInjectedJs(): WebResourceResponse? {
        try {
            val inputStream = context.assets.open("public/index.html")
            if (inputStream == null) {
                Log.e(TAG, "serveIndexHtmlWithInjectedJs: null stream for public/index.html")
                return null
            }

            // Read the entire HTML content into a String
            val html = inputStream.bufferedReader().use { it.readText() }
            inputStream.close()

            // Inject error-catching JS right after <head> — this ensures handlers
            // are installed before any other JS runs on the page
            val viewportFixAndErrorCatchJs = """<script>
// === VIEWPORT FIX ===
// When loadUrl() is called before the WebView has been laid out (innerWidth=0),
// the viewport meta tag's "width=device-width" resolves to 0, making body width=0px
// and collapsing all content to zero width → white screen.
// This fix uses screen.width (which IS available even when innerWidth=0) as a fallback.
(function(){
  if(window.innerWidth===0){
    // Force viewport to use screen.width instead of device-width (which is 0)
    var vp=document.querySelector('meta[name="viewport"]');
    if(vp){
      var c=vp.getAttribute('content');
      if(c&&c.indexOf('width=device-width')!==-1){
        vp.setAttribute('content',c.replace('width=device-width','width='+screen.width));
        console.log('VIEWPORT_FIX:replaced device-width with screen.width='+screen.width);
      }
    }
    // CSS fallback: ensure html/body have minimum width even if viewport fix fails
    var s=document.createElement('style');
    s.textContent='html{min-width:'+screen.width+'px!important}body{min-width:'+screen.width+'px!important}';
    document.head.appendChild(s);
    console.log('VIEWPORT_FIX:added CSS min-width='+screen.width+'px');
  } else {
    console.log('VIEWPORT_FIX:innerWidth='+window.innerWidth+', no fix needed');
  }
})();
// === ERROR CATCHING ===
window.onerror=function(msg,src,line,col,err){console.error('JS_ERR:'+msg+' at '+src+':'+line+':'+col);if(err&&err.stack)console.error('JS_ERR_STACK:'+err.stack);return false;};
window.addEventListener('unhandledrejection',function(e){console.error('JS_REJECT:'+e.reason);if(e.reason&&e.reason.stack)console.error('JS_REJECT_STACK:'+e.reason.stack);});
console.log('JS_DIAG:error_handlers_installed');
</script>"""

            val modifiedHtml = html.replace("<head>", "<head>" + viewportFixAndErrorCatchJs)

            Log.d(TAG, "serveIndexHtmlWithInjectedJs: injected error-catching JS into index.html (${html.length} → ${modifiedHtml.length} chars)")
            return WebResourceResponse("text/html", "UTF-8", ByteArrayInputStream(modifiedHtml.toByteArray(Charsets.UTF_8)))
        } catch (e: Exception) {
            Log.e(TAG, "serveIndexHtmlWithInjectedJs: failed to read/modify index.html", e)
            // Fall back to serving unmodified index.html
            return serveAsset("public/index.html")
        }
    }

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
}