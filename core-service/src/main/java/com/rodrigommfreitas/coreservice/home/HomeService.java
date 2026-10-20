package com.rodrigommfreitas.coreservice.home;

import com.rodrigommfreitas.coreservice.audit.Audit;
import com.rodrigommfreitas.coreservice.audit.AuditRepository;
import com.rodrigommfreitas.coreservice.audit.AuditStatus;
import com.rodrigommfreitas.coreservice.department.Department;
import com.rodrigommfreitas.coreservice.department.UserDepartment;
import com.rodrigommfreitas.coreservice.department.UserDepartmentRepository;
import com.rodrigommfreitas.coreservice.home.dto.HomeResponse;
import com.rodrigommfreitas.coreservice.home.dto.HomeResponse.HomeItem;
import com.rodrigommfreitas.coreservice.improvementopportunity.*;
import com.rodrigommfreitas.coreservice.indicator.IndicatorFrequency;
import com.rodrigommfreitas.coreservice.indicator.IndicatorYear;
import com.rodrigommfreitas.coreservice.indicator.IndicatorYearRepository;
import com.rodrigommfreitas.coreservice.log.ActionType;
import com.rodrigommfreitas.coreservice.log.EntityType;
import com.rodrigommfreitas.coreservice.log.Log;
import com.rodrigommfreitas.coreservice.log.LogRepository;
import com.rodrigommfreitas.coreservice.managementreview.ManagementReviewService;
import com.rodrigommfreitas.coreservice.measurement.Measurement;
import com.rodrigommfreitas.coreservice.nonconformity.*;
import com.rodrigommfreitas.coreservice.qualityobjective.ObjectiveAction;
import com.rodrigommfreitas.coreservice.qualityobjective.QualityObjectiveYear;
import com.rodrigommfreitas.coreservice.qualityobjective.QualityObjectiveYearRepository;
import com.rodrigommfreitas.coreservice.resources.human.HumanResource;
import com.rodrigommfreitas.coreservice.riskopportunity.ActionStatus;
import com.rodrigommfreitas.coreservice.riskopportunity.RiskAction;
import com.rodrigommfreitas.coreservice.riskopportunity.RiskOpportunityYear;
import com.rodrigommfreitas.coreservice.riskopportunity.RiskOpportunityYearRepository;
import com.rodrigommfreitas.coreservice.security.CallerRoles;
import com.rodrigommfreitas.coreservice.security.UserContextHolder;
import com.rodrigommfreitas.coreservice.user.User;
import com.rodrigommfreitas.coreservice.user.UserRepository;
import com.rodrigommfreitas.coreservice.year.Year;
import com.rodrigommfreitas.coreservice.year.YearRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.function.Predicate;

