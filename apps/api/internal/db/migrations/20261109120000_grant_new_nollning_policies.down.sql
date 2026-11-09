-- Also removes grants of these policies made by hand since; they don't
-- exist before this rewrite.
DELETE FROM api_access_policies
WHERE api_name IN ('nollning:season:manage', 'nollning:content:associate');
