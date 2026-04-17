package com.airport.service;

import com.airport.dto.AircraftRequest;
import com.airport.entity.Aircraft;
import com.airport.exception.ResourceNotFoundException;
import com.airport.repository.AircraftRepository;
import com.airport.specification.AircraftSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service @RequiredArgsConstructor @Transactional
public class AircraftService {

    private final AircraftRepository aircraftRepository;

    public List<Aircraft> findAll() { return aircraftRepository.findAll(); }

    public Page<Aircraft> findAll(String search, Aircraft.AircraftStatus status, String airline, Pageable pageable) {
        return aircraftRepository.findAll(AircraftSpecification.withFilters(search, status, airline), pageable);
    }

    public Aircraft findById(Long id) {
        return aircraftRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Aircraft not found: " + id));
    }

    public List<Aircraft> findByStatus(Aircraft.AircraftStatus status) {
        return aircraftRepository.findByStatus(status);
    }

    public List<Aircraft> findAvailable() { return aircraftRepository.findAvailableAircraft(); }

    public Aircraft create(AircraftRequest req) {
        if (aircraftRepository.findByRegistrationNumber(req.getRegistrationNumber()).isPresent())
            throw new IllegalArgumentException("Registration number already exists: " + req.getRegistrationNumber());
        Aircraft aircraft = new Aircraft();
        mapRequest(req, aircraft);
        return aircraftRepository.save(aircraft);
    }

    public Aircraft update(Long id, AircraftRequest req) {
        Aircraft aircraft = findById(id);
        mapRequest(req, aircraft);
        return aircraftRepository.save(aircraft);
    }

    public void delete(Long id) { findById(id); aircraftRepository.deleteById(id); }

    private void mapRequest(AircraftRequest req, Aircraft aircraft) {
        aircraft.setRegistrationNumber(req.getRegistrationNumber());
        aircraft.setModel(req.getModel());
        aircraft.setAirline(req.getAirline());
        aircraft.setCapacity(req.getCapacity());
        if (req.getStatus() != null) aircraft.setStatus(req.getStatus());
        aircraft.setCurrentGate(req.getCurrentGate());
        if (req.getLastMaintenance() != null) aircraft.setLastMaintenance(req.getLastMaintenance());
    }
}
