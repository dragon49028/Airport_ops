package com.airport.controller;

import com.airport.service.ExportService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
@Tag(name = "Reports & Export", description = "CSV export for flights and staff")
public class ExportController {
    private final ExportService exportService;

    @GetMapping("/flights/csv")
    public ResponseEntity<byte[]> exportFlightsCsv() {
        String csv = exportService.exportFlightsAsCsv();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "flights_export.csv");
        return ResponseEntity.ok().headers(headers).body(csv.getBytes());
    }

    @GetMapping("/staff/csv")
    public ResponseEntity<byte[]> exportStaffCsv() {
        String csv = exportService.exportStaffAsCsv();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "staff_export.csv");
        return ResponseEntity.ok().headers(headers).body(csv.getBytes());
    }
}
