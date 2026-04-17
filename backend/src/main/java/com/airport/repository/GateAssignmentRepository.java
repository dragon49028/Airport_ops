package com.airport.repository;

import com.airport.entity.GateAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface GateAssignmentRepository extends JpaRepository<GateAssignment, Long> {
    List<GateAssignment> findByGateNumber(String gateNumber);
    List<GateAssignment> findByStatus(GateAssignment.GateStatus status);

    @Query("SELECT g FROM GateAssignment g WHERE g.gateNumber = :gate AND g.status IN ('SCHEDULED','ACTIVE') " +
           "AND ((g.assignedTime <= :end AND g.releaseTime >= :start))")
    List<GateAssignment> findConflicts(@Param("gate") String gate,
                                        @Param("start") LocalDateTime start,
                                        @Param("end") LocalDateTime end);

    @Query("SELECT DISTINCT g.gateNumber FROM GateAssignment g WHERE g.status = 'ACTIVE'")
    List<String> findOccupiedGates();
}
