package main

import (
	"context"
	"net/http"
	"time"
)

func (s *server) handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"status": "ok",
		"uptime": time.Since(s.startedAt).String(),
	})
}

func (s *server) handleHealthReady(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	if err := s.db.Ping(ctx); err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]any{
			"status": "unavailable",
			"error":  err.Error(),
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"status": "ready"})
}
