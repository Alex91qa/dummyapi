const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');

// Инициализация клиента MongoDB
const client = new MongoClient(process.env.MONGODB_URI);

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    const authHeader = event.headers.authorization || event.headers.Authorization;

    if (!authHeader) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'No authorization token provided' })
        };
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Invalid authorization header format' })
        };
    }

    try {
        // Пытаемся декодировать JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded:', decoded);
        
        await client.connect();
        const db = client.db(process.env.DB_NAME);
        const usersCollection = db.collection('users');
        console.log('Connected to database');

        // Получаем параметры пагинации из запроса
        const page = parseInt(event.queryStringParameters.page) || 1;
        const limit = parseInt(event.queryStringParameters.limit) || 10;
        const skip = (page - 1) * limit;

        // Получаем пользователей с пагинацией
        const users = await usersCollection.find().skip(skip).limit(limit).toArray();
        const totalCount = await usersCollection.countDocuments();

        console.log('Fetched users:', users);

        await client.close();

        return {
            statusCode: 200,
            body: JSON.stringify({
                users: users,
                totalPages: Math.ceil(totalCount / limit)
            })
        };
    } catch (error) {
        console.error('Error:', error);

        // Обработка различных ошибок JWT
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError' || error.name === 'NotBeforeError') {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Invalid or expired token' })
            };
        }

        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};
