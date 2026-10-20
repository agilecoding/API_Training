# API Testing Training Kit: from Manual (Flashpost) to Automated (Karate 2.1.2)

A hands-on kit for manual testers. You will:

1. Learn what an API is and which kinds of API tests matter.
2. Run a small **User Management API** on your own laptop.
3. Test it **by hand** in the Flashpost VS Code extension.
4. Turn those manual tests into **Karate 2.1.2** automated tests.
5. Keep a one-page cheat sheet that maps manual checks to Karate syntax.

The whole kit follows the **API Testing "Hierarchy of Needs"** pyramid. Every endpoint in the API exists so you can practise one tier of it.

```
                    /\
                   /  \        Tier 7  Contract testing
                  /----\       Tier 6  Error flows involving mocks
                 /------\      Tier 5  Mock the APIs you depend on
                /--------\     Tier 4  Boundary value & negative testing (data-driven)
               /----------\    Tier 3  Assertions on payload data and schema
              /------------\   Tier 2  Chain HTTP calls into business flows
             /--------------\  Tier 1  Make the HTTP call, get the expected status
            ------------------
  Side tracks, depending on context:  Security (x-api-key)  ·  Performance (response time)
```

> **Build a firm base before moving up.** Tier 5 tests are worthless if Tier 1 is still failing.

---

## What's in the kit

```
api-testing-kit/
├── TRAINING-GUIDE.md                 <- this file
├── user-service/                     <- the API under test (Node.js + Express)
│   ├── package.json
│   ├── server.js                     <- the User Management API (port 3000)
│   └── geo-stub.js                   <- fake "Geo Service" dependency for manual testing (port 18090)
└── karate-tests/                     <- the automation project (Java 21 + Maven + Karate 2.1.2)
    ├── pom.xml
    └── src/test/java/
        ├── karate-config.js          <- base URL, API keys, helper functions
        └── users/
            ├── UsersTest.java        <- JUnit runner, starts the Geo mock
            ├── users.feature         <- the Flashpost exercises, automated (Tiers 1, 2, 4, Security)
            ├── validation.feature    <- JsonPath, #regex and fuzzy matchers (Tier 3)
            ├── dependencies.feature  <- mocks and error flows (Tiers 5 and 6)
            ├── contract.feature      <- contract tests (Tier 7)
            ├── geo-mock.feature      <- Karate mock of the Geo Service
            ├── create-user.feature   <- reusable "create a user" step
            ├── boundary-data.csv     <- data-driven boundary cases
            ├── user-contract.json    <- the user schema / contract
            └── geo-contract.json     <- what we rely on from the Geo Service
```

All 53 Karate scenarios in this kit were run against the API and pass.

---

# Part 1: API Testing Fundamentals for Manual Testers

## 1.1 What is an API? The restaurant waiter

| Restaurant | API world |
|---|---|
| **You**, the customer | The **client**: a mobile app, a web page, Flashpost, a Karate test |
| The **menu** | The **API documentation / contract**: what you may ask for and how |
| The **waiter** | The **API**: takes your request to the kitchen and brings back the result |
| The **kitchen** | The **server / database**: where the real work happens, hidden from you |
| Your **order** ("table 4, one pasta, no cheese") | The **request**: method + URL + headers + body |
| The **plate** that arrives | The **response**: status code + headers + body |
| "Sorry, we're out of pasta" | An **error response**, such as `404 Not Found` |
| Showing your **membership card** for the VIP menu | An **API key** in a header (`x-api-key`) |
| The kitchen ordering bread from a **bakery** | A **downstream dependency** (our API calls a Geo Service) |

You never walk into the kitchen. You only talk to the waiter. **API testing means testing the waiter**: does it take the order correctly, bring the right plate, and politely refuse impossible orders?

## 1.2 Anatomy of a request and a response

```
REQUEST                                         RESPONSE
POST /api/users?notify=true  HTTP/1.1           HTTP/1.1 201 Created          <- status code
Host: localhost:3000                            Content-Type: application/json
Content-Type: application/json   <- headers     Location: /api/users/7f3c...   <- headers
x-api-key: tester-key-123
                                                {                              <- body
{                                <- body          "id": "7f3c...",
  "name": "Asha Rao",                             "name": "Asha Rao",
  "email": "asha@example.com",                    "role": "tester",
  "role": "tester",                               "age": 28
  "age": 28                                     }
}
```

| Part | What it is | Example |
|---|---|---|
| **Method** (verb) | What you want to do | `GET` read, `POST` create, `PATCH` update part, `PUT` replace, `DELETE` remove |
| **Path** | Which resource | `/api/users` |
| **Path parameter** | Which *one* resource | `/api/users/`**`7f3c...`** |
| **Query parameter** | Filters and options after `?` | `/api/users?`**`role=tester&limit=5`** |
| **Headers** | Metadata about the request | `Content-Type`, `x-api-key` |
| **Body** | The data you send (usually JSON) | `{ "name": "Asha" }` |
| **Status code** | The short answer | `201` |

### Status codes you will meet in this kit

| Code | Meaning | Restaurant version | Where to trigger it |
|---|---|---|---|
| **200 OK** | Success | Here's your food | `GET /api/health` |
| **201 Created** | A new thing was created | Your order is placed | `POST /api/users` (valid body) |
| **204 No Content** | Success, nothing to send back | Table cleared | `DELETE /api/users/{id}` with the admin key |
| **400 Bad Request** | The request is broken (missing or wrong-type field, invalid JSON) | "You didn't say what you want" | `POST /api/users` with only `name` |
| **401 Unauthorized** | Who are you? (no key or a bad key) | No membership card | Any `/api/users` call without `x-api-key` |
| **403 Forbidden** | I know you, but you can't do that | Card valid, not VIP | `DELETE` with the tester key |
| **404 Not Found** | It doesn't exist | That dish isn't on the menu | `GET /api/users/unknown-id` |
| **409 Conflict** | It clashes with existing data | Table already booked | `POST` the same email twice |
| **422 Unprocessable Entity** | Well-formed, but breaks a business rule | "We don't serve kids' menus to adults" | `POST` with `age: 17` |
| **503 Service Unavailable** | A dependency failed | The bakery is closed | `/location` when the Geo Service returns 500 |
| **504 Gateway Timeout** | A dependency was too slow | Bread never arrived | `/location` when the Geo Service is slow |

> **400 vs 422** confuses everyone. In this API: **400** = "I can't even read your request" (missing field, wrong type, broken JSON). **422** = "I understood you, but the value breaks a rule" (age 17, role `intern`).

