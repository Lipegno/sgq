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
