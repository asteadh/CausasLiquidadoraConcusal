package main

import (
	"net/http"
	"time"
)

type noteDTO struct {
	ID        string    `json:"id"`
	CausaID   string    `json:"causaId"`
	AuthorID  string    `json:"authorId"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"createdAt"`
}

type noteInput struct {
	Body string `json:"body"`
}

const noteSelectColumns = `"id","causaId","authorId","body","createdAt"`

func scanNote(row interface{ Scan(dest ...any) error }) (*noteDTO, error) {
	var n noteDTO
	if err := row.Scan(&n.ID, &n.CausaID, &n.AuthorID, &n.Body, &n.CreatedAt); err != nil {
		return nil, err
	}
	return &n, nil
}

// handleListNotes serves GET /api/causas/{id}/notes
func (s *server) handleListNotes(w http.ResponseWriter, r *http.Request) {
	causaID := r.PathValue("id")
	rows, err := s.db.Query(r.Context(),
		`SELECT `+noteSelectColumns+` FROM "Note" WHERE "causaId" = $1 ORDER BY "createdAt" DESC`, causaID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list notes")
		return
	}
	defer rows.Close()

	notes := []noteDTO{}
	for rows.Next() {
		n, err := scanNote(rows)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to read notes")
			return
		}
		notes = append(notes, *n)
	}
	if err := rows.Err(); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to read notes")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": notes})
}

// handleCreateNote serves POST /api/causas/{id}/notes. The author is always
// the currently signed-in admin user, resolved from the Better Auth session.
func (s *server) handleCreateNote(w http.ResponseWriter, r *http.Request) {
	causaID := r.PathValue("id")
	ctx := r.Context()

	var input noteInput
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Body == "" {
		writeError(w, http.StatusBadRequest, "body is required")
		return
	}

	session := sessionFromContext(ctx)
	authorID, err := s.resolveAdminUserID(ctx, session)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to resolve current admin user")
		return
	}

	query := `INSERT INTO "Note" ("id","causaId","authorId","body","createdAt")
		VALUES ($1,$2,$3,$4,NOW()) RETURNING ` + noteSelectColumns
	row := s.db.QueryRow(ctx, query, newID(), causaID, authorID, input.Body)
	note, err := scanNote(row)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create note")
		return
	}
	writeJSON(w, http.StatusCreated, note)
}

// handleDeleteNote serves DELETE /api/notes/{id}
func (s *server) handleDeleteNote(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	tag, err := s.db.Exec(r.Context(), `DELETE FROM "Note" WHERE "id" = $1`, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete note")
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "note not found")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
