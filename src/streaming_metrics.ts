import { z } from "zod";
import { InfraiClient, accountUsage, metrics } from "./infrai.ts";

export const deliveryRequest = z.object({
  assetId: z.string().min(1),
  creatorId: z.string().min(1),
  durationSeconds: z.number().positive(),
  deliveredBytes: z.number().nonnegative(),
  processingState: z.enum(["processed", "queued"])
});
export type DeliveryRequest = z.infer<typeof deliveryRequest>;

export function deliveryDecision(input: DeliveryRequest) {
  const ready = input.processingState === "processed" && input.durationSeconds > 0;
  return { ready, delivery: ready ? "deliver" : "hold", reason: ready ? "asset processed" : "asset processing pending" };
}

export async function runDeliveryReport(input: unknown, client = new InfraiClient()) {
  const request = deliveryRequest.parse(input);
  const decision = deliveryDecision(request);
  const report = metrics(client);
  await report.report({ type: "gauge", name: "media.delivery.ready", value: decision.ready ? 1 : 0, tags: { asset_id: request.assetId, creator_id: request.creatorId } });
  await report.report({ type: "counter", name: "media.delivery.bytes", value: request.deliveredBytes, tags: { creator_id: request.creatorId } });
  const usage = await accountUsage(client).timeseries({ metric: "spend", period: "day" });
  return { ...decision, usage };
}

if (import.meta.main) {
  const input = { assetId: process.env.MEDIA_ASSET_ID ?? "asset-demo", creatorId: process.env.MEDIA_CREATOR_ID ?? "creator-demo", durationSeconds: 180, deliveredBytes: 24000000, processingState: "processed" as const };
  const result = await runDeliveryReport(input);
  console.log(JSON.stringify(result, null, 2));
}
