package com.airport.controller;

import com.airport.dto.GateRequest;
import com.airport.entity.GateAssignment;
import com.airport.service.GateAssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/gates")
@RequiredArgsConstructor
public class GateController {
    private final GateAssignmentService service;

    @GetMapping
    public ResponseEntity<List<GateAssignment>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GateAssignment> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping("/available")
    public ResponseEntity<List<String>> getAvailable(
            @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE_TIME) LocalDateTime time) {
        return ResponseEntity.ok(service.findAvailableGates(time != null ? time : LocalDateTime.now()));
    }

    @PostMapping
    public ResponseEntity<GateAssignment> create(@RequestBody GateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GateAssignment> update(@PathVariable Long id, @RequestBody GateRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<GateAssignment> updateStatus(@PathVariable Long id,
                                                        @RequestBody Map<String,String> body) {
        GateAssignment.GateStatus status = GateAssignment.GateStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(service.updateStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
