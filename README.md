# Saneamento Santos

Front-end de uma aplicação para registrar e acompanhar problemas de esgoto em Santos. O projeto prioriza o uso no celular e oferece áreas para cidadãos, Sabesp e Prefeitura.

## Estado do projeto

O front-end está implementado com React, TypeScript e Vite e usa a API Java por padrão. O modo `demo` continua disponível para explorar telas sem servidor; nele, dados e sessão ficam em memória e são reiniciados ao recarregar a página.

O backend Java/Spring inclui identidade, consultas públicas, abertura e acompanhamento de chamados, imagens e workflows da Sabesp, notificações e indicadores da Prefeitura. O adaptador HTTP do front-end usa a API por padrão. A API publica OpenAPI em `/v3/api-docs` e Swagger em `/swagger-ui/index.html`. Para registrar novos chamados, configure o GeoJSON oficial da área atendida em `SANTOS_SERVICE_AREA_GEOJSON`. As operações de workflow com notificações atômicas exigem MongoDB compatível com transações (replica set); o storage local de imagens requer volume persistente em produção.

## Executar no Windows

Requisitos: Java 17, Node.js 22.14 ou superior, npm e acesso ao MongoDB configurado em `backend/.env`. Inicie primeiro o backend:

```powershell
cd .\backend
.\gradlew.bat bootRun
```

Em outro PowerShell, a partir da raiz do projeto, inicie o front-end:

```powershell
cd .\frontend
Copy-Item .env.example .env.local
npm.cmd ci
npm.cmd run dev
```

Acesse <http://127.0.0.1:5173>. O front-end encaminha `/api` para o backend local. O cidadão pode criar uma conta; contas Sabesp e Prefeitura precisam estar cadastradas no banco.

## Verificações

Dentro de `frontend/`:

```powershell
npm.cmd test
npm.cmd run test:e2e
npm.cmd run check:architecture
npm.cmd run format:check
npm.cmd run build
```

Os testes de integração usam o Microsoft Edge instalado, com viewport mobile, e respostas HTTP controladas. Eles não exigem o backend Java e iniciam um servidor temporário na porta 5174. A compilação é gerada em `frontend/dist/`.

## Integração com Java

Por padrão, a aplicação usa o modo `api`. Copie o exemplo de configuração do front-end:

```powershell
# Dentro de frontend/
Copy-Item .env.example .env.local
```

Reinicie o Vite depois de alterar `.env.local`. Para desligar a API e usar a demonstração em memória, defina `VITE_DATA_MODE=demo`.

```dotenv
VITE_DATA_MODE=api
VITE_API_BASE_URL=/api/v1
```

O proxy de desenvolvimento encaminha `/api` para `http://127.0.0.1:8080`. Os serviços HTTP do front-end usam sessão por cookie e CSRF. As variáveis `VITE_*` são públicas no navegador e devem conter somente configurações públicas.

O mapa usa Leaflet e os tiles configurados em `VITE_MAP_TILE_URL`. Sua exibição depende de acesso à internet e da disponibilidade do serviço de mapas.

## Backend Java

O backend usa Java 17, Spring Boot e MongoDB. Configure a URI e o banco em `backend/.env` (arquivo ignorado pelo Git; nunca versione credenciais) e inicie a API:

```powershell
cd .\backend
.\gradlew.bat bootRun
```

A API fica em `http://127.0.0.1:8080`, como esperado pelo proxy do Vite. `GET /api/v1/health` verifica se a aplicação responde. Consulte a especificação em `http://127.0.0.1:8080/v3/api-docs` ou a interface em `http://127.0.0.1:8080/swagger-ui/index.html`. Execute `.\gradlew.bat test bootJar` para verificar e empacotar o backend.

Uploads usam arquivos com nomes opacos e armazenamento em filesystem local, configurável por `FILES_STORAGE_DIRECTORY` (padrão `./uploads`). Em produção, esse diretório precisa ser persistente e compartilhado entre instâncias; não use disco efêmero. O cadastro de chamados exige o polígono oficial da área em GeoJSON, configurado por `SANTOS_SERVICE_AREA_GEOJSON`. Sem esse arquivo, a criação/edição retorna `503 SERVICE_AREA_UNAVAILABLE`. Os workflows que atualizam chamado e notificações em conjunto requerem MongoDB em replica set.

### Dados fictícios para apresentação

Para inserir 12 chamados distribuídos por bairros de Santos e três contas de demonstração, rode o backend com o perfil e a carga explicitamente habilitados:

```powershell
cd .\backend
.\gradlew.bat bootRun --args="--spring.profiles.active=demo --app.demo.seed.enabled=true"
```

A carga é idempotente: não substitui registros com os mesmos IDs e cria os tipos do catálogo se estiverem ausentes. Ela grava na base configurada em `backend/.env`, portanto use uma base de desenvolvimento/demonstração. Os registros têm protocolo `SS-DEMO-*` e descrição identificada como cenário fictício.

Contas fictícias (a senha é a mesma para as três):

- Cidadão: `demo-cidadao@saneamento.test`
- Sabesp: `demo-sabesp@saneamento.test`
- Prefeitura: `demo-prefeitura@saneamento.test`
- Senha: `SantosDemo2026!`

Para mostrar essas credenciais na tela de login, mantenha `VITE_SHOW_DEMO_ACCOUNTS=true` no `.env.local`. A senha só deve ser usada no perfil de demonstração.

O workflow de CI em `.github/workflows/ci.yml` executa `test bootJar` no backend e testes unitários/build do frontend em pull requests e pushes para `main`. Deploy automatizado não foi configurado porque o projeto ainda não define provedor ou ambiente de hospedagem.

## Organização

- `frontend/src/features/`: funcionalidades com páginas, componentes, hooks e contexts próprios.
- `frontend/src/shared/`: componentes visuais reutilizáveis, formatação e erros tipados.
- `frontend/src/app/routes/`: rotas públicas, rotas por perfil e proteção de acesso.
- `frontend/src/app/layout/`: cabeçalho e navegação compartilhados.
- `frontend/src/app/contexts/`: sessão, injeção de API e mensagens via Context API.
- `frontend/src/app/data/`: cache por sessão, consultas e invalidação.
- `frontend/src/services/http/`: cliente HTTP e endpoints separados por domínio.
- `frontend/src/services/demo/`: serviços de demonstração com estado isolado por instância.
- `frontend/src/contracts/`: tipos compartilhados da integração.
- `frontend/tests/`: testes de cache e integração.
- `docs/`: planejamento e documentação técnica.
- `Exemplos/`: referências visuais fornecidas para o projeto.

## Documentação

- [Plano do front-end](docs/PLANO_FRONTEND.md)
- [Fluxo de dados e Context API](docs/FLUXO_DADOS_FRONTEND.md)
- [Arquitetura e organização dos arquivos](docs/ARQUITETURA_FRONTEND.md)
- [Contrato de API proposto](docs/CONTRATO_API_PROPOSTO.md)
- [Plano de implementação do backend, pipelines e rotas](docs/PLANO_IMPLEMENTACAO_BACKEND.md)
- [Levantamento de requisitos da entrega simplificada](docs/LEVANTAMENTO_REQUISITOS_ENTREGA_SIMPLIFICADA.md)

Os registros, usuários e imagens ilustrativas da demonstração são fictícios. A existência de perfis institucionais no protótipo não representa adoção oficial pelas instituições.
