package com.rodrigommfreitas.coreservice.user.dto;

import java.util.Set;

import com.rodrigommfreitas.coreservice.user.Role;

public record UserManagementDto(
        Long id,
        String firstName,
        String lastName,
        String email,
        Set<Role> roles
) {}