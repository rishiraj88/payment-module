cd payment-system

npm init -y

npm install express stripe dotenv cors
npm install @prisma/client
npm install -D typescript tsx prisma @types/express @types/node @types/cors

npx tsc --init
npx prisma init
