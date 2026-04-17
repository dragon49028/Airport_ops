package com.airport.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "flight_schedule")
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
public class FlightSchedule extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "flight_number", unique = true, nullable = false)
    private String flightNumber;

    @JsonIgnoreProperties({"flightSchedules","maintenanceClearances"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aircraft_id")
    private Aircraft aircraft;

    @Column(length = 10)
    private String origin;

    @Column(length = 10)
    private String destination;

    @Column(length = 100)
    private String airline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FlightPriority priority = FlightPriority.NORMAL;

    @Column(name = "scheduled_arrival")
    private LocalDateTime scheduledArrival;

    @Column(name = "scheduled_departure")
    private LocalDateTime scheduledDeparture;

    @Column(name = "actual_arrival")
    private LocalDateTime actualArrival;

    @Column(name = "actual_departure")
    private LocalDateTime actualDeparture;

    @Column(name = "delay_minutes")
    private Integer delayMinutes = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FlightStatus status = FlightStatus.SCHEDULED;

    @Column(name = "remarks", length = 500)
    private String remarks;

    @JsonIgnoreProperties({"flightSchedule"})
    @OneToMany(mappedBy = "flightSchedule", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<GateAssignment> gateAssignments;

    @JsonIgnoreProperties({"flightSchedule"})
    @OneToMany(mappedBy = "flightSchedule", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<RunwaySlot> runwaySlots;

    @JsonIgnoreProperties({"flightSchedule"})
    @OneToOne(mappedBy = "flightSchedule", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private BaggageManifest baggageManifest;

    @JsonIgnoreProperties({"flightSchedule"})
    @OneToOne(mappedBy = "flightSchedule", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private RefuelRequest refuelRequest;

    public enum FlightStatus {
        SCHEDULED, BOARDING, IN_FLIGHT, ARRIVED, DEPARTED, DELAYED, CANCELLED
    }
    public enum FlightPriority { LOW, NORMAL, HIGH, EMERGENCY }
}
