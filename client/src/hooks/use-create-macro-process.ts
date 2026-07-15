import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createMacroProcess } from "@/api/core";
import { toast } from "sonner";

export const useCreateMacroProcess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMacroProcess,

    onSuccess: () => {
      toast.success("Macro processo criado com sucesso!");
      queryClient.invalidateQueries({
        queryKey: ["macroprocess-hierarchy"],
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Erro ao criar o macro processo");
    },
  });
};