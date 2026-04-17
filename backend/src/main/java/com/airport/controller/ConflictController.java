package com.airport.controller;

import com.airport.service.ConflictDetectionService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/conflicts")
@RequiredArgsConstructor
@Tag(name = "Conflict Detection", description = "Check and resolve gate/runway conflicts")
public class ConflictController {
    private final ConflictDetectionService conflictService;

    @GetMapping("/gate")
    public ResponseEntity<ConflictDetectionService.ConflictResult> checkGate(
            @RequestParam String gate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(required = false) Long excludeId) {
        return ResponseEntity.ok(conflictService.checkGateConflict(gate, start, end, excludeId));
    }

    @GetMapping("/runway")
    public ResponseEntity<ConflictDetectionService.ConflictResult> checkRunway(
            @RequestParam String runway,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime slotTime,
            @RequestParam(defaultValue = "30") int duration,
            @RequestParam(required = false) Long excludeId) {
        return ResponseEntity.ok(conflictService.checkRunwayConflict(runway, slotTime, duration, excludeId));
    }
}
