// ========================================================
// 🛡️ 1. نظام الحماية من الانهيار المفاجئ 
// ========================================================
process.on('unhandledRejection', (reason, promise) => { console.error('خطأ غير معالج:', reason); });
process.on('uncaughtException', (err, origin) => { console.error('انهيار بالنظام:', err); });

// ========================================================
// 📦 2. استدعاء المكاتب وإعداد الخادم
// ========================================================
const { 
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField, 
    ModalBuilder, TextInputBuilder, TextInputStyle 
} = require('discord.js');
const express = require('express');
const os = require('os');
const fs = require('fs');
const path = require('path');

const app = express();
app.get('/', (req, res) => res.send('🎯 نظام لوحة التحكم الإدارية يعمل بنجاح!'));
app.listen(process.env.PORT || 3000);

// ========================================================
// ⚙️ 3. المتغيرات وإعدادات النظام
// ========================================================
const botOwner = '1487469480069038171';
const devFilePath = path.join(__dirname, 'developers.json');
let developers = ['1487469480069038171', '989534626466906122', '1487419328616988752'];

// متغيرات أنظمة الحماية
let antiSpamEnabled = false;
let antiWordsEnabled = false;
const bannedWords = ['منيوج', 'كحبه', 'كواد', 'كس اختك', 'عير'];
const userMessages = new Map();

let botStartTime = Date.now();
let globalConsoleLogs = [];

function logToConsole(message) {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    const logEntry = `[${timeStr}] ${message}`;
    console.log(logEntry);
    globalConsoleLogs.push(logEntry);
    if (globalConsoleLogs.length > 25) globalConsoleLogs.shift();
}

// ========================================================
// 🤖 4. إعداد البوت
// ========================================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers
    ]
});

client.once('ready', async () => {
    logToConsole(`🚀 تم تشغيل البوت بنجاح باسم: ${client.user.tag}`);
    client.user.setPresence({ activities: [{ name: '/panel', type: 3 }], status: 'online' });
    
    try {
        await client.application.commands.set([{ name: 'panel', description: 'فتح لوحة التحكم الإدارية المركزية لـ K3' }]);
    } catch (err) { console.error(err); }
});

// ========================================================
// 🎛️ 5. تصميم اللوحة الرئيسية
// ========================================================
function getMainPanelComponents() {
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('menu_broadcast').setLabel('📢 البرودكاست').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('menu_moderation').setLabel('👮 الإشراف').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('menu_protection').setLabel('🛡️ الحماية').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('menu_settings').setLabel('⚙️ الإعدادات').setStyle(ButtonStyle.Secondary)
    );
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('menu_stats').setLabel('📊 الإحصائيات').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('menu_developer').setLabel('👑 المطورون').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('menu_ticket').setLabel('🎫 التذاكر').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('menu_utility').setLabel('🔧 المرافق العامة').setStyle(ButtonStyle.Secondary)
    );
    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('panel_close').setLabel('❌ إغلاق اللوحة').setStyle(ButtonStyle.Danger)
    );
    return [row1, row2, row3];
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'panel') {
        const isDeveloper = developers.includes(interaction.user.id);
        if (!isDeveloper && !interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return interaction.reply({ content: '❌ لا تملك صلاحية إدارة السيرفر لاستخدام اللوحة!', ephemeral: true });
        }
        const embed = new EmbedBuilder().setTitle('🎛️ لوحة التحكم الإدارية المركزية - K3').setDescription('مرحباً بك في نظام الإدارة. يرجى اختيار القسم المطلوب.').setColor('#2b2d31').setTimestamp();
        await interaction.reply({ embeds: [embed], components: getMainPanelComponents(), ephemeral: true });
    }
});

