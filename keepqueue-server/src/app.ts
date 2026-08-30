import mainRouter from "./main_router";
import { startServer } from "./helpers";
import { initSnapshot } from "./firebase";

const init = async () => {
    await initSnapshot();
    await startServer(mainRouter);
};

init().catch((e) => {
    process.exit(1);
});
