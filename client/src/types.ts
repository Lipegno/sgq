import React from "react";

export type NonConformityOrigin = "INTERNAL_AUDIT" | "CLIENT" | "EXTERNAL_AUDIT" | "NOT_SPECIFIED";
export type NonConformityStatus = "OPEN" | "UNDER_TREATMENT" | "FINISHED" | "CLASSIFIED";
export type CorrectiveActionStatus = "REGISTERED" | "IN_PROGRESS" | "FINISHED";

export interface MacroProcessDiagramResponse {
  yearId: number;
  year: number;
  document: SingletonDocumentResponse["document"];
}

export interface CorrectiveActionResponse {
  id: number;
  name: string;
  description: string | null;
  responsible: UserSummary | null;
  status: CorrectiveActionStatus;
  progressDescription: string | null;
  documents: DocumentWithVersionsResponse[];
}

export interface NonConformityYearResponse {
  nonConformityYearId: number;
  yearId: number;
  year: number;
  status: NonConformityStatus;
  evaluation: string | null;
  evaluationDescription: string | null;
}

export interface NonConformityResponse {
  id: number;
  name: string;
  description: string | null;
  cause: string | null;
  responsible: UserSummary | null;
  origin: NonConformityOrigin;
  department: DepartmentResponse | null;
  years: NonConformityYearResponse[];
  correctiveActions: CorrectiveActionResponse[];

  whatWillBeDone?: string | null;
  why?: string | null;
  who?: string | null;
  startDate?: string | null;
  expectedEndDate?: string | null;
  where?: string | null;
  how?: string | null;
  howMuch?: string | null;
  effectivenessVerification?: string | null;
  verificationDate?: string | null;
  verificationResponsible?: string | null;
  
}

export interface CreateNonConformityRequest {
  name: string;
  description?: string | null;
  cause?: string | null;
  responsibleId?: number | null;
  departmentId?: number | null;
  origin: NonConformityOrigin;
  yearIds: number[];

  whatWillBeDone?: string | null;
  why?: string | null;
  who?: string | null;
  startDate?: string | null;
  expectedEndDate?: string | null;
  where?: string | null;
  how?: string | null;
  howMuch?: string | null;
  effectivenessVerification?: string | null;
  verificationDate?: string | null;
  verificationResponsible?: string | null;  
}

export interface UpdateNonConformityRequest {
  name?: string;
  description?: string | null;
  cause?: string | null;
  responsibleId?: number | null;
  departmentId?: number | null;
  origin?: NonConformityOrigin;

  whatWillBeDone?: string | null;
  why?: string | null;
  who?: string | null;
  startDate?: string | null;
  expectedEndDate?: string | null;
  where?: string | null;
  how?: string | null;
  howMuch?: string | null;
  effectivenessVerification?: string | null;
  verificationDate?: string | null;
  verificationResponsible?: string | null;
}

export interface UpdateNonConformityYearRequest {
  status?: NonConformityStatus;
  evaluation?: string | null;
  evaluationDescription?: string | null;
}

export interface CreateCorrectiveActionRequest {
  name: string;
  description?: string | null;
  responsibleId?: number | null;
}

export interface UpdateCorrectiveActionRequest {
  name?: string;
  description?: string | null;
  responsibleId?: number | null;
  status?: CorrectiveActionStatus;
  progressDescription?: string | null;
}

export type ImprovementOpportunityOrigin = "SUGGESTION" | "COMPLAINT" | "INTERNAL_AUDIT" | "EXTERNAL_AUDIT" | "MANAGEMENT_REVIEW" | "OTHER";
export type ImprovementOpportunityStatus = "OPEN" | "UNDER_TREATMENT" | "FINISHED" | "CLASSIFIED";
export type ImprovementActionStatus = "REGISTERED" | "IN_PROGRESS" | "FINISHED";

export interface ImprovementActionResponse {
  id: number;
  name: string;
  description: string | null;
  responsible: UserSummary | null;
  status: ImprovementActionStatus;
  progressDescription: string | null;
  documents: DocumentWithVersionsResponse[];
}

export interface ImprovementOpportunityYearResponse {
  improvementOpportunityYearId: number;
  yearId: number;
  year: number;
  status: ImprovementOpportunityStatus;
  evaluation: string | null;
  evaluationDescription: string | null;
}

