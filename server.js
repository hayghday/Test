const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

const TELEGRAM_BOT_TOKEN = '5453032879:AAFQwFPext99JtaBElWGUl35r9w_EzK2t8s';
const TELEGRAM_CHAT_IDS = ['1008961594', '5915747903'];

// Middleware
app.use(bodyParser.json());
app.use(express.static(__dirname)); // تقديم الملفات من المجلد الجذري

const RESULTS_FILE = path.join(__dirname, 'results.json');

// إنشاء ملف النتائج إذا لم يكن موجوداً
if (!fs.existsSync(RESULTS_FILE)) {
  fs.writeFileSync(RESULTS_FILE, '[]', 'utf8');
}

let results = [];
try {
  results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));
} catch (e) {
  console.error('Failed to read results file:', e);
}

// Route لمعالجة النتائج
app.post('/submit-result', (req, res) => {
  const { name, score, testType, answers } = req.body; // إضافة answers
  if (!name || score === undefined || !testType || !answers) {
    return res.status(400).json({ error: 'Missing data' });
  }

  const entry = { 
    name, 
    score, 
    testType, 
    answers, // حفظ الإجابات
    date: new Date().toISOString() 
  };
  results.push(entry);

  fs.writeFile(RESULTS_FILE, JSON.stringify(results, null, 2), (err) => {
    if (err) {
      console.error('Failed to save results:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    // بناء رسالة مفصلة مع الإجابات
    let detailedMessage = `📢 جديد! اختبار ${testType}\n👤 الاسم: ${name}\n🔢 النتيجة: ${score}%\n\nالإجابات:\n`;
    
    answers.forEach((answer, index) => {
      detailedMessage += `${index + 1}. ${answer.question}\n- الجواب: ${answer.answer}\n\n`;
    });

    TELEGRAM_CHAT_IDS.forEach(chatId => {
      axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: chatId,
        text: detailedMessage,
      })
      .then(() => console.log('تم إرسال النتائج مع الإجابات'))
      .catch(err => console.error('خطأ في إرسال التفاصيل:', err));
    });

    res.json({ success: true });
  });
});
// Routes لكل صفحة HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/test_femininity.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'test_femininity.html'));
});

app.get('/test_masculinity.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'test_masculinity.html'));
});

app.get('/result.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'result.html'));
});

// أي route آخر يتم توجيهه إلى index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
