// ========================================================
// 🛡️ 1. نظام الحماية من الانهيار المفاجئ (Anti-Crash)
// ========================================================
process.on('unhandledRejection', (reason, promise) => { console.error('خطأ غير معالج:', reason); });
process.on('uncaughtException', (err, origin) => { console.error('انهيار بالنظام:', err); });

// ========================================================
// 📦 2. استدعاء المكاتب وإعداد الخادم السحابي
// ========================================================
const { 
    Client, GatewayIntentBits, Collection, REST, Routes, 
    PermissionsBitField, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');
const { QuickDB } = require('quick.db');

const app = express();
app.get('/', (req, res) => res.send('🎯 البوت جاهز ويعمل بكفاءة!'));
app.listen(process.env.PORT || 3000);

// ========================================================
// ⚙️ 3. إعداد العميل وقاعدة البيانات
// ========================================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans, GatewayIntentBits.GuildVoiceStates
    ]
});

const db = new QuickDB();
client.commands = new Collection();
const commands = [];

// 🤬 فلتر السب العراقي المطور والمحدث بالكامل بناءً على طلبك
const bannedWords = [
    'منيوج', 'منيوچ', 'منيوچه', 'منيوجه', 'انيجك', 'انيچك', 
    'كلب', 'كواد', 'كحبه', 'بربوك', 'بربوكه', 'گواد', 
    'گحبه', 'چلب', 'جلب', 'كس اختك', 'عير'
];
const antiSpamMap = new Map();

// ========================================================
// 📁 4. قراءة ملفات الأوامر تلقائياً (Command Handler)
// ========================================================
const commandFiles = [
    'broadcast.js', 'moderation.js', 'protection.js', 
    'settings_stats.js', 'developer.js', 'tickets.js', 'utility.js', 'voice.js'
];

for (const file of commandFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        const command = require(filePath);
        if (command.data && command.data.name) {
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
        }
    }
}

// ========================================================
// 🚀 5. حدث تشغيل البوت وتسجيل الأوامر
// ========================================================
client.once('clientReady', async () => {
    console.log(`🚀 تم تسجيل الدخول بنجاح باسم: ${client.user.tag}`);
    
    const rest = new REST({ version: '10' }).setToken('MTUwNDA4ODkwNzI4Mzk1OTkxMQ.Gz1wZk.zD9DRvdQnXe-TNVnNEB6Os9Y3GJzUBDvxkq2mo');
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('✅ تم تسجيل وتفعيل جميع الأوامر والملفات بنجاح!');
    } catch (error) { console.error(error); }
});

