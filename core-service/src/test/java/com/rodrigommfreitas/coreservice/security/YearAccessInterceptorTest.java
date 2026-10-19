package com.rodrigommfreitas.coreservice.security;

import com.rodrigommfreitas.coreservice.user.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.servlet.HandlerMapping;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class YearAccessInterceptorTest {

    @Mock
    UserService userService;

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    private void callerWithRole(String role) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "u", "n/a", List.of(new SimpleGrantedAuthority(role))));
    }

    @Test
    void blocksAYearGivenInThePathWhenTheUserHasNoAccessToIt() throws Exception {
        // ex.: GET /api/audits/year/3 — antes só era verificado o ?yearId=
        doThrow(new AccessDeniedException("sem acesso")).when(userService).validateYearAccess(3L);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/audits/year/3");
        request.setAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE, Map.of("yearId", "3"));
        MockHttpServletResponse response = new MockHttpServletResponse();

        boolean allowed = new YearAccessInterceptor(userService).preHandle(request, response, new Object());

        assertFalse(allowed);
        assertEquals(403, response.getStatus());
    }

    @Test
    void stillChecksTheYearGivenAsAQueryParameter() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/processes/options");
        request.setParameter("yearId", "2");

        boolean allowed = new YearAccessInterceptor(userService).preHandle(request, new MockHttpServletResponse(), new Object());

        assertTrue(allowed);
        verify(userService).validateYearAccess(2L);
    }

    @Test
    void doesNothingForRequestsWithoutAYear() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/years");

        boolean allowed = new YearAccessInterceptor(userService).preHandle(request, new MockHttpServletResponse(), new Object());

        assertTrue(allowed);
        verifyNoInteractions(userService);
    }

    @Test
    void externalUsersCannotReadTheWholeChangeHistoryWithoutAYear() throws Exception {
        callerWithRole("ROLE_EXTERNAL");
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/logs");
        MockHttpServletResponse response = new MockHttpServletResponse();

        boolean allowed = new YearAccessInterceptor(userService).preHandle(request, response, new Object());

        assertFalse(allowed);
        assertEquals(403, response.getStatus());
    }

    @Test
    void externalUsersCanReadTheHistoryOfAYearTheyHaveAccessTo() throws Exception {
        callerWithRole("ROLE_EXTERNAL");
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/logs");
        request.setParameter("yearId", "3");

        boolean allowed = new YearAccessInterceptor(userService).preHandle(request, new MockHttpServletResponse(), new Object());

        assertTrue(allowed);
        verify(userService).validateYearAccess(3L);
    }

    @Test
    void internalUsersCanReadTheHistoryWithoutAYear() throws Exception {
        callerWithRole("ROLE_USER");
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/logs");

        boolean allowed = new YearAccessInterceptor(userService).preHandle(request, new MockHttpServletResponse(), new Object());

        assertTrue(allowed);
    }
}
