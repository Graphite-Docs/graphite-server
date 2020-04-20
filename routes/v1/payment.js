const express = require("express");
const router = express.Router();
const config = require("config");
const stripe = require("stripe")("sk_test_MltJxihP6snGZ7ex55clkxpO");
const endpointSecret = config.get("endpointSecret");
const rawBodyMiddleware = require("../../middleware/rawBody");
const User = require("../../models/User");

router.post("/", rawBodyMiddleware, async (request, response) => {
  const sig = request.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      request.rawBody,
      sig,
      endpointSecret
    );
  } catch (err) {
    console.log(err);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    //  This is the user ID. Important because a payment might be made under a different email
    const { client_reference_id } = session;
    const user = await User.findById(client_reference_id);
    user.subscription = true;
    await user.save();
  }

  // Return a response to acknowledge receipt of the event
  response.json({ received: true });
});

module.exports = router;
