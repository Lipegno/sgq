import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User2,
  Building2,
  Zap,
  Plus,
  Search,
  Users,
  User,
  Briefcase,
  Award,
  Trash2,
  CalendarDays,
  Pencil,
  Activity,
  Wrench,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  getYears,
  getHumanResourcesByYear,
  createHumanResource,
  updateHumanResource,
  deleteHumanResource,
  associateHumanResourceYears,
  deleteHumanResourceFromYear,
  getInfrastructuresByYear,
  createInfrastructure,
  updateInfrastructure,
  deleteInfrastructure,
  deleteInfrastructureFromYear,
  associateInfrastructureYears,
  getEquipmentByYear,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  deleteEquipmentFromYear,
  associateEquipmentYears,
  addMaintenanceRecord,
  deleteMaintenanceRecord,
  addCalibrationRecord,
  deleteCalibrationRecord,
  createCompetency,
} from "@/api/core";
import { YearSelector } from "@/components/year-selector";
import YearAssociationDialog from "@/components/year-association-dialog";
import ConfirmDialog from "@/components/confirm-dialog";
import { LogDialog } from "@/components/log-dialog";
import { useAuth } from "@/context/auth-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDepartments } from "@/api/core";
import type {
  HumanResourceResponse,
  CreateHumanResourceRequest,
  InfrastructureResponse,
  CreateInfrastructureRequest,
  EquipmentResponse,
  CreateEquipmentRequest,
  CreateMaintenanceRecordRequest,
  CreateCalibrationRecordRequest,
  DepartmentResponse,
  EntityType,
} from "@/types";

type ResourceTab = "pessoas" | "infraestruturas" | "emm";

const TABS: { key: ResourceTab; label: string; icon: typeof Users }[] = [
  { key: "pessoas", label: "7.1.2. Pessoas", icon: User2 },
  { key: "infraestruturas", label: "7.1.3. Infraestruturas", icon: Building2 },
  { key: "emm", label: "7.1.5. EMM", icon: Zap },
];

