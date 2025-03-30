package com.example.demo;

import org.springframework.stereotype.Service;

@Service
public class ReportService {

    private final UserService userService;
    private final AnalyticsService analyticsService;

    public ReportService(UserService userService, AnalyticsService analyticsService) {
        this.userService = userService;
        this.analyticsService = analyticsService;
    }

    public String generateUserReport(Long userId) {
        User user = userService.getUser(userId);
        String analytics = analyticsService.getUserAnalytics(userId);
        return String.format("Report for %s: %s", user.getName(), analytics);
    }
}

@Service
class AnalyticsService {
    public String getUserAnalytics(Long userId) {
        return "Sample analytics data";
    }
}