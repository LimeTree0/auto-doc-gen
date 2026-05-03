package com.limecoding.core.common;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class ApiResponse<T> {
    private final HttpStatus status;
    private final T data;
    private final String error;

    private ApiResponse(HttpStatus status, T data, String error) {
        this.status = status;
        this.data = data;
        this.error = error;
    }

    public static <T> ApiResponse<T> success(HttpStatus status, T data) {
        return new ApiResponse<>(status, data, null);
    }

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.success(HttpStatus.OK, data);
    }

    public static <T> ApiResponse<T> error(HttpStatus status, String error) {
        return new ApiResponse<>(status, null, error);
    }

    public static <T> ApiResponse<T> error(String error) {
        return ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR, error);
    }
}
