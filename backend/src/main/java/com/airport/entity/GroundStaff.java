package com.airport.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ground_staff")
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
public class GroundStaff extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "staff_id", unique = true, nullable = false)
    private String staffId;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StaffRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Shift shift = Shift.DAY;

    @Column(name = "current_assignment")
    private String currentAssignment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StaffStatus status = StaffStatus.AVAILABLE;

    @Column(name = "availability")
    private Boolean availability = true;

    private String phone;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "certifications", length = 500)
    private String certifications;

    public enum StaffRole {
        PILOT_COORDINATOR, GATE_AGENT, FUEL_TECH, BAGGAGE_HANDLER,
        MAINTENANCE_CREW, RAMP_AGENT, OPERATIONS_SUPERVISOR, SECURITY, CUSTOMS_OFFICER
    }
    public enum Shift { DAY, EVENING, NIGHT }
    public enum StaffStatus { AVAILABLE, BUSY, ON_BREAK, OFF_DUTY }
}
