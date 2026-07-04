// 🛡️ نظام الحماية من الانهيار المفاجئ (يوضع في أول الملف لمنع انطفاء البوت)
process.on('unhandledRejection', (reason, promise) => {
    console.error('=== [خطأ غير معالج بالخلفية] ===');
    console.error('السبب:', reason);
});

process.on('uncaughtException', (err, origin) => {
    console.error('=== [انهيار غير متوقع بالنظام] ===');
    console.error('الخطأ:', err);
    console.error('المصدر:', origin);
});

const { 
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField, 
    ModalBuilder, TextInputBuilder, TextInputStyle 
} = require('discord.js');
const express = require('express');
const os = require('os');
const fs = require('fs');
const path = require('path');

// إعداد خادم Express للحفاظ على استمرارية البوت 24 ساعة
const app = express();
app.get('/', (req, res) => res.send('🎯 نظام حظر تعليق الأوامر يعمل بكفاءة قصوى!'));
app.listen(process.env.PORT || 3000);

// إعدادات المالك والملف المخزن للمطورين
const botOwner = '1487469480069038171';
const devFilePath = path.join(__dirname, 'developers.json');
let developers = ['1487469480069038171', '989534626466906122', '1487419328616988752'];

// تحميل قائمة المطورين المخزنة تلقائياً عند التشغيل
if (fs.existsSync(devFilePath)) {
    try {
        developers = JSON.parse(fs.readFileSync(devFilePath, 'utf8'));
        if (!developers.includes(botOwner)) developers.push(botOwner);
    } catch (e) {
        console.error("خطأ في قراءة ملف المطورين، تم الاعتماد على القائمة الافتراضية.", e);
    }
} else {
    fs.writeFileSync(devFilePath, JSON.stringify(developers, null, 2));
}

function saveDevelopers() {
    fs.writeFileSync(devFilePath, JSON.stringify(developers, null, 2));
}

const bannedWords = ['منيوج', 'كحبه', 'كواد', 'كس اختك', 'عير'];
const userMessages = new Map();
let botStartTime = Date.now();

// نظام تجميع كونسل السيرفرات الداخلي للمطورين
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
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

// عند تشغيل البوت: يتم تسجيل أمر السلاش تلقائياً
client.once('ready', async () => {
    logToConsole(`🚀 تم تشغيل البوت بنجاح باسم: ${client.user.tag}`);
    client.user.setPresence({ activities: [{ name: '/panel للتحكم المطلق', type: 3 }], status: 'online' });
    
    try {
        logToConsole('⏳ جاري تحديث وتسجيل أمر /panel تلقائياً في ديسكورد...');
        await client.application.commands.set([
            {
                name: 'panel',
                description: 'فتح لوحة التحكم الإدارية المركزية الشاملة لـ K3',
            }
        ]);
        logToConsole('✅ تم المزامنة والتسجيل بنجاح! الأمر جاهز ومحمي من التعليق.');
    } catch (error) {
        logToConsole(`❌ فشل تسجيل أمر السلاش تلقائياً: ${error.message}`);
    }
});

// دالة توليد اللوحة الرئيسية
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

// استقبال أمر السلاش كوماند الرئيسي مع كسر حاجز الـ 3 ثوانٍ فوراً
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'panel') {
        console.log(`📥 [إشعار فوري]: تم استقبال أمر /panel من المستخدم ${interaction.user.tag}`);

        try {
            // 🔒 تأجيل الاستجابة فوراً بأول جزء من الثانية لمنع خطأ ديسكورد
            await interaction.deferReply({ ephemeral: true }).catch((e) => {
                console.error("فشل عمل deferReply:", e.message);
            });

            if (!interaction.guild) {
                return interaction.editReply({ content: '❌ يجب تشغيل هذا الأمر داخل السيرفرات فقط!' }).catch(()=>{});
            }

            const isDeveloper = developers.includes(interaction.user.id);
            
            if (!isDeveloper && !interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                return interaction.editReply({ content: '❌ لا تملك صلاحية إدارة السيرفر لاستخدام اللوحة!' }).catch(()=>{});
            }

            logToConsole(`استدعاء اللوحة بواسطة: ${interaction.user.tag} في سيرفر: ${interaction.guild.name} (تخطي القيود: ${isDeveloper})`);

            const embed = new EmbedBuilder()
                .setTitle('🎛️ لوحة التحكم الإدارية المركزية - K3')
                .setDescription(isDeveloper ? '👑 **مرحباً بك يا مطور البوت. تم تفعيل تخطي القيود والصلاحيات المطلقة الموحدة!**' : 'مرحباً بك في نظام الإدارة الشامل للتحكم بالسيرفر.')
                .setColor(isDeveloper ? '#FFD700' : '#2b2d31')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed], components: getMainPanelComponents() }).catch((e)=>{
                console.error("فشل إرسال اللوحة في editReply:", e.message);
            });
        } catch (error) {
            console.error("خطأ داخلي في أمر panel:", error);
        }
    }
});

