package com.rodrigommfreitas.coreservice.department;

import com.rodrigommfreitas.coreservice.user.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_department", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "department_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDepartment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;
}
