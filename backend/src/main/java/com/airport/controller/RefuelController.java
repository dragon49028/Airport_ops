package com.airport.controller;

import com.airport.dto.RefuelRequestDto;
import com.airport.entity.RefuelRequest;
import com.airport.service.RefuelRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/refuel")
@RequiredArgsConstructor
public class RefuelController {
    private final RefuelRequestService service;

    @GetMapping
    public ResponseEntity<List<RefuelRequest>> getAll() { return ResponseEntity.ok(service.findAll()); }

    @GetMapping("/{id}")
    public ResponseEntity<RefuelRequest> getById(@PathVariable Long id) { return ResponseEntity.ok(service.findById(id)); }

    @PostMapping
    public ResponseEntity<RefuelRequest> create(@RequestBody RefuelRequestDto req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RefuelRequest> update(@PathVariable Long id, @RequestBody RefuelRequestDto req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<RefuelRequest> updateStatus(@PathVariable Long id, @RequestBody Map<String,String> body) {
        return ResponseEntity.ok(service.updateStatus(id, RefuelRequest.RefuelStatus.valueOf(body.get("status"))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) { service.delete(id); return ResponseEntity.noContent().build(); }
}