// ========================================================
// 🖱️ 6. معالجة كافة الأزرار بالكامل
// ========================================================
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    const isDeveloper = developers.includes(interaction.user.id);

    try {
        // --- العودة وإغلاق اللوحة ---
        if (interaction.customId === 'back_to_main') {
            const embed = new EmbedBuilder().setTitle('🎛️ لوحة التحكم الإدارية المركزية - K3').setColor('#2b2d31');
            return await interaction.update({ embeds: [embed], components: getMainPanelComponents() });
        }
        if (interaction.customId === 'panel_close') {
            return await interaction.update({ content: '❌ تم إغلاق اللوحة.', embeds: [], components: [] });
        }

        // ================== القوائم الفرعية ==================
        if (interaction.customId === 'menu_broadcast') {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('bc_dm').setLabel('📨 رسالة للأعضاء (DM)').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('bc_channel').setLabel('📢 رسالة للشات (Channel)').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 رجوع').setStyle(ButtonStyle.Danger)
            );
            return await interaction.update({ embeds: [new EmbedBuilder().setTitle('📢 قسم البرودكاست').setColor('#3498db')], components: [row] });
        }

        if (interaction.customId === 'menu_moderation') {
            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('mod_kick').setLabel('団 طرد (Kick)').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('mod_ban').setLabel('🔨 حظر (Ban)').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('mod_warn').setLabel('⚠️ تحذير (Warn)').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('mod_clear').setLabel('🗑 مسح الشات').setStyle(ButtonStyle.Primary)
            );
            const row2 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 رجوع').setStyle(ButtonStyle.Danger));
            return await interaction.update({ embeds: [new EmbedBuilder().setTitle('👮 الإشراف والعقوبات').setColor('#e74c3c')], components: [row1, row2] });
        }

        if (interaction.customId === 'menu_protection') {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('prot_spam').setLabel(antiSpamEnabled ? '🟢 Anti-Spam (شغال)' : '🔴 Anti-Spam (مغلق)').setStyle(antiSpamEnabled ? ButtonStyle.Success : ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('prot_words').setLabel(antiWordsEnabled ? '🟢 منع السب (شغال)' : '🔴 منع السب (مغلق)').setStyle(antiWordsEnabled ? ButtonStyle.Success : ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 رجوع').setStyle(ButtonStyle.Secondary)
            );
            return await interaction.update({ embeds: [new EmbedBuilder().setTitle('🛡️ نظام الحماية التلقائي').setColor('#2ecc71')], components: [row] });
        }

        if (interaction.customId === 'menu_settings') {
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 رجوع').setStyle(ButtonStyle.Danger));
            return await interaction.update({ embeds: [new EmbedBuilder().setTitle('⚙️ الإعدادات العامة').setDescription('اللغة الحالية: العربية\nالبريفكس: Slash Commands').setColor('#95a5a6')], components: [row] });
        }

        if (interaction.customId === 'menu_stats') {
            const uptime = Math.floor((Date.now() - botStartTime) / 1000);
            const embed = new EmbedBuilder().setTitle('📊 إحصائيات النظام').addFields(
                { name: '📡 البنق (Ping)', value: `${client.ws.ping}ms`, inline: true },
                { name: '⏳ مدة التشغيل', value: `${uptime} ثانية`, inline: true },
                { name: '👥 عدد الأعضاء', value: `${interaction.guild.memberCount}`, inline: true }
            ).setColor('#2ecc71');
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 رجوع').setStyle(ButtonStyle.Danger));
            return await interaction.update({ embeds: [embed], components: [row] });
        }

        if (interaction.customId === 'menu_developer') {
            if (!isDeveloper) return await interaction.reply({ content: '⛔ خاص بالمطورين فقط!', ephemeral: true });
            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('dev_restart').setLabel('♻ إعادة تشغيل البوت').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('dev_console_logs').setLabel('📜 سجلات النظام (Logs)').setStyle(ButtonStyle.Primary)
            );
            const row2 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 رجوع').setStyle(ButtonStyle.Danger));
            return await interaction.update({ embeds: [new EmbedBuilder().setTitle('👑 تحكم المطورين').setColor('#f1c40f')], components: [row1, row2] });
        }

        if (interaction.customId === 'menu_ticket') {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('tkt_create').setLabel('🎫 فتح تذكرة دعم').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 رجوع').setStyle(ButtonStyle.Danger)
            );
            return await interaction.update({ embeds: [new EmbedBuilder().setTitle('🎫 نظام التذاكر').setDescription('اضغط على الزر لفتح تذكرة دعم خاصة بك.').setColor('#1abc9c')], components: [row] });
        }

        if (interaction.customId === 'menu_utility') {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('util_server').setLabel('📋 معلومات السيرفر').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 رجوع').setStyle(ButtonStyle.Danger)
            );
            return await interaction.update({ embeds: [new EmbedBuilder().setTitle('🔧 المرافق العامة').setColor('#e67e22')], components: [row] });
        }

        // ================== العمليات المباشرة (بدون نوافذ منبثقة) ==================
        if (interaction.customId === 'mod_clear') {
            await interaction.deferReply({ ephemeral: true });
            await interaction.channel.bulkDelete(100, true).catch(() => {});
            return await interaction.editReply('✅ **تم مسح آخر 100 رسالة من الشات بنجاح.**');
        }

        if (interaction.customId === 'dev_console_logs') {
            const logsText = globalConsoleLogs.length > 0 ? globalConsoleLogs.join('\n') : 'لا توجد سجلات حالياً.';
            return await interaction.reply({ content: `\`\`\`txt\n${logsText.substring(0, 1900)}\n\`\`\``, ephemeral: true });
        }

        if (interaction.customId === 'dev_restart') {
            await interaction.reply({ content: '♻️ جاري إعادة التشغيل الآن...', ephemeral: true });
            process.exit();
        }

        if (interaction.customId === 'prot_spam') {
            antiSpamEnabled = !antiSpamEnabled;
            return await interaction.reply({ content: `🛡️ حماية السبام الآن: **${antiSpamEnabled ? 'شغالة 🟢' : 'مغلقة 🔴'}**`, ephemeral: true });
        }

        if (interaction.customId === 'prot_words') {
            antiWordsEnabled = !antiWordsEnabled;
            return await interaction.reply({ content: `🚷 حماية الكلمات البذيئة الآن: **${antiWordsEnabled ? 'شغالة 🟢' : 'مغلقة 🔴'}**`, ephemeral: true });
        }

        if (interaction.customId === 'tkt_create') {
            await interaction.deferReply({ ephemeral: true });
            const channel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
                ]
            });
            await channel.send(`مرحباً <@${interaction.user.id}>، هذه تذكرتك الخاصة. كيف يمكننا مساعدتك؟`);
            return await interaction.editReply(`✅ **تم فتح التذكرة بنجاح:** <#${channel.id}>`);
        }

        if (interaction.customId === 'util_server') {
            const embed = new EmbedBuilder()
                .setTitle(`معلومات سيرفر: ${interaction.guild.name}`)
                .addFields(
                    { name: '👑 الأونر', value: `<@${interaction.guild.ownerId}>`, inline: true },
                    { name: '👥 الأعضاء', value: `${interaction.guild.memberCount}`, inline: true },
                    { name: '📅 تاريخ الإنشاء', value: `<t:${Math.floor(interaction.guild.createdTimestamp / 1000)}:R>`, inline: true }
                ).setColor('#3498db');
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ================== النوافذ المنبثقة (Modals) ==================
        if (interaction.customId === 'mod_ban') {
            const modal = new ModalBuilder().setCustomId('modal_ban').setTitle('🔨 حظر عضو');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_id').setLabel('أيدي العضو (ID)').setStyle(TextInputStyle.Short).setRequired(true)));
            return await interaction.showModal(modal);
        }

        if (interaction.customId === 'mod_kick') {
            const modal = new ModalBuilder().setCustomId('modal_kick').setTitle('団 طرد عضو');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_id').setLabel('أيدي العضو (ID)').setStyle(TextInputStyle.Short).setRequired(true)));
            return await interaction.showModal(modal);
        }

        if (interaction.customId === 'mod_warn') {
            const modal = new ModalBuilder().setCustomId('modal_warn').setTitle('⚠️ تحذير عضو');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_id').setLabel('أيدي العضو (ID)').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_reason').setLabel('سبب التحذير').setStyle(TextInputStyle.Paragraph).setRequired(true))
            );
            return await interaction.showModal(modal);
        }

        if (interaction.customId === 'bc_channel') {
            const modal = new ModalBuilder().setCustomId('modal_bc_channel').setTitle('📢 إرسال رسالة للشات');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_msg').setLabel('الرسالة').setStyle(TextInputStyle.Paragraph).setRequired(true)));
            return await interaction.showModal(modal);
        }

        if (interaction.customId === 'bc_dm') {
            const modal = new ModalBuilder().setCustomId('modal_bc_dm').setTitle('📨 إرسال رسالة للأعضاء');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_msg').setLabel('الرسالة').setStyle(TextInputStyle.Paragraph).setRequired(true)));
            return await interaction.showModal(modal);
        }

    } catch (err) {
        console.error("خطأ عام في الأزرار:", err);
    }
});

