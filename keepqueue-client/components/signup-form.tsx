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
import { useLanguage } from "@/hooks";
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { auth } from "@/lib/firebase/connect";
import { setDocument } from "@/lib/firebase";
import type { LoginType } from "@/lib/store";
import { useAuthStore } from "@/lib/store";
import type { BusinessOwner, Customer } from "@/lib/types";
import { Timestamp } from "firebase/firestore";

interface SignUpFormProps {
    type: LoginType;
}

export function SignUpForm({ type }: SignUpFormProps) {
    const { t, isRtl } = useLanguage();
    const router = useRouter();
    const login = useAuthStore.login();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError(t("passwordsDoNotMatch"));
            return;
        }

        setIsLoading(true);

        try {
            const normalizedEmail = email.trim().toLowerCase();
            const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
            const firebaseUser = credential.user;

            const now = Timestamp.now();
            const baseUser = {
                id: firebaseUser.uid,
                email: normalizedEmail,
                phone,
                firstName,
                lastName,
                isActive: true,
                contacts: { sms: true, email: true },
                created: now,
                timestamp: now,
                photoURL: firebaseUser.photoURL || "",
            };

            const profile: Omit<BusinessOwner, "id"> | Omit<Customer, "id"> =
                type === "business"
                    ? { ...baseUser, type: "business", ownedBusinessIds: [] }
                    : { ...baseUser, type: "customer", businessIds: [], blockedByBusinessIds: [] };

            // Document id must be the Auth uid: firestore.rules only permit users/{userId}
            // when userId == request.auth.uid, and every server ownership check resolves
            // users by uid. A random id produces an account that cannot do anything.
            // setDocument rejects when the write does not land. Catching it here rather than
            // letting it fall through keeps the rollback below reachable: an Auth account with
            // no profile can neither sign in nor be registered again.
            let profileWritten = true;
            try {
                await setDocument("users", firebaseUser.uid, profile);
            } catch {
                profileWritten = false;
            }
            if (!profileWritten) {
                await deleteUser(firebaseUser).catch(() => undefined);
                setError(t("signUpError"));
                return;
            }

            const result = await login(normalizedEmail, password);
            if (!result.success) {
                setError(t(result.error ?? "signUpError"));
                return;
            }
            router.push(type === "business" ? "/business" : "/customer/dashboard");
        } catch (err: any) {
            if (err?.code === "auth/email-already-in-use") {
                setError(t("emailAlreadyInUse"));
            } else if (err?.code === "auth/weak-password") {
                setError(t("weakPassword"));
            } else {
                setError(t("signUpError"));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const isCustomer = type === "customer";
    const title = isCustomer ? t("signUpCustomerTitle") : t("signUpBusinessTitle");
    const description = isCustomer ? t("signUpCustomerDescription") : t("signUpBusinessDescription");

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">{title}</CardTitle>
                <CardDescription className="text-center">{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">{t("firstName")}</Label>
                            <Input
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">{t("lastName")}</Label>
                            <Input
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

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
                        <Label htmlFor="phone">{t("phone")}</Label>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="+972..."
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
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
                                placeholder={t("chooseStrongPassword")}
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

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t("signingUp")}
                            </>
                        ) : (
                            t("signUp")
                        )}
                    </Button>
                </form>

                <div className="mt-4 text-center text-sm">
                    <p className="text-muted-foreground">
                        {t("alreadyHaveAccount")}{" "}
                        <a href={`/auth/signin/${type}`} className="text-primary hover:underline">
                            {t("signInHere")}
                        </a>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
