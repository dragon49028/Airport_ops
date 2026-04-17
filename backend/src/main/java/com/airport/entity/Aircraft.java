package com.airport.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "aircraft")
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
public class Aircraft extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 20)
    @Column(name = "registration_number", unique = true, nullable = false)
    private String registrationNumber;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false)
    private String model;

    @Size(max = 100)
    private String airline;

    private Integer capacity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AircraftStatus status = AircraftStatus.AVAILABLE;

    @Column(name = "current_gate")
    private String currentGate;

    @Column(name = "last_maintenance")
    private LocalDateTime lastMaintenance;

    @Column(name = "next_maintenance_due")
    private LocalDateTime nextMaintenanceDue;

    @JsonIgnoreProperties({"aircraft","gateAssignments","runwaySlots","baggageManifest","refuelRequest"})
    @OneToMany(mappedBy = "aircraft", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<FlightSchedule> flightSchedules;

    @JsonIgnoreProperties({"aircraft"})
    @OneToMany(mappedBy = "aircraft", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<MaintenanceClearance> maintenanceClearances;

    public enum AircraftStatus {
        AVAILABLE, AT_GATE, IN_FLIGHT, MAINTENANCE, OUT_OF_SERVICE, GROUNDED
    }
}
