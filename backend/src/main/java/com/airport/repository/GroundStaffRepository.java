package com.airport.repository;

import com.airport.entity.GroundStaff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroundStaffRepository extends JpaRepository<GroundStaff, Long>,
        JpaSpecificationExecutor<GroundStaff> {

    Optional<GroundStaff> findByStaffId(String staffId);
    List<GroundStaff> findByStatus(GroundStaff.StaffStatus status);
    List<GroundStaff> findByRole(GroundStaff.StaffRole role);
    List<GroundStaff> findByShift(GroundStaff.Shift shift);
    List<GroundStaff> findByNameContainingIgnoreCase(String name);
}