// ========================================================
// 🎛️ 6. معالجة التفاعلات (Interactions Handler)
// ========================================================
client.on('interactionCreate', async interaction => {
    // 🛠️ تحقق وضع الصيانة للمطور
    const isMaintenance = await db.get('maintenance_mode');
    if (isMaintenance && interaction.user.id !== '1487469480069038171') {
        return await interaction.reply({ content: '⚠️ البوت في وضع الصيانة حالياً لترقية الأنظمة، يرجى المحاولة لاحقاً!', ephemeral: true });
    }

    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try { await command.execute(interaction); } catch (error) { console.error(error); }
    }

    if (interaction.isButton() || interaction.isStringSelectMenu()) {
        try {
            const ticketModule = require('./tickets.js');
            if (ticketModule && typeof ticketModule.handleButton === 'function') {
                await ticketModule.handleButton(interaction);
            }
        } catch (error) { console.error(error); }
    }

    if (interaction.isModalSubmit()) {
        await interaction.deferReply({ ephemeral: true });
        const messageText = interaction.fields.getTextInputValue('broadcast_text');
        const customId = interaction.customId;

        if (customId === 'modal_bc_dm') {
            await interaction.editReply('⏳ جاري بدء بث الرسائل الخاصة لجميع الأعضاء الحاليين...');
            const members = await interaction.guild.members.fetch();
            let succ = 0, fail = 0;
            for (const [id, member] of members) {
                if (member.user.bot) continue;
                try { await member.send(`${messageText}`); succ++; } catch (e) { fail++; }
            }
            return await interaction.editReply(`✅ **اكتمل البرودكاست الخاص!**\n📥 نجاح: \`${succ}\` | ❌ فشل: \`${fail}\``);
        }

        if (customId === 'modal_bc_channel') {
            await interaction.channel.send(`${messageText}`);
            return await interaction.editReply('📢 تم إرسال البرودكاست في هذا الروم.');
        }

        if (customId === 'modal_bc_everyone') {
            await interaction.channel.send(`@everyone\n\n${messageText}`);
            return await interaction.editReply('📣 تم إرسال البرودكاست مع @everyone بنجاح.');
        }

        if (customId.startsWith('modal_bc_role_')) {
            const roleId = customId.replace('modal_bc_role_', '');
            const role = interaction.guild.roles.cache.get(roleId);
            if (!role) return await interaction.editReply('❌ لم يتم العثور على الرتبة.');
            await interaction.guild.members.fetch();
            let succ = 0;
            for (const [id, member] of role.members) {
                if (member.user.bot) continue;
                try { await member.send(`📢 **برودكاست لرتبة [${role.name}]:**\n\n${messageText}`); succ++; } catch (e) {}
            }
            return await interaction.editReply(`🎯 تم الإرسال بنجاح إلى \`${succ}\` عضو يحمل الرتبة.`);
        }

        if (customId.startsWith('modal_bc_user_')) {
            const userId = customId.replace('modal_bc_user_', '');
            const target = await client.users.fetch(userId).catch(() => null);
            if (!target) return await interaction.editReply('❌ تعذر العثور على العضو.');
            try {
                await target.send(`<@${userId}>\n\n${messageText}`);
                return await interaction.editReply(`👤 تم الإرسال بنجاح وعمل منشن لـ <@${userId}>.`);
            } catch (e) { return await interaction.editReply('❌ الحساب مغلق الرسائل الخاصة.'); }
        }
    }
});

// ========================================================
// 🛡️ 7. فلاتر الحماية التلقائية بالاعتماد على قاعدة البيانات
// ========================================================
client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    const guildId = message.guild.id;

    const antiLinks = await db.get(`antilinks_${guildId}`);
    if (antiLinks && message.content.includes('http')) {
        await message.delete().catch(() => {});
        return message.channel.send(`🚫 عذراً <@${message.author.id}>، الروابط ممنوعة هنا!`).then(m => setTimeout(() => m.delete().catch(() => {}), 4000));
    }

    const badWords = await db.get(`badwords_${guildId}`);
    if (badWords) {
        const isBad = bannedWords.some(w => message.content.toLowerCase().includes(w));
        if (isBad) {
            await message.delete().catch(() => {});
            return message.channel.send(`⚠️ يرجى الالتزام بالاحترام والكلمات الطيبّة يا <@${message.author.id}>!`).then(m => setTimeout(() => m.delete().catch(() => {}), 4000));
        }
    }

    const antiEv = await db.get(`antieveryone_${guildId}`);
    if (antiEv && (message.content.includes('@everyone') || message.content.includes('@here'))) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.MentionEveryone)) {
            await message.delete().catch(() => {});
            return message.channel.send(`❌ <@${message.author.id}>، يمنع عمل منشن للجميع هنا!`).then(m => setTimeout(() => m.delete().catch(() => {}), 4000));
        }
    }

    const antiSpam = await db.get(`antispam_${guildId}`);
    if (antiSpam) {
        const count = antiSpamMap.get(message.author.id) || 0;
        antiSpamMap.set(message.author.id, count + 1);
        setTimeout(() => antiSpamMap.set(message.author.id, Math.max(0, (antiSpamMap.get(message.author.id) || 1) - 1)), 4000);

        if (count >= 4) {
            await message.delete().catch(() => {});
            return message.channel.send(`🚷 كفى سبام وتكرار يا <@${message.author.id}>!`).then(m => setTimeout(() => m.delete().catch(() => {}), 4000));
        }
    }
});

// ========================================================
// 📜 8. نظام اللوق الشامل والموسع
// ========================================================
async function getLogChannel(guild) {
    if (!guild) return null;
    const logChannelId = await db.get(`logs_${guild.id}`);
    return guild.channels.cache.get(logChannelId) || null;
}

