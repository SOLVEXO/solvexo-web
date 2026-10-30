import { useMemo } from 'react';
import { LayoutGrid } from 'lucide-react';
import {
  apiAdminAnalyticsOverview, apiAdminAnalyticsPlatformAlerts, apiAdminAnalyticsPlatformHealth,
} from '@/api/services/analytics/adminAnalytics';
import { AdminPageHeader } from '@/components/comman/ui/AdminPageHeader';
import { ErrorBoundary } from '@/components/comman/ErrorBoundary';
import { SkeletonBox } from '@/components/comman/ui/SkeletonBox';
import { DashboardCanvas } from '@/components/comman/dashboard/DashboardCanvas';
import { CustomizeButton, CustomizeToolbar } from '@/components/comman/dashboard/CustomizeToolbar';
import { useDashboardLayout } from '@/components/comman/dashboard/useDashboardLayout';
import { useKeyedLoad } from '@/components/comman/dashboard/useKeyedLoad';
import type { DashboardScope } from '@/api/services/dashboardLayout';
import type { DashboardWidgetDef } from '@/components/comman/dashboard/dashboardTypes';
import { can } from '@/hooks/auth/useCan';
import { ADMIN_DEFAULT_WIDGETS, ADMIN_PRESETS, ADMIN_WIDGET_DEFS, type AdminWidgetDef } from './adminDashboardWidgets';
import { AdminWidget, type AdminDashboardData } from './AdminDashboardCards';

const SCOPE: DashboardScope = { kind: 'admin' };

// The widget library and layout only decide what is arranged on screen. A team admin without the matching permission
// never sees (or is offered) the widget, and every data endpoint checks the permission again on the server.
const canSeeWidget = (d: DashboardWidgetDef) => {
  const perm = (d as AdminWidgetDef).perm;
  return perm === null ? true : can(perm as Parameters<typeof can>[0]);
};
const PATH_PERMISSION: Record<string, string> = { '/admin/clients': 'clients.view', '/admin/finance': 'finance.view', '/admin/content': 'content.manage' };
const canOpen = (path: string) => { const p = PATH_PERMISSION[path]; return !p || can(p as Parameters<typeof can>[0]); };

// Super Admin Home: a customizable platform overview. The filterable, exportable reports stay in /admin/analytics.
export function AdminOverview() {
  const layout = useDashboardLayout({ scope: SCOPE, defs: ADMIN_WIDGET_DEFS, defaultWidgets: ADMIN_DEFAULT_WIDGETS, canSee: canSeeWidget });
  const canAnalytics = can('analytics.view');
  const overview = useKeyedLoad(() => apiAdminAnalyticsOverview({ range: '30d' }).then(r => r.data), 'overview', canAnalytics);
  const alerts = useKeyedLoad(() => apiAdminAnalyticsPlatformAlerts({}).then(r => r.data), 'alerts', canAnalytics);
  const health = useKeyedLoad(() => apiAdminAnalyticsPlatformHealth({}).then(r => r.data), 'health', canAnalytics);
  const data: AdminDashboardData = useMemo(() => ({ overview, alerts, health }), [overview, alerts, health]);

  return (
    <>
      <AdminPageHeader
        title="Platform Overview"
        subtitle="Monitor your platform: merchants, subscription revenue and system health."
        icon={<LayoutGrid size={17} />}
      />
      <div className="px-4 sm:px-7 pt-6 pb-8 flex flex-col gap-5">
        {!layout.editing && (
          <div className="flex justify-end -mb-2">
            <CustomizeButton layout={layout} />
          </div>
        )}

        {layout.editing && <CustomizeToolbar layout={layout} defs={ADMIN_WIDGET_DEFS} presets={ADMIN_PRESETS} />}

        {layout.loadError && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-error-bg border border-error/10 text-[12.5px] text-error" role="alert">
            <span>Your saved layout could not be loaded, so the default layout is shown. {layout.loadError}</span>
            <button type="button" onClick={layout.reload} className="ml-auto font-semibold underline bg-transparent border-none cursor-pointer text-error">Try again</button>
          </div>
        )}

        {layout.loading ? (
          <div className="grid grid-cols-12 gap-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonBox key={i} className="col-span-12 sm:col-span-6 lg:col-span-3 h-[110px]" />)}</div>
        ) : layout.widgets.length === 0 && !layout.editing ? (
          <div className="bg-white border border-bone rounded-2xl px-6 py-12 text-center">
            <p className="text-[14px] font-semibold text-charcoal">Your dashboard is empty</p>
            <p className="text-[12.5px] text-slate mt-1 mb-4">Add widgets to build the overview you want.</p>
            <CustomizeButton layout={layout} />
          </div>
        ) : (
          <DashboardCanvas defs={ADMIN_WIDGET_DEFS} layout={layout} renderWidget={(def, w) => (
            // One widget with bad data shows its own error card instead of blanking the whole dashboard.
            <ErrorBoundary section={def.title} sectionClassName="h-full"><AdminWidget def={def} w={w} data={data} canOpen={canOpen} /></ErrorBoundary>
          )} />
        )}
      </div>
    </>
  );
}
