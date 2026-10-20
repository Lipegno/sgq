import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUsers,
  updateUserRoles,
  createUser,
  createExternalUser,
  getYears,
  getUserAssignedYears,
  updateUserAssignedYears,
} from "@/api/core";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { UserCog, Shield, Plus } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import type { UserSummary, YearResponse } from "@/types";

const ALL_ROLES = [
  { value: "ROLE_USER", label: "Utilizador" },
  { value: "ROLE_SUPERADMIN", label: "Super Administrador" },
  { value: "ROLE_AUDITOR", label: "Auditor" },
  { value: "ROLE_DEPARTMENT_MANAGER", label: "Gestor de Departamento" },
  { value: "ROLE_EXTERNAL", label: "Externo" },
];

export default function UsersPage() {
  const { roles, user } = useAuth();
  const isSuperAdmin = roles.includes("ROLE_SUPERADMIN");
  const canCreateUsers = user?.email?.toLowerCase() === "admin.sig@mail.uma.pt";
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSummary & { roles: string[] } | null>(null);
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const emptyNewUser = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    accessType: "internal" as "internal" | "external",
    yearIds: [] as number[],
  };
  const [newUser, setNewUser] = useState(emptyNewUser);
  const [editYearIds, setEditYearIds] = useState<number[]>([]);
  const [loadingEditYears, setLoadingEditYears] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    enabled: isSuperAdmin,
  });

  const { data: years } = useQuery({
    queryKey: ["years"],
    queryFn: getYears,
    enabled: isSuperAdmin,
  });
  const sortedYears = [...(years ?? [])].sort((a, b) => b.year - a.year);
  const currentYearId = sortedYears.find((y) => y.year === new Date().getFullYear())?.id;

  const openCreate = () => {
    // O ciclo atual vem pré-selecionado para os externos.
    setNewUser({ ...emptyNewUser, yearIds: currentYearId ? [currentYearId] : [] });
    setCreateOpen(true);
  };

  const openEdit = async (user: UserSummary & { roles: string[] }) => {
    setSelectedUser(user);
    setEditRoles(user.roles);
    setEditYearIds([]);
    setEditOpen(true);
    if (user.roles.includes("ROLE_EXTERNAL")) {
      setLoadingEditYears(true);
      try {
        setEditYearIds(await getUserAssignedYears(user.id));
      } finally {
        setLoadingEditYears(false);
      }
    }
  };

  const createUserMutation = useMutation({
    mutationFn: ({ accessType, yearIds, ...data }: typeof emptyNewUser) =>
      accessType === "external" ? createExternalUser({ ...data, yearIds }) : createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setCreateOpen(false);
      setNewUser(emptyNewUser);
    },
  });

  const updateRolesMutation = useMutation({
    mutationFn: async ({ id, roles, yearIds }: { id: number; roles: string[]; yearIds: number[] }) => {
      await updateUserRoles(id, roles);
      // Os anos só contam para externos; para internos ficam como estão (ignorados).
      if (roles.includes("ROLE_EXTERNAL")) {
        await updateUserAssignedYears(id, yearIds);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditOpen(false);
    },
  });

  const editIsExternal = editRoles.includes("ROLE_EXTERNAL");

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso negado.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">A carregar utilizadores...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 max-w-4xl mx-auto w-full mb-40 mt-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 shadow-sm">
            <UserCog size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Utilizadores</h1>
            <p className="text-muted-foreground text-sm mt-1">Gerir funções e permissões dos utilizadores.</p>
          </div>
        </div>
        {canCreateUsers && (
          <Button onClick={openCreate}>
            <Plus className="size-4 mr-2" />
            Adicionar utilizador
          </Button>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="text-left p-3 text-sm font-semibold">Nome</th>
              <th className="text-left p-3 text-sm font-semibold">Email</th>
              <th className="text-left p-3 text-sm font-semibold">Funções</th>
              <th className="text-right p-3 text-sm font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((user) => {
              const userWithRoles = user as any;
              const userRoles: string[] = userWithRoles.roles ?? [];
              return (
                <tr key={user.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3 text-sm">{user.firstName} {user.lastName}</td>
                  <td className="p-3 text-sm text-muted-foreground">{user.email}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {userRoles.map((role) => {
                        const label = ALL_ROLES.find((r) => r.value === role)?.label ?? role;
                        return (
                          <span
                            key={role}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary"
                          >
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit({ ...user, roles: userRoles })}
                    >
                      <Shield className="size-4 mr-1" /> Funções
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar utilizador</DialogTitle>

            <DialogDescription>
              Os utilizadores internos veem todos os ciclos. Os externos (por exemplo,
              auditores de certificação) só veem os ciclos escolhidos. As funções podem
              ser alteradas posteriormente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Nome
                </label>

                <input
                  type="text"
                  value={newUser.firstName}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      firstName: e.target.value,
                    })
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Apelido
                </label>

                <input
                  type="text"
                  value={newUser.lastName}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      lastName: e.target.value,
                    })
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Email
              </label>

              <input
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    email: e.target.value,
                  })
                }
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Password
              </label>

              <input
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    password: e.target.value,
                  })
                }
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Confirmar password
              </label>

              <input
                type="password"
                value={newUser.confirmPassword}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    confirmPassword: e.target.value,
                  })
                }
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de acesso</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  ["internal", "Interno", "Todos os ciclos"],
                  ["external", "Externo", "Só os ciclos escolhidos"],
                ] as const).map(([value, label, hint]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setNewUser({ ...newUser, accessType: value })}
                    className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      newUser.accessType === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <span className="block font-medium">{label}</span>
                    <span className="block text-xs text-muted-foreground">{hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {newUser.accessType === "external" && (
              <YearChecklist
                years={sortedYears}
                selected={newUser.yearIds}
                onChange={(yearIds) => setNewUser({ ...newUser, yearIds })}
              />
            )}

            {newUser.password &&
              newUser.confirmPassword &&
              newUser.password !== newUser.confirmPassword && (
                <p className="text-sm text-destructive">
                  As passwords não coincidem.
                </p>
              )}
          </div>

          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">
                Cancelar
              </Button>
            </DialogClose>

            <Button
              onClick={() => createUserMutation.mutate(newUser)}
              disabled={
                createUserMutation.isPending ||
                !newUser.firstName.trim() ||
                !newUser.lastName.trim() ||
                !newUser.email.trim() ||
                !newUser.password ||
                !newUser.confirmPassword ||
                newUser.password !== newUser.confirmPassword ||
                (newUser.accessType === "external" && newUser.yearIds.length === 0)
              }
            >
              {createUserMutation.isPending
                ? "A criar..."
                : "Criar utilizador"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Edit Roles Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar funções e acesso</DialogTitle>
            <DialogDescription>
              {selectedUser?.firstName} {selectedUser?.lastName} ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {ALL_ROLES.map((role) => (
              <label key={role.value} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={editRoles.includes(role.value)}
                  onCheckedChange={(checked) => {
                    const isProtectedBootstrapRole =
                      selectedUser?.email?.toLowerCase() === "admin.sig@mail.uma.pt" &&
                      role.value === "ROLE_SUPERADMIN";

                    if (isProtectedBootstrapRole) {
                      return;
                    }

                    if (checked) {
                      setEditRoles([...editRoles, role.value]);
                    } else {
                      setEditRoles(editRoles.filter((r) => r !== role.value));
                    }
                  }}
                />
                <span className="text-sm">{role.label}</span>
              </label>
            ))}
          </div>
          {editIsExternal && (
            <div className="mt-4 border-t pt-4">
              {loadingEditYears ? (
                <p className="text-sm text-muted-foreground">A carregar ciclos...</p>
              ) : (
                <YearChecklist years={sortedYears} selected={editYearIds} onChange={setEditYearIds} />
              )}
            </div>
          )}
          {updateRolesMutation.isError && (
            <p className="mt-2 text-sm text-destructive">Não foi possível guardar as alterações.</p>
          )}
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={() => {
                if (selectedUser) {
                  updateRolesMutation.mutate({ id: selectedUser.id, roles: editRoles, yearIds: editYearIds });
                }
              }}
              disabled={updateRolesMutation.isPending || loadingEditYears}
            >
              {updateRolesMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function YearChecklist({
  years,
  selected,
  onChange,
}: {
  years: YearResponse[];
  selected: number[];
  onChange: (yearIds: number[]) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Ciclos autorizados</label>
      <div className="flex flex-wrap gap-3">
        {years.map((year) => (
          <label key={year.id} className="flex items-center gap-2 cursor-pointer text-sm">
            <Checkbox
              checked={selected.includes(year.id)}
              onCheckedChange={(checked) =>
                onChange(checked ? [...selected, year.id] : selected.filter((id) => id !== year.id))
              }
            />
            {year.year}
          </label>
        ))}
      </div>
      {selected.length === 0 && (
        <p className="text-xs text-muted-foreground">Sem ciclos, o utilizador externo não consegue consultar nada.</p>
      )}
    </div>
  );
}
