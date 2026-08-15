import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiClient } from "@/lib/api-client";
import type { Client, Paginated } from "@/lib/types";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export default async function ClientesPage() {
  const clients = await apiClient.get<Paginated<Client>>("/api/clients");

  async function createClient(formData: FormData) {
    "use server";
    const name = (formData.get("name") as string) ?? "";
    if (!name.trim()) return;
    const rut = (formData.get("rut") as string) || null;
    const email = (formData.get("email") as string) || null;
    const phone = (formData.get("phone") as string) || null;
    await apiClient.post("/api/clients", { name, rut, email, phone });
    revalidatePath("/clientes");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Clientes</h1>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createClient} className="grid grid-cols-2 gap-4">
            <Input name="name" placeholder="Nombre" required />
            <Input name="rut" placeholder="RUT" />
            <Input name="email" placeholder="Correo" type="email" />
            <Input name="phone" placeholder="Teléfono" />
            <Button type="submit" className="col-span-2 self-start">
              Crear cliente
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="border-border rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>RUT</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Teléfono</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground text-center">
                  No hay clientes.
                </TableCell>
              </TableRow>
            ) : (
              clients.data.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Link href={`/clientes/${client.id}`} className="text-primary hover:underline">
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell>{client.rut ?? "—"}</TableCell>
                  <TableCell>{client.email ?? "—"}</TableCell>
                  <TableCell>{client.phone ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
