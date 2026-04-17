package com.airport.service;

import com.airport.dto.DashboardStats;
import com.airport.entity.*;
import com.airport.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final FlightScheduleRepository flightRepo;
    private final AircraftRepository aircraftRepo;
    private final GateAssignmentRepository gateRepo;
    private final RefuelRequestRepository refuelRepo;
    private final MaintenanceClearanceRepository maintenanceRepo;
    private final GroundStaffRepository staffRepo;

    public DashboardStats getStats() {
        long totalFlights = flightRepo.count();
        long activeFlights = flightRepo.findActiveFlights().size();
        long delayedFlights = flightRepo.findByStatus(FlightSchedule.FlightStatus.DELAYED).size();
        long totalAircraft = aircraftRepo.count();
        long availableAircraft = aircraftRepo.findAvailableAircraft().size();
        long occupiedGates = gateRepo.findByStatus(GateAssignment.GateStatus.ACTIVE).size();
        long pendingRefuels = refuelRepo.findByStatus(RefuelRequest.RefuelStatus.PENDING).size()
                + refuelRepo.findByStatus(RefuelRequest.RefuelStatus.IN_PROGRESS).size();
        long pendingMaintenance = maintenanceRepo.findByClearanceStatus(MaintenanceClearance.ClearanceStatus.PENDING).size()
                + maintenanceRepo.findByClearanceStatus(MaintenanceClearance.ClearanceStatus.IN_REVIEW).size();
        long availableStaff = staffRepo.findByStatus(GroundStaff.StaffStatus.AVAILABLE).size();
        long totalStaff = staffRepo.count();
        long criticalAlerts = maintenanceRepo.findBySeverity(MaintenanceClearance.Severity.CRITICAL).stream()
                .filter(m -> m.getClearanceStatus() != MaintenanceClearance.ClearanceStatus.CLEARED)
                .count();

        // Placeholder calculations - replace with actual logic
        double totalRevenue = 0.0; // Calculate based on flights or other data
        double customerSatisfaction = 4.2; // Placeholder rating

        return DashboardStats.builder()
                .totalFlights(totalFlights)
                .activeFlights(activeFlights)
                .delayedFlights(delayedFlights)
                .totalAircraft(totalAircraft)
                .availableAircraft(availableAircraft)
                .occupiedGates(occupiedGates)
                .pendingRefuels(pendingRefuels)
                .pendingMaintenance(pendingMaintenance)
                .availableStaff(availableStaff)
                .totalStaff(totalStaff)
                .criticalAlerts(criticalAlerts)
                .totalRevenue(totalRevenue)
                .customerSatisfaction(customerSatisfaction)
                .build();
    }
}
