const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

// Инициализация клиента MongoDB
const client = new MongoClient(process.env.MONGODB_URI);

exports.handler = async function(event, context) {
    // Проверяем метод HTTP
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
        // Декодируем JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded:', decoded);

        // Получаем orderId из URL
        const pathParameters = event.path.split('/');
        const orderId = pathParameters[pathParameters.length - 1];

        // Проверяем корректность формата orderId
        let orderObjectId;
        try {
            orderObjectId = new ObjectId(orderId);
        } catch (e) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid orderId format' })
            };
        }

        // Подключаемся к базе данных
        await client.connect();
        const db = client.db(process.env.DB_NAME);
        const ordersCollection = db.collection('orders');
        console.log('Connected to database');

        // Ищем заказ по его ObjectId
        const order = await ordersCollection.findOne({ _id: orderObjectId });

        if (!order) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Order not found' })
            };
        }

        // Закрываем соединение с базой данных
        await client.close();

        return {
            statusCode: 200,
            body: JSON.stringify(order)
        };
    } catch (error) {
        console.error('Error:', error);

        // Возвращаем более детализированную информацию об ошибке
        if (error.name === 'JsonWebTokenError') {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Invalid token' })
            };
        }

        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
        };
    }
};
