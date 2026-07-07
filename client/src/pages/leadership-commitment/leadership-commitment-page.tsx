import { SingletonWithYearsPage } from "@/components/singleton-with-years-page";
import {
  getLeadershipCommitment,
  updateLeadershipCommitment,
  uploadLeadershipCommitmentDocument,
  getLeadershipCommitmentByYear,
} from "@/api/core";
import { UserCheck } from "lucide-react";

export default function LeadershipCommitmentPage() {
  return (
    <SingletonWithYearsPage
      title="Liderança e Compromisso"
      descriptionLabel="Demonstração do compromisso da gestão de topo com o SGQ."
      descriptionPlaceholder="Descreva o compromisso da liderança com o SGQ..."
      emptyDescriptionText={'Nenhum compromisso definido. Clique em "Editar" para adicionar.'}
      queryKey={["leadership-commitment"]}
      fetchFn={getLeadershipCommitment}
      updateFn={updateLeadershipCommitment}
      uploadFn={uploadLeadershipCommitmentDocument}
      yearDetailQueryKey={(yearId: number) => ["leadership-commitment", "year", yearId]}
      yearDetailFetchFn={getLeadershipCommitmentByYear}
      entityType="LEADERSHIP_COMMITMENT"
      icon={<UserCheck size={24} />}
    />
  );
}