export interface ImprovementOpportunityResponse {
  id: number;
  name: string;
  description: string | null;
  cause: string | null;
  responsible: UserSummary | null;
  origin: ImprovementOpportunityOrigin;
  department: DepartmentResponse | null;
  years: ImprovementOpportunityYearResponse[];
  improvementActions: ImprovementActionResponse[];
}

export interface CreateImprovementOpportunityRequest {
  name: string;
  description?: string | null;
  cause?: string | null;
  responsibleId?: number | null;
  departmentId?: number | null;
  origin: ImprovementOpportunityOrigin;
  yearIds: number[];
}

export interface UpdateImprovementOpportunityRequest {
  name?: string;
  description?: string | null;
  cause?: string | null;
  responsibleId?: number | null;
  departmentId?: number | null;
  origin?: ImprovementOpportunityOrigin;
}

export interface UpdateImprovementOpportunityYearRequest {
  status?: ImprovementOpportunityStatus;
  evaluation?: string | null;
  evaluationDescription?: string | null;
}

export interface CreateImprovementActionRequest {
  name: string;
  description?: string | null;
  responsibleId?: number | null;
}

export interface UpdateImprovementActionRequest {
  name?: string;
  description?: string | null;
  responsibleId?: number | null;
  status?: ImprovementActionStatus;
  progressDescription?: string | null;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
}

export interface AuthResponse {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  accessToken: string;
  roles: string[];
}

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<never>;
}

/* MACRO PROCESS, PROCESS, INDICATOR, MEASUREMENT */

export interface Measurement {
  id: number;
  measurementDate: string;
  value: number;
  notes: string;
  indicatorId: string;
}

export type IndicatorFrequency = "ANNUAL" | "MONTHLY" | "SEMESTER" | "TRIMESTER" | "WEEKLY";
export type IndicatorValueType = "NUMBER" | "PERCENTAGE" | "RATIO" | "TIME" | "CURRENCY";

export interface Indicator {
  id: number;
  name: string;
  formula: string;
  frequency: IndicatorFrequency;
  owner?: string;
  measurements: Measurement[];
}

export interface DepartmentResponse {
  id: number;
  name: string;
  userCount: number;
}

export interface Process {
  id: number;
  name: string;
  objective: string;
  responsibles: UserSummary[];
  departments: DepartmentResponse[];
}

export interface ProcessSummary extends Process {
  indicators: Indicator[];
}

export interface MacroProcess {
  id: number;
  name: string;
}

export interface MacroProcessSummary extends MacroProcess {
  processes: ProcessSummary[];
}

export interface IndicatorProcess {
  id: number;
  processName: string;
  macroProcessName: string;
}

export interface ProcessResponsibleResponse {
  humanResourceYearId: number;
  humanResourceId: number;
  name: string;
  function: string | null;
  department: string | null;
}

export interface IndicatorWithProcesses extends Indicator {
  processes: ProcessOptionResponse[];
  owner: string;
  indicatorYearId?: number;
  indicatorId?: number;
  goal?: number | null;
  valueType?: string;
responsible: ProcessResponsibleResponse | null;  notes?: string | null;
}

export interface IndicatorSimple {
  id: number;
  name: string;
  frequency: IndicatorFrequency;
  owner?: string;
}

// export interface IndicatorWithProcesses extends Indicator {
//   processes: IndicatorProcess[];
//   owner: string;
//   indicatorYearId?: number;
//   indicatorId?: number;
//   goal?: number | null;
//   valueType?: string;
//   responsible?: UserSummary | null;
//   notes?: string | null;
// }

export interface IndicatorFullResponse extends Indicator {
  processes: ProcessSummary[];
}

export interface YearOption {
  id: number;
  year: number;
  selected: boolean;
}

export interface IndicatorHierarchyResponse {
  indicatorYearId: number;
  indicatorId: number;
  name: string;
  formula: string;
  frequency: IndicatorFrequency;
  goal: number | null;
  measurements: MeasurementResponseDTO[];
  years: YearOption[];
}

export interface MeasurementResponseDTO {
  id: number;
  measurementDate: string;
  measurementValue: number;
  notes: string;
  indicatorYearId: number;
}

export interface QualityObjectiveInfo {
  id: number;
  yearId: number;
  objectiveTitle: string;
}

