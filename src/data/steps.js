export const STEPS = [
  {
    id: 1, phase: 1, phaseLabel: 'Kit Ordering',
    lane: 'partner', col: 0,
    label: 'Create Order',
    description: 'Partner triggers a kit order for a patient — address, contact info, kit type',
    endpoint: null,
    isOptional: false,
  },
  {
    id: 2, phase: 1, phaseLabel: 'Kit Ordering',
    lane: 'api', col: 1,
    label: 'POST /partners/orders',
    description: 'Receives patient info + shipping address + lookup_code + external_kit_id',
    endpoint: 'POST /partners/orders',
    isOptional: false,
  },
  {
    id: 3, phase: 1, phaseLabel: 'Kit Ordering',
    lane: 'backend', col: 2,
    label: 'Kit Created + Shipped',
    description: 'TH creates kit, fulfills order, ships to patient. Returns order UUID confirmation.',
    endpoint: null,
    isOptional: false,
  },
  {
    id: 4, phase: 2, phaseLabel: 'Kit Delivery',
    lane: 'backend', col: 3,
    label: 'Kit Shipped to Patient',
    description: 'Physical kit ships to patient address. Tracking number generated.',
    endpoint: null,
    isOptional: false,
  },
  {
    id: 5, phase: 2, phaseLabel: 'Kit Delivery',
    lane: 'partner', col: 4,
    label: 'Check Kit Status',
    description: 'Partner polls shipping and lifecycle status of the kit',
    endpoint: 'GET /kits/:id/status',
    isOptional: false,
    isPolling: true,
  },
  {
    id: 6, phase: 2, phaseLabel: 'Kit Delivery',
    lane: 'api', col: 5,
    label: 'GET /kits/:id/status',
    description: 'Returns status, shipping dates, tracking numbers, age_at_sampling, sample_type. Partner may use external_kit_id as the lookup ID.',
    endpoint: 'GET /kits/:id/status',
    isOptional: false,
  },
  {
    id: 7, phase: 3, phaseLabel: 'Kit Activation',
    lane: 'partner', col: 6,
    label: 'Patient Activates Kit',
    description: 'Patient provides activation info at sampling. Partner collects via UI and submits to TH.',
    endpoint: null,
    isOptional: false,
  },
  {
    id: 8, phase: 3, phaseLabel: 'Kit Activation',
    lane: 'api', col: 7,
    label: 'POST /kits/:id/activate',
    description: 'Sends: first_name, last_name, birthdate, date_of_sampling, sex, optional email, patient_identifier, practitioner_NPI',
    endpoint: 'POST /kits/:id/activate',
    isOptional: false,
  },
  {
    id: 9, phase: 3, phaseLabel: 'Kit Activation',
    lane: 'backend', col: 8,
    label: 'Kit Activated',
    description: 'TH links patient record to kit. patient_identifier deduplicates across longitudinal kits. Practitioner info stored if provided.',
    endpoint: null,
    isOptional: false,
  },
  {
    id: 10, phase: 4, phaseLabel: 'Sample Processing',
    lane: 'backend', col: 9,
    label: 'Sample In Transit',
    description: 'Patient mails sample to TH lab. Status: activated → in_transit_to_lab → delivered_to_lab',
    endpoint: null,
    isOptional: false,
  },
  {
    id: 11, phase: 4, phaseLabel: 'Sample Processing',
    lane: 'partner', col: 10,
    label: 'Poll for Results',
    description: 'Partner polls status until results_ready is returned',
    endpoint: 'GET /kits/:id/status',
    isOptional: false,
    isPolling: true,
  },
  {
    id: 12, phase: 4, phaseLabel: 'Sample Processing',
    lane: 'backend', col: 11,
    label: 'Lab Processing',
    description: 'TH lab processes sample. results_ready status set. Practitioner release fires before patient if NPI assigned.',
    endpoint: null,
    isOptional: false,
  },
  {
    id: 13, phase: 5, phaseLabel: 'Results Retrieval',
    lane: 'partner', col: 12,
    label: 'Fetch PDF Report',
    description: 'Once results_ready, partner retrieves the PDF report URL',
    endpoint: 'GET /kits/:id/pdf',
    isOptional: false,
  },
  {
    id: 14, phase: 5, phaseLabel: 'Results Retrieval',
    lane: 'api', col: 13,
    label: 'GET /kits/:id/pdf',
    description: 'Returns { "pdf_url": "…" }. Partner renders or links the PDF. Includes action plan (post-June 2025).',
    endpoint: 'GET /kits/:id/pdf',
    isOptional: false,
  },
  {
    id: 15, phase: 5, phaseLabel: 'Results Retrieval',
    lane: 'partner', col: 14,
    label: 'Fetch Metrics',
    description: 'Partner pulls 60–80 raw structured microbiome metrics for custom UI rendering',
    endpoint: 'GET /kits/:id/results/metrics',
    isOptional: true,
  },
  {
    id: 16, phase: 5, phaseLabel: 'Results Retrieval',
    lane: 'partner', col: 15,
    label: 'Fetch Action Plan',
    description: 'Partner retrieves 10–20 personalized recommendations tied to out-of-range metrics',
    endpoint: 'GET /kits/:id/results/action-plan',
    isOptional: true,
  },
  {
    id: 17, phase: 5, phaseLabel: 'Results Retrieval',
    lane: 'backend', col: 16,
    label: 'Results Available',
    description: 'Partner surfaces PDF and/or metrics + action plan to patient. Full lifecycle complete.',
    endpoint: null,
    isOptional: false,
  },
];

