package com.airport.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "refuel_request")
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
public class RefuelRequest extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnoreProperties({"gateAssignments","runwaySlots","baggageManifest","refuelRequest","aircraft"})
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flight_schedule_id")
    private FlightSchedule flightSchedule;

    @NotNull
    @Column(name = "fuel_quantity", nullable = false, precision = 10, scale = 2)
    private BigDecimal fuelQuantity;

    @Column(name = "fuel_type", nullable = false)
    private String fuelType = "JET_A1";

    @NotNull
    @Column(name = "requested_time", nullable = false)
    private LocalDateTime requestedTime;

    @Column(name = "approved_time")
    private LocalDateTime approvedTime;

    @Column(name = "completed_time")
    private LocalDateTime completedTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RefuelStatus status = RefuelStatus.PENDING;

    @Column(name = "assigned_crew")
    private String assignedCrew;

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    public enum RefuelStatus { PENDING, APPROVED, REJECTED, IN_PROGRESS, COMPLETED, CANCELLED }
}
