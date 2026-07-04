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
        const embed = new EmbedBuilder().setTitle('🎛️ لوحة التحكم الإدارية المركزية - K3').setDescription('مرحباً بك في نظام الإدارة المركزية الكامل. يرجى اختيار القسم المطلوب للتحكم بالسيرفر.').setColor('#2b2d31').setTimestamp();
        await interaction.reply({ embeds: [embed], components: getMainPanelComponents(), ephemeral: true });
    }
});

// ========================================================
// 🖱️ 6. معالجة كافة الأزرار بالكامل (بدون قيود)
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
            return await interaction.update({ content: '❌ تم إغلاق اللوحة الإدارية.', embeds: [], components: [] });
        }

        // ================== القوائم الفرعية ==================
        if (interaction.customId === 'menu_broadcast') {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('bc_dm').setLabel('📨 رسالة للأعضاء (DM)').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('bc_channel').setLabel('📢 رسالة للشات (Channel)').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 رجوع').setStyle(ButtonStyle.Danger)
            );
            return await interaction.update({ embeds: [new EmbedBuilder().setTitle('📢 قسم البرودكاست العام').setDescription('أرسل رسائل جماعية إلى غرف السيرفر أو إلى خاص الأعضاء مباشرة.').setColor('#3498db')], components: [row] });
        }

        if (interaction.customId === 'menu_moderation') {
            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('mod_kick').setLabel('団 طرد (Kick)').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('mod_ban').setLabel('🔨 حظر (Ban)').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('mod_warn').setLabel('⚠️ تحذير (Warn)').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('mod_clear').setLabel('🗑 مسح الشات').setStyle(ButtonStyle.Primary)
            );
            const row2 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 رجوع').setStyle(ButtonStyle.Danger));
            return await interaction.update({ embeds: [new EmbedBuilder().setTitle('👮 الإشراف والعقوبات الإدارية').setDescription('إدارة المخالفين وتنظيف غرف المحادثات بكبسة زر.').setColor('#e74c3c')], components: [row1, row2] });
        }

        if (interaction.customId === 'menu_protection') {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('prot_spam').setLabel(antiSpamEnabled ? '🟢 Anti-Spam (شغال)' : '🔴 Anti-Spam (مغلق)').setStyle(antiSpamEnabled ? ButtonStyle.Success : ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('prot_words').setLabel(antiWordsEnabled ? '🟢 منع السب (شغال)' : '🔴 منع السب (مغلق)').setStyle(antiWordsEnabled ? ButtonStyle.Success : ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 رجوع').setStyle(ButtonStyle.Secondary)
            );
            return await interaction.update({ embeds: [new EmbedBuilder().setTitle('🛡️ نظام الحماية التلقائي الرقمي').setDescription('قم بتشغيل أو إيقاف أنظمة الحماية الذكية لحفظ أمن السيرفر.').setColor('#2ecc71')], components: [row] });
        }

        if (interaction.customId === 'menu_settings') {
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 رجوع').setStyle(ButtonStyle.Danger));
            return await interaction.update({ embeds: [new EmbedBuilder().setTitle('⚙️ الإعدادات العامة').setDescription('اللغة الحالية للنظام: العربية 🇸🇦\nالبريفكس المعتمد: Slash Commands (/)').setColor('#95a5a6')], components: [row] });
        }

        if (interaction.customId === 'menu_stats') {
            const uptime = Math.floor((Date.now() - botStartTime) / 1000);
            const embed = new EmbedBuilder().setTitle('📊 إحصائيات النظام الفنية').addFields(
                { name: '📡 البنق (Ping)', value: `\`${client.ws.ping}ms\``, inline: true },
                { name: '⏳ مدة التشغيل', value: `\`${uptime} ثانية\``, inline: true },
                { name: '👥 عدد الأعضاء الكلي', value: `\`${interaction.guild.memberCount}\``, inline: true }
            ).setColor('#2ecc71');
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 رجوع').setStyle(ButtonStyle.Danger));
            return await interaction.update({ embeds: [embed], components: [row] });
        }

        if (interaction.customId === 'menu_developer') {
            if (!isDeveloper) return await interaction.reply({ content: '⛔ هذا القسم مخصص للمطورين المعتمدين فقط!', ephemeral: true });
            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('dev_restart').setLabel('♻ إعادة تشغيل البوت').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('dev_console_logs').setLabel('📜 سجلات النظام (Logs)').setStyle(ButtonStyle.Primary)
            );
            const row2 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 رجوع').setStyle(ButtonStyle.Danger));
            return await interaction.update({ embeds: [new EmbedBuilder().setTitle('👑 وحدة تحكم المطورين والمهندسين').setDescription('أدوات متقدمة للتحكم في برمجيات الخادم وقراءة السجلات.').setColor('#f1c40f')], components: [row1, row2] });
        }

        if (interaction.customId === 'menu_ticket') {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('tkt_create').setLabel('🎫 فتح تذكرة دعم').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 رجوع').setStyle(ButtonStyle.Danger)
            );
            return await interaction.update({ embeds: [new EmbedBuilder().setTitle('🎫 نظام تذاكر الدعم الفني').setDescription('اضغط على الزر لإنشاء قناة مشفرة وخاصة للتحدث مع الإدارة مباشرة.').setColor('#1abc9c')], components: [row] });
        }

        if (interaction.customId === 'menu_utility') {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('util_server').setLabel('📋 معلومات السيرفر').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('back_to_main').setLabel('🔙 رجوع').setStyle(ButtonStyle.Danger)
            );
            return await interaction.update({ embeds: [new EmbedBuilder().setTitle('🔧 المرافق والبيانات العامة').setDescription('استخراج معلومات السيرفر والإحصائيات الهامة الحية.').setColor('#e67e22')], components: [row] });
        }

        // ================== العمليات المباشرة ==================
        if (interaction.customId === 'mod_clear') {
            await interaction.deferReply({ ephemeral: true });
            await interaction.channel.bulkDelete(100, true).catch(() => {});
            return await interaction.editReply('✅ **تم تنظيف الشات وحذف آخر 100 رسالة بنجاح تالٍ.**');
        }

        if (interaction.customId === 'dev_console_logs') {
            const logsText = globalConsoleLogs.length > 0 ? globalConsoleLogs.join('\n') : 'لا توجد سجلات حالياً في الذاكرة المؤقتة.';
            return await interaction.reply({ content: `\`\`\`txt\n${logsText.substring(0, 1900)}\n\`\`\``, ephemeral: true });
        }

        if (interaction.customId === 'dev_restart') {
            await interaction.reply({ content: '♻️ جاري إرسال إشارة إعادة التشغيل الكامل للنظام...', ephemeral: true });
            process.exit();
        }

        if (interaction.customId === 'prot_spam') {
            antiSpamEnabled = !antiSpamEnabled;
            return await interaction.reply({ content: `🛡️ حماية السبام الآن: **${antiSpamEnabled ? 'نشطة ومتصلة 🟢' : 'معطلة بالكامل 🔴'}**`, ephemeral: true });
        }

        if (interaction.customId === 'prot_words') {
            antiWordsEnabled = !antiWordsEnabled;
            return await interaction.reply({ content: `🚷 نظام منع الألفاظ البذيئة الآن: **${antiWordsEnabled ? 'شغال ونشط 🟢' : 'معطل 🔴'}**`, ephemeral: true });
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
            await channel.send(`مرحباً <@${interaction.user.id}>، لقد تم فتح تذكرتك بنجاح. يرجى كتابة مشكلتك هنا بانتظار الدعم الفني.`);
            return await interaction.editReply(`✅ **تم إنشاء الغرفة الخاصة بنجاح:** <#${channel.id}>`);
        }

        if (interaction.customId === 'util_server') {
            const embed = new EmbedBuilder()
                .setTitle(`📋 بيانات خادم: ${interaction.guild.name}`)
                .addFields(
                    { name: '👑 مالك السيرفر', value: `<@${interaction.guild.ownerId}>`, inline: true },
                    { name: '👥 الأعضاء الحاليين', value: `\`${interaction.guild.memberCount}\``, inline: true },
                    { name: '📅 تاريخ الإنشاء', value: `<t:${Math.floor(interaction.guild.createdTimestamp / 1000)}:R>`, inline: true }
                ).setColor('#3498db');
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ================== النوافذ المنبثقة (Modals) ==================
        if (interaction.customId === 'mod_ban') {
            const modal = new ModalBuilder().setCustomId('modal_ban').setTitle('🔨 تطبيق حظر (Ban)');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_id').setLabel('الرقم التعريفي للمستخدم (ID)').setStyle(TextInputStyle.Short).setRequired(true)));
            return await interaction.showModal(modal);
        }

        if (interaction.customId === 'mod_kick') {
            const modal = new ModalBuilder().setCustomId('modal_kick').setTitle('団 تطبيق طرد (Kick)');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_id').setLabel('الرقم التعريفي للمستخدم (ID)').setStyle(TextInputStyle.Short).setRequired(true)));
            return await interaction.showModal(modal);
        }

        if (interaction.customId === 'mod_warn') {
            const modal = new ModalBuilder().setCustomId('modal_warn').setTitle('⚠️ تسجيل تحذير رسمي');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_id').setLabel('أيدي العضو (ID)').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_reason').setLabel('سبب العقوبة والتحذير').setStyle(TextInputStyle.Paragraph).setRequired(true))
            );
            return await interaction.showModal(modal);
        }

        if (interaction.customId === 'bc_channel') {
            const modal = new ModalBuilder().setCustomId('modal_bc_channel').setTitle('📢 بث رسالة في الشات الحالي');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_msg').setLabel('محتوى الرسالة').setStyle(TextInputStyle.Paragraph).setRequired(true)));
            return await interaction.showModal(modal);
        }

        if (interaction.customId === 'bc_dm') {
            const modal = new ModalBuilder().setCustomId('modal_bc_dm').setTitle('📨 برودكاست حقيقي لجميع الأعضاء');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_msg').setLabel('محتوى رسالة الخاص الخاصة بالأعضاء').setStyle(TextInputStyle.Paragraph).setRequired(true)));
            return await interaction.showModal(modal);
        }

    } catch (err) {
        console.error("خطأ عام في الأزرار:", err);
    }
});

