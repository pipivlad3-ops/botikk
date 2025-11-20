const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});




const TelegramBot = require('node-telegram-bot-api');

// =============================
// 🔧 CONFIG
// =============================
const token = '8534162570:AAFdNjOaNBaLmXAWVdgCNqMjv58w1tuf5o4';
const bot = new TelegramBot(token, { polling: true });

// =============================
// 🕒 AUTO-DELETE (20 seconds)
// =============================
function autoDelete(chatId, messageId) {
  setTimeout(() => {
    bot.deleteMessage(chatId, messageId).catch(() => {});
  }, 20000);
}

// =============================
// 🎭 STATE STORAGE
// =============================
// userState[chatId] = { waitingFor: null | "YES_NO" | "PREDICTION" | "ADVICE" | "NUMBER" }
const userState = {};

// =============================
// ✨ TEXTS
// =============================
const predictions = [
  "Сегодня удача будет на твоей стороне.",
  "Лучше немного подождать перед важным решением.",
  "Тебя ждёт приятный сюрприз.",
  "Время начать то, что ты давно откладывал.",
  "Скоро всё наладится — ты даже удивишься как быстро.",
  "Ты встретишь человека, который изменит твой день.",
  "Вселенная благосклонна к тебе.",
  "Сегодня хороший день, чтобы рискнуть.",
  "Будь внимателен: кто-то рассчитывает на тебя.",
  "Скоро придут хорошие новости.",
  "То, что казалось потерей, откроется как освобождение.",
  "Не торопи события — всё созревает ровно тогда, когда должно.",
  "Когда перестанешь искать ответы вовне, один из них найдёт тебя сам.",
  "Все идёт так, как должно идти.",
  "Правильные люди приходят тихо, но остаются надолго.",
  "Перемены приходят не разрушить — а освободить пространство.",
  "Иногда самый правильный шаг — тот, на который ты пока не решаешься.",
  "Ты идёшь по пути, который создаётся под твоими шагами.",
  "То, что сейчас болезненно — станет твоей силой.",
  "Скоро ты встретишь тишину, которая скажет больше тысячи голосов.",
  "Пока ждёшь идеальный момент — другие уже живут твоей мечтой.",
  "Ты знаешь, что делать — просто надеешься, что судьба решит за тебя."
];

const advices = [
  "Сделай что-то маленькое, но полезное для себя.",
  "Не забывай отдыхать — даже 10 минут тишины важны.",
  "Слушай интуицию, но проверяй факты.",
  "Сравнивай себя только с собой вчерашним.",
  "Сделай доброе дело анонимно.",
  "Сегодня хороший день, чтобы разобрать хвосты.",
  "Не принимай решений на эмоциях.",
  "Запиши три вещи, за которые ты благодарен.",
  "Позвони человеку, о котором давно думаешь.",
  "Сконцентрируйся только на том, что можешь контролировать.",
  "Пусть сегодня хотя бы одно действие будет для тебя, а не «потому что надо».",
  "Не сравнивай свой путь с чужим — у каждого свой темп.",
  "Сделай сегодня маленький шаг, который завтра сэкономит силы."
];

const yesNoAnswers = [
  "Да.",
  "Скорее да.",
  "Похоже, что да.",
  "Пока не ясно — попробуй позже.",
  "Скорее нет.",
  "Нет.",
  "Лучше не сейчас.",
  "Ответ приходит не сразу…"
];

// =============================
// 🧩 KEYBOARDS
// =============================
function mainKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🔮 Предсказание", callback_data: "PREDICTION" },
          { text: "💡 Совет дня", callback_data: "ADVICE" }
        ],
        [
          { text: "🎭 Да / Нет", callback_data: "YES_NO" },
          { text: "🔢 Число дня", callback_data: "NUMBER" }
        ]
      ]
    }
  };
}

function readyKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "✔ Я готов(а)", callback_data: "READY" }],
        [{ text: "⬅ Назад", callback_data: "BACK" }]
      ]
    }
  };
}

// Random helper
const randomFromArray = arr => arr[Math.floor(Math.random() * arr.length)];

// =============================
// 📌 START / MENU
// =============================
bot.onText(/\/start/, msg => {
  const chatId = msg.chat.id;

  bot.sendMessage(
    chatId,
    `🔮 *Привет!*

Сконцентрируйся, задай вопрос мысленно — и выбери, что хочешь узнать.`,
    { parse_mode: "Markdown", ...mainKeyboard() }
  ).then(m => autoDelete(chatId, m.message_id));

  // удаляем команду /start пользователя (опционально)
  autoDelete(chatId, msg.message_id);
});

bot.onText(/\/menu/, msg => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "Выбирай действие:", mainKeyboard())
    .then(m => autoDelete(chatId, m.message_id));

  autoDelete(chatId, msg.message_id);
});

// =============================
// 🎛 INLINE BUTTON HANDLERS
// =============================
bot.on("callback_query", async query => {
  const chatId = query.message.chat.id;
  const data = query.data;

  // Обязательно отвечаем на callback, чтобы убрать "часики"
  bot.answerCallbackQuery(query.id).catch(() => {});

  // ----- BACK -----
  if (data === "BACK") {
    userState[chatId] = null;
    const m = await bot.sendMessage(chatId, "Возвращаемся в меню:", mainKeyboard());
    autoDelete(chatId, m.message_id);
    autoDelete(chatId, query.message.message_id); // удаляем сообщение с кнопками
    return;
  }

  // ----- YES_NO flow -----
  if (data === "YES_NO") {
    // Запоминаем состояние — ожидаем, что пользователь подтвердит мысль
    userState[chatId] = { waitingFor: "YES_NO" };

    const m = await bot.sendMessage(
      chatId,
      `🎭 *Сформулируйте мысленно вопрос.*

Когда будете готовы — нажмите кнопку ниже.`,
      { parse_mode: "Markdown", ...readyKeyboard() }
    );
    autoDelete(chatId, m.message_id);
    autoDelete(chatId, query.message.message_id); // удаляем исходное меню/кнопки
    return;
  }

  // ----- PREDICTION / ADVICE / NUMBER -> предварительная подготовка -----
  if (data === "PREDICTION" || data === "ADVICE" || data === "NUMBER") {
    // Запоминаем, что ждём подтверждения для конкретного действия
    userState[chatId] = { waitingFor: data }; // "PREDICTION" | "ADVICE" | "NUMBER"

    const m = await bot.sendMessage(
      chatId,
      `✨ *Сконцентрируйтесь…*

Когда будете готовы — нажмите кнопку.`,
      { parse_mode: "Markdown", ...readyKeyboard() }
    );
    autoDelete(chatId, m.message_id);
    autoDelete(chatId, query.message.message_id);
    return;
  }

  // ----- READY (пользователь подтвердил готовность) -----
  if (data === "READY") {
    const state = userState[chatId];
    const action = state?.waitingFor || null;

    // Если нет запомненного действия — просто возвращаем меню
    if (!action) {
      const m = await bot.sendMessage(chatId, "Действие не выбрано. Возвращаю в меню.", mainKeyboard());
      autoDelete(chatId, m.message_id);
      autoDelete(chatId, query.message.message_id);
      return;
    }

    // Сбрасываем состояние заранее, чтобы повторные нажатия не дали мультиответ
    userState[chatId] = null;

    // Выполняем действие в зависимости от типа
    if (action === "YES_NO") {
      const m = await bot.sendMessage(
        chatId,
        `🎭 *Ответ:*\n\n_${randomFromArray(yesNoAnswers)}_`,
        { parse_mode: "Markdown", ...mainKeyboard() }
      );
      autoDelete(chatId, m.message_id);
      autoDelete(chatId, query.message.message_id);
      return;
    }

    if (action === "PREDICTION") {
      const m = await bot.sendMessage(
        chatId,
        `🔮 *Твоё предсказание:*\n\n_${randomFromArray(predictions)}_`,
        { parse_mode: "Markdown", ...mainKeyboard() }
      );
      autoDelete(chatId, m.message_id);
      autoDelete(chatId, query.message.message_id);
      return;
    }

    if (action === "ADVICE") {
      const m = await bot.sendMessage(
        chatId,
        `💡 *Совет дня:*\n\n_${randomFromArray(advices)}_`,
        { parse_mode: "Markdown", ...mainKeyboard() }
      );
      autoDelete(chatId, m.message_id);
      autoDelete(chatId, query.message.message_id);
      return;
    }

    if (action === "NUMBER") {
      const num = Math.floor(Math.random() * 100) + 1;
      const m = await bot.sendMessage(
        chatId,
        `🔢 *Число дня:* \`${num}\``,
        { parse_mode: "Markdown", ...mainKeyboard() }
      );
      autoDelete(chatId, m.message_id);
      autoDelete(chatId, query.message.message_id);
      return;
    }

    // fallback
    const m = await bot.sendMessage(chatId, "Неизвестное действие — возвращаю в меню.", mainKeyboard());
    autoDelete(chatId, m.message_id);
    autoDelete(chatId, query.message.message_id);
    return;
  }

  // Другие callback'и — игнорируем
});

// =============================
// 📨 USER MESSAGES (delete + hint)
// =============================
bot.on("message", msg => {
  // Не трогаем команды
  if (!msg.text || msg.text.startsWith("/")) return;

  const chatId = msg.chat.id;

  // Удаляем сообщение пользователя через 20 сек (так как вариант B)
  autoDelete(chatId, msg.message_id);

  // Подсказка и меню (бот отвечает и удаляет своё сообщение)
  bot.sendMessage(
    chatId,
    `Я услышал твой вопрос мысленно.
Нажми кнопку ниже, чтобы узнать ответ.`,
    mainKeyboard()
  ).then(m => autoDelete(chatId, m.message_id));
});

