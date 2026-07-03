package com.rodrigommfreitas.coreservice.user;

import com.rodrigommfreitas.coreservice.user.dto.CreateExternalUserRequest;
import com.rodrigommfreitas.coreservice.user.dto.CreateUserRequest;
import com.rodrigommfreitas.coreservice.user.dto.CreateUserResponse;
import com.rodrigommfreitas.coreservice.user.dto.ExternalUserResponse;
import com.rodrigommfreitas.coreservice.user.dto.UserDto;
import com.rodrigommfreitas.coreservice.user.dto.UserManagementDto;
import com.rodrigommfreitas.coreservice.user.dto.UserSummary;
import com.rodrigommfreitas.coreservice.user.exception.EmailAlreadyExistsException;
import com.rodrigommfreitas.coreservice.user.exception.PasswordsDontMatchException;
import com.rodrigommfreitas.coreservice.year.Year;
import com.rodrigommfreitas.coreservice.year.YearRepository;
import com.rodrigommfreitas.coreservice.security.UserContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserYearAccessRepository userYearAccessRepository;
    private final YearRepository yearRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public CreateUserResponse createUser(CreateUserRequest request) {
        if (!request.password().equals(request.confirmPassword())) {
            throw new PasswordsDontMatchException();
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException();
        }

        User user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .firstName(request.firstName())
                .lastName(request.lastName())
                .roles(Set.of(Role.ROLE_USER))
                .build();

        User saved = userRepository.save(user);
        return new CreateUserResponse(saved.getId(), saved.getEmail());
    }

    @Transactional
    public CreateUserResponse createExternalUser(CreateExternalUserRequest request) {
        if (!request.password().equals(request.confirmPassword())) {
            throw new PasswordsDontMatchException();
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException();
        }

        User user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .firstName(request.firstName())
                .lastName(request.lastName())
                .roles(Set.of(Role.ROLE_EXTERNAL))
                .build();

        User saved = userRepository.save(user);

        if (request.yearIds() != null && !request.yearIds().isEmpty()) {
            List<Year> years = yearRepository.findAllById(request.yearIds());
            for (Year year : years) {
                userYearAccessRepository.save(UserYearAccess.builder()
                        .user(saved)
                        .year(year)
                        .build());
            }
        }

        return new CreateUserResponse(saved.getId(), saved.getEmail());
    }

    @Transactional(readOnly = true)
    public List<Long> getAccessibleYearIds(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id " + userId));
        if (user.getRoles().stream().anyMatch(r -> r != Role.ROLE_EXTERNAL)) {
            return yearRepository.findAll().stream().map(Year::getId).toList();
        }
        return userYearAccessRepository.findByUserId(userId).stream()
                .map(uya -> uya.getYear().getId())
                .toList();
    }

    public void validateYearAccess(Long yearId) {
        Long userId = UserContextHolder.getUserId();
        if (userId == null) return;
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;
        if (user.getRoles().stream().noneMatch(r -> r == Role.ROLE_EXTERNAL)) return;
        boolean hasAccess = userYearAccessRepository.findByUserId(userId).stream()
                .anyMatch(uya -> uya.getYear().getId().equals(yearId));
        if (!hasAccess) {
            throw new AccessDeniedException("Acesso negado ao ano " + yearId);
        }
    }

    @Transactional(readOnly = true)
    public Year getYearById(Long id) {
        return yearRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Year not found with id " + id));
    }

    @Transactional(readOnly = true)
    public List<ExternalUserResponse> getExternalUsersByYearId(Long yearId) {
        List<UserYearAccess> accesses = userYearAccessRepository.findByYearId(yearId);
        return accesses.stream()
                .filter(a -> a.getUser().getRoles().contains(Role.ROLE_EXTERNAL))
                .map(a -> new ExternalUserResponse(
                        a.getUser().getId(),
                        a.getUser().getFirstName(),
                        a.getUser().getLastName(),
                        a.getUser().getEmail(),
                        userYearAccessRepository.findByUserId(a.getUser().getId()).stream()
                                .map(uya -> uya.getYear().getYear())
                                .sorted()
                                .toList()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id " + id));
        return toDto(user);
    }

    @Transactional(readOnly = true)
    public List<UserDto> getUsersByIds(List<Long> ids) {
        return userRepository.findAllById(ids).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserSummary getUserSummaryById(Long id) {
        if (id == null) return null;
        return userRepository.findById(id)
                .map(this::toSummary)
                .orElse(null);
    }

    @Transactional
    public UserManagementDto updateRoles(Long userId, Set<Role> roles) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id " + userId));
        user.setRoles(roles);
        userRepository.save(user);
        return new UserManagementDto(user.getId(), user.getFirstName(), user.getLastName(), user.getEmail(), user.getRoles());
    }

    private UserDto toDto(User user) {
        return new UserDto(user.getId(), user.getFirstName(), user.getLastName(), user.getEmail(), user.getRoles());
    }

    private UserSummary toSummary(User user) {
        return new UserSummary(user.getId(), user.getFirstName(), user.getLastName(), user.getEmail());
    }
}