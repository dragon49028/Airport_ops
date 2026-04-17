package com.airport.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "baggage_manifest")
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
public class BaggageManifest extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnoreProperties({"gateAssignments","runwaySlots","baggageManifest","refuelRequest","aircraft"})
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flight_schedule_id")
    private FlightSchedule flightSchedule;

    @Column(name = "baggage_count", nullable = false)
    private Integer baggageCount = 0;

    @Column(name = "special_handling_count")
    private Integer specialHandlingCount = 0;

    @Column(name = "special_handling_notes", length = 500)
    private String specialHandlingNotes;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority_level", nullable = false)
    private PriorityLevel priorityLevel = PriorityLevel.NORMAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BaggageStatus status = BaggageStatus.PENDING;

    @Column(name = "handling_team")
    private String handlingTeam;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public enum PriorityLevel { NORMAL, HIGH, URGENT }
    public enum BaggageStatus { PENDING, IN_PROGRESS, DELIVERED, ISSUE }
}
