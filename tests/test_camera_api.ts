/**
 * Integration Test for SmartRoom AI Camera API (Milestone 1)
 */
import assert from 'assert';
import http from 'http';

async function testCameraApi() {
  console.log('[Test] Running SmartRoom AI Camera API Integration Tests...');

  // 1. Test status endpoint
  const statusRes = await fetch('http://localhost:3000/api/camera/status');
  assert.strictEqual(statusRes.status, 200, 'Status endpoint should return HTTP 200');
  const status = await statusRes.json();
  console.log('  ✓ /api/camera/status returned:', status);
  assert.strictEqual(typeof status.connected, 'boolean', 'connected must be boolean');
  assert.strictEqual(typeof status.fps, 'number', 'fps must be number');

  // 2. Test system status endpoint
  const sysRes = await fetch('http://localhost:3000/api/system/status');
  assert.strictEqual(sysRes.status, 200, 'System status should return HTTP 200');
  const sysData = await sysRes.json();
  console.log('  ✓ /api/system/status returned:', sysData);
  assert.strictEqual(sysData.camera, 'connected', 'Camera status must be connected');

  // 3. Test config update
  const configRes = await fetch('http://localhost:3000/api/camera/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetFps: 20 }),
  });
  assert.strictEqual(configRes.status, 200, 'Config update should return HTTP 200');
  const configData = await configRes.json();
  console.log('  ✓ /api/camera/config update succeeded:', configData.status.targetFps);
  assert.strictEqual(configData.status.targetFps, 20, 'Target FPS should be updated to 20');

  // 4. Test frame snapshot
  const frameRes = await fetch('http://localhost:3000/api/camera/frame');
  assert.strictEqual(frameRes.status, 200, 'Frame snapshot should return HTTP 200');
  const frameText = await frameRes.text();
  assert(frameText.length > 50, 'Frame buffer must be non-empty');
  console.log('  ✓ /api/camera/frame snapshot delivered successfully, bytes:', frameText.length);

  console.log('🎉 All SmartRoom AI Camera API integration tests PASSED successfully!');
}

testCameraApi().catch((err) => {
  console.error('❌ Integration test failed:', err);
  process.exit(1);
});
