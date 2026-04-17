package com.airport.repository;

import com.airport.entity.Aircraft;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AircraftRepository extends JpaRepository<Aircraft, Long>,
        JpaSpecificationExecutor<Aircraft> {

    Optional<Aircraft> findByRegistrationNumber(String registrationNumber);
    List<Aircraft> findByStatus(Aircraft.AircraftStatus status);

    @Query("SELECT a FROM Aircraft a WHERE a.status = 'AVAILABLE'")
    List<Aircraft> findAvailableAircraft();
}
