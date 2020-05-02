const express = require("express");
const router = express.Router();
const config = require("config");
const stripe = require("stripe")(config.get("stripe_secret_test"));
const endpointSecret = config.get("endpointSecret");
const rawBodyMiddleware = require("../../middleware/rawBody");
const auth = require('../../middleware/auth');
const User = require("../../models/User");
const sgMail = require("@sendgrid/mail");
const { check, validationResult } = require("express-validator");
sgMail.setApiKey(config.get("SENGRID_API_KEY"));

//  @route  POST v1/payment
//  @desc   Accepts webhook posts from Stripe
//  @access Public

router.post("/", rawBodyMiddleware, async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      endpointSecret
    );
  } catch (err) {
    console.log(err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const session = event.data.object;
  switch (event.type) {
    case "checkout.session.completed":
      try {
        // Handle the checkout.session.completed event

        //  This is the user ID. Important because a payment might be made under a different email
        const { client_reference_id } = session;
        const user = await User.findById(client_reference_id);
        if(!user) {
          return res.status(400).json({ msg: "User not found" });
        }

        user["subscription"] = true;
        await user.save();
        return res.json({ received: true });
      } catch (error) {
        console.log(error);
        return res.status(500).send('Server error');
      }
    case "customer.subscription.trial_will_end":
      try {
        //  Grab the customer ID for Stripe
        const { customer } = session;
        //  Find user by that customer id from Stripe
        const user = await User.findOne({ paymentCustomerId: 'cus_H8hJ7Oczs40WnJ' });

        if(!user) {
          return res.status(400).json({ msg: "User not found" });
        }

        //  Trigger email reminder
        const link =
        config.get("environment") === "local"
            ? `http://localhost:3000/cancel`
            : `someurl/cancel`;
        const msg = {
          to: user.email,
          from: "contact@graphitedocs.com",
          subject: "Graphite Docs - Your Trial Is Ending",
          text: "You will be charged for your Graphite Docs account soon.",
          html: "<div>You will be charged for your Graphite Docs account soon.</div>",
          templateId: "d-368a7c2d50ff49279b84f0fa7fad142a",
          dynamic_template_data: {
            cancel_link: link,
            name: user.name.split(' ')[0],
          },
        };

        await sgMail.send(msg);
        return res.json({ msg: "Email sent" });
      } catch (error) {
        console.log(error);
        return res.status(500).send('Server error');
      }      
    default:
      return;
  }
});

//  @route  POST v1/payment/cancel
//  @desc   Cancels a subscription and updates DB
//  @access Private

router.post("/cancel", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if(!user) {
      return res.status(400).json({ msg: "User not found" });
    }

    //  First get the customer
    const customer = await stripe.customers.retrieve(user.paymentCustomerId);

    if(!customer) {
      return res.status(400).json({ msg: "Billing information not found" });
    }

    //  Stripe returns a data array within subscriptions
    const { subscriptions } = customer;
    //  We will never let more than one subscription for a given customer be active
    const individualSubscription = subscriptions.data[0];

    //  Cancel the subscription
    const sub = await stripe.subscriptions.update(individualSubscription.id, {cancel_at_period_end: true});
    
    const { current_period_end } = sub
    user['subscriptionEndDate'] = current_period_end;
    await user.save();
    //  Send confirmation email
    const msg = {
      to: user.email,
      from: "contact@graphitedocs.com",
      subject: "Graphite Docs - Your Subscription has been cancelled",
      text: "Your Graphite Docs subscription has been cancelled.",
      html: "<div>Your Graphite Docs subscription has been cancelled.</div>",
      templateId: "d-1d355832cd6c402398a238453a4e3e4f",
      dynamic_template_data: {
        name: user.name.split(' ')[0],
      },
    };

    await sgMail.send(msg);

    res.json(sub);
  } catch (error) {
    console.log(error);
    res.status(500).send('Server error')
  }
});

//  @route  POST v1/payment/restart
//  @desc   Restarts a subscription, can only be used by those users who previously had a subscription and cancelled
//  @access Private

router.post("/restart/:plan_type", auth, [
  check("plan").not().isEmpty(),
],async (req, res) => {
  const { plan_type } = req.params;
  try {
    const user = await User.findById(req.user.id);

    if(!user) {
      return res.status(400).json({ msg: "User not found" });
    }

    if(!user.subscriptionEndDate) {
      return res.status(400).json({ msg: "Plan has not been cancelled" });
    }

    //  First get the customer
    const customer = await stripe.customers.retrieve(user.paymentCustomerId);

    if(!customer) {
      return res.status(400).json({ msg: "Billing information not found" });
    }

    //  Stripe returns a data array within subscriptions
    const { subscriptions } = customer;
    //  We will never let more than one subscription for a given customer be active
    const individualSubscription = subscriptions.data[0];
    //  Check if current cancelled plan matches restarted plan
    let sub;
    if(individualSubscription.plan.nickname.toLowerCase() === plan_type) {
      sub = await stripe.subscriptions.update(individualSubscription.id, {cancel_at_period_end: false, billing_cycle_anchor: "unchanged"});
      user['subscriptionType'] = 'personal';
    } else {
      //  Switch to the plan selected but but only if the user is allowed to do so
      //  TODO check for user role
      //  TODO if not admin/owner cannot restart a professional plan     
      const plans = await stripe.plans.list({limit: 3});
      for(const plan of plans.data) {
        if(plan.nickname.toLowerCase() === plan_type) {
          sub = await stripe.subscriptions.update(individualSubscription.id, {
            cancel_at_period_end: false,
            proration_behavior: 'create_prorations',
            items: [{
              id: individualSubscription.items.data[0].id,
              plan: plan.id,
            }]
          });
          user['subscriptionType'] = 'professional';
        }
      }
    }
    
    user['subscriptionEndDate'] = null;
    await user.save();
    //  Send confirmation email

    //  TODO: This should be a dedicated restart account message
    // const msg = {
    //   to: user.email,
    //   from: "contact@graphitedocs.com",
    //   subject: "Graphite Docs - Your Subscription has been cancelled",
    //   text: "Your Graphite Docs subscription has been cancelled.",
    //   html: "<div>Your Graphite Docs subscription has been cancelled.</div>",
    //   templateId: "d-1d355832cd6c402398a238453a4e3e4f",
    //   dynamic_template_data: {
    //     name: user.name.split(' ')[0],
    //   },
    // };

    // await sgMail.send(msg);

    res.json(sub);
  } catch (error) {
    console.log(error);
    res.status(500).send('Server error')
  }
});

module.exports = router;
