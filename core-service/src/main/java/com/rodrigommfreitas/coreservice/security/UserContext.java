package com.rodrigommfreitas.coreservice.security;

import java.util.List;

public record UserContext(String userId, List<String> roles) {}