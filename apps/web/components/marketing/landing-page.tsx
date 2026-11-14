import { LandingBirthdayMath } from './landing-birthday-math';
import { LandingCtaBanner } from './landing-cta-banner';
import { LandingFounder } from './landing-founder';
import { LandingHero } from './landing-hero';
import { LandingHybridLocations } from './landing-hybrid-locations';
import { LandingPricing } from './landing-pricing';
import { LandingPromoStrip } from './landing-promo-strip';
import { LandingTrustStrip } from './landing-trust-strip';
import { MarketingFooter } from './marketing-footer';
import { MarketingHeader } from './marketing-header';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MarketingHeader />
      <LandingPromoStrip />
      <LandingHero />
      <LandingTrustStrip />
      <LandingBirthdayMath />
      <LandingHybridLocations />
      <LandingFounder />
      <LandingPricing />
      <LandingCtaBanner />
      <MarketingFooter />
    </div>
  );
}
