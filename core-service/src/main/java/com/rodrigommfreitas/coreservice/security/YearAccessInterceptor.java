package com.rodrigommfreitas.coreservice.security;

import com.rodrigommfreitas.coreservice.user.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class YearAccessInterceptor implements HandlerInterceptor {

    private final UserService userService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String yearIdParam = request.getParameter("yearId");
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