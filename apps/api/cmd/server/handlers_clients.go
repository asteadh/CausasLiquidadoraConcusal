package main

import (
	"errors"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
)

type clientDTO struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Rut       *string   `json:"rut"`
	Email     *string   `json:"email"`
	Phone     *string   `json:"phone"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type clientInput struct {
	Name  string  `json:"name"`
	Rut   *string `json:"rut"`
	Email *string `json:"email"`
	Phone *string `json:"phone"`
}

const clientSelectColumns = `"id","name","rut","email","phone","createdAt","updatedAt"`

func scanClient(row interface{ Scan(dest ...any) error }) (*clientDTO, error) {
	var c clientDTO
	if err := row.Scan(&c.ID, &c.Name, &c.Rut, &c.Email, &c.Phone, &c.CreatedAt, &c.UpdatedAt); err != nil {
		return nil, err
	}
	return &c, nil
}

// handleListClients serves GET /api/clients
func (s *server) handleListClients(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query(r.Context(), `SELECT `+clientSelectColumns+` FROM "Client" ORDER BY "name" ASC`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list clients")
		return
	}
	defer rows.Close()

	clients := []clientDTO{}
	for rows.Next() {
		c, err := scanClient(rows)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to read clients")
			return
		}
		clients = append(clients, *c)
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": clients})
}

// handleCreateClient serves POST /api/clients
func (s *server) handleCreateClient(w http.ResponseWriter, r *http.Request) {
	var input clientInput
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}

	query := `INSERT INTO "Client" ("id","name","rut","email","phone","createdAt","updatedAt")
		VALUES ($1,$2,$3,$4,$5,NOW(),NOW()) RETURNING ` + clientSelectColumns
	row := s.db.QueryRow(r.Context(), query, newID(), input.Name, input.Rut, input.Email, input.Phone)
	client, err := scanClient(row)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create client")
		return
	}
	writeJSON(w, http.StatusCreated, client)
}

// handleGetClient serves GET /api/clients/{id}
func (s *server) handleGetClient(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	row := s.db.QueryRow(r.Context(), `SELECT `+clientSelectColumns+` FROM "Client" WHERE "id" = $1`, id)
	client, err := scanClient(row)
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, "client not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to read client")
		return
	}
	writeJSON(w, http.StatusOK, client)
}

// handleUpdateClient serves PUT /api/clients/{id}
func (s *server) handleUpdateClient(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	var input clientInput
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}

	query := `UPDATE "Client" SET "name"=$1,"rut"=$2,"email"=$3,"phone"=$4,"updatedAt"=NOW()
		WHERE "id"=$5 RETURNING ` + clientSelectColumns
	row := s.db.QueryRow(r.Context(), query, input.Name, input.Rut, input.Email, input.Phone, id)
	client, err := scanClient(row)
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, "client not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update client")
		return
	}
	writeJSON(w, http.StatusOK, client)
}

// handleDeleteClient serves DELETE /api/clients/{id}
func (s *server) handleDeleteClient(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	tag, err := s.db.Exec(r.Context(), `DELETE FROM "Client" WHERE "id" = $1`, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete client")
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "client not found")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
