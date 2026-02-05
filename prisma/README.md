# Database Setup

This project uses Prisma with SQLite to store shareable links temporarily.

## Schema

The database has one table: `ShareableLink`

- `id`: Unique identifier (cuid)
- `code`: Short unique code for the share URL (10 characters)
- `data`: JSON string containing the shareable code data
- `createdAt`: When the link was created
- `expiresAt`: When the link expires (15 minutes after creation)

## Automatic Cleanup

Expired links are automatically deleted when:

1. Someone tries to access an expired link
2. The cleanup cron job runs (via `/api/share/cleanup`)

## Development

To reset the database:

```bash
npx prisma migrate reset
```

To view the database:

```bash
npx prisma studio
```

## Expiration

All shareable links expire **15 minutes** after creation. This is set in the API route when creating new links.
