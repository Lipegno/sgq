import { SingletonDocumentPage } from "@/components/singleton-document-page";
import { getSystemPolicy, updateSystemPolicy, uploadSystemPolicyDocument } from "@/api/core";

export default function SystemPolicyPage() {
  return (
    <SingletonDocumentPage
      title="Política do Sistema e sua Divulgação"
      descriptionLabel="Intenções e compromissos globais da organização para a qualidade."
      descriptionPlaceholder="Descreva a política da qualidade..."
      emptyDescriptionText={'Nenhuma política definida. Clique em "Editar" para adicionar.'}
      documentCardTitle="Estado do Documento"
      queryKey={["system-policy"]}
      fetchFn={getSystemPolicy}
      updateFn={updateSystemPolicy}
      uploadFn={uploadSystemPolicyDocument}
      entityType="SYSTEM_POLICY"
    />
  );
}