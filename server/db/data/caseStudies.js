// 2 full multi-step case studies, Microsoft-exam style: scenario + stakeholders
// + constraints checklist + a sequence of architectural design questions.
module.exports = [
  {
    track: 'PL200',
    title: 'TorqueWorks Manufacturing — Quality Management Platform',
    scenario: `TorqueWorks Manufacturing operates 4 production plants that make precision automotive fasteners. Quality defects are currently tracked in spreadsheets emailed between plants, causing slow corrective action and inconsistent severity reporting to corporate leadership.

You have been engaged as the Power Platform Functional Consultant to design a Dataverse-based Quality Management solution. Leadership wants real-time visibility into defects across all plants, while each plant must only see and manage its own operational data. Floor inspectors need a mobile-friendly way to log defects even in low-connectivity areas of the plant (near the loading dock, inspectors frequently lose WiFi). External suppliers must be able to respond to corrective actions assigned to them without ever seeing another supplier's data.`,
    stakeholders: JSON.stringify([
      { name: 'Maria Chen', role: 'VP of Quality', ask: 'Real-time defect visibility across all 4 plants, with drill-down to the machine level.' },
      { name: 'Raj Patel', role: 'Plant IT Manager', ask: 'Each plant manager should only see their own plant\'s data; corporate quality team needs to see every plant.' },
      { name: 'Dana Ortiz', role: 'Supplier Relations Lead', ask: 'External suppliers must submit corrective action responses via a portal, without ever accessing internal systems directly, and without seeing other suppliers\' data.' },
      { name: 'Tom Reyes', role: 'Floor Supervisor', ask: 'An easy mobile app for inspectors to log defects even when WiFi drops near the loading dock.' },
    ]),
    constraints: JSON.stringify([
      'Use native Power Platform capabilities wherever possible; minimize custom code.',
      'Supplier portal users must never see data belonging to other suppliers.',
      'Must support offline defect logging for areas without connectivity.',
      'Critical-severity defects must trigger a notification and corrective action record within approximately 5 minutes of creation.',
      'The security model must scale to additional plants being onboarded later without being redesigned.',
    ]),
    questions: [
      {
        question_text: 'Which security architecture satisfies both "each plant manager sees only their own plant" AND "corporate quality sees every plant," while scaling cleanly as new plants are added?',
        options: [
          'Give every user the System Administrator role and rely on manual training not to look at other plants\' data',
          'Create a Business Unit per plant (optionally under a Corporate parent BU), assign Plant Manager roles at the Business Unit access level, and assign the Corporate Quality role at the Organization (or Parent:Child) access level',
          'Share every Defect record individually with every user who should see it',
          'Put all users in a single Business Unit and rely on Field Security Profiles to hide rows',
        ],
        correct_index: 1,
        explanation: 'Business Units are the native Dataverse mechanism for structural, scalable data isolation. One BU per plant (optionally nested under a Corporate BU) lets Plant Manager roles be scoped to Business Unit (their own plant only), while the Corporate Quality role is scoped to Organization or Parent:Child Business Units to see everything — and onboarding a new plant is just adding another BU, with no redesign of the security model.',
      },
      {
        question_text: 'Which feature should visually guide a Defect record through Reported -> Investigating -> Corrective Action Assigned -> Verified -> Closed, directly on the form?',
        options: ['A Dashboard', 'A Business Process Flow', 'A Quick Create Form', 'A SharePoint document library'],
        correct_index: 1,
        explanation: 'Business Process Flows render a stage-based progress bar on the form and enforce required fields per stage, which is exactly the "guided lifecycle" requirement for the Defect record.',
      },
      {
        question_text: 'Which Canvas App design approach correctly supports Tom Reyes\'s requirement for inspectors to keep logging defects when WiFi drops near the loading dock?',
        options: [
          'Nothing needs to change; Canvas Apps always work offline automatically',
          'Explicitly implement offline data handling (e.g., local collections populated via LoadData/SaveData, or a configured offline profile) so the app can read/write without connectivity and sync later',
          'Tell inspectors to walk back to an area with WiFi before logging defects',
          'Increase the non-delegable row limit setting in app settings',
        ],
        correct_index: 1,
        explanation: 'Canvas Apps do not support offline scenarios automatically — offline capability must be deliberately engineered (local caching with SaveData/LoadData, or an offline profile), which is the documented approach for disconnected mobile data capture.',
      },
      {
        question_text: 'Which automation design satisfies the ~5-minute SLA: notify the plant manager AND auto-create a CorrectiveAction record whenever a Defect is created with Severity = Critical?',
        options: [
          'A scheduled cloud flow that runs once every night and checks for new critical defects',
          'A Dataverse-triggered cloud flow ("When a row is added"), filtered to Severity = Critical, that sends a notification and creates the CorrectiveAction record in the same run',
          'A business rule that shows an on-form warning message',
          'A manual flow the plant manager has to remember to run'
        ],
        correct_index: 1,
        explanation: 'A Dataverse row-creation trigger fires within moments of the record being saved, so filtering to Critical severity and chaining a notification + record-creation action in the same flow run comfortably satisfies a 5-minute SLA — unlike a nightly schedule (far too slow), a business rule (cannot send notifications or create related records), or a manual trigger (not automatic).',
      },
      {
        question_text: 'Which combination of Power Pages configuration correctly satisfies "suppliers authenticate with their own company identity" AND "suppliers only see their own corrective actions"?',
        options: [
          'Local portal accounts for every supplier employee, with a single Table Permission scoped Globally to CorrectiveAction',
          'An external/federated identity provider (e.g., the supplier\'s own Microsoft Entra ID tenant via OpenID Connect) for authentication, combined with a Table Permission on CorrectiveAction scoped by relationship to the supplier\'s Account (Contact/Parent scope), assigned through Web Roles',
          'Anonymous access with no authentication at all, relying on obscure URLs',
          'A Power Automate flow that emails a PDF of all corrective actions to every supplier weekly',
        ],
        correct_index: 1,
        explanation: 'Federated authentication (external identity provider via OpenID Connect) lets suppliers log in with their own organizational credentials, while a relationship-scoped Table Permission (not Global) assigned via Web Roles ensures each supplier only sees CorrectiveAction rows tied to their own Account — satisfying both the authentication and the data-isolation requirement.',
      },
      {
        question_text: 'A junior consultant proposes configuring the CorrectiveAction Table Permission scope as "Global" in the supplier portal to "keep things simple." What is the consequence, and does it satisfy the case study\'s constraints?',
        options: [
          'No consequence — Global scope is the recommended default for all Power Pages tables',
          'It violates the explicit constraint that suppliers must never see another supplier\'s data, because Global scope grants access to every row in the table to any authenticated user holding that permission',
          'Global scope only affects internal users, not external portal users, so it is safe here',
          'Global scope would prevent the portal from loading any data at all',
        ],
        correct_index: 1,
        explanation: 'A "Global" Table Permission scope grants access to ALL rows in the table for anyone holding that permission — directly violating the stated constraint that suppliers must never see another supplier\'s corrective actions. The correct scope ties access to a relationship (e.g., Account/Parent), as identified in the previous question.',
      },
    ],
  },
  {
    track: 'PL300',
    title: 'Brightline Industrial — Executive Quality & Operations Analytics',
    scenario: `Brightline Industrial operates 6 plants (grouped into 2 regions) producing automotive components, and has just completed a Dataverse-based Quality Management rollout (tracking Defects, Inspections, and Machines). Separately, a legacy on-premises SQL Server data warehouse holds historical Production and Cost data going back 5 years.

Leadership wants ONE governed Power BI solution that blends both sources so Plant Managers, Regional Directors, and Executives can each see operations and quality data at the altitude appropriate to their role — without maintaining 40+ separate reports or manually-managed security roles.`,
    stakeholders: JSON.stringify([
      { name: 'Elena Vasquez', role: 'CFO', ask: 'A single trusted dataset, refreshed every 4 hours, with proper protection since cost data is included.' },
      { name: 'Plant Managers (40+)', role: 'Shop Floor Leadership', ask: 'Legible, colorblind-safe shop-floor dashboards with only the most important KPIs visible at a glance.' },
      { name: 'Regional Directors', role: 'Regional Leadership', ask: 'A drill hierarchy from Region to Plant to Machine.' },
      { name: 'Data Governance Officer', role: 'Governance', ask: 'Security driven dynamically by each user\'s identity — not a manually managed role per plant, since there are 40+ plant managers today and more plants are planned.' },
    ]),
    constraints: JSON.stringify([
      'Row-level security must scale as plants/regions are added, without manually creating a role per plant.',
      'The on-premises SQL Server source requires a gateway for scheduled refresh.',
      'Cost data is sensitive and must stay protected even if a report link is accidentally shared externally.',
      'Shop floor displays must be readable at a glance and colorblind-accessible.',
      'One shared dataset/report set should serve all three audience tiers (Plant Manager, Regional Director, Executive).',
    ]),
    questions: [
      {
        question_text: 'Which Row-Level Security approach satisfies "scales to 40+ plant managers and multiple regional directors without manually creating a role per plant"?',
        options: [
          'Create one static RLS role per plant (6 roles) and one per region (2 roles), manually assigning each of the 40+ users to their matching role',
          'Dynamic RLS: a single DAX rule using USERPRINCIPALNAME() joined to a Plant/Region-to-User mapping table, so the same rule automatically scopes each logged-in user to their own plant or region',
          'Disable RLS and rely on separate workspaces per plant instead',
          'Ask every plant manager to manually filter the report themselves and trust them not to look at other plants',
        ],
        correct_index: 1,
        explanation: 'Dynamic RLS (USERPRINCIPALNAME() or USERNAME() joined against a mapping table of users-to-plants/regions) lets ONE rule automatically scope data correctly for any user, scaling to new plants/users by just adding mapping rows — exactly the scalability the governance officer requires, unlike static per-plant roles which require manual role creation and per-user assignment that grows linearly with plant count.',
      },
      {
        question_text: 'Machines can contain child sub-assemblies which are themselves tracked as Machine rows with a ParentMachineID. Which modeling technique correctly supports a Region -> Plant -> Machine (-> sub-assembly) drill hierarchy for the Regional Directors?',
        options: [
          'A single flat table with no relationships, relying on text concatenation for hierarchy labels',
          'A self-referencing parent-child structure on Machine (ParentMachineID), flattened into levels using PATH()-based DAX functions, combined with standard one-to-many relationships from Region to Plant to Machine',
          'Row-level security rules to represent the hierarchy',
          'A many-to-many relationship between Region and Machine directly, skipping Plant entirely',
        ],
        correct_index: 1,
        explanation: 'The Region -> Plant -> Machine chain is modeled with standard one-to-many conformed-dimension relationships, while the self-referencing Machine sub-assembly relationship specifically needs PATH()-based parent-child DAX functions to flatten into navigable hierarchy levels — these are two distinct, well-documented modeling techniques used together here.',
      },
      {
        question_text: 'Write the measure for "Critical Defect Rate" (Critical-severity defects divided by total defects) so that it never throws an error when a plant has zero defects in the current filter context.',
        options: [
          'Critical Defect Rate := COUNTROWS(FILTER(Defects, Defects[Severity] = "Critical")) / COUNTROWS(Defects)',
          'Critical Defect Rate := DIVIDE(COUNTROWS(FILTER(Defects, Defects[Severity] = "Critical")), COUNTROWS(Defects))',
          'Critical Defect Rate := SUM(Defects[Severity])',
          'Critical Defect Rate := AVERAGE(Defects[Severity])',
        ],
        correct_index: 1,
        explanation: 'DIVIDE() safely handles a zero (or blank) denominator by returning BLANK() (or an optional alternate value) instead of throwing a divide-by-zero error, which the plain "/" operator in option 1 would risk when a plant has zero defects. Severity is a text/category column, so SUM/AVERAGE on it are not valid.',
      },
      {
        question_text: 'What must be configured so the Production/Cost dataset can refresh automatically every 4 hours from the on-premises SQL Server warehouse?',
        options: [
          'Nothing extra — cloud-hosted Power BI can reach any on-premises server directly by default',
          'An On-premises Data Gateway installed and registered, linked to the dataset\'s data source credentials, with Scheduled Refresh configured at the required interval',
          'Export the SQL Server data to CSV manually every 4 hours and re-upload it',
          'Switch the report to "Publish to Web" so it refreshes continuously',
        ],
        correct_index: 1,
        explanation: 'The Power BI Service cannot reach an on-premises SQL Server directly; an On-premises Data Gateway must be installed and registered as the secure bridge, after which Scheduled Refresh can be configured for the required interval — this is the only option that is both automated and supported.',
      },
      {
        question_text: 'Elena Vasquez (CFO) is concerned that a report containing cost data could be mistakenly shared outside the company. What control should be applied to enforce protection even if that mistake happens?',
        options: [
          'A verbal reminder to the report team to "be careful"',
          'A Sensitivity Label (via Microsoft Purview Information Protection) applied to the dataset/report that technically enforces restrictions such as blocking external sharing or applying encryption',
          'Renaming the report to include the word "Internal Only"',
          'Hiding the cost visuals behind a bookmark that users could still unhide'
        ],
        correct_index: 1,
        explanation: 'Sensitivity labels are the enforced, technical governance control — unlike naming conventions or verbal reminders, a sensitivity label with protection settings can actually block or restrict external sharing and apply encryption at the platform level, regardless of user intent or mistakes.',
      },
      {
        question_text: 'Plant Managers report their shop-floor dashboard feels cluttered, and a colorblind supervisor cannot distinguish "Critical" (red) from "Normal" (green) status tiles. The design also needs to keep machine-level detail available without crowding the main page. What combination of changes should you make?',
        options: [
          'Add more KPI tiles so nothing is "missing," keep status purely color-coded, and put everything on one page',
          'Reduce the page to the few most critical KPIs, pair the Critical/Normal status with a non-color cue (icon or text label) using a colorblind-safe palette, and move machine-level detail to a drillthrough page',
          'Switch all charts to 3D for visual interest',
          'Remove all visuals except a single large number tile'
        ],
        correct_index: 1,
        explanation: 'This combines three documented best practices: minimizing default visible KPIs to reduce clutter and cognitive load, never relying on color alone (pairing with icons/text and using colorblind-safe palettes) for status meaning, and using drillthrough to keep detailed information available without cluttering the primary shop-floor view.',
      },
    ],
  },
];
