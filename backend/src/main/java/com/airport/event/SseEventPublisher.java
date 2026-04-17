package com.airport.event;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@Slf4j
public class SseEventPublisher {

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> { emitter.complete(); emitters.remove(emitter); });
        emitter.onError(e -> { emitter.complete(); emitters.remove(emitter); });

        // Send initial heartbeat
        try {
            emitter.send(SseEmitter.event().name("connected").data(Map.of("message", "Connected to AeroOps SSE")));
        } catch (IOException e) {
            emitters.remove(emitter);
        }
        return emitter;
    }

    public void publish(String eventType, Object payload) {
        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();
        emitters.forEach(emitter -> {
            try {
                emitter.send(SseEmitter.event().name(eventType).data(payload));
            } catch (IOException e) {
                deadEmitters.add(emitter);
            }
        });
        emitters.removeAll(deadEmitters);
        log.debug("SSE event [{}] published to {} subscribers", eventType, emitters.size() - deadEmitters.size());
    }

    public void publishFlightUpdate(Object flight) { publish("flight-update", flight); }
    public void publishGateUpdate(Object gate)     { publish("gate-update", gate); }
    public void publishAlertUpdate(Object alert)   { publish("alert", alert); }
    public void publishMaintenanceUpdate(Object m) { publish("maintenance-update", m); }

    public int getSubscriberCount() { return emitters.size(); }
}
