// netlify/functions/githubAuth.js
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
  const code = event.queryStringParameters.code;

  const response = await fetch(`https://github.com/login/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: process.env.GITHUB_REDIRECT_URI,
    }),
  });

  const params = new URLSearchParams(await response.text());
  const accessToken = params.get('access_token');

  const userResponse = await fetch(`https://api.github.com/user`, {
    headers: { Authorization: `token ${accessToken}` },
  });

  const user = await userResponse.json();

  const token = jwt.sign(
    { email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ token }),
  };
};
