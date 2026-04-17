package com.airport.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "runway_slot")
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
public class RunwaySlot extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "runway_number", nullable = false)
    private String runwayNumber;

    @JsonIgnoreProperties({"gateAssignments","runwaySlots","baggageManifest","refuelRequest","aircraft"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flight_schedule_id")
    private FlightSchedule flightSchedule;

    @NotNull
    @Column(name = "slot_time", nullable = false)
    private LocalDateTime slotTime;

    @Column(nullable = false)
    private Integer duration = 30;

    @Enumerated(EnumType.STRING)
    @Column(name = "slot_type", nullable = false)
    private SlotType slotType = SlotType.LANDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SlotStatus status = SlotStatus.SCHEDULED;

    @Enumerated(EnumType.STRING)
    @Column(name = "weather_condition")
    private WeatherCondition weatherCondition = WeatherCondition.CLEAR;

    @Column(name = "weather_notes", length = 255)
    private String weatherNotes;

    public enum SlotType { LANDING, TAKEOFF }
    public enum SlotStatus { SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, WEATHER_HOLD }
    public enum WeatherCondition { CLEAR, CLOUDY, RAIN, FOG, STORM, CROSSWIND }
}
