import mainRouter from "./main_router";
import { startServer } from "./helpers";
import { initSnapshot } from "./firebase";
import { logger } from "./managers";

const init = async () => {
    await initSnapshot();
    await startServer(mainRouter);
};

init().catch((error) => {
    logger.error("server failed to start", error);
    process.exit(1);
});
