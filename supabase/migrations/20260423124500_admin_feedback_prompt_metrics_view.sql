create or replace view public.admin_feedback_prompt_metrics as
with latest_regenerated as (
  select distinct on (m.regenerated_from_message_id)
    m.regenerated_from_message_id as source_message_id,
    coalesce(m.generation_metadata ->> 'promptVersion', 'unknown') as prompt_version,
    m.created_at
  from public.chat_messages m
  where m.role = 'assistant'
    and m.regenerated_from_message_id is not null
  order by m.regenerated_from_message_id, m.created_at desc
),
feedback_joined as (
  select
    lr.prompt_version,
    f.rating
  from public.chat_feedback f
  join latest_regenerated lr on lr.source_message_id = f.message_id
  where f.rating is not null
)
select
  prompt_version,
  count(*)::int as rating_count,
  avg(rating)::float8 as avg_rating
from feedback_joined
group by prompt_version;

grant select on public.admin_feedback_prompt_metrics to authenticated;
