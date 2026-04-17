package com.airport.controller;

import com.airport.dto.BaggageRequest;
import com.airport.entity.BaggageManifest;
import com.airport.service.BaggageManifestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/baggage")
@RequiredArgsConstructor
public class BaggageController {
    private final BaggageManifestService service;

    @GetMapping
    public ResponseEntity<List<BaggageManifest>> getAll() { return ResponseEntity.ok(service.findAll()); }

    @GetMapping("/{id}")
    public ResponseEntity<BaggageManifest> getById(@PathVariable Long id) { return ResponseEntity.ok(service.findById(id)); }

    @PostMapping
    public ResponseEntity<BaggageManifest> create(@RequestBody BaggageRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BaggageManifest> update(@PathVariable Long id, @RequestBody BaggageRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<BaggageManifest> updateStatus(@PathVariable Long id, @RequestBody Map<String,String> body) {
        return ResponseEntity.ok(service.updateStatus(id, BaggageManifest.BaggageStatus.valueOf(body.get("status"))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) { service.delete(id); return ResponseEntity.noContent().build(); }
}
