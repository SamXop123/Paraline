/**
 * contactService.test.js
 *
 * Unit tests for the in-app contact and feedback service:
 * - Field validation and sanitization
 * - Discord embed payload generation (category colors, metadata, length limits)
 * - Dispatch flow: direct Discord webhook with graceful website API fallback
 */

const test = require("node:test");
const assert = require("node:assert");
const {
  DISCORD_WEBHOOK_URL,
  FALLBACK_API_URL,
  validateContactPayload,
  buildDiscordPayload,
  submitContactMessage
} = require("../contactService.js");

test("validateContactPayload - rejects non-object or null input", () => {
  assert.strictEqual(validateContactPayload(null).valid, false);
  assert.strictEqual(validateContactPayload(undefined).valid, false);
  assert.strictEqual(validateContactPayload("string").valid, false);
  assert.strictEqual(validateContactPayload(123).valid, false);
});

test("validateContactPayload - rejects missing required fields", () => {
  const missingName = validateContactPayload({ email: "user@example.com", message: "Hello" });
  assert.strictEqual(missingName.valid, false);
  assert.match(missingName.error, /Name is required/i);

  const missingEmail = validateContactPayload({ name: "Alex", message: "Hello" });
  assert.strictEqual(missingEmail.valid, false);
  assert.match(missingEmail.error, /Email address is required/i);

  const missingMsg = validateContactPayload({ name: "Alex", email: "user@example.com" });
  assert.strictEqual(missingMsg.valid, false);
  assert.match(missingMsg.error, /Message is required/i);
});

test("validateContactPayload - rejects invalid email formats", () => {
  const invalidEmails = ["plainaddress", "missing@domain", "@nodomain.com", "user@.com"];
  for (const email of invalidEmails) {
    const res = validateContactPayload({ name: "Alex", email, message: "Testing" });
    assert.strictEqual(res.valid, false);
    assert.match(res.error, /valid email address/i);
  }
});

test("validateContactPayload - rejects excessively long input fields", () => {
  const longName = "A".repeat(101);
  assert.strictEqual(
    validateContactPayload({ name: longName, email: "user@example.com", message: "Hi" }).valid,
    false
  );

  const longEmail = "a".repeat(250) + "@domain.com";
  assert.strictEqual(
    validateContactPayload({ name: "Alex", email: longEmail, message: "Hi" }).valid,
    false
  );

  const longSubject = "S".repeat(201);
  assert.strictEqual(
    validateContactPayload({ name: "Alex", email: "user@example.com", subject: longSubject, message: "Hi" }).valid,
    false
  );

  const longMessage = "M".repeat(5001);
  assert.strictEqual(
    validateContactPayload({ name: "Alex", email: "user@example.com", message: longMessage }).valid,
    false
  );
});

test("validateContactPayload - sanitizes and trims valid payload", () => {
  const res = validateContactPayload({
    name: "  Alex Mercer  ",
    email: "  alex@example.com  ",
    subject: "  Need Help  ",
    category: "Bug Report",
    message: "  Visualizer glitching on second monitor.  "
  });

  assert.strictEqual(res.valid, true);
  assert.deepStrictEqual(res.sanitized, {
    name: "Alex Mercer",
    email: "alex@example.com",
    subject: "Need Help",
    category: "Bug Report",
    message: "Visualizer glitching on second monitor."
  });
});

test("buildDiscordPayload - formats rich embeds with appropriate category colors & icons", () => {
  const categories = [
    { cat: "General", color: 58879, icon: "📬" },
    { cat: "Bug Report", color: 16732754, icon: "🐛" },
    { cat: "Feature Request", color: 11765759, icon: "💡" },
    { cat: "Appreciation", color: 59000, icon: "❤️" }
  ];

  for (const { cat, color, icon } of categories) {
    const payload = buildDiscordPayload(
      {
        name: "Test User",
        email: "test@example.com",
        subject: "Quick Feedback",
        category: cat,
        message: "Everything is great!"
      },
      "2.6.1",
      "win32 x64"
    );

    assert.ok(Array.isArray(payload.embeds) && payload.embeds.length === 1);
    const embed = payload.embeds[0];
    assert.strictEqual(embed.color, color);
    assert.ok(embed.title.includes(icon));
    assert.ok(embed.title.includes(cat));

    const fieldsMap = Object.fromEntries(embed.fields.map(f => [f.name, f.value]));
    assert.strictEqual(fieldsMap["Name"], "Test User");
    assert.strictEqual(fieldsMap["Email"], "test@example.com");
    assert.strictEqual(fieldsMap["Category"], cat);
    assert.strictEqual(fieldsMap["Client / System"], "Paraline v2.6.1 (win32 x64)");
    assert.strictEqual(fieldsMap["Message"], "Everything is great!");
  }
});

