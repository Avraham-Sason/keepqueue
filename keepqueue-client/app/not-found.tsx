import Link from "next/link";
import Image from "next/image";
import { getServerTranslation } from "@translations/server";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
    const t = await getServerTranslation();
    return (
        <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
            <Image src="/logo.png" alt={t("brandName")} width={48} height={48} />
            <p className="text-6xl font-bold text-primary">404</p>
            <h1 className="text-2xl font-bold">{t("notFoundTitle")}</h1>
            <p className="text-muted-foreground max-w-md">{t("notFoundBody")}</p>
            <Button asChild className="mt-2">
                <Link href="/">{t("backToHome")}</Link>
            </Button>
        </div>
    );
}
