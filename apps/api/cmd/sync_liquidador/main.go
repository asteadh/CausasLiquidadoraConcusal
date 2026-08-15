package main

// Standalone one-shot sync command. Fetches every causa visible to the
// configured nexulex Developer API Key and mirrors it into the local
// "LiquidadorCausaMirror" table. Modeled on nexulex's own
// apps/api/cmd/liquidador_backfill/main.go bootstrap pattern (env loading,
// pgx pool connect, log.Fatalf on hard errors), trimmed down since this
// project has no per-organization credentials to manage — a single
// developer API key covers the whole account.
//
// Intended to run on a schedule (e.g. a k8s CronJob) or manually:
//
//	go run ./cmd/sync_liquidador

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/asteadh/CausasLiquidadoraConcusal/apps/api/internal/liquidador"
)

func main() {
	ctx := context.Background()

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatalf("DATABASE_URL is required")
	}

	baseURL := os.Getenv("NEXULEX_API_BASE_URL")
	if baseURL == "" {
		baseURL = "https://api.nexulex.com"
	}

	apiKey := os.Getenv("NEXULEX_DEVELOPER_API_KEY")
	if apiKey == "" {
		log.Fatalf("NEXULEX_DEVELOPER_API_KEY is required")
	}

	pool, err := connectDatabase(ctx, dsn)
	if err != nil {
		log.Fatalf("connect database failed: %v", err)
	}
	defer pool.Close()

	client := liquidador.NewClient(baseURL, apiKey)

	started := time.Now()
	synced, err := liquidador.SyncAll(ctx, pool, client)
	if err != nil {
		log.Fatalf("sync failed after syncing %d causas: %v", synced, err)
	}

	log.Printf("sync_liquidador finished synced=%d elapsed=%s", synced, time.Since(started))
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
