function fn() {
  // Pick an environment with: mvn test -Dkarate.env=qa
  var env = karate.env || 'local';

  var config = {
    env: env,
    baseUrl: 'http://localhost:3000',
    apiKeys: {
      tester: 'tester-key-123',   // read + write
      admin: 'admin-key-999',     // read + write + delete
      readOnly: 'readonly-key-000' // read only
    },
    // Generates a fresh email so tests never collide with each other (409)
    uniqueEmail: function (prefix) {
      return (prefix || 'user') + '.' + new Date().getTime() + '.' + Math.floor(Math.random() * 100000) + '@example.com';
    }
  };

  if (env == 'qa') {
    config.baseUrl = 'http://qa.example.internal:3000';
  }

  karate.configure('connectTimeout', 5000);
  karate.configure('readTimeout', 10000);
  return config;
}
