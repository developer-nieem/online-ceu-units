import { Button } from '@calace/ui/components/ui/button';
import { Users } from 'lucide-react';

import { PageHeader } from '@/components/learner/page-header';
import { PlaceholderPanel } from '@/components/learner/placeholder-panel';
import {
  CNA_NETWORK_BRAND,
  CNA_NETWORK_RENEWAL_URL,
  CNA_NETWORK_URL,
} from '@/lib/cna-network';

export default function CommunityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Community"
        description={`Connect with fellow CNAs through ${CNA_NETWORK_BRAND} and CAL ACE community features.`}
      />
      <PlaceholderPanel
        title={`${CNA_NETWORK_BRAND} community`}
        description="Discussion forums, peer support, and job networking — integration placeholder."
        icon={Users}
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <a href={CNA_NETWORK_URL} target="_blank" rel="noopener noreferrer">
              Visit {CNA_NETWORK_BRAND}
            </a>
          </Button>
          <Button asChild variant="secondary">
            <a href={CNA_NETWORK_RENEWAL_URL} target="_blank" rel="noopener noreferrer">
              Renewal community
            </a>
          </Button>
        </div>
      </PlaceholderPanel>
    </div>
  );
}
