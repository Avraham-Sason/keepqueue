import type { Metadata } from "next";
import { getServerTranslation } from "@translations/server";
import { LegalDocument, LegalSection } from "../landing-page/legal";

const SECTIONS: LegalSection[] = [
    { titleKey: "privacyIntroTitle", bodyKey: "privacyIntroBody" },
    { titleKey: "privacyDataTitle", bodyKey: "privacyDataBody" },
    { titleKey: "privacyPurposeTitle", bodyKey: "privacyPurposeBody" },
    { titleKey: "privacyBasisTitle", bodyKey: "privacyBasisBody" },
    { titleKey: "privacySharingTitle", bodyKey: "privacySharingBody" },
    { titleKey: "privacyHostingTitle", bodyKey: "privacyHostingBody" },
    { titleKey: "privacyRetentionTitle", bodyKey: "privacyRetentionBody" },
    { titleKey: "privacyRightsTitle", bodyKey: "privacyRightsBody" },
    { titleKey: "privacySecurityTitle", bodyKey: "privacySecurityBody" },
    { titleKey: "privacyCookiesTitle", bodyKey: "privacyCookiesBody" },
    { titleKey: "privacyMinorsTitle", bodyKey: "privacyMinorsBody" },
    { titleKey: "privacyChangesTitle", bodyKey: "privacyChangesBody" },
    { titleKey: "privacyContactTitle", bodyKey: "privacyContactBody" },
];

export async function generateMetadata(): Promise<Metadata> {
    const t = await getServerTranslation();
    return {
        title: `${t("privacyPolicy")} | ${t("brandName")}`,
        description: t("metaPrivacyDescription"),
        alternates: { canonical: "/privacy" },
    };
}

export default function PrivacyPage() {
    return <LegalDocument titleKey="privacyPolicy" sections={SECTIONS} />;
}
