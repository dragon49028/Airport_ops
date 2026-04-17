package com.airport.service;

import com.airport.dto.*;
import com.airport.entity.RefreshToken;
import com.airport.entity.User;
import com.airport.repository.UserRepository;
import com.airport.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );
        User user = userRepository.findByUsername(request.getUsername())
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        String accessToken  = jwtUtils.generateToken(user);
        RefreshToken refresh = refreshTokenService.createRefreshToken(user);
        return AuthResponse.builder()
            .token(accessToken)
            .refreshToken(refresh.getToken())
            .username(user.getUsername())
            .email(user.getEmail())
            .role(user.getRole().name())
            .build();
    }

    public AuthResponse refreshToken(String refreshTokenStr) {
        RefreshToken refreshToken = refreshTokenService.findByToken(refreshTokenStr);
        refreshTokenService.verifyExpiration(refreshToken);
        User user = refreshToken.getUser();
        String newAccessToken = jwtUtils.generateToken(user);
        return AuthResponse.builder()
            .token(newAccessToken)
            .refreshToken(refreshTokenStr)
            .username(user.getUsername())
            .email(user.getEmail())
            .role(user.getRole().name())
            .build();
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername()))
            throw new IllegalArgumentException("Username already taken");
        if (userRepository.existsByEmail(request.getEmail()))
            throw new IllegalArgumentException("Email already registered");
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setRole(request.getRole() != null ? request.getRole() : User.Role.OPERATOR);
        userRepository.save(user);
        String accessToken  = jwtUtils.generateToken(user);
        RefreshToken refresh = refreshTokenService.createRefreshToken(user);
        return AuthResponse.builder()
            .token(accessToken)
            .refreshToken(refresh.getToken())
            .username(user.getUsername())
            .email(user.getEmail())
            .role(user.getRole().name())
            .build();
    }

    public void logout(String username) {
        userRepository.findByUsername(username).ifPresent(refreshTokenService::revokeByUser);
    }
}
