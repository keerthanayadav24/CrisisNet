require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/analyze", async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    const model = genAI.getGenerativeModel({
  model: "models/gemini-3-flash-preview", // keep this
});

    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: `
Analyze this image.

If it is an emergency:
Start with: "EMERGENCY: YES"
Then give 2–3 short actionable steps.

IMPORTANT:
- Use "112" as the emergency number (India) and avoid "911"
- Do NOT suggest non-actionable steps like "stay calm" or "wait for help"

If it is NOT an emergency:
Start with: "EMERGENCY: NO"
Then describe the image in ONLY 2 short lines.

Do NOT add anything else.
Keep it clean and minimal.
`
, },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64,
              },
            },
          ],
        },
      ],
    });

    const text = response.response.text();

    res.json({ output: text });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI failed" });
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});

app.get("/test", async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.0-flash", // keep this
    });

    const result = await model.generateContent("Say hello in one line");

    res.send(result.response.text());

  } catch (err) {
    console.error(err);
    res.send("❌ Error — check console");
  }
});