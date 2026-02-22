/**
 * DynamoDB client helpers for the dealscope-main table.
 * Single-table design with PK/SK pattern.
 */

import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  DeleteItemCommand,
  QueryCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const TABLE_NAME = process.env.TABLE_NAME ?? "dealscope-main";
const client = new DynamoDBClient({});

export async function putItem(item: Record<string, unknown>): Promise<void> {
  await client.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall(item, { removeUndefinedValues: true }),
    })
  );
}

export async function getItem(
  pk: string,
  sk: string
): Promise<Record<string, unknown> | null> {
  const result = await client.send(
    new GetItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ PK: pk, SK: sk }),
    })
  );
  return result.Item ? unmarshall(result.Item) : null;
}

export async function deleteItem(pk: string, sk: string): Promise<void> {
  await client.send(
    new DeleteItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ PK: pk, SK: sk }),
    })
  );
}

export async function queryByPK(
  pk: string,
  skPrefix?: string,
  limit?: number
): Promise<Record<string, unknown>[]> {
  const keyCondition = skPrefix
    ? "PK = :pk AND begins_with(SK, :skPrefix)"
    : "PK = :pk";

  const exprValues: Record<string, unknown> = { ":pk": pk };
  if (skPrefix) exprValues[":skPrefix"] = skPrefix;

  const result = await client.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: keyCondition,
      ExpressionAttributeValues: marshall(exprValues),
      ScanIndexForward: false,
      ...(limit ? { Limit: limit } : {}),
    })
  );

  return (result.Items ?? []).map((item) => unmarshall(item));
}

export async function updateStatus(
  pk: string,
  sk: string,
  status: string
): Promise<void> {
  await client.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ PK: pk, SK: sk }),
      UpdateExpression: "SET #status = :status, updatedAt = :now",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: marshall({
        ":status": status,
        ":now": new Date().toISOString(),
      }),
    })
  );
}
