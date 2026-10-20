package com.rodrigommfreitas.coreservice.home;

import com.rodrigommfreitas.coreservice.indicator.IndicatorFrequency;
import com.rodrigommfreitas.coreservice.qualityobjective.ObjectiveAction;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class HomeServiceTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 10, 20);

    @Test
    void lastClosedPeriodIsThePeriodBeforeTheReference() {
        assertArrayEquals(new LocalDate[]{LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30)},
                HomeService.lastClosedPeriod(IndicatorFrequency.MONTHLY, TODAY));
        assertArrayEquals(new LocalDate[]{LocalDate.of(2026, 7, 1), LocalDate.of(2026, 9, 30)},
                HomeService.lastClosedPeriod(IndicatorFrequency.TRIMESTER, TODAY));
        assertArrayEquals(new LocalDate[]{LocalDate.of(2026, 1, 1), LocalDate.of(2026, 6, 30)},
                HomeService.lastClosedPeriod(IndicatorFrequency.SEMESTER, TODAY));
        assertArrayEquals(new LocalDate[]{LocalDate.of(2026, 10, 12), LocalDate.of(2026, 10, 18)},
                HomeService.lastClosedPeriod(IndicatorFrequency.WEEKLY, TODAY));
        assertArrayEquals(new LocalDate[]{LocalDate.of(2025, 1, 1), LocalDate.of(2025, 12, 31)},
                HomeService.lastClosedPeriod(IndicatorFrequency.ANNUAL, TODAY));
    }

    @Test
    void forAFinishedYearTheLastPeriodIsTheLastOfThatYear() {
        LocalDate reference = LocalDate.of(2026, 1, 1);
        assertArrayEquals(new LocalDate[]{LocalDate.of(2025, 10, 1), LocalDate.of(2025, 12, 31)},
                HomeService.lastClosedPeriod(IndicatorFrequency.TRIMESTER, reference));
        assertArrayEquals(new LocalDate[]{LocalDate.of(2025, 1, 1), LocalDate.of(2025, 12, 31)},
                HomeService.lastClosedPeriod(IndicatorFrequency.ANNUAL, reference));
    }

    @Test
    void objectiveActionIsOverdueOnlyWhenPlannedDatePassedAndNotCompleted() {
        ObjectiveAction late = action(LocalDate.of(2026, 9, 30), null);
        ObjectiveAction done = action(LocalDate.of(2026, 9, 30), LocalDate.of(2026, 10, 2));
        ObjectiveAction onTime = action(LocalDate.of(2026, 12, 31), null);
        ObjectiveAction noDate = action(null, null);

        assertTrue(HomeService.isOverdue(late, TODAY));
        assertFalse(HomeService.isOverdue(done, TODAY));
        assertFalse(HomeService.isOverdue(onTime, TODAY));
        assertFalse(HomeService.isOverdue(noDate, TODAY));
    }

    @Test
    void responsibleNamesMatchIgnoringAccentsCaseAndSpacing() {
        assertTrue(HomeService.sameName("João  Gonçalves", "joao goncalves"));
        assertFalse(HomeService.sameName("João Gonçalves", "João Silva"));
        assertFalse(HomeService.sameName("João Gonçalves", " "));
    }

    private static ObjectiveAction action(LocalDate end, LocalDate completed) {
        ObjectiveAction a = new ObjectiveAction();
        a.setEndDate(end);
        a.setCompletedDate(completed);
        return a;
    }
}
