// Mirrors the JSON shapes returned by apps/api's handlers (see
// apps/api/cmd/server/handlers_*.go DTOs). Kept as plain types rather than
// importing @workspace/db's Prisma types, since the admin app talks to the
// Go API over HTTP, not directly to Postgres.

export interface Causa {
  id: string;
  externalId: string;
  documentId: string;
  rol: string | null;
  nombre: string | null;
  estado: string | null;
  deudorRut: string | null;
  tribunal: string | null;
  liquidador: string | null;
  tipoProcedimiento: string | null;
  ultimaGestion: string | null;
  fechaUltimaGestion: string | null;
  cantidadGestiones: number | null;
  fecha: string | null;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  rut: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CaseAssignment {
  id: string;
  causaId: string;
  clientId: string | null;
  responsibleId: string | null;
  localStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  causaId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface Paginated<T> {
  data: T[];
  page?: number;
  pageSize?: number;
}
