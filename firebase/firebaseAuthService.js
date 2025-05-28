const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.FIREBASE_API_KEY;

exports.registerUser = async (email, password) => {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;

  const response = await axios.post(url, {
    email,
    password,
    returnSecureToken: true
  });

  return response.data;
};

exports.signInUser = async (email, password) => {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;

  const response = await axios.post(url, {
    email,
    password,
    returnSecureToken: true
  });

  return response.data;
};
