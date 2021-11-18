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

import * as crypto from "crypto";
import { DeploySuccessResult } from "./deploy";

// Create a stable signature for a deploy used for earmarking.
export function createDeploySignature(deployResult: DeploySuccessResult) {
  const results = Object.values(deployResult.result);
  const instances = results.map((result) => result.instanceId).sort();

  const hash = crypto.createHash("sha1");
  instances.forEach((instance) => {
    hash.update(instance);
  });
  return hash.digest("hex");
}
