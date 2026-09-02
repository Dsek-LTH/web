/*
  Warnings:

  - A unique constraint covering the columns `[member_id,type]` on the table `subscription_settings` will be added. If there are existing duplicate values, this will fail.

*/

-- Add PURCHASES notification setting to all members (who do not already have it)
INSERT INTO subscription_settings (member_id, TYPE, push_notification) (
	SELECT
		members.id,
		'PURCHASES',
		TRUE
	FROM
		members
	WHERE
		members.id NOT IN(
			SELECT
				member_id FROM subscription_settings
			WHERE
				TYPE = 'PURCHASES'));
  
-- Remove all duplicate settings
DELETE FROM subscription_settings AS T1
    USING   subscription_settings AS T2
WHERE   T1.id < T2.id 
    AND T1.member_id = T2.member_id 
    AND T1.type  = T2.type;
    
-- Create unique index on member and type 
CREATE UNIQUE INDEX "subscription_settings_member_id_type_key" ON "subscription_settings"("member_id", "type");
