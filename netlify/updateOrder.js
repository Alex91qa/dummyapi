const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');

// Инициализация клиента MongoDB
const client = new MongoClient(process.env.MONGODB_URI);

exports.handler = async function(event, context) {
    // Проверяем метод HTTP
    if (event.httpMethod !== 'PUT') {
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
        // Декодируем JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded:', decoded);

        // Подключаемся к базе данных
        await client.connect();
        const db = client.db(process.env.DB_NAME);
        const ordersCollection = db.collection('orders');
        console.log('Connected to database');

        // Извлекаем ID заказа из пути запроса
        const orderId = event.path.split('/').pop();
        console.log('Order ID from path parameters:', orderId);

        if (!orderId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Order ID is required' })
            };
        }

        // Извлекаем данные из тела запроса
        const { items, totalAmount } = JSON.parse(event.body);
        console.log('Parsed body:', { items, totalAmount });

        if (!items || !totalAmount) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Items and totalAmount are required' })
            };
        }

        // Обновляем заказ в базе данных
        const result = await ordersCollection.updateOne(
            { orderId },
            {
                $set: {
                    items,
                    totalAmount,
                    updatedAt: new Date(),
                    updatedBy: decoded.userId // Или другие данные о пользователе
                }
            }
        );
        console.log('Update result:', result);

        if (result.matchedCount === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Order not found' })
            };
        }

        await client.close();

        return {
            statusCode: 200,
            body: JSON.stringify({
                orderId,
                items,
                totalAmount,
                status: 'updated'
            })
        };
    } catch (error) {
        console.error('Error:', error);

        if (error.name === 'JsonWebTokenError') {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Invalid token' })
            };
        }

        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};
