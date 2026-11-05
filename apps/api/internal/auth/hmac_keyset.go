package auth

import (
	"context"

	josejwt "github.com/go-jose/go-jose/v4"
)

// hmacKeySet verifies HS256-signed ID tokens using the client secret as the
// HMAC key - the OIDC spec's mechanism for confidential clients whose
// provider signs symmetrically (prod's Authentik provider, which has a real
// client secret) rather than asymmetrically/JWKS-verifiable (dev's, a
// public PKCE client Authentik signs with RS256). go-oidc's built-in
// RemoteKeySet only ever does JWKS lookups and explicitly excludes HS256
// from the algorithms it will even consider (see its supportedAlgorithms
// list), so there's no library-provided way to verify this - hence this
// small custom oidc.KeySet, the documented extension point for exactly
// this ("an in-memory set of keys delivered out-of-band").
type hmacKeySet struct {
	secret []byte
}

func (k hmacKeySet) VerifySignature(_ context.Context, jwt string) ([]byte, error) {
	jws, err := josejwt.ParseSigned(jwt, []josejwt.SignatureAlgorithm{josejwt.HS256})
	if err != nil {
		return nil, err
	}
	return jws.Verify(k.secret)
}