## 1.3 The core types of API testing

| Type | Question it answers | Pyramid tier | Example in this kit |
|---|---|---|---|
| **Status code verification** | Did I get the code I expected? | 1 | Health returns `200` |
| **Functional (happy path)** | Does it do the right thing with good input? | 1 to 3 | Create a user, get `201` and the same data back |
| **Business flow (chaining)** | Do several calls work together end to end? | 2 | Create, read, update, delete, then confirm `404` |
| **Payload and schema** | Is every field present, typed and formatted correctly? | 3 | `id` is a UUID, `employeeCode` matches `EMP-0001` |
| **Negative testing** | Does it refuse bad input safely? | 4 | Missing `email` gives `400` with a helpful message |
| **Boundary value analysis (BVA)** | What happens exactly on and around the limits? | 4 | Age 17 / **18** / 19 ... 64 / **65** / 66 |
| **Dependency mocking** | Can I test my API without the real neighbour? | 5 | Fake Geo Service |
| **Error flows** | What does my API do when the neighbour breaks? | 6 | Geo returns 500, our API returns a clean `503` |
| **Contract testing** | Does the response still match what consumers rely on? | 7 | Every user matches `user-contract.json` |
| **Security / authorization** | Are the doors locked, and do the right keys open the right doors? | Side | No key `401`, bad key `401`, read-only key creating `403` |
| **Performance (light)** | Is it fast enough? | Side | Health check answers in under 1 s |

### Boundary value analysis in 30 seconds

Rule: **age must be 18 to 65 (inclusive)**. Bugs hide at the edges (`>` written instead of `>=`), so test both sides of each edge:

```
   invalid   |  valid ............................ valid |   invalid
     17      |  18   19                         64   65  |     66
  expect 422 |  201  201                        201  201 |  expect 422
```

The API has four boundaries to explore:

| Field | Rule | Below min | Min | Max | Above max |
|---|---|---|---|---|---|
| `age` | 18 to 65 | 17 → 422 | 18 → 201 | 65 → 201 | 66 → 422 |
| `name` | 2 to 50 characters | 1 char → 422 | 2 chars → 201 | 50 chars → 201 | 51 chars → 422 |
| `limit` (query) | 1 to 50 | 0 → 400 | 1 → 200 | 50 → 200 | 51 → 400 |
| `zip` | exactly 5 digits | `1234` → 422 | | `12345` → 201 | `123456` → 422 |

---

# Part 2: The Local Microservice (Node.js + Express)

## 2.1 Prerequisites

- **Node.js 18 or newer** (Node 24 used to verify this kit). Check with `node -v`.
- **VS Code** with the **Flashpost** extension (Extensions panel, search "Flashpost").

## 2.2 Build it from scratch (step by step)

```bash
mkdir user-service
```
```bash
cd user-service
```
```bash
npm init -y
```
```bash
npm install express@5
```

Then:

1. Create `server.js` and paste the code from section 2.4.
2. Create `geo-stub.js` and paste the code from section 2.5.
3. Add two scripts to `package.json`:

```json
"scripts": {
  "start": "node server.js",
  "geo": "node geo-stub.js"
}
```

## 2.3 Run it

Open **two** terminals inside `user-service`:

```bash
npm start
```
```bash
npm run geo
```

You should see `user-service listening on http://localhost:3000` and `geo-stub listening on http://localhost:18090`.

> The data lives in memory. **Restart `npm start` to reset everything** back to the 5 seed users.

## 2.4 API reference

**API keys** (send as header `x-api-key`):

| Key | Permissions | Use it to test |
|---|---|---|
| `tester-key-123` | read, write | Normal work |
| `admin-key-999` | read, write, delete | Deleting users |
| `readonly-key-000` | read | `403 Forbidden` on create |

**Endpoints:**

| Method | URL | Auth | Pyramid tier | Purpose |
|---|---|---|---|---|
| GET | `/api/health` | none | 1 | Is the service up? |
| GET | `/api/users?role=&active=&minAge=&maxAge=&limit=&page=` | read | 1, 4 | List and filter (query params) |
| GET | `/api/users/{id}` | read | 1, 2 | One user (path param) |
| POST | `/api/users` | write | 2, 4 | Create (validation, `400` / `422` / `409`) |
| PATCH | `/api/users/{id}` | write | 2 | Partial update |
| DELETE | `/api/users/{id}` | **delete** | 2, Security | Remove (`204`, `403` for non-admins) |
| GET | `/api/teams/1` | read | 3 | Nested payload for JsonPath practice |
| GET | `/api/users/{id}/location` | read | 5, 6 | Calls the Geo Service dependency |
| GET | `/api/contract` | none | 7 | The published user contract |

**User fields** (designed so you can practise every common validation):

| Field | Example | Rule | Good for practising |
|---|---|---|---|
| `id` | `"e1eb...f055"` | UUID, server-generated | `#uuid` |
| `employeeCode` | `"EMP-0002"` | `EMP-` + 4 digits | `#regex` |
| `name` | `"Arjun Mehta"` | **required**, 2 to 50 chars | BVA, `#string` |
| `email` | `"arjun@example.com"` | **required**, valid format, unique | 422, 409 |
| `role` | `"tester"` | **required**: tester, developer, manager, admin | enum checks |
| `age` | `29` | **required**, integer 18 to 65 | BVA, `#number` |
| `active` | `true` | boolean, default `true` | `#boolean` |
| `address` | `{ "city": "Pune", "zip": "41101" }` or `null` | optional | `#null`, nested objects |
| `skills` | `["manual", "flashpost"]` | array of strings | `#array`, `contains` |
| `managerId` | UUID or `null` | optional | `##uuid` (optional) |
| `createdAt` | `"2026-10-20T04:25:00.390Z"` | changes every run | `#ignore` |

**Seed data** (present after every restart):

| Name | Role | Age | Active | Zip | Why it's there |
|---|---|---|---|---|---|
| Priya Sharma | manager | 41 | true | 41101 | Team lead, `managerId` is `null` |
| Arjun Mehta | tester | 29 | true | 56001 | Filtering by role |
| Sara Khan | tester | 34 | true | 50001 | Filtering by role |
| Leo Fernandes | developer | 25 | **false** | **99999** | `active=false` filter, Geo Service crash |
| Mia Wong | developer | 52 | true | none | `address: null`, `/location` returns 422 |

