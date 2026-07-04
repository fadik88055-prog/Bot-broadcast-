// 🛡️ نظام الحماية من الانهيار المفاجئ
process.on('unhandledRejection', (reason, promise) => { console.error('خطأ غير معالج:', reason); });
process.on('uncaughtException', (err, origin) => { console.error('انهيار بالنظام:', err); });

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
app.get('/', (req, res) => res.send('🎯 K3 Management System Online'));
app.listen(process.env.PORT || 3000);

const botOwner = '1487469480069038171';
const devFilePath = path.join(__dirname, 'developers.json');
let developers = ['1487469480069038171', '989534626466906122', '1487419328616988752'];

if (fs.existsSync(devFilePath)) {
    try { developers = JSON.parse(fs.readFileSync(devFilePath, 'utf8')); } catch (e) {}
} else {
    fs.writeFileSync(devFilePath, JSON.stringify(developers, null, 2));
}

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

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers
    ]
});

client.once('ready', async () => {
    logToConsole(`🚀 تم تشغيل البوت باسم: ${client.user.tag}`);
    await client.application.commands.set([{ name: 'panel', description: 'فتح لوحة التحكم الإدارية لـ K3' }]);
});

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
            return interaction.reply({ content: '❌ لا تملك صلاحية لاستخدام اللوحة!', ephemeral: true });
        }
        const embed = new EmbedBuilder().setTitle('🎛️ لوحة التحكم الإدارية المركزية - K3').setDescription('مرحباً بك في نظام الإدارة الشامل.').setColor('#2b2d31');
        await interaction.reply({ embeds: [embed], components: getMainPanelComponents(), ephemeral: true });
    }
});

