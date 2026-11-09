-- Grant the policies this rewrite added, so they work in production without
-- someone granting them by hand at cutover:
-- - nollning:season:manage replaces editing the nollning window in the
--   admin settings, so whoever could update admin settings gets it.
-- - nollning:content:associate is for those who run nollning, i.e. whoever
--   can manage phadder groups.
-- Both role and student grants are copied. Rows that already exist are left
-- alone, so running this against a database that has them is a no-op.
INSERT INTO api_access_policies (api_name, role, student_id)
SELECT DISTINCT grant_name, src.role, src.student_id
FROM api_access_policies src
JOIN (VALUES
    ('admin:settings:update', 'nollning:season:manage'),
    ('nollning:phaddrar:groups:manage', 'nollning:content:associate')
) AS g (from_name, grant_name) ON g.from_name = src.api_name
WHERE NOT EXISTS (
    SELECT 1 FROM api_access_policies dst
    WHERE dst.api_name = g.grant_name
      AND dst.role IS NOT DISTINCT FROM src.role
      AND dst.student_id IS NOT DISTINCT FROM src.student_id
);
