import {cn} from "@/lib/utils"
import {Button} from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import {Input} from "@/components/ui/input"
import { Link } from "react-router-dom"
import {login} from "@/api/auth"
import {useAuth} from "@/context/auth-context"
import { useState} from "react";
import {useMutation} from "@tanstack/react-query";
import type {AxiosError} from "axios";

export function LoginForm({
                              className,
                              ...props
                          }: React.ComponentProps<"div">) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null);
    const {setAuth} = useAuth();

    const mutation = useMutation({
        mutationFn: () =>
            login({
                email,
                password,
            }),

onSuccess: (data) => {
            setAuth({
                accessToken: data.accessToken,
                user: {
                    id: data.userId,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    roles: data.roles ?? [],
                },
            })
        },

        onError: (err: any) => {
            setError(err.response.data.error);
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        mutation.mutate()
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle>Entre na sua conta</CardTitle>
                    <CardDescription>
                        Introduza o seu email abaixo para entrar na sua conta
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={email}
                                    placeholder="m@exemplo.com"
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </Field>
                            <Field>
                                <div className="flex items-center">
                                    <FieldLabel htmlFor="password">Password</FieldLabel>
                                </div>
                                <Input
                                    name="password"
                                    id="password"
                                    type="password"
                                    onChange={(e) => setPassword(e.target.value)}
                                    required/>
                            </Field>
                            {error && <p className="text-destructive">{error}.</p>}
                            <Field>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending ? "Logging in..." : "Login"}
                                </Button>
                                <FieldDescription className="text-center">
                                    Não tem conta? <Link to="/register">Criar conta</Link>
                                </FieldDescription>
                            </Field>
                        </FieldGroup>

                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