client.on('messageDelete', async message => {
    if (!message.guild || !message.author || message.author.bot) return;
    const logChannel = await getLogChannel(message.guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle('🗑️ رسالة محذوفة')
        .addFields(
            { name: 'العضو صاحب الرسالة:', value: `<@${message.author.id}> (\`${message.author.id}\`)`, inline: true },
            { name: 'الروم:', value: `<#${message.channel.id}>`, inline: true },
            { name: 'المحتوى:', value: `\`\`\`${message.content || 'محتوى غير نصي أو ملف'}\`\`\`` }
        ).setColor('#f1c40f').setTimestamp();
    logChannel.send({ embeds: [embed] }).catch(() => {});
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (!oldMessage.guild || !oldMessage.author || oldMessage.author.bot) return;
    if (oldMessage.content === newMessage.content) return; 

    const logChannel = await getLogChannel(oldMessage.guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle('📝 رسالة معدّلة')
        .addFields(
            { name: 'العضو:', value: `<@${oldMessage.author.id}>`, inline: true },
            { name: 'الروم:', value: `<#${oldMessage.channel.id}>`, inline: true },
            { name: 'المحتوى القديم:', value: `\`\`\`${oldMessage.content || 'لا يوجد'}\`\`\`` },
            { name: 'المحتوى الجديد:', value: `\`\`\`${newMessage.content || 'لا يوجد'}\`\`\`` }
        ).setColor('#3498db').setTimestamp();
    logChannel.send({ embeds: [embed] }).catch(() => {});
});

client.on('guildMemberAdd', async member => {
    const logChannel = await getLogChannel(member.guild);
    
    const antiBot = await db.get(`antibot_${member.guild.id}`);
    if (antiBot && member.user.bot) {
        await member.kick('حماية السيرفر ضد البوتات الخارجية مفعّلة.').catch(() => {});
        if (logChannel) {
            const embed = new EmbedBuilder()
                .setTitle('🛡️ طرد بوت غريب تلقائياً')
                .setDescription(`تم طرد البوت: ${member.user.tag}\nالمعرف: \`${member.id}\``)
                .setColor('#e74c3c').setTimestamp();
            return logChannel.send({ embeds: [embed] }).catch(() => {});
        }
        return;
    }

    if (!logChannel) return;
    const accountAge = Math.floor((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24));

    const embed = new EmbedBuilder()
        .setTitle('📥 عضو جديد دخل السيرفر')
        .setDescription(`**العضو:** ${member.user.tag} (<@${member.id}>)\n**عمر الحساب:** \`${accountAge}\` يوم`)
        .setColor('#2ecc71').setTimestamp();
    logChannel.send({ embeds: [embed] }).catch(() => {});
});

client.on('guildMemberRemove', async member => {
    const logChannel = await getLogChannel(member.guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle('📤 عضو غادر السيرفر')
        .setDescription(`**العضو:** ${member.user.tag} (<@${member.id}>)\nخرج أو تم طرده من الخادم.`)
        .setColor('#e67e22').setTimestamp();
    logChannel.send({ embeds: [embed] }).catch(() => {});
});

client.on('guildBanAdd', async ban => {
    const logChannel = await getLogChannel(ban.guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle('🔨 حظر عضو (Ban)')
        .setDescription(`**المستخدم:** ${ban.user.tag}\n**المعرف:** \`${ban.user.id}\``)
        .setColor('#e74c3c').setTimestamp();
    logChannel.send({ embeds: [embed] }).catch(() => {});
});

client.on('guildBanRemove', async ban => {
    const logChannel = await getLogChannel(ban.guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle('🔓 فك حظر عن عضو (Unban)')
        .setDescription(`**المستخدم:** ${ban.user.tag}\n**المعرف:** \`${ban.user.id}\``)
        .setColor('#2ecc71').setTimestamp();
    logChannel.send({ embeds: [embed] }).catch(() => {});
});

// ========================================================
// 🔑 9. تسجيل الدخول بالتوكن
// ========================================================
client.login('MTUwNDA4ODkwNzI4Mzk1OTkxMQ.Gz1wZk.zD9DRvdQnXe-TNVnNEB6Os9Y3GJzUBDvxkq2mo');
