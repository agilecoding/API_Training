Feature: Tiers 5 and 6 - Mock the APIs you depend on, then break them on purpose

  # GET /api/users/{id}/location calls the Geo Service (port 18090).
  # UsersTest.java replaces the Geo Service with geo-mock.feature, so these
  # tests control exactly what the dependency answers - including failures
  # that are hard or impossible to trigger on a real shared environment.

  Background:
    * url baseUrl
    * def testerKey = apiKeys.tester

  @tier5 @mock
  Scenario: Happy path - mocked Geo Service enriches the user's location
    * def created = call read('create-user.feature') { zip: '56001' }
    * def userId = created.user.id
    Given path 'api', 'users', userId, 'location'
    And header x-api-key = testerKey
    When method get
    Then status 200
    And match response ==
      """
      {
        userId: '#(userId)',
        name: 'Geo Person',
        zip: '56001',
        city: 'Bengaluru',
        state: 'Karnataka',
        timezone: 'Asia/Kolkata',
        source: 'geo-service'
      }
      """

  @tier6 @mock @error-flow
  Scenario: Dependency returns 404 -> our API returns 404 with a clear message
    * def created = call read('create-user.feature') { zip: '00000' }
    * def userId = created.user.id
    Given path 'api', 'users', userId, 'location'
    And header x-api-key = testerKey
    When method get
    Then status 404
    And match response.message contains 'unknown to the geo service'

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

  @tier6 @error-flow
  Scenario: User without an address -> 422 before the dependency is even called
    Given path 'api', 'users'
    And header x-api-key = testerKey
    And request { name: 'No Address', email: '#(uniqueEmail("noaddr"))', role: 'tester', age: 30 }
    When method post
    Then status 201
    * def userId = response.id

    Given path 'api', 'users', userId, 'location'
    And header x-api-key = testerKey
    When method get
    Then status 422
    And match response.message == 'User has no address on file'
