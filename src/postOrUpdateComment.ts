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

import { endGroup, startGroup } from "@actions/core";
import type { GitHub } from "@actions/github/lib/utils";
import { Context } from "@actions/github/lib/context";
import {
  DeploySuccessResult,
  interpretDeployResult,
  ErrorResult,
} from "./deploy";
import { createDeploySignature } from "./hash";

// TODO: Update GH link
const BOT_SIGNATURE =
  "<sub>🔥 via [Firebase Extensions GitHub Action](https://github.com/marketplace/actions/deploy-to-firebase-hosting) 🌎</sub>";

export function createBotCommentIdentifier(signature: string) {
  return function isCommentByBot(comment): boolean {
    return comment.user.type === "Bot" && comment.body.includes(signature);
  };
}

export function getDeploySuccessComment(
  result: DeploySuccessResult,
  commit: string,
  project: string
) {
  const deploySignature = createDeploySignature(result);
  const { instanceIds, consoleUrl } = interpretDeployResult(result);

  return `
Deployed Extension instances to ${project} (updated for commit ${commit}):

${instanceIds.join("\n")}

View your deployed extensions at ${consoleUrl}

${BOT_SIGNATURE}

<sub>Sign: ${deploySignature}</sub>`.trim();
}

export async function postDeploySuccessComment(
  github: InstanceType<typeof GitHub>,
  context: Context,
  result: DeploySuccessResult,
  commit: string,
  project: string,
) {
  const commentInfo = {
    ...context.repo,
    issue_number: context.issue.number,
  };

  const commentMarkdown = getDeploySuccessComment(result, commit, project);

  const comment = {
    ...commentInfo,
    body: commentMarkdown,
  };

  startGroup(`Commenting on PR`);
  const deploySignature = createDeploySignature(result);
  const isCommentByBot = createBotCommentIdentifier(deploySignature);

  let commentId;
  try {
    const comments = (await github.issues.listComments(commentInfo)).data;
    for (let i = comments.length; i--; ) {
      const c = comments[i];
      if (isCommentByBot(c)) {
        commentId = c.id;
        break;
      }
    }
  } catch (e) {
    console.log("Error checking for previous comments: " + e.message);
  }

  if (commentId) {
    try {
      await github.issues.updateComment({
        ...context.repo,
        comment_id: commentId,
        body: comment.body,
      });
    } catch (e) {
      commentId = null;
    }
  }

  if (!commentId) {
    try {
      await github.issues.createComment(comment);
    } catch (e) {
      console.log(`Error creating comment: ${e.message}`);
    }
  }
  endGroup();
}
