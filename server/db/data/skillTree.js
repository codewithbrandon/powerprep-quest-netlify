// Skill tree nodes for both tracks. `domain` maps to the `domain` field on
// questions/challenges so mastery can be computed from real attempt history.
module.exports = [
  // PL-200
  { id: 'pl200-dataverse-basics', track: 'PL200', name: 'Dataverse Fundamentals', domain: 'Dataverse', description: 'Tables, columns, relationships basics.', prerequisites: [], x: 0, y: 0 },
  { id: 'pl200-dataverse-relationships', track: 'PL200', name: 'Relationships & Rollups', domain: 'Dataverse', description: 'Cascading behaviors, rollup & calculated columns.', prerequisites: ['pl200-dataverse-basics'], x: 0, y: 1 },
  { id: 'pl200-dataverse-logic', track: 'PL200', name: 'Business Rules & Logic', domain: 'Dataverse', description: 'Business rules, plug-ins, and server-side validation.', prerequisites: ['pl200-dataverse-relationships'], x: 0, y: 2 },
  { id: 'pl200-security-roles', track: 'PL200', name: 'Security Roles & Business Units', domain: 'Security', description: 'Access levels, teams, sharing.', prerequisites: ['pl200-dataverse-basics'], x: 1, y: 1 },
  { id: 'pl200-security-advanced', track: 'PL200', name: 'Field Security & Hierarchies', domain: 'Security', description: 'Field Security Profiles, manager/positional hierarchy security.', prerequisites: ['pl200-security-roles'], x: 1, y: 2 },
  { id: 'pl200-canvas-basics', track: 'PL200', name: 'Canvas App Formulas', domain: 'Canvas Apps', description: 'Patch, LookUp, Filter, Collect and core Power Fx.', prerequisites: ['pl200-dataverse-basics'], x: 2, y: 1 },
  { id: 'pl200-canvas-advanced', track: 'PL200', name: 'Delegation & Offline', domain: 'Canvas Apps', description: 'Delegable formulas, offline profiles, component libraries.', prerequisites: ['pl200-canvas-basics'], x: 2, y: 2 },
  { id: 'pl200-model-driven', track: 'PL200', name: 'Model-Driven Apps & BPFs', domain: 'Model-Driven Apps', description: 'Sitemaps, forms, views, business process flows.', prerequisites: ['pl200-security-roles'], x: 1, y: 3 },
  { id: 'pl200-automate', track: 'PL200', name: 'Power Automate Flows', domain: 'Power Automate', description: 'Triggers, approvals, concurrency, error handling.', prerequisites: ['pl200-dataverse-relationships'], x: 0, y: 3 },
  { id: 'pl200-pages', track: 'PL200', name: 'Power Pages Portals', domain: 'Power Pages', description: 'Web roles, table permissions, external identity, Liquid.', prerequisites: ['pl200-security-advanced'], x: 1, y: 4 },
  // PL-300
  { id: 'pl300-dataprep-basics', track: 'PL300', name: 'Power Query Fundamentals', domain: 'Data Preparation', description: 'Append, merge, type conversion, text extraction.', prerequisites: [], x: 0, y: 0 },
  { id: 'pl300-dataprep-advanced', track: 'PL300', name: 'Query Folding & Dataflows', domain: 'Data Preparation', description: 'Performance tuning and reusable ETL.', prerequisites: ['pl300-dataprep-basics'], x: 0, y: 1 },
  { id: 'pl300-modeling-star', track: 'PL300', name: 'Star Schema Design', domain: 'Data Modeling', description: 'Cardinality, cross-filter direction, conformed dimensions.', prerequisites: ['pl300-dataprep-basics'], x: 1, y: 1 },
  { id: 'pl300-modeling-advanced', track: 'PL300', name: 'Parent-Child & Conformed Dims', domain: 'Data Modeling', description: 'Self-referencing hierarchies, calculated tables.', prerequisites: ['pl300-modeling-star'], x: 1, y: 2 },
  { id: 'pl300-dax-basics', track: 'PL300', name: 'Core DAX: CALCULATE & SUMX', domain: 'DAX', description: 'Filter context, CALCULATE, SUMX, DIVIDE, variables.', prerequisites: ['pl300-modeling-star'], x: 2, y: 2 },
  { id: 'pl300-dax-time', track: 'PL300', name: 'Time Intelligence', domain: 'DAX', description: 'SAMEPERIODLASTYEAR and related date functions.', prerequisites: ['pl300-dax-basics'], x: 2, y: 3 },
  { id: 'pl300-viz-basics', track: 'PL300', name: 'Interactions & Bookmarks', domain: 'Visualizations', description: 'Cross-filtering, bookmarks, buttons.', prerequisites: ['pl300-dax-basics'], x: 3, y: 2 },
  { id: 'pl300-viz-advanced', track: 'PL300', name: 'Drillthrough & Accessibility', domain: 'Visualizations', description: 'Drillthrough pages, colorblind-safe design, decluttering.', prerequisites: ['pl300-viz-basics'], x: 3, y: 3 },
  { id: 'pl300-gov-rls', track: 'PL300', name: 'Row-Level Security', domain: 'Governance & RLS', description: 'Static vs dynamic RLS, View As Roles.', prerequisites: ['pl300-modeling-advanced'], x: 1, y: 3 },
  { id: 'pl300-gov-deploy', track: 'PL300', name: 'Refresh, Workspaces & Sensitivity', domain: 'Governance & RLS', description: 'Gateways, scheduled refresh, apps, sensitivity labels.', prerequisites: ['pl300-gov-rls'], x: 1, y: 4 },
];
