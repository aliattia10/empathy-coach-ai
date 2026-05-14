# Super Prompt — Admin quality star (exemplar replies)

## Behaviour

Admins can **star** assistant messages (avatar session transcript and admin chat viewer). Starred replies are loaded server-side (service role) and appended to the live system prompt as **Admin-starred exemplar replies** so the model emulates tone, brevity, warmth, and single-question framing—without copying text verbatim.

## Code map

- **Super prompt text:** `SYSTEM_PROMPT` in `netlify/functions/chat.js` and `server/server.js` — section *Admin-starred exemplar replies (when appended in context)*.
- **Runtime injection:** `fetchStarredAssistantExemplars()` + `buildChatSystemContent()` in the same files; regeneration merges the same exemplar block.
- **Database:** migration `20260513180000_chat_messages_admin_quality_star.sql` — columns `admin_quality_star`, `admin_starred_at`; RPC `set_chat_message_admin_star` (admin-only).
- **UI:** `ChatTranscript.tsx` (star under assistant bubble, admins only); `AdminChatPage.tsx` (star in chat header row for assistant messages).

## Operations

Apply the migration in Supabase. Ensure **Netlify / server** has `SUPABASE_SERVICE_ROLE_KEY` and project URL so exemplars are fetched for chat.
