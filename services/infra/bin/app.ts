#!/usr/bin/env node
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { AuthStack } from "../lib/auth-stack";
import { DatabaseStack } from "../lib/database-stack";
import { StorageStack } from "../lib/storage-stack";
import { ApiStack } from "../lib/api-stack";

const app = new App();

const stage = app.node.tryGetContext("stage") || "dev";

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || "us-east-1",
};

// --- Auth Stack (Cognito) ---
const authStack = new AuthStack(app, `DealScope-Auth-${stage}`, {
  stage,
  env,
});

// --- Database Stack (DynamoDB) ---
const databaseStack = new DatabaseStack(app, `DealScope-Database-${stage}`, {
  stage,
  env,
});

// --- Storage Stack (S3) ---
const storageStack = new StorageStack(app, `DealScope-Storage-${stage}`, {
  stage,
  env,
});

// --- API Stack (API Gateway + Lambda) ---
const apiStack = new ApiStack(app, `DealScope-Api-${stage}`, {
  stage,
  env,
  userPool: authStack.userPool,
  table: databaseStack.table,
  uploadsBucket: storageStack.uploadsBucket,
});

// Explicit dependencies
apiStack.addDependency(authStack);
apiStack.addDependency(databaseStack);
apiStack.addDependency(storageStack);

app.synth();
