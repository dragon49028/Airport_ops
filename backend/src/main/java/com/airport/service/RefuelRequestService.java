package com.airport.service;

import com.airport.dto.RefuelRequestDto;
import com.airport.entity.FlightSchedule;
import com.airport.entity.RefuelRequest;
import com.airport.exception.ResourceNotFoundException;
import com.airport.repository.FlightScheduleRepository;
import com.airport.repository.RefuelRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service @RequiredArgsConstructor @Transactional
public class RefuelRequestService {
    private final RefuelRequestRepository repo;
    private final FlightScheduleRepository flightRepo;

    public List<RefuelRequest> findAll() { return repo.findAll(); }

    public RefuelRequest findById(Long id) {
        return repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Refuel request not found: " + id));
    }

    public RefuelRequest create(RefuelRequestDto req) {
        RefuelRequest refuel = new RefuelRequest();
        mapRequest(req, refuel);
        return repo.save(refuel);
    }

    public RefuelRequest update(Long id, RefuelRequestDto req) {
        RefuelRequest refuel = findById(id);
        mapRequest(req, refuel);
        return repo.save(refuel);
    }

    public void delete(Long id) { repo.deleteById(id); }

    public RefuelRequest updateStatus(Long id, RefuelRequest.RefuelStatus status) {
        RefuelRequest r = findById(id);
        r.setStatus(status);
        if (status == RefuelRequest.RefuelStatus.COMPLETED) r.setCompletedTime(LocalDateTime.now());
        return repo.save(r);
    }

    private void mapRequest(RefuelRequestDto req, RefuelRequest refuel) {
        refuel.setFuelQuantity(req.getFuelQuantity());
        refuel.setFuelType(req.getFuelType() != null ? req.getFuelType() : "JET_A1");
        refuel.setRequestedTime(req.getRequestedTime() != null ? req.getRequestedTime() : LocalDateTime.now());
        refuel.setAssignedCrew(req.getAssignedCrew());
        if (req.getFlightScheduleId() != null) {
            FlightSchedule flight = flightRepo.findById(req.getFlightScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found"));
            refuel.setFlightSchedule(flight);
        }
    }
}
