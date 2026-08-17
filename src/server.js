import "dotenv/config";
import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import { connectDB } from "./db.js";
import { requireJwt, requireSameEmail } from "./auth.js";
import { verifyFirebaseToken } from "./firebaseAdmin.js";
import { cleanIdea, escapeRegex, oid } from "./helpers.js";

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "IdeaVault server is running" });
});

app.post("/jwt", async (req, res) => {
  try {
    const firebaseToken = String(req.body.firebaseToken || "");
    if (!firebaseToken) return res.status(400).json({ message: "Firebase token is required" });
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is missing");

    const decoded = await verifyFirebaseToken(firebaseToken);
    const token = jwt.sign(
      { email: decoded.email, uid: decoded.uid },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token });
  } catch (error) {
    res.status(401).json({ message: error.message || "Could not create JWT" });
  }
});

app.post("/users", requireJwt, async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email || email !== req.auth.email?.toLowerCase()) {
      return res.status(403).json({ message: "Account mismatch" });
    }

    const db = await connectDB();
    await db.collection("users").updateOne(
      { email },
      {
        $set: {
          name: String(req.body.name || "IdeaVault User").trim(),
          photoURL: String(req.body.photoURL || "").trim(),
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch("/users/:email", requireJwt, requireSameEmail, async (req, res) => {
  try {
    const db = await connectDB();
    await db.collection("users").updateOne(
      { email: req.params.email.toLowerCase() },
      {
        $set: {
          name: String(req.body.name || "").trim(),
          photoURL: String(req.body.photoURL || "").trim(),
          updatedAt: new Date(),
        },
      }
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/ideas/trending", async (req, res) => {
  try {
    const db = await connectDB();
    const ideas = await db.collection("ideas").aggregate([
      { $sort: { createdAt: -1 } },
      { $limit: 6 },
    ]).toArray();
    res.json(ideas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/ideas", async (req, res) => {
  try {
    const filter = {};
    const search = String(req.query.search || "").trim();
    const category = String(req.query.category || "").trim();

    if (search) {
      filter.title = { $regex: escapeRegex(search), $options: "i" };
    }
    if (category) {
      filter.category = category;
    }

    const db = await connectDB();
    const ideas = await db.collection("ideas").find(filter).sort({ createdAt: -1 }).toArray();
    res.json(ideas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/ideas/user/:email", requireJwt, requireSameEmail, async (req, res) => {
  try {
    const db = await connectDB();
    const ideas = await db.collection("ideas")
      .find({ creatorEmail: req.params.email.toLowerCase() })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(ideas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/ideas", requireJwt, async (req, res) => {
  try {
    const idea = cleanIdea(req.body);
    const db = await connectDB();
    const user = await db.collection("users").findOne({ email: req.auth.email.toLowerCase() });

    const document = {
      ...idea,
      creatorEmail: req.auth.email.toLowerCase(),
      creatorName: user?.name || "IdeaVault User",
      creatorPhoto: user?.photoURL || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("ideas").insertOne(document);
    res.status(201).json({ insertedId: result.insertedId });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/ideas/:id", requireJwt, async (req, res) => {
  try {
    const _id = oid(req.params.id);
    if (!_id) return res.status(400).json({ message: "Invalid idea id" });

    const db = await connectDB();
    const idea = await db.collection("ideas").findOne({ _id });
    if (!idea) return res.status(404).json({ message: "Idea not found" });
    res.json(idea);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch("/ideas/:id", requireJwt, async (req, res) => {
  try {
    const _id = oid(req.params.id);
    if (!_id) return res.status(400).json({ message: "Invalid idea id" });

    const db = await connectDB();
    const existing = await db.collection("ideas").findOne({ _id });
    if (!existing) return res.status(404).json({ message: "Idea not found" });
    if (existing.creatorEmail !== req.auth.email.toLowerCase()) {
      return res.status(403).json({ message: "Only the creator can update this idea" });
    }

    const update = cleanIdea(req.body);
    await db.collection("ideas").updateOne(
      { _id },
      { $set: { ...update, updatedAt: new Date() } }
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete("/ideas/:id", requireJwt, async (req, res) => {
  try {
    const _id = oid(req.params.id);
    if (!_id) return res.status(400).json({ message: "Invalid idea id" });

    const db = await connectDB();
    const existing = await db.collection("ideas").findOne({ _id });
    if (!existing) return res.status(404).json({ message: "Idea not found" });
    if (existing.creatorEmail !== req.auth.email.toLowerCase()) {
      return res.status(403).json({ message: "Only the creator can delete this idea" });
    }

    await Promise.all([
      db.collection("ideas").deleteOne({ _id }),
      db.collection("comments").deleteMany({ ideaId: _id }),
    ]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/comments/idea/:ideaId", requireJwt, async (req, res) => {
  try {
    const ideaId = oid(req.params.ideaId);
    if (!ideaId) return res.status(400).json({ message: "Invalid idea id" });

    const db = await connectDB();
    const comments = await db.collection("comments")
      .find({ ideaId })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/comments", requireJwt, async (req, res) => {
  try {
    const ideaId = oid(req.body.ideaId);
    const text = String(req.body.text || "").trim();
    if (!ideaId || !text) return res.status(400).json({ message: "Idea and comment text are required" });

    const db = await connectDB();
    const idea = await db.collection("ideas").findOne({ _id: ideaId });
    if (!idea) return res.status(404).json({ message: "Idea not found" });

    const user = await db.collection("users").findOne({ email: req.auth.email.toLowerCase() });
    const result = await db.collection("comments").insertOne({
      ideaId,
      userEmail: req.auth.email.toLowerCase(),
      userName: user?.name || "IdeaVault User",
      text,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    res.status(201).json({ insertedId: result.insertedId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch("/comments/:id", requireJwt, async (req, res) => {
  try {
    const _id = oid(req.params.id);
    const text = String(req.body.text || "").trim();
    if (!_id || !text) return res.status(400).json({ message: "Valid comment id and text are required" });

    const db = await connectDB();
    const comment = await db.collection("comments").findOne({ _id });
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.userEmail !== req.auth.email.toLowerCase()) {
      return res.status(403).json({ message: "You can edit only your own comment" });
    }

    await db.collection("comments").updateOne(
      { _id },
      { $set: { text, updatedAt: new Date() } }
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete("/comments/:id", requireJwt, async (req, res) => {
  try {
    const _id = oid(req.params.id);
    if (!_id) return res.status(400).json({ message: "Invalid comment id" });

    const db = await connectDB();
    const comment = await db.collection("comments").findOne({ _id });
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.userEmail !== req.auth.email.toLowerCase()) {
      return res.status(403).json({ message: "You can delete only your own comment" });
    }

    await db.collection("comments").deleteOne({ _id });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/interactions/:email", requireJwt, requireSameEmail, async (req, res) => {
  try {
    const db = await connectDB();
    const interactions = await db.collection("comments").aggregate([
      { $match: { userEmail: req.params.email.toLowerCase() } },
      { $group: { _id: "$ideaId", lastCommentAt: { $max: "$createdAt" } } },
      { $lookup: { from: "ideas", localField: "_id", foreignField: "_id", as: "idea" } },
      { $unwind: "$idea" },
      { $sort: { lastCommentAt: -1 } },
      { $project: { _id: 0, idea: 1, lastCommentAt: 1 } },
    ]).toArray();
    res.json(interactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: "API route not found" });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`IdeaVault API running on port ${port}`);
});
