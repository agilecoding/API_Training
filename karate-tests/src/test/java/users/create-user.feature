@ignore
Feature: Reusable step - create a user and return it

  # Called from other features:
  #   * def created = call read('create-user.feature') { zip: '56001' }
  #   * def userId = created.user.id

  Scenario:
    * def body = { name: 'Geo Person', email: '#(uniqueEmail("geo"))', role: 'tester', age: 30 }
    * if (__arg.zip) body.zip = __arg.zip
    * if (__arg.zip) body.city = 'Somewhere'
    Given url baseUrl
    And path 'api', 'users'
    And header x-api-key = apiKeys.tester
    And request body
    When method post
    Then status 201
    * def user = response
