package com.airport.service;

import com.airport.dto.FlightRequest;
import com.airport.entity.Aircraft;
import com.airport.entity.FlightSchedule;
import com.airport.event.SseEventPublisher;
import com.airport.exception.ResourceNotFoundException;
import com.airport.repository.AircraftRepository;
import com.airport.repository.FlightScheduleRepository;
import com.airport.specification.FlightSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class FlightScheduleService {

    private final FlightScheduleRepository flightRepo;
    private final AircraftRepository aircraftRepo;
    private final SseEventPublisher ssePublisher;

    public Page<FlightSchedule> findAll(String search, FlightSchedule.FlightStatus status,
                                        String airline, LocalDateTime from, LocalDateTime to,
                                        Pageable pageable) {
        Specification<FlightSchedule> spec = FlightSpecification.withFilters(search, status, from, to, airline);
        return flightRepo.findAll(spec, pageable);
    }

    public FlightSchedule findById(Long id) {
        return flightRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Flight not found: " + id));
    }

    public List<FlightSchedule> findActive() {
        return flightRepo.findActiveFlights();
    }

    public FlightSchedule create(FlightRequest req) {
        if (flightRepo.findByFlightNumber(req.getFlightNumber()).isPresent())
            throw new IllegalArgumentException("Flight number already exists: " + req.getFlightNumber());
        FlightSchedule flight = new FlightSchedule();
        mapRequest(req, flight);
        FlightSchedule saved = flightRepo.save(flight);
        if (saved.getAircraft() != null) updateAircraftStatus(saved.getAircraft(), saved.getStatus());
        ssePublisher.publishFlightUpdate(Map.of("event", "created", "flightNumber", saved.getFlightNumber(), "id", saved.getId()));
        return saved;
    }

    public FlightSchedule update(Long id, FlightRequest req) {
        FlightSchedule flight = findById(id);
        mapRequest(req, flight);
        if (flight.getAircraft() != null) updateAircraftStatus(flight.getAircraft(), flight.getStatus());
        FlightSchedule saved = flightRepo.save(flight);
        ssePublisher.publishFlightUpdate(Map.of("event", "updated", "flightNumber", saved.getFlightNumber(), "status", saved.getStatus()));
        return saved;
    }

    public List<FlightSchedule> bulkUpdateStatus(List<Long> ids, FlightSchedule.FlightStatus status) {
        List<FlightSchedule> flights = flightRepo.findAllById(ids);
        flights.forEach(f -> {
            f.setStatus(status);
            if (f.getAircraft() != null) updateAircraftStatus(f.getAircraft(), status);
        });
        List<FlightSchedule> saved = flightRepo.saveAll(flights);
        ssePublisher.publishFlightUpdate(Map.of("event", "bulk-update", "count", saved.size(), "status", status));
        return saved;
    }

    public void delete(Long id) {
        findById(id);
        flightRepo.deleteById(id);
    }

    private void mapRequest(FlightRequest req, FlightSchedule flight) {
        flight.setFlightNumber(req.getFlightNumber());
        flight.setOrigin(req.getOrigin());
        flight.setDestination(req.getDestination());
        if (req.getAirline() != null) flight.setAirline(req.getAirline());
        if (req.getPriority() != null) flight.setPriority(req.getPriority());
        flight.setScheduledArrival(req.getScheduledArrival());
        flight.setScheduledDeparture(req.getScheduledDeparture());
        if (req.getStatus() != null) flight.setStatus(req.getStatus());
        if (req.getRemarks() != null) flight.setRemarks(req.getRemarks());
        if (req.getDelayMinutes() != null) flight.setDelayMinutes(req.getDelayMinutes());
        if (req.getAircraftId() != null) {
            Aircraft aircraft = aircraftRepo.findById(req.getAircraftId())
                .orElseThrow(() -> new ResourceNotFoundException("Aircraft not found: " + req.getAircraftId()));
            flight.setAircraft(aircraft);
        }
    }

    private void updateAircraftStatus(Aircraft aircraft, FlightSchedule.FlightStatus flightStatus) {
        switch (flightStatus) {
            case IN_FLIGHT -> aircraft.setStatus(Aircraft.AircraftStatus.IN_FLIGHT);
            case ARRIVED, BOARDING -> aircraft.setStatus(Aircraft.AircraftStatus.AT_GATE);
            case DEPARTED -> aircraft.setStatus(Aircraft.AircraftStatus.AVAILABLE);
            default -> {}
        }
        aircraftRepo.save(aircraft);
    }
}
