import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import type { Client } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await apiClient.get<Client>(`/api/clients/${id}`);

  async function updateClient(formData: FormData) {
    "use server";
    const name = (formData.get("name") as string) ?? "";
    if (!name.trim()) return;
    const rut = (formData.get("rut") as string) || null;
    const email = (formData.get("email") as string) || null;
    const phone = (formData.get("phone") as string) || null;
    await apiClient.put(`/api/clients/${id}`, { name, rut, email, phone });
    revalidatePath(`/clientes/${id}`);
  }

  async function deleteClient() {
    "use server";
    await apiClient.delete(`/api/clients/${id}`);
    redirect("/clientes");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{client.name}</h1>

      <Card>
        <CardHeader>
          <CardTitle>Editar cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateClient} className="grid grid-cols-2 gap-4">
            <Input name="name" placeholder="Nombre" defaultValue={client.name} required />
            <Input name="rut" placeholder="RUT" defaultValue={client.rut ?? ""} />
            <Input name="email" placeholder="Correo" type="email" defaultValue={client.email ?? ""} />
            <Input name="phone" placeholder="Teléfono" defaultValue={client.phone ?? ""} />
            <Button type="submit" className="col-span-2 self-start">
              Guardar cambios
            </Button>
          </form>
        </CardContent>
      </Card>

      <form action={deleteClient}>
        <Button type="submit" variant="destructive">
          Eliminar cliente
        </Button>
      </form>
    </div>
  );
}
