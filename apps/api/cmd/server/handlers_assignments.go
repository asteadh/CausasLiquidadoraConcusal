package main

import (
	"errors"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
)

type assignmentDTO struct {
	ID            string    `json:"id"`
	CausaID       string    `json:"causaId"`
	ClientID      *string   `json:"clientId"`
	ResponsibleID *string   `json:"responsibleId"`
	LocalStatus   *string   `json:"localStatus"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

type assignmentInput struct {
	ClientID      *string `json:"clientId"`
	ResponsibleID *string `json:"responsibleId"`
	LocalStatus   *string `json:"localStatus"`
}

const assignmentSelectColumns = `"id","causaId","clientId","responsibleId","localStatus","createdAt","updatedAt"`

func scanAssignment(row interface{ Scan(dest ...any) error }) (*assignmentDTO, error) {
	var a assignmentDTO
	if err := row.Scan(&a.ID, &a.CausaID, &a.ClientID, &a.ResponsibleID, &a.LocalStatus, &a.CreatedAt, &a.UpdatedAt); err != nil {
		return nil, err
	}
	return &a, nil
}

// handleGetAssignment serves GET /api/causas/{id}/assignment
func (s *server) handleGetAssignment(w http.ResponseWriter, r *http.Request) {
	causaID := r.PathValue("id")
	row := s.db.QueryRow(r.Context(),
		`SELECT `+assignmentSelectColumns+` FROM "CaseAssignment" WHERE "causaId" = $1`, causaID)
	assignment, err := scanAssignment(row)
	if errors.Is(err, pgx.ErrNoRows) {
		writeJSON(w, http.StatusOK, nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to read assignment")
		return
	}
	writeJSON(w, http.StatusOK, assignment)
}

// handlePutAssignment serves PUT /api/causas/{id}/assignment (upsert).
// When responsibleId is omitted, the assignment defaults to the caller.
func (s *server) handlePutAssignment(w http.ResponseWriter, r *http.Request) {
	causaID := r.PathValue("id")
	ctx := r.Context()

	var input assignmentInput
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if input.ResponsibleID == nil {
		session := sessionFromContext(ctx)
		adminUserID, err := s.resolveAdminUserID(ctx, session)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to resolve current admin user")
			return
		}
		input.ResponsibleID = &adminUserID
	}

	query := `
		INSERT INTO "CaseAssignment" ("id","causaId","clientId","responsibleId","localStatus","createdAt","updatedAt")
		VALUES ($1,$2,$3,$4,$5,NOW(),NOW())
		ON CONFLICT ("causaId") DO UPDATE SET
			"clientId"=$3,"responsibleId"=$4,"localStatus"=$5,"updatedAt"=NOW()
		RETURNING ` + assignmentSelectColumns

	row := s.db.QueryRow(ctx, query, newID(), causaID, input.ClientID, input.ResponsibleID, input.LocalStatus)
	assignment, err := scanAssignment(row)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to save assignment")
		return
	}
	writeJSON(w, http.StatusOK, assignment)
}

// handleDeleteAssignment serves DELETE /api/causas/{id}/assignment
func (s *server) handleDeleteAssignment(w http.ResponseWriter, r *http.Request) {
	causaID := r.PathValue("id")
	tag, err := s.db.Exec(r.Context(), `DELETE FROM "CaseAssignment" WHERE "causaId" = $1`, causaID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete assignment")
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "assignment not found")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
