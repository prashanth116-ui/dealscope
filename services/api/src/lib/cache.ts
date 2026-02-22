/**
 * DynamoDB cache layer — get/set with TTL.
 * Uses the single-table design with PK=CACHE#{type}, SK={key}.
 */

import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const TABLE_NAME = process.env.TABLE_NAME ?? "dealscope-main";
const client = new DynamoDBClient({});

export async function getCached<T>(type: string, key: string): Promise<T | null> {
  try {
    const result = await client.send(
      new GetItemCommand({
        TableName: TABLE_NAME,
        Key: marshall({
          PK: `CACHE#${type}`,
          SK: key,
        }),
      })
    );

    if (!result.Item) return null;

    const item = unmarshall(result.Item);

    // Check TTL expiry (DynamoDB TTL is eventual — double-check here)
    if (item.ttl && item.ttl < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return item.data as T;
  } catch {
    return null;
  }
}

export async function setCache<T>(
  type: string,
  key: string,
  data: T,
  ttlDays: number
): Promise<void> {
  const ttl = Math.floor(Date.now() / 1000) + ttlDays * 86400;

  try {
    await client.send(
      new PutItemCommand({
        TableName: TABLE_NAME,
        Item: marshall(
          {
            PK: `CACHE#${type}`,
            SK: key,
            data,
            ttl,
            cachedAt: new Date().toISOString(),
          },
          { removeUndefinedValues: true }
        ),
      })
    );
  } catch (err) {
    console.error("Cache write error:", err);
  }
}
