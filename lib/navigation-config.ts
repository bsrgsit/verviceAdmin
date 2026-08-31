import {
  LayoutDashboard,
  FileText,
  UserCheck,
  Users,
  CreditCard,
  Receipt,
  Battery,
  Car,
  HelpCircle,
  Sliders,
  Image as ImageIcon,
  Layout,
  Building2,
  History,
} from 'lucide-react';

export interface SubMenuItem {
  href: string;
  label: string;
  description: string;
  icon: any;
}

export interface PrimarySection {
  id: string;
  label: string;
  icon: any;
  defaultHref: string;
  subRoutes: string[];
  subItems: SubMenuItem[];
}

export const primarySections: PrimarySection[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    defaultHref: '/',
    subRoutes: ['/'],
    subItems: [
      {
        href: '/',
        label: 'Dashboard Overview',
        description: 'Real-time revenue, bookings & community operational metrics',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: FileText,
    defaultHref: '/bookings',
    subRoutes: ['/bookings', '/partners', '/users'],
    subItems: [
      {
        href: '/bookings',
        label: 'Cleaning Schedules',
        description: 'Daily car wash rosters & assigned plans',
        icon: FileText,
      },
      {
        href: '/partners',
        label: 'Cleaner Fleet & Staff',
        description: 'Cleaner attendance, gate check-in & shifts',
        icon: UserCheck,
      },
      {
        href: '/users',
        label: 'Residents & Vehicles',
        description: 'Resident accounts, vehicles & parking slots',
        icon: Users,
      },
    ],
  },
  {
    id: 'finance',
    label: 'Finance & Billing',
    icon: CreditCard,
    defaultHref: '/payments',
    subRoutes: ['/payments', '/invoices'],
    subItems: [
      {
        href: '/payments',
        label: 'Payment Approvals',
        description: 'Review & approve manual UPI transactions',
        icon: CreditCard,
      },
      {
        href: '/invoices',
        label: 'Monthly Invoices',
        description: 'Generate invoices & track overdue balances',
        icon: Receipt,
      },
    ],
  },
  {
    id: 'services',
    label: 'Services & Requests',
    icon: Battery,
    defaultHref: '/battery-requests',
    subRoutes: ['/battery-requests', '/driver-requests', '/support-tickets'],
    subItems: [
      {
        href: '/battery-requests',
        label: 'Battery Jumpstart',
        description: 'Emergency jumpstart & technician dispatch',
        icon: Battery,
      },
      {
        href: '/driver-requests',
        label: 'Driver Hire',
        description: 'On-demand driver bookings & assignments',
        icon: Car,
      },
      {
        href: '/support-tickets',
        label: 'Support Helpdesk',
        description: 'Resident complaint tickets & resolution',
        icon: HelpCircle,
      },
    ],
  },
  {
    id: 'app_control',
    label: 'App & Content',
    icon: Sliders,
    defaultHref: '/app-config',
    subRoutes: ['/app-config', '/banners', '/screen-config'],
    subItems: [
      {
        href: '/app-config',
        label: 'Feature Flags & Config',
        description: 'Real-time toggles for services & cleaner status',
        icon: Sliders,
      },
      {
        href: '/banners',
        label: 'Banners & Promotions',
        description: 'Home screen banners with live phone preview',
        icon: ImageIcon,
      },
      {
        href: '/screen-config',
        label: 'Screen & Barrier Text',
        description: 'Locked community & guest user messages',
        icon: Layout,
      },
    ],
  },
  {
    id: 'settings',
    label: 'Hubs & Audit',
    icon: Building2,
    defaultHref: '/communities',
    subRoutes: ['/communities', '/audit-log'],
    subItems: [
      {
        href: '/communities',
        label: 'Manage Societies & Hubs',
        description: 'Gated communities, blocks & gate passcodes',
        icon: Building2,
      },
      {
        href: '/audit-log',
        label: 'System Audit Logs',
        description: 'Trace all admin actions & timestamps',
        icon: History,
      },
    ],
  },
];

export function getActivePrimarySection(pathname: string): PrimarySection {
  const match = primarySections.find((section) =>
    section.subRoutes.some((route) =>
      route === '/' ? pathname === '/' : pathname === route || pathname.startsWith(route + '/')
    )
  );
  return match || primarySections[0];
}
