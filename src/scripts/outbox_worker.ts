/**
 * Outbox worker (simple, polling-based)
 * This worker reads unpublished outbox rows, publishes them
 * (e.g., to Kafka, RabbitMQ, HTTP), then marks published = true +
 * published_at.
 */

import Outbox from "../models/outbox.ts";

async function publishEvent(outboxRow: any) {
  // TODO: replace with your publisher (kafka/rabbit/http)
  // Example:
  // await kafkaProducer.send({ topic: 'transactions', messages: [{ value: JSON.stringify(outboxRow.payload) }]});
  console.log(
    "Publishing event:",
    outboxRow.event_type,
    outboxRow.aggregate_id
  );
}

export async function processOutboxBatch(batchSize = 50) {
  // Find unpublished rows (small batch) and try to publish them
  const rows = await Outbox.findAll({
    where: { published: false },
    limit: batchSize,
    order: [["created_at", "ASC"]]
  });

  for (const row of rows) {
    try {
      await publishEvent(row.payload);
      // Mark published
      row.published = true;
      row.published_at = new Date();
      await row.save();
    } catch (err) {
      console.error("Failed publishing outbox row", row.id, err);
      // leave as unpublished for retry later
    }
  }
}

// Sample polling loop (run in separate process)
export async function runLoop(intervalMs = 1000) {
  while (true) {
    try {
      await processOutboxBatch(100);
    } catch (e) {
      console.error("Outbox worker error:", e);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
