package com.airport.dto;

import com.airport.entity.Gate;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GateCatalogRequest {
    private String gateNumber;
    private String terminal;
    private Integer capacity;
    private Gate.GateStatus status;
}
