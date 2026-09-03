import type { Metadata } from "next";
import { getServerTranslation } from "@translations/server";
import { LegalDocument, LegalSection } from "../landing-page/legal";

const SECTIONS: LegalSection[] = [
    { titleKey: "termsIntroTitle", bodyKey: "termsIntroBody" },
    { titleKey: "termsServiceTitle", bodyKey: "termsServiceBody" },
    { titleKey: "termsAccountsTitle", bodyKey: "termsAccountsBody" },
    { titleKey: "termsBookingsTitle", bodyKey: "termsBookingsBody" },
    { titleKey: "termsUseTitle", bodyKey: "termsUseBody" },
    { titleKey: "termsContentTitle", bodyKey: "termsContentBody" },
    { titleKey: "termsAvailabilityTitle", bodyKey: "termsAvailabilityBody" },
    { titleKey: "termsLiabilityTitle", bodyKey: "termsLiabilityBody" },
    { titleKey: "termsPrivacyTitle", bodyKey: "termsPrivacyBody" },
    { titleKey: "termsLawTitle", bodyKey: "termsLawBody" },
    { titleKey: "termsChangesTitle", bodyKey: "termsChangesBody" },
    { titleKey: "termsContactTitle", bodyKey: "termsContactBody" },
];

export async function generateMetadata(): Promise<Metadata> {
    const t = await getServerTranslation();
    return {
        title: `${t("termsOfUse")} | ${t("brandName")}`,
        description: t("metaTermsDescription"),
        alternates: { canonical: "/terms" },
    };
}

export default function TermsPage() {
    return <LegalDocument titleKey="termsOfUse" sections={SECTIONS} />;
}
