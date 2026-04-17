package com.airport.specification;

import com.airport.entity.GroundStaff;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import java.util.ArrayList;
import java.util.List;

public class StaffSpecification {
    public static Specification<GroundStaff> withFilters(
            String search, GroundStaff.StaffRole role, GroundStaff.Shift shift, GroundStaff.StaffStatus status) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(search)) {
                String like = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("name")), like),
                    cb.like(cb.lower(root.get("staffId")), like)
                ));
            }
            if (role   != null) predicates.add(cb.equal(root.get("role"), role));
            if (shift  != null) predicates.add(cb.equal(root.get("shift"), shift));
            if (status != null) predicates.add(cb.equal(root.get("status"), status));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
