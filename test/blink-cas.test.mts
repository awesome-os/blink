import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_CAS_BASE_URL,
  auditBlinkCasShards,
  loadBlinkGnOverlay,
} from "../src/index.mts";

const CORE_C_SHARDS = [
  "libbrotli",
  "libwebp",
  "libexpat",
  "libsqlite3",
  "liblz4",
  "libsectium_display",
] as const;

describe("@awesome-os/blink cas-v1 shard resolution", () => {
  it("resolves all live core C shards, b8g-ghost-abi, and V8 from awesome-os/b8g-ghost @ cas-v1", async () => {
    const report = await auditBlinkCasShards();

    assert.equal(report.schema, "b8g-ghost-cas-index-v1");
    assert.equal(report.casBaseUrl, DEFAULT_CAS_BASE_URL);
    assert.ok(report.totalIndexEntries > 0, "cas-v1 index must not be empty");
    assert.equal(report.allCoreResolved, true, "All required cas-v1 shards must resolve");

    const byId = new Map(report.shards.map((shard) => [shard.id, shard]));

    for (const shardId of CORE_C_SHARDS) {
      const shard = byId.get(shardId);
      assert.ok(shard, `Missing audit entry for ${shardId}`);
      assert.equal(shard.status, "resolved", `${shardId} must resolve in cas-v1`);
      assert.ok(shard.matchedCount > 0, `${shardId} must have at least one artifact`);
      assert.ok(shard.totalBytes > 0, `${shardId} must have non-zero byte size`);
      for (const artifact of shard.artifacts) {
        assert.match(artifact.sha256, /^[0-9a-f]{64}$/);
        assert.ok(
          artifact.download_url.startsWith(DEFAULT_CAS_BASE_URL),
          `${artifact.filename} must point to cas-v1 release`,
        );
      }
    }

    const abiShard = byId.get("b8g-ghost-abi");
    assert.ok(abiShard);
    assert.equal(abiShard.status, "resolved");
    assert.ok(abiShard.matchedCount >= 4, "b8g-ghost-abi must cover 4 host targets");

    assert.equal(report.engineStatus.v8, "resolved", "Shared V8 shard must resolve in cas-v1");
    assert.ok(
      report.engineStatus.skia === "resolved" || report.engineStatus.skia === "pending-shard",
      "Skia status must be audited",
    );
    assert.ok(
      report.engineStatus.dawn === "resolved" || report.engineStatus.dawn === "pending-shard",
      "Dawn status must be audited",
    );
  });

  it("validates config/blink-component-cas.gn component overlay flags", async () => {
    const overlay = await loadBlinkGnOverlay();

    assert.equal(overlay.flags["is_component_build"], true);
    assert.equal(overlay.flags["v8_use_external_startup_data"], true);
    assert.equal(overlay.flags["use_system_libbrotli"], true);
    assert.equal(overlay.flags["use_system_libwebp"], true);
    assert.equal(overlay.flags["use_system_expat"], true);
    assert.equal(overlay.flags["use_v8_cas_shard"], true);
    assert.equal(overlay.flags["use_skia_cas_shard"], true);
    assert.equal(overlay.flags["use_dawn_cas_shard"], true);
    assert.equal(overlay.flags["use_sectium_display_shard"], true);
    assert.equal(overlay.flags["b8g_ghost_cas_tag"], "cas-v1");
    assert.equal(overlay.flags["b8g_ghost_cas_repo"], "awesome-os/b8g-ghost");
  });
});
