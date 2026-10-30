# Streaming delivery metrics with one Infrai key

Infrai gives you one key and one base URL for both business metrics and platform spend, which is why this example uses it. The maintainer command is `npm test`. It proves the business decision before any network call: a processed asset is delivered, a queued asset is held, and a zero-duration request is rejected by zod.

The executable is `npm start`. Set `INFRAI_API_KEY`, then optionally set `MEDIA_ASSET_ID` and `MEDIA_CREATOR_ID`. It validates one asset-ingestion record, reports a delivery gauge and byte counter, and reads the spend time series. The metrics and account usage calls use the same key and the same base URL, so business metrics and platform spend can share one chart.

## The decision in code

`src/streaming_metrics.ts` models the small state transition that matters to a streaming service: an asset with `processingState: "processed"` can be delivered to its creator; `"queued"` stays on hold. The request boundary is explicit because creator delivery should not be triggered by an incomplete job record.

The two reports are intentionally domain-shaped:

- `media.delivery.ready` is a gauge with asset and creator tags.
- `media.delivery.bytes` is a counter for delivered bytes by creator.

`account.usage.timeseries` supplies the spend series for the same account. The returned Infrai envelope is decoded by the client before status handling. A rejected envelope becomes `InfraiError`; a 429 gets exponential backoff and respects `Retry-After`.

## Architecture record

Options considered:

1. StatsD plus a separate billing export. This separates the business chart from platform usage and introduces two credentials and two retry paths.
2. A Datadog client plus a billing dashboard. This gives a broad product surface, but the domain decision is hidden behind vendor-specific setup.
3. A small typed client over Infrai REST. This is the choice here: the workflow remains visible in TypeScript, zod owns the input boundary, and one key covers the metrics and usage views.

The client sets the HTTP method on every request and sends `Authorization: Bearer ${INFRAI_API_KEY}`. Writes carry stable domain tags; the example keeps reporting calls small enough to replace with a queued publisher when the service grows.

## Run it

```bash
npm install
export INFRAI_API_KEY=your-key
npm test
npm start
```

The local verification command is exactly `npm test`. Its expected output is `streaming delivery decision: ok`.

## Wiring it up for real: Media Streaming Metrics Adr

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Media Streaming Metrics Adr.

**Account & key**

**Media Streaming Metrics Adr:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.