import { SingletonDocumentPage } from "@/components/singleton-document-page";
import { getResponsibilityAuthority, updateResponsibilityAuthority, uploadResponsibilityAuthorityDocument } from "@/api/core";
import { ShieldCheck } from "lucide-react";

export default function ResponsibilityAuthorityPage() {
  return (
    <SingletonDocumentPage
      title="Atribuições, Responsabilidades e Autoridades"
      descriptionLabel="Definição das funções, responsabilidades e autoridades no SGQ."
      descriptionPlaceholder="Descreva as atribuições, responsabilidades e autoridades..."
      emptyDescriptionText={'Nenhuma definição registada. Clique em "Editar" para adicionar.'}
      documentCardTitle="Estado do Documento"
      queryKey={["responsibility-authority"]}
      fetchFn={getResponsibilityAuthority}
      updateFn={updateResponsibilityAuthority}
      uploadFn={uploadResponsibilityAuthorityDocument}
      entityType="RESPONSIBILITY_AUTHORITY"
      icon={<ShieldCheck size={24} />}
    />
  );
}