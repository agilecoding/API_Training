@ignore
Feature: Geo Service mock (stands in for the real downstream dependency)

  # Started by UsersTest.java on port 18090. The first Scenario whose
  # expression is true handles the request, so order matters.

  Background:
    * def zips =
      """
      {
        '41101': { city: 'Pune', state: 'Maharashtra', timezone: 'Asia/Kolkata' },
        '56001': { city: 'Bengaluru', state: 'Karnataka', timezone: 'Asia/Kolkata' },
        '50001': { city: 'Hyderabad', state: 'Telangana', timezone: 'Asia/Kolkata' },
        '10001': { city: 'New York', state: 'NY', timezone: 'America/New_York' }
      }
      """

  # Tier 6 error flow: the dependency crashes
  Scenario: pathMatches('/geo/99999')
    * def responseStatus = 500
    * def response = { error: 'geo database offline' }

  # Tier 6 error flow: the dependency is too slow (user-service gives up after 2 s)
  Scenario: pathMatches('/geo/77777')
    * def responseDelay = 3000
    * def response = { zip: '77777', city: 'Slowtown', state: 'NA', timezone: 'UTC' }

  # Known zip -> 200 with geo data, unknown zip -> 404
  Scenario: pathMatches('/geo/{zip}')
    * def geo = zips[pathParams.zip]
    * def responseStatus = geo ? 200 : 404
    * def response = geo ? karate.merge({ zip: pathParams.zip }, geo) : { error: 'unknown zip ' + pathParams.zip }

  # Anything else
  Scenario:
    * def responseStatus = 404
