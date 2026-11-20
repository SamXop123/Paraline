/**
 * contactService.js
 *
 * Handles in-app contact and feedback submissions:
 * Validates fields and dispatches rich embeds to Discord.
 *
 * Webhook URL is loaded securely from the environment or landing/.env
 * (no hardcoded webhook credentials in source code), with automatic fallback
 * to the official Paraline web API (https://paraline.app/api/contact).
 */

const fs = require("fs");
const path = require("path");

const PRIMARY_API_URL = process.env.PARALINE_CONTACT_API_URL || "https://paraline.vercel.app/api/contact";
const SECONDARY_API_URL = "https://paraline.app/api/contact";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Resolves the Discord webhook URL from process environment or landing/.env
 * without hardcoding any secrets into the codebase.
 *
 * @returns {string} The webhook URL, or empty string if not configured.
 */
function getDiscordWebhookUrl() {
  if (process.env.DISCORD_WEBHOOK_URL && process.env.DISCORD_WEBHOOK_URL.trim()) {
    return process.env.DISCORD_WEBHOOK_URL.trim();
  }

  // In local development, check for landing/.env
  const candidatePaths = [
    path.join(__dirname, "landing", ".env"),
    path.join(__dirname, "..", "landing", ".env"),
    path.join(process.cwd(), "landing", ".env")
  ];

  for (const envPath of candidatePaths) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf8");
        for (const rawLine of content.split(/\r?\n/)) {
          const line = rawLine.trim();
          if (line.startsWith("DISCORD_WEBHOOK_URL=")) {
            const val = line.slice("DISCORD_WEBHOOK_URL=".length).trim().replace(/^["']|["']$/g, "");
            if (val) {
              process.env.DISCORD_WEBHOOK_URL = val;
              return val;
            }
          }
        }
      }
    } catch {
      // Ignore filesystem access errors
    }
  }

  return "";
}

/**
 * Validates in-app contact form inputs.
 *
 * @param {Object} payload
 * @returns {{ valid: boolean, error?: string, sanitized?: Object }}
 */
function validateContactPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return { valid: false, error: "Payload must be an object." };
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const subject = typeof payload.subject === "string" ? payload.subject.trim() : "";
  const category = typeof payload.category === "string" ? payload.category.trim() : "";
  const message = typeof payload.message === "string" ? payload.message.trim() : "";

  if (!name) {
    return { valid: false, error: "Name is required." };
  }
  if (!email) {
    return { valid: false, error: "Email address is required." };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, error: "Please enter a valid email address." };
  }
  if (!message) {
    return { valid: false, error: "Message is required." };
  }

  if (name.length > 100) {
    return { valid: false, error: "Name cannot exceed 100 characters." };
  }
  if (email.length > 256) {
    return { valid: false, error: "Email cannot exceed 256 characters." };
  }
  if (subject.length > 200) {
    return { valid: false, error: "Subject cannot exceed 200 characters." };
  }
  if (message.length > 5000) {
    return { valid: false, error: "Message cannot exceed 5000 characters." };
  }

  return {
    valid: true,
    sanitized: {
      name,
      email,
      subject,
      ...(category ? { category } : {}),
      message
    }
  };
}

/**
 * Builds a styled Discord rich embed payload.
 *
 * @param {Object} data - Sanitized contact data.
 * @param {string} appVersion - Current app version.
 * @param {string} [platformInfo] - OS/platform description.
 * @returns {Object} Discord webhook JSON payload.
 */
