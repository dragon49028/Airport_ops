package com.airport.controller;

import com.airport.dto.MaintenanceRequest;
import com.airport.entity.MaintenanceClearance;
import com.airport.service.MaintenanceClearanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
public class MaintenanceController {
    private final MaintenanceClearanceService service;

    @GetMapping
    public ResponseEntity<List<MaintenanceClearance>> getAll() { return ResponseEntity.ok(service.findAll()); }

    @GetMapping("/{id}")
    public ResponseEntity<MaintenanceClearance> getById(@PathVariable Long id) { return ResponseEntity.ok(service.findById(id)); }

    @PostMapping
    public ResponseEntity<MaintenanceClearance> create(@RequestBody MaintenanceRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MaintenanceClearance> update(@PathVariable Long id, @RequestBody MaintenanceRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<MaintenanceClearance> approve(@PathVariable Long id, @RequestBody Map<String,String> body) {
        return ResponseEntity.ok(service.approveClearance(id, body.get("approvedBy")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) { service.delete(id); return ResponseEntity.noContent().build(); }
}