// معالجة التنقل بين اللوحات الفرعية والأزرار
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    try {
        const isDeveloper = developers.includes(interaction.user.id);
        const isOwner = interaction.user.id === botOwner;

        if (interaction.customId === 'back_to_main') {
            const embed = new EmbedBuilder()
                .setTitle('🎛️ لوحة التحكم الإدارية المركزية - K3')
                .setDescription(isDeveloper ? '👑 **صلاحيات المطور المطلقة مفعّلة.**' : 'مرحباً بك في نظام الإدارة الشامل للتحكم بالسيرفر.')
                .setColor(isDeveloper ? '#FFD700' : '#2b2d31');
            return interaction.update({ embeds: [embed], components: getMainPanelComponents() }).catch(()=>{});
        }

        // 1️⃣ لوحة البرودكاست
        if (interaction.customId === 'menu_broadcast') {
            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('bc_dm').setLabel('📨 DM Broadcast').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('bc_channel').setLabel('📢 Channel Broadcast').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('bc_everyone').setLabel('📣 Everyone Broadcast').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('bc_role').setLabel('🎯 Role Broadcast').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('bc_user').setLabel('👤 User Broadcast').setStyle(ButtonStyle.Secondary)
            );
            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('bc_sched').setLabel('⏰ Scheduled Broadcast').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 العودة للرئيسية').setStyle(ButtonStyle.Danger)
            );
            const embed = new EmbedBuilder().setTitle('📢 قسم البرودكاست والنشر').setDescription('اختر آلية الإرسال ونشر الرسائل:').setColor('#3498db');
            return interaction.update({ embeds: [embed], components: [row1, row2] }).catch(()=>{});
        }

        // 2️⃣ لوحة الإشراف
        if (interaction.customId === 'menu_moderation') {
            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('mod_kick').setLabel('団 Kick User').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('mod_ban').setLabel('🔨 Ban User').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('mod_unban').setLabel('🔓 Unban User').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('mod_timeout').setLabel('⏱ Timeout').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('mod_untimeout').setLabel('🔊 Untimeout').setStyle(ButtonStyle.Secondary)
            );
            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('mod_clear').setLabel('🗑 Clear Chat').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('mod_clear_bots').setLabel('🧹 Clear Bots').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('mod_warn').setLabel('⚠ Warn User').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('mod_warn_hist').setLabel('📜 Warn History').setStyle(ButtonStyle.Secondary)
            );
            const row3 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 العودة للرئيسية').setStyle(ButtonStyle.Danger)
            );
            const embed = new EmbedBuilder().setTitle('👮 قسم الإشراف والعقوبات الإدارية').setDescription('أدوات الإشراف والتحكم بالمخالفين:').setColor('#e74c3c');
            return interaction.update({ embeds: [embed], components: [row1, row2, row3] }).catch(()=>{});
        }

        // 3️⃣ لوحة الحماية
        if (interaction.customId === 'menu_protection') {
            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('prot_spam').setLabel('🚫 Anti Spam').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('prot_links').setLabel('🔗 Anti Links').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('prot_words').setLabel('🚷 Bad Words').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('prot_ev').setLabel('📢 Anti Everyone').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('prot_bot').setLabel('🤖 Anti Bot').setStyle(ButtonStyle.Secondary)
            );
            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('prot_ban').setLabel('🔨 Anti Ban').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('prot_kick').setLabel('団 Anti Kick').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('prot_chan').setLabel('📁 Anti Channel').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('prot_role').setLabel('🎭 Anti Role').setStyle(ButtonStyle.Danger)
            );
            const row3 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 العودة للرئيسية').setStyle(ButtonStyle.Danger)
            );
            const embed = new EmbedBuilder().setTitle('🛡️ قسم أنظمة الحماية والجدار الناري').setDescription('حالة أنظمة الحماية التلقائية للسيرفر:').setColor('#2ecc71');
            return interaction.update({ embeds: [embed], components: [row1, row2, row3] }).catch(()=>{});
        }

        // 4️⃣ لوحة الإعدادات
        if (interaction.customId === 'menu_settings') {
            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('set_logs').setLabel('📜 Logs Channel').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('set_img').setLabel('🖼 Bot Image').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('set_color').setLabel('🎨 Embed Color').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('set_prefix').setLabel('📝 Prefix').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('set_lang').setLabel('🌍 Language').setStyle(ButtonStyle.Secondary)
            );
            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('set_status').setLabel('📡 Status').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('set_owner').setLabel('👑 Owner').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 العودة للرئيسية').setStyle(ButtonStyle.Danger)
            );
            const embed = new EmbedBuilder().setTitle('⚙️ إعدادات البوت والسيرفر العامة').setDescription('تخصيص الخصائص الفنية والهوية البصرية للبوت:').setColor('#95a5a6');
            return interaction.update({ embeds: [embed], components: [row1, row2] }).catch(()=>{});
        }

        // 5️⃣ لوحة الإحصائيات
        if (interaction.customId === 'menu_stats') {
            const uptime = Math.floor((Date.now() - botStartTime) / 1000);
            const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
            
            const embed = new EmbedBuilder()
                .setTitle('📊 إحصائيات النظام والأداء الفوري')
                .addFields(
                    { name: '🌍 Servers', value: `\`${client.guilds.cache.size}\` سيرفر`, inline: true },
                    { name: '👥 Users', value: `\`${client.users.cache.size || 0}\` مستخدم`, inline: true },
                    { name: '📡 Ping', value: `\`${client.ws.ping}ms\``, inline: true },
                    { name: '💾 RAM Usage', value: `\`${ram} MB\``, inline: true },
                    { name: '⚙️ CPU Usage', value: `\`${(os.loadavg()[0]).toFixed(2)}%\``, inline: true },
                    { name: '⏳ Uptime', value: `\`${uptime} ثانية\``, inline: true }
                )
                .setColor('#2ecc71');

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 العودة للرئيسية').setStyle(ButtonStyle.Danger)
            );
            return interaction.update({ embeds: [embed], components: [row] }).catch(()=>{});
        }

        // 6️⃣ لوحة المطورين (تم هنا تصحيح السطر 323 بالكامل)
        if (interaction.customId === 'menu_developer') {
            if (!isDeveloper) {
                return interaction.reply({ content: '⛔ عذراً، this section is restricted to authorized developers only!', ephemeral: true }).catch(()=>{});
            }

            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('dev_info').setLabel('🤖 Bot Info').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('dev_reload').setLabel('🔄 Reload').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('dev_rel_ev').setLabel('📂 Reload Events').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('dev_rel_cmd').setLabel('📜 Reload Cmds').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('dev_cache').setLabel('🧹 Clear Cache').setStyle(ButtonStyle.Secondary)
            );
            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('dev_shutdown').setLabel('🛑 Shutdown').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('dev_restart').setLabel('♻ Restart').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('dev_backup').setLabel('📥 Backup Config').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('dev_console_logs').setLabel('📜 Console Logs').setStyle(ButtonStyle.Primary)
            );
            const row3 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('dev_add_member').setLabel('➕ Add Developer').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('dev_remove_member').setLabel('➖ Remove Developer').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 العودة للرئيسية').setStyle(ButtonStyle.Danger)
            );

            const embed = new EmbedBuilder()
                .setTitle('👑 خيارات التحكم العليا للمطورين والمالك')
                .setDescription(`**المطورين الحاليين بالنظام (${developers.length}):**\n${developers.map(id => `• <@${id}> (\`${id}\`)`).join('\n')}`)
                .setColor('#f1c40f');
            return interaction.update({ embeds: [embed], components: [row1, row2, row3] }).catch(()=>{});
        }

        // فتح نوافذ المطورين
        if (interaction.customId === 'dev_add_member') {
            if (!isOwner) return interaction.reply({ content: '⛔ هذا الخيار متاح حصرياً لصاحب البوت الأساسي فقط!', ephemeral: true }).catch(()=>{});
            const modal = new ModalBuilder().setCustomId('add_dev_modal').setTitle('👑 إضافة مطور جديد للبوت');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('new_dev_id').setLabel('ID حساب المطور المراد إضافته').setStyle(TextInputStyle.Short).setRequired(true)));
            return interaction.showModal(modal).catch(()=>{});
        }

        if (interaction.customId === 'dev_remove_member') {
            if (!isOwner) return interaction.reply({ content: '⛔ هذا الخيار متاح حصرياً لصاحب البوت الأساسي فقط!', ephemeral: true }).catch(()=>{});
            const modal = new ModalBuilder().setCustomId('remove_dev_modal').setTitle('👑 إزالة صلاحيات مطور');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('remove_dev_id').setLabel('ID حساب المطور المراد إزالته').setStyle(TextInputStyle.Short).setRequired(true)));
            return interaction.showModal(modal).catch(()=>{});
        }

        if (interaction.customId === 'dev_console_logs') {
            if (!isDeveloper) return;
            const logsText = globalConsoleLogs.length > 0 ? globalConsoleLogs.join('\n') : 'لا توجد سجلات حالية محفوظة في الكونسل المؤقت.';
            const embed = new EmbedBuilder()
                .setTitle('📜 لوحة مراقبة كونسل السيرفرات (Live Logs)')
                .setDescription(`\`\`\`txt\n${logsText.substring(0, 3900)}\n\`\`\``) // تم التصحيح هنا بعلامات باك تيك برمجية سليمة
                .setColor('#2b2d31')
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true }).catch(()=>{});
        }

        // 7️⃣ لوحة التذاكر
        if (interaction.customId === 'menu_ticket') {
            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('tkt_create').setLabel('🎫 Create Ticket').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('tkt_claim').setLabel('🙋 Claim Ticket').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('tkt_add').setLabel('➕ Add Member').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('tkt_remove').setLabel('➖ Remove Member').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('tkt_lock').setLabel('🔒 Lock Ticket').setStyle(ButtonStyle.Danger)
            );
            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('tkt_unlock').setLabel('🔓 Unlock Ticket').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('tkt_trans').setLabel('📜 Transcript').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('tkt_del').setLabel('🗑 Delete Ticket').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 العودة للرئيسية').setStyle(ButtonStyle.Danger)
            );
            const embed = new EmbedBuilder().setTitle('🎫 نظام التذاكر والدعم الفني').setDescription('إدارة غرف الدعم الفني:').setColor('#1abc9c');
            return interaction.update({ embeds: [embed], components: [row1, row2] }).catch(()=>{});
        }

        // 8️⃣ لوحة المرافق
        if (interaction.customId === 'menu_utility') {
            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('util_embed').setLabel('📩 Send Embed').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('util_server').setLabel('📋 Server Info').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('util_user').setLabel('👤 User Info').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('util_role').setLabel('🎭 Role Info').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('util_ann').setLabel('📢 Announcement').setStyle(ButtonStyle.Primary)
            );
            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('util_slow').setLabel('🪄 Slowmode').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('util_voice').setLabel('🔊 Voice Control').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 العودة للرئيسية').setStyle(ButtonStyle.Danger)
            );
            const embed = new EmbedBuilder().setTitle('🔧 الأدوات والمرافق العامة المساعدة').setDescription('أوامر مساعدة لتنسيق البيانات:').setColor('#e67e22');
            return interaction.update({ embeds: [embed], components: [row1, row2] }).catch(()=>{});
        }

        if (interaction.customId === 'panel_close') {
            return interaction.update({ content: '❌ تم إغلاق لوحة التحكم الإدارية بنجاح.', embeds: [], components: [] }).catch(()=>{});
        }

        if (interaction.customId === 'mod_warn') {
            const modal = new ModalBuilder().setCustomId('warn_modal').setTitle('⚠️ إرسال إنذار رسمي لعضو');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('warn_user_id').setLabel('ID العضو').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('warn_reason').setLabel('السبب').setStyle(TextInputStyle.Paragraph).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('warn_evidence').setLabel('الدليل').setStyle(TextInputStyle.Short).setRequired(true))
            );
            return interaction.showModal(modal).catch(()=>{});
        }

        if (interaction.customId === 'mod_ban') {
            const modal = new ModalBuilder().setCustomId('ban_modal').setTitle('🔨 حظر عضو (Ban)');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ban_user_id').setLabel('ID العضو المطلوب حظره').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ban_reason').setLabel('السبب المخالف للقواعد').setStyle(TextInputStyle.Paragraph).setRequired(true))
            );
            return interaction.showModal(modal).catch(()=>{});
        }

        if (interaction.customId === 'bc_dm') {
            const modal = new ModalBuilder().setCustomId('bcdm_modal').setTitle('📨 برودكاست لجميع الخاص');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('bc_msg').setLabel('نص الرسالة المرسلة').setStyle(TextInputStyle.Paragraph).setRequired(true))
            );
            return interaction.showModal(modal).catch(()=>{});
        }

        if (interaction.customId === 'dev_restart') {
            if (!isDeveloper) return;
            logToConsole(`⚠️ قام المطور ${interaction.user.tag} بعمل ريستارت كامل للبوت عبر اللوحة.`);
            await interaction.reply({ content: '♻️ جاري عمل ريستارت للبوت بالكامل وتحديث العمليات...', ephemeral: true }).catch(()=>{});
            process.exit();
        }
    } catch (err) {
        console.error(err);
    }
});

