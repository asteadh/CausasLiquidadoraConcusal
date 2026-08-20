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
	"fmt"
	"strings"
	"time"
)

// Causa mirrors a single record returned by nexulex's
// GET /api/developer-data/liquidaciones/causas endpoint. Field names follow
// the same shape as packages/db's LiquidadorCausaMirror Prisma model.
type Causa struct {
	ExternalID         string   `json:"id"`
	DocumentID         string   `json:"documentId"`
	Rol                *string  `json:"rol"`
	Nombre             *string  `json:"nombre"`
	Estado             *string  `json:"estado"`
	DeudorRut          *string  `json:"deudorRut"`
	Tribunal           *string  `json:"tribunal"`
	Liquidador         *string  `json:"liquidador"`
	TipoProcedimiento  *string  `json:"tipoProcedimiento"`
	UltimaGestion      *string  `json:"ultimaGestion"`
	FechaUltimaGestion *apiTime `json:"fechaUltimaGestion"`
	CantidadGestiones  *int     `json:"cantidadGestiones"`
	Fecha              *apiTime `json:"fecha"`
	// Raw is not part of the JSON payload — the endpoint returns no "raw"
	// field. FetchPage fills it with the untouched causa object so the
	// mirror's "raw" column keeps the attributes this struct drops
	// (veedorAsociado, rolSujeto, region, ...).
	Raw json.RawMessage `json:"-"`
}

// apiTime decodes the timestamps nexulex's developer API emits. They carry no
// timezone offset ("2026-08-19T00:00:00"), so they are not valid RFC 3339 and
// encoding/json's time.Time decoder rejects them outright — every causa with a
// fecha would fail the whole page. Offset-less values are read as UTC; the
// endpoint only ever stamps calendar days at midnight, so nothing is lost.
type apiTime struct {
	time.Time
}

var apiTimeLayouts = []string{
	time.RFC3339Nano,
	"2006-01-02T15:04:05.999999999",
	"2006-01-02",
}

func (t *apiTime) UnmarshalJSON(b []byte) error {
	s := strings.Trim(string(b), `"`)
	if s == "" || s == "null" {
		return nil
	}
	for _, layout := range apiTimeLayouts {
		parsed, err := time.Parse(layout, s)
		if err == nil {
			t.Time = parsed
			return nil
		}
	}
	return fmt.Errorf("unrecognized timestamp %q", s)
}

// causasPageResponse is the paginated envelope returned by the nexulex
// developer-data endpoint: {"causas":[...],"page":1,"pageCount":17,
// "perPage":100,"total":1678}. There is no "hasMore" flag — FetchPage derives
// it from Page vs PageCount.
type causasPageResponse struct {
	Causas    []Causa `json:"causas"`
	Page      int     `json:"page"`
	PageCount int     `json:"pageCount"`
	PerPage   int     `json:"perPage"`
	Total     int     `json:"total"`
}
