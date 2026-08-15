package main

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
)

// resolveAdminUserID maps the currently signed-in Better Auth account to a
// row in the business-layer "AdminUser" table (matched by email), creating
// one on first use. AdminUser is deliberately separate from Better Auth's
// User model (see packages/db/prisma/schema/business.prisma) — Note.author
// and CaseAssignment.responsible reference AdminUser, not User directly —
// but the task spec includes no AdminUser management endpoints or admin
// pages, so this auto-provisioning keeps notes/assignments attributable to
// "whoever is signed in" without a separate user-admin UI.
func (s *server) resolveAdminUserID(ctx context.Context, session *sessionResponse) (string, error) {
	if session == nil {
		return "", errors.New("no session")
	}

	var id string
	err := s.db.QueryRow(ctx, `SELECT "id" FROM "AdminUser" WHERE "email" = $1`, session.User.Email).Scan(&id)
	if err == nil {
		return id, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return "", err
	}

	_, err = s.db.Exec(ctx, `
		INSERT INTO "AdminUser" ("id","email","name","role","active","createdAt","updatedAt")
		VALUES ($1,$2,$3,'STAFF',true,NOW(),NOW())
		ON CONFLICT ("email") DO NOTHING`,
		newID(), session.User.Email, session.User.Name,
	)
	if err != nil {
		return "", err
	}

	if err := s.db.QueryRow(ctx, `SELECT "id" FROM "AdminUser" WHERE "email" = $1`, session.User.Email).Scan(&id); err != nil {
		return "", err
	}
	return id, nil
}