// ========================================================
// 📝 7. معالجة بيانات النوافذ المنبثقة وتنفيذها الفعلي الحقيقي
// ========================================================
client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;

    try {
        await interaction.deferReply({ ephemeral: true });

        if (interaction.customId === 'modal_ban') {
            const userId = interaction.fields.getTextInputValue('input_id');
            await interaction.guild.members.ban(userId).catch(() => {});
            return await interaction.editReply(`🔨 **تم طرد وحظر العضو صاحب الأيدي بنجاح تام:** \`${userId}\``);
        }

        if (interaction.customId === 'modal_kick') {
            const userId = interaction.fields.getTextInputValue('input_id');
            await interaction.guild.members.kick(userId).catch(() => {});
            return await interaction.editReply(`団 **تم طرد العضو صاحب الأيدي خارج السيرفر:** \`${userId}\``);
        }

        if (interaction.customId === 'modal_warn') {
            const userId = interaction.fields.getTextInputValue('input_id');
            const reason = interaction.fields.getTextInputValue('input_reason');
            const user = await client.users.fetch(userId).catch(()=>{});
            if(user) await user.send(`⚠️ **تنبيه إداري رسمي من سيرفر ${interaction.guild.name}:**\nالسبب المسجل: ${reason}`).catch(()=>{});
            return await interaction.editReply(`✅ **تم إرسال إشعار التحذير والسبب لحساب العضو بنجاح.**`);
        }

        if (interaction.customId === 'modal_bc_channel') {
            const msg = interaction.fields.getTextInputValue('input_msg');
            await interaction.channel.send(msg);
            return await interaction.editReply(`📢 **تم نشر البرودكاست داخل الشات الحالي.**`);
        }

        // 🔥 نظام البرودكاست الشامل الحقيقي لجميع الأعضاء بدون استثناء
        if (interaction.customId === 'modal_bc_dm') {
            const msg = interaction.fields.getTextInputValue('input_msg');
            await interaction.editReply('⏳ **جاري بدء عملية البث الجماهيري وإرسال البرودكاست لجميع أعضاء السيرفر... قد يستغرق هذا بعض الوقت.**');
            
            try {
                const members = await interaction.guild.members.fetch();
                let successCount = 0;
                let failedCount = 0;
                
                for (const [id, member] of members) {
                    if (member.user.bot) continue; // تخطي البوتات
                    try {
                        await member.send(`${msg}`);
                        successCount++;
                    } catch (e) {
                        failedCount++; // في حال حسابهم مغلق الخاص
                    }
                }
                return await interaction.editReply(`✅ **اكتملت عملية البرودكاست الشاملة بنجاح!**\n📥 تم الإرسال بنجاح إلى: \`${successCount}\` عضو.\n❌ فشل الإرسال إلى: \`${failedCount}\` عضو (بسبب إغلاقهم للرسائل الخاصة).`);
            } catch (error) {
                return await interaction.editReply('❌ حدث خطأ فني أثناء محاولة سحب قائمة الأعضاء.');
            }
        }

    } catch (err) {
        console.error("خطأ في النوافذ ومستنداتها:", err);
        await interaction.editReply('❌ فشلت العملية. يرجى التحقق من صحة المعرف (ID) والصلاحيات الممنوحة للبوت.').catch(()=>{});
    }
});