// ========================================================
// 📝 7. معالجة بيانات النوافذ المنبثقة بعد إرسالها (Modals Submit)
// ========================================================
client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;

    try {
        await interaction.deferReply({ ephemeral: true });

        if (interaction.customId === 'modal_ban') {
            const userId = interaction.fields.getTextInputValue('input_id');
            await interaction.guild.members.ban(userId).catch(() => {});
            return await interaction.editReply(`✅ تم إعطاء باند للعضو صاحب الأيدي: \`${userId}\``);
        }

        if (interaction.customId === 'modal_kick') {
            const userId = interaction.fields.getTextInputValue('input_id');
            await interaction.guild.members.kick(userId).catch(() => {});
            return await interaction.editReply(`✅ تم طرد العضو صاحب الأيدي: \`${userId}\``);
        }

        if (interaction.customId === 'modal_warn') {
            const userId = interaction.fields.getTextInputValue('input_id');
            const reason = interaction.fields.getTextInputValue('input_reason');
            const user = await client.users.fetch(userId).catch(()=>{});
            if(user) await user.send(`⚠️ **لقد تلقيت تحذيراً من سيرفر ${interaction.guild.name}:**\nالسبب: ${reason}`).catch(()=>{});
            return await interaction.editReply(`✅ تم إرسال التحذير للعضو بنجاح.`);
        }

        if (interaction.customId === 'modal_bc_channel') {
            const msg = interaction.fields.getTextInputValue('input_msg');
            await interaction.channel.send(msg);
            return await interaction.editReply(`✅ تم إرسال الرسالة في الشات بنجاح.`);
        }

        if (interaction.customId === 'modal_bc_dm') {
            const msg = interaction.fields.getTextInputValue('input_msg');
            // ملاحظة: إرسال DM للجميع قد يعرض البوت للحظر من ديسكورد بسبب الـ Rate Limit.
            // هذا الكود يرسل لعضو واحد للتجربة (نفس العضو اللي طلب الأمر)، يمكن تطويره لاحقاً للكل.
            await interaction.user.send(`[تجربة برودكاست]\n${msg}`).catch(()=>{});
            return await interaction.editReply(`✅ تم إرسال البرودكاست (بوضع التجربة).`);
        }

    } catch (err) {
        console.error("خطأ في النوافذ:", err);
        await interaction.editReply('❌ حدث خطأ أثناء تنفيذ الطلب. تأكد من صحة الأيدي (ID).').catch(()=>{});
    }
});

