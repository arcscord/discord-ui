# Website deployment

Maintainer setup for the [Docusaurus website](../../apps/website/README.md).
The workflow is defined in [pages.yml](../../.github/workflows/pages.yml).

The production address is **https://ui.arcscord.dev**. Docusaurus uses this URL
with `baseUrl: "/"`; do not change it to `/discord-ui/` for this custom domain.

The `Deploy website` workflow in `.github/workflows/pages.yml` runs after `CI`
completes successfully on `main`, following a push or a manual run of `CI`.
Pull requests, other branches and reusable release verification runs do not deploy.
The Pages job downloads the exact `apps/website/build` artifact exercised by the
browser tests, using the successful CI run ID. It does not rebuild or execute
repository code with deployment permissions. The existing reusable CI keeps its
read-only permissions for npm release verification.
Deployments use the `github-pages` environment and the built-in `GITHUB_TOKEN`;
no personal access token, deploy key, `gh-pages` branch or npm publication is needed.

Before the first deployment:

1. In [repository Settings → Pages](https://github.com/arcscord/discord-ui/settings/pages),
   set **Build and deployment → Source** to **GitHub Actions**.
2. Set **Custom domain** to `ui.arcscord.dev` and save it before adding DNS.
   This repository setting is required: a `static/CNAME` file does not configure
   a custom domain for an Actions deployment.
3. In the DNS zone for `arcscord.dev`, add this record (or replace a conflicting
   record for `ui`):

   | Type | Name | Target | TTL |
   | --- | --- | --- | --- |
   | CNAME | `ui` | `arcscord.github.io` | Auto/default |

   The target has no scheme, path or repository name. With Cloudflare, use
   **DNS only** during domain and HTTPS setup.
4. In **Settings → Environments → github-pages**, allow deployments from `main`
   only. Create the environment if it does not exist. Add required reviewers only
   if deployments should require manual approval.
5. Ensure repository/organization Actions policies allow the actions referenced
   in the workflow. Merge the workflow into `main` through the normal review
   process, or run **Actions → CI → Run workflow → main** once it is present.
6. After GitHub validates DNS and provisions the certificate, enable
   **Enforce HTTPS** in Pages settings. Certificate availability can take up to
   an hour after DNS is configured.

For domain ownership verification, use **organization Settings → Pages → Add a
domain** and publish the exact TXT record GitHub supplies. Keep that record after
verification; its value cannot be inferred from the repository.

After deployment, check `dig +short CNAME ui.arcscord.dev` (expected:
`arcscord.github.io.`), then open `/`, `/docs/introduction`, `/components` and
`/playground` directly and reload them. Confirm HTTPS, local fonts/avatars and
interactive previews. The workflow's deployment links to the resulting site;
local builds do not verify GitHub settings, DNS or TLS.

References: [GitHub custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages),
[custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site),
[domain verification](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages).
