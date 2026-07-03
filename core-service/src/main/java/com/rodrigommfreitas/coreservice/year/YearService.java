package com.rodrigommfreitas.coreservice.year;

import com.rodrigommfreitas.coreservice.year.dto.CreateYearRequest;
import com.rodrigommfreitas.coreservice.year.dto.YearResponse;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class YearService {

    private final YearRepository yearRepository;

    public YearService(YearRepository yearRepository) {
        this.yearRepository = yearRepository;
    }

    public YearResponse create(CreateYearRequest request) {

        if (yearRepository.existsByYear(request.year())) {
            throw new IllegalArgumentException("Este ano já existe");
        }

        Year year = new Year();
        year.setYear(request.year());

        Year saved = yearRepository.save(year);

        return new YearResponse(
                saved.getId(),
                saved.getYear()
        );
    }

    public List<YearResponse> getAll() {

        return yearRepository.findAll()
                .stream()
                .map(y -> new YearResponse(
                        y.getId(),
                        y.getYear()
                ))
                .toList();
    }

    public void delete(Long id) {
        if (!yearRepository.existsById(id)) {
            throw new IllegalArgumentException("Ano não encontrado");
        }
        yearRepository.deleteById(id);
    }
}