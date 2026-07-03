package com.rodrigommfreitas.coreservice.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserYearAccessRepository extends JpaRepository<UserYearAccess, Long> {
    List<UserYearAccess> findByUserId(Long userId);
    List<UserYearAccess> findByYearId(Long yearId);
    void deleteByUserIdAndYearId(Long userId, Long yearId);
}