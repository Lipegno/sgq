package com.rodrigommfreitas.coreservice.document;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class VersionComparatorTest {

    @Test
    void numericVersionsAreComparedByValue() {
        assertTrue(VersionComparator.compare("2", "1") > 0);
        assertTrue(VersionComparator.compare("10", "9") > 0);
        assertTrue(VersionComparator.compare("1.10", "1.9") > 0);
        assertTrue(VersionComparator.compare("1", "1.1") < 0);
    }

    @Test
    void letterRevisionsFollowAlphabeticOrderIgnoringCase() {
        assertTrue(VersionComparator.compare("B", "A") > 0);
        assertTrue(VersionComparator.compare("a", "B") < 0);
    }

    @Test
    void equalVersionsAreEqual() {
        assertEquals(0, VersionComparator.compare("B", "b"));
        assertEquals(0, VersionComparator.compare("1.0", "1.0"));
    }

    @Test
    void nullOrBlankIsLowerThanAnyVersion() {
        assertTrue(VersionComparator.compare("1", null) > 0);
        assertTrue(VersionComparator.compare("", "A") < 0);
    }
}
