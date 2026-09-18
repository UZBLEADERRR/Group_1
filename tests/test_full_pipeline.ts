/**
 * End-to-End Pipeline Integration Test for SmartRoom AI
 * Tests all 7 Physical AI Milestones:
 * 1. Camera Stream & Health
 * 2. Object Detection
 * 3. Persistent Tracking (obj_001, etc.)
 * 4. Temporal Memory & Events
 * 5. Dynamic Scene Graph
 * 6. Natural Language Query Engine
 * 7. Metric Geometric Grounding & Verification
 */
import assert from 'assert';

async function testFullPipeline() {
  console.log('🚀 Running SmartRoom AI Full Pipeline End-to-End Tests...\n');

  // Milestone 1: Camera Status
  const camRes = await fetch('http://localhost:3000/api/camera/status');
  assert.strictEqual(camRes.status, 200);
  const camData = await camRes.json();
  console.log('✓ Milestone 1 [Camera]: Connected =', camData.connected, 'FPS =', camData.fps);

  // Milestone 2 & 3: Object Detection & Persistent Tracking
  const objRes = await fetch('http://localhost:3000/api/objects');
  assert.strictEqual(objRes.status, 200);
  const objData = await objRes.json();
  console.log(`✓ Milestone 2 & 3 [Detection & Tracking]: Found ${objData.count} objects`);
  assert(objData.count >= 4, 'Should detect at least 4 objects in miniature room');
  const laptop = objData.objects.find((o: any) => o.name === 'laptop');
  assert(laptop, 'Laptop object must exist');
  assert(laptop.id.startsWith('obj_'), 'Objects must have persistent IDs like obj_001');

  // Milestone 4: Temporal Memory & Movement
  console.log('✓ Testing Movement & Temporal Memory...');
  const moveRes = await fetch(`http://localhost:3000/api/objects/${laptop.id}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ x: 0.42, y: 0.38 }),
  });
  assert.strictEqual(moveRes.status, 200);

  const evtsRes = await fetch('http://localhost:3000/api/events');
  const evtsData = await evtsRes.json();
  assert(evtsData.events.length > 0, 'Events log must record object movements');
  console.log(`✓ Milestone 4 [Memory]: Logged ${evtsData.events.length} temporal events`);

  // Milestone 5: Scene Graph
  const sgRes = await fetch('http://localhost:3000/api/scene-graph');
  const sgData = await sgRes.json();
  console.log(`✓ Milestone 5 [Scene Graph]: Computed ${sgData.edges.length} spatial relationships`);
  assert(sgData.edges.length > 0, 'Scene graph must have relational edges');

  // Milestone 6 & 7: Natural Language Query & Geometric Verification
  const queryRes = await fetch('http://localhost:3000/api/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'Which chair is closest to the laptop?' }),
  });
  assert.strictEqual(queryRes.status, 200);
  const queryData = await queryRes.json();
  console.log('✓ Milestone 6 & 7 [Query & Geometric Verification]:');
  console.log('   Question:', queryData.question);
  console.log('   Answer:', queryData.answer);
  console.log('   Formula Rule:', queryData.groundingDetails.rule);
  console.log('   Metric Calculated:', queryData.groundingDetails.calculatedMetric);
  assert(queryData.verified === true, 'Answer must be geometrically verified');
  assert(queryData.confidence > 0.8, 'Confidence must be high');

  console.log('\n🎉 ALL 7 PHYSICAL AI MILESTONES VERIFIED & PASSING SUCCESSFULLY!');
}

testFullPipeline().catch((err) => {
  console.error('❌ Pipeline test failed:', err);
  process.exit(1);
});
