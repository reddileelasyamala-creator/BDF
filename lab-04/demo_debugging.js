/**
 * ============================================================================
 * Lab 4: Demonstration and Viva Debugging Guide
 * Student: Reddi Leela Syamala (252U1R3078)
 * Course: Backend Development Fundamentals - Lab 04
 * Faculty: Joel Prashanth D
 * ============================================================================
 *
 * This script demonstrates the 5 most critical backend bugs, security pitfalls,
 * and debugging scenarios encountered during authentication development in Node.js.
 * Perfect for viva demonstration and code defense!
 */

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "MY_SECRET_TOKEN_KEY_LAB_04";

async function runDebuggingDemonstrations() {
  console.log("==================================================================");
  console.log(" LAB 4 BACKEND DEBUGGING & SECURITY ARCHITECTURE DEMONSTRATION");
  console.log("==================================================================\n");

  // -------------------------------------------------------------------------
  // SCENARIO 1: The Missing 'await' Pitfall with Asynchronous Password Hashing
  // -------------------------------------------------------------------------
  console.log("--- SCENARIO 1: Missing 'await' on bcrypt.hash() ---");
  const rawPassword = "SecurePass123";

  // BUG: Forgetting await
  const unawaitedResult = bcrypt.hash(rawPassword, 10);
  console.log("Buggy Code: const hash = bcrypt.hash(password, 10); // Missing await");
  console.log("Unawaited Output:", unawaitedResult);
  console.log("Impact: A Promise object is passed to SQLite. If converted to string,");
  console.log("        it stores '[object Promise]' in the database instead of the hash!");

  // FIX: Properly awaited
  const awaitedHash = await bcrypt.hash(rawPassword, 10);
  console.log("\nCorrect Code: const hash = await bcrypt.hash(password, 10);");
  console.log("Awaited Hash:", awaitedHash);
  console.log("Verification: Valid bcrypt hash starting with $2b$ algorithm prefix.\n");

  // -------------------------------------------------------------------------
  // SCENARIO 2: bcrypt.compare() with Plaintext vs Hashed Password
  // -------------------------------------------------------------------------
  console.log("--- SCENARIO 2: Password Verification Logic ---");
  const correctPassword = "SecurePass123";
  const incorrectPassword = "WrongPassword999";

  const matchCorrect = await bcrypt.compare(correctPassword, awaitedHash);
  const matchIncorrect = await bcrypt.compare(incorrectPassword, awaitedHash);

  console.log(`Testing correct password ('${correctPassword}'):`, matchCorrect ? "MATCH (Login Success)" : "FAIL");
  console.log(`Testing incorrect password ('${incorrectPassword}'):`, matchIncorrect ? "MATCH" : "REJECTED (HTTP 400 Invalid password)");
  console.log("Viva Note: bcrypt uses one-way hashing with salt to protect against rainbow table attacks.\n");

  // -------------------------------------------------------------------------
  // SCENARIO 3: JWT Payload Exposure - Base64Url Decoding vs Signature Verification
  // -------------------------------------------------------------------------
  console.log("--- SCENARIO 3: JWT Anatomy & Security Pitfall ---");
  const securePayload = { username: "leela123" };
  const token = jwt.sign(securePayload, JWT_SECRET, { expiresIn: "1h" });

  console.log("Generated Token (compact 3-part string):");
  console.log(token);

  const parts = token.split(".");
  console.log("\nToken Components:");
  console.log("  1. Header (Base64Url):   ", parts[0]);
  console.log("  2. Payload (Base64Url):  ", parts[1]);
  console.log("  3. Signature:            ", parts[2]);

  // Decode payload using standard base64 decoding (NO secret key needed)
  const decodedPayload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
  console.log("\nDecoded Payload without Secret (Anyone can do this!):", decodedPayload);
  console.log("Critical Rule: NEVER put passwords, password hashes, or confidential data in JWT payload.");
  console.log("Decoding is public; signature verification ensures authenticity and tamper resistance.\n");

  // -------------------------------------------------------------------------
  // SCENARIO 4: Tampered JWT Signature Verification
  // -------------------------------------------------------------------------
  console.log("--- SCENARIO 4: JWT Tampering & Verification Check ---");
  try {
    // Valid token verification
    const verified = jwt.verify(token, JWT_SECRET);
    console.log("Valid Token Verification:", verified);

    // Tampered token simulation
    const tamperedPayload = Buffer.from(JSON.stringify({ username: "admin", role: "superuser" })).toString("base64url");
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;
    console.log("\nAttempting to verify tampered token (attacker changed username to 'admin')...");
    jwt.verify(tamperedToken, JWT_SECRET);
  } catch (err) {
    console.log("Caught Security Error as expected:", err.message);
    console.log("Viva Explanation: The cryptographic signature does not match the payload, rejecting forged tokens.\n");
  }

  // -------------------------------------------------------------------------
  // SCENARIO 5: Port Conflict (EADDRINUSE) & Resolution
  // -------------------------------------------------------------------------
  console.log("--- SCENARIO 5: Port Conflict (EADDRINUSE) Resolution ---");
  console.log("Cause: Another process or previous server instance is already bound to port 3000.");
  console.log("Solution 1: Kill lingering process: Get-Process node | Stop-Process");
  console.log("Solution 2: Use dynamic environment variable: process.env.PORT || 3000\n");

  console.log("==================================================================");
  console.log(" ALL DEMONSTRATIONS COMPLETED SUCCESSFULLY");
  console.log("==================================================================");
}

if (require.main === module) {
  runDebuggingDemonstrations().catch(console.error);
}

module.exports = { runDebuggingDemonstrations };
