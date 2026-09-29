/**
 * Centralized Navigation Configuration for PhishGuard AI
 * Single source of truth for navigation items, grouping, routes, and metadata.
 */

export const NAV_SECTIONS = [
  {
    id: 'WORKSPACE',
    title: 'Workspace',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        route: '/dashboard',
        icon: 'dashboard',
        section: 'WORKSPACE',
        sectionTitle: 'Workspace',
        eyebrow: 'SECURITY TELEMETRY',
        title: 'Executive Security Dashboard',
        description: 'Multi-agent security telemetry, Bayesian risk aggregates, and real-time threat ingestion.'
      },
      {
        id: 'submit',
        label: 'Analyze Threat',
        route: '/analyze',
        icon: 'send_and_archive',
        section: 'WORKSPACE',
        sectionTitle: 'Workspace',
        eyebrow: 'WORKSPACE',
        title: 'Analyze Threat',
        description: 'Submit suspicious emails, URLs, messages, or other content for multi-agent security analysis.'
      },
      {
        id: 'incidents',
        label: 'Incident History',
        route: '/incidents',
        icon: 'history',
        section: 'WORKSPACE',
        sectionTitle: 'Workspace',
        eyebrow: 'WORKSPACE',
        title: 'Incident History & Evidence Log',
        description: 'Review past submissions, inspect risk scoring variances, and verify recorded verdicts.'
      }
    ]
  },
  {
    id: 'SECURITY',
    title: 'Security',
    items: [
      {
        id: 'analytics',
        label: 'Risk Analytics',
        route: '/risk',
        icon: 'monitoring',
        section: 'SECURITY',
        sectionTitle: 'Security',
        eyebrow: 'SECURITY',
        title: 'Cybersecurity Risk Analytics',
        description: 'Aggregated threat volume, Bayesian risk trajectories, and validated multi-agent model evaluation metrics.'
      },
      {
        id: 'glossary',
        label: 'Attack Glossary',
        route: '/glossary',
        icon: 'menu_book',
        section: 'SECURITY',
        sectionTitle: 'Security',
        eyebrow: 'SECURITY',
        title: 'Attack Type Glossary',
        description: 'Curated taxonomy of social engineering attack vectors, behavioral deception mechanisms, and defensive protocols.'
      }
    ]
  },
  {
    id: 'ACCOUNT',
    title: 'Account',
    items: [
      {
        id: 'profile',
        label: 'Profile & Settings',
        route: '/profile',
        icon: 'manage_accounts',
        section: 'ACCOUNT',
        sectionTitle: 'Account',
        eyebrow: 'ACCOUNT',
        title: 'Profile & Settings',
        description: 'Manage personalized defense footprint, security awareness tier, and connect LLM providers.'
      }
    ]
  }
];

export const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);

export const NAV_ITEM_MAP = Object.fromEntries(
  ALL_NAV_ITEMS.map((item) => [item.id, item])
);

export const ROUTE_TO_SCREEN = {
  '/': 'landing',
  '/landing': 'landing',
  '/dashboard': 'dashboard',
  '/analyze': 'submit',
  '/submit': 'submit',
  '/incidents': 'incidents',
  '/risk': 'analytics',
  '/analytics': 'analytics',
  '/glossary': 'glossary',
  '/profile': 'profile',
  '/login': 'login',
  '/signup': 'signup',
  '/forgot-password': 'forgot-password',
  '/onboarding': 'onboarding',
  '/result': 'result'
};

export const SCREEN_TO_ROUTE = {
  landing: '/',
  dashboard: '/dashboard',
  submit: '/analyze',
  incidents: '/incidents',
  analytics: '/risk',
  glossary: '/glossary',
  profile: '/profile',
  login: '/login',
  signup: '/signup',
  'forgot-password': '/forgot-password',
  onboarding: '/onboarding',
  result: '/result'
};

/**
 * Helper to get breadcrumb trail for a given screen
 */
export function getBreadcrumbTrail(screenId, customLabel = null) {
  if (screenId === 'dashboard') {
    return []; // Prompt specifies: "Dashboard: No breadcrumb required"
  }

  if (screenId === 'result') {
    return [
      { label: 'Workspace', screen: 'dashboard' },
      { label: 'Incident History', screen: 'incidents' },
      { label: customLabel || 'Incident Report', active: true }
    ];
  }

  const navItem = NAV_ITEM_MAP[screenId];
  if (!navItem) {
    return [];
  }

  return [
    { label: navItem.sectionTitle, screen: navItem.section === 'WORKSPACE' ? 'dashboard' : undefined },
    { label: navItem.label, active: true }
  ];
}
