import { api } from "./axios";
import type {
  CreateCommunicationItemRequest,
  HumanResourceResponse,
  CreateHumanResourceRequest,
  UpdateHumanResourceRequest,
  InfrastructureResponse,
  CreateInfrastructureRequest,
  UpdateInfrastructureRequest,
  EquipmentResponse,
  CreateEquipmentRequest,
  UpdateEquipmentRequest,
  MaintenanceRecordResponse,
  CalibrationRecordResponse,
  CreateMaintenanceRecordRequest,
  CreateCalibrationRecordRequest,
  AuditResponse,
  CreateAuditRequest,
  UpdateAuditRequest,
  CreateExternalUserRequest,
  DepartmentResponse,
  UserManagementResponse,
  ImprovementOpportunityResponse,
  ImprovementOpportunityYearResponse,
  CreateImprovementOpportunityRequest,
  UpdateImprovementOpportunityRequest,
  ImprovementActionResponse,
  CreateImprovementActionRequest,
  UpdateImprovementActionRequest,
  UpdateImprovementOpportunityYearRequest,
} from "@/types.ts";

export const getMacroProcessHierarchy = async (yearId: number): Promise<ProcessHierarchyResponse> => {
  const res = await api.get(`/macroprocess-hierarchy/${yearId}`);
  return res.data;
};

export const getMacroProcesses = async (yearId: number): Promise<MacroProcess[]> => {
  const res = await api.get("/macroprocesses", { params: { yearId } });
  return res.data;
};

export const createMacroProcess = async (data: { name: string; yearId: number }) => {
  const res = await api.post("/macroprocesses", data);
  return res.data;
};

export const createProcess = async (data: {
  name: string;
  objective?: string;
  entradasDocumentoId?: number | null;
  saidasDocumentoId?: number | null;
  fichaDocumentoId?: number | null;
  departmentIds?: number[];
  yearId: number;
  macroProcessYearId?: number | null;
}) => {
  const res = await api.post("/processes", data);
  return res.data;
};

export const deleteMacroProcess = async (id: number) => {
  await api.delete(`/macroprocesses/${id}`);
};

export const deleteProcess = async (processYearId: number) => {
  await api.delete(`/processes/process-year/${processYearId}`);
};

export const moveProcess = async (data: { processYearId: number; targetMacroProcessYearId: number | null }) => {
  await api.post("/processes/move", data);
};

export const associateProcessYears = async (
  processId: number,
  associateYearIds: number[],
  disassociateYearIds: number[],
): Promise<void> => {
  await api.patch(`/processes/${processId}/years`, { associateYearIds, disassociateYearIds });
};

export const associateProcessYearsFull = async (
  processId: number,
  yearIds: number[],
): Promise<void> => {
  await api.post(`/processes/${processId}/years/full`, { yearIds });
};

export const updateProcess = async (id: number, data: { name?: string; objective?: string }) => {
  const res = await api.patch(`/processes/${id}`, data);
  return res.data;
};

export const addProcessResponsible = async (processId: number, userId: number) => {
  await api.post(`/processes/${processId}/responsibles`, { userId });
};

export const removeProcessResponsible = async (processId: number, userId: number) => {
  await api.delete(`/processes/${processId}/responsibles/${userId}`);
};

export const addProcessDepartment = async (processId: number, departmentId: number) => {
  await api.post(`/processes/${processId}/departments`, { departmentId });
};

export const removeProcessDepartment = async (processId: number, departmentId: number) => {
  await api.delete(`/processes/${processId}/departments/${departmentId}`);
};

export const addProcessDocument = async (processId: number, documentId: number) => {
  await api.post(`/processes/${processId}/documents`, { documentId });
};

export const removeProcessDocument = async (processId: number, documentId: number) => {
  await api.delete(`/processes/${processId}/documents/${documentId}`);
};

