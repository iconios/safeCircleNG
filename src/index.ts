import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import extractToken from "./middleware/extractToken.ts";
import authRouter from "./routes/auth.routes.ts";
import journeyRouter from "./routes/journey.routes.ts";
dotenv.config();

const app = express();
const PORT = process.env.PORT;
if (!PORT) {
  throw new Error("PORT configuration missing");
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(extractToken);

app.get("/health", (_, res) => res.send("OK"));
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/journeys", journeyRouter);

app.listen(PORT, () => {
  console.log("Server running on PORT", PORT);
});
