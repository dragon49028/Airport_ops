package com.airport.specification;

import com.airport.entity.Aircraft;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import java.util.ArrayList;
import java.util.List;

public class AircraftSpecification {
    public static Specification<Aircraft> withFilters(String search, Aircraft.AircraftStatus status, String airline) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(search)) {
                String like = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("registrationNumber")), like),
                    cb.like(cb.lower(root.get("model")), like),
                    cb.like(cb.lower(root.get("airline")), like)
                ));
            }
            if (status != null) predicates.add(cb.equal(root.get("status"), status));
            if (StringUtils.hasText(airline)) predicates.add(cb.like(cb.lower(root.get("airline")), "%" + airline.toLowerCase() + "%"));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
