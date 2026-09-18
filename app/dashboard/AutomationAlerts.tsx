import Link from "next/link";

import {
  buildDashboardAlertsV2,
  getAlertClassesV2,
} from "../../lib/automation-engine-v2";
import type { RelationshipRecord } from "../../lib/relationship-repository";

export default function AutomationAlerts({
  relationships,
}: {
  relationships: RelationshipRecord[];
}) {
  const alerts = buildDashboardAlertsV2(relationships);

  return (
    <div className="mb-6 space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`rounded-2xl border px-4 py-3 shadow-sm ${getAlertClassesV2(
            alert.tone,
          )}`}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold">{alert.title}</p>
              <p className="mt-1 text-sm leading-6">
                {alert.description}
              </p>
            </div>

            <Link
              href="/dashboard/automations"
              className="inline-flex rounded-xl border border-current/20 bg-white/70 px-3 py-2 text-xs font-semibold transition hover:bg-white"
            >
              Ver automatizaciones
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}