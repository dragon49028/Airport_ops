package com.airport.service;

import com.airport.dto.RunwayRequest;
import com.airport.entity.FlightSchedule;
import com.airport.entity.RunwaySlot;
import com.airport.event.SseEventPublisher;
import com.airport.exception.ConflictException;
import com.airport.exception.ResourceNotFoundException;
import com.airport.repository.FlightScheduleRepository;
import com.airport.repository.RunwaySlotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class RunwaySlotService {

    private final RunwaySlotRepository runwayRepo;
    private final FlightScheduleRepository flightRepo;
    private final ConflictDetectionService conflictService;
    private final SseEventPublisher ssePublisher;

    public List<RunwaySlot> findAll() { return runwayRepo.findAll(); }

    public RunwaySlot findById(Long id) {
        return runwayRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Runway slot not found: " + id));
    }

    public RunwaySlot create(RunwayRequest req) {
        if (req.getSlotTime() != null) {
            int dur = req.getDuration() != null ? req.getDuration() : 30;
            ConflictDetectionService.ConflictResult result =
                conflictService.checkRunwayConflict(req.getRunwayNumber(), req.getSlotTime(), dur, null);
            if (result.isHasConflict()) {
                String msg = result.getMessage();
                if (result.getSuggestedResources() != null && !result.getSuggestedResources().isEmpty())
                    msg += ". Available runways: " + String.join(", ", result.getSuggestedResources());
                throw new ConflictException(msg);
            }
        }
        RunwaySlot slot = new RunwaySlot();
        mapRequest(req, slot);
        RunwaySlot saved = runwayRepo.save(slot);
        ssePublisher.publish("runway-update", Map.of("event", "booked", "runway", saved.getRunwayNumber()));
        return saved;
    }

    public RunwaySlot update(Long id, RunwayRequest req) {
        RunwaySlot existing = findById(id);
        if (req.getSlotTime() != null) {
            int dur = req.getDuration() != null ? req.getDuration() : 30;
            ConflictDetectionService.ConflictResult result =
                conflictService.checkRunwayConflict(req.getRunwayNumber(), req.getSlotTime(), dur, id);
            if (result.isHasConflict()) throw new ConflictException(result.getMessage());
        }
        mapRequest(req, existing);
        return runwayRepo.save(existing);
    }

    public void delete(Long id) { runwayRepo.deleteById(id); }

    private void mapRequest(RunwayRequest req, RunwaySlot slot) {
        slot.setRunwayNumber(req.getRunwayNumber());
        slot.setSlotTime(req.getSlotTime());
        slot.setDuration(req.getDuration() != null ? req.getDuration() : 30);
        if (req.getSlotType() != null) slot.setSlotType(req.getSlotType());
        if (req.getWeatherCondition() != null) slot.setWeatherCondition(req.getWeatherCondition());
        if (req.getFlightScheduleId() != null) {
            FlightSchedule flight = flightRepo.findById(req.getFlightScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found"));
            slot.setFlightSchedule(flight);
        }
    }
}
