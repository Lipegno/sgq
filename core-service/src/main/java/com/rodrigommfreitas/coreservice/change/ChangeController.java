package com.rodrigommfreitas.coreservice.change;

import com.rodrigommfreitas.coreservice.change.dto.ChangeRequest;
import com.rodrigommfreitas.coreservice.change.dto.ChangeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/changes")
@RequiredArgsConstructor
public class ChangeController {

    private final ChangeService changeService;

    @PostMapping
    public ChangeResponse create(@RequestBody ChangeRequest request) {
        return changeService.create(request);
    }

    @PutMapping("/{id}")
    public ChangeResponse update(@PathVariable Long id,
                                 @RequestBody ChangeRequest request) {
        return changeService.update(id, request);
    }

    @PatchMapping("/{id}")
    public ChangeResponse patch(@PathVariable Long id,
                                @RequestBody ChangeRequest request) {
        return changeService.patch(id, request);
    }

    @GetMapping
    public List<ChangeResponse> getAll() {
        return changeService.getAll();
    }

    @GetMapping("/year/{year}")
    public List<ChangeResponse> getByYear(@PathVariable int year) {
        return changeService.getByYear(year);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        changeService.delete(id);
    }
}