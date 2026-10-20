package com.rodrigommfreitas.coreservice.home;

import com.rodrigommfreitas.coreservice.home.dto.HomeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/home")
@RequiredArgsConstructor
public class HomeController {

    private final HomeService service;

    /** O acesso ao ano (?yearId) é validado pelo YearAccessInterceptor. */
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public HomeResponse get(@RequestParam Long yearId) {
        return service.get(yearId);
    }
}
