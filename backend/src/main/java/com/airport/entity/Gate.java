package com.airport.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "gate")
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
public class Gate extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "gate_number", nullable = false, unique = true)
    private String gateNumber;

    @NotBlank
    @Column(nullable = false)
    private String terminal;

    @NotNull
    @Column(nullable = false)
    private Integer capacity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GateStatus status = GateStatus.AVAILABLE;

    public enum GateStatus { AVAILABLE, OCCUPIED, MAINTENANCE }
}