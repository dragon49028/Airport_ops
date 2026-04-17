package com.airport.repository;

import com.airport.entity.FlightSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FlightScheduleRepository extends JpaRepository<FlightSchedule, Long>,
        JpaSpecificationExecutor<FlightSchedule> {

    Optional<FlightSchedule> findByFlightNumber(String flightNumber);
    List<FlightSchedule> findByStatus(FlightSchedule.FlightStatus status);

    @Query("SELECT f FROM FlightSchedule f WHERE f.status IN ('SCHEDULED','BOARDING','ARRIVED','DELAYED')")
    List<FlightSchedule> findActiveFlights();

    @Query("SELECT f FROM FlightSchedule f WHERE f.scheduledArrival BETWEEN :start AND :end")
    List<FlightSchedule> findByArrivalBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(f) FROM FlightSchedule f WHERE f.status = :status")
    long countByStatus(@Param("status") FlightSchedule.FlightStatus status);
}
