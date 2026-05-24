package com.sudoku.premium

import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.webkit.JavascriptInterface
import android.widget.Toast

/**
 * JavaScript interface that bridges the WebView with native Android functionality.
 * Exposed as `window.SudokuAndroid` in the WebView's JavaScript context.
 *
 * This allows the web app to:
 * - Detect it's running inside a native Android app
 * - Trigger haptic feedback (vibration)
 * - Share content via Android's native share sheet
 * - Show native toast messages
 * - Get device/platform info
 */
class WebAppInterface(private val context: Context) {

    /** Whether the app is running inside a native Android wrapper */
    @JavascriptInterface
    fun isNativeApp(): Boolean = true

    /** The platform identifier */
    @JavascriptInterface
    fun getPlatform(): String = "android"

    /** Get the Android version (API level) */
    @JavascriptInterface
    fun getAndroidVersion(): Int = Build.VERSION.SDK_INT

    /** Get the device model name */
    @JavascriptInterface
    fun getDeviceModel(): String = Build.MODEL

    /** Get the Android release version string (e.g. "14") */
    @JavascriptInterface
    fun getAndroidRelease(): String = Build.VERSION.RELEASE

    /**
     * Trigger a short haptic vibration (tap feedback).
     * Duration: ~50ms, typical for button press feedback.
     */
    @JavascriptInterface
    fun hapticTap() {
        vibrate(50)
    }

    /**
     * Trigger a medium haptic vibration (success feedback).
     * Duration: ~100ms, typical for completion/success events.
     */
    @JavascriptInterface
    fun hapticSuccess() {
        vibrate(100)
    }

    /**
     * Trigger a long haptic vibration (error/warning feedback).
     * Duration: ~200ms, typical for error states.
     */
    @JavascriptInterface
    fun hapticError() {
        vibrate(200)
    }

    /**
     * Trigger a pattern vibration for level completion celebration.
     * Pattern: short bursts with gaps — [100, 50, 100, 50, 200]
     */
    @JavascriptInterface
    fun hapticCelebration() {
        val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val pattern = longArrayOf(0, 100, 50, 100, 50, 200)
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(longArrayOf(0, 100, 50, 100, 50, 200), -1)
        }
    }

    /**
     * Show a native Android toast message.
     * @param message The text to display
     * @param duration "short" (2s) or "long" (3.5s)
     */
    @JavascriptInterface
    fun showToast(message: String, duration: String) {
        val length = if (duration == "long") Toast.LENGTH_LONG else Toast.LENGTH_SHORT
        Toast.makeText(context, message, length).show()
    }

    /**
     * Share text content via Android's native share sheet.
     * @param text The text to share
     * @param title Optional title for the share dialog
     */
    @JavascriptInterface
    fun shareText(text: String, title: String) {
        val intent = Intent(Intent.ACTION_SEND)
        intent.type = "text/plain"
        intent.putExtra(Intent.EXTRA_TEXT, text)
        intent.putExtra(Intent.EXTRA_SUBJECT, title)

        val chooserIntent = Intent.createChooser(intent, title)
        chooserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(chooserIntent)
    }

    /**
     * Exit the app (for settings screen "quit" button).
     */
    @JavascriptInterface
    fun exitApp() {
        if (context is android.app.Activity) {
            context.finish()
        }
    }

    // --- Private helpers ---

    /**
     * Vibrate the device for a given duration in milliseconds.
     */
    private fun vibrate(durationMs: Long) {
        val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(
                VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE)
            )
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(durationMs)
        }
    }
}