function buildDiscordPayload(data, appVersion = "2.6.1", platformInfo = "") {
  const { name, email, subject, category, message } = data;

  let embedColor = 58879; // Paraline Cyan #00e5ff
  let iconPrefix = "📬";

  if (category === "Bug Report") {
    embedColor = 16732754; // Red #ff5252
    iconPrefix = "🐛";
  } else if (category === "Feature Request") {
    embedColor = 11765759; // Violet #b388ff
    iconPrefix = "💡";
  } else if (category === "Appreciation") {
    embedColor = 59000; // Emerald #00e676
    iconPrefix = "❤️";
  }

  const effectiveSubject = category
    ? (subject ? `${category}: ${subject}` : category)
    : (subject || "Contact & Feedback");

  const sysInfo = platformInfo || (typeof process !== "undefined" ? `${process.platform} ${process.arch}` : "desktop");

  const fields = [
    { name: "Name", value: name, inline: true },
    { name: "Email", value: email, inline: true }
  ];

  if (category) {
    fields.push({ name: "Category", value: category, inline: true });
    fields.push({ name: "Subject", value: subject || "N/A", inline: false });
  } else {
    fields.push({ name: "Subject", value: subject || "N/A", inline: true });
  }

  fields.push(
    { name: "Client / System", value: `Paraline v${appVersion} (${sysInfo})`, inline: false },
    {
      name: "Message",
      value: message.length > 1024 ? message.substring(0, 1021) + "..." : message,
      inline: false
    }
  );

  return {
    embeds: [
      {
        title: `${iconPrefix} In-App Contact: ${effectiveSubject}`,
        color: embedColor,
        timestamp: new Date().toISOString(),
        fields,
        footer: {
          text: "Paraline Desktop App"
        }
      }
    ]
  };
}

/**
 * Dispatches the contact message.
 * Attempts direct Discord Webhook dispatch if a webhook URL is configured
 * (from environment / landing/.env), otherwise seamlessly posts to the
 * official website contact endpoint (where Discord credentials are kept server-side).
 *
 * @param {Object} rawPayload - Raw form submission payload.
 * @param {string} appVersion - Paraline app version.
 * @param {Function} [fetchFn] - Custom fetch for testing / injection.
 * @returns {Promise<{ success: boolean, message?: string, error?: string }>}
 */
async function submitContactMessage(rawPayload, appVersion = "2.6.1", fetchFn = null) {
  const validation = validateContactPayload(rawPayload);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const activeFetch = fetchFn || (typeof fetch === "function" ? fetch : null);
  if (!activeFetch) {
    return { success: false, error: "Network fetch is not available in this environment." };
  }

  const webhookUrl = getDiscordWebhookUrl();

  // 1. Try direct Discord Webhook dispatch if webhook URL is configured
  if (webhookUrl) {
    try {
      const discordPayload = buildDiscordPayload(validation.sanitized, appVersion);
      const res = await activeFetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discordPayload)
      });

      if (res.ok) {
        return { success: true, message: "Thank you! Your message has been sent successfully." };
      }
    } catch {
      // Discord direct dispatch may fail or be firewalled; proceed to website API fallback
    }
  }

  // 2. Dispatch to official website API endpoint (hosted securely on Vercel)
  const apiUrls = [PRIMARY_API_URL, SECONDARY_API_URL];
  const payloadBody = JSON.stringify({
    name: validation.sanitized.name,
    email: validation.sanitized.email,
    subject: validation.sanitized.category
      ? `[App v${appVersion}] ${validation.sanitized.category}: ${validation.sanitized.subject || "Feedback"}`
      : `[App v${appVersion}] ${validation.sanitized.subject || "In-App Feedback"}`,
    message: validation.sanitized.message
  });

  for (const endpoint of apiUrls) {
    try {
      const apiRes = await activeFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payloadBody
      });

      if (apiRes.ok) {
        return { success: true, message: "Thank you! Your message has been sent successfully." };
      }

      // If server returned a business error (e.g. 400 Bad Request), surface message if present
      try {
        const errorData = await apiRes.json();
        if (errorData && errorData.error) {
          return { success: false, error: errorData.error };
        }
      } catch {
        // Fall through to next endpoint or default error
      }
    } catch {
      // Continue to next endpoint if network or DNS failed
    }
  }

  return {
    success: false,
    error: "Unable to send message right now. Please check your internet connection and try again."
  };
}

module.exports = {
  PRIMARY_API_URL,
  SECONDARY_API_URL,
  FALLBACK_API_URL: PRIMARY_API_URL,
  getDiscordWebhookUrl,
  validateContactPayload,
  buildDiscordPayload,
  submitContactMessage
};
