package com.rodrigommfreitas.coreservice.security;

import com.rodrigommfreitas.coreservice.user.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class YearAccessInterceptor implements HandlerInterceptor {

    private final UserService userService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // O ano chega de duas formas: ?yearId=... e /year/{yearId} (a maioria das rotas
        // "por ano"). Só a primeira era verificada, pelo que um utilizador externo
        // conseguia ler anos não autorizados pelas rotas com o ano no caminho.
        String yearIdParam = request.getParameter("yearId");
        if (yearIdParam == null) {
            @SuppressWarnings("unchecked")
            Map<String, String> pathVariables =
                    (Map<String, String>) request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);
            if (pathVariables != null) {
                yearIdParam = pathVariables.get("yearId");
            }
        }
        // O histórico de alterações cobre todos os anos e entidades: um externo só o
        // pode pedir para um ano concreto (que é depois validado abaixo).
        if (yearIdParam == null && CallerRoles.isExternal()
                && request.getRequestURI().startsWith("/api/logs")) {
            response.sendError(HttpStatus.FORBIDDEN.value(), "Indique o ano para consultar o histórico.");
            return false;
        }
        if (yearIdParam != null) {
            try {
                Long yearId = Long.parseLong(yearIdParam);
                userService.validateYearAccess(yearId);
            } catch (AccessDeniedException e) {
                response.sendError(HttpStatus.FORBIDDEN.value(), e.getMessage());
                return false;
            } catch (NumberFormatException e) {
                // ignore invalid param
            }
        }
        return true;
    }
}