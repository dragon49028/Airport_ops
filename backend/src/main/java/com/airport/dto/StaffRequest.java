package com.airport.dto;

import com.airport.entity.GroundStaff;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class StaffRequest {
    private String staffId;
    private String name;
    private GroundStaff.StaffRole role;
    private GroundStaff.Shift shift;
    private String currentAssignment;
    private GroundStaff.StaffStatus status;
    private Boolean availability;
    private String phone;
    private String email;
    private String certifications;
}
