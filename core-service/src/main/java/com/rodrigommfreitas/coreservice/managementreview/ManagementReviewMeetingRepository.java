package com.rodrigommfreitas.coreservice.managementreview;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ManagementReviewMeetingRepository extends JpaRepository<ManagementReviewMeeting, Long> {
    List<ManagementReviewMeeting> findByYearIdOrderByMeetingDateAscIdAsc(Long yearId);
}
