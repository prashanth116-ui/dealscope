import { Stack, StackProps, Duration, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as path from "path";

interface ApiStackProps extends StackProps {
  stage: string;
  userPool: cognito.UserPool;
  table: dynamodb.Table;
  uploadsBucket: s3.Bucket;
}

export class ApiStack extends Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { stage, userPool, table, uploadsBucket } = props;

    // --- REST API ---
    this.api = new apigateway.RestApi(this, "Api", {
      restApiName: `dealscope-api-${stage}`,
      description: "DealScope real estate analysis API",
      deployOptions: {
        stageName: stage,
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          "Content-Type",
          "Authorization",
          "X-Amz-Date",
          "X-Api-Key",
          "X-Amz-Security-Token",
        ],
        maxAge: Duration.hours(1),
      },
    });

    // --- Cognito Authorizer ---
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      "CognitoAuthorizer",
      {
        cognitoUserPools: [userPool],
        identitySource: "method.request.header.Authorization",
      }
    );

    const authMethodOptions: apigateway.MethodOptions = {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    };

    // --- Shared Lambda environment ---
    const commonEnv: Record<string, string> = {
      TABLE_NAME: table.tableName,
      BUCKET_NAME: uploadsBucket.bucketName,
      STAGE: stage,
    };

    const handlersDir = path.join(__dirname, "../../api/src/handlers");

    const bundling = {
      externalModules: ["@aws-sdk/*"],
    };

    // --- Lambda: analyze ---
    const analyzeFn = new NodejsFunction(this, "AnalyzeFn", {
      functionName: `dealscope-analyze-${stage}`,
      entry: path.join(handlersDir, "analyze.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: Duration.seconds(30),
      memorySize: 512,
      environment: commonEnv,
      bundling,
    });

    // --- Lambda: lookup ---
    const lookupFn = new NodejsFunction(this, "LookupFn", {
      functionName: `dealscope-lookup-${stage}`,
      entry: path.join(handlersDir, "lookup.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: Duration.seconds(15),
      memorySize: 256,
      environment: commonEnv,
      bundling,
    });

    // --- Lambda: data-fetch ---
    const dataFetchFn = new NodejsFunction(this, "DataFetchFn", {
      functionName: `dealscope-data-fetch-${stage}`,
      entry: path.join(handlersDir, "data-fetch.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: Duration.seconds(15),
      memorySize: 256,
      environment: commonEnv,
      bundling,
    });

    // --- Lambda: upload-url (presigned S3 URLs) ---
    const uploadUrlFn = new NodejsFunction(this, "UploadUrlFn", {
      functionName: `dealscope-upload-url-${stage}`,
      entry: path.join(handlersDir, "upload-url.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: Duration.seconds(10),
      memorySize: 256,
      environment: commonEnv,
      bundling,
    });

    // --- Lambda: extract (PDF/document text extraction) ---
    const extractFn = new NodejsFunction(this, "ExtractFn", {
      functionName: `dealscope-extract-${stage}`,
      entry: path.join(handlersDir, "extract.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: Duration.seconds(60),
      memorySize: 1024,
      environment: commonEnv,
      bundling,
    });

    // --- DynamoDB permissions ---
    table.grantReadWriteData(analyzeFn);
    table.grantReadWriteData(lookupFn);
    table.grantReadData(dataFetchFn);
    table.grantReadWriteData(uploadUrlFn);
    table.grantReadWriteData(extractFn);

    // --- S3 permissions ---
    uploadsBucket.grantReadWrite(uploadUrlFn);
    uploadsBucket.grantRead(extractFn);

    // --- API Routes: /analyses ---
    const analyses = this.api.root.addResource("analyses");
    analyses.addMethod(
      "POST",
      new apigateway.LambdaIntegration(analyzeFn),
      authMethodOptions
    );
    analyses.addMethod(
      "GET",
      new apigateway.LambdaIntegration(analyzeFn),
      authMethodOptions
    );

    const analysisById = analyses.addResource("{id}");
    analysisById.addMethod(
      "GET",
      new apigateway.LambdaIntegration(analyzeFn),
      authMethodOptions
    );
    analysisById.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(analyzeFn),
      authMethodOptions
    );
    analysisById.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(analyzeFn),
      authMethodOptions
    );

    const analysisStatus = analysisById.addResource("status");
    analysisStatus.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(analyzeFn),
      authMethodOptions
    );

    // --- API Routes: /lookup ---
    const lookup = this.api.root.addResource("lookup");
    lookup.addMethod(
      "POST",
      new apigateway.LambdaIntegration(lookupFn),
      authMethodOptions
    );

    // --- API Routes: /data ---
    const data = this.api.root.addResource("data");

    const mortgageRate = data.addResource("mortgage-rate");
    mortgageRate.addMethod(
      "GET",
      new apigateway.LambdaIntegration(dataFetchFn),
      authMethodOptions
    );

    const fairMarketRent = data.addResource("fair-market-rent");
    fairMarketRent.addMethod(
      "GET",
      new apigateway.LambdaIntegration(dataFetchFn),
      authMethodOptions
    );

    const demographics = data.addResource("demographics");
    demographics.addMethod(
      "GET",
      new apigateway.LambdaIntegration(dataFetchFn),
      authMethodOptions
    );

    const floodZone = data.addResource("flood-zone");
    floodZone.addMethod(
      "GET",
      new apigateway.LambdaIntegration(dataFetchFn),
      authMethodOptions
    );

    const unemployment = data.addResource("unemployment");
    unemployment.addMethod(
      "GET",
      new apigateway.LambdaIntegration(dataFetchFn),
      authMethodOptions
    );

    // --- API Routes: /upload-url ---
    const uploadUrl = this.api.root.addResource("upload-url");
    uploadUrl.addMethod(
      "POST",
      new apigateway.LambdaIntegration(uploadUrlFn),
      authMethodOptions
    );

    // --- API Routes: /extract ---
    const extract = this.api.root.addResource("extract");
    extract.addMethod(
      "POST",
      new apigateway.LambdaIntegration(extractFn),
      authMethodOptions
    );

    // --- Outputs ---
    new CfnOutput(this, "ApiUrl", {
      value: this.api.url,
      exportName: `dealscope-${stage}-api-url`,
    });

    new CfnOutput(this, "ApiId", {
      value: this.api.restApiId,
      exportName: `dealscope-${stage}-api-id`,
    });
  }
}
