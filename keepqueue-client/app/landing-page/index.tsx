import { SiteHeader } from "./client-components";
import { FeaturesSection, HeroSection, SiteFooter, WhySection } from "./static-components";

export default function  LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
            <SiteHeader />
            <HeroSection />
            <FeaturesSection />
            <WhySection />
            <SiteFooter />
        </div>
    );
}
