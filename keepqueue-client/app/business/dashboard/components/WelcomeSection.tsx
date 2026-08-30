import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/hooks";
import { useAuthStore, useBusinessesStore } from "@/lib/store";
import { motion } from "framer-motion";

export const WelcomeSection = () => {
    const { t } = useLanguage();
    const businessOwner = useAuthStore.user()!;
    const currentBusiness = useBusinessesStore.currentBusiness();
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {t("hello")}, {businessOwner.firstName}!
                    </h1>
                    <p className="text-muted-foreground">
                        {t("welcomeBusinessAdminPanelOf")} {currentBusiness?.name ?? ""}
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={currentBusiness?.logoUrl || "/placeholder.svg"} alt={businessOwner.firstName} />
                        <AvatarFallback>{businessOwner.firstName.charAt(0)}</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </motion.div>
    );
};
