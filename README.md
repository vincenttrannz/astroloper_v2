# Astroloper v2

Personal headless CMS built on Wagtail (Django) + Next.js, orchestrated with Docker Compose and provisioned with Ansible.

## Stack

- **Backend**: [Wagtail](https://wagtail.org) 6 on Django 5, exposing the [Wagtail API v2](https://docs.wagtail.org/en/stable/advanced_topics/api/v2/) for headless consumption.
- **Frontend**: [Next.js](https://nextjs.org) 15 (App Router) + TypeScript + Tailwind CSS + [shadcn/ui](https://ui.shadcn.com).
- **Storage**: Postgres 16, Redis 7.
- **Routing**: Traefik (runs as a separate stack; this project joins the external `web` Docker network).
- **Provisioning**: Ansible (`provisioning/`) with per-environment inventories and vault-encrypted secrets.
- **Task runner**: [Task](https://taskfile.dev).

## Quick start (local dev)

Prerequisites:
- Docker Desktop (or Docker Engine + compose plugin)
- [Task](https://taskfile.dev/installation/) (`brew install go-task/tap/go-task`)
- [Ansible](https://docs.ansible.com/) (`brew install ansible`) — required; it renders `.env` files from the vault
- A running Traefik container that owns the external `web` Docker network with a TLS-terminating entrypoint on port 443 (see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)).
- Optional: [uv](https://docs.astral.sh/uv/) and Node.js 22 with npm if you want to run backend/frontend outside Docker.

Secrets live in `provisioning/group_vars/<env>/vault.yml` (ansible-vault encrypted). Do not copy or hand-edit `.env` files — they are generated artifacts.

```bash
# One-time: create gitignored vault password files (edit them to match how the vault was encrypted).
task provisioning:init

# Optional: change secrets (postgres password, django secret, admin user, …).
task provisioning:vault:edit -- env=development

task setup              # renders .env from the vault, creates `web` network, builds, migrates, creates admin
task dev                # brings up db, redis, backend, frontend behind Traefik
```

Then open:

- <https://astroloper.localhost/> — Next.js frontend
- <https://astroloper.localhost/admin/> — Wagtail admin
- <https://astroloper.localhost/django-admin/> — Django admin
- <https://astroloper.localhost/api/v2/pages/> — Wagtail API v2

No `/etc/hosts` edits needed: `.localhost` is RFC-reserved and browsers auto-resolve `*.localhost` to `127.0.0.1`. TLS is served by Traefik's default self-signed cert — click through the first-visit warning.

## Configuration

**Source of truth** is `provisioning/group_vars/<env>/`: encrypted `vault.yml` for secrets, `vars.yml` for non-secrets. `task env` (and `task setup` / `task provisioning:deploy`) renders those through j2 templates into three gitignored `.env` files. Never edit the `.env` files by hand — change the vault or vars and re-render.

- Top-level `.env` — Compose `${VAR}` interpolation only (project name, Traefik labels, `POSTGRES_*`).
- `backend/.env` / `frontend/.env` — injected into the containers via `env_file:`.

Postgres only applies `POSTGRES_PASSWORD` when it first initializes an empty data volume. If you change `vault_postgres_password`, run `task reset` before bringing the stack up again, or the backend will fail with `password authentication failed`. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#configuration-flow).

## Layout

```
astroloper_v2/
  Taskfile.yml                  # top-level task runner
  docker-compose*.yml           # base + per-env overrides
  backend/                      # Wagtail + Django
    project/                    # Django project package (settings, urls, wsgi/asgi)
    models/                     # single Django app: content models
      mixins/  pages/  snippets/  settings/  streamfield/
    docker/                     # Dockerfile + entrypoint
  frontend/                     # Next.js App Router + Tailwind + shadcn
    src/{app,components,lib}
    docker/
  provisioning/                 # Ansible
    inventories/{development,staging,production}
    group_vars/<env>/{vars.yml,vault.yml}
    roles/{common,docker,app,traefik}
    playbooks/{provision,deploy,rollback}.yml
  docs/                         # architecture + deployment notes
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full architecture and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for deployment / Traefik setup.

## Common tasks

```bash
task                          # list all tasks
task env                      # render .env files from the development vault
task dev                      # start dev stack
task backend:migrate          # run django migrations
task backend:makemigrations   # generate new migrations
task backend:createsuperuser
task backend:shell
task frontend:dev             # next dev (outside docker)
task frontend:add -- button   # add a shadcn component
task provisioning:deploy -- env=development
task provisioning:vault:edit -- env=development
```

## Traefik entrypoint / TLS knobs

These land in the rendered top-level `.env`. Change them in `provisioning/all.yml` / `group_vars/<env>/vars.yml`, then `task env` — do not edit `.env` directly.

| Variable             | Default   | Notes                                                                                    |
| -------------------- | --------- | ---------------------------------------------------------------------------------------- |
| `TRAEFIK_NETWORK`    | `web`     | Name of the external docker network owned by your standalone Traefik stack.              |
| `TRAEFIK_ENTRYPOINT` | `https`   | Must match a name declared in your Traefik command flags.                                |
| `TRAEFIK_TLS`        | `true`    | Set to `false` if your entrypoint is plain HTTP (also flip every `SITE_URL` to `http://`). |

If your Traefik uses `web`/`websecure` or `http`/`https` — set `traefik_entrypoint` in group_vars accordingly and re-render.
