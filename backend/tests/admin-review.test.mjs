import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { createServer } from "node:net";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import pg from "pg";
import express from "express";
import jwt from "jsonwebtoken";

// Run after npm run build. Only an in-memory database and loopback HTTP are used.
test("admin feedback migration, mobile compatibility, authorization and UTC reports", async t => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    SET TIME ZONE 'UTC';
    CREATE TABLE profiles (profile_id uuid PRIMARY KEY, email text, role text, first_name text, last_name text);
    CREATE TABLE feedback (feedback_id uuid PRIMARY KEY DEFAULT gen_random_uuid(), profile_id uuid REFERENCES profiles,
      email text NOT NULL, title text, subject text, message text NOT NULL, updated_at timestamptz DEFAULT now(), created_at timestamptz DEFAULT now());
    CREATE TABLE cats (cat_id uuid PRIMARY KEY, profile_id uuid REFERENCES profiles, name text);
    CREATE TABLE emotion_categories (emotion_id uuid PRIMARY KEY, emotion_name text);
    CREATE TABLE emotion_detections (detection_id uuid PRIMARY KEY DEFAULT gen_random_uuid(), detected_at timestamptz,
      cat_id uuid REFERENCES cats, emotion_id uuid REFERENCES emotion_categories, confidence_score numeric);
    INSERT INTO feedback(email,message) VALUES ('old@example.test','original');
  `);
  const original = (await db.query("SELECT * FROM feedback")).rows[0];
  await db.exec(await readFile(new URL("../prisma/sql/add_feedback_review_status.sql", import.meta.url), "utf8"));
  assert.deepEqual((await db.query("SELECT * FROM feedback")).rows[0], {...original, review_status:"New"});
  await assert.rejects(db.exec("UPDATE feedback SET review_status='invalid'"));
  const admin = randomUUID(), user = randomUUID(), cat = randomUUID(), emotion = randomUUID();
  await db.query("INSERT INTO profiles(profile_id,email,role) VALUES ($1,'admin@example.test','admin'),($2,'user@example.test','user')",[admin,user]);
  await db.query("INSERT INTO cats VALUES ($1,$2,'Milo')",[cat,user]);
  await db.query("INSERT INTO emotion_categories VALUES ($1,'Happy')",[emotion]);
  for (const timestamp of ["2026-11-01T23:59:59Z","2026-11-02T00:00:00Z","2026-11-02T23:59:59.999999Z","2026-11-03T00:00:00Z"])
    await db.query("INSERT INTO emotion_detections(cat_id,emotion_id,detected_at,confidence_score) VALUES ($1,$2,$3::text::timestamptz,0.8)",[cat,emotion,timestamp]);

  const probe = createServer().listen(0,"127.0.0.1");
  await once(probe,"listening");
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const socket = new PGLiteSocketServer({db,host:"127.0.0.1",port});
  await socket.start();
  process.env.DATABASE_URL = `postgresql://postgres@127.0.0.1:${port}/postgres?sslmode=disable`;
  process.env.JWT_SECRET = randomUUID();
  // PGlite only supports one database session. Serialize Prisma relation reads in this test.
  t.mock.method(pg, "Pool", class extends pg.Pool {
    constructor(options) { super({ ...options, max: 1 }); }
  });
  const {default: prisma} = await import("../dist/config/db.config.js");
  const app = express();
  app.use(express.json());
  app.use("/api/admin",(await import("../dist/routes/admin.routes.js")).default);
  app.use("/api/feedback",(await import("../dist/routes/feedback.routes.js")).default);
  const server = app.listen(0,"127.0.0.1");
  await once(server,"listening");
  const request = (path, profileId, method="GET", body) => fetch(
    `http://127.0.0.1:${server.address().port}/api/${path}`,{
      method, headers:{"Content-Type":"application/json", ...(profileId && {Authorization:"Bearer "+jwt.sign({profileId},process.env.JWT_SECRET)})},
      body:JSON.stringify(body)
    });
  try {
    const created = await request("feedback",user,"POST",{title:"Camera",subject:"Bug Report",message:"Example"});
    assert.equal(created.status,201);
    const id = (await created.json()).data.feedback_id;
    const path = "admin/feedback/"+id+"/status";
    const patch = (who, status) => request(path,who,"PATCH",{review_status:status});
    assert.equal((await patch(null,"Resolved")).status,401);
    assert.equal((await patch(user,"Resolved")).status,403);
    assert.equal((await patch(admin,"invalid")).status,400);
    const list = async () => (await (await request("admin/feedback",admin)).json()).data;
    assert.equal((await list()).find(row=>row.feedback_id===id).review_status,"New");
    for(const value of ["In review","Resolved"]){
      assert.equal((await patch(admin,value)).status,200);
      assert.equal((await list()).find(row=>row.feedback_id===id).review_status,value);
    }
    for(const [query,count] of [["",4],["?start=2026-11-02",3],["?end=2026-11-02",3],["?start=2026-11-02&end=2026-11-02",2],["?start=2027-01-01",0]]){
      const detections = await (await request("admin/detections"+query,admin)).json();
      const analytics = await (await request("admin/analytics"+query,admin)).json();
      assert.equal(detections.data.length,count,query + " " + JSON.stringify(detections.data.map(row=>row.detected_at)));
      assert.equal(analytics.data.totalDetections,count);
      assert.equal(analytics.data.averageConfidence,count ? 80 : null);
      assert.equal(analytics.data.dailyTrends.reduce((n,row)=>n+row.count,0),count);
    }
    for(const route of ["detections","analytics"])
      for(const query of ["?start=2026-02-30","?start=2026-11-03&end=2026-11-02","?end=a&end=b"])
        assert.equal((await request("admin/"+route+query,admin)).status,400);
  } finally {
    await new Promise(resolve=>server.close(resolve));
    await prisma.$disconnect();
    await socket.stop();
  }
});