**Geo Service magic zip codes** (both `geo-stub.js` and the Karate mock follow these):

| Zip | Geo Service does | Our API returns |
|---|---|---|
| 41101, 56001, 50001, 10001 | `200` with city/state/timezone | `200` enriched location |
| 00000 (or any unknown) | `404` | `404` "unknown to the geo service" |
| 99999 | `500` crash | `503 DEPENDENCY_UNAVAILABLE` |
| 77777 | answers after 3 s | `504 GATEWAY_TIMEOUT` after 2 s |
| (Geo Service not running) | nothing | `503` "Geo service is unreachable" |

### `server.js`

The complete file is in [user-service/server.js](user-service/server.js) (about 370 lines with comments). The key design ideas:

```js
// 1. Security: every /api/users route is wrapped in requireApiKey(permission)
function requireApiKey(permission) {
  return (req, res, next) => {
    const key = req.get('x-api-key');
    if (!key) return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing x-api-key header' });
    const client = API_KEYS[key];
    if (!client) return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid API key' });
    if (!client.permissions.includes(permission)) return res.status(403).json({ error: 'FORBIDDEN', ... });
    next();
  };
}

// 2. Validation in three layers, each with its own status code
//    missing fields      -> 400 { fields: ['email', 'role', 'age'] }
//    wrong types         -> 400 { details: ['age must be an integer'] }
//    business rules/BVA  -> 422 { errors: [{ field: 'age', message: 'age must be between 18 and 65' }] }

// 3. A real dependency call with a timeout, so error flows can be tested
geoRes = await fetch(`${GEO_SERVICE_URL}/geo/${zip}`, { signal: AbortSignal.timeout(2000) });
//    timeout -> 504, unreachable -> 503, 5xx -> 503, 404 -> 404
```

### `geo-stub.js`

See [user-service/geo-stub.js](user-service/geo-stub.js). It is a 30-line Express app answering `GET /geo/{zip}` with the magic-zip behaviour from the table above.

---

# Part 3: Manual Testing with Flashpost

## 3.1 Flashpost setup

1. Open the Flashpost panel in VS Code and create a collection called **User Service**.
2. Create an environment called **local** with these variables, and reference them as `{{baseUrl}}` and `{{testerKey}}`:

| Variable | Value |
|---|---|
| `baseUrl` | `http://localhost:3000` |
| `testerKey` | `tester-key-123` |
| `adminKey` | `admin-key-999` |
| `readOnlyKey` | `readonly-key-000` |

3. For every request with a body, set the body type to **JSON**. Flashpost then sends `Content-Type: application/json`.

> **Manual testing habit:** for every request, check **four things** in this order: ① status code, ② response body, ③ response headers, ④ response time. Write down what you expected *before* you click Send.

## 3.2 Exercise 1: Happy path / health check (Tier 1)

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{{baseUrl}}/api/health` |
| **Headers** | none |

**Expected response, `200 OK`:**
```json
{
  "status": "UP",
  "service": "user-service",
  "version": "1.0.0",
  "uptimeSeconds": 42,
  "timestamp": "2026-10-20T04:25:01.451Z",
  "dependencies": { "geoService": "http://localhost:18090" }
}
```

**Manual assertions:**
- [ ] Status is **200**
- [ ] `status` is exactly `"UP"` (case matters)
- [ ] `version` looks like `x.y.z`
- [ ] `uptimeSeconds` is a **number**, not a string (`42`, not `"42"`)
- [ ] Response header `x-correlation-id` is present and looks like a UUID
- [ ] Response time is under 1 second

**Try it:** send your own header `x-correlation-id: my-trace-123`. It must be echoed back unchanged.

## 3.3 Exercise 2: Query and path parameters (Tier 1)

**2a. Filter by role**

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{{baseUrl}}/api/users?role=tester` |
| **Headers** | `x-api-key: {{testerKey}}` |

**Expected `200 OK`:**
```json
{
  "data": [
    { "id": "…", "employeeCode": "EMP-0002", "name": "Arjun Mehta", "role": "tester", "age": 29, "...": "..." },
    { "id": "…", "employeeCode": "EMP-0003", "name": "Sara Khan",   "role": "tester", "age": 34, "...": "..." }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 2, "totalPages": 1 }
}
```

**Manual assertions:**
- [ ] Status **200**
- [ ] **Every** item in `data` has `role: "tester"` (scan all of them, not just the first)
- [ ] Arjun Mehta and Sara Khan are both present
- [ ] `pagination.total` equals the number of items in `data`

**2b. Combine parameters:** `{{baseUrl}}/api/users?role=developer&active=false` should return only **Leo Fernandes**.

**2c. Pagination:** `{{baseUrl}}/api/users?limit=2&page=2` should return 2 users and `totalPages: 3`.

**2d. Path parameter:** copy Arjun's `id` from 2a, then send `GET {{baseUrl}}/api/users/<that-id>`. Expect `200` and Arjun's record. Change one character of the id and send again. Expect **`404`** with `{ "error": "NOT_FOUND", ... }`.

**2e. Invalid query value:** `{{baseUrl}}/api/users?role=astronaut` should return **`400`**.

## 3.4 Exercise 3: Negative testing, missing mandatory fields (Tier 4)

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{{baseUrl}}/api/users` |
| **Headers** | `x-api-key: {{testerKey}}`, `Content-Type: application/json` |
| **Body** | `{ "name": "No Email Person" }` |

**Expected `400 Bad Request`:**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Missing mandatory fields",
  "fields": ["email", "role", "age"]
}
```

**Manual assertions:**
- [ ] Status is **400**, not 500 (a 500 means the server crashed, which is a bug)
- [ ] `fields` lists **exactly** the three missing fields
- [ ] No user was created: `GET /api/users` still shows the same total

**More negative cases to try:**

| Body | Expected | Why |
|---|---|---|
| `{}` | 400, `fields: ["name","email","role","age"]` | Everything missing |
| `{ "name": "A B", "email": "a@b.io", "role": "tester", "age": "thirty" }` | 400, `details: ["age must be an integer"]` | Wrong type |
| `{ "name": "A B", "email": "a@b.io", "role": "tester", "age": 30.5 }` | 400 | Not an integer |
| `{ "name": "A B", "email": "a@b.io", "role": "tester", "age": 30, "active": "yes" }` | 400 | `active` must be boolean |
| `{ broken json` | 400, "Request body is not valid JSON" | Malformed body |
| A valid body sent **twice** with the same email | 1st `201`, 2nd **409** | Duplicate |