// ========================================================
// 🛡️ 8. نظام الحماية الذكي في الخلفية (السبام والكلمات البذيئة)
// ========================================================
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // 1. معالجة الكلمات الممنوعة
    if (antiWordsEnabled) {
        const hasBadWord = bannedWords.some(word => message.content.includes(word));
        if (hasBadWord) {
            await message.delete().catch(() => {});
            const warningMsg = await message.channel.send(`⚠️ يرجى الالتزام بالاحترام يا <@${message.author.id}>، الألفاظ البذيئة ممنوعة هنا!`);
            setTimeout(() => warningMsg.delete().catch(()=> {}), 5000);
            return;
        }
    }

    // 2. معالجة التكرار والسبام السريع
    if (antiSpamEnabled) {
        const userMsgCount = userMessages.get(message.author.id) || 0;
        userMessages.set(message.author.id, userMsgCount + 1);

        setTimeout(() => {
            const count = userMessages.get(message.author.id) || 0;
            if (count > 0) userMessages.set(message.author.id, count - 1);
        }, 5000);

        if (userMsgCount >= 4) {
            await message.delete().catch(() => {});
            const warningMsg = await message.channel.send(`🚫 التكرار السريع (السبام) ممنوع منعاً باتاً يا <@${message.author.id}>!`);
            setTimeout(() => warningMsg.delete().catch(()=> {}), 5000);
        }
    }
});

client.login(process.env.TOKEN);