export interface ProcessHierarchyItem {
  processYearId: number;
  processId: number;
  name: string;
  objective: string;
  entradas: string | null;
  atividades: string | null;
  saidas: string | null;
  entradasDocumentos: DocumentSummary[];
  saidasDocumentos: DocumentSummary[];
  fichaDocumento: DocumentSummary | null;
  documents: DocumentSummary[];
  editors: UserSummary[];  
  formalResponsibles: ProcessResponsibleResponse[];
  departments: DepartmentResponse[];
  indicators: IndicatorHierarchyResponse[];
  years: YearOption[];
  qualityObjectives: QualityObjectiveInfo[];
}

export interface MacroProcessHierarchyItem {
  macroProcessYearId: number;
  macroProcessId: number;
  name: string;
  processes: ProcessHierarchyItem[];
  years: YearOption[];
}

export interface ProcessHierarchyResponse {
  macroProcesses: MacroProcessHierarchyItem[];
  standaloneProcesses: ProcessHierarchyItem[];
}

export interface UserManagementResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
}

/* SCOPE */

export type DocumentStatus = "UNDER_REVIEW" | "APPROVED" | "OBSOLETE";

export interface UserSummary {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface DocumentVersionResponse {
  versionId: number;
  version: string;
  fileName: string;
  fileType: string;
  uploadedBy: UserSummary;
  status: DocumentStatus;
  uploadedAt: string;
  obsoleteAt: string | null;
  downloadUrl: string;
}

export interface DocumentWithVersionsResponse {
  documentId: number;
  versions: DocumentVersionResponse[];
}

export interface SingletonDocumentResponse {
  id: number;
  description: string | null;
  document: DocumentWithVersionsResponse | null;
}

export type ScopeResponse = SingletonDocumentResponse;
export type SystemPolicyResponse = SingletonDocumentResponse;
export type ResponsibilityAuthorityResponse = SingletonDocumentResponse;

/* YEAR */

export interface YearResponse {
  id: number;
  year: number;
}

/* LEADERSHIP COMMITMENT (5.1) */

export interface LeadershipCommitmentYearDetail {
  leadershipCommitmentYearId: number;
  yearId: number;
  year: number;
  documents: DocumentWithVersionsResponse[];
}

export interface LeadershipCommitmentResponse {
  id: number;
  description: string | null;
  years: LeadershipCommitmentYearDetail[];
}

/* AWARENESS (7.3) */

export interface AwarenessYearDetail {
  awarenessYearId: number;
  yearId: number;
  year: number;
  documents: DocumentWithVersionsResponse[];
}

export interface AwarenessResponse {
  id: number;
  description: string | null;
  years: AwarenessYearDetail[];
}

/* MANAGEMENT REVIEW (9.3.1) */

export interface ManagementReviewYearDetail {
  managementReviewYearId: number;
  yearId: number;
  year: number;
  documents: DocumentWithVersionsResponse[];
}

export interface ManagementReviewResponse {
  id: number;
  description: string | null;
  years: ManagementReviewYearDetail[];
}

/* CUSTOMER SATISFACTION (9.1.2) */

export interface CustomerSatisfactionYearDetail {
  customerSatisfactionYearId: number;
  yearId: number;
  year: number;
  documents: DocumentWithVersionsResponse[];
}

export interface CustomerSatisfactionResponse {
  id: number;
  description: string | null;
  years: CustomerSatisfactionYearDetail[];
}

/* SUPPLIER (8.4.1) */

export interface SupplierReviewResponse {
  id: number;
  rating: number;
  text: string | null;
  reviewDate: string;
  documents: DocumentWithVersionsResponse[];
}

export interface SupplierResponse {
  id: number;
  name: string;
  description: string | null;
  contactInfo: string | null;
  createdAt: string;
  reviews: SupplierReviewResponse[];
}

export interface CreateSupplierRequest {
  name: string;
  description?: string | null;
  contactInfo?: string | null;
}

export interface UpdateSupplierRequest {
  name?: string | null;
  description?: string | null;
  contactInfo?: string | null;
}

export interface CreateSupplierReviewRequest {
  rating: number;
  text?: string | null;
  reviewDate: string;
}

export interface UpdateSupplierReviewRequest {
  rating?: number | null;
  text?: string | null;
  reviewDate?: string | null;
}

/* SWOT ANALYSIS (4.1) */

export type SwotItemType = "STRENGTH" | "WEAKNESS" | "OPPORTUNITY" | "THREAT";

export interface SwotYearSummary {
  swotYearId: number;
  yearId: number;
  year: number;
}

export interface SwotItemResponse {
  id: number;
  text: string;
  type: SwotItemType;
  years: SwotYearSummary[];
}

export interface SwotYearDetail {
  swotYearId: number;
  yearId: number;
  year: number;
  strengths: SwotItemResponse[];
  weaknesses: SwotItemResponse[];
  opportunities: SwotItemResponse[];
  threats: SwotItemResponse[];
}

export interface SwotAnalysisResponse {
  id: number;
  description: string | null;
  documents: DocumentWithVersionsResponse[];
  years: SwotYearSummary[];
}

export interface CreateSwotItemRequest {
  text: string;
  type: SwotItemType;
  yearIds: number[];
}

export interface UpdateSwotItemRequest {
  text: string;
}

/* CHANGE (6.3) */

export type ChangeStatus = "INITIATED" | "IN_PROGRESS" | "FINISHED" | "CANCELLED";

export interface ChangeResponse {
  id: number;
  description: string | null;
  origin: string | null;
  whatWillBeDone: string | null;
  why: string | null;
  createdBy: UserSummary | null;
  startDate: string | null;
  timeLimitInDays: number | null;
  expectedEndDate: string | null;
  realEndDate: string | null;
  where: string | null;
  how: string | null;
  howMuch: string | null;
  status: ChangeStatus;
  notes: string | null;
  createdAt: string;
}

export interface ChangeRequest {
  description?: string | null;
  origin?: string | null;
  whatWillBeDone?: string | null;
  why?: string | null;
  createdById?: number | null;
  startDate?: string | null;
  timeLimitInDays?: number | null;
  expectedEndDate?: string | null;
  realEndDate?: string | null;
  where?: string | null;
  how?: string | null;
  howMuch?: string | null;
  status?: ChangeStatus | null;
  notes?: string | null;
}

/* INTERESTED PARTIES (4.2) */

export type InterestedPartyType = "INTERNAL" | "EXTERNAL";

export interface ProcessOptionResponse {
  processYearId: number;
  processId: number;
  processName: string;
  macroProcessName: string | null;
}

export interface InterestedPartyResponse {
  id: number;
  interestedPartyYearId: number;
  name: string;
  type: InterestedPartyType;
  category: string;
  contactInfo: string;
  yearId: number;
  year: number;
  needs: string | null;
  communicationAndMonitoringPlan: string | null;
  processes: ProcessOptionResponse[];
  evidences: DocumentWithVersionsResponse[];
}

export interface CreateInterestedPartyRequest {
  name: string;
  type: InterestedPartyType;
  category: string;
  contactInfo: string;
  yearId: number;
  needs?: string | null;
  communicationAndMonitoringPlan?: string | null;
  processYearIds?: number[] | null;
}

export interface UpdateInterestedPartyRequest {
  name?: string | null;
  type?: InterestedPartyType | null;
  category?: string | null;
  contactInfo?: string | null;
  needs?: string | null;
  communicationAndMonitoringPlan?: string | null;
}

/* QUALITY OBJECTIVES (6.2) */

export type QualityObjectiveStatus = "ACHIEVED" | "IN_PROGRESS";

export interface QualityObjectiveIndicatorResponse {
  indicatorYearId: number;
  indicatorId: number;
  name: string;
  formula: string;
  frequency: IndicatorFrequency;
  valueType: string;
  responsible: UserSummary | null;
  notes: string | null;
  goal: number | null;
  measurements: MeasurementResponseDTO[];
}

export interface QualityObjectiveResponse {
  id: number;
  qualityObjectiveYearId: number;
  objectiveTitle: string;
  description: string | null;
  responsible: UserSummary | null;
  yearId: number;
  year: number;
  status: QualityObjectiveStatus;
  years: YearOption[];
  processes: ProcessOptionResponse[];
  indicators: QualityObjectiveIndicatorResponse[];
}

export interface CreateQualityObjectiveRequest {
  objectiveTitle: string;
  description?: string | null;
  responsibleId?: number | null;
  status?: QualityObjectiveStatus;
  yearIds: number[];
  processYearIds?: number[];
  indicatorYearIds?: number[];
}

export interface UpdateQualityObjectiveRequest {
  objectiveTitle?: string;
  description?: string | null;
  responsibleId?: number | null;
  status?: QualityObjectiveStatus;
  yearId?: number;
  processYearIds?: number[];
  indicatorYearIds?: number[];
}

export interface AssociateQualityObjectiveYearsRequest {
  yearIds: number[];
  copyProcessesAndIndicators: boolean;
}

/* RISKS & OPPORTUNITIES (6.1) */

export type RiskOpportunityType = "RISK" | "OPPORTUNITY";
export type RiskDecision = "ACCEPT" | "MITIGATE" | "TRANSFER" | "AVOID";
export type ActionStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";

export interface RiskOpportunityResponse {
  id: number;
  riskOpportunityYearId: number;
  code: string;
  type: RiskOpportunityType;
  origin: string;
  description: string;
  category: string;
  yearId: number;
  year: number;
  impact: number | null;
  probability: number | null;
  riskLevel: number | null;
  decision: RiskDecision | null;
  processes: ProcessOptionResponse[];
}

export interface RiskOpportunityGroupedResponse {
  risks: RiskOpportunityResponse[];
  opportunities: RiskOpportunityResponse[];
}

export interface CreateRiskOpportunityRequest {
  origin: string;
  description: string;
  category: string;
  type: RiskOpportunityType;
  yearIds: number[];
  impact?: number | null;
  probability?: number | null;
  decision?: RiskDecision | null;
  processYearIds?: number[] | null;
}

/* RESOURCES - INFRASTRUCTURE (7.1.3) */

export interface InfrastructureResponse {
  id: number;
  name: string;
  type: string;
  location: string;
  responsible: UserSummary | null;
  maintenance: string;
  yearId: number;
  year: number;
  isActive: boolean;
  years: YearOption[];
}

export interface CreateInfrastructureRequest {
  name: string;
  type: string;
  location: string;
  responsibleId?: number | null;
  maintenance: string;
  isActive: boolean;
  yearIds: number[];
}

export interface UpdateInfrastructureRequest {
  name?: string;
  type?: string;
  location?: string;
  responsibleId?: number | null;
  maintenance?: string;
  yearId?: number;
  isActive?: boolean;
}

/* RESOURCES - EQUIPMENT (7.1.5) */

export interface MaintenanceRecordResponse {
  id: number;
  date: string;
  type: string;
  performedBy: string;
  description: string;
}

export interface CalibrationRecordResponse {
  id: number;
  date: string;
  performedBy: string;
  result: string;
  description: string;
}

export interface EquipmentResponse {
  id: number;
  name: string;
  type: string;
  location: string;
  responsible: UserSummary | null;
  yearId: number;
  year: number;
  isActive: boolean;
  years: YearOption[];
  maintenanceHistory: MaintenanceRecordResponse[];
  calibrationHistory: CalibrationRecordResponse[];
}

export interface CreateEquipmentRequest {
  name: string;
  type: string;
  location: string;
  responsibleId?: number | null;
  isActive: boolean;
  yearIds: number[];
}

export interface UpdateEquipmentRequest {
  name?: string;
  type?: string;
  location?: string;
  responsibleId?: number | null;
  yearId?: number;
  isActive?: boolean;
}

export interface CreateMaintenanceRecordRequest {
  date: string;
  type: string;
  performedBy: string;
  description: string;
}

export interface CreateCalibrationRecordRequest {
  date: string;
  performedBy: string;
  result: string;
  description: string;
}

/* HUMAN RESOURCES & COMPETENCIES (7.1.2) */

export interface CompetencyResponse {
  id: number;
  name: string;
  details: string;
  document: DocumentWithVersionsResponse | null;
}

export interface HumanResourceResponse {
  id: number;
  name: string;
  function: string;
  departmentId: number | null;
  departmentName: string | null;
  competencies: CompetencyResponse[];
  yearId: number;
  year: number;
  isActive: boolean;
  years: YearOption[];
  hryId: number;
}

export interface CreateHumanResourceRequest {
  name: string;
  function: string;
  departmentId: number | null;
  yearIds: number[];
}

export interface UpdateHumanResourceRequest {
  name?: string;
  function?: string;
  departmentId?: number | null;
  yearId?: number;
  isActive?: boolean;
}

/* COMMUNICATION (7.4) */

export type CommunicationType = "INTERNAL" | "EXTERNAL";

export interface CommunicationItemResponse {
  id: number;
  what: string;
  who: string;
  toWho: string;
  when: string;
  where: string;
  how: string;
  type: CommunicationType;
  years: YearOption[];
}

export interface CommunicationResponse {
  id: number;
  objective: string;
  scope: string | null;
  plan: string | null;
  internalItems: CommunicationItemResponse[];
  externalItems: CommunicationItemResponse[];
}

export interface UpdateCommunicationRequest {
  objective?: string;
  scope?: string | null;
  plan?: string | null;
}

export interface CreateCommunicationItemRequest {
  what: string;
  who: string;
  toWho: string;
  when: string;
  where: string;
  how: string;
  type: CommunicationType;
  yearIds?: number[];
}

export interface UpdateCommunicationItemRequest {
  what?: string;
  who?: string;
  toWho?: string;
  when?: string;
  where?: string;
  how?: string;
  type?: string;
}

export interface UpdateRiskOpportunityRequest {
  origin?: string;
  description?: string;
  category?: string;
  yearId?: number;
  impact?: number | null;
  probability?: number | null;
  decision?: RiskDecision | null;
}

export type AuditType = "INTERNAL" | "EXTERNAL";
export type AuditStatus = "PLANNED" | "PLANNED_NOT_CONFIRMED" | "PLANNED_CONFIRMED" | "FINISHED" | "CANCELED";

export interface DocumentSummary {
  id: number;
  fileName: string;
  fileType: string;
  fileUrl: string;
  uploadedByFullName?: string;
  uploadedAt?: string;
}

export interface AuditDocumentSummary {
  id: number;
  fileName: string;
  fileType: string;
  fileUrl: string;
}

export interface AuditResponse {
  id: number;
  name: string;
  type: AuditType;
  team: string | null;
  notes: string | null;
  responsible: UserSummary | null;
  department: DepartmentResponse | null;
  yearId: number;
  year: number;
  status: AuditStatus;
  plannedDate: string | null;
  documents: AuditDocumentSummary[];
}

export interface CreateAuditRequest {
  name: string;
  type: AuditType;
  team?: string | null;
  notes?: string | null;
  responsibleId?: number | null;
  departmentId?: number | null;
  yearId: number;
  status?: AuditStatus;
  plannedDate?: string | null;
}

export interface UpdateAuditRequest {
  name?: string;
  type?: AuditType;
  team?: string | null;
  notes?: string | null;
  responsibleId?: number | null;
  departmentId?: number | null;
  status?: AuditStatus;
  plannedDate?: string | null;
}

export interface CreateExternalUserRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  yearIds: number[];
}

