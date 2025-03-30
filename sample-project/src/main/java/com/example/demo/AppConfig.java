package com.example.demo;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppConfig {
    
    @Bean 
    public ExampleService exampleService() {
        return new ExampleService();
    }
}

class ExampleService {
    // Example dependency
    private final UserRepository userRepository;
    
    public ExampleService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}