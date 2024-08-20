const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

// Инициализация клиента MongoDB
const client = new MongoClient(process.env.MONGODB_URI);

exports.handler = async function(event, context) {
    // Проверяем метод HTTP
    if (event.httpMethod !== 'POST') {
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
        const usersCollection = db.collection('users');
        console.log('Connected to database');

        // Парсим тело запроса
        const {
            userId,
            items,
            totalAmount,
            paymentMethod,
            shippingAddress,
            deliveryDate,
            discountCode,
            notes,
            status
        } = JSON.parse(event.body);
        console.log('Parsed body:', {
            userId,
            items,
            totalAmount,
            paymentMethod,
            shippingAddress,
            deliveryDate,
            discountCode,
            notes,
            status
        });

        // Проверяем обязательные поля
        if (!userId || !items || !totalAmount || !paymentMethod || !shippingAddress || !deliveryDate || !status) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'All fields (userId, items, totalAmount, paymentMethod, shippingAddress, deliveryDate, status) are required' })
            };
        }

        // Проверяем, существует ли userId
        let userObjectId;
        try {
            userObjectId = new ObjectId(userId); // Преобразуем userId в ObjectId
        } catch (e) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid userId format' })
            };
        }

        const user = await usersCollection.findOne({ _id: userObjectId });
        if (!user) {
            return {
                statusCode: 404, // Not Found
                body: JSON.stringify({ error: 'User with this ID does not exist' })
            };
        }

        // Создаем новый заказ
        const result = await ordersCollection.insertOne({
            userId: userObjectId,
            items,
            totalAmount,
            paymentMethod,
            shippingAddress,
            deliveryDate: new Date(deliveryDate),
            discountCode: discountCode || null,
            notes: notes || null,
            status,
            createdAt: new Date(),
            createdBy: decoded.userId // Сохраняем информацию о создателе заказа
        });
        console.log('Insert result:', result);

        await client.close();

        return {
            statusCode: 200,
            body: JSON.stringify({
                id: result.insertedId.toString(), // Используем id как уникальный идентификатор заказа
                userId: userObjectId.toString(),
                items,
                totalAmount,
                paymentMethod,
                shippingAddress,
                deliveryDate,
                discountCode: discountCode || null,
                notes: notes || null,
                status,
                createdAt: new Date(),
                createdBy: decoded.userId
            })
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
