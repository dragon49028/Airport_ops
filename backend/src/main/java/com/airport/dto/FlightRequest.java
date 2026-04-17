package com.airport.dto;

import com.airport.entity.FlightSchedule;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor
public class FlightRequest {
    private String flightNumber;
    private Long aircraftId;
    private String origin;
    private String destination;
    private String airline;
    private FlightSchedule.FlightPriority priority;
    private LocalDateTime scheduledArrival;
    private LocalDateTime scheduledDeparture;
    private FlightSchedule.FlightStatus status;
    private String remarks;
    private Integer delayMinutes;
}