export default function ResourcesPage() {
  const queryClient = useQueryClient();
  const { isExternal } = useAuth();

  const [activeTab, setActiveTab] = useState<ResourceTab>("pessoas");
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
  });
  const departments = departmentsQuery.data ?? [];

  /* ---- Pessoas state ---- */
  const [searchQuery, setSearchQuery] = useState("");
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [editPersonId, setEditPersonId] = useState<number | null>(null);
  const [personForm, setPersonForm] = useState<CreateHumanResourceRequest>({
    name: "",
    function: "",
    department: "",
    yearIds: [],
  });
  const [personIsActive, setPersonIsActive] = useState(true);
  const [initialPersonForm, setInitialPersonForm] = useState<{ name: string; function: string; department: string; isActive: boolean } | null>(null);
  const [personDeptIsCustom, setPersonDeptIsCustom] = useState(false);
  const [isSubmittingPerson, setIsSubmittingPerson] = useState(false);
  const [confirmDeletePersonId, setConfirmDeletePersonId] = useState<number | null>(null);
  const [yearDialogPersonId, setYearDialogPersonId] = useState<number | null>(null);

  /* ---- Infraestruturas state ---- */
  const [infraSearchQuery, setInfraSearchQuery] = useState("");
  const [infraModalOpen, setInfraModalOpen] = useState(false);
  const [editInfraId, setEditInfraId] = useState<number | null>(null);
  const [infraForm, setInfraForm] = useState<CreateInfrastructureRequest>({
    name: "",
    type: "",
    location: "",
    maintenance: "",
    isActive: true,
    yearIds: [],
  });
  const [isSubmittingInfra, setIsSubmittingInfra] = useState(false);
  const [initialInfraForm, setInitialInfraForm] = useState<{ name: string; type: string; location: string; maintenance: string; isActive: boolean } | null>(null);
  const [confirmDeleteInfraId, setConfirmDeleteInfraId] = useState<number | null>(null);
  const [yearDialogInfraId, setYearDialogInfraId] = useState<number | null>(null);

  /* ---- EMM state ---- */
  const [equipSearchQuery, setEquipSearchQuery] = useState("");
  const [equipCreateModalOpen, setEquipCreateModalOpen] = useState(false);
  const [equipCreateForm, setEquipCreateForm] = useState<CreateEquipmentRequest>({
    name: "",
    type: "",
    location: "",
    isActive: true,
    yearIds: [],
  });
  const [equipDetailForm, setEquipDetailForm] = useState({ name: "", type: "", location: "", isActive: true });
  const [initialEquipDetailForm, setInitialEquipDetailForm] = useState<{ name: string; type: string; location: string; isActive: boolean } | null>(null);
  const [confirmDeleteEquipId, setConfirmDeleteEquipId] = useState<number | null>(null);
  const [yearDialogEquipId, setYearDialogEquipId] = useState<number | null>(null);
  const [maintModalForEquipId, setMaintModalForEquipId] = useState<number | null>(null);
  const [maintForm, setMaintForm] = useState<CreateMaintenanceRecordRequest>({
    date: "",
    type: "",
    performedBy: "",
    description: "",
  });
  const [calModalForEquipId, setCalModalForEquipId] = useState<number | null>(null);
  const [calForm, setCalForm] = useState<CreateCalibrationRecordRequest>({
    date: "",
    performedBy: "",
    result: "",
    description: "",
  });
  const [selectedEquipId, setSelectedEquipId] = useState<number | null>(null);
  const [equipDetailOpen, setEquipDetailOpen] = useState(false);

  const [pageLogOpen, setPageLogOpen] = useState(false);
  const [itemLogOpen, setItemLogOpen] = useState(false);
  const [itemLogEntityId, setItemLogEntityId] = useState<number | null>(null);

  const pageEntityTypes: EntityType[] = activeTab === "pessoas"
    ? ["HUMAN_RESOURCE", "COMPETENCY"]
    : activeTab === "infraestruturas"
      ? ["INFRASTRUCTURE"]
      : ["EQUIPMENT", "MAINTENANCE_RECORD", "CALIBRATION_RECORD"];

  const { data: years } = useQuery({ queryKey: ["years"], queryFn: getYears });
  const effectiveYearId = selectedYearId;

  useEffect(() => {
    if (selectedYearId !== null) return;
    if (!years || years.length === 0) return;
    const currentYearVal = new Date().getFullYear();
    const match = years.find(y => y.year === currentYearVal) ?? years[0];
    setSelectedYearId(match.id);
  }, [selectedYearId, years]);

  /* ---- Pessoas data ---- */
  const { data: people, isLoading: peopleLoading } = useQuery({
    queryKey: ["human-resources", effectiveYearId],
    queryFn: () => getHumanResourcesByYear(effectiveYearId!),
    enabled: effectiveYearId !== null,
  });

  /* ---- Infraestruturas data ---- */
  const { data: infrastructures, isLoading: infraLoading } = useQuery({
    queryKey: ["infrastructures", effectiveYearId],
    queryFn: () => getInfrastructuresByYear(effectiveYearId!),
    enabled: effectiveYearId !== null,
  });

  const filteredInfras = useMemo(() => {
    if (!infrastructures) return [];
    if (!infraSearchQuery.trim()) return infrastructures;
    const q = infraSearchQuery.toLowerCase();
    return infrastructures.filter(
      i =>
        i.name.toLowerCase().includes(q) ||
        i.type.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q)
    );
  }, [infrastructures, infraSearchQuery]);

  const yearDialogInfra = useMemo(() => {
    if (yearDialogInfraId === null || !infrastructures) return null;
    return infrastructures.find(i => i.id === yearDialogInfraId) ?? null;
  }, [yearDialogInfraId, infrastructures]);

  /* ---- EMM data ---- */
  const { data: equipment, isLoading: equipLoading } = useQuery({
    queryKey: ["equipment", effectiveYearId],
    queryFn: () => getEquipmentByYear(effectiveYearId!),
    enabled: effectiveYearId !== null,
  });

  const filteredEquip = useMemo(() => {
    if (!equipment) return [];
    if (!equipSearchQuery.trim()) return equipment;
    const q = equipSearchQuery.toLowerCase();
    return equipment.filter(
      e =>
        e.name.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q)
    );
  }, [equipment, equipSearchQuery]);

  const yearDialogEquip = useMemo(() => {
    if (yearDialogEquipId === null || !equipment) return null;
    return equipment.find(e => e.id === yearDialogEquipId) ?? null;
  }, [yearDialogEquipId, equipment]);

  const equipStats = useMemo(() => {
    if (!equipment) return { total: 0, active: 0, maintCount: 0, calCount: 0 };
    return {
      total: equipment.length,
      active: equipment.filter((e) => e.isActive).length,
      maintCount: equipment.reduce((acc, e) => acc + (e.maintenanceHistory?.length ?? 0), 0),
      calCount: equipment.reduce((acc, e) => acc + (e.calibrationHistory?.length ?? 0), 0),
    };
  }, [equipment]);

  const selectedEquip = useMemo(() => {
    if (selectedEquipId === null || !equipment) return null;
    return equipment.find(e => e.id === selectedEquipId) ?? null;
  }, [selectedEquipId, equipment]);

  useEffect(() => {
    if (selectedEquip) {
      const form = { name: selectedEquip.name, type: selectedEquip.type, location: selectedEquip.location, isActive: selectedEquip.isActive };
      setEquipDetailForm(form);
      setInitialEquipDetailForm(form);
    }
  }, [selectedEquip]);

  const filteredPeople = useMemo(() => {
    if (!people) return [];
    if (!searchQuery.trim()) return people;
    const q = searchQuery.toLowerCase();
    return people.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.function.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q)
    );
  }, [people, searchQuery]);

  const yearDialogPerson = useMemo(() => {
    if (yearDialogPersonId === null || !people) return null;
    return people.find(p => p.id === yearDialogPersonId) ?? null;
  }, [yearDialogPersonId, people]);

  /* ---- Mutations: Pessoas ---- */
  const createPersonMutation = useMutation({
    mutationFn: (data: CreateHumanResourceRequest) => createHumanResource(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["human-resources"] });
      toast.success("Pessoa adicionada.");
      closePersonModal();
    },
    onError: () => toast.error("Erro ao adicionar pessoa."),
  });

  const updatePersonMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateHumanResource>[1] }) =>
      updateHumanResource(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["human-resources"] });
      toast.success("Pessoa atualizada.");
      closePersonModal();
    },
    onError: () => toast.error("Erro ao atualizar pessoa."),
  });

  const deletePersonMutation = useMutation({
    mutationFn: (id: number) => deleteHumanResource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["human-resources"] });
      toast.success("Pessoa eliminada.");
    },
    onError: () => toast.error("Erro ao eliminar pessoa."),
  });

  const associateYearsMutation = useMutation({
    mutationFn: ({ id, yearIds }: { id: number; yearIds: number[] }) =>
      associateHumanResourceYears(id, yearIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["human-resources"] });
    },
    onError: () => toast.error("Erro ao associar anos."),
  });

  const [newCompName, setNewCompName] = useState("");
  const [newCompDetails, setNewCompDetails] = useState("");

  const createCompMutation = useMutation({
    mutationFn: ({ hryId, name, details }: { hryId: number; name: string; details: string }) =>
      createCompetency(hryId, name, details),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["human-resources"] });
      toast.success("Competência adicionada.");
      setNewCompName("");
      setNewCompDetails("");
    },
    onError: () => toast.error("Erro ao adicionar competência."),
  });

  /* ---- Mutations: Infraestruturas ---- */
  const createInfraMutation = useMutation({
    mutationFn: (data: CreateInfrastructureRequest) => createInfrastructure(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["infrastructures"] });
      toast.success("Infraestrutura adicionada.");
      closeInfraModal();
    },
    onError: () => toast.error("Erro ao adicionar infraestrutura."),
  });

  const updateInfraMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateInfrastructure>[1] }) =>
      updateInfrastructure(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["infrastructures"] });
      toast.success("Infraestrutura atualizada.");
      closeInfraModal();
    },
    onError: () => toast.error("Erro ao atualizar infraestrutura."),
  });

  const deleteInfraMutation = useMutation({
    mutationFn: (id: number) => deleteInfrastructure(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["infrastructures"] });
      toast.success("Infraestrutura eliminada.");
    },
    onError: () => toast.error("Erro ao eliminar infraestrutura."),
  });

  const associateInfraYearsMutation = useMutation({
    mutationFn: ({ id, yearIds }: { id: number; yearIds: number[] }) =>
      associateInfrastructureYears(id, yearIds, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["infrastructures"] });
    },
    onError: () => toast.error("Erro ao associar anos."),
  });

  /* ---- Mutations: EMM ---- */
  const createEquipMutation = useMutation({
    mutationFn: (data: CreateEquipmentRequest) => createEquipment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success("Equipamento adicionado.");
      setEquipCreateModalOpen(false);
      setEquipCreateForm({ name: "", type: "", location: "", isActive: true, yearIds: [] });
    },
    onError: () => toast.error("Erro ao adicionar equipamento."),
  });

  const updateEquipMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateEquipment>[1] }) =>
      updateEquipment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success("Equipamento atualizado.");
    },
    onError: () => toast.error("Erro ao atualizar equipamento."),
  });

  const deleteEquipMutation = useMutation({
    mutationFn: (id: number) => deleteEquipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success("Equipamento eliminado.");
    },
    onError: () => toast.error("Erro ao eliminar equipamento."),
  });

  const associateEquipYearsMutation = useMutation({
    mutationFn: ({ id, yearIds }: { id: number; yearIds: number[] }) =>
      associateEquipmentYears(id, yearIds, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
    },
    onError: () => toast.error("Erro ao associar anos."),
  });

  const addMaintMutation = useMutation({
    mutationFn: ({ equipId, data }: { equipId: number; data: CreateMaintenanceRecordRequest }) =>
      addMaintenanceRecord(equipId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success("Registo de manutenção adicionado.");
      setMaintModalForEquipId(null);
      setMaintForm({ date: "", type: "", performedBy: "", description: "" });
    },
    onError: () => toast.error("Erro ao adicionar registo de manutenção."),
  });

  const delMaintMutation = useMutation({
    mutationFn: ({ equipId, recordId }: { equipId: number; recordId: number }) =>
      deleteMaintenanceRecord(equipId, recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success("Registo de manutenção eliminado.");
    },
    onError: () => toast.error("Erro ao eliminar registo de manutenção."),
  });

  const addCalMutation = useMutation({
    mutationFn: ({ equipId, data }: { equipId: number; data: CreateCalibrationRecordRequest }) =>
      addCalibrationRecord(equipId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success("Registo de calibração adicionado.");
      setCalModalForEquipId(null);
      setCalForm({ date: "", performedBy: "", result: "", description: "" });
    },
    onError: () => toast.error("Erro ao adicionar registo de calibração."),
  });

  const delCalMutation = useMutation({
    mutationFn: ({ equipId, recordId }: { equipId: number; recordId: number }) =>
      deleteCalibrationRecord(equipId, recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success("Registo de calibração eliminado.");
    },
    onError: () => toast.error("Erro ao eliminar registo de calibração."),
  });

  function openPersonModal(person?: HumanResourceResponse) {
    if (person) {
      setEditPersonId(person.id);
      setPersonForm({
        name: person.name,
        function: person.function,
        department: person.department,
        yearIds: [],
      });
      setPersonIsActive(person.isActive);
      setInitialPersonForm({ name: person.name, function: person.function, department: person.department, isActive: person.isActive });
      setPersonDeptIsCustom(person.department ? !departments.some(d => d.name === person.department) : false);
    } else {
      setEditPersonId(null);
      setPersonForm({ name: "", function: "", department: "", yearIds: [] });
      setPersonIsActive(true);
      setInitialPersonForm(null);
      setPersonDeptIsCustom(false);
    }
    setPersonModalOpen(true);
  }

  function closePersonModal() {
    setPersonModalOpen(false);
    setEditPersonId(null);
    setPersonIsActive(true);
    setNewCompName("");
    setNewCompDetails("");
    setPersonDeptIsCustom(false);
  }

  function handleSavePerson() {
    if (!personForm.name.trim() || isSubmittingPerson) return;
    if (editPersonId && initialPersonForm) {
      const nameChanged = personForm.name.trim() !== initialPersonForm.name;
      const funcChanged = personForm.function.trim() !== initialPersonForm.function;
      const deptChanged = personForm.department.trim() !== initialPersonForm.department;
      const activeChanged = personIsActive !== initialPersonForm.isActive;
      if (!nameChanged && !funcChanged && !deptChanged && !activeChanged) {
        closePersonModal();
        return;
      }
    }
    setIsSubmittingPerson(true);
    if (editPersonId) {
      updatePersonMutation.mutate(
        {
          id: editPersonId,
          data: {
            name: personForm.name.trim(),
            function: personForm.function.trim(),
            department: personForm.department.trim(),
            yearId: effectiveYearId ?? undefined,
            isActive: personIsActive,
          },
        },
        { onSettled: () => setIsSubmittingPerson(false) }
      );
    } else {
      createPersonMutation.mutate(
        {
          ...personForm,
          name: personForm.name.trim(),
          yearIds: effectiveYearId ? [effectiveYearId] : [],
        },
        { onSettled: () => setIsSubmittingPerson(false) }
      );
    }
  }

  function handleAssociateYears(yearId: number) {
    if (yearDialogPersonId === null) return;
    associateYearsMutation.mutate({ id: yearDialogPersonId, yearIds: [yearId] });
  }

  /* ---- Infraestruturas helpers ---- */
  function openInfraModal(item?: InfrastructureResponse) {
    if (item) {
      setEditInfraId(item.id);
      const form = { name: item.name, type: item.type, location: item.location, maintenance: item.maintenance, isActive: item.isActive, yearIds: [] as number[] };
      setInfraForm(form);
      setInitialInfraForm({ name: item.name, type: item.type, location: item.location, maintenance: item.maintenance, isActive: item.isActive });
    } else {
      setEditInfraId(null);
      setInfraForm({
        name: "",
        type: "",
        location: "",
        maintenance: "",
        isActive: true,
        yearIds: [],
      });
      setInitialInfraForm(null);
    }
    setInfraModalOpen(true);
  }

  function closeInfraModal() {
    setInfraModalOpen(false);
    setEditInfraId(null);
  }

  function handleSaveInfra() {
    if (!infraForm.name.trim() || isSubmittingInfra) return;
    if (editInfraId && initialInfraForm) {
      const nameChanged = infraForm.name.trim() !== initialInfraForm.name;
      const typeChanged = infraForm.type.trim() !== initialInfraForm.type;
      const locChanged = infraForm.location.trim() !== initialInfraForm.location;
      const maintChanged = infraForm.maintenance.trim() !== initialInfraForm.maintenance;
      if (!nameChanged && !typeChanged && !locChanged && !maintChanged) {
        closeInfraModal();
        return;
      }
    }
    setIsSubmittingInfra(true);
    if (editInfraId) {
      updateInfraMutation.mutate(
        {
          id: editInfraId,
          data: {
            name: infraForm.name.trim(),
            type: infraForm.type.trim(),
            location: infraForm.location.trim(),
            maintenance: infraForm.maintenance.trim(),
          },
        },
        { onSettled: () => setIsSubmittingInfra(false) }
      );
    } else {
      createInfraMutation.mutate(
        {
          ...infraForm,
          name: infraForm.name.trim(),
          yearIds: effectiveYearId ? [effectiveYearId] : [],
        },
        { onSettled: () => setIsSubmittingInfra(false) }
      );
    }
  }

  function handleInfraAssociateYears(yearId: number) {
    if (yearDialogInfraId === null) return;
    associateInfraYearsMutation.mutate({ id: yearDialogInfraId, yearIds: [yearId] });
  }

  function handleInfraDisassociateYears(yearId: number) {
    if (yearDialogInfraId === null) return;
    deleteInfrastructureFromYear(yearDialogInfraId, yearId)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["infrastructures"] });
        toast.success("Ano desassociado.");
      })
      .catch(() => toast.error("Erro ao desassociar ano."));
  }

  /* ---- EMM helpers ---- */
  function openEquipDetail(id: number) {
    setSelectedEquipId(id);
    const equip = equipment?.find(e => e.id === id);
    if (equip) {
      const form = { name: equip.name, type: equip.type, location: equip.location, isActive: equip.isActive };
      setEquipDetailForm(form);
      setInitialEquipDetailForm(form);
    }
    setEquipDetailOpen(true);
  }

  function handleSaveEquipDetail() {
    if (selectedEquipId === null) return;
    if (initialEquipDetailForm) {
      const nameChanged = equipDetailForm.name.trim() !== initialEquipDetailForm.name;
      const typeChanged = equipDetailForm.type.trim() !== initialEquipDetailForm.type;
      const locChanged = equipDetailForm.location.trim() !== initialEquipDetailForm.location;
      const activeChanged = equipDetailForm.isActive !== initialEquipDetailForm.isActive;
      if (!nameChanged && !typeChanged && !locChanged && !activeChanged) return;
    }
    updateEquipMutation.mutate({
      id: selectedEquipId,
      data: {
        name: equipDetailForm.name.trim(),
        type: equipDetailForm.type.trim(),
        location: equipDetailForm.location.trim(),
        isActive: equipDetailForm.isActive,
      },
    });
  }

  function handleEquipAssociateYears(yearId: number) {
    if (yearDialogEquipId === null) return;
    associateEquipYearsMutation.mutate({ id: yearDialogEquipId, yearIds: [yearId] });
  }

  function handleEquipDisassociateYears(yearId: number) {
    if (yearDialogEquipId === null) return;
    deleteEquipmentFromYear(yearDialogEquipId, yearId)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["equipment"] });
        toast.success("Ano desassociado.");
      })
      .catch(() => toast.error("Erro ao desassociar ano."));
  }

  function handleDisassociateYears(yearId: number) {
    if (yearDialogPersonId === null) return;
    deleteHumanResourceFromYear(yearDialogPersonId, yearId)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["human-resources"] });
        toast.success("Ano desassociado.");
      })
      .catch(() => toast.error("Erro ao desassociar ano."));
  }

  return (
    <div className="py-8 w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-sm">
            <Building2 size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Recursos</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Pessoas, infraestruturas e equipamentos de monitorização e medição
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPageLogOpen(true)}
            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
            title="Histórico de alterações"
          >
            <History size={20} />
          </button>
          <YearSelector selectedYearId={effectiveYearId} onYearChange={setSelectedYearId} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-xl w-fit mb-8">
        {TABS.map(tab => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                activeTab === tab.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TabIcon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ===================== PESSOAS ===================== */}
      {activeTab === "pessoas" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Pesquisar pessoas..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full text-foreground"
              />
            </div>
            {!isExternal && (
              <Button size="sm" onClick={() => openPersonModal()}>
                <Plus size={16} /> Adicionar Pessoa
              </Button>
            )}
          </div>

          {peopleLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-48 rounded-2xl" />
              ))}
            </div>
          ) : filteredPeople.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
              <Users size={32} className="text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-medium">
                {searchQuery ? "Nenhuma pessoa encontrada." : "Nenhuma pessoa registada."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPeople.map(person => (
                <div
                  key={person.id}
                  className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:border-primary/20 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                        <User size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-foreground">{person.name}</h3>
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                              person.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {person.isActive ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{person.function}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setItemLogEntityId(person.id); setItemLogOpen(true); }}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
                        title="Histórico"
                      >
                        <History size={14} />
                      </button>
                      {!isExternal && (
                        <button
                          onClick={() => openPersonModal(person)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {!isExternal && (
                        <button
                          onClick={() => setYearDialogPersonId(person.id)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
                          title="Gerir anos"
                        >
                          <CalendarDays size={14} />
                        </button>
                      )}
                      {!isExternal && (
                        <button
                          onClick={() => setConfirmDeletePersonId(person.id)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <Briefcase size={13} /> <span>{person.department || "Não Especificado"}</span>
                  </div>
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Award size={12} /> Competências
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {person.competencies.length > 0 ? (
                        person.competencies.map(comp => (
                          <span
                            key={comp.id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-primary/5 text-primary rounded-lg text-[10px] font-medium"
                          >
                            {comp.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Nenhuma competência registada.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================== INFRAESTRUTURAS ===================== */}
      {activeTab === "infraestruturas" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Pesquisar infraestruturas..."
                value={infraSearchQuery}
                onChange={e => setInfraSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full text-foreground"
              />
            </div>
            {!isExternal && (
              <Button size="sm" onClick={() => openInfraModal()}>
                <Plus size={16} /> Adicionar Infraestrutura
              </Button>
            )}
          </div>

          {infraLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-44 rounded-2xl" />
              ))}
            </div>
          ) : filteredInfras.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
              <Building2 size={32} className="text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-medium">
                {infraSearchQuery
                  ? "Nenhuma infraestrutura encontrada."
                  : "Nenhuma infraestrutura registada."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInfras.map(item => (
                <div
                  key={item.id}
                  className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:border-primary/20 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{item.name}</h3>
<p className="text-xs text-muted-foreground">{item.type}</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-1">
{!isExternal && (
                        <button
                          onClick={() => openInfraModal(item)}
                         className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
                         title="Editar"
                       >
                         <Pencil size={14} />
                       </button>
                     )}
                      {!isExternal && (
                        <button
                          onClick={() => setYearDialogInfraId(item.id)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
                          title="Gerir anos"
                        >
                          <CalendarDays size={14} />
                        </button>
                      )}
                      {!isExternal && (
                        <button
                          onClick={() => setConfirmDeleteInfraId(item.id)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span>📍 {item.location}</span>
                  </div>
                  {item.maintenance && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>🔧 {item.maintenance}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================== EMM ===================== */}
      {activeTab === "emm" && (
        <div className="space-y-8">
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <Zap size={20} />
                </div>
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Total</span>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{equipStats.total}</div>
              <p className="text-xs text-muted-foreground font-medium">Equipamentos registados</p>
            </div>
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-green-100 text-green-700 rounded-xl flex items-center justify-center">
                  <Zap size={20} />
                </div>
                <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Ativos</span>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{equipStats.active}</div>
              <p className="text-xs text-muted-foreground font-medium">Equipamentos ativos</p>
            </div>
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center">
                  <Wrench size={20} />
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Manutenção</span>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{equipStats.maintCount}</div>
              <p className="text-xs text-muted-foreground font-medium">Registos de manutenção</p>
            </div>
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
                  <Activity size={20} />
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Calibração</span>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{equipStats.calCount}</div>
              <p className="text-xs text-muted-foreground font-medium">Registos de calibração</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Pesquisar equipamentos..."
                value={equipSearchQuery}
                onChange={e => setEquipSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full text-foreground"
              />
            </div>
            {!isExternal && (
              <Button size="sm" onClick={() => { setEquipCreateForm({ name: "", type: "", location: "", isActive: true, yearIds: [] }); setEquipCreateModalOpen(true); }}>
                <Plus size={16} /> Adicionar Equipamento
              </Button>
            )}
          </div>

          {equipLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : filteredEquip.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
              <Zap size={32} className="text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-medium">
                {equipSearchQuery ? "Nenhum equipamento encontrado." : "Nenhum equipamento registado."}
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tipo / Localização</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Manutenção</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Calibração</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEquip.map(item => (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => openEquipDetail(item.id)}
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-foreground">{item.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs text-foreground font-medium">{item.type}</span>
                          <span className="text-[10px] text-muted-foreground">{item.location}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-foreground font-medium">{item.maintenanceHistory?.length ?? 0} registos</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-foreground font-medium">{item.calibrationHistory?.length ?? 0} registos</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          item.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {item.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setItemLogEntityId(item.id); setItemLogOpen(true); }}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer" title="Histórico">
                            <History size={14} />
                          </button>
{!isExternal && (
                           <button onClick={() => openEquipDetail(item.id)}
                             className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer" title="Editar">
                             <Pencil size={14} />
                           </button>
                         )}
                         {!isExternal && (
                           <button onClick={() => setYearDialogEquipId(item.id)}
                             className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer" title="Gerir anos">
                             <CalendarDays size={14} />
                           </button>
                         )}
                         {!isExternal && (
                           <button onClick={() => setConfirmDeleteEquipId(item.id)}
                             className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer" title="Eliminar">
                             <Trash2 size={14} />
                           </button>
                         )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pessoas Modals */}
      <Dialog
        open={personModalOpen}
        onOpenChange={o => {
          if (!o) closePersonModal();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isExternal && editPersonId ? "Detalhes da Pessoa" : editPersonId ? "Editar" : "Nova"} Pessoa</DialogTitle>
            <DialogDescription>{isExternal && editPersonId ? "Visualizar dados da pessoa." : "Registe os dados da pessoa."}</DialogDescription>
          </DialogHeader>
          {(() => { const ro = isExternal && editPersonId !== null; return (
          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label>Nome *</Label>
              {ro ? <p className="text-sm text-foreground py-2 px-1">{personForm.name || '-'}</p>
              : <input
                type="text"
                value={personForm.name}
                onChange={e => setPersonForm(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Nome"
              />}
            </div>
            <div className="grid gap-2">
              <Label>Função</Label>
              {ro ? <p className="text-sm text-foreground py-2 px-1">{personForm.function || '-'}</p>
              : <input
                type="text"
                value={personForm.function}
                onChange={e => setPersonForm(p => ({ ...p, function: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Ex: Gestor da Qualidade"
              />}
            </div>
            <div className="grid gap-2">
              <Label>Departamento</Label>
              {ro ? <p className="text-sm text-foreground py-2 px-1">{personForm.department || '-'}</p>
              : <>
                <Select
                  value={personDeptIsCustom ? "OUTRO" : personForm.department}
                  onValueChange={val => {
                    if (val === "OUTRO") {
                      setPersonDeptIsCustom(true);
                      setPersonForm(p => ({ ...p, department: "" }));
                    } else {
                      setPersonDeptIsCustom(false);
                      setPersonForm(p => ({ ...p, department: val }));
                    }
                  }}
                >
                  <SelectTrigger className="w-full rounded-xl font-normal shadow-sm border-border">
                    <SelectValue placeholder="Selecionar departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                    ))}
                    <SelectItem value="OUTRO">Outro</SelectItem>
                  </SelectContent>
                </Select>
                {personDeptIsCustom && (
                  <input
                    type="text"
                    value={personForm.department}
                    onChange={e => setPersonForm(p => ({ ...p, department: e.target.value }))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 mt-2"
                    placeholder="Digite o departamento"
                  />
                )}
              </>}
            </div>
            {editPersonId && (
              ro ? <p className="text-sm text-foreground py-2 px-1">Ativo: {personIsActive ? "Sim" : "Não"}</p>
              : <div className="flex items-center justify-between">
                <Label>Ativo</Label>
                <button
                  type="button"
                  onClick={() => setPersonIsActive(v => !v)}
                  className={`relative w-11 h-6 rounded-full transition-all cursor-pointer ${
                    personIsActive ? "bg-green-500" : "bg-muted-foreground/30"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
                      personIsActive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            )}
            {editPersonId &&
              people &&
              (() => {
                const editedPerson = people.find(p => p.id === editPersonId);
                if (!editedPerson) return null;
                return (
                  <div className="border-t border-border pt-4 space-y-3">
                    <Label className="flex items-center gap-1">
                      <Award size={13} /> Competências
                    </Label>
                    {editedPerson.competencies.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {editedPerson.competencies.map(c => (
                          <span
                            key={c.id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-primary/5 text-primary rounded-lg text-[10px] font-medium"
                          >
                            {c.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Nenhuma competência registada.
                      </p>
                    )}
                    {!ro && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newCompName}
                          onChange={e => setNewCompName(e.target.value)}
                          className="flex-1 bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="Nome da competência"
                        />
                        <Button
                          size="sm"
                          disabled={!newCompName.trim() || createCompMutation.isPending}
                          onClick={() =>
                            createCompMutation.mutate({
                              hryId: editedPerson.hryId,
                              name: newCompName.trim(),
                              details: newCompDetails,
                            })
                          }
                        >
                          Adicionar
                        </Button>
                      </div>
                    )}
                    {!ro && (
                      <input
                        type="text"
                        value={newCompDetails}
                        onChange={e => setNewCompDetails(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Detalhes (opcional)"
                      />
                    )}
                  </div>
                );
              })()}
          </div>
          );
          })()}
          <DialogFooter className="gap-2">
            {isExternal && editPersonId ? (
              <DialogClose asChild>
                <Button variant="outline">Fechar</Button>
              </DialogClose>
            ) : (
              <>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button
                  onClick={handleSavePerson}
                  disabled={
                    !personForm.name.trim() ||
                    isSubmittingPerson ||
                    createPersonMutation.isPending ||
                    updatePersonMutation.isPending
                  }
                >
                  {editPersonId ? "Guardar" : "Adicionar"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <YearAssociationDialog
        open={yearDialogPersonId !== null}
        onOpenChange={o => {
          if (!o) setYearDialogPersonId(null);
        }}
        title="Gerir Anos da Pessoa"
        description={yearDialogPerson ? `Gerir anos para: ${yearDialogPerson.name}` : ""}
        allYears={years ?? []}
        associatedYearIds={new Set(yearDialogPerson?.years.map(y => y.id) ?? [])}
        currentYearId={effectiveYearId}
        onAssociate={handleAssociateYears}
        onDisassociate={handleDisassociateYears}
        isPending={associateYearsMutation.isPending}
        minYears={1}
      />

      <ConfirmDialog
        open={confirmDeletePersonId !== null}
        onOpenChange={() => setConfirmDeletePersonId(null)}
        title="Eliminar Pessoa"
        description="Tem a certeza que deseja eliminar esta pessoa?"
        onConfirm={() => {
          if (confirmDeletePersonId !== null) {
            deletePersonMutation.mutate(confirmDeletePersonId);
            setConfirmDeletePersonId(null);
          }
        }}
        isPending={deletePersonMutation.isPending}
      />

      {/* Infraestruturas Modals */}
      <Dialog
        open={infraModalOpen}
        onOpenChange={o => {
          if (!o) closeInfraModal();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isExternal && editInfraId ? "Detalhes da Infraestrutura" : editInfraId ? "Editar" : "Nova"} Infraestrutura</DialogTitle>
            <DialogDescription>{isExternal && editInfraId ? "Visualizar dados da infraestrutura." : "Registe os dados da infraestrutura."}</DialogDescription>
          </DialogHeader>
          {(() => { const ro = isExternal && editInfraId !== null; return (
          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label>Nome *</Label>
              {ro ? <p className="text-sm text-foreground py-2 px-1">{infraForm.name || '-'}</p>
              : <input
                type="text"
                value={infraForm.name}
                onChange={e => setInfraForm(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Nome"
              />}
            </div>
            <div className="grid gap-2">
              <Label>Tipo</Label>
              {ro ? <p className="text-sm text-foreground py-2 px-1">{infraForm.type || '-'}</p>
              : <input
                type="text"
                value={infraForm.type}
                onChange={e => setInfraForm(p => ({ ...p, type: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Ex: Escritório, Armazém"
              />}
            </div>
            <div className="grid gap-2">
              <Label>Localização</Label>
              {ro ? <p className="text-sm text-foreground py-2 px-1">{infraForm.location || '-'}</p>
              : <input
                type="text"
                value={infraForm.location}
                onChange={e => setInfraForm(p => ({ ...p, location: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Ex: Edifício A, Piso 2"
              />}
            </div>
            <div className="grid gap-2">
              <Label>Manutenção</Label>
              {ro ? <p className="text-sm text-foreground py-2 px-1">{infraForm.maintenance || '-'}</p>
              : <input
                type="text"
                value={infraForm.maintenance}
                onChange={e => setInfraForm(p => ({ ...p, maintenance: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Ex: Plano de manutenção anual"
              />}
            </div>
          </div>
          );
          })()}
          <DialogFooter className="gap-2">
            {isExternal && editInfraId ? (
              <DialogClose asChild>
                <Button variant="outline">Fechar</Button>
              </DialogClose>
            ) : (
              <>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button
                  onClick={handleSaveInfra}
                  disabled={
                    !infraForm.name.trim() ||
                    createInfraMutation.isPending ||
                    updateInfraMutation.isPending
                  }
                >
                  {editInfraId ? "Guardar" : "Adicionar"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <YearAssociationDialog
        open={yearDialogInfraId !== null}
        onOpenChange={o => {
          if (!o) setYearDialogInfraId(null);
        }}
        title="Gerir Anos da Infraestrutura"
        description={yearDialogInfra ? `Gerir anos para: ${yearDialogInfra.name}` : ""}
        allYears={years ?? []}
        associatedYearIds={new Set(yearDialogInfra?.years.map(y => y.id) ?? [])}
        currentYearId={effectiveYearId}
        onAssociate={handleInfraAssociateYears}
        onDisassociate={handleInfraDisassociateYears}
        isPending={associateInfraYearsMutation.isPending}
        minYears={1}
      />

      <ConfirmDialog
        open={confirmDeleteInfraId !== null}
        onOpenChange={() => setConfirmDeleteInfraId(null)}
        title="Eliminar Infraestrutura"
        description="Tem a certeza que deseja eliminar esta infraestrutura?"
        onConfirm={() => {
          if (confirmDeleteInfraId !== null) {
            deleteInfraMutation.mutate(confirmDeleteInfraId);
            setConfirmDeleteInfraId(null);
          }
        }}
        isPending={deleteInfraMutation.isPending}
      />

      {/* Create Equipment Dialog */}
      <Dialog
        open={equipCreateModalOpen}
        onOpenChange={o => {
          if (!o) { setEquipCreateModalOpen(false); setEquipCreateForm({ name: "", type: "", location: "", isActive: true, yearIds: [] }); }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Equipamento</DialogTitle>
            <DialogDescription>Registe os dados do equipamento.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label>Nome *</Label>
              <input
                type="text"
                value={equipCreateForm.name}
                onChange={e => setEquipCreateForm(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Nome"
              />
            </div>
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <input
                type="text"
                value={equipCreateForm.type}
                onChange={e => setEquipCreateForm(p => ({ ...p, type: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Ex: Medidor, Sensor"
              />
            </div>
            <div className="grid gap-2">
              <Label>Localização</Label>
              <input
                type="text"
                value={equipCreateForm.location}
                onChange={e => setEquipCreateForm(p => ({ ...p, location: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Ex: Laboratório, Produção"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={() => {
                if (!equipCreateForm.name.trim()) return;
                createEquipMutation.mutate({
                  ...equipCreateForm,
                  name: equipCreateForm.name.trim(),
                  yearIds: effectiveYearId ? [effectiveYearId] : [],
                });
              }}
              disabled={!equipCreateForm.name.trim() || createEquipMutation.isPending}
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <YearAssociationDialog
        open={yearDialogEquipId !== null}
        onOpenChange={o => {
          if (!o) setYearDialogEquipId(null);
        }}
        title="Gerir Anos do Equipamento"
        description={yearDialogEquip ? `Gerir anos para: ${yearDialogEquip.name}` : ""}
        allYears={years ?? []}
        associatedYearIds={new Set(yearDialogEquip?.years.map(y => y.id) ?? [])}
        currentYearId={effectiveYearId}
        onAssociate={handleEquipAssociateYears}
        onDisassociate={handleEquipDisassociateYears}
        isPending={associateEquipYearsMutation.isPending}
        minYears={1}
      />

      <ConfirmDialog
        open={confirmDeleteEquipId !== null}
        onOpenChange={() => setConfirmDeleteEquipId(null)}
        title="Eliminar Equipamento"
        description="Tem a certeza que deseja eliminar este equipamento?"
        onConfirm={() => {
          if (confirmDeleteEquipId !== null) {
            deleteEquipMutation.mutate(confirmDeleteEquipId);
            setConfirmDeleteEquipId(null);
          }
        }}
        isPending={deleteEquipMutation.isPending}
      />

      {/* Equipment Detail Dialog */}
      <Dialog open={equipDetailOpen} onOpenChange={o => { if (!o) setEquipDetailOpen(false); }}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedEquip && (
            <div className="space-y-6">
              <DialogHeader className="border-b border-border pb-4">
                <DialogTitle className="text-lg">{isExternal ? "Detalhes do Equipamento" : `Editar Equipamento`}</DialogTitle>
                {(() => { const ro = isExternal; return (
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1.5">
                    <Label className="text-[10px] text-muted-foreground">Nome</Label>
                    {ro ? <p className="text-sm text-foreground py-2 px-1">{equipDetailForm.name || '-'}</p>
                    : <input
                      type="text"
                      value={equipDetailForm.name}
                      onChange={e => setEquipDetailForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />}
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-[10px] text-muted-foreground">Tipo</Label>
                    {ro ? <p className="text-sm text-foreground py-2 px-1">{equipDetailForm.type || '-'}</p>
                    : <input
                      type="text"
                      value={equipDetailForm.type}
                      onChange={e => setEquipDetailForm(p => ({ ...p, type: e.target.value }))}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />}
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-[10px] text-muted-foreground">Localização</Label>
                    {ro ? <p className="text-sm text-foreground py-2 px-1">{equipDetailForm.location || '-'}</p>
                    : <input
                      type="text"
                      value={equipDetailForm.location}
                      onChange={e => setEquipDetailForm(p => ({ ...p, location: e.target.value }))}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />}
                  </div>
                </div>
                );
                })()}
                <div className="flex items-center justify-between mt-3">
                  {isExternal ? (
                    <p className="text-sm text-foreground py-2 px-1">Equipamento ativo: {equipDetailForm.isActive ? "Sim" : "Não"}</p>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Ativo</Label>
                      <button
                        type="button"
                        onClick={() => setEquipDetailForm(p => ({ ...p, isActive: !p.isActive }))}
                        className={`relative w-11 h-6 rounded-full transition-all cursor-pointer ${
                          equipDetailForm.isActive ? "bg-green-500" : "bg-muted-foreground/30"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
                            equipDetailForm.isActive ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  )}
                  {!isExternal && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveEquipDetail}
                        disabled={
                          updateEquipMutation.isPending ||
                          !equipDetailForm.name.trim()
                        }
                      >
                        {updateEquipMutation.isPending ? "A guardar..." : "Guardar"}
                      </Button>
                    </div>
                  )}
                </div>
              </DialogHeader>

              {/* Calibration History */}
              <section className="bg-muted/30 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Activity size={14} /> Calibração
                  </h3>
                  {!isExternal && (
                    <Button size="sm" variant="outline" onClick={() => { setCalModalForEquipId(selectedEquip.id); setCalForm({ date: "", performedBy: "", result: "", description: "" }); }}>
                      <Plus size={14} /> Adicionar
                    </Button>
                  )}
                </div>
                {(!selectedEquip.calibrationHistory || selectedEquip.calibrationHistory.length === 0) ? (
                  <div className="border-2 border-dashed border-slate-200 rounded-lg py-8 text-center">
                    <p className="text-xs text-slate-400">Nenhum registo de calibração.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedEquip.calibrationHistory.map(r => (
                      <div key={r.id} className="flex items-start justify-between bg-background border border-border rounded-xl px-4 py-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">{r.date}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              r.result === "PASS" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }`}>{r.result === "PASS" ? "Aprovado" : "Reprovado"}</span>
                          </div>
                          {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1"><span className="text-muted-foreground/50">Por:</span> {r.performedBy}</p>
                        </div>
                        {!isExternal && (
                          <button onClick={() => delCalMutation.mutate({ equipId: selectedEquip.id, recordId: r.id })}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer shrink-0">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Maintenance History */}
              <section className="bg-muted/30 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Wrench size={14} /> Manutenção
                  </h3>
                  {!isExternal && (
                    <Button size="sm" variant="outline" onClick={() => { setMaintModalForEquipId(selectedEquip.id); setMaintForm({ date: "", type: "", performedBy: "", description: "" }); }}>
                      <Plus size={14} /> Adicionar
                    </Button>
                  )}
                </div>
                {(!selectedEquip.maintenanceHistory || selectedEquip.maintenanceHistory.length === 0) ? (
                  <div className="border-2 border-dashed border-slate-200 rounded-lg py-8 text-center">
                    <p className="text-xs text-slate-400">Nenhum registo de manutenção.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedEquip.maintenanceHistory.map(r => (
                      <div key={r.id} className="flex items-start justify-between bg-background border border-border rounded-xl px-4 py-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">{r.date}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              r.type === "PREVENTIVE" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                            }`}>{r.type === "PREVENTIVE" ? "Preventiva" : "Corretiva"}</span>
                          </div>
                          {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1"><span className="text-muted-foreground/50">Por:</span> {r.performedBy}</p>
                        </div>
                        {!isExternal && (
                          <button onClick={() => delMaintMutation.mutate({ equipId: selectedEquip.id, recordId: r.id })}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer shrink-0">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={maintModalForEquipId !== null}
        onOpenChange={o => {
          if (!o) setMaintModalForEquipId(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo Registo de Manutenção</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Data</Label>
              <input
                type="date"
                value={maintForm.date}
                onChange={e => setMaintForm(p => ({ ...p, date: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <select
                value={maintForm.type}
                onChange={e => setMaintForm(p => ({ ...p, type: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Selecionar...</option>
                <option value="PREVENTIVE">Preventiva</option>
                <option value="CORRECTIVE">Corretiva</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Executado por</Label>
              <input
                type="text"
                value={maintForm.performedBy}
                onChange={e => setMaintForm(p => ({ ...p, performedBy: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Nome do responsável"
              />
            </div>
            <div className="grid gap-2">
              <Label>Descrição</Label>
              <textarea
                value={maintForm.description}
                onChange={e => setMaintForm(p => ({ ...p, description: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[60px]"
                placeholder="Descrição..."
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={() =>
                maintModalForEquipId !== null &&
                addMaintMutation.mutate({ equipId: maintModalForEquipId, data: maintForm })
              }
              disabled={!maintForm.date || !maintForm.type}
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Calibration Modal */}
      <Dialog
        open={calModalForEquipId !== null}
        onOpenChange={o => {
          if (!o) setCalModalForEquipId(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo Registo de Calibração</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Data</Label>
              <input
                type="date"
                value={calForm.date}
                onChange={e => setCalForm(p => ({ ...p, date: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="grid gap-2">
              <Label>Resultado</Label>
              <select
                value={calForm.result}
                onChange={e => setCalForm(p => ({ ...p, result: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Selecionar...</option>
                <option value="PASS">Aprovado</option>
                <option value="FAIL">Reprovado</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Executado por</Label>
              <input
                type="text"
                value={calForm.performedBy}
                onChange={e => setCalForm(p => ({ ...p, performedBy: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Nome do responsável"
              />
            </div>
            <div className="grid gap-2">
              <Label>Descrição</Label>
              <textarea
                value={calForm.description}
                onChange={e => setCalForm(p => ({ ...p, description: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[60px]"
                placeholder="Descrição..."
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={() =>
                calModalForEquipId !== null &&
                addCalMutation.mutate({ equipId: calModalForEquipId, data: calForm })
              }
              disabled={!calForm.date || !calForm.result}
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Page-level Log Dialog */}
      <LogDialog
        open={pageLogOpen}
        onOpenChange={setPageLogOpen}
        entityTypes={pageEntityTypes}
        yearId={effectiveYearId ?? undefined}
        title={`Histórico — ${activeTab === "pessoas" ? "Pessoas" : activeTab === "infraestruturas" ? "Infraestruturas" : "Equipamentos"}`}
      />

      {/* Per-item Log Dialog */}
      <LogDialog
        open={itemLogOpen}
        onOpenChange={setItemLogOpen}
        baseEntityId={itemLogEntityId ?? undefined}
        entityTypes={pageEntityTypes}
        yearId={effectiveYearId ?? undefined}
        title="Histórico de alterações"
      />
    </div>
  );
}


