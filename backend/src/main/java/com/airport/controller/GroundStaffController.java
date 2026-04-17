package com.airport.controller;

import com.airport.dto.StaffRequest;
import com.airport.entity.GroundStaff;
import com.airport.service.GroundStaffService;
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
@RequestMapping("/api/staff")
@RequiredArgsConstructor
@Tag(name = "Ground Staff", description = "Personnel management")
public class GroundStaffController {
    private final GroundStaffService service;

    @GetMapping
    @Operation(summary = "List staff with search/filter and optional pagination")
    public ResponseEntity<?> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) GroundStaff.StaffRole role,
            @RequestParam(required = false) GroundStaff.Shift shift,
            @RequestParam(required = false) GroundStaff.StaffStatus status,
            @RequestParam(defaultValue = "false") boolean available,
            @RequestParam(defaultValue = "false") boolean paginate,
            @PageableDefault(size = 20) Pageable pageable) {
        if (available) return ResponseEntity.ok(service.findAvailable());
        if (paginate)  return ResponseEntity.ok(service.findAll(search, role, shift, status, pageable));
        if (search != null) return ResponseEntity.ok(service.search(search));
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroundStaff> getById(@PathVariable Long id) { return ResponseEntity.ok(service.findById(id)); }

    @PostMapping
    public ResponseEntity<GroundStaff> create(@RequestBody StaffRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GroundStaff> update(@PathVariable Long id, @RequestBody StaffRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) { service.delete(id); return ResponseEntity.noContent().build(); }
}
