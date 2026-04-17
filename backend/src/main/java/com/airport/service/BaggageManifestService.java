package com.airport.service;

import com.airport.dto.BaggageRequest;
import com.airport.entity.BaggageManifest;
import com.airport.entity.FlightSchedule;
import com.airport.exception.ResourceNotFoundException;
import com.airport.repository.BaggageManifestRepository;
import com.airport.repository.FlightScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service @RequiredArgsConstructor @Transactional
public class BaggageManifestService {
    private final BaggageManifestRepository repo;
    private final FlightScheduleRepository flightRepo;

    public List<BaggageManifest> findAll() { return repo.findAll(); }

    public BaggageManifest findById(Long id) {
        return repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Baggage manifest not found: " + id));
    }

    public BaggageManifest create(BaggageRequest req) {
        BaggageManifest manifest = new BaggageManifest();
        mapRequest(req, manifest);
        return repo.save(manifest);
    }

    public BaggageManifest update(Long id, BaggageRequest req) {
        BaggageManifest manifest = findById(id);
        mapRequest(req, manifest);
        return repo.save(manifest);
    }

    public void delete(Long id) { repo.deleteById(id); }

    public BaggageManifest updateStatus(Long id, BaggageManifest.BaggageStatus status) {
        BaggageManifest m = findById(id);
        m.setStatus(status);
        return repo.save(m);
    }

    private void mapRequest(BaggageRequest req, BaggageManifest manifest) {
        manifest.setBaggageCount(req.getBaggageCount());
        if (req.getPriorityLevel() != null) manifest.setPriorityLevel(req.getPriorityLevel());
        manifest.setHandlingTeam(req.getHandlingTeam());
        manifest.setNotes(req.getNotes());
        if (req.getFlightScheduleId() != null) {
            FlightSchedule flight = flightRepo.findById(req.getFlightScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found"));
            manifest.setFlightSchedule(flight);
        }
    }
}
