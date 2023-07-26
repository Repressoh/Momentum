import express from "express";
import path, { parse } from "path";
const app = express.Router();
import { dirname } from 'dirname-filename-esm';
const __dirname = dirname(import.meta);
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import Profile from '../model/profiles.js';
import User from '../model/user.js';

app.post("/addvbucks", async (req, res) => {
    const { authkey, username, addValue } = req.query;
  
    if (!username) return res.status(400).send('No username provided.');
    if (!addValue) return res.status(400).send('No addValue provided.');
    if (!authkey) return res.status(400).send('No authkey provided.');

    const lowerUsername = (username as string).toLowerCase();
  
    if (authkey === process.env.AUTHKEY) {
      try {
        const user = await User.findOne({ username_lower: lowerUsername });
        if (user) {
          const filter = { accountId: user.accountId };
          const update = { $inc: { 'profiles.common_core.items.Currency:MtxPurchased.quantity': parseInt(addValue as string) } };
          const options = { new: true };

          const updatedProfile = await Profile.findOneAndUpdate(filter, update, options);
  
          if (updatedProfile) {
            const newQuantity = updatedProfile.profiles.common_core.items['Currency:MtxPurchased'].quantity;
            return res.status(200).json({ quantity: newQuantity });
          } else {
            return res.status(404).send('Profile not found or item not found.');
          }
        } else {
          return res.status(404).send('User not found.');
        }
      } catch (err) {
        console.error('Error while updating data:', err);
        return res.status(500).send('Error while updating data.');
      }
    } else {
      let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
      ip = (ip ?? "").toString().replace('::ffff:', '');
      const date = new Date().toLocaleDateString();
      const time = new Date().toLocaleTimeString();
      const embeds = [
        {
          title: "Unauthorized API Request",
          color: 15548997,
          description: "Unauthorized API request from: " + ip + "\nAt: " + date + " " + time + "\nWith key: " + authkey + "\nFor user: " + username + "\nWith value: " + addValue + ".",
        },
      ];
  
      const data = JSON.stringify({ embeds });
      const config_axios = {
        method: "POST",
        url: process.env.WEBHOOK_URL,
        headers: { "Content-Type": "application/json" },
        data: data,
      };
  
      axios(config_axios)
        .catch((error) => {
          console.error('Error sending Discord webhook:', error.message);
        });
  
      return res.status(401).send('Unauthorized');
    }
  });

  export default app;