module.exports = {
  functions: "./lib/inngest/function.js",
  servePath: "/api/inngest",
  port: 3000,
  env: process.env.NODE_ENV || "development",
  signingKey: process.env.INNGEST_SIGNING_KEY,
  eventKey: process.env.INNGEST_EVENT_KEY
};