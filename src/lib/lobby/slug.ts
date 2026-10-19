/**
 * The slug the lobby's own school record goes by.
 *
 * It lives alone in a file with no imports because the places that need to
 * ask "is this the lobby?" are spread across the app — a server action, the
 * shout-out page, the screen builder — and pulling in `screen-data` for a
 * string would drag Prisma and the whole school-screen builder behind it.
 */
export const LOBBY_SLUG = "joc-lobby";

/**
 * The lobby is JOC's own wall, in JOC's own building, and the people in
 * front of it are visitors rather than students: a parent waiting, a
 * volunteer, somebody collecting a bed. None of them has a school login and
 * none of them is going to make one to say thank you.
 *
 * So the lobby asks for no account, where a school's screen asks for a
 * school address. Every post still lands PENDING and a person approves it
 * before it reaches the wall — that is what stands between the wall and the
 * street, here as everywhere else. This only moves who may knock.
 */
export const isLobby = (slug: string) => slug === LOBBY_SLUG;
