package com.airport.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "maintenance_clearance")
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
public class MaintenanceClearance extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnoreProperties({"flightSchedules","maintenanceClearances"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aircraft_id")
    private Aircraft aircraft;

    @Enumerated(EnumType.STRING)
    @Column(name = "issue_type", nullable = false)
    private IssueType issueType = IssueType.OTHER;

    @NotBlank
    @Column(name = "issue_description", nullable = false, columnDefinition = "TEXT")
    private String issueDescription;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Severity severity = Severity.MINOR;

    @Enumerated(EnumType.STRING)
    @Column(name = "clearance_status", nullable = false)
    private ClearanceStatus clearanceStatus = ClearanceStatus.PENDING;

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "reported_time")
    private LocalDateTime reportedTime;

    @Column(name = "cleared_time")
    private LocalDateTime clearedTime;

    @Column(name = "estimated_hours")
    private Integer estimatedHours;

    @Column(columnDefinition = "TEXT")
    private String notes;

    public enum IssueType { ENGINE, BRAKE, HYDRAULICS, AVIONICS, FUSELAGE, LANDING_GEAR, ELECTRICAL, PRESSURIZATION, OTHER }
    public enum Severity { MINOR, MODERATE, CRITICAL }
    public enum ClearanceStatus { PENDING, IN_REVIEW, CLEARED, GROUNDED }
}
