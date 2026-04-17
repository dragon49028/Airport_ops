package com.airport.controller;

import com.airport.dto.AircraftRequest;
import com.airport.entity.Aircraft;
import com.airport.service.AircraftService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/aircraft")
@RequiredArgsConstructor
@Tag(name = "Aircraft", description = "Fleet management")
public class AircraftController {

    private final AircraftService aircraftService;

    @GetMapping
    @Operation(summary = "List aircraft with optional search, status, airline filters and pagination")
    public ResponseEntity<?> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Aircraft.AircraftStatus status,
            @RequestParam(required = false) String airline,
            @RequestParam(defaultValue = "false") boolean paginate,
            @PageableDefault(size = 20) Pageable pageable) {
        if (paginate) return ResponseEntity.ok(aircraftService.findAll(search, status, airline, pageable));
        if (status != null) return ResponseEntity.ok(aircraftService.findByStatus(status));
        return ResponseEntity.ok(aircraftService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Aircraft> getById(@PathVariable Long id) {
        return ResponseEntity.ok(aircraftService.findById(id));
    }

    @GetMapping("/available")
    @Operation(summary = "Get all available (unoccupied) aircraft")
    public ResponseEntity<List<Aircraft>> getAvailable() {
        return ResponseEntity.ok(aircraftService.findAvailable());
    }

    @PostMapping
    public ResponseEntity<Aircraft> create(@RequestBody AircraftRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(aircraftService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Aircraft> update(@PathVariable Long id, @RequestBody AircraftRequest request) {
        return ResponseEntity.ok(aircraftService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        aircraftService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