export interface ExternalUserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  accessibleYears: number[];
}

export type EntityType =
  | "MACRO_PROCESS" | "PROCESS" | "INDICATOR" | "MEASUREMENT"
  | "NON_CONFORMITY" | "CORRECTIVE_ACTION" | "IMPROVEMENT_OPPORTUNITY" | "IMPROVEMENT_ACTION" | "INTERESTED_PARTY"
  | "RISK_OPPORTUNITY" | "RISK_ACTION" | "SWOT_ANALYSIS" | "SWOT_ITEM"
  | "COMMUNICATION" | "COMMUNICATION_ITEM" | "AWARENESS"
  | "LEADERSHIP_COMMITMENT" | "RESPONSIBILITY_AUTHORITY"
  | "QUALITY_OBJECTIVE" | "EQUIPMENT" | "CALIBRATION_RECORD"
  | "MAINTENANCE_RECORD" | "HUMAN_RESOURCE" | "COMPETENCY"
  | "INFRASTRUCTURE" | "CHANGE" | "SYSTEM_POLICY" | "DOCUMENT"
  | "DOCUMENT_VERSION" | "SCOPE" | "AUDIT" | "CUSTOMER_SATISFACTION" | "SUPPLIER" | "SUPPLIER_REVIEW" | "MANAGEMENT_REVIEW";

export type ActionType = "CREATED" | "UPDATED" | "DELETED" | "ASSOCIATED" | "DISASSOCIATED";

export interface LogResponse {
  id: number;
  user: UserSummary | null;
  timestamp: string;
  entityType: EntityType;
  baseEntityId: number | null;
  entityYearId: number | null;
  yearId: number | null;
  entityName: string;
  action: ActionType;
  details: Record<string, unknown> | null;
}

export interface ProcessResponsibleResponse {
  humanResourceYearId: number;
  humanResourceId: number;
  name: string;
  function: string | null;
  department: string | null;
}

export interface HumanResourceResponsibilitiesResponse {
  processes: {
    processYearId: number;
    processId: number;
    name: string;
  }[];

  indicators: {
    indicatorYearId: number;
    indicatorId: number;
    name: string;
  }[];
}