---
mode: 'agent'
description: 'Build the API_Training kit: an Express API under test, Flashpost manual exercises, and a Karate 2.1.2 automation suite organised around the API Testing Hierarchy of Needs.'
---

# Build an API testing training kit for manual testers

You are a senior QA architect and Node.js/Java engineer. Build a complete, runnable training kit in the current workspace. It teaches manual testers API testing from zero, then shows them how to automate the **same** scenarios with **Karate 2.1.2**.

Work in the phases below, in order. **Finish and verify each phase before starting the next.** Don't stop to ask questions: when something is unspecified, pick the simplest option that fits the goals and note it in the guide.

## Audience and teaching goals

- Readers are manual testers with no coding background. Use plain language, short sentences and tables, and explain every term the first time it appears.
- Organise everything around the **API Testing "Hierarchy of Needs"** pyramid. Every API feature exists to give testers something to practise at one tier:

| Tier | Name | What the API must offer |
|---|---|---|
| 1 | Make the HTTP call, get the expected status | Public health check, query and path parameters, many distinct status codes |
| 2 | Chain HTTP calls into business flows | Full CRUD, so testers can create → read → update → delete → confirm 404 |
| 3 | Assertions on payload data and schema | Rich fields: UUID, regex-shaped code, null, nested object, string array, timestamp; plus a nested "team" payload for JsonPath |
| 4 | Boundary value and negative testing, data-driven | Clear numeric and length limits, an enum, type checks, a page-size limit |
| 5 | Mock the APIs you depend on | One endpoint that calls a separate downstream "Geo Service" over HTTP |
| 6 | Error flows involving mocks | Defined behaviour when that dependency returns 404 or 500, or is too slow |
| 7 | Contract testing | A published contract endpoint, plus a shared JSON schema file reused by tests |
| Side | Security, Performance | API-key header with three permission levels; response-time assertions |

## Target file tree

```
API_Training/
├── .gitignore                      # node_modules/, target/, *.log, .env, .vscode/, .idea/
├── TRAINING-GUIDE.md
├── user-service/
│   ├── package.json                # scripts: "start": "node server.js", "geo": "node geo-stub.js"
│   ├── server.js
│   └── geo-stub.js
└── karate-tests/
    ├── pom.xml
    └── src/test/java/
        ├── karate-config.js
        └── users/
            ├── UsersTest.java
            ├── users.feature
            ├── validation.feature
            ├── dependencies.feature
            ├── contract.feature
            ├── geo-mock.feature        # @ignore
            ├── create-user.feature     # @ignore, reusable helper
            ├── boundary-data.csv
            ├── user-contract.json
            └── geo-contract.json
```

---

## Phase 1: The API under test (`user-service/`)

Use **Node.js 18+** (it needs the built-in `fetch` and `AbortSignal.timeout`) and **Express 5** (`npm init -y`, then `npm install express@5`). Use CommonJS. Keep all data **in memory**: a restart resets it. Put a header comment at the top of `server.js` that maps each endpoint to its pyramid tier.

### Configuration
- `PORT` env var, default `3000`.
- `GEO_SERVICE_URL` env var, default `http://localhost:18090`. **Do not use 8090**: common desktop apps occupy it on Windows.
- Timeout for Geo Service calls: 2000 ms.

### Security: the `x-api-key` header
| Key | Permissions |
|---|---|
| `tester-key-123` | read, write |
| `admin-key-999` | read, write, delete |
| `readonly-key-000` | read |

Write a `requireApiKey(permission)` middleware. Missing header → `401 {error:'UNAUTHORIZED', message:'Missing x-api-key header'}`. Unknown key → `401 … 'Invalid API key'`. Known key without the permission → `403 {error:'FORBIDDEN', message:"API key '<name>' lacks '<permission>' permission"}`.