// معالجة بيانات الـ Modals Submit
client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;

    try {
        if (interaction.customId === 'add_dev_modal') {
            const newId = interaction.fields.getTextInputValue('new_dev_id').trim();
            if (developers.includes(newId)) return interaction.reply({ content: '❌ هذا المستخدم مسجل بالفعل كمطور في النظام!', ephemeral: true }).catch(()=>{});
            
            developers.push(newId);
            saveDevelopers();
            logToConsole(`👑 [إدارة العليا]: قام مالك البوت بإضافة مطور جديد للأيدي: ${newId}`);
            return interaction.reply({ content: `✅ تم إضافة المطور بنجاح وصارت لديه الصلاحيات المطلقة! الأيدي: \`${newId}\``, ephemeral: true }).catch(()=>{});
        }

        if (interaction.customId === 'remove_dev_modal') {
            const remId = interaction.fields.getTextInputValue('remove_dev_id').trim();
            if (remId === botOwner) return interaction.reply({ content: '❌ لا يمكنك إزالة نفسك كمالك للبوت!', ephemeral: true }).catch(()=>{});
            if (!developers.includes(remId)) return interaction.reply({ content: '❌ هذا الأيدي غير موجود أساساً بقائمة المطورين.', ephemeral: true });

            developers = developers.filter(id => id !== remId);
            saveDevelopers();
            logToConsole(`👑 [إدارة العليا]: قام مالك البوت بسحب صلاحيات المطور من الأيدي: ${remId}`);
            return interaction.reply({ content: `✅ تم سحب صلاحيات المطور بنجاح من الأيدي \`${remId}\` وإزالته من ملف التخزين!`, ephemeral: true }).catch(()=>{});
        }

        if (interaction.customId === 'warn_modal') {
            const userId = interaction.fields.getTextInputValue('warn_user_id');
            const reason = interaction.fields.getTextInputValue('warn_reason');
            const evidence = interaction.fields.getTextInputValue('warn_evidence');

            await interaction.deferReply({ ephemeral: true }).catch(()=>{});

            try {
                const member = await interaction.guild.members.fetch(userId);
                if (!member) return interaction.editReply('❌ لم يتم العثور على هذا العضو في السيرفر.');

                const warnEmbed = new EmbedBuilder()
                    .setTitle('⚠️ تم إرسال إنذار رسمي لك')
                    .setDescription(`لقد تلقيت إنذاراً داخل سيرفر: **${interaction.guild.name}**`)
                    .addFields(
                        { name: '👮 الإداري المسؤول:', value: `${interaction.user}` },
                        { name: '🚫 السبب المخالف:', value: reason },
                        { name: '📂 الدليل المرفق للواقعة:', value: evidence }
                    )
                    .setColor('#f1c40f')
                    .setTimestamp();

                await member.send({ embeds: [warnEmbed] });
                logToConsole(`⚠️ إنذار: ${interaction.user.tag} أنذر العضو ${member.user.tag} في سيرفر ${interaction.guild.name}. السبب: ${reason}`);

                const logChannel = interaction.guild.channels.cache.find(c => c.name === 'log-bot');
                if (logChannel) {
                    logChannel.send({ content: `⚠️ **إنذار رسمي:** قام الإداري ${interaction.user} بإنذار العضو ${member}. السبب: ${reason} | الدليل: ${evidence}` });
                }
                return interaction.editReply(`✅ تم إنذار العضو <@${userId}> بنجاح وتوثيق البيانات!`).catch(()=>{});
            } catch (err) {
                return interaction.editReply('❌ فشل إرسال الإنذار، قد يكون خاص العضو مغلقاً.').catch(()=>{});
            }
        }

        if (interaction.customId === 'ban_modal') {
            const userId = interaction.fields.getTextInputValue('ban_user_id');
            const reason = interaction.fields.getTextInputValue('ban_reason');
            await interaction.guild.members.ban(userId, { reason });
            logToConsole(`🔨 باند: ${interaction.user.tag} حظر الأيدي ${userId} في سيرفر ${interaction.guild.name}. السبب: ${reason}`);
            return interaction.reply({ content: `🔨 تم إعطاء باند بنجاح للأيدي \`${userId}\` بسبب: ${reason}`, ephemeral: true }).catch(()=>{});
        }

        if (interaction.customId === 'bcdm_modal') {
            const msg = interaction.fields.getTextInputValue('bc_msg');
            await interaction.reply({ content: '⏳ جاري الإرسال المتقدم للخاص لجميع الأعضاء...', ephemeral: true }).catch(()=>{});
            const members = await interaction.guild.members.fetch();
            let count = 0;
            for (const [id, m] of members) {
                if (m.user.bot) continue;
                try { await m.send(`مرحباً ${m}\n\n${msg}`); count++; } catch (e) {}
            }
            return interaction.followUp({ content: `✅ اكتمل البث، تم الإرسال إلى ${count} عضو بنجاح!`, ephemeral: true }).catch(()=>{});
        }
    } catch (error) {
        console.error(error);
    }
});

