package com.rodrigommfreitas.coreservice.log.utils;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;


import java.util.*;

@Component
@RequiredArgsConstructor
public class LogDetailsBuilder {

    private final ObjectMapper objectMapper;

    public JsonNode buildCreated(Map<String, Object> fields) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("type", "CREATED");
        node.set("fields", objectMapper.valueToTree(fields));
        return node;
    }


    public JsonNode buildUpdated(Map<String, Object> oldFields, Map<String, Object> newFields) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("type", "EDITED");
        ObjectNode fieldsNode = objectMapper.createObjectNode();

        for (String key : oldFields.keySet()) {
            Object oldValue = oldFields.get(key);
            Object newValue = newFields.get(key);
            if (!Objects.equals(oldValue, newValue)) {
                ObjectNode changeNode = objectMapper.createObjectNode();
                changeNode.putPOJO("old", oldValue);
                changeNode.putPOJO("new", newValue);
                fieldsNode.set(key, changeNode);
            }
        }

        if (fieldsNode.isEmpty()) {
            return buildCreated(oldFields);
        }

        node.set("fields", fieldsNode);
        return node;
    }

    public JsonNode buildAssociation(String relationType, String relatedEntityName, String action) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("type", action); // "ASSOCIATED" or "DISASSOCIATED"
        ObjectNode fieldsNode = objectMapper.createObjectNode();
        fieldsNode.put("relation", relationType);
        fieldsNode.put("target", relatedEntityName);
        node.set("fields", fieldsNode);
        return node;
    }

    public JsonNode buildDeleted(Map<String, Object> fields) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("type", "DELETED");
        node.set("fields", objectMapper.valueToTree(fields));
        return node;
    }
}