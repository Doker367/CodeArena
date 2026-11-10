const express = require("express");
const { getDb } = require("./db");

const authRoutes = require("./routes/auth");
const cartRoutes = require("./routes/cart");
const catalogRoutes = require("./routes/catalog");
const messageRoutes = require("./routes/messages");
const orderRoutes = require("./routes/orders");
const sellerRoutes = require("./routes/seller");

const app = express();
const PORT = Number(process.env.PORT || 4000);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3100";

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "origen-chiapas-api", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api", catalogRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.use((error, req, res, next) => {
  console.error("[api]", error);
  res.status(500).json({ error: "Error interno del servidor" });
});

// Initialize and seed the SQLite database before accepting requests.
getDb();

app.listen(PORT, () => {
  console.log(`ORIGEN CHIAPAS API escuchando en http://localhost:${PORT}`);
});
