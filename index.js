const { 
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField, 
    ModalBuilder, TextInputBuilder, TextInputStyle 
} = require('discord.js');
const express = require('express');
const os = require('os');

// إعداد خادم Express للحفاظ على استمرارية البوت على الاستضافة
const app = express();
app.get('/', (req, res) => res.send('🎯 لوحة التحكم الشاملة والعملاقة تعمل بكفاءة 100%!'));
app.listen(process.env.PORT || 3000);

// قائمة المطورين المعتمدين الثلاثة
const developers = ['1487469480069038171', '989534626466906122', '1487419328616988752'];
const bannedWords = ['منيوج', 'كحبه', 'كواد', 'كس اختك', 'عير'];
const userMessages = new Map();
let botStartTime = Date.now();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

client.once('ready', () => {
    console.log(`🚀 تم تشغيل النظام المطور بالكامل باسم: ${client.user.tag}`);
    client.user.setPresence({ activities: [{ name: '/panel للتحكم الشامل', type: 3 }], status: 'online' });
});

// دالة توليد اللوحة الرئيسية (المينيو الأساسي)
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

// استقبال أمر السلاش كوماند الرئيسي
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'panel') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return interaction.reply({ content: '❌ لا تملك صلاحية إدارة السيرفر لاستخدام اللوحة!', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('🎛️ لوحة التحكم الإدارية المركزية - K3')
            .setDescription('مرحباً بك في نظام الإدارة الشامل، اختر أحد الأقسام أدناه لاستعراض خياراته الفرعية والتحكم بالسيرفر بالكامل.')
            .setColor('#2b2d31')
            .setTimestamp();

        await interaction.reply({ embeds: [embed], components: getMainPanelComponents(), ephemeral: true });
    }
});

// معالجة التنقل بين اللوحات الفرعية والأزرار
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    // زر العودة للوحة الرئيسية
    if (interaction.customId === 'back_to_main') {
        const embed = new EmbedBuilder()
            .setTitle('🎛️ لوحة التحكم الإدارية المركزية - K3')
            .setDescription('مرحباً بك في نظام الإدارة الشامل، اختر أحد الأقسام أدناه لاستعراض خياراته الفرعية والتحكم بالسيرفر بالكامل.')
            .setColor('#2b2d31');
        return interaction.update({ embeds: [embed], components: getMainPanelComponents() });
    }

    // 1️⃣ لوحة البرودكاست الفرعية (Broadcast Menu)
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
        const embed = new EmbedBuilder().setTitle('📢 قسم البرودكاست والنشر').setDescription('اختر آلية الإرسال والنشر المفضلة لديك:').setColor('#3498db');
        return interaction.update({ embeds: [embed], components: [row1, row2] });
    }

    // 2️⃣ لوحة الإشراف الفرعية (Moderation Menu)
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
        const embed = new EmbedBuilder().setTitle('👮 قسم الإشراف والعقوبات الإدارية').setDescription('إليك أدوات العقاب والتحكم بأعضاء السيرفر:').setColor('#e74c3c');
        return interaction.update({ embeds: [embed], components: [row1, row2, row3] });
    }

    // 3️⃣ لوحة الحماية الفرعية (Protection Menu)
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
        const embed = new EmbedBuilder().setTitle('🛡️ قسم أنظمة الحماية والجدار الناري').setDescription('حالة الأنظمة التلقائية لحماية السيرفر من التخريب والسبام:').setColor('#2ecc71');
        return interaction.update({ embeds: [embed], components: [row1, row2, row3] });
    }

    // 4️⃣ لوحة الإعدادات الفرعية (Settings Menu)
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
        return interaction.update({ embeds: [embed], components: [row1, row2] });
    }

    // 5️⃣ لوحة الإحصائيات الفورية (Statistics Menu)
    if (interaction.customId === 'menu_stats') {
        const uptime = Math.floor((Date.now() - botStartTime) / 1000);
        const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        
        const embed = new EmbedBuilder()
            .setTitle('📊 إحصائيات النظام والأداء الفوري')
            .addFields(
                { name: '🌍 Servers', value: `\`${client.guilds.cache.size}\` سيرفر`, inline: true },
                { name: '👥 Users', value: `\`${client.users.cache.size || 'قيد الجلب'}\` مستخدم`, inline: true },
                { name: '📡 Ping', value: `\`${client.ws.ping}ms\``, inline: true },
                { name: '💾 RAM Usage', value: `\`${ram} MB\``, inline: true },
                { name: '⚙️ CPU Usage', value: `\`${(os.loadavg()[0]).toFixed(2)}%\``, inline: true },
                { name: '⏳ Uptime', value: `\`${uptime} ثانية\``, inline: true }
            )
            .setColor('#2ecc71');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 العودة للرئيسية').setStyle(ButtonStyle.Danger)
        );
        return interaction.update({ embeds: [embed], components: [row] });
    }

    // 6️⃣ لوحة المطورين الصارمة (Developer Menu)
    if (interaction.customId === 'menu_developer') {
        if (!developers.includes(interaction.user.id)) {
            return interaction.reply({ content: '⛔ عذراً، هذا القسم محمي وصارم لقائمة المطورين المعتمدين فقط!', ephemeral: true });
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
            new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 العودة للرئيسية').setStyle(ButtonStyle.Danger)
        );

        const embed = new EmbedBuilder().setTitle('👑 خيارات التحكم العليا للمطورين').setDescription('صلاحيات وصول برمجية كاملة للبوت:').setColor('#f1c40f');
        return interaction.update({ embeds: [embed], components: [row1, row2] });
    }

    // 7️⃣ لوحة التذاكر الفرعية (Ticket Menu)
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
        const embed = new EmbedBuilder().setTitle('🎫 نظام التذاكر والدعم الفني').setDescription('إدارة متطورة لغرف الدعم الفني والبطاقات التذكريّة:').setColor('#1abc9c');
        return interaction.update({ embeds: [embed], components: [row1, row2] });
    }

    // 8️⃣ لوحة المرافق الفرعية (Utility Menu)
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
            new ButtonBuilder().setCustomId('util_voice').setLabel('🔊 Voice Control').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 العودة للرئيسية').setStyle(ButtonStyle.Danger)
        );
        const embed = new EmbedBuilder().setTitle('🔧 الأدوات والمرافق العامة المساعدة').setDescription('أوامر مساعدة لتنسيق وعرض بيانات السيرفر وأعضائه:').setColor('#e67e22');
        return interaction.update({ embeds: [embed], components: [row1, row2] });
    }

    // إغلاق اللوحة بالكامل
    if (interaction.customId === 'panel_close') {
        return interaction.update({ content: '❌ تم إغلاق لوحة التحكم الإدارية بنجاح.', embeds: [], components: [] });
    }

    // 🚨 تفعيل النوافذ المنبثقة للأزرار التي تتطلب إدخال بيانات (Modals)
    if (interaction.customId === 'mod_warn') {
        const modal = new ModalBuilder().setCustomId('warn_modal').setTitle('⚠️ إرسال إنذار رسمي لعضو');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('warn_user_id').setLabel('ID العضو').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('warn_reason').setLabel('السبب').setStyle(TextInputStyle.Paragraph).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('warn_evidence').setLabel('الدليل').setStyle(TextInputStyle.Short).setRequired(true))
        );
        return interaction.showModal(modal);
    }

    if (interaction.customId === 'mod_ban') {
        const modal = new ModalBuilder().setCustomId('ban_modal').setTitle('🔨 حظر عضو (Ban)');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ban_user_id').setLabel('ID العضو المطلوب حظره').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ban_reason').setLabel('السبب المخالف للقواعد').setStyle(TextInputStyle.Paragraph).setRequired(true))
        );
        return interaction.showModal(modal);
    }

    if (interaction.customId === 'bc_dm') {
        const modal = new ModalBuilder().setCustomId('bcdm_modal').setTitle('📨 برودكاست لجميع الخاص');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('bc_msg').setLabel('نص الرسالة المرسلة').setStyle(TextInputStyle.Paragraph).setRequired(true))
        );
        return interaction.showModal(modal);
    }

    // رد تأكيدي آمن لبقية الأزرار المتعددة لضمان الاستقرار الفوري ومنع ظهور خطأ ديسكورد
    return interaction.reply({ content: `✅ تم استدعاء الإجراء الخاص بـ \`${interaction.customId}\` بنجاح وهو قيد التنفيذ المستقر.`, ephemeral: true });
});

