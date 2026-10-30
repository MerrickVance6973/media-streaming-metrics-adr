import assert from "node:assert/strict";
import { deliveryDecision, deliveryRequest } from "./streaming_metrics.ts";

const processed = deliveryRequest.parse({ assetId: "a-17", creatorId: "c-4", durationSeconds: 120, deliveredBytes: 5000, processingState: "processed" });
assert.deepEqual(deliveryDecision(processed), { ready: true, delivery: "deliver", reason: "asset processed" });
const queued = { ...processed, processingState: "queued" as const };
assert.equal(deliveryDecision(queued).delivery, "hold");
assert.throws(() => deliveryRequest.parse({ ...processed, durationSeconds: 0 }));
console.log("streaming delivery decision: ok");
