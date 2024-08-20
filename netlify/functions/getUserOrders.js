const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

// Инициализация клиента MongoDB
const client = new MongoClient(process.env.MONGODB_URI);

exports.handler = async function(event, context) {
    // Проверяем метод HTTP
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' }),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Content-Type': 'application/json'
            }
        };
    }

    const authHeader = event.headers.authorization || event.headers.Authorization;

    if (!authHeader) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'No authorization token provided' }),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Content-Type': 'application/json'
            }
        };
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Invalid authorization header format' }),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Content-Type': 'application/json'
            }
        };
    }

    try {
        // Декодируем JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded:', decoded);

        // Подключаемся к базе данных
        await client.connect();
        const db = client.db(process.env.DB_NAME);
        const ordersCollection = db.collection('orders');
        const usersCollection = db.collection('users');
        console.log('Connected to database');

        // Извлекаем userId из пути запроса
        const userId = event.path.split('/').pop();
        console.log('User ID from path parameters:', userId);

        // Проверяем наличие userId
        if (!userId) {
            await client.close();
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'User ID is required' }),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET',
                    'Content-Type': 'application/json'
                }
            };
        }

        // Проверяем формат userId
        let userObjectId;
        try {
            userObjectId = new ObjectId(userId); // Преобразуем userId в ObjectId
        } catch (e) {
            await client.close();
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid User ID format' }),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET',
                    'Content-Type': 'application/json'
                }
            };
        }

        // Проверяем, существует ли пользователь с таким userId
        const user = await usersCollection.findOne({ _id: userObjectId });
        if (!user) {
            await client.close();
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'User not found' }),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET',
                    'Content-Type': 'application/json'
                }
            };
        }

        // Поиск заказов пользователя
        const orders = await ordersCollection.find({ userId: userObjectId }).toArray();
        console.log('Found orders:', orders);

        await client.close();

        return {
            statusCode: 200,
            body: JSON.stringify(orders),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Content-Type': 'application/json'
            }
        };
    } catch (error) {
        console.error('Error:', error);

        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Unauthorized: Invalid or expired token' }),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET',
                    'Content-Type': 'application/json'
                }
            };
        }

        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Content-Type': 'application/json'
            }
        };
    }
};
