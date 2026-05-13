alter table public.chat_feedback
add column if not exists apply_to_global_instructions boolean not null default false;

comment on column public.chat_feedback.apply_to_global_instructions is
  'When true, this feedback text may be appended to live LLM system prompts (server-side, service role).';
