package main

import "net/http"

// handleSession reports the caller's current Better Auth session. Actual
// sign-in/sign-up is handled entirely by Better Auth inside apps/admin; this
// API only ever validates sessions that already exist.
func (s *server) handleSession(w http.ResponseWriter, r *http.Request) {
	session, err := s.resolveSession(r)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to resolve session")
		return
	}
	if session == nil {
		writeJSON(w, http.StatusOK, map[string]any{"session": nil, "user": nil})
		return
	}
	writeJSON(w, http.StatusOK, session)
}
