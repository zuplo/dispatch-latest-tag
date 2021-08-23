import * as core from "@actions/core";
import * as github from "@actions/github";

async function action() {
  const token = core.getInput("token");
  if (token === "") {
    throw new Error("Invalid token provided");
  }
  const repo = core.getInput("repo");
  if (repo === "") {
    throw new Error("Invalid repo provided");
  }
  const workflow_id = core.getInput("workflow_id");
  if (workflow_id === "") {
    throw new Error("Invalid workflow_id provided");
  }
  const octokit = github.getOctokit(token);
  /* cspell: disable-next-line */
  const tagsResults = await octokit.rest.repos.listTags({
    owner: "zuplo",
    repo,
    per_page: 1,
  });
  let ref = undefined;
  if (
    tagsResults &&
    tagsResults.status === 200 &&
    tagsResults.data.length === 1
  ) {
    ref = tagsResults.data[0].name;
  }
  if (ref === undefined) {
    core.setFailed(`Could not determined latest tag for target repo`);
    return;
  }
  core.info(
    `Dispatching workflow '${workflow_id}' in '${repo}' with ref '${ref}'`
  );
  const result = await octokit.request(
    /* cspell: disable-next-line */
    "POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches",
    {
      owner: "zuplo",
      repo,
      workflow_id,
      ref,
    }
  );
  if (result.status !== 204) {
    core.setFailed(`Action failed with status ${result.status}`);
    return;
  }
}
action().catch((reason) => {
  if (reason instanceof Error) {
    core.error(reason);
  }
  core.setFailed(`An unknown error occurred`);
});
