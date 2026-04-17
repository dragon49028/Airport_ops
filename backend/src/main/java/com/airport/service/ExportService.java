package com.airport.service;

import com.airport.entity.FlightSchedule;
import com.airport.entity.GroundStaff;
import com.airport.repository.FlightScheduleRepository;
import com.airport.repository.GroundStaffRepository;
import com.opencsv.CSVWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.StringWriter;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final FlightScheduleRepository flightRepo;
    private final GroundStaffRepository staffRepo;

    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public String exportFlightsAsCsv() {
        List<FlightSchedule> flights = flightRepo.findAll();
        StringWriter sw = new StringWriter();
        try (CSVWriter writer = new CSVWriter(sw)) {
            writer.writeNext(new String[]{
                "Flight No.", "Airline", "Origin", "Destination",
                "Scheduled Arrival", "Scheduled Departure",
                "Actual Arrival", "Actual Departure",
                "Status", "Priority", "Delay (min)", "Aircraft"
            });
            flights.forEach(f -> writer.writeNext(new String[]{
                f.getFlightNumber(),
                nvl(f.getAirline()),
                nvl(f.getOrigin()),
                nvl(f.getDestination()),
                fmt(f.getScheduledArrival()),
                fmt(f.getScheduledDeparture()),
                fmt(f.getActualArrival()),
                fmt(f.getActualDeparture()),
                f.getStatus().name(),
                f.getPriority().name(),
                String.valueOf(f.getDelayMinutes()),
                f.getAircraft() != null ? f.getAircraft().getRegistrationNumber() : ""
            }));
        } catch (Exception e) {
            throw new RuntimeException("CSV export failed", e);
        }
        return sw.toString();
    }

    public String exportStaffAsCsv() {
        List<GroundStaff> staff = staffRepo.findAll();
        StringWriter sw = new StringWriter();
        try (CSVWriter writer = new CSVWriter(sw)) {
            writer.writeNext(new String[]{"Staff ID", "Name", "Role", "Shift", "Status", "Assignment", "Phone"});
            staff.forEach(s -> writer.writeNext(new String[]{
                s.getStaffId(), s.getName(), s.getRole().name(),
                s.getShift().name(), s.getStatus().name(),
                nvl(s.getCurrentAssignment()), nvl(s.getPhone())
            }));
        } catch (Exception e) {
            throw new RuntimeException("CSV export failed", e);
        }
        return sw.toString();
    }

    private String fmt(java.time.LocalDateTime dt) { return dt != null ? dt.format(DT) : ""; }
    private String nvl(String s) { return s != null ? s : ""; }
}
