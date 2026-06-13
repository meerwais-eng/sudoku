# =====================================================
# ProGuard/R8 Rules for Sudoku Premium (Capacitor + WebView)
# =====================================================

# --- General Android Rules ---
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# --- WebView & JavaScript Interface ---
# Keep WebView-related classes and JavaScript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep our custom JavaScript interface class and all its methods
-keep class com.sudoku.premium.WebAppInterface { *; }
-keep class com.sudoku.premium.SudokuWebViewClient { *; }
-keep class com.sudoku.premium.PublicAssetsPathHandler { *; }
-keep class com.sudoku.premium.MainActivity { *; }

# Don't warn about unused WebView classes
-dontwarn android.webkit.**

# --- Capacitor Rules ---
# Keep all Capacitor plugin classes — they are referenced by reflection
-keep class com.getcapacitor.** { *; }
-keep class capacitor.** { *; }
-keepclassmembers class com.getcapacitor.** {
    @com.getcapacitor.annotation.CapacitorPlugin <methods>;
    @com.getcapacitor.annotation.ActivityCallback <methods>;
}

# Keep Capacitor plugin registration
-keepclassmembers class * extends com.getcapacitor.Plugin {
    <init>(...);
}

# Keep Capacitor Bridge
-keep class com.getcapacitor.Bridge { *; }
-keep class com.getcapacitor.CapConfig { *; }

# --- Splash Screen Plugin ---
-keep class com.getcapacitor.splashscreen.** { *; }

# --- Status Bar Plugin ---
-keep class com.getcapacitor.statusbar.** { *; }

# --- AndroidX / Support Library ---
# Only keep specific AndroidX classes used by our app (not all of androidx)
-keep class androidx.appcompat.app.AppCompatActivity { *; }
-keep class androidx.core.app.ActivityCompat { *; }
-keep class androidx.webkit.WebViewClientCompat { *; }
-dontwarn androidx.**

# --- Kotlin ---
-dontwarn kotlin.**
-keep class kotlin.Metadata { *; }

# --- Material Components ---
-dontwarn com.google.android.material.**

# --- WebKit ---
-dontwarn androidx.webkit.**

# --- Don't obfuscate resource file names ---
-keepnames class **.R$* {
    <fields>;
}

# --- Remove logging in release builds ---
-assumenosideeffects class android.util.Log {
    public static int v(...);
    public static int d(...);
    public static int i(...);
}

# =====================================================
# Google Play Services & AdMob Rules
# =====================================================

# Keep Google Play Services
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# Keep AdMob classes
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.android.gms.ads.identifier.** { *; }
-keep class com.google.android.gms.ads.mediation.** { *; }

# Keep AdMob adapters and mediation
-keep class com.google.ads.** { *; }
-dontwarn com.google.ads.**

# Keep Google Play Services common
-keep class com.google.android.gms.common.** { *; }
-keep class com.google.android.gms.tasks.** { *; }

# Prevent AdMob classes from being obfuscated
-keepattributes *Annotation*
-keep class * extends java.util.ListResourceBundle {
    protected Object[][] getContents();
}

# Keep AdMob native ad classes
-keep public class com.google.android.gms.ads.formats.NativeAdOptions
-keep public class com.google.android.gms.ads.formats.UnifiedNativeAd
-keep public class com.google.android.gms.ads.nativead.NativeAd
-keep public class com.google.android.gms.ads.nativead.NativeAdView
-keep public class com.google.android.gms.ads.nativead.MediaView

# Keep the Android Advertising ID
-keep class com.google.android.gms.ads.identifier.AdvertisingIdClient { *; }
-keep class com.google.android.gms.ads.identifier.AdvertisingIdClient$Info { *; }

# Keep AdMob initialization
-keep class com.google.android.gms.ads.MobileAds { *; }
-keep class com.google.android.gms.ads.initialization.** { *; }

# Keep Rewarded Ads
-keep class com.google.android.gms.ads.rewarded.** { *; }
-keep class com.google.android.gms.ads.rewardedinterstitial.** { *; }

# Keep Interstitial Ads  
-keep class com.google.android.gms.ads.interstitial.** { *; }

# Suppress warnings for optional AdMob classes
-dontwarn com.google.android.gms.ads.**
-dontwarn com.google.android.gms.ads.identifier.**
