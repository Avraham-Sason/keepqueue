import { SignUpForm } from "@/components/signup-form";

export default function CustomerSignUpPage() {
    return (
        <div className="h-screen w-full center">
            <SignUpForm type="customer" />
        </div>
    );
}
