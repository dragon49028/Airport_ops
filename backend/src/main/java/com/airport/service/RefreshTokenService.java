package com.airport.service;

import com.airport.entity.RefreshToken;
import com.airport.entity.User;
import com.airport.exception.ResourceNotFoundException;
import com.airport.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshExpiration;

    private final RefreshTokenRepository repo;

    @Transactional
    public RefreshToken createRefreshToken(User user) {
        repo.deleteByUser(user);
        RefreshToken token = new RefreshToken();
        token.setUser(user);
        token.setToken(UUID.randomUUID().toString());
        token.setExpiryDate(Instant.now().plusMillis(refreshExpiration));
        return repo.save(token);
    }

    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().isBefore(Instant.now()) || token.isRevoked()) {
            repo.delete(token);
            throw new IllegalStateException("Refresh token expired or revoked. Please login again.");
        }
        return token;
    }

    public RefreshToken findByToken(String token) {
        return repo.findByToken(token)
            .orElseThrow(() -> new ResourceNotFoundException("Refresh token not found"));
    }

    @Transactional
    public void revokeByUser(User user) { repo.deleteByUser(user); }
}
