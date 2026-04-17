package com.airport.repository;

import com.airport.entity.RefuelRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefuelRequestRepository extends JpaRepository<RefuelRequest, Long> {
    Optional<RefuelRequest> findByFlightScheduleId(Long flightScheduleId);
    List<RefuelRequest> findByStatus(RefuelRequest.RefuelStatus status);
}
