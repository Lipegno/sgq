package com.rodrigommfreitas.coreservice.user;

import com.rodrigommfreitas.coreservice.user.dto.UserSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Utility to resolve User entities to UserSummary DTOs.
 * Inject this into any service that needs to map User references to UserSummary.
 */
@Service
@RequiredArgsConstructor
public class UserReferenceService {

    private final UserRepository userRepository;

    public UserSummary toSummary(Long userId) {
        if (userId == null) return null;
        return userRepository.findById(userId)
                .map(this::toSummary)
                .orElse(null);
    }

    public UserSummary toSummary(com.rodrigommfreitas.coreservice.user.User user) {
        if (user == null) return null;
        return new UserSummary(user.getId(), user.getFirstName(), user.getLastName(), user.getEmail());
    }

    /**
     * Batch-resolve multiple user IDs to UserSummary objects.
     * Returns a map of userId -> UserSummary for efficient lookups.
     */
    public Map<Long, UserSummary> toSummaryMap(Set<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) return Map.of();
        return userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(
                        User::getId,
                        u -> new UserSummary(u.getId(), u.getFirstName(), u.getLastName(), u.getEmail())
                ));
    }

    /**
     * Resolve a User entity reference to UserSummary.
     */
    public UserSummary fromEntity(com.rodrigommfreitas.coreservice.user.User user) {
        return toSummary(user);
    }
}