// Arrows define the flow connections
// type: 'request' | 'response' | 'internal' | 'time' | 'optional'
export const ARROWS = [
  // Phase 1 — Kit Ordering
  { from: 1, to: 2, type: 'request',  label: 'POST /partners/orders' },
  { from: 2, to: 3, type: 'request',  label: '' },

  // Phase 1 → 2 transition
  { from: 3, to: 4, type: 'internal', label: '' },

  // Phase 2 — Kit Delivery
  { from: 4, to: 5, type: 'time',     label: 'kit delivered' },
  { from: 5, to: 6, type: 'request',  label: 'GET /kits/:id/status' },
  { from: 6, to: 5, type: 'response', label: 'status + tracking' },

  // Phase 2 → 3 transition
  { from: 5, to: 7, type: 'time',     label: '' },

  // Phase 3 — Kit Activation
  { from: 7, to: 8, type: 'request',  label: 'POST /kits/:id/activate' },
  { from: 8, to: 9, type: 'request',  label: '' },

  // Phase 3 → 4 transition
  { from: 9, to: 10, type: 'internal', label: '' },

  // Phase 4 — Sample Processing
  { from: 10, to: 11, type: 'time',    label: 'sample mailed' },
  { from: 11, to: 12, type: 'request', label: 'GET /kits/:id/status' },
  { from: 12, to: 11, type: 'response', label: 'results_ready' },

  // Phase 4 → 5 transition
  { from: 11, to: 13, type: 'time',    label: '' },

  // Phase 5 — Results Retrieval
  { from: 13, to: 14, type: 'request',  label: 'GET /kits/:id/pdf' },
  { from: 14, to: 13, type: 'response', label: 'pdf_url' },
  { from: 13, to: 15, type: 'optional', label: '' },
  { from: 15, to: 16, type: 'optional', label: '' },
  { from: 16, to: 17, type: 'optional', label: 'results surfaced' },
];

// Phase section definitions for the top bar
export const PHASES = [
  { id: 1, label: 'Kit Ordering',      colStart: 0,  colEnd: 2  },
  { id: 2, label: 'Kit Delivery',      colStart: 3,  colEnd: 5  },
  { id: 3, label: 'Kit Activation',    colStart: 6,  colEnd: 8  },
  { id: 4, label: 'Sample Processing', colStart: 9,  colEnd: 11 },
  { id: 5, label: 'Results Retrieval', colStart: 12, colEnd: 16 },
];

export const PHASE_COLORS = [
  '#F8FAFC', // slate-50
  '#F0FDF4', // green-50
  '#FFF7ED', // orange-50
  '#FDF4FF', // purple-50
  '#FFFBEB', // amber-50
];

export const PHASE_BORDER_COLORS = [
  '#CBD5E1', // slate-300
  '#BBF7D0', // green-200
  '#FED7AA', // orange-200
  '#E9D5FF', // purple-200
  '#FDE68A', // amber-200
];

export const PHASE_TEXT_COLORS = [
  '#475569', // slate-600
  '#15803D', // green-700
  '#C2410C', // orange-700
  '#7E22CE', // purple-700
  '#92400E', // amber-700
];
