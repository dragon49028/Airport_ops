package com.airport.service;

import com.airport.dto.MaintenanceRequest;
import com.airport.entity.Aircraft;
import com.airport.entity.MaintenanceClearance;
import com.airport.event.SseEventPublisher;
import com.airport.exception.ResourceNotFoundException;
import com.airport.repository.AircraftRepository;
import com.airport.repository.MaintenanceClearanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service @RequiredArgsConstructor @Transactional
public class MaintenanceClearanceService {
    private final MaintenanceClearanceRepository repo;
    private final AircraftRepository aircraftRepo;
    private final SseEventPublisher ssePublisher;

    public List<MaintenanceClearance> findAll() { return repo.findAll(); }

    public MaintenanceClearance findById(Long id) {
        return repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Maintenance clearance not found: " + id));
    }

    public MaintenanceClearance create(MaintenanceRequest req) {
        MaintenanceClearance mc = new MaintenanceClearance();
        mapRequest(req, mc);
        mc.setReportedTime(LocalDateTime.now());
        // Auto-ground aircraft on CRITICAL severity
        if (req.getSeverity() == MaintenanceClearance.Severity.CRITICAL && req.getAircraftId() != null) {
            Aircraft aircraft = aircraftRepo.findById(req.getAircraftId()).orElse(null);
            if (aircraft != null) {
                aircraft.setStatus(Aircraft.AircraftStatus.GROUNDED);
                aircraftRepo.save(aircraft);
            }
        } else if (req.getSeverity() == MaintenanceClearance.Severity.MODERATE && req.getAircraftId() != null) {
            Aircraft aircraft = aircraftRepo.findById(req.getAircraftId()).orElse(null);
            if (aircraft != null) {
                aircraft.setStatus(Aircraft.AircraftStatus.MAINTENANCE);
                aircraftRepo.save(aircraft);
            }
        }
        MaintenanceClearance saved = repo.save(mc);
        ssePublisher.publishMaintenanceUpdate(Map.of(
            "event", "reported",
            "severity", saved.getSeverity(),
            "aircraft", saved.getAircraft() != null ? saved.getAircraft().getRegistrationNumber() : "N/A"
        ));
        if (saved.getSeverity() == MaintenanceClearance.Severity.CRITICAL) {
            ssePublisher.publishAlertUpdate(Map.of(
                "message", "CRITICAL maintenance issue: " + saved.getIssueDescription(),
                "aircraftId", saved.getAircraft() != null ? saved.getAircraft().getId() : 0
            ));
        }
        return saved;
    }

    public MaintenanceClearance update(Long id, MaintenanceRequest req) {
        MaintenanceClearance mc = findById(id);
        mapRequest(req, mc);
        return repo.save(mc);
    }

    public void delete(Long id) { repo.deleteById(id); }

    public MaintenanceClearance approveClearance(Long id, String approvedBy) {
        MaintenanceClearance mc = findById(id);
        mc.setClearanceStatus(MaintenanceClearance.ClearanceStatus.CLEARED);
        mc.setApprovedBy(approvedBy);
        mc.setClearedTime(LocalDateTime.now());
        if (mc.getAircraft() != null) {
            mc.getAircraft().setStatus(Aircraft.AircraftStatus.AVAILABLE);
            aircraftRepo.save(mc.getAircraft());
        }
        MaintenanceClearance saved = repo.save(mc);
        ssePublisher.publishMaintenanceUpdate(Map.of("event", "cleared", "approvedBy", approvedBy));
        return saved;
    }

    private void mapRequest(MaintenanceRequest req, MaintenanceClearance mc) {
        mc.setIssueDescription(req.getIssueDescription());
        if (req.getIssueType() != null) mc.setIssueType(req.getIssueType());
        if (req.getSeverity() != null) mc.setSeverity(req.getSeverity());
        mc.setApprovedBy(req.getApprovedBy());
        mc.setNotes(req.getNotes());
        if (req.getEstimatedHours() != null) mc.setEstimatedHours(req.getEstimatedHours());
        if (req.getAircraftId() != null) {
            Aircraft aircraft = aircraftRepo.findById(req.getAircraftId())
                .orElseThrow(() -> new ResourceNotFoundException("Aircraft not found"));
            mc.setAircraft(aircraft);
        }
    }
}
