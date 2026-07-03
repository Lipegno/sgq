package com.rodrigommfreitas.coreservice.user.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class PasswordsDontMatchException extends RuntimeException {
    public PasswordsDontMatchException() {
        super("The passwords don't match");
    }
}