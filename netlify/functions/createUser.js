const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');

// Инициализация клиента MongoDB
const client = new MongoClient(process.env.MONGODB_URI);

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' }),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
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
                'Access-Control-Allow-Methods': 'POST',
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
                'Access-Control-Allow-Methods': 'POST',
                'Content-Type': 'application/json'
            }
        };
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded:', decoded);

        await client.connect();
        const db = client.db(process.env.DB_NAME);
        const usersCollection = db.collection('users');
        console.log('Connected to database');

        const {
            name,
            email,
            age,
            phoneNumber,
            address,
            role,
            referralCode
        } = JSON.parse(event.body);

        console.log('Parsed body:', { name, email, age, phoneNumber, address, role, referralCode });

        // Валидация обязательных полей
        if (!name || typeof name !== 'string' || name.length < 3) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid name: it must be a string with at least 3 characters' }),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST',
                    'Content-Type': 'application/json'
                }
            };
        }

        if (!email || !/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid email address' }),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST',
                    'Content-Type': 'application/json'
                }
            };
        }

        if (!age || typeof age !== 'number' || age < 18 || age > 120) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid age: it must be a number between 18 and 120' }),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST',
                    'Content-Type': 'application/json'
                }
            };
        }

        const phoneNumberPattern = /^\+\d{1,3}\d{7,10}$/;
        if (!phoneNumber || !phoneNumberPattern.test(phoneNumber)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid phone number: it must be in the format +<country code> followed by 7 to 10 digits' }),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST',
                    'Content-Type': 'application/json'
                }
            };
        }

        if (!address || typeof address !== 'string' || address.length < 10) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid address: it must be a string with at least 10 characters' }),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST',
                    'Content-Type': 'application/json'
                }
            };
        }

        if (role && (typeof role !== 'string' || !['user', 'admin', 'moderator'].includes(role))) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid role: it must be one of "user", "admin", or "moderator"' }),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST',
                    'Content-Type': 'application/json'
                }
            };
        }

        if (referralCode && (typeof referralCode !== 'string' || referralCode.length !== 8)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid referral code: it must be a string of exactly 8 characters if provided' }),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST',
                    'Content-Type': 'application/json'
                }
            };
        }

        // Проверка существования пользователя
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            return {
                statusCode: 409, // Conflict
                body: JSON.stringify({ error: 'User with this email already exists' }),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST',
                    'Content-Type': 'application/json'
                }
            };
        }

        // Вставка нового пользователя в базу данных
        const result = await usersCollection.insertOne({
            name,
            email,
            age,
            phoneNumber,
            address,
            role: role || null,
            referralCode: referralCode || null,
            createdAt: new Date(),
            createdBy: decoded.userId, // Или любые другие данные, которые вы хотите сохранить о создателе
            status: 'created'  // Добавляем статус
        });
        console.log('Insert result:', result);

        await client.close();

        return {
            statusCode: 200,
            body: JSON.stringify({
                id: result.insertedId.toString(), // Преобразование ObjectId в строку
                name,
                email,
                age,
                phoneNumber,
                address,
                role: role || null,
                referralCode: referralCode || null,
                status: 'created'  // Включаем статус в ответ
            }),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Content-Type': 'application/json'
            }
        };
    } catch (error) {
        console.error('Error:', error);

        if (error.name === 'JsonWebTokenError') {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Invalid token' }),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST',
                    'Content-Type': 'application/json'
                }
            };
        } else if (error.name === 'TokenExpiredError') {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Token expired' }),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST',
                    'Content-Type': 'application/json'
                }
            };
        } else if (error.name === 'JsonWebTokenError') {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Invalid token' }),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST',
                    'Content-Type': 'application/json'
                }
            };
        }

        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Content-Type': 'application/json'
            }
        };
    }
};
