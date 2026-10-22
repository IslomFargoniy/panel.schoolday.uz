package uz.schoolday.app.data.remote

import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.runBlocking
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.Interceptor
import okhttp3.Response
import uz.schoolday.app.data.local.SessionStore
import uz.schoolday.app.util.I18n
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthInterceptor @Inject constructor(
    private val session: SessionStore
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()
        val token = runBlocking { session.tokenFlow.firstOrNull() }

        val builder = original.newBuilder()
            .url(withCurrentServer(original.url))
            .header("Accept", "application/json")
            .header("Accept-Language", I18n.language)
        if (!token.isNullOrBlank()) builder.header("Authorization", "Bearer $token")

        val response = chain.proceed(builder.build())

        // Token revoked or expired: drop the session, the app falls back to the login screen
        if (response.code == 401 && !token.isNullOrBlank() && !original.url.encodedPath.endsWith("/auth/login")) {
            runBlocking { session.clearSession() }
        }
        return response
    }

    /**
     * Retrofit's base URL is fixed when the app starts, but the server can be changed on the login
     * screen. Point every call at the server saved now ("…/api/" + the endpoint path).
     */
    private fun withCurrentServer(url: HttpUrl): HttpUrl {
        val saved = runBlocking { session.baseUrlFlow.firstOrNull() }?.toHttpUrlOrNull() ?: return url
        val endpoint = url.encodedPath.substringAfter("/api/", missingDelimiterValue = "")
        if (endpoint.isEmpty() || (saved.host == url.host && saved.port == url.port && saved.scheme == url.scheme)) return url
        return saved.newBuilder()
            .addEncodedPathSegments(endpoint)
            .encodedQuery(url.encodedQuery)
            .build()
    }
}
