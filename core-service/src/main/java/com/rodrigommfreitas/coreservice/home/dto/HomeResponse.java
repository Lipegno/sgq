package com.rodrigommfreitas.coreservice.home.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Página "Início": blocos calculados para o utilizador autenticado, de acordo com o seu perfil.
 * Um bloco a null significa que não se aplica a este perfil (o cliente não o mostra);
 * uma lista vazia significa que se aplica mas não há nada a mostrar.
 */
public record HomeResponse(
        /** MANAGER | DEPARTMENT_MANAGER | AUDITOR | USER */
        String profile,
        String userName,
        List<String> departments,
        Cycle cycle,
        List<HomeItem> attention,
        List<HomeItem> myWork,
        List<HomeItem> missingMeasurements,
        List<HomeItem> upcomingAudits,
        List<HomeItem> recentActivity
) {

    /** Resumo do ciclo do ano (reaproveita a visão geral da Revisão pela Gestão). */
    public record Cycle(
            int processes,
            int objectives,
            int objectivesAchieved,
            int indicators,
            int indicatorsWithMeasurements,
            int nonConformitiesOpen
    ) {}

    /**
     * Linha de um bloco.
     * tone: danger | warning | accent | neutral (cor do badge).
     * link: rota do cliente para o módulo de origem.
     */
    public record HomeItem(
            String title,
            String context,
            String badge,
            String tone,
            LocalDate date,
            String link
    ) {}
}
