package com.airport.service;

import com.airport.entity.RunwaySlot;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
public class WeatherService {

    private static final List<RunwaySlot.WeatherCondition> CONDITIONS = List.of(
        RunwaySlot.WeatherCondition.CLEAR,
        RunwaySlot.WeatherCondition.CLEAR,
        RunwaySlot.WeatherCondition.CLEAR,
        RunwaySlot.WeatherCondition.CLOUDY,
        RunwaySlot.WeatherCondition.CLOUDY,
        RunwaySlot.WeatherCondition.RAIN,
        RunwaySlot.WeatherCondition.FOG,
        RunwaySlot.WeatherCondition.CROSSWIND,
        RunwaySlot.WeatherCondition.STORM
    );

    private static final Map<RunwaySlot.WeatherCondition, WeatherInfo> WEATHER_DATA = Map.of(
        RunwaySlot.WeatherCondition.CLEAR,     new WeatherInfo("Clear skies", 0,   false, 1.0),
        RunwaySlot.WeatherCondition.CLOUDY,    new WeatherInfo("Overcast",    2,   false, 0.9),
        RunwaySlot.WeatherCondition.RAIN,      new WeatherInfo("Rain showers",5,   false, 0.75),
        RunwaySlot.WeatherCondition.FOG,       new WeatherInfo("Low visibility fog", 15, true, 0.5),
        RunwaySlot.WeatherCondition.CROSSWIND, new WeatherInfo("Strong crosswinds", 10, false, 0.6),
        RunwaySlot.WeatherCondition.STORM,     new WeatherInfo("Thunderstorm", 30, true, 0.0)
    );

    /** Returns current simulated weather (deterministic based on hour to be consistent in UI) */
    public WeatherReport getCurrentWeather() {
        int seed = LocalDateTime.now().getDayOfYear() * 24 + LocalDateTime.now().getHour();
        Random rng = new Random(seed);
        RunwaySlot.WeatherCondition condition = CONDITIONS.get(rng.nextInt(CONDITIONS.size()));
        WeatherInfo info = WEATHER_DATA.get(condition);

        return WeatherReport.builder()
            .condition(condition)
            .description(info.description())
            .delayMinutes(info.delayMinutes())
            .operationsHalted(info.halted())
            .capacityFactor(info.capacity())
            .temperature(15 + rng.nextInt(20))
            .windSpeedKmh(5 + rng.nextInt(50))
            .visibilityKm(condition == RunwaySlot.WeatherCondition.FOG ? 0.5 : 10.0)
            .timestamp(LocalDateTime.now())
            .build();
    }

    public WeatherInfo getConditionInfo(RunwaySlot.WeatherCondition condition) {
        return WEATHER_DATA.getOrDefault(condition, WEATHER_DATA.get(RunwaySlot.WeatherCondition.CLEAR));
    }

    public record WeatherInfo(String description, int delayMinutes, boolean halted, double capacity) {}

    @lombok.Builder
    @lombok.Data
    public static class WeatherReport {
        private RunwaySlot.WeatherCondition condition;
        private String description;
        private int delayMinutes;
        private boolean operationsHalted;
        private double capacityFactor;
        private int temperature;
        private int windSpeedKmh;
        private double visibilityKm;
        private LocalDateTime timestamp;
    }
}