## 3.5 Exercise 4: Boundary value testing (Tier 4)

Same request as Exercise 3, with a valid body. Only change `age` (use a new email each time to avoid `409`):

```json
{
  "name": "Boundary Test",
  "email": "bva-18@example.com",
  "role": "developer",
  "age": 18
}
```

| `age` | Expected status | Expected body |
|---|---|---|
| 17 | **422** | `errors: [{ "field": "age", "message": "age must be between 18 and 65" }]` |
| **18** | **201** | the created user, `age: 18` |
| 19 | 201 | |
| 64 | 201 | |
| **65** | **201** | |
| 66 | **422** | same error as 17 |
| 0, -1 | 422 | |

**Expected `422 Unprocessable Entity`:**
```json
{
  "error": "UNPROCESSABLE_ENTITY",
  "message": "Business rule violation",
  "errors": [ { "field": "age", "message": "age must be between 18 and 65" } ]
}
```

**Manual assertions:**
- [ ] Both boundaries (18 and 65) are **accepted**
- [ ] Just outside (17 and 66) is **rejected with 422**, not 400 or 500
- [ ] The error names the right `field`
- [ ] On `201`: response header `Location` is `/api/users/<new id>`

**Repeat the technique** for `name` (1, 2, 50, 51 characters), `role` (`intern`, `Tester` with a capital T), `email` (`not-an-email`, `someone@example`), and `limit` on `GET /api/users?limit=0|1|50|51`.

## 3.6 Exercise 5: Security / authorization (side track)

Same request every time, `GET {{baseUrl}}/api/users`. Only the header changes:

| # | `x-api-key` header | Expected status | Expected `message` |
|---|---|---|---|
| 5a | *(no header)* | **401** | `Missing x-api-key header` |
| 5b | `not-a-real-key` | **401** | `Invalid API key` |
| 5c | `tester-key-123` | **200** | list of users |
| 5d | `readonly-key-000` on `POST /api/users` with a valid body | **403** | `...lacks 'write' permission` |
| 5e | `tester-key-123` on `DELETE /api/users/{id}` | **403** | `...lacks 'delete' permission` |
| 5f | `admin-key-999` on `DELETE /api/users/{id}` | **204** | empty body |

