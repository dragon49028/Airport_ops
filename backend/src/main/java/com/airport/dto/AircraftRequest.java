package com.airport.dto;

import com.airport.entity.Aircraft;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor
public class AircraftRequest {
    private String registrationNumber;
    private String model;
    private String airline;
    private Integer capacity;
    private Aircraft.AircraftStatus status;
    private String currentGate;
    private LocalDateTime lastMaintenance;
}
