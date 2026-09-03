/**
 * An error whose message is written for the caller.
 *
 * The global handler cannot tell "Cannot reschedule a cancelled appointment" from a Firestore
 * failure carrying the project id and document path, so it used to return every message
 * verbatim with a 500 — leaking internals on one hand and giving domain failures the wrong
 * status on the other. Throwing this marks a message as safe to show and carries the status
 * that belongs with it; anything else stays generic.
 */
export class AppError extends Error {
    readonly status: number;

    constructor(message: string, status: number = 422) {
        super(message);
        this.name = "AppError";
        this.status = status;
    }
}

export const notFound = (message: string) => new AppError(message, 404);
export const conflict = (message: string) => new AppError(message, 409);
