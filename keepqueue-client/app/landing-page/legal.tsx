import { use } from "react";
import { AlertTriangle } from "lucide-react";
import { getServerTranslation, TranslationsKey } from "@translations/server";
import { SiteHeader } from "./client-components";
import { SiteFooter } from "./static-components";

export interface LegalSection {
    titleKey: TranslationsKey;
    bodyKey: TranslationsKey;
}

function Paragraphs({ text, className }: { text: string; className?: string }) {
    return (
        <div className="space-y-3">
            {text.split("\n").map((paragraph, index) => (
                <p key={index} className={className}>
                    {paragraph}
                </p>
            ))}
        </div>
    );
}

export function LegalDocument({ titleKey, sections }: { titleKey: TranslationsKey; sections: LegalSection[] }) {
    const t = use(getServerTranslation());
    return (
        <div className="min-h-screen bg-background">
            <SiteHeader />
            <main className="container max-w-3xl mx-auto px-4 py-12">
                <div className="rounded-lg border-2 border-yellow-500/60 bg-yellow-500/10 p-4 mb-10">
                    <p className="flex items-center gap-2 font-semibold mb-2">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600" />
                        {t("legalDraftBannerTitle")}
                    </p>
                    <Paragraphs text={t("legalDraftBannerBody")} className="text-sm leading-relaxed" />
                </div>

                <h1 className="text-3xl md:text-4xl font-bold mb-2">{t(titleKey)}</h1>
                <p className="text-sm text-muted-foreground mb-10">{t("legalEffectiveDate")}</p>

                {sections.map(({ titleKey: sectionTitleKey, bodyKey }) => (
                    <section key={sectionTitleKey} className="mb-8">
                        <h2 className="text-xl font-semibold mb-3">{t(sectionTitleKey)}</h2>
                        <Paragraphs text={t(bodyKey)} className="text-muted-foreground leading-relaxed" />
                    </section>
                ))}
            </main>
            <SiteFooter />
        </div>
    );
}
