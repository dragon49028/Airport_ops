package com.airport.dto;

import com.airport.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class RegisterRequest {
    private String username;
    private String password;
    private String email;
    private User.Role role;
}
