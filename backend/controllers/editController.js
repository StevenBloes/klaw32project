import { updateField } from "../services/editService.js";

export const genericUpdate = async (req, res) => {
  try {
    const result = await updateField({
      type: req.params.type,
      id: req.params.id,
      value: req.body.value,
    });

    res.json({
      success: true,
      ...result,
    });

  } catch (err) {
    // map errors to the correct HTTP responses
    switch (err.message) {
      case "INVALID_TYPE":
        return res.status(400).json({ error: "Invalid update type" });

      case "INVALID_ID":
        return res.status(400).json({ error: "Invalid ID" });

      case "INVALID_NUMBER":
        return res.status(400).json({ error: "Value must be a number" });

      case "INVALID_TIME":
        return res.status(400).json({ error: "Invalid time format (expected format H:mm)" });

      case "INVALID_STRING":
        return res.status(400).json({ error: "Invalid string value" });

      case "VALUE_TOO_LONG":
        return res.status(400).json({ error: "Value too long" });

      default:
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
  }
};
