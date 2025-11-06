import { IntegrationCard } from "@/polymet/components/integration-card";
import { integrations } from "@/polymet/data/integrations-data";
import { LayoutGridIcon } from "lucide-react";

export function Deploy() {
  const internalIntegrations = integrations.filter(
    (i) => i.category === "internal"
  );
  const externalIntegrations = integrations.filter(
    (i) => i.category === "external"
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="flex items-center gap-3">
          <LayoutGridIcon className="w-5 h-5 text-muted-foreground" />

          <h1 className="text-lg font-semibold">Deploy</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-8">
        {/* Internal Integrations */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Internal Integrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {internalIntegrations.map((integration) => (
              <IntegrationCard key={integration.id} integration={integration} />
            ))}
          </div>
        </div>

        {/* External Integrations */}
        <div>
          <h2 className="text-xl font-semibold mb-4">External Integrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {externalIntegrations.map((integration) => (
              <IntegrationCard key={integration.id} integration={integration} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
