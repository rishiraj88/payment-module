Here’s a practical MVP payment system using Node.js, TypeScript, Express, PostgreSQL, Prisma, and Stripe Checkout. Stripe Checkout keeps card details off your server, while webhooks update payment status reliably. 

Features
    Create one-time payment sessions
    Redirect customers to hosted checkout
    Process successful-payment webhooks
    Store orders and payment status
    Prevent duplicate webhook processing
    View payment status
    Use Stripe test mode

payment-system/
├── src/
│   ├── server.ts
│   ├── routes/
│   │   └── payment.routes.ts
│   └── lib/
│       ├── prisma.ts
│       └── stripe.ts
├── prisma/
│   └── schema.prisma
├── .env
├── package.json
└── tsconfig.json

## Installation and configuration
cd payment-system

npm init -y

npm install express stripe dotenv cors
npm install @prisma/client
npm install -D typescript tsx prisma @types/express @types/node @types/cors

npx tsc --init
npx prisma init

## Making a payment request
`curl -X POST http://localhost:3000/api/payments/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "productName": "Premium Plan",
    "amount": 1200,
    "currency": "eur"
  }'
`

### Response format
The response from server to the above style of request and data is of the format:

`{
  "orderId": "cm123example",
  "checkoutUrl": "https://checkout.stripe.com/..."
}
`
## Testing the service with webhooks locally
- Use Stripe CLI to forward requests:
`
stripe listen --forward-to localhost:3000/api/payments/webhook
`

- The output listing for the above command reveals a sign-in secret:
`
whsec_...
`
- Copy the secret string to .env file:
`
STRIPE_WEBHOOK_SECRET="whsec_..."
`
- Restart the server and test with "test data":
`
Card number: 4242 4242 4242 4242
Expiry: some future date
CVC: three digits
ZIP: a valid ZIP/PIN
`