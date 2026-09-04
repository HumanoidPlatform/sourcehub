const technicalErrorPatterns = [
  /^TypeError\b/i,
  /^ReferenceError\b/i,
  /^SyntaxError\b/i,
  /undefined is not an object/i,
  /cannot read propert/i,
  /is not a function/i,
  /network request failed/i,
];

const domainMessagePatterns = [
  /^Admin original export requires a reason\.$/,
  /^Admin original export is available only after accepted media is watermarked\.$/,
  /^Requirement rejection requires a reason\.$/,
  /^Tenant final acceptance requires QA approval in this demo workflow\.$/,
  /^Video requirements need a minimum duration of 5 minutes\.$/,
];

export function getSafeFeedbackMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  const rawMessage = typeof error === 'string' ? error : error instanceof Error ? error.message : '';
  const message = rawMessage.trim();

  if (!message) {
    return fallback;
  }

  if (domainMessagePatterns.some((pattern) => pattern.test(message))) {
    return message;
  }

  if (technicalErrorPatterns.some((pattern) => pattern.test(message)) || message.includes('->')) {
    return fallback;
  }

  return message;
}
