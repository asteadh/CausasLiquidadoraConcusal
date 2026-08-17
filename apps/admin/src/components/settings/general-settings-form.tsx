"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { updateUser } from "@/lib/auth-client";
import type { Session } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(100),
});

type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;

export function GeneralSettingsForm({ user }: { user: Session["user"] }) {
  const router = useRouter();

  const form = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name,
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (values: UpdateProfileFormValues) => {
      const { error } = await updateUser({ name: values.name });
      if (error) {
        throw new Error(error.message || "No se pudo actualizar el perfil");
      }
    },
    onSuccess: () => {
      toast.success("Perfil actualizado correctamente");
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo actualizar el perfil");
    },
  });

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Configuración general</h1>
        <p className="text-muted-foreground text-sm">
          Gestiona la información básica de tu cuenta.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información de perfil
          </CardTitle>
          <CardDescription>Actualiza el nombre asociado a tu cuenta.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => updateProfileMutation.mutate(values))}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      Este es el nombre que se mostrará en tu perfil.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Correo</label>
                <Input value={user.email} disabled readOnly />
                <p className="text-muted-foreground text-sm">
                  El correo no se puede modificar desde este panel.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending || !form.formState.isDirty}
                className="w-full"
              >
                {updateProfileMutation.isPending && <Loader2 className="animate-spin" />}
                {updateProfileMutation.isPending ? "Actualizando..." : "Actualizar perfil"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </section>
  );
}
