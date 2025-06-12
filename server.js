const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

const TELEGRAM_BOT_TOKEN = '5453032879:AAFQwFPext99JtaBElWGUl35r9w_EzK2t8s';
const TELEGRAM_CHAT_IDS = ['1008961594', '5915747903'];

app.use(bodyParser.json());
app.use(express.static('public'));

const RESULTS_FILE = path.join(__dirname, 'results.json');

let results = [];
if (fs.existsSync(RESULTS_FILE)) {
  try {
    results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));
  } catch (e) {
    console.error('Failed to read results file:', e);
  }
}

app.post('/submit-result', (req, res) => {
  const { name, score, testType } = req.body;
  if (!name || !score || !testType) {
    return res.status(400).json({ error: 'Missing data' });
  }

  const entry = { name, score, testType, date: new Date().toISOString() };
  results.push(entry);

  fs.writeFile(RESULTS_FILE, JSON.stringify(results, null, 2), (err) => {
    if (err) {
      console.error('Failed to save results:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    const message = `📢 جديد! اختبار ${testType}\n👤 الاسم: ${name}\n🔢 النتيجة: ${score}%`;
    TELEGRAM_CHAT_IDS.forEach(chatId => {
      axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: chatId,
        text: message,
      }).catch(err => console.error('Telegram send error:', err));
    });

    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});