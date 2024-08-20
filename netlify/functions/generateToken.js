// netlify/functions/generateToken.js

const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY || 'your_secret_key'; // Используйте секретный ключ для подписи токенов

exports.handler = async function(event) {
  // Проверка метода запроса
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const { userId } = JSON.parse(event.body); // Получение данных пользователя из запроса

  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'User ID is required' })
    };
  }

  try {
    // Создание токена
    const token = jwt.sign({ userId }, SECRET_KEY, { expiresIn: '1h' });

    return {
      statusCode: 200,
      body: JSON.stringify({ token })
    };
  } catch (error) {
    console.error('Error generating token:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};
