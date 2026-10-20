/**
 * Mini User Management API - training microservice for API testing.
 *
 * Every endpoint exists to let testers practise one tier of the
 * "API Testing Hierarchy of Needs" pyramid:
 *
 *   Tier 1  Status codes ............ /api/health, every endpoint
 *   Tier 2  Chained business flows .. POST -> GET -> PATCH -> DELETE -> GET(404)
 *   Tier 3  Payload/schema asserts .. user + team payloads (uuid, regex, null, nested arrays)
 *   Tier 4  Boundary & negative ..... age 18-65, name 2-50, limit 1-50, role enum
 *   Tier 5  Mock dependencies ....... /api/users/:id/location calls the Geo Service
 *   Tier 6  Error flows w/ mocks .... Geo Service 404 / 500 / slow -> 404 / 503 / 504
 *   Tier 7  Contract testing ........ /api/contract publishes the user contract
 *   Side    Security ................ x-api-key -> 401 / 403
 *
 * In-memory only: restart the server to reset the data.
 */
const express = require('express');
const crypto = require('crypto');

const PORT = Number(process.env.PORT) || 3000;
// The downstream service this API depends on (Tier 5/6). Start geo-stub.js
// for manual testing, or let Karate start its own mock on the same port.
const GEO_SERVICE_URL = process.env.GEO_SERVICE_URL || 'http://localhost:18090';
const GEO_TIMEOUT_MS = 2000;

// ---------------------------------------------------------------------------
// Security: API keys and what each one is allowed to do
// ---------------------------------------------------------------------------
const API_KEYS = {
  'tester-key-123': { name: 'Tester', permissions: ['read', 'write'] },
  'admin-key-999': { name: 'Admin', permissions: ['read', 'write', 'delete'] },
  'readonly-key-000': { name: 'Read Only', permissions: ['read'] },
};

// ---------------------------------------------------------------------------
// Business rules (boundaries) - deliberately simple so testers can find edges
// ---------------------------------------------------------------------------
const RULES = {
  AGE_MIN: 18,
  AGE_MAX: 65,
  NAME_MIN: 2,
  NAME_MAX: 50,
  ROLES: ['tester', 'developer', 'manager', 'admin'],
  LIMIT_MIN: 1,
  LIMIT_MAX: 50,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  ZIP_REGEX: /^\d{5}$/,
};

// ---------------------------------------------------------------------------
// In-memory data
// ---------------------------------------------------------------------------
let employeeSeq = 0;
const users = new Map();
let teamMemberIds = []; // fixed at seed time so the team payload stays stable

function nextEmployeeCode() {
  employeeSeq += 1;
  return 'EMP-' + String(employeeSeq).padStart(4, '0');
}

function buildUser({ name, email, role, age, active = true, city = null, zip = null, skills = [], managerId = null }) {
  return {
    id: crypto.randomUUID(),
    employeeCode: nextEmployeeCode(),
    name,
    email: email.toLowerCase(),
    role,
    age,
    active,
    address: zip ? { city, zip } : null,
    skills,
    managerId,
    createdAt: new Date().toISOString(),
  };
}

function seed() {
  users.clear();
  employeeSeq = 0;
  const priya = buildUser({ name: 'Priya Sharma', email: 'priya@example.com', role: 'manager', age: 41, city: 'Pune', zip: '41101', skills: ['planning', 'jira'] });
  [
    priya,
    buildUser({ name: 'Arjun Mehta', email: 'arjun@example.com', role: 'tester', age: 29, city: 'Bengaluru', zip: '56001', skills: ['manual', 'flashpost'], managerId: priya.id }),
    buildUser({ name: 'Sara Khan', email: 'sara@example.com', role: 'tester', age: 34, city: 'Hyderabad', zip: '50001', skills: ['karate', 'sql'], managerId: priya.id }),
    buildUser({ name: 'Leo Fernandes', email: 'leo@example.com', role: 'developer', age: 25, active: false, city: 'Goa', zip: '99999', skills: ['node', 'java'], managerId: priya.id }),
    buildUser({ name: 'Mia Wong', email: 'mia@example.com', role: 'developer', age: 52, skills: ['react'] }),
  ].forEach((u) => users.set(u.id, u));
  teamMemberIds = [...users.values()].filter((u) => u.role === 'tester').map((u) => u.id);
}
seed();

// A team document with nested arrays - mirrors the "cat.kittens" JsonPath examples.
function getTeam() {
  const lead = [...users.values()].find((u) => u.role === 'manager');
  return {
    id: 1,
    name: 'Quality Guild',
    lead: lead ? { id: lead.id, name: lead.name } : null,
    members: teamMemberIds
      .map((id) => users.get(id))
      .filter(Boolean)
      .map((u, i) => ({ id: 101 + i, userId: u.id, name: u.name.split(' ')[0], skills: u.skills })),
  };
}

// ---------------------------------------------------------------------------
// App & middleware
// ---------------------------------------------------------------------------
const app = express();
app.use(express.json());

// Malformed JSON body -> 400 instead of Express's default HTML error page
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'Request body is not valid JSON' });
  }
  next(err);
});

