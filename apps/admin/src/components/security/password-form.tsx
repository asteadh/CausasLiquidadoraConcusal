"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useHasPassword } from "@/hooks/use-has-password";
import { changePassword } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Lock } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const passwordRules = z.string().min(8, "La contraseña debe tener al menos 8 caracteres");

const setPasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    password: passwordRules,
    confirmPassword: z.string(),
    revokeOtherSessions: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

const changePasswordSchema = setPasswordSchema.refine(
  (data) => !!data.currentPassword && data.currentPassword.length > 0,
  { message: "Ingresa tu contraseña actual", path: ["currentPassword"] },
);

type PasswordFormValues = z.infer<typeof setPasswordSchema>;

interface PasswordFormProps {
  onSuccess?: () => void;
}

export function PasswordForm({ onSuccess }: PasswordFormProps) {
  const queryClient = useQueryClient();
  const { hasPassword, isPending: isCheckingPassword } = useHasPassword();
  const isChangeMode = hasPassword === true;

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(isChangeMode ? changePasswordSchema : setPasswordSchema),
    defaultValues: {
      currentPassword: "",
      password: "",
      confirmPassword: "",
      revokeOtherSessions: false,
    },
  });

  useEffect(() => {
    form.reset();
  }, [isChangeMode, form]);

  const setPasswordMutation = useMutation({
    mutationFn: async (values: PasswordFormValues) => {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: values.password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "No se pudo establecer la contraseña");
      }
      return data;
    },
    onSuccess: handleSuccess("Contraseña establecida correctamente"),
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo establecer la contraseña");
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (values: PasswordFormValues) => {
      const { error } = await changePassword({
        currentPassword: values.currentPassword ?? "",
        newPassword: values.password,
        revokeOtherSessions: values.revokeOtherSessions ?? false,
      });
      if (error) {
        throw new Error(error.message || "No se pudo cambiar la contraseña");
      }
    },
    onSuccess: handleSuccess("Contraseña actualizada correctamente"),
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo cambiar la contraseña");
    },
  });

  function handleSuccess(message: string) {
    return () => {
      toast.success(message);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      onSuccess?.();
    };
  }

  function onSubmit(values: PasswordFormValues) {
    if (isChangeMode) {
      changePasswordMutation.mutate(values);
    } else {
      setPasswordMutation.mutate(values);
    }
  }

  const isSubmitting = setPasswordMutation.isPending || changePasswordMutation.isPending;

  return (
    <Card id="set-password" className="scroll-mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          {isChangeMode ? "Cambiar contraseña" : "Establecer contraseña"}
        </CardTitle>
        <CardDescription>
          {isChangeMode
            ? "Actualiza la contraseña de tu cuenta."
            : "Tu cuenta se creó con Google. Establece una contraseña para poder iniciar sesión también con tu correo."}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {isChangeMode && (
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña actual</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isChangeMode ? "Nueva contraseña" : "Contraseña"}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isChangeMode && (
              <FormField
                control={form.control}
                name="revokeOtherSessions"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Cerrar sesión en otros dispositivos</FormLabel>
                      <FormDescription>
                        Se cerrará la sesión en todos los demás dispositivos y navegadores. Esta
                        sesión permanecerá activa.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting || isCheckingPassword} className="w-full">
              {isSubmitting && <Loader2 className="animate-spin" />}
              {isSubmitting
                ? isChangeMode
                  ? "Cambiando contraseña..."
                  : "Estableciendo contraseña..."
                : isChangeMode
                  ? "Cambiar contraseña"
                  : "Establecer contraseña"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
