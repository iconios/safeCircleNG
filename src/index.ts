import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

app.listen(() => {
  console.log("Server running on PORT", PORT);
});
