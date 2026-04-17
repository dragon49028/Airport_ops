package com.airport.controller;

import com.airport.dto.FlightRequest;
import com.airport.entity.FlightSchedule;
import com.airport.service.FlightScheduleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/flights")
@RequiredArgsConstructor
@Tag(name = "Flights", description = "Flight schedule management")
public class FlightController {

    private final FlightScheduleService service;

    @GetMapping
    @Operation(summary = "List flights with pagination, search, and filters")
    public ResponseEntity<Page<FlightSchedule>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) FlightSchedule.FlightStatus status,
            @RequestParam(required = false) String airline,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @PageableDefault(size = 20, sort = "scheduledArrival") Pageable pageable) {
        return ResponseEntity.ok(service.findAll(search, status, airline, from, to, pageable));
    }

    @GetMapping("/active")
    @Operation(summary = "Get all currently active flights")
    public ResponseEntity<List<FlightSchedule>> getActive() {
        return ResponseEntity.ok(service.findActive());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FlightSchedule> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<FlightSchedule> create(@RequestBody FlightRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FlightSchedule> update(@PathVariable Long id, @RequestBody FlightRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    // ✅ FIXED: Added validation + null checks
    @PostMapping("/bulk-status")
    @Operation(summary = "Bulk update flight statuses")
    public ResponseEntity<?> bulkUpdateStatus(@RequestBody BulkStatusRequest req) {
        if (req == null || req.ids() == null || req.status() == null) {
            return ResponseEntity.badRequest().body("IDs and status are required");
        }
        return ResponseEntity.ok(service.bulkUpdateStatus(req.ids(), req.status()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ✅ FIXED: Using record with explicit type (works with Lombok + Java 17)
    public record BulkStatusRequest(
            List<Long> ids,
            FlightSchedule.FlightStatus status
    ) {}
}
