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

install-config.sh
cd payment-system

npm init -y

npm install express stripe dotenv cors
npm install @prisma/client
npm install -D typescript tsx prisma @types/express @types/node @types/cors

npx tsc --init
npx prisma init
