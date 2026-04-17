package com.airport.controller;

import com.airport.event.SseEventPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@RestController
@RequestMapping("/api/sse")
@RequiredArgsConstructor
public class SseController {

    private final SseEventPublisher publisher;

    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe() {
        return publisher.subscribe();
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        return Map.of("subscribers", publisher.getSubscriberCount(), "status", "active");
    }
}
