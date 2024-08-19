const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');

const app = express();
const port = 3000;

// Подключение к MongoDB
mongoose.connect('mongodb://localhost:27017/dummyapi', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((error) => console.error('Error connecting to MongoDB:', error));

// Middleware
app.use(express.json());

// Использование маршрутов
app.use('/api', userRoutes); // Убедитесь, что путь соответствует вашему маршруту

// Запуск сервера
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
