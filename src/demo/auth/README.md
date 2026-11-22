# Authentication & Authorization

## Demo #1 (auth)

How to start:

```sh
node -e 'const {generateKeyPairSync}=require("node:crypto");
const k=generateKeyPairSync("ec",{namedCurve:"P-256",
  privateKeyEncoding:{type:"pkcs8",format:"pem"},
  publicKeyEncoding:{type:"spki",format:"pem"}});
const fs=require("node:fs");
fs.writeFileSync("/tmp/priv.b64",Buffer.from(k.privateKey).toString("base64"));
fs.writeFileSync("/tmp/pub.b64",Buffer.from(k.publicKey).toString("base64"));'
export JWT_KID=test
export JWT_PRIVATE_KEY="$(cat /tmp/priv.b64)"
export JWT_PUBLIC_KEY="$(cat /tmp/pub.b64)"
export REFRESH_TOKEN_PEPPER=XnvGE1TyjUs65JZPOlr3+lz5L2gXXaINQYQQAvtnF28=
# Take other env variables from .env.example

docker compose up -d --wait
docker compose exec -T backend pnpm demo:auth
docker compose down -v

unset JWT_KID
unset JWT_PRIVATE_KEY
unset JWT_PUBLIC_KEY
unset REFRESH_TOKEN_PEPPER
```

## Demo #2 (reuse)

How to start:

```sh
node -e 'const {generateKeyPairSync}=require("node:crypto");
const k=generateKeyPairSync("ec",{namedCurve:"P-256",
  privateKeyEncoding:{type:"pkcs8",format:"pem"},
  publicKeyEncoding:{type:"spki",format:"pem"}});
const fs=require("node:fs");
fs.writeFileSync("/tmp/priv.b64",Buffer.from(k.privateKey).toString("base64"));
fs.writeFileSync("/tmp/pub.b64",Buffer.from(k.publicKey).toString("base64"));'
export JWT_KID=test
export JWT_PRIVATE_KEY="$(cat /tmp/priv.b64)"
export JWT_PUBLIC_KEY="$(cat /tmp/pub.b64)"
export REFRESH_TOKEN_PEPPER=XnvGE1TyjUs65JZPOlr3+lz5L2gXXaINQYQQAvtnF28=
# Take other env variables from .env.example

docker compose up -d --wait
docker compose exec -T backend pnpm demo:reuse
docker compose down -v

unset JWT_KID
unset JWT_PRIVATE_KEY
unset JWT_PUBLIC_KEY
unset REFRESH_TOKEN_PEPPER
```

## Demo #3 (rbac)

How to start:

```sh
node -e 'const {generateKeyPairSync}=require("node:crypto");
const k=generateKeyPairSync("ec",{namedCurve:"P-256",
  privateKeyEncoding:{type:"pkcs8",format:"pem"},
  publicKeyEncoding:{type:"spki",format:"pem"}});
const fs=require("node:fs");
fs.writeFileSync("/tmp/priv.b64",Buffer.from(k.privateKey).toString("base64"));
fs.writeFileSync("/tmp/pub.b64",Buffer.from(k.publicKey).toString("base64"));'
export JWT_KID=test
export JWT_PRIVATE_KEY="$(cat /tmp/priv.b64)"
export JWT_PUBLIC_KEY="$(cat /tmp/pub.b64)"
export REFRESH_TOKEN_PEPPER=XnvGE1TyjUs65JZPOlr3+lz5L2gXXaINQYQQAvtnF28=
# Take other env variables from .env.example

docker compose up -d --wait
docker compose exec -T backend pnpm demo:rbac
docker compose down -v

unset JWT_KID
unset JWT_PRIVATE_KEY
unset JWT_PUBLIC_KEY
unset REFRESH_TOKEN_PEPPER
```
