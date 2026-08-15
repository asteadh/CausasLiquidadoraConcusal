// Package liquidador fetches "procedimiento" (bankruptcy liquidation case)
// records from the nexulex platform's developer API and mirrors them into
// this app's own Postgres database. It is shared by apps/api/cmd/server
// (which serves the mirrored data to the admin UI) and
// apps/api/cmd/sync_liquidador (the standalone one-shot sync binary) — Go
// does not allow importing one `package main` from another, so this logic
// cannot live directly inside cmd/server as originally sketched; see the
// package comment on cmd/sync_liquidador for details.
package liquidador

import (
	"encoding/json"
	"time"
)

// Causa mirrors a single record returned by nexulex's
// GET /api/developer-data/liquidaciones/causas endpoint. Field names follow
// the same shape as packages/db's LiquidadorCausaMirror Prisma model.
type Causa struct {
	ExternalID         string          `json:"id"`
	DocumentID         string          `json:"documentId"`
	Rol                *string         `json:"rol"`
	Nombre             *string         `json:"nombre"`
	Estado             *string         `json:"estado"`
	DeudorRut          *string         `json:"deudorRut"`
	Tribunal           *string         `json:"tribunal"`
	Liquidador         *string         `json:"liquidador"`
	TipoProcedimiento  *string         `json:"tipoProcedimiento"`
	UltimaGestion      *string         `json:"ultimaGestion"`
	FechaUltimaGestion *time.Time      `json:"fechaUltimaGestion"`
	CantidadGestiones  *int            `json:"cantidadGestiones"`
	Fecha              *time.Time      `json:"fecha"`
	Raw                json.RawMessage `json:"raw"`
}

// causasPageResponse is the paginated envelope returned by the nexulex
// developer-data endpoint.
type causasPageResponse struct {
	Data     []Causa `json:"data"`
	Page     int     `json:"page"`
	PageSize int     `json:"pageSize"`
	Total    int     `json:"total"`
	HasMore  bool    `json:"hasMore"`
}
