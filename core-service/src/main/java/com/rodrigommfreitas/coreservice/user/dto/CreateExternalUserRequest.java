package com.rodrigommfreitas.coreservice.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateExternalUserRequest(
        @Email @NotBlank String email,
        @NotBlank @Size(min = 8) String password,
        @NotBlank @Size(min = 8) String confirmPassword,
        @NotBlank @Size(min = 2) String firstName,
        @NotBlank String lastName,
        List<Long> yearIds
) {}