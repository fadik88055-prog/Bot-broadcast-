const { 
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField, 
    ModalBuilder, TextInputBuilder, TextInputStyle 
} = require('discord.js');
const express = require('express');

// قائمة المطورين الثلاثة
const developers = ['1487469480069038171', '989534626466906122', '1487419328616988752'];

const app = express();
app.get('/', (req, res) => res.send('🎯 البوت جاهز ومكتمل بكافة أنظمة الإشراف والحماية!'));
app.listen(process.env.PORT || 3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

const bannedWords = ['منيوج', 'كحبه', 'كواد', 'كس اختك', 'عير'];
const userMessages = new Map();

client.once('ready', () => {
    console.log(`✅ البوت متصل ومبرمج بالكامل: ${client.user.tag}`);
    client.user.setPresence({ activities: [{ name: '/panel لإدارة السيرفرات', type: 3 }], status: 'online' });
});

// اللوحة الرئيسية
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'panel') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return;

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('broadcast_main').setLabel('📢 بث متطور').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('moderation_main').setLabel('👮 إشراف').setStyle(ButtonStyle.Danger)
        );
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('protection_main').setLabel('🛡️ حماية').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('settings_main').setLabel('⚙️ إعدادات').setStyle(ButtonStyle.Secondary)
        );
        const row3 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('stats').setLabel('📊 إحصائيات').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('close').setLabel('❌ إغلاق').setStyle(ButtonStyle.Danger)
        );
        const row4 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('dev_menu').setLabel('👑 المطورون').setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ content: '🎛️ **لوحة التحكم الإدارية الاحترافية:**', components: [row1, row2, row3, row4], ephemeral: true });
    }
});

// نظام معالجة الأزرار
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    // ⚙️ زر الإعدادات المطور
    if (interaction.customId === 'settings_main') {
        const embed = new EmbedBuilder()
            .setTitle('⚙️ لوحة الإعدادات والتحكم')
            .setDescription('مرحباً بك في لوحة الإعدادات، هنا يمكنك فحص حالة النظام بالكامل:')
            .addFields(
                { name: '🔒 نظام الحماية', value: '🟢 مفعّل (فلتر السب + مانع السبام)', inline: true },
                { name: '👮 نظام الإشراف', value: '🟢 مفعّل (باند، كيك، تايم، إنذار)', inline: true },
                { name: '📁 روم السجلات (Log)', value: 'يجب تسمية الروم `log-bot` لتلقي الإشعارات.', inline: false }
            )
            .setColor('#7f8c8d');
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // 👮 زر الإشراف الرئيسي (فتح أزرار العقوبات الفرعية)
    if (interaction.customId === 'moderation_main') {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('mod_ban').setLabel('🔨 باند (Ban)').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('mod_kick').setLabel('🚪 كيك (Kick)').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('mod_timeout').setLabel('⏳ تايم أوت (Timeout)').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('mod_warn').setLabel('⚠️ إنذار للخاص (Warn)').setStyle(ButtonStyle.Primary)
        );
        return interaction.reply({ content: '👮 **اختر الإجراء الإداري المطلوب تنفيذه:**', components: [row], ephemeral: true });
    }

    // 🛡️ زر الحماية التوضيحي
    if (interaction.customId === 'protection_main') {
        const embed = new EmbedBuilder()
            .setTitle('🛡️ نظام الحماية المزدوج')
            .setDescription('البوت محمي حالياً بنظامين صارمين يعملان معاً تلقائياً في الخلفية:')
            .addFields(
                { name: '1️⃣ فلتر الشتائم والسب:', value: 'يتم فحص ومقارنة الكلمات المحظورة وحذفها فوراً مع إرسال لوق.' },
                { name: '2️⃣ مانع السبام التلقائي:', value: 'إذا أرسل العضو أكثر من 5 رسائل خلال 5 ثوانٍ يتم تصفية شاته وحذف الرسائل لحماية السيرفر من التخريب.' }
            )
            .setColor('#2980b9');
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // فتح نافذة الإنذار المنبثقة عند الضغط على زر الإنذار
    if (interaction.customId === 'mod_warn') {
        const modal = new ModalBuilder().setCustomId('warn_modal').setTitle('⚠️ إرسال إنذار رسمي لعضو');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('warn_user_id').setLabel('ID العضو المراد إنذاره').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('warn_reason').setLabel('سبب الإنذار').setStyle(TextInputStyle.Paragraph).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('warn_evidence').setLabel('الدليل (رابط صورة أو رسالة)').setStyle(TextInputStyle.Short).setRequired(true))
        );
        return interaction.showModal(modal);
    }

    // النوافذ المنبثقة للباند والكيك والتايم أوت لتعمل بكفاءة
    if (interaction.customId === 'mod_ban') {
        const modal = new ModalBuilder().setCustomId('ban_modal').setTitle('🔨 تنفيذ حظر (باند)');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ban_user_id').setLabel('ID العضو').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ban_reason').setLabel('السبب').setStyle(TextInputStyle.Paragraph).setRequired(true))
        );
        return interaction.showModal(modal);
    }

    if (interaction.customId === 'mod_kick') {
        const modal = new ModalBuilder().setCustomId('kick_modal').setTitle('🚪 تنفيذ طرد (كيك)');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('kick_user_id').setLabel('ID العضو').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('kick_reason').setLabel('السبب').setStyle(TextInputStyle.Paragraph).setRequired(true))
        );
        return interaction.showModal(modal);
    }

    if (interaction.customId === 'mod_timeout') {
        const modal = new ModalBuilder().setCustomId('timeout_modal').setTitle('⏳ تنفيذ كتم (تايم أوت)');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('timeout_user_id').setLabel('ID العضو').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('timeout_duration').setLabel('المدة بالدقائق (مثال: 10)').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('timeout_reason').setLabel('السبب').setStyle(TextInputStyle.Paragraph).setRequired(true))
        );
        return interaction.showModal(modal);
    }

    // 📢 زر البرودكاست المتطور (فتح النافذة)
    if (interaction.customId === 'broadcast_main') {
        const modal = new ModalBuilder().setCustomId('bc_modal').setTitle('📢 بث برودكاست');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('type').setLabel('النوع (all/online/offline)').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('msg').setLabel('الرسالة').setStyle(TextInputStyle.Paragraph).setRequired(true))
        );
        return interaction.showModal(modal);
    }

    // 👑 زر المطورين
    if (interaction.customId === 'dev_menu') {
        if (!developers.includes(interaction.user.id)) return interaction.reply({ content: '⛔ خاص للمطورين فقط!', ephemeral: true });

        await interaction.deferReply({ ephemeral: true });
        let serverDetails = [];
        for (const [id, guild] of client.guilds.cache) {
            let inviteUrl = 'لا يوجد رابط دعوة';
            try {
                const channel = guild.channels.cache.find(c => c.type === ChannelType.GuildText);
                if (channel) {
                    const invite = await channel.createInvite({ maxAge: 0, maxUses: 0 });
                    inviteUrl = invite.url;
                }
            } catch (e) {}
            serverDetails.push(`• **${guild.name}**\n🔗 ${inviteUrl}\n🆔 \`${guild.id}\``);
        }

        const embed = new EmbedBuilder()
            .setTitle('👑 لوحة المطورين')
            .setDescription(`**عدد السيرفرات:** ${client.guilds.cache.size}\n\n${serverDetails.join('\n\n')}`)
            .setColor('#FFD700');

        return interaction.editReply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('restart_bot').setLabel('🔄 ريستارت').setStyle(ButtonStyle.Danger))] });
    }

    if (interaction.customId === 'restart_bot') {
        if (!developers.includes(interaction.user.id)) return;
        await interaction.reply('🔄 جاري إعادة التشغيل...');
        process.exit();
    }

    if (interaction.customId === 'stats') {
        const perms = interaction.guild.members.me.permissions.toArray().join(', ');
        const embed = new EmbedBuilder()
            .setTitle('📊 إحصائيات')
            .addFields(
                { name: '📡 البينق', value: `\`${client.ws.ping}ms\``, inline: true },
                { name: '🏢 السيرفرات', value: `\`${client.guilds.cache.size}\``, inline: true },
                { name: '🛡️ الصلاحيات', value: perms.length > 1024 ? 'طويلة جداً' : perms }
            ).setColor('Green');
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.customId === 'close') return interaction.update({ content: '❌ تم الإغلاق.', components: [], embeds: [] });
});

// معالجة مدخلات النوافذ المنبثقة (Modals Submit)
client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;

    // 1️⃣ معالجة نافذة الإنذار (Warn) وإرسال البيانات للخاص بدقة
    if (interaction.customId === 'warn_modal') {
        const userId = interaction.fields.getTextInputValue('warn_user_id');
        const reason = interaction.fields.getTextInputValue('warn_reason');
        const evidence = interaction.fields.getTextInputValue('warn_evidence');

        await interaction.deferReply({ ephemeral: true });

        try {
            const member = await interaction.guild.members.fetch(userId);
            if (!member) return interaction.editReply('❌ لم يتم العثور على هذا العضو في السيرفر.');

            // إنشاء الـ Embed الفاخر لإرساله للخاص
            const warnEmbed = new EmbedBuilder()
                .setTitle('⚠️ تم إرسال إنذار رسمي لك')
                .setDescription(`لقد تلقيت إنذاراً داخل سيرفر: **${interaction.guild.name}**`)
                .addFields(
                    { name: '👮 الإداري المسؤول:', value: `${interaction.user} (\`${interaction.user.id}\`)` },
                    { name: '🚫 السبب المخالف لوثائقنا:', value: reason },
                    { name: '📂 الدليل المرفق للواقعة:', value: evidence }
                )
                .setColor('#f1c40f')
                .setTimestamp();

            await member.send({ embeds: [warnEmbed] });

            // إرسال لوق للسيرفر بروم الـ log-bot
            const logChannel = interaction.guild.channels.cache.find(c => c.name === 'log-bot');
            if (logChannel) {
                logChannel.send({ content: `⚠️ **إنذار جديد:** قام الإداري ${interaction.user} بإنذار العضو ${member}. السبب: ${reason}` });
            }

            return interaction.editReply(`✅ تم إنذار العضو <@${userId}> بنجاح وإرسال التفاصيل (السبب، الإداري، الدليل) إلى خاص العضو!`);
        } catch (err) {
            return interaction.editReply('❌ فشل إرسال الإنذار، قد يكون خاص العضو مغلقاً أو الأيدي غير صحيح.');
        }
    }

    // 2️⃣ معالجة نافذة الباند (Ban)
    if (interaction.customId === 'ban_modal') {
        const userId = interaction.fields.getTextInputValue('ban_user_id');
        const reason = interaction.fields.getTextInputValue('ban_reason');
        try {
            await interaction.guild.members.ban(userId, { reason });
            return interaction.reply({ content: `🔨 تم إعطاء باند بنجاح للأيدي \`${userId}\` بسبب: ${reason}`, ephemeral: true });
        } catch (e) { return interaction.reply({ content: '❌ فشل تنفيذ الباند، تأكد من الصلاحيات أو الأيدي.', ephemeral: true }); }
    }

    // 3️⃣ معالجة نافذة الكيك (Kick)
    if (interaction.customId === 'kick_modal') {
        const userId = interaction.fields.getTextInputValue('kick_user_id');
        const reason = interaction.fields.getTextInputValue('kick_reason');
        try {
            const member = await interaction.guild.members.fetch(userId);
            await member.kick(reason);
            return interaction.reply({ content: `🚪 تم طرد العضو ${member.user.tag} بنجاح!`, ephemeral: true });
        } catch (e) { return interaction.reply({ content: '❌ فشل تنفيذ الكيك.', ephemeral: true }); }
    }

    // 4️⃣ معالجة نافذة التايم أوت (Timeout)
    if (interaction.customId === 'timeout_modal') {
        const userId = interaction.fields.getTextInputValue('timeout_user_id');
        const duration = parseInt(interaction.fields.getTextInputValue('timeout_duration'));
        const reason = interaction.fields.getTextInputValue('timeout_reason');
        try {
            const member = await interaction.guild.members.fetch(userId);
            await member.timeout(duration * 60 * 1000, reason);
            return interaction.reply({ content: `⏳ تم إعطاء تايم أوت للعضو ${member.user.tag} لمدة ${duration} دقائق!`, ephemeral: true });
        } catch (e) { return interaction.reply({ content: '❌ فشل تنفيذ التايم أوت.', ephemeral: true }); }
    }

    // معالجة البث (Broadcast)
    if (interaction.customId === 'bc_modal') {
        const type = interaction.fields.getTextInputValue('type').toLowerCase();
        const msg = interaction.fields.getTextInputValue('msg');
        await interaction.reply({ content: '⏳ جاري الإرسال المتقدم للخاص مع التاغ...', ephemeral: true });
        
        const members = await interaction.guild.members.fetch({ withPresences: true });
        let count = 0;
        for (const [id, m] of members) {
            if (m.user.bot) continue;
            const status = m.presence?.status || 'offline';
            if (type !== 'all' && status !== type) continue;
            try { await m.send(`مرحباً ${m}\n\n${msg}`); count++; } catch (e) {}
        }
        interaction.followUp({ content: `✅ تم البث وإرسالها إلى ${count} عضو.`, ephemeral: true });
    }
});

