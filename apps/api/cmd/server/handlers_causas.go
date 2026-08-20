package main

import (
	"net/http"
	"strconv"
	"time"
)

type causaDTO struct {
	ID                 string     `json:"id"`
	ExternalID         string     `json:"externalId"`
	DocumentID         string     `json:"documentId"`
	Rol                *string    `json:"rol"`
	Nombre             *string    `json:"nombre"`
	Estado             *string    `json:"estado"`
	DeudorRut          *string    `json:"deudorRut"`
	Tribunal           *string    `json:"tribunal"`
	Liquidador         *string    `json:"liquidador"`
	TipoProcedimiento  *string    `json:"tipoProcedimiento"`
	UltimaGestion      *string    `json:"ultimaGestion"`
	FechaUltimaGestion *time.Time `json:"fechaUltimaGestion"`
	CantidadGestiones  *int       `json:"cantidadGestiones"`
	Fecha              *time.Time `json:"fecha"`
	LastSyncedAt       time.Time  `json:"lastSyncedAt"`
	CreatedAt          time.Time  `json:"createdAt"`
	UpdatedAt          time.Time  `json:"updatedAt"`
}

const causaSelectColumns = `
	"id","externalId","documentId","rol","nombre","estado","deudorRut","tribunal",
	"liquidador","tipoProcedimiento","ultimaGestion","fechaUltimaGestion","cantidadGestiones",
	"fecha","lastSyncedAt","createdAt","updatedAt"`

func scanCausa(row interface {
	Scan(dest ...any) error
}) (*causaDTO, error) {
	var c causaDTO
	err := row.Scan(
		&c.ID, &c.ExternalID, &c.DocumentID, &c.Rol, &c.Nombre, &c.Estado, &c.DeudorRut, &c.Tribunal,
		&c.Liquidador, &c.TipoProcedimiento, &c.UltimaGestion, &c.FechaUltimaGestion, &c.CantidadGestiones,
		&c.Fecha, &c.LastSyncedAt, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

// handleListCausas serves GET /api/causas?estado=&q=&page=&pageSize=
func (s *server) handleListCausas(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	page := parsePositiveInt(r.URL.Query().Get("page"), 1)
	pageSize := parsePositiveInt(r.URL.Query().Get("pageSize"), 50)
	if pageSize > 200 {
		pageSize = 200
	}
	offset := (page - 1) * pageSize

	estado := r.URL.Query().Get("estado")
	q := r.URL.Query().Get("q")

	query := `SELECT` + causaSelectColumns + ` FROM "LiquidadorCausaMirror" WHERE ($1 = '' OR "estado" = $1) AND (
		$2 = '' OR "rol" ILIKE '%' || $2 || '%' OR "nombre" ILIKE '%' || $2 || '%' OR "deudorRut" ILIKE '%' || $2 || '%'
	) ORDER BY "updatedAt" DESC, "externalId" ASC LIMIT $3 OFFSET $4`

	rows, err := s.db.Query(ctx, query, estado, q, pageSize, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list causas")
		return
	}
	defer rows.Close()

	causas := []causaDTO{}
	for rows.Next() {
		c, err := scanCausa(rows)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to read causas")
			return
		}
		causas = append(causas, *c)
	}
	if err := rows.Err(); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to read causas")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"data":     causas,
		"page":     page,
		"pageSize": pageSize,
	})
}

// handleGetCausa serves GET /api/causas/{id}
func (s *server) handleGetCausa(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "id is required")
		return
	}

	query := `SELECT` + causaSelectColumns + ` FROM "LiquidadorCausaMirror" WHERE "id" = $1`
	row := s.db.QueryRow(r.Context(), query, id)
	causa, err := scanCausa(row)
	if err != nil {
		writeError(w, http.StatusNotFound, "causa not found")
		return
	}

	writeJSON(w, http.StatusOK, causa)
}

func parsePositiveInt(raw string, fallback int) int {
	if raw == "" {
		return fallback
	}
	value, err := strconv.Atoi(raw)
	if err != nil || value < 1 {
		return fallback
	}
	return value
}
