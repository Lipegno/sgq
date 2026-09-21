-- Migrações manuais necessárias em produção após o deploy deste branch.
--
-- Contexto: o Hibernate (spring.jpa.hibernate.ddl-auto=update) cria tabelas e
-- colunas novas sozinho, mas NÃO alarga colunas já existentes. Estas colunas
-- foram corrigidas no código (de varchar(255), o default do Hibernate, para
-- TEXT) porque continham texto livre que pode ser mais longo que 255
-- caracteres — sem isto, a criação/edição desses registos falha com um erro
-- enganador ("já existe um registo duplicado") sempre que o texto for longo.
--
-- Corre isto na BD de produção depois do `git pull` + rebuild do backend,
-- antes de testar. Pode ser executado mais que uma vez sem problema
-- (ALTER COLUMN ... TYPE TEXT é idempotente se a coluna já for TEXT).

ALTER TABLE risk_opportunity ALTER COLUMN description TYPE TEXT;
ALTER TABLE indicators ALTER COLUMN name TYPE TEXT;
ALTER TABLE quality_objective ALTER COLUMN objective_title TYPE TEXT;
ALTER TABLE quality_objective ALTER COLUMN description TYPE TEXT;
ALTER TABLE objective_actions ALTER COLUMN resources TYPE TEXT;
ALTER TABLE logs ALTER COLUMN entity_name TYPE TEXT;
ALTER TABLE infrastructure ALTER COLUMN maintenance TYPE TEXT;
ALTER TABLE non_conformity ALTER COLUMN who TYPE TEXT;
ALTER TABLE improvement_opportunities ALTER COLUMN who TYPE TEXT;

-- O Hibernate cria uma restrição CHECK com a lista de valores do enum e nunca
-- a atualiza (ddl-auto=update só acrescenta). Sem isto, registar no log uma
-- entidade nova (ex.: DOCUMENTED_INFORMATION) falha com "violates check
-- constraint". Removê-la evita que cada novo valor do enum exija nova migração;
-- a validação continua garantida pelo enum no código Java.
ALTER TABLE logs DROP CONSTRAINT IF EXISTS logs_entity_type_check;

-- Avaliação de fornecedores passou a seguir o Mapa (4 critérios, semestre,
-- classificação...). A nota única antiga (rating) deixou de existir no código
-- e a data passou a ser opcional; o Hibernate não relaxa NOT NULL sozinho, e
-- sem isto criar uma avaliação falha. Não apaga nenhum dado.
ALTER TABLE supplier_review ALTER COLUMN rating DROP NOT NULL;
ALTER TABLE supplier_review ALTER COLUMN review_date DROP NOT NULL;
