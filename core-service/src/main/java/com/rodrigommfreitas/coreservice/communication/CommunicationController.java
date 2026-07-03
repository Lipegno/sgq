package com.rodrigommfreitas.coreservice.communication;

import com.rodrigommfreitas.coreservice.communication.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/communication")
@RequiredArgsConstructor
public class CommunicationController {

    private final CommunicationService service;

    @GetMapping("/year/{yearId}")
    public CommunicationResponse getByYear(@PathVariable Long yearId) {
        return service.getByYear(yearId);
    }

    @PatchMapping
    public void update(@RequestBody UpdateCommunicationRequest request) {
        service.update(request);
    }

    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)
    public void addItem(@RequestBody CreateCommunicationItemRequest request) {
        service.addItem(request);
    }

    @PatchMapping("/items/{itemId}")
    public void updateItem(
            @PathVariable Long itemId,
            @RequestBody UpdateCommunicationItemRequest request
    ) {
        service.updateItem(itemId, request);
    }

    @DeleteMapping("/items/{itemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteItem(@PathVariable Long itemId) {
        service.deleteItem(itemId);
    }

    @PostMapping("/items/{itemId}/years/{yearId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void associateYear(
            @PathVariable Long itemId,
            @PathVariable Long yearId
    ) {
        service.associateYear(itemId, yearId);
    }

    @DeleteMapping("/items/{itemId}/years/{yearId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void disassociateYear(
            @PathVariable Long itemId,
            @PathVariable Long yearId
    ) {
        service.disassociateYear(itemId, yearId);
    }
}
