const express = require('express');
const router = express.Router();
const { createUser, getUsers, getUser, updateUser, deleteUser } = require('../controllers/userController');

// Определение маршрутов
router.post('/users', createUser);       // Создание пользователя
router.get('/users', getUsers);          // Получение всех пользователей
router.get('/users/:id', getUser);       // Получение одного пользователя по ID
router.put('/users/:id', updateUser);    // Обновление пользователя по ID
router.delete('/users/:id', deleteUser); // Удаление пользователя по ID

module.exports = router;
