import {
  Stack,
  StackProps,
  Tags,
  Duration,
  RemovalPolicy,
  aws_lambda as lambda,
  aws_iam as iam,
  aws_s3 as s3,
  CfnOutput,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";

export class SampleAppCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const prefix = this.node.tryGetContext("resourcePrefix") ?? "pd-";
    const owner = this.node.tryGetContext("ownerTag") ?? "PlerionDemo";

    Tags.of(this).add("Owner", owner);

    const commonFnProps = {
      runtime: lambda.Runtime.NODEJS_22_X,
      memorySize: 128,
      timeout: Duration.seconds(10),
    } as const;

    const lambdaA = new NodejsFunction(this, "LambdaA", {
      ...commonFnProps,
      functionName: `${prefix}lambda-a`,
      description:
        "A Lambda function with lodash v3.x included without bundling",
      entry: path.join(__dirname, "..", "src", "lambda-a", "index.ts"),
      handler: "handler",
      bundling: {
        minify: false,
        externalModules: ["aws-sdk", "axios", "lodash"] as string[],
        sourcesContent: false,
        commandHooks: {
          beforeBundling(_inputDir: string, _outputDir: string): string[] {
            return [];
          },
          beforeInstall(_inputDir: string, _outputDir: string): string[] {
            return [];
          },
          afterBundling(inputDir: string, outputDir: string): string[] {
            // Copy package files and install only production dependencies
            return [
              `bash -lc "if [ -f ${inputDir}/package.json ]; then cp ${inputDir}/package.json ${outputDir}/package.json; fi"`,
              `bash -lc "if [ -f ${inputDir}/package-lock.json ]; then cp ${inputDir}/package-lock.json ${outputDir}/package-lock.json; fi"`,
              `bash -lc "cd ${outputDir} && npm ci --only=production --no-audit --no-fund --ignore-scripts"`,
            ];
          },
        },
      },
    });

    const lambdaAUrl = lambdaA.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ["*"],
        allowedMethods: [lambda.HttpMethod.ALL],
      },
    });

    new NodejsFunction(this, "LambdaB", {
      ...commonFnProps,
      functionName: `${prefix}lambda-b`,
      description: "A Lambda function with lodash v3.x included in the bundle",
      entry: path.join(__dirname, "..", "src", "lambda-b", "index.ts"),
      handler: "handler",
    });

    // Intentionally insecure IAM role - allows any principal to assume it
    const insecureRole = new iam.Role(this, "InsecureRole", {
      roleName: `${prefix}insecure-role`,
      assumedBy: new iam.AnyPrincipal(), // This allows ANY principal to assume the role
      description:
        "Intentionally insecure role with no permissions - for demo purposes",
      // No policies attached - intentionally has no permissions
    });

    // Intentionally insecure S3 bucket - publicly writable due to overly permissive policy
    const insecureBucket = new s3.Bucket(this, "InsecureBucket", {
      bucketName: `${prefix}insecure-bucket-${this.account}-${this.region}`,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      publicReadAccess: true,
      removalPolicy: RemovalPolicy.DESTROY, // Allow bucket deletion for demo purposes
    });

    // Add an overly permissive bucket policy that allows public write access
    insecureBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()], // Allow ANY principal
        actions: [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:PutObjectAcl",
          "s3:GetObjectAcl",
        ],
        resources: [`${insecureBucket.bucketArn}/*`],
      })
    );

    new CfnOutput(this, "LambdaAFunctionUrl", {
      value: lambdaAUrl.url,
      description: "Public Function URL for pd-lambda-a",
    });

    new CfnOutput(this, "InsecureRoleArn", {
      value: insecureRole.roleArn,
      description: "ARN of the intentionally insecure role",
    });

    new CfnOutput(this, "InsecureBucketName", {
      value: insecureBucket.bucketName,
      description: "Name of the intentionally insecure S3 bucket",
    });

    new CfnOutput(this, "InsecureBucketUrl", {
      value: `https://${insecureBucket.bucketName}.s3.${this.region}.amazonaws.com`,
      description: "URL of the intentionally insecure S3 bucket",
    });
  }
}
