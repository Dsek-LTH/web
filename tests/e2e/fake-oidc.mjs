// A minimal OIDC provider standing in for Authentik in integration tests, so
// that they run the real login, token refresh and logout flows. It also stands
// in for the ticket service, to check which token the app forwards to it.
//
// Tests control it through the /__test endpoints, see helpers.ts.
import { createHash, generateKeyPairSync, randomUUID, sign } from "node:crypto";
import { createServer } from "node:http";

const PORT = Number(process.env["FAKE_OIDC_PORT"] ?? 4455);
const CLIENT_ID = "e2e-client";
const CLIENT_SECRET = "e2e-secret";
const BASE_URL = `http://localhost:${PORT}`;
const ISSUER = `${BASE_URL}/application/o/test/`;

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const KID = "e2e-key";

const base64url = (input) => Buffer.from(input).toString("base64url");

const signJwt = (claims) => {
  const header = base64url(
    JSON.stringify({ alg: "RS256", typ: "JWT", kid: KID }),
  );
  const payload = base64url(JSON.stringify(claims));
  const signature = sign(
    "RSA-SHA256",
    Buffer.from(`${header}.${payload}`),
    privateKey,
  ).toString("base64url");
  return `${header}.${payload}.${signature}`;
};

const initialState = () => ({
  user: null,
  tokenLifetimeSeconds: 3600,
  failRefresh: false,
  codes: new Map(),
  refreshTokens: new Map(),
  events: [],
});
let state = initialState();

const log = (type, details = {}) => state.events.push({ type, ...details });

const claimsFor = ({ studentId, groups }) => ({
  sub: studentId,
  preferred_username: studentId,
  email: `${studentId}@student.example`,
  given_name: "E2E",
  family_name: "User",
  groups,
});

const issueTokens = (user, nonce) => {
  const now = Math.floor(Date.now() / 1000);
  const standard = {
    iss: ISSUER,
    aud: CLIENT_ID,
    iat: now,
    exp: now + state.tokenLifetimeSeconds,
    ...claimsFor(user),
  };
  const refreshToken = randomUUID();
  state.refreshTokens.set(refreshToken, user.studentId);
  const idToken = signJwt({
    ...standard,
    jti: randomUUID(),
    ...(nonce ? { nonce } : {}),
  });
  log("tokens-issued", { idToken });
  return {
    access_token: signJwt({ ...standard, jti: randomUUID() }),
    id_token: idToken,
    refresh_token: refreshToken,
    token_type: "Bearer",
    scope: "openid profile email offline_access",
    expires_in: state.tokenLifetimeSeconds,
  };
};

const readBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString();
};

const isClientAuthenticated = (req, form) => {
  const header = req.headers.authorization;
  if (header?.startsWith("Basic ")) {
    const [id, secret] = Buffer.from(header.slice(6), "base64")
      .toString()
      .split(":")
      .map(decodeURIComponent);
    return id === CLIENT_ID && secret === CLIENT_SECRET;
  }
  return (
    form.get("client_id") === CLIENT_ID &&
    form.get("client_secret") === CLIENT_SECRET
  );
};

const handleToken = (req, form) => {
  if (!isClientAuthenticated(req, form)) {
    return [401, { error: "invalid_client" }];
  }
  const grantType = form.get("grant_type");

  if (grantType === "authorization_code") {
    const code = state.codes.get(form.get("code"));
    state.codes.delete(form.get("code"));
    if (!code) return [400, { error: "invalid_grant" }];
    if (code.challenge) {
      const verifier = form.get("code_verifier") ?? "";
      const expected = createHash("sha256")
        .update(verifier)
        .digest("base64url");
      if (expected !== code.challenge) {
        return [400, { error: "invalid_grant", detail: "PKCE mismatch" }];
      }
    }
    return [200, issueTokens(state.user, code.nonce)];
  }

  if (grantType === "refresh_token") {
    log("refresh");
    const studentId = state.refreshTokens.get(form.get("refresh_token"));
    if (state.failRefresh || !studentId) {
      return [400, { error: "invalid_grant" }];
    }
    return [200, issueTokens(state.user)];
  }

  return [400, { error: "unsupported_grant_type" }];
};

const handleTicketService = (req, url) => {
  log("ticket-service", {
    path: url.pathname,
    authorization: req.headers.authorization,
  });
  if (url.pathname.endsWith("/status")) return [404, { error: "not found" }];
  const now = Date.now();
  return [
    200,
    {
      id: "e2e-release",
      eventId: "e2e-event",
      title: "E2E release",
      description: "",
      location: "",
      quantity: 1,
      opensAt: new Date(now - 1000).toISOString(),
      closesAt: new Date(now + 3_600_000).toISOString(),
    },
  ];
};

const sendJson = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
};

createServer(async (req, res) => {
  const url = new URL(req.url, BASE_URL);
  const { pathname } = url;

  if (pathname === "/__test/reset") {
    const options = JSON.parse((await readBody(req)) || "{}");
    state = { ...initialState(), ...options };
    return sendJson(res, 200, {});
  }
  if (pathname === "/__test/update") {
    Object.assign(state, JSON.parse(await readBody(req)));
    return sendJson(res, 200, {});
  }
  if (pathname === "/__test/events") {
    return sendJson(res, 200, state.events);
  }

  if (pathname === "/application/o/test/.well-known/openid-configuration") {
    return sendJson(res, 200, {
      issuer: ISSUER,
      authorization_endpoint: `${BASE_URL}/application/o/authorize/`,
      token_endpoint: `${BASE_URL}/application/o/token/`,
      userinfo_endpoint: `${BASE_URL}/application/o/userinfo/`,
      jwks_uri: `${BASE_URL}/application/o/test/jwks/`,
      end_session_endpoint: `${ISSUER}end-session/`,
      response_types_supported: ["code"],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["RS256"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: [
        "client_secret_basic",
        "client_secret_post",
      ],
    });
  }
  if (pathname === "/application/o/test/jwks/") {
    const jwk = publicKey.export({ format: "jwk" });
    return sendJson(res, 200, {
      keys: [{ ...jwk, kid: KID, use: "sig", alg: "RS256" }],
    });
  }
  if (pathname === "/application/o/authorize/") {
    if (!state.user) return sendJson(res, 400, { error: "no user configured" });
    if (url.searchParams.get("client_id") !== CLIENT_ID) {
      return sendJson(res, 400, { error: "invalid_client" });
    }
    const code = randomUUID();
    state.codes.set(code, {
      challenge: url.searchParams.get("code_challenge"),
      nonce: url.searchParams.get("nonce"),
    });
    log("authorize");
    const redirect = new URL(url.searchParams.get("redirect_uri"));
    redirect.searchParams.set("code", code);
    const clientState = url.searchParams.get("state");
    if (clientState) redirect.searchParams.set("state", clientState);
    res.writeHead(302, { location: redirect.href });
    return res.end();
  }
  if (pathname === "/application/o/token/") {
    const [status, body] = handleToken(
      req,
      new URLSearchParams(await readBody(req)),
    );
    return sendJson(res, status, body);
  }
  if (pathname === "/application/o/userinfo/") {
    return sendJson(res, 200, claimsFor(state.user));
  }
  if (pathname === "/application/o/test/end-session/") {
    log("end-session");
    res.writeHead(200, { "content-type": "text/html" });
    return res.end("<h1>Logged out of the identity provider</h1>");
  }
  if (pathname.startsWith("/tickets/")) {
    const [status, body] = handleTicketService(req, url);
    return sendJson(res, status, body);
  }

  sendJson(res, 404, { error: `unknown path ${pathname}` });
}).listen(PORT);
