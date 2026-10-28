import {LoginForm} from "@/components/login-form.tsx";
import {AppLogo} from "@/components/app-logo";

export default function LoginPage() {
    return <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
            <div className="mb-6 flex flex-col items-center gap-2 text-center">
                <div className="bg-primary text-primary-foreground flex size-14 items-center justify-center rounded-2xl shadow-sm">
                    <AppLogo className="size-8"/>
                </div>
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">QualiUMa</h1>
                    <p className="text-sm text-muted-foreground">SGQ · ISO 9001</p>
                </div>
            </div>
            <LoginForm/>
        </div>
    </div>
}
