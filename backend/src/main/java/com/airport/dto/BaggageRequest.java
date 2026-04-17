package com.airport.dto;

import com.airport.entity.BaggageManifest;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class BaggageRequest {
    private Long flightScheduleId;
    private Integer baggageCount;
    private BaggageManifest.PriorityLevel priorityLevel;
    private String handlingTeam;
    private String notes;
}
