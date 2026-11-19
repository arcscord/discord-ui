# Reviewed comparison previews

The publisher in `.github/workflows/comparison-preview.yml` runs after a successful
PR run of `CI`. Its workflow and scripts come from the default-branch commit that
received the `workflow_run` event. It downloads the tested comparison build and
CI evidence as data, verifies their archive digests, and prepares a review summary.
The `comparison-preview` environment gates the upload with required reviewers.

## Repository setup

Complete these settings before enabling publication by merging the workflow into
`main`.

1. Open **Settings → Environments → comparison-preview**. The environment already
   existed when inspected on 2026-11-19, with no protection rules.
2. Add the maintainer or team under **Required reviewers**. For a sole maintainer,
   leave **Prevent self-review** disabled so that they can approve their runs.
   Otherwise select the policy appropriate for the team.
3. Disable **Allow administrators to bypass configured protection rules**. The
   publisher checks this setting and the presence of reviewers before requesting
   approval, then checks them again in the protected job.
4. Restrict deployment branches to the trusted default branch, `main`.
5. Add environment secret `CLOUDFLARE_API_TOKEN`. Add environment variables
   `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_PAGES_PROJECT`.

The repository was verified as public. GitHub documents required-reviewer
availability and the separate deployment approval flow.
[Environment protection](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)

## Cloudflare setup

Create a dedicated **Pages Direct Upload** project. Keep the production branch
`main`. Synthetic preview branches are named `pr-<number>`. Use the default
`pages.dev` domain and keep this project dedicated to these static PR previews.
Do not attach server functions, secrets, bindings or a production custom domain.

Use an API token with **Account → Cloudflare Pages → Edit**, restricted to the
selected account. Store it directly as the protected GitHub environment secret.
Cloudflare account permissions cover Pages projects within that account, so use
an isolated account if account-level separation is required.

The verified `cf` version is `1.0.0-rc.1`. Project creation uses `cf`. Replace the
example project name and first inspect the dry run. Authentication and account
selection must be configured in the shell running these commands.

```sh
cf auth login
cf pages create --name discord-ui-comparison --production-branch main --dry-run
cf pages create --name discord-ui-comparison --production-branch main
```

The installed `cf pages deploy` rejects Pages uploads. A task-specific exception
was approved for **Wrangler 4.165.0**, used only for the static upload. The workflow
installs this pinned version from npm in a trusted temporary directory. It runs
outside the downloaded build and repository configuration directories.
[Cloudflare Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)

## Review and publication

1. Run CI for the current PR revision. All seven named required jobs must succeed.
2. Open the publisher run and inspect **Validate preview and prepare review**.
   Its summary records PR head, tested checkout SHA, source CI attempt and archive
   IDs/digests. PR head and merge checkout are retained separately.
3. Review PR changes affecting CI, build scripts and browser tests as well as the
   preview itself. PR code controls its own CI execution and report content.
   Metadata validation establishes provenance and association with the successful
   run. The human approval covers the proposed content and test changes.
4. The publisher creates or updates one **Comparison preview** bot comment on
   the PR. Select **Approve deployment** to open that publisher run, then use
   **Review deployments → Approve and deploy**, or reject the deployment.
5. The upload rechecks the current open PR, CI result and approved artifact
   identities. It downloads and validates the archives again. Expired archives,
   stale heads and ambiguous artifacts fail publication.
6. The resulting summary links the immutable preview, the stable PR alias and
   `/report.html`. The report exposes verified build identity, comparison test
   count and a link to full GitHub diagnostics. Large traces stay in GitHub.

After the protected job finishes, the same PR comment links the verified preview,
PR alias and report. Its final notification job records publication failure,
rejection or cancellation and retains the last verified immutable URL with its published head and tested
checkout. Outdated PR heads, closed PRs and superseded CI attempts skip comment
updates. Comment jobs use the workflow's `GITHUB_TOKEN` with `pull-requests: write`
and receive the trusted publisher's source and validated identity metadata.
Forced workflow cancellation can interrupt that notification job. The linked
publication run retains the definitive outcome. A failed or pending publication
shows the last verified immutable URL. The mutable alias is included after a
successful upload of the current build.

Only the protected upload step receives the Cloudflare token. Downloaded scripts
are never executed on the runner. The static policy rejects server entry points,
symlinks, hidden/unsafe paths and artifact-provided headers or redirects. It
requires all three native fixture entry points and creates trusted noindex headers.
The site root, three fixtures, report and published metadata receive HTTP checks
before a successful deployment result is recorded. Existing successful deployment
records remain active when another publication fails.

## Reruns and operational boundaries

- Rerunning the publisher requests a new protected-job approval. An already
  successful CI attempt/artifact is deduplicated using its GitHub deployment record.
- A partial CI rerun can omit previously successful jobs from its attempt. This
  publisher fails closed in that situation. Use **Re-run all jobs** to produce a
  complete successful attempt and consistent fresh artifacts.
- Publications for the same source PR/branch run one at a time. The default
  concurrency group retains one active and one pending run. Another incoming run
  can replace the pending run. Cancel obsolete waiting publisher runs in Actions
  to let a newer
  revision proceed. A stale approval fails the revision check before upload.
- A PR can change or close during a provider request. The publisher rechecks after
  the request and refuses to record success. Pages may already have changed the
  alias in that interval. A provider smoke-check failure can likewise leave a
  deployed alias. Use the last successful immutable URL recorded in GitHub while
  investigating or republishing the current revision. Cross-service alias updates
  and PR mutations have no shared transaction.
- The protected environment's automatic GitHub deployment references the trusted
  publisher commit. The additional `comparison-preview-pr-<number>` deployment
  explicitly references the PR head and stores the tested checkout in its payload.
- Rejection, waiting and cancellation are visible in the protected job's GitHub
  deployment history. Detailed failed test artifacts remain on the source CI run.
- Step 9 cleanup, retention reconciliation and usage monitoring remain separate
  work. Seven-day GitHub artifact expiry also limits how long an approval can wait.

## Validation status

Local regression coverage exercises GitHub eligibility, malicious ZIP archives,
static policy and metadata association. The existing comparison production build
is accepted by the static policy. TypeScript and lint are checked locally.

Cloudflare authentication is absent locally. Live approval/rejection, provider
uploads, immutable URLs, alias updates, browser refresh and local-asset loading
must be verified after the account/environment setup and default-branch workflow
installation. HTTP smoke checks do not establish browser rendering or interaction
correctness. The source CI's native-framework browser suite provides that layer.
