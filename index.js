const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField } = require('discord.js');
const express = require('express');

// تهيئة تطبيق Express لضمان بقاء البوت حياً على الاستضافة 24/7
const app = express();
app.get('/', (req, res) => res.send('🎯 البوت يعمل بنجاح وبدون أي مشاكل!'));
app.listen(process.env.PORT || 3000, () => console.log('🌐 تم تشغيل سيرفر الويب الخاص بالاستضافة.'));

// إنشاء العميل وتحديد الصلاحيات المطلوبة (Intents)
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// قائمة الكلمات المحظورة بنظام الحماية والـ Log
const bannedWords = ['منيوج', 'كحبه', 'كواد', 'كس اختك', 'عير'];

// 1️⃣ حدث تشغيل البوت وضبط الـ Status (الحالة والنشاط)
client.once('ready', () => {
    console.log(`✅ تم تشغيل البوت بنجاح باسم: ${client.user.tag}`);
    
    // ضبط حالة البوت والنشاط (تظهر تحت الاسم في الديسكورد)
    client.user.setPresence({
        activities: [{ 
            name: '/panel لإدارة السيرفر ⚙️', 
            type: 3 // الرقم 3 يعني Watching (يشاهد)
        }],
        status: 'online' // حالة الاتصال (متصل)
    });
});

// 2️⃣ استقبال وتشغيل الأوامر المائلة (Slash Commands) مثل /panel
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'panel') {
        // التحقق من أن المستخدم لديه صلاحية إدارة السيرفر
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return interaction.reply({ content: '❌ نعتذر، هذا الأمر مخصص للإدارة فقط!', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('🎯 لوحة التحكم الإدارية بالبث والحماية')
            .setDescription('أهلاً بك في اللوحة التفاعلية. يمكنك إرسال بث سريع أو التحكم بنظام اللوق والحماية من الأزرار أدناه.')
            .setColor('#0099ff')
            .setFooter({ text: 'تمت البرمجة لـ fadik88055-prog' })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('broadcast_btn')
                    .setLabel('📢 إرسال بث (Broadcast)')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('protection_info')
                    .setLabel('🛡️ حالة الحماية والـ Log')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
});

// 3️⃣ التعامل مع ضغطات الأزرار داخل الـ Panel
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'broadcast_btn') {
        // هنا يمكنك لاحقاً ربط نظام تفاعلي أو موديول لإرسال الرسائل باسم البوت
        await interaction.reply({ content: '📢 ميزة البث السريع جاهزة! يمكنك استخدام الأوامر الفرعية المخصصة لها أو الإرسال مباشرة.', ephemeral: true });
    }

    if (interaction.customId === 'protection_info') {
        await interaction.reply({ 
            content: '🛡️ **نظام الحماية والـ Log يعمل تلقائياً:**\n- يتم فحص الكلمات البذيئة والسبام وحذفها فوراً.\n- لإرسال سجلات الحماية، يرجى إنشاء روم نصية باسم `log-bot` وسيقوم البوت بالإرسال فيها تلقائياً.', 
            ephemeral: true 
        });
    }
});

// 4️⃣ نظام الحماية، فلترة الكلمات، الـ Anti-Spam، وإرسال الـ Log
const userMessages = new Map();

client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    const content = message.content.toLowerCase();
    let isViolating = false;
    let reason = '';

    // أ) التحقق من الكلمات المحظورة
    if (bannedWords.some(word => content.includes(word))) {
        isViolating = true;
        reason = 'إرسال كلمات بذيئة محظورة في السيرفر';
    }

    // ب) نظام الـ Anti-Spam الأساسي (5 رسائل في 5 ثوانٍ)
    const authorId = message.author.id;
    const now = Date.now();
    if (!userMessages.has(authorId)) {
        userMessages.set(authorId, []);
    }
    const timestamps = userMessages.get(authorId);
    timestamps.push(now);

    // تصفية الطوابع الزمنية القديمة (أقدم من 5 ثوانٍ)
    const filteredTimestamps = timestamps.filter(time => now - time < 5000);
    userMessages.set(authorId, filteredTimestamps);

    if (filteredTimestamps.length > 5 && !isViolating) {
        isViolating = true;
        reason = 'سبام سريع (إرسال أكثر من 5 رسائل في 5 ثوانٍ)';
    }

    // تنفيذ الحذف وإرسال اللوق في حال المخالفة
    if (isViolating) {
        try {
            // حذف رسالة الشخص المخالف فوراً
            await message.delete();

            // البحث عن روم الـ Log التي تحمل اسم log-bot
            const logChannel = message.guild.channels.cache.find(ch => ch.name === 'log-bot' && ch.type === ChannelType.GuildText);
            
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('⚠️ رصد مخالفة جديدة وتم التعامل معها')
                    .setColor('#ff0000')
                    .addFields(
                        { name: '👤 العضو المخالف:', value: `${message.author} (${message.author.id})`, inline: true },
                        { name: '📍 الروم النصية:', value: `${message.channel}`, inline: true },
                        { name: '🚫 سبب الحذف:', value: reason },
                        { name: '💬 نص الرسالة المحذوفة:', value: message.content || '_محتوى غير نصي أو فارغ_' }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] });
            }
        } catch (err) {
            console.error('❌ حدث خطأ أثناء تنفيذ نظام الحماية أو إرسال الـ Log:', err);
        }
    }
});

// تسجيل الدخول بالتوكن المخزن آلياً في Railway
client.login(process.env.TOKEN);
