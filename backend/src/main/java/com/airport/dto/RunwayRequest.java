package com.airport.dto;

import com.airport.entity.RunwaySlot;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor
public class RunwayRequest {
    private String runwayNumber;
    private Long flightScheduleId;
    private LocalDateTime slotTime;
    private Integer duration;
    private RunwaySlot.SlotType slotType;
    private RunwaySlot.WeatherCondition weatherCondition;
}