### User model
| Field | Rule |
|---|---|
| `id` | `crypto.randomUUID()` |
| `employeeCode` | `EMP-0001`, `EMP-0002`, … (sequence, zero-padded to 4 digits) |
| `name` | **required** string, 2 to 50 characters after trim |
| `email` | **required**, matches `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, stored lowercase, unique |
| `role` | **required**, one of `tester`, `developer`, `manager`, `admin` (case-sensitive) |
| `age` | **required** integer, 18 to 65 inclusive |
| `active` | boolean, default `true` |
| `address` | `{ city, zip }`, or `null` when no zip was given; `zip` is exactly 5 digits |
| `skills` | array of strings, default `[]` |
| `managerId` | UUID or `null` |
| `createdAt` | ISO-8601 timestamp |

### Validation layers (each gives a different status code; this is the core lesson)
1. Malformed JSON body → `400 {error:'BAD_REQUEST', message:'Request body is not valid JSON'}`. Register an error handler for `entity.parse.failed`, so Express's HTML error page never appears.
2. Missing required fields (POST only) → `400 {error:'VALIDATION_ERROR', message:'Missing mandatory fields', fields:[…in order name,email,role,age…]}`.
3. Wrong types (age not an integer, name/email/role not a string, active not a boolean, skills not an array) → `400 {error:'VALIDATION_ERROR', message:'Invalid field types', details:['age must be an integer', …]}`.
4. Business rules (name length, email format, role enum, age range, zip format) → `422 {error:'UNPROCESSABLE_ENTITY', message:'Business rule violation', errors:[{field, message}]}`. The age message is exactly `age must be between 18 and 65`.
5. Duplicate email → `409 {error:'CONFLICT', …}`.

### Endpoints
| Method | Path | Auth | Behaviour |
|---|---|---|---|
| GET | `/api/health` | none | `200 {status:'UP', service:'user-service', version:'1.0.0', uptimeSeconds, timestamp, dependencies:{geoService:<url>}}` |
| GET | `/api/users` | read | Query params `role`, `active` ('true'/'false'), `minAge`, `maxAge`, `limit` (default 10, integer 1 to 50, else 400), `page` (default 1, integer ≥1, else 400). An invalid `role` value → 400. Returns `{data:[…], pagination:{page, limit, total, totalPages}}` |
| GET | `/api/users/:id` | read | 200, or 404 `{error:'NOT_FOUND', message}` |
| POST | `/api/users` | write | Body fields as above, plus optional `city`, `zip`, `skills`, `managerId`. `201` with a `Location: /api/users/<id>` header |
| PATCH | `/api/users/:id` | write | Partial update, same type and rule checks (no required-field check). 200 / 404 / 409 |
| DELETE | `/api/users/:id` | **delete** | `204` with an empty body, or 404 |
| GET | `/api/teams/:id` | read | Only id `1` exists, else 404. Returns `{id:1, name:'Quality Guild', lead:{id,name}, members:[{id:101, userId, name:<first name>, skills}, {id:102, …}]}`. Capture the member user ids **at seed time**, so users created by tests never change this payload |
| GET | `/api/users/:id/location` | read | 404 if the user is unknown. 422 `'User has no address on file'` if `address` is null. Otherwise calls `GET {GEO_SERVICE_URL}/geo/{zip}` with the 2 s timeout. Mapping: timeout → **504** `GATEWAY_TIMEOUT`; network error → **503** `DEPENDENCY_UNAVAILABLE` 'Geo service is unreachable'; dependency 404 → **404** `'Zip <zip> is unknown to the geo service'`; other non-2xx → **503** `'Geo service returned <status>'`; success → `200 {userId, name, zip, city, state, timezone, source:'geo-service'}` |
| GET | `/api/contract` | none | Describes every user field and its rule. Its `user` object's keys must exactly match the user model's fields; `role` is the array of allowed roles |
| any | anything else | none | `404 {error:'NOT_FOUND', message:'No route for <METHOD> <path>'}` (JSON, never HTML) |

Also add middleware that echoes the request's `x-correlation-id` header in the response, or generates a UUID when there isn't one.

### Seed data (recreated on every start)
| Name | Email | Role | Age | Active | City / Zip | Skills | managerId |
|---|---|---|---|---|---|---|---|
| Priya Sharma | priya@example.com | manager | 41 | true | Pune / 41101 | planning, jira | null |
| Arjun Mehta | arjun@example.com | tester | 29 | true | Bengaluru / 56001 | manual, flashpost | Priya |
| Sara Khan | sara@example.com | tester | 34 | true | Hyderabad / 50001 | karate, sql | Priya |
| Leo Fernandes | leo@example.com | developer | 25 | **false** | Goa / **99999** | node, java | Priya |
| Mia Wong | mia@example.com | developer | 52 | true | **none** | react | null |

### `geo-stub.js` (for manual testing)
Express on `GEO_PORT`, default `18090`. `GET /geo/:zip`:
- Known zips return `200 {zip, city, state, timezone}`: `41101` Pune/Maharashtra, `56001` Bengaluru/Karnataka, `50001` Hyderabad/Telangana (all `Asia/Kolkata`), and `10001` New York/NY (`America/New_York`).
- `99999` → 500. `77777` → 200 after a 3000 ms delay. Anything else (for example `00000`) → 404.

**Verify Phase 1:** start both processes and use `curl` to confirm: health 200; no key 401; tester key with `?role=tester` returns only testers; POST `{name:'X'}` 400 listing `email, role, age`; age 17 → 422; malformed JSON → 400 JSON; DELETE with the tester key 403; `/location` for Arjun 200 and for Leo 503; `/api/teams/1` has exactly members 101 and 102.

---

## Phase 2: Karate 2.1.2 project (`karate-tests/`)

### Hard facts about Karate 2.x. Follow these exactly; most online examples are Karate 1.x and will not compile.
- Requires **Java 21+**. Set `<maven.compiler.release>21</maven.compiler.release>`.
- Dependency: `io.karatelabs:karate-junit6:2.1.2` (test scope). **There is no `karate-junit5` 2.1.2.** It brings in `io.karatelabs:karate-core`.
- Also add `org.junit.jupiter:junit-jupiter:6.1.2` (test scope) explicitly. `karate-junit6` declares JUnit as `provided`. With JUnit 5.x, Surefire reports 0 tests.
- Packages: `io.karatelabs.core.Runner`, `io.karatelabs.core.SuiteResult`, `io.karatelabs.core.MockServer`, `io.karatelabs.junit6.Karate`. Never use `com.intuit.karate.*`.
- Mock server API: `MockServer.feature("classpath:users/geo-mock.feature").port(port).start()`, then `getPort()` and `stopAsync()`.
- Runner API: `Runner.path("classpath:users").tags("~@ignore").global("geoUrl", url).outputJunitXml(true).parallel(5)` returns a `SuiteResult`. Then `assertEquals(0, result.getScenarioFailedCount(), String.join("\n", result.getErrors()))`, so failures fail `mvn test`.
- Add a `<testResources>` entry for `src/test/java` that excludes `**/*.java`, so `.feature`, `.json`, `.csv` and `karate-config.js` sit next to the runner. Use `maven-surefire-plugin` 3.5.x.

### Karate 2.1.2 quirks (avoid these; each one cost a failed run)
1. **Feature descriptions:** never write free text under `Feature:` whose lines start with `@` or `*`. It breaks parsing and the `Background` silently doesn't run. Write all descriptions as `#` comments.
2. `'#[] #string'` **fails on an empty array**. Use `'#array'` wherever an array can be empty.
3. `'##(schema)'` does **not** accept `null`. Use `'#? _ == null || karate.match(_, schema).pass'`.
4. **Don't call `karate.http(...)` inside a scenario.** It changes the scenario's own base URL. Create test data with `call read('create-user.feature') { zip: '56001' }` instead.
5. In a mock, don't put lookups such as `zips[pathParams.zip]` in the `Scenario:` expression. Match on `pathMatches('/geo/{zip}')` and branch inside the scenario: `* def geo = zips[pathParams.zip]`, `* def responseStatus = geo ? 200 : 404`.
6. CSV `Examples` values are always strings. Convert with `~~value`.

### `karate-config.js`
Return `baseUrl: 'http://localhost:3000'`, an `apiKeys` object `{tester, admin, readOnly}`, and a `uniqueEmail(prefix)` function: prefix + timestamp + random number + `@example.com`. Every create-user test uses it, so parallel runs never collide with 409. Support `karate.env == 'qa'` with a placeholder URL. Set `connectTimeout` 5000 and `readTimeout` 10000.

### `UsersTest.java`
- `@BeforeAll`: read `Integer.getInteger("geo.port", 18090)`. **Probe the port with a `ServerSocket` first**, and if it's taken, throw `IllegalStateException` with a plain-English message: stop geo-stub.js, or use `-Dgeo.port=NNNN` and restart user-service with `GEO_SERVICE_URL`. Then start the Geo mock.
- `@AfterAll`: `stopAsync()`.
- One `@Test` that runs `classpath:users` in parallel (5 threads), passes `geoUrl` as a global, and supports `mvn test -Dtags=@tier4` by combining `~@ignore` with the `tags` system property.
- Comment at the top: user-service must already be running, and geo-stub must be stopped.

### Feature files: tag every scenario with its tier (`@tier1` … `@tier7`, `@security`, `@smoke`)

**`users.feature`** automates the Flashpost exercises one-to-one (Background: `* url baseUrl`, `* def testerKey = apiKeys.tester`):
- Health: status 200; a full-object `match` with `version: '#regex \\d+\\.\\d+\\.\\d+'`, `uptimeSeconds: '#number'`; `match header x-correlation-id == '#uuid'`; `assert responseTime < 1000`.
- Query parameters: `param role = 'tester'`, `match each response.data contains { role: 'tester' }`, `match response.data[*].name contains ['Arjun Mehta', 'Sara Khan']`; a `params { role: 'developer', active: 'false' }` scenario; an unknown path id → 404.
- Negative: missing fields → 400 with `match response.fields contains only ['email','role','age']`; empty body → 400; a `Scenario Outline` of wrong types (age `'thirty'`, `30.5`, name `12345`, active `'yes'`, skills `'java'`) using `set payload.<field> = <badValue>`.
- Boundary: one outline for ages 18, 19, 64, 65 → 201; one for 17, 66, 0, -1 → 422 with `match response.errors[0] == { field: 'age', message: 'age must be between 18 and 65' }`; one outline for `limit` 0/1/50/51 → 400/200/200/400.
- Data-driven: `Examples: | read('boundary-data.csv') |` with columns `description,name,emailValue,role,age,expectedStatus,errorField`. `emailValue` `UNIQUE` means "call uniqueEmail". Rows: name 1/2/50/51 characters, role `intern` and `Tester`, email `not-an-email` and `someone@example`, age 18/65/17/66. Assert `responseStatus == ~~expectedStatus`, and that `errors[0].field` equals `errorField` when the status is 422.
- Security: no key 401, bad key 401, valid key 200, read-only key POST 403.
- Tier 2 flow: POST (check `match header Location == '/api/users/' + response.id`) → GET → PATCH role and skills → DELETE with the tester key 403 → DELETE with the admin key 204 → GET 404. Plus a duplicate-email → 409 scenario.

**`validation.feature`** (Tier 3), on `/api/teams/1`, mirroring the classic "cat and kittens" slide:
`match team.members[0] contains { name: 'Arjun', id: 101 }`, `match team.members[*].id == [101, 102]`, `contains 101`, `contains [102, 101]`, deep scan `match team..name == ['Quality Guild', 'Priya Sharma', 'Arjun', 'Sara']`, `match each team.members contains { id: '#number' }`, `match each team.members == { id: '#notnull', userId: '#uuid', name: '#regex [A-Z][a-z]+', skills: '#[] #string' }`, and a JS predicate `'#? isLessThan200(_)'`. A second scenario shows a fuzzy-matcher cheat sheet on the manager user (`#uuid`, `#regex`, `#number? _ >= 18 && _ <= 65`, `#boolean`, `#object`, `#array`, `#null`, `#ignore`, `#notnull`, `#present`, `#notpresent`, `##uuid`, `#[2] #string`). A third scenario does `match each response.data == read('user-contract.json')`.

**`dependencies.feature`** (Tiers 5 and 6): for each case, create a user at a zip via `create-user.feature`, then GET `/location`. `56001` → 200 with the full enriched object; `00000` → 404; `99999` → 503 `{error:'DEPENDENCY_UNAVAILABLE', message:'Geo service returned 500'}`; `77777` → 504 and `assert responseTime < 2800`; a user without an address → 422.

**`geo-mock.feature`** (`@ignore`): Background holds the zip table. Scenarios in this order: `/geo/99999` → `responseStatus = 500`; `/geo/77777` → `responseDelay = 3000`; `/geo/{zip}` → branch to 200 or 404 (quirk 5); a catch-all → 404.

**`contract.feature`** (Tier 7): Background defines `addressSchema = { city: '##string', zip: '#regex \\d{5}' }` and reads `user-contract.json`. Provider scenarios: every listed user matches the contract; a newly created user matches; `karate.keysOf(response.user)` from `/api/contract` `contains only` the contract file's keys. Consumer scenario: `* def geoUrl = karate.get('geoUrl', 'http://localhost:18090')`, GET `/geo/41101`, `match response == read('geo-contract.json')`.

**`user-contract.json`**: `id '#uuid'`, `employeeCode '#regex EMP-\\d{4}'`, `name '#string? _.length >= 2 && _.length <= 50'`, email regex, role via `#? [...].indexOf(_) != -1`, `age '#number? _ >= 18 && _ <= 65'`, `active '#boolean'`, address per quirk 3, `skills '#array'`, `managerId '##uuid'`, `createdAt` ISO regex. **Make sure it is valid JSON**: regex backslashes must be doubled (`\\d`).

**Verify Phase 2:** with user-service running and geo-stub stopped, run `mvn test`. Expect `BUILD SUCCESS` and roughly 50+ scenarios passing in `target/karate-reports/karate-summary.html`. Then deliberately break one assertion and confirm `mvn test` exits non-zero, then revert. Confirm `mvn test -Dtags=@tier4` runs only that tier. If Maven fails with `PKIX path building failed` on Windows, rerun with `MAVEN_OPTS=-Djavax.net.ssl.trustStoreType=Windows-ROOT` and document that tip. Fix every failure before moving on; never weaken an assertion just to make it pass, unless the assertion itself was wrong.

---

## Phase 3: `TRAINING-GUIDE.md`

Write it for beginners, with markdown headings, tables, code blocks, and `- [ ]` checklists for manual assertions. Use these sections:

1. **Intro**: what the kit contains, an ASCII pyramid of the 7 tiers plus the Security/Performance side tracks, and "build a firm base before moving up".
2. **Part 1, Fundamentals**: the restaurant-waiter analogy as a table (customer = client, menu = docs/contract, waiter = API, kitchen = server, membership card = API key, bakery = downstream dependency). Request/response anatomy. A status-code table (200, 201, 204, 400, 401, 403, 404, 409, 422, 503, 504) with a restaurant meaning and how to trigger each one in this API. A callout explaining **400 vs 422**. A table of test types mapped to tiers (functional, flow, schema, negative, BVA, mocking, error flows, contract, security, performance). A BVA diagram for age 17/18/19…64/65/66, and a table of all four boundaries (age, name, limit, zip).
3. **Part 2, The microservice**: prerequisites, build steps from `npm init -y` (one command per code block), how to run it in **two separate terminals**, an API reference (keys, endpoints with tiers, user fields with "good for practising" notes, the seed data table and why each user exists, the Geo magic-zip table), and key excerpts from server.js.
4. **Part 3, Manual testing with Flashpost**: environment variables (`baseUrl`, `testerKey`, `adminKey`, `readOnlyKey`) and the habit "check status → body → headers → time, and write down what you expect *before* clicking Send". Exercises, each with method, URL, headers, body, expected JSON and a checklist: (1) health check, including the correlation-id echo; (2) query/path parameters (role filter, combined filters, pagination `limit=2&page=2` → 3 pages, path id, invalid role → 400); (3) negative, missing fields, plus a table of more negative bodies; (4) boundary values for age, then name/role/email/limit; (5) security, a table of 6 key variations; plus bonus exercises for Tier 2 (a 6-step flow), Tier 3 (team payload), Tiers 5 and 6 (location calls, including stopping the geo stub to see 503), and Tier 7.
5. **Part 4, Karate**: why Karate (a table of its benefits); setup requirements; a **Karate 1.x vs 2.x comparison table**; the full pom.xml and karate-config.js; the runner with an explanation; how to run, filter tags and open the report; a Flashpost-click → Karate-line mapping table; each users.feature scenario shown next to its manual exercise; then one subsection per pyramid tier (2, 3, 5, 6, 7) with code, a fuzzy-matcher table (Ignore/Exists, Primitive, Complex, Special, RegEx, Predicate, Optional, Array size); a callout listing the Karate 2.1.2 quirks; and the performance and security side tracks (mention Karate-Gatling reuse).
6. **Part 5, Quick reference**: a table of about 30 rows, columns "Manual check in Flashpost | Karate syntax | Tier".
7. **Troubleshooting**: "site can't be reached" (server not running, or it was stopped with Ctrl+C); "Cannot GET /" on 18090 and `NOT_FOUND` on `/` of 3000 are expected (and why a consistent JSON error format is itself a test); port in use (`netstat -ano | findstr :<port>`, `taskkill /PID <pid> /F`, or PowerShell `Get-NetTCPConnection`); restarting resets the data; the PKIX fix.
8. **A 7-day learning path** table.

Every command, URL, key, status code and JSON body in the guide must match the code exactly. Re-read the guide against `server.js` and the feature files before you finish.

---

## Definition of done
- [ ] `npm start` and `npm run geo` both start cleanly on 3000 and 18090.
- [ ] All Phase 1 curl checks behave as specified.
- [ ] `mvn test` passes every scenario; a deliberately broken assertion makes it fail; `-Dtags` filtering works.
- [ ] `.gitignore` excludes `node_modules/` and `target/`.
- [ ] TRAINING-GUIDE.md covers every section above and matches the code.
- [ ] Finish with a short summary: what was built, the test count, and any deviations from this prompt and why.
