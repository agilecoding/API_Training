@tier3
Feature: Tier 3 - Assertions on payload data and schema

  # Mirrors the "Validation Examples: normal paths, JsonPath & #regex" slide.
  # The /api/teams/1 payload is shaped like the slide's "cat with kittens":

  #   {
  #     id: 1, name: 'Quality Guild',
  #     lead: { id: '<uuid>', name: 'Priya Sharma' },
  #     members: [
  #       { id: 101, userId: '<uuid>', name: 'Arjun', skills: ['manual', 'flashpost'] },
  #       { id: 102, userId: '<uuid>', name: 'Sara',  skills: ['karate', 'sql'] }
  #     ]
  #   }

  Background:
    * url baseUrl
    * header x-api-key = apiKeys.tester

  Scenario: Normal paths and JsonPath on a nested payload
    Given path 'api', 'teams', 1
    When method get
    Then status 200
    * def team = response

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

  Scenario: Fuzzy-matcher cheat sheet on a single user
    Given path 'api', 'users'
    And param role = 'manager'
    When method get
    Then status 200
    * def user = response.data[0]

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

    # #notnull / #present / ## (optional) markers
    Then match user.address.zip == '#notnull'
    Then match user.id == '#present'
    Then match user.nickname == '#notpresent'
    Then match user.managerId == '##uuid'

    # Array size and per-element type in one directive
    Then match user.skills == '#[2] #string'

  Scenario: Reusable schema - define once, match many
    * def addressSchema = { city: '##string', zip: '#regex \\d{5}' }
    * def userSchema = read('user-contract.json')
    Given path 'api', 'users'
    And param limit = 50
    When method get
    Then status 200
    And match each response.data == userSchema
