const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

// Инициализация клиента MongoDB
const client = new MongoClient(process.env.MONGODB_URI);

exports.handler = async function(event, context) {
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
        const usersCollection = db.collection('users');
        console.log('Connected to database');

        // Извлекаем userId из пути
        const userId = event.path.split('/').pop();
        console.log('User ID from path:', userId);

        if (!userId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'User ID is required' })
            };
        }

        // Проверяем формат userId
        let objectId;
        try {
            objectId = new ObjectId(userId);
        } catch (e) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid User ID format' })
            };
        }

        // Разбираем тело запроса
        const { name, email, age, phoneNumber, address, role, referralCode } = JSON.parse(event.body);
        console.log('Parsed body:', { name, email, age, phoneNumber, address, role, referralCode });

        // Проверяем наличие хотя бы одного поля для обновления
        if (!name && !email && !age && !phoneNumber && !address && !role && !referralCode) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'At least one field is required for update' })
            };
        }

        // Создаем объект для обновления
        const updateFields = {};
        if (name) updateFields.name = name;
        if (email) updateFields.email = email;
        if (age) updateFields.age = age;
        if (phoneNumber) updateFields.phoneNumber = phoneNumber;
        if (address) updateFields.address = address;
        if (role) updateFields.role = role;
        if (referralCode) updateFields.referralCode = referralCode;

        // Обновляем пользователя в базе данных
        const result = await usersCollection.updateOne(
            { _id: objectId },
            { $set: updateFields }
        );

        if (result.matchedCount === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'User not found' })
            };
        }

        console.log('Update result:', result);

        await client.close();

        return {
            statusCode: 200,
            body: JSON.stringify({
                id: userId,
                ...updateFields,
                status: 'updated'
            }),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'PUT',
                'Content-Type': 'application/json'
            }
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
