const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

// Инициализация клиента MongoDB
const client = new MongoClient(process.env.MONGODB_URI);

exports.handler = async function(event, context) {
    // Проверяем метод HTTP
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
        // Декодируем JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded:', decoded);

        // Подключаемся к базе данных
        await client.connect();
        const db = client.db(process.env.DB_NAME);
        const reviewsCollection = db.collection('reviews');
        const ordersCollection = db.collection('orders');
        console.log('Connected to database');

        // Парсим тело запроса
        const {
            rating,
            comment,
            timestamp,
            orderId,
            recommendToOthers,
            quality,
            service,
            photo
        } = JSON.parse(event.body);
        console.log('Parsed body:', { rating, comment, timestamp, orderId, recommendToOthers, quality, service, photo });

        // Проверяем обязательные поля
        if (rating === undefined || !comment || !timestamp || !orderId || recommendToOthers === undefined || quality === undefined || service === undefined) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'All fields (rating, comment, timestamp, orderId, recommendToOthers, quality, service) are required' }),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST',
                    'Content-Type': 'application/json'
                }
            };
        }

        // Проверка на корректность и наличие фото
        if (photo) {
            if (!photo.startsWith('data:image/png;base64,')) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Photo must be a valid base64-encoded PNG image' }),
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'POST',
                        'Content-Type': 'application/json'
                    }
                };
            }

            const photoBuffer = Buffer.from(photo.split(',')[1], 'base64');
            if (photoBuffer.length > 1 * 1024 * 1024) { // 1MB
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Photo size must be less than 1MB' }),
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'POST',
                        'Content-Type': 'application/json'
                    }
                };
            }
        }

        // Проверяем формат orderId
        let orderObjectId;
        try {
            orderObjectId = new ObjectId(orderId); // Преобразуем orderId в ObjectId
        } catch (e) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid Order ID format' }),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST',
                    'Content-Type': 'application/json'
                }
            };
        }

        // Проверяем, существует ли orderId
        const order = await ordersCollection.findOne({ _id: orderObjectId });
        if (!order) {
            return {
                statusCode: 404, // Not Found
                body: JSON.stringify({ error: 'Order with this ID does not exist' }),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST',
                    'Content-Type': 'application/json'
                }
            };
        }

        // Проверяем, существует ли уже отзыв с данным orderId
        const existingReview = await reviewsCollection.findOne({ orderId });
        if (existingReview) {
            return {
                statusCode: 409, // Conflict
                body: JSON.stringify({ error: 'Review for this order already exists' }),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST',
                    'Content-Type': 'application/json'
                }
            };
        }

        // Создаем новый отзыв
        const result = await reviewsCollection.insertOne({
            orderId,
            rating,
            comment,
            timestamp: new Date(timestamp),
            recommendToOthers,
            quality,
            service,
            photo: photo || null,
            createdAt: new Date(),
            createdBy: decoded.userId // Сохраняем информацию о создателе отзыва
        });
        console.log('Insert result:', result);

        await client.close();

        return {
            statusCode: 200,
            body: JSON.stringify({
                id: result.insertedId.toString(),
                orderId,
                rating,
                comment,
                timestamp,
                recommendToOthers,
                quality,
                service,
                photo: photo || null,
                status: 'created'
            }),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
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
