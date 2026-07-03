package com.rodrigommfreitas.coreservice.user;

import com.rodrigommfreitas.coreservice.security.UserContextHolder;
import com.rodrigommfreitas.coreservice.user.dto.CreateExternalUserRequest;
import com.rodrigommfreitas.coreservice.user.dto.CreateUserRequest;
import com.rodrigommfreitas.coreservice.user.dto.CreateUserResponse;
import com.rodrigommfreitas.coreservice.user.dto.ExternalUserResponse;
import com.rodrigommfreitas.coreservice.user.dto.UserDto;
import com.rodrigommfreitas.coreservice.user.dto.UserManagementDto;
import com.rodrigommfreitas.coreservice.year.dto.YearResponse;
import com.rodrigommfreitas.coreservice.user.Role;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CreateUserResponse create(@Valid @RequestBody CreateUserRequest request) {
        return userService.createUser(request);
    }

    @PostMapping("/external")
    @ResponseStatus(HttpStatus.CREATED)
    public CreateUserResponse createExternal(@Valid @RequestBody CreateExternalUserRequest request) {
        return userService.createExternalUser(request);
    }

    @GetMapping("/me/years")
    @ResponseStatus(HttpStatus.OK)
    public List<YearResponse> getMyYears() {
        Long userId = UserContextHolder.getUserId();
        return userService.getAccessibleYearIds(userId).stream()
                .map(id -> {
                    var year = userService.getYearById(id);
                    return new YearResponse(year.getId(), year.getYear());
                })
                .toList();
    }

    @GetMapping("/external")
    @ResponseStatus(HttpStatus.OK)
    public List<ExternalUserResponse> getExternalUsers(@RequestParam Long yearId) {
        return userService.getExternalUsersByYearId(yearId);
    }

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<UserDto> getAll() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public UserDto getById(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    @GetMapping("/batch")
    @ResponseStatus(HttpStatus.OK)
    public List<UserDto> getByIds(@RequestParam List<Long> ids) {
        return userService.getUsersByIds(ids);
    }

    @PatchMapping("/{id}/roles")
    @ResponseStatus(HttpStatus.OK)
    public UserManagementDto updateRoles(@PathVariable Long id, @RequestBody Set<Role> roles) {
        return userService.updateRoles(id, roles);
    }
}