-- Trainer feedback applies to all users: default on + backfill existing rows.

alter table public.chat_feedback
alter column apply_to_global_instructions set default true;

update public.chat_feedback
set apply_to_global_instructions = true
where apply_to_global_instructions = false;
