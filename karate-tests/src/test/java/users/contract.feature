@tier7 @contract
Feature: Tier 7 - Contract testing

  # A contract is the agreement between a provider and its consumers about
  # the shape of the data. Breaking it breaks someone else's code.

  # * Provider side: every user-service response must honour user-contract.json,
  #   the file consumers rely on.
  # * Consumer side: user-service consumes the Geo Service. geo-contract.json
  #   records what we rely on; checking our mock against it stops the mock from
  #   drifting away from the real service. Point geoUrl at the real Geo Service
  #   and the same scenario verifies the provider.

  Background:
    * url baseUrl
    * header x-api-key = apiKeys.tester
    * def addressSchema = { city: '##string', zip: '#regex \\d{5}' }
    * def userContract = read('user-contract.json')

  Scenario: Provider - every user in the list honours the contract
    Given path 'api', 'users'
    And param limit = 50
    When method get
    Then status 200
    And match each response.data == userContract

  Scenario: Provider - a newly created user honours the contract
    Given path 'api', 'users'
    And request { name: 'Contract Check', email: '#(uniqueEmail("contract"))', role: 'admin', age: 45, zip: '10001', city: 'New York' }
    When method post
    Then status 201
    And match response == userContract

  Scenario: Provider - the published contract lists the agreed fields and roles
    Given path 'api', 'contract'
    When method get
    Then status 200
    * def publishedFields = karate.keysOf(response.user)
    * def testedFields = karate.keysOf(userContract)
    And match publishedFields contains only testedFields
    And match response.user.role contains only ['tester', 'developer', 'manager', 'admin']

  Scenario: Consumer - the Geo Service (mock or real) honours what we depend on
    * def geoUrl = karate.get('geoUrl', 'http://localhost:18090')
    * def geoContract = read('geo-contract.json')
    Given url geoUrl
    And path 'geo', '41101'
    When method get
    Then status 200
    And match response == geoContract