// ========================================================
// 🛡️ 8. نظام الحماية (Anti-Spam & Bad Words) يعمل بالخلفية
// ========================================================
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // 1. نظام الكلمات البذيئة
    if (antiWordsEnabled) {
        const hasBadWord = bannedWords.some(word => message.content.includes(word));
        if (hasBadWord) {
            await message.delete().catch(() => {});
            const warningMsg = await message.channel.send(`⚠️ يرجى احترام الشات يا <@${message.author.id}>، الكلمات البذيئة ممنوعة!`);
            setTimeout(() => warningMsg.delete().catch(()=> {}), 5000);
            return; // توقف هنا حتى لا يحسب سبام
        }
    }

    // 2. نظام منع السبام والتكرار السريع
    if (antiSpamEnabled) {
        const userMsgCount = userMessages.get(message.author.id) || 0;
        userMessages.set(message.author.id, userMsgCount + 1);

        setTimeout(() => {
            const count = userMessages.get(message.author.id) || 0;
            if (count > 0) userMessages.set(message.author.id, count - 1);
        }, 5000); // يمسح الرسائل المحسوبة بعد 5 ثواني

        if (userMsgCount >= 4) { // إذا أرسل أكثر من 4 رسائل في 5 ثواني
            await message.delete().catch(() => {});
            const warningMsg = await message.channel.send(`🚫 <@${message.author.id}> الرجاء التوقف عن السبام (التكرار السريع)!`);
            setTimeout(() => warningMsg.delete().catch(()=> {}), 5000);
        }
    }
});

client.login(process.env.TOKEN);
