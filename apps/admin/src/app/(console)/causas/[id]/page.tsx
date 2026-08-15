import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import type { CaseAssignment, Causa, Client, Note, Paginated } from "@/lib/types";
import { revalidatePath } from "next/cache";

export default async function CausaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [causa, assignment, clients, notes] = await Promise.all([
    apiClient.get<Causa>(`/api/causas/${id}`),
    apiClient.get<CaseAssignment | null>(`/api/causas/${id}/assignment`),
    apiClient.get<Paginated<Client>>("/api/clients"),
    apiClient.get<Paginated<Note>>(`/api/causas/${id}/notes`),
  ]);

  async function saveAssignment(formData: FormData) {
    "use server";
    const clientId = (formData.get("clientId") as string) || null;
    const localStatus = (formData.get("localStatus") as string) || null;
    await apiClient.put(`/api/causas/${id}/assignment`, { clientId, localStatus });
    revalidatePath(`/causas/${id}`);
  }

  async function addNote(formData: FormData) {
    "use server";
    const body = (formData.get("body") as string) ?? "";
    if (!body.trim()) return;
    await apiClient.post(`/api/causas/${id}/notes`, { body });
    revalidatePath(`/causas/${id}`);
  }

  async function deleteNote(formData: FormData) {
    "use server";
    const noteId = formData.get("noteId") as string;
    await apiClient.delete(`/api/notes/${noteId}`);
    revalidatePath(`/causas/${id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{causa.rol ?? causa.externalId}</h1>
        <p className="text-muted-foreground text-sm">{causa.nombre}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Estado</dt>
              <dd>{causa.estado ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tribunal</dt>
              <dd>{causa.tribunal ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">RUT deudor</dt>
              <dd>{causa.deudorRut ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Liquidador</dt>
              <dd>{causa.liquidador ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tipo de procedimiento</dt>
              <dd>{causa.tipoProcedimiento ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Última gestión</dt>
              <dd>{causa.ultimaGestion ?? "—"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Asignación</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveAssignment} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="clientId" className="text-sm font-medium">
                Cliente
              </label>
              <select
                id="clientId"
                name="clientId"
                defaultValue={assignment?.clientId ?? ""}
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              >
                <option value="">Sin cliente</option>
                {clients.data.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="localStatus" className="text-sm font-medium">
                Estado interno
              </label>
              <Input id="localStatus" name="localStatus" defaultValue={assignment?.localStatus ?? ""} />
            </div>
            <Button type="submit" className="self-start">
              Guardar asignación
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form action={addNote} className="flex flex-col gap-2">
            <textarea
              name="body"
              rows={3}
              placeholder="Agregar una nota..."
              className="border-input bg-background rounded-md border px-3 py-2 text-sm"
            />
            <Button type="submit" className="self-start">
              Agregar nota
            </Button>
          </form>

          <ul className="flex flex-col gap-3">
            {notes.data.length === 0 ? (
              <li className="text-muted-foreground text-sm">Sin notas todavía.</li>
            ) : (
              notes.data.map((note) => (
                <li key={note.id} className="border-border flex items-start justify-between gap-4 border-b pb-3">
                  <div>
                    <p className="text-sm">{note.body}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(note.createdAt).toLocaleString("es-CL")}
                    </p>
                  </div>
                  <form action={deleteNote}>
                    <input type="hidden" name="noteId" value={note.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Eliminar
                    </Button>
                  </form>
                </li>
              ))
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
