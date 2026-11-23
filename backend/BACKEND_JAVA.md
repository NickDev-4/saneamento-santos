# Como funciona o backend Java

O backend é a parte do sistema que recebe pedidos do front-end, aplica as regras do projeto e consulta ou grava informações. Ele foi feito em Java 17 com Spring Boot e usa MongoDB para persistir os dados.

## Caminho de uma requisição

Em geral, uma ação percorre este caminho:

1. **Controller (`api/`)** recebe a requisição HTTP, valida os dados de entrada e devolve uma resposta.
2. **Service (`application/`)** executa as regras do sistema e coordena o trabalho.
3. **Repository (`infrastructure/persistence/`)** consulta ou grava documentos no MongoDB.
4. A resposta volta ao front-end como JSON, com o código HTTP apropriado.

Por exemplo, ao abrir um chamado, `CitizenCaseController` recebe os dados e imagens; `CitizenCaseService` verifica as regras e prepara o chamado; os repositórios persistem as informações.

## Trechos importantes

### Inicialização da aplicação

Em `BackendApplication.java`:

```java
@SpringBootApplication
public class BackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}
```

`@SpringBootApplication` configura o ponto de entrada do Spring. O método `main` inicia o servidor e permite que o framework encontre e conecte controllers, serviços e repositórios.

### Endpoint para criar chamado

Em `CitizenCaseController.java`:

```java
@PostMapping(value = "/chamados", consumes = "multipart/form-data")
@PreAuthorize("hasRole('CIDADAO')")
public ResponseEntity<CitizenCaseResponse> create(
        @Valid @RequestPart("dados") CaseWriteRequest request,
        @RequestPart("imagens") List<MultipartFile> files,
        @AuthenticationPrincipal UserPrincipal principal) {
    CitizenCaseResponse created = cases.create(request, files, principal);
    return ResponseEntity
            .created(URI.create("/api/v1/chamados/" + created.id()))
            .body(created);
}
```

Esse método recebe os dados e arquivos enviados pelo formulário, exige uma sessão de cidadão e delega as regras ao serviço. Se a criação funcionar, responde com HTTP `201` e inclui o chamado criado.

### Validação da área atendida

Em `SantosServiceArea.java`:

```java
Geometry point = new GeometryFactory().createPoint(
        new Coordinate(location.longitude(), location.latitude()));
if (polygons.stream().noneMatch(polygon -> polygon.covers(point))) {
    throw new ApiException(HttpStatus.BAD_REQUEST, ...);
}
```

As coordenadas do chamado viram um ponto geográfico. O sistema verifica se algum polígono do GeoJSON de atendimento cobre esse ponto; se não cobrir, rejeita o cadastro com erro de validação.

### Acesso aos chamados no MongoDB

Em `CaseRepository.java`:

```java
public interface CaseRepository extends MongoRepository<CaseDocument, String> {
    boolean existsByProtocolo(String protocolo);
    List<CaseDocument> findByVinculoId(String vinculoId);
}
```

Ao estender `MongoRepository`, o repositório recebe operações comuns de consulta e gravação. O Spring também cria consultas a partir dos nomes dos métodos, como verificar se um protocolo existe ou buscar chamados ligados entre si.

### Sessão, senha e proteção

Em `SecurityConfiguration.java`:

```java
@Bean
PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);
}
```

O codificador armazena senhas como hashes BCrypt, em vez de texto legível. Na mesma configuração, a aplicação usa sessão por cookie, proteção CSRF e exige autenticação nos endpoints que não foram liberados explicitamente.

## Java e termos que aparecem no código

### Como ler a declaração de um método

Veja esta assinatura simplificada:

```java
public CitizenCaseResponse detail(String id, UserPrincipal principal)
```

- `public` diz que outras classes podem chamar esse método.
- `CitizenCaseResponse` é o tipo de dado que ele devolve.
- `detail` é o nome do método (uma ação/função).
- `String id` e `UserPrincipal principal` são parâmetros: informações que o método recebe. `String` é texto; `UserPrincipal` representa o usuário autenticado.

Quando o método não devolve um valor, o tipo de retorno é `void`. `return` encerra o método e entrega o resultado a quem o chamou.

### Anotações do Spring

Anotações são marcações iniciadas por `@`. Elas dão instruções ao Spring sem precisar escrever toda a configuração manualmente:

- `@RestController`: a classe recebe requisições web e transforma os resultados em respostas, geralmente JSON.
- `@RequestMapping` e `@GetMapping` / `@PostMapping`: associam caminhos e tipos de requisição HTTP a métodos Java.
- `@Service`: identifica uma classe que executa regras e operações da aplicação.
- `@Bean`: pede ao Spring que crie e disponibilize um objeto para outras partes usarem.
- `@Valid`: solicita a validação dos dados recebidos conforme as regras declaradas.
- `@PreAuthorize`: verifica a permissão do usuário antes de executar o método.

Por exemplo, `@GetMapping("/me/chamados")` faz com que uma requisição GET nesse caminho seja encaminhada ao método marcado.

### Tipos e coleções

