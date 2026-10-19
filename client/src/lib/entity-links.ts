/**
 * Ligações entre registos de páginas diferentes (ex.: indicador → processo).
 *
 * Cada link leva à página do registo com o ano certo e pede-lhe para o abrir:
 *   /processos?ano=3&abrir=17
 * O ano é obrigatório porque os registos são por ano — sem ele o registo nem
 * apareceria na lista. O id é o do registo *nesse ano* (processYearId,
 * indicatorYearId, …), que é o que as respostas da API já trazem.
 */
export type LinkableEntity =
  | "process"
  | "indicator"
  | "risk"
  | "objective"
  | "interestedParty"
  | "nonConformity"
  | "audit"
  | "improvementOpportunity"
  | "person";

const ROUTES: Record<LinkableEntity, string> = {
  process: "/processos",
  indicator: "/indicadores",
  risk: "/riscos-oportunidades",
  objective: "/objetivos-sg",
  interestedParty: "/partes-interessadas",
  nonConformity: "/non-conformities",
  audit: "/auditorias",
  improvementOpportunity: "/oportunidades-melhoria",
  person: "/recursos",
};

export function entityPath(entity: LinkableEntity, id: number, yearId: number): string {
  return `${ROUTES[entity]}?ano=${yearId}&abrir=${id}`;
}
