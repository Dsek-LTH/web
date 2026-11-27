-- Seed the DELTA project group logo
INSERT INTO "role_logos" ("path", "logoUrl")
VALUES ('dsek.delta', '/delta.svg')
ON CONFLICT ("path") DO NOTHING;
