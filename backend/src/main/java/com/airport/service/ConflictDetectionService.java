package com.airport.service;

import com.airport.entity.GateAssignment;
import com.airport.entity.RunwaySlot;
import com.airport.repository.GateAssignmentRepository;
import com.airport.repository.RunwaySlotRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ConflictDetectionService {

    private final GateAssignmentRepository gateRepo;
    private final RunwaySlotRepository runwayRepo;

    private static final List<String> ALL_GATES = List.of(
        "A1","A2","A3","A4","A5","A6",
        "B1","B2","B3","B4","B5","B6",
        "C1","C2","C3","C4","C5","C6",
        "D1","D2","D3","D4"
    );
    private static final List<String> ALL_RUNWAYS = List.of(
        "RWY-09L","RWY-09R","RWY-27L","RWY-27R","RWY-14","RWY-32"
    );

    // ── Gate conflict check ────────────────────────────────────────────────────

    public ConflictResult checkGateConflict(String gate, LocalDateTime start, LocalDateTime end, Long excludeId) {
        List<GateAssignment> conflicts = gateRepo.findConflicts(gate, start, end);
        if (excludeId != null) conflicts.removeIf(g -> g.getId().equals(excludeId));

        if (conflicts.isEmpty()) return ConflictResult.ok();

        // Suggest alternative gates
        List<String> suggestions = suggestAvailableGates(start, end);
        return ConflictResult.conflict(
            "Gate " + gate + " is occupied during " + fmt(start) + " – " + fmt(end),
            suggestions
        );
    }

    public List<String> suggestAvailableGates(LocalDateTime start, LocalDateTime end) {
        List<String> occupied = gateRepo.findConflicts("", start, end).stream()
            .map(GateAssignment::getGateNumber).toList();
        // Use occupied gates from ALL conflicts in time window
        List<GateAssignment> allInWindow = new ArrayList<>();
        for (String gate : ALL_GATES) {
            allInWindow.addAll(gateRepo.findConflicts(gate, start, end));
        }
        List<String> takenGates = allInWindow.stream().map(GateAssignment::getGateNumber).distinct().toList();
        return ALL_GATES.stream().filter(g -> !takenGates.contains(g)).limit(5).toList();
    }

    // ── Runway conflict check ──────────────────────────────────────────────────

    public ConflictResult checkRunwayConflict(String runway, LocalDateTime slotTime, int duration, Long excludeId) {
        LocalDateTime end = slotTime.plusMinutes(duration);
        List<RunwaySlot> conflicts = runwayRepo.findConflicts(runway, slotTime.minusMinutes(duration), end);
        if (excludeId != null) conflicts.removeIf(r -> r.getId().equals(excludeId));

        if (conflicts.isEmpty()) return ConflictResult.ok();

        List<String> suggestedRunways = suggestAvailableRunways(slotTime, duration);
        List<LocalDateTime> suggestedTimes = suggestAlternativeSlotTimes(runway, slotTime, duration);

        return ConflictResult.conflict(
            "Runway " + runway + " has a conflicting slot at " + fmt(slotTime),
            suggestedRunways,
            suggestedTimes
        );
    }

    public List<String> suggestAvailableRunways(LocalDateTime slotTime, int duration) {
        return ALL_RUNWAYS.stream().filter(rwy -> {
            LocalDateTime end = slotTime.plusMinutes(duration);
            return runwayRepo.findConflicts(rwy, slotTime, end).isEmpty();
        }).limit(3).toList();
    }

    public List<LocalDateTime> suggestAlternativeSlotTimes(String runway, LocalDateTime requested, int duration) {
        List<LocalDateTime> suggestions = new ArrayList<>();
        for (int offset : List.of(30, 60, 90, 120)) {
            LocalDateTime candidate = requested.plusMinutes(offset);
            if (runwayRepo.findConflicts(runway, candidate, candidate.plusMinutes(duration)).isEmpty()) {
                suggestions.add(candidate);
                if (suggestions.size() == 3) break;
            }
        }
        return suggestions;
    }

    private String fmt(LocalDateTime dt) {
        return dt != null ? dt.toString().replace("T", " ") : "?";
    }

    // ── Result DTO ─────────────────────────────────────────────────────────────

    @Data @Builder
    public static class ConflictResult {
        private boolean hasConflict;
        private String message;
        private List<String> suggestedResources;
        private List<LocalDateTime> suggestedTimes;

        public static ConflictResult ok() {
            return ConflictResult.builder().hasConflict(false).build();
        }
        public static ConflictResult conflict(String message, List<String> suggestions) {
            return ConflictResult.builder().hasConflict(true).message(message)
                .suggestedResources(suggestions).suggestedTimes(List.of()).build();
        }
        public static ConflictResult conflict(String message, List<String> suggestions, List<LocalDateTime> times) {
            return ConflictResult.builder().hasConflict(true).message(message)
                .suggestedResources(suggestions).suggestedTimes(times).build();
        }
    }
}
