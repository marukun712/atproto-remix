import { NodeOAuthClient } from "@atproto/oauth-client-node";
import { StateStore, SessionStore } from "~/utils/auth/store";
import { createDb, migrateToLatest } from "../db";

const createClient = async () => {
  const db = createDb(":memory:");
  await migrateToLatest(db);

  const publicUrl = "";
  const url = publicUrl || `http://127.0.0.1:5173`;
  const enc = encodeURIComponent;
  return new NodeOAuthClient({
    clientMetadata: {
      client_name: "AT Protocol Remix App",
      client_id: publicUrl
        ? `${url}/client-metadata.json`
        : `http://localhost?redirect_uri=${enc(
            `${url}/oauth/callback`
          )}&scope=${enc("atproto transition:generic")}`,
      client_uri: url,
      redirect_uris: [`${url}/oauth/callback`],
      scope: "atproto transition:generic",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      application_type: "web",
      token_endpoint_auth_method: "none",
      dpop_bound_access_tokens: true,
    },
    stateStore: new StateStore(db),
    sessionStore: new SessionStore(db),
  });
};

export const client = await createClient();