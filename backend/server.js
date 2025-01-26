const express = require("express");
const bodyParser = require("body-parser");
const TelegramBot = require("node-telegram-bot-api");
const { Connection, PublicKey, Transaction, SystemProgram } = require("@solana/web3.js");

const app = express();
const PORT = 3000;

// Telegram Bot настройки
const BOT_TOKEN = "7826785273:AAGi1Tpb1sekJN1DvjPCwTBRpQIcqGwiOZw"; // Замените на действительный токен
const CHAT_ID = "-1002294857850"; // Замените на ID чата
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

app.use(bodyParser.json());

// Пример API для отправки токенов
app.post("/donate", async (req, res) => {
    const { sender, recipient, amount } = req.body;

    try {
        // Логика работы с Solana Web3
        const connection = new Connection("https://api.mainnet-beta.solana.com");
        const transaction = new Transaction();
        const resp = await window.solana.connect(); // Запрос подключения кошелька
        const publicKey = resp.publicKey.toString();
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: "4N8e7Hud7KBsLyMNvnkeQ8RSGWPumDa5Pf9eXgBXZaAE",
                lamports: 1000,
            }),
        );

        // Лог отправки в Telegram
        await bot.sendMessage(CHAT_ID, `Новая транзакция: Отправитель ${sender}, Получатель ${recipient}, Сумма ${amount}`);

        res.status(200).send("Транзакция успешно выполнена.");
    } catch (error) {
        console.error(error);
        res.status(500).send("Ошибка при выполнении транзакции.");
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
