# Super Prompt — Crisis and self-harm language (triage first)

Live copy is embedded in `SYSTEM_PROMPT` inside `netlify/functions/chat.js` and `server/server.js` under the section **Safety and crisis language**.

## Goal

When users mention suicide, dying, or self-harm (sometimes as intense figures of speech), the assistant must **not** default to the same canned helpline wall. It should **clarify intent**, then **assess risk** if needed, then **share concise UK resources** when appropriate.

## Rules

1. One clear question per turn during triage, unless the user states **immediate** danger (then urge emergency or Samaritans and give numbers at once).
2. First distinguish literal self-harm intent from strong wording about embarrassment, regret, or frustration.
3. If intent is real or still unclear, ask calmly about plan and history **across separate turns** (one topic per reply).
4. When risk is high or the user asks for help, give the short UK set: Samaritans 116 123, NHS 111 (mental health option), Mind 0300 123 3393, text SHOUT to 85258.
5. Remain plain-language; this is a training simulator, not therapy or emergency services.

## Admin feedback that should shape all chats

Reviewers can pin feedback in the avatar session UI (**Pin this feedback to the live model**). Pinned rows (`apply_to_global_instructions = true` in `chat_feedback`) are loaded server-side with the service role and appended to the system prompt so the model keeps learning from Simon’s notes without repeating the same mistake.