test("buildDiscordPayload - truncates embed message field to prevent Discord API 1024 char rejection", () => {
  const longMsg = "Z".repeat(1500);
  const payload = buildDiscordPayload({
    name: "User",
    email: "user@example.com",
    category: "General",
    message: longMsg
  });

  const messageField = payload.embeds[0].fields.find(f => f.name === "Message");
  assert.strictEqual(messageField.value.length, 1024);
  assert.ok(messageField.value.endsWith("..."));
});

test("submitContactMessage - dispatches to Discord webhook directly when reachable", async () => {
  let calledUrl = null;
  let postedBody = null;

  const mockFetch = async (url, options) => {
    calledUrl = url;
    postedBody = JSON.parse(options.body);
    return { ok: true, status: 204 };
  };

  const result = await submitContactMessage(
    {
      name: "Sam",
      email: "sam@example.com",
      subject: "Great app",
      category: "Appreciation",
      message: "Loving the new multi-monitor modes!"
    },
    "2.6.1",
    mockFetch
  );

  assert.strictEqual(result.success, true);
  assert.strictEqual(calledUrl, DISCORD_WEBHOOK_URL);
  assert.ok(postedBody.embeds[0].title.includes("Appreciation"));
});

test("buildDiscordPayload - formats embeds correctly when category is omitted (website parity)", () => {
  const payload = buildDiscordPayload(
    {
      name: "Jamie",
      email: "jamie@example.com",
      subject: "Feature Idea",
      message: "Can we get custom gradient stops?"
    },
    "2.6.1",
    "win32 x64"
  );

  assert.ok(Array.isArray(payload.embeds) && payload.embeds.length === 1);
  const embed = payload.embeds[0];
  assert.strictEqual(embed.title, "📬 In-App Contact: Feature Idea");
  const fieldsMap = Object.fromEntries(embed.fields.map(f => [f.name, f.value]));
  assert.strictEqual(fieldsMap["Name"], "Jamie");
  assert.strictEqual(fieldsMap["Email"], "jamie@example.com");
  assert.strictEqual(fieldsMap["Category"], undefined);
  assert.strictEqual(fieldsMap["Subject"], "Feature Idea");
  assert.strictEqual(fieldsMap["Client / System"], "Paraline v2.6.1 (win32 x64)");
  assert.strictEqual(fieldsMap["Message"], "Can we get custom gradient stops?");
});

test("submitContactMessage - falls back to website API if Discord webhook returns error or throws", async () => {
  const calls = [];

  const mockFetch = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    if (url === DISCORD_WEBHOOK_URL) {
      throw new Error("Discord webhook blocked by firewall");
    }
    if (url === FALLBACK_API_URL) {
      return { ok: true, status: 200 };
    }
    return { ok: false, status: 404 };
  };

  const result = await submitContactMessage(
    {
      name: "Morgan",
      email: "morgan@example.com",
      category: "Bug Report",
      message: "Audio device disconnected unexpectedly."
    },
    "2.6.1",
    mockFetch
  );

  assert.strictEqual(result.success, true);
  assert.strictEqual(calls.length, 2);
  assert.strictEqual(calls[0].url, DISCORD_WEBHOOK_URL);
  assert.strictEqual(calls[1].url, FALLBACK_API_URL);
  assert.strictEqual(calls[1].body.name, "Morgan");
  assert.strictEqual(calls[1].body.email, "morgan@example.com");
});

test("submitContactMessage - returns graceful failure if both Discord and website API fail", async () => {
  const mockFetch = async () => {
    throw new Error("DNS resolution failure");
  };

  const result = await submitContactMessage(
    {
      name: "Taylor",
      email: "taylor@example.com",
      message: "Test message"
    },
    "2.6.1",
    mockFetch
  );

  assert.strictEqual(result.success, false);
  assert.match(result.error, /Unable to send message/i);
});
