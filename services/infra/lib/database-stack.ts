import { Stack, StackProps, RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

interface DatabaseStackProps extends StackProps {
  stage: string;
}

export class DatabaseStack extends Stack {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { stage } = props;

    // --- Single-Table Design ---
    // PK/SK patterns:
    //   USER#<userId>                    / PROFILE                           -> user profile
    //   USER#<userId>                    / ANALYSIS#<analysisId>             -> analysis record
    //   USER#<userId>                    / ANALYSIS#<analysisId>#NOTE#<ts>   -> analysis note
    //   ANALYSIS#<analysisId>            / METADATA                          -> analysis metadata
    //   CACHE#MORTGAGE_RATE              / <date>                            -> cached mortgage rate
    //   CACHE#FMR#<zip>                  / <date>                            -> cached fair market rent
    //   CACHE#DEMOGRAPHICS#<zip>         / <date>                            -> cached demographics
    //   CACHE#FLOOD#<lat>#<lng>          / <date>                            -> cached flood zone
    //
    // GSI-1 (ByStatus):
    //   GSI1PK: USER#<userId>            / GSI1SK: STATUS#<status>#<createdAt>
    //   Enables: "Get all analyses for user X with status Y, sorted by date"

    this.table = new dynamodb.Table(this, "MainTable", {
      tableName: `dealscope-main-${stage}`,
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "ttl",
      pointInTimeRecovery: stage === "prod",
      removalPolicy:
        stage === "prod" ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });

    // GSI-1: Query analyses by status
    this.table.addGlobalSecondaryIndex({
      indexName: "GSI1-ByStatus",
      partitionKey: { name: "GSI1PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GSI1SK", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // --- Outputs ---
    new CfnOutput(this, "TableName", {
      value: this.table.tableName,
      exportName: `dealscope-${stage}-table-name`,
    });

    new CfnOutput(this, "TableArn", {
      value: this.table.tableArn,
      exportName: `dealscope-${stage}-table-arn`,
    });
  }
}