**Manual assertions:**
- [ ] 401 = *not identified*, 403 = *identified but not allowed*. Both must happen *before* any data changes.
- [ ] Error messages don't leak secrets (no stack traces, no list of valid keys)
- [ ] `/api/health` works **without** a key (it's public on purpose)

## 3.7 Bonus exercises for the upper tiers

**Tier 2: a business flow.** Do these in order, copying values from each response into the next request:

1. `POST /api/users` (tester key), body `{ "name": "Flow Tester", "email": "flow1@example.com", "role": "tester", "age": 30, "city": "Pune", "zip": "41101" }`. Expect **201**. Copy the `id`.
2. `GET /api/users/{id}`. Expect **200** with the same data.
3. `PATCH /api/users/{id}`, body `{ "role": "manager" }`. Expect **200**, `role: "manager"`.
4. `DELETE /api/users/{id}` with the **tester** key. Expect **403**.
5. `DELETE /api/users/{id}` with the **admin** key. Expect **204**.
6. `GET /api/users/{id}`. Expect **404**.

**Tier 3: nested payload.** `GET /api/teams/1` returns a team with a `lead` object and a `members` array. Check by eye: are both member `id`s numbers? Are all names capitalised?

**Tiers 5 and 6: dependencies.** Make sure `npm run geo` is running, then:

| Request | Expected |
|---|---|
| `GET /api/users/<Arjun's id>/location` | 200, `city: "Bengaluru"` |
| `GET /api/users/<Leo's id>/location` (zip 99999) | **503** `DEPENDENCY_UNAVAILABLE` |
| `GET /api/users/<Mia's id>/location` (no address) | **422** |
| Create a user with zip `77777`, then call its `/location` | **504** after about 2 s |
| **Stop** `npm run geo`, then call Arjun's `/location` | **503** "unreachable" |

That last one shows why we need mocks: manually, you had to kill a process to test it. Karate can do this on demand.

**Tier 7: contract.** `GET /api/contract` lists every field consumers may rely on. Compare it with a real user from `GET /api/users`. Is every field there, with the promised type?

---

# Part 4: Automating with Karate 2.1.2

## 4.1 Why Karate?

| Feature | What it means for a manual tester |
|---|---|
| **API assertions** | Low-code schema matching: `match response == { id: '#uuid' }` |
| **End-user workflows** | Chain calls and pass data between them, like your Flashpost flow |
| **Data-driven testing** | Loop over a table or CSV file of test cases |
| **Parallel execution** | 53 scenarios here run in about 3 seconds |
| **Java interop** | Test DB calls, async flows, gRPC, Kafka when you need more |
| **Reuse as performance tests** | The same feature files can drive Gatling load tests |
| **Easy for non-programmers** | Plain-English Gherkin. No Java step definitions to write |

## 4.2 Set up Karate 2.1.2

**Requirements:**

| Tool | Version | Check with |
|---|---|---|
| Java (JDK) | **21 or newer** (Karate 2 uses virtual threads) | `java -version` |
| Maven | 3.9+ | `mvn -v` |
| An IDE | VS Code with the "Karate" extension, or IntelliJ | |

**Important differences from Karate 1.x** (most online tutorials still show 1.x):

| | Karate 1.x | **Karate 2.x** |
|---|---|---|
| Maven group | `com.intuit.karate` → `io.karatelabs` (1.4+) | `io.karatelabs` |
| JUnit artifact | `karate-junit5` | **`karate-junit6`** (there is **no** `karate-junit5:2.1.2`) |
| Core artifact | `karate-core` | `karate-core` (pulled in by `karate-junit6`) |
| JUnit | bundled | **you add `junit-jupiter` yourself** |
| Runner class | `com.intuit.karate.Runner` | `io.karatelabs.core.Runner` |
| Results class | `com.intuit.karate.Results` | `io.karatelabs.core.SuiteResult` |
| Mock server | `com.intuit.karate.core.MockServer` | `io.karatelabs.core.MockServer` |
| Java | 11+ / 17+ | **21+** |

### `pom.xml`

```xml
<properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <maven.compiler.release>21</maven.compiler.release>
    <karate.version>2.1.2</karate.version>
    <junit.version>6.1.2</junit.version>   <!-- the JUnit version Karate 2.1.2 is built against -->
</properties>

<dependencies>
    <dependency>
        <groupId>io.karatelabs</groupId>
        <artifactId>karate-junit6</artifactId>
        <version>${karate.version}</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter</artifactId>
        <version>${junit.version}</version>
        <scope>test</scope>
    </dependency>
</dependencies>

<build>
    <!-- lets .feature / .json / .csv files live next to the Java runner -->
    <testResources>
        <testResource>
            <directory>src/test/java</directory>
            <excludes><exclude>**/*.java</exclude></excludes>
        </testResource>
    </testResources>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-surefire-plugin</artifactId>
            <version>3.5.3</version>
        </plugin>
    </plugins>
</build>
```

Full file: [karate-tests/pom.xml](karate-tests/pom.xml).

> **Corporate network tip:** if Maven fails with `PKIX path building failed`, your network inspects HTTPS traffic and Java doesn't trust its certificate. On Windows, tell Java to use the Windows certificate store (PowerShell):
> ```powershell
> $env:MAVEN_OPTS="-Djavax.net.ssl.trustStoreType=Windows-ROOT"; mvn test
> ```

### `karate-config.js`: shared settings for every feature

```javascript
function fn() {
  var env = karate.env || 'local';          // mvn test -Dkarate.env=qa
  var config = {
    env: env,
    baseUrl: 'http://localhost:3000',
    apiKeys: {
      tester: 'tester-key-123',
      admin: 'admin-key-999',
      readOnly: 'readonly-key-000'
    },
    // a fresh email per call, so tests never collide (no accidental 409)
    uniqueEmail: function (prefix) {
      return (prefix || 'user') + '.' + new Date().getTime() + '.' + Math.floor(Math.random() * 100000) + '@example.com';
    }
  };
  if (env == 'qa') config.baseUrl = 'http://qa.example.internal:3000';
  karate.configure('connectTimeout', 5000);
  karate.configure('readTimeout', 10000);
  return config;
}
```

This is the Karate version of your Flashpost **environment**: `baseUrl` and `apiKeys.tester` replace `{{baseUrl}}` and `{{testerKey}}`.

## 4.3 The JUnit runner: `UsersTest.java`

```java
package users;

import static org.junit.jupiter.api.Assertions.assertEquals;

import io.karatelabs.core.MockServer;
import io.karatelabs.core.Runner;
import io.karatelabs.core.SuiteResult;
import java.io.IOException;
import java.net.ServerSocket;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

/**
 * JUnit runner for the user-service Karate suite.
 *
 * Prerequisite: user-service is running on http://localhost:3000
 * (cd user-service && npm start). Stop geo-stub.js first - this class
 * starts a Karate mock of the Geo Service on the same port (default 18090).
 *
 * Run everything:     mvn test
 * Run one tier only:  mvn test -Dtags=@tier4
 * Other Geo port:     mvn test -Dgeo.port=19090  (start user-service with GEO_SERVICE_URL=http://localhost:19090)
 * HTML report:        target/karate-reports/karate-summary.html
 */
class UsersTest {

    static MockServer geoMock;

    @BeforeAll
    static void startGeoMock() {
        int port = Integer.getInteger("geo.port", 18090);
        // Fail with a readable message instead of a raw BindException
        try (ServerSocket probe = new ServerSocket(port)) {
            // port is free; the probe closes immediately
        } catch (IOException e) {
            throw new IllegalStateException("Port " + port + " is already in use, so the Geo Service mock cannot start. "
                    + "Stop geo-stub.js (or whatever else holds the port), or pick another port with -Dgeo.port=NNNN "
                    + "and restart user-service with GEO_SERVICE_URL=http://localhost:NNNN", e);
        }
        // Tier 5: replace the real downstream service with a Karate mock
        geoMock = MockServer.feature("classpath:users/geo-mock.feature").port(port).start();
    }

    @AfterAll
    static void stopGeoMock() {
        if (geoMock != null) {
            geoMock.stopAsync();
        }
    }

    @Test
    void testAll() {
        // users.feature        -> the exact scenarios testers ran manually in Flashpost
        // validation.feature   -> Tier 3 schema / JsonPath / fuzzy-matcher examples
        // dependencies.feature -> Tier 5 + 6 mocks and error flows
        // contract.feature     -> Tier 7 contract tests
        // Helper features (geo-mock, create-user) are tagged @ignore so they never run alone.
        Runner.Builder runner = Runner.path("classpath:users")
                .global("geoUrl", "http://localhost:" + geoMock.getPort())
                .outputJunitXml(true);
        String tags = System.getProperty("tags");
        if (tags == null || tags.isBlank()) {
            runner.tags("~@ignore");
        } else {
            runner.tags("~@ignore", tags);
        }
        // Scenarios are independent (unique test data), so run them on 5 threads
        SuiteResult result = runner.parallel(5);
        assertEquals(0, result.getScenarioFailedCount(), String.join("\n", result.getErrors()));
    }
}
```

Why this style? `Runner...parallel()` plus `assertEquals` runs scenarios in parallel **and** makes `mvn test` fail (exit code 1) when any scenario fails, which is what CI pipelines need. Karate 2 also offers `@Karate.Test` from `io.karatelabs.junit6.Karate` for running single features from the IDE.

## 4.4 Run the suite

```bash
cd user-service && npm start
```

In a second terminal. **Stop `geo-stub.js` first**: the runner starts its own Geo mock on port 18090. If that port is taken by another app, run `mvn test -Dgeo.port=19090` and start user-service with `GEO_SERVICE_URL=http://localhost:19090`.

```bash
cd karate-tests && mvn test
```

Run only one tier or tag:

```bash
mvn test -Dtags=@tier4
```

Open the report: `karate-tests/target/karate-reports/karate-summary.html`. Every request and response is logged there. It's the best place to learn from a failure.

## 4.5 `users.feature`: your Flashpost exercises, automated

Read it side by side with Part 3. Each Flashpost click becomes one line.

| Flashpost action | Karate line |
|---|---|
| Pick environment `local` | `* url baseUrl` (from `karate-config.js`) |
| Type the URL path | `Given path 'api', 'users'` |
| Add a query param | `And param role = 'tester'` |
| Add a header | `And header x-api-key = testerKey` |
| Paste a JSON body | `And request { name: 'X' }` |
| Choose the method and click Send | `When method post` |
| Look at the status | `Then status 201` |
| Read the body | `And match response.name == 'X'` |

### Exercise 1: Health check (`200 OK`)

```gherkin
  @tier1 @smoke
  Scenario: Health check returns 200 and the service is UP
    Given path 'api', 'health'
    When method get
    Then status 200
    And match response.status == 'UP'
    And match response ==
      """
      {
        status: 'UP',
        service: 'user-service',
        version: '#regex \\d+\\.\\d+\\.\\d+',
        uptimeSeconds: '#number',
        timestamp: '#string',
        dependencies: { geoService: '#string' }
      }
      """
    And match header x-correlation-id == '#uuid'
    # A lightweight performance guard - not a load test
    And assert responseTime < 1000
```

### Exercise 2: Query parameter filtering (`GET /api/users?role=tester`)

```gherkin
  @tier1 @query
  Scenario: Filter users by role with a query parameter
    Given path 'api', 'users'
    And header x-api-key = testerKey
    And param role = 'tester'
    When method get
    Then status 200
    And match response.data == '#[_ > 0]'
    And match each response.data contains { role: 'tester' }
    And match response.data[*].name contains ['Arjun Mehta', 'Sara Khan']
    And match response.pagination == { page: 1, limit: 10, total: '#number', totalPages: '#number' }

  @tier1 @query
  Scenario: Combine several query parameters
    Given path 'api', 'users'
    And header x-api-key = testerKey
    And params { role: 'developer', active: 'false' }
    When method get
    Then status 200
    And match each response.data contains { role: 'developer', active: false }
```

`match each` is the automated version of "scan **every** item, not just the first".

### Exercise 3: Negative payload validation (`400 Bad Request`)

```gherkin
  @tier4 @negative
  Scenario: Missing mandatory fields returns 400 with the list of missing fields
    Given path 'api', 'users'
    And header x-api-key = testerKey
    And request { name: 'No Email Person' }
    When method post
    Then status 400
    And match response.error == 'VALIDATION_ERROR'
    And match response.fields contains only ['email', 'role', 'age']

  @tier4 @negative
  Scenario Outline: Wrong data type for <field> returns 400
    * def payload = { name: 'Type Check', email: '#(uniqueEmail("type"))', role: 'tester', age: 30 }
    * set payload.<field> = <badValue>
    Given path 'api', 'users'
    And header x-api-key = testerKey
    And request payload
    When method post
    Then status 400
    And match response.details[0] contains '<field>'

    Examples:
      | field  | badValue |
      | age    | 'thirty' |
      | age    | 30.5     |
      | name   | 12345    |
      | active | 'yes'    |
      | skills | 'java'   |
```

`contains only` = same items, any order. `'#(uniqueEmail("type"))'` is an **embedded expression**: Karate evaluates it and puts the result into the JSON.

### Exercise 4: Boundary value validation (`422 Unprocessable Entity`)

```gherkin
  @tier4 @boundary
  Scenario Outline: Age <age> is on or inside the boundary -> 201 Created
    Given path 'api', 'users'
    And header x-api-key = testerKey
    And request { name: 'Boundary Ok', email: '#(uniqueEmail("bva"))', role: 'developer', age: <age> }
    When method post
    Then status 201
    And match response.age == <age>

    Examples:
      | age |
      | 18  |
      | 19  |
      | 64  |
      | 65  |

  @tier4 @boundary
  Scenario Outline: Age <age> is outside the boundary -> 422 Unprocessable Entity
    Given path 'api', 'users'
    And header x-api-key = testerKey
    And request { name: 'Boundary Bad', email: '#(uniqueEmail("bva"))', role: 'developer', age: <age> }
    When method post
    Then status 422
    And match response.errors[0] == { field: 'age', message: 'age must be between 18 and 65' }

    Examples:
      | age |
      | 17  |
      | 66  |
      | 0   |
      | -1  |
```

**Data-driven from a CSV file** ("ideally data-driven for maintainability"). A business analyst can add a row without touching the feature:

`boundary-data.csv`
```csv
description,name,emailValue,role,age,expectedStatus,errorField
name 1 char (below min),A,UNIQUE,tester,30,422,name
name 2 chars (min),Al,UNIQUE,tester,30,201,
role not in allowed list,Role Check,UNIQUE,intern,30,422,role
email without @,Email Check,not-an-email,tester,30,422,email
age 17,Age Check,UNIQUE,tester,17,422,age
...
```

```gherkin
  @tier4 @boundary @data-driven
  Scenario Outline: CSV row - <description>
    * def email = emailValue == 'UNIQUE' ? uniqueEmail('csv') : emailValue
    Given path 'api', 'users'
    And header x-api-key = testerKey
    And request { name: '#(name)', email: '#(email)', role: '#(role)', age: '#(~~age)' }
    When method post
    # CSV cells are always strings, so ~~ converts '201' to the number 201
    Then match responseStatus == ~~expectedStatus
    * def actualErrorField = responseStatus == 422 ? response.errors[0].field : ''
    And match actualErrorField == errorField

    Examples:
      | read('boundary-data.csv') |
```

### Exercise 5: Header-based security (`401` vs `200`)

```gherkin
  @security
  Scenario: Missing API key returns 401
    Given path 'api', 'users'
    When method get
    Then status 401
    And match response == { error: 'UNAUTHORIZED', message: 'Missing x-api-key header' }

  @security
  Scenario: Invalid API key returns 401
    Given path 'api', 'users'
    And header x-api-key = 'not-a-real-key'
    When method get
    Then status 401
    And match response.message == 'Invalid API key'

  @security
  Scenario: Valid API key returns 200
    Given path 'api', 'users'
    And header x-api-key = testerKey
    When method get
    Then status 200
    And match response.data == '#array'

  @security
  Scenario: Read-only key cannot create a user (403 Forbidden)
    Given path 'api', 'users'
    And header x-api-key = apiKeys.readOnly
    And request { name: 'Blocked', email: '#(uniqueEmail("ro"))', role: 'tester', age: 30 }
    When method post
    Then status 403
    And match response.error == 'FORBIDDEN'
```

## 4.6 Climbing the pyramid with Karate

### Tier 2: chained business flow

Data from one response feeds the next request: `* def userId = response.id`.

```gherkin
  @tier2 @flow
  Scenario: Onboard, update and off-board an employee
    * def newUser = { name: 'Flow Tester', email: '#(uniqueEmail("flow"))', role: 'tester', age: 30, city: 'Pune', zip: '41101', skills: ['karate'] }
    Given path 'api', 'users'
    And header x-api-key = testerKey
    And request newUser
    When method post
    Then status 201
    And match header Location == '/api/users/' + response.id
    * def userId = response.id

    Given path 'api', 'users', userId
    And header x-api-key = testerKey
    When method get
    Then status 200
    And match response contains { name: 'Flow Tester', role: 'tester', active: true }

    Given path 'api', 'users', userId
    And header x-api-key = testerKey
    And request { role: 'manager', skills: ['karate', 'leadership'] }
    When method patch
    Then status 200
    And match response.skills contains 'leadership'

    Given path 'api', 'users', userId
    And header x-api-key = testerKey
    When method delete
    Then status 403

    Given path 'api', 'users', userId
    And header x-api-key = apiKeys.admin
    When method delete
    Then status 204

    Given path 'api', 'users', userId
    And header x-api-key = testerKey
    When method get
    Then status 404
```

### Tier 3: payload and schema assertions (`validation.feature`)

`GET /api/teams/1` is shaped like the classic "cat and kittens" example:

```json
{
  "id": 1, "name": "Quality Guild",
  "lead": { "id": "<uuid>", "name": "Priya Sharma" },
  "members": [
    { "id": 101, "userId": "<uuid>", "name": "Arjun", "skills": ["manual", "flashpost"] },
    { "id": 102, "userId": "<uuid>", "name": "Sara",  "skills": ["karate", "sql"] }
  ]
}
```

```gherkin
    # Normal paths
    Then match team.members[0] contains { name: 'Arjun', id: 101 }
    Then match team.members[0].id == 101

    # JsonPath wildcards: [*] collects a field from every array element
    Then match team.members[*].id == [101, 102]
    Then match team.members[*].id contains 101
    Then match team.members[*].id contains [102, 101]

    # Deep scan: .. finds a key at any depth (root, lead, members)
    Then match team..name == ['Quality Guild', 'Priya Sharma', 'Arjun', 'Sara']

    # 'each' applies the same check to every element
    Then match each team.members contains { id: '#number' }
    Then match each team.members == { id: '#notnull', userId: '#uuid', name: '#regex [A-Z][a-z]+', skills: '#[] #string' }

    # Predicate: any JavaScript function can be a matcher
    * def isLessThan200 = function(x) { return x < 200 }
    Then match each team.members[*].id == '#? isLessThan200(_)'
```

**Fuzzy-matcher cheat sheet** applied to one user:

| Type | Directive | Used on |
|---|---|---|
| Ignore / exists | `#ignore`, `#null`, `#notnull`, `#present`, `#notpresent` | `createdAt`, `managerId`, `nickname` |
| Primitive type | `#boolean`, `#number`, `#string` | `active`, `age`, `name` |
| Complex type | `#array`, `#object` | `skills`, `address` |
| Special | `#uuid` | `id` |
| RegEx | `#regex <pattern>` | `employeeCode: '#regex EMP-\\d{4}'` |
| Predicate | `#? <expression>` (`_` is the value) | `age: '#number? _ >= 18 && _ <= 65'` |
| Optional | `##<type>` (may be null or missing) | `managerId: '##uuid'` |
| Array size + type | `#[n] #type` | `skills: '#[2] #string'` |

```gherkin
    Then match user ==
      """
      {
        id:           '#uuid',
        employeeCode: '#regex EMP-\\d{4}',
        name:         '#string',
        email:        '#regex .+@.+\\..+',
        role:         'manager',
        age:          '#number? _ >= 18 && _ <= 65',
        active:       '#boolean',
        address:      '#object',
        skills:       '#array',
        managerId:    '#null',
        createdAt:    '#ignore'
      }
      """
```

### Tier 5: mock the API you depend on

`geo-mock.feature` is a fake Geo Service written in Karate. `UsersTest.java` starts it on port 18090 before the tests run.

```gherkin
@ignore
Feature: Geo Service mock

  Background:
    * def zips = { '56001': { city: 'Bengaluru', state: 'Karnataka', timezone: 'Asia/Kolkata' }, ... }

  # Tier 6 error flow: the dependency crashes
  Scenario: pathMatches('/geo/99999')
    * def responseStatus = 500
    * def response = { error: 'geo database offline' }

  # Tier 6 error flow: the dependency is too slow
  Scenario: pathMatches('/geo/77777')
    * def responseDelay = 3000
    * def response = { zip: '77777', city: 'Slowtown', state: 'NA', timezone: 'UTC' }

  # Known zip -> 200, unknown zip -> 404
  Scenario: pathMatches('/geo/{zip}')
    * def geo = zips[pathParams.zip]
    * def responseStatus = geo ? 200 : 404
    * def response = geo ? karate.merge({ zip: pathParams.zip }, geo) : { error: 'unknown zip ' + pathParams.zip }
```

The happy path through the mock (`dependencies.feature`), using a **reusable feature** to create test data:

```gherkin
  @tier5 @mock
  Scenario: Happy path - mocked Geo Service enriches the user's location
    * def created = call read('create-user.feature') { zip: '56001' }
    * def userId = created.user.id
    Given path 'api', 'users', userId, 'location'
    And header x-api-key = testerKey
    When method get
    Then status 200
    And match response contains { city: 'Bengaluru', state: 'Karnataka', source: 'geo-service' }
```

### Tier 6: error flows involving mocks

These are hard to test manually (you had to kill a process). With the mock they are one scenario each:

```gherkin
  @tier6 @mock @error-flow
  Scenario: Dependency crashes (500) -> our API degrades gracefully to 503
    * def created = call read('create-user.feature') { zip: '99999' }
    * def userId = created.user.id
    Given path 'api', 'users', userId, 'location'
    And header x-api-key = testerKey
    When method get
    Then status 503
    And match response == { error: 'DEPENDENCY_UNAVAILABLE', message: 'Geo service returned 500' }

  @tier6 @mock @error-flow
  Scenario: Dependency is too slow -> our API times out with 504
    * def created = call read('create-user.feature') { zip: '77777' }
    * def userId = created.user.id
    Given path 'api', 'users', userId, 'location'
    And header x-api-key = testerKey
    When method get
    Then status 504
    And match response.error == 'GATEWAY_TIMEOUT'
    # The service must give up quickly, not hang for the full 3 s delay
    And assert responseTime < 2800
```

### Tier 7: contract testing (`contract.feature`)

`user-contract.json` is the contract: one file, reused everywhere.

```json
{
  "id": "#uuid",
  "employeeCode": "#regex EMP-\\d{4}",
  "name": "#string? _.length >= 2 && _.length <= 50",
  "email": "#regex [^@\\s]+@[^@\\s]+\\.[^@\\s]+",
  "role": "#? ['tester', 'developer', 'manager', 'admin'].indexOf(_) != -1",
  "age": "#number? _ >= 18 && _ <= 65",
  "active": "#boolean",
  "address": "#? _ == null || karate.match(_, addressSchema).pass",
  "skills": "#array",
  "managerId": "##uuid",
  "createdAt": "#regex \\d{4}-\\d{2}-\\d{2}T.+Z"
}
```

```gherkin
  Background:
    * url baseUrl
    * header x-api-key = apiKeys.tester
    * def addressSchema = { city: '##string', zip: '#regex \\d{5}' }
    * def userContract = read('user-contract.json')

  # Provider side: what we serve must honour the contract
  Scenario: Provider - every user in the list honours the contract
    Given path 'api', 'users'
    And param limit = 50
    When method get
    Then status 200
    And match each response.data == userContract

  # The published contract and the tested contract must list the same fields
  Scenario: Provider - the published contract lists the agreed fields and roles
    Given path 'api', 'contract'
    When method get
    Then status 200
    * def publishedFields = karate.keysOf(response.user)
    * def testedFields = karate.keysOf(userContract)
    And match publishedFields contains only testedFields

  # Consumer side: the Geo Service (our mock now, the real one later) must honour what we rely on
  Scenario: Consumer - the Geo Service (mock or real) honours what we depend on
    * def geoContract = read('geo-contract.json')
    Given url geoUrl
    And path 'geo', '41101'
    When method get
    Then status 200
    And match response == geoContract
```

> **Two Karate 2.1.2 quirks we hit while building this kit** (both are worked around in the files above):
> - `'#[] #string'` **fails on an empty array** `[]`. Use `'#array'` when the array may be empty.
> - `'##(someSchema)'` does **not** accept `null`. Use `'#? _ == null || karate.match(_, someSchema).pass'`.
> - Free-text Feature descriptions whose lines start with `@` or `*` confuse the parser and the `Background` silently doesn't run. Write descriptions as `#` comments.

### Side tracks: performance and security

- **Security** is covered by the `@security` scenarios (401 / 403 / 200) and by the `403` step inside the Tier 2 flow.
- **Performance:** `assert responseTime < 1000` is a cheap guard on every run. For real load tests, Karate's Gatling integration (`io.karatelabs:karate-gatling`) reuses these same feature files as load scripts, so nothing is rewritten.

---

# Part 5: Quick Reference: Manual Check to Karate Syntax

| # | Manual check in Flashpost | Karate syntax | Tier |
|---|---|---|---|
| 1 | Select the `local` environment | `* url baseUrl` (from `karate-config.js`) | setup |
| 2 | Enter the path | `Given path 'api', 'users', userId` | 1 |
| 3 | Add a query param | `And param role = 'tester'` / `And params { role: 'x', limit: 5 }` | 1 |
| 4 | Add a header | `And header x-api-key = testerKey` | Security |
| 5 | Paste a JSON body | `And request { name: 'Asha', age: 30 }` | 1 |
| 6 | Click Send | `When method get` / `post` / `patch` / `delete` | 1 |
| 7 | Status is 200 | `Then status 200` | 1 |
| 8 | Status is one of a range | `* assert responseStatus >= 200 && responseStatus < 300` | 1 |
| 9 | A field has a value | `And match response.status == 'UP'` | 3 |
| 10 | Body contains these fields (ignore others) | `And match response contains { role: 'tester' }` | 3 |
| 11 | **Every** list item has a property | `And match each response.data contains { role: 'tester' }` | 3 |
| 12 | List contains certain values | `And match response.data[*].name contains ['Arjun Mehta']` | 3 |
| 13 | List has exactly these, any order | `And match response.fields contains only ['email','role','age']` | 3 |
| 14 | List has N items | `And match response.data == '#[2]'` | 3 |
| 15 | Field is a number / string / boolean | `'#number'` / `'#string'` / `'#boolean'` | 3 |
| 16 | Field is a UUID | `'#uuid'` | 3 |
| 17 | Field matches a pattern | `'#regex EMP-\\d{4}'` | 3 |
| 18 | Field may be null or missing | `'##uuid'`, `'##string'` | 3 |
| 19 | Field is null / must not exist | `'#null'` / `'#notpresent'` | 3 |
| 20 | Ignore a changing field (timestamp) | `createdAt: '#ignore'` | 3 |
| 21 | Custom rule (age 18 to 65) | `'#number? _ >= 18 && _ <= 65'` | 3 |
| 22 | Search anywhere in the body | `match response..name contains 'Sara'` | 3 |
| 23 | Same schema for every response | `* def schema = read('user-contract.json')` then `match each response.data == schema` | 3, 7 |
| 24 | Response header present | `And match header Location == '#string'` | 3 |
| 25 | Copy a value into the next request | `* def userId = response.id` | 2 |
| 26 | Repeat with different inputs | `Scenario Outline:` + `Examples:` table | 4 |
| 27 | Test cases kept in a spreadsheet | `Examples:` with `\| read('boundary-data.csv') \|` | 4 |
| 28 | Reuse a common step (create a user) | `* def created = call read('create-user.feature') { zip: '56001' }` | 2 |
| 29 | Fake a dependency | `MockServer.feature('classpath:users/geo-mock.feature').port(118090).start()` | 5 |
| 30 | Make the dependency fail or be slow | in the mock: `* def responseStatus = 500` / `* def responseDelay = 3000` | 6 |
| 31 | Response time OK | `And assert responseTime < 1000` | Perf |
| 32 | Print a value while debugging | `* print response` | any |
| 33 | Run only some tests | tag scenarios `@smoke`, then `mvn test -Dtags=@smoke` | any |

## Suggested learning path

| Day | Activity |
|---|---|
| 1 | Part 1, start the API, Flashpost Exercises 1 and 2 |
| 2 | Flashpost Exercises 3 to 5, write your own BVA table for `name` |
| 3 | Bonus exercises (Tiers 2, 5, 6, 7) by hand |
| 4 | Install Java and Maven, run `mvn test`, read the HTML report |
| 5 | Read `users.feature` next to Part 3. Break one assertion on purpose and watch it fail |
| 6 | Add a CSV row for `zip` boundaries (`1234`, `12345`, `123456`) |
| 7 | Write your own scenario: `PATCH` with `age: 70` should return 422 |
