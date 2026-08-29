-- ============================================================================
-- Client instruction: the "Non-Teaching Personnel / Senior High School"
-- transfer checklist should drop the Senior High School part and become a
-- general "Non-Teaching Personnel" request. Senior HS teaching staff already
-- follow the 3-year teaching-staff rule (fixed in 0005) and belong under the
-- "Teaching Personnel (School to School)" checklist instead — this migration
-- just cleans up the now-inaccurate title/purpose text on the non-teaching
-- row so it no longer mentions Senior High School.
--
-- Note: the underlying transfer_scope enum value stays named
-- 'non_teaching_or_senior_hs' — renaming an enum value has no visible effect
-- on the app (the UI only ever shows TRANSFER_SCOPE_LABEL / title / purpose,
-- never the raw enum value), so it wasn't worth the extra migration risk.
-- ============================================================================

update public.sop_catalog
set
  title = 'Request for Transfer — Non-Teaching Personnel',
  purpose = 'Requests a transfer of assignment for non-teaching personnel. Eligibility: at least 1 year of service before requesting transfer.',
  updated_at = now()
where transaction_type = 'transfer_of_assignment' and transfer_scope = 'non_teaching_or_senior_hs';
