package com.airport.controller;

import com.airport.dto.RunwayRequest;
import com.airport.entity.RunwaySlot;
import com.airport.service.RunwaySlotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/runways")
@RequiredArgsConstructor
public class RunwayController {
    private final RunwaySlotService service;

    @GetMapping
    public ResponseEntity<List<RunwaySlot>> getAll() { return ResponseEntity.ok(service.findAll()); }

    @GetMapping("/{id}")
    public ResponseEntity<RunwaySlot> getById(@PathVariable Long id) { return ResponseEntity.ok(service.findById(id)); }

    @PostMapping
    public ResponseEntity<RunwaySlot> create(@RequestBody RunwayRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RunwaySlot> update(@PathVariable Long id, @RequestBody RunwayRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
