package com.airport.repository;

import com.airport.entity.RunwaySlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RunwaySlotRepository extends JpaRepository<RunwaySlot, Long> {
    List<RunwaySlot> findByRunwayNumber(String runwayNumber);
    List<RunwaySlot> findByStatus(RunwaySlot.SlotStatus status);

    @Query("SELECT r FROM RunwaySlot r WHERE r.runwayNumber = :runway AND r.status IN ('SCHEDULED','IN_PROGRESS') " +
           "AND r.slotTime BETWEEN :start AND :end")
    List<RunwaySlot> findConflicts(@Param("runway") String runway,
                                   @Param("start") LocalDateTime start,
                                   @Param("end") LocalDateTime end);

    @Query("SELECT r FROM RunwaySlot r WHERE r.slotTime BETWEEN :start AND :end ORDER BY r.slotTime")
    List<RunwaySlot> findByTimeRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
