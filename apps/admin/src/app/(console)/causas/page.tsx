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
import type { Causa, Paginated } from "@/lib/types";
import Link from "next/link";

export default async function CausasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; page?: string }>;
}) {
  const { q = "", estado = "", page = "1" } = await searchParams;

  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (estado) query.set("estado", estado);
  if (page) query.set("page", page);

  const result = await apiClient.get<Paginated<Causa>>(`/api/causas?${query.toString()}`);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Causas</h1>
      </div>

      <form className="flex gap-3" action="/causas" method="get">
        <Input name="q" placeholder="Buscar por rol, nombre o RUT" defaultValue={q} className="max-w-sm" />
        <Input name="estado" placeholder="Estado" defaultValue={estado} className="max-w-[200px]" />
      </form>

      <div className="border-border rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rol</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Tribunal</TableHead>
              <TableHead>RUT deudor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground text-center">
                  No hay causas.
                </TableCell>
              </TableRow>
            ) : (
              result.data.map((causa) => (
                <TableRow key={causa.id}>
                  <TableCell>
                    <Link href={`/causas/${causa.id}`} className="text-primary hover:underline">
                      {causa.rol ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell>{causa.nombre ?? "—"}</TableCell>
                  <TableCell>{causa.estado ?? "—"}</TableCell>
                  <TableCell>{causa.tribunal ?? "—"}</TableCell>
                  <TableCell>{causa.deudorRut ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
