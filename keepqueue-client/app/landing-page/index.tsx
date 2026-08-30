import { NewsletterSection, SiteHeader } from "./client-components";
import { FeaturesSection, HeroSection, SiteFooter, TestimonialsSection } from "./static-components";

export default function  LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
            <SiteHeader />
            <HeroSection />
            <FeaturesSection />
            <TestimonialsSection />
            <NewsletterSection />
            <SiteFooter />
        </div>
    );
}
