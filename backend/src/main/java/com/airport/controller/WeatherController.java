package com.airport.controller;

import com.airport.service.WeatherService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/weather")
@RequiredArgsConstructor
@Tag(name = "Weather", description = "Mock weather service affecting runway operations")
public class WeatherController {
    private final WeatherService weatherService;

    @GetMapping("/current")
    public ResponseEntity<WeatherService.WeatherReport> getCurrent() {
        return ResponseEntity.ok(weatherService.getCurrentWeather());
    }
}
