package com.rodrigommfreitas.coreservice.exception;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.sql.SQLException;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    private ResponseEntity<Map<String, String>> handle(String message, String sqlState) {
        return handler.handleDataIntegrityViolation(
                new DataIntegrityViolationException(message, new SQLException(message, sqlState)));
    }

    @Test
    void valueTooLongIsNotReportedAsDuplicate() {
        var response = handle("value too long for type character varying(255) insert into non_conformity", "22001");
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Um dos campos excede o tamanho máximo permitido.", response.getBody().get("message"));
    }

    @Test
    void checkConstraintIsNotReportedAsDuplicate() {
        var response = handle("violates check constraint logs_entity_type_check", "23514");
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Um dos valores indicados não é permitido.", response.getBody().get("message"));
    }

    @Test
    void notNullViolationAsksForTheMissingField() {
        var response = handle("null value in column name violates not-null constraint", "23502");
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Falta preencher um campo obrigatório.", response.getBody().get("message"));
    }

    @Test
    void realUniqueViolationStillReportsDuplicate() {
        var response = handle("duplicate key value violates unique constraint uk_indicator_name on indicators", "23505");
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("Já existe um indicador com este nome.", response.getBody().get("message"));
    }

    @Test
    void referencedRowStillExplainsDeletionIsBlocked() {
        var response = handle("update or delete violates foreign key constraint: key is still referenced from table x", "23503");
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
    }

    @Test
    void accessDeniedIsForbiddenNotBadRequest() {
        var response = handler.handleAccessDenied(new org.springframework.security.access.AccessDeniedException("Access Denied"));
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    }
}
