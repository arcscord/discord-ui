import process from "node:process";

const response = await fetch(`${process.env.GITHUB_API_URL}/repos/${process.env.GITHUB_REPOSITORY}/environments/comparison-preview`, {
  headers: { authorization: `Bearer ${process.env.GH_TOKEN}`, accept: "application/vnd.github+json" },
});
if (!response.ok)
  throw new Error(`Cannot verify comparison-preview protections (${response.status}).`);
const environment = await response.json() as {
  can_admins_bypass?: boolean;
  protection_rules?: { type: string; reviewers?: unknown[] }[];
};
if (!environment.protection_rules?.some(rule => rule.type === "required_reviewers" && rule.reviewers?.length))
  throw new Error("Configure Required reviewers on comparison-preview before publishing.");
if (environment.can_admins_bypass !== false)
  throw new Error("Disable administrator bypass on comparison-preview before publishing.");
