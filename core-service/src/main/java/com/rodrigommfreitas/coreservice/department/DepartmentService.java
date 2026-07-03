package com.rodrigommfreitas.coreservice.department;

import com.rodrigommfreitas.coreservice.department.dto.CreateDepartmentRequest;
import com.rodrigommfreitas.coreservice.department.dto.DepartmentResponse;
import com.rodrigommfreitas.coreservice.department.dto.UpdateDepartmentRequest;
import com.rodrigommfreitas.coreservice.log.ActionType;
import com.rodrigommfreitas.coreservice.log.EntityType;
import com.rodrigommfreitas.coreservice.log.LogService;
import com.rodrigommfreitas.coreservice.log.dto.CreateLogRequest;
import com.rodrigommfreitas.coreservice.log.utils.LogDetailsBuilder;
import com.rodrigommfreitas.coreservice.security.UserContextHolder;
import com.rodrigommfreitas.coreservice.user.User;
import com.rodrigommfreitas.coreservice.user.UserRepository;
import com.rodrigommfreitas.coreservice.user.dto.UserSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final UserDepartmentRepository userDepartmentRepository;
    private final UserRepository userRepository;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;

    public List<DepartmentResponse> getAll() {
        return departmentRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public DepartmentResponse getById(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Department not found"));
        return toResponse(dept);
    }

    @Transactional
    public DepartmentResponse create(CreateDepartmentRequest request) {
        if (departmentRepository.existsByName(request.name())) {
            throw new IllegalArgumentException("Department name already exists");
        }

        Department department = Department.builder()
                .name(request.name())
                .build();
        department = departmentRepository.save(department);

        Long userId = UserContextHolder.getUserId();
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("name", department.getName());
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.DEPARTMENT,
                department.getId(),
                null,
                null,
                department.getName(),
                ActionType.CREATED,
                logDetailsBuilder.buildCreated(fields)
        ));

        return toResponse(department);
    }

    @Transactional
    public DepartmentResponse update(Long id, UpdateDepartmentRequest request) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Department not found"));

        String oldName = department.getName();
        if (!oldName.equals(request.name()) && departmentRepository.existsByName(request.name())) {
            throw new IllegalArgumentException("Department name already exists");
        }

        Map<String, Object> oldFields = new LinkedHashMap<>();
        oldFields.put("name", oldName);

        department.setName(request.name());
        department = departmentRepository.save(department);

        Map<String, Object> newFields = new LinkedHashMap<>();
        newFields.put("name", department.getName());

        Long userId = UserContextHolder.getUserId();
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.DEPARTMENT,
                department.getId(),
                null,
                null,
                department.getName(),
                ActionType.UPDATED,
                logDetailsBuilder.buildUpdated(oldFields, newFields)
        ));

        return toResponse(department);
    }

    @Transactional
    public void delete(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Department not found"));

        departmentRepository.delete(department);

        Long userId = UserContextHolder.getUserId();
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("name", department.getName());
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.DEPARTMENT,
                department.getId(),
                null,
                null,
                department.getName(),
                ActionType.DELETED,
                logDetailsBuilder.buildDeleted(fields)
        ));
    }

    @Transactional
    public void addUser(Long departmentId, Long userId) {
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new NoSuchElementException("Department not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        if (userDepartmentRepository.existsByUserIdAndDepartmentId(userId, departmentId)) {
            return;
        }

        UserDepartment ud = UserDepartment.builder()
                .user(user)
                .department(department)
                .build();
        userDepartmentRepository.save(ud);

        Long currentUserId = UserContextHolder.getUserId();
        logService.createLog(new CreateLogRequest(
                currentUserId,
                EntityType.DEPARTMENT,
                departmentId,
                null,
                null,
                department.getName(),
                ActionType.UPDATED,
                logDetailsBuilder.buildAssociation("user", user.getFirstName() + " " + user.getLastName(), "ASSOCIATED")
        ));
    }

    @Transactional
    public void removeUser(Long departmentId, Long userId) {
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new NoSuchElementException("Department not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        userDepartmentRepository.deleteByUserIdAndDepartmentId(userId, departmentId);

        Long currentUserId = UserContextHolder.getUserId();
        logService.createLog(new CreateLogRequest(
                currentUserId,
                EntityType.DEPARTMENT,
                departmentId,
                null,
                null,
                department.getName(),
                ActionType.UPDATED,
                logDetailsBuilder.buildAssociation("user", user.getFirstName() + " " + user.getLastName(), "DISASSOCIATED")
        ));
    }

    public List<UserSummary> getUsers(Long departmentId) {
        return userDepartmentRepository.findByDepartmentId(departmentId).stream()
                .map(ud -> {
                    User u = ud.getUser();
                    return new UserSummary(u.getId(), u.getFirstName(), u.getLastName(), u.getEmail());
                })
                .toList();
    }

    public List<DepartmentResponse> getDepartmentsForUser(Long userId) {
        return userDepartmentRepository.findByUserId(userId).stream()
                .map(ud -> toResponse(ud.getDepartment()))
                .toList();
    }

    public Set<Long> getDepartmentIdsForUser(Long userId) {
        return userDepartmentRepository.findByUserId(userId).stream()
                .map(ud -> ud.getDepartment().getId())
                .collect(java.util.stream.Collectors.toSet());
    }

    private DepartmentResponse toResponse(Department department) {
        int userCount = userDepartmentRepository.findByDepartmentId(department.getId()).size();
        return new DepartmentResponse(
                department.getId(),
                department.getName(),
                userCount
        );
    }
}
