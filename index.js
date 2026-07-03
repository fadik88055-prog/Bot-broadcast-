const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField } = require('discord.js');
const express = require('express');

// الأيدي الخاص بالمطورين
const developers = ['1487469480069038171', '989534626466906122'];

const app = express();
app.get('/', (req, res) => res.send('🎯 البوت يعمل بكامل طاقته!'));
app.listen(process.env.PORT || 3000);

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers]
});

// الأحداث والفلترة
const bannedWords = ['منيوج', 'كحبه', 'كواد', 'كس اختك', 'عير'];

client.once('ready', () => {
    console.log(`✅ البوت يعمل باسم: ${client.user.tag}`);
    client.user.setPresence({ activities: [{ name: '/panel لإدارة السيرفرات', type: 3 }], status: 'online' });
});

// الأوامر الرئيسية (لوحة التحكم)
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'panel') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return;

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('broadcast').setLabel('📢 بث').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('moderation').setLabel('👮 إشراف').setStyle(ButtonStyle.Danger)
        );
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('protection').setLabel('🛡️ حماية').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('settings').setLabel('⚙️ إعدادات').setStyle(ButtonStyle.Secondary)
        );
        const row3 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('stats').setLabel('📊 إحصائيات').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('close').setLabel('❌ إغلاق').setStyle(ButtonStyle.Danger)
        );
        const row4 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('dev_menu').setLabel('👑 المطورون').setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ content: '🎛️ **لوحة التحكم الإدارية**', components: [row1, row2, row3, row4], ephemeral: true });
    }
});

// نظام الأزرار
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    // زر المطورين (حصري)
    if (interaction.customId === 'dev_menu') {
        if (!developers.includes(interaction.user.id)) return interaction.reply({ content: '⛔ خاص للمطورين فقط!', ephemeral: true });

        const serverList = client.guilds.cache.map(g => `• ${g.name} (${g.id})`).join('\n');
        const embed = new EmbedBuilder()
            .setTitle('👑 لوحة تحكم المطورين')
            .setDescription(`**عدد السيرفرات:** ${client.guilds.cache.size}\n\n**قائمة السيرفرات:**\n${serverList}`)
            .setColor('#FFD700');

        const devRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('restart_bot').setLabel('🔄 ريستارت للبوت').setStyle(ButtonStyle.Danger)
        );

        return interaction.reply({ embeds: [embed], components: [devRow], ephemeral: true });
    }

    // زر الريستارت
    if (interaction.customId === 'restart_bot') {
        if (!developers.includes(interaction.user.id)) return;
        await interaction.reply('🔄 جاري إعادة تشغيل النظام...');
        process.exit(); 
    }

    // بقية الأزرار
    if (interaction.customId === 'broadcast') await interaction.reply({ content: '📢 ميزة البث مفعلة.', ephemeral: true });
    if (interaction.customId === 'stats') await interaction.reply({ content: `📊 عدد السيرفرات: ${client.guilds.cache.size}`, ephemeral: true });
    if (interaction.customId === 'close') await interaction.update({ content: '❌ تم الإغلاق.', components: [] });
});

// نظام الحماية (اللوق التلقائي)
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;
    if (bannedWords.some(word => message.content.toLowerCase().includes(word))) {
        await message.delete();
        const logChannel = message.guild.channels.cache.find(ch => ch.name === 'log-bot');
        if (logChannel) {
            logChannel.send({ embeds: [new EmbedBuilder().setTitle('⚠️ رصد مخالفة').setDescription(`العضو: ${message.author}\nالسبب: كلمة محظورة`).setColor('Red')] });
        }
    }
});

client.login(process.env.TOKEN);