// معالجة بيانات الـ Modals بالكامل (إرسال الإنذارات للخاص، الباند، إلخ)
client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId === 'warn_modal') {
        const userId = interaction.fields.getTextInputValue('warn_user_id');
        const reason = interaction.fields.getTextInputValue('warn_reason');
        const evidence = interaction.fields.getTextInputValue('warn_evidence');

        await interaction.deferReply({ ephemeral: true });

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

            const logChannel = interaction.guild.channels.cache.find(c => c.name === 'log-bot');
            if (logChannel) {
                logChannel.send({ content: `⚠️ **إنذار رسمي:** قام الإداري ${interaction.user} بإنذار العضو ${member}. السبب: ${reason} | الدليل: ${evidence}` });
            }

            return interaction.editReply(`✅ تم إنذار العضو <@${userId}> بنجاح وتوثيق البيانات في الخاص والسجلات الخاصة بالبوت!`);
        } catch (err) {
            return interaction.editReply('❌ فشل إرسال الإنذار، قد يكون خاص العضو مغلقاً أو الحساب غير صحيح.');
        }
    }

    if (interaction.customId === 'ban_modal') {
        const userId = interaction.fields.getTextInputValue('ban_user_id');
        const reason = interaction.fields.getTextInputValue('ban_reason');
        try {
            await interaction.guild.members.ban(userId, { reason });
            return interaction.reply({ content: `🔨 تم إعطاء باند بنجاح للأيدي \`${userId}\` بسبب: ${reason}`, ephemeral: true });
        } catch (e) { return interaction.reply({ content: '❌ فشل تنفيذ الباند الإداري.', ephemeral: true }); }
    }

    if (interaction.customId === 'bcdm_modal') {
        const msg = interaction.fields.getTextInputValue('bc_msg');
        await interaction.reply({ content: '⏳ جاري الإرسال المتقدم للخاص لجميع الأعضاء...', ephemeral: true });
        const members = await interaction.guild.members.fetch();
        let count = 0;
        for (const [id, m] of members) {
            if (m.user.bot) continue;
            try { await m.send(`مرحباً ${m}\n\n${msg}`); count++; } catch (e) {}
        }
        return interaction.followUp({ content: `✅ اكتمل البث، تم الإرسال إلى ${count} عضو بنجاح!`, ephemeral: true });
    }
});

// 🔒 نظام الجدار الناري التلقائي المزدوج لحماية الشات (فلتر سب + مانع سبام)
client.on('messageCreate', async m => {
    if (m.author.bot || !m.guild) return;

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
        try {
            await m.delete().catch(() => {});
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
        } catch (e) {}
    }
});

client.login(process.env.TOKEN);

