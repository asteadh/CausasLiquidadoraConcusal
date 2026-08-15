package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	_ "go.uber.org/automaxprocs"
)

// server holds shared dependencies for all HTTP handlers.
type server struct {
	db            *pgxpool.Pool
	authSecret    string
	startedAt     time.Time
	allowedOrigin string
}

func main() {
	ctx := context.Background()

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatalf("DATABASE_URL is required")
	}

	pool, err := connectDatabase(ctx, dsn)
	if err != nil {
		log.Fatalf("database unavailable: %v", err)
	}
	defer pool.Close()

	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}

	s := &server{
		db:         pool,
		authSecret: os.Getenv("BETTER_AUTH_SECRET"),
		startedAt:  time.Now(),
		// The admin app is the only browser-facing caller of this API, and its
		// public URL doubles as the CORS origin we need to allow credentialed
		// (cookie-forwarding) requests from.
		allowedOrigin: os.Getenv("BETTER_AUTH_URL"),
	}

	handler := withRecover(withCORS(s.allowedOrigin, s.routes()))

	httpServer := &http.Server{
		Addr:              ":" + port,
		Handler:           handler,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	log.Printf("API listening on http://localhost:%s", port)
	if err := httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("server failed: %v", err)
	}
}

func connectDatabase(ctx context.Context, dsn string) (*pgxpool.Pool, error) {
	config, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, err
	}

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, err
	}

	pingCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()
	if err := pool.Ping(pingCtx); err != nil {
		pool.Close()
		return nil, err
	}

	return pool, nil
}
