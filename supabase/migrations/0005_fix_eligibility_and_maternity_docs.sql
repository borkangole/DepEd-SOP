-- ============================================================================
-- Corrections based on the client's direct answers, confirming the two
-- assumptions flagged in 0004_transfer_and_leave_content.sql:
--
--   1. Eligibility is by STAFF TYPE, not by transfer scope. ALL teaching
--      personnel (Elementary, Junior High, AND Senior High School) need at
--      least 3 years of service before requesting ANY transfer, including
--      transfer to another Division/Agency. Only NON-TEACHING staff use the
--      1-year rule. (0004 had incorrectly grouped Senior HS teaching staff
--      with non-teaching staff under the 1-year rule.)
--
--   2. The Maternity Leave checklist's "CSC Form No. 211" and "Medical
--      Certificate" lines (added in 0004) were meant to be ONE document —
--      "CSC Form No. 211 (Medical Certificate)" — confirmed by the client to
--      be distinct from the existing "Form 41 / Medical Certificate" line,
--      not a duplicate of it.
-- ============================================================================

update public.sop_catalog
set
  purpose = 'Requests a transfer of assignment from one school to another within the Division, for teaching personnel. Eligibility: Elementary, Junior High School, and Senior High School teaching personnel must have at least 3 years of service before requesting a transfer.',
  updated_at = now()
where transaction_type = 'transfer_of_assignment' and transfer_scope = 'teaching_school_to_school';

update public.sop_catalog
set
  purpose = 'Requests a transfer of assignment for non-teaching personnel, or for Senior High School level teaching personnel. Eligibility: non-teaching personnel must have at least 1 year of service; Senior High School teaching personnel must have at least 3 years of service, the same tenure rule as other teaching staff, before requesting transfer.',
  updated_at = now()
where transaction_type = 'transfer_of_assignment' and transfer_scope = 'non_teaching_or_senior_hs';

update public.sop_catalog
set
  purpose = 'Processes clearance requirements for a teacher/personnel transferring out to another Division or Agency. Eligibility: teaching personnel (Elementary, Junior High, or Senior High School) must have at least 3 years of service; non-teaching personnel must have at least 1 year of service, before requesting transfer.',
  updated_at = now()
where transaction_type = 'transfer_of_assignment' and transfer_scope = 'other_division_agency';

update public.sop_catalog
set
  requirements = array[
    '(3) Form 6 with Doc Stamp (1 original, 2 photocopy)',
    '(2) Form 41 / Medical Certificate (1 original, 1 photocopy)',
    '(3) Original copy of Form 7 (Clearance Form)',
    '(3) Original copy of District Clearance',
    '(2) Photocopy of Birth Certificate of the Baby',
    '(2) Certification (Property Custodian)',
    '(2) CSC Form No. 211 (Medical Certificate)'
  ],
  updated_at = now()
where transaction_type = 'leave_application' and leave_kind = 'maternity';