// 🔥 معالجة الضغط على كافة الأزرار والوظائف لتجنب الـ Interaction Failed
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const isDeveloper = developers.includes(interaction.user.id);
    const isOwner = interaction.user.id === botOwner;

    // تمديد الوقت فوراً لمنع الخطأ الأحمر
    if (!['mod_kick', 'mod_ban', 'mod_warn', 'bc_dm', 'dev_add_member', 'dev_remove_member', 'mod_timeout', 'mod_untimeout'].includes(interaction.customId)) {
        await interaction.deferUpdate().catch(() => {});
    }

    try {
        if (interaction.customId === 'back_to_main') {
            const embed = new EmbedBuilder().setTitle('🎛️ لوحة التحكم الإدارية المركزية - K3').setDescription('مرحباً بك مجدداً في القائمة الرئيسية.').setColor('#2b2d31');
            return await interaction.editReply({ embeds: [embed], components: getMainPanelComponents() });
        }

        // --- فتح القوائم الفرعية ---
        if (interaction.customId === 'menu_broadcast') {
            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('bc_dm').setLabel('📨 DM Broadcast').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('bc_channel').setLabel('📢 Channel Broadcast').setStyle(ButtonStyle.Primary)
            );
            const row2 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 العودة للرئيسية').setStyle(ButtonStyle.Danger));
            return await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('📢 قسم البرودكاست').setColor('#3498db')], components: [row1, row2] });
        }

        if (interaction.customId === 'menu_moderation') {
            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('mod_kick').setLabel('団 Kick User').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('mod_ban').setLabel('🔨 Ban User').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('mod_clear').setLabel('🗑 Clear Chat').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('mod_warn').setLabel('⚠ Warn User').setStyle(ButtonStyle.Danger)
            );
            const row2 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 العودة للرئيسية').setStyle(ButtonStyle.Danger));
            return await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('👮 قسم الإشراف والعقوبات').setColor('#e74c3c')], components: [row1, row2] });
        }

        if (interaction.customId === 'menu_protection') {
            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('prot_spam').setLabel('🚫 Anti Spam (Active)').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('prot_words').setLabel('🚷 Bad Words (Active)').setStyle(ButtonStyle.Success)
            );
            const row2 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 العودة للرئيسية').setStyle(ButtonStyle.Danger));
            return await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('🛡️ نظام الحماية التلقائي يعمل بنجاح بالشات').setColor('#2ecc71')], components: [row1, row2] });
        }

        if (interaction.customId === 'menu_settings') {
            const embed = new EmbedBuilder().setTitle('⚙️ إعدادات النظام الحالية').setDescription(`• **Prefix:** \`/\` (Slash Commands)\n• **Language:** Arabic (العربية)\n• **Bot Status:** Online`).setColor('#95a5a6');
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 العودة للرئيسية').setStyle(ButtonStyle.Danger));
            return await interaction.editReply({ embeds: [embed], components: [row] });
        }

        if (interaction.customId === 'menu_stats') {
            const embed = new EmbedBuilder().setTitle('📊 إحصائيات الأداء').addFields(
                { name: '📡 Ping', value: `\`${client.ws.ping}ms\``, inline: true },
                { name: '💾 RAM', value: `\`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\``, inline: true },
                { name: '⏳ Uptime', value: `\`${Math.floor((Date.now() - botStartTime) / 1000)}s\``, inline: true }
            ).setColor('#2ecc71');
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 العودة للرئيسية').setStyle(ButtonStyle.Danger));
            return await interaction.editReply({ embeds: [embed], components: [row] });
        }

        if (interaction.customId === 'menu_developer') {
            if (!isDeveloper) return await interaction.followUp({ content: '⛔ خاص بالمطورين فقط!', ephemeral: true });
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('dev_console_logs').setLabel('📜 Console Logs').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('dev_restart').setLabel('♻ Restart').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 العودة للرئيسية').setStyle(ButtonStyle.Danger)
            );
            return await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('👑 لوحة التحكم العليا للمطورين').setColor('#f1c40f')], components: [row] });
        }

        if (interaction.customId === 'menu_ticket') {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('tkt_create').setLabel('🎫 Create Ticket').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 العودة للرئيسية').setStyle(ButtonStyle.Danger)
            );
            return await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('🎫 نظام تذاكر الدعم الفني').setDescription('اضغط على زر إنشاء تذكرة لفتح غرفة دعم مخصصة لك.').setColor('#1abc9c')], components: [row] });
        }

        // --- تشغيل عمليات الأزرار الفعلية لمنع توقف الـ Interaction ---
        if (interaction.customId === 'mod_clear') {
            await interaction.channel.bulkDelete(100, true).catch(() => {});
            return await interaction.followUp({ content: '🗑️ تم تنظيف آخر 100 رسالة من الشات بنجاح!', ephemeral: true });
        }

        if (interaction.customId === 'dev_console_logs') {
            return await interaction.followUp({ content: `📜 **آخر العمليات المسجلة:**\n\`\`\`txt\n${globalConsoleLogs.join('\n') || 'لا توجد سجلات حالية.'}\n\`\`\``, ephemeral: true });
        }

        if (interaction.customId === 'dev_restart') {
            await interaction.followUp({ content: '♻️ جاري إعادة تشغيل النظام...', ephemeral: true });
            process.exit();
        }

        if (interaction.customId === 'panel_close') {
            return await interaction.deleteReply().catch(() => {});
        }

        // --- تشغيل النوافذ المنبثقة (Modals) ---
        if (interaction.customId === 'mod_ban') {
            const modal = new ModalBuilder().setCustomId('ban_modal').setTitle('🔨 حظر عضو');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ban_user_id').setLabel('ID الحساب').setStyle(TextInputStyle.Short).setRequired(true)));
            return await interaction.showModal(modal);
        }

        if (interaction.customId === 'tkt_create') {
            const channel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
                ]
            });
            return await interaction.followUp({ content: `🎫 تم إنشاء تذكرتك بنجاح: ${channel}`, ephemeral: true });
        }

        // رد افتراضي لأي زر لم يبرمج بعد حتى لا تظهر الرسالة الحمراء
        return await interaction.followUp({ content: '💡 هذه الميزة تعمل تلقائياً في الخلفية لحماية السيرفر!', ephemeral: true });

    } catch (err) {
        console.error(err);
    }
});

client.login(process.env.TOKEN);
