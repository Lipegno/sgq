package com.rodrigommfreitas.coreservice.config;

import com.rodrigommfreitas.coreservice.security.YearAccessInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final YearAccessInterceptor yearAccessInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(yearAccessInterceptor)
                .addPathPatterns("/api/**");
    }
}