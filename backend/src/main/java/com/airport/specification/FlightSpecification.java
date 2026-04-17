package com.airport.specification;

import com.airport.entity.FlightSchedule;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class FlightSpecification {
    public static Specification<FlightSchedule> withFilters(
            String search, FlightSchedule.FlightStatus status,
            LocalDateTime from, LocalDateTime to, String airline) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(search)) {
                String like = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("flightNumber")), like),
                    cb.like(cb.lower(root.get("origin")), like),
                    cb.like(cb.lower(root.get("destination")), like),
                    cb.like(cb.lower(root.get("airline")), like)
                ));
            }
            if (status != null) predicates.add(cb.equal(root.get("status"), status));
            if (StringUtils.hasText(airline)) predicates.add(cb.like(cb.lower(root.get("airline")), "%" + airline.toLowerCase() + "%"));
            if (from != null) predicates.add(cb.greaterThanOrEqualTo(root.get("scheduledArrival"), from));
            if (to   != null) predicates.add(cb.lessThanOrEqualTo(root.get("scheduledArrival"), to));
            if (query != null && query.getResultType() != Long.class) {
                root.fetch("aircraft", JoinType.LEFT);
                query.distinct(true);
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
