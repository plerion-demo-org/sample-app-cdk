#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SampleAppCdkStack } from '../lib/sample-app-cdk-stack';

const app = new cdk.App();

const accountId = app.node.tryGetContext('accountId');
const region = app.node.tryGetContext('region') ?? 'ap-southeast-2';

new SampleAppCdkStack(app, 'pd-sample-app-cdk', {
  env: { account: accountId, region },
  tags: { Owner: app.node.tryGetContext('ownerTag') ?? 'PlerionDemo' }
});


