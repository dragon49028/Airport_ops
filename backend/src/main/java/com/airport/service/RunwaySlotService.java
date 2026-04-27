package com.airport.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.airport.dto.RunwayRequest;
import com.airport.entity.FlightSchedule;
import com.airport.entity.RunwaySlot;
import com.airport.event.SseEventPublisher;
import com.airport.exception.ConflictException;
import com.airport.exception.ResourceNotFoundException;
import com.airport.repository.FlightScheduleRepository;
import com.airport.repository.RunwaySlotRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class RunwaySlotService {

    private final RunwaySlotRepository runwayRepo;
    private final FlightScheduleRepository flightRepo;
    private final ConflictDetectionService conflictService;
    private final SseEventPublisher ssePublisher;

    public List<RunwaySlot> findAll() {
        return refreshStatuses(runwayRepo.findAll());
    }

    public RunwaySlot findById(Long id) {
        RunwaySlot slot = runwayRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Runway slot not found: " + id));
        return refreshStatus(slot);
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
        RunwaySlot saved = runwayRepo.save(refreshStatus(slot));
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
        return runwayRepo.save(refreshStatus(existing));
    }

    public void delete(Long id) { runwayRepo.deleteById(id); }

    private List<RunwaySlot> refreshStatuses(List<RunwaySlot> slots) {
        return slots.stream().map(this::refreshStatus).toList();
    }

    private RunwaySlot refreshStatus(RunwaySlot slot) {
        if (slot == null || slot.getStatus() == RunwaySlot.SlotStatus.CANCELLED || slot.getStatus() == RunwaySlot.SlotStatus.COMPLETED) {
            return slot;
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime slotEnd = slot.getSlotTime().plusMinutes(slot.getDuration() != null ? slot.getDuration() : 30);

        if (now.isAfter(slotEnd)) {
            slot.setStatus(RunwaySlot.SlotStatus.COMPLETED);
            return runwayRepo.save(slot);
        }

        if (!now.isBefore(slot.getSlotTime())) {
            slot.setStatus(RunwaySlot.SlotStatus.IN_PROGRESS);
            return runwayRepo.save(slot);
        }

        slot.setStatus(RunwaySlot.SlotStatus.SCHEDULED);
        return slot;
    }

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
