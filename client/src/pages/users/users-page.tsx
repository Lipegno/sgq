import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, updateUserRoles, createUser } from "@/api/core";
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
import type { UserSummary } from "@/types";

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
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    enabled: isSuperAdmin,
  });

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });

      setCreateOpen(false);

      setNewUser({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    },
  });

  const updateRolesMutation = useMutation({
    mutationFn: ({ id, roles }: { id: number; roles: string[] }) => updateUserRoles(id, roles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditOpen(false);
    },
  });

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
          <Button onClick={() => setCreateOpen(true)}>
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
                      onClick={() => {
                        setSelectedUser({ ...user, roles: userRoles });
                        setEditRoles(userRoles);
                        setEditOpen(true);
                      }}
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
              O novo utilizador será criado inicialmente com acesso externo.
              As funções podem ser alteradas posteriormente.
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
                newUser.password !== newUser.confirmPassword
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
            <DialogTitle>Editar Funções</DialogTitle>
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
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={() => {
                if (selectedUser) {
                  updateRolesMutation.mutate({ id: selectedUser.id, roles: editRoles });
                }
              }}
              disabled={updateRolesMutation.isPending}
            >
              {updateRolesMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}