package main

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"database/sql"
	"encoding/base64"
	"errors"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

// This file mirrors the session-resolution pattern used by nexulex's own
// apps/api/cmd/server/auth.go: validate the Better Auth session by querying
// Postgres directly with pgx (no Node/Prisma dependency at request time),
// accepting either a bearer token or Better Auth's signed session cookie.

type contextKey string

const sessionContextKey contextKey = "session"

type sessionUser struct {
	ID            string    `json:"id"`
	Name          string    `json:"name"`
	Email         string    `json:"email"`
	EmailVerified bool      `json:"emailVerified"`
	Image         *string   `json:"image"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

type sessionInfo struct {
	ID        string    `json:"id"`
	UserID    string    `json:"userId"`
	ExpiresAt time.Time `json:"expiresAt"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type sessionResponse struct {
	Session sessionInfo `json:"session"`
	User    sessionUser `json:"user"`
}

// resolveSession looks up the caller's Better Auth session, either from an
// `Authorization: Bearer <token>` header or from the signed
// better-auth.session_token cookie. Returns (nil, nil) when no valid session
// is present (not an error condition — callers decide whether auth is
// required).
func (s *server) resolveSession(r *http.Request) (*sessionResponse, error) {
	if s.db == nil {
		return nil, errors.New("database unavailable")
	}

	token := bearerToken(r.Header.Get("Authorization"))
	if token == "" {
		cookieToken, ok := extractSignedSessionToken(r, s.authSecret)
		if !ok {
			return nil, nil
		}
		token = cookieToken
	}
	if token == "" {
		return nil, nil
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	const query = `
SELECT
  s."id", s."expiresAt", s."userId", s."createdAt", s."updatedAt",
  u."id", u."name", u."email", u."emailVerified", u."image", u."createdAt", u."updatedAt"
FROM "Session" s
INNER JOIN "User" u ON u."id" = s."userId"
WHERE s."token" = $1
LIMIT 1`

	var (
		result        sessionResponse
		userImage     sql.NullString
		sessionExpiry time.Time
	)

	err := s.db.QueryRow(ctx, query, token).Scan(
		&result.Session.ID,
		&sessionExpiry,
		&result.Session.UserID,
		&result.Session.CreatedAt,
		&result.Session.UpdatedAt,
		&result.User.ID,
		&result.User.Name,
		&result.User.Email,
		&result.User.EmailVerified,
		&userImage,
		&result.User.CreatedAt,
		&result.User.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	result.Session.ExpiresAt = sessionExpiry
	result.User.Image = nullableStringFromSQL(userImage)

	if sessionExpiry.Before(time.Now()) {
		if _, delErr := s.db.Exec(ctx, `DELETE FROM "Session" WHERE "token" = $1`, token); delErr != nil {
			log.Printf("failed to delete expired session: %v", delErr)
		}
		return nil, nil
	}

	return &result, nil
}

// requireAuth wraps a handler so it 401s when there is no valid session, and
// otherwise attaches the resolved session to the request context.
func (s *server) requireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		session, err := s.resolveSession(r)
		if err != nil {
			log.Printf("resolveSession failed: %v", err)
			writeError(w, http.StatusInternalServerError, "failed to resolve session")
			return
		}
		if session == nil {
			writeError(w, http.StatusUnauthorized, "authentication required")
			return
		}
		ctx := context.WithValue(r.Context(), sessionContextKey, session)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

func sessionFromContext(ctx context.Context) *sessionResponse {
	session, _ := ctx.Value(sessionContextKey).(*sessionResponse)
	return session
}

func extractSignedSessionToken(r *http.Request, secret string) (string, bool) {
	if secret == "" {
		return "", false
	}

	cookies := parseCookieHeader(r.Header.Get("Cookie"))
	cookieNames := []string{
		"better-auth.session_token",
		"__Secure-better-auth.session_token",
		"__Host-better-auth.session_token",
	}

	for _, cookieName := range cookieNames {
		rawValue, exists := cookies[cookieName]
		if !exists {
			continue
		}
		if token, ok := verifySignedCookieValue(rawValue, secret); ok {
			return token, true
		}
	}

	return "", false
}

// verifySignedCookieValue validates Better Auth's `${token}.${signature}`
// cookie format, where signature = base64(HMAC-SHA256(token, secret)).
func verifySignedCookieValue(rawValue, secret string) (string, bool) {
	decoded := strings.TrimSpace(rawValue)
	if value, err := url.QueryUnescape(decoded); err == nil {
		decoded = value
	}

	dotIndex := strings.LastIndex(decoded, ".")
	if dotIndex < 1 {
		return "", false
	}

	signedValue := decoded[:dotIndex]
	signature := decoded[dotIndex+1:]

	if len(signature) != 44 || !strings.HasSuffix(signature, "=") {
		return "", false
	}

	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(signedValue))
	expectedSignature := base64.StdEncoding.EncodeToString(h.Sum(nil))

	if subtle.ConstantTimeCompare([]byte(signature), []byte(expectedSignature)) != 1 {
		return "", false
	}

	return signedValue, true
}

func parseCookieHeader(header string) map[string]string {
	result := make(map[string]string)
	if strings.TrimSpace(header) == "" {
		return result
	}

	for _, part := range strings.Split(header, ";") {
		piece := strings.TrimSpace(part)
		if piece == "" {
			continue
		}
		keyValue := strings.SplitN(piece, "=", 2)
		if len(keyValue) != 2 {
			continue
		}
		result[keyValue[0]] = keyValue[1]
	}

	return result
}

func bearerToken(authorizationHeader string) string {
	header := strings.TrimSpace(authorizationHeader)
	if header == "" {
		return ""
	}

	const prefix = "Bearer "
	if !strings.HasPrefix(header, prefix) {
		return ""
	}

	return strings.TrimSpace(strings.TrimPrefix(header, prefix))
}

func nullableStringFromSQL(value sql.NullString) *string {
	if !value.Valid {
		return nil
	}
	cleaned := value.String
	return &cleaned
}
