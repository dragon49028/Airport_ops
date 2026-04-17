package com.airport.repository;

import com.airport.entity.BaggageManifest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BaggageManifestRepository extends JpaRepository<BaggageManifest, Long> {
    Optional<BaggageManifest> findByFlightScheduleId(Long flightScheduleId);
    List<BaggageManifest> findByStatus(BaggageManifest.BaggageStatus status);
    List<BaggageManifest> findByPriorityLevel(BaggageManifest.PriorityLevel priority);
}
