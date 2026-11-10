const express = require("express");
const {
  getFeaturedProduct,
  getProcessSteps,
  getProducerBySlug,
  getProducerProducts,
  getProducers,
  getProducts,
  getReviews,
} = require("../queries");

const router = express.Router();

const REGION_LABELS = {
  "Los Altos": "Región V Altos Tsotsil-Tseltal",
  "De Los Bosques": "Región VI De Los Bosques",
  Soconusco: "Región X Soconusco",
};

router.get("/catalog", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 48, 48);
  const { items, total } = getProducts({ limit });
  res.json({ products: items, total, producers: getProducers(), featured: getFeaturedProduct() });
});

router.get("/products", (req, res) => {
  const result = getProducts({
    category: req.query.category,
    q: req.query.q,
    producer: req.query.producer,
    sort: req.query.sort,
    min: req.query.min ? Number(req.query.min) : undefined,
    max: req.query.max ? Number(req.query.max) : undefined,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 12,
  });
  res.json(result);
});

router.get("/producers", (req, res) => {
  res.json({ producers: getProducers(req.query.category, req.query.q) });
});

router.get("/producers/:slug", (req, res) => {
  const producer = getProducerBySlug(req.params.slug);
  if (!producer) return res.status(404).json({ error: "Productor no encontrado" });

  const products = getProducerProducts(producer.id).filter((p) => p.status === "activo");
  const related = getProducers()
    .filter((p) => p.id !== producer.id && (p.region === producer.region || p.category === producer.category))
    .slice(0, 3);

  res.json({
    producer,
    products,
    reviews: getReviews(producer.id),
    steps: getProcessSteps(producer.id),
    related,
    regionLabel: REGION_LABELS[producer.region] ?? producer.region,
  });
});

router.get("/featured", (req, res) => {
  res.json({ featured: getFeaturedProduct() });
});

module.exports = router;
