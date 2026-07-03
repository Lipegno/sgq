package com.rodrigommfreitas.coreservice.user.dto;

import com.rodrigommfreitas.coreservice.user.Role;

import java.util.Set;

public record UserDto(
        Long id,
        String firstName,
        String lastName,
        String email,
        Set<Role> roles
) {}