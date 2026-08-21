-- ============================================================================
-- Update SOP catalog content with the client's actual answers from the
-- requirements-gathering interview (Gathering Guide 2.docx).
--
-- Notes on what changed and why:
--   - leave_application: steps rewritten to match her described two-checkpoint
--     flow (School Head 1st signature -> Admin Officer forwards -> Division
--     receiving/checking -> 2nd & final approval -> recorded -> released).
--   - authority_to_travel: requirements replaced with her ACTUAL checklist for
--     Travel Abroad (16 original-copy documents). Processing time updated to
--     reflect her stated 2-3 months for abroad travel, since Regional Office
--     approval is required on top of Division approval.
--     ! Travel LOCAL likely has a much shorter checklist and faster processing
--     — she only gave us the Abroad list. Follow up with her for the Local
--     requirements before treating this entry as complete; until then this
--     catalog entry documents Abroad specifically.
-- ============================================================================

update public.sop_catalog
set
  title = 'Application for Leave (Maternity Leave / Leave Credits)',
  purpose = 'Allows a teacher/personnel to formally apply for maternity leave or use accumulated leave credits, in accordance with the Civil Service Commission and DepEd leave policies.',
  requirements = array[
    'Duly accomplished Application for Leave (CS Form 6)',
    'Medical certificate (for maternity leave)',
    'Updated leave credit record',
    'Endorsement / 1st signature from the School Head'
  ],
  steps = array[
    'Teacher/employee prepares the Application for Leave and gathers supporting documents',
    'School Head reviews and provides the 1st signature/approval',
    'School Administrative Officer verifies completeness and forwards the request to the Division Office',
    'Division Office receiving personnel checks the completeness of the submitted documents',
    'Division processes the request and obtains the 2nd and final approval/signature',
    'Division records the transaction',
    'Approved leave is released to the requesting teacher/school; leave credits are updated accordingly'
  ],
  responsible_offices = 'School Head, School Administrative Officer (school level); Receiving Personnel, Administrative Staff, Section/Unit Head, Schools Division Superintendent (division level)',
  processing_time_days = 10,
  updated_at = now()
where transaction_type = 'leave_application';

update public.sop_catalog
set
  title = 'Authority to Travel — Travel Abroad',
  purpose = 'Secures official permission for a teacher/personnel to travel abroad for work-related, training, or personal reasons requiring official leave from post. NOTE: this entry currently documents TRAVEL ABROAD requirements specifically, as provided by the client — Local travel requirements are pending and likely shorter/faster.',
  requirements = array[
    '(3 original copies) Endorsement duly signed by the School Head/Principal',
    '(3 original copies) Division Office Clearance (CS Form No. 7)',
    '(3 original copies) Certification (Bonafide employee)',
    '(3 original copies) Certification (can be dispensed with)',
    '(3 original copies) Accomplished CS Form No. 6',
    '(3 original copies) Travel Authority',
    '(3 original copies) Certification (Duties & Responsibilities of who will take over)',
    '(3 original copies) Class Schedule/Program',
    '(3 original copies) School Clearance (Secondary/Elementary)',
    '(3 original copies) District Clearance (Elementary level only)',
    '(3 original copies) Application Letter / Letter of Intent (must indicate reason for travel)',
    '(3 original copies) Letter Request for Legal Clearance',
    '(3 original copies) Legal Clearance Form',
    '(3 original copies) Letter-request for Provident Clearance',
    '(3 original copies) Certification of No Pending Administrative Case (c/o SDO - Legal)',
    '(3 original copies) Provident Certification (c/o SDO - Accounting) — see https://bit.ly/SDOCAPIZProvidentFund; if loans confirmed, attach Payslip/Payroll for every loan'
  ],
  steps = array[
    'Teacher/employee prepares all 16 required documents (3 original copies each) — file at least 2 MONTHS in advance',
    'School Head reviews and provides 1st signature/endorsement',
    'School Administrative Officer verifies completeness and forwards to the Division Office',
    'Division Office receiving personnel checks completeness of all documents',
    'Division processes the request and obtains the 2nd approval/signature',
    'Application is forwarded to the Regional Office for final approval (required specifically for Travel Abroad)',
    'Division records the transaction',
    'Approved Travel Authority is released to the requesting teacher/employee'
  ],
  responsible_offices = 'School Head, School Administrative Officer (school level); Receiving Personnel, Administrative Staff, Section/Unit Head, Schools Division Superintendent (division level); Regional Office (final approval, Travel Abroad only)',
  processing_time_days = 60,
  updated_at = now()
where transaction_type = 'authority_to_travel';