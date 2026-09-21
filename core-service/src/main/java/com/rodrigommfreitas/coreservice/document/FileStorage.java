package com.rodrigommfreitas.coreservice.document;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Component
public class FileStorage {

    private static final Logger log = LoggerFactory.getLogger(FileStorage.class);

    private final Path baseDir;

    public FileStorage(@Value("${app.storage.dir:files}") String dir) {
        this.baseDir = Paths.get(dir).toAbsolutePath().normalize();
        log.info("Document storage directory: {}", baseDir);
    }

    public void save(String fileName, byte[] content) throws IOException {
        Files.createDirectories(baseDir);
        Files.write(resolve(fileName), content);
    }

    public Path resolve(String fileName) {
        Path path = baseDir.resolve(fileName).normalize();
        if (!path.startsWith(baseDir)) {
            throw new IllegalArgumentException("Invalid file name");
        }
        return path;
    }

    public void deleteAfterCommit(List<String> fileNames) {
        if (fileNames.isEmpty()) return;
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    fileNames.forEach(FileStorage.this::deleteQuietly);
                }
            });
        } else {
            fileNames.forEach(this::deleteQuietly);
        }
    }

    private void deleteQuietly(String fileName) {
        if (fileName == null) return;
        try {
            Files.deleteIfExists(resolve(fileName));
        } catch (IOException | IllegalArgumentException e) {
            log.warn("Could not delete stored file {}: {}", fileName, e.getMessage());
        }
    }
}
