require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { router: authRouter } = require('./routes/auth');
const fortuneRouter = require('./routes/fortune');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api', authRouter);
app.use('/api', fortuneRouter);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`爪爪运服务已启动 → http://localhost:${PORT}`);
});
