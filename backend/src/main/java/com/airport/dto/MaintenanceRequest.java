package com.airport.dto;

import com.airport.entity.MaintenanceClearance;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class MaintenanceRequest {
    private Long aircraftId;
    private MaintenanceClearance.IssueType issueType;
    private String issueDescription;
    private MaintenanceClearance.Severity severity;
    private String approvedBy;
    private Integer estimatedHours;
    private String notes;
}
