package com.airport.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DashboardStats {
    private long totalFlights;
    private long activeFlights;
    private long delayedFlights;
    private long availableAircraft;
    private long occupiedGates;
    private long pendingRefuels;
    private long pendingMaintenance;
    private long availableStaff;
    private long criticalAlerts;
    private long totalAircraft;
    private long totalStaff;
    private double totalRevenue;
    private double customerSatisfaction;
}