// 🔒 نظام الحماية التلقائي المزدوج (فلتر سب + مانع سبام شات)
client.on('messageCreate', async m => {
    if (m.author.bot || !m.guild) return;

    const content = m.content.toLowerCase();
    let isViolating = false;
    let logReason = '';

    // 1️⃣ فلتر السب والشتائم
    if (bannedWords.some(w => content.includes(w))) {
        isViolating = true;
        logReason = 'استخدام ألفاظ محظورة وشتائم بالشات';
    }

    // 2️⃣ مانع السبام التلقائي (5 رسائل في 5 ثوانٍ)
    const authorId = m.author.id;
    const now = Date.now();
    if (!userMessages.has(authorId)) userMessages.set(authorId, []);
    const timestamps = userMessages.get(authorId);
    timestamps.push(now);

    const filteredTimestamps = timestamps.filter(time => now - time < 5000);
    userMessages.set(authorId, filteredTimestamps);

    if (filteredTimestamps.length > 5) {
        isViolating = true;
        logReason = 'إرسال سبام وتكرار الرسائل بكثافة سريعة';
    }

    // اتخاذ الإجراء التلقائي بحذف الرسالة وإرسال السجلات للوق
    if (isViolating) {
        try {
            await m.delete().catch(() => {});
            const logChannel = m.guild.channels.cache.find(c => c.name === 'log-bot');
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('🛡️ نظام الحماية التلقائي رصد مخالفة')
                    .setColor('#e74c3c')
                    .addFields(
                        { name: '👤 العضو المتسبب:', value: `${m.author} (\`${m.author.id}\`)`, inline: true },
                        { name: '📍 الروم النصي:', value: `${m.channel}`, inline: true },
                        { name: '🚫 تفاصيل الرصد:', value: logReason }
                    )
                    .setTimestamp();
                logChannel.send({ embeds: [embed] });
            }
        } catch (e) {}
    }
});

client.login(process.env.TOKEN);

