/**
 * Prompt templates for document extraction via Claude API.
 * Each document type has a specialized prompt targeting the fields we need.
 */

import type { DocumentType } from "@dealscope/core";

const OM_PROMPT = `You are a commercial real estate document extraction assistant. Analyze this Offering Memorandum and extract the following fields as structured JSON.

Extract these fields (use null if not found):

{
  "property": {
    "address": { "street": "", "city": "", "state": "", "zip": "" },
    "type": "multifamily|retail|office|industrial|mixed",
    "units": <number>,
    "buildingSqft": <number>,
    "lotSqft": <number or null>,
    "yearBuilt": <number>,
    "askingPrice": <number>,
    "parkingSpaces": <number or null>
  },
  "financing": {
    "assumedRate": <number or null>,
    "assumedDownPayment": <number or null>
  },
  "income": {
    "grossPotentialRent": <annual number>,
    "otherIncome": <annual number>,
    "vacancyRate": <decimal, e.g. 0.05>,
    "effectiveGrossIncome": <annual number>
  },
  "expenses": {
    "propertyTax": <annual number>,
    "insurance": <annual number>,
    "utilities": <annual number>,
    "management": <annual number>,
    "maintenance": <annual number>,
    "total": <annual number>
  },
  "noi": <annual number>,
  "capRate": <decimal, e.g. 0.065>,
  "units_detail": [
    { "unitNumber": "", "beds": <n>, "baths": <n>, "sqft": <n>, "rent": <monthly> }
  ]
}

For each field, also provide a confidence score (0-1) and the page/section where you found it.

Return your response as JSON with this structure:
{
  "fields": [
    { "fieldPath": "property.units", "label": "Number of Units", "value": <val>, "confidence": <0-1>, "sourceLocation": "Page X, Section Y" }
  ],
  "assembled": { <the nested structure above> },
  "warnings": ["any notes about inconsistencies or missing data"]
}`;

const RENT_ROLL_PROMPT = `You are a commercial real estate document extraction assistant. Analyze this Rent Roll and extract all unit-level data as structured JSON.

Extract:
{
  "units": [
    {
      "unitNumber": "",
      "beds": <number>,
      "baths": <number>,
      "sqft": <number>,
      "currentRent": <monthly number>,
      "marketRent": <monthly number or null>,
      "status": "occupied|vacant|down",
      "leaseExpiration": "YYYY-MM-DD or null",
      "tenantType": "market|section8|corporate or null"
    }
  ],
  "otherIncome": {
    "laundry": <monthly>,
    "parking": <monthly>,
    "storage": <monthly>,
    "petFees": <monthly>,
    "utilityPassThrough": { "perUnit": <monthly>, "unitsParticipating": <n> }
  },
  "summary": {
    "totalUnits": <n>,
    "occupiedUnits": <n>,
    "averageRent": <monthly>,
    "grossPotentialRent": <monthly or annual — specify which>
  }
}

For each extracted value, provide a confidence score (0-1).

Return as JSON:
{
  "fields": [ { "fieldPath": "...", "label": "...", "value": <val>, "confidence": <0-1>, "sourceLocation": "..." } ],
  "assembled": { <above structure> },
  "warnings": []
}`;

const T12_PROMPT = `You are a commercial real estate document extraction assistant. Analyze this Trailing 12-Month (T12) operating statement and extract income and expense line items.

Extract:
{
  "income": {
    "grossPotentialRent": <annual>,
    "vacancyLoss": <annual>,
    "otherIncome": <annual>,
    "effectiveGrossIncome": <annual>
  },
  "expenses": {
    "propertyTax": <annual>,
    "insurance": <annual>,
    "gas": <annual>,
    "water": <annual>,
    "sewer": <annual>,
    "trash": <annual>,
    "electric": <annual>,
    "management": <annual>,
    "maintenance": <annual>,
    "capex": <annual>,
    "landscaping": <annual>,
    "legal": <annual>,
    "advertising": <annual>,
    "total": <annual>
  },
  "noi": <annual>,
  "managementPercent": <percentage, e.g. 8>,
  "expenseRatio": <percentage, e.g. 50>
}

For each value, provide confidence (0-1) and source location.

Return as JSON:
{
  "fields": [ { "fieldPath": "...", "label": "...", "value": <val>, "confidence": <0-1>, "sourceLocation": "..." } ],
  "assembled": { <above structure> },
  "warnings": ["any notes about inconsistencies"]
}`;

export const EXTRACTION_PROMPTS: Record<DocumentType, string> = {
  offering_memorandum: OM_PROMPT,
  rent_roll: RENT_ROLL_PROMPT,
  trailing_12: T12_PROMPT,
};
