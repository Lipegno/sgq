# Plataforma Centralizada para Acompanhamento e Gestão do Sistema de Qualidade ISO 9001

Sistema de gestão da qualidade baseado na norma ISO 9001:2015, desenvolvido como Projeto Final de Curso na Universidade da Madeira.

**Autor:** Rodrigo Manuel Martins Freitas  
**Orientador:** Filipe Magno Gouveia Quintal

---

## Requisitos

### Backend

| Ferramenta | Versão Mínima | Notas                            |
| ---------- | ------------- | -------------------------------- |
| Java       | 21 (JDK)      | OpenJDK ou Eclipse Temurin       |
| Maven      | 3.8+          | Ou usar o Maven Wrapper incluído |
| PostgreSQL | 14+           | Base de dados                    |

### Frontend

| Ferramenta | Versão Mínima | Notas               |
| ---------- | ------------- | ------------------- |
| Node.js    | 20 LTS        | Necessário para npm |
| npm        | 10+           | Gestor de pacotes   |

### Recomendações de IDE

- **Backend:** IntelliJ IDEA (Community ou Ultimate) — suporte nativo para Spring Boot, Maven e JPA
- **Frontend:** Visual Studio Code ou outro

---

## Estrutura do Projeto

```
/
├── server/
│   └── core-service/          # Backend Spring Boot
│       ├── src/
│       ├── pom.xml
│       └── mvnw               # Maven Wrapper
├── client/                    # Frontend React + Vite
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## Como Correr o Projeto

### 1. Base de Dados (PostgreSQL)

Criar a base de dados:

```bash
createdb -U postgres sgd
```

Ou via psql:

```sql
CREATE DATABASE sgd;
```

A configuração assume `localhost:5432`, utilizador `postgres`, password `postgres`.  
Se necessário, editar as credenciais em `server/core-service/src/main/resources/application.yml`.

### 2. Backend

```bash
cd server/core-service
./mvnw spring-boot:run
```

Ou correr através do IDE.

O backend arranca em `http://localhost:8080`.

Na primeira execução, a base de dados é criada automaticamente (Hibernate `ddl-auto=update`) e os seeders povoam os dados iniciais (anos, utilizadores de teste, entidades ISO 9001).

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

O frontend arranca em `http://localhost:5173`.

### 4. Aceder ao Sistema

As credenciais de teste são criadas automaticamente pelos seeders:

| Email                 | Password     | Perfil                        |
| --------------------- | ------------ | ----------------------------- |
| admin@test.com        | admin        | SUPERADMIN                    |
| user@test.com         | user         | USER                          |
| externo@test.com      | externo      | EXTERNAL (acesso ao ano 2026) |
| auditor@test.com      | auditor      | AUDITOR                       |
| departamento@test.com | departamento | DEPARTMENT_MANAGER            |

---

## Como Resetar a Base de Dados

### 1. Apagar e recriar a base de dados PostgreSQL

```bash
# Terminar ligações ativas
psql -U postgres -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = 'sgd' AND pid <> pg_backend_pid();"

# Apagar
psql -U postgres -c "DROP DATABASE IF EXISTS sgd;"

# Recriar
psql -U postgres -c "CREATE DATABASE sgd;"
```

O Hibernate recria as tabelas a partir das entidades JPA e os seeders inserem os dados iniciais automaticamente.

---

## Migrações da Base de Dados

O projeto **não utiliza Flyway nem Liquibase**. A gestão do schema é feita automaticamente pelo Hibernate através da propriedade:

```yaml
spring.jpa.hibernate.ddl-auto: update
```

Isto significa que:

- As tabelas são criadas/atualizadas automaticamente com base nas entidades JPA
- **Não existem scripts SQL de migração para gerir manualmente**
- Para ambientes de produção, recomenda-se alterar para `validate` e gerar scripts de migração manualmente

---

## Notas Técnicas

- **Java 21** com Spring Boot 4.0.2
- **React 19** com Vite 7 e TypeScript
- **Autenticação:** JWT com RSA-2048 + Refresh Tokens (cookies HttpOnly)
- **Base de Dados:** PostgreSQL com Hibernate JPA
- **Upload de ficheiros:** armazenamento local em `server/files/`
