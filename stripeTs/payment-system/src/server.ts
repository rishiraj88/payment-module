// backend server, making calls to middleware and exposing webhooks
import express from "express";
import cors from "cors";
import "dotenv/config";

import paymentRoutes, {
  stripeWebhook
} from "./routes/payment.routes";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());

/*
  Stripe webhook must receive the raw request body.
  Register this route before express.json().
*/
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/payments", paymentRoutes);

app.listen(port, () => {
  console.log(`Payment API running on http://localhost:${port}`);
});
