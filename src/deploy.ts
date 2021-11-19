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

import { exec } from "@actions/exec";

export type InstanceDeploy = {
  instanceId: string,
};

export type ErrorResult = {
  status: "error";
  error: string;
};

export type DeploySuccessResult = {
  status: "success";
  result: { [key: string]: InstanceDeploy };
};

export type DeployConfig = {
  project: string;
};


export function interpretDeployResult(
  deployResult: DeploySuccessResult
): { instanceIds: string[]; consoleUrl: string } {
  // TODO: Implement this


  return {
    instanceIds : [],
    consoleUrl: "https://firebase.com",
  };
}

async function execWithCredentials(
  args: string[],
  projectId,
  gacFilename,
  debug: boolean = false
) {
  let deployOutputBuf: Buffer[] = [];

  try {
    await exec(
      "npx firebase-tools",
      [
        ...args,
        ...(projectId ? ["--project", projectId] : []),
        debug
          ? "--debug" // gives a more thorough error message
          : "--json", // allows us to easily parse the output
      ],
      {
        listeners: {
          stdout(data: Buffer) {
            deployOutputBuf.push(data);
          },
        },
        env: {
          ...process.env,
          FIREBASE_DEPLOY_AGENT: "action-extensions-deploy", // TODO: Check if I need to do anything to track this on the CLI end?
          GOOGLE_APPLICATION_CREDENTIALS: gacFilename, // the CLI will automatically authenticate with this env variable set
        },
      }
    );
  } catch (e) {
    console.log(Buffer.concat(deployOutputBuf).toString("utf-8"));
    console.log(e.message);

    if (debug === false) {
      console.log(
        "Retrying deploy with the --debug flag for better error output"
      );
      await execWithCredentials(args, projectId, gacFilename, true);
    } else {
      throw e;
    }
  }
  console.log(deployOutputBuf[deployOutputBuf.length - 1].toString("utf-8"));
  return deployOutputBuf.length
    ? deployOutputBuf[deployOutputBuf.length - 1].toString("utf-8")
    : ""; // output from the CLI
}

export async function deploy(
  gacFilename,
  deployConfig: DeployConfig
) {
  const { project } = deployConfig;

  const deploymentText = await execWithCredentials(
    ["deploy", "--only", "extensions", "--force"],
    project,
    gacFilename
  );

  console.log(deploymentText)

  const deploymentResult = JSON.parse(deploymentText) as
    | DeploySuccessResult
    | ErrorResult;

  return deploymentResult;
}
