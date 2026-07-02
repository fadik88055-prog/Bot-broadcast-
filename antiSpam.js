const config = require("./config.json");

// نخزن الرسائل مؤقتًا
const users = new Map();

module.exports = {
    name: "messageCreate",

    async execute(message, client) {

        if (!message.guild) return;
        if (message.author.bot) return;

        const userId = message.author.id;

        const now = Date.now();

        const spamConfig = config.antiSpam || {
            enabled: true,
            maxMessages: 5,
            time: 5000
        };

        if (!spamConfig.enabled) return;

        // إذا أول مرة
        if (!users.has(userId)) {
            users.set(userId, []);
        }

        const timestamps = users.get(userId);

        // نحذف الرسائل القديمة
        const filtered = timestamps.filter(t => now - t < spamConfig.time);

        filtered.push(now);

        users.set(userId, filtered);

        // إذا تجاوز الحد
        if (filtered.length > spamConfig.maxMessages) {

            try {
                await message.delete();
            } catch {}

            try {
                await message.member.timeout(
                    10 * 60 * 1000,
                    "Anti-Spam System"
                );
            } catch {}

            message.channel.send({
                content: `🚫 ${message.author} تم كتمك مؤقتًا بسبب السبام`
            });

            users.set(userId, []);

        }

    }
};
