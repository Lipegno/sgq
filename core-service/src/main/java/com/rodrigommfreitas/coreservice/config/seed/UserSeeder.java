package com.rodrigommfreitas.coreservice.config.seed;

import com.rodrigommfreitas.coreservice.user.Role;
import com.rodrigommfreitas.coreservice.user.User;
import com.rodrigommfreitas.coreservice.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@RequiredArgsConstructor
public class UserSeeder {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap-admin.email}")
    private String adminEmail;

    @Value("${app.bootstrap-admin.password}")
    private String adminPassword;

    @Value("${app.bootstrap-admin.first-name:Administrador}")
    private String adminFirstName;

    @Value("${app.bootstrap-admin.last-name:SGQ}")
    private String adminLastName;

    public void seed() {

        if (userRepository.findByEmail(adminEmail).isPresent()) {
            return;
        }

        User admin = User.builder()
                .email(adminEmail)
                .password(passwordEncoder.encode(adminPassword))
                .firstName(adminFirstName)
                .lastName(adminLastName)
                .roles(Set.of(
                        Role.ROLE_SUPERADMIN,
                        Role.ROLE_USER
                ))
                .build();

        userRepository.save(admin);

        System.out.println(
                "Bootstrap administrator created: " + adminEmail
        );
    }
}