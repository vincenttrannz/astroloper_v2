# Deployment

## Local development

### 1. Prerequisites

- Docker Desktop or Docker Engine + compose plugin
- [Task](https://taskfile.dev/installation/): `brew install go-task/tap/go-task`
- [Ansible](https://docs.ansible.com/): `brew install ansible` (required — it renders `.env` files from the vault)

### 2. Traefik (runs outside this project)

This repo assumes a standalone Traefik container is already running and owns the external Docker network `web`, with a TLS-terminating entrypoint on port 443.

Match the Traefik knobs in `provisioning/all.yml` / `group_vars/<env>/vars.yml` (rendered into `.env`) to whatever your Traefik calls things:

| `.env` key             | What it means                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------- |
| `TRAEFIK_NETWORK`      | Name of the external network shared with Traefik. Default `web`.                       |
| `TRAEFIK_ENTRYPOINT`   | Name of the entrypoint declared in your Traefik command. Default `https`.              |
| `TRAEFIK_TLS`          | Set `false` if you bind to a plain-HTTP entrypoint (and flip `SITE_URL` to `http://`). |

To inspect your running Traefik and see what its entrypoints are actually called:

```bash
docker inspect <traefik-container> --format '{{range .Config.Cmd}}{{.}}{{"\n"}}{{end}}' | grep entrypoints
```

A minimal working Traefik if you don't have one yet:

```yaml
# ~/dev/traefik/docker-compose.yml
name: traefik

networks:
  web:
    name: web
    driver: bridge

services:
  traefik:
    image: traefik:v3
    restart: unless-stopped
    command:
      - --api.dashboard=true
      - --api.insecure=true
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.http.address=:80
      - --entrypoints.https.address=:443
      - --entrypoints.http.http.redirections.entrypoint.to=https
      - --entrypoints.http.http.redirections.entrypoint.scheme=https
      - --entrypoints.https.http.tls=true
    ports:
      - "80:80"
      - "443:443"
      - "127.0.0.1:8080:8080"    # dashboard
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - web
```

Bring it up once:

```bash
cd ~/dev/traefik
docker compose up -d
```

The Traefik dashboard is at <http://localhost:8080/>. This stack lives on its own so multiple projects can share the same network.

### 3. Astroloper local dev

From this repo:

```bash
task provisioning:init   # one-time: create vault password files
task setup               # render .env from the vault, ensure `web` network exists, build, migrate, superuser
task dev                 # up
```

Then browse:

- <https://astroloper.localhost/>
- <https://astroloper.localhost/admin/>
- <https://astroloper.localhost/api/v2/pages/>

`.localhost` is RFC-reserved: browsers auto-resolve `*.localhost` to `127.0.0.1`, so no `/etc/hosts` edit is required. First visit shows a browser TLS warning (Traefik default self-signed cert); accept it once.

## Configuration flow

Every environment gets its config the same way — there is a single path. Encrypted `vault.yml` holds secrets; `vars.yml` holds non-secrets. The three `.env` files are generated artifacts (gitignored). Do not copy templates or edit them by hand.

```
group_vars/<env>/vars.yml + vault.yml   (source of truth)
        │  task env  /  task provisioning:deploy
        │  (Ansible app role renders j2 templates)
        ▼
.env            ← env.j2          (Compose ${VAR} interpolation only)
backend/.env    ← backend.env.j2  ─┐ injected into the containers
frontend/.env   ← frontend.env.j2 ─┘ via each service's `env_file:`
```

- **Top-level `.env`** is read by Docker Compose for `${VAR}` interpolation only: project name, router labels (`SITE_HOST`, `TRAEFIK_NETWORK`, `TRAEFIK_ENTRYPOINT`, `TRAEFIK_TLS`), and the `POSTGRES_*` used to build `DATABASE_URL`.
- **`backend/.env` / `frontend/.env`** carry app runtime config and are injected via `env_file:` (`required: false`, so a missing file never hard-fails).
- `DATABASE_URL` / `REDIS_URL` stay as Compose `environment:` interpolation so the DB connection never depends on `backend/.env` existing.
- Per-environment `docker-compose.<env>.yml` `environment:` entries intentionally win over `env_file:` (Compose precedence) — e.g. dev forces `EMAIL_HOST=mailpit` and `DJANGO_SETTINGS_MODULE=project.settings.dev`.
- `settings/base.py` env defaults are the final fallback if a key is absent from the rendered files.
- Postgres applies `POSTGRES_PASSWORD` only when initializing an empty volume. Changing `vault_postgres_password` against an existing volume requires `task reset` (or an `ALTER ROLE`) — otherwise Django fails with `password authentication failed`.

## Provisioning (Ansible)

The provisioning layer lives in [`provisioning/`](../provisioning). It's currently wired for `local_only`: the development inventory targets `localhost` with `ansible_connection: local`; staging/production inventories are stubs waiting for real hosts.

### Vault passwords

Each environment has its own vault password file under `provisioning/vault_passwords/`. These are **gitignored**; a matching `.example` template is committed so you know the convention.

```bash
# 1. Create real password files (one line each, any secret string).
echo 'my-dev-vault-password'  > provisioning/vault_passwords/development
echo 'my-stg-vault-password'  > provisioning/vault_passwords/staging
echo 'my-prod-vault-password' > provisioning/vault_passwords/production
chmod 600 provisioning/vault_passwords/{development,staging,production}

# 2. Populate the plaintext vault files with real secrets.
$EDITOR provisioning/group_vars/development/vault.yml

# 3. Encrypt.
cd provisioning
ansible-vault encrypt \
  --vault-id development@vault_passwords/development \
  group_vars/development/vault.yml
```

Ansible's `vault_identity_list` (set in `provisioning/ansible.cfg`) auto-selects the right password based on the vault-id label at encrypt time. Day-to-day editing:

```bash
task provisioning:vault:edit -- env=development
task provisioning:vault:view -- env=production
```

### Playbooks

```bash
task provisioning:env       -- env=development   # render .env files only
task provisioning:provision -- env=development
task provisioning:deploy    -- env=development
task provisioning:rollback  -- env=development
```

- `env` (also `task env` from the repo root) renders `.env`, `backend/.env`, and `frontend/.env` from group_vars + vault without starting the stack.
- `provision.yml` installs Docker, creates the `web` network, and (optionally) starts Traefik.
- `deploy.yml` renders the three `.env` files, builds images, runs migrations, and brings services up. All app config flows through those rendered files — there is no inline `environment:` block.
- `rollback.yml` re-deploys the previous image tags.

## Moving to a real server

When you're ready to point staging/production at real hosts:

1. Edit `provisioning/inventories/<env>/hosts.yml` with the target IP and SSH user.
2. Set the real domain (and any other non-secrets) in `provisioning/group_vars/<env>/vars.yml`.
3. Set secrets in `provisioning/group_vars/<env>/vault.yml` (`task provisioning:vault:edit -- env=<env>`).
4. Ensure the target host has Docker installed (or run `task provisioning:provision -- env=<env>` once).
5. Deploy with `task provisioning:deploy -- env=<env>` (this renders `.env` files from the vault, then starts the stack).

Media uploads currently live on a local Docker volume. When you need S3 (or any object storage), add `django-storages` to the backend deps, set `DEFAULT_FILE_STORAGE` in `project/settings/production.py`, and point Wagtail at the bucket. The volume mount in `docker-compose.yml` becomes redundant at that point.
