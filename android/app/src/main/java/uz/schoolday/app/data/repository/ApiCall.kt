package uz.schoolday.app.data.repository

import com.google.gson.Gson
import com.google.gson.JsonObject
import retrofit2.Response
import uz.schoolday.app.data.remote.dto.ApiResponse
import uz.schoolday.app.data.remote.dto.Page
import uz.schoolday.app.data.remote.dto.PageMeta
import uz.schoolday.app.util.tr

/**
 * One way to call the API: success needs `success: true` and data; any 4xx/5xx shows the server's
 * own message (Laravel validation or ours), falling back to a generic one.
 */
suspend fun <T> apiCall(gson: Gson, request: suspend () -> Response<ApiResponse<T>>): Resource<T> = try {
    val response = request()
    val body = response.body()
    if (response.isSuccessful && body?.success == true && body.data != null) {
        Resource.Success(body.data)
    } else {
        Resource.Error(body?.message ?: errorMessage(gson, response) ?: tr("Server xatosi (%s)", response.code()))
    }
} catch (e: Exception) {
    Resource.Error(tr("Internetga ulanib bo'lmadi"))
}

/** A paginated list: the items plus the "meta" block. */
suspend fun <T> pageCall(gson: Gson, request: suspend () -> Response<ApiResponse<List<T>>>): Resource<Page<T>> = try {
    val response = request()
    val body = response.body()
    if (response.isSuccessful && body?.success == true) {
        Resource.Success(Page(body.data.orEmpty(), body.meta ?: PageMeta()))
    } else {
        Resource.Error(body?.message ?: errorMessage(gson, response) ?: tr("Server xatosi (%s)", response.code()))
    }
} catch (e: Exception) {
    Resource.Error(tr("Internetga ulanib bo'lmadi"))
}

/** For endpoints whose data may be empty/null: success flag only. */
suspend fun apiAction(gson: Gson, request: suspend () -> Response<ApiResponse<Any>>): Resource<Unit> = try {
    val response = request()
    val body = response.body()
    if (response.isSuccessful && body?.success != false) Resource.Success(Unit)
    else Resource.Error(body?.message ?: errorMessage(gson, response) ?: tr("Server xatosi (%s)", response.code()))
} catch (e: Exception) {
    Resource.Error(tr("Internetga ulanib bo'lmadi"))
}

fun errorJson(gson: Gson, response: Response<*>): JsonObject? = try {
    response.errorBody()?.string()?.let { gson.fromJson(it, JsonObject::class.java) }
} catch (e: Exception) {
    null
}

private fun errorMessage(gson: Gson, response: Response<*>): String? = messageOf(errorJson(gson, response), response.code())

/** Laravel validation {"errors": {"field": ["first problem"]}} or {"message": "..."}; school_inactive gets our own text. */
fun messageOf(json: JsonObject?, code: Int): String? {
    if (json == null) return null
    if (code == 403 && json.get("error")?.asString == "school_inactive") {
        return tr("Maktab faol emas yoki obuna muddati tugagan. Administrator bilan bog'laning.")
    }
    return json.getAsJsonObject("errors")?.entrySet()?.firstOrNull()?.value?.asJsonArray?.firstOrNull()?.asString
        ?: json.get("message")?.takeIf { it.isJsonPrimitive }?.asString
}
