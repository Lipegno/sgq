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
import {Link, useNavigate} from "react-router-dom";
import {useState} from "react";
import {useAuth} from "@/context/auth-context.tsx";
import {useMutation} from "@tanstack/react-query";
import {login, register} from "@/api/auth.ts";

export function SignupForm({...props}: React.ComponentProps<typeof Card>) {
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate()

    const mutation = useMutation({
        mutationFn: () =>
            register({
                firstName,
                lastName,
                email,
                password,
                confirmPassword
            }),

        onSuccess: () => {
            navigate("/login", {replace: true})
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
        <Card {...props}>
            <CardHeader>
                <CardTitle>Criar uma conta</CardTitle>
                <CardDescription>
                    Introduza a informação abaixo para criar a sua conta
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit}>
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="firstName">Primeiro Nome</FieldLabel>
                            <Input id="firstName" name="firstName" type="text" placeholder="John"
                                   onChange={(e) => setFirstName(e.target.value)}
                                   required/>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="lastName">Último Nome</FieldLabel>
                            <Input id="lastName" name="lastName" type="text" placeholder="Doe"
                                   onChange={(e) => setLastName(e.target.value)}
                                   required/>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="email">Email</FieldLabel>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                placeholder="m@exemplo.com"
                                onChange={(e) => setEmail(e.target.value)}

                                required
                            />
                            <FieldDescription>
                                Não partilharemos o seu email com ninguém.
                            </FieldDescription>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="password">Password</FieldLabel>
                            <Input id="password" name="password" type="password"
                                   onChange={(e) => setPassword(e.target.value)}
                                   required/>
                            <FieldDescription>
                                Tem de ter 8 caracteres.
                            </FieldDescription>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="confirm-password">
                                Confirmar Password
                            </FieldLabel>
                            <Input id="confirm-password" name="confirmPassword" type="password"
                                   onChange={(e) => setConfirmPassword(e.target.value)}
                                   required/>
                            <FieldDescription>Por favor, confirme a sua password.</FieldDescription>
                        </Field>
                        {error && <p className="text-destructive">{error}.</p>}
                        <FieldGroup>
                            <Field>
                                <Button type="submit">Criar Conta</Button>
                                <FieldDescription className="px-6 text-center">
                                    Já tem uma conta? <Link to="/login">Login</Link>
                                </FieldDescription>
                            </Field>
                        </FieldGroup>
                    </FieldGroup>
                </form>
            </CardContent>
        </Card>
    )
}
