import { Stack, StackProps, RemovalPolicy, Duration, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";

interface StorageStackProps extends StackProps {
  stage: string;
}

export class StorageStack extends Stack {
  public readonly uploadsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const { stage } = props;

    // --- S3 Bucket for PDFs and uploads ---
    this.uploadsBucket = new s3.Bucket(this, "UploadsBucket", {
      bucketName: `dealscope-uploads-${stage}-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: false,
      removalPolicy:
        stage === "prod" ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      autoDeleteObjects: stage !== "prod",
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
          exposedHeaders: ["ETag"],
          maxAge: 3600,
        },
      ],
      lifecycleRules: [
        {
          id: "delete-after-90-days",
          expiration: Duration.days(90),
          enabled: true,
        },
        {
          id: "abort-incomplete-uploads",
          abortIncompleteMultipartUploadAfter: Duration.days(1),
          enabled: true,
        },
      ],
    });

    // --- Outputs ---
    new CfnOutput(this, "UploadsBucketName", {
      value: this.uploadsBucket.bucketName,
      exportName: `dealscope-${stage}-uploads-bucket-name`,
    });

    new CfnOutput(this, "UploadsBucketArn", {
      value: this.uploadsBucket.bucketArn,
      exportName: `dealscope-${stage}-uploads-bucket-arn`,
    });
  }
}
