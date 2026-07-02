/**
 * Assistant variant selection for transcript display and training export.
 * Variants may be appended out of chronological order (regenerations at end of list).
 */

function pickAssistantVariant(variants, activeMessageId, feedbackByMessageId = {}, starredAssistantIds = new Set()) {
  if (!Array.isArray(variants) || variants.length === 0) return null;

  if (activeMessageId) {
    const explicit = variants.find((c) => c.id === activeMessageId);
    if (explicit) return explicit;
  }

  const starred = variants.filter((v) => starredAssistantIds.has(v.id));
  if (starred.length) return starred[starred.length - 1];

  const withFeedback = variants.filter((v) => hasFeedbackOnVariant(v, feedbackByMessageId));
  if (withFeedback.length) {
    const latestRegen = pickLatestRegenerationChain(withFeedback);
    return latestRegen || withFeedback[withFeedback.length - 1];
  }

  const latestRegen = pickLatestRegenerationChain(variants);
  if (latestRegen) return latestRegen;

  return variants[variants.length - 1];
}

function hasFeedbackOnVariant(variant, feedbackByMessageId) {
  if (!variant) return false;
  if (feedbackByMessageId[variant.id]?.length) return true;
  const sourceId = variant.regenerated_from_message_id;
  return !!(sourceId && feedbackByMessageId[sourceId]?.length);
}

function pickLatestRegenerationChain(variants) {
  const roots = variants.filter((v) => !variants.some((other) => other.regenerated_from_message_id === v.id));
  let latest = null;
  for (const root of roots) {
    let current = root;
    while (true) {
      const child = variants.find((v) => v.regenerated_from_message_id === current.id);
      if (!child) break;
      current = child;
    }
    if (!latest || String(current.created_at || "") >= String(latest.created_at || "")) {
      latest = current;
    }
  }
  return latest;
}

function resolveLatestRegeneratedAssistant(assistant, allMessages) {
  if (!assistant) return null;
  const sessionMessages = (allMessages || []).filter((m) => m.session_id === assistant.session_id);
  let current = assistant;
  while (true) {
    const child = sessionMessages.find(
      (m) => m.role === "assistant" && m.regenerated_from_message_id === current.id,
    );
    if (!child) break;
    current = child;
  }
  return current;
}

function buildTrainingBranchMessages(allMessages, activeMessageId, feedbackByMessageId, starredAssistantIds) {
  const display = [];
  const variantParentsRendered = new Set();

  for (const item of allMessages) {
    if (item.role === "user") {
      display.push(item);
      if (!variantParentsRendered.has(item.id)) {
        const variants = allMessages.filter((c) => c.role === "assistant" && c.parent_message_id === item.id);
        const picked = pickAssistantVariant(variants, activeMessageId, feedbackByMessageId, starredAssistantIds);
        if (picked) {
          variantParentsRendered.add(item.id);
          display.push(picked);
        }
      }
      continue;
    }

    if (item.role === "assistant") {
      if (!item.parent_message_id) {
        display.push(item);
        continue;
      }
      if (variantParentsRendered.has(item.parent_message_id)) continue;
      const variants = allMessages.filter((c) => c.role === "assistant" && c.parent_message_id === item.parent_message_id);
      const picked = pickAssistantVariant(variants, activeMessageId, feedbackByMessageId, starredAssistantIds);
      if (picked) {
        variantParentsRendered.add(item.parent_message_id);
        display.push(picked);
      }
    }
  }

  return display;
}

module.exports = {
  pickAssistantVariant,
  hasFeedbackOnVariant,
  resolveLatestRegeneratedAssistant,
  buildTrainingBranchMessages,
};
