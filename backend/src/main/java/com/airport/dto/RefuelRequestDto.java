package com.airport.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor
public class RefuelRequestDto {
    private Long flightScheduleId;
    private BigDecimal fuelQuantity;
    private String fuelType;
    private LocalDateTime requestedTime;
    private String assignedCrew;
}
