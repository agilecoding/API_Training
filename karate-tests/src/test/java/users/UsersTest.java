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
