package com.rodrigommfreitas.coreservice.log;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;

public interface LogRepository extends JpaRepository<Log, Long> {
    Page<Log> findByYearId(Long yearId, Pageable pageable);

    Page<Log> findByEntityType(EntityType entityType, Pageable pageable);

    Page<Log> findByEntityTypeAndYearId(EntityType entityType, Long yearId, Pageable pageable);

    Page<Log> findByEntityTypeAndBaseEntityId(EntityType entityType, Long baseEntityId, Pageable pageable);

    Page<Log> findByBaseEntityId(Long baseEntityId, Pageable pageable);

    Page<Log> findByEntityTypeAndBaseEntityIdAndEntityYearId(EntityType entityType, Long baseEntityId, Long entityYearId, Pageable pageable);

    Page<Log> findByAction(ActionType action, Pageable pageable);

    Page<Log> findByEntityTypeAndAction(EntityType entityType, ActionType action, Pageable pageable);

    Page<Log> findByTimestampBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    Page<Log> findByEntityTypeAndTimestampBetween(EntityType entityType, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    Page<Log> findByEntityTypeInAndYearIdIn(Collection<EntityType> entityTypes, Collection<Long> yearIds, Pageable pageable);

    Page<Log> findByEntityTypeIn(Collection<EntityType> entityTypes, Pageable pageable);

    Page<Log> findByEntityTypeInAndBaseEntityId(Collection<EntityType> entityTypes, Long baseEntityId, Pageable pageable);

    @Query("SELECT l FROM Log l WHERE l.entityType IN :entityTypes AND (l.yearId IN :yearIds OR l.yearId IS NULL)")
    Page<Log> findByEntityTypeInAndYearIdInIncludingNull(@Param("entityTypes") Collection<EntityType> entityTypes, @Param("yearIds") Collection<Long> yearIds, Pageable pageable);

    @Query("SELECT l FROM Log l WHERE l.baseEntityId = :baseEntityId AND (l.yearId IN :yearIds OR l.yearId IS NULL)")
    Page<Log> findByBaseEntityIdAndYearIdInIncludingNull(@Param("baseEntityId") Long baseEntityId, @Param("yearIds") Collection<Long> yearIds, Pageable pageable);

    @Query("SELECT l FROM Log l WHERE l.entityType IN :entityTypes AND l.baseEntityId = :baseEntityId AND (l.yearId IN :yearIds OR l.yearId IS NULL)")
    Page<Log> findByEntityTypeInAndBaseEntityIdAndYearIdInIncludingNull(@Param("entityTypes") Collection<EntityType> entityTypes, @Param("baseEntityId") Long baseEntityId, @Param("yearIds") Collection<Long> yearIds, Pageable pageable);
}