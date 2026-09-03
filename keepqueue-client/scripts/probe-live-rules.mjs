/**
 * Read-only. Probes the CURRENTLY DEPLOYED Firestore rules through the public web SDK, as an
 * unauthenticated visitor would. Prints only outcomes, never document contents.
 *
 *   cd keepqueue-client && node scripts/probe-live-rules.mjs
 */
import { config as loadEnv } from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";

loadEnv({ path: "../.env", quiet: true });

const app = initializeApp({
    apiKey: process.env.NEXT_PUBLIC_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_APP_ID,
});
const db = getFirestore(app);

const probe = async (label, run) => {
    try {
        const n = await run();
        console.log(`ALLOWED  ${label.padEnd(42)} (${n} docs)`);
    } catch (error) {
        const code = error?.code ?? error?.message ?? "unknown";
        console.log(`DENIED   ${label.padEnd(42)} ${code}`);
    }
};

console.log(`project: ${process.env.NEXT_PUBLIC_PROJECT_ID}\nsigned in: no (anonymous visitor)\n`);

await probe("list users            (must be DENIED)", async () => (await getDocs(collection(db, "users"))).size);
await probe("list calendar         (must be DENIED)", async () => (await getDocs(collection(db, "calendar"))).size);
await probe("list waitlist         (must be DENIED)", async () => (await getDocs(collection(db, "waitlist"))).size);
await probe("list staff            (must be DENIED)", async () => (await getDocs(collection(db, "staff"))).size);
await probe("list businesses       (public by design)", async () => (await getDocs(collection(db, "businesses"))).size);
await probe("list services         (public by design)", async () => (await getDocs(collection(db, "services"))).size);
await probe("get  businesses/Gamma (public by design)", async () => ((await getDoc(doc(db, "businesses", "GPajiLlPDRwWaJwNvWoz"))).exists() ? 1 : 0));

process.exit(0);
