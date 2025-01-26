const express = require("express");
const bodyParser = require("body-parser");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
const PORT = 3000;

// Telegram Bot
const BOT_TOKEN = "7826785273:AAGi1Tpb1sekJN1DvjPCwTBRpQIcqGwiOZw";
const CHAT_ID = "-1002294857850";
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

app.use(bodyParser.json());

// Получаем данные о транзакции
app.post("/", async (req, res) => {
    const { walletAddress, signature } = req.body;

    if (!walletAddress || !signature) {
        return res.status(400).send("Invalid request");
    }

    try {
        const message = `✅ Новое пожертвование! \n\n💼 Кошелек: ${walletAddress}\n🔗 Транзакция: https://explorer.solana.com/tx/${signature}`;
        await bot.sendMessage(CHAT_ID, message);
        res.status(200).send("Notification sent");
    } catch (error) {
        console.error("Ошибка отправки уведомления в Telegram:", error);
        res.status(500).send("Ошибка сервера");
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