// 🔒 نظام الحماية التلقائي للشات
client.on('messageCreate', async m => {
    if (m.author.bot || !m.guild) return;
    if (developers.includes(m.author.id)) return;

    try {
        const content = m.content.toLowerCase();
        let isViolating = false;
        let logReason = '';

        if (bannedWords.some(w => content.includes(w))) {
            isViolating = true;
            logReason = 'استخدام ألفاظ محظورة وشتائم بالشات';
        }

        const authorId = m.author.id;
        const now = Date.now();
        if (!userMessages.has(authorId)) userMessages.set(authorId, []);
        const timestamps = userMessages.get(authorId);
        timestamps.push(now);

        const filteredTimestamps = timestamps.filter(time => now - time < 5000);
        userMessages.set(authorId, filteredTimestamps);

        if (filteredTimestamps.length > 5) {
            isViolating = true;
            logReason = 'إرسال سبام وتكرار الرسائل بكثافة عالية جداً (Anti-Spam)';
        }

        if (isViolating) {
            await m.delete().catch(() => {});
            logToConsole(`🛡️ حماية: تم تصفية رسالة من المخالف ${m.author.tag} بسبب ${logReason}`);
            
            const logChannel = m.guild.channels.cache.find(c => c.name === 'log-bot');
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('🛡️ رصد تلقائي للنظام الناري')
                    .setColor('#e74c3c')
                    .addFields(
                        { name: '👤 العضو المخالف:', value: `${m.author}`, inline: true },
                        { name: '📍 الروم الحالي:', value: `${m.channel}`, inline: true },
                        { name: '🚫 سبب الرصد والتصفية:', value: logReason }
                    )
                    .setTimestamp();
                logChannel.send({ embeds: [embed] });
            }
        }
    } catch (e) {}
});

client.login(process.env.TOKEN);
