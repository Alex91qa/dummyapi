// controllers/userController.js

// Пример контроллера для пользователей
const User = require('../models/user'); // Предполагается, что у вас есть модель User

// Функция для получения всех пользователей
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Другие методы контроллера (создание пользователя, обновление, удаление и т.д.)

module.exports = {
    getAllUsers
    // Добавьте другие методы здесь при необходимости
};
