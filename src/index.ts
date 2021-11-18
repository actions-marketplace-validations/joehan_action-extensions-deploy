/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  endGroup,
  getInput,
  setFailed,
  setOutput,
  startGroup,
} from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { existsSync } from "fs";
import { createCheck } from "./createCheck";
import { createGacFile } from "./createGACFile";
import { deploy, ErrorResult, interpretDeployResult } from "./deploy";
import { postDeploySuccessComment } from "./postOrUpdateComment";

// Inputs defined in action.yml
const projectId = getInput("project");
const googleApplicationCredentials = getInput("firebaseServiceAccount", {
  required: true,
});
const token = process.env.GITHUB_TOKEN || getInput("repoToken");
const octokit = token ? getOctokit(token) : undefined;
const entryPoint = getInput("entryPoint");

async function run() {
  const isPullRequest = !!context.payload.pull_request;

  let finish = (details: Object) => console.log(details);
  if (token && isPullRequest) {
    finish = await createCheck(octokit, context);
  }

  try {
    startGroup("Verifying firebase.json exists");

    if (entryPoint !== ".") {
      console.log(`Changing to directory: ${entryPoint}`);
      try {
        process.chdir(entryPoint);
      } catch (err) {
        throw Error(`Error changing to directory ${entryPoint}: ${err}`);
      }
    }

    if (existsSync("./firebase.json")) {
      console.log("firebase.json file found. Continuing deploy.");
    } else {
      throw Error(
        "firebase.json file not found. If your firebase.json file is not in the root of your repo, edit the entryPoint option of this GitHub action."
      );
    }
    endGroup();

    startGroup("Setting up CLI credentials");
    const gacFilename = await createGacFile(googleApplicationCredentials);
    console.log(
      "Created a temporary file with Application Default Credentials."
    );
    endGroup();

    startGroup("Deploying extension intances");
    const deployment = await deploy(gacFilename, {
      project: projectId,
    });
    if (deployment.status === "error") {
      throw Error((deployment as ErrorResult).error);
    }
    endGroup();

    const url = `https://firebase.com/project/${projectId}/extensions`;
    await finish({
      details_url: url,
      conclusion: "success",
      output: {
        title: `Extensions deploy succeeded`,
        summary: `[View the Deployed Instances in Firebase Console](${url})`,
      },
    });
    return;
  } catch (e) {
    setFailed(e.message);

    await finish({
      conclusion: "failure",
      output: {
        title: "Extensions deploy failed",
        summary: `Error: ${e.message}`,
      },
    });
  }
}

run();
