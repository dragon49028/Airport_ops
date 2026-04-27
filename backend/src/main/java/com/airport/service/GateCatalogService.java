package com.airport.service;

import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.airport.dto.GateCatalogRequest;
import com.airport.entity.Gate;
import com.airport.exception.ResourceNotFoundException;
import com.airport.repository.GateRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class GateCatalogService {

    private final GateRepository gateRepository;

    public List<Gate> findAll() {
        return gateRepository.findAll();
    }

    public Gate findById(Long id) {
        return gateRepository.findById(Objects.requireNonNull(id, "id must not be null"))
            .orElseThrow(() -> new ResourceNotFoundException("Gate not found: " + id));
    }

    public Gate create(GateCatalogRequest request) {
        Gate gate = new Gate();
        mapRequest(request, gate);
        return gateRepository.save(gate);
    }

    @SuppressWarnings("null")
    public Gate update(Long id, GateCatalogRequest request) {
        Gate gate = findById(id);
        mapRequest(request, gate);
        return gateRepository.save(gate);
    }

    public void delete(Long id) {
        findById(id);
        gateRepository.deleteById(Objects.requireNonNull(id, "id must not be null"));
    }

    private void mapRequest(GateCatalogRequest request, Gate gate) {
        gate.setGateNumber(request.getGateNumber());
        gate.setTerminal(request.getTerminal());
        gate.setCapacity(request.getCapacity());
        gate.setStatus(request.getStatus() != null ? request.getStatus() : Gate.GateStatus.AVAILABLE);
    }
}
