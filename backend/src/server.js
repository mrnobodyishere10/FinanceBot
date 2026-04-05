require("dotenv").config();
const http = require("http");
const app = require("./app");
const { initSentry } = require("./monitoring/sentry");

const PORT = process.env.PORT || 3000;
initSentry();

const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`FinanceBot server running on port ${PORT}`);
});
