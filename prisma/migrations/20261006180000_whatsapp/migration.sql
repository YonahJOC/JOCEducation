-- A WhatsApp exchange with a school.
--
-- Its own value rather than folding it into CALL or EMAIL: it is how most of
-- these conversations actually happen, and a board that cannot tell a
-- WhatsApp from a phone call cannot tell anybody how a school prefers to be
-- reached.
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'WHATSAPP';
