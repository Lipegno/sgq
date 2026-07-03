package com.rodrigommfreitas.coreservice.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

public class UserContextHolder {

    private static final ThreadLocal<UserContext> CTX = new ThreadLocal<>();

    public static void set(UserContext ctx) {
        CTX.set(ctx);
    }

    public static UserContext get() {
        return CTX.get();
    }

    public static void clear() {
        CTX.remove();
    }

    public static Long getUserId() {
        UserContext ctx = CTX.get();
        if (ctx != null && ctx.userId() != null) {
            try {
                return Long.parseLong(ctx.userId());
            } catch (NumberFormatException e) {
                // fall through
            }
        }

        Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            String subject = jwtAuth.getToken().getSubject();
            try {
                return Long.parseLong(subject);
            } catch (NumberFormatException e) {
                return null;
            }
        }

        return null;
    }
}