"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/hooks";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/connect";

export default function ResetPasswordPage() {
    const { t } = useLanguage();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            await sendPasswordResetEmail(auth, email);
            setSuccess(true);
        } catch (err: any) {
            setError(t("resetLinkError"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen w-full center">
            <Card className="w-full max-w-md mx-auto">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">{t("resetPasswordTitle")}</CardTitle>
                    <CardDescription className="text-center">{t("resetPasswordDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                    {success ? (
                        <div className="space-y-4 text-center">
                            <div className="flex justify-center">
                                <CheckCircle2 className="h-12 w-12 text-green-500" />
                            </div>
                            <p className="text-sm text-muted-foreground">{t("resetLinkSent")}</p>
                            <Button variant="outline" className="w-full" asChild>
                                <a href="/auth/signin/business">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    {t("backToSignIn")}
                                </a>
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">{t("emailAddress")}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t("sendingResetLink")}
                                    </>
                                ) : (
                                    t("sendResetLink")
                                )}
                            </Button>

                            <div className="text-center">
                                <a href="/auth/signin/business" className="text-sm text-primary hover:underline">
                                    <ArrowLeft className="inline h-3 w-3 mr-1" />
                                    {t("backToSignIn")}
                                </a>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
