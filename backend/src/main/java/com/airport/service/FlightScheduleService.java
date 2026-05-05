package com.airport.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.airport.dto.FlightRequest;
import com.airport.entity.Aircraft;
import com.airport.entity.FlightSchedule;
import com.airport.event.SseEventPublisher;
import com.airport.exception.ResourceNotFoundException;
import com.airport.repository.AircraftRepository;
import com.airport.repository.FlightScheduleRepository;
import com.airport.specification.FlightSpecification;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class FlightScheduleService {

    private static final ZoneId AIRPORT_ZONE = ZoneId.of("Asia/Kolkata");

    private final FlightScheduleRepository flightRepo;
    private final AircraftRepository aircraftRepo;
    private final SseEventPublisher ssePublisher;

    public Page<FlightSchedule> findAll(String search, FlightSchedule.FlightStatus status,
                                        String airline, LocalDateTime from, LocalDateTime to,
                                        Pageable pageable) {
        Specification<FlightSchedule> spec = FlightSpecification.withFilters(search, status, from, to, airline);
        Page<FlightSchedule> page = flightRepo.findAll(spec, pageable);
        applyAutoDelayRules(page.getContent());
        return page;
    }

    public FlightSchedule findById(Long id) {
        FlightSchedule flight = flightRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Flight not found: " + id));
        applyAutoDelayRules(List.of(flight));
        return flight;
    }

    public List<FlightSchedule> findActive() {
        List<FlightSchedule> flights = flightRepo.findActiveFlights();
        applyAutoDelayRules(flights);
        return flights;
    }

    public FlightSchedule create(FlightRequest req) {
        validateCreateRequest(req);
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
        normalizeStatusAfterEdit(flight, req);
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
        if (req.getFlightNumber() != null) flight.setFlightNumber(req.getFlightNumber());
        if (req.getOrigin() != null) flight.setOrigin(req.getOrigin());
        if (req.getDestination() != null) flight.setDestination(req.getDestination());
        if (req.getAirline() != null) flight.setAirline(req.getAirline());
        if (req.getPriority() != null) flight.setPriority(req.getPriority());
        if (req.getScheduledArrival() != null) flight.setScheduledArrival(req.getScheduledArrival());
        if (req.getScheduledDeparture() != null) flight.setScheduledDeparture(req.getScheduledDeparture());
        if (req.getStatus() != null) flight.setStatus(req.getStatus());
        if (req.getRemarks() != null) flight.setRemarks(req.getRemarks());
        if (req.getDelayMinutes() != null) flight.setDelayMinutes(req.getDelayMinutes());
        if (req.getAircraftId() != null) {
            Aircraft aircraft = aircraftRepo.findById(req.getAircraftId())
                .orElseThrow(() -> new ResourceNotFoundException("Aircraft not found: " + req.getAircraftId()));
            flight.setAircraft(aircraft);
        }
    }

    private void validateCreateRequest(FlightRequest req) {
        if (req.getFlightNumber() == null || req.getFlightNumber().isBlank()) {
            throw new IllegalArgumentException("Flight number is required");
        }
    }

    private void updateAircraftStatus(Aircraft aircraft, FlightSchedule.FlightStatus flightStatus) {
        switch (flightStatus) {
            case IN_FLIGHT -> aircraft.setStatus(Aircraft.AircraftStatus.IN_FLIGHT);
            case ARRIVED, BOARDING, DELAYED -> aircraft.setStatus(Aircraft.AircraftStatus.AT_GATE);
            case DEPARTED -> aircraft.setStatus(Aircraft.AircraftStatus.AVAILABLE);
            default -> {}
        }
        aircraftRepo.save(aircraft);
    }

    private void applyAutoDelayRules(List<FlightSchedule> flights) {
        LocalDateTime now = LocalDateTime.now(AIRPORT_ZONE);
        List<FlightSchedule> changed = new ArrayList<>();

        for (FlightSchedule flight : flights) {
            if (!shouldAutoDelay(flight, now)) continue;

            flight.setStatus(FlightSchedule.FlightStatus.DELAYED);

            long overdueMinutes = Duration.between(flight.getScheduledDeparture(), now).toMinutes();
            int computedDelay = (int) Math.max(1, overdueMinutes);
            flight.setDelayMinutes(computedDelay);

            if (flight.getAircraft() != null) {
                updateAircraftStatus(flight.getAircraft(), FlightSchedule.FlightStatus.DELAYED);
            }

            changed.add(flight);
        }

        if (!changed.isEmpty()) {
            flightRepo.saveAll(changed);
            ssePublisher.publishFlightUpdate(Map.of("event", "auto-delayed", "count", changed.size()));
        }
    }

    private boolean shouldAutoDelay(FlightSchedule flight, LocalDateTime now) {
        if (flight.getScheduledDeparture() == null) return false;
        if (flight.getActualDeparture() != null) return false;

        FlightSchedule.FlightStatus status = flight.getStatus();
        if (status != FlightSchedule.FlightStatus.SCHEDULED
            && status != FlightSchedule.FlightStatus.BOARDING
            && status != FlightSchedule.FlightStatus.DELAYED) {
            return false;
        }

        return flight.getScheduledDeparture().isBefore(now);
    }

    private void normalizeStatusAfterEdit(FlightSchedule flight, FlightRequest req) {
        if (flight.getActualDeparture() != null) {
            return;
        }

        if (flight.getScheduledDeparture() == null) {
            return;
        }

        if (flight.getStatus() == FlightSchedule.FlightStatus.CANCELLED) {
            return;
        }

        boolean departureIsStillOverdue = flight.getScheduledDeparture().isBefore(LocalDateTime.now(AIRPORT_ZONE));
        if (!departureIsStillOverdue && flight.getStatus() == FlightSchedule.FlightStatus.DELAYED) {
            flight.setStatus(FlightSchedule.FlightStatus.SCHEDULED);
            if (flight.getDelayMinutes() != null && flight.getDelayMinutes() > 0) {
                flight.setDelayMinutes(0);
            }
            return;
        }

        if (!departureIsStillOverdue && req.getStatus() == FlightSchedule.FlightStatus.DELAYED) {
            flight.setStatus(FlightSchedule.FlightStatus.SCHEDULED);
            if (flight.getDelayMinutes() != null && flight.getDelayMinutes() > 0) {
                flight.setDelayMinutes(0);
            }
        }
    }
}