/**
 * Página "Início": o que cada perfil precisa de ver ao entrar na plataforma.
 * <ul>
 *   <li>Gestor (superadmin): visão do ciclo, pontos de atenção de todo o sistema, o seu trabalho,
 *       medições em falta, auditorias próximas e atividade recente.</li>
 *   <li>Gestor de departamento: o mesmo, filtrado pelos seus departamentos (sem atividade recente).</li>
 *   <li>Auditor / externo: visão do ciclo e auditorias próximas (só leitura).</li>
 *   <li>Utilizador: o seu trabalho e as medições em falta dos indicadores de que é responsável.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class HomeService {

    static final String MANAGER = "MANAGER";
    static final String DEPARTMENT_MANAGER = "DEPARTMENT_MANAGER";
    static final String AUDITOR = "AUDITOR";
    static final String USER = "USER";

    /** Uma NC/OM aberta há mais do que isto (desde a data de início) passa a ponto de atenção. */
    static final int STALE_DAYS = 90;
    /** Janela das "auditorias próximas". */
    static final int UPCOMING_AUDIT_DAYS = 60;
    static final int MAX_ITEMS = 8;

    private static final Set<AuditStatus> PLANNED_AUDIT =
            EnumSet.of(AuditStatus.PLANNED, AuditStatus.PLANNED_NOT_CONFIRMED, AuditStatus.PLANNED_CONFIRMED);

    private final ManagementReviewService managementReviewService;
    private final YearRepository yearRepository;
    private final UserRepository userRepository;
    private final UserDepartmentRepository userDepartmentRepository;
    private final NonConformityYearRepository nonConformityYearRepository;
    private final ImprovementOpportunityYearRepository improvementOpportunityYearRepository;
    private final RiskOpportunityYearRepository riskOpportunityYearRepository;
    private final QualityObjectiveYearRepository qualityObjectiveYearRepository;
    private final IndicatorYearRepository indicatorYearRepository;
    private final AuditRepository auditRepository;
    private final LogRepository logRepository;

    @Transactional(readOnly = true)
    public HomeResponse get(Long yearId) {
        Year year = yearRepository.findById(yearId)
                .orElseThrow(() -> new EntityNotFoundException("Year not found with id " + yearId));
        Long userId = UserContextHolder.getUserId();
        User me = userId != null ? userRepository.findById(userId).orElse(null) : null;
        String profile = resolveProfile();
        LocalDate today = LocalDate.now();

        List<Department> myDepartments = userId == null ? List.of()
                : userDepartmentRepository.findByUserId(userId).stream().map(UserDepartment::getDepartment).toList();
        Set<Long> myDepartmentIds = new HashSet<>();
        myDepartments.forEach(d -> myDepartmentIds.add(d.getId()));

        List<NonConformityYear> ncs = nonConformityYearRepository.findAllByYearId(yearId);
        List<ImprovementOpportunityYear> ios = improvementOpportunityYearRepository.findAllByYearId(yearId);
        List<RiskOpportunityYear> ros = riskOpportunityYearRepository.findByYearId(yearId);
        List<QualityObjectiveYear> qos = qualityObjectiveYearRepository.findByYearId(yearId);
        List<IndicatorYear> indicators = indicatorYearRepository.findByYearId(yearId);
        List<Audit> audits = auditRepository.findByYearId(yearId);

        // Âmbito por perfil: o gestor vê tudo, o gestor de departamento só os seus departamentos.
        Predicate<Department> inScope = MANAGER.equals(profile)
                ? d -> true
                : d -> d != null && myDepartmentIds.contains(d.getId());

        boolean seesSystem = MANAGER.equals(profile) || DEPARTMENT_MANAGER.equals(profile);

        HomeResponse.Cycle cycle = null;
        if (!USER.equals(profile)) {
            var o = managementReviewService.getSummary(yearId).overview();
            cycle = new HomeResponse.Cycle(o.processes(), o.objectives(), o.objectivesAchieved(),
                    o.indicators(), o.indicatorsWithMeasurements(), o.nonConformitiesOpen());
        }

        List<HomeItem> attention = seesSystem
                ? attention(profile, ncs, ios, qos, indicators, inScope, today)
                : null;

        List<HomeItem> myWork = myWork(userId, ncs, ios, ros, qos, audits, today);

        List<HomeItem> missing = null;
        if (!AUDITOR.equals(profile)) {
            Predicate<IndicatorYear> mine = switch (profile) {
                case MANAGER -> iy -> true;
                case DEPARTMENT_MANAGER -> iy -> responsibleHr(iy) != null && inScope.test(responsibleHr(iy).getDepartment());
                default -> iy -> me != null && responsibleHr(iy) != null
                        && sameName(responsibleHr(iy).getName(), fullName(me));
            };
            missing = missingMeasurements(indicators.stream().filter(mine).toList(), year.getYear(), today);
        }

        List<HomeItem> upcoming = USER.equals(profile) ? null
                : audits.stream()
                .filter(a -> a.getStatus() != null && PLANNED_AUDIT.contains(a.getStatus()))
                .filter(a -> a.getPlannedDate() != null
                        && !a.getPlannedDate().isBefore(today)
                        && !a.getPlannedDate().isAfter(today.plusDays(UPCOMING_AUDIT_DAYS)))
                .filter(a -> !DEPARTMENT_MANAGER.equals(profile) || inScope.test(a.getDepartment()))
                .sorted(Comparator.comparing(Audit::getPlannedDate))
                .limit(MAX_ITEMS)
                .map(a -> new HomeItem(a.getName(), departmentName(a.getDepartment()),
                        a.getStatus() == AuditStatus.PLANNED_CONFIRMED ? "Confirmada" : null,
                        "neutral", a.getPlannedDate(), "/auditorias"))
                .toList();

        List<HomeItem> activity = MANAGER.equals(profile) ? recentActivity(yearId) : null;

        return new HomeResponse(
                profile,
                me != null ? fullName(me) : "",
                myDepartments.stream().map(Department::getName).filter(Objects::nonNull).sorted().toList(),
                cycle, attention, myWork, missing, upcoming, activity
        );
    }

    // ------------------------------------------------------------------------------------------
    // Perfil
    // ------------------------------------------------------------------------------------------

    private String resolveProfile() {
        if (CallerRoles.isSuperAdmin()) return MANAGER;
        if (CallerRoles.has("ROLE_DEPARTMENT_MANAGER")) return DEPARTMENT_MANAGER;
        if (CallerRoles.isExternal() || CallerRoles.has("ROLE_AUDITOR")) return AUDITOR;
        return USER;
    }

    // ------------------------------------------------------------------------------------------
    // Pontos de atenção
    // ------------------------------------------------------------------------------------------

    private List<HomeItem> attention(String profile,
                                     List<NonConformityYear> ncs,
                                     List<ImprovementOpportunityYear> ios,
                                     List<QualityObjectiveYear> qos,
                                     List<IndicatorYear> indicators,
                                     Predicate<Department> inScope,
                                     LocalDate today) {
        List<HomeItem> items = new ArrayList<>();

        for (NonConformityYear ncy : ncs) {
            NonConformity nc = ncy.getNonConformity();
            if (!isOpen(ncy.getStatus()) || !inScope.test(nc.getDepartment())) continue;
            HomeItem item = staleOrLate("NC · " + nc.getName(), departmentName(nc.getDepartment()),
                    nc.getStartDate(), nc.getExpectedEndDate(), today, "/non-conformities");
            if (item != null) items.add(item);
        }

        for (ImprovementOpportunityYear ioy : ios) {
            ImprovementOpportunity io = ioy.getImprovementOpportunity();
            if (!isOpen(ioy.getStatus()) || !inScope.test(io.getDepartment())) continue;
            HomeItem item = staleOrLate("OM · " + io.getName(), departmentName(io.getDepartment()),
                    io.getStartDate(), io.getExpectedEndDate(), today, "/oportunidades-melhoria");
            if (item != null) items.add(item);
        }

        // As ações dos objetivos não têm departamento: só entram na vista do gestor.
        if (MANAGER.equals(profile)) {
            for (QualityObjectiveYear qoy : qos) {
                for (ObjectiveAction action : qoy.getActions()) {
                    if (isOverdue(action, today)) {
                        items.add(new HomeItem(action.getActionText(),
                                "Objetivo · " + qoy.getQualityObjective().getObjectiveTitle(),
                                "Atrasada", "danger", action.getEndDate(), "/objetivos-sg"));
                    }
                }
            }
        }

        for (IndicatorYear iy : indicators) {
            if (!iy.getMeasurements().isEmpty()) continue;
            HumanResource hr = responsibleHr(iy);
            if (!MANAGER.equals(profile) && (hr == null || !inScope.test(hr.getDepartment()))) continue;
            items.add(new HomeItem(iy.getIndicator().getName(),
                    hr != null ? "Responsável · " + hr.getName() : "Sem responsável",
                    "Sem medições", "warning", null, "/indicadores"));
        }

        return items.stream()
                .sorted(Comparator.comparing((HomeItem i) -> "danger".equals(i.tone()) ? 0 : 1)
                        .thenComparing(HomeItem::date, Comparator.nullsLast(Comparator.naturalOrder())))
                .limit(MAX_ITEMS)
                .toList();
    }

    /** NC/OM aberta com prazo ultrapassado (danger) ou aberta há mais de STALE_DAYS (warning). */
    private HomeItem staleOrLate(String title, String context, LocalDate start, LocalDate expectedEnd,
                                 LocalDate today, String link) {
        if (expectedEnd != null && expectedEnd.isBefore(today)) {
            return new HomeItem(title, context, "Prazo ultrapassado", "danger", expectedEnd, link);
        }
        if (start != null && ChronoUnit.DAYS.between(start, today) > STALE_DAYS) {
            return new HomeItem(title, context, "Aberta há " + ChronoUnit.DAYS.between(start, today) + " dias",
                    "warning", start, link);
        }
        return null;
    }

    // ------------------------------------------------------------------------------------------
    // O meu trabalho
    // ------------------------------------------------------------------------------------------

    private List<HomeItem> myWork(Long userId,
                                  List<NonConformityYear> ncs,
                                  List<ImprovementOpportunityYear> ios,
                                  List<RiskOpportunityYear> ros,
                                  List<QualityObjectiveYear> qos,
                                  List<Audit> audits,
                                  LocalDate today) {
        if (userId == null) return List.of();
        List<HomeItem> items = new ArrayList<>();

        for (NonConformityYear ncy : ncs) {
            NonConformity nc = ncy.getNonConformity();
            if (isOpen(ncy.getStatus()) && isMe(nc.getResponsible(), userId)) {
                items.add(deadlineItem("NC · " + nc.getName(), "Responsável pela não conformidade",
                        nc.getExpectedEndDate(), today, "/non-conformities"));
            }
            for (CorrectiveAction a : nc.getCorrectiveActions()) {
                if (a.getStatus() != CorrectiveActionStatus.FINISHED && isMe(a.getResponsible(), userId)) {
                    items.add(deadlineItem(a.getName(), "Ação corretiva · " + nc.getName(),
                            nc.getExpectedEndDate(), today, "/non-conformities"));
                }
            }
        }

        for (ImprovementOpportunityYear ioy : ios) {
            ImprovementOpportunity io = ioy.getImprovementOpportunity();
            if (isOpen(ioy.getStatus()) && isMe(io.getResponsible(), userId)) {
                items.add(deadlineItem("OM · " + io.getName(), "Responsável pela oportunidade de melhoria",
                        io.getExpectedEndDate(), today, "/oportunidades-melhoria"));
            }
            for (ImprovementAction a : io.getImprovementActions()) {
                if (a.getStatus() != ImprovementActionStatus.FINISHED && isMe(a.getResponsible(), userId)) {
                    items.add(deadlineItem(a.getName(), "Ação de melhoria · " + io.getName(),
                            io.getExpectedEndDate(), today, "/oportunidades-melhoria"));
                }
            }
        }

        for (RiskOpportunityYear roy : ros) {
            for (RiskAction a : roy.getActions()) {
                if (a.getStatus() != ActionStatus.CLOSED && isMe(a.getResponsible(), userId)) {
                    items.add(new HomeItem(a.getTitle(), "Risco · " + roy.getRiskOpportunity().getDescription(),
                            null, "neutral", null, "/riscos-oportunidades"));
                }
            }
        }

        for (QualityObjectiveYear qoy : qos) {
            for (ObjectiveAction a : qoy.getActions()) {
                if (a.getCompletedDate() == null && userId.equals(a.getResponsibleId())) {
                    items.add(deadlineItem(a.getActionText(), "Objetivo · " + qoy.getQualityObjective().getObjectiveTitle(),
                            a.getEndDate(), today, "/objetivos-sg"));
                }
            }
        }

        for (Audit a : audits) {
            if (a.getStatus() != null && PLANNED_AUDIT.contains(a.getStatus()) && isMe(a.getResponsible(), userId)) {
                items.add(new HomeItem(a.getName(), "Auditoria · " + departmentName(a.getDepartment()),
                        null, "neutral", a.getPlannedDate(), "/auditorias"));
            }
        }

        return items.stream()
                .sorted(Comparator.comparing((HomeItem i) -> "danger".equals(i.tone()) ? 0 : 1)
                        .thenComparing(HomeItem::date, Comparator.nullsLast(Comparator.naturalOrder())))
                .limit(MAX_ITEMS)
                .toList();
    }

    private HomeItem deadlineItem(String title, String context, LocalDate due, LocalDate today, String link) {
        boolean late = due != null && due.isBefore(today);
        return new HomeItem(title, context, late ? "Atrasada" : null, late ? "danger" : "neutral", due, link);
    }

    // ------------------------------------------------------------------------------------------
    // Medições em falta
    // ------------------------------------------------------------------------------------------

    /**
     * Um indicador tem a medição em falta quando não há nenhuma medição no último período
     * já terminado (segundo a periodicidade) dentro do ano selecionado. Para um ano já
     * terminado, o último período é o último do ano; num ano ainda por começar não há nada em falta.
     */
    private List<HomeItem> missingMeasurements(List<IndicatorYear> indicators, int yearValue, LocalDate today) {
        LocalDate reference = today.getYear() > yearValue ? LocalDate.of(yearValue + 1, 1, 1) : today;
        List<HomeItem> items = new ArrayList<>();

        for (IndicatorYear iy : indicators) {
            IndicatorFrequency frequency = iy.getIndicator().getFrequency();
            if (frequency == null) continue;
            LocalDate[] period = lastClosedPeriod(frequency, reference);
            if (period[0].getYear() != yearValue) continue;

            boolean measured = iy.getMeasurements().stream()
                    .map(Measurement::getMeasurementDate)
                    .filter(Objects::nonNull)
                    .anyMatch(d -> !d.isBefore(period[0]) && !d.isAfter(period[1]));
            if (measured) continue;

            HumanResource hr = responsibleHr(iy);
            items.add(new HomeItem(iy.getIndicator().getName(),
                    periodLabel(frequency, period[0]) + (hr != null ? " · " + hr.getName() : ""),
                    "Registar", "accent", period[1], "/indicadores"));
        }

        return items.stream()
                .sorted(Comparator.comparing(HomeItem::date))
                .limit(MAX_ITEMS)
                .toList();
    }

    /** [início, fim] do período imediatamente anterior ao que contém a data de referência. */
    static LocalDate[] lastClosedPeriod(IndicatorFrequency frequency, LocalDate reference) {
        return switch (frequency) {
            case WEEKLY -> {
                LocalDate start = reference.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).minusWeeks(1);
                yield new LocalDate[]{start, start.plusDays(6)};
            }
            case MONTHLY -> {
                LocalDate start = reference.withDayOfMonth(1).minusMonths(1);
                yield new LocalDate[]{start, start.with(TemporalAdjusters.lastDayOfMonth())};
            }
            case TRIMESTER -> {
                int firstMonth = ((reference.getMonthValue() - 1) / 3) * 3 + 1;
                LocalDate start = LocalDate.of(reference.getYear(), firstMonth, 1).minusMonths(3);
                yield new LocalDate[]{start, start.plusMonths(3).minusDays(1)};
            }
            case SEMESTER -> {
                int firstMonth = reference.getMonthValue() <= 6 ? 1 : 7;
                LocalDate start = LocalDate.of(reference.getYear(), firstMonth, 1).minusMonths(6);
                yield new LocalDate[]{start, start.plusMonths(6).minusDays(1)};
            }
            case ANNUAL -> {
                LocalDate start = LocalDate.of(reference.getYear() - 1, 1, 1);
                yield new LocalDate[]{start, LocalDate.of(reference.getYear() - 1, 12, 31)};
            }
        };
    }

    private static String periodLabel(IndicatorFrequency frequency, LocalDate start) {
        return switch (frequency) {
            case WEEKLY -> "Semana de " + start.getDayOfMonth() + "/" + start.getMonthValue();
            case MONTHLY -> "Mês " + start.getMonthValue() + "/" + start.getYear();
            case TRIMESTER -> ((start.getMonthValue() - 1) / 3 + 1) + ".º trimestre";
            case SEMESTER -> (start.getMonthValue() <= 6 ? "1.º" : "2.º") + " semestre";
            case ANNUAL -> "Ano " + start.getYear();
        };
    }

    // ------------------------------------------------------------------------------------------
    // Atividade recente
    // ------------------------------------------------------------------------------------------

    private List<HomeItem> recentActivity(Long yearId) {
        var page = logRepository.findByYearId(yearId,
                PageRequest.of(0, 6, Sort.by(Sort.Direction.DESC, "timestamp")));
        return page.getContent().stream()
                .map(log -> new HomeItem(
                        (log.getUser() != null ? fullName(log.getUser()) : "Sistema") + " " + actionVerb(log.getAction()),
                        log.getEntityName(),
                        null, "neutral",
                        log.getTimestamp() != null ? log.getTimestamp().toLocalDate() : null,
                        linkFor(log.getEntityType())))
                .toList();
    }

    private static String actionVerb(ActionType action) {
        if (action == null) return "alterou";
        return switch (action) {
            case CREATED -> "criou";
            case UPDATED -> "atualizou";
            case DELETED -> "apagou";
            case ASSOCIATED -> "associou";
            case DISASSOCIATED -> "desassociou";
        };
    }

    private static String linkFor(EntityType type) {
        if (type == null) return null;
        return switch (type) {
            case MACRO_PROCESS, PROCESS -> "/processos";
            case INDICATOR, MEASUREMENT -> "/indicadores";
            case NON_CONFORMITY, CORRECTIVE_ACTION -> "/non-conformities";
            case IMPROVEMENT_OPPORTUNITY, IMPROVEMENT_ACTION -> "/oportunidades-melhoria";
            case RISK_OPPORTUNITY, RISK_ACTION -> "/riscos-oportunidades";
            case QUALITY_OBJECTIVE -> "/objetivos-sg";
            case AUDIT -> "/auditorias";
            case MANAGEMENT_REVIEW, MANAGEMENT_REVIEW_MEETING -> "/revisao-gestao";
            case SUPPLIER, SUPPLIER_REVIEW -> "/fornecedores-externos";
            case CHANGE -> "/alteracoes";
            case INTERESTED_PARTY -> "/partes-interessadas";
            case SWOT_ANALYSIS, SWOT_ITEM -> "/analise-swot";
            case CUSTOMER_SATISFACTION -> "/satisfacao-estudantes";
            default -> null;
        };
    }

    // ------------------------------------------------------------------------------------------
    // Auxiliares
    // ------------------------------------------------------------------------------------------

    /** Uma ação de objetivo está atrasada se a data prevista já passou e não foi concluída. */
    static boolean isOverdue(ObjectiveAction action, LocalDate today) {
        return action.getEndDate() != null && action.getCompletedDate() == null && action.getEndDate().isBefore(today);
    }

    private static boolean isOpen(NonConformityStatus status) {
        return status == NonConformityStatus.OPEN || status == NonConformityStatus.UNDER_TREATMENT;
    }

    private static boolean isOpen(ImprovementOpportunityStatus status) {
        return status == ImprovementOpportunityStatus.OPEN || status == ImprovementOpportunityStatus.UNDER_TREATMENT;
    }

    private static boolean isMe(User user, Long userId) {
        return user != null && userId.equals(user.getId());
    }

    private static HumanResource responsibleHr(IndicatorYear iy) {
        return iy.getResponsible() != null ? iy.getResponsible().getHumanResource() : null;
    }

    private static String departmentName(Department department) {
        return department != null && department.getName() != null ? department.getName() : "Sem departamento";
    }

    private static String fullName(User user) {
        String first = user.getFirstName() != null ? user.getFirstName() : "";
        String last = user.getLastName() != null ? user.getLastName() : "";
        return (first + " " + last).trim();
    }

    /**
     * Os recursos humanos não estão ligados a contas de utilizador: o responsável de um
     * indicador só é reconhecido como "eu" quando o nome coincide (sem acentos nem maiúsculas).
     */
    static boolean sameName(String a, String b) {
        return a != null && b != null && !b.isBlank() && normalize(a).equals(normalize(b));
    }

    private static String normalize(String s) {
        return Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .trim()
                .replaceAll("\\s+", " ")
                .toLowerCase(Locale.ROOT);
    }
}
