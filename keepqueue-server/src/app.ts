import mainRouter from "./main_router";
import { startServer } from "./helpers";
import { initSnapshot } from "./firebase";
import { logger } from "./managers";
import { startReminderSweep } from "./notifications/reminders";

const init = async () => {
    await initSnapshot();
    await startServer(mainRouter);
    // After the cache is warm and the port is bound: the sweep reads the cache, and a reminder
    // is not worth delaying the server for.
    startReminderSweep();
};

init().catch((error) => {
    logger.error("server failed to start", error);
    process.exit(1);
});
