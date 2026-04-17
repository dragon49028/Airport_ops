package com.airport.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor
public class GateRequest {
    private String gateNumber;
    private Long flightScheduleId;
    private LocalDateTime assignedTime;
    private LocalDateTime releaseTime;
    private Integer expectedDuration;
    private String notes;
}
