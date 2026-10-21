-keepattributes *Annotation*
-keep class uz.schoolday.app.data.remote.dto.** { *; }

# Retrofit + Gson: generic types (ApiResponse<T>, PageResponse<T>) are read via reflection
-keepattributes Signature, InnerClasses, EnclosingMethod, Exceptions
-keep,allowobfuscation,allowshrinking class com.google.gson.reflect.TypeToken
-keep,allowobfuscation,allowshrinking class * extends com.google.gson.reflect.TypeToken
-keep,allowobfuscation,allowshrinking interface retrofit2.Call
-keep,allowobfuscation,allowshrinking class retrofit2.Response
-keep,allowobfuscation,allowshrinking class kotlin.coroutines.Continuation
-keepclassmembers,allowobfuscation class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-dontwarn javax.annotation.**
-dontwarn org.codehaus.mojo.animal_sniffer.**
