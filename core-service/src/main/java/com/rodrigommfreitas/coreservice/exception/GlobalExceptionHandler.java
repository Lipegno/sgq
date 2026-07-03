package com.rodrigommfreitas.coreservice.exception;

import com.rodrigommfreitas.coreservice.auth.exception.InvalidCredentialsException;
import com.rodrigommfreitas.coreservice.auth.exception.InvalidRefreshTokenException;
import com.rodrigommfreitas.coreservice.user.exception.EmailAlreadyExistsException;
import com.rodrigommfreitas.coreservice.user.exception.PasswordsDontMatchException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleInvalidCredentials(InvalidCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(InvalidRefreshTokenException.class)
    public ResponseEntity<Map<String, String>> handleInvalidRefreshToken(InvalidRefreshTokenException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<Map<String, String>> handleEmailAlreadyExists(EmailAlreadyExistsException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(PasswordsDontMatchException.class)
    public ResponseEntity<Map<String, String>> handlePasswordsDontMatch(PasswordsDontMatchException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        log.error("DataIntegrityViolationException: message={}", ex.getMessage());
        if (ex.getCause() != null) {
            log.error("Cause: type={}, message={}", ex.getCause().getClass().getName(), ex.getCause().getMessage());
        }
        String message = ex.getMessage();
        String userMessage = "Já existe um registo com valores duplicados.";

        if (message != null) {
            String lower = message.toLowerCase();
            if (lower.contains("indicator") && (lower.contains("name") || lower.contains("unique") || lower.contains("uk_") || lower.contains("duplicate"))) {
                userMessage = "Já existe um indicador com este nome.";
            } else if (lower.contains("process") && lower.contains("name")) {
                userMessage = "Já existe um processo com este nome para o ano selecionado.";
            } else if (lower.contains("macro_process") || lower.contains("macroprocess")) {
                userMessage = "Já existe um macro processo com este nome para o ano selecionado.";
            } else if (lower.contains("interested_party") || lower.contains("party")) {
                userMessage = "Já existe uma parte interessada com estes dados para o ano selecionado.";
            } else if (lower.contains("risk") || lower.contains("opportunity")) {
                userMessage = "Já existe um risco/oportunidade com estes dados para o ano selecionado.";
            } else if (lower.contains("quality_objective") || lower.contains("objective")) {
                userMessage = "Já existe um objetivo da qualidade com estes dados para o ano selecionado.";
            } else if (lower.contains("nonconformity") || lower.contains("non_conformity")) {
                userMessage = "Já existe uma não conformidade com estes dados.";
            } else if (lower.contains("communication")) {
                userMessage = "Já existe um registo de comunicação duplicado.";
            } else if (lower.contains("swot")) {
                userMessage = "Já existe uma análise SWOT para este ano.";
            } else if (lower.contains("user") && lower.contains("email")) {
                userMessage = "Já existe um utilizador com este email.";
            } else if (lower.contains("user") && lower.contains("username")) {
                userMessage = "Já existe um utilizador com este nome.";
            } else if (lower.contains("year") && lower.contains("value")) {
                userMessage = "Já existe um registo para este ano.";
            } else if (lower.contains("unique") || lower.contains("duplicate") || lower.contains("constraint")) {
                userMessage = "Já existe um registo com valores duplicados.";
            }
        }

        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", userMessage));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(jakarta.persistence.EntityNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleEntityNotFound(jakarta.persistence.EntityNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntime(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", ex.getMessage()));
    }
}