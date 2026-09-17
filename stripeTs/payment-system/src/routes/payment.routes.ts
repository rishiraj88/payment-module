import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { stripe } from "../lib/stripe";
import { prisma } from "../lib/prisma";

const router = Router();

router.post("/create-checkout-session", async (req: Request, res: Response) => {
  try {
    const {
      email,
      productName,
      amount,
      currency = "usd"
    } = req.body;

    if (!email || !productName || !amount) {
      return res.status(400).json({
        error: "email, productName, and amount are required"
      });
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({
        error: "amount must be a positive integer in the smallest currency unit"
      });
    }

    const order = await prisma.order.create({
      data: {
        customerEmail: email,
        amount,
        currency,
        status: "PENDING"
      }
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: amount,
            product_data: {
              name: productName
            }
          }
        }
      ],
      metadata: {
        orderId: order.id
      },
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        stripeSessionId: session.id
      }
    });

    return res.json({
      orderId: order.id,
      checkoutUrl: session.url
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Unable to create checkout session"
    });
  }
});

router.get("/orders/:id", async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: {
      id: req.params.id
    }
  });

  if (!order) {
    return res.status(404).json({
      error: "Order not found"
    });
  }

  return res.json(order);
});

export async function stripeWebhook(
  req: Request,
  res: Response
) {
  const signature = req.headers["stripe-signature"];

  if (!signature || typeof signature !== "string") {
    return res.status(400).send("Missing Stripe signature");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (error) {
    console.error("Invalid webhook signature", error);
    return res.status(400).send("Invalid webhook signature");
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        if (!orderId) {
          break;
        }

        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: "PAID",
            stripePaymentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : null
          }
        });

        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        if (orderId) {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              status: "CANCELED"
            }
          });
        }

        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;

        if (typeof charge.payment_intent === "string") {
          await prisma.order.updateMany({
            where: {
              stripePaymentId: charge.payment_intent
            },
            data: {
              status: "REFUNDED"
            }
          });
        }

        break;
      }
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("Webhook processing failed", error);
    return res.status(500).send("Webhook processing failed");
  }
}

export default router;
