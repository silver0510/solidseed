/**
 * Artillery Load Test Helper Functions
 *
 * Custom functions for load testing scenarios
 */

/**
 * Generate random string for unique test data
 */
function randomString() {
  return Math.random().toString(36).substring(7);
}

/**
 * Generate random email address
 */
function generateEmail() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `loadtest-${timestamp}-${random}@example.com`;
}

/**
 * Generate random password meeting complexity requirements
 */
function generatePassword() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Generate random user data
 */
function generateUserData() {
  const timestamp = Date.now();
  return {
    full_name: `Load Test User ${timestamp}`,
    email: generateEmail(),
    password: generatePassword(),
  };
}

/**
 * Extract and store auth token
 */
function extractToken(response) {
  if (response && response.body) {
    try {
      const body = JSON.parse(response.body);
      if (body.token) {
        return body.token;
      }
    } catch (e) {
      console.error("Failed to parse response:", e);
    }
  }
  return null;
}

/**
 * Log error details
 */
function logError(context, error) {
  console.error(`Error in ${context.scenario}:`, error);
  if (error.response) {
    console.error("Response status:", error.response.statusCode);
    console.error("Response body:", error.response.body);
  }
}

/**
 * Custom metrics collection
 */
function recordMetrics(context, events, done) {
  // Record custom metrics here
  // For example, track failed logins separately
  events.emit("counter", "custom.requests", 1);
  return done();
}

/**
 * Delay between requests (in addition to think time)
 */
function customDelay(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

/**
 * Validate response structure
 */
function validateResponse(response, expectedFields) {
  if (!response || !response.body) {
    return false;
  }

  try {
    const body = JSON.parse(response.body);
    for (const field of expectedFields) {
      if (!(field in body)) {
        return false;
      }
    }
    return true;
  } catch (e) {
    return false;
  }
}

// Export functions for Artillery
module.exports = {
  randomString,
  generateEmail,
  generatePassword,
  generateUserData,
  extractToken,
  logError,
  recordMetrics,
  customDelay,
  validateResponse,
};
