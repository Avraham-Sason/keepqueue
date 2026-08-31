"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { LoginType, useAuthStore } from "@/lib/store";
import { useLanguage } from "@/hooks";
import type { Customer, User } from "@/lib/types";

interface SignInSuccessPayload {
    user: User;
    isBusinessOwner: boolean;
}

interface SignInFormProps {
    type: LoginType;
    disableRedirect?: boolean;
    onSuccess?: (payload: SignInSuccessPayload) => void;
}

export function SignInForm({ type, disableRedirect = false, onSuccess }: SignInFormProps) {
    const { t, isRtl } = useLanguage();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const login = useAuthStore.login();

    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const result = await login(email, password);

            if (result.success) {
                const authUser = result.user as User | undefined;
                const isBusinessOwner = Boolean(result.isBusinessOwner);

                if (authUser && onSuccess) {
                    onSuccess({ user: authUser, isBusinessOwner });
                }

                if (!disableRedirect) {
                    if (isBusinessOwner) {
                        router.push(`/business`);
                    } else {
                        const customerBusinessId = (authUser as Customer | undefined)?.businessIds?.[0];
                        router.push(customerBusinessId ? `/home/${customerBusinessId}` : `/home`);
                    }
                }
            } else {
                const key = result.error || "errorSignIn";
                setError(t(key));
            }
        } catch (err) {
            setError(t("errorSignIn"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">{t("signInTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
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
                            maxLength={254}
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">{t("password")}</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder={t("enterPassword")}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className={`absolute ${isRtl ? "left-0" : "right-0"} top-0 h-full px-3 py-2 hover:bg-transparent`}
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isLoading}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <a href="/auth/reset-password" className="text-sm text-primary hover:underline">
                            {t("forgotPassword")}
                        </a>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t("signingIn")}
                            </>
                        ) : (
                            t("signIn")
                        )}
                    </Button>
                </form>

                <div className="mt-4 text-center text-sm">
                    <p className="text-muted-foreground">
                        {t("noAccount")}{" "}
                        <a href={`/auth/signup/${type}`} className="text-primary hover:underline">
                            {t("signUpHere")}
                        </a>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
