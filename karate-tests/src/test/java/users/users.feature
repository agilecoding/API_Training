@users
Feature: User Service - the manual Flashpost scenarios, automated

  # Each scenario below matches one exercise from the manual testing section.
  # Tags map scenarios to the "API Testing Hierarchy of Needs" pyramid:
  # @tier1 status codes, @tier2 chained flows, @tier4 boundary/negative, @security.

  Background:
    * url baseUrl
    * def testerKey = apiKeys.tester

  # ---------------------------------------------------------------------------
  # Exercise 1 - Health check (Tier 1: make the call, get the expected status)
  # ---------------------------------------------------------------------------
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

  # ---------------------------------------------------------------------------
  # Exercise 2 - Query parameter filtering
  # ---------------------------------------------------------------------------
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

  @tier1 @path
  Scenario: Unknown user id in the path returns 404
    Given path 'api', 'users', 'does-not-exist'
    And header x-api-key = testerKey
    When method get
    Then status 404
    And match response == { error: 'NOT_FOUND', message: '#string' }

  # ---------------------------------------------------------------------------
  # Exercise 3 - Negative testing: missing mandatory fields -> 400
  # ---------------------------------------------------------------------------
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
  Scenario: Empty body returns 400
    Given path 'api', 'users'
    And header x-api-key = testerKey
    And request {}
    When method post
    Then status 400
    And match response.fields == ['name', 'email', 'role', 'age']

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

  # ---------------------------------------------------------------------------
  # Exercise 4 - Boundary value testing (age must be 18..65) -> 201 / 422
  # ---------------------------------------------------------------------------
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

  # Data-driven: every row of the CSV becomes its own test (maintainable BVA)
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

  @tier4 @boundary
  Scenario Outline: Page size limit=<limit> -> <expected>
    Given path 'api', 'users'
    And header x-api-key = testerKey
    And param limit = <limit>
    When method get
    Then status <expected>

    Examples:
      | limit | expected |
      | 0     | 400      |
      | 1     | 200      |
      | 50    | 200      |
      | 51    | 400      |

  # ---------------------------------------------------------------------------
  # Exercise 5 - Security / authorization via the x-api-key header
  # ---------------------------------------------------------------------------
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

  # ---------------------------------------------------------------------------
  # Tier 2 - Chain HTTP calls to simulate an end-to-end business flow
  # ---------------------------------------------------------------------------
  @tier2 @flow
  Scenario: Onboard, update and off-board an employee
    # 1. Create
    * def newUser = { name: 'Flow Tester', email: '#(uniqueEmail("flow"))', role: 'tester', age: 30, city: 'Pune', zip: '41101', skills: ['karate'] }
    Given path 'api', 'users'
    And header x-api-key = testerKey
    And request newUser
    When method post
    Then status 201
    And match header Location == '/api/users/' + response.id
    * def userId = response.id

    # 2. Read back what we created (data flows from step 1)
    Given path 'api', 'users', userId
    And header x-api-key = testerKey
    When method get
    Then status 200
    And match response contains { name: 'Flow Tester', role: 'tester', active: true }
    And match response.address == { city: 'Pune', zip: '41101' }

    # 3. Update (promotion)
    Given path 'api', 'users', userId
    And header x-api-key = testerKey
    And request { role: 'manager', skills: ['karate', 'leadership'] }
    When method patch
    Then status 200
    And match response.role == 'manager'
    And match response.skills contains 'leadership'

    # 4. A tester key may not delete...
    Given path 'api', 'users', userId
    And header x-api-key = testerKey
    When method delete
    Then status 403

    # 5. ...but an admin key can
    Given path 'api', 'users', userId
    And header x-api-key = apiKeys.admin
    When method delete
    Then status 204

    # 6. The user is really gone
    Given path 'api', 'users', userId
    And header x-api-key = testerKey
    When method get
    Then status 404

  @tier2 @flow
  Scenario: Registering the same email twice returns 409 Conflict
    * def body = { name: 'Dup Check', email: '#(uniqueEmail("dup"))', role: 'tester', age: 33 }
    Given path 'api', 'users'
    And header x-api-key = testerKey
    And request body
    When method post
    Then status 201

    Given path 'api', 'users'
    And header x-api-key = testerKey
    And request body
    When method post
    Then status 409
    And match response.error == 'CONFLICT'
