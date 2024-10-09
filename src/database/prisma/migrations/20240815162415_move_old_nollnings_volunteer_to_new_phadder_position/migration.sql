-- In 2023 we renamed the position "Funktionär inom Nollningsutskottet" (or "Volunteer in the Introductions Committee") to "Phadder"
-- We then created a new position "Funktionär inom Nollningsutskottet" (or "Volunteer in the Introductions Committee") which corresponds to how it is in other committees
-- But on the website, we just created a new position without moving over old mandates, so that's what this migration does
UPDATE mandates
	SET position_id = 'dsek.noll.phadder'
WHERE position_id = 'dsek.noll.funk' AND start_date < '2023-01-01';