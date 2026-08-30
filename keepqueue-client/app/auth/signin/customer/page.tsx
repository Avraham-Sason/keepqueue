import { SignInForm } from "@/components/signin-form";

export default function CustomerSignInPage() {
    return (
        <div className="h-screen w-full center">
            <SignInForm type="customer" />
        </div>
    );
}
