-- Adds an optional "ready/visit" date to a transaction, so Division can tell
-- a teacher exactly when a personal visit to the Division Office is worth
-- making (per the SOP's stated goal of cutting unnecessary travel for
-- personnel from remote/upland schools) instead of leaving them guessing.
--
-- Not modeled as another transaction_status value, and not tied to any one
-- status: Division can set/update/clear it at any point in a transaction's
-- life (e.g. as soon as they know a pickup date, even before "Released").

alter table public.transactions
  add column scheduled_date date,
  add column schedule_note text;

comment on column public.transactions.scheduled_date is
  'Date Division indicates a visit/pickup is worthwhile (e.g. documents ready). Null = no schedule set yet.';
comment on column public.transactions.schedule_note is
  'Optional free-text note accompanying scheduled_date (e.g. "bring your ID", "come after 1pm").';