// Echo a correlation id back so testers can practise header assertions
app.use((req, res, next) => {
  res.set('x-correlation-id', req.get('x-correlation-id') || crypto.randomUUID());
  next();
});

function requireApiKey(permission) {
  return (req, res, next) => {
    const key = req.get('x-api-key');
    if (!key) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing x-api-key header' });
    }
    const client = API_KEYS[key];
    if (!client) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid API key' });
    }
    if (!client.permissions.includes(permission)) {
      return res.status(403).json({ error: 'FORBIDDEN', message: `API key '${client.name}' lacks '${permission}' permission` });
    }
    req.client = client;
    next();
  };
}

// Returns { status, body } when the payload is invalid, otherwise null.
// 400 = the request is structurally broken (missing field, wrong type).
// 422 = the request is well-formed but breaks a business rule (out of range).
function validateUser(body, { partial = false } = {}) {
  const required = ['name', 'email', 'role', 'age'];
  if (!partial) {
    const missing = required.filter((f) => body[f] === undefined || body[f] === null || body[f] === '');
    if (missing.length) {
      return { status: 400, body: { error: 'VALIDATION_ERROR', message: 'Missing mandatory fields', fields: missing } };
    }
  }

  const typeErrors = [];
  if (body.name !== undefined && typeof body.name !== 'string') typeErrors.push('name must be a string');
  if (body.email !== undefined && typeof body.email !== 'string') typeErrors.push('email must be a string');
  if (body.role !== undefined && typeof body.role !== 'string') typeErrors.push('role must be a string');
  if (body.age !== undefined && !Number.isInteger(body.age)) typeErrors.push('age must be an integer');
  if (body.active !== undefined && typeof body.active !== 'boolean') typeErrors.push('active must be a boolean');
  if (body.skills !== undefined && !Array.isArray(body.skills)) typeErrors.push('skills must be an array');
  if (typeErrors.length) {
    return { status: 400, body: { error: 'VALIDATION_ERROR', message: 'Invalid field types', details: typeErrors } };
  }

  const ruleErrors = [];
  if (body.name !== undefined) {
    const len = body.name.trim().length;
    if (len < RULES.NAME_MIN || len > RULES.NAME_MAX) {
      ruleErrors.push({ field: 'name', message: `name must be ${RULES.NAME_MIN}-${RULES.NAME_MAX} characters` });
    }
  }
  if (body.email !== undefined && !RULES.EMAIL_REGEX.test(body.email)) {
    ruleErrors.push({ field: 'email', message: 'email format is invalid' });
  }
  if (body.role !== undefined && !RULES.ROLES.includes(body.role)) {
    ruleErrors.push({ field: 'role', message: `role must be one of ${RULES.ROLES.join(', ')}` });
  }
  if (body.age !== undefined && (body.age < RULES.AGE_MIN || body.age > RULES.AGE_MAX)) {
    ruleErrors.push({ field: 'age', message: `age must be between ${RULES.AGE_MIN} and ${RULES.AGE_MAX}` });
  }
  if (body.zip !== undefined && !RULES.ZIP_REGEX.test(String(body.zip))) {
    ruleErrors.push({ field: 'zip', message: 'zip must be exactly 5 digits' });
  }
  if (ruleErrors.length) {
    return { status: 422, body: { error: 'UNPROCESSABLE_ENTITY', message: 'Business rule violation', errors: ruleErrors } };
  }
  return null;
}

function emailTaken(email, exceptId) {
  const e = email.toLowerCase();
  return [...users.values()].some((u) => u.email === e && u.id !== exceptId);
}

// ---------------------------------------------------------------------------
// Tier 1: health check (public)
// ---------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'user-service',
    version: '1.0.0',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    dependencies: { geoService: GEO_SERVICE_URL },
  });
});

// ---------------------------------------------------------------------------
// Users CRUD
// ---------------------------------------------------------------------------

// GET /api/users?role=tester&active=true&minAge=20&maxAge=40&limit=10&page=1
app.get('/api/users', requireApiKey('read'), (req, res) => {
  const { role, active, minAge, maxAge } = req.query;
  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);
  const page = req.query.page === undefined ? 1 : Number(req.query.page);

  if (!Number.isInteger(limit) || limit < RULES.LIMIT_MIN || limit > RULES.LIMIT_MAX) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: `limit must be an integer between ${RULES.LIMIT_MIN} and ${RULES.LIMIT_MAX}` });
  }
  if (!Number.isInteger(page) || page < 1) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'page must be an integer >= 1' });
  }
  if (role !== undefined && !RULES.ROLES.includes(role)) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: `role must be one of ${RULES.ROLES.join(', ')}` });
  }

  let result = [...users.values()];
  if (role) result = result.filter((u) => u.role === role);
  if (active !== undefined) result = result.filter((u) => String(u.active) === active);
  if (minAge !== undefined) result = result.filter((u) => u.age >= Number(minAge));
  if (maxAge !== undefined) result = result.filter((u) => u.age <= Number(maxAge));

  const total = result.length;
  const data = result.slice((page - 1) * limit, page * limit);
  res.status(200).json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

