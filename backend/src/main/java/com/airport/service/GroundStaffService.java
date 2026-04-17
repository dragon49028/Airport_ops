package com.airport.service;

import com.airport.dto.StaffRequest;
import com.airport.entity.GroundStaff;
import com.airport.exception.ResourceNotFoundException;
import com.airport.repository.GroundStaffRepository;
import com.airport.specification.StaffSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service @RequiredArgsConstructor @Transactional
public class GroundStaffService {
    private final GroundStaffRepository repo;

    public List<GroundStaff> findAll() { return repo.findAll(); }

    public Page<GroundStaff> findAll(String search, GroundStaff.StaffRole role,
                                     GroundStaff.Shift shift, GroundStaff.StaffStatus status,
                                     Pageable pageable) {
        return repo.findAll(StaffSpecification.withFilters(search, role, shift, status), pageable);
    }

    public GroundStaff findById(Long id) {
        return repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Staff not found: " + id));
    }

    public List<GroundStaff> findAvailable() { return repo.findByStatus(GroundStaff.StaffStatus.AVAILABLE); }

    public List<GroundStaff> search(String name) { return repo.findByNameContainingIgnoreCase(name); }

    public GroundStaff create(StaffRequest req) {
        if (repo.findByStaffId(req.getStaffId()).isPresent())
            throw new IllegalArgumentException("Staff ID already exists: " + req.getStaffId());
        GroundStaff staff = new GroundStaff();
        mapRequest(req, staff);
        return repo.save(staff);
    }

    public GroundStaff update(Long id, StaffRequest req) {
        GroundStaff staff = findById(id);
        mapRequest(req, staff);
        return repo.save(staff);
    }

    public void delete(Long id) { repo.deleteById(id); }

    private void mapRequest(StaffRequest req, GroundStaff staff) {
        staff.setStaffId(req.getStaffId());
        staff.setName(req.getName());
        if (req.getRole() != null) staff.setRole(req.getRole());
        if (req.getShift() != null) staff.setShift(req.getShift());
        staff.setCurrentAssignment(req.getCurrentAssignment());
        if (req.getStatus() != null) staff.setStatus(req.getStatus());
        staff.setPhone(req.getPhone());
        staff.setEmail(req.getEmail());
        staff.setCertifications(req.getCertifications());
        if (req.getAvailability() != null) staff.setAvailability(req.getAvailability());
    }
}