export const uploadProcessDocument = async (
  processId: number,
  file: File,
  uploadedById: number,
) => {
  const formData = new FormData();
  const data = JSON.stringify({ documentId: null, versioned: false, version: 1, requiresApproval: false, uploadedById });
  formData.append("data", new Blob([data], { type: "application/json" }));
  formData.append("file", file);
  const res = await api.post(`/processes/${processId}/documents/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const uploadProcessFichaDocumento = async (
  processId: number,
  file: File,
  uploadedById: number,
) => {
  const formData = new FormData();
  const data = JSON.stringify({ documentId: null, versioned: false, version: 1, requiresApproval: false, uploadedById });
  formData.append("data", new Blob([data], { type: "application/json" }));
  formData.append("file", file);
  const res = await api.post(`/processes/${processId}/ficha-documento/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const clearProcessFichaDocumento = async (processId: number) => {
  await api.delete(`/processes/${processId}/ficha-documento`);
};

export const uploadProcessEntradasDocumento = async (
  processId: number,
  file: File,
  uploadedById: number,
) => {
  const formData = new FormData();
  const data = JSON.stringify({ documentId: null, versioned: false, version: 1, requiresApproval: false, uploadedById });
  formData.append("data", new Blob([data], { type: "application/json" }));
  formData.append("file", file);
  const res = await api.post(`/processes/${processId}/entradas-documentos/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const removeProcessEntradasDocumento = async (processId: number, documentId: number) => {
  await api.post(`/processes/${processId}/entradas-documentos/${documentId}`);
};

export const uploadProcessSaidasDocumento = async (
  processId: number,
  file: File,
  uploadedById: number,
) => {
  const formData = new FormData();
  const data = JSON.stringify({ documentId: null, versioned: false, version: 1, requiresApproval: false, uploadedById });
  formData.append("data", new Blob([data], { type: "application/json" }));
  formData.append("file", file);
  const res = await api.post(`/processes/${processId}/saidas-documentos/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const removeProcessSaidasDocumento = async (processId: number, documentId: number) => {
  await api.post(`/processes/${processId}/saidas-documentos/${documentId}`);
};

export const createIndicator = async (data: {
  name: string;
  formula: string;
  frequency: string;
  valueType: string;
  responsibleId?: number | null;
  notes?: string | null;
  yearId: number;
  goal?: number | null;
}) => {
  const res = await api.post("/indicators", data);
  return res.data;
};

export const getIndicatorsByYear = async (yearId: number): Promise<IndicatorWithProcesses[]> => {
  const res = await api.get(`/indicators/year/${yearId}`);
  return res.data;
};

export const updateIndicator = async (indicatorYearId: number, data: {
  name?: string;
  formula?: string;
  frequency?: string;
  valueType?: string;
  responsibleId?: number | null;
  notes?: string | null;
  goal?: number | null;
}) => {
  const res = await api.put(`/indicators/${indicatorYearId}`, data);
  return res.data;
};

export const associateIndicatorProcesses = async (indicatorYearId: number, processYearIds: number[]) => {
  await api.post("/indicators/associate-to-processes", { indicatorYearId, processYearIds });
};

export const disassociateIndicatorProcesses = async (indicatorYearId: number, processYearIds: number[]) => {
  await api.post("/indicators/disassociate-from-processes", { indicatorYearId, processYearIds });
};

export const createMeasurement = async (indicatorYearId: number, data: {
  measurementDate: string;
  value: number;
  notes?: string | null;
}) => {
  const res = await api.post(`/measurements/indicator-year/${indicatorYearId}`, data);
  return res.data;
};

export const deleteIndicator = async (indicatorYearId: number): Promise<void> => {
  await api.delete(`/indicators/${indicatorYearId}`);
};

export const associateIndicatorYears = async (indicatorId: number, yearIds: number[]): Promise<void> => {
  await api.put(`/indicators/${indicatorId}/years/associate`, { yearIds });
};

export const disassociateIndicatorYears = async (indicatorId: number, yearIds: number[]): Promise<void> => {
  await api.put(`/indicators/${indicatorId}/years/disassociate`, { yearIds });
};

export const getIndicatorsSimple = async (yearId: number): Promise<IndicatorWithProcesses[]> => {
  const res = await api.get(`/indicators/year/${yearId}/options`);
  return res.data;
};

export const associateIndicatorsToProcess = async (processYearId: number, indicatorYearIds: number[]) => {
  await api.post("/indicators/associate", { processYearId, indicatorYearIds });
};

export const disassociateIndicatorsFromProcess = async (processYearId: number, indicatorYearIds: number[]) => {
  await api.post("/indicators/disassociate", { processYearId, indicatorYearIds });
};

/* SINGLETON DOCUMENT HELPERS */

async function uploadSingletonDocument(
  endpoint: string,
  file: File,
  version: number,
  uploadedById: number,
  existingDocumentId?: number | null,
): Promise<SingletonDocumentResponse> {
  const formData = new FormData();
  const data = JSON.stringify({
    documentId: existingDocumentId ?? null,
    versioned: true,
    version,
    requiresApproval: true,
    uploadedById,
  });
  formData.append("data", new Blob([data], { type: "application/json" }));
  formData.append("file", file);
  const res = await api.post(endpoint, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

async function getSingleton(path: string): Promise<SingletonDocumentResponse> {
  const res = await api.get(path);
  return res.data;
}

async function updateSingleton(path: string, data: { description: string }): Promise<SingletonDocumentResponse> {
  const res = await api.patch(path, data);
  return res.data;
}

/* SCOPE */

export const getScope = () => getSingleton("/scope");
export const updateScope = (data: { description: string }) => updateSingleton("/scope", data);
export const uploadScopeDocument = (
  file: File, version: number, uploadedById: number, existingDocumentId?: number | null,
) => uploadSingletonDocument("/scope/document", file, version, uploadedById, existingDocumentId);

/* SYSTEM POLICY */

export const getSystemPolicy = () => getSingleton("/system-policy");
export const updateSystemPolicy = (data: { description: string }) => updateSingleton("/system-policy", data);
export const uploadSystemPolicyDocument = (
  file: File, version: number, uploadedById: number, existingDocumentId?: number | null,
) => uploadSingletonDocument("/system-policy/document", file, version, uploadedById, existingDocumentId);

/* RESPONSIBILITY & AUTHORITY */

export const getResponsibilityAuthority = () => getSingleton("/responsibility-authority");
export const updateResponsibilityAuthority = (data: { description: string }) => updateSingleton("/responsibility-authority", data);
export const uploadResponsibilityAuthorityDocument = (
  file: File, version: number, uploadedById: number, existingDocumentId?: number | null,
) => uploadSingletonDocument("/responsibility-authority/document", file, version, uploadedById, existingDocumentId);

/* DOCUMENT VERSIONS */

export const approveDocumentVersion = async (versionId: number): Promise<void> => {
  await api.post(`/documents/versions/${versionId}/approve`);
};

export const deleteDocumentVersion = async (versionId: number): Promise<void> => {
  await api.delete(`/documents/versions/${versionId}`);
};

export const deleteDocument = async (documentId: number): Promise<void> => {
  await api.delete(`/documents/${documentId}`);
};

export const downloadDocumentVersion = async (versionId: number, fileName: string): Promise<void> => {
  const res = await api.get(`/documents/versions/${versionId}/download/${fileName}`, {
    responseType: "blob",
  });

  const cleanName = stripUuidSuffix(fileName);

  const url = window.URL.createObjectURL(res.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = cleanName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export function stripUuidSuffix(name: string): string {
  const uuidPattern = /_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;
  return name.replace(uuidPattern, "");
}

/* YEARS */

export const getYears = async (): Promise<YearResponse[]> => {
  const res = await api.get("/years");
  return res.data;
};

export const createYear = async (data: { year: number }): Promise<YearResponse> => {
  const res = await api.post("/years", data);
  return res.data;
};

export const deleteYear = async (id: number): Promise<void> => {
  await api.delete(`/years/${id}`);
};

/* LEADERSHIP COMMITMENT (5.1) */

export const getLeadershipCommitment = async (): Promise<LeadershipCommitmentResponse> => {
  const res = await api.get("/leadership-commitments");
  return res.data;
};

export const updateLeadershipCommitment = async (data: { description: string }): Promise<LeadershipCommitmentResponse> => {
  const res = await api.patch("/leadership-commitments", data);
  return res.data;
};

export const getLeadershipCommitmentByYear = async (yearId: number): Promise<LeadershipCommitmentYearDetail> => {
  const res = await api.get(`/leadership-commitments/year/${yearId}`);
  return res.data;
};

export const uploadLeadershipCommitmentDocument = async (
  yearId: number,
  file: File,
  version: number,
  uploadedById: number,
  existingDocumentId?: number | null,
): Promise<LeadershipCommitmentYearDetail> => {
  const formData = new FormData();
  const data = JSON.stringify({
    documentId: existingDocumentId ?? null,
    versioned: true,
    version,
    requiresApproval: true,
    uploadedById,
  });
  formData.append("data", new Blob([data], { type: "application/json" }));
  formData.append("file", file);
  const res = await api.post(`/leadership-commitments/years/${yearId}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteLeadershipCommitmentDocument = async (documentId: number): Promise<void> => {
  await api.delete(`/leadership-commitments/documents/${documentId}`);
};

/* AWARENESS (7.3) */

export const getAwareness = async (): Promise<AwarenessResponse> => {
  const res = await api.get("/awareness");
  return res.data;
};

export const updateAwareness = async (data: { description: string }): Promise<AwarenessResponse> => {
  const res = await api.patch("/awareness", data);
  return res.data;
};

export const getAwarenessByYear = async (yearId: number): Promise<AwarenessYearDetail> => {
  const res = await api.get(`/awareness/year/${yearId}`);
  return res.data;
};

export const uploadAwarenessDocument = async (
  yearId: number,
  file: File,
  version: number,
  uploadedById: number,
  existingDocumentId?: number | null,
): Promise<AwarenessYearDetail> => {
  const formData = new FormData();
  const data = JSON.stringify({
    documentId: null,
    versioned: false,
    version: 1,
    uploadedById,
  });
  formData.append("data", new Blob([data], { type: "application/json" }));
  formData.append("file", file);
  const res = await api.post(`/awareness/years/${yearId}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteAwarenessDocument = async (documentId: number): Promise<void> => {
  await api.delete(`/awareness/documents/${documentId}`);
};

/* CUSTOMER SATISFACTION (9.1.2) */

export const getCustomerSatisfaction = async (): Promise<CustomerSatisfactionResponse> => {
  const res = await api.get("/customer-satisfactions");
  return res.data;
};

export const updateCustomerSatisfaction = async (data: { description: string }): Promise<CustomerSatisfactionResponse> => {
  const res = await api.patch("/customer-satisfactions", data);
  return res.data;
};

export const getCustomerSatisfactionByYear = async (yearId: number): Promise<CustomerSatisfactionYearDetail> => {
  const res = await api.get(`/customer-satisfactions/year/${yearId}`);
  return res.data;
};

export const uploadCustomerSatisfactionDocument = async (
  yearId: number,
  file: File,
  version: number,
  uploadedById: number,
  existingDocumentId?: number | null,
): Promise<CustomerSatisfactionYearDetail> => {
  const formData = new FormData();
  const data = JSON.stringify({
    documentId: null,
    versioned: false,
    version: 1,
    uploadedById,
  });
  formData.append("data", new Blob([data], { type: "application/json" }));
  formData.append("file", file);
  const res = await api.post(`/customer-satisfactions/years/${yearId}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteCustomerSatisfactionDocument = async (documentId: number): Promise<void> => {
  await api.delete(`/customer-satisfactions/documents/${documentId}`);
};

/* MANAGEMENT REVIEW (9.3.1) */

export const getManagementReview = async (): Promise<ManagementReviewResponse> => {
  const res = await api.get("/management-reviews");
  return res.data;
};

export const updateManagementReview = async (data: { description: string }): Promise<ManagementReviewResponse> => {
  const res = await api.patch("/management-reviews", data);
  return res.data;
};

export const getManagementReviewByYear = async (yearId: number): Promise<ManagementReviewYearDetail> => {
  const res = await api.get(`/management-reviews/year/${yearId}`);
  return res.data;
};

export const uploadManagementReviewDocument = async (
  yearId: number,
  file: File,
  version: number,
  uploadedById: number,
  existingDocumentId?: number | null,
): Promise<ManagementReviewYearDetail> => {
  const formData = new FormData();
  const data = JSON.stringify({
    documentId: null,
    versioned: false,
    version: 1,
    uploadedById,
  });
  formData.append("data", new Blob([data], { type: "application/json" }));
  formData.append("file", file);
  const res = await api.post(`/management-reviews/years/${yearId}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteManagementReviewDocument = async (documentId: number): Promise<void> => {
  await api.delete(`/management-reviews/documents/${documentId}`);
};

/* SUPPLIERS (8.4.1) */

export const getSuppliers = async (): Promise<SupplierResponse[]> => {
  const res = await api.get("/suppliers");
  return res.data;
};

export const createSupplier = async (data: CreateSupplierRequest): Promise<SupplierResponse> => {
  const res = await api.post("/suppliers", data);
  return res.data;
};

export const updateSupplier = async (id: number, data: UpdateSupplierRequest): Promise<SupplierResponse> => {
  const res = await api.patch(`/suppliers/${id}`, data);
  return res.data;
};

export const deleteSupplier = async (id: number): Promise<void> => {
  await api.delete(`/suppliers/${id}`);
};

export const createSupplierReview = async (supplierId: number, data: CreateSupplierReviewRequest): Promise<SupplierReviewResponse> => {
  const res = await api.post(`/suppliers/${supplierId}/reviews`, data);
  return res.data;
};

export const updateSupplierReview = async (supplierId: number, reviewId: number, data: UpdateSupplierReviewRequest): Promise<SupplierReviewResponse> => {
  const res = await api.patch(`/suppliers/${supplierId}/reviews/${reviewId}`, data);
  return res.data;
};

export const deleteSupplierReview = async (supplierId: number, reviewId: number): Promise<void> => {
  await api.delete(`/suppliers/${supplierId}/reviews/${reviewId}`);
};

export const uploadSupplierReviewDocument = async (
  supplierId: number,
  reviewId: number,
  file: File,
  uploadedById: number,
): Promise<SupplierReviewResponse> => {
  const formData = new FormData();
  const data = JSON.stringify({
    documentId: null,
    versioned: false,
    version: 1,
    requiresApproval: false,
    uploadedById,
  });
  formData.append("data", new Blob([data], { type: "application/json" }));
  formData.append("file", file);
  const res = await api.post(
    `/suppliers/${supplierId}/reviews/${reviewId}/documents`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
};

export const deleteSupplierReviewDocument = async (supplierId: number, reviewId: number, documentId: number): Promise<void> => {
  await api.delete(`/suppliers/${supplierId}/reviews/${reviewId}/documents/${documentId}`);
};

/* CHANGES (6.3) */

export const getChanges = async (): Promise<ChangeResponse[]> => {
  const res = await api.get("/changes");
  return res.data;
};

export const getChangesByYear = async (year: number): Promise<ChangeResponse[]> => {
  const res = await api.get(`/changes/year/${year}`);
  return res.data;
};

export const createChange = async (data: ChangeRequest): Promise<ChangeResponse> => {
  const res = await api.post("/changes", data);
  return res.data;
};

export const updateChange = async (id: number, data: ChangeRequest): Promise<ChangeResponse> => {
  const res = await api.put(`/changes/${id}`, data);
  return res.data;
};

export const patchChange = async (id: number, data: ChangeRequest): Promise<ChangeResponse> => {
  const res = await api.patch(`/changes/${id}`, data);
  return res.data;
};

export const deleteChange = async (id: number): Promise<void> => {
  await api.delete(`/changes/${id}`);
};

/* INTERESTED PARTIES (4.2) */

export const getInterestedPartiesByYear = async (yearId: number): Promise<InterestedPartyResponse[]> => {
  const res = await api.get(`/interested-parties/year/${yearId}`);
  return res.data;
};

export const getInterestedParty = async (id: number): Promise<InterestedPartyResponse> => {
  const res = await api.get(`/interested-parties/${id}`);
  return res.data;
};

export const createInterestedParty = async (data: CreateInterestedPartyRequest): Promise<InterestedPartyResponse> => {
  const res = await api.post("/interested-parties", data);
  return res.data;
};

export const updateInterestedParty = async (id: number, data: UpdateInterestedPartyRequest): Promise<InterestedPartyResponse> => {
  const res = await api.put(`/interested-parties/${id}`, data);
  return res.data;
};

export const deleteInterestedParty = async (id: number): Promise<void> => {
  await api.delete(`/interested-parties/${id}`);
};

export const associateInterestedPartyYears = async (id: number, yearIds: number[]): Promise<void> => {
  await api.put(`/interested-parties/${id}/years/associate`, { yearIds });
};

export const associateInterestedPartyYearsFull = async (id: number, yearIds: number[]): Promise<void> => {
  await api.put(`/interested-parties/${id}/years/associate/full`, { yearIds });
};

export const disassociateInterestedPartyYears = async (id: number, yearIds: number[]): Promise<void> => {
  await api.put(`/interested-parties/${id}/years/disassociate`, { yearIds });
};

export const associateInterestedPartyProcesses = async (interestedPartyYearId: number, processYearIds: number[]): Promise<void> => {
  await api.put(`/interested-parties/${interestedPartyYearId}/processes/associate`, { processesIds: processYearIds });
};

export const disassociateInterestedPartyProcesses = async (interestedPartyYearId: number, processYearIds: number[]): Promise<void> => {
  await api.put(`/interested-parties/${interestedPartyYearId}/processes/disassociate`, { processesIds: processYearIds });
};

export const getProcessOptionsByYear = async (yearId: number): Promise<ProcessOptionResponse[]> => {
  const res = await api.get(`/processes/options`, { params: { yearId } });
  return res.data;
};

export const uploadInterestedPartyEvidence = async (
  interestedPartyYearId: number,
  file: File,
  uploadedById: number,
): Promise<void> => {
  const formData = new FormData();
  const data = JSON.stringify({
    documentId: null,
    versioned: false,
    version: 1,
    requiresApproval: false,
    uploadedById,
  });
  formData.append("data", new Blob([data], { type: "application/json" }));
  formData.append("file", file);
  await api.post(`/interested-parties/${interestedPartyYearId}/document`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/* SWOT ANALYSIS (4.1) */

export const getSwotAnalysis = async (): Promise<SwotAnalysisResponse> => {
  const res = await api.get("/swot-analysis");
  return res.data;
};

export const updateSwotAnalysis = async (description: string): Promise<SwotAnalysisResponse> => {
  const res = await api.patch("/swot-analysis", { description });
  return res.data;
};

export const getSwotYearDetail = async (yearId: number): Promise<SwotYearDetail> => {
  const res = await api.get(`/swot-analysis/year/${yearId}`);
  return res.data;
};

export const createSwotItem = async (data: CreateSwotItemRequest): Promise<SwotItemResponse> => {
  const res = await api.post("/swot-analysis/items", data);
  return res.data;
};

export const updateSwotItem = async (itemId: number, text: string): Promise<SwotItemResponse> => {
  const res = await api.patch(`/swot-analysis/items/${itemId}`, { text });
  return res.data;
};

export const deleteSwotItem = async (itemId: number): Promise<void> => {
  await api.delete(`/swot-analysis/items/${itemId}`);
};

export const uploadSwotDocument = async (file: File, uploadedById: number): Promise<void> => {
  const formData = new FormData();
  const data = JSON.stringify({
    documentId: null,
    versioned: false,
    version: 1,
    requiresApproval: false,
    uploadedById,
  });
  formData.append("data", new Blob([data], { type: "application/json" }));
  formData.append("file", file);
  await api.post("/swot-analysis/documents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteSwotDocument = async (documentId: number): Promise<void> => {
  await api.delete(`/swot-analysis/documents/${documentId}`);
};

/* NON-CONFORMITIES (10.2) */

export const getNonConformitiesByYear = async (yearId: number): Promise<NonConformityResponse[]> => {
  const res = await api.get(`/non-conformities/year/${yearId}`);
  return res.data;
};

export const createNonConformity = async (data: CreateNonConformityRequest): Promise<NonConformityResponse> => {
  const res = await api.post("/non-conformities", data);
  return res.data;
};

export const updateNonConformity = async (id: number, data: UpdateNonConformityRequest): Promise<NonConformityResponse> => {
  const res = await api.patch(`/non-conformities/${id}`, data);
  return res.data;
};

export const deleteNonConformity = async (id: number): Promise<void> => {
  await api.delete(`/non-conformities/${id}`);
};

export const createCorrectiveAction = async (
  nonConformityId: number,
  data: CreateCorrectiveActionRequest,
): Promise<CorrectiveActionResponse> => {
  const res = await api.post(`/non-conformities/${nonConformityId}/corrective-actions`, data);
  return res.data;
};

export const updateCorrectiveAction = async (
  nonConformityId: number,
  actionId: number,
  data: UpdateCorrectiveActionRequest,
): Promise<CorrectiveActionResponse> => {
  const res = await api.patch(`/non-conformities/${nonConformityId}/corrective-actions/${actionId}`, data);
  return res.data;
};

export const deleteCorrectiveAction = async (nonConformityId: number, actionId: number): Promise<void> => {
  await api.delete(`/non-conformities/${nonConformityId}/corrective-actions/${actionId}`);
};

export const updateNonConformityYear = async (
  nonConformityId: number,
  yearId: number,
  data: UpdateNonConformityYearRequest,
): Promise<NonConformityYearResponse> => {
  const res = await api.patch(`/non-conformities/${nonConformityId}/years/${yearId}`, data);
  return res.data;
};

export const associateNonConformityYears = async (
  nonConformityId: number,
  associateYearIds: number[],
  disassociateYearIds: number[],
): Promise<NonConformityResponse> => {
  const res = await api.patch(`/non-conformities/${nonConformityId}/years`, {
    associateYearIds,
    disassociateYearIds,
  });
  return res.data;
};

export const uploadCorrectiveActionDocument = async (
  nonConformityId: number,
  actionId: number,
  file: File,
  uploadedById: number,
): Promise<CorrectiveActionResponse> => {
  const formData = new FormData();
  const data = JSON.stringify({
    documentId: null,
    versioned: false,
    version: 1,
    requiresApproval: false,
    uploadedById,
  });
  formData.append("data", new Blob([data], { type: "application/json" }));
  formData.append("file", file);
  const res = await api.post(
    `/non-conformities/${nonConformityId}/corrective-actions/${actionId}/documents`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
};

export const deleteCorrectiveActionDocument = async (
  nonConformityId: number,
  actionId: number,
  documentId: number,
): Promise<void> => {
  await api.delete(`/non-conformities/${nonConformityId}/corrective-actions/${actionId}/documents/${documentId}`);
};

/* IMPROVEMENT OPPORTUNITIES (10.3.1) */

export const getImprovementOpportunitiesByYear = async (yearId: number): Promise<ImprovementOpportunityResponse[]> => {
  const res = await api.get(`/improvement-opportunities/year/${yearId}`);
  return res.data;
};

export const createImprovementOpportunity = async (data: CreateImprovementOpportunityRequest): Promise<ImprovementOpportunityResponse> => {
  const res = await api.post("/improvement-opportunities", data);
  return res.data;
};

export const updateImprovementOpportunity = async (id: number, data: UpdateImprovementOpportunityRequest): Promise<ImprovementOpportunityResponse> => {
  const res = await api.patch(`/improvement-opportunities/${id}`, data);
  return res.data;
};

export const deleteImprovementOpportunity = async (id: number): Promise<void> => {
  await api.delete(`/improvement-opportunities/${id}`);
};

export const createImprovementAction = async (
  opportunityId: number,
  data: CreateImprovementActionRequest,
): Promise<ImprovementActionResponse> => {
  const res = await api.post(`/improvement-opportunities/${opportunityId}/improvement-actions`, data);
  return res.data;
};

export const updateImprovementAction = async (
  opportunityId: number,
  actionId: number,
  data: UpdateImprovementActionRequest,
): Promise<ImprovementActionResponse> => {
  const res = await api.patch(`/improvement-opportunities/${opportunityId}/improvement-actions/${actionId}`, data);
  return res.data;
};

export const deleteImprovementAction = async (opportunityId: number, actionId: number): Promise<void> => {
  await api.delete(`/improvement-opportunities/${opportunityId}/improvement-actions/${actionId}`);
};

export const updateImprovementOpportunityYear = async (
  opportunityId: number,
  yearId: number,
  data: UpdateImprovementOpportunityYearRequest,
): Promise<ImprovementOpportunityYearResponse> => {
  const res = await api.patch(`/improvement-opportunities/${opportunityId}/years/${yearId}`, data);
  return res.data;
};

export const associateImprovementOpportunityYears = async (
  opportunityId: number,
  associateYearIds: number[],
  disassociateYearIds: number[],
): Promise<ImprovementOpportunityResponse> => {
  const res = await api.patch(`/improvement-opportunities/${opportunityId}/years`, {
    associateYearIds,
    disassociateYearIds,
  });
  return res.data;
};

export const uploadImprovementActionDocument = async (
  opportunityId: number,
  actionId: number,
  file: File,
  uploadedById: number,
): Promise<ImprovementActionResponse> => {
  const formData = new FormData();
  const data = JSON.stringify({
    documentId: null,
    versioned: false,
    version: 1,
    requiresApproval: false,
    uploadedById,
  });
  formData.append("data", new Blob([data], { type: "application/json" }));
  formData.append("file", file);
  const res = await api.post(
    `/improvement-opportunities/${opportunityId}/improvement-actions/${actionId}/documents`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
};

export const deleteImprovementActionDocument = async (
  opportunityId: number,
  actionId: number,
  documentId: number,
): Promise<void> => {
  await api.delete(`/improvement-opportunities/${opportunityId}/improvement-actions/${actionId}/documents/${documentId}`);
};

export const updateSwotItemYears = async (
  itemId: number,
  associateYearIds: number[],
  disassociateYearIds: number[],
): Promise<SwotItemResponse> => {
  const res = await api.patch(`/swot-analysis/items/${itemId}/years`, {
    associateYearIds,
    disassociateYearIds,
  });
  return res.data;
};

/* RISKS & OPPORTUNITIES (6.1) */

export const getRiskOpportunitiesByYear = async (yearId: number): Promise<RiskOpportunityGroupedResponse> => {
  const res = await api.get(`/risk-opportunities/year/${yearId}`);
  return res.data;
};

export const createRiskOpportunity = async (data: CreateRiskOpportunityRequest): Promise<void> => {
  await api.post("/risk-opportunities", data);
};

export const updateRiskOpportunity = async (id: number, data: UpdateRiskOpportunityRequest): Promise<void> => {
  await api.patch(`/risk-opportunities/${id}`, data);
};

export const deleteRiskOpportunity = async (id: number): Promise<void> => {
  await api.delete(`/risk-opportunities/${id}`);
};

export const associateRiskOpportunityYears = async (
  id: number,
  yearIds: number[],
  copyAttributes: boolean,
  copyProcesses: boolean,
): Promise<void> => {
  await api.post(`/risk-opportunities/${id}/years/associate`, { yearIds, copyAttributes, copyProcesses });
};

export const associateRiskProcesses = async (
  riskOpportunityYearId: number,
  processIds: number[],
): Promise<void> => {
  await api.post(`/risk-opportunities/${riskOpportunityYearId}/processes`, { processIds });
};

export const disassociateRiskProcesses = async (
  riskOpportunityYearId: number,
  processIds: number[],
): Promise<void> => {
  await api.delete(`/risk-opportunities/${riskOpportunityYearId}/processes`, { data: { processIds } });
};

export const getRiskOpportunityYears = async (id: number): Promise<YearResponse[]> => {
  const res = await api.get(`/risk-opportunities/${id}/years`);
  return res.data;
};

export const disassociateRiskOpportunityYears = async (id: number, yearIds: number[]): Promise<void> => {
  await api.post(`/risk-opportunities/${id}/years/disassociate`, yearIds);
};

/* USERS */

export const getUsers = async (): Promise<UserManagementResponse[]> => {
  const res = await api.get("/users");
  return res.data;
};

export const updateUserRoles = async (id: number, roles: string[]): Promise<UserManagementResponse> => {
  const res = await api.patch(`/users/${id}/roles`, roles);
  return res.data;
};

export const getDepartments = async (): Promise<DepartmentResponse[]> => {
  const res = await api.get("/departments");
  return res.data;
};

export const createDepartment = async (data: { name: string }): Promise<DepartmentResponse> => {
  const res = await api.post("/departments", data);
  return res.data;
};

export const updateDepartment = async (id: number, data: { name: string }): Promise<DepartmentResponse> => {
  const res = await api.put(`/departments/${id}`, data);
  return res.data;
};

export const deleteDepartment = async (id: number) => {
  await api.delete(`/departments/${id}`);
};

export const addDepartmentUser = async (departmentId: number, userId: number) => {
  await api.post(`/departments/${departmentId}/users/${userId}`);
};

export const removeDepartmentUser = async (departmentId: number, userId: number) => {
  await api.delete(`/departments/${departmentId}/users/${userId}`);
};

export const getDepartmentUsers = async (departmentId: number): Promise<UserSummary[]> => {
  const res = await api.get(`/departments/${departmentId}/users`);
  return res.data;
};

/* QUALITY OBJECTIVES (6.2) */

export const getQualityObjectivesByYear = async (yearId: number): Promise<QualityObjectiveResponse[]> => {
  const res = await api.get(`/quality-objectives/year/${yearId}`);
  return res.data;
};

export const createQualityObjective = async (data: CreateQualityObjectiveRequest): Promise<void> => {
  await api.post("/quality-objectives", data);
};

export const updateQualityObjective = async (id: number, data: UpdateQualityObjectiveRequest): Promise<void> => {
  await api.patch(`/quality-objectives/${id}`, data);
};

export const deleteQualityObjective = async (id: number): Promise<void> => {
  await api.delete(`/quality-objectives/${id}`);
};

export const deleteQualityObjectiveFromYear = async (id: number, yearId: number): Promise<void> => {
  await api.delete(`/quality-objectives/${id}/years/${yearId}`);
};

export const associateQualityObjectiveYears = async (id: number, data: AssociateQualityObjectiveYearsRequest): Promise<void> => {
  await api.post(`/quality-objectives/${id}/years`, data);
};

export const associateQualityObjectiveProcesses = async (
  qualityObjectiveYearId: number,
  processIds: number[],
): Promise<void> => {
  await api.post(`/quality-objectives/${qualityObjectiveYearId}/processes`, processIds);
};

export const disassociateQualityObjectiveProcesses = async (
  qualityObjectiveYearId: number,
  processIds: number[],
): Promise<void> => {
  await api.delete(`/quality-objectives/${qualityObjectiveYearId}/processes`, { data: processIds });
};

/* COMMUNICATION (7.4) */

export const getCommunicationByYear = async (yearId: number): Promise<CommunicationResponse> => {
  const res = await api.get(`/communication/year/${yearId}`);
  return res.data;
};

export const updateCommunication = async (data: UpdateCommunicationRequest): Promise<void> => {
  await api.patch("/communication", data);
};

export const addCommunicationItem = async (data: CreateCommunicationItemRequest): Promise<void> => {
  await api.post("/communication/items", data);
};

export const updateCommunicationItem = async (itemId: number, data: UpdateCommunicationItemRequest): Promise<void> => {
  await api.patch(`/communication/items/${itemId}`, data);
};

export const deleteCommunicationItem = async (itemId: number): Promise<void> => {
  await api.delete(`/communication/items/${itemId}`);
};

export const associateCommunicationItemYear = async (itemId: number, yearId: number): Promise<void> => {
  await api.post(`/communication/items/${itemId}/years/${yearId}`);
};

export const disassociateCommunicationItemYear = async (itemId: number, yearId: number): Promise<void> => {
  await api.delete(`/communication/items/${itemId}/years/${yearId}`);
};

/* HUMAN RESOURCES & COMPETENCIES (7.2) */

export const getHumanResourcesByYear = async (yearId: number): Promise<HumanResourceResponse[]> => {
  const res = await api.get(`/human-resources/year/${yearId}`);
  return res.data;
};

export const createHumanResource = async (data: CreateHumanResourceRequest): Promise<void> => {
  await api.post("/human-resources", data);
};

export const updateHumanResource = async (id: number, data: UpdateHumanResourceRequest): Promise<void> => {
  await api.patch(`/human-resources/${id}`, data);
};

export const deleteHumanResource = async (id: number): Promise<void> => {
  await api.delete(`/human-resources/${id}`);
};

export const createCompetency = async (
  hryId: number,
  name: string,
  details: string,
  file?: File | null,
  uploadedById?: number,
): Promise<HumanResourceResponse> => {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("details", details);
  if (file) {
    const data = JSON.stringify({
      documentId: null,
      versioned: false,
      version: 1,
      requiresApproval: false,
      uploadedById,
    });
    formData.append("data", new Blob([data], { type: "application/json" }));
    formData.append("file", file);
  }
  const res = await api.post(`/human-resources/${hryId}/competencies`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const associateHumanResourceYears = async (id: number, yearIds: number[]): Promise<void> => {
  await api.post(`/human-resources/${id}/years`, yearIds);
};

export const deleteHumanResourceFromYear = async (id: number, yearId: number): Promise<void> => {
  await api.delete(`/human-resources/${id}/years/${yearId}`);
};

/* INFRASTRUCTURE (7.1.3) */

export const getInfrastructuresByYear = async (yearId: number): Promise<InfrastructureResponse[]> => {
  const res = await api.get(`/infrastructures/year/${yearId}`);
  return res.data;
};

export const createInfrastructure = async (data: CreateInfrastructureRequest): Promise<void> => {
  await api.post("/infrastructures", data);
};

export const updateInfrastructure = async (id: number, data: UpdateInfrastructureRequest): Promise<void> => {
  await api.patch(`/infrastructures/${id}`, data);
};

export const deleteInfrastructure = async (id: number): Promise<void> => {
  await api.delete(`/infrastructures/${id}`);
};

export const deleteInfrastructureFromYear = async (id: number, yearId: number): Promise<void> => {
  await api.delete(`/infrastructures/${id}/years/${yearId}`);
};

export const associateInfrastructureYears = async (id: number, yearIds: number[], isActive: boolean): Promise<void> => {
  await api.post(`/infrastructures/${id}/years`, yearIds, { params: { isActive } });
};

/* EQUIPMENT (7.1.5) */

export const getEquipmentByYear = async (yearId: number): Promise<EquipmentResponse[]> => {
  const res = await api.get(`/equipments/year/${yearId}`);
  return res.data;
};

export const createEquipment = async (data: CreateEquipmentRequest): Promise<void> => {
  await api.post("/equipments", data);
};

export const updateEquipment = async (id: number, data: UpdateEquipmentRequest): Promise<void> => {
  await api.patch(`/equipments/${id}`, data);
};

export const deleteEquipment = async (id: number): Promise<void> => {
  await api.delete(`/equipments/${id}`);
};

export const deleteEquipmentFromYear = async (id: number, yearId: number): Promise<void> => {
  await api.delete(`/equipments/${id}/years/${yearId}`);
};

export const associateEquipmentYears = async (id: number, yearIds: number[], isActive: boolean): Promise<void> => {
  await api.post(`/equipments/${id}/years`, yearIds, { params: { isActive } });
};

export const addMaintenanceRecord = async (equipmentId: number, data: CreateMaintenanceRecordRequest): Promise<void> => {
  await api.post(`/equipments/${equipmentId}/maintenance`, data);
};

export const getMaintenanceRecords = async (equipmentId: number): Promise<MaintenanceRecordResponse[]> => {
  const res = await api.get(`/equipments/${equipmentId}/maintenance`);
  return res.data;
};

export const deleteMaintenanceRecord = async (equipmentId: number, recordId: number): Promise<void> => {
  await api.delete(`/equipments/${equipmentId}/maintenance/${recordId}`);
};

export const addCalibrationRecord = async (equipmentId: number, data: CreateCalibrationRecordRequest): Promise<void> => {
  await api.post(`/equipments/${equipmentId}/calibration`, data);
};

export const getCalibrationRecords = async (equipmentId: number): Promise<CalibrationRecordResponse[]> => {
  const res = await api.get(`/equipments/${equipmentId}/calibration`);
  return res.data;
};

export const deleteCalibrationRecord = async (equipmentId: number, recordId: number): Promise<void> => {
  await api.delete(`/equipments/${equipmentId}/calibration/${recordId}`);
};

export interface GetLogsParams {
  entityType?: string;
  entityTypes?: string[];
  baseEntityId?: number;
  entityYearId?: number;
  yearId?: number;
  action?: string;
  page?: number;
  size?: number;
}

export interface LogPageResponse {
  content: import("@/types").LogResponse[];
  page?: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
}

export const getLogs = async (params: GetLogsParams): Promise<LogPageResponse> => {
  const searchParams = new URLSearchParams();
  if (params.entityType) searchParams.set("entityType", params.entityType);
  if (params.entityTypes) {
    for (const et of params.entityTypes) searchParams.append("entityTypes", et);
  }
  if (params.baseEntityId != null) searchParams.set("baseEntityId", String(params.baseEntityId));
  if (params.entityYearId != null) searchParams.set("entityYearId", String(params.entityYearId));
  if (params.yearId != null) searchParams.set("yearId", String(params.yearId));
  if (params.action) searchParams.set("action", params.action);
  if (params.page != null) searchParams.set("page", String(params.page));
  if (params.size != null) searchParams.set("size", String(params.size));
  const res = await api.get(`/logs?${searchParams.toString()}`);
  return res.data;
};

/* ─── AUDITS (9.2) ─── */

export const getAuditsByYear = async (yearId: number): Promise<AuditResponse[]> => {
  const res = await api.get(`/audits/year/${yearId}`);
  return res.data;
};

export const createAudit = async (data: CreateAuditRequest): Promise<AuditResponse> => {
  const res = await api.post("/audits", data);
  return res.data;
};

export const updateAudit = async (id: number, data: UpdateAuditRequest): Promise<AuditResponse> => {
  const res = await api.patch(`/audits/${id}`, data);
  return res.data;
};

export const deleteAudit = async (id: number): Promise<void> => {
  await api.delete(`/audits/${id}`);
};

export const uploadAuditDocument = async (
  id: number,
  file: File,
  uploadedById: number,
): Promise<AuditResponse> => {
  const formData = new FormData();
  const data = JSON.stringify({ documentId: null, versioned: false, version: 1, requiresApproval: false, uploadedById });
  formData.append("data", new Blob([data], { type: "application/json" }));
  formData.append("file", file);
  const res = await api.post(`/audits/${id}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteAuditDocument = async (id: number, documentId: number): Promise<void> => {
  await api.delete(`/audits/${id}/documents/${documentId}`);
};

export const createExternalUser = async (data: CreateExternalUserRequest): Promise<{ id: number; email: string }> => {
  const res = await api.post("/users/external", data);
  return res.data;
};

export const getExternalUsersByYear = async (yearId: number): Promise<ExternalUserResponse[]> => {
  const res = await api.get("/users/external", { params: { yearId } });
  return res.data;
};

export const getMyYears = async (): Promise<YearResponse[]> => {
  const res = await api.get("/users/me/years");
  return res.data;
};


