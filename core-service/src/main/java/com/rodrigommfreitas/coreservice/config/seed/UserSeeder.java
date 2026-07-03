package com.rodrigommfreitas.coreservice.config.seed;

import com.rodrigommfreitas.coreservice.user.Role;
import com.rodrigommfreitas.coreservice.user.User;
import com.rodrigommfreitas.coreservice.user.UserRepository;
import com.rodrigommfreitas.coreservice.user.UserYearAccess;
import com.rodrigommfreitas.coreservice.user.UserYearAccessRepository;
import com.rodrigommfreitas.coreservice.year.Year;
import com.rodrigommfreitas.coreservice.year.YearRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class UserSeeder {

    private final UserRepository userRepository;
    private final UserYearAccessRepository userYearAccessRepository;
    private final YearRepository yearRepository;
    private final PasswordEncoder passwordEncoder;

    record SeedUser(String email, String rawPassword, String firstName, String lastName, Set<Role> roles) {}

    public void seed() {
        if (userRepository.count() == 0) {
            List<SeedUser> users = List.of(
                    new SeedUser("admin@test.com", "admin123", "John", "Doe", Set.of(Role.ROLE_SUPERADMIN, Role.ROLE_USER)),
                    new SeedUser("user@test.com", "user123", "Cristiano", "Ronaldo", Set.of(Role.ROLE_USER)),
                    new SeedUser("john@test.com", "password", "Rodrigo", "Freitas", Set.of(Role.ROLE_USER)),
                    new SeedUser("jane@test.com", "password", "Homer", "Simpson", Set.of(Role.ROLE_USER)),
                    new SeedUser("externo@test.com", "externo123", "Audit", "External", Set.of(Role.ROLE_EXTERNAL)),
                    new SeedUser("deptmanager@test.com", "dept123", "Dept", "Manager", Set.of(Role.ROLE_DEPARTMENT_MANAGER, Role.ROLE_USER))
            );

            users.stream()
                    .map(this::toEntity)
                    .map(userRepository::save)
                    .toList();

            System.out.println("Seeded users: " + users.size());
        }

        ensureExternalUserYearAccess();
    }

    private void ensureExternalUserYearAccess() {
        userRepository.findByEmail("externo@test.com").ifPresent(externalUser ->
                yearRepository.findByYear(2026).ifPresent(year2026 -> {
                    boolean alreadyHasAccess = userYearAccessRepository.findByUserId(externalUser.getId()).stream()
                            .anyMatch(uya -> uya.getYear().getId().equals(year2026.getId()));
                    if (!alreadyHasAccess) {
                        userYearAccessRepository.save(UserYearAccess.builder()
                                .user(externalUser)
                                .year(year2026)
                                .build());
                        System.out.println("Created UserYearAccess for externo@test.com -> year 2026");
                    }
                })
        );
    }

    private User toEntity(SeedUser seed) {
        return User.builder()
                .email(seed.email())
                .password(passwordEncoder.encode(seed.rawPassword()))
                .firstName(seed.firstName())
                .lastName(seed.lastName())
                .roles(seed.roles())
                .build();
    }
}