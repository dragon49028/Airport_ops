package com.airport.service;

import com.airport.dto.GateRequest;
import com.airport.entity.GateAssignment;
import com.airport.entity.FlightSchedule;
import com.airport.event.SseEventPublisher;
import com.airport.exception.ConflictException;
import com.airport.exception.ResourceNotFoundException;
import com.airport.repository.GateAssignmentRepository;
import com.airport.repository.FlightScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class GateAssignmentService {

    private final GateAssignmentRepository gateRepo;
    private final FlightScheduleRepository flightRepo;
    private final ConflictDetectionService conflictService;
    private final SseEventPublisher ssePublisher;

    private static final List<String> ALL_GATES = List.of(
        "A1","A2","A3","A4","A5","A6","B1","B2","B3","B4","B5","B6",
        "C1","C2","C3","C4","C5","C6","D1","D2","D3","D4"
    );

    public List<GateAssignment> findAll() { return gateRepo.findAll(); }

    public GateAssignment findById(Long id) {
        return gateRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Gate assignment not found: " + id));
    }

    public List<String> findAvailableGates(LocalDateTime time) {
        List<String> occupied = gateRepo.findOccupiedGates();
        return ALL_GATES.stream().filter(g -> !occupied.contains(g)).toList();
    }

    public GateAssignment create(GateRequest req) {
        // Use conflict detection service (returns suggestions, not just exception)
        if (req.getAssignedTime() != null && req.getReleaseTime() != null) {
            ConflictDetectionService.ConflictResult result =
                conflictService.checkGateConflict(req.getGateNumber(), req.getAssignedTime(), req.getReleaseTime(), null);
            if (result.isHasConflict()) {
                throw new ConflictException(result.getMessage() +
                    (result.getSuggestedResources() != null && !result.getSuggestedResources().isEmpty()
                        ? ". Suggested alternatives: " + String.join(", ", result.getSuggestedResources())
                        : ""));
            }
        }
        GateAssignment gate = new GateAssignment();
        mapRequest(req, gate);
        GateAssignment saved = gateRepo.save(gate);
        ssePublisher.publishGateUpdate(Map.of("event", "assigned", "gate", saved.getGateNumber()));
        return saved;
    }

    public GateAssignment update(Long id, GateRequest req) {
        GateAssignment existing = findById(id);
        if (req.getAssignedTime() != null && req.getReleaseTime() != null) {
            ConflictDetectionService.ConflictResult result =
                conflictService.checkGateConflict(req.getGateNumber(), req.getAssignedTime(), req.getReleaseTime(), id);
            if (result.isHasConflict()) {
                throw new ConflictException(result.getMessage());
            }
        }
        mapRequest(req, existing);
        return gateRepo.save(existing);
    }

    public void delete(Long id) { findById(id); gateRepo.deleteById(id); }

    public GateAssignment updateStatus(Long id, GateAssignment.GateStatus status) {
        GateAssignment gate = findById(id);
        gate.setStatus(status);
        GateAssignment saved = gateRepo.save(gate);
        ssePublisher.publishGateUpdate(Map.of("event", "status-change", "gate", saved.getGateNumber(), "status", status));
        return saved;
    }

    private void mapRequest(GateRequest req, GateAssignment gate) {
        gate.setGateNumber(req.getGateNumber());
        gate.setAssignedTime(req.getAssignedTime());
        gate.setReleaseTime(req.getReleaseTime());
        gate.setExpectedDuration(req.getExpectedDuration());
        gate.setNotes(req.getNotes());
        if (req.getFlightScheduleId() != null) {
            FlightSchedule flight = flightRepo.findById(req.getFlightScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found"));
            gate.setFlightSchedule(flight);
        }
    }
}
