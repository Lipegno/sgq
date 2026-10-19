package com.rodrigommfreitas.coreservice.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/** Papéis de quem está a fazer o pedido atual (lidos do token JWT já validado). */
public final class CallerRoles {

    private CallerRoles() {
    }

    public static boolean has(String role) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> role.equals(a.getAuthority()));
    }

    public static boolean isSuperAdmin() {
        return has("ROLE_SUPERADMIN");
    }

    /** Auditor/utilizador externo: só lê, e só os anos que lhe foram atribuídos. */
    public static boolean isExternal() {
        return has("ROLE_EXTERNAL");
    }
}
