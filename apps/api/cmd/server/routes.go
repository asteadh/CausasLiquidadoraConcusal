package main

import "net/http"

// routes wires every HTTP endpoint this API exposes. Unauthenticated
// endpoints are health checks and the session probe (the admin app calls
// /api/auth/session to decide whether to redirect to /login); everything
// else requires a valid Better Auth session.
func (s *server) routes() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", s.handleHealth)
	mux.HandleFunc("GET /health/ready", s.handleHealthReady)

	mux.HandleFunc("GET /api/auth/session", s.handleSession)

	mux.HandleFunc("GET /api/causas", s.requireAuth(s.handleListCausas))
	mux.HandleFunc("GET /api/causas/{id}", s.requireAuth(s.handleGetCausa))

	mux.HandleFunc("GET /api/causas/{id}/assignment", s.requireAuth(s.handleGetAssignment))
	mux.HandleFunc("PUT /api/causas/{id}/assignment", s.requireAuth(s.handlePutAssignment))
	mux.HandleFunc("DELETE /api/causas/{id}/assignment", s.requireAuth(s.handleDeleteAssignment))

	mux.HandleFunc("GET /api/causas/{id}/notes", s.requireAuth(s.handleListNotes))
	mux.HandleFunc("POST /api/causas/{id}/notes", s.requireAuth(s.handleCreateNote))
	mux.HandleFunc("DELETE /api/notes/{id}", s.requireAuth(s.handleDeleteNote))

	mux.HandleFunc("GET /api/clients", s.requireAuth(s.handleListClients))
	mux.HandleFunc("POST /api/clients", s.requireAuth(s.handleCreateClient))
	mux.HandleFunc("GET /api/clients/{id}", s.requireAuth(s.handleGetClient))
	mux.HandleFunc("PUT /api/clients/{id}", s.requireAuth(s.handleUpdateClient))
	mux.HandleFunc("DELETE /api/clients/{id}", s.requireAuth(s.handleDeleteClient))

	return mux
}