- `String` guarda texto; `int` guarda números inteiros; `boolean` guarda `true` ou `false`.
- `List<T>` representa uma lista de itens do tipo `T`, por exemplo `List<MultipartFile>` para vários arquivos.
- `Optional<T>` representa um resultado que pode existir ou estar ausente. Isso ajuda a tratar uma busca sem resultado de forma explícita.
- `ResponseEntity<T>` permite devolver o conteúdo `T` junto com detalhes HTTP, como o código `201`.
- `var` (quando usado) deixa o compilador deduzir o tipo a partir do valor atribuído; o tipo continua definido durante a compilação.

Os sinais `<` e `>` indicam o tipo que uma coleção ou objeto genérico contém. Em `List<String>`, por exemplo, a lista guarda textos.

### Objetos, construtores e `this`

Uma classe descreve um tipo de objeto. Um **construtor** cria esse objeto e recebe os valores iniciais. No código, por exemplo, `new GeometryFactory()` cria um objeto novo.

`this` significa “este objeto”. É usado para acessar um campo ou método da própria instância. O ponto em `cases.create(...)` também é uma chamada: acessa o método `create` pelo objeto guardado em `cases`.

### Condições, exceções e expressões

- `if (...) { ... }` executa um bloco apenas quando a condição é verdadeira.
- `!` significa “não”; `||` significa “ou”; `&&` significa “e”. Assim, `!existe` quer dizer “não existe”.
- `throw new ...` interrompe o fluxo normal e sinaliza um erro. O tratamento de exceções converte esse erro numa resposta adequada para a API.
- `->` aparece em expressões lambda, uma forma curta de descrever uma ação. Em `polygon -> polygon.covers(point)`, cada polígono da lista é testado para saber se cobre o ponto.
- `stream()` permite processar itens de uma coleção em sequência. `noneMatch(...)` responde verdadeiro quando nenhum item atende à condição indicada.

### Interfaces, `record` e nomes automáticos

Uma **interface** define operações que uma classe ou serviço oferece. `CaseRepository extends MongoRepository<...>` herda operações prontas do Spring Data para acessar o banco.

`record` é uma forma concisa de declarar uma classe usada principalmente para transportar dados. O compilador gera partes repetitivas, como acesso aos valores e construtor. Por isso `CaseDocument` aparece como `record`.

O projeto também usa Lombok. Anotações como `@RequiredArgsConstructor` (quando presentes) pedem ao compilador que gere código repetitivo, como construtores para campos obrigatórios. Esse código gerado não aparece diretamente no arquivo Java.

### HTTP e API

Um **endpoint** é o endereço e a ação que a API oferece. `GET` costuma consultar dados; `POST` costuma criar; `PATCH` costuma alterar parcialmente. Códigos como `200`, `201`, `400` e `401` informam, respectivamente, sucesso, criação, dados inválidos e falta de autenticação.

## Organização do código

- **`BackendApplication.java`** inicia o Spring Boot e configura a aplicação.
- **`api/`** contém os endpoints, DTOs (formatos de entrada e saída), documentação OpenAPI e tratamento de erros. Os controllers separam as ações por assunto: chamados, autenticação, endereços, notificações, indicadores e consultas públicas.
- **`application/`** contém os serviços e regras de cada fluxo: cadastro e acompanhamento de chamados, workflow da equipe, autenticação, imagens, endereços, notificações e indicadores.
- **`domain/`** reúne conceitos centrais, como estados de chamados, estados de publicação, tipos de notificação e papéis de usuário.
- **`infrastructure/persistence/`** define documentos e repositórios MongoDB. Essa camada traduz os dados do sistema para armazenamento.
- **`infrastructure/storage/`** separa o armazenamento de imagens dos metadados guardados no banco; os arquivos ficam no filesystem local configurado.
- **`security/`** configura autenticação e autorização por sessão, identifica o usuário atual e padroniza erros de acesso.
- **`infrastructure/demo/`** contém a carga opcional de dados fictícios para demonstração.

## Regras e integrações importantes

Os endpoints usam validação de entrada e permissões por papel: cidadão, Sabesp ou Prefeitura. A API também fornece sessão protegida por cookie e proteção CSRF para operações de escrita. Chamados públicos passam por regras de visibilidade; a criação depende do GeoJSON da área atendida em Santos. O endereço pode ser consultado por serviços externos, e uploads de imagem são validados antes de serem armazenados.

Alguns fluxos atualizam chamado e notificações como uma única operação. Para isso, o MongoDB precisa oferecer transações, normalmente por meio de um replica set. Em produção, o diretório de imagens também precisa ser persistente.

## Configuração e execução

As dependências e a versão do Java estão em `build.gradle`. A configuração sensível do backend deve ficar em `backend/.env`, fora do controle de versão. Com Java 17 e MongoDB configurado, execute na pasta `backend`:

```powershell
.\gradlew.bat bootRun
```

A API atende em `http://127.0.0.1:8080`. `/api/v1/health` verifica a disponibilidade; `/v3/api-docs` e `/swagger-ui/index.html` mostram a documentação.

## Testes

Os testes em `src/test/java` verificam controllers, serviços, segurança, armazenamento de imagens e regras de negócio. Eles ajudam a confirmar comportamentos específicos sem precisar explicar cada classe individualmente.
