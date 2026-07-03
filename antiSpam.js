const usersMap = new Map();
const config = require("./config.json");

module.exports = {
    name: "antiSpam",
    async execute(message, client) {
        if (!config.antiSpam.enabled || message.author.bot || !message.guild) return;

        const { maxMessages, time } = config.antiSpam;
        const userId = message.author.id;

        if (usersMap.has(userId)) {
            const userData = usersMap.get(userId);
            let { msgCount, lastMessage } = userData;
            msgCount++;

            if (parseInt(msgCount) === maxMessages) {
                try {
                    await message.delete();
                    await message.channel.send(`🚫 ${message.author} الرجاء التوقف عن السبام!`);
                } catch (err) {}
            } else if (msgCount > maxMessages) {
                try { await message.delete(); } catch {}
            } else {
                userData.msgCount = msgCount;
                usersMap.set(userId, userData);
            }
        } else {
            usersMap.set(userId, {
                msgCount: 1,
                lastMessage: message
            });

            setTimeout(() => {
                usersMap.delete(userId);
            }, time);
        }
    }
};
