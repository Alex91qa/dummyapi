const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

// Инициализация клиента MongoDB
const client = new MongoClient(process.env.MONGODB_URI);

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'DELETE') {
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
        const ordersCollection = db.collection('orders'); // Исправлено на 'orders'
        console.log('Connected to database');

        // Извлекаем orderId из пути
        const orderId = event.path.split('/').pop();
        console.log('Order ID from path:', orderId);

        if (!orderId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Order ID is required' })
            };
        }

        // Проверяем формат orderId
        let objectId;
        try {
            objectId = new ObjectId(orderId);
        } catch (e) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid Order ID format' })
            };
        }

        // Удаляем заказ из базы данных
        const result = await ordersCollection.deleteOne({ _id: objectId });

        if (result.deletedCount === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Order not found' })
            };
        }

        console.log('Delete result:', result);

        await client.close();

        return {
            statusCode: 200,
            body: JSON.stringify({
                id: orderId,
                status: 'deleted'
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