app.get('/api/users/:id', requireApiKey('read'), (req, res) => {
  const user = users.get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'NOT_FOUND', message: `User ${req.params.id} not found` });
  }
  res.status(200).json(user);
});

app.post('/api/users', requireApiKey('write'), (req, res) => {
  const body = req.body || {};
  const invalid = validateUser(body);
  if (invalid) return res.status(invalid.status).json(invalid.body);
  if (emailTaken(body.email)) {
    return res.status(409).json({ error: 'CONFLICT', message: `Email ${body.email} is already registered` });
  }
  const user = buildUser({
    name: body.name.trim(),
    email: body.email,
    role: body.role,
    age: body.age,
    active: body.active,
    city: body.city,
    zip: body.zip,
    skills: body.skills,
    managerId: body.managerId,
  });
  users.set(user.id, user);
  res.status(201).location(`/api/users/${user.id}`).json(user);
});

app.patch('/api/users/:id', requireApiKey('write'), (req, res) => {
  const user = users.get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'NOT_FOUND', message: `User ${req.params.id} not found` });
  }
  const body = req.body || {};
  const invalid = validateUser(body, { partial: true });
  if (invalid) return res.status(invalid.status).json(invalid.body);
  if (body.email && emailTaken(body.email, user.id)) {
    return res.status(409).json({ error: 'CONFLICT', message: `Email ${body.email} is already registered` });
  }
  ['name', 'role', 'age', 'active', 'skills', 'managerId'].forEach((f) => {
    if (body[f] !== undefined) user[f] = body[f];
  });
  if (body.email) user.email = body.email.toLowerCase();
  if (body.zip) user.address = { city: body.city || null, zip: String(body.zip) };
  res.status(200).json(user);
});

app.delete('/api/users/:id', requireApiKey('delete'), (req, res) => {
  if (!users.delete(req.params.id)) {
    return res.status(404).json({ error: 'NOT_FOUND', message: `User ${req.params.id} not found` });
  }
  res.status(204).send();
});

// ---------------------------------------------------------------------------
// Nested payload for JsonPath practice (Tier 3)
// ---------------------------------------------------------------------------
app.get('/api/teams/:id', requireApiKey('read'), (req, res) => {
  if (req.params.id !== '1') {
    return res.status(404).json({ error: 'NOT_FOUND', message: `Team ${req.params.id} not found` });
  }
  res.status(200).json(getTeam());
});

// ---------------------------------------------------------------------------
// Tier 5/6: an endpoint that depends on another service
// ---------------------------------------------------------------------------
app.get('/api/users/:id/location', requireApiKey('read'), async (req, res) => {
  const user = users.get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'NOT_FOUND', message: `User ${req.params.id} not found` });
  }
  if (!user.address) {
    return res.status(422).json({ error: 'UNPROCESSABLE_ENTITY', message: 'User has no address on file' });
  }

  let geoRes;
  try {
    geoRes = await fetch(`${GEO_SERVICE_URL}/geo/${user.address.zip}`, { signal: AbortSignal.timeout(GEO_TIMEOUT_MS) });
  } catch (e) {
    if (e.name === 'TimeoutError') {
      return res.status(504).json({ error: 'GATEWAY_TIMEOUT', message: `Geo service did not answer within ${GEO_TIMEOUT_MS} ms` });
    }
    return res.status(503).json({ error: 'DEPENDENCY_UNAVAILABLE', message: 'Geo service is unreachable' });
  }

  if (geoRes.status === 404) {
    return res.status(404).json({ error: 'NOT_FOUND', message: `Zip ${user.address.zip} is unknown to the geo service` });
  }
  if (!geoRes.ok) {
    return res.status(503).json({ error: 'DEPENDENCY_UNAVAILABLE', message: `Geo service returned ${geoRes.status}` });
  }
  const geo = await geoRes.json();
  res.status(200).json({
    userId: user.id,
    name: user.name,
    zip: user.address.zip,
    city: geo.city,
    state: geo.state,
    timezone: geo.timezone,
    source: 'geo-service',
  });
});

// ---------------------------------------------------------------------------
// Tier 7: the published contract (what consumers may rely on)
// ---------------------------------------------------------------------------
app.get('/api/contract', (req, res) => {
  res.status(200).json({
    name: 'user-service',
    version: '1.0.0',
    user: {
      id: 'uuid',
      employeeCode: 'string matching EMP-\\d{4}',
      name: 'string 2-50 chars',
      email: 'string (email)',
      role: RULES.ROLES,
      age: `integer ${RULES.AGE_MIN}-${RULES.AGE_MAX}`,
      active: 'boolean',
      address: 'null or { city: string|null, zip: 5 digits }',
      skills: 'array of strings',
      managerId: 'null or uuid',
      createdAt: 'ISO-8601 timestamp',
    },
  });
});

// Unknown routes -> 404 JSON
app.use((req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}` });
});

app.listen(PORT, () => {
  console.log(`user-service listening on http://localhost:${PORT}`);
  console.log(`geo dependency expected at ${GEO_SERVICE_URL}`);
});
