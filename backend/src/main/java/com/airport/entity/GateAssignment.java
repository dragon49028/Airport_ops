package com.airport.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "gate_assignment")
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
public class GateAssignment extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "gate_number", nullable = false)
    private String gateNumber;

    @JsonIgnoreProperties({"gateAssignments","runwaySlots","baggageManifest","refuelRequest","aircraft"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flight_schedule_id")
    private FlightSchedule flightSchedule;

    @Column(name = "assigned_time")
    private LocalDateTime assignedTime;

    @Column(name = "release_time")
    private LocalDateTime releaseTime;

    @Column(name = "expected_duration")
    private Integer expectedDuration; // minutes

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GateStatus status = GateStatus.SCHEDULED;

    @Column(columnDefinition = "TEXT")
    private String notes;

    public enum GateStatus { SCHEDULED, ACTIVE, RELEASED, CANCELLED, AVAILABLE }
}
