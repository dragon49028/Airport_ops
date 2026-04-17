package com.airport.repository;

import com.airport.entity.MaintenanceClearance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MaintenanceClearanceRepository extends JpaRepository<MaintenanceClearance, Long> {
    List<MaintenanceClearance> findByAircraftId(Long aircraftId);
    List<MaintenanceClearance> findByClearanceStatus(MaintenanceClearance.ClearanceStatus status);
    List<MaintenanceClearance> findBySeverity(MaintenanceClearance.Severity severity);
}
