package com.rodrigommfreitas.coreservice.year;

import com.rodrigommfreitas.coreservice.document.Document;
import com.rodrigommfreitas.coreservice.document.DocumentRepository;
import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;
import com.rodrigommfreitas.coreservice.process.dto.DocumentSummary;
import com.rodrigommfreitas.coreservice.year.dto.CreateYearRequest;
import com.rodrigommfreitas.coreservice.year.dto.MacroProcessDiagramResponse;
import com.rodrigommfreitas.coreservice.year.dto.YearResponse;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class YearService {

    private final YearRepository yearRepository;
    private final DocumentRepository documentRepository;
    private final DocumentService documentService;

    /*public YearService(YearRepository yearRepository) {
        this.yearRepository = yearRepository;
    }*/

    public YearService(
            YearRepository yearRepository,
            DocumentRepository documentRepository,
            DocumentService documentService
    ) {
        this.yearRepository = yearRepository;
        this.documentRepository = documentRepository;
        this.documentService = documentService;
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

    @Transactional(readOnly = true)
    public MacroProcessDiagramResponse getMacroProcessDiagram(Long yearId) {

        Year year = yearRepository.findById(yearId)
                .orElseThrow(() -> new EntityNotFoundException("Year not found"));

        return mapMacroProcessDiagram(year);
    }

    private MacroProcessDiagramResponse mapMacroProcessDiagram(Year year) {

        DocumentWithVersionsResponse document = null;

        if (year.getMacroProcessDiagram() != null) {
            document = documentService.getDocumentWithVersions(
                    year.getMacroProcessDiagram().getId()
            );
        }

        return new MacroProcessDiagramResponse(
                year.getId(),
                year.getYear(),
                document
        );
    }

    @Transactional
    public MacroProcessDiagramResponse attachMacroProcessDiagram(
            Long yearId,
            Long documentId
    ) {
        Year year = yearRepository.findById(yearId)
                .orElseThrow(() -> new EntityNotFoundException("Year not found"));

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found"));

        year.setMacroProcessDiagram(document);

        return mapMacroProcessDiagram(year);
    }

    @Transactional
    public void removeMacroProcessDiagram(Long yearId) {

        Year year = yearRepository.findById(yearId)
                .orElseThrow(() -> new EntityNotFoundException("Year not found"));

        year.setMacroProcessDiagram(null);
    }

}