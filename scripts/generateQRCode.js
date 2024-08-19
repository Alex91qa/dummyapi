const QRCode = require('qrcode');
const fs = require('fs');

// Адрес кошелька и сумма
const address = 'bc1qhwagy0nchk3czflymqpxzd6af9y3p2s7sj288n'; // Замените на ваш Bitcoin адрес
const amount = '0.00008'; // Замените на нужную сумму
const label = 'Donation'; // Метка (опционально)

const uri = `bitcoin:${address}?amount=${amount}&label=${label}`;

// Генерация QR-кода
QRCode.toFile('bitcoin_donation_qr.png', uri, {
  color: {
    dark: '#000000',  // Цвет фона
    light: '#ffffff'  // Цвет переднего плана
  }
}, function (err) {
  if (err) throw err;
  console.log('QR code generated and saved as bitcoin_donation_qr.png');
});
