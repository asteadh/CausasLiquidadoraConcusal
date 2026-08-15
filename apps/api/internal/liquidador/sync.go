package liquidador

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// SyncAll fetches every causa visible to the given client and upserts them
// into the local "LiquidadorCausaMirror" table, keyed by externalId.
func SyncAll(ctx context.Context, pool *pgxpool.Pool, client *Client) (int, error) {
	causas, err := client.FetchAll(ctx)
	if err != nil {
		return 0, err
	}

	synced := 0
	for _, causa := range causas {
		if err := upsertCausa(ctx, pool, causa); err != nil {
			return synced, fmt.Errorf("upsert causa externalId=%s: %w", causa.ExternalID, err)
		}
		synced++
	}
	return synced, nil
}

func upsertCausa(ctx context.Context, pool *pgxpool.Pool, causa Causa) error {
	var raw any
	if len(causa.Raw) > 0 {
		raw = string(causa.Raw)
	}

	_, err := pool.Exec(ctx, `
		INSERT INTO "LiquidadorCausaMirror"
			("id","externalId","documentId","rol","nombre","estado","deudorRut","tribunal",
			 "liquidador","tipoProcedimiento","ultimaGestion","fechaUltimaGestion","cantidadGestiones",
			 "fecha","raw","lastSyncedAt","createdAt","updatedAt")
		VALUES
			($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,NOW(),NOW(),NOW())
		ON CONFLICT ("externalId") DO UPDATE SET
			"documentId"=$3,"rol"=$4,"nombre"=$5,"estado"=$6,"deudorRut"=$7,"tribunal"=$8,
			"liquidador"=$9,"tipoProcedimiento"=$10,"ultimaGestion"=$11,"fechaUltimaGestion"=$12,
			"cantidadGestiones"=$13,"fecha"=$14,"raw"=$15::jsonb,"lastSyncedAt"=NOW(),"updatedAt"=NOW()
		`,
		newID(), causa.ExternalID, causa.DocumentID, causa.Rol, causa.Nombre, causa.Estado,
		causa.DeudorRut, causa.Tribunal, causa.Liquidador, causa.TipoProcedimiento,
		causa.UltimaGestion, nullableTime(causa.FechaUltimaGestion), causa.CantidadGestiones,
		nullableTime(causa.Fecha), raw,
	)
	return err
}

func nullableTime(t *time.Time) any {
	if t == nil {
		return nil
	}
	return *t
}

// newID generates a random hex identifier for rows inserted via raw SQL
// (bypassing Prisma's client-side @default(cuid()), which only applies when
// rows are created through the Prisma client itself).
func newID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return fmt.Sprintf("lcm_%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(b)
}
