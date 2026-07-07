import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDepartments, createDepartment, updateDepartment, deleteDepartment, getDepartmentUsers, addDepartmentUser, removeDepartmentUser, getUsers } from "@/api/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldGroup } from "@/components/ui/field";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Network, Plus, Pencil, Trash2, UserPlus, X } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function DepartmentsPage() {
  const { roles } = useAuth();
  const isSuperAdmin = roles.includes("ROLE_SUPERADMIN");
  const isDeptManager = roles.includes("ROLE_DEPARTMENT_MANAGER");
  const canEdit = isSuperAdmin || isDeptManager;

  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<{ id: number; name: string } | null>(null);
  const [editName, setEditName] = useState("");
  const [usersOpen, setUsersOpen] = useState(false);
  const [usersDeptId, setUsersDeptId] = useState<number | null>(null);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");

  const { data: departments, isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
  });

  const { data: deptUsers } = useQuery({
    queryKey: ["department-users", usersDeptId],
    queryFn: () => getDepartmentUsers(usersDeptId!),
    enabled: usersDeptId !== null,
  });

  const { data: allUsers } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const { data: addUserResults } = useQuery({
    queryKey: ["users-search", searchEmail],
    queryFn: () => getUsers(),
    enabled: addUserOpen,
  });

  const createMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateDepartment(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setEditOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setDeleteOpen(false);
    },
  });

  const addUserMutation = useMutation({
    mutationFn: ({ deptId, userId }: { deptId: number; userId: number }) => addDepartmentUser(deptId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-users", usersDeptId] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });

  const removeUserMutation = useMutation({
    mutationFn: ({ deptId, userId }: { deptId: number; userId: number }) => removeDepartmentUser(deptId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-users", usersDeptId] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });

  const availableUsers = allUsers?.filter(
    (u) => !deptUsers?.some((du) => du.id === u.id)
  ) ?? [];

  const filteredUsers = searchEmail
    ? availableUsers.filter((u) =>
        u.email.toLowerCase().includes(searchEmail.toLowerCase()) ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchEmail.toLowerCase())
      )
    : availableUsers;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">A carregar departamentos...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 max-w-4xl mx-auto w-full mb-40 mt-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 shadow-sm">
            <Network size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Departamentos</h1>
            <p className="text-muted-foreground text-sm mt-1">Gerir departamentos e atribuir utilizadores.</p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4 mr-1" /> Criar Departamento
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {departments?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
            Sem departamentos criados.
          </div>
        )}
        {departments?.map((dept) => (
          <div
            key={dept.id}
            className="border rounded-lg p-4 shadow-sm hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{dept.name}</h3>
                <p className="text-sm text-muted-foreground">{dept.userCount} utilizador{dept.userCount !== 1 ? "es" : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setUsersDeptId(dept.id);
                    setUsersOpen(true);
                  }}
                >
                  <UserPlus className="size-4 mr-1" /> Utilizadores
                </Button>
                {canEdit && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedDept(dept);
                        setEditName(dept.name);
                        setEditOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    {isSuperAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDept(dept);
                          setDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Department Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const name = fd.get("name") as string;
              if (name?.trim()) createMutation.mutate({ name: name.trim() });
            }}
          >
            <DialogHeader>
              <DialogTitle>Criar Departamento</DialogTitle>
              <DialogDescription></DialogDescription>
            </DialogHeader>
            <FieldGroup className="mt-4">
              <Field>
                <Label htmlFor="name">Nome</Label>
                <Input required id="name" name="name" placeholder="Nome do departamento" />
              </Field>
            </FieldGroup>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Criando..." : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedDept && editName.trim()) {
                updateMutation.mutate({ id: selectedDept.id, name: editName.trim() });
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>Editar Departamento</DialogTitle>
              <DialogDescription></DialogDescription>
            </DialogHeader>
            <FieldGroup className="mt-4">
              <Field>
                <Label htmlFor="editName">Nome</Label>
                <Input
                  id="editName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </Field>
            </FieldGroup>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Department Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar Departamento</DialogTitle>
            <DialogDescription>
              Tem a certeza que pretende eliminar o departamento "{selectedDept?.name}"? Esta ação é irreversível.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedDept) deleteMutation.mutate(selectedDept.id);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Department Users Dialog */}
      <Dialog open={usersOpen} onOpenChange={setUsersOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Utilizadores do Departamento</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {deptUsers?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Sem utilizadores atribuídos.</p>
            )}
            {deptUsers?.map((user) => (
              <div key={user.id} className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (usersDeptId) {
                        removeUserMutation.mutate({ deptId: usersDeptId, userId: user.id });
                      }
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            ))}
            {canEdit && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setAddUserOpen(true)}
              >
                <UserPlus className="size-4 mr-1" /> Adicionar Utilizador
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add User to Department Dialog */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Utilizador</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Input
              placeholder="Pesquisar por nome ou email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
            />
            {filteredUsers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Sem utilizadores disponíveis.</p>
            )}
            {filteredUsers.slice(0, 10).map((user) => (
              <div key={user.id} className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    if (usersDeptId) {
                      addUserMutation.mutate({ deptId: usersDeptId, userId: user.id });
                    }
                  }}
                >
                  Adicionar